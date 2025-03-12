import { Scene } from 'phaser';
import { PlayerSystem } from './Player';
import { MapSystem } from './Map';
import { logger, LogCategory } from './Logger';

// Define types for remote player data
export interface RemotePlayerData {
    id: string;
    username: string;
    x: number;
    y: number;
    lat?: number;
    lon?: number;
    animation?: string;
    direction?: string;
    health: number;
    maxHealth: number;
    level: number;
    equipment?: Record<string, any>;
    lastUpdate: number;
}

// Define message types for server communication
export enum MessageType {
    CONNECT = 'connect',
    DISCONNECT = 'disconnect',
    PLAYER_UPDATE = 'player_update',
    PLAYER_LIST = 'player_list',
    CHAT_MESSAGE = 'chat_message',
    COMBAT_EVENT = 'combat_event',
    ENVIRONMENT_UPDATE = 'environment_update'
}

// Define chat message interface
export interface ChatMessage {
    id: string;
    senderId: string;
    senderName: string;
    content: string;
    timestamp: number;
    channel: 'global' | 'local' | 'party' | 'guild' | 'whisper';
    targetId?: string; // For whisper messages
}

/**
 * Generate a simple unique ID
 */
function generateId(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
}

/**
 * MMO System - Handles multiplayer functionality
 */
export class MMOSystem {
    private scene: Scene;
    private playerSystem: PlayerSystem;
    private mapSystem: MapSystem;
    
    // WebSocket connection
    private socket: WebSocket | null = null;
    private serverUrl: string = '';
    private connected: boolean = false;
    private reconnectAttempts: number = 0;
    private maxReconnectAttempts: number = 5;
    private reconnectDelay: number = 3000;
    
    // Player data
    private playerId: string = '';
    private username: string = '';
    private remotePlayers: Map<string, RemotePlayerData> = new Map();
    private remotePlayerSprites: Map<string, Phaser.Physics.Arcade.Sprite> = new Map();
    private remotePlayerHealthBars: Map<string, {
        background: Phaser.GameObjects.Rectangle;
        fill: Phaser.GameObjects.Rectangle;
        nameText: Phaser.GameObjects.Text;
    }> = new Map();
    
    // Update rate limiting
    private lastUpdateSent: number = 0;
    private updateInterval: number = 100; // Send updates every 100ms
    
    // Chat system
    private chatMessages: ChatMessage[] = [];
    private chatUI: Phaser.GameObjects.Container | null = null;
    private chatInput: HTMLInputElement | null = null;
    private chatVisible: boolean = false;
    
    constructor(scene: Scene) {
        this.scene = scene;
        
        // Get references to required systems
        const sceneAny = this.scene as any;
        this.playerSystem = sceneAny.playerSystem;
        this.mapSystem = sceneAny.mapSystem;
        
        // Generate a unique player ID if not already set
        this.playerId = localStorage.getItem('playerId') || generateId();
        localStorage.setItem('playerId', this.playerId);
        
        // Get username from local storage or prompt user
        this.username = localStorage.getItem('username') || 'Player_' + this.playerId.substring(0, 6);
    }
    
    /**
     * Initialize the MMO system
     * @param serverUrl The WebSocket server URL
     */
    initialize(serverUrl: string): void {
        this.serverUrl = serverUrl;
        this.connectToServer();
        this.setupChatUI();
    }
    
    /**
     * Connect to the WebSocket server
     */
    private connectToServer(): void {
        if (this.socket) {
            this.socket.close();
        }
        
        try {
            this.socket = new WebSocket(this.serverUrl);
            
            this.socket.onopen = () => {
                logger.info(LogCategory.GENERAL, 'Connected to MMO server');
                this.connected = true;
                this.reconnectAttempts = 0;
                
                // Send initial connection message with player data
                this.sendMessage(MessageType.CONNECT, {
                    id: this.playerId,
                    username: this.username,
                    position: this.getPlayerPosition()
                });
            };
            
            this.socket.onmessage = (event) => {
                this.handleServerMessage(event.data);
            };
            
            this.socket.onclose = () => {
                logger.info(LogCategory.GENERAL, 'Disconnected from MMO server');
                this.connected = false;
                this.handleDisconnect();
            };
            
            this.socket.onerror = (error) => {
                logger.error(LogCategory.GENERAL, 'WebSocket error:', error);
                this.connected = false;
            };
        } catch (error) {
            logger.error(LogCategory.GENERAL, 'Failed to connect to MMO server:', error);
            this.handleDisconnect();
        }
    }
    
    /**
     * Handle server disconnection and attempt reconnection
     */
    private handleDisconnect(): void {
        // Clear remote players
        this.clearRemotePlayers();
        
        // Attempt to reconnect
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            logger.info(LogCategory.GENERAL, `Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
            
            setTimeout(() => {
                this.connectToServer();
            }, this.reconnectDelay);
        } else {
            logger.error(LogCategory.GENERAL, 'Max reconnection attempts reached. Please refresh the page.');
            // Show reconnection message to player
            const gameScene = this.scene as any;
            if (gameScene.popupSystem) {
                gameScene.popupSystem.showPopup({
                    title: 'Connection Lost',
                    content: 'Failed to connect to the MMO server. Please refresh the page to try again.',
                    buttons: [{
                        text: 'OK',
                        callback: () => {}
                    }]
                });
            }
        }
    }
    
    /**
     * Send a message to the server
     * @param type Message type
     * @param data Message data
     */
    private sendMessage(type: MessageType, data: any): void {
        if (!this.connected || !this.socket) return;
        
        try {
            const message = JSON.stringify({
                type,
                data
            });
            
            this.socket.send(message);
        } catch (error) {
            logger.error(LogCategory.GENERAL, 'Failed to send message:', error);
        }
    }
    
    /**
     * Handle incoming server messages
     * @param data Message data
     */
    private handleServerMessage(data: string): void {
        try {
            const message = JSON.parse(data);
            
            switch (message.type) {
                case MessageType.PLAYER_LIST:
                    this.handlePlayerList(message.data);
                    break;
                    
                case MessageType.PLAYER_UPDATE:
                    this.handlePlayerUpdate(message.data);
                    break;
                    
                case MessageType.CHAT_MESSAGE:
                    this.handleChatMessage(message.data);
                    break;
                    
                case MessageType.COMBAT_EVENT:
                    this.handleCombatEvent(message.data);
                    break;
                    
                case MessageType.ENVIRONMENT_UPDATE:
                    this.handleEnvironmentUpdate(message.data);
                    break;
                    
                default:
                    logger.warn(LogCategory.GENERAL, 'Unknown message type:', message.type);
            }
        } catch (error) {
            logger.error(LogCategory.GENERAL, 'Failed to parse server message:', error);
        }
    }
    
    /**
     * Handle player list update from server
     * @param players List of remote players
     */
    private handlePlayerList(players: RemotePlayerData[]): void {
        // Clear existing remote players
        this.clearRemotePlayers();
        
        // Add new remote players
        players.forEach(playerData => {
            // Skip our own player
            if (playerData.id === this.playerId) return;
            
            this.remotePlayers.set(playerData.id, playerData);
            this.createRemotePlayerSprite(playerData);
        });
    }
    
    /**
     * Handle player update from server
     * @param playerData Updated player data
     */
    private handlePlayerUpdate(playerData: RemotePlayerData): void {
        // Skip our own player
        if (playerData.id === this.playerId) return;
        
        // Update or add remote player
        this.remotePlayers.set(playerData.id, playerData);
        
        // Update or create sprite
        if (this.remotePlayerSprites.has(playerData.id)) {
            this.updateRemotePlayerSprite(playerData);
        } else {
            this.createRemotePlayerSprite(playerData);
        }
    }
    
    /**
     * Handle chat message from server
     * @param message Chat message
     */
    private handleChatMessage(message: ChatMessage): void {
        logger.info(LogCategory.GENERAL, 'Received chat message:', message);
        
        // Check if this is a confirmation of a message we sent
        const isPendingMessage = message.id.startsWith('pending-');
        const isConfirmationOfPending = !isPendingMessage && this.chatMessages.some(
            m => m.id === `pending-${message.id}` || 
                (m.id.startsWith('pending-') && 
                 m.senderId === message.senderId && 
                 m.timestamp === message.timestamp)
        );
        
        // If this is a confirmation, remove the pending message
        if (isConfirmationOfPending) {
            logger.info(LogCategory.GENERAL, 'Received confirmation for pending message');
            this.chatMessages = this.chatMessages.filter(m => 
                !(m.id.startsWith('pending-') && 
                  m.senderId === message.senderId && 
                  m.timestamp === message.timestamp)
            );
        }
        
        // Add message to chat history (unless it's a duplicate)
        const isDuplicate = this.chatMessages.some(m => 
            m.id === message.id || 
            (m.senderId === message.senderId && 
             m.content === message.content && 
             Math.abs(m.timestamp - message.timestamp) < 1000)
        );
        
        if (!isDuplicate || isPendingMessage) {
            this.chatMessages.push(message);
            
            // Limit chat history to 100 messages
            if (this.chatMessages.length > 100) {
                this.chatMessages.shift();
            }
        } else {
            logger.info(LogCategory.GENERAL, 'Ignoring duplicate message');
            return;
        }
        
        // Update chat UI
        this.updateChatUI();
        
        // Show chat if it's not visible and this is a new message
        if (!this.chatVisible && !isPendingMessage && !isConfirmationOfPending) {
            // Show notification
            this.showChatNotification(message);
            
            // Increment unread message count in menu
            this.incrementUnreadMessageCount();
        }
    }
    
    /**
     * Increment unread message count in the menu
     */
    private incrementUnreadMessageCount(): void {
        const gameScene = this.scene as any;
        if (gameScene.medievalMenu) {
            gameScene.medievalMenu.incrementUnreadMessages();
        }
    }
    
    /**
     * Handle combat event from server
     * @param event Combat event data
     */
    private handleCombatEvent(event: any): void {
        // Implement combat event handling
        logger.info(LogCategory.GENERAL, 'Combat event:', event);
    }
    
    /**
     * Handle environment update from server
     * @param update Environment update data
     */
    private handleEnvironmentUpdate(update: any): void {
        // Implement environment update handling
        logger.info(LogCategory.GENERAL, 'Environment update:', update);
    }
    
    /**
     * Create a sprite for a remote player
     * @param playerData Remote player data
     */
    private createRemotePlayerSprite(playerData: RemotePlayerData): void {
        // Convert geo coordinates to screen coordinates if needed
        let posX = playerData.x;
        let posY = playerData.y;
        
        if (playerData.lat && playerData.lon && this.mapSystem) {
            const screenCoords = this.mapSystem.geoToScreenCoordinates(playerData.lat, playerData.lon);
            if (screenCoords) {
                posX = screenCoords.x;
                posY = screenCoords.y;
            }
        }
        
        // Create sprite
        const sprite = this.scene.physics.add.sprite(posX, posY, 'player');
        sprite.setDepth(10);
        
        // Store sprite
        this.remotePlayerSprites.set(playerData.id, sprite);
        
        // Create health bar
        this.createRemotePlayerHealthBar(playerData, sprite);
    }
    
    /**
     * Update a remote player sprite
     * @param playerData Remote player data
     */
    private updateRemotePlayerSprite(playerData: RemotePlayerData): void {
        const sprite = this.remotePlayerSprites.get(playerData.id);
        if (!sprite) return;
        
        // Convert geo coordinates to screen coordinates if needed
        let posX = playerData.x;
        let posY = playerData.y;
        
        if (playerData.lat && playerData.lon && this.mapSystem) {
            const screenCoords = this.mapSystem.geoToScreenCoordinates(playerData.lat, playerData.lon);
            if (screenCoords) {
                posX = screenCoords.x;
                posY = screenCoords.y;
            }
        }
        
        // Update position with smooth transition
        this.scene.tweens.add({
            targets: sprite,
            x: posX,
            y: posY,
            duration: 100,
            ease: 'Linear'
        });
        
        // Update animation if provided
        if (playerData.animation) {
            sprite.play(playerData.animation, true);
        }
        
        // Update health bar
        this.updateRemotePlayerHealthBar(playerData);
    }
    
    /**
     * Create health bar for remote player
     * @param playerData Remote player data
     * @param sprite Remote player sprite
     */
    private createRemotePlayerHealthBar(playerData: RemotePlayerData, sprite: Phaser.Physics.Arcade.Sprite): void {
        const width = 50;
        const height = 6;
        const padding = 2;
        
        // Create background
        const background = this.scene.add.rectangle(
            sprite.x,
            sprite.y - 30,
            width,
            height,
            0x000000,
            0.8
        );
        background.setDepth(11);
        
        // Create fill
        const fill = this.scene.add.rectangle(
            sprite.x - width / 2 + padding,
            sprite.y - 30,
            width - padding * 2,
            height - padding * 2,
            0x00ff00,
            1
        );
        fill.setOrigin(0, 0.5);
        fill.setDepth(12);
        
        // Create name text
        const nameText = this.scene.add.text(
            sprite.x,
            sprite.y - 40,
            playerData.username,
            {
                fontSize: '12px',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 3
            }
        );
        nameText.setOrigin(0.5);
        nameText.setDepth(12);
        
        // Store health bar elements
        this.remotePlayerHealthBars.set(playerData.id, {
            background,
            fill,
            nameText
        });
        
        // Update health bar
        this.updateRemotePlayerHealthBar(playerData);
    }
    
    /**
     * Update health bar for remote player
     * @param playerData Remote player data
     */
    private updateRemotePlayerHealthBar(playerData: RemotePlayerData): void {
        const healthBar = this.remotePlayerHealthBars.get(playerData.id);
        if (!healthBar) return;
        
        const sprite = this.remotePlayerSprites.get(playerData.id);
        if (!sprite) return;
        
        const { background, fill, nameText } = healthBar;
        const width = 50;
        const padding = 2;
        
        // Update position
        background.setPosition(sprite.x, sprite.y - 30);
        fill.setPosition(sprite.x - width / 2 + padding, sprite.y - 30);
        nameText.setPosition(sprite.x, sprite.y - 40);
        
        // Update health
        const healthPercent = playerData.health / playerData.maxHealth;
        const fillWidth = (width - padding * 2) * healthPercent;
        fill.width = fillWidth;
        
        // Update color based on health
        if (healthPercent > 0.6) {
            fill.setFillStyle(0x00ff00);
        } else if (healthPercent > 0.3) {
            fill.setFillStyle(0xffff00);
        } else {
            fill.setFillStyle(0xff0000);
        }
    }
    
    /**
     * Clear all remote players
     */
    private clearRemotePlayers(): void {
        // Destroy sprites
        this.remotePlayerSprites.forEach(sprite => {
            sprite.destroy();
        });
        this.remotePlayerSprites.clear();
        
        // Destroy health bars
        this.remotePlayerHealthBars.forEach(healthBar => {
            healthBar.background.destroy();
            healthBar.fill.destroy();
            healthBar.nameText.destroy();
        });
        this.remotePlayerHealthBars.clear();
        
        // Clear data
        this.remotePlayers.clear();
    }
    
    /**
     * Get current player position
     */
    private getPlayerPosition(): { x: number; y: number; lat?: number; lon?: number } {
        const player = this.playerSystem.player;
        const position: { x: number; y: number; lat?: number; lon?: number } = {
            x: player.x,
            y: player.y
        };
        
        // Add geo coordinates if available
        if (this.mapSystem) {
            const geoPosition = this.mapSystem.getExactPlayerPosition(player.x, player.y);
            if (geoPosition) {
                position.lat = geoPosition.lat;
                position.lon = geoPosition.lon;
            }
        }
        
        return position;
    }
    
    /**
     * Update method called every frame
     */
    update(time: number, delta: number): void {
        // Ensure game inputs are enabled when chat is not visible
        if (!this.chatVisible && this.scene.input && this.scene.input.keyboard && !this.scene.input.keyboard.enabled) {
            this.enableGameInput();
        }
        
        // Rest of the update method...
        if (!this.connected || !this.socket) {
            return;
        }
        
        // Only send updates at the specified interval
        if (time - this.lastUpdateSent > this.updateInterval) {
            this.lastUpdateSent = time;
            
            // Get player position
            const position = this.getPlayerPosition();
            
            // Get player data from the player system
            const playerSystem = this.playerSystem;
            if (!playerSystem || !playerSystem.player) {
                return;
            }
            
            // Send player update to server
            this.sendMessage(MessageType.PLAYER_UPDATE, {
                id: this.playerId,
                username: this.username,
                x: position.x,
                y: position.y,
                lat: position.lat,
                lon: position.lon,
                health: (this.scene as any).playerStats?.health || 100,
                maxHealth: (this.scene as any).playerStats?.maxHealth || 100,
                level: (this.scene as any).playerStats?.level || 1,
                // Add more player data as needed
            });
        }
        
        // Update remote player sprites
        this.updateRemotePlayerSprites();
    }
    
    /**
     * Update remote player sprites
     */
    private updateRemotePlayerSprites(): void {
        // Remove stale players (not updated in the last 10 seconds)
        const now = Date.now();
        const staleThreshold = 10000;
        
        this.remotePlayers.forEach((playerData, id) => {
            if (now - playerData.lastUpdate > staleThreshold) {
                // Remove sprite
                const sprite = this.remotePlayerSprites.get(id);
                if (sprite) sprite.destroy();
                this.remotePlayerSprites.delete(id);
                
                // Remove health bar
                const healthBar = this.remotePlayerHealthBars.get(id);
                if (healthBar) {
                    healthBar.background.destroy();
                    healthBar.fill.destroy();
                    healthBar.nameText.destroy();
                }
                this.remotePlayerHealthBars.delete(id);
                
                // Remove data
                this.remotePlayers.delete(id);
            }
        });
    }
    
    /**
     * Set up chat UI
     */
    private setupChatUI(): void {
        logger.info(LogCategory.GENERAL, 'Setting up chat UI');
        
        // Create chat container
        this.chatUI = this.scene.add.container(10, this.scene.cameras.main.height - 160);
        this.chatUI.setDepth(100);
        
        // Create chat background
        const background = this.scene.add.rectangle(
            0,
            0,
            300,
            150,
            0x000000,
            0.7
        );
        background.setOrigin(0);
        this.chatUI.add(background);
        
        // Create chat input element
        this.createChatInput();
        
        // Update chat UI
        this.updateChatUI();
        
        // Make chat hidden by default
        this.toggleChat(false);
        
        // Add system message to confirm chat is working
        this.addSystemMessage('Chat system initialized. Press Enter to toggle chat input.');
        
        // Add chat toggle key
        const enterKey = this.scene.input.keyboard?.addKey('ENTER');
        if (enterKey) {
            enterKey.on('down', () => {
                this.toggleChat(!this.chatVisible);
            });
        }
    }
    
    /**
     * Create chat input element
     */
    private createChatInput(): void {
        // Create input element
        this.chatInput = document.createElement('input');
        this.chatInput.type = 'text';
        this.chatInput.placeholder = 'Type your message...';
        this.chatInput.style.position = 'absolute';
        this.chatInput.style.bottom = '10px';
        this.chatInput.style.left = '10px';
        this.chatInput.style.width = '280px';
        this.chatInput.style.padding = '5px';
        this.chatInput.style.border = 'none';
        this.chatInput.style.borderRadius = '3px';
        this.chatInput.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        this.chatInput.style.color = 'white';
        this.chatInput.style.display = 'none';
        
        // Add to DOM
        document.body.appendChild(this.chatInput);
        
        // Add event listeners
        this.chatInput.addEventListener('keydown', this.handleChatKeyDown);
        this.chatInput.addEventListener('focus', this.handleChatFocus);
        this.chatInput.addEventListener('blur', this.handleChatBlur);
        this.chatInput.addEventListener('mousedown', this.handleChatMouseDown);
    }
    
    /**
     * Handle keydown events in the chat input
     */
    private handleChatKeyDown = (event: KeyboardEvent): void => {
        // Prevent event propagation to stop game from receiving input
        event.stopPropagation();
        
        if (event.key === 'Enter') {
            this.sendChatMessage();
            event.preventDefault();
        } else if (event.key === 'Escape') {
            this.toggleChat(false);
            event.preventDefault();
        }
    };
    
    /**
     * Handle focus events in the chat input
     */
    private handleChatFocus = (): void => {
        logger.info(LogCategory.GENERAL, 'Chat input focused, disabling game input');
        this.disableGameInput();
    };
    
    /**
     * Handle blur events in the chat input
     */
    private handleChatBlur = (): void => {
        logger.info(LogCategory.GENERAL, 'Chat input blurred, enabling game input');
        this.enableGameInput();
    };
    
    /**
     * Handle mousedown events in the chat input
     */
    private handleChatMouseDown = (event: MouseEvent): void => {
        // Prevent the game from receiving the click
        event.stopPropagation();
    };
    
    /**
     * Update chat UI with latest messages
     */
    private updateChatUI(): void {
        logger.info(LogCategory.GENERAL, 'Updating chat UI, messages count:', this.chatMessages.length);
        
        const chatUI = this.chatUI;
        if (!chatUI) {
            logger.error(LogCategory.GENERAL, 'Chat UI container is null');
            return;
        }
        
        // Clear existing messages
        const textObjects = chatUI.getAll('type', 'Text');
        logger.info(LogCategory.GENERAL, 'Existing text objects:', textObjects ? textObjects.length : 0);
        
        if (textObjects && textObjects.length > 0) {
            textObjects.forEach(text => {
                if (chatUI) {
                    chatUI.remove(text, true);
                }
            });
        }
        
        // Add latest messages (last 10)
        const visibleMessages = this.chatMessages.slice(-10);
        logger.info(LogCategory.GENERAL, 'Visible messages to display:', visibleMessages.length);
        
        visibleMessages.forEach((message, index) => {
            if (!chatUI) return;
            
            const y = 10 + index * 14;
            
            // Format message based on channel
            let prefix = '';
            let color = '#ffffff';
            
            switch (message.channel) {
                case 'global':
                    prefix = '[Global] ';
                    color = '#ffffff';
                    break;
                case 'local':
                    prefix = '[Local] ';
                    color = '#aaffaa';
                    break;
                case 'party':
                    prefix = '[Party] ';
                    color = '#aaaaff';
                    break;
                case 'guild':
                    prefix = '[Guild] ';
                    color = '#ffaaff';
                    break;
                case 'whisper':
                    prefix = '[Whisper] ';
                    color = '#ffaaaa';
                    break;
            }
            
            const displayText = `${prefix}${message.senderName}: ${message.content}`;
            logger.info(LogCategory.GENERAL, 'Adding message to UI:', displayText);
            
            // Create text
            const text = this.scene.add.text(
                10,
                y,
                displayText,
                {
                    fontSize: '12px',
                    color,
                    stroke: '#000000',
                    strokeThickness: 3,
                    wordWrap: { width: 280 }
                }
            );
            
            chatUI.add(text);
        });
        
        logger.info(LogCategory.GENERAL, 'Chat UI updated, visible:', this.chatVisible);
    }
    
    /**
     * Toggle chat visibility
     * @param visible Whether chat should be visible
     */
    private toggleChat(visible: boolean): void {
        logger.info(LogCategory.GENERAL, `Toggling chat ${visible ? 'visible' : 'hidden'}`);
        this.chatVisible = visible;
        
        if (this.chatUI) {
            this.chatUI.setVisible(visible);
        }
        
        if (this.chatInput) {
            this.chatInput.style.display = visible ? 'block' : 'none';
            
            if (visible) {
                // Focus the chat input, which will trigger the focus event
                // and disable game input
                this.chatInput.focus();
            } else {
                // Blur the chat input, which will trigger the blur event
                // and enable game input
                this.chatInput.blur();
                
                // Ensure game input is enabled when chat is hidden
                this.enableGameInput();
            }
        }
    }
    
    /**
     * Disable game keyboard input
     */
    private disableGameInput(): void {
        // Disable keyboard input in the game scene
        if (this.scene.input && this.scene.input.keyboard) {
            logger.info(LogCategory.GENERAL, 'Disabling game keyboard input for chat');
            this.scene.input.keyboard.enabled = false;
        }
    }
    
    /**
     * Enable game keyboard input
     */
    private enableGameInput(): void {
        // Re-enable keyboard input in the game scene
        if (this.scene.input && this.scene.input.keyboard) {
            logger.info(LogCategory.GENERAL, 'Re-enabling game keyboard input');
            this.scene.input.keyboard.enabled = true;
        }
    }
    
    /**
     * Send a chat message
     */
    public sendChatMessage(): void {
        if (!this.chatInput || !this.chatInput.value.trim()) return;
        
        const content = this.chatInput.value.trim();
        this.chatInput.value = '';
        
        // Determine channel based on message prefix
        let channel: 'global' | 'local' | 'party' | 'guild' | 'whisper' = 'local';
        let targetId: string | undefined;
        let actualContent = content;
        
        if (content.startsWith('/g ')) {
            channel = 'global';
            actualContent = content.substring(3);
        } else if (content.startsWith('/p ')) {
            channel = 'party';
            actualContent = content.substring(3);
        } else if (content.startsWith('/gu ')) {
            channel = 'guild';
            actualContent = content.substring(4);
        } else if (content.startsWith('/w ')) {
            // Whisper format: /w PlayerName Message
            channel = 'whisper';
            const parts = content.substring(3).split(' ');
            const targetName = parts[0];
            actualContent = parts.slice(1).join(' ');
            
            // Find target player ID by name
            for (const [id, playerData] of this.remotePlayers.entries()) {
                if (playerData.username.toLowerCase() === targetName.toLowerCase()) {
                    targetId = id;
                    break;
                }
            }
            
            if (!targetId) {
                // Show error message
                this.addSystemMessage(`Player "${targetName}" not found.`);
                return;
            }
        }
        
        // Create message
        const message: ChatMessage = {
            id: generateId(),
            senderId: this.playerId,
            senderName: this.username,
            content: actualContent,
            timestamp: Date.now(),
            channel,
            targetId
        };
        
        logger.info(LogCategory.GENERAL, 'Sending chat message to server:', message);
        
        // Send to server
        this.sendMessage(MessageType.CHAT_MESSAGE, message);
        
        // Show a temporary local version of the message with "Sending..." indicator
        // This gives immediate feedback to the user
        const pendingMessage: ChatMessage = {
            ...message,
            id: `pending-${message.id}`,
            content: `${actualContent} (Sending...)`
        };
        
        // Add pending message to chat
        this.handleChatMessage(pendingMessage);
        
        // Remove the pending message when the real one comes back from server
        // This is handled in handleChatMessage method
    }
    
    /**
     * Add a system message to chat
     * @param content Message content
     */
    public addSystemMessage(content: string): void {
        const message: ChatMessage = {
            id: generateId(),
            senderId: 'system',
            senderName: 'System',
            content,
            timestamp: Date.now(),
            channel: 'global'
        };
        
        this.handleChatMessage(message);
    }
    
    /**
     * Show a notification for a new chat message
     * @param message Chat message
     */
    private showChatNotification(message: ChatMessage): void {
        // Create notification text
        const notification = this.scene.add.text(
            10,
            this.scene.cameras.main.height - 30,
            `${message.senderName}: ${message.content}`,
            {
                fontSize: '12px',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 3,
                wordWrap: { width: 280 }
            }
        );
        notification.setDepth(100);
        
        // Fade out after 5 seconds
        this.scene.tweens.add({
            targets: notification,
            alpha: 0,
            duration: 1000,
            delay: 5000,
            onComplete: () => {
                notification.destroy();
            }
        });
    }
    
    /**
     * Clean up resources when scene is destroyed
     */
    destroy(): void {
        logger.info(LogCategory.GENERAL, 'Destroying MMO system');
        
        // Close WebSocket
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
        
        // Clear remote players
        this.clearRemotePlayers();
        
        // Remove chat input
        if (this.chatInput) {
            // Remove event listeners
            this.chatInput.removeEventListener('keydown', this.handleChatKeyDown);
            this.chatInput.removeEventListener('focus', this.handleChatFocus);
            this.chatInput.removeEventListener('blur', this.handleChatBlur);
            this.chatInput.removeEventListener('mousedown', this.handleChatMouseDown);
            
            // Remove from DOM
            document.body.removeChild(this.chatInput);
            this.chatInput = null;
        }
        
        // Ensure game input is enabled
        this.enableGameInput();
        
        // Remove window resize listener
        window.removeEventListener('resize', this.handleResize);
        
        // Destroy chat UI
        if (this.chatUI) {
            this.chatUI.destroy();
            this.chatUI = null;
        }
    }
    
    /**
     * Handle window resize
     */
    private handleResize = (): void => {
        if (this.chatUI) {
            this.chatUI.setPosition(10, this.scene.cameras.main.height - 160);
        }
        
        if (this.chatInput) {
            this.chatInput.style.bottom = '10px';
        }
    };
    
    /**
     * Show the chat UI (public method for external access)
     */
    public showChat(): void {
        this.toggleChat(true);
    }
} 