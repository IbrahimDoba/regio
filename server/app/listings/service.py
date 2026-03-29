import uuid
from typing import List, Optional

from fastapi import UploadFile
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlmodel import col, desc, func, or_, select

from app.core.r2 import StorageService
from app.listings.enums import ListingCategory, ListingStatus
from app.listings.exceptions import (
    ListingNotFound,
    ListingNotOwned,
    MediaLimitExceeded,
)
from app.listings.models import Listing, Tag
from app.listings.schemas import (
    FeedResponse,
    ListingCreate,
    ListingPublic,
    ListingUpdate,
)
from app.users.models import User

ALLOWED_MEDIA_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "application/pdf",
}
MAX_FILE_SIZE_MB = 1
MAX_FILES_PER_LISTING = 5


class ListingService:
    def __init__(self, session: AsyncSession):
        self.session = session

    """TAGS"""

    async def search_tags(self, query: str) -> List[Tag]:
        """Autocomplete for tags"""
        statement = (
            select(Tag).where(col(Tag.name).ilike(f"%{query}%")).limit(10)
        )
        results = await self.session.execute(statement)
        return results.scalars().all()

    async def _process_tags(self, raw_tags: List[str]) -> List[str]:
        """
        Validates tag.
        If a tag exists, use it.
        If it doesn't exist, create it as 'is_official=False' (User Suggestion).
        """
        cleaned_tags = [t.lower().strip() for t in raw_tags if t.strip()]
        if not cleaned_tags:
            return []

        final_tags = []
        for tag_name in cleaned_tags:
            # Check existence
            stmt = select(Tag).where(Tag.name == tag_name)
            res = await self.session.execute(stmt)
            tag_obj = res.scalar_one_or_none()

            if not tag_obj:
                # Create Suggestion
                tag_obj = Tag(name=tag_name, is_official=False)
                self.session.add(tag_obj)
                # We save it to DB so next user sees it in autocomplete immediately
                # Admin can clean up later
            final_tags.append(tag_obj.name)

        return final_tags

    """LISTINGS"""

    async def create_listing(self, user: User, data: ListingCreate) -> Listing:
        # Process Tags
        final_tags = await self._process_tags(data.tags)

        # Create listing — translations are handled async via BackgroundTasks
        listing = Listing(
            owner_id=user.id,
            category=data.category,
            title_original=data.title,
            description_original=data.description,
            payment_notes=data.payment_notes,
            media_urls=data.media_urls,
            tags=final_tags,
            radius_km=data.radius_km,
            location_lat=data.location_lat,
            location_lng=data.location_lng,
            attributes=data.attributes.model_dump(exclude_none=True),
        )

        self.session.add(listing)
        await self.session.commit()
        await self.session.refresh(listing)

        return listing

    async def format_listing(self, listing: Listing) -> ListingPublic:
        """
        Format DB listing object lazy loaded with owner to ListingPublic format.
        """
        return ListingPublic(
            id=listing.id,
            owner_code=listing.owner.user_code,
            owner_name=listing.owner.full_name,
            category=listing.category,
            status=listing.status,
            title=listing.title_original,
            description=listing.description_original,
            payment_notes=listing.payment_notes,
            media_urls=listing.media_urls,
            tags=listing.tags,
            radius_km=listing.radius_km,
            location_lat=listing.location_lat,
            location_lng=listing.location_lng,
            attributes=listing.attributes,
            created_at=listing.created_at,
        )

    async def get_listing(self, listing_id: uuid.UUID) -> Listing:
        # Form query for getting listing
        query = (
            select(Listing)
            .where(Listing.id == listing_id)
            .options(selectinload(Listing.owner))
        )

        # Execute query and raise appropriate error if listing is not found
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
        storage: Optional[StorageService] = None,
    ) -> Listing:
        listing = await self.get_listing(listing_id)
        if not listing:
            raise ListingNotFound()

        if not (listing.owner.id == user.id or user.is_system_admin):
            raise ListingNotOwned()

        # Update allowed fields
        data = update_data.model_dump(exclude_unset=True)

        # Handle tags specifically if present
        if "tags" in data:
            data["tags"] = await self._process_tags(data["tags"])

        # Handle title/desc changes -> Re-translate?
        # For Phase 1 MVP, we might skip re-translation on edit to save API costs/complexity
        # or just update the original. Let's update originals.
        if "title" in data:
            data["title_original"] = data.pop("title")
        if "description" in data:
            data["description_original"] = data.pop("description")

        # Clean up removed media from S3
        if "media_urls" in data and storage:
            old_urls = listing.media_urls or []
            new_urls = data["media_urls"] or []
            await self._cleanup_removed_media(old_urls, new_urls, storage)

        listing.sqlmodel_update(data)

        self.session.add(listing)
        await self.session.commit()
        await self.session.refresh(listing)

        return listing

    async def upload_media(
        self,
        listing_id: uuid.UUID,
        user: User,
        files: List[UploadFile],
        storage: StorageService,
    ) -> Listing:
        """Upload files to S3 and append keys to listing.media_urls."""
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

            size = await file.read()
            if len(size) > MAX_FILE_SIZE_MB * 1024 * 1024:
                raise MediaLimitExceeded(
                    f"File '{file.filename}' exceeds the {MAX_FILE_SIZE_MB}MB limit."
                )
            await file.seek(0)

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
        storage: StorageService,
    ) -> None:
        """Delete S3 objects for media URLs that were removed from a listing."""
        removed = set(old_urls) - set(new_urls)
        for key in removed:
            await storage.delete(key)

    async def delete_listing(
        self, listing_id: uuid.UUID, current_user: User
    ) -> None:
        # Get listing
        listing = await self.session.get(Listing, listing_id)
        if not listing:
            raise ListingNotFound()

        # Prevent non-owner from deleting listing, allow system admins
        if not (
            current_user.id == listing.owner_id or current_user.is_system_admin
        ):
            raise ListingNotOwned()

        await self.session.delete(listing)
        await self.session.commit()

    async def get_feed(
        self,
        categories: Optional[List[ListingCategory]] = None,
        search_query: Optional[str] = None,
        tags: Optional[List[str]] = None,
        limit: int = 20,
        offset: int = 0,
        user_lang: str = "en",
    ) -> FeedResponse:
        query = select(Listing).where(Listing.status == ListingStatus.ACTIVE)

        # Category Filter
        if categories:
            query = query.where(col(Listing.category).in_(categories))

        # Tag Filter (JSONB Containment)
        if tags:
            # Postgres JSONB "contains" operator @>
            # In SQLAlchemy/SQLModel this can be tricky.
            # Using simple python check for MVP or specific dialect func
            for tag in tags:
                query = query.where(func.jsonb_exists(Listing.tags, tag))

        # Text Search (Basic ILIKE for MVP)
        if search_query:
            search_pattern = f"%{search_query}%"
            query = query.where(
                or_(
                    col(Listing.title_original).ilike(search_pattern),
                    col(Listing.description_original).ilike(search_pattern),
                    # Also search translated fields?
                    col(Listing.title_en).ilike(search_pattern),
                )
            )

        # Order and Pagination
        query = (
            query.order_by(desc(Listing.created_at))
            .offset(offset)
            .limit(limit)
        )

        # Join Owner for Display Info
        # We need eager loading to get owner name
        query = query.options(selectinload(Listing.owner))

        results = await self.session.execute(query)
        listings = results.scalars().all()

        # Transform for Display (Language Logic)
        feed_items = []
        for listing in listings:
            # Pick correct language
            if user_lang == "de":
                title = listing.title_de or listing.title_original
            elif user_lang == "hu":
                title = listing.title_hu or listing.title_original
            else:
                title = listing.title_en or listing.title_original

            feed_items.append(
                {
                    "id": listing.id,
                    "owner_code": listing.owner.user_code,
                    "owner_name": listing.owner.full_name,
                    "owner_avatar": listing.owner.avatar_url,
                    "category": listing.category,
                    "status": listing.status,
                    "title": title,
                    "description": listing.description_original,  # TODO: Localize desc
                    "payment_notes": listing.payment_notes,
                    "media_urls": listing.media_urls,
                    "tags": listing.tags,
                    "radius_km": listing.radius_km,
                    "location_lat": listing.location_lat,
                    "location_lng": listing.location_lng,
                    "attributes": listing.attributes,
                    "created_at": listing.created_at,
                }
            )

        return FeedResponse(data=feed_items)
