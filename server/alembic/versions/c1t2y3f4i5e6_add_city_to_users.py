"""Add city to users

Revision ID: c1t2y3f4i5e6
Revises: z1p2v3i4s5b6
Create Date: 2026-06-05 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = "c1t2y3f4i5e6"
down_revision = "z1p2v3i4s5b6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("city", sa.String(100), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "city")
