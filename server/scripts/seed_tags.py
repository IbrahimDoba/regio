"""
Seed official tags from tags_regio.json into the tags table.

Usage (from the server/ directory):
    python scripts/seed_tags.py [--json PATH]

The script is idempotent: tags whose `name` already exists are skipped.
"""

import asyncio
import json
import sys
from pathlib import Path

# Make sure app imports resolve when run from server/
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import text
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.core.config import settings

DEFAULT_JSON = Path(__file__).parent.parent / "tags_regio.json"


async def seed(json_path: Path) -> None:
    raw = json_path.read_text(encoding="utf-8")
    entries = json.loads(raw)

    engine = create_async_engine(
        str(settings.DATABASE_URL), pool_pre_ping=True
    )
    session_factory = async_sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )

    inserted = skipped = 0

    async with session_factory() as session:
        for entry in entries:
            name = entry["en"]  # canonical key — English is the neutral primary
            result = await session.execute(
                text(
                    """
                    INSERT INTO tags (name, name_de, name_en, name_hu, is_official, created_at)
                    VALUES (:name, :name_de, :name_en, :name_hu, TRUE, now())
                    ON CONFLICT (name) DO NOTHING
                    """
                ),
                {
                    "name": name,
                    "name_de": entry.get("de"),
                    "name_en": entry.get("en"),
                    "name_hu": entry.get("hu"),
                },
            )
            if result.rowcount:
                inserted += 1
            else:
                skipped += 1

        await session.commit()

    await engine.dispose()
    print(f"Done. Inserted: {inserted}, Skipped (already existed): {skipped}")


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(
        description="Seed official tags from JSON."
    )
    parser.add_argument(
        "--json",
        type=Path,
        default=DEFAULT_JSON,
        help=f"Path to tags JSON file (default: {DEFAULT_JSON})",
    )
    args = parser.parse_args()

    if not args.json.exists():
        print(f"Error: JSON file not found: {args.json}", file=sys.stderr)
        sys.exit(1)

    asyncio.run(seed(args.json))
