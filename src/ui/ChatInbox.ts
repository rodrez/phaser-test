import type { Scene } from 'phaser';
import { DOMUIHelper } from './DOMUIHelper';
import type { ChatMessage } from '../systems/MMO';
import type { Game } from '../scenes/Game';
import { logger, LogCategory } from '../systems/Logger';

/**
 * Options for the chat inbox
 */
export interface ChatInboxOptions {
    width?: string;
    height?: string;
    position?: 'left' | 'right' | 'top' | 'bottom';
}

/**
 * ChatInbox - A medieval-themed chat inbox UI
 * This class creates a DOM-based chat UI with customizable options
 */
export class ChatInbox {
    private scene: Scene;
    private gameScene: Game;
    private uiHelper: DOMUIHelper;
    
    // DOM Elements
    private container: HTMLDivElement;
    private header: HTMLDivElement;
    private messageList: HTMLDivElement;
    private inputContainer: HTMLDivElement;
    private chatInput: HTMLInputElement;
    private sendButton: HTMLButtonElement;
    private channelSelector: HTMLSelectElement;
    private closeButton: HTMLButtonElement;
    
    // State
    private isVisible = false;
    private options: Required<ChatInboxOptions>;
    private activeChannel: 'global' | 'local' | 'party' | 'guild' | 'whisper' = 'global';
    private targetPlayer: string = '';
    
    constructor(scene: Scene, options: ChatInboxOptions = {}) {
        this.scene = scene;
        this.gameScene = scene as Game;
        this.uiHelper = new DOMUIHelper(scene);
        
        // Set default options
        this.options = {
            width: options.width || '400px',
            height: options.height || '500px',
            position: options.position || 'right'
        };
        
        // Load the CSS files
        this.uiHelper.loadCSS('/styles/chat-inbox.css');
        
        // Ensure visibility state is set to false initially
        this.isVisible = false;
        
        // Create the main container
        this.createContainer();
        
        // Create the UI elements
        this.createHeader();
        this.createMessageList();
        this.createInputContainer();
        
        // Set up event listeners
        this.setupEventListeners();
        
        logger.info(LogCategory.CHAT, '[ChatInbox] Initialized with visibility:', this.isVisible);
    }
    
    /**
     * Creates the main container
     */
    private createContainer(): void {
        this.container = this.uiHelper.createElement<HTMLDivElement>('div', 'chat-inbox-container');
        
        // Apply styles
        const styles: Partial<CSSStyleDeclaration> = {
            position: 'fixed',
            width: this.options.width,
            height: this.options.height,
            background: 'rgba(30, 30, 30, 0.9)',
            border: '2px solid #8b7250',
            borderRadius: '8px',
            boxShadow: '0 0 10px rgba(0, 0, 0, 0.5)',
            zIndex: '1000',
            display: 'none',
            flexDirection: 'column',
            overflow: 'hidden',
            fontFamily: 'serif',
            color: '#e0d0b0'
        };
        
        // Position the container based on options
        switch (this.options.position) {
            case 'left':
                styles.left = '20px';
                styles.top = '50%';
                styles.transform = 'translateY(-50%)';
                break;
            case 'right':
                styles.right = '20px';
                styles.top = '50%';
                styles.transform = 'translateY(-50%)';
                break;
            case 'top':
                styles.top = '20px';
                styles.left = '50%';
                styles.transform = 'translateX(-50%)';
                break;
            case 'bottom':
                styles.bottom = '20px';
                styles.left = '50%';
                styles.transform = 'translateX(-50%)';
                break;
        }
        
        // Apply styles
        Object.assign(this.container.style, styles);
        
        // Add to DOM
        document.body.appendChild(this.container);
    }
    
    /**
     * Creates the header
     */
    private createHeader(): void {
        this.header = this.uiHelper.createElement<HTMLDivElement>('div', 'chat-inbox-header');
        
        // Style the header
        const styles: Partial<CSSStyleDeclaration> = {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '10px 15px',
            backgroundColor: '#2c2117',
            borderBottom: '2px solid #8b7250',
            borderTopLeftRadius: '8px',
            borderTopRightRadius: '8px',
            color: '#d9c8a9',
            fontFamily: 'serif',
            fontWeight: 'bold'
        };
        
        Object.assign(this.header.style, styles);
        
        // Create header title
        const headerTitle = this.uiHelper.createElement<HTMLDivElement>('div', 'chat-inbox-title');
        headerTitle.innerText = 'Chat';
        headerTitle.style.fontSize = '18px';
        
        // Create header controls container
        const headerControls = this.uiHelper.createElement<HTMLDivElement>('div', 'chat-inbox-controls');
        headerControls.style.display = 'flex';
        headerControls.style.alignItems = 'center';
        headerControls.style.gap = '10px';
        
        // Create close button
        this.closeButton = this.uiHelper.createElement<HTMLButtonElement>('button', 'chat-inbox-close');
        this.closeButton.innerHTML = '✕';
        
        const closeButtonStyles: Partial<CSSStyleDeclaration> = {
            background: 'transparent',
            border: 'none',
            color: '#d9c8a9',
            fontSize: '18px',
            cursor: 'pointer',
            padding: '2px 6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'color 0.2s ease'
        };
        
        Object.assign(this.closeButton.style, closeButtonStyles);
        
        // Hover effect for close button
        this.closeButton.addEventListener('mouseover', () => {
            this.closeButton.style.color = '#ff8c69';
        });
        
        this.closeButton.addEventListener('mouseout', () => {
            this.closeButton.style.color = '#d9c8a9';
        });
        
        // Add click event to close button
        this.closeButton.addEventListener('click', (event) => {
            logger.info(LogCategory.CHAT, '[ChatInbox] Close button clicked');
            event.stopPropagation(); // Prevent event bubbling
            this.hide();
        });
        
        // Add elements to header
        headerControls.appendChild(this.closeButton);
        this.header.appendChild(headerTitle);
        this.header.appendChild(headerControls);
        this.container.appendChild(this.header);
    }
    
    /**
     * Creates the message list
     */
    private createMessageList(): void {
        this.messageList = this.uiHelper.createElement<HTMLDivElement>('div', 'chat-inbox-message-list');
        
        // Apply styles
        const styles: Partial<CSSStyleDeclaration> = {
            flex: '1',
            overflowY: 'auto',
            padding: '10px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
        };
        
        Object.assign(this.messageList.style, styles);
        
        // Add to container
        this.container.appendChild(this.messageList);
    }
    
    /**
     * Creates the input container
     */
    private createInputContainer(): void {
        this.inputContainer = this.uiHelper.createElement<HTMLDivElement>('div', 'chat-inbox-input-container');
        
        // Apply styles
        const styles: Partial<CSSStyleDeclaration> = {
            display: 'flex',
            flexDirection: 'column',
            padding: '10px',
            borderTop: '1px solid #8b7250',
            background: 'rgba(50, 40, 30, 0.8)'
        };
        
        Object.assign(this.inputContainer.style, styles);
        
        // Create channel selector
        const channelContainer = this.uiHelper.createElement<HTMLDivElement>('div', 'chat-inbox-channel-container');
        channelContainer.style.display = 'flex';
        channelContainer.style.marginBottom = '10px';
        
        const channelLabel = this.uiHelper.createElement<HTMLLabelElement>('label', 'chat-inbox-channel-label');
        channelLabel.textContent = 'Channel:';
        channelLabel.style.marginRight = '10px';
        
        this.channelSelector = this.uiHelper.createElement<HTMLSelectElement>('select', 'chat-inbox-channel-selector');
        this.channelSelector.style.flex = '1';
        this.channelSelector.style.background = 'rgba(30, 30, 30, 0.8)';
        this.channelSelector.style.color = '#e0d0b0';
        this.channelSelector.style.border = '1px solid #8b7250';
        this.channelSelector.style.padding = '5px';
        this.channelSelector.style.borderRadius = '4px';
        
        // Add channel options
        const channels = [
            { value: 'global', label: 'Global' },
            { value: 'local', label: 'Local' },
            { value: 'party', label: 'Party' },
            { value: 'guild', label: 'Guild' },
            { value: 'whisper', label: 'Whisper' }
        ];
        
        channels.forEach(channel => {
            const option = document.createElement('option');
            option.value = channel.value;
            option.textContent = channel.label;
            this.channelSelector.appendChild(option);
        });
        
        // Add whisper target input (hidden initially)
        const whisperContainer = this.uiHelper.createElement<HTMLDivElement>('div', 'chat-inbox-whisper-container');
        whisperContainer.style.display = 'none';
        whisperContainer.style.marginBottom = '10px';
        
        const whisperLabel = this.uiHelper.createElement<HTMLLabelElement>('label', 'chat-inbox-whisper-label');
        whisperLabel.textContent = 'To:';
        whisperLabel.style.marginRight = '10px';
        
        const whisperInput = this.uiHelper.createElement<HTMLInputElement>('input', 'chat-inbox-whisper-input');
        whisperInput.type = 'text';
        whisperInput.placeholder = 'Enter player name';
        whisperInput.style.flex = '1';
        whisperInput.style.background = 'rgba(30, 30, 30, 0.8)';
        whisperInput.style.color = '#e0d0b0';
        whisperInput.style.border = '1px solid #8b7250';
        whisperInput.style.padding = '5px';
        whisperInput.style.borderRadius = '4px';
        
        whisperContainer.appendChild(whisperLabel);
        whisperContainer.appendChild(whisperInput);
        
        // Show whisper input when whisper channel is selected
        this.channelSelector.addEventListener('change', () => {
            this.activeChannel = this.channelSelector.value as any;
            whisperContainer.style.display = this.activeChannel === 'whisper' ? 'flex' : 'none';
            
            if (this.activeChannel === 'whisper') {
                whisperInput.focus();
            }
        });
        
        // Store whisper target when input changes
        whisperInput.addEventListener('input', () => {
            this.targetPlayer = whisperInput.value;
        });
        
        channelContainer.appendChild(channelLabel);
        channelContainer.appendChild(this.channelSelector);
        
        // Create input and send button
        const messageContainer = this.uiHelper.createElement<HTMLDivElement>('div', 'chat-inbox-message-container');
        messageContainer.style.display = 'flex';
        
        this.chatInput = this.uiHelper.createElement<HTMLInputElement>('input', 'chat-inbox-input');
        this.chatInput.type = 'text';
        this.chatInput.placeholder = 'Type your message...';
        this.chatInput.style.flex = '1';
        this.chatInput.style.background = 'rgba(30, 30, 30, 0.8)';
        this.chatInput.style.color = '#e0d0b0';
        this.chatInput.style.border = '1px solid #8b7250';
        this.chatInput.style.padding = '8px';
        this.chatInput.style.borderRadius = '4px';
        
        this.sendButton = this.uiHelper.createElement<HTMLButtonElement>('button', 'chat-inbox-send');
        this.sendButton.textContent = 'Send';
        this.sendButton.style.marginLeft = '10px';
        this.sendButton.style.background = '#8b7250';
        this.sendButton.style.color = '#e0d0b0';
        this.sendButton.style.border = 'none';
        this.sendButton.style.padding = '8px 15px';
        this.sendButton.style.borderRadius = '4px';
        this.sendButton.style.cursor = 'pointer';
        
        messageContainer.appendChild(this.chatInput);
        messageContainer.appendChild(this.sendButton);
        
        // Add elements to input container
        this.inputContainer.appendChild(channelContainer);
        this.inputContainer.appendChild(whisperContainer);
        this.inputContainer.appendChild(messageContainer);
        
        // Add input container to main container
        this.container.appendChild(this.inputContainer);
    }
    
    /**
     * Set up event listeners
     */
    private setupEventListeners(): void {
        // Send message on button click
        this.sendButton.addEventListener('click', () => {
            this.sendMessage();
        });
        
        // Send message on Enter key, close on Escape key
        this.chatInput.addEventListener('keydown', (event) => {
            // Prevent event propagation to stop game from receiving input
            event.stopPropagation();
            
            if (event.key === 'Enter') {
                this.sendMessage();
                event.preventDefault();
            } else if (event.key === 'Escape') {
                this.hide();
                event.preventDefault();
            }
        });
        
        // Prevent keyboard events from propagating to the game
        this.container.addEventListener('keydown', (event) => {
            event.stopPropagation();
        });
        
        // Prevent focus loss when clicking inside the container
        this.container.addEventListener('mousedown', (event) => {
            // Prevent the game from receiving the click
            event.stopPropagation();
        });
        
        // Re-focus chat input when clicking anywhere in the chat container
        this.container.addEventListener('click', (event) => {
            // Don't refocus if clicking on a button or select
            const target = event.target as HTMLElement;
            if (target.tagName !== 'BUTTON' && target.tagName !== 'SELECT') {
                this.chatInput.focus();
            }
        });
        
        // Add document click handler to close chat when clicking outside
        document.addEventListener('mousedown', this.handleDocumentClick);
        
        // Add escape key functionality to close chat
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && this.isVisible) {
                this.hide();
            }
        });
    }
    
    /**
     * Handle document click to close chat when clicking outside
     */
    private handleDocumentClick = (event: MouseEvent): void => {
        logger.info(LogCategory.CHAT, '[ChatInbox] Document click detected');
        
        // If chat is not visible, do nothing
        if (!this.isVisible) {
            return;
        }
        
        // Check if click is inside the chat inbox
        if (this.container && !this.container.contains(event.target as Node)) {
            logger.info(LogCategory.CHAT, '[ChatInbox] Click outside chat inbox detected, hiding');
            this.hide();
        } else {
            logger.info(LogCategory.CHAT, '[ChatInbox] Click inside chat inbox, keeping open');
        }
    };
    
    /**
     * Send a chat message
     */
    private sendMessage(): void {
        const content = this.chatInput.value.trim();
        if (!content) return;
        
        // Clear input
        this.chatInput.value = '';
        
        // Get MMO system
        const mmoSystem = this.gameScene.mmoSystem;
        if (!mmoSystem) {
            logger.error(LogCategory.CHAT, 'MMO system not found');
            return;
        }
        
        // Format message based on channel
        let formattedContent = content;
        
        switch (this.activeChannel) {
            case 'global':
                formattedContent = `/g ${content}`;
                break;
            case 'local':
                // Local is default, no prefix needed
                break;
            case 'party':
                formattedContent = `/p ${content}`;
                break;
            case 'guild':
                formattedContent = `/gu ${content}`;
                break;
            case 'whisper':
                if (!this.targetPlayer) {
                    alert('Please enter a player name to whisper to');
                    return;
                }
                formattedContent = `/w ${this.targetPlayer} ${content}`;
                break;
        }
        
        // Set the chat input value in the MMO system
        (mmoSystem as any).chatInput = { value: formattedContent };
        
        // Call the sendChatMessage method
        mmoSystem.sendChatMessage();
    }
    
    /**
     * Display chat messages
     * @param messages Array of chat messages to display
     */
    public displayMessages(messages: ChatMessage[]): void {
        // Clear existing messages
        this.messageList.innerHTML = '';
        
        // Add messages
        messages.forEach(message => {
            const messageElement = this.createMessageElement(message);
            this.messageList.appendChild(messageElement);
        });
        
        // Scroll to bottom
        this.messageList.scrollTop = this.messageList.scrollHeight;
    }
    
    /**
     * Create a message element
     * @param message Chat message
     * @returns HTML element for the message
     */
    private createMessageElement(message: ChatMessage): HTMLDivElement {
        const messageElement = this.uiHelper.createElement<HTMLDivElement>('div', 'chat-inbox-message');
        
        // Apply styles
        const styles: Partial<CSSStyleDeclaration> = {
            padding: '8px',
            borderRadius: '4px',
            background: 'rgba(50, 40, 30, 0.5)',
            borderLeft: '3px solid'
        };
        
        // Set color based on channel
        switch (message.channel) {
            case 'global':
                styles.borderLeftColor = '#ffffff';
                break;
            case 'local':
                styles.borderLeftColor = '#aaffaa';
                break;
            case 'party':
                styles.borderLeftColor = '#aaaaff';
                break;
            case 'guild':
                styles.borderLeftColor = '#ffaaff';
                break;
            case 'whisper':
                styles.borderLeftColor = '#ffaaaa';
                break;
        }
        
        Object.assign(messageElement.style, styles);
        
        // Create header with sender name and timestamp
        const header = this.uiHelper.createElement<HTMLDivElement>('div', 'chat-inbox-message-header');
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.marginBottom = '5px';
        
        const sender = this.uiHelper.createElement<HTMLDivElement>('div', 'chat-inbox-message-sender');
        
        // Format sender based on channel
        let senderPrefix = '';
        switch (message.channel) {
            case 'global':
                senderPrefix = '[Global] ';
                break;
            case 'local':
                senderPrefix = '[Local] ';
                break;
            case 'party':
                senderPrefix = '[Party] ';
                break;
            case 'guild':
                senderPrefix = '[Guild] ';
                break;
            case 'whisper':
                senderPrefix = '[Whisper] ';
                break;
        }
        
        sender.textContent = `${senderPrefix}${message.senderName}`;
        sender.style.fontWeight = 'bold';
        
        const timestamp = this.uiHelper.createElement<HTMLDivElement>('div', 'chat-inbox-message-timestamp');
        timestamp.textContent = new Date(message.timestamp).toLocaleTimeString();
        timestamp.style.fontSize = '0.8em';
        timestamp.style.opacity = '0.7';
        
        header.appendChild(sender);
        header.appendChild(timestamp);
        
        // Create content
        const content = this.uiHelper.createElement<HTMLDivElement>('div', 'chat-inbox-message-content');
        content.textContent = message.content;
        content.style.wordBreak = 'break-word';
        
        // Add elements to message
        messageElement.appendChild(header);
        messageElement.appendChild(content);
        
        // Add click event to reply to whispers
        if (message.channel === 'whisper' && message.senderId !== 'system') {
            messageElement.style.cursor = 'pointer';
            messageElement.title = `Click to reply to ${message.senderName}`;
            
            messageElement.addEventListener('click', () => {
                this.channelSelector.value = 'whisper';
                this.activeChannel = 'whisper';
                this.targetPlayer = message.senderName;
                
                // Show whisper input
                const whisperContainer = document.querySelector('.chat-inbox-whisper-container') as HTMLDivElement;
                if (whisperContainer) {
                    whisperContainer.style.display = 'flex';
                    
                    // Set whisper input value
                    const whisperInput = document.querySelector('.chat-inbox-whisper-input') as HTMLInputElement;
                    if (whisperInput) {
                        whisperInput.value = message.senderName;
                    }
                }
                
                // Focus on chat input
                this.chatInput.focus();
            });
        }
        
        return messageElement;
    }
    
    /**
     * Show the chat inbox
     */
    public show(): void {
        logger.info(LogCategory.CHAT, '[ChatInbox] Attempting to show chat inbox');
        
        if (!this.container) {
            logger.error(LogCategory.CHAT, '[ChatInbox] Container is undefined, cannot show');
            return;
        }
        
        // Force show the container regardless of current state
        logger.info(LogCategory.CHAT, '[ChatInbox] Setting display to flex');
        this.container.style.display = 'flex';
        this.isVisible = true;
        
        // Focus on input
        setTimeout(() => {
            logger.info(LogCategory.CHAT, '[ChatInbox] Focusing on chat input');
            if (this.chatInput) {
                this.chatInput.focus();
            } else {
                logger.error(LogCategory.CHAT, '[ChatInbox] Chat input is undefined, cannot focus');
            }
        }, 100);
        
        // Disable game keyboard input
        this.disableGameInput();
        
        logger.info(LogCategory.CHAT, '[ChatInbox] Chat inbox shown successfully');
    }
    
    /**
     * Hide the chat inbox
     */
    public hide(): void {
        logger.info(LogCategory.CHAT, '[ChatInbox] Attempting to hide chat inbox');
        
        if (!this.container) {
            logger.error(LogCategory.CHAT, '[ChatInbox] Container is undefined, cannot hide');
            return;
        }
        
        // Force hide the container regardless of current state
        logger.info(LogCategory.CHAT, '[ChatInbox] Setting display to none');
        this.container.style.display = 'none';
        this.isVisible = false;
        
        // Re-enable game keyboard input
        this.enableGameInput();
        
        logger.info(LogCategory.CHAT, '[ChatInbox] Chat inbox hidden successfully');
    }
    
    /**
     * Disable game keyboard input
     */
    private disableGameInput(): void {
        logger.info(LogCategory.CHAT, '[ChatInbox] Disabling game input');
        
        // Disable keyboard input in the game scene
        if (this.gameScene && this.gameScene.input && this.gameScene.input.keyboard) {
            logger.info(LogCategory.CHAT, '[ChatInbox] Game input found, disabling keyboard');
            this.gameScene.input.keyboard.enabled = false;
        } else {
            logger.warn(LogCategory.CHAT, '[ChatInbox] Could not disable game input - gameScene.input.keyboard not available');
        }
    }
    
    /**
     * Enable game keyboard input
     */
    private enableGameInput(): void {
        logger.info(LogCategory.CHAT, '[ChatInbox] Enabling game input');
        
        // Re-enable keyboard input in the game scene
        if (this.gameScene && this.gameScene.input && this.gameScene.input.keyboard) {
            logger.info(LogCategory.CHAT, '[ChatInbox] Game input found, enabling keyboard');
            this.gameScene.input.keyboard.enabled = true;
        } else {
            logger.warn(LogCategory.CHAT, '[ChatInbox] Could not enable game input - gameScene.input.keyboard not available');
        }
    }
    
    /**
     * Toggle visibility
     */
    public toggle(): void {
        logger.info(LogCategory.CHAT, `[ChatInbox] Toggle called, current visibility: ${this.isVisible}`);
        
        if (this.isVisible) {
            logger.info(LogCategory.CHAT, '[ChatInbox] Currently visible, hiding');
            this.hide();
        } else {
            logger.info(LogCategory.CHAT, '[ChatInbox] Currently hidden, showing');
            this.show();
        }
    }
    
    /**
     * Check if inbox is visible
     */
    public isInboxVisible(): boolean {
        logger.info(LogCategory.CHAT, `[ChatInbox] isInboxVisible called`);
        
        // Always check the actual DOM state
        if (this.container) {
            const displayStyle = this.container.style.display;
            const actuallyVisible = displayStyle !== 'none';
            
            // If there's a mismatch between our state and the DOM, fix it
            if (this.isVisible !== actuallyVisible) {
                logger.warn(LogCategory.CHAT, `[ChatInbox] Visibility state mismatch: isVisible=${this.isVisible}, DOM display=${displayStyle}`);
                this.isVisible = actuallyVisible;
            }
            
            logger.info(LogCategory.CHAT, `[ChatInbox] Container display style: "${displayStyle}", isVisible: ${this.isVisible}`);
        } else {
            logger.error(LogCategory.CHAT, '[ChatInbox] Container is undefined, cannot check visibility');
            this.isVisible = false;
        }
        
        return this.isVisible;
    }
    
    /**
     * Clean up resources
     */
    public destroy(): void {
        // Remove document click handler
        document.removeEventListener('mousedown', this.handleDocumentClick);
        
        // Remove from DOM
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
    }
} 