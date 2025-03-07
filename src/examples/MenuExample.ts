import { Scene } from 'phaser';
import { MedievalMenu } from '../ui/MedievalMenu';

export class MenuExample extends Scene {
    private menu: MedievalMenu | null = null;
    
    constructor() {
        super({ key: 'MenuExample' });
    }
    
    create(): void {
        // Create a background
        this.add.rectangle(0, 0, this.cameras.main.width, this.cameras.main.height, 0x222222)
            .setOrigin(0, 0);
            
        // Add some text
        this.add.text(
            this.cameras.main.centerX, 
            100, 
            'Medieval Menu Example', 
            { 
                fontFamily: 'serif', 
                fontSize: '32px', 
                color: '#e0d2b4' 
            }
        ).setOrigin(0.5);
        
        // Create the menu
        this.menu = new MedievalMenu(this, {
            position: 'left',
            orientation: 'vertical',
            showIcons: true,
            width: '200px'
        });
        
        // Set click handlers for menu items
        this.menu.setClickHandler('inventory', () => {
            this.showMessage('Inventory clicked!');
        });
        
        this.menu.setClickHandler('communication', () => {
            this.showMessage('Communication clicked!');
        });
        
        this.menu.setClickHandler('craft', () => {
            this.showMessage('Craft clicked!');
        });
        
        this.menu.setClickHandler('map', () => {
            this.showMessage('Map clicked!');
        });
        
        this.menu.setClickHandler('character', () => {
            this.showMessage('Character clicked!');
        });
        
        this.menu.setClickHandler('leaderboard', () => {
            this.showMessage('Leaderboard clicked!');
        });
        
        this.menu.setClickHandler('skills', () => {
            this.showMessage('Skills clicked!');
        });
        
        this.menu.setClickHandler('settings', () => {
            this.showMessage('Settings clicked!');
        });
        
        // Add a notification badge to the communication menu item
        this.menu.updateBadge('communication', 3);
        
        // Set the inventory as active by default
        this.menu.setActiveItem('inventory');
        
        // Add some instructions
        this.add.text(
            this.cameras.main.centerX, 
            this.cameras.main.centerY, 
            'Click on the menu items to see them in action.\nThe menu can be positioned on any side of the screen.\nIt supports both vertical and horizontal orientations.', 
            { 
                fontFamily: 'serif', 
                fontSize: '18px', 
                color: '#e0d2b4',
                align: 'center'
            }
        ).setOrigin(0.5);
    }
    
    private showMessage(message: string): void {
        // Clear any existing message
        const existingMessage = this.children.getByName('message');
        if (existingMessage) {
            existingMessage.destroy();
        }
        
        // Create a message box
        const messageBox = this.add.container(this.cameras.main.centerX, this.cameras.main.height - 100);
        messageBox.setName('message');
        
        // Add background
        const bg = this.add.rectangle(0, 0, 400, 60, 0x000000, 0.7);
        bg.setStrokeStyle(2, 0x8b7250);
        messageBox.add(bg);
        
        // Add text
        const text = this.add.text(0, 0, message, { 
            fontFamily: 'serif', 
            fontSize: '18px', 
            color: '#e0d2b4' 
        });
        text.setOrigin(0.5);
        messageBox.add(text);
        
        // Animate the message
        this.tweens.add({
            targets: messageBox,
            y: this.cameras.main.height - 120,
            alpha: { from: 0, to: 1 },
            duration: 300,
            ease: 'Power2',
            yoyo: true,
            hold: 1500,
            onComplete: () => {
                messageBox.destroy();
            }
        });
    }
    
    destroy(): void {
        // Clean up
        if (this.menu) {
            this.menu.destroy();
            this.menu = null;
        }
    }
} 