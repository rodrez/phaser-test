# MMO Server for Phaser Game

This is the WebSocket server for the Phaser MMO game. It handles real-time communication between game clients, including player synchronization, chat, and shared environment interactions.

## Features

- WebSocket-based real-time communication
- Player position and state synchronization
- Chat system with multiple channels
- Combat event broadcasting
- Environment update sharing

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Start the server:
   ```
   npm start
   ```

   For development with auto-restart:
   ```
   npm run dev
   ```

## Configuration

The server runs on port 3000 by default. You can change this by setting the `PORT` environment variable:

```
PORT=8080 npm start
```

## API Endpoints

- `GET /status` - Get server status and connected client count
- `GET /chat-history` - Get chat message history

## WebSocket Protocol

The server communicates with clients using JSON messages with the following format:

```json
{
  "type": "message_type",
  "data": { ... }
}
```

### Message Types

- `connect` - Player connection
- `disconnect` - Player disconnection
- `player_update` - Player position and state update
- `player_list` - List of all connected players
- `chat_message` - Chat message
- `combat_event` - Combat event
- `environment_update` - Environment update

### Chat Channels

The chat system supports the following channels:

- `global` - Messages visible to all players
- `local` - Messages visible to nearby players
- `party` - Messages visible to party members
- `guild` - Messages visible to guild members
- `whisper` - Private messages between two players

## Client Integration

The client integration is handled by the `MMOSystem` class in the Phaser game. To initialize the MMO system:

```typescript
// In the Game scene
this.mmoSystem = new MMOSystem(this);
this.mmoSystem.initialize('ws://localhost:3000');
```

To send a chat message:

```typescript
// Using the built-in chat UI
// Press Enter to open chat, type message, press Enter to send

// Or programmatically
this.mmoSystem.sendChatMessage();
```

## Deployment

For production deployment, consider using a process manager like PM2:

```
npm install -g pm2
pm2 start mmo-server.js
```

## License

MIT 