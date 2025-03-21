import { Scene } from "phaser";
import { EquipmentSlot, InventorySystem } from "./Inventory";
import { ArmorItem, WeaponItem } from "./Item";
import { EquipmentSystem } from "./Equipment";
import { PopupSystem, PopupOptions, PopupContent } from "./PopupSystem";
import { logger, LogCategory } from "./Logger";

export class PlayerSystem {
  // Reference to the main game scene
  readonly scene: Scene;
  mapManager: any; // Add MapManager reference

  // The player sprite
  player!: Phaser.Physics.Arcade.Sprite;
  stats: {
    health: number;
    maxHealth: number;
    godMode: boolean;
  } = {
    health: 100,
    maxHealth: 100,
    godMode: false,
  };

  // Health bar elements
  healthBar?: {
    background: Phaser.GameObjects.Rectangle;
    fill: Phaser.GameObjects.Rectangle;
  };

  // Equipment visual layers
  private equipmentSprites: Map<EquipmentSlot, Phaser.GameObjects.Sprite> =
    new Map();

  // Auto-attack properties
  private currentTarget: any = null;
  private attackCooldown: number = 0;
  private readonly ATTACK_RANGE: number = 60;
  private readonly ATTACK_COOLDOWN: number = 2500; // Increased from 800 to 2500 ms for more balanced combat

  // Target indicator properties
  private targetIndicator: Phaser.GameObjects.Graphics | null = null;

  // Reference to the equipment system
  private equipmentSystem?: EquipmentSystem;

  constructor(scene: Scene, mapManager?: any) {
    this.scene = scene;
    this.mapManager = mapManager; // Store the map manager reference

    // Get or create equipment system
    this.equipmentSystem = (this.scene as any).equipmentSystem;
    if (!this.equipmentSystem) {
      this.equipmentSystem = new EquipmentSystem(this.scene);
      (this.scene as any).equipmentSystem = this.equipmentSystem;
    }
  }

  /**
   * Creates the player sprite and configures properties.
   */
  createPlayer(): Phaser.Physics.Arcade.Sprite {
    const { width, height } = this.scene.scale;

    // Start position variables
    let startX = width / 2;
    let startY = height / 2;

    // If we have a map manager, use it to get the player position
    if (this.mapManager) {
      const pixelPos = this.mapManager.getPlayerPixelPosition();
      if (pixelPos) {
        startX = pixelPos.x;
        startY = pixelPos.y;
        console.log("Player pixel position from map:", pixelPos);
      }
    }
    // Otherwise, if coming from a flag, position the player near the flag location
    else if ((this.scene as any).fromFlag && (this.scene as any).flagData) {
      const flagData = (this.scene as any).flagData;
      if (flagData.x !== undefined && flagData.y !== undefined) {
        startX = flagData.x;
        startY = flagData.y;
      }
    }

    // Create the player sprite using Arcade physics
    this.player = this.scene.physics.add.sprite(startX, startY, "player");

    // Store the reference in the main scene
    (this.scene as any).player = this.player;

    // Configure player properties
    if (this.player && this.player.body) {
      this.player.setCollideWorldBounds(true);
      this.player.setBounce(0.1);
      this.player.setDepth(800); // Increased depth to ensure player is above trees but below UI
      this.player.body.setSize(48, 48);
      (this.player.body as any).maxSpeed = 300;
    }

    // Add to entities group (assumes the scene has an 'entitiesGroup')
    if ((this.scene as any).entitiesGroup && this.player) {
      (this.scene as any).entitiesGroup.add(this.player);
    }

    // Create animations and vitals
    this.createPlayerAnimations();
    this.createVitals();

    // Initialize equipment layers
    this.initializeEquipmentLayers();

    // Subscribe to inventory equipment changes
    this.subscribeToEquipmentChanges();

    // Default the player to idle animation
    if (this.player && this.player.anims) {
      this.player.anims.play("player-idle", true);

      // Make sure player is visible with proper tint
      this.player.setAlpha(1);
      this.player.setTint(0xffffff);
    }

    // Log player creation for debugging
    console.log("Player created at position:", startX, startY);
    console.log("Player dimensions:", this.player.width, this.player.height);

    return this.player;
  }

  /**
   * Creates animations for the player character.
   */
  createPlayerAnimations() {
    const frameRate = 8;

    // Avoid recreating animations if they already exist
    if (this.scene.anims.exists("player-idle")) {
      return;
    }

    // Idle animation (frames 0-2)
    this.scene.anims.create({
      key: "player-idle",
      frames: this.scene.anims.generateFrameNumbers("player", {
        start: 0,
        end: 2,
      }),
      frameRate: frameRate,
      repeat: -1,
    });

    // Movement animations (frames 3-5)
    this.scene.anims.create({
      key: "player-move",
      frames: this.scene.anims.generateFrameNumbers("player", {
        start: 3,
        end: 5,
      }),
      frameRate: frameRate,
      repeat: -1,
    });

    // Directional movement animations
    this.scene.anims.create({
      key: "player-move-down",
      frames: this.scene.anims.generateFrameNumbers("player", {
        start: 3,
        end: 5,
      }),
      frameRate: frameRate,
      repeat: -1,
    });
    this.scene.anims.create({
      key: "player-move-up",
      frames: this.scene.anims.generateFrameNumbers("player", {
        start: 3,
        end: 5,
      }),
      frameRate: frameRate,
      repeat: -1,
    });
    this.scene.anims.create({
      key: "player-move-right",
      frames: this.scene.anims.generateFrameNumbers("player", {
        start: 3,
        end: 5,
      }),
      frameRate: frameRate,
      repeat: -1,
    });
    this.scene.anims.create({
      key: "player-move-left",
      frames: this.scene.anims.generateFrameNumbers("player", {
        start: 3,
        end: 5,
      }),
      frameRate: frameRate,
      repeat: -1,
    });

    // Attack animation (frames 6-8)
    this.scene.anims.create({
      key: "player-attack",
      frames: this.scene.anims.generateFrameNumbers("player", {
        start: 6,
        end: 8,
      }),
      frameRate: frameRate,
      repeat: 0,
    });

    // Death animation (frame 9)
    this.scene.anims.create({
      key: "player-death",
      frames: this.scene.anims.generateFrameNumbers("player", {
        start: 9,
        end: 9,
      }),
      frameRate: frameRate,
      repeat: 0,
    });
  }

  /**
   * Initializes the visual equipment layers for the player
   */
  private initializeEquipmentLayers(): void {
    if (!this.player) return;

    // Create sprite layers for each equipment slot that needs visual representation
    const visualSlots: EquipmentSlot[] = [
      "head",
      "chest",
      "mainHand",
      "offHand",
    ];

    visualSlots.forEach((slot) => {
      // Create a sprite that follows the player position
      const sprite = this.scene.add.sprite(
        this.player.x,
        this.player.y,
        "equipment_placeholder",
      );

      // Set initial properties
      sprite.setVisible(false);
      sprite.setDepth(this.player.depth + 1); // Render above player

      // Store in our equipment sprites map
      this.equipmentSprites.set(slot, sprite);
    });
  }

  /**
   * Updates the position of equipment sprites to follow the player
   */
  private updateEquipmentPositions(): void {
    if (!this.player) return;

    this.equipmentSprites.forEach((sprite) => {
      sprite.setPosition(this.player.x, this.player.y);

      // Match player's flip state for consistent direction
      sprite.setFlipX(this.player.flipX);
    });
  }

  /**
   * Subscribes to inventory equipment change events
   */
  private subscribeToEquipmentChanges(): void {
    const inventorySystem = (this.scene as any)
      .inventorySystem as InventorySystem;
    if (!inventorySystem) {
      logger.warn(
        LogCategory.INVENTORY,
        "InventorySystem not found, equipment visuals will not update",
      );
      return;
    }

    // Listen for equipment changes
    inventorySystem.on("item-equipped", (data) => {
      if (data.equipmentSlot) {
        this.updateEquipmentVisual(data.equipmentSlot);
      }
    });

    inventorySystem.on("item-unequipped", (data) => {
      if (data.equipmentSlot) {
        this.hideEquipmentVisual(data.equipmentSlot);
      }
    });
  }

  /**
   * Updates the visual appearance of an equipment slot
   */
  updateEquipmentVisual(slot: EquipmentSlot): void {
    const sprite = this.equipmentSprites.get(slot);
    if (!sprite || !this.equipmentSystem) return;

    const inventorySystem = (this.scene as any)
      .inventorySystem as InventorySystem;
    if (!inventorySystem) return;

    const equippedItem = inventorySystem.getEquippedItem(slot);
    if (!equippedItem) {
      // No item equipped, hide the sprite
      sprite.setVisible(false);
      return;
    }

    // Get the appropriate texture key based on the item
    let textureKey = "";

    if (equippedItem.item instanceof WeaponItem) {
      textureKey = this.equipmentSystem.getWeaponTextureKey(
        equippedItem.item.weaponType,
        equippedItem.item.id,
      );
    } else if (equippedItem.item instanceof ArmorItem) {
      textureKey = this.equipmentSystem.getArmorTextureKey(
        equippedItem.item.armorType,
        equippedItem.item.id,
      );
    } else {
      // Not a visual equipment item
      sprite.setVisible(false);
      return;
    }

    // Check if the texture exists
    if (this.scene.textures.exists(textureKey)) {
      sprite.setTexture(textureKey);
      sprite.setVisible(true);

      // Position the equipment based on the slot
      this.positionEquipment(slot, sprite);

      // Play appropriate animation if available
      if (this.equipmentSystem) {
        this.equipmentSystem.playEquipmentAnimation(sprite, textureKey, "idle");
      }
    } else {
      logger.warn(
        LogCategory.PLAYER,
        `Texture ${textureKey} not found for equipment item`,
      );
      sprite.setVisible(false);
    }
  }

  /**
   * Positions equipment sprites relative to the player based on slot type
   */
  private positionEquipment(
    slot: EquipmentSlot,
    sprite: Phaser.GameObjects.Sprite,
  ): void {
    // Set offsets based on equipment slot
    switch (slot) {
      case "head":
        // Position slightly above player's center
        sprite.setOrigin(0.5, 0.5);
        sprite.y = this.player.y - 15;
        break;

      case "chest":
        // Position at player's center
        sprite.setOrigin(0.5, 0.5);
        break;

      case "mainHand":
        // Position to the right of player (or left when flipped)
        sprite.setOrigin(0.5, 0.5);
        sprite.x = this.player.flipX ? this.player.x - 20 : this.player.x + 20;
        break;

      case "offHand":
        // Position to the left of player (or right when flipped)
        sprite.setOrigin(0.5, 0.5);
        sprite.x = this.player.flipX ? this.player.x + 20 : this.player.x - 20;
        break;

      default:
        // Default positioning at player center
        sprite.setOrigin(0.5, 0.5);
    }
  }

  /**
   * Hides the visual for an equipment slot
   */
  hideEquipmentVisual(slot: EquipmentSlot): void {
    const sprite = this.equipmentSprites.get(slot);
    if (sprite) {
      sprite.setVisible(false);
    }
  }

  /**
   * Updates all equipment visuals based on current inventory
   */
  updateAllEquipmentVisuals(): void {
    const inventorySystem = (this.scene as any)
      .inventorySystem as InventorySystem;
    if (!inventorySystem) return;

    // Update each equipment slot that has a visual representation
    this.equipmentSprites.forEach((_, slot) => {
      this.updateEquipmentVisual(slot);
    });
  }

  /**
   * Updates player physics and cleans up any ghost sprites.
   */
  updatePlayerPhysics(delta: number): void {
    // Check for any ghost player sprites in the scene
    if (this.player) {
      // If we have a map manager, update the player position based on the map
      if (this.mapManager) {
        // Let the map manager update its internal player position
        this.mapManager.updatePlayerPosition(delta);

        // Ensure player sprite is at the correct position
        const position = this.mapManager.getPlayerPosition();
        const pixelPos = this.mapManager.latLngToPixel(
          position.lat,
          position.lng,
        );

        // Only update if there's a significant difference
        const dx = this.player.x - pixelPos.x;
        const dy = this.player.y - pixelPos.y;
        const distSquared = dx * dx + dy * dy;

        if (distSquared > 1) {
          this.player.x = pixelPos.x;
          this.player.y = pixelPos.y;

          // Update health bar position when player moves
          this.updateHealthBarPosition();

          // Update equipment positions
          this.updateEquipmentPositions();
        }
      }

      // Ensure the player has the correct depth
      this.player.setDepth(100);

      // Make sure there's only one player sprite active in the game
      const allSprites = this.scene.children.list.filter(
        (obj) =>
          obj !== this.player &&
          obj.type === "Sprite" &&
          (obj as Phaser.GameObjects.Sprite).texture.key === "player",
      );

      // Remove any ghost player sprites
      allSprites.forEach((sprite) => {
        logger.info(LogCategory.PLAYER, "Removing ghost player sprite", sprite);
        (sprite as Phaser.GameObjects.Sprite).destroy();
      });

      // Also check entities group for duplicates
      if ((this.scene as any).entitiesGroup) {
        const duplicatesInGroup = (this.scene as any).entitiesGroup
          .getChildren()
          .filter(
            (child: any) =>
              child !== this.player &&
              child.texture &&
              child.texture.key === "player",
          );

        duplicatesInGroup.forEach((duplicate: any) => {
          logger.info(
            LogCategory.PLAYER,
            "Removing duplicate player from entities group",
            duplicate,
          );
          duplicate.destroy();
        });
      }

      // Make sure entity has no body velocity
      if (this.player.body) {
        this.player.body.reset(this.player.x, this.player.y);
      }
    }

    // Update equipment positions to follow player
    this.updateEquipmentPositions();
  }

  /**
   * Handles player movement based on input keys.
   */
  handlePlayerMovement() {
    if (!this.player || !this.player.active) {
      return;
    }

    // If we have a map manager, let it handle player movement
    if (this.mapManager) {
      // Log debug info about player movement
      if (this.mapManager.debug) {
        console.log("Player movement state:", {
          isPlayerMoving: this.mapManager.isPlayerMoving,
          playerPosition: this.mapManager.getPlayerPosition(),
          targetPosition: this.mapManager.targetPosition,
          pixelPosition: this.mapManager.getPlayerPixelPosition(),
          targetPixelPosition: this.mapManager.getTargetPixelPosition()
        });
      }

      // Update animations based on movement state
      if (this.mapManager.isPlayerMoving) {
        // Determine direction based on target position vs current position
        const position = this.mapManager.getPlayerPosition();
        const pixelPos = this.mapManager.getPlayerPixelPosition();
        const targetPos = this.mapManager.getTargetPixelPosition();

        if (targetPos) {
          // Calculate direction vector
          const dx = targetPos.x - pixelPos.x;
          const dy = targetPos.y - pixelPos.y;

          // Determine animation based on primary direction
          if (Math.abs(dx) > Math.abs(dy)) {
            // Horizontal movement is primary
            if (dx > 0) {
              this.player.anims.play("player-move-right", true);
              this.player.setFlipX(false);
            } else {
              this.player.anims.play("player-move-left", true);
              this.player.setFlipX(true);
            }
          } else {
            // Vertical movement is primary
            if (dy > 0) {
              this.player.anims.play("player-move-down", true);
            } else {
              this.player.anims.play("player-move-up", true);
            }
          }
        }
      } else {
        // Return to idle animation when not moving
        this.player.anims.play("player-idle", true);
      }

      return; // Let the map manager handle the actual movement
    }

    // For a map-based game where we don't want physics affecting the map,
    // we'll use direct position changes instead of physics velocities
    const speed = 2; // Direct position change per frame
    let moving = false;

    // Current position
    const currentX = this.player.x;
    const currentY = this.player.y;
    let newX = currentX;
    let newY = currentY;

    // WASD or arrow keys
    if (
      (this.scene as any).keyA?.isDown ||
      (this.scene as any).keyLeft?.isDown
    ) {
      newX = currentX - speed;
      if (this.player.anims) {
        this.player.anims.play("player-move-left", true);
      }
      this.player.setFlipX(true);
      moving = true;
    } else if (
      (this.scene as any).keyD?.isDown ||
      (this.scene as any).keyRight?.isDown
    ) {
      newX = currentX + speed;
      if (this.player.anims) {
        this.player.anims.play("player-move-right", true);
      }
      this.player.setFlipX(false);
      moving = true;
    }

    if ((this.scene as any).keyW?.isDown || (this.scene as any).keyUp?.isDown) {
      newY = currentY - speed;
      if (!moving && this.player.anims) {
        this.player.anims.play("player-move-up", true);
      }
      moving = true;
    } else if (
      (this.scene as any).keyS?.isDown ||
      (this.scene as any).keyDown?.isDown
    ) {
      newY = currentY + speed;
      if (!moving && this.player.anims) {
        this.player.anims.play("player-move-down", true);
      }
      moving = true;
    }

    // Get camera and screen info for boundary checking
    const camera = this.scene.cameras.main;
    const screenWidth = camera.width;
    const screenHeight = camera.height;

    // Calculate safe boundaries to ensure player stays within visible area
    // Using padding to ensure player stays fully visible (not partially cut off)
    const padding = 32; // Adjust based on player sprite size
    const minX = padding;
    const maxX = screenWidth - padding;
    const minY = padding;
    const maxY = screenHeight - padding;

    // Apply bounds - ensure player stays within visible screen area
    newX = Phaser.Math.Clamp(newX, minX, maxX);
    newY = Phaser.Math.Clamp(newY, minY, maxY);

    // Apply navigation circle boundary
    const mapSystem = (this.scene as any).mapSystem;
    if (mapSystem && mapSystem.navigationCircleGraphics) {
      const screenCenterX = screenWidth / 2;
      const screenCenterY = screenHeight / 2;

      // Navigation circle radius (get from MapSystem if possible, or use the value in the graphics)
      const screenRadius = Math.min(screenWidth, screenHeight) * 0.38; // Match the value in MapSystem

      // Calculate distance from center to the new position
      const dx = newX - screenCenterX;
      const dy = newY - screenCenterY;
      const distanceFromCenter = Math.sqrt(dx * dx + dy * dy);

      // If the new position would be outside the circle, adjust it
      if (distanceFromCenter > screenRadius) {
        // Get the angle from center to new position
        const angle = Math.atan2(dy, dx);

        // Calculate point on the circle edge
        newX = screenCenterX + Math.cos(angle) * screenRadius;
        newY = screenCenterY + Math.sin(angle) * screenRadius;

        // Visual feedback when hitting the boundary
        if (this.player.tint !== 0xff0000) {
          // If not already showing feedback
          const originalTint = this.player.tint;
          this.player.setTint(0xff0000); // Red tint

          // Reset tint after a short delay
          this.scene.time.delayedCall(150, () => {
            if (this.player) {
              this.player.setTint(originalTint || 0xffffff);
            }
          });
        }
      }
    }

    // Update player position directly if it has moved
    if (newX !== currentX || newY !== currentY) {
      // Clear any duplicate sprites at the old position before moving
      this.player.setPosition(newX, newY);

      // Make sure player is always at the correct depth
      this.player.setDepth(100);
    }

    // If the player isn't moving, play the idle animation
    if (!moving && this.player.anims) {
      this.player.anims.play("player-idle", true);
    }

    // Update the health bar position to follow the player
    this.updateHealthBarPosition();

    // Update equipment positions after player moves
    this.updateEquipmentPositions();
  }

  /**
   * Creates vitals for the player character (e.g., health bar).
   */
  createVitals() {
    if (!this.player) {
      return;
    }

    // Health bar background
    const barBg = this.scene.add.rectangle(
      this.player.x,
      this.player.y - 40,
      50,
      8,
      0x000000,
    );
    barBg.setDepth(20);

    // Health bar fill
    const barFill = this.scene.add.rectangle(
      this.player.x - 24,
      this.player.y - 40,
      48,
      6,
      0x00ff00,
    );
    barFill.setDepth(21);

    this.healthBar = {
      background: barBg,
      fill: barFill,
    };

    // Initial health bar update
    this.updateHealthBar();
  }

  /**
   * Updates the player's health bar to reflect current health.
   */
  updateHealthBar() {
    if (!this.player || !this.healthBar) return;

    const { health, maxHealth } = this.stats;
    const healthPercent = health / maxHealth;

    if (healthPercent > 0.6) {
      this.healthBar.fill.setFillStyle(0x00ff00);
    } else if (healthPercent > 0.3) {
      this.healthBar.fill.setFillStyle(0xffff00);
    } else {
      this.healthBar.fill.setFillStyle(0xff0000);
    }
  }

  /**
   * Updates the position of the player's health bar.
   */
  updateHealthBarPosition() {
    if (!this.player || !this.healthBar) return;

    // Update health bar position to follow player
    if (this.healthBar.background && this.healthBar.fill) {
      // Null checks for player position
      const playerX = this.player?.x || 0;
      const playerY = this.player?.y || 0;

      this.healthBar.background.x = playerX;
      this.healthBar.background.y = playerY - 40;

      // Get health percentage with null safety
      const playerStats = (this.scene as any).playerStats || {
        health: 100,
        maxHealth: 100,
      };
      const healthPercent = playerStats.health / playerStats.maxHealth;

      this.healthBar.fill.x = playerX - 24 + (48 * healthPercent) / 2;
      this.healthBar.fill.y = playerY - 40;

      // Update health bar width based on current health
      this.healthBar.fill.width = 48 * healthPercent;
    }
  }

  /**
   * Sets up input controls for the player.
   */
  setupInput() {
    // Define keyboard controls and attach them to the scene.
    if (this.scene.input && this.scene.input.keyboard) {
      (this.scene as any).keyW = this.scene.input.keyboard.addKey(
        Phaser.Input.Keyboard.KeyCodes.W,
      );
      (this.scene as any).keyA = this.scene.input.keyboard.addKey(
        Phaser.Input.Keyboard.KeyCodes.A,
      );
      (this.scene as any).keyS = this.scene.input.keyboard.addKey(
        Phaser.Input.Keyboard.KeyCodes.S,
      );
      (this.scene as any).keyD = this.scene.input.keyboard.addKey(
        Phaser.Input.Keyboard.KeyCodes.D,
      );
      (this.scene as any).keyUp = this.scene.input.keyboard.addKey(
        Phaser.Input.Keyboard.KeyCodes.UP,
      );
      (this.scene as any).keyLeft = this.scene.input.keyboard.addKey(
        Phaser.Input.Keyboard.KeyCodes.LEFT,
      );
      (this.scene as any).keyDown = this.scene.input.keyboard.addKey(
        Phaser.Input.Keyboard.KeyCodes.DOWN,
      );
      (this.scene as any).keyRight = this.scene.input.keyboard.addKey(
        Phaser.Input.Keyboard.KeyCodes.RIGHT,
      );
      (this.scene as any).keySpace = this.scene.input.keyboard.addKey(
        Phaser.Input.Keyboard.KeyCodes.SPACE,
      );
      (this.scene as any).keyEsc = this.scene.input.keyboard.addKey(
        Phaser.Input.Keyboard.KeyCodes.ESC,
      );

      // Add map-specific key bindings if we have a map manager
      if (this.mapManager) {
        // F key to place a flag at the current position
        const keyF = this.scene.input.keyboard.addKey(
          Phaser.Input.Keyboard.KeyCodes.F,
        );

        keyF.on("down", () => {
          this.handleMapClick();
        });

        // Override space key to jump to the nearest flag when map is available
        (this.scene as any).keySpace.on("down", () => {
          // Get player position
          const position = this.mapManager.getPlayerPosition();
          if (position) {
            this.mapManager.jumpToFlag(position.lat, position.lng);
          }
        });

        const left = [
          (this.scene as any).keyA,
          (this.scene as any).keyLeft,
        ];
        const right = [
          (this.scene as any).keyD,
          (this.scene as any).keyRight,
        ];
        const up = [
          (this.scene as any).keyW,
          (this.scene as any).keyUp,
        ];
        const down = [
          (this.scene as any).keyS,
          (this.scene as any).keyDown,
        ];

        // Arrow key based player movement - use map manager instead of direct position changes
        left.forEach((key) => {
          key.on("down", () => {
            // Get current position
            const position = this.mapManager.getPlayerPosition();
            // Calculate new position (move slightly west)
            const newLat = position.lat;
            const newLng = position.lng - 0.0001; // Small longitude change
            // Set as target position
            this.mapManager.setTargetPosition(newLat, newLng);
          });
        });

        right.forEach((key) => {
          key.on("down", () => {
            // Get current position
            const position = this.mapManager.getPlayerPosition();
            // Calculate new position (move slightly east)
            const newLat = position.lat;
            const newLng = position.lng + 0.0001; // Small longitude change
            // Set as target position
            this.mapManager.setTargetPosition(newLat, newLng);
          });
        });

        up.forEach((key) => {
          key.on("down", () => {
            // Get current position
            const position = this.mapManager.getPlayerPosition();
            // Calculate new position (move slightly north)
            const newLat = position.lat + 0.0001; // Small latitude change
            const newLng = position.lng;
            // Set as target position
            this.mapManager.setTargetPosition(newLat, newLng);
          });
        });

        down.forEach((key) => {
          key.on("down", () => {
            // Get current position
            const position = this.mapManager.getPlayerPosition();
            // Calculate new position (move slightly south)
            const newLat = position.lat - 0.0001; // Small latitude change
            const newLng = position.lng;
            // Set as target position
            this.mapManager.setTargetPosition(newLat, newLng);
          });
        });
      }
    } else {
      logger.warn(
        LogCategory.PLAYER,
        "Keyboard input not available in PlayerSystem. Player movement will be limited.",
      );
    }

    // Set up mouse input for map interaction
    if (this.mapManager && this.scene.input) {
      // Set up right-click to place a flag
      this.scene.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
        if (pointer.rightButtonDown()) {
          // Convert screen coordinates to map coordinates
          const pixelPos = { x: pointer.x, y: pointer.y };
          const latLng = this.mapManager.pixelToLatLng(pixelPos.x, pixelPos.y);

          // Try to add a flag at the clicked position
          if (latLng) {
            this.mapManager.addFlag(latLng.lat, latLng.lng);
          }
        }
      });
    }
  }

  /**
   * Heals the player by the specified amount.
   */
  healPlayer(amount: number) {
    if (!(this.scene as any).playerStats) {
      return;
    }

    const stats = (this.scene as any).playerStats;
    stats.health = Math.min(stats.health + amount, stats.maxHealth);
    this.updateHealthBar();
  }

  /**
   * Applies damage to the player.
   * This is a simple implementation that will be replaced by the CombatSystem.
   * Kept for backward compatibility.
   */
  takeDamage(amount: number) {
    if (!(this.scene as any).playerStats) {
      return;
    }

    const stats = (this.scene as any).playerStats;

    // Check if god mode is enabled - skip damage if it is
    if (stats.godMode) {
      return;
    }

    stats.health = Math.max(0, stats.health - amount);
    this.updateHealthBar();

    // Flash the player red to indicate damage
    this.scene.tweens.add({
      targets: this.player,
      alpha: 0.5,
      duration: 100,
      yoyo: true,
      repeat: 1,
      onComplete: () => {
        this.player.alpha = 1;
      },
    });

    // Check if player died
    if (stats.health <= 0) {
      // Handle death - this will be handled by CombatSystem in the future
      logger.info(LogCategory.PLAYER, "Player died!");
      this.scene.time.delayedCall(1000, () => {
        this.scene.scene.start("GameOver");
      });
    }
  }

  /**
   * Ensures the player is correctly positioned and visible.
   * Call this after scene changes or when player visibility changes.
   */
  ensureCorrectPlayerState(): void {
    if (!this.player || !this.player.active) {
      return;
    }

    // Ensure player has the correct depth
    this.player.setDepth(100);

    // Make sure player bounds are constrained correctly
    const bounds = (this.scene as any).physics.world.bounds;
    if (bounds) {
      if (this.player.x < bounds.x + this.player.width / 2) {
        this.player.x = bounds.x + this.player.width / 2;
      }
      if (this.player.x > bounds.right - this.player.width / 2) {
        this.player.x = bounds.right - this.player.width / 2;
      }
      if (this.player.y < bounds.y + this.player.height / 2) {
        this.player.y = bounds.y + this.player.height / 2;
      }
      if (this.player.y > bounds.bottom - this.player.height / 2) {
        this.player.y = bounds.bottom - this.player.height / 2;
      }
    }

    // Update health bar position if it exists
    this.updateHealthBarPosition();
  }

  /**
   * Returns the player sprite instance
   */
  getPlayerSprite(): Phaser.Physics.Arcade.Sprite {
    return this.player;
  }

  /**
   * Handles auto-attacking nearby monsters
   * @param time Current game time
   */
  autoAttack(time: number): void {
    // Skip if cooldown hasn't expired
    if (time < this.attackCooldown) {
      return;
    }

    // If we have a current target, check if it's still valid
    if (this.currentTarget) {
      // Check if target is still active and in range
      if (
        !this.currentTarget.active ||
        this.currentTarget.currentState === "DEAD"
      ) {
        this.currentTarget = null;
        this.hideTargetIndicator();
      } else {
        // Calculate distance to target
        const distToTarget = Phaser.Math.Distance.Between(
          this.player.x,
          this.player.y,
          this.currentTarget.x,
          this.currentTarget.y,
        );

        // If target is out of range, clear it
        if (distToTarget > this.ATTACK_RANGE) {
          this.currentTarget = null;
          this.hideTargetIndicator();
        } else {
          // Show target indicator
          this.showTargetIndicator(this.currentTarget);

          // Play attack animations for weapons
          this.playWeaponAttackAnimations();

          // Target is in range, attack it
          const combatSystem = (this.scene as any).combatSystem;
          if (combatSystem) {
            combatSystem.playerAttackMonster(this.currentTarget);
            this.attackCooldown = time + this.ATTACK_COOLDOWN;
          }
        }
      }
    }

    // If we don't have a target, look for the closest monster in range
    if (!this.currentTarget) {
      const monsterSystem = (this.scene as any).monsterSystem;
      if (monsterSystem) {
        const monsters = monsterSystem.getMonsters();
        let closestMonster = null;
        let closestDistance = this.ATTACK_RANGE;

        // Find the closest monster in attack range
        for (const monster of monsters) {
          if (monster.active && monster.currentState !== "DEAD") {
            const distance = Phaser.Math.Distance.Between(
              this.player.x,
              this.player.y,
              monster.x,
              monster.y,
            );

            if (distance < closestDistance) {
              closestMonster = monster;
              closestDistance = distance;
            }
          }
        }

        // Set the closest monster as our target
        if (closestMonster) {
          this.currentTarget = closestMonster;
          this.showTargetIndicator(closestMonster);
        }
      }
    }
  }

  /**
   * Plays attack animations for equipped weapons
   */
  private playWeaponAttackAnimations(): void {
    if (!this.equipmentSystem) return;

    // Get main hand weapon sprite
    const mainHandSprite = this.equipmentSprites.get("mainHand");
    if (mainHandSprite && mainHandSprite.visible) {
      // Get the current texture key
      const textureKey = mainHandSprite.texture.key;

      // Play attack animation
      this.equipmentSystem.playEquipmentAnimation(
        mainHandSprite,
        textureKey,
        "attack",
      );

      // Reset to idle after attack animation completes
      this.scene.time.delayedCall(500, () => {
        if (mainHandSprite.active) {
          this.equipmentSystem?.playEquipmentAnimation(
            mainHandSprite,
            textureKey,
            "idle",
          );
        }
      });
    }

    // Do the same for off-hand if it's a weapon
    const offHandSprite = this.equipmentSprites.get("offHand");
    if (offHandSprite && offHandSprite.visible) {
      const textureKey = offHandSprite.texture.key;

      // Only play attack animation if it's a weapon (starts with 'weapon_')
      if (textureKey.startsWith("weapon_")) {
        this.equipmentSystem.playEquipmentAnimation(
          offHandSprite,
          textureKey,
          "attack",
        );

        this.scene.time.delayedCall(500, () => {
          if (offHandSprite.active) {
            this.equipmentSystem?.playEquipmentAnimation(
              offHandSprite,
              textureKey,
              "idle",
            );
          }
        });
      }
    }
  }

  /**
   * Shows a visual indicator around the current target
   * @param target The target to highlight
   */
  private showTargetIndicator(target: any): void {
    // Remove any existing indicator
    this.hideTargetIndicator();

    // Create a new indicator
    this.targetIndicator = this.scene.add.graphics();
    this.targetIndicator.lineStyle(2, 0xff0000, 1);
    this.targetIndicator.strokeCircle(target.x, target.y, target.width / 2 + 5);
    this.targetIndicator.setDepth(target.depth + 1);
  }

  /**
   * Hides the target indicator
   */
  private hideTargetIndicator(): void {
    if (this.targetIndicator) {
      this.targetIndicator.destroy();
      this.targetIndicator = null;
    }
  }

  /**
   * Sets a monster as the current auto-attack target
   * @param target The monster to target
   */
  setTarget(target: any): void {
    this.currentTarget = target;
  }

  /**
   * Clears the current auto-attack target
   */
  clearTarget(): void {
    this.currentTarget = null;
  }

  /**
   * Checks if the player has an active target
   * @returns True if the player has a target
   */
  hasTarget(): boolean {
    return this.currentTarget !== null && this.currentTarget.active;
  }

  /**
   * Updates the target indicator position
   */
  updateTargetIndicator(): void {
    if (
      this.targetIndicator &&
      this.currentTarget &&
      this.currentTarget.active
    ) {
      this.targetIndicator.clear();
      this.targetIndicator.lineStyle(2, 0xff0000, 1);
      this.targetIndicator.strokeCircle(
        this.currentTarget.x,
        this.currentTarget.y,
        this.currentTarget.width / 2 + 5,
      );
    }
  }

  /**
   * Shows the player context menu
   */
  showContextMenu(): void {
    logger.info(LogCategory.PLAYER, "Showing player context menu");

    // Get the game scene with access to game-specific methods and properties
    interface GameScene {
      canLevelUp: () => boolean;
      playerStats: {
        godMode: boolean;
      };
      showPlayerStats: () => void;
      openInventory: () => void;
      placePlayerFlag: () => void;
      toggleGodMode: () => void;
      popupSystem: PopupSystem;
    }

    // Cast to unknown first, then to GameScene to avoid type error
    const gameScene = this.scene as unknown as GameScene;

    // Get player position on screen
    const worldPoint = { x: this.player.x, y: this.player.y };

    // Convert world coordinates to screen coordinates
    // Use the camera's worldView property to calculate screen coordinates
    const camera = this.scene.cameras.main;
    const screenPoint = {
      x: worldPoint.x - camera.worldView.x,
      y: worldPoint.y - camera.worldView.y,
    };

    // Create HTML content for the popup
    const content: PopupContent = {
      html: `
                <div class="player-menu">
                    <h3>Player Menu</h3>
                    <div class="menu-buttons">
                        <button class="menu-button" id="view-stats"><i class="icon-stats"></i> View Player Stats</button>
                        <button class="menu-button" id="open-inventory"><i class="icon-inventory"></i> Open Inventory</button>
                        <button class="menu-button" id="place-flag"><i class="icon-flag"></i> Place Flag</button>
                        ${gameScene.canLevelUp() ? '<button class="menu-button" id="level-up"><i class="icon-levelup"></i> Level Up</button>' : ""}
                        <button class="menu-button" id="toggle-god-mode"><i class="icon-shield"></i> ${gameScene.playerStats.godMode ? "Disable God Mode" : "Enable God Mode"}</button>
                    </div>
                </div>
            `,
      buttons: [
        {
          selector: "#view-stats",
          onClick: () => {
            logger.info(LogCategory.PLAYER, "Viewing player stats");
            gameScene.showPlayerStats();
            gameScene.popupSystem.closePopupsByClass("player-menu-popup");
          },
        },
        {
          selector: "#open-inventory",
          onClick: () => {
            logger.info(LogCategory.INVENTORY, "Opening inventory");
            gameScene.openInventory();
            gameScene.popupSystem.closePopupsByClass("player-menu-popup");
          },
        },
        {
          selector: "#place-flag",
          onClick: () => {
            logger.info(LogCategory.FLAG, "Placing flag at player position");
            gameScene.placePlayerFlag();
            gameScene.popupSystem.closePopupsByClass("player-menu-popup");
          },
        },
        {
          selector: "#level-up",
          onClick: () => {
            logger.info(LogCategory.PLAYER, "Opening level up screen");
            // Add level up logic here
            gameScene.popupSystem.closePopupsByClass("player-menu-popup");
          },
        },
        {
          selector: "#toggle-god-mode",
          onClick: () => {
            logger.info(LogCategory.PLAYER, "Toggling god mode");
            gameScene.toggleGodMode();
            gameScene.popupSystem.closePopupsByClass("player-menu-popup");
          },
        },
      ],
    };

    // Create popup options
    const options: PopupOptions = {
      className: "player-menu-popup",
      closeButton: true,
      offset: { x: 0, y: -50 }, // Position above the player
      width: 250,
      zIndex: 100000, // Ensure it's on top of everything
    };

    // Create the popup at the player's position
    gameScene.popupSystem.createPopupAtScreenPosition(
      screenPoint.x,
      screenPoint.y,
      content,
      options,
    );
  }

  // Initialize the player system
  initialize() {
    // Create the player sprite
    this.createPlayer();

    // Set up input handlers
    this.setupInput();

    // Set up map callbacks if we have a map manager
    if (this.mapManager) {
      this.setupMapCallbacks();
    }
  }

  /**
   * Sets up callbacks for map-related events
   */
  setupMapCallbacks() {
    if (!this.mapManager) return;

    // Set callback for player movement
    this.mapManager.setPlayerMoveCallback((position: any) => {
      // Update player sprite position
      const pixelPos = this.mapManager.latLngToPixel(
        position.lat,
        position.lng,
      );
      console.log("Player moved to pixel position:", pixelPos);

      if (this.player) {
        // Update player position immediately
        this.player.x = pixelPos.x;
        this.player.y = pixelPos.y;

        // Update health bar position
        this.updateHealthBarPosition();

        // Update equipment positions
        this.updateEquipmentPositions();
      }
    });

    // Set callback for when player reaches target
    this.mapManager.setPlayerReachTargetCallback(() => {
      console.log("Player reached target position");

      // Return to idle animation when player stops moving
      if (this.player && this.player.anims) {
        this.player.anims.play("player-idle", true);
      }
    });
  }

  /**
   * Handles a click on the map to place a flag
   * @param onPlaceFlag Optional callback when a flag is placed
   * @returns True if a flag was placed, false otherwise
   */
  handleMapClick(onPlaceFlag?: (flag: any) => void): boolean {
    if (!this.mapManager) return false;

    // Try to add a flag at the player's current position
    const flag = this.mapManager.addFlagAtPlayerPosition();

    if (flag) {
      // Add a visual effect (could be implemented separately)
      this.addFlagPlacementEffect();

      // Call the callback if provided
      if (onPlaceFlag) {
        onPlaceFlag(flag);
      }

      return true;
    }

    return false;
  }

  /**
   * Add a visual effect when placing a flag
   */
  addFlagPlacementEffect() {
    if (!this.player) return;

    // Create a circle that expands and fades out
    const effect = this.scene.add.circle(
      this.player.x,
      this.player.y,
      10,
      0x4285f4,
      0.7,
    );
    effect.setDepth(1999); // Just below player

    // Animate the effect
    this.scene.tweens.add({
      targets: effect,
      radius: 50,
      alpha: 0,
      duration: 800,
      ease: "Cubic.easeOut",
      onComplete: () => {
        effect.destroy();
      },
    });
  }

  /**
   * Cleans up resources when the player system is destroyed
   */
  cleanup() {
    // Remove map-related event listeners if we have a map manager
    if (this.mapManager) {
      // Remove player move callback
      this.mapManager.setPlayerMoveCallback(null);

      // Remove player reach target callback
      this.mapManager.setPlayerReachTargetCallback(null);
    }

    // Destroy the player sprite
    if (this.player) {
      this.player.destroy();
    }

    // Clean up health bar
    if (this.healthBar) {
      if (this.healthBar.background) {
        this.healthBar.background.destroy();
      }
      if (this.healthBar.fill) {
        this.healthBar.fill.destroy();
      }
    }

    // Clean up equipment sprites
    this.equipmentSprites.forEach((sprite) => {
      if (sprite) {
        sprite.destroy();
      }
    });

    // Clear the equipment sprites map
    this.equipmentSprites.clear();
  }
}
