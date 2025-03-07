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
    public isAutoAttacking: boolean = false;
    public goldReward: number;
    public xpReward: number;

    protected spawnPoint: PhaserMath.Vector2;
    protected wanderTarget: PhaserMath.Vector2 | null = null;
    protected wanderTimer: number = 0;
    protected stateTimer: number = 0;
    protected lastStateChange: number = 0;

    protected playerSprite: Physics.Arcade.Sprite;
    protected itemSystem: ItemSystem;
    
    // Auto-attack properties
    protected readonly ATTACK_RANGE: number = 40; // Range at which monster can attack player
    protected attackIndicator: GameObjects.Graphics | null = null;

    protected healthBar: GameObjects.Graphics;

    constructor(scene: Scene, x: number, y: number, monsterData: MonsterData, playerSprite: Physics.Arcade.Sprite, itemSystem: ItemSystem) {
        super(scene, x, y, monsterData.spriteKey);
        
        this.monsterType = monsterData.type;
        this.monsterName = monsterData.name;
        this.behavior = monsterData.behavior;
        this.attributes = { ...monsterData.attributes };
        this.lootTable = [...monsterData.lootTable];
        this.goldReward = monsterData.goldReward || 0;
        this.xpReward = monsterData.xpReward || 0;
        
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
        // Calculate actual damage after defense
        const actualDamage = Math.max(1, amount - this.attributes.defense);
        
        // Reduce health
        this.attributes.health -= actualDamage;
        
        // Update health bar
        this.updateHealthBar();
        
        // Show damage text
        this.showDamageText(actualDamage);
        
        // Check if dead
        if (this.attributes.health <= 0) {
            this.die();
            return;
        }
        
        // Set auto-attacking flag when damaged
        this.isAutoAttacking = true;
        
        // React based on behavior
        switch (this.behavior) {
            case MonsterBehavior.PASSIVE:
                this.changeState(MonsterState.FLEEING);
                break;
                
            case MonsterBehavior.NEUTRAL:
                // Neutral monsters become aggressive when attacked
                this.changeState(MonsterState.CHASING);
                break;
                
            case MonsterBehavior.AGGRESSIVE:
            case MonsterBehavior.TERRITORIAL:
                this.changeState(MonsterState.CHASING);
                break;
        }
    }

    /**
     * Shows a floating damage text above the monster
     * @param amount The amount of damage to display
     */
    protected showDamageText(amount: number): void {
        const damageText = this.scene.add.text(
            this.x, 
            this.y - this.height / 2, 
            `-${amount}`, 
            { fontFamily: 'Arial', fontSize: '16px', color: '#FF0000' }
        );
        
        this.scene.tweens.add({
            targets: damageText,
            y: damageText.y - 30,
            alpha: 0,
            duration: 800,
            onComplete: () => damageText.destroy()
        });
    }

    /**
     * Attack the player using the combat system
     */
    protected attackPlayer(): void {
        // Use combat system if available
        const combatSystem = (this.scene as any).combatSystem;
        if (combatSystem) {
            combatSystem.monsterAttackPlayer(this, this.attributes.damage);
        } else {
            // Fallback for backward compatibility
            const playerSystem = (this.scene as any).playerSystem;
            if (playerSystem && typeof playerSystem.takeDamage === 'function') {
                playerSystem.takeDamage(this.attributes.damage);
            } else {
                console.log(`${this.monsterName} attacks player for ${this.attributes.damage} damage`);
            }
        }
    }

    protected die(): void {
        // Set state to dead
        this.currentState = MonsterState.DEAD;
        
        // Clear auto-attacking flag and hide indicator
        this.isAutoAttacking = false;
        this.hideAttackIndicator();
        
        // Drop loot
        this.dropLoot();
        
        // Reward player with gold and XP
        this.rewardPlayer();
        
        // Play death animation or effect
        this.scene.tweens.add({
            targets: this,
            alpha: 0,
            duration: 1000,
            onComplete: () => {
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

    /**
     * Rewards the player with gold and XP for killing this monster
     */
    protected rewardPlayer(): void {
        const gameScene = this.scene as any;
        
        // Only proceed if we have access to player stats
        if (!gameScene.playerStats) {
            console.warn('Cannot reward player: playerStats not found');
            return;
        }
        
        // Add gold to player
        if (this.goldReward > 0) {
            gameScene.playerStats.gold += this.goldReward;
            
            // Update inventory gold if available
            if (gameScene.inventorySystem) {
                gameScene.inventorySystem.addGold(this.goldReward);
            }
            
            // Show gold reward text
            this.showRewardText(this.goldReward, '#FFD700');
        }
        
        // Add XP to player
        if (this.xpReward > 0) {
            gameScene.playerStats.xp += this.xpReward;
            
            // Show XP reward text
            this.showRewardText(`+${this.xpReward} XP`, '#00FFFF');
            
            // Check if player can level up
            if (gameScene.playerStats.xp >= gameScene.playerStats.xpToNextLevel) {
                // This will be handled by the game scene's update method
                // Just update UI if available
                if (gameScene.medievalVitals) {
                    gameScene.medievalVitals.showMessage('Level up available!', 'success', 5000);
                }
            }
            
            // Update UI if available
            if (gameScene.medievalVitals) {
                gameScene.medievalVitals.updatePlayerStats();
            }
        }
    }
    
    /**
     * Shows a floating reward text above the monster
     * @param text The text to display
     * @param color The color of the text
     */
    protected showRewardText(text: string | number, color: string): void {
        const textStr = typeof text === 'number' ? `+${text} gold` : text;
        const rewardText = this.scene.add.text(
            this.x, 
            this.y - this.height / 2 - 20, 
            textStr, 
            { fontFamily: 'Arial', fontSize: '16px', color: color, stroke: '#000000', strokeThickness: 3 }
        );
        rewardText.setOrigin(0.5);
        
        this.scene.tweens.add({
            targets: rewardText,
            y: rewardText.y - 40,
            alpha: 0,
            duration: 1500,
            onComplete: () => rewardText.destroy()
        });
    }

    public update(time: number, delta: number): void {
        if (this.currentState === MonsterState.DEAD) return;
        
        // Update health bar position
        this.updateHealthBar();
        
        // Update attack indicator
        if (this.isAutoAttacking) {
            this.showAttackIndicator();
            this.updateAttackIndicator();
        } else {
            this.hideAttackIndicator();
        }
        
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
        const wanderRadius = 30;
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

    /**
     * Shows a visual indicator that this monster is attacking the player
     */
    protected showAttackIndicator(): void {
        // Remove any existing indicator
        this.hideAttackIndicator();
        
        // Create a new indicator
        this.attackIndicator = this.scene.add.graphics();
        this.attackIndicator.lineStyle(2, 0xff0000, 1);
        this.attackIndicator.lineBetween(this.x, this.y, this.playerSprite.x, this.playerSprite.y);
        this.attackIndicator.setDepth(this.depth - 1);
    }
    
    /**
     * Hides the attack indicator
     */
    protected hideAttackIndicator(): void {
        if (this.attackIndicator) {
            this.attackIndicator.destroy();
            this.attackIndicator = null;
        }
    }
    
    /**
     * Updates the attack indicator position
     */
    protected updateAttackIndicator(): void {
        if (this.attackIndicator && this.isAutoAttacking) {
            this.attackIndicator.clear();
            this.attackIndicator.lineStyle(2, 0xff0000, 1);
            this.attackIndicator.lineBetween(this.x, this.y, this.playerSprite.x, this.playerSprite.y);
        }
    }
} 