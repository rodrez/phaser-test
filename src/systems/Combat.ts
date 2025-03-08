import { Scene } from 'phaser';
import { PlayerSystem } from './Player';
import { BaseMonster } from './monsters/BaseMonster';
import { Monster } from './Monster';
import { ItemType, WeaponItem } from './Item';
import { SkillEffectSystem } from './skills/SkillEffectSystem';

// Types of damage that can be dealt
export enum DamageType {
    PHYSICAL = 'physical',
    FIRE = 'fire',
    ICE = 'ice',
    POISON = 'poison',
    ELECTRIC = 'electric',
    HOLY = 'holy',
    DEMONIC = 'demonic'
}

// Interface for damage information
export interface DamageInfo {
    amount: number;
    type: DamageType;
    isCritical?: boolean;
    source?: unknown; // The entity that caused the damage
    sourceType?: 'player' | 'monster' | 'environment' | 'trap';
}

// Interface for combat events
interface CombatEvent {
    type: string;
    target: unknown;
    data: unknown;
}

/**
 * Handles combat interactions between player and monsters.
 */
export class CombatSystem {
    private scene: Scene;
    private playerSystem: PlayerSystem;
    private skillEffectSystem: SkillEffectSystem | null = null;
    private combatListeners: ((event: CombatEvent) => void)[] = [];
    
    constructor(scene: Scene) {
        this.scene = scene;
        
        // Get player system
        const sceneAny = this.scene as unknown as { playerSystem?: PlayerSystem };
        this.playerSystem = sceneAny.playerSystem || new PlayerSystem(this.scene);
        if (!sceneAny.playerSystem) {
            sceneAny.playerSystem = this.playerSystem;
        }
        
        // Get or create skill effect system
        const sceneWithSkills = this.scene as unknown as { 
            skillEffectSystem?: SkillEffectSystem;
            skillManager?: unknown;
        };
        
        if (sceneWithSkills.skillEffectSystem) {
            this.skillEffectSystem = sceneWithSkills.skillEffectSystem;
        } else if (sceneWithSkills.skillManager) {
            this.skillEffectSystem = new SkillEffectSystem(
                this.scene, 
                sceneWithSkills.skillManager as any
            );
            sceneWithSkills.skillEffectSystem = this.skillEffectSystem;
        }
    }
    
    /**
     * Deal damage to the player
     */
    public damagePlayer(damageInfo: DamageInfo): void {
        // Get player stats
        const sceneWithStats = this.scene as unknown as { playerStats?: Record<string, unknown> };
        const stats = sceneWithStats.playerStats;
        if (!stats) {
            console.warn('Cannot damage player: playerStats not found');
            return;
        }
        
        // Check if god mode is enabled - skip damage if it is
        if (stats.godMode) {
            // Still show damage text but with 0 damage
            this.showDamageText(this.playerSystem.player, 0, false);
            return;
        }
        
        // Calculate actual damage after defense
        const defense = (stats.defense as number) || 0;
        let actualDamage = Math.max(1, damageInfo.amount - defense);
        
        // Apply damage type modifiers
        actualDamage = this.applyDamageTypeModifiers(
            actualDamage, 
            damageInfo.type, 
            stats.resistances as Record<string, number> | undefined
        );
        
        // Apply critical hit if applicable
        if (damageInfo.isCritical) {
            actualDamage = Math.floor(actualDamage * 1.5);
        }
        
        // Get count of monsters currently attacking the player
        const sceneWithMonsters = this.scene as unknown as { 
            monsterSystem?: { getAutoAttackingMonsters: () => unknown[] } 
        };
        const monsterSystem = sceneWithMonsters.monsterSystem;
        let attackingMonsterCount = 1;
        
        if (monsterSystem) {
            // Count monsters that are currently auto-attacking
            attackingMonsterCount = monsterSystem.getAutoAttackingMonsters().length;
            
            // Ensure at least 1 for division
            attackingMonsterCount = Math.max(1, attackingMonsterCount);
            
            // Apply diminishing returns for multiple attackers
            // First attacker does full damage, each additional attacker does less
            if (attackingMonsterCount > 1) {
                // Formula: damage * (1 + 0.2 * (attackerCount - 1))
                // This means 2 attackers = 1.2x total damage, 3 attackers = 1.4x, etc.
                // So each additional attacker does less damage than the previous one
                const totalDamageMultiplier = 1 + 0.2 * (attackingMonsterCount - 1);
                actualDamage = Math.floor(actualDamage / totalDamageMultiplier);
            }
        }
        
        // Apply skill effects to incoming damage
        if (this.skillEffectSystem) {
            actualDamage = this.skillEffectSystem.modifyIncomingDamage(
                actualDamage, 
                damageInfo.type, 
                damageInfo.source
            );
        }
        
        // Reduce player health
        stats.health = Math.max(0, (stats.health as number) - actualDamage);
        
        // Update health bar
        this.playerSystem.updateHealthBar();
        
        // Show damage text
        this.showDamageText(this.playerSystem.player, actualDamage, damageInfo.isCritical);
        
        // Trigger combat event
        this.triggerCombatEvent({
            type: 'damage',
            target: this.playerSystem.player,
            data: {
                ...damageInfo,
                actualDamage,
                attackingMonsterCount
            }
        });
        
        // Check if player died
        if ((stats.health as number) <= 0) {
            this.handlePlayerDeath();
        }
    }
    
    /**
     * Deal damage to a monster
     */
    public damageMonster(monster: BaseMonster | Monster, damageInfo: DamageInfo): void {
        // Let the monster handle its own damage logic
        if (monster instanceof BaseMonster) {
            monster.takeDamage(damageInfo.amount);
        } else if ('takeDamage' in monster) {
            (monster as any).takeDamage(damageInfo.amount);
        }
        
        // Trigger combat event
        this.triggerCombatEvent({
            type: 'damage',
            target: monster,
            data: damageInfo
        });
    }
    
    /**
     * Calculate player attack damage based on equipped weapon and stats
     */
    public calculatePlayerAttackDamage(): DamageInfo {
        const stats = (this.scene as any).playerStats;
        if (!stats) {
            return { amount: 1, type: DamageType.PHYSICAL };
        }
        
        // Base damage
        let damage = stats.baseDamage || 5;
        let damageType = DamageType.PHYSICAL;
        
        // Check for equipped weapon
        const inventory = (this.scene as any).inventorySystem;
        if (inventory && inventory.getEquippedItem(ItemType.WEAPON)) {
            const weapon = inventory.getEquippedItem(ItemType.WEAPON) as WeaponItem;
            damage += weapon.getAttackDamage();
            
            // Set damage type based on weapon attributes
            if (weapon.attributes) {
                if (weapon.attributes.fire) damageType = DamageType.FIRE;
                else if (weapon.attributes.ice) damageType = DamageType.ICE;
                else if (weapon.attributes.poison) damageType = DamageType.POISON;
                else if (weapon.attributes.electric) damageType = DamageType.ELECTRIC;
                else if (weapon.attributes.holy) damageType = DamageType.HOLY;
                else if (weapon.attributes.demonic) damageType = DamageType.DEMONIC;
            }
        }
        
        // Calculate critical hit chance
        const critChance = stats.critChance || 0.05;
        const isCritical = Math.random() < critChance;
        
        // Create the base damage info
        const damageInfo: DamageInfo = {
            amount: damage,
            type: damageType,
            isCritical,
            source: this.playerSystem.player,
            sourceType: 'player'
        };
        
        // Apply skill effects to outgoing damage
        if (this.skillEffectSystem) {
            damageInfo.amount = this.skillEffectSystem.modifyOutgoingDamage(
                damageInfo.amount, 
                damageInfo.type, 
                null // Will be set when we know the target
            );
            
            // Apply critical damage multiplier if it's a critical hit
            if (isCritical) {
                const critMultiplier = stats.critDamageMultiplier || 1.5;
                damageInfo.amount = Math.floor(damageInfo.amount * critMultiplier);
            }
        }
        
        return damageInfo;
    }
    
    /**
     * Handle player attacking a monster
     */
    public playerAttackMonster(monster: BaseMonster | Monster): void {
        // Calculate damage
        const damageInfo = this.calculatePlayerAttackDamage();
        
        // Apply skill effects specific to this target
        if (this.skillEffectSystem) {
            damageInfo.amount = this.skillEffectSystem.modifyOutgoingDamage(
                damageInfo.amount, 
                damageInfo.type, 
                monster
            );
        }
        
        // Apply damage to monster
        this.damageMonster(monster, damageInfo);
        
        // Set this monster as the current target for auto-attacking
        this.playerSystem.setTarget(monster);
        
        // Trigger attack event
        this.triggerCombatEvent({
            type: 'attack',
            target: monster,
            data: {
                attacker: this.playerSystem.player,
                damageInfo
            }
        });
        
        // Play attack animation
        this.playerSystem.player.anims.play('player-attack', true);
        
        // Check for cleave effect to hit additional targets
        this.applyCleaveDamage(monster, damageInfo);
    }
    
    /**
     * Handle monster attacking player
     */
    public monsterAttackPlayer(monster: BaseMonster | Monster, damage: number): void {
        // Create damage info
        const damageInfo: DamageInfo = {
            amount: damage,
            type: DamageType.PHYSICAL,
            source: monster,
            sourceType: 'monster'
        };
        
        // Apply damage to player
        this.damagePlayer(damageInfo);
        
        // Trigger attack event
        this.triggerCombatEvent({
            type: 'attack',
            target: this.playerSystem.player,
            data: {
                attacker: monster,
                damageInfo
            }
        });
    }
    
    /**
     * Apply damage type modifiers based on resistances
     */
    private applyDamageTypeModifiers(damage: number, type: DamageType, resistances?: Record<string, number>): number {
        if (!resistances) return damage;
        
        const resistance = resistances[type] || 0;
        
        // Resistance reduces damage by percentage (0-100%)
        return Math.max(1, damage * (1 - resistance / 100));
    }
    
    /**
     * Show floating damage text
     */
    private showDamageText(target: Phaser.GameObjects.GameObject, amount: number, isCritical: boolean = false): void {
        // Get position
        const x = (target as any).x;
        const y = (target as any).y - 20;
        
        // Create text with appropriate style
        const style = {
            fontFamily: 'Arial',
            fontSize: isCritical ? '20px' : '16px',
            color: isCritical ? '#FF0000' : '#FF6666',
            stroke: '#000000',
            strokeThickness: 2
        };
        
        const text = this.scene.add.text(x, y, `-${amount}`, style);
        text.setOrigin(0.5);
        
        // Animate the text
        this.scene.tweens.add({
            targets: text,
            y: y - 30,
            alpha: 0,
            duration: 1000,
            onComplete: () => text.destroy()
        });
    }
    
    /**
     * Handle player death
     */
    private handlePlayerDeath(): void {
        // Trigger death event
        this.triggerCombatEvent({
            type: 'death',
            target: this.playerSystem.player,
            data: { cause: 'damage' }
        });
        
        // Transition to game over scene
        this.scene.time.delayedCall(1000, () => {
            this.scene.scene.start('GameOver');
        });
    }
    
    /**
     * Add a listener for combat events
     */
    public addCombatListener(listener: (event: CombatEvent) => void): void {
        this.combatListeners.push(listener);
    }
    
    /**
     * Remove a combat event listener
     */
    public removeCombatListener(listener: (event: CombatEvent) => void): void {
        const index = this.combatListeners.indexOf(listener);
        if (index !== -1) {
            this.combatListeners.splice(index, 1);
        }
    }
    
    /**
     * Trigger a combat event
     */
    private triggerCombatEvent(event: CombatEvent): void {
        // Notify all listeners
        for (const listener of this.combatListeners) {
            listener(event);
        }
    }
    
    /**
     * Apply cleave damage to nearby monsters if the player has the cleave skill
     */
    private applyCleaveDamage(primaryTarget: BaseMonster | Monster, damageInfo: DamageInfo): void {
        const stats = (this.scene as any).playerStats;
        if (!stats || !stats.cleaveChance || !stats.cleaveTargets) {
            return; // No cleave skill
        }
        
        // Check if cleave triggers
        if (Math.random() > stats.cleaveChance) {
            return; // Cleave didn't trigger
        }
        
        // Get nearby monsters
        const monsterSystem = (this.scene as any).monsterSystem;
        if (!monsterSystem) return;
        
        const nearbyMonsters = monsterSystem.getNearbyMonsters(
            this.playerSystem.player.x,
            this.playerSystem.player.y,
            100 // Cleave range
        );
        
        // Remove the primary target from the list
        const otherMonsters = nearbyMonsters.filter(m => m !== primaryTarget);
        
        // Limit to the number of cleave targets
        const cleaveTargets = otherMonsters.slice(0, stats.cleaveTargets - 1);
        
        // Apply reduced damage to cleave targets
        const cleaveDamageInfo = { ...damageInfo };
        cleaveDamageInfo.amount = Math.floor(damageInfo.amount * 0.7); // 70% damage to cleave targets
        
        for (const target of cleaveTargets) {
            this.damageMonster(target, cleaveDamageInfo);
            
            // Show cleave text
            this.showCleaveDamageText(target);
        }
    }
    
    /**
     * Show cleave damage text
     */
    private showCleaveDamageText(target: BaseMonster | Monster): void {
        const x = (target as any).x;
        const y = (target as any).y - 20;
        
        const text = this.scene.add.text(x, y, 'CLEAVE!', {
            fontFamily: 'Arial',
            fontSize: '16px',
            color: '#FF9900',
            stroke: '#000000',
            strokeThickness: 2
        });
        text.setOrigin(0.5);
        
        // Animate the text
        this.scene.tweens.add({
            targets: text,
            y: y - 30,
            alpha: 0,
            duration: 1000,
            onComplete: () => text.destroy()
        });
    }
}
