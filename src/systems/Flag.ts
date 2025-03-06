import { Scene } from 'phaser';
import * as L from 'leaflet';
import { MapSystem } from './Map';

export interface FlagData {
    id: string;
    lat: number;
    lon: number;
    isPlayerFlag: boolean;
    name?: string;
    creationDate?: Date;
}

export class FlagSystem {
    private scene: Scene;
    private mapSystem: MapSystem;
    
    // Storage for all flags
    private flags: Map<string, FlagData> = new Map();
    private flagMarkers: Map<string, L.Marker> = new Map();
    private flagCircles: Map<string, L.Circle> = new Map();
    
    // Default flag radius (in meters)
    readonly flagRadius: number = 500;
    
    constructor(scene: Scene, mapSystem: MapSystem) {
        this.scene = scene;
        this.mapSystem = mapSystem;
        
        // Add custom CSS for flag circles
        const flagCircleStyle = document.createElement('style');
        flagCircleStyle.innerHTML = `
            /* Style flag circles */
            .flag-radius-circle {
                pointer-events: none !important;
                z-index: 401 !important; /* Position above base map, just below markers */
            }
            
            /* Make flag circle paths more visible */
            .flag-radius-circle path {
                stroke-opacity: 1.0 !important;
                fill-opacity: 0.25 !important;
                stroke-width: 3px !important;
            }
            
            /* Force SVG elements to display */
            .leaflet-pane svg,
            .leaflet-pane path {
                display: block !important;
                visibility: visible !important;
            }
            
            /* Ensure flag markers are above circles */
            .player-flag-marker, .flag-marker {
                z-index: 600 !important;
            }
            
            /* Specific styles for player flags vs other flags */
            .player-flag-marker {
                filter: drop-shadow(0 0 5px rgba(255, 85, 0, 0.8));
            }
            
            .flag-marker {
                filter: drop-shadow(0 0 5px rgba(34, 102, 255, 0.8));
            }
        `;
        document.head.appendChild(flagCircleStyle);
        
        console.log('🚩 Flag System Initialized');
        
        // Force a small delay before adding flags to ensure the map is fully initialized
        setTimeout(() => {
            console.log('🚩 Flag system ready for flag placement');
        }, 1000);
    }
    
    /**
     * Create a new flag at the specified position
     */
    createFlag(lat: number, lon: number, isPlayerFlag: boolean = false, name?: string): string {
        // Generate a unique ID for the flag
        const flagId = `flag_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
        
        // Store flag data
        const newFlag: FlagData = {
            id: flagId,
            lat,
            lon,
            isPlayerFlag,
            name: name || `Flag ${this.flags.size + 1}`,
            creationDate: new Date()
        };
        
        this.flags.set(flagId, newFlag);
        
        // Add the flag marker to the map
        this.addFlagMarker(newFlag);
        
        console.log(`🚩 Flag Created: ${newFlag.name}`, {
            id: flagId,
            position: [lat, lon],
            isPlayerFlag
        });
        
        return flagId;
    }
    
    /**
     * Jump to a flag - this updates the navigation circle position
     */
    jumpToFlag(flagId: string): boolean {
        const flag = this.flags.get(flagId);
        
        if (!flag) {
            console.warn(`⚠️ Cannot jump to flag: Flag with ID ${flagId} not found`);
            return false;
        }
        
        // Update the map center and navigation circle
        this.mapSystem.setMapCenter(flag.lat, flag.lon);
        this.mapSystem.updateNavigationCircle(flag.lat, flag.lon);
        
        console.log(`🚩➡️ Jumped to Flag: ${flag.name}`, {
            id: flagId,
            position: [flag.lat, flag.lon]
        });
        
        return true;
    }
    
    /**
     * Check if a position is within the player's navigation circle
     */
    isWithinNavigationCircle(lat: number, lon: number): boolean {
        if (!this.mapSystem.navigationCircle) return false;
        
        const circleCenter = this.mapSystem.navigationCircle.getLatLng();
        const position = L.latLng(lat, lon);
        const distanceInMeters = circleCenter.distanceTo(position);
        
        return distanceInMeters <= this.mapSystem.navigationRadius;
    }
    
    /**
     * Add a flag marker to the map
     */
    private addFlagMarker(flag: FlagData): L.Marker {
        if (!this.mapSystem.leafletMap) {
            console.warn('⚠️ Cannot add flag marker: Map not initialized');
            return null as any;
        }
        
        // Create a flag icon using Leaflet's divIcon
        const flagIcon = L.divIcon({
            className: flag.isPlayerFlag ? 'player-flag-marker' : 'flag-marker',
            html: `<div style="color: ${flag.isPlayerFlag ? '#ff5500' : '#2266ff'}; font-size: 24px;">🚩</div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 24] // Bottom center of the icon is the exact flag position
        });
        
        console.log(`Adding flag marker at [${flag.lat}, ${flag.lon}]`);
        
        // Add the colored circle around the flag FIRST (so it appears below the flag marker)
        const flagColor = flag.isPlayerFlag ? '#ff5500' : '#2266ff';
        
        // Create a custom pane for circles if it doesn't exist yet
        if (!this.mapSystem.leafletMap.getPane('flagCirclePane')) {
            this.mapSystem.leafletMap.createPane('flagCirclePane');
            const pane = this.mapSystem.leafletMap.getPane('flagCirclePane');
            if (pane) {
                pane.style.zIndex = '400'; // Position between tiles (200) and markers (600)
                console.log('Created custom pane for flag circles');
            }
        }
        
        const flagCircle = L.circle([flag.lat, flag.lon], {
            radius: this.flagRadius, // 500m radius, slightly smaller than the boundary circle
            color: flagColor, // Same color as the flag
            weight: 3, // Increased border width for better visibility
            opacity: 1.0, // Full opacity for border
            fillColor: flagColor, // Same fill color as border
            fillOpacity: 0.25, // Increased opacity for better visibility
            className: 'flag-radius-circle',
            pane: 'flagCirclePane', // Use our custom pane
            interactive: false // Don't allow interactions with the circle
        }).addTo(this.mapSystem.leafletMap);
        
        // Store circle reference
        this.flagCircles.set(flag.id, flagCircle);
        
        // Now add the flag to the map (after the circle so it appears on top)
        const flagMarker = L.marker([flag.lat, flag.lon], { 
            icon: flagIcon,
            interactive: true,
            zIndexOffset: 1000, // Increase z-index to ensure it's above the circle
            pane: 'markerPane' // Use marker pane to ensure it's above the circle
        }).addTo(this.mapSystem.leafletMap);
        
        // Add a popup with flag info
        flagMarker.bindPopup(`
            <strong>${flag.name}</strong><br>
            ${flag.isPlayerFlag ? 'Your flag' : 'Other player\'s flag'}<br>
            <button class="jump-to-flag" data-flag-id="${flag.id}">Jump to this flag</button>
        `);
        
        // Store marker reference
        this.flagMarkers.set(flag.id, flagMarker);
        
        // Make the circle flash briefly to make it more noticeable
        const originalStyle = {
            color: flagColor,
            weight: 3,
            opacity: 1.0,
            fillOpacity: 0.25
        };
        
        // Flash effect - make it more visible initially
        flagCircle.setStyle({
            color: flagColor,
            weight: 5,
            opacity: 1.0,
            fillOpacity: 0.5
        });
        
        // Return to normal style after a short delay
        setTimeout(() => {
            if (flagCircle) {
                flagCircle.setStyle(originalStyle);
            }
        }, 800);
        
        // Log flag and circle creation
        console.log(`🚩⭕ Flag with circle added: ${flag.name}`, {
            id: flag.id,
            position: [flag.lat, flag.lon],
            circleRadius: this.flagRadius,
            color: flagColor
        });
        
        // Check if the flag is within the navigation circle
        const isWithinCircle = this.isWithinNavigationCircle(flag.lat, flag.lon);
        
        // Log flag placement and circle relationship
        console.log(`🚩 Flag ${flag.id} Added to Map:`, {
            position: [flag.lat, flag.lon],
            isPlayerFlag: flag.isPlayerFlag,
            isWithinNavigationCircle: isWithinCircle,
            distanceFromCircleCenter: this.mapSystem.navigationCircle ? 
                this.mapSystem.navigationCircle.getLatLng().distanceTo(L.latLng(flag.lat, flag.lon)).toFixed(1) + ' meters' : 
                'unknown'
        });
        
        // Visualize the circle-flag relationship
        if (this.mapSystem.navigationCircle && isWithinCircle) {
            // Draw a line from circle center to flag for better visualization
            const circleCenterLatLng = this.mapSystem.navigationCircle.getLatLng();
            const flagLatLng = L.latLng(flag.lat, flag.lon);
            
            // Add a temporary line to show distance
            const distanceLine = L.polyline([circleCenterLatLng, flagLatLng], {
                color: flag.isPlayerFlag ? '#ff5500' : '#2266ff',
                weight: 2,
                opacity: 0.7,
                dashArray: '5, 5'
            }).addTo(this.mapSystem.leafletMap);
            
            // Remove the line after 3 seconds
            setTimeout(() => {
                if (this.mapSystem.leafletMap && distanceLine) {
                    distanceLine.remove();
                }
            }, 3000);
        }
        
        return flagMarker;
    }
    
    /**
     * Get all flags within the navigation circle
     */
    getFlagsWithinNavigationCircle(): FlagData[] {
        const result: FlagData[] = [];
        
        this.flags.forEach(flag => {
            if (this.isWithinNavigationCircle(flag.lat, flag.lon)) {
                result.push(flag);
            }
        });
        
        return result;
    }
    
    /**
     * Remove a flag
     */
    removeFlag(flagId: string): boolean {
        const flag = this.flags.get(flagId);
        if (!flag) return false;
        
        // Remove the marker from the map
        const marker = this.flagMarkers.get(flagId);
        if (marker && this.mapSystem.leafletMap) {
            marker.remove();
        }
        
        // Remove the circle from the map
        const circle = this.flagCircles.get(flagId);
        if (circle && this.mapSystem.leafletMap) {
            circle.remove();
        }
        
        // Remove from our collections
        this.flagMarkers.delete(flagId);
        this.flagCircles.delete(flagId);
        this.flags.delete(flagId);
        
        console.log(`🚩❌ Flag Removed: ${flag.name}`, { id: flagId });
        
        return true;
    }
    
    /**
     * Clean up resources
     */
    destroy(): void {
        // Remove all markers from the map
        if (this.mapSystem.leafletMap) {
            this.flagMarkers.forEach(marker => marker.remove());
            this.flagCircles.forEach(circle => circle.remove());
        }
        
        // Clear collections
        this.flagMarkers.clear();
        this.flagCircles.clear();
        this.flags.clear();
    }
    
    /**
     * Update a flag's position
     */
    updateFlagPosition(flagId: string, lat: number, lon: number): boolean {
        const flag = this.flags.get(flagId);
        if (!flag) return false;
        
        // Update flag data
        flag.lat = lat;
        flag.lon = lon;
        
        // Update marker position
        const marker = this.flagMarkers.get(flagId);
        if (marker) {
            marker.setLatLng([lat, lon]);
        }
        
        // Update circle position
        const circle = this.flagCircles.get(flagId);
        if (circle) {
            circle.setLatLng([lat, lon]);
        }
        
        console.log(`🚩📍 Flag Position Updated: ${flag.name}`, {
            id: flagId,
            newPosition: [lat, lon]
        });
        
        return true;
    }
}
