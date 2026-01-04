from typing import List, Optional

from pydantic import UUID4, BaseModel, ConfigDict, Field


class MatrixTokenResponse(BaseModel):
    """
    Response for the frontend to initialize Matrix Client.
    """

    user_id: str = Field(
        ..., description="The full Matrix User ID (e.g. @regio_z2000:matrix.org)."
    )
    access_token: str = Field(..., description="The session token for the Matrix API.")
    home_server: str = Field(..., description="The URL of the Matrix Homeserver.")
    device_id: str = Field(
        ..., description="The device ID associated with this session."
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "user_id": "@regio_z2000:matrix.example.com",
                "access_token": "syt_...",
                "home_server": "https://matrix.example.com",
                "device_id": "XYZ123",
            }
        }
    )


class RoomCreateRequest(BaseModel):
    """
    Generic request to create a chat room.
    """

    name: Optional[str] = Field(default=None, description="Display name of the room.")
    topic: Optional[str] = Field(
        default=None, description="Topic or subject of the room."
    )
    invite_user_codes: List[str] = Field(
        ..., description="List of user codes (e.g. ['B2000']) to invite immediately."
    )
    is_direct: bool = Field(
        default=True,
        description="If True, treats this as a Direct Message (DM). Currently not used to allow for chat moderation in disputes.",
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "name": "Project Discussion",
                "topic": "Planning the community garden",
                "invite_user_codes": ["B2000", "C3000"],
                "is_direct": False,
            }
        }
    )


class ListingInquiryRequest(BaseModel):
    """
    Specific request for 'Part B': Contextual Room for a Listing.
    Used when a user clicks 'Inquire' on a listing.
    """

    listing_id: UUID4 = Field(
        ..., description="The unique ID of the listing being inquired about."
    )
    listing_title: str = Field(
        ..., description="Title of the listing (used for room name/topic)."
    )
    seller_user_code: str = Field(
        ..., description="The User Code of the seller (recipient)."
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "listing_id": "123e4567-e89b-12d3-a456-426614174000",
                "listing_title": "Vintage Camera",
                "seller_user_code": "B2000",
            }
        }
    )


class RoomResponse(BaseModel):
    room_id: str = Field(..., description="The Matrix Room ID.")
    alias: Optional[str] = Field(
        default=None, description="The canonical alias (if created)."
    )
    is_new: bool = Field(
        default=False,
        description="True if a new room was created, False if an existing room was returned.",
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "room_id": "!xyz123:matrix.example.com",
                "alias": "#listing_123_user456:matrix.example.com",
                "is_new": True,
            }
        }
    )


class JoinedRoomsResponse(BaseModel):
    """
    List of room IDs the user has joined.
    """

    joined_rooms: List[str] = Field(..., description="List of Matrix Room IDs.")
