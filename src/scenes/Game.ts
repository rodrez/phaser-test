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
import { SkillManager } from '../systems/skills/SkillManager';
import { createAllSkills } from '../systems/skills/index';
import { MonsterSystem } from '../systems/monsters/MonsterSystem';
import { MonsterPopupSystem } from '../systems/monsters/MonsterPopupSystem';
import { PopupSystem } from '../systems/PopupSystem';

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
    
    // Popup system
    popupSystem!: PopupSystem;
    
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

    // Skill system
    skillManager!: SkillManager;
    
    // Monster system
    monsterSystem!: MonsterSystem;
    
    // Monster popup system
    monsterPopupSystem!: MonsterPopupSystem;

    constructor() {
        super({ key: 'Game' });
    }

    /**
     * Initialize the scene
     * This is called before preload() and create()
     */
    init() {
        // Add event listener for scene shutdown
        this.events.once('shutdown', this.cleanupResources, this);
    }

    preload() {
        // Load player assets
        this.load.spritesheet('player', 'assets/player.png', { frameWidth: 32, frameHeight: 48 });
        
        // Load UI assets
        this.load.image('menu-button', 'assets/menu-button.png');
        
        // Load particle texture for effects
        this.load.image('particle', 'assets/particle.png');
        
        // Load sound effects
        this.load.audio('pickup', 'assets/pickup.mp3');
        this.load.audio('place-flag', 'assets/place-flag.mp3');
        this.load.audio('repair', 'assets/repair.mp3');
        this.load.audio('powerup', 'assets/powerup.mp3');
        this.load.audio('explosion', 'assets/explosion.mp3');
        
        // Load material assets
        this.load.image('leather', 'assets/materials/leather.png');
        
        // Load monster assets
        this.load.image('deer', 'assets/monsters/deer.png');
        
        // Load wolf as a single image instead of a spritesheet for now
        // This prevents animation errors if the spritesheet format is incorrect
        this.load.image('wolf', 'assets/monsters/wolf.png');
    }

    create() {
        this.camera = this.cameras.main;

        // Set camera to center of the game world
        const { width, height } = this.scale;
        this.camera.centerOn(width / 2, height / 2);

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
        this.msg_text = this.add.text(width / 2, height / 2, 'Leaflet Map View\nClick to start playing', {
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
        
        // Set up collision between player and world boundaries - using the actual screen size
        this.physics.world.setBounds(0, 0, width, height);
        this.player.setCollideWorldBounds(true);
        
        // Center camera on the game world
        this.cameras.main.setBounds(0, 0, width, height);
        
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
        this.popupSystem = new PopupSystem(this, this.mapSystem);
        this.flagSystem = new FlagSystem(this, this.mapSystem, this.popupSystem);

        // Initialize skill system
        this.skillManager = new SkillManager(this);
        this.skillManager.initialize(5, createAllSkills()); // Start with 5 skill points
        
        console.log('Game started! 🎮');
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
        // Hide the player while menu is open
        if (this.player) {
            this.player.setVisible(false);
        }
        
        // Pause the current scene
        this.scene.pause();
        
        // Stop the MenuScene if it's already running to prevent duplication
        if (this.scene.isActive('MenuScene') || this.scene.isPaused('MenuScene')) {
            this.scene.stop('MenuScene');
        }
        
        // Launch the menu scene
        this.scene.launch('MenuScene', { 
            onClose: () => {
                console.log('Menu closed, restoring player visibility');
                // Make sure player is visible again when menu closes
                if (this.player) {
                    this.player.setVisible(true);
                }
                
                // Resume the game scene
                this.scene.resume();
            }
        });
    }

    /**
     * Start the actual gameplay after the intro
     */
    startGameplay() {
        // Player is already created and can move at this point
        // No need to call enableMovement which doesn't exist

        // Map environment creation
        this.setupTreeInteractions();
        this.setupFruitInteractions();
        
        // Generate environment elements
        this.generateEnvironment();
        
        // Setup context menu triggers for player and environment
        this.setupContextMenuTriggers();
        
        // Set up key bindings for skill hotkeys, inventory, etc.
        this.setupPlayerInput();
        
        // Add a couple of flags as examples
        if (this.mapSystem.leafletMap) {
            const center = this.mapSystem.leafletMap.getCenter();
            const centerFlag = this.flagSystem.createFlag(
                center.lat,
                center.lng,
                true,
                "Home Base"
            );
            
            // And one a little distance away
            const offsetFlag = this.flagSystem.createFlag(
                center.lat + 0.0005,
                center.lng + 0.0005,
                false,
                "Exploration Point"
            );
        }
        
        // Setup event listeners for flag system
        this.setupFlagEvents();
        
        // Initialize monster system after player is created and visible
        console.log("Initializing monster system");
        this.monsterSystem = new MonsterSystem(this, this.mapSystem, this.playerSystem, this.itemSystem);
        
        // Initialize monster popup system
        console.log("Initializing monster popup system");
        this.monsterPopupSystem = new MonsterPopupSystem(this, this.popupSystem);
        
        // Spawn some initial monsters with a delay to ensure player is fully initialized
        this.time.delayedCall(500, () => {
            console.log("Spawning initial monsters");
            if (this.monsterSystem) {
                this.monsterSystem.spawnRandomMonsters(5, 300);
            }
        });
        
        console.log('Game started! 🎮');
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
        
        // Ensure the map stays centered and all elements remain in the visible area
        this.ensureElementsInView();
        
        // Update monster system
        if (this.monsterSystem) {
            this.monsterSystem.update(time, delta);
        }
    }

    /**
     * Ensure all map elements stay within the visible area
     */
    ensureElementsInView(): void {
        // Get camera and world boundaries
        const { width, height } = this.scale;
        
        // Check if any important entities are outside the visible area
        const entities = this.entitiesGroup.getChildren();
        
        // Define screen center and navigation circle radius
        const screenCenterX = width / 2;
        const screenCenterY = height / 2;
        const screenRadius = Math.min(width, height) * 0.38; // Same as in MapSystem
        
        // Process each entity to ensure it's in the visible area
        entities.forEach((entity: Phaser.GameObjects.GameObject) => {
            if (entity instanceof Phaser.Physics.Arcade.Sprite) {
                // Get current position
                const x = entity.x;
                const y = entity.y;
                
                // Calculate padding based on entity size
                const padding = Math.max(entity.width, entity.height) / 2;
                
                // Define safe area boundaries
                const minX = padding;
                const maxX = width - padding;
                const minY = padding;
                const maxY = height - padding;
                
                // Clamp entity position to keep it in view
                let newX = Phaser.Math.Clamp(x, minX, maxX);
                let newY = Phaser.Math.Clamp(y, minY, maxY);
                
                // Also apply navigation circle boundary
                // Calculate distance from center to the entity
                const dx = newX - screenCenterX;
                const dy = newY - screenCenterY;
                const distanceFromCenter = Math.sqrt(dx * dx + dy * dy);
                
                // If entity is outside the circle, adjust its position
                if (distanceFromCenter > screenRadius) {
                    // Get the angle from center to entity
                    const angle = Math.atan2(dy, dx);
                    
                    // Calculate point on the circle edge
                    newX = screenCenterX + Math.cos(angle) * screenRadius;
                    newY = screenCenterY + Math.sin(angle) * screenRadius;
                }
                
                // Move entity if it was outside bounds
                if (x !== newX || y !== newY) {
                    entity.setPosition(newX, newY);
                }
            }
        });
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
        // Convert screen position to map coordinates
        const mapPosition = this.mapSystem.screenToMapCoordinates(x, y);
        if (!mapPosition) {
            console.warn('⚠️ Cannot place environment flag: Invalid map position');
            this.uiSystem.showMessage('Cannot place flag: Invalid position', 'warning');
            return;
        }
        
        // Try to create a flag at this position
        const flagId = this.flagSystem.createFlag(
            mapPosition.lat, 
            mapPosition.lon,
            false, // Not a player flag
            `Marker ${Date.now().toString().slice(-4)}` // Simple name with timestamp
        );
        
        // Check if flag placement was successful
        if (flagId) {
            console.log('🚩 Environment flag placed at:', mapPosition);
            
            // Play flag placement sound
            try {
                this.sound.play('place-flag', { volume: 0.5 });
            } catch (error) {
                // Fallback sound
                try {
                    this.sound.play('pickup', { volume: 0.5 });
                } catch (e) {
                    console.warn('Sound not available for flag placement', e);
                }
            }
            
            // Show success message
            this.uiSystem.showMessage('Flag placed successfully!', 'success', 2000);
        }
        // No need for else block - event handler deals with failures
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
        // Get exact player position on the map using player's screen coordinates
        const playerX = this.player.x;
        const playerY = this.player.y;
        
        // Log player screen position for debugging
        console.log('Player screen position for flag placement:', { playerX, playerY });
        
        // Convert player's screen position to map coordinates
        let playerPosition = this.mapSystem.getExactPlayerPosition(playerX, playerY);
        
        // If we couldn't get the exact position, fall back to the navigation circle center
        if (!playerPosition) {
            console.warn('⚠️ Could not get exact player position, falling back to navigation center');
            playerPosition = this.mapSystem.getPlayerPosition();
            
            if (!playerPosition) {
                console.warn('⚠️ Cannot place flag: Player position unknown');
                this.uiSystem.showMessage('Cannot place flag: Unknown position', 'warning');
                return;
            }
        }
        
        // Log the calculated map position
        console.log('Player map position for flag placement:', playerPosition);
        
        // Try to place a flag at the player's position
        const flagId = this.flagSystem.createFlag(
            playerPosition.lat,
            playerPosition.lon,
            true, // This is a player flag
            `Flag ${Date.now().toString().slice(-4)}` // Generate a simple name
        );
        
        // Check if flag placement was successful
        if (flagId) {
            console.log('🚩 Player flag placed at:', playerPosition);
            
            // Play flag placement sound
            try {
                this.sound.play('place-flag', { volume: 0.5 });
            } catch (error) {
                // Fallback sound if the flag placement sound isn't available
                try {
                    this.sound.play('pickup', { volume: 0.5 });
                } catch (e) {
                    console.warn('Sound not available for flag placement', e);
                }
            }
            
            // Show success message
            this.uiSystem.showMessage('Flag placed successfully!', 'success', 2000);
            
            // Add flag to player stats
            this.playerStats.flags.push({
                id: flagId,
                position: [playerPosition.lat, playerPosition.lon],
                name: `Flag ${Date.now().toString().slice(-4)}`
            });
        }
        // No need for an else block as the flagSystem will emit 'flag-placement-failed' if it fails
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
            
            // Create menu options array
            const menuOptions = [
                {
                    text: 'Examine',
                    callback: () => {
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
                    },
                    icon: 'icon-examine'
                },
                {
                    text: 'Chop',
                    callback: () => {
                        this.chopTree(tree);
                    },
                    icon: 'icon-axe'
                }
            ];
            
            // Check if the tree has fruits by looking for child sprites
            const hasFruits = this.checkTreeHasFruits(tree);
            
            // Add "Gather Fruits" option if the tree has fruits
            if (hasFruits) {
                menuOptions.push({
                    text: 'Gather Fruits',
                    callback: () => {
                        this.gatherFruitsFromTree(tree);
                    },
                    icon: 'icon-inventory'
                });
            }
            
            // Show the context menu at the tree's position
            this.contextMenu.show(tree.x, tree.y, menuOptions);
        });
    }
    
    /**
     * Check if a tree has fruits
     * @param tree The tree to check
     * @returns True if the tree has fruits, false otherwise
     */
    checkTreeHasFruits(tree: Phaser.GameObjects.Image | Phaser.GameObjects.Sprite): boolean {
        // Get all sprites at the tree's position
        const sprites = this.children.list.filter(obj => {
            // Check if it's a sprite and has fruitType data
            return obj instanceof Phaser.GameObjects.Sprite && 
                   obj.getData('fruitType') !== undefined &&
                   // Check if it's close to the tree (within the tree's canopy)
                   Phaser.Math.Distance.Between(obj.x, obj.y, tree.x, tree.y) < tree.displayWidth * 0.6;
        });
        
        return sprites.length > 0;
    }
    
    /**
     * Gather all fruits from a tree
     * @param tree The tree to gather fruits from
     */
    gatherFruitsFromTree(tree: Phaser.GameObjects.Image | Phaser.GameObjects.Sprite): void {
        // Get all fruit sprites near the tree
        const fruitSprites = this.children.list.filter(obj => {
            // Check if it's a sprite and has fruitType data
            return obj instanceof Phaser.GameObjects.Sprite && 
                   obj.getData('fruitType') !== undefined &&
                   // Check if it's close to the tree (within the tree's canopy)
                   Phaser.Math.Distance.Between(obj.x, obj.y, tree.x, tree.y) < tree.displayWidth * 0.6;
        }) as Phaser.GameObjects.Sprite[];
        
        if (fruitSprites.length === 0) {
            // No fruits found
            const noFruitsMsg = this.add.text(tree.x, tree.y - 50, "No fruits to gather!", {
                fontSize: '16px',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 3
            }).setOrigin(0.5);
            
            // Fade out and destroy
            this.tweens.add({
                targets: noFruitsMsg,
                alpha: 0,
                y: noFruitsMsg.y - 30,
                duration: 2000,
                onComplete: () => noFruitsMsg.destroy()
            });
            
            return;
        }
        
        // Move player closer to the tree if they're far away
        const player = this.player;
        const distance = Phaser.Math.Distance.Between(player.x, player.y, tree.x, tree.y);
        
        if (distance > 50) {
            // Player is too far, move closer first
            const angle = Phaser.Math.Angle.Between(player.x, player.y, tree.x, tree.y);
            const targetX = tree.x - Math.cos(angle) * 40;
            const targetY = tree.y - Math.sin(angle) * 40;
            
            // Move player to the tree
            this.tweens.add({
                targets: player,
                x: targetX,
                y: targetY,
                duration: distance * 5, // Speed based on distance
                ease: 'Linear',
                onStart: () => {
                    // Show a message that player is moving to the tree
                    const moveMsg = this.add.text(player.x, player.y - 20, "Moving to tree...", {
                        fontSize: '14px',
                        color: '#ffffff',
                        stroke: '#000000',
                        strokeThickness: 2
                    }).setOrigin(0.5);
                    
                    // Fade out and destroy
                    this.tweens.add({
                        targets: moveMsg,
                        alpha: 0,
                        y: moveMsg.y - 10,
                        duration: 1000,
                        onComplete: () => moveMsg.destroy()
                    });
                },
                onComplete: () => {
                    // After moving, perform the gathering action
                    this.performGatherFruits(tree, fruitSprites);
                }
            });
        } else {
            // Player is close enough, gather immediately
            this.performGatherFruits(tree, fruitSprites);
        }
    }
    
    /**
     * Perform the actual fruit gathering action
     * @param tree The tree being gathered from
     * @param fruitSprites Array of fruit sprites to gather
     */
    performGatherFruits(tree: Phaser.GameObjects.Image | Phaser.GameObjects.Sprite, fruitSprites: Phaser.GameObjects.Sprite[]): void {
        // Face the player toward the tree
        if (tree.x > this.player.x) {
            this.player.setFlipX(false);
        } else {
            this.player.setFlipX(true);
        }
        
        // Track gathered fruits
        const gatheredFruits: { [key: string]: number } = {};
        let totalFruits = 0;
        
        // Process each fruit with a slight delay between them
        let currentDelay = 0;
        fruitSprites.forEach((fruit, index) => {
            // Get fruit data
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
            
            // Add to gathered count
            if (!gatheredFruits[fruitName]) {
                gatheredFruits[fruitName] = 0;
            }
            gatheredFruits[fruitName]++;
            totalFruits++;
            
            // Add tween to animate fruit collection
            this.tweens.add({
                targets: fruit,
                x: this.player.x,
                y: this.player.y,
                alpha: 0,
                scale: 0.5,
                duration: 500,
                ease: 'Quad.easeIn',
                delay: index * 200, // Stagger the collection
                onComplete: () => {
                    // Add the fruit to inventory
                    this.givePlayerItem(itemId, 1);
                    
                    // Remove the fruit sprite
                    fruit.destroy();
                    
                    // If this is the last fruit, show the summary message
                    if (index === fruitSprites.length - 1) {
                        // Show success message after all fruits are gathered
                        let message = "You gathered:";
                        for (const [fruitName, count] of Object.entries(gatheredFruits)) {
                            message += `\n${count}x ${fruitName}`;
                        }
                        
                        // Display the message
                        const gatherMsg = this.add.text(tree.x, tree.y - 50, message, {
                            fontSize: '16px',
                            color: '#ffffff',
                            stroke: '#000000',
                            strokeThickness: 3,
                            align: 'center'
                        }).setOrigin(0.5);
                        
                        // Fade out and destroy
                        this.tweens.add({
                            targets: gatherMsg,
                            alpha: 0,
                            y: gatherMsg.y - 30,
                            duration: 2000,
                            onComplete: () => gatherMsg.destroy()
                        });
                        
                        // Add some XP for gathering
                        if (this.skillManager) {
                            this.skillManager.addSkillPoints(Math.ceil(totalFruits / 2));
                        }
                    }
                }
            });
        });
    }
    
    /**
     * Handle chopping a tree to gather wood
     * @param tree The tree game object being chopped
     */
    chopTree(tree: Phaser.GameObjects.Image | Phaser.GameObjects.Sprite): void {
        // Check if player has the right tool (optional)
        // For now, we'll allow chopping without a tool
        
        // Play chopping animation
        const player = this.player;
        
        // Move player closer to the tree if they're far away
        const distance = Phaser.Math.Distance.Between(player.x, player.y, tree.x, tree.y);
        if (distance > 50) {
            // Player is too far, move closer first
            const angle = Phaser.Math.Angle.Between(player.x, player.y, tree.x, tree.y);
            const targetX = tree.x - Math.cos(angle) * 40;
            const targetY = tree.y - Math.sin(angle) * 40;
            
            // Move player to the tree first, then chop
            this.tweens.add({
                targets: player,
                x: targetX,
                y: targetY,
                duration: distance * 5, // Speed based on distance
                ease: 'Linear',
                onStart: () => {
                    // Show a message that player is moving to the tree
                    const moveMsg = this.add.text(player.x, player.y - 20, "Moving to tree...", {
                        fontSize: '14px',
                        color: '#ffffff',
                        stroke: '#000000',
                        strokeThickness: 2
                    }).setOrigin(0.5);
                    
                    // Fade out and destroy
                    this.tweens.add({
                        targets: moveMsg,
                        alpha: 0,
                        y: moveMsg.y - 10,
                        duration: 1000,
                        onComplete: () => moveMsg.destroy()
                    });
                },
                onComplete: () => {
                    // After moving, perform the chopping action
                    this.performChopAction(tree);
                }
            });
        } else {
            // Player is close enough, chop immediately
            this.performChopAction(tree);
        }
    }
    
    /**
     * Perform the actual tree chopping action and gather wood
     * @param tree The tree being chopped
     */
    performChopAction(tree: Phaser.GameObjects.Image | Phaser.GameObjects.Sprite): void {
        // Face the player toward the tree
        if (tree.x > this.player.x) {
            this.player.setFlipX(false);
        } else {
            this.player.setFlipX(true);
        }
        
        // Play chopping animation (shake the tree)
        this.tweens.add({
            targets: tree,
            x: tree.x + 3,
            duration: 50,
            yoyo: true,
            repeat: 5,
            ease: 'Sine.easeInOut',
            onComplete: () => {
                // Create wood particles effect
                this.createWoodChipParticles(tree.x, tree.y);
                
                // Determine amount of wood to give (random between 1-3)
                const woodAmount = Phaser.Math.Between(1, 3);
                
                // Add wood to inventory
                const woodAdded = this.givePlayerItem('wood', woodAmount);
                
                // Show success message
                let message;
                if (woodAdded) {
                    message = `You gathered ${woodAmount} wood!`;
                    
                    // Add some XP for woodcutting
                    if (this.skillManager) {
                        // Add skill points instead of XP since there's no direct XP method
                        this.skillManager.addSkillPoints(1);
                    }
                } else {
                    message = "Your inventory is full!";
                }
                
                // Display the message
                const woodMsg = this.add.text(tree.x, tree.y - 50, message, {
                    fontSize: '16px',
                    color: '#ffffff',
                    stroke: '#000000',
                    strokeThickness: 3
                }).setOrigin(0.5);
                
                // Fade out and destroy
                this.tweens.add({
                    targets: woodMsg,
                    alpha: 0,
                    y: woodMsg.y - 30,
                    duration: 2000,
                    onComplete: () => woodMsg.destroy()
                });
                
                // Create stump effect
                this.createTreeStump(tree);
                
                // Remove any fruits attached to this tree
                this.removeFruitsFromTree(tree);
                
                // Make the tree disappear with a falling animation
                this.tweens.add({
                    targets: tree,
                    y: tree.y + 20,
                    alpha: 0,
                    angle: tree.angle + Phaser.Math.Between(-15, 15),
                    duration: 800,
                    ease: 'Quad.easeIn',
                    onComplete: () => {
                        // Remove the tree from the game
                        tree.destroy();
                    }
                });
            }
        });
    }
    
    /**
     * Create a tree stump where the tree was chopped
     * @param tree The tree that was chopped
     */
    createTreeStump(tree: Phaser.GameObjects.Image | Phaser.GameObjects.Sprite): void {
        // Create a simple stump graphic
        const stump = this.add.graphics();
        stump.fillStyle(0x8B4513, 1); // Brown color
        stump.fillCircle(tree.x, tree.y, 10);
        stump.fillStyle(0x654321, 1); // Darker brown for rings
        stump.fillCircle(tree.x, tree.y, 6);
        stump.fillStyle(0x8B4513, 1); // Brown again
        stump.fillCircle(tree.x, tree.y, 3);
        
        // Set depth to be below the tree but above the ground
        stump.setDepth(tree.depth - 1);
    }
    
    /**
     * Remove all fruits associated with a tree
     * @param tree The tree to remove fruits from
     */
    removeFruitsFromTree(tree: Phaser.GameObjects.Image | Phaser.GameObjects.Sprite): void {
        // Get all fruit sprites near the tree
        const fruitSprites = this.children.list.filter(obj => {
            // Check if it's a sprite and has fruitType data
            return obj instanceof Phaser.GameObjects.Sprite && 
                   obj.getData('fruitType') !== undefined &&
                   // Check if it's close to the tree (within the tree's canopy)
                   Phaser.Math.Distance.Between(obj.x, obj.y, tree.x, tree.y) < tree.displayWidth * 0.6;
        }) as Phaser.GameObjects.Sprite[];
        
        // Make fruits fall to the ground and disappear
        fruitSprites.forEach(fruit => {
            this.tweens.add({
                targets: fruit,
                y: fruit.y + 100,
                alpha: 0,
                angle: Phaser.Math.Between(-180, 180),
                duration: 600,
                ease: 'Quad.easeIn',
                onComplete: () => fruit.destroy()
            });
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
        this.givePlayerItem('rusty-sword', 1);
        this.givePlayerItem('armor_leather_chest', 1);
        this.givePlayerItem('consumable_minor_healing_potion', 5);
        this.givePlayerItem('wood', 10);
    }

    /**
     * Set up flag placement and interaction event handlers
     */
    setupFlagEvents() {
        // Handle flag placement failures
        this.events.on('flag-placement-failed', (data: { reason: string, message: string }) => {
            console.log('🚩❌ Flag placement failed:', data);
            
            // Show a warning message to the player
            this.uiSystem.showMessage(data.message, 'warning', 3000);
            
            // Add specific handling for different failure reasons
            if (data.reason === 'outside_boundary') {
                // Visual feedback for out-of-bounds placement
                this.cameras.main.flash(300, 255, 0, 0, true); // Red flash for boundary error
            } else if (data.reason === 'overlap') {
                // Visual feedback for overlap error
                this.cameras.main.flash(300, 255, 165, 0, true); // Orange flash for overlap error
            }
            
            // Maybe play a failed sound
            try {
                if (this.sound.get('error')) {
                    this.sound.play('error', { volume: 0.5 });
                } else if (this.sound.get('pickup')) {
                    // Use another sound if error sound is not available
                    this.sound.play('pickup', { volume: 0.3, detune: -300 }); // Lower pitch for error effect
                }
            } catch (error) {
                console.warn('Sound not available for flag placement error', error);
            }
        });
        
        // Listen for flag destroyed events
        this.events.on('flag-destroyed', (data: { flagId: string, flagName: string, isPlayerFlag: boolean }) => {
            console.log('🚩💥 Flag destroyed:', data);
            
            // Play destruction sound
            try {
                if (this.sound.get('explosion')) {
                    this.sound.play('explosion', { volume: 0.5 });
                } else {
                    // Fallback to a default sound
                    this.sound.play('pickup', { volume: 0.5, detune: -500 }); // Lower pitch for destruction effect
                }
            } catch (error) {
                console.warn('Sound not available for flag destruction', error);
            }
            
            // Show message to the player
            this.uiSystem.showMessage(`Flag "${data.flagName}" has been destroyed!`, 'warning', 3000);
            
            // Visual effect - screen shake
            this.cameras.main.shake(300, 0.01);
            
            // If it was a player flag, remove it from player stats
            if (data.isPlayerFlag) {
                const flagIndex = this.playerStats.flags.findIndex(f => f.id === data.flagId);
                if (flagIndex !== -1) {
                    this.playerStats.flags.splice(flagIndex, 1);
                }
            }
        });
        
        // Listen for flag teleport events
        this.events.on('flag-teleport', (data: { lat: number, lon: number, flagId: string }) => {
            console.log('🚩➡️ Teleporting player to flag:', data);
            
            // Get the flag data
            const flag = this.flagSystem.flags.get(data.flagId);
            if (!flag) {
                console.error('Flag not found for teleport:', data.flagId);
                return;
            }
            
            // First, update the map center and navigation circle
            // This is critical for positioning to work correctly
            this.mapSystem.setMapCenter(data.lat, data.lon);
            this.mapSystem.updateNavigationCircle(data.lat, data.lon);
            
            // Give the map a moment to update before positioning the player
            setTimeout(() => {
                // Convert geographic coordinates to screen coordinates
                const screenPosition = this.mapSystem.geoToScreenCoordinates(data.lat, data.lon);
                
                // Teleport the player to the flag's position on screen
                if (this.player && screenPosition) {
                    console.log('Screen position for teleport:', screenPosition);
                    
                    // Add a small offset so player doesn't appear directly on the flag
                    const offsetX = 20;  // 20 pixels to the right
                    const offsetY = -30; // 30 pixels up (so player appears above the flag)
                    
                    // Set player position
                    this.player.setPosition(screenPosition.x + offsetX, screenPosition.y + offsetY);
                    
                    // Make sure the player is visible
                    this.player.setVisible(true);
                    
                    // Update player animation to idle
                    this.player.anims.play('player-idle', true);
                    
                    // Set proper depth to ensure player is visible
                    this.player.setDepth(800);
                    
                    // Play a teleport animation or effect
                    this.cameras.main.flash(500, 255, 255, 255, true);
                    
                    // Emit a sound if available
                    try {
                        if (this.sound.get('teleport')) {
                            this.sound.play('teleport', { volume: 0.5 });
                        } else {
                            // Fallback to a default sound
                            this.sound.play('pickup', { volume: 0.5 });
                        }
                    } catch (error) {
                        console.warn('Sound not available for teleport', error);
                    }
                    
                    console.log('Player teleported to flag', {
                        flagId: data.flagId,
                        screenPosition: [screenPosition.x, screenPosition.y],
                        playerPosition: [this.player.x, this.player.y]
                    });
                    
                    // Show a success message to the player
                    if (this.uiSystem) {
                        this.uiSystem.showMessage(`Teleported to ${flag.name}!`, 'success', 2000);
                    }
                } else {
                    console.error('Could not teleport: player or screen position invalid', {
                        player: !!this.player,
                        screenPosition
                    });
                }
            }, 100); // Small delay to ensure map has updated
        });
        
        // Listen for flag repair events (for later gameplay mechanics)
        this.events.on('flag-repaired', (data: { flagId: string, oldHealth: number, newHealth: number }) => {
            console.log('🚩🔧 Flag repaired:', data);
            
            // Get the flag data
            const flag = this.flagSystem.flags.get(data.flagId);
            if (!flag) return;
            
            // Play repair sound if available
            try {
                if (this.sound.get('repair')) {
                    this.sound.play('repair', { volume: 0.5 });
                } else {
                    // Fallback to a default sound
                    this.sound.play('pickup', { volume: 0.5 });
                }
            } catch (error) {
                console.warn('Sound not available for repair', error);
            }
            
            // Show message to the player
            this.uiSystem.showMessage(`Flag "${flag.name}" has been repaired!`, 'success', 2000);
            
            // Visual effect - healing particles
            const screenPosition = this.mapSystem.geoToScreenCoordinates(flag.lat, flag.lon);
            if (screenPosition) {
                this.createRepairParticles(screenPosition.x, screenPosition.y);
            }
            
            // Add XP for repairing
            this.playerStats.xp += 5;
            this.uiSystem.updateXPDisplay(this.playerStats.xp, this.playerStats.xpToNextLevel);
        });
        
        // Listen for flag hardened events
        this.events.on('flag-hardened', (data: { flagId: string, flag: any }) => {
            console.log('🚩🛡️ Flag hardened:', data);
            
            // Get the flag data
            const flag = this.flagSystem.flags.get(data.flagId);
            if (!flag) return;
            
            // Play hardening sound if available
            try {
                if (this.sound.get('powerup')) {
                    this.sound.play('powerup', { volume: 0.5 });
                } else {
                    // Fallback to a default sound
                    this.sound.play('pickup', { volume: 0.5 });
                }
            } catch (error) {
                console.warn('Sound not available for hardening', error);
            }
            
            // Show message to the player
            this.uiSystem.showMessage(`Flag "${flag.name}" has been hardened!`, 'success', 2000);
            
            // Visual effect - shield particles
            const screenPosition = this.mapSystem.geoToScreenCoordinates(flag.lat, flag.lon);
            if (screenPosition) {
                this.createHardenParticles(screenPosition.x, screenPosition.y);
            }
            
            // Add XP for hardening
            this.playerStats.xp += 10;
            this.uiSystem.updateXPDisplay(this.playerStats.xp, this.playerStats.xpToNextLevel);
        });
    }

    /**
     * Create repair particle effect for flag repair
     */
    createRepairParticles(x: number, y: number): void {
        // Create a particle emitter for repair effect
        const particles = this.add.particles(x, y, 'particle', {
            frame: 0,
            color: [0x00ff00, 0x88ff88], // Green colors for healing
            colorEase: 'quad.out',
            lifespan: 800,
            angle: { min: 0, max: 360 },
            scale: { start: 0.6, end: 0 },
            speed: { min: 50, max: 100 },
            quantity: 20,
            blendMode: 'ADD',
            emitting: false
        });
        
        // Emit particles once
        particles.explode();
        
        // Destroy the emitter after animation completes
        this.time.delayedCall(1000, () => {
            particles.destroy();
        });
    }

    /**
     * Create harden particle effect for flag hardening
     */
    createHardenParticles(x: number, y: number): void {
        // Create a particle emitter for hardening effect
        const particles = this.add.particles(x, y, 'particle', {
            frame: 0,
            color: [0x4488ff, 0x88aaff], // Blue colors for shield/hardening
            colorEase: 'quad.out',
            lifespan: 1000,
            angle: { min: 0, max: 360 },
            scale: { start: 0.8, end: 0 },
            speed: { min: 60, max: 120 },
            quantity: 25,
            blendMode: 'ADD',
            emitting: false
        });
        
        // Create a shield circle effect
        const shield = this.add.circle(x, y, 40, 0x4488ff, 0.6);
        shield.setStrokeStyle(3, 0x88aaff);
        
        // Emit particles once
        particles.explode();
        
        // Animate the shield
        this.tweens.add({
            targets: shield,
            alpha: 0,
            scale: 1.5,
            duration: 800,
            ease: 'Cubic.Out',
            onComplete: () => {
                shield.destroy();
            }
        });
        
        // Destroy the emitter after animation completes
        this.time.delayedCall(1200, () => {
            particles.destroy();
        });
    }

    /**
     * Create wood chip particle effect when chopping a tree
     * @param x X coordinate
     * @param y Y coordinate
     */
    createWoodChipParticles(x: number, y: number): void {
        // Check if wood-chip texture exists, if not create a fallback
        if (!this.textures.exists('wood-chip')) {
            const graphics = this.make.graphics({x: 0, y: 0});
            graphics.fillStyle(0x8B4513); // Brown color
            graphics.fillRect(0, 0, 8, 4);
            graphics.generateTexture('wood-chip', 8, 4);
        }
        
        // Create wood chip particles
        const particles = this.add.particles(x, y, 'wood-chip', {
            speed: { min: 50, max: 150 },
            angle: { min: 0, max: 360 },
            scale: { start: 0.5, end: 0 },
            lifespan: 1000,
            gravityY: 300,
            quantity: 10,
            emitting: false
        });
        
        // Emit once and then destroy
        particles.explode();
        
        // Destroy the particle emitter after animation completes
        this.time.delayedCall(1100, () => {
            particles.destroy();
        });
    }

    /**
     * Clean up resources when the scene is shut down
     */
    private cleanupResources(): void {
        console.log('Cleaning up Game scene resources');
        
        // Clean up systems
        if (this.mapSystem) {
            this.mapSystem.destroyMap();
        }
        
        if (this.flagSystem) {
            this.flagSystem.destroy();
        }
        
        if (this.popupSystem) {
            this.popupSystem.destroy();
        }
        
        // Remove event listeners
        this.events.off('flag-placement-failed');
        this.events.off('flag-teleport');
        this.events.off('flag-repaired');
        this.events.off('flag-hardened');
        this.events.off('flag-destroyed');
    }
}
