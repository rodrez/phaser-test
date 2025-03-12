const WebSocket = require('ws');
const http = require('http');
const express = require('express');
const cors = require('cors');

// Message types
const MessageType = {
    CONNECT: 'connect',
    DISCONNECT: 'disconnect',
    PLAYER_UPDATE: 'player_update',
    PLAYER_LIST: 'player_list',
    CHAT_MESSAGE: 'chat_message',
    COMBAT_EVENT: 'combat_event',
    ENVIRONMENT_UPDATE: 'environment_update'
};

// Create Express app
const app = express();
app.use(cors());
app.use(express.json());

// Create HTTP server
const server = http.createServer(app);

// Create WebSocket server
const wss = new WebSocket.Server({ server });

// Store connected clients
const clients = new Map();

// Store player data
const players = new Map();

// Store chat history (last 100 messages)
const chatHistory = [];
const MAX_CHAT_HISTORY = 100;

// Handle WebSocket connections
wss.on('connection', (ws) => {
    console.log('Client connected');
    
    // Generate temporary client ID
    const clientId = Math.random().toString(36).substring(2, 15);
    clients.set(clientId, ws);
    
    // Set up message handler
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            handleMessage(clientId, ws, data);
        } catch (error) {
            console.error('Error parsing message:', error);
        }
    });
    
    // Handle disconnection
    ws.on('close', () => {
        console.log('Client disconnected:', clientId);
        
        // Get player ID associated with this client
        let playerId = null;
        for (const [id, data] of players.entries()) {
            if (data.clientId === clientId) {
                playerId = id;
                break;
            }
        }
        
        // Remove player data
        if (playerId) {
            players.delete(playerId);
            
            // Notify other clients
            broadcastToAll({
                type: MessageType.DISCONNECT,
                data: { id: playerId }
            }, clientId);
        }
        
        // Remove client
        clients.delete(clientId);
    });
    
    // Send current player list to new client
    const playerList = Array.from(players.values());
    ws.send(JSON.stringify({
        type: MessageType.PLAYER_LIST,
        data: playerList
    }));
    
    // Send chat history to new client
    if (chatHistory.length > 0) {
        for (const message of chatHistory) {
            ws.send(JSON.stringify({
                type: MessageType.CHAT_MESSAGE,
                data: message
            }));
        }
    }
});

/**
 * Handle incoming messages
 * @param {string} clientId Client ID
 * @param {WebSocket} ws WebSocket connection
 * @param {object} data Message data
 */
function handleMessage(clientId, ws, data) {
    const { type, data: messageData } = data;
    
    switch (type) {
        case MessageType.CONNECT:
            handleConnect(clientId, ws, messageData);
            break;
            
        case MessageType.PLAYER_UPDATE:
            handlePlayerUpdate(clientId, messageData);
            break;
            
        case MessageType.CHAT_MESSAGE:
            handleChatMessage(messageData);
            break;
            
        case MessageType.COMBAT_EVENT:
            handleCombatEvent(messageData);
            break;
            
        case MessageType.ENVIRONMENT_UPDATE:
            handleEnvironmentUpdate(messageData);
            break;
            
        default:
            console.warn('Unknown message type:', type);
    }
}

/**
 * Handle player connection
 * @param {string} clientId Client ID
 * @param {WebSocket} ws WebSocket connection
 * @param {object} data Connection data
 */
function handleConnect(clientId, ws, data) {
    console.log('Player connected:', data.id);
    
    // Store player data
    const playerData = {
        ...data,
        clientId,
        lastUpdate: Date.now()
    };
    
    players.set(data.id, playerData);
    
    // Notify other clients
    broadcastToAll({
        type: MessageType.PLAYER_UPDATE,
        data: playerData
    }, clientId);
}

/**
 * Handle player update
 * @param {string} clientId Client ID
 * @param {object} data Player data
 */
function handlePlayerUpdate(clientId, data) {
    // Update player data
    const playerData = {
        ...data,
        clientId,
        lastUpdate: Date.now()
    };
    
    players.set(data.id, playerData);
    
    // Broadcast to other clients
    broadcastToAll({
        type: MessageType.PLAYER_UPDATE,
        data: playerData
    }, clientId);
}

/**
 * Handle chat message
 * @param {object} data Chat message data
 */
function handleChatMessage(data) {
    console.log('Chat message received:', data);
    
    // Ensure the message has all required fields
    if (!data.id || !data.senderId || !data.content || !data.channel) {
        console.error('Invalid chat message format:', data);
        return;
    }
    
    // Add to chat history
    chatHistory.push(data);
    
    // Limit chat history
    if (chatHistory.length > MAX_CHAT_HISTORY) {
        chatHistory.shift();
    }
    
    // Find sender's client ID
    let senderClientId = null;
    const senderPlayer = players.get(data.senderId);
    if (senderPlayer) {
        senderClientId = senderPlayer.clientId;
    }
    
    // Determine recipients based on channel
    switch (data.channel) {
        case 'global':
            // Send to all clients
            broadcastToAll({
                type: MessageType.CHAT_MESSAGE,
                data
            });
            break;
            
        case 'local':
            // Send to nearby players (simplified - just send to all for now)
            broadcastToAll({
                type: MessageType.CHAT_MESSAGE,
                data
            });
            break;
            
        case 'party':
            // TODO: Implement party system
            // For now, just send to all
            broadcastToAll({
                type: MessageType.CHAT_MESSAGE,
                data
            });
            break;
            
        case 'guild':
            // TODO: Implement guild system
            // For now, just send to all
            broadcastToAll({
                type: MessageType.CHAT_MESSAGE,
                data
            });
            break;
            
        case 'whisper':
            // Send only to sender and target
            if (data.targetId) {
                // Find target client
                let targetClientId = null;
                const targetPlayer = players.get(data.targetId);
                
                if (targetPlayer) {
                    targetClientId = targetPlayer.clientId;
                }
                
                // Send to target
                if (targetClientId) {
                    const targetWs = clients.get(targetClientId);
                    if (targetWs && targetWs.readyState === WebSocket.OPEN) {
                        targetWs.send(JSON.stringify({
                            type: MessageType.CHAT_MESSAGE,
                            data
                        }));
                    }
                }
                
                // Send to sender (if not the same as target)
                if (senderClientId && senderClientId !== targetClientId) {
                    const senderWs = clients.get(senderClientId);
                    if (senderWs && senderWs.readyState === WebSocket.OPEN) {
                        senderWs.send(JSON.stringify({
                            type: MessageType.CHAT_MESSAGE,
                            data
                        }));
                    }
                }
            }
            break;
            
        default:
            console.warn('Unknown chat channel:', data.channel);
    }
}

/**
 * Handle combat event
 * @param {object} data Combat event data
 */
function handleCombatEvent(data) {
    // Broadcast combat event to all clients
    broadcastToAll({
        type: MessageType.COMBAT_EVENT,
        data
    });
}

/**
 * Handle environment update
 * @param {object} data Environment update data
 */
function handleEnvironmentUpdate(data) {
    // Broadcast environment update to all clients
    broadcastToAll({
        type: MessageType.ENVIRONMENT_UPDATE,
        data
    });
}

/**
 * Broadcast message to all connected clients
 * @param {object} message Message to broadcast
 * @param {string} excludeClientId Client ID to exclude (optional)
 */
function broadcastToAll(message, excludeClientId = null) {
    const messageStr = JSON.stringify(message);
    console.log(`Broadcasting message to all clients (excluding ${excludeClientId}):`, message.type);
    
    let sentCount = 0;
    clients.forEach((ws, clientId) => {
        if (clientId !== excludeClientId && ws.readyState === WebSocket.OPEN) {
            try {
                ws.send(messageStr);
                sentCount++;
            } catch (error) {
                console.error(`Failed to send message to client ${clientId}:`, error);
            }
        }
    });
    
    console.log(`Message broadcast complete. Sent to ${sentCount} clients.`);
}

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`MMO server running on port ${PORT}`);
});

// Add a simple status endpoint
app.get('/status', (req, res) => {
    res.json({
        status: 'online',
        clients: clients.size,
        players: players.size
    });
});

// Add a simple chat history endpoint
app.get('/chat-history', (req, res) => {
    res.json(chatHistory);
});

// Handle process termination
process.on('SIGINT', () => {
    console.log('Shutting down server...');
    
    // Close all WebSocket connections
    wss.clients.forEach(client => {
        client.close();
    });
    
    // Close HTTP server
    server.close(() => {
        console.log('Server shut down');
        process.exit(0);
    });
}); 