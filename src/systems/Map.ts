import { Scene } from 'phaser';
import * as L from 'leaflet';

export class MapSystem {
    private scene: Scene;
    private camera: Phaser.Cameras.Scene2D.Camera;
    
    // Map properties
    leafletMap: L.Map;
    mapElement: HTMLElement;
    overlayElement: HTMLElement;
    mapOverlay: Phaser.GameObjects.Rectangle;
    navigationCircle: L.Circle;
    navigationCircleGraphics: Phaser.GameObjects.Graphics;
    
    // Map settings
    mapCenterLat: number;
    mapCenterLon: number;
    mapZoom: number;
    navigationRadius: number;
    
    // New properties
    navCircleStyleElement: HTMLStyleElement | null;
    
    constructor(scene: Scene, config?: {
        centerLat?: number;
        centerLon?: number;
        zoom?: number;
        navigationRadius?: number;
    }) {
        this.scene = scene;
        this.camera = scene.cameras.main;
        
        // Set default values or use provided config
        this.mapCenterLat = config?.centerLat || 51.505; // London default
        this.mapCenterLon = config?.centerLon || -0.09;
        this.mapZoom = config?.zoom || 17; // Zoom level that shows ~600m
        this.navigationRadius = config?.navigationRadius || 600; // Radius in meters
        
        // Initialize new properties
        this.navCircleStyleElement = null;
    }
    
    createMap(): void {
        // Get the exact game dimensions
        const width = this.camera.width;
        const height = this.camera.height;
        
        // Get the canvas element
        const canvas = document.querySelector('canvas');
        let canvasRect: DOMRect | null = null;
        
        if (canvas) {
            // Get the canvas position
            canvasRect = canvas.getBoundingClientRect();
        }
        
        // Create a DOM element for the map
        this.mapElement = document.createElement('div');
        this.mapElement.style.width = '100%'; // Use 100% width to ensure it covers the entire game area
        this.mapElement.style.height = '100%'; // Use 100% height to ensure it covers the entire game area
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
        
        // CRITICAL: Set the z-index to a negative value to ensure it's BEHIND the canvas
        // This ensures game objects rendered on the canvas will be visible above the map
        this.mapElement.style.zIndex = '-1';
        
        // If we need to insert before the canvas (instead of appending to body)
        if (canvas && canvas.parentNode) {
            canvas.parentNode.insertBefore(this.mapElement, canvas);
            
            // Ensure the canvas has a higher z-index and proper dimensions
            canvas.style.position = 'relative';
            canvas.style.zIndex = '2';
            canvas.style.width = '100%';
            canvas.style.height = '100%';
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
            boxZoom: false         // Disable box zoom
        }).setView(
            [this.mapCenterLat, this.mapCenterLon], 
            this.mapZoom
        );

        // Add OpenStreetMap tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.leafletMap);
        
        // Create a circle around your current location using Leaflet
        this.navigationCircle = L.circle([this.mapCenterLat, this.mapCenterLon], {
            radius: this.navigationRadius,
            color: '#000000', // Black border
            weight: 3, // Slightly thicker line
            opacity: 1.0, // Full opacity
            fillOpacity: 0.03, // Very slight fill for visibility
            dashArray: '8, 6', // Adjusted dash pattern
            className: 'navigation-radius-circle'
        }).addTo(this.leafletMap);
        
        // Create a Phaser graphics object for the navigation circle as well
        // This gives us a backup visualization method that should always be visible
        this.navigationCircleGraphics = this.scene.add.graphics();
        this.navigationCircleGraphics.clear();
        
        // Style the Phaser circle - Updated to black lines with no fill
        this.navigationCircleGraphics.lineStyle(3, 0x000000, 1.0); // Line style: width, color, alpha
        this.navigationCircleGraphics.fillStyle(0x000000, 0.03); // Very slight fill
        
        // Draw the Phaser circle - first convert GPS to screen coordinates
        const screenWidth = this.camera.width;
        const screenHeight = this.camera.height;
        const screenCenterX = screenWidth / 2;
        const screenCenterY = screenHeight / 2;
        
        // Draw circle at screen center - the radius should be proportional to but smaller than the screen
        // to ensure all elements fit within the visible area
        const screenRadius = Math.min(screenWidth, screenHeight) * 0.38; // Reduced from 0.4 to ensure visibility
        
        // Draw circle with more dotted/dashed segments
        const numberOfSegments = 64; // Increased from 32 to 64 for more dots
        const segmentAngle = (Math.PI * 2) / numberOfSegments;
        
        for (let i = 0; i < numberOfSegments; i++) {
            if (i % 2 === 0) { // Draw every other segment
                const startAngle = segmentAngle * i;
                const endAngle = segmentAngle * (i + 1);
                
                this.navigationCircleGraphics.beginPath();
                this.navigationCircleGraphics.arc(
                    screenCenterX, screenCenterY, 
                    screenRadius, 
                    startAngle, endAngle,
                    false
                );
                this.navigationCircleGraphics.strokePath();
            }
        }
        
        // Add a very slight fill
        this.navigationCircleGraphics.beginPath();
        this.navigationCircleGraphics.arc(
            screenCenterX, screenCenterY, 
            screenRadius, 
            0, Math.PI * 2,
            false
        );
        this.navigationCircleGraphics.fillPath();
        
        // Set appropriate depth for navigation circle - lower than player but visible
        this.navigationCircleGraphics.setDepth(5); // Player will have depth 100
        
        // Log circle creation
        console.log('🔴 Navigation Circle Created:', {
            position: [this.mapCenterLat, this.mapCenterLon],
            radius: this.navigationRadius,
            circleObject: this.navigationCircle,
            visible: this.navigationCircle ? true : false,
            domElement: document.querySelector('.navigation-radius-circle')
        });
            
        // Make sure the overlay pane is above map but below player
        const overlayPane = this.leafletMap.getPane('overlayPane');
        if (overlayPane) {
            overlayPane.style.zIndex = '10'; // Lower than player's z-index
        }
        
        // Create a custom style to ensure circle visibility but below player
        const navCircleStyle = document.createElement('style');
        navCircleStyle.innerHTML = `
            /* Make circle path visible but below player */
            .navigation-radius-circle path {
                stroke: #000000 !important;
                stroke-width: 3px !important;
                stroke-dasharray: 8px, 6px !important;
                stroke-opacity: 1.0 !important;
                fill: #000000 !important;
                fill-opacity: 0.03 !important;
                pointer-events: none;
            }
            
            /* Position overlay pane below canvas elements */
            .leaflet-overlay-pane {
                z-index: 10 !important;
            }
            
            /* Make the container transparent overlay below the player but above map */
            .leaflet-container:after {
                z-index: 15 !important;
            }
            
            /* Fix map container position and size */
            .leaflet-container {
                position: absolute !important;
                width: 100% !important;
                height: 100% !important;
                top: 0 !important;
                left: 0 !important;
            }
        `;
        document.head.appendChild(navCircleStyle);
        
        // Store the style element reference for cleanup
        this.navCircleStyleElement = navCircleStyle;
        
        // Add CSS to the document that directly affects Leaflet tiles
        const style = document.createElement('style');
        style.innerHTML = `
            .leaflet-container:after {
                content: '';
                display: block;
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(255, 255, 255, 0.4);
                pointer-events: none;
                z-index: 15; /* Below player but above map */
            }
            
            /* Ensure canvas elements stay on top */
            canvas {
                position: relative !important;
                z-index: 50 !important;
                width: 100% !important;
                height: 100% !important;
                display: block !important;
            }
            
            /* Make sure tile layers are visible but dimmed */
            .leaflet-tile-pane {
                opacity: 1 !important;
            }
            
            /* Ensure no black areas by making sure elements expand to full container */
            #game-container {
                overflow: hidden !important;
                width: 100% !important;
                height: 100% !important;
                position: relative !important;
            }
            
            /* Fix map container to fit properly */
            .leaflet-container {
                position: absolute !important;
                width: 100% !important;
                height: 100% !important;
                top: 0 !important;
                left: 0 !important;
            }
            
            /* Fix tile positioning */
            .leaflet-tile {
                position: absolute !important;
            }
        `;
        document.head.appendChild(style);
        
        // Store the style element reference for cleanup
        this.overlayElement = style;
        
        // No need for the backup Phaser overlay anymore, but keep the property for compatibility
        this.mapOverlay = this.scene.add.rectangle(0, 0, 1, 1, 0xffffff, 0);
        this.mapOverlay.setVisible(false);
        
        // Force a resize/redraw of the map to ensure it fills the container
        setTimeout(() => {
            this.leafletMap.invalidateSize();
        }, 100);
    }
    
    destroyMap(): void {
        // Clean up Phaser overlay
        if (this.mapOverlay) {
            this.mapOverlay.destroy();
        }
        
        // Clean up the Phaser graphics circle
        if (this.navigationCircleGraphics) {
            this.navigationCircleGraphics.clear();
            this.navigationCircleGraphics.destroy();
            this.navigationCircleGraphics = null as any;
        }
        
        // Remove the navigation circle
        if (this.navigationCircle && this.leafletMap) {
            this.navigationCircle.remove();
            this.navigationCircle = null as any;
        }
        
        // Clean up the navigation circle style element
        if (this.navCircleStyleElement && document.head.contains(this.navCircleStyleElement)) {
            document.head.removeChild(this.navCircleStyleElement);
            this.navCircleStyleElement = null as any;
        }
        
        // Clean up the style element
        if (this.overlayElement && document.head.contains(this.overlayElement)) {
            document.head.removeChild(this.overlayElement);
        }
        this.overlayElement = null as any;
        
        if (this.leafletMap) {
            this.leafletMap.remove();
            this.leafletMap = null as any;
        }
        
        if (this.mapElement && this.mapElement.parentNode) {
            this.mapElement.parentNode.removeChild(this.mapElement);
            this.mapElement = null as any;
        }
    }
    
    // Method to change overlay opacity
    setOverlayOpacity(opacity: number): void {
        const style = document.createElement('style');
        style.innerHTML = `
            .leaflet-container:after {
                content: '';
                display: block;
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(255, 255, 255, ${opacity});
                pointer-events: none;
                z-index: 15; /* Keep below player but above map */
            }
            
            /* Ensure canvas elements stay on top */
            canvas {
                position: relative !important;
                z-index: 50 !important;
            }
            
            /* Make sure tile layers are visible but dimmed */
            .leaflet-tile-pane {
                opacity: 1 !important;
            }
            
            /* Ensure the map container is properly positioned */
            .leaflet-container {
                position: absolute !important;
                width: 100% !important;
                height: 100% !important;
            }
        `;
        
        // Remove old style
        if (this.overlayElement && document.head.contains(this.overlayElement)) {
            document.head.removeChild(this.overlayElement);
        }
        
        // Add new style
        document.head.appendChild(style);
        this.overlayElement = style;
    }
    
    // Method to update the map center
    setMapCenter(lat: number, lon: number): void {
        if (this.leafletMap) {
            this.mapCenterLat = lat;
            this.mapCenterLon = lon;
            this.leafletMap.setView([lat, lon], this.mapZoom);
            
            // Update circle position when map center changes
            if (this.navigationCircle) {
                this.navigationCircle.setLatLng([lat, lon]);
                
                // Log circle position update
                console.log('🔄 Navigation Circle Updated via setMapCenter:', {
                    newPosition: [lat, lon],
                    radius: this.navigationRadius,
                    circleElement: document.querySelector('.navigation-radius-circle')
                });
            }
        }
    }
    
    /**
     * Update the navigation circle position
     */
    updateNavigationCircle(lat: number, lon: number): void {
        // Update the map center if provided
        if (lat && lon) {
            this.mapCenterLat = lat;
            this.mapCenterLon = lon;
        }
        
        // If no leaflet map, early return
        if (!this.leafletMap) return;
        
        // Remove existing navigation circle if it exists
        if (this.navigationCircle) {
            this.navigationCircle.remove();
        }
        
        // Create a new navigation circle at the updated position
        this.navigationCircle = L.circle([this.mapCenterLat, this.mapCenterLon], {
            radius: this.navigationRadius,
            color: '#FF5500',
            weight: 3,
            opacity: 0.8,
            fillColor: '#FF5500',
            fillOpacity: 0.1,
            className: 'navigation-circle'
        }).addTo(this.leafletMap);
        
        // Update the circle's position on the Phaser canvas as well
        if (!this.navigationCircleGraphics) {
            this.navigationCircleGraphics = this.scene.add.graphics();
        } else {
            this.navigationCircleGraphics.clear();
        }
        
        // Force the map to recenter at the new position 
        // This is important for teleporting to work correctly
        this.leafletMap.setView([this.mapCenterLat, this.mapCenterLon], this.mapZoom);
        
        console.log(`Navigation circle updated at [${this.mapCenterLat}, ${this.mapCenterLon}] with radius ${this.navigationRadius}m`);
    }
    
    // Method to update zoom level
    setZoom(zoom: number): void {
        if (this.leafletMap) {
            this.mapZoom = zoom;
            this.leafletMap.setZoom(zoom);
        }
    }
    
    /**
     * Returns the current navigation circle info
     */
    getNavigationCircleInfo(): { lat: number; lon: number; radius: number } {
        return {
            lat: this.mapCenterLat,
            lon: this.mapCenterLon,
            radius: this.navigationRadius
        };
    }
    
    /**
     * Gets the current player position based on the navigation circle
     */
    getPlayerPosition(): { lat: number; lon: number } | null {
        if (!this.navigationCircle) {
            return null;
        }
        
        const center = this.navigationCircle.getLatLng();
        return {
            lat: center.lat,
            lon: center.lng
        };
    }
    
    /**
     * Gets the exact player position by converting game world coordinates to map coordinates
     * @param playerX Player's X position in the game world
     * @param playerY Player's Y position in the game world
     */
    getExactPlayerPosition(playerX: number, playerY: number): { lat: number; lon: number } | null {
        if (!this.leafletMap || !this.navigationCircle) {
            return null;
        }
        
        try {
            // Get screen information
            const screenWidth = this.scene.scale.width;
            const screenHeight = this.scene.scale.height;
            const screenCenterX = screenWidth / 2;
            const screenCenterY = screenHeight / 2;
            
            // Log critical values for debugging
            console.log('Player position calculation:', {
                playerX,
                playerY,
                screenWidth,
                screenHeight,
                screenCenterX,
                screenCenterY
            });
            
            // Get the center of the navigation circle as our known GPS reference point
            const circleCenter = this.navigationCircle.getLatLng();
            
            // Calculate relative offset from screen center in pixels
            const offsetX = playerX - screenCenterX;
            const offsetY = playerY - screenCenterY;
            
            console.log('Player offset from center:', {
                offsetX,
                offsetY
            });
            
            // Convert screen position to projected coordinates
            const centerPoint = this.leafletMap.latLngToContainerPoint(circleCenter);
            const playerPoint = L.point(centerPoint.x + offsetX, centerPoint.y + offsetY);
            const playerLatLng = this.leafletMap.containerPointToLatLng(playerPoint);
            
            // Ensure we have proper coordinate values
            if (isNaN(playerLatLng.lat) || isNaN(playerLatLng.lng)) {
                console.warn('Invalid coordinates calculated', playerLatLng);
                return this.getPlayerPosition(); // fallback to center
            }
            
            const result = {
                lat: playerLatLng.lat,
                lon: playerLatLng.lng
            };
            
            console.log('Calculated player GPS position:', result);
            return result;
        } catch (error) {
            console.error('Error getting exact player position:', error);
            
            // Fallback to navigation circle center if there's an error
            return this.getPlayerPosition();
        }
    }
    
    /**
     * Converts screen coordinates to map coordinates
     */
    screenToMapCoordinates(x: number, y: number): { lat: number; lon: number } | null {
        if (!this.leafletMap) {
            console.error('Cannot convert coordinates: Map not initialized');
            return null;
        }
        
        try {
            // Log input coordinates for debugging
            console.log(`Converting screen coordinates [${x}, ${y}] to map coordinates`);
            
            // Get position of the map container
            const mapContainer = this.leafletMap.getContainer();
            const rect = mapContainer.getBoundingClientRect();
            
            // Calculate position relative to the map container
            const relativeX = x - rect.left;
            const relativeY = y - rect.top;
            
            console.log(`Relative to map container: [${relativeX}, ${relativeY}]`);
            
            // Convert container coordinates to map layer point
            const containerPoint = L.point(relativeX, relativeY);
            const layerPoint = this.leafletMap.containerPointToLayerPoint(containerPoint);
            
            // Convert layer point to geographical coordinates
            const latlng = this.leafletMap.layerPointToLatLng(layerPoint);
            
            const result = {
                lat: latlng.lat,
                lon: latlng.lng
            };
            
            console.log(`Converted to map coordinates: [${result.lat}, ${result.lon}]`);
            return result;
        } catch (error) {
            console.error('Error converting screen coordinates to map coordinates:', error);
            return null;
        }
    }
    
    /**
     * Convert geographical coordinates to screen coordinates 
     * for positioning game objects based on map positions
     */
    geoToScreenCoordinates(lat: number, lon: number): { x: number, y: number } | null {
        if (!this.leafletMap) return null;
        
        try {
            // Get the map center in pixels
            const mapCenter = this.leafletMap.getCenter();
            const centerPoint = this.leafletMap.latLngToContainerPoint([mapCenter.lat, mapCenter.lng]);
            
            // Get the target position in pixels
            const targetPoint = this.leafletMap.latLngToContainerPoint([lat, lon]);
            
            // Calculate screen position based on Phaser's coordinate system
            // Phaser coordinates have 0,0 at top-left while Leaflet container coordinates
            // are relative to the map container's top-left
            const { width, height } = this.scene.scale;
            
            // Get the center of the screen
            const screenCenterX = width / 2;
            const screenCenterY = height / 2;
            
            // Calculate the offset from map center
            const offsetX = targetPoint.x - centerPoint.x;
            const offsetY = targetPoint.y - centerPoint.y;
            
            // Apply the offset to the screen center
            const screenX = screenCenterX + offsetX;
            const screenY = screenCenterY + offsetY;
            
            return { x: screenX, y: screenY };
        } catch (error) {
            console.error('Error converting geo to screen coordinates:', error);
            return null;
        }
    }
} 