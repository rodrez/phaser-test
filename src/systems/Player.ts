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
        this.player.setCollideWorldBounds(true);
        this.player.setBounce(0.1);
        this.player.setDepth(10);
        this.player.body.setSize(32, 48);
        (this.player.body as any).maxSpeed = 300;

        // Add to entities group (assumes the scene has an 'entitiesGroup')
        (this.scene as any).entitiesGroup.add(this.player);

        // Create animations and vitals
        this.createPlayerAnimations();
        this.createVitals();

        // Set up camera to follow player
        this.scene.cameras.main.startFollow(this.player);
        this.scene.cameras.main.setZoom(1.2);

        // Create collision borders if needed
        this.createPlayerCollisionsBorder();

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
     * Stub for updating player physics; extend this as needed.
     */
    updatePlayerPhysics(delta: number): void {
        // Placeholder for any physics updates required for the player.
    }

    /**
     * Handles player movement based on input keys.
     */
    handlePlayerMovement() {
        if (!this.player || !this.player.active) {
            return;
        }

        // Reset velocity
        this.player.setVelocity(0);

        const speed = 200;
        let moving = false;

        // WASD or arrow keys (assuming these keys are added to the scene)
        if ((this.scene as any).keyA?.isDown || (this.scene as any).keyLeft?.isDown) {
            this.player.setVelocityX(-speed);
            this.player.anims.play('player-move-left', true);
            moving = true;
        } else if ((this.scene as any).keyD?.isDown || (this.scene as any).keyRight?.isDown) {
            this.player.setVelocityX(speed);
            this.player.anims.play('player-move-right', true);
            moving = true;
        }

        if ((this.scene as any).keyW?.isDown || (this.scene as any).keyUp?.isDown) {
            this.player.setVelocityY(-speed);
            if (!moving) {
                this.player.anims.play('player-move-up', true);
            }
            moving = true;
        } else if ((this.scene as any).keyS?.isDown || (this.scene as any).keyDown?.isDown) {
            this.player.setVelocityY(speed);
            if (!moving) {
                this.player.anims.play('player-move-down', true);
            }
            moving = true;
        }

        // Ensure camera continues to follow the player
        this.scene.cameras.main.startFollow(this.player);

        // Update health bar position if it exists
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

        this.healthBar.background.x = this.player.x;
        this.healthBar.background.y = this.player.y - 40;

        this.healthBar.fill.x = this.player.x - (this.healthBar.fill.width / 2);
        this.healthBar.fill.y = this.player.y - 40;
    }

    /**
     * Creates a collision border around the player.
     * (Implement collision logic as needed)
     */
    createPlayerCollisionsBorder() {
        // Implement collision borders if required.
    }

    /**
     * Sets up player-specific input handlers.
     */
    setupInput() {
        // Define keyboard controls and attach them to the scene.
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
}
