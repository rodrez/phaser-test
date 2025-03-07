import { Scene } from 'phaser';

export class PlayerSystem {
    // Reference to the main game scene
    readonly scene: Scene;

    // The player sprite
    player!: Phaser.Physics.Arcade.Sprite;

    // Health bar elements
    healthBar?: {
        background: Phaser.GameObjects.Rectangle;
        fill: Phaser.GameObjects.Rectangle;
    };

    constructor(scene: Scene) {
        this.scene = scene;
    }

    /**
     * Creates the player sprite and configures properties.
     */
    createPlayer(): Phaser.Physics.Arcade.Sprite {
        const { width, height } = this.scene.scale;

        // Start position defaults to center of the screen
        let startX = width / 2;
        let startY = height / 2;

        // If coming from a flag, position the player near the flag location
        if ((this.scene as any).fromFlag && (this.scene as any).flagData) {
            const flagData = (this.scene as any).flagData;
            if (flagData.x !== undefined && flagData.y !== undefined) {
                startX = flagData.x;
                startY = flagData.y;
            }
        }

        // Create the player sprite using Arcade physics
        this.player = this.scene.physics.add.sprite(startX, startY, 'player');
        
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

        // DO NOT set up camera to follow player in map-based games
        // The camera should remain fixed on the map

        // Default the player to idle animation
        if (this.player && this.player.anims) {
            this.player.anims.play('player-idle', true);
            
            // Make sure player is visible with proper tint
            this.player.setAlpha(1);
            this.player.setTint(0xffffff);
        }

        return this.player;
    }

    /**
     * Creates animations for the player character.
     */
    createPlayerAnimations() {
        const frameRate = 8;

        // Avoid recreating animations if they already exist
        if (this.scene.anims.exists('player-idle')) {
            return;
        }

        // Idle animation (frames 0-2)
        this.scene.anims.create({
            key: 'player-idle',
            frames: this.scene.anims.generateFrameNumbers('player', { start: 0, end: 2 }),
            frameRate: frameRate,
            repeat: -1
        });

        // Movement animations (frames 3-5)
        this.scene.anims.create({
            key: 'player-move',
            frames: this.scene.anims.generateFrameNumbers('player', { start: 3, end: 5 }),
            frameRate: frameRate,
            repeat: -1
        });

        // Directional movement animations
        this.scene.anims.create({
            key: 'player-move-down',
            frames: this.scene.anims.generateFrameNumbers('player', { start: 3, end: 5 }),
            frameRate: frameRate,
            repeat: -1
        });
        this.scene.anims.create({
            key: 'player-move-up',
            frames: this.scene.anims.generateFrameNumbers('player', { start: 3, end: 5 }),
            frameRate: frameRate,
            repeat: -1
        });
        this.scene.anims.create({
            key: 'player-move-right',
            frames: this.scene.anims.generateFrameNumbers('player', { start: 3, end: 5 }),
            frameRate: frameRate,
            repeat: -1
        });
        this.scene.anims.create({
            key: 'player-move-left',
            frames: this.scene.anims.generateFrameNumbers('player', { start: 3, end: 5 }),
            frameRate: frameRate,
            repeat: -1
        });

        // Attack animation (frames 6-8)
        this.scene.anims.create({
            key: 'player-attack',
            frames: this.scene.anims.generateFrameNumbers('player', { start: 6, end: 8 }),
            frameRate: frameRate,
            repeat: 0
        });

        // Death animation (frame 9)
        this.scene.anims.create({
            key: 'player-death',
            frames: this.scene.anims.generateFrameNumbers('player', { start: 9, end: 9 }),
            frameRate: frameRate,
            repeat: 0
        });
    }

    /**
     * Updates player physics and cleans up any ghost sprites.
     */
    updatePlayerPhysics(delta: number): void {
        // Check for any ghost player sprites in the scene
        if (this.player) {
            // Ensure the player has the correct depth
            this.player.setDepth(100);
            
            // Make sure there's only one player sprite active in the game
            const allSprites = this.scene.children.list.filter(
                obj => obj !== this.player && 
                      obj.type === 'Sprite' && 
                      (obj as Phaser.GameObjects.Sprite).texture.key === 'player'
            );
            
            // Remove any ghost player sprites
            allSprites.forEach(sprite => {
                console.log('Removing ghost player sprite', sprite);
                (sprite as Phaser.GameObjects.Sprite).destroy();
            });
            
            // Also check entities group for duplicates
            if ((this.scene as any).entitiesGroup) {
                const duplicatesInGroup = (this.scene as any).entitiesGroup.getChildren().filter(
                    (child: any) => child !== this.player && 
                                   child.texture && 
                                   child.texture.key === 'player'
                );
                
                duplicatesInGroup.forEach((duplicate: any) => {
                    console.log('Removing duplicate player from entities group', duplicate);
                    duplicate.destroy();
                });
            }
            
            // Make sure entity has no body velocity
            if (this.player.body) {
                this.player.body.reset(this.player.x, this.player.y);
            }
        }
    }

    /**
     * Handles player movement based on input keys.
     */
    handlePlayerMovement() {
        if (!this.player || !this.player.active) {
            return;
        }

        // For a map-based game where we don't want physics affecting the map,
        // we'll use direct position changes instead of physics velocities
        const speed = 4; // Direct position change per frame
        let moving = false;

        // Current position
        const currentX = this.player.x;
        const currentY = this.player.y;
        let newX = currentX;
        let newY = currentY;

        // WASD or arrow keys
        if ((this.scene as any).keyA?.isDown || (this.scene as any).keyLeft?.isDown) {
            newX = currentX - speed;
            if (this.player.anims) {
                this.player.anims.play('player-move-left', true);
            }
            this.player.setFlipX(true);
            moving = true;
        } else if ((this.scene as any).keyD?.isDown || (this.scene as any).keyRight?.isDown) {
            newX = currentX + speed;
            if (this.player.anims) {
                this.player.anims.play('player-move-right', true);
            }
            this.player.setFlipX(false);
            moving = true;
        }

        if ((this.scene as any).keyW?.isDown || (this.scene as any).keyUp?.isDown) {
            newY = currentY - speed;
            if (!moving && this.player.anims) {
                this.player.anims.play('player-move-up', true);
            }
            moving = true;
        } else if ((this.scene as any).keyS?.isDown || (this.scene as any).keyDown?.isDown) {
            newY = currentY + speed;
            if (!moving && this.player.anims) {
                this.player.anims.play('player-move-down', true);
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
                if (this.player.tint !== 0xff0000) {  // If not already showing feedback
                    const originalTint = this.player.tint;
                    this.player.setTint(0xff0000);  // Red tint
                    
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
            this.player.anims.play('player-idle', true);
        }
        
        // Update the health bar position to follow the player
        this.updateHealthBarPosition();
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
            0x000000
        );
        barBg.setDepth(20);

        // Health bar fill
        const barFill = this.scene.add.rectangle(
            this.player.x - 24,
            this.player.y - 40,
            48,
            6,
            0x00ff00
        );
        barFill.setDepth(21);

        this.healthBar = {
            background: barBg,
            fill: barFill
        };

        // Initial health bar update
        this.updateHealthBar();
    }

    /**
     * Updates the player's health bar to reflect current health.
     */
    updateHealthBar() {
        if (!this.player || !this.healthBar) return;

        const { health, maxHealth } = (this.scene as any).playerStats;
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
            const playerStats = (this.scene as any).playerStats || { health: 100, maxHealth: 100 };
            const healthPercent = playerStats.health / playerStats.maxHealth;
            
            this.healthBar.fill.x = playerX - 24 + (48 * healthPercent / 2);
            this.healthBar.fill.y = playerY - 40;
            
            // Update health bar width based on current health
            this.healthBar.fill.width = 48 * healthPercent;
        }
    }

    /**
     * Creates a collision border around the player.
     * (Implement collision logic as needed)
     */
    createPlayerCollisionsBorder() {
        // Implement collision borders if required.
    }

    /**
     * Sets up input controls for the player.
     */
    setupInput() {
        // Define keyboard controls and attach them to the scene.
        if (this.scene.input && this.scene.input.keyboard) {
            (this.scene as any).keyW = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
            (this.scene as any).keyA = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
            (this.scene as any).keyS = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
            (this.scene as any).keyD = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
            (this.scene as any).keyUp = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
            (this.scene as any).keyLeft = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
            (this.scene as any).keyDown = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
            (this.scene as any).keyRight = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);
            (this.scene as any).keySpace = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
            (this.scene as any).keyEsc = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
        } else {
            console.warn('Keyboard input not available in PlayerSystem. Player movement will be limited.');
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
            }
        });
        
        // Check if player died
        if (stats.health <= 0) {
            // Handle death - this will be handled by CombatSystem in the future
            console.log('Player died!');
            this.scene.time.delayedCall(1000, () => {
                this.scene.scene.start('GameOver');
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
            if (this.player.x < bounds.x + this.player.width/2) {
                this.player.x = bounds.x + this.player.width/2;
            }
            if (this.player.x > bounds.right - this.player.width/2) {
                this.player.x = bounds.right - this.player.width/2;
            }
            if (this.player.y < bounds.y + this.player.height/2) {
                this.player.y = bounds.y + this.player.height/2;
            }
            if (this.player.y > bounds.bottom - this.player.height/2) {
                this.player.y = bounds.bottom - this.player.height/2;
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
}
