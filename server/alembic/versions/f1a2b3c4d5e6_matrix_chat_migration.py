"""matrix_chat_migration

Revision ID: f1a2b3c4d5e6
Revises: de4ab9507194
Create Date: 2026-03-17 00:00:00.000000

Drop old WebSocket chat tables; add Matrix user fields + 4 new Matrix tables.
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "f1a2b3c4d5e6"
down_revision: Union[str, Sequence[str], None] = "de4ab9507194"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ------------------------------------------------------------------
    # 1. Drop old chat tables (WebSocket era)
    # ------------------------------------------------------------------
    op.execute("DROP TABLE IF EXISTS chat_messages CASCADE")
    op.execute("DROP TABLE IF EXISTS chat_rooms CASCADE")

    # ------------------------------------------------------------------
    # 2. Add Matrix fields to users table
    # ------------------------------------------------------------------
    op.add_column(
        "users",
        sa.Column("matrix_user_id", sa.String(), nullable=True),
    )
    op.create_unique_constraint(
        "uq_users_matrix_user_id", "users", ["matrix_user_id"]
    )
    # Note: matrix_password column already exists (added by migration c70886fda011)

    # ------------------------------------------------------------------
    # 3. Create matrix_user_credentials table
    # ------------------------------------------------------------------
    op.create_table(
        "matrix_user_credentials",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("access_token", sa.String(), nullable=False),
        sa.Column("device_id", sa.String(), nullable=False),
        sa.Column("home_server", sa.String(), nullable=False),
        sa.Column(
            "last_login_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id"),
    )
    op.create_index(
        "ix_matrix_user_credentials_user_id",
        "matrix_user_credentials",
        ["user_id"],
    )

    # ------------------------------------------------------------------
    # 4. Create matrix_rooms table
    # ------------------------------------------------------------------
    op.create_table(
        "matrix_rooms",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("matrix_room_id", sa.String(), nullable=False),
        sa.Column("listing_id", sa.Uuid(), nullable=True),
        sa.Column("room_name", sa.String(length=255), nullable=True),
        sa.Column("created_by_id", sa.Uuid(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.ForeignKeyConstraint(["created_by_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("matrix_room_id"),
    )
    op.create_index(
        "ix_matrix_rooms_matrix_room_id", "matrix_rooms", ["matrix_room_id"]
    )
    op.create_index("ix_matrix_rooms_listing_id", "matrix_rooms", ["listing_id"])

    # ------------------------------------------------------------------
    # 5. Create matrix_room_participants table
    # ------------------------------------------------------------------
    op.create_table(
        "matrix_room_participants",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("room_id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("matrix_user_id", sa.String(), nullable=False),
        sa.ForeignKeyConstraint(["room_id"], ["matrix_rooms.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("room_id", "user_id"),
    )
    op.create_index(
        "ix_matrix_room_participants_room_id",
        "matrix_room_participants",
        ["room_id"],
    )
    op.create_index(
        "ix_matrix_room_participants_user_id",
        "matrix_room_participants",
        ["user_id"],
    )

    # ------------------------------------------------------------------
    # 6. Create matrix_registration_stats table
    # ------------------------------------------------------------------
    op.create_table(
        "matrix_registration_stats",
        sa.Column(
            "id",
            sa.Integer(),
            sa.Identity(always=False),
            nullable=False,
        ),
        sa.Column("users_created", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("token_limit", sa.Integer(), nullable=False, server_default="300"),
        sa.Column("token_expiry", sa.DateTime(timezone=True), nullable=False),
        sa.Column(
            "last_updated",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("matrix_registration_stats")
    op.drop_table("matrix_room_participants")
    op.drop_table("matrix_rooms")
    op.drop_table("matrix_user_credentials")
    op.drop_constraint("uq_users_matrix_user_id", "users", type_="unique")
    op.drop_column("users", "matrix_user_id")
    # Note: we don't recreate chat_rooms/chat_messages in downgrade
    # as that data is gone
