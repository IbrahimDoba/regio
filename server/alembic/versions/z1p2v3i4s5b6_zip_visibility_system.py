"""ZIP-code visibility system

Revision ID: z1p2v3i4s5b6
Revises: a1b2c3d4e5f6
Create Date: 2026-05-14 00:00:00.000000

Implements the pre-computed ZIP-code distance visibility system:
  - Adds zip_distances table (populated from data coordinates.csv)
  - Adds post_visibilities junction table
  - Adds zip_code, d_class, available_until to listings
  - Removes obsolete radius_km, location_lat, location_lng from listings
  - Defaults existing listings to d_class = 'D5' (Nationwide)
  - Adds INACTIVE to listingstatus enum (if native PG type)
  - Adds zip_code to users
"""
from pathlib import Path
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers
revision: str = "z1p2v3i4s5b6"
down_revision: Union[str, Sequence[str], None] = "a1b2c3d4e5f6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# Path to the distance CSV (relative to this file: ../../distance/data coordinates.csv)
_CSV_PATH = Path(__file__).parent.parent.parent / "distance" / "data coordinates.csv"
_BATCH_SIZE = 5_000


def upgrade() -> None:
    # ------------------------------------------------------------------
    # 1. Add INACTIVE to listingstatus enum (no-op if type doesn't exist)
    # ------------------------------------------------------------------
    op.execute("""
        DO $$
        BEGIN
            IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'listingstatus') THEN
                ALTER TYPE listingstatus ADD VALUE IF NOT EXISTS 'INACTIVE';
            END IF;
        END $$;
    """)

    # ------------------------------------------------------------------
    # 2. Modify listings table ------------------------------------------------------------------
    op.drop_column("listings", "radius_km")
    op.drop_column("listings", "location_lat")
    op.drop_column("listings", "location_lng")

    op.add_column("listings", sa.Column("zip_code", sa.String(length=10), nullable=True))
    op.add_column("listings", sa.Column("d_class", sa.String(length=2), nullable=True))
    op.add_column(
        "listings",
        sa.Column("available_until", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_listings_d_class", "listings", ["d_class"])

    # Default existing listings to D5 (Nationwide) so they remain visible
    op.execute("UPDATE listings SET d_class = 'D5' WHERE d_class IS NULL")

    # ------------------------------------------------------------------
    # 3. Add zip_code to users
    # ------------------------------------------------------------------
    op.add_column("users", sa.Column("zip_code", sa.String(length=10), nullable=True))

    # ------------------------------------------------------------------
    # 4. Create zip_distances table
    # ------------------------------------------------------------------
    op.create_table(
        "zip_distances",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("zip_from", sa.String(length=10), nullable=False),
        sa.Column("zip_to", sa.String(length=10), nullable=False),
        sa.Column("distance_km", sa.SmallInteger(), nullable=False),
    )
    op.create_index("ix_zip_distances_zip_from", "zip_distances", ["zip_from"])
    op.create_index(
        "ix_zip_distances_zip_from_km", "zip_distances", ["zip_from", "distance_km"]
    )

    # ------------------------------------------------------------------
    # 5. Import distance data only if table is empty
    # ------------------------------------------------------------------
    conn = op.get_bind()
    row_count = conn.execute(sa.text("SELECT COUNT(*) FROM zip_distances")).scalar()

    if row_count == 0:
        if _CSV_PATH.exists():
            batch: list[dict] = []

            with open(_CSV_PATH, "r", encoding="utf-8") as f:
                for line in f:
                    parts = line.strip().split(";")
                    if len(parts) != 3:
                        continue
                    try:
                        batch.append(
                            {
                                "zip_from": parts[0].strip(),
                                "zip_to": parts[1].strip(),
                                "distance_km": int(float(parts[2].strip())),
                            }
                        )
                    except ValueError:
                        continue

                    if len(batch) >= _BATCH_SIZE:
                        conn.execute(
                            sa.text(
                                "INSERT INTO zip_distances (zip_from, zip_to, distance_km) "
                                "VALUES (:zip_from, :zip_to, :distance_km)"
                            ),
                            batch,
                        )
                        batch = []

            if batch:
                conn.execute(
                    sa.text(
                        "INSERT INTO zip_distances (zip_from, zip_to, distance_km) "
                        "VALUES (:zip_from, :zip_to, :distance_km)"
                    ),
                    batch,
                )
            print(f"[INFO] Imported distance data from {_CSV_PATH}")
        else:
            print(
                f"[WARNING] Distance CSV not found at {_CSV_PATH}. "
                "zip_distances table will be empty."
            )
    else:
        print(f"[INFO] zip_distances already has {row_count} rows — skipping import.")

    # ------------------------------------------------------------------
    # 6. Create post_visibilities table
    # ------------------------------------------------------------------
    op.create_table(
        "post_visibilities",
        sa.Column("post_id", sa.Uuid(), nullable=False),
        sa.Column("viewer_zip", sa.String(length=10), nullable=False),
        sa.ForeignKeyConstraint(["post_id"], ["listings.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("post_id", "viewer_zip"),
    )
    op.create_index(
        "ix_post_visibilities_viewer_zip", "post_visibilities", ["viewer_zip"]
    )


def downgrade() -> None:
    # Idempotent drops — tolerate partial/half-applied state from prior runs.
    op.execute("DROP INDEX IF EXISTS ix_post_visibilities_viewer_zip")
    op.execute("DROP TABLE IF EXISTS post_visibilities")

    op.execute("DROP INDEX IF EXISTS ix_zip_distances_zip_from_km")
    op.execute("DROP INDEX IF EXISTS ix_zip_distances_zip_from")
    op.execute("DROP TABLE IF EXISTS zip_distances")

    op.execute("ALTER TABLE users DROP COLUMN IF EXISTS zip_code")

    op.execute("DROP INDEX IF EXISTS ix_listings_d_class")
    op.execute("""
        ALTER TABLE listings
            DROP COLUMN IF EXISTS available_until,
            DROP COLUMN IF EXISTS d_class,
            DROP COLUMN IF EXISTS zip_code
    """)

    op.execute("""
        ALTER TABLE listings
            ADD COLUMN IF NOT EXISTS radius_km    INTEGER DEFAULT 10,
            ADD COLUMN IF NOT EXISTS location_lat DOUBLE PRECISION,
            ADD COLUMN IF NOT EXISTS location_lng DOUBLE PRECISION
    """)
