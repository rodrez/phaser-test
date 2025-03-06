import { Scene, GameObjects } from 'phaser';

export class MenuScene extends Scene {
    private background: GameObjects.Rectangle;
    private menuTitle: GameObjects.Text;
    private closeButton: GameObjects.Text;
    private menuOptions: GameObjects.Text[] = [];
    private menuContainer: GameObjects.Container;
    
    private menuItems = [
        { name: 'Inventory', action: () => this.showInventory() },
        { name: 'Messaging', action: () => this.showMessaging() },
        { name: 'Craft', action: () => this.showCraft() },
        { name: 'Character', action: () => this.showCharacter() },
        { name: 'Map', action: () => this.showMap() },
        { name: 'Skills', action: () => this.showSkills() },
        { name: 'Leaderboard', action: () => this.showLeaderboard() },
    ];
    
    constructor() {
        super('MenuScene');
    }
    
    create() {
        // Get game dimensions
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Create semi-transparent background
        this.background = this.add.rectangle(0, 0, width, height, 0x000000, 0.7)
            .setOrigin(0)
            .setInteractive()
            .on('pointerdown', (pointer: Phaser.Input.Pointer) => {
                // Only close if clicking directly on the background (not menu items)
                if (pointer.downElement === this.background) {
                    this.closeMenu();
                }
            });
            
        // Create container for menu elements
        this.menuContainer = this.add.container(0, 0);
        
        // Create menu panel
        const menuPanel = this.add.rectangle(width / 2, height / 2, 400, 500, 0x333333, 0.9)
            .setOrigin(0.5)
            .setStrokeStyle(2, 0xffffff);
        this.menuContainer.add(menuPanel);
            
        // Add title
        this.menuTitle = this.add.text(width / 2, height / 2 - 220, 'MENU', {
            fontFamily: 'Arial Black',
            fontSize: '32px',
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);
        this.menuContainer.add(this.menuTitle);
        
        // Add close button
        this.closeButton = this.add.text(width / 2 + 180, height / 2 - 220, 'X', {
            fontFamily: 'Arial',
            fontSize: '24px',
            color: '#ffffff'
        })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.closeMenu())
            .on('pointerover', () => this.closeButton.setStyle({ color: '#ff0000' }))
            .on('pointerout', () => this.closeButton.setStyle({ color: '#ffffff' }));
        this.menuContainer.add(this.closeButton);
        
        // Add menu options
        this.createMenuOptions();
    }
    
    private createMenuOptions() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        const startY = height / 2 - 150;
        const spacing = 60;
        
        this.menuItems.forEach((item, index) => {
            const y = startY + (index * spacing);
            const menuOption = this.add.text(width / 2, y, item.name, {
                fontFamily: 'Arial',
                fontSize: '24px',
                color: '#ffffff',
                align: 'center'
            })
                .setOrigin(0.5)
                .setInteractive({ useHandCursor: true })
                .on('pointerdown', item.action)
                .on('pointerover', () => menuOption.setStyle({ color: '#ffff00' }))
                .on('pointerout', () => menuOption.setStyle({ color: '#ffffff' }));
                
            this.menuOptions.push(menuOption);
            this.menuContainer.add(menuOption);
        });
    }
    
    closeMenu() {
        // Return to the game scene
        if (this.scene.isActive('Game')) {
            this.scene.resume('Game');
        }
        this.scene.sleep();
    }
    
    // Placeholder functions for each menu option
    showInventory() {
        // Close the menu
        this.closeMenu();
        
        // Get the Game scene
        const gameScene = this.scene.get('Game') as any;
        
        // Pause the game scene
        gameScene.scene.pause();
        
        // Pass inventory data to the inventory scene
        const inventoryData = {
            slots: gameScene.inventorySystem.getAllItems(),
            equipment: gameScene.inventorySystem.getEquippedItems(),
            weightCapacity: gameScene.inventorySystem.getWeightCapacity(),
            gold: gameScene.inventorySystem.getGold()
        };
        
        // Launch the inventory scene with the data
        gameScene.scene.launch('InventoryScene', { game: gameScene, inventoryData });
    }
    
    showMessaging() {
        this.showNotImplemented('Messaging');
    }
    
    showCraft() {
        // Get game dimensions
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Clear existing menu items
        this.menuOptions.forEach(option => option.destroy());
        this.menuOptions = [];
        
        // Update title
        this.menuTitle.setText('CRAFTING');
        
        // Create craft menu options
        const craftOptions = [
            { name: 'Create Flag', action: () => this.createFlag() },
            { name: 'Craft Potion', action: () => this.showNotImplemented('Potion Crafting') },
            { name: 'Craft Food', action: () => this.showNotImplemented('Food Crafting') },
            { name: 'Craft Tools', action: () => this.showNotImplemented('Tool Crafting') },
            { name: 'Back to Menu', action: () => this.resetMenu() }
        ];
        
        // Position and spacing
        const startY = height / 2 - 150;
        const spacing = 60;
        
        // Create menu options
        craftOptions.forEach((item, index) => {
            const y = startY + (index * spacing);
            const menuOption = this.add.text(width / 2, y, item.name, {
                fontFamily: 'Arial',
                fontSize: '24px',
                color: '#ffffff',
                align: 'center'
            })
                .setOrigin(0.5)
                .setInteractive({ useHandCursor: true })
                .on('pointerdown', item.action)
                .on('pointerover', () => menuOption.setStyle({ color: '#ffff00' }))
                .on('pointerout', () => menuOption.setStyle({ color: '#ffffff' }));
                
            this.menuOptions.push(menuOption);
            this.menuContainer.add(menuOption);
        });
    }
    
    /**
     * Reset menu to show default options
     */
    resetMenu() {
        // Clear existing menu items
        this.menuOptions.forEach(option => option.destroy());
        this.menuOptions = [];
        
        // Reset title
        this.menuTitle.setText('MENU');
        
        // Recreate default menu options
        this.createMenuOptions();
    }
    
    /**
     * Create a flag at the player's current position
     */
    createFlag() {
        console.log('Creating flag from craft menu');
        
        // Get reference to the Game scene
        const gameScene = this.scene.get('Game') as any;
        
        // Call the placePlayerFlag method in the Game scene
        if (gameScene && typeof gameScene.placePlayerFlag === 'function') {
            gameScene.placePlayerFlag();
            
            // Show confirmation
            const width = this.cameras.main.width;
            const height = this.cameras.main.height;
            
            const notification = this.add.text(width / 2, height - 100, 'Flag created at your position!', {
                fontFamily: 'Arial',
                fontSize: '18px',
                color: '#00ff00',
                backgroundColor: '#333333',
                padding: { x: 15, y: 10 }
            }).setOrigin(0.5);
            
            // Remove the notification after 2 seconds
            this.time.delayedCall(2000, () => {
                notification.destroy();
            });
        } else {
            this.showNotImplemented('Flag Creation');
        }
    }
    
    showCharacter() {
        // Close the menu
        this.closeMenu();
        
        // Get the Game scene
        const gameScene = this.scene.get('Game') as any;
        
        // Pause the game scene
        gameScene.scene.pause();
        
        // Extract player stats from the game scene
        const playerData = {
            health: gameScene.playerStats.health,
            maxHealth: gameScene.playerStats.maxHealth,
            level: gameScene.playerStats.level,
            xp: gameScene.playerStats.xp,
            xpToNextLevel: gameScene.playerStats.xpToNextLevel,
            gold: gameScene.playerStats.gold,
            // Add default attributes for now
            strength: 10,
            dexterity: 8,
            intelligence: 6,
            vitality: 12
        };
        
        // Launch the character scene with the data
        gameScene.scene.launch('CharacterScene', { game: gameScene, playerData });
    }
    
    showMap() {
        this.showNotImplemented('Map');
    }
    
    showSkills() {
        // Close the menu
        this.closeMenu();
        
        // Get the Game scene
        const gameScene = this.scene.get('Game') as any;
        
        // Access the game's skill manager
        if (gameScene.skillManager) {
            // Launch the character scene with the tab set to skills
            this.scene.pause();
            gameScene.scene.pause();
            
            // Pass a parameter to indicate we want to show the skills tab
            gameScene.scene.launch('CharacterScene', { 
                showSkillsTab: true,
                game: gameScene,
                playerData: {
                    health: gameScene.playerStats.health,
                    maxHealth: gameScene.playerStats.maxHealth,
                    level: gameScene.playerStats.level,
                    xp: gameScene.playerStats.xp,
                    xpToNextLevel: gameScene.playerStats.xpToNextLevel,
                    gold: gameScene.playerStats.gold
                }
            });
        } else {
            this.showNotImplemented('Skills system not initialized');
        }
    }
    
    showLeaderboard() {
        this.showNotImplemented('Leaderboard');
    }
    
    showNotImplemented(feature: string) {
        // Display a message indicating the feature is not yet implemented
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        const notification = this.add.text(width / 2, height - 100, `${feature} feature coming soon!`, {
            fontFamily: 'Arial',
            fontSize: '18px',
            color: '#ffffff',
            backgroundColor: '#333333',
            padding: { x: 15, y: 10 }
        }).setOrigin(0.5);
        
        // Remove the notification after 2 seconds
        this.time.delayedCall(2000, () => {
            notification.destroy();
        });
    }
} 