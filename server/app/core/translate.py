import json
import logging
import uuid

from openai import AsyncOpenAI
from sqlmodel import select

from app.core.config import settings
from app.core.database import AsyncSessionLocal
from app.listings.models import Listing

logger = logging.getLogger(__name__)

SUPPORTED_LANGUAGES = {"EN", "DE", "HU"}

client = (
    AsyncOpenAI(
        api_key=settings.DEEPSEEK_API_KEY,
        base_url="https://api.deepseek.com",
    )
    if settings.DEEPSEEK_API_KEY
    else None
)


class TranslateService:
    """Translates listing title + description via DeepSeek and persists results."""

    @staticmethod
    async def _translate(
        title: str, description: str, origin_language: str
    ) -> dict:
        """
        Single API call to translate both title and description
        from origin_language to the other two languages.

        Returns dict like:
        {
            "title": {"DE": "...", "HU": "..."},
            "description": {"DE": "...", "HU": "..."}
        }
        """
        target_languages = SUPPORTED_LANGUAGES - {origin_language}
        targets = ", ".join(sorted(target_languages))

        response = await client.chat.completions.create(
            model="deepseek-chat",
            temperature=0.3,
            timeout=60,
            response_format={"type": "json_object"},
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a translator. Translate the given title and description "
                        "to the requested languages. Return ONLY a JSON object with this "
                        'exact structure: {"title": {"LANG": "..."}, "description": {"LANG": "..."}} '
                        "where LANG is the uppercase language code. No extra keys or explanation."
                    ),
                },
                {
                    "role": "user",
                    "content": (
                        f"Original language: {origin_language}\n"
                        f"Translate to: {targets}\n\n"
                        f"Title: {title}\n\n"
                        f"Description: {description}"
                    ),
                },
            ],
        )

        return json.loads(response.choices[0].message.content)

    @staticmethod
    async def translate_listing(
        listing_id: uuid.UUID,
        title: str,
        description: str,
        origin_language: str,
    ) -> None:
        """
        Background task: translates title + description and updates the listing.
        Opens its own DB session since the request session is already closed.
        """
        origin_language = origin_language.upper()
        if origin_language not in SUPPORTED_LANGUAGES:
            logger.error(
                f"Unsupported language '{origin_language}' for listing {listing_id}"
            )
            return

        if not client:
            logger.warning("DEEPSEEK_API_KEY not set — skipping translation")
            return

        try:
            translations = await TranslateService._translate(
                title, description, origin_language
            )
        except Exception:
            logger.exception(
                f"Translation API failed for listing {listing_id}"
            )
            return

        # Build update fields: original text maps to its own lang, translations fill the rest
        update_data = {
            f"title_{origin_language.lower()}": title,
            f"description_{origin_language.lower()}": description,
        }

        target_languages = SUPPORTED_LANGUAGES - {origin_language}
        for lang in target_languages:
            title_translations = translations.get("title", {})
            desc_translations = translations.get("description", {})

            update_data[f"title_{lang.lower()}"] = title_translations.get(
                lang
            ) or title_translations.get(lang.lower(), "")
            update_data[f"description_{lang.lower()}"] = desc_translations.get(
                lang
            ) or desc_translations.get(lang.lower(), "")

        # Persist with a fresh session
        try:
            async with AsyncSessionLocal() as session:
                result = await session.execute(
                    select(Listing).where(Listing.id == listing_id)
                )
                listing = result.scalar_one_or_none()
                if not listing:
                    logger.error(
                        f"Listing {listing_id} not found for translation update"
                    )
                    return

                for field, value in update_data.items():
                    setattr(listing, field, value)

                session.add(listing)
                await session.commit()

                logger.info(f"Translations saved for listing {listing_id}")
        except Exception:
            logger.exception(
                f"Failed to persist translations for listing {listing_id}"
            )
