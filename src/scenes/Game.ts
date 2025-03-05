import { Scene } from 'phaser';
import 'leaflet/dist/leaflet.css';
import * as L from 'leaflet';

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

    constructor() {
        super('Game');
    }

    preload() {
        // No preloading needed for Leaflet
    }

    create() {
        this.camera = this.cameras.main;

        // Create container for game objects
        this.mapGroup = this.add.container(0, 0);

        // Create the map
        this.createLeafletMap();
        
        // Add semi-transparent white overlay
        this.addMapOverlay();

        // Add overlay message
        this.msg_text = this.add.text(512, 384, 'Leaflet Map View\nClick to continue', {
            fontFamily: 'Arial Black',
            fontSize: 32,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 5,
            align: 'center'
        });
        this.msg_text.setOrigin(0.5);
        this.msg_text.setScrollFactor(0);

        this.input.once('pointerdown', () => {
            this.destroyLeafletMap();
            this.scene.start('GameOver');
        });
    }

    addMapOverlay() {
        // Get the game dimensions
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Create a white semi-transparent rectangle covering the entire screen
        this.mapOverlay = this.add.rectangle(
            width / 2,
            height / 2,
            width * 3, // Wider than the screen
            height * 1.5, // Taller than the screen
            0xffffff,  // White color
            0.7        // 40% opacity (adjust as needed)
        );
        
        // Make sure it stays fixed to the camera
        this.mapOverlay.setScrollFactor(0);
        
        // Add it to the map group
        this.mapGroup.add(this.mapOverlay);
    }

    createLeafletMap() {
        // Get the exact game dimensions
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Get the canvas element
        const canvas = document.querySelector('canvas');
        let canvasRect = null;
        
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

        // Rest of the map initialization...
        this.leafletMap = L.map(this.mapElement, {
            attributionControl: true,
            zoomControl: false, // Disable zoom controls
            dragging: false,    // Disable dragging
            touchZoom: false,   // Disable touch zoom
            scrollWheelZoom: false, // Disable scroll zoom
            doubleClickZoom: false, // Disable double click zoom
            boxZoom: false,     // Disable box zoom
            tap: false          // Disable tap handler
        }).setView(
            [this.mapCenterLat, this.mapCenterLon], 
            this.mapZoom
        );

        // Add OpenStreetMap tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.leafletMap);
        
        // Force a resize/redraw of the map to ensure it fills the container
        setTimeout(() => {
            this.leafletMap.invalidateSize();
        }, 100);
    }

    destroyLeafletMap() {
        if (this.leafletMap) {
            this.leafletMap.remove();
            this.leafletMap = null;
        }
        
        if (this.mapElement && this.mapElement.parentNode) {
            this.mapElement.parentNode.removeChild(this.mapElement);
            this.mapElement = null;
        }
    }
}
