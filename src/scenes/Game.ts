import { Scene } from 'phaser';
import 'leaflet/dist/leaflet.css';
import { PlayerSystem } from '../systems/Player';
import { MapSystem } from '../systems/Map';
import { ContextMenuSystem } from '../systems/ContextMenu';
import { UISystem } from '../systems/UI';
import { FlagSystem } from '../systems/Flag';
import { EnvironmentSystem } from '../systems/Environment';
import { ItemSystem } from '../systems/Item';
import { InventorySystem } from '../systems/Inventory';

export class Game extends Scene {
    camera: Phaser.Cameras.Scene2D.Camera;
    msg_text: Phaser.GameObjects.Text;
    mapGroup: Phaser.GameObjects.Container;
    
    // Map system and related properties
    mapSystem!: MapSystem;
    
    // Player related properties
    player!: Phaser.Physics.Arcade.Sprite;
    playerSystem!: PlayerSystem;
    
    // UI system
    uiSystem!: UISystem;
    
    // Flag system
    flagSystem!: FlagSystem;
    
    // Input keys for movement
    keyW!: Phaser.Input.Keyboard.Key;
    keyA!: Phaser.Input.Keyboard.Key;
    keyS!: Phaser.Input.Keyboard.Key;
    keyD!: Phaser.Input.Keyboard.Key;
    keyUp!: Phaser.Input.Keyboard.Key;
    keyLeft!: Phaser.Input.Keyboard.Key;
    keyDown!: Phaser.Input.Keyboard.Key;
    keyRight!: Phaser.Input.Keyboard.Key;
    
    // Entities group (make sure to use a physics group if needed)
    entitiesGroup!: Phaser.Physics.Arcade.Group;

    // Optional properties for flag-based positioning
    fromFlag?: boolean;
    flagData?: { x?: number; y?: number };

    // Player stats
    playerStats!: {
        health: number;
        maxHealth: number;
        level: number;
        xp: number;
        xpToNextLevel: number;
        gold: number;
        inventory: any[];
        equipped: any;
        flags: any[];
        isAggressive: boolean;
    };

    // Add context menu property
    contextMenu!: ContextMenuSystem;
    
    // Menu button
    menuButton!: Phaser.GameObjects.Container;

    // Environment system
    environmentSystem!: EnvironmentSystem;

    // Item and inventory systems
    itemSystem!: ItemSystem;
    inventorySystem!: InventorySystem;

    constructor() {
        super('Game');
    }

    preload() {
        // No preloading needed for Leaflet
    }

    create() {
        this.camera = this.cameras.main;

        // Initialize the entities group (using physics group for player collision)
        this.entitiesGroup = this.physics.add.group();

        // Create container for game objects
        this.mapGroup = this.add.container(0, 0);

        // Initialize the map system
        this.mapSystem = new MapSystem(this, {
            centerLat: 51.505, // London example
            centerLon: -0.09,
            zoom: 17, // Zoom level that shows ~600m
            navigationRadius: 200 // Radius in meters
        });
        
        // Create the map with the overlay
        this.mapSystem.createMap();
        
        // Set default map overlay opacity right away
        this.mapSystem.setOverlayOpacity(0.4);
        
        // Initialize environment system
        this.environmentSystem = new EnvironmentSystem(this);
        
        // Initialize item system
        this.itemSystem = new ItemSystem(this);
        
        // Add overlay message
        this.msg_text = this.add.text(512, 384, 'Leaflet Map View\nClick to start playing', {
            fontFamily: 'Arial Black',
            fontSize: '32px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 5,
            align: 'center'
        });
        this.msg_text.setOrigin(0.5);
        this.msg_text.setScrollFactor(0);

        // Initialize player stats
        this.initPlayerStats();
        
        // Initialize inventory system with starting gold from player stats
        this.inventorySystem = new InventorySystem(this, {
            maxSlots: 24,
            maxWeight: 50,
            startingGold: this.playerStats.gold
        });
        
        // Set up inventory events
        this.setupInventoryEvents();
        
        // Create UI system after player stats initialization
        this.uiSystem = new UISystem(this);

        // Set up keyboard input for player movement
        this.setupPlayerInput();

        // Initialize the player system but don't create the player yet
        this.playerSystem = new PlayerSystem(this);
        
        // Create the player - but initially hide it until the intro message is dismissed
        this.player = this.playerSystem.createPlayer();
        this.player.setVisible(false);
        
        // Make sure player is visible and on top of all map elements
        this.player.setDepth(100);
        
        // Center the player in the visible screen area
        const { width, height } = this.scale;
        this.player.setPosition(width / 2, height / 2);
        
        // Set up collision between player and world boundaries
        this.physics.world.setBounds(0, 0, width * 2, height * 2);
        this.player.setCollideWorldBounds(true);
        
        // DO NOT have the camera follow the player for a map-based game
        // Instead, keep the camera centered on the initial view
        this.cameras.main.setScroll(0, 0);
        
        // Initialize the context menu system
        this.contextMenu = new ContextMenuSystem(this, {
            background: {
                color: 0x333333,
                alpha: 0.9,
                radius: 10
            },
            text: {
                color: '#FFFFFF',
                fontFamily: 'Arial',
                fontSize: '18px'
            },
            hoverColor: 0x555555
        });
        
        // Create menu button but keep it initially hidden
        this.createMenuButton();
        this.menuButton.setVisible(false);
        
        // Set up a one-time click handler to dismiss the intro message and start the game
        this.input.once('pointerdown', () => {
            // Hide the intro message
            this.msg_text.setVisible(false);
            
            // Show the player
            this.player.setVisible(true);
            
            // Show the menu button
            this.menuButton.setVisible(true);
            
            // Adjust map overlay opacity for gameplay (slightly more transparent)
            this.mapSystem.setOverlayOpacity(0.3);
            
            // Start the gameplay
            this.startGameplay();
        });

        // Initialize flag system
        this.flagSystem = new FlagSystem(this, this.mapSystem);
    }

    /**
     * Create a menu button in the top right corner
     */
    createMenuButton() {
        const { width } = this.scale;
        
        // Create a container for the button
        this.menuButton = this.add.container(width - 60, 60);
        
        // Add button background
        const background = this.add.circle(0, 0, 30, 0x333333, 0.8)
            .setStrokeStyle(2, 0xffffff)
            .setInteractive({ useHandCursor: true })
            .on('pointerover', () => {
                background.setFillStyle(0x555555, 0.9);
            })
            .on('pointerout', () => {
                background.setFillStyle(0x333333, 0.8);
            })
            .on('pointerdown', () => {
                this.openMenu();
            });
            
        // Add button text/icon
        const icon = this.add.text(0, 0, '≡', {
            fontFamily: 'Arial',
            fontSize: '32px',
            color: '#ffffff'
        }).setOrigin(0.5);
        
        // Add components to container
        this.menuButton.add([background, icon]);
        
        // Set depth to ensure it's always on top
        this.menuButton.setDepth(1000);
        
        // Make sure it stays fixed to the camera
        this.menuButton.setScrollFactor(0);
    }
    
    /**
     * Open the menu scene
     */
    openMenu() {
        // Pause the current scene
        this.scene.pause();
        
        // Launch the menu scene
        this.scene.launch('MenuScene');
    }

    /**
     * Start the actual gameplay after the intro
     */
    startGameplay() {
        console.log("Game started - player can now move and interact!");
        
        // Here you can add any gameplay initialization logic
        // For example, spawning initial entities, etc.
        
        // Initialize environment with trees
        this.generateEnvironment();
        
        // Listen for map changes to update environment
        this.mapSystem.leafletMap.on('moveend', () => {
            // Regenerate trees when the map is moved
            this.generateEnvironment();
        });
        
        // Setup tree interaction handler
        this.setupTreeInteractions();
        
        // Setup fruit collection handler
        this.setupFruitInteractions();
        
        // Setup context menu triggers
        this.setupContextMenuTriggers();
        
        // Create the player now that the intro message is dismissed
        this.player = this.playerSystem.createPlayer();
        
        // Set up flag system after map and player are created
        this.flagSystem = new FlagSystem(this, this.mapSystem);
        
        // Add starting items to player inventory
        this.addStartingItems();
        
        // Create menu button
        this.createMenuButton();
    }

    /**
     * Generate environment elements like trees
     */
    generateEnvironment() {
        // Get game dimensions for fallback values
        const gameWidth = this.cameras.main.width;
        const gameHeight = this.cameras.main.height;
        
        // Get the navigation circle info from the map system
        const circleInfo = this.mapSystem.getNavigationCircleInfo();
        
        // Calculate the center of the screen (where the navigation circle is)
        const centerX = gameWidth / 2;
        const centerY = gameHeight / 2;
        
        // Get the navigation radius
        const navigationRadius = this.mapSystem.navigationRadius;
        
        // Clear any existing environment objects
        this.environmentSystem.clearEnvironment();
        
        // Add 3-12 trees within the navigation circle
        this.environmentSystem.addTreesInCircle(
            12, // Maximum number of trees (will randomly select 3-12)
            centerX,
            centerY,
            navigationRadius * 0.8 // 80% of the radius to ensure trees stay well inside
        );
        
        console.log(`Generated trees within navigation circle (radius: ${navigationRadius})`);
    }

    /**
     * Set up keyboard input for player movement
     */
    setupPlayerInput() {
        // Set up WASD and arrow keys for movement
        this.keyW = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        this.keyA = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.keyS = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S);
        this.keyD = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        
        this.keyUp = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
        this.keyLeft = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
        this.keyDown = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
        this.keyRight = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);
        
        // Add 'A' key to toggle aggression mode
        const toggleKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.T);
        toggleKey.on('down', () => {
            this.toggleAggression();
            console.log(`Aggression mode: ${this.playerStats.isAggressive ? 'Aggressive' : 'Passive'}`);
        });
    }

    update(time: number, delta: number): void {
        // Don't update if player didn't click
        if (!this.player) {
            return;
        }
        
        // Update player movement physics
        this.playerSystem.updatePlayerPhysics(delta);
        
        // Handle player movement based on input keys
        this.playerSystem.handlePlayerMovement();
        
        // Update UI
        this.uiSystem.updateUI();
        
        // Sync aggression state from player stats to UI
        this.uiSystem.setAggression(this.playerStats.isAggressive);
    }

    /**
     * Initialize player stats with default values
     */
    initPlayerStats() {
        // Default player stats - can be modified later
        this.playerStats = {
            health: 100,
            maxHealth: 100,
            level: 1,
            xp: 0,
            xpToNextLevel: 100,
            gold: 0,
            inventory: [],
            equipped: {},
            flags: [],
            isAggressive: false
        };
    }

    /**
     * Set up triggers for the context menu
     */
    setupContextMenuTriggers() {
        // Player context menu on right-click
        this.player.setInteractive();
        this.player.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            if (pointer.rightButtonDown()) {
                this.showPlayerContextMenu();
            }
        });
        
        // General environment context menu on right-click
        this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            // Only show if right-clicking on the general environment (not the player)
            if (pointer.rightButtonDown() && !this.contextMenu.getIsOpen()) {
                // Check if we're clicking on an interactive object
                const clickedObjects = this.input.hitTestPointer(pointer);
                if (!clickedObjects.includes(this.player)) {
                    this.showEnvironmentContextMenu(pointer.x, pointer.y);
                }
            }
        });
        
        // Add keyboard shortcut for player menu (for example, 'C' key)
        this.input.keyboard?.addKey('C').on('down', () => {
            // Show menu at player position if not already open
            if (!this.contextMenu.getIsOpen()) {
                const screenX = this.cameras.main.worldView.centerX;
                const screenY = this.cameras.main.worldView.centerY;
                this.showPlayerContextMenu();
            }
        });
    }
    
    /**
     * Show the player context menu
     */
    showPlayerContextMenu() {
        console.log('Showing player context menu');
        // Position the menu in the center of the screen
        const { width, height } = this.scale;
        
        const menuOptions = [
            {
                text: 'View Player Stats',
                callback: () => {
                    console.log('Viewing player stats');
                    this.showPlayerStats();
                },
                icon: 'icon-stats'
            },
            {
                text: 'Open Inventory',
                callback: () => {
                    console.log('Opening inventory');
                    this.openInventory();
                },
                icon: 'icon-inventory'
            },
            {
                text: 'Place Flag',
                callback: () => {
                    console.log('Placing flag at player position');
                    this.placePlayerFlag();
                },
                icon: 'icon-flag'
            },
            {
                text: 'Level Up',
                callback: () => {
                    console.log('Opening level up screen');
                    // Add level up logic here
                },
                enabled: this.canLevelUp(), // Example of conditional option
                icon: 'icon-levelup'
            },
            {
                text: this.playerStats.isAggressive ? 'Switch to Passive Mode' : 'Switch to Aggressive Mode',
                callback: () => {
                    console.log('Toggling aggression mode');
                    this.toggleAggression();
                },
                icon: this.playerStats.isAggressive ? 'icon-passive' : 'icon-aggressive'
            },
            {
                text: 'Rest',
                callback: () => {
                    console.log('Player resting');
                    try {
                        this.playerRest();
                    } catch (error) {
                        console.error('Error in playerRest():', error);
                    }
                },
                icon: 'icon-rest'
            }
        ];
        
        console.log('Menu options created:', menuOptions);
        this.contextMenu.show(width/2, height/2, menuOptions);
    }
    
    /**
     * Show the environment context menu at the given position
     */
    showEnvironmentContextMenu(x: number, y: number) {
        // Example environment options (these would change based on what's at the location)
        const menuOptions = [
            {
                text: 'Examine Area',
                callback: () => {
                    console.log('Examining area at', x, y);
                    // Add examine logic here
                },
                icon: 'icon-examine'
            },
            {
                text: 'Travel Here',
                callback: () => {
                    console.log('Setting destination to', x, y);
                    // Add travel logic here
                },
                icon: 'icon-travel'
            },
            {
                text: 'Place Flag',
                callback: () => {
                    console.log('Placing flag at', x, y);
                    this.placeEnvironmentFlag(x, y);
                },
                icon: 'icon-flag'
            },
            {
                text: 'Place Marker',
                callback: () => {
                    console.log('Placing marker at', x, y);
                    // Add marker logic here
                },
                icon: 'icon-marker'
            }
        ];
        
        // Use the actual coordinates
        this.contextMenu.show(x, y, menuOptions);
    }
    
    /**
     * Place a flag at the specified environment position
     */
    placeEnvironmentFlag(x: number, y: number): void {
        console.log(`Placing environment flag at screen coordinates: [${x}, ${y}]`);
        
        // Convert screen coordinates to map coordinates
        const worldPoint = this.cameras.main.getWorldPoint(x, y);
        console.log(`World point: [${worldPoint.x}, ${worldPoint.y}]`);
        
        const mapPosition = this.mapSystem.screenToMapCoordinates(x, y);
        
        if (!mapPosition) {
            console.warn('Cannot place flag: Unable to convert screen coordinates to map position');
            this.uiSystem.showMessage('Cannot place flag at this location', 'error');
            return;
        }
        
        console.log(`Map position: [${mapPosition.lat}, ${mapPosition.lon}]`);
        
        // Check if flag system is initialized
        if (!this.flagSystem) {
            console.warn('Cannot place flag: Flag system not initialized');
            return;
        }
        
        // Create the flag
        const flagId = this.flagSystem.createFlag(
            mapPosition.lat, 
            mapPosition.lon, 
            true, // Player flag
            `Environment Flag ${this.playerStats.flags.length + 1}`
        );
        
        // Add to player stats for tracking
        this.playerStats.flags.push({
            id: flagId,
            name: `Environment Flag ${this.playerStats.flags.length + 1}`,
            lat: mapPosition.lat,
            lon: mapPosition.lon,
            createdAt: new Date()
        });
        
        // Show notification
        this.uiSystem.showMessage('Flag placed at selected position!', 'success');
    }
    
    /**
     * Check if the player can level up (example condition)
     */
    canLevelUp(): boolean {
        // Example: Check if player has enough XP to level up
        return this.playerStats.xp >= this.playerStats.xpToNextLevel;
    }
    
    /**
     * Show player stats (example implementation)
     */
    showPlayerStats(): void {
        // Example implementation - this would typically open a stats panel UI
        console.log('Player Stats:', this.playerStats);
        
        // Create a temporary text display for demo purposes
        const statText = `Level: ${this.playerStats.level}
Health: ${this.playerStats.health}/${this.playerStats.maxHealth}
XP: ${this.playerStats.xp}/${this.playerStats.xpToNextLevel}
Gold: ${this.playerStats.gold}`;
        
        const textObj = this.add.text(this.scale.width/2, this.scale.height/2, statText, {
            backgroundColor: '#00000099',
            padding: { x: 20, y: 20 },
            color: '#FFFFFF',
            align: 'center'
        });
        textObj.setOrigin(0.5);
        textObj.setDepth(2000);
        
        // Remove after a few seconds
        this.time.delayedCall(3000, () => {
            textObj.destroy();
        });
    }
    
    /**
     * Player rest implementation (example)
     */
    playerRest(): void {
        console.log('Starting player rest function');
        
        // Example: Heal player by 10% when resting
        const healAmount = Math.floor(this.playerStats.maxHealth * 0.1);
        console.log(`Healing player by ${healAmount} HP`);
        
        try {
            this.playerSystem.healPlayer(healAmount);
            console.log('Player healed successfully');
        } catch (error) {
            console.error('Error healing player:', error);
        }
        
        // Show healing effect (example)
        try {
            const healText = this.add.text(this.player.x, this.player.y - 40, `+${healAmount} HP`, {
                color: '#00FF00',
                fontSize: '20px'
            });
            healText.setOrigin(0.5);
            
            // Animate and remove the text
            this.tweens.add({
                targets: healText,
                y: healText.y - 50,
                alpha: 0,
                duration: 1500,
                onComplete: () => {
                    healText.destroy();
                }
            });
            console.log('Healing animation created');
        } catch (error) {
            console.error('Error creating healing animation:', error);
        }
    }

    /**
     * Toggle player aggression mode
     */
    toggleAggression(): void {
        this.playerStats.isAggressive = !this.playerStats.isAggressive;
        this.uiSystem.setAggression(this.playerStats.isAggressive);
    }

    /**
     * Place a flag at the player's current position
     */
    placePlayerFlag(): void {
        console.log('🚩 Placing flag at player position');
        
        // Get player's exact position in the game world
        if (!this.player) {
            console.warn('Cannot place flag: Player not initialized');
            return;
        }
        
        console.log('Player game position:', {
            x: this.player.x,
            y: this.player.y,
            screenWidth: this.scale.width,
            screenHeight: this.scale.height
        });
        
        // Get the exact player position using game world coordinates
        let playerPos = this.mapSystem.getExactPlayerPosition(this.player.x, this.player.y);
        
        // Fallback to navigation circle position if necessary
        if (!playerPos) {
            console.warn('⚠️ Could not get exact player position, falling back to navigation position');
            playerPos = this.mapSystem.getPlayerPosition();
            
            if (!playerPos) {
                console.warn('⚠️ Cannot place flag: Player position unknown');
                return;
            }
        }
        
        // Get a reference to the flag system
        if (!this.flagSystem) {
            console.warn('⚠️ Cannot place flag: Flag system not initialized');
            return;
        }
        
        // Generate flag name
        const flagName = `Player Flag ${this.playerStats.flags.length + 1}`;
        
        console.log(`🚩 Creating flag "${flagName}" at position:`, playerPos);
        
        // Create the flag at player's position
        const flagId = this.flagSystem.createFlag(
            playerPos.lat, 
            playerPos.lon, 
            true, // Player flag
            flagName
        );
        
        // Add to player stats for tracking
        this.playerStats.flags.push({
            id: flagId,
            name: flagName,
            lat: playerPos.lat,
            lon: playerPos.lon,
            createdAt: new Date()
        });
        
        // Visual feedback - brief flash indicating successful placement
        this.cameras.main.flash(300, 255, 85, 0, false); // Orange flash, no force parameter
        
        // Show notification
        this.uiSystem.showMessage(`Flag "${flagName}" placed at your position!`, 'success');
    }

    /**
     * Setup event listeners for tree interactions
     */
    setupTreeInteractions() {
        this.events.on('tree-interact', (tree: Phaser.GameObjects.Image | Phaser.GameObjects.Sprite) => {
            console.log('Tree interaction at', tree.x, tree.y);
            
            // Determine tree type
            const treeType = tree.texture.key;
            const treeName = treeType === 'spruce-tree' ? 'Spruce Tree' : 'Oak Tree';
            
            // Random messages for tree interaction
            const messages = [
                `You found a ${treeName}!`,
                `A majestic ${treeName} stands before you.`,
                `This ${treeName} looks healthy.`,
                `Birds are nesting in this ${treeName}.`
            ];
            
            // Select a random message
            const message = messages[Math.floor(Math.random() * messages.length)];
            
            // Show notification
            const treeMessage = this.add.text(tree.x, tree.y - 50, message, {
                fontSize: '16px',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 3,
                align: 'center'
            }).setOrigin(0.5);
            
            // Add a nice fade out effect
            this.tweens.add({
                targets: treeMessage,
                y: treeMessage.y - 30,
                alpha: 0,
                duration: 2000,
                ease: 'Cubic.easeOut',
                onComplete: () => {
                    treeMessage.destroy();
                }
            });
            
            // In a real game, you could:
            // - Add items to inventory (wood, fruits, etc.)
            // - Trigger resource collection animation
            // - Update quests or achievements
            // - Spawn creatures or treasures
        });
    }

    /**
     * Setup event listeners for fruit collection
     */
    setupFruitInteractions() {
        this.events.on('fruit-collect', (fruit: Phaser.GameObjects.Sprite) => {
            console.log('Fruit collected!', fruit.x, fruit.y);
            
            // Get fruit type and frame from the fruit's data
            const fruitType = fruit.getData('fruitType');
            const fruitFrame = fruit.getData('fruitFrame');
            
            // Determine which fruit item to add based on the frame
            let itemId;
            let fruitName;
            
            switch (fruitFrame) {
                case 0:
                    itemId = 'food_apple';
                    fruitName = 'Apple';
                    break;
                case 1:
                    itemId = 'food_orange';
                    fruitName = 'Orange';
                    break;
                case 3:
                    itemId = 'food_cherry';
                    fruitName = 'Cherry';
                    break;
                default:
                    itemId = 'food_apple'; // Default to apple
                    fruitName = 'Fruit';
            }
            
            // Create the item and add to inventory
            const item = this.itemSystem.createItem(itemId);
            if (item) {
                // Add the item to inventory
                const added = this.inventorySystem.addItem(item);
                
                if (added) {
                    // Show a notification
                    const message = `You collected a ${fruitName}!`;
                    
                    const fruitMessage = this.add.text(fruit.x, fruit.y - 30, message, {
                        fontSize: '16px',
                        color: '#ffffff',
                        stroke: '#000000',
                        strokeThickness: 3,
                        align: 'center'
                    }).setOrigin(0.5);
                    
                    // Add a nice fade out effect
                    this.tweens.add({
                        targets: fruitMessage,
                        y: fruitMessage.y - 30,
                        alpha: 0,
                        duration: 2000,
                        ease: 'Cubic.easeOut',
                        onComplete: () => {
                            fruitMessage.destroy();
                        }
                    });
                } else {
                    // Inventory is full, show a message
                    const fullMessage = this.add.text(fruit.x, fruit.y - 30, "Inventory is full!", {
                        fontSize: '16px',
                        color: '#ff0000',
                        stroke: '#000000',
                        strokeThickness: 3,
                        align: 'center'
                    }).setOrigin(0.5);
                    
                    // Add a nice fade out effect
                    this.tweens.add({
                        targets: fullMessage,
                        y: fullMessage.y - 30,
                        alpha: 0,
                        duration: 2000,
                        ease: 'Cubic.easeOut',
                        onComplete: () => {
                            fullMessage.destroy();
                        }
                    });
                }
            }
        });
    }

    /**
     * Set up inventory event handlers
     */
    setupInventoryEvents(): void {
        // Listen for gold changes and update player stats
        this.inventorySystem.on('gold-changed', (data) => {
            // Update the player's gold in stats
            this.playerStats.gold = this.inventorySystem.getGold();
            
            // Update the UI
            this.uiSystem.updateUI();
            
            // Show a message if significant gold amount (optional)
            const amount = data.quantity || 0;
            if (Math.abs(amount) >= 10) {
                const message = amount > 0 
                    ? `Gained ${amount} gold!` 
                    : `Lost ${Math.abs(amount)} gold`;
                
                const type = amount > 0 ? 'success' : 'warning';
                this.uiSystem.showMessage(message, type);
            }
        });
        
        // Listen for item-added events
        this.inventorySystem.on('item-added', (data) => {
            if (data.item) {
                const message = `Added ${data.quantity || 1}x ${data.item.name} to inventory`;
                this.uiSystem.showMessage(message, 'info');
            }
        });
        
        // Listen for inventory-full events
        this.inventorySystem.on('inventory-full', (data) => {
            if (data.item) {
                const message = `Inventory full! Cannot add ${data.item.name}`;
                this.uiSystem.showMessage(message, 'error');
            } else {
                this.uiSystem.showMessage('Inventory full!', 'error');
            }
        });
        
        // Listen for item use events
        this.inventorySystem.on('item-used', (data) => {
            if (data.item && data.item.type === 'consumable') {
                // Handle consumable effects
                const consumable = data.item as any;
                
                if (consumable.healthRestore && consumable.healthRestore > 0) {
                    // Heal the player
                    this.playerSystem.healPlayer(consumable.healthRestore);
                    
                    // Show healing effect
                    this.uiSystem.showMessage(`Restored ${consumable.healthRestore} health!`, 'success');
                }
            }
        });
        
        // Listen for item equipped events
        this.inventorySystem.on('item-equipped', (data) => {
            if (data.item) {
                const message = `Equipped ${data.item.name}`;
                this.uiSystem.showMessage(message, 'info');
            }
        });
    }

    /**
     * Opens the inventory screen
     */
    openInventory() {
        console.log('Opening inventory screen');
        
        // Pause the game scene
        this.scene.pause();
        
        // Pass inventory data to the inventory scene
        const inventoryData = {
            slots: this.inventorySystem.getAllItems(),
            equipment: this.inventorySystem.getEquippedItems(),
            weightCapacity: this.inventorySystem.getWeightCapacity(),
            gold: this.inventorySystem.getGold()
        };
        
        // Launch the inventory scene with the data
        this.scene.launch('InventoryScene', { game: this, inventoryData });
    }

    /**
     * Give an item to the player (for testing)
     */
    givePlayerItem(itemId: string, quantity: number = 1): boolean {
        const item = this.itemSystem.createItem(itemId);
        if (!item) {
            console.error(`Failed to give item: Item with ID ${itemId} not found`);
            return false;
        }
        
        return this.inventorySystem.addItem(item, quantity);
    }
    
    /**
     * Add some starting items to player inventory (debug/testing)
     */
    addStartingItems(): void {
        // Give the player some basic items
        this.givePlayerItem('weapon_rusty_sword', 1);
        this.givePlayerItem('armor_leather_chest', 1);
        this.givePlayerItem('consumable_minor_healing_potion', 5);
        this.givePlayerItem('resource_wood', 10);
    }
}
