"""add tokens_valid_from to users

Revision ID: a1b2c3d4e5f6
Revises: b9f1a2e3c4d5
Create Date: 2026-05-06 00:00:00.000000

Adds tokens_valid_from column to users table for post-password-reset session invalidation.
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, Sequence[str], None] = "b9f1a2e3c4d5"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column(
            "tokens_valid_from",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
    )


def downgrade() -> None:
    op.drop_column("users", "tokens_valid_from")
