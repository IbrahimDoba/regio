"""add listing_edit_logs table

Revision ID: ad4c7c5295ba
Revises: 84f465b4a081
Create Date: 2026-07-17 17:21:20.654450

"""

from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "ad4c7c5295ba"
down_revision: Union[str, Sequence[str], None] = "84f465b4a081"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "listing_edit_logs",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("listing_id", sa.Uuid(), nullable=False),
        sa.Column("edited_by_id", sa.Uuid(), nullable=True),
        sa.Column("field", sa.String(), nullable=False),
        sa.Column("value_from", sa.String(), nullable=True),
        sa.Column("value_to", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["edited_by_id"],
            ["users.id"],
        ),
        sa.ForeignKeyConstraint(
            ["listing_id"], ["listings.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_listing_edit_logs_created_at"),
        "listing_edit_logs",
        ["created_at"],
        unique=False,
    )
    op.create_index(
        op.f("ix_listing_edit_logs_listing_id"),
        "listing_edit_logs",
        ["listing_id"],
        unique=False,
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(
        op.f("ix_listing_edit_logs_listing_id"), table_name="listing_edit_logs"
    )
    op.drop_index(
        op.f("ix_listing_edit_logs_created_at"), table_name="listing_edit_logs"
    )
    op.drop_table("listing_edit_logs")
