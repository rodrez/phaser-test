import { Scene } from 'phaser';
import 'leaflet/dist/leaflet.css';
import { PlayerSystem } from '../systems/Player';
import { MapSystem } from '../systems/Map';
import { ContextMenuSystem } from '../systems/ContextMenu';
import type { UISystem } from '../systems/UI';
import { FlagSystem } from '../systems/Flag';
import { ItemSystem } from '../systems/Item';
import { InventorySystem } from '../systems/Inventory';
import { SkillManager } from '../systems/skills/SkillManager';
import { createAllSkills } from '../systems/skills/SkillFactory';
import { MonsterSystem } from '../systems/monsters/MonsterSystem';
import { MonsterPopupSystem } from '../systems/monsters/MonsterPopupSystem';
import type { PopupSystem, PopupOptions } from '../systems/PopupSystem';
import { CombatSystem } from '../systems/Combat';
import { EquipmentSystem } from '../systems/Equipment';
import { Environment } from '../systems/environment/Environment';
import { MedievalVitalsIntegration } from '../ui/MedievalVitalsIntegration';
import { MedievalMenuIntegration } from '../ui/MedievalMenuIntegration';
import { MedievalSkillTree } from '../ui/MedievalSkillTree';
import { MedievalInventory } from '../ui/MedievalInventory';
import { SKILL_DATA } from '../systems/skills/SkillData';
import { SkillEffectSystem } from '../systems/skills/SkillEffectSystem';

export class Game extends Scene {
    camera: Phaser.Cameras.Scene2D.Camera;
    msg_text: Phaser.GameObjects.Text;
    mapGroup: Phaser.GameObjects.Container;
    
    // Map system and related properties
    mapSystem!: MapSystem;
    
    // Player related properties
    player!: Phaser.Physics.Arcade.Sprite;
    playerSystem!: PlayerSystem;
    
    // Player's geographic position on the map
    playerGeoPosition: { lat: number; lon: number } = { lat: 0, lon: 0 };
    
    // UI system
    uiSystem!: UISystem;
    
    // Flag system
    flagSystem!: FlagSystem;
    
    // Popup system
    popupSystem!: PopupSystem;
    
    // Combat system
    combatSystem!: CombatSystem;
    
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
        godMode: boolean; // Add god mode property, disabled by default
        healingAuraAmount: number;
        healingAuraInterval: number;
        healingStatusText?: Phaser.GameObjects.Text;
        baseDamage: number;
        defense: number;
        critChance: number;
        critDamageMultiplier: number;
        resistances: {
            physical: number;
            fire: number;
            ice: number;
            poison: number;
            electric: number;
            holy: number;
            demonic: number;
        };
    };

    // Add context menu property
    contextMenu!: ContextMenuSystem;
    
    // Environment system
    environmentSystem!: Environment;

    // Item and inventory systems
    itemSystem!: ItemSystem;
    inventorySystem!: InventorySystem;

    // Skill system
    skillManager!: SkillManager;
    
    // Monster system
    monsterSystem!: MonsterSystem;
    
    // Monster popup system
    monsterPopupSystem!: MonsterPopupSystem;
    
    // Equipment system
    equipmentSystem!: EquipmentSystem;

    // Medieval Vitals UI
    medievalVitals?: MedievalVitalsIntegration;
    
    // Medieval menu UI
    medievalMenu?: MedievalMenuIntegration;

    // Medieval skill tree UI
    skillTree?: MedievalSkillTree;
    
    // Medieval inventory UI
    medievalInventory?: MedievalInventory;

    /** Skill effect system for applying skill effects to player */
    skillEffectSystem!: SkillEffectSystem;

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
        // Load the Cinzel font for medieval RPG theme
        const fontStyle = document.createElement('style');
        fontStyle.innerHTML = `
            @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&display=swap');
        `;
        document.head.appendChild(fontStyle);
        
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
        
        // Initialize equipment system
        this.equipmentSystem = new EquipmentSystem(this);
        
        // Preload equipment assets
        this.equipmentSystem.preloadEquipmentAssets();
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
        
        // Initialize popup system (needs to be before environment system)
        this.popupSystem = new PopupSystem(this, this.mapSystem);
        
        // Initialize environment system
        this.environmentSystem = new Environment(this);
        
        // Connect popup system to environment system
        this.environmentSystem.setPopupSystem(this.popupSystem);
        
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
        
        // The mapSystem is already initialized above, don't initialize it again
        // this.mapSystem = new MapSystem(this);
        
        // Replace the UISystem with MedievalVitals
        // this.uiSystem = new UISystem(this);
        this.medievalVitals = new MedievalVitalsIntegration(this);
        this.medievalVitals.initialize();
        
        // Initialize the medieval menu UI
        console.log('[Game] Creating medieval menu integration');
        this.medievalMenu = new MedievalMenuIntegration(this);
        this.medievalMenu.initialize();
        console.log('[Game] Medieval menu initialized');
        
        // Add medieval menu button to the lower right corner
        console.log('[Game] Creating medieval menu button');
        
        // Show welcome message
        if (this.medievalVitals) {
            this.medievalVitals.showMessage('Welcome to the game!', 'info', 5000);
        }
        
        // Set up keyboard input for player movement
        this.setupPlayerInput();
        
        // Initialize player system and create player
        this.playerSystem = new PlayerSystem(this);
        
        // Initialize combat system
        this.combatSystem = new CombatSystem(this, this.playerSystem);
        
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
        
        // Initialize skill system
        this.skillManager = new SkillManager(this);
        this.skillManager.initialize(5, SKILL_DATA); // Start with 5 skill points
        
        // Initialize the skill tree UI
        this.initializeSkillTree();
        
        console.log('Game started! 🎮');
        
        // Create equipment animations
        this.equipmentSystem.createEquipmentAnimations();

        // Initialize flag system
        this.flagSystem = new FlagSystem(this, this.mapSystem, this.popupSystem);
        
        // Set up a one-time click handler to dismiss the intro message and start the game
        this.input.once('pointerdown', () => {
            // Hide the intro message
            this.msg_text.setVisible(false);
            
            // Show the player
            this.player.setVisible(true);
            
            // Adjust map overlay opacity for gameplay (slightly more transparent)
            this.mapSystem.setOverlayOpacity(0.3);
            
            // Start the gameplay
            this.startGameplay();
        });

        // Apply skill effects to player stats
        this.applySkillEffectsToStats();

        // Add keyboard shortcut for testing skill effects
        this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.T).on('down', () => {
            console.log('T key pressed - testing skill effects');
            this.testSkillEffects();
        });
    }

    /**
     * Set up keyboard input for player movement
     */
    setupPlayerInput() {
        // Movement keys
        this.keyW = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        this.keyA = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.keyS = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S);
        this.keyD = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        
        // Arrow keys
        this.keyUp = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
        this.keyLeft = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
        this.keyDown = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
        this.keyRight = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);
        
        // Add inventory shortcut key
        this.input.keyboard!.on('keydown-I', () => {
            if (this.medievalInventory) {
                this.medievalInventory.toggle();
            } else {
                this.openInventory();
            }
        });
        
        
        // Add G key for toggling god mode
        this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.G).on('down', () => {
            // Toggle god mode when G is pressed
            this.toggleGodMode();
        });
        
        // Add key for toggling the menu
        const keyM = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.M);
        keyM.on('down', () => {
            if (this.medievalMenu) {
                this.medievalMenu.toggle();
            }
        });

        // Add key for toggling the skill tree
        const keyK = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.K);
        keyK.on('down', () => {
            console.log('K key pressed - toggling skill tree');
            if (this.skillTree) {
                this.skillTree.toggle();
                
                // Force the skill tree to be visible using direct DOM manipulation
                setTimeout(() => {
                    const skillTreeContainer = document.querySelector('.skill-tree-container') as HTMLDivElement;
                    if (skillTreeContainer) {
                        console.log('Found skill tree container, forcing visibility');
                        Object.assign(skillTreeContainer.style, {
                            display: 'flex',
                            visibility: 'visible',
                            opacity: '1',
                            background: '#ff0000',
                            border: '10px solid #ffff00',
                            zIndex: '99999'
                        });
                        
                        // Log computed styles to see if something is overriding our styles
                        const computedStyle = window.getComputedStyle(skillTreeContainer);
                        console.log('Computed display:', computedStyle.display);
                        console.log('Computed visibility:', computedStyle.visibility);
                        console.log('Computed z-index:', computedStyle.zIndex);
                    } else {
                        console.error('Could not find skill tree container in the DOM');
                    }
                }, 100);
            }
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
        
        // Handle auto-attacking if player is in aggressive mode
        if (this.playerStats.isAggressive) {
            this.playerSystem.autoAttack(time);
        }
        
        // Update target indicator
        this.playerSystem.updateTargetIndicator();
        
        // Update UI - use MedievalVitals instead of uiSystem
        if (this.medievalVitals) {
            this.medievalVitals.update(time, delta);
        }
        // Comment out old UI system calls
        // this.uiSystem.updateUI();
        // this.uiSystem.setAggression(this.playerStats.isAggressive);
        
        // Check if player is within any healing aura
        this.environmentSystem.checkHealingAuras(this.player, this.playerStats, this);
        
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
        for (const entity of entities) {
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
        }
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
            isAggressive: true, // Set to true by default so auto-attack works
            godMode: true, // Add god mode property, disabled by default
            healingAuraAmount: 10,
            healingAuraInterval: 1000,
            // Combat stats
            baseDamage: 5,
            defense: 0,
            critChance: 0.05,
            critDamageMultiplier: 1.5,
            // Resistances
            resistances: {
                physical: 0,
                fire: 0,
                ice: 0,
                poison: 0,
                electric: 0,
                holy: 0,
                demonic: 0
            }
        };
        
        // Apply skill effects if skill manager exists
        this.applySkillEffectsToStats();
    }

    /**
     * Apply skill effects to player stats
     */
    applySkillEffectsToStats(): void {
        // Skip if no skill manager or player stats
        if (!this.skillManager || !this.playerStats) {
            return;
        }
        
        // Create skill effect system if it doesn't exist
        if (!this.skillEffectSystem) {
            this.skillEffectSystem = new SkillEffectSystem(this, this.skillManager);
        }
        
        // Apply all skill effects to player stats
        this.playerStats = this.skillEffectSystem.applyAllSkillEffects(this.playerStats);
    }

    /**
     * Set up triggers for the context menu
     */
    setupContextMenuTriggers() {
        // Player context menu on right-click
        this.player.setInteractive();
        this.player.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            if (pointer.rightButtonDown()) {
                this.playerSystem.showContextMenu();
            }
        });
        
        // General environment context menu on right-click
        this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            // Only show if right-clicking on the general environment (not the player)
            if (pointer.rightButtonDown() && !this.popupSystem.isAnyPopupOpen()) {
                // Check if we're clicking on an interactive object
                const clickedObjects = this.input.hitTestPointer(pointer);
                if (!clickedObjects.includes(this.player)) {
                    this.showEnvironmentContextMenu(pointer.x, pointer.y);
                }
            }
        });
        
        // Add keyboard shortcut for player menu (for example, 'C' key)
        this.input.keyboard?.addKey('C').on('down', () => {
            // Show menu at player position if no popup is open
            if (!this.popupSystem.isAnyPopupOpen()) {
                this.playerSystem.showContextMenu();
            }
        });
    }
    
    /**
     * Show the environment context menu at the given position
     */
    showEnvironmentContextMenu(x: number, y: number) {
        // Create HTML content for the popup
        const content = {
            html: `
                <div class="environment-menu">
                    <h3>Environment</h3>
                    <div class="menu-buttons">
                        <button class="menu-button" id="examine-area"><i class="icon-examine"></i> Examine Area</button>
                        <button class="menu-button" id="travel-here"><i class="icon-travel"></i> Travel Here</button>
                        <button class="menu-button" id="place-flag"><i class="icon-flag"></i> Place Flag</button>
                        <button class="menu-button" id="place-marker"><i class="icon-marker"></i> Place Marker</button>
                    </div>
                </div>
            `,
            buttons: [
                {
                    selector: '#examine-area',
                    onClick: () => {
                        console.log('Examining area at', x, y);
                        // Add examine logic here
                        this.popupSystem.closePopupsByClass('environment-menu-popup');
                    }
                },
                {
                    selector: '#travel-here',
                    onClick: () => {
                        console.log('Setting destination to', x, y);
                        // Add travel logic here
                        this.popupSystem.closePopupsByClass('environment-menu-popup');
                    }
                },
                {
                    selector: '#place-flag',
                    onClick: () => {
                        console.log('Placing flag at', x, y);
                        this.placeEnvironmentFlag(x, y);
                        this.popupSystem.closePopupsByClass('environment-menu-popup');
                    }
                },
                {
                    selector: '#place-marker',
                    onClick: () => {
                        console.log('Placing marker at', x, y);
                        // Add marker logic here
                        this.popupSystem.closePopupsByClass('environment-menu-popup');
                    }
                }
            ]
        };
        
        // Create popup options
        const options: PopupOptions = {
            className: 'environment-menu-popup',
            closeButton: true,
            offset: { x: 0, y: 0 },
            width: 250,
            zIndex: 100000 // Ensure it's on top of everything
        };
        
        // Create the popup at the clicked position
        this.popupSystem.createPopupAtScreenPosition(x, y, content, options);
    }
    
    /**
     * Place a flag at the specified environment position
     */
    placeEnvironmentFlag(x: number, y: number): void {
        // Convert screen position to map coordinates
        const mapPosition = this.mapSystem.screenToMapCoordinates(x, y);
        if (!mapPosition) {
            console.warn('⚠️ Cannot place environment flag: Invalid map position');
            // Use medievalVitals instead of uiSystem for showing messages
            if (this.medievalVitals) {
                this.medievalVitals.showMessage('Cannot place flag: Invalid position', 'warning');
            } else {
                console.error('Cannot show message: medievalVitals is not initialized');
            }
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
            
            // Show success message using medievalVitals instead of uiSystem
            if (this.medievalVitals) {
                this.medievalVitals.showMessage('Flag placed successfully!', 'success', 2000);
            } else {
                console.error('Cannot show message: medievalVitals is not initialized');
            }
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
                // Use medievalVitals instead of uiSystem for showing messages
                if (this.medievalVitals) {
                    this.medievalVitals.showMessage('Cannot place flag: Unknown position', 'warning');
                } else {
                    console.error('Cannot show message: medievalVitals is not initialized');
                }
                return;
            }
        }
        
        // Log the calculated map position
        console.log('Player map position for flag placement:', playerPosition);
        
        // Try to place a flag at the player's position
        // Pass both geographical coordinates AND screen coordinates
        const flagId = this.flagSystem.createFlag(
            playerPosition.lat,
            playerPosition.lon,
            true, // This is a player flag
            `Flag ${Date.now().toString().slice(-4)}`, // Generate a simple name
            playerX, // Pass the exact screen X coordinate
            playerY  // Pass the exact screen Y coordinate
        );
        
        // Check if flag placement was successful
        if (flagId) {
            console.log('🚩 Player flag placed at:', playerPosition, 'with screen position:', { x: playerX, y: playerY });
            
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
            
            // Show success message using medievalVitals instead of uiSystem
            if (this.medievalVitals) {
                this.medievalVitals.showMessage('Flag placed successfully!', 'success', 2000);
            } else {
                console.error('Cannot show message: medievalVitals is not initialized');
            }
            
            // Add flag to player stats
            this.playerStats.flags.push({
                id: flagId,
                position: [playerPosition.lat, playerPosition.lon],
                name: `Flag ${Date.now().toString().slice(-4)}`,
                screenPosition: { x: playerX, y: playerY } // Store screen position for reference
            });
        }
        // No need for an else block as the flagSystem will emit 'flag-placement-failed' if it fails
    }


    /**
     * Set up inventory event handlers
     */
    setupInventoryEvents(): void {
        // Listen for gold changes and update player stats
        this.inventorySystem.on('gold-changed', (data) => {
            // Update the player's gold in stats
            this.playerStats.gold = this.inventorySystem.getGold();
            
            // Update the UI using medievalVitals instead of uiSystem
            if (this.medievalVitals) {
                this.medievalVitals.updateUI();
            }
            
            // Show a message if significant gold amount (optional)
            const amount = data.quantity || 0;
            if (Math.abs(amount) >= 10) {
                const message = amount > 0 
                    ? `Gained ${amount} gold!` 
                    : `Lost ${Math.abs(amount)} gold`;
                
                const type = amount > 0 ? 'success' : 'warning';
                // Use medievalVitals instead of uiSystem for showing messages
                if (this.medievalVitals) {
                    this.medievalVitals.showMessage(message, type);
                } else {
                    console.error('Cannot show message: medievalVitals is not initialized');
                }
            }
        });
        
        // Listen for item-added events
        this.inventorySystem.on('item-added', (data) => {
            if (data.item) {
                const message = `Added ${data.quantity || 1}x ${data.item.name} to inventory`;
                // Use medievalVitals instead of uiSystem for showing messages
                if (this.medievalVitals) {
                    this.medievalVitals.showMessage(message, 'info');
                } else {
                    console.error('Cannot show message: medievalVitals is not initialized');
                }
            }
        });
        
        // Listen for inventory-full events
        this.inventorySystem.on('inventory-full', (data) => {
            if (data.item) {
                const message = `Inventory full! Cannot add ${data.item.name}`;
                // Use medievalVitals instead of uiSystem for showing messages
                if (this.medievalVitals) {
                    this.medievalVitals.showMessage(message, 'error');
                } else {
                    console.error('Cannot show message: medievalVitals is not initialized');
                }
            } else {
                // Use medievalVitals instead of uiSystem for showing messages
                if (this.medievalVitals) {
                    this.medievalVitals.showMessage('Inventory full!', 'error');
                } else {
                    console.error('Cannot show message: medievalVitals is not initialized');
                }
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
                    
                    // Show healing effect using medievalVitals instead of uiSystem
                    if (this.medievalVitals) {
                        this.medievalVitals.showMessage(`Restored ${consumable.healthRestore} health!`, 'success');
                    } else {
                        console.error('Cannot show message: medievalVitals is not initialized');
                    }
                }
            }
        });
        
        // Listen for item equipped events
        this.inventorySystem.on('item-equipped', (data) => {
            if (data.item) {
                const message = `Equipped ${data.item.name}`;
                // Use medievalVitals instead of uiSystem for showing messages
                if (this.medievalVitals) {
                    this.medievalVitals.showMessage(message, 'info');
                } else {
                    console.error('Cannot show message: medievalVitals is not initialized');
                }
            }
        });
        
        // Listen for equipment changes to update visuals
        this.inventorySystem.on('item-equipped', (data: any) => {
            if (data.equipmentSlot && this.playerSystem) {
                this.playerSystem.updateEquipmentVisual(data.equipmentSlot);
            }
        });
        
        this.inventorySystem.on('item-unequipped', (data: any) => {
            if (data.equipmentSlot && this.playerSystem) {
                this.playerSystem.hideEquipmentVisual(data.equipmentSlot);
            }
        });
    }

    /**
     * Opens the inventory screen
     */
    openInventory() {
        console.log('Opening inventory screen');
        
        // Update the inventory badge count
        if (this.medievalMenu) {
            // Count the number of new items (this is just an example, you can implement your own logic)
            const newItemsCount = this.inventorySystem.getNewItemsCount();
            if (newItemsCount > 0) {
                this.medievalMenu.updateInventoryBadge(newItemsCount);
            }
        }
        
        // Initialize the medieval inventory if it doesn't exist yet
        if (!this.medievalInventory) {
            this.medievalInventory = new MedievalInventory(this, this.inventorySystem, {
                title: 'Inventory',
                showWeight: true,
                showFilters: true,
                showSearch: true
            });
        }
        
        // Show the inventory
        this.medievalInventory.show();
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
            
            // Show a warning message to the player using medievalVitals instead of uiSystem
            if (this.medievalVitals) {
                this.medievalVitals.showMessage(data.message, 'warning', 3000);
            } else {
                console.error('Cannot show message: medievalVitals is not initialized');
            }
            
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
            
            // Show message to the player using medievalVitals instead of uiSystem
            if (this.medievalVitals) {
                this.medievalVitals.showMessage(`Flag "${data.flagName}" has been destroyed!`, 'warning', 3000);
            } else {
                console.error('Cannot show message: medievalVitals is not initialized');
            }
            
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
                    
                    // Show a success message to the player using medievalVitals instead of uiSystem
                    if (this.medievalVitals) {
                        this.medievalVitals.showMessage(`Teleported to ${flag.name}!`, 'success', 2000);
                    } else {
                        console.error('Cannot show message: medievalVitals is not initialized');
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
            
            // Show message to the player using medievalVitals instead of uiSystem
            if (this.medievalVitals) {
                this.medievalVitals.showMessage(`Flag "${flag.name}" has been repaired!`, 'success', 2000);
            } else {
                console.error('Cannot show message: medievalVitals is not initialized');
            }
            
            // Visual effect - healing particles
            const screenPosition = this.mapSystem.geoToScreenCoordinates(flag.lat, flag.lon);
            if (screenPosition) {
                this.createRepairParticles(screenPosition.x, screenPosition.y);
            }
            
            // Add XP for repairing
            this.playerStats.xp += 5;
            // Update XP display using medievalVitals instead of uiSystem
            if (this.medievalVitals) {
                this.medievalVitals.updateUI();
            }
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
            
            // Show message to the player using medievalVitals instead of uiSystem
            if (this.medievalVitals) {
                this.medievalVitals.showMessage(`Flag "${flag.name}" has been hardened!`, 'success', 2000);
            } else {
                console.error('Cannot show message: medievalVitals is not initialized');
            }
            
            // Visual effect - shield particles
            const screenPosition = this.mapSystem.geoToScreenCoordinates(flag.lat, flag.lon);
            if (screenPosition) {
                this.createHardenParticles(screenPosition.x, screenPosition.y);
            }
            
            // Add XP for hardening
            this.playerStats.xp += 10;
            // Update XP display using medievalVitals instead of uiSystem
            if (this.medievalVitals) {
                this.medievalVitals.updateUI();
            }
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
        
        if (this.environmentSystem) {
            this.environmentSystem.destroy();
        }
        
        // Remove event listeners
        this.events.off('flag-placement-failed');
        this.events.off('flag-teleport');
        this.events.off('flag-repaired');
        this.events.off('flag-hardened');
        this.events.off('flag-destroyed');
        
        // Clean up healing status on player
        if (this.player) {
            const statusGroup = this.player.getData('healingSpruceStatus');
            if (statusGroup) {
                statusGroup.destroy();
        }
        
        // Clean up medieval vitals
        if (this.medievalVitals) {
            this.medievalVitals.destroy();
            this.medievalVitals = undefined;
        }
        
        // Clean up medieval menu
        if (this.medievalMenu) {
            this.medievalMenu.destroy();
            this.medievalMenu = undefined;
        }
        
        // Clean up medieval inventory
        if (this.medievalInventory) {
            this.medievalInventory.destroy();
            this.medievalInventory = undefined;
        }
    }
}

    /**
     * Toggle god mode
     */
    toggleGodMode(): void {
        this.playerStats.godMode = !this.playerStats.godMode;
        
        // Emit event for the Medieval Vitals UI
        this.events.emit('player-god-mode-changed', this.playerStats.godMode);
        
        // Show message
        const message = this.playerStats.godMode ? 'God Mode enabled' : 'God Mode disabled';
        if (this.medievalVitals) {
            this.medievalVitals.showMessage(message, this.playerStats.godMode ? 'success' : 'info');
        }
    }


    /**
     * Start the actual gameplay after the intro
     */
    startGameplay(): void {
        // Player is already created and can move at this point
        
        // Generate environment elements
        this.generateEnvironment();
        
        // Setup context menu triggers for player and environment
        this.setupContextMenuTriggers();
        
        
        // Store player reference in registry for systems to access
        this.registry.set('player', this.player);
        
        // Set up event listeners for inventory and healing
        this.events.on('add-item-to-inventory', (data: { itemId: string, quantity: number }) => {
            const { itemId, quantity } = data;
            this.givePlayerItem(itemId, quantity);
        });
        
        this.events.on('player-healed', (healAmount: number) => {
            // Heal the player
            this.playerStats.health = Math.min(
                this.playerStats.health + healAmount,
                this.playerStats.maxHealth
            );
            
            // Update health display
            this.events.emit('player-stats-changed');
            
            // Show healing particles
        });
        
        this.events.on('add-skill-points', (points: number) => {
            if (this.skillManager) {
                this.skillManager.addSkillPoints(points);
            }
        });
        
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
    generateEnvironment(): void {
        // Get game dimensions for fallback values
        const gameWidth = this.cameras.main.width;
        const gameHeight = this.cameras.main.height;
        
        // Calculate the center of the screen
        const centerX = gameWidth / 2;
        const centerY = gameHeight / 2;
        
        // Get the navigation radius
        const navigationRadius = this.mapSystem.navigationRadius || 300;
        
        // Initialize environment system
        this.environmentSystem = new Environment(this);
        
        // Generate environment within the navigation circle
        this.environmentSystem.generateEnvironment(centerX, centerY, navigationRadius);
    }

    // Initialize the skill tree UI
    initializeSkillTree() {
        console.log('Initializing skill tree');
        
        // Create the skill tree UI
        this.skillTree = new MedievalSkillTree(this);
        
        // Initialize with skill data
        const playerSkills = {
            skillPoints: this.skillManager.getAvailablePoints(),
            unlockedSkills: new Map<string, number>(),
            specialization: null
        };
        
        // Convert unlocked skills from skill manager to the format needed by the skill tree
        for (const skill of this.skillManager.getUnlockedSkills()) {
            playerSkills.unlockedSkills.set(skill.id, skill.level);
        }
        
        // Use SKILL_DATA directly instead of converting from SkillManager
        console.log(`Using SKILL_DATA with ${SKILL_DATA.length} skills`);
        
        // Initialize the skill tree with data
        this.skillTree.initialize(SKILL_DATA, playerSkills);
        console.log('Skill tree initialized');
        
        // Add keyboard shortcut for testing
        this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.K).on('down', () => {
            console.log('K key pressed - toggling skill tree directly from Game scene');
            if (this.skillTree) {
                this.skillTree.toggle();
            }
        });
    }

    /**
     * Initialize the skill manager
     */
    initializeSkillManager(): void {
        // Create skill manager if it doesn't exist
        if (!this.skillManager) {
            this.skillManager = new SkillManager(this);
            
            // Initialize with some skill points and available skills
            const allSkills = createAllSkills();
            this.skillManager.initialize(10, allSkills);
            
            // Listen for skill changes to update player stats
            this.skillManager.on('skill-learned', () => this.applySkillEffectsToStats());
            this.skillManager.on('skill-upgraded', () => this.applySkillEffectsToStats());
            this.skillManager.on('skill-reset', () => this.applySkillEffectsToStats());
            this.skillManager.on('specialization-changed', () => this.applySkillEffectsToStats());
        }
    }

    /**
     * Test skill effects and display them to the player
     */
    testSkillEffects(): void {
        // Skip if no skill manager or player stats
        if (!this.skillManager || !this.playerStats) {
            console.warn('Cannot test skill effects: skillManager or playerStats not found');
            return;
        }
        
        // Get base stats before skills
        const baseStats = {
            health: 100,
            maxHealth: 100,
            baseDamage: 5,
            defense: 0,
            critChance: 0.05,
            critDamageMultiplier: 1.5
        };
        
        // Apply skill effects
        if (!this.skillEffectSystem) {
            this.skillEffectSystem = new SkillEffectSystem(this, this.skillManager);
        }
        
        // Get modified stats
        const modifiedStats = this.skillEffectSystem.applyAllSkillEffects({...baseStats});
        
        // Create a text display showing the differences
        let statsText = 'Skill Effects:\n\n';
        
        // Health
        statsText += `Health: ${baseStats.maxHealth} → ${modifiedStats.maxHealth}\n`;
        
        // Base damage
        statsText += `Base Damage: ${baseStats.baseDamage} → ${modifiedStats.baseDamage}\n`;
        
        // Critical chance
        const baseCritPercent = Math.round(baseStats.critChance * 100);
        const modifiedCritPercent = Math.round((modifiedStats.critChance as number) * 100);
        statsText += `Crit Chance: ${baseCritPercent}% → ${modifiedCritPercent}%\n`;
        
        // Critical damage
        statsText += `Crit Damage: ${baseStats.critDamageMultiplier}x → ${modifiedStats.critDamageMultiplier}x\n`;
        
        // Defense
        statsText += `Defense: ${baseStats.defense} → ${modifiedStats.defense}\n`;
        
        // Special effects
        if (modifiedStats.cleaveChance) {
            const cleavePercent = Math.round((modifiedStats.cleaveChance as number) * 100);
            statsText += `\nCleave: ${cleavePercent}% chance to hit ${modifiedStats.cleaveTargets} targets\n`;
        }
        
        if (modifiedStats.dodgeChance) {
            const dodgePercent = Math.round((modifiedStats.dodgeChance as number) * 100);
            statsText += `Dodge: ${dodgePercent}% chance\n`;
        }
        
        if (modifiedStats.armorPierceChance) {
            const piercePercent = Math.round((modifiedStats.armorPierceChance as number) * 100);
            const pierceAmount = Math.round((modifiedStats.armorPierceAmount as number) * 100);
            statsText += `Pierce Armor: ${piercePercent}% chance to ignore ${pierceAmount}% armor\n`;
        }
        
        if (modifiedStats.poisonChance) {
            const poisonPercent = Math.round((modifiedStats.poisonChance as number) * 100);
            statsText += `Poison: ${poisonPercent}% chance to apply poison (${modifiedStats.poisonDamage} dmg for ${modifiedStats.poisonDuration}s)\n`;
        }
        
        if (modifiedStats.lowHealthDamageBonus) {
            const bonusPercent = Math.round((modifiedStats.lowHealthDamageBonus as number) * 100);
            const thresholdPercent = Math.round((modifiedStats.lowHealthThreshold as number) * 100);
            statsText += `Low Health Bonus: +${bonusPercent}% damage below ${thresholdPercent}% health\n`;
        }
        
        // Display the text
        const textObj = this.add.text(this.scale.width/2, this.scale.height/2, statsText, {
            backgroundColor: '#00000099',
            padding: { x: 20, y: 20 },
            color: '#FFFFFF',
            align: 'left'
        });
        textObj.setOrigin(0.5);
        textObj.setDepth(2000);
        
        // Remove after a few seconds
        this.time.delayedCall(10000, () => {
            textObj.destroy();
        });
    }
}
