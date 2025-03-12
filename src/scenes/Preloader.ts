import { Scene } from "phaser";
import { LogCategory, logger } from "../systems/Logger";

export class Preloader extends Scene {
  constructor() {
    super("Preloader");
  }

  init() {
    //  We loaded this image in our Boot Scene, so we can display it here
    // this.add.image(512, 384, 'background');

    //  A simple progress bar. This is the outline of the bar.
    this.add.rectangle(512, 384, 468, 32).setStrokeStyle(1, 0xffffff);

    //  This is the progress bar itself. It will increase in size from the left based on the % of progress.
    const bar = this.add.rectangle(512 - 230, 384, 4, 28, 0xffffff);

    //  Use the 'progress' event emitted by the LoaderPlugin to update the loading bar
    this.load.on("progress", (progress: number) => {
      //  Update the progress bar (our bar is 464px wide, so 100% = 464px)
      bar.width = 4 + 460 * progress;
    });

    // Log when preload starts
    logger.info(LogCategory.GENERAL, "Preloader started");
  }

  preload() {
    //  Load the assets for the game - Replace with your own assets
    this.load.setPath("assets");

    this.load.image("logo", "logo.png");
    this.load.image("background", "bg.png");

    // Load environment assets
    this.load.image("tree", "/environment/tree.png");
    // Load spruce-tree as a spritesheet (51x87 with multiple frames)
    this.load.spritesheet("spruce-tree", "/environment/spruce-tree.png", {
      frameWidth: 51,
      frameHeight: 87,
    });

    // Load wood chip particle for tree chopping
    this.load.image("wood-chip", "/environment/wood-chip.png");

    // Load fruits spritesheet
    this.load.spritesheet("fruits", "/items/fruits.png", {
      frameWidth: 16,
      frameHeight: 16,
    });

    // Load the player sprite sheet
    this.load.spritesheet("player", "/characters/player.png", {
      frameWidth: 48,
      frameHeight: 48,
    });
    this.load.image("deer", "/monsters/deer.png");

    // Create fallback textures for icons
    this.createFallbackIconTextures();

    // Load context menu icons
    try {
      logger.info(LogCategory.GENERAL, "Loading context menu icons...");

      // Try to load SVG icons
      this.load.svg("icon-stats", "/icons/stats.svg");
      this.load.svg("icon-inventory", "/icons/inventory.svg");
      this.load.svg("icon-levelup", "/icons/levelup.svg");
      this.load.svg("icon-rest", "/icons/rest.svg");
      this.load.svg("icon-examine", "/icons/examine.svg");
      this.load.svg("icon-travel", "/icons/travel.svg");
      this.load.svg("icon-marker", "/icons/marker.svg");
      this.load.svg("icon-character", "/icons/character.svg");
      this.load.svg("icon-create", "/icons/craft.svg");
      this.load.svg("icon-leaderboard", "/icons/leaderboard.svg");
      this.load.svg("icon-map", "/icons/map.svg");
      this.load.svg("icon-inbox", "/icons/messaging.svg");
      this.load.svg("icon-skills", "/icons/skills.svg");
      this.load.svg("icon-axe", "/icons/axe.svg");

      this.load.image("menu-button", "assets/menu-button.png");

      logger.info(LogCategory.GENERAL, "Context menu icons loaded successfully");
    } catch (error) {
      logger.error(LogCategory.GENERAL, "Error loading context menu icons:", error);
    }

    // Add event listener for load error
    this.load.on("loaderror", (file: Phaser.Loader.File) => {
      logger.error(LogCategory.GENERAL, "Error loading file:", file.key, file.url);
    });
  }

  /**
   * Creates fallback textures for icons in case the SVG loading fails
   */
  createFallbackIconTextures() {
    logger.info(LogCategory.GENERAL, "Creating fallback icon textures");

    // Define icon names
    const iconNames = [
      "icon-stats",
      "icon-inventory",
      "icon-levelup",
      "icon-rest",
      "icon-examine",
      "icon-travel",
      "icon-marker",
      "icon-close",
      "icon-character",
      "icon-craft",
      "icon-leaderboard",
      "icon-map",
      "icon-messaging",
      "icon-skills",
      "icon-axe",
    ];

    // Create a fallback texture for each icon
    iconNames.forEach((name) => {
      const graphics = this.make.graphics({ x: 0, y: 0 });

      // Draw a simple shape
      graphics.fillStyle(0xffffff);
      graphics.fillCircle(12, 12, 10);

      // Generate texture
      try {
        graphics.generateTexture(name + "-fallback", 24, 24);
        logger.info(LogCategory.GENERAL, `Created fallback texture for ${name}`);
      } catch (error) {
        logger.error(LogCategory.GENERAL, `Error creating fallback texture for ${name}:`, error);
      }
    });
  }

  create() {
    //  When all the assets have loaded, it's often worth creating global objects here that the rest of the game can use.
    //  For example, you can define global animations here, so we can use them in other scenes.

    //  Move to the MainMenu. You could also swap this for a Scene Transition, such as a camera fade.
    this.scene.start("MainMenu");

    // Log when preload is complete
    logger.info(LogCategory.GENERAL, "Preloader complete, starting game");
  }
}
