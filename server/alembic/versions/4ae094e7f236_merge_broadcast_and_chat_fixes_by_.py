"""merge broadcast and chat (fixes by Ibrahim) migrations

Revision ID: 4ae094e7f236
Revises: a6eb8453c12d, f1a2b3c4d5e6
Create Date: 2026-03-29 11:19:20.869579

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '4ae094e7f236'
down_revision: Union[str, Sequence[str], None] = ('a6eb8453c12d', 'f1a2b3c4d5e6')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
