import { Scene } from 'phaser';
import 'leaflet/dist/leaflet.css';
import * as L from 'leaflet';
import { PlayerSystem } from '../systems/Player';

export class Game extends Scene {
    camera: Phaser.Cameras.Scene2D.Camera;
    msg_text: Phaser.GameObjects.Text;
    mapGroup: Phaser.GameObjects.Container;
    leafletMap: L.Map;
    mapElement: HTMLElement;
    mapOverlay: Phaser.GameObjects.Rectangle;

    // Map settings
    mapCenterLat = 51.505; // London example
    mapCenterLon = -0.09;
    mapZoom = 17; // Zoom level that shows ~600m

    // Radius in meters, flags will have 500m radius
    navigationRadius = 600; 

    // Player related properties
    player!: Phaser.Physics.Arcade.Sprite;
    playerSystem!: PlayerSystem;
    
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
    };

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

        // Create the map (with overlay built-in)
        this.createLeafletMap();
        
        // Add overlay message
        this.msg_text = this.add.text(512, 384, 'Leaflet Map View\nClick to continue', {
            fontFamily: 'Arial Black',
            fontSize: '32px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 5,
            align: 'center'
        });
        this.msg_text.setOrigin(0.5);
        this.msg_text.setScrollFactor(0);

        // Set up a one-time click handler to remove the map and switch scenes
        this.input.once('pointerdown', () => {
            this.destroyLeafletMap();
            this.scene.start('GameOver');
        });

        // Initialize player stats
        this.initPlayerStats();

        // Initialize the player system
        this.playerSystem = new PlayerSystem(this);
        // Create the player (this also sets this.player in the scene)
        this.player = this.playerSystem.createPlayer();

        // Optionally set up input for player (delegated to the system)
        this.playerSystem.setupInput();
    }

    createLeafletMap() {
        // Get the exact game dimensions
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Get the canvas element
        const canvas = document.querySelector('canvas');
        let canvasRect: DOMRect | null = null;
        
        if (canvas) {
            // Get the canvas position
            canvasRect = canvas.getBoundingClientRect();
        }
        
        // Create a DOM element for the map
        this.mapElement = document.createElement('div');
        this.mapElement.style.width = width + 'px';
        this.mapElement.style.height = height + 'px';
        this.mapElement.style.position = 'absolute';
        
        // Position the map element at exactly the same position as the canvas
        if (canvasRect) {
            this.mapElement.style.top = canvasRect.top + 'px';
            this.mapElement.style.left = canvasRect.left + 'px';
        } else {
            // Fallback if we can't get canvas position
            this.mapElement.style.top = '0px';
            this.mapElement.style.left = '0px';
        }
        
        this.mapElement.style.zIndex = '-1'; // Make sure it's behind the Phaser canvas
        
        // Insert before the canvas (instead of appending to body)
        if (canvas && canvas.parentNode) {
            canvas.parentNode.insertBefore(this.mapElement, canvas);
        } else {
            document.body.appendChild(this.mapElement);
        }

        // Initialize the Leaflet map
        this.leafletMap = L.map(this.mapElement, {
            attributionControl: true,
            zoomControl: false,    // Disable zoom controls
            dragging: false,       // Disable dragging
            touchZoom: false,      // Disable touch zoom
            scrollWheelZoom: false,// Disable scroll zoom
            doubleClickZoom: false,// Disable double click zoom
            boxZoom: false,        // Disable box zoom
            tap: false             // Disable tap handler
        }).setView(
            [this.mapCenterLat, this.mapCenterLon], 
            this.mapZoom
        );

        // Add OpenStreetMap tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.leafletMap);
        
        // Add semi-transparent overlay directly to the map element
        const overlay = document.createElement('div');
        overlay.style.position = 'absolute';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(255, 255, 255, 0.7)'; // White with 70% opacity
        overlay.style.zIndex = '1000'; // On top of map tiles but below Phaser
        this.mapElement.appendChild(overlay);
        
        // Force a resize/redraw of the map to ensure it fills the container
        setTimeout(() => {
            this.leafletMap.invalidateSize();
        }, 100);
    }

    destroyLeafletMap() {
        if (this.leafletMap) {
            this.leafletMap.remove();
            this.leafletMap = null as any;
        }
        
        if (this.mapElement && this.mapElement.parentNode) {
            this.mapElement.parentNode.removeChild(this.mapElement);
            this.mapElement = null as any;
        }
    }

    update(time: number, delta: number): void {
        if (this.player && this.player.active) {
            // Update player physics (stubbed in PlayerSystem)
            this.playerSystem.updatePlayerPhysics(delta);

            // Handle player movement
            this.playerSystem.handlePlayerMovement();
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
            flags: []
        };
    }
}
