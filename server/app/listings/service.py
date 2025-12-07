import uuid
from typing import List, Optional
from sqlalchemy.orm import selectinload
from sqlmodel import select, or_, func, desc, col
from sqlalchemy.ext.asyncio import AsyncSession

from app.listings.models import Listing, Tag
from app.listings.schemas import ListingCreate, ListingPublic, ListingUpdate, FeedResponse
from app.listings.enums import ListingCategory, ListingStatus
from app.users.models import User
from app.listings.exceptions import ListingNotFound, ListingNotOwned
from app.listings.utils import translate_text

class ListingService:
    def __init__(self, session: AsyncSession):
        self.session = session

    """TAGS"""
    async def search_tags(self, query: str) -> List[Tag]:
        """Autocomplete for tags"""
        statement = select(Tag).where(col(Tag.name).ilike(f"%{query}%")).limit(10)
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
        
        # Trigger Translation (Mocked Async)
        # In real app, maybe background task
        t_en = await translate_text(data.title, "en")
        t_de = await translate_text(data.title, "de")
        t_hu = await translate_text(data.title, "hu")
        
        d_en = await translate_text(data.description, "en")
        d_de = await translate_text(data.description, "de")
        d_hu = await translate_text(data.description, "hu")
        
        # Create Object
        listing = Listing(
            owner_id=user.id,
            category=data.category,
            title_original=data.title,
            description_original=data.description,

            title_en=t_en, title_de=t_de, title_hu=t_hu,
            description_en=d_en, description_de=d_de, description_hu=d_hu,

            media_urls=data.media_urls,
            tags=final_tags,
            radius_km=data.radius_km,
            attributes=data.attributes.model_dump()
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
            media_urls=listing.media_urls,
            tags=listing.tags,
            radius_km=listing.radius_km,
            attributes=listing.attributes,
            created_at=listing.created_at
        )
    
    async def get_listing(self, listing_id: uuid.UUID) -> Listing:
        # Form query for getting listing
        query = select(Listing).where(Listing.id == listing_id).options(selectinload(Listing.owner))

        # Execute query and raise appropriate error if listing is not found
        results = await self.session.execute(query)
        listing = results.scalar_one_or_none()
        if not listing:
            raise ListingNotFound()

        return listing
    
    async def update_listing(self, listing_id: uuid.UUID, user: User, update_data: ListingUpdate) -> ListingPublic:
        listing = await self.get_listing(listing_id)
        if not listing:
            raise ListingNotFound()
            
        if not (listing.owner.id  == user.id or user.is_system_admin):
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
            
        listing.sqlmodel_update(data)
        
        self.session.add(listing)
        await self.session.commit()
        await self.session.refresh(listing)

        return listing

    async def delete_listing(self, listing_id: uuid.UUID, current_user: User) -> None:
        # Get listing
        listing = await self.session.get(Listing, listing_id)
        if not listing:
            raise ListingNotFound()
        
        # Prevent non-owner from deleting listing, allow system admins
        if not (current_user.id == listing.owner_id or current_user.is_system_admin):
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
        user_lang: str = "en"
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
                    col(Listing.title_en).ilike(search_pattern)
                )
            )

        # Order and Pagination
        query = query.order_by(desc(Listing.created_at)).offset(offset).limit(limit)
        
        # Join Owner for Display Info
        # We need eager loading to get owner name
        query = query.options(selectinload(Listing.owner))

        results = await self.session.execute(query)
        listings = results.scalars().all()
        
        # Transform for Display (Language Logic)
        feed_items = []
        for l in listings:
            # Pick correct language
            if user_lang == "de": title = l.title_de or l.title_original
            elif user_lang == "hu": title = l.title_hu or l.title_original
            else: title = l.title_en or l.title_original
            
            feed_items.append({
                "id": l.id,
                # "owner_id": l.owner_id,
                "owner_code": l.owner.user_code,
                "owner_name": l.owner.full_name,
                "owner_avatar": l.owner.avatar_url,
                "category": l.category,
                "status": l.status,
                "title": title,
                "description": l.description_original, # TODO: Localize desc
                "media_urls": l.media_urls,
                "tags": l.tags,
                "radius_km": l.radius_km,
                "attributes": l.attributes,
                "created_at": l.created_at
            })
            
        return FeedResponse(data=feed_items)
