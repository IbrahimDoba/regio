# Matrix Chat Implementation Guide (Frontend)

## Overview
We are using a Matrix Homeserver for our real-time chat. The FastAPI backend acts as an Identity Bridge. You do not create accounts manually; the backend handles account provisioning and authentication (Handshake).

Once you complete the handshake, you receive an ```access_token``` and communicate directly with the Matrix Server using the ```matrix-js-sdk```.

### 1. Prerequisites
Install the official Matrix SDK:

```bash
npm install matrix-js-sdk
# OR
yarn add matrix-js-sdk
```

### 2. The Handshake Flow
Before loading the chat UI, fetch the Matrix credentials for the currently logged-in user.

Endpoint: ```GET /api/v1/chat/token```

Response:

```JSON
{
  "user_id": "@user_code:matrix.domain.com",
  "access_token": "syt_Ai8...",
  "home_server": "matrix.domain.com",
  "device_id": "..."
}
```

### 3. Initializing the Client
Use the data from the handshake to start the client.

```TypeScript
import * as sdk from "matrix-js-sdk";

// 1. Get credentials from our backend
const { user_id, access_token, home_server } = await fetch('/api/v1/chat/token').then(res => res.json());

// 2. Start the Matrix Client
const client = sdk.createClient({
  baseUrl: `https://${home_server}`, // Ensure https:// is included
  accessToken: access_token,
  userId: user_id,
});

// 3. Start syncing (Listening for events)
await client.startClient({ initialSyncLimit: 10 });

// 4. Wait for sync to prepare
client.once('sync', function(state, prevState, res) {
  if (state === 'PREPARED') {
    console.log("Chat Ready!");
  }
});
```

### 4. Creating a Chat Room
To start a conversation (e.g., about a specific listing), call our backend, not Matrix directly. This ensures the backend invites the correct users.

Endpoint: ```POST /api/v1/chat/rooms``` Payload:

```JSON
{
  "invite_user_codes": ["TARGET_USER_CODE"],
  "name": "Inquiry: 2015 Honda Civic", 
  "topic": "Negotiation for listing #12345"
}
```
Response: ```{"room_id": "!xyz:matrix.domain.com"}```

Note: Once the room is created, the target user will see an invite. The SDK handles accepting invites automatically in most configurations, or you can listen for ```RoomMember.membership === 'invite'``` events.

### 5. Listening for Incoming Messages
Matrix works on an event stream.

```TypeScript
client.on("Room.timeline", function(event, room, toStartOfTimeline) {
  // Check if it's a message
  if (event.getType() !== "m.room.message") return;
    
  // Don't handle our own messages as "incoming"
  if (event.getSender() === user_id) return;

  console.log(`Message from ${event.getSender()} in room ${room.roomId}:`);
  console.log(event.getContent().body);
    
  // Update your UI State here
});
```

### 6. Sending Messages
Send messages directly to Matrix (bypassing our backend).

```TypeScript
const content = {
  "body": "Is this item still available?",
  "msgtype": "m.text"
};

client.sendEvent(roomId, "m.room.message", content, "").then((res) => {
  console.log("Message sent", res);
});
```
