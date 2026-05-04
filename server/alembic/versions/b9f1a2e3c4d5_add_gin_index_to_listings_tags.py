"""add GIN index to listings tags

Revision ID: b9f1a2e3c4d5
Revises: 32a0b3109cdc
Create Date: 2026-05-04 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op

revision: str = 'b9f1a2e3c4d5'
down_revision: Union[str, Sequence[str], None] = '32a0b3109cdc'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_listings_tags_gin ON listings USING gin(tags)"
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_listings_tags_gin")
