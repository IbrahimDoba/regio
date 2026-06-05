import uuid
from typing import List, Optional

import sqlalchemy as sa
from fastapi import UploadFile
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlmodel import col, desc, func, or_, select

from app.core.config import settings
from app.core.file_storage import LocalStorageService
from app.listings.enums import (
    D_CLASS_MAX_KM,
    DClass,
    ListingCategory,
    ListingStatus,
)
from app.listings.exceptions import (
    ListingNotFound,
    ListingNotOwned,
    MediaLimitExceeded,
)
from app.listings.models import Listing, PostVisibility, Tag, ZipDistance
from app.listings.schemas import (
    FeedResponse,
    ListingCreate,
    ListingPublic,
    ListingUpdate,
    TagPublic,
)
from app.users.models import User

_MEDIA_PREFIX = "/media/"


def _ensure_url(key_or_url: str) -> str:
    """Convert a raw R2 object key to a full backend media proxy URL."""
    if key_or_url.startswith("http"):
        return key_or_url
    return f"{settings.BACKEND_URL}{_MEDIA_PREFIX}{key_or_url}"


def _extract_key(url_or_key: str) -> str:
    """Strip the backend media proxy prefix to get the raw R2 object key."""
    prefix = f"{settings.BACKEND_URL}{_MEDIA_PREFIX}"
    if url_or_key.startswith(prefix):
        return url_or_key[len(prefix) :]
    return url_or_key


ALLOWED_MEDIA_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "application/pdf",
}
MAX_FILES_PER_LISTING = 5


def _localize(listing: Listing, lang: str) -> tuple[str, str]:
    """Pick the best title and description for the given language, falling back to original."""
    lang = lang.lower()
    title = getattr(listing, f"title_{lang}", None) or listing.title_original
    description = (
        getattr(listing, f"description_{lang}", None)
        or listing.description_original
    )
    return title, description


class ListingService:
    def __init__(self, session: AsyncSession):
        self.session = session

    # --------------------------------------------------------
    # TAGS
    # --------------------------------------------------------

    async def search_tags(
        self, query: str, lang: str = "en"
    ) -> List[TagPublic]:
        """Autocomplete for tags, searching the localized name column for the given lang."""
        lang = lang.lower()
        lang_col = {
            "de": Tag.name_de,
            "hu": Tag.name_hu,
        }.get(lang, Tag.name_en)

        pattern = f"%{query}%"
        statement = (
            select(Tag)
            .where(
                or_(
                    col(Tag.name).ilike(pattern),
                    col(lang_col).ilike(pattern),
                )
            )
            .limit(10)
        )
        results = await self.session.execute(statement)
        tags = results.scalars().all()

        return [
            TagPublic(
                id=tag.id,
                name=getattr(tag, f"name_{lang}", None) or tag.name,
                is_official=tag.is_official,
            )
            for tag in tags
        ]

    async def _process_tags(self, raw_tags: List[str]) -> List[str]:
        """Validates tags. Reuses existing or creates them as suggestions."""
        cleaned_tags = [t.lower().strip() for t in raw_tags if t.strip()]
        if not cleaned_tags:
            return []

        stmt = select(Tag).where(col(Tag.name).in_(cleaned_tags))
        res = await self.session.execute(stmt)
        existing = {tag.name for tag in res.scalars().all()}

        for tag_name in cleaned_tags:
            if tag_name not in existing:
                self.session.add(Tag(name=tag_name, is_official=False))

        return cleaned_tags

    # --------------------------------------------------------
    # POST VISIBILITY (ZIP-code pre-computation)
    # --------------------------------------------------------

    async def _populate_post_visibilities(
        self, listing_id: uuid.UUID, zip_code: str, d_class: DClass
    ) -> None:
        """
        Pre-compute which viewer ZIPs can see this listing and insert into
        post_visibilities. Called after a listing is created or its zip/d_class changes.

        D5/D6 listings skip this — they are always shown to everyone.
        """
        if d_class in (DClass.D5, DClass.D6) or not zip_code:
            return

        max_km = D_CLASS_MAX_KM[d_class]

        if max_km == 0:
            # D1: direct neighborhood — same ZIP only
            self.session.add(
                PostVisibility(post_id=listing_id, viewer_zip=zip_code)
            )
        else:
            # D2–D4: all ZIPs within max_km, plus own ZIP as fallback
            stmt = select(ZipDistance.zip_to).where(
                ZipDistance.zip_from == zip_code,
                ZipDistance.distance_km <= max_km,
            )
            results = await self.session.execute(stmt)
            target_zips: set[str] = {row[0] for row in results}
            target_zips.add(zip_code)  # Always include own ZIP

            for z in target_zips:
                self.session.add(
                    PostVisibility(post_id=listing_id, viewer_zip=z)
                )

        await self.session.commit()

    async def _cleanup_post_visibilities(self, listing_id: uuid.UUID) -> None:
        """Remove all post_visibilities rows for a listing (before re-populating)."""
        stmt = sa.delete(PostVisibility).where(
            PostVisibility.post_id == listing_id
        )
        await self.session.execute(stmt)

    # --------------------------------------------------------
    # LISTINGS CRUD
    # --------------------------------------------------------

    async def create_listing(self, user: User, data: ListingCreate) -> Listing:
        final_tags = await self._process_tags(data.tags)

        listing = Listing(
            owner_id=user.id,
            category=data.category,
            title_original=data.title,
            description_original=data.description,
            payment_notes=data.payment_notes,
            media_urls=data.media_urls,
            tags=final_tags,
            zip_code=data.zip_code,
            d_class=data.d_class.value if data.d_class else DClass.D5.value,
            available_until=data.available_until,
            attributes=data.attributes.model_dump(
                mode="json", exclude_none=True
            ),
        )

        self.session.add(listing)
        await self.session.commit()
        await self.session.refresh(listing)

        # Populate visibility table for local listings (D1–D4)
        if listing.zip_code and listing.d_class:
            await self._populate_post_visibilities(
                listing.id, listing.zip_code, DClass(listing.d_class)
            )

        return listing

    async def format_listing(
        self, listing: Listing, user_lang: str = "en"
    ) -> ListingPublic:
        """Format a DB Listing (with eager-loaded owner) into ListingPublic."""
        title, description = _localize(listing, user_lang)

        return ListingPublic(
            id=listing.id,
            owner_code=listing.owner.user_code,
            owner_name=listing.owner.full_name,
            owner_avatar=listing.owner.avatar_url,
            category=listing.category,
            status=listing.status,
            title=title,
            description=description,
            payment_notes=listing.payment_notes,
            media_urls=[_ensure_url(k) for k in (listing.media_urls or [])],
            tags=listing.tags,
            zip_code=listing.zip_code,
            d_class=listing.d_class,
            owner_zip_code=listing.owner.zip_code,
            owner_city=listing.owner.city,
            available_until=listing.available_until,
            attributes=listing.attributes,
            created_at=listing.created_at,
        )

    async def get_listing(self, listing_id: uuid.UUID) -> Listing:
        query = (
            select(Listing)
            .where(Listing.id == listing_id)
            .options(selectinload(Listing.owner))
        )
        results = await self.session.execute(query)
        listing = results.scalar_one_or_none()
        if not listing:
            raise ListingNotFound()
        return listing

    async def update_listing(
        self,
        listing_id: uuid.UUID,
        user: User,
        update_data: ListingUpdate,
        storage: Optional[LocalStorageService] = None,
    ) -> Listing:
        listing = await self.get_listing(listing_id)
        if not (listing.owner.id == user.id or user.is_system_admin):
            raise ListingNotOwned()

        data = update_data.model_dump(exclude_unset=True)

        # Track if visibility needs to be rebuilt
        visibility_changed = "zip_code" in data or "d_class" in data

        if "tags" in data:
            data["tags"] = await self._process_tags(data["tags"])
        if "title" in data:
            data["title_original"] = data.pop("title")
        if "description" in data:
            data["description_original"] = data.pop("description")
        if "media_urls" in data and storage:
            await self._cleanup_removed_media(
                listing.media_urls or [], data["media_urls"] or [], storage
            )
        # Coerce DClass enum to string for storage
        if "d_class" in data and data["d_class"] is not None:
            data["d_class"] = DClass(data["d_class"]).value

        if visibility_changed:
            await self._cleanup_post_visibilities(listing_id)

        listing.sqlmodel_update(data)
        self.session.add(listing)
        await self.session.commit()
        await self.session.refresh(listing)

        # Re-populate post_visibilities after commit (new data is available)
        if visibility_changed and listing.zip_code and listing.d_class:
            await self._populate_post_visibilities(
                listing.id, listing.zip_code, DClass(listing.d_class)
            )

        return listing

    async def upload_media(
        self,
        listing_id: uuid.UUID,
        user: User,
        files: List[UploadFile],
        storage: LocalStorageService,
    ) -> Listing:
        """Upload files to R2 and append keys to listing.media_urls."""
        listing = await self.get_listing(listing_id)

        if not (listing.owner.id == user.id or user.is_system_admin):
            raise ListingNotOwned()

        current_count = len(listing.media_urls or [])
        if current_count + len(files) > MAX_FILES_PER_LISTING:
            raise MediaLimitExceeded(
                f"A listing can have at most {MAX_FILES_PER_LISTING} files. "
                f"Currently has {current_count}, tried to add {len(files)}."
            )

        new_keys = []
        for file in files:
            if file.content_type not in ALLOWED_MEDIA_TYPES:
                raise MediaLimitExceeded(
                    f"File type '{file.content_type}' is not allowed. "
                    f"Accepted: {', '.join(ALLOWED_MEDIA_TYPES)}"
                )
            key = await storage.upload(file, folder=f"listings/{listing_id}")
            new_keys.append(key)

        listing.media_urls = (listing.media_urls or []) + new_keys
        self.session.add(listing)
        await self.session.commit()
        await self.session.refresh(listing)

        return listing

    async def _cleanup_removed_media(
        self,
        old_urls: List[str],
        new_urls: List[str],
        storage: LocalStorageService,
    ) -> None:
        removed = set(old_urls) - set(new_urls)
        for key in removed:
            await storage.delete(_extract_key(key))

    async def delete_listing(
        self, listing_id: uuid.UUID, current_user: User
    ) -> None:
        listing = await self.session.get(Listing, listing_id)
        if not listing:
            raise ListingNotFound()
        if not (
            current_user.id == listing.owner_id or current_user.is_system_admin
        ):
            raise ListingNotOwned()

        # post_visibilities rows are cascade-deleted via FK ondelete="CASCADE"
        await self.session.delete(listing)
        await self.session.commit()

    # --------------------------------------------------------
    # FEED
    # --------------------------------------------------------

    async def get_feed(
        self,
        categories: Optional[List[ListingCategory]] = None,
        search_query: Optional[str] = None,
        tags: Optional[List[str]] = None,
        viewer_zip: Optional[str] = None,
        max_distance_km: Optional[int] = None,
        limit: int = 20,
        offset: int = 0,
        user_lang: str = "en",
    ) -> FeedResponse:
        """
        Main feed query.

        Visibility logic (matches client spec):
            - If viewer_zip is known:
                SELECT listings WHERE d_class IN ('D5','D6')
                    OR d_class IS NULL          -- legacy listings without a class
                    OR pv.viewer_zip = :viewer_zip
                (with optional max_distance_km filter on D1–D4 using zip_distances)
            - If viewer_zip is not known: show all ACTIVE listings (backward compat)
        """
        if viewer_zip:
            if max_distance_km is not None:
                # Join zip_distances to apply an additional viewer-side distance cap
                # D5/D6 listings bypass this cap.
                query = (
                    select(Listing, ZipDistance.distance_km.label("dist"))
                    .outerjoin(
                        PostVisibility,
                        sa.and_(
                            PostVisibility.post_id == Listing.id,
                            PostVisibility.viewer_zip == viewer_zip,
                        ),
                    )
                    .outerjoin(
                        ZipDistance,
                        sa.and_(
                            ZipDistance.zip_from == viewer_zip,
                            ZipDistance.zip_to == Listing.zip_code,
                        ),
                    )
                    .where(Listing.status == ListingStatus.ACTIVE)
                    .where(
                        or_(
                            col(Listing.d_class).in_(["D5", "D6"]),
                            Listing.d_class == None,  # noqa: E711 — legacy rows
                            sa.and_(
                                PostVisibility.viewer_zip == viewer_zip,
                                or_(
                                    ZipDistance.distance_km <= max_distance_km,
                                    ZipDistance.distance_km
                                    == None,  # same-ZIP rows  # noqa: E711
                                ),
                            ),
                        )
                    )
                    .distinct(Listing.created_at, Listing.id)
                )
            else:
                # Basic ZIP-based visibility (client's exact SQL pattern)
                query = (
                    select(Listing, ZipDistance.distance_km.label("dist"))
                    .outerjoin(
                        PostVisibility, PostVisibility.post_id == Listing.id
                    )
                    .outerjoin(
                        ZipDistance,
                        sa.and_(
                            ZipDistance.zip_from == viewer_zip,
                            ZipDistance.zip_to == Listing.zip_code,
                        ),
                    )
                    .where(Listing.status == ListingStatus.ACTIVE)
                    .where(
                        or_(
                            col(Listing.d_class).in_(["D5", "D6"]),
                            Listing.d_class == None,  # noqa: E711 — legacy rows
                            PostVisibility.viewer_zip == viewer_zip,
                        )
                    )
                    .distinct(Listing.created_at, Listing.id)
                )
        else:
            # No homebase ZIP — show all active listings (backward-compatible)
            query = select(Listing).where(
                Listing.status == ListingStatus.ACTIVE
            )

        # Category filter
        if categories:
            query = query.where(col(Listing.category).in_(categories))

        # Tag filter (JSONB containment)
        if tags:
            for tag in tags:
                query = query.where(func.jsonb_exists(Listing.tags, tag))

        # Full-text search (ILIKE across original + all translations)
        if search_query:
            pattern = f"%{search_query}%"
            query = query.where(
                or_(
                    col(Listing.title_original).ilike(pattern),
                    col(Listing.description_original).ilike(pattern),
                    col(Listing.title_en).ilike(pattern),
                    col(Listing.title_de).ilike(pattern),
                    col(Listing.title_hu).ilike(pattern),
                    col(Listing.description_en).ilike(pattern),
                    col(Listing.description_de).ilike(pattern),
                    col(Listing.description_hu).ilike(pattern),
                )
            )

        query = (
            query.order_by(desc(Listing.created_at), Listing.id)
            .offset(offset)
            .limit(limit)
            .options(selectinload(Listing.owner))
        )

        results = await self.session.execute(query)
        rows = results.all() if viewer_zip else results.scalars().all()

        feed_items = []
        for row in rows:
            if viewer_zip:
                listing, dist_km = row[0], row[1]
            else:
                listing, dist_km = row, None
            title, description = _localize(listing, user_lang)
            feed_items.append(
                ListingPublic(
                    id=listing.id,
                    owner_code=listing.owner.user_code,
                    owner_name=listing.owner.full_name,
                    owner_avatar=listing.owner.avatar_url,
                    category=listing.category,
                    status=listing.status,
                    title=title,
                    description=description,
                    payment_notes=listing.payment_notes,
                    media_urls=[
                        _ensure_url(k) for k in (listing.media_urls or [])
                    ],
                    tags=listing.tags,
                    zip_code=listing.zip_code,
                    d_class=listing.d_class,
                    owner_zip_code=listing.owner.zip_code,
                    owner_city=listing.owner.city,
                    distance_km=dist_km,
                    available_until=listing.available_until,
                    attributes=listing.attributes,
                    created_at=listing.created_at,
                )
            )

        next_cursor = offset + limit if len(rows) == limit else None
        return FeedResponse(data=feed_items, next_cursor=next_cursor)
