"""normalize listing tags to listing_tags m2m

Revision ID: 84f465b4a081
Revises: e7f363f2be6e
Create Date: 2026-07-17 11:55:09.427332

Moves listing tags off the denormalized `listings.tags` JSONB array of name
strings and onto a `listing_tags` join table keyed by tag id.

The old column stored names, and names carry a language, so listings saved by
DE/HU users had localized labels ("Abfall") written where a canonical name
("Waste") belonged. The backfill below repairs that as it migrates: a label
that unambiguously belongs to an official tag is remapped to that tag.

Autogenerate also reported unrelated pre-existing model/DB drift
(`listings.zip_code` and `users.zip_code` VARCHAR(10) -> 4, and dropping the
Identity server default on `tags.id` and `matrix_registration_stats.id`).
Those are deliberately NOT included here: the zip changes truncate data and
dropping the Identity defaults would break inserts. They need their own
migration and their own decision.
"""

import json
from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "84f465b4a081"
down_revision: Union[str, Sequence[str], None] = "e7f363f2be6e"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _as_list(raw) -> list:
    """JSONB comes back as a list, but tolerate a raw string payload."""
    if raw is None:
        return []
    if isinstance(raw, str):
        try:
            raw = json.loads(raw)
        except json.JSONDecodeError:
            return []
    return raw if isinstance(raw, list) else []


def _build_resolution_maps(bind):
    """Map tag names and localized labels to tag ids, from the DB itself.

    The tags table is the source of truth, not tags_regio.json: the seeder's
    ON CONFLICT DO NOTHING skipped duplicate English names, so the two disagree.
    """
    rows = bind.execute(
        sa.text(
            "SELECT id, name, name_de, name_en, name_hu, is_official FROM tags"
        )
    ).all()

    by_canonical = {r.name: r.id for r in rows}

    # A localized label only resolves if it points at exactly one official tag
    candidates: dict[str, set] = {}
    for r in rows:
        if not r.is_official:
            continue
        for label in (r.name_de, r.name_en, r.name_hu):
            if label and label != r.name:
                candidates.setdefault(label, set()).add(r.id)

    by_label = {
        label: next(iter(ids))
        for label, ids in candidates.items()
        if len(ids) == 1
    }
    ambiguous = {label for label, ids in candidates.items() if len(ids) > 1}

    return by_canonical, by_label, ambiguous


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "listing_tags",
        sa.Column("listing_id", sa.Uuid(), nullable=False),
        sa.Column("tag_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(
            ["listing_id"], ["listings.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(["tag_id"], ["tags.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("listing_id", "tag_id"),
    )
    op.create_index(
        op.f("ix_listing_tags_tag_id"),
        "listing_tags",
        ["tag_id"],
        unique=False,
    )

    _backfill_links(op.get_bind())

    op.drop_index(
        op.f("ix_listings_tags_gin"),
        table_name="listings",
        postgresql_using="gin",
    )
    op.drop_column("listings", "tags")


def _backfill_links(bind) -> None:
    by_canonical, by_label, ambiguous = _build_resolution_maps(bind)

    listings = bind.execute(
        sa.text("SELECT id, tags FROM listings WHERE tags IS NOT NULL")
    ).all()

    links: set[tuple] = set()
    kept = remapped = created = dropped = 0

    for listing_id, raw_tags in listings:
        for entry in _as_list(raw_tags):
            name = (entry or "").strip() if isinstance(entry, str) else ""
            if not name:
                continue

            tag_id = by_canonical.get(name)
            if tag_id is not None:
                kept += 1
            elif name in by_label:
                tag_id = by_label[name]
                remapped += 1
                print(f"  remap   {name!r} -> tag id {tag_id}")
            elif name in ambiguous:
                dropped += 1
                print(f"  drop    {name!r} (ambiguous label)")
                continue
            else:
                tag_id = bind.execute(
                    sa.text(
                        "INSERT INTO tags (name, is_official, created_at) "
                        "VALUES (:name, FALSE, now()) "
                        "ON CONFLICT (name) DO NOTHING RETURNING id"
                    ),
                    {"name": name},
                ).scalar()
                if tag_id is None:
                    tag_id = bind.execute(
                        sa.text("SELECT id FROM tags WHERE name = :name"),
                        {"name": name},
                    ).scalar()
                by_canonical[name] = tag_id
                created += 1
                print(f"  create  {name!r} -> unofficial tag id {tag_id}")

            links.add((listing_id, tag_id))

    for listing_id, tag_id in links:
        bind.execute(
            sa.text(
                "INSERT INTO listing_tags (listing_id, tag_id) "
                "VALUES (:listing_id, :tag_id) ON CONFLICT DO NOTHING"
            ),
            {"listing_id": listing_id, "tag_id": tag_id},
        )

    print(
        f"listing_tags backfill: {len(links)} links across {len(listings)} listings "
        f"(kept={kept} remapped={remapped} created={created} dropped={dropped})"
    )


def downgrade() -> None:
    """Downgrade schema.

    Restores canonical names into the JSONB column. Labels that the upgrade
    remapped come back as their canonical name, not the localized label they
    were before — the original corruption is not recreated.
    """
    op.add_column(
        "listings",
        sa.Column(
            "tags",
            postgresql.JSONB(astext_type=sa.Text()),
            autoincrement=False,
            nullable=True,
        ),
    )
    op.create_index(
        op.f("ix_listings_tags_gin"),
        "listings",
        ["tags"],
        unique=False,
        postgresql_using="gin",
    )

    bind = op.get_bind()
    bind.execute(
        sa.text(
            """
            UPDATE listings l
            SET tags = COALESCE((
                SELECT jsonb_agg(t.name ORDER BY t.name)
                FROM listing_tags lt
                JOIN tags t ON t.id = lt.tag_id
                WHERE lt.listing_id = l.id
            ), '[]'::jsonb)
            """
        )
    )

    op.drop_index(op.f("ix_listing_tags_tag_id"), table_name="listing_tags")
    op.drop_table("listing_tags")
