import { Scene } from "phaser";
import { MapManager } from "../systems/Map";
import { LogCategory, logger } from "../systems/Logger";
import { PlayerSystem } from "../systems/Player";

export class Game extends Scene {
  // Essential properties
  camera: Phaser.Cameras.Scene2D.Camera;
  msg_text: Phaser.GameObjects.Text;
  mapManager: MapManager;
  playerSystem: PlayerSystem;

  // Player position
  playerGeoPosition: { lat: number; lon: number } = { lat: 51.505, lon: -0.09 };

  constructor() {
    super({ key: "Game" });
    logger.info(LogCategory.GENERAL, "Game scene constructor called");
  }

  create() {
    logger.info(LogCategory.GENERAL, "Game scene create method called");

    // Set the scene to be transparent so we can see the map underneath
    this.cameras.main.setBackgroundColor("rgba(0,0,0,0.5)");
    logger.info(LogCategory.GENERAL, "Camera background set to transparent");

    // Initialize map manager with default location (London)
    this.mapManager = new MapManager({
      lat: 51.505,
      lng: -0.09,
      zoom: 16,
      boundaryRadius: 600,
      territoryRadius: 500,
    });

    // Initialize map
    this.mapManager.initMap("game-container");

    // Enable debug mode for more verbose logging
    this.mapManager.setDebug(true);

    // Initialize player manager
    this.playerSystem = new PlayerSystem(this);
    this.playerSystem.initialize();
  }
  preload() {
    // Load Leaflet CSS if not already loaded
    if (!document.getElementById("leaflet-css")) {
      const leafletCss = document.createElement("link");
      leafletCss.id = "leaflet-css";
      leafletCss.rel = "stylesheet";
      leafletCss.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      leafletCss.integrity =
        "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=";
      leafletCss.crossOrigin = "";
      document.head.appendChild(leafletCss);
      logger.info(LogCategory.MAP, "Leaflet CSS loaded");
    }
  }

  update(time: number, delta: number): void {
    // Basic update logic
    if (this.mapManager) {
      // Update player position on the map if needed
      this.mapManager.updatePlayerPosition(delta);
    }
  }

  cleanupResources() {
    logger.info(LogCategory.GENERAL, "Cleaning up Game scene resources");
    // Remove any event listeners or timers
    this.events.off("shutdown", this.cleanupResources, this);
  }

  setupDOMEventListeners() {
    // Get the canvas element
    const canvas = this.sys.game.canvas;

    // Add a click event listener to the canvas
    this.canvasClickListener = (e) => {
      // Check if the click is on the player
      const player = this.playerManager.getPlayer();
      const bounds = player.getBounds();
      const clickX = e.offsetX;
      const clickY = e.offsetY;

      if (
        clickX >= bounds.left &&
        clickX <= bounds.right &&
        clickY >= bounds.top &&
        clickY <= bounds.bottom
      ) {
        logger.info(LogCategory.PLAYER, "Player clicked via DOM event");
        // this.handlePlayerClick();
        e.stopPropagation();
      }
    };

    canvas.addEventListener("click", this.canvasClickListener);

    // Add a class to the canvas for CSS targeting
    canvas.classList.add("game-canvas");
  }
}
