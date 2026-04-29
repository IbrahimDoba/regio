# Matrix Chat Implementation

This document describes the Matrix chat implementation for the Regio application.

## Overview

The chat feature provides real-time messaging between users using the **Matrix protocol** with end-to-end encryption (E2EE). It's designed to facilitate communication around listings and transactions.

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Next.js Client │────▶│  FastAPI Backend │────▶│ Matrix Synapse  │
│  (matrix-js-sdk)│◀────│   (/chats/*)     │◀────│  (Homeserver)   │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

## Key Features

- **End-to-End Encryption**: All messages are encrypted using Matrix's E2EE
- **Payment Requests**: Custom message type for requesting payments in Regio/Time
- **Contextual Rooms**: Rooms are created per listing inquiry
- **Real-time Sync**: Live message updates via Matrix sync

## File Structure

```
src/
├── app/(app)/chat/
│   └── page.tsx                 # Main chat page
├── components/chat/
│   ├── ChatHeader.tsx           # Chat header with partner info
│   ├── MessageList.tsx          # Message list with date separators
│   ├── MessageInput.tsx         # Message input with send button
│   ├── PaymentRequestCard.tsx   # Payment request UI component
│   ├── ActionSheet.tsx          # Bottom action sheet modal
│   ├── PaymentRequestModal.tsx  # Payment request creation modal
│   └── index.ts                 # Component exports
├── context/
│   └── MatrixContext.tsx        # Matrix client state management
└── lib/api/
    ├── modules/chat.ts          # Chat API functions
    ├── hooks/use-chat.ts        # Chat React Query hooks
    └── types.ts                 # Chat TypeScript types
```

## Environment Variables

Add these to your `.env.local`:

```env
# API Base URL
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000

# Matrix configuration (handled by backend)
# No direct Matrix client config needed - tokens obtained via /chats/token
```

## Usage

### Starting a Chat from a Listing

```tsx
import { useCreateListingInquiry } from '@/lib/api';
import { useRouter } from 'next/navigation';

function ListingCard({ listing }) {
  const router = useRouter();
  const { mutate: createInquiry } = useCreateListingInquiry();

  const handleInquire = () => {
    createInquiry(
      {
        listing_id: listing.id,
        listing_title: listing.title,
        seller_user_code: listing.owner_code,
      },
      {
        onSuccess: (data) => {
          // Navigate to chat with the room
          router.push(
            `/chat?room=${data.room_id}&name=${listing.owner_name}&listing=${listing.title}`
          );
        },
      }
    );
  };

  return <button onClick={handleInquire}>Inquire</button>;
}
```

### Using the Matrix Context

```tsx
import { useMatrix } from '@/context/MatrixContext';

function ChatComponent() {
  const {
    isConnected,
    connect,
    sendTextMessage,
    sendPaymentRequest,
    messages,
    currentRoom,
  } = useMatrix();

  // Send a text message
  const handleSend = async (text: string) => {
    if (currentRoom) {
      await sendTextMessage(currentRoom.roomId, text);
    }
  };

  // Send a payment request
  const handlePaymentRequest = async () => {
    if (currentRoom) {
      await sendPaymentRequest(currentRoom.roomId, {
        amountRegio: 15.0,
        amountTime: 30,
        description: 'Kitchen renovation',
      });
    }
  };
}
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/chats/token` | GET | Get Matrix access token (creates account if needed) |
| `/chats/rooms` | GET | List joined rooms |
| `/chats/rooms` | POST | Create a new room |
| `/chats/rooms/inquiry` | POST | Create/get room for listing inquiry |

## Custom Event Types

### Payment Request (`regio.payment_request`)

```json
{
  "msgtype": "regio.payment_request",
  "body": "Payment Request: 15.00 Regio, 30 min",
  "amount_regio": 15.00,
  "amount_time": 30,
  "description": "Kitchen renovation",
  "payment_request_id": "pr_123456",
  "status": "pending"
}
```

## Backend Integration

The backend handles:
- User provisioning on Matrix Synapse
- Token generation and management
- Room creation and management
- Integration with Regio user accounts

See `server/app/chat/` for backend implementation.

## Security Considerations

1. **Access Tokens**: Matrix access tokens are obtained via the backend (`/chats/token`)
2. **E2EE**: End-to-end encryption is enabled for all rooms
3. **Authenticated Media**: Media downloads require authentication (MSC3916)

## Future Enhancements

- [ ] File/photo upload to Matrix
- [ ] Voice messages
- [ ] Message reactions
- [ ] Read receipts
- [ ] Push notifications
- [ ] Message search
