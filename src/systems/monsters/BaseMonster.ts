import { Scene, Physics, GameObjects, Math as PhaserMath } from 'phaser';
import { ItemSystem } from '../Item';
import { MonsterType, MonsterBehavior, MonsterAttributes, MonsterLoot, MonsterState, MonsterData } from './MonsterTypes';

export abstract class BaseMonster extends Physics.Arcade.Sprite {
    public monsterType: MonsterType;
    public monsterName: string;
    public behavior: MonsterBehavior;
    public attributes: MonsterAttributes;
    public lootTable: MonsterLoot[];
    public currentState: MonsterState = MonsterState.IDLE;

    protected spawnPoint: PhaserMath.Vector2;
    protected wanderTarget: PhaserMath.Vector2 | null = null;
    protected wanderTimer: number = 0;
    protected stateTimer: number = 0;
    protected lastStateChange: number = 0;

    protected playerSprite: Physics.Arcade.Sprite;
    protected itemSystem: ItemSystem;

    protected healthBar: GameObjects.Graphics;

    constructor(scene: Scene, x: number, y: number, monsterData: MonsterData, playerSprite: Physics.Arcade.Sprite, itemSystem: ItemSystem) {
        super(scene, x, y, monsterData.spriteKey);
        
        this.monsterType = monsterData.type;
        this.monsterName = monsterData.name;
        this.behavior = monsterData.behavior;
        this.attributes = { ...monsterData.attributes };
        this.lootTable = [...monsterData.lootTable];
        
        this.playerSprite = playerSprite;
        this.itemSystem = itemSystem;
        
        // Set up sprite
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        if (monsterData.scale) {
            this.setScale(monsterData.scale);
        }
        
        // Make monster interactive (clickable)
        this.setInteractive({ useHandCursor: true });
        
        // Set appropriate depth to ensure monsters are visible
        // We want monsters to be above the map but below the player (player depth is 100)
        this.setDepth(50);
        
        // Store spawn location
        this.spawnPoint = new PhaserMath.Vector2(x, y);
        
        // Set up health bar
        this.healthBar = scene.add.graphics();
        this.updateHealthBar();
    }

    protected updateHealthBar(): void {
        this.healthBar.clear();
        
        // Position the health bar above the monster
        const barX = this.x - 20;
        const barY = this.y - this.height / 2 - 10;
        
        // Set depth to ensure health bar is always visible
        this.healthBar.setDepth(60); // Above the monster but below the player
        
        // Background (red)
        this.healthBar.fillStyle(0xff0000);
        this.healthBar.fillRect(barX, barY, 40, 5);
        
        // Health (green)
        const healthPercentage = this.attributes.health / this.attributes.maxHealth;
        this.healthBar.fillStyle(0x00ff00);
        this.healthBar.fillRect(barX, barY, 40 * healthPercentage, 5);
        
        // Border (white)
        this.healthBar.lineStyle(1, 0xffffff, 0.8);
        this.healthBar.strokeRect(barX, barY, 40, 5);
    }

    public changeState(newState: MonsterState): void {
        if (newState === this.currentState) return;
        
        // Reset state-specific timers
        this.stateTimer = 0;
        this.lastStateChange = this.scene.time.now;
        
        // Handle exiting the current state
        // Add any cleanup code here
        
        // Set the new state
        this.currentState = newState;
        
        // Handle entering the new state
        // Add any setup code here
    }

    public takeDamage(amount: number): void {
        // Apply defense reduction
        const actualDamage = Math.max(1, amount - this.attributes.defense);
        this.attributes.health -= actualDamage;
        
        // Update the health bar
        this.updateHealthBar();
        
        // Show damage text
        const damageText = this.scene.add.text(
            this.x, 
            this.y - this.height / 2, 
            `-${actualDamage}`, 
            { fontFamily: 'Arial', fontSize: '16px', color: '#FF0000' }
        );
        
        this.scene.tweens.add({
            targets: damageText,
            y: damageText.y - 30,
            alpha: 0,
            duration: 800,
            onComplete: () => damageText.destroy()
        });
        
        // Check if monster is dead
        if (this.attributes.health <= 0) {
            this.die();
        } else if (this.behavior === MonsterBehavior.PASSIVE) {
            this.changeState(MonsterState.FLEEING);
        } else if (this.behavior === MonsterBehavior.NEUTRAL || this.behavior === MonsterBehavior.TERRITORIAL) {
            this.changeState(MonsterState.CHASING);
        }
    }

    protected die(): void {
        this.changeState(MonsterState.DEAD);
        
        // Drop loot
        this.dropLoot();
        
        // Play death animation or sound
        this.scene.tweens.add({
            targets: this,
            alpha: 0,
            duration: 1000,
            onComplete: () => {
                // Clean up
                this.healthBar.destroy();
                this.destroy();
            }
        });
    }

    protected dropLoot(): void {
        for (const loot of this.lootTable) {
            // Check drop chance
            if (Math.random() <= loot.dropChance) {
                // Determine quantity
                const quantity = Phaser.Math.Between(
                    loot.minQuantity, 
                    loot.maxQuantity
                );
                
                if (quantity > 0) {
                    // Add some randomness to drop position
                    const dropX = this.x + Phaser.Math.Between(-10, 10);
                    const dropY = this.y + Phaser.Math.Between(-10, 10);
                    
                    // Create the item
                    const item = this.itemSystem.createItem(loot.itemId);
                    
                    if (item) {
                        // Here we would add the item to the world
                        // For now, just log it
                        console.log(`Dropped ${quantity}x ${item.name} at (${dropX}, ${dropY})`);
                        
                        // Add to player inventory directly for now
                        const gameScene = this.scene as any;
                        if (gameScene.givePlayerItem) {
                            gameScene.givePlayerItem(loot.itemId, quantity);
                        }
                    }
                }
            }
        }
    }

    public update(time: number, delta: number): void {
        if (this.currentState === MonsterState.DEAD) return;
        
        // Update health bar position
        this.updateHealthBar();
        
        // Calculate distance to player
        const distToPlayer = Phaser.Math.Distance.Between(
            this.x, this.y,
            this.playerSprite.x, this.playerSprite.y
        );
        
        // Update current state
        switch (this.currentState) {
            case MonsterState.IDLE:
                this.handleIdleState(time, delta, distToPlayer);
                break;
                
            case MonsterState.WANDERING:
                this.handleWanderingState(time, delta, distToPlayer);
                break;
                
            case MonsterState.FLEEING:
                this.handleFleeingState(time, delta, distToPlayer);
                break;
                
            case MonsterState.CHASING:
                this.handleChasingState(time, delta, distToPlayer);
                break;
                
            case MonsterState.ATTACKING:
                this.handleAttackingState(time, delta, distToPlayer);
                break;
                
            case MonsterState.RETURNING:
                this.handleReturningState(time, delta);
                break;
        }
    }

    // These methods should be implemented by subclasses to provide specific behavior
    protected abstract handleIdleState(time: number, delta: number, distToPlayer: number): void;
    protected abstract handleWanderingState(time: number, delta: number, distToPlayer: number): void;
    protected abstract handleFleeingState(time: number, delta: number, distToPlayer: number): void;
    protected abstract handleChasingState(time: number, delta: number, distToPlayer: number): void;
    protected abstract handleAttackingState(time: number, delta: number, distToPlayer: number): void;
    protected abstract handleReturningState(time: number, delta: number): void;

    protected setNewWanderTarget(): void {
        // Set a random point within a certain radius of the spawn point
        const wanderRadius = 100;
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * wanderRadius;
        
        const x = this.spawnPoint.x + Math.cos(angle) * distance;
        const y = this.spawnPoint.y + Math.sin(angle) * distance;
        
        this.wanderTarget = new PhaserMath.Vector2(x, y);
    }

    // Helper method to safely check if an animation exists
    protected animationExists(key: string): boolean {
        try {
            return this.anims.exists(key);
        } catch (error) {
            console.error(`Error checking if animation ${key} exists:`, error);
            return false;
        }
    }
    
    // Helper method to safely play an animation
    protected safePlayAnimation(key: string): boolean {
        if (!this.animationExists(key)) {
            return false;
        }
        
        try {
            this.anims.play(key);
            return true;
        } catch (error) {
            console.error(`Error playing animation ${key}:`, error);
            return false;
        }
    }
} 