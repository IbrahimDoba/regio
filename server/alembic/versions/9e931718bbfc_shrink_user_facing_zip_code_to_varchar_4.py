"""shrink user-facing zip_code to varchar 4

Revision ID: 9e931718bbfc
Revises: ad4c7c5295ba
Create Date: 2026-07-17 19:28:24.548691

"""

from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "9e931718bbfc"
down_revision: Union[str, Sequence[str], None] = "ad4c7c5295ba"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.alter_column(
        "listings",
        "zip_code",
        existing_type=sa.VARCHAR(length=10),
        type_=sa.String(length=4),
        existing_nullable=True,
    )
    op.alter_column(
        "users",
        "zip_code",
        existing_type=sa.VARCHAR(length=10),
        type_=sa.String(length=4),
        existing_nullable=False,
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.alter_column(
        "users",
        "zip_code",
        existing_type=sa.String(length=4),
        type_=sa.VARCHAR(length=10),
        existing_nullable=False,
    )
    op.alter_column(
        "listings",
        "zip_code",
        existing_type=sa.String(length=4),
        type_=sa.VARCHAR(length=10),
        existing_nullable=True,
    )
