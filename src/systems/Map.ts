import L from "leaflet";
import { logger, LogCategory } from "./Logger";

/**
 * MapManager class to handle Leaflet map integration
 * This class manages the map, player position, boundary circle, and flags
 */
export class MapManager {
  // Configuration properties
  config: {
    lat: number;
    lng: number;
    zoom: number;
    boundaryRadius: number;
    territoryRadius: number;
  };

  // Map properties
  map: L.Map | null;
  playerMarker: L.Marker | null;
  playerPosition: { lat: number; lng: number };
  targetPosition: { lat: number; lng: number } | null;
  boundaryCircle: L.Circle | null;
  flags: any[];
  territories: any[];
  isPlayerMoving: boolean;
  
  // Callback functions
  onPlayerClick: ((position: { lat: number; lng: number }) => void) | null;
  onPlayerMove: ((position: { lat: number; lng: number }) => void) | null;
  onPlayerReachTarget: (() => void) | null;
  
  // Other properties
  mapCenter: { lat: number; lng: number };
  debug: boolean;

  /**
   * Constructor for the MapManager
   * @param {Object} config - Configuration object
   * @param {number} config.lat - Initial latitude
   * @param {number} config.lng - Initial longitude
   * @param {number} config.zoom - Initial zoom level
   * @param {number} config.boundaryRadius - Radius of the boundary circle in meters
   * @param {number} config.territoryRadius - Radius of the territory circle in meters
   */
  constructor(config: { 
    lat?: number; 
    lng?: number; 
    zoom?: number; 
    boundaryRadius?: number; 
    territoryRadius?: number 
  }) {
    this.config = {
      lat: config.lat || 51.505,
      lng: config.lng || -0.09,
      zoom: config.zoom || 15,
      boundaryRadius: config.boundaryRadius || 600,
      territoryRadius: config.territoryRadius || 500,
    };

    this.map = null;
    this.playerMarker = null; // Leaflet marker (invisible)
    this.playerPosition = { lat: this.config.lat, lng: this.config.lng }; // Current player position
    this.targetPosition = null; // Target position for movement
    this.boundaryCircle = null;
    this.flags = [];
    this.territories = [];
    this.isPlayerMoving = false;
    this.onPlayerClick = null;
    this.onPlayerMove = null;
    this.onPlayerReachTarget = null;

    // Store the center position of the map
    this.mapCenter = { lat: this.config.lat, lng: this.config.lng };

    // Debug flag
    this.debug = true; // Set to true for debugging
  }

  /**
   * Initialize the map
   * @param containerId - ID of the container element
   * @returns The Leaflet map instance
   */
  initMap(containerId: string): L.Map | null {
    try {
      // Create map container if it doesn't exist
      let mapDiv = document.getElementById("map");
      if (!mapDiv) {
        mapDiv = document.createElement("div");
        mapDiv.id = "map";
        const container = document.getElementById(containerId);
        if (container) {
          container.appendChild(mapDiv);
        } else {
          logger.error(
            LogCategory.MAP,
            `Container with ID '${containerId}' not found`,
          );
          return null;
        }
      }

      // Initialize the map with all controls enabled
      this.map = L.map("map", {
        center: [this.config.lat, this.config.lng],
        zoom: this.config.zoom,
        zoomControl: true,
        attributionControl: true,
        dragging: true,
        touchZoom: true,
        doubleClickZoom: false,
        scrollWheelZoom: true,
        boxZoom: false,
        keyboard: false,
      });

      // Add tile layer
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(this.map);

      // Initialize player marker (invisible)
      this.initPlayerMarker();

      // Initialize boundary circle
      this.initBoundaryCircle();

      // Add click handler for map to move player
      this.map.on("click", (e) => {
        if (this.debug) {
          logger.info(LogCategory.MAP, "Map clicked at:", e.latlng);
          if (this.map) {
            logger.info(LogCategory.MAP, "Current map center:", this.map.getCenter());
          }
          logger.info(LogCategory.MAP, "Current player position:", this.playerPosition);
          logger.info(LogCategory.MAP, "Current boundary center:", this.config);
        }

        // Get the click coordinates
        const clickLat = e.latlng.lat;
        const clickLng = e.latlng.lng;

        // Calculate the distance from the boundary center (not the map center)
        if (this.map) {
          const distance = this.map.distance(
            [clickLat, clickLng],
            [this.config.lat, this.config.lng],
          );

          // Only proceed if the click is within the boundary circle
          if (distance <= this.config.boundaryRadius) {
            // Set the target position directly to the clicked coordinates
            this.setTargetPosition(clickLat, clickLng);

            if (this.debug) {
              logger.info(LogCategory.MAP,
                "Click within boundary, setting target to:",
                clickLat,
                clickLng,
              );
              logger.info(LogCategory.MAP, "Distance from boundary center:", distance);
            }
          } else if (this.debug) {
            logger.info(LogCategory.MAP, "Click outside boundary, ignoring. Distance:", distance);
          }
        }
      });

      // Add drag handler to keep player and boundary circle fixed
      this.map.on("drag", () => {
        this.updatePlayerPixelPosition();
      });

      this.map.on("dragend", () => {
        this.updatePlayerPixelPosition();
      });

      // Force a resize to ensure proper rendering
      setTimeout(() => {
        if (this.map) {
          this.map.invalidateSize();
          if (this.debug) {
            logger.info(LogCategory.MAP, "Map size invalidated");
          }
        }
      }, 100);

      return this.map;
    } catch (error) {
      logger.error(LogCategory.MAP, "Error initializing map:", error);
      return null;
    }
  }

  /**
   * Update the player's pixel position when the map is dragged
   */
  updatePlayerPixelPosition() {
    if (this.onPlayerMove) {
      this.onPlayerMove(this.playerPosition);
    }
  }

  /**
   * Initialize the player marker (invisible on the map)
   */
  initPlayerMarker() {
    try {
      if (!this.map) {
        logger.error(LogCategory.MAP, "Map not initialized, cannot create player marker");
        return;
      }
      
      // Create a minimal marker for tracking position on the map
      // This marker will be invisible as we'll use a Phaser sprite for visual representation
      this.playerMarker = L.marker([this.config.lat, this.config.lng], {
        opacity: 0, // Make it invisible
        zIndexOffset: 1000,
      }).addTo(this.map);

      // Store initial position
      this.playerPosition = {
        lat: this.config.lat,
        lng: this.config.lng,
      };

      if (this.debug) {
        logger.info(LogCategory.MAP, "Player marker initialized at:", this.playerPosition);
      }
    } catch (error) {
      logger.error(LogCategory.MAP, "Error initializing player marker:", error);
    }
  }

  /**
   * Set callback for player click
   * @param callback - Function to call when player is clicked
   */
  setPlayerClickCallback(callback: ((position: { lat: number; lng: number }) => void) | null) {
    this.onPlayerClick = callback;
  }

  /**
   * Set callback for player movement
   * @param callback - Function to call when player moves
   */
  setPlayerMoveCallback(callback: ((position: { lat: number; lng: number }) => void) | null) {
    this.onPlayerMove = callback;
  }

  /**
   * Set callback for when player reaches target
   * @param callback - Function to call when player reaches target
   */
  setPlayerReachTargetCallback(callback: (() => void) | null) {
    this.onPlayerReachTarget = callback;
  }

  /**
   * Set target position for player movement
   * @param lat - Target latitude
   * @param lng - Target longitude
   * @returns Whether the target was set
   */
  setTargetPosition(lat: number, lng: number): boolean {
    if (!this.map) {
      logger.warn(LogCategory.MAP, "Map not initialized");
      return false;
    }

    try {
      // Check if within boundary circle
      const distance = this.map.distance(
        [lat, lng],
        [this.config.lat, this.config.lng],
      );
      if (distance > this.config.boundaryRadius) {
        if (this.debug) {
          logger.info(LogCategory.MAP,
            "Target outside boundary:",
            distance,
            ">",
            this.config.boundaryRadius,
          );
        }
        return false;
      }

      // Set target position
      this.targetPosition = { lat, lng };
      
      // Important: Set isPlayerMoving to false so updatePlayerPosition will start movement
      this.isPlayerMoving = false;

      if (this.debug) {
        logger.info(LogCategory.MAP, "Target position set:", this.targetPosition);
        logger.info(LogCategory.MAP, "Distance from boundary center:", distance);
      }

      return true;
    } catch (error) {
      logger.error(LogCategory.MAP, "Error setting target position:", error);
      return false;
    }
  }

  /**
   * Update player position (called from Phaser update loop)
   * @param delta - Time delta in milliseconds
   * @returns Whether the player moved
   */
  updatePlayerPosition(delta: number): boolean {
    if (!this.targetPosition || this.isPlayerMoving || !this.map) {
      return false;
    }

    try {
      // Start moving
      this.isPlayerMoving = true;

      // Calculate movement parameters
      const startPos = this.playerPosition;
      const endPos = this.targetPosition;

      if (this.debug) {
        logger.info(LogCategory.MAP, "Starting player movement from", startPos, "to", endPos);
      }

      const distance = this.map.distance(
        [startPos.lat, startPos.lng],
        [endPos.lat, endPos.lng],
      );

      // Calculate movement duration based on distance
      const moveDuration = Math.min(1000, distance * 2); // 2ms per meter, max 1 second

      if (this.debug) {
        logger.info(LogCategory.MAP, "Movement distance:", distance, "duration:", moveDuration);
      }

      // Animate player movement
      this.animatePlayerMovement(startPos, endPos, moveDuration, () => {
        this.isPlayerMoving = false;
        this.targetPosition = null;

        // Call reach target callback
        if (this.onPlayerReachTarget) {
          this.onPlayerReachTarget();
        }
      });

      return true;
    } catch (error) {
      logger.error(LogCategory.MAP, "Error updating player position:", error);
      this.isPlayerMoving = false;
      return false;
    }
  }

  /**
   * Animate player movement
   * @param startPos - Starting position {lat, lng}
   * @param endPos - Ending position {lat, lng}
   * @param duration - Duration of animation in milliseconds
   * @param onComplete - Callback when animation completes
   */
  animatePlayerMovement(
    startPos: { lat: number; lng: number },
    endPos: { lat: number; lng: number },
    duration: number,
    onComplete: () => void
  ): void {
    const startTime = Date.now();

    // Ensure we have the correct starting position
    this.playerPosition = { ...startPos };

    // Force an initial update to ensure we start from the correct position
    if (this.onPlayerMove) {
      this.onPlayerMove(this.playerPosition);
    }

    const animate = () => {
      try {
        const now = Date.now();
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Calculate current position
        const lat = startPos.lat + (endPos.lat - startPos.lat) * progress;
        const lng = startPos.lng + (endPos.lng - startPos.lng) * progress;

        // Update player position
        this.playerPosition = { lat, lng };

        // Update marker position (invisible)
        if (this.playerMarker) {
          this.playerMarker.setLatLng([lat, lng]);
        }

        // Call move callback
        if (this.onPlayerMove) {
          this.onPlayerMove(this.playerPosition);
        }

        // Continue animation if not complete
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          // Animation complete
          if (onComplete) {
            onComplete();
          }
        }
      } catch (error) {
        logger.error(LogCategory.MAP, "Error in animation frame:", error);
        if (onComplete) {
          onComplete();
        }
      }
    };

    // Start animation
    animate();
  }

  /**
   * Initialize the boundary circle
   */
  initBoundaryCircle() {
    try {
      if (!this.map) {
        logger.error(LogCategory.MAP, "Map not initialized, cannot create boundary circle");
        return;
      }
      
      // Add boundary circle to map
      this.boundaryCircle = L.circle([this.config.lat, this.config.lng], {
        radius: this.config.boundaryRadius,
        color: "black",
        fillColor: "rgba(0, 0, 0, 0.05)",
        fillOpacity: 0.1,
        weight: 2,
        dashArray: "10, 5",
        interactive: false, // Make sure it doesn't interfere with clicks
      }).addTo(this.map);

      if (this.debug) {
        logger.info(LogCategory.MAP,
          "Boundary circle initialized with radius:",
          this.config.boundaryRadius,
        );
      }
    } catch (error) {
      logger.error(LogCategory.MAP, "Error initializing boundary circle:", error);
    }
  }

  /**
   * Add a flag to the map at the player's current position
   * @returns The flag object
   */
  addFlagAtPlayerPosition() {
    return this.addFlag(this.playerPosition.lat, this.playerPosition.lng);
  }

  /**
   * Add a flag to the map
   * @param lat - Latitude
   * @param lng - Longitude
   * @returns The flag object
   */
  addFlag(lat: number, lng: number) {
    if (!this.map) {
      logger.warn(LogCategory.MAP, "Map not initialized");
      return null;
    }

    try {
      // Check if flag can be placed (not within territory of another flag)
      if (!this.canPlaceFlag(lat, lng)) {
        if (this.debug) {
          logger.info(LogCategory.MAP, "Cannot place flag at:", lat, lng);
        }
        return null;
      }

      // Create custom icon for flag
      const flagIcon = L.divIcon({
        className: "flag-marker",
        html: '<div style="width: 40px; height: 50px; background-image: url(assets/svg/flag.svg); background-size: contain; cursor: pointer;"></div>',
        iconSize: [40, 50],
        iconAnchor: [20, 45],
      });

      // Add flag marker to map
      const flagMarker = L.marker([lat, lng], {
        icon: flagIcon,
        zIndexOffset: 500,
        interactive: true, // Make sure it's clickable
        riseOnHover: true, // Rise above other markers on hover
      }).addTo(this.map);

      // Add territory circle
      const territoryCircle = L.circle([lat, lng], {
        radius: this.config.territoryRadius,
        color: "#FF5252",
        fillColor: "#FF5252",
        fillOpacity: 0.1,
        weight: 1,
        dashArray: "5, 5",
        interactive: false, // Make sure it doesn't interfere with clicks
      }).addTo(this.map);

      // Add click handler to flag
      flagMarker.on("click", (e) => {
        if (this.debug) {
          logger.info(LogCategory.MAP, "Flag clicked at:", lat, lng);
        }

        // Jump to flag
        this.jumpToFlag(lat, lng);

        // Stop propagation to prevent map click
        L.DomEvent.stopPropagation(e);
      });

      // Store flag and territory
      const flag = {
        marker: flagMarker,
        territory: territoryCircle,
        lat: lat,
        lng: lng,
      };

      this.flags.push(flag);
      this.territories.push(territoryCircle);

      if (this.debug) {
        logger.info(LogCategory.MAP, "Flag added at:", lat, lng);
        logger.info(LogCategory.MAP, "Total flags:", this.flags.length);
      }

      return flag;
    } catch (error) {
      logger.error(LogCategory.MAP, "Error adding flag:", error);
      return null;
    }
  }

  /**
   * Check if a flag can be placed at the given coordinates
   * @param lat - Latitude
   * @param lng - Longitude
   * @returns Whether the flag can be placed
   */
  canPlaceFlag(lat: number, lng: number): boolean {
    if (!this.map) {
      return false;
    }

    try {
      // Check if within boundary circle
      const distance = this.map.distance(
        [lat, lng],
        [this.config.lat, this.config.lng],
      );
      if (distance > this.config.boundaryRadius) {
        return false;
      }

      // Check if within territory of another flag
      for (const flag of this.flags) {
        const flagDistance = this.map.distance(
          [lat, lng],
          [flag.lat, flag.lng],
        );
        if (flagDistance < this.config.territoryRadius) {
          return false;
        }
      }

      return true;
    } catch (error) {
      logger.error(LogCategory.MAP, "Error checking if flag can be placed:", error);
      return false;
    }
  }

  /**
   * Jump to a flag's location
   * @param lat - Latitude
   * @param lng - Longitude
   */
  jumpToFlag(lat: number, lng: number): void {
    if (!this.map) {
      logger.warn(LogCategory.MAP, "Map not initialized");
      return;
    }

    try {
      if (this.debug) {
        logger.info(LogCategory.MAP, "Starting jump to flag at:", lat, lng);
        logger.info(LogCategory.MAP,
          "Current player position before jump:",
          this.playerPosition,
        );
      }

      // Clear any existing target position to stop any ongoing movement
      this.targetPosition = null;
      this.isPlayerMoving = false;

      // Update config center position
      this.config.lat = lat;
      this.config.lng = lng;

      // Update player position immediately
      this.playerPosition = { lat, lng };

      // Update marker position (invisible)
      if (this.playerMarker) {
        this.playerMarker.setLatLng([lat, lng]);
      }

      // Update boundary circle
      if (this.boundaryCircle) {
        this.boundaryCircle.setLatLng([lat, lng]);
      }

      // Center map on new location
      this.map.panTo([lat, lng]);

      // Force an immediate update of the player's visual position
      if (this.onPlayerMove) {
        this.onPlayerMove(this.playerPosition);
      }

      // Show a visual feedback
      this.showJumpEffect(lat, lng);

      if (this.debug) {
        logger.info(LogCategory.MAP, "Completed jump to flag at:", lat, lng);
        logger.info(LogCategory.MAP, "Player position after jump:", this.playerPosition);
        logger.info(LogCategory.MAP,
          "Player pixel position after jump:",
          this.latLngToPixel(lat, lng),
        );
      }
    } catch (error) {
      logger.error(LogCategory.MAP, "Error jumping to flag:", error);
    }
  }

  /**
   * Show a visual effect when jumping to a flag
   * @param lat - Latitude
   * @param lng - Longitude
   */
  showJumpEffect(lat: number, lng: number): void {
    try {
      if (!this.map) {
        return;
      }
      
      // Create a temporary circle for the effect
      const jumpCircle = L.circle([lat, lng], {
        radius: 10,
        color: "#4285F4",
        fillColor: "#4285F4",
        fillOpacity: 0.5,
        weight: 2,
      }).addTo(this.map);

      // Animate the circle
      let size = 10;
      let opacity = 0.5;
      const interval = setInterval(() => {
        size += 20;
        opacity -= 0.05;

        if (size >= 200 || opacity <= 0) {
          clearInterval(interval);
          if (this.map) {
            this.map.removeLayer(jumpCircle);
          }
          return;
        }

        jumpCircle.setRadius(size);
        jumpCircle.setStyle({ fillOpacity: opacity });
      }, 50);
    } catch (error) {
      logger.error(LogCategory.MAP, "Error showing jump effect:", error);
    }
  }

  /**
   * Get available flag positions within the boundary circle
   * @param count - Number of positions to generate
   * @returns Array of available positions
   */
  getAvailableFlagPositions(count = 5) {
    if (!this.map) {
      logger.warn(LogCategory.MAP, "Map not initialized");
      return [];
    }

    try {
      const positions = [];
      const attempts = count * 10; // Try more times than needed to ensure we get enough positions

      for (let i = 0; i < attempts && positions.length < count; i++) {
        // Generate random angle and distance
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * this.config.boundaryRadius * 0.8; // 80% of boundary radius

        // Calculate position
        const lat = this.config.lat + (distance / 111320) * Math.cos(angle);
        const lng =
          this.config.lng +
          (distance / (111320 * Math.cos(this.config.lat * (Math.PI / 180)))) *
            Math.sin(angle);

        // Check if position is valid
        if (this.canPlaceFlag(lat, lng)) {
          positions.push({ lat, lng });
        }
      }

      if (this.debug) {
        logger.info(LogCategory.MAP, "Generated flag positions:", positions.length);
      }

      return positions;
    } catch (error) {
      logger.error(LogCategory.MAP, "Error getting available flag positions:", error);
      return [];
    }
  }

  /**
   * Convert latitude/longitude to pixel coordinates relative to the map container
   * @param lat - Latitude
   * @param lng - Longitude
   * @returns Pixel coordinates {x, y}
   */
  latLngToPixel(lat: number, lng: number): { x: number; y: number } {
    if (!this.map) {
      logger.warn(LogCategory.MAP, "Map not initialized");
      return { x: 0, y: 0 };
    }

    try {
      const point = this.map.latLngToContainerPoint(L.latLng(lat, lng));
      return {
        x: point.x,
        y: point.y,
      };
    } catch (error) {
      logger.error(LogCategory.MAP, "Error converting lat/lng to pixel:", error);
      return { x: 0, y: 0 };
    }
  }

  /**
   * Convert pixel coordinates to latitude/longitude
   * @param x - X coordinate
   * @param y - Y coordinate
   * @returns Latitude/longitude {lat, lng}
   */
  pixelToLatLng(x: number, y: number): { lat: number; lng: number } {
    if (!this.map) {
      logger.warn(LogCategory.MAP, "Map not initialized");
      return { lat: this.config.lat, lng: this.config.lng };
    }

    try {
      const latLng = this.map.containerPointToLatLng(L.point(x, y));
      return {
        lat: latLng.lat,
        lng: latLng.lng,
      };
    } catch (error) {
      logger.error(LogCategory.MAP, "Error converting pixel to lat/lng:", error);
      return { lat: this.config.lat, lng: this.config.lng };
    }
  }

  /**
   * Get the current player position
   * @returns The current player position {lat, lng}
   */
  getPlayerPosition() {
    return this.playerPosition;
  }

  /**
   * Get the current player pixel position
   * @returns The current player pixel position {x, y}
   */
  getPlayerPixelPosition() {
    return this.latLngToPixel(this.playerPosition.lat, this.playerPosition.lng);
  }

  /**
   * Get the target pixel position if one exists
   * @returns The target pixel position {x, y} or null if no target
   */
  getTargetPixelPosition() {
    if (!this.targetPosition) {
      return null;
    }
    return this.latLngToPixel(this.targetPosition.lat, this.targetPosition.lng);
  }

  /**
   * Get the current map center
   * @returns The current map center
   */
  getCenter() {
    return {
      lat: this.config.lat,
      lng: this.config.lng,
    };
  }

  /**
   * Get the current map instance
   * @returns The Leaflet map instance
   */
  getMap() {
    return this.map;
  }

  /**
   * Enable or disable debug mode
   * @param enabled - Whether debug mode should be enabled
   */
  setDebug(enabled: boolean): void {
    this.debug = enabled;
    if (enabled) {
      logger.info(LogCategory.MAP, "Debug mode enabled");
    }
  }
}

