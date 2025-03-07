import { Scene } from 'phaser';
import * as L from 'leaflet';
import * as turf from '@turf/turf';
import { MapSystem } from './Map';
import { PopupSystem } from './PopupSystem';

// Extend the Leaflet Marker type to include our custom popup property
interface FlagMarker extends L.Marker {
    popup?: L.Popup;
    _interactionClone?: HTMLElement;
}

export interface FlagData {
    id: string;
    lat: number;
    lon: number;
    isPlayerFlag: boolean;
    name?: string;
    creationDate?: Date;
    // Add health status for repair functionality
    health?: number;
    // Add hardened status for harden functionality
    hardened?: boolean;
}

export class FlagSystem {
    private scene: Scene;
    private mapSystem: MapSystem;
    private popupSystem: PopupSystem;
    
    // Storage for all flags - make this public to allow access from Game scene
    public flags: Map<string, FlagData> = new Map();
    private flagMarkers: Map<string, FlagMarker> = new Map();
    private flagCircles: Map<string, L.Circle> = new Map();
    
    // Merged flag circles visualization
    private mergedFlagLayer: L.GeoJSON | null = null;
    
    // Default flag radius (in meters)
    readonly flagRadius: number = 200;
    
    constructor(scene: Scene, mapSystem: MapSystem, popupSystem: PopupSystem) {
        this.scene = scene;
        this.mapSystem = mapSystem;
        this.popupSystem = popupSystem;
        
        // Add custom CSS for flag circles
        const flagCircleStyle = document.createElement('style');
        flagCircleStyle.innerHTML = `
            /* Style flag circles */
            .flag-radius-circle {
                pointer-events: none !important;
                z-index: 601 !important; /* Increased z-index to appear above trees (typically 450-600) */
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
                z-index: 1000 !important; /* Increased to make it higher than everything else */
                cursor: pointer !important; /* Show pointer cursor on hover */
                transition: transform 0.2s ease, filter 0.2s ease;
            }
            
            /* Hover effects for flag markers - use transform-origin to prevent position shift */
            .player-flag-marker:hover, .flag-marker:hover {
                transform: scale(1.2) !important;
                transform-origin: center bottom !important;
                z-index: 1001 !important; /* Ensure hovered flag is above others */
            }
            
            /* Fix for interaction layer flag markers */
            #map-interaction-layer .player-flag-marker:hover, 
            #map-interaction-layer .flag-marker:hover {
                transform: scale(1.2) !important;
                transform-origin: center bottom !important;
            }
            
            /* Merged flag circles style */
            .merged-flag-circles {
                pointer-events: none !important;
                z-index: 602 !important; /* Higher than individual circles but below markers */
            }
            
            .merged-flag-circles path {
                stroke-opacity: 1.0 !important;
                fill-opacity: 0.25 !important;
                stroke-width: 3px !important;
            }
            
            /* Specific styles for player flags vs other flags */
            .player-flag-marker {
                filter: drop-shadow(0 0 5px rgba(255, 85, 0, 0.8));
            }
            
            .player-flag-marker:hover {
                filter: drop-shadow(0 0 8px rgba(255, 85, 0, 1.0));
            }
            
            .flag-marker {
                filter: drop-shadow(0 0 5px rgba(34, 102, 255, 0.8));
            }
            
            .flag-marker:hover {
                filter: drop-shadow(0 0 8px rgba(34, 102, 255, 1.0));
            }
        `;
        document.head.appendChild(flagCircleStyle);
        
        // Create a custom pane for flag circles with proper z-index
        if (this.mapSystem.leafletMap) {
            // Create a custom pane for circles if it doesn't exist yet
            if (!this.mapSystem.leafletMap.getPane('flagCirclePane')) {
                this.mapSystem.leafletMap.createPane('flagCirclePane');
                const pane = this.mapSystem.leafletMap.getPane('flagCirclePane');
                if (pane) {
                    pane.style.zIndex = '650'; // Increased z-index to be well above trees
                    console.log('Created custom pane for flag circles');
                }
            }
            
            // Also create a special pane for flag markers
            if (!this.mapSystem.leafletMap.getPane('flagMarkerPane')) {
                this.mapSystem.leafletMap.createPane('flagMarkerPane');
                const pane = this.mapSystem.leafletMap.getPane('flagMarkerPane');
                if (pane) {
                    pane.style.zIndex = '700'; // Very high z-index for flag markers
                    console.log('Created custom pane for flag markers');
                }
            }
            
            // Create the merged flag layer
            this.mergedFlagLayer = L.geoJSON(null, {
                style: {
                    fillColor: '#3388ff',
                    weight: 3,
                    opacity: 0.8,
                    color: '#3388ff',
                    fillOpacity: 0.2,
                    className: 'merged-flag-circles'
                },
                pane: 'flagCirclePane',
                interactive: false
            }).addTo(this.mapSystem.leafletMap);
        }
        
        console.log('🚩 Flag System Initialized');
        
        // Force a small delay before adding flags to ensure the map is fully initialized
        setTimeout(() => {
            console.log('🚩 Flag system ready for flag placement');
        }, 1000);
    }
    
    /**
     * Create a new flag at the specified position
     * @returns The flag ID if successful, null if placement is invalid
     */
    createFlag(lat: number, lon: number, isPlayerFlag: boolean = false, name?: string): string | null {
        // Log the flag creation attempt
        console.log(`Attempting to create ${isPlayerFlag ? 'player' : 'environment'} flag at:`, {
            lat, 
            lon,
            isPlayerFlag
        });
        
        // For player flags, we'll be more lenient with boundary checks
        // since the player is always supposed to be within the navigation circle
        if (!isPlayerFlag) {
            // First check if the proposed flag location is within the navigation circle
            if (!this.isWithinNavigationCircle(lat, lon)) {
                console.warn('⚠️ Cannot place flag: Location is outside the navigation circle');
                
                // Emit an event for the UI to show a message to the player
                this.scene.events.emit('flag-placement-failed', {
                    reason: 'outside_boundary',
                    message: 'Cannot place flag here: Outside the navigation boundary'
                });
                
                return null;
            }
        }
        
        // Check if the proposed flag location is within the radius of any existing flag
        if (this.isWithinAnyFlagRadius(lat, lon, true)) {
            console.warn('⚠️ Cannot place flag: Location overlaps with an existing flag radius');
            
            // Emit an event for the UI to show a message to the player
            this.scene.events.emit('flag-placement-failed', {
                reason: 'overlap',
                message: 'Cannot place flag here: Too close to another flag'
            });
            
            return null;
        }
        
        // Generate a unique ID for the flag
        const flagId = `flag_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
        
        // Store flag data
        const newFlag: FlagData = {
            id: flagId,
            lat,
            lon,
            isPlayerFlag,
            name: name || `Flag ${this.flags.size + 1}`,
            creationDate: new Date(),
            // Initialize health and hardened status
            health: 100,
            hardened: false
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
     * Check if a location is within the radius of any existing flag
     * @param visualize Whether to show a visual indicator of the overlapping area
     */
    isWithinAnyFlagRadius(lat: number, lon: number, visualize: boolean = false): boolean {
        if (this.flags.size === 0) {
            return false; // No flags to check against
        }
        
        const position = L.latLng(lat, lon);
        
        // Check against all existing flags
        for (const flag of this.flags.values()) {
            const flagPosition = L.latLng(flag.lat, flag.lon);
            const distanceInMeters = flagPosition.distanceTo(position);
            
            // If the new position is within an existing flag's radius
            if (distanceInMeters <= this.flagRadius) {
                console.log(`Flag placement invalid: Too close to flag "${flag.name}" (${distanceInMeters.toFixed(1)}m)`);
                
                // Visualize the overlap if requested
                if (visualize && this.mapSystem.leafletMap) {
                    this.showOverlapIndicator(flag, lat, lon);
                }
                
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Display a temporary visual indicator showing the flag radius overlap
     */
    private showOverlapIndicator(flag: FlagData, newLat: number, newLon: number): void {
        if (!this.mapSystem.leafletMap) return;
        
        // Create a temporary circle at the existing flag's position
        const flagPosition = L.latLng(flag.lat, flag.lon);
        const newPosition = L.latLng(newLat, newLon);
        
        // Create a pulsing circle to show the overlapping flag radius
        const pulsingCircle = L.circle(flagPosition, {
            radius: this.flagRadius,
            color: '#FF0000',
            weight: 3,
            opacity: 0.8,
            fillColor: '#FF0000',
            fillOpacity: 0.3,
            className: 'overlap-indicator'
        }).addTo(this.mapSystem.leafletMap);
        
        // Create a temporary line connecting the points
        const connectingLine = L.polyline([flagPosition, newPosition], {
            color: '#FF0000',
            weight: 3,
            opacity: 0.8,
            dashArray: '5, 10',
            className: 'overlap-indicator'
        }).addTo(this.mapSystem.leafletMap);
        
        // Create a small marker at the attempted position
        const invalidMarker = L.circle(newPosition, {
            radius: 5,
            color: '#FF0000',
            weight: 3,
            opacity: 1.0,
            fillColor: '#FF0000',
            fillOpacity: 1.0,
            className: 'overlap-indicator'
        }).addTo(this.mapSystem.leafletMap);
        
        // Add a label showing the distance
        const distance = flagPosition.distanceTo(newPosition).toFixed(1);
        const midPoint = L.latLng(
            (flag.lat + newLat) / 2,
            (flag.lon + newLon) / 2
        );
        
        // Add CSS for the distance label if not already added
        if (!document.getElementById('flag-overlap-styles')) {
            const style = document.createElement('style');
            style.id = 'flag-overlap-styles';
            style.innerHTML = `
                .distance-label {
                    background-color: rgba(255, 0, 0, 0.7);
                    border: 2px solid #FF0000;
                    color: white;
                    padding: 2px 6px;
                    border-radius: 4px;
                    font-weight: bold;
                    font-size: 12px;
                    text-align: center;
                    white-space: nowrap;
                }
            `;
            document.head.appendChild(style);
        }
        
        const distanceLabel = L.marker(midPoint, {
            icon: L.divIcon({
                className: 'distance-label',
                html: `${distance}m`,
                iconSize: [60, 20],
                iconAnchor: [30, 10]
            })
        }).addTo(this.mapSystem.leafletMap);
        
        // Pulse the circle for better visibility
        let opacity = 0.3;
        let increasing = true;
        const pulseInterval = setInterval(() => {
            if (increasing) {
                opacity += 0.05;
                if (opacity >= 0.6) increasing = false;
            } else {
                opacity -= 0.05;
                if (opacity <= 0.2) increasing = true;
            }
            
            try {
                pulsingCircle.setStyle({ fillOpacity: opacity });
            } catch (e) {
                // Circle might have been removed
                clearInterval(pulseInterval);
            }
        }, 100);
        
        // Remove everything after 3 seconds
        setTimeout(() => {
            clearInterval(pulseInterval);
            
            try {
                if (this.mapSystem.leafletMap) {
                    pulsingCircle.remove();
                    connectingLine.remove();
                    invalidMarker.remove();
                    distanceLabel.remove();
                }
            } catch (e) {
                console.warn('Error removing overlap indicators', e);
            }
        }, 3000);
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
        
        // Emit a teleport event that the player can listen to
        this.scene.events.emit('flag-teleport', {
            lat: flag.lat,
            lon: flag.lon,
            flagId: flagId
        });
        
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
        if (!this.mapSystem.navigationCircle) {
            console.warn('Navigation circle not initialized when checking position');
            return false;
        }
        
        const circleCenter = this.mapSystem.navigationCircle.getLatLng();
        const position = L.latLng(lat, lon);
        const distanceInMeters = circleCenter.distanceTo(position);
        const navigationRadius = this.mapSystem.navigationRadius;
        
        // Add detailed logging to help diagnose the issue
        console.log('Navigation boundary check:', {
            position: [lat, lon],
            circleCenter: [circleCenter.lat, circleCenter.lng],
            distanceInMeters,
            navigationRadius,
            isWithin: distanceInMeters <= navigationRadius
        });
        
        // For player flags, always allow placement
        // This is a temporary fix to ensure players can always place flags at their position
        const callerName = new Error().stack?.split('\n')[2]?.trim() || '';
        if (callerName.includes('placePlayerFlag')) {
            console.log('Allowing player flag placement regardless of boundary check');
            return true;
        }
        
        return distanceInMeters <= navigationRadius;
    }
    
    /**
     * Add a flag marker to the map
     */
    private addFlagMarker(flag: FlagData): L.Marker {
        if (!this.mapSystem.leafletMap) {
            console.warn('⚠️ Cannot add flag marker: Map not initialized');
            return null as any;
        }
        
        // Set the flag color based on flag type
        const flagColor = flag.isPlayerFlag ? '#ff5500' : '#2266ff';
        
        // Create a flag icon using Leaflet's divIcon with a more interactive appearance
        const flagIcon = L.divIcon({
            className: flag.isPlayerFlag ? 'player-flag-marker' : 'flag-marker',
            html: `
                <div style="
                    color: ${flagColor}; 
                    font-size: 24px;
                    text-align: center;
                    position: relative;
                ">
                    <div style="
                        position: absolute;
                        bottom: -5px;
                        left: 50%;
                        transform: translateX(-50%);
                        width: 10px;
                        height: 10px;
                        background-color: rgba(255, 255, 255, 0.7);
                        border-radius: 50%;
                        box-shadow: 0 0 5px rgba(0, 0, 0, 0.3);
                        opacity: 0.8;
                    "></div>
                    🚩
                </div>
            `,
            iconSize: [24, 24],
            iconAnchor: [12, 24] // Bottom center of the icon is the exact flag position
        });
        
        console.log(`Adding flag marker at [${flag.lat}, ${flag.lon}]`);
        
        // Create the circle but don't add it to the map directly
        const flagCircle = L.circle([flag.lat, flag.lon], {
            radius: this.flagRadius,
            color: flagColor,
            weight: 3,
            opacity: 1.0,
            fillColor: flagColor,
            fillOpacity: 0.25,
            className: 'flag-radius-circle',
            pane: 'flagCirclePane',
            interactive: false
        });
        
        // Store circle reference
        this.flagCircles.set(flag.id, flagCircle);
        
        // Add the flag marker to the map
        const flagMarker = L.marker([flag.lat, flag.lon], { 
            icon: flagIcon,
            interactive: true,
            zIndexOffset: 2000, // Very high to ensure it's above everything else
            pane: 'flagMarkerPane' // Use our custom high z-index pane
        }) as FlagMarker;
        
        // Add the marker to the map
        flagMarker.addTo(this.mapSystem.leafletMap!);
        
        // Make the original marker invisible but keep it for positioning
        setTimeout(() => {
            const markerElement = flagMarker.getElement();
            if (markerElement) {
                // Make the original marker invisible by setting opacity to 0
                markerElement.style.opacity = '0';
                markerElement.style.pointerEvents = 'none';
                
                // Move the marker to the interaction layer
                if (this.mapSystem.interactionElement) {
                    try {
                        // Get the marker's position in screen coordinates
                        const markerPos = this.mapSystem.geoToScreenCoordinates(flag.lat, flag.lon);
                        if (!markerPos) return;
                        
                        // Clone the marker element to the interaction layer
                        const clone = markerElement.cloneNode(true) as HTMLElement;
                        // Reset opacity for the clone
                        clone.style.opacity = '1';
                        clone.style.pointerEvents = 'auto';
                        
                        // Position the clone at the exact same position as the original marker
                        clone.style.position = 'absolute';
                        clone.style.left = `${markerPos.x - 12}px`; // Adjust for icon anchor (half of iconSize width)
                        clone.style.top = `${markerPos.y - 24}px`; // Adjust for icon anchor (full iconSize height)
                        clone.style.zIndex = '1000';
                        clone.style.transform = 'none'; // Prevent any transform that might shift position
                        
                        this.mapSystem.interactionElement.appendChild(clone);
                        
                        // Add click event to the cloned marker
                        clone.addEventListener('click', (e) => {
                            // Prevent the default behavior
                            e.stopPropagation();
                            
                            // Show the flag popup using the PopupSystem
                            this.showFlagPopup(flag);
                        });
                        
                        // Store the clone reference for later updates
                        flagMarker._interactionClone = clone;
                    } catch (error) {
                        console.error('Error cloning marker to interaction layer:', error);
                        // If cloning fails, make the original marker visible and interactive again
                        markerElement.style.opacity = '1';
                        markerElement.style.pointerEvents = 'auto';
                    }
                } else {
                    console.warn('Interaction layer not available for flag marker');
                    // Fallback to using the original marker's click event
                    // Make the original marker visible and interactive again
                    markerElement.style.opacity = '1';
                    markerElement.style.pointerEvents = 'auto';
                    
                    flagMarker.on('click', (e) => {
                        console.log('Flag marker clicked (fallback):', flag.id);
                        // Prevent the default behavior
                        L.DomEvent.stopPropagation(e);
                        
                        // Show the flag popup using the PopupSystem
                        this.showFlagPopup(flag);
                    });
                }
            }
        }, 100);
        
        // Store marker reference
        this.flagMarkers.set(flag.id, flagMarker);
        
        // Update the merged circles
        this.updateMergedFlagCircles();
        
        // Log creation
        console.log(`🚩⭕ Flag with circle added: ${flag.name}`, {
            id: flag.id,
            position: [flag.lat, flag.lon],
            circleRadius: this.flagRadius,
            color: flagColor
        });
        
        return flagMarker;
    }
    
    /**
     * Show the flag popup using the PopupSystem
     */
    private showFlagPopup(flag: FlagData): void {
        // Create the popup content
        const popupContent = {
            html: this.createFlagContextMenu(flag),
            buttons: [
                {
                    selector: '.jump-to-flag',
                    onClick: () => {
                        this.jumpToFlag(flag.id);
                        this.popupSystem.closePopupsByClass('flag-popup');
                    }
                },
                {
                    selector: '.destroy-flag',
                    onClick: () => {
                        if (confirm(`Are you sure you want to destroy "${flag.name}"?`)) {
                            this.removeFlag(flag.id);
                        } else {
                            this.popupSystem.closePopupsByClass('flag-popup');
                        }
                    }
                },
                {
                    selector: '.repair-flag',
                    onClick: () => {
                        this.repairFlag(flag.id);
                        // Update the popup content to reflect repairs
                        this.showFlagPopup(flag);
                    }
                },
                {
                    selector: '.harden-flag',
                    onClick: () => {
                        this.hardenFlag(flag.id);
                        // Update the popup content
                        this.showFlagPopup(flag);
                    }
                }
            ]
        };
        
        // Create the popup
        this.popupSystem.createPopup(flag.lat, flag.lon, popupContent, {
            className: 'popup-container flag-popup',
            offset: { x: 0, y: -30 }
        });
    }
    
    /**
     * Create a rich HTML context menu for flag interactions
     */
    private createFlagContextMenu(flag: FlagData): string {
        // Determine button states based on flag properties
        const canRepair = (flag.health !== undefined && flag.health < 100);
        const isHardened = flag.hardened || false;
        
        return `
            <div class="popup-content">
                <h3>${flag.name}</h3>
                <div class="popup-stats">
                    <div class="stat-row">
                        <span class="stat-label">Type:</span>
                        <span class="stat-value">${flag.isPlayerFlag ? 'Your Flag' : 'Other Player\'s Flag'}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">Created:</span>
                        <span class="stat-value">${flag.creationDate ? flag.creationDate.toLocaleString() : 'Unknown'}</span>
                    </div>
                    ${flag.health !== undefined ? `
                    <div class="stat-row">
                        <span class="stat-label">Health:</span>
                        <span class="stat-value" style="color: ${flag.health > 70 ? '#4caf50' : flag.health > 30 ? '#ff9800' : '#f44336'}">
                            ${flag.health}%
                        </span>
                    </div>
                    ` : ''}
                    ${flag.hardened !== undefined ? `
                    <div class="stat-row">
                        <span class="stat-label">Hardened:</span>
                        <span class="stat-value">${flag.hardened ? '✅ Yes' : '❌ No'}</span>
                    </div>
                    ` : ''}
                </div>
                
                <div class="popup-actions">
                    <button class="action-btn teleport-btn" data-flag-id="${flag.id}">
                        Jump to Flag
                    </button>
                    
                    ${canRepair ? `
                    <button class="action-btn repair-btn" data-flag-id="${flag.id}">
                        Repair Flag
                    </button>
                    ` : ''}
                    
                    ${!isHardened ? `
                    <button class="action-btn harden-btn" data-flag-id="${flag.id}">
                        Harden Flag
                    </button>
                    ` : ''}
                    
                    <button class="action-btn danger-btn" data-flag-id="${flag.id}">
                        Destroy Flag
                    </button>
                </div>
            </div>
        `;
    }
    
    /**
     * Repair a damaged flag (restore health)
     */
    public repairFlag(flagId: string): boolean {
        const flag = this.flags.get(flagId);
        if (!flag) return false;
        
        // Restore flag health
        if (flag.health !== undefined) {
            const oldHealth = flag.health;
            flag.health = 100;
            
            console.log(`🚩🔧 Flag Repaired: ${flag.name}`, {
                id: flagId,
                oldHealth,
                newHealth: flag.health
            });
            
            // Emit repair event
            this.scene.events.emit('flag-repaired', {
                flagId,
                oldHealth,
                newHealth: flag.health
            });
            
            return true;
        }
        
        return false;
    }
    
    /**
     * Harden a flag to make it more resistant
     */
    public hardenFlag(flagId: string): boolean {
        const flag = this.flags.get(flagId);
        if (!flag) return false;
        
        // Harden the flag
        flag.hardened = true;
        
        console.log(`🚩🛡️ Flag Hardened: ${flag.name}`, {
            id: flagId
        });
        
        // Emit harden event
        this.scene.events.emit('flag-hardened', {
            flagId,
            flag
        });
        
        return true;
    }
    
    /**
     * Update the merged flag circles visualization
     */
    private updateMergedFlagCircles(): void {
        if (!this.mapSystem.leafletMap || !this.mergedFlagLayer) return;
        
        // Remove the current merged layer from the map
        this.mergedFlagLayer.remove();
        
        // Create Turf circle features for each flag
        const circleFeatures: any[] = [];
        
        this.flags.forEach(flag => {
            // Create a circle feature for each flag
            const center = turf.point([flag.lon, flag.lat]);
            const circle = turf.circle(center, this.flagRadius / 1000, { // Convert to km for turf
                steps: 64, // Higher number for smoother circles
                units: 'kilometers',
                properties: {
                    flagId: flag.id,
                    isPlayerFlag: flag.isPlayerFlag
                }
            });
            
            circleFeatures.push(circle);
        });
        
        // If we have no circles, just return
        if (circleFeatures.length === 0) return;
        
        // If we only have one circle, use it directly
        if (circleFeatures.length === 1) {
            this.mergedFlagLayer = L.geoJSON(circleFeatures[0], {
                style: (feature) => {
                    // Check if this is a player flag
                    const isPlayerFlag = feature?.properties?.isPlayerFlag || false;
                    return {
                        fillColor: isPlayerFlag ? '#ff5500' : '#2266ff',
                        weight: 3,
                        opacity: 0.8,
                        color: isPlayerFlag ? '#ff5500' : '#2266ff',
                        fillOpacity: 0.2,
                        className: 'merged-flag-circles'
                    };
                },
                pane: 'flagCirclePane',
                interactive: false
            }).addTo(this.mapSystem.leafletMap);
            return;
        }
        
        // If we have multiple circles, merge them
        try {
            // Create a feature collection
            const featureCollection = turf.featureCollection(circleFeatures);
            
            // Merge the circles using union operations
            let mergedGeometry;
            
            try {
                // Try to use the union operation
                let merged = circleFeatures[0];
                for (let i = 1; i < circleFeatures.length; i++) {
                    const result = turf.union(merged, circleFeatures[i]);
                    if (result) {
                        merged = result;
                    }
                }
                mergedGeometry = merged;
            } catch (e) {
                console.warn('Advanced union failed, using simpler approach', e);
                // Fallback to a simpler approach - just use the feature collection
                mergedGeometry = featureCollection;
            }
            
            // Create a new GeoJSON layer with the merged polygon
            this.mergedFlagLayer = L.geoJSON(mergedGeometry, {
                style: {
                    fillColor: '#3388ff', // Default blue
                    weight: 3,
                    opacity: 0.8,
                    color: '#3388ff',
                    fillOpacity: 0.2,
                    className: 'merged-flag-circles'
                },
                pane: 'flagCirclePane',
                interactive: false
            }).addTo(this.mapSystem.leafletMap);
            
            console.log('🚩⭕ Updated merged flag circles');
        } catch (error) {
            console.error('Error merging flag circles:', error);
            
            // Fallback: display individual circles if merging fails
            this.displayIndividualCircles();
        }
    }
    
    /**
     * Fallback method to display individual circles if merging fails
     */
    private displayIndividualCircles(): void {
        if (!this.mapSystem.leafletMap) return;
        
        // Remove all circles from the map first
        this.flagCircles.forEach(circle => circle.remove());
        
        // Add each circle to the map individually
        this.flags.forEach(flag => {
            const circle = this.flagCircles.get(flag.id);
            if (circle) {
                circle.addTo(this.mapSystem.leafletMap!);
            }
        });
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
            // Close the popup if it's open
            if (marker.popup && marker.popup.isOpen()) {
                marker.popup.close();
            }
            
            // Remove the interaction clone if it exists
            if (marker._interactionClone && this.mapSystem.interactionElement) {
                try {
                    this.mapSystem.interactionElement.removeChild(marker._interactionClone);
                } catch (error) {
                    console.warn('Error removing interaction clone:', error);
                }
            }
            
            marker.remove();
        }
        
        // Remove from our collections
        this.flagMarkers.delete(flagId);
        this.flagCircles.delete(flagId);
        this.flags.delete(flagId);
        
        // Update the merged circles
        this.updateMergedFlagCircles();
        
        console.log(`🚩❌ Flag Removed: ${flag.name}`, { id: flagId });
        
        // Emit flag destroyed event
        this.scene.events.emit('flag-destroyed', {
            flagId,
            flagName: flag.name,
            isPlayerFlag: flag.isPlayerFlag
        });
        
        return true;
    }
    
    /**
     * Clean up resources
     */
    destroy(): void {
        // Remove all markers from the map
        if (this.mapSystem.leafletMap) {
            this.flagMarkers.forEach(marker => marker.remove());
            
            // Remove the merged layer
            if (this.mergedFlagLayer) {
                this.mergedFlagLayer.remove();
                this.mergedFlagLayer = null;
            }
        }
        
        // Clear all collections
        this.flags.clear();
        this.flagMarkers.clear();
        this.flagCircles.clear();
        
        // Close any open popups
        this.popupSystem.closePopupsByClass('flag-popup');
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
            
            // If the popup is open, update its position too
            if (marker.popup && marker.popup.isOpen()) {
                marker.popup.setLatLng([lat, lon]);
            }
            
            // If there's an interaction clone, we need to update it
            if (marker._interactionClone && this.mapSystem.interactionElement) {
                // Get the new screen coordinates
                const markerPos = this.mapSystem.geoToScreenCoordinates(lat, lon);
                if (markerPos) {
                    // Update the clone's position
                    marker._interactionClone.style.left = `${markerPos.x - 12}px`; // Adjust for icon anchor
                    marker._interactionClone.style.top = `${markerPos.y - 24}px`; // Adjust for icon anchor
                } else {
                    // If we can't get screen coordinates, remove the old clone
                    try {
                        this.mapSystem.interactionElement.removeChild(marker._interactionClone);
                        marker._interactionClone = undefined;
                    } catch (error) {
                        console.warn('Error removing interaction clone:', error);
                    }
                }
            }
        }
        
        // Update circle position but don't add to map
        const circle = this.flagCircles.get(flagId);
        if (circle) {
            circle.setLatLng([lat, lon]);
        }
        
        // Update the merged circles
        this.updateMergedFlagCircles();
        
        console.log(`🚩📍 Flag Position Updated: ${flag.name}`, {
            id: flagId,
            newPosition: [lat, lon]
        });
        
        return true;
    }
}
