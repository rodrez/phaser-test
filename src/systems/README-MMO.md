# MMO System for Phaser Game

This document describes the MMO (Massively Multiplayer Online) system implemented for the Phaser game.

## Overview

The MMO system enables real-time multiplayer functionality in the game, allowing players to see and interact with each other in the game world. It includes features such as player synchronization, chat, and shared environment interactions.

## Features

- **Real-time Player Synchronization**: See other players moving in the game world
- **Chat System**: Communicate with other players through various channels
- **Combat Interaction**: Share combat events with other players
- **Environment Synchronization**: Share environment changes with other players

## Integration

The MMO system is integrated into the game through the `MMOSystem` class in `systems/MMO.ts`. This class handles all the multiplayer functionality and communicates with the server via WebSockets.

### Setup

1. The MMO system is initialized in the `create()` method of the `Game` scene:

```typescript
// Initialize MMO system
this.mmoSystem = new MMOSystem(this);

// Connect to MMO server
const mmoServerUrl = 'wss://your-server-url.com';
this.mmoSystem.initialize(mmoServerUrl);
```

2. The MMO system is updated in the `update()` method of the `Game` scene:

```typescript
// Update MMO system
if (this.mmoSystem) {
    this.mmoSystem.update(time, delta);
}
```

3. The MMO system is cleaned up in the `cleanupResources()` method of the `Game` scene:

```typescript
// Clean up MMO system
if (this.mmoSystem) {
    this.mmoSystem.destroy();
}
```

## Chat System

The chat system allows players to communicate with each other through various channels:

- **Global**: Messages visible to all players
- **Local**: Messages visible to nearby players
- **Party**: Messages visible to party members
- **Guild**: Messages visible to guild members
- **Whisper**: Private messages between two players

### Using Chat

1. Press Enter to open the chat input
2. Type your message
3. Use channel prefixes to send to specific channels:
   - `/g message` - Global channel
   - `/p message` - Party channel
   - `/gu message` - Guild channel
   - `/w PlayerName message` - Whisper to a specific player
4. Press Enter to send the message
5. Press Escape to close the chat input

## Remote Players

Remote players are represented in the game world with their own sprites, health bars, and name tags. Their positions and animations are synchronized with the server.

## Server Communication

The MMO system communicates with the server using WebSockets. The following message types are used:

- `connect`: Player connection
- `disconnect`: Player disconnection
- `player_update`: Player position and state update
- `player_list`: List of all connected players
- `chat_message`: Chat message
- `combat_event`: Combat event
- `environment_update`: Environment update

## Development

To develop the MMO system further:

1. Modify the `MMOSystem` class in `systems/MMO.ts`
2. Update the server implementation in `server/mmo-server.js`
3. Test with multiple clients connected to the same server

## Server Setup

See the `server/README.md` file for information on setting up and running the MMO server. 