import { Scene } from 'phaser';
import { Skill } from './Skill';
import { SkillManager } from './SkillManager';
import { DamageType } from '../Combat';

/**
 * System responsible for applying skill effects to the player.
 * This centralizes all skill effect application logic in one place.
 */
export class SkillEffectSystem {
    /** Reference to the main game scene */
    private scene: Scene;
    
    /** Reference to the skill manager */
    private skillManager: SkillManager;
    
    /** Cached player stats with skill bonuses applied */
    private cachedPlayerStats: Record<string, any> = {};
    
    /** Flag to track if stats need recalculation */
    private needsRecalculation: boolean = true;
    
    /**
     * Creates a new SkillEffectSystem.
     * @param scene The main game scene
     * @param skillManager The skill manager
     */
    constructor(scene: Scene, skillManager: SkillManager) {
        this.scene = scene;
        this.skillManager = skillManager;
        
        // Listen for skill changes to trigger recalculation
        this.skillManager.on('skill-learned', () => this.flagForRecalculation());
        this.skillManager.on('skill-upgraded', () => this.flagForRecalculation());
        this.skillManager.on('skill-reset', () => this.flagForRecalculation());
        this.skillManager.on('specialization-changed', () => this.flagForRecalculation());
    }
    
    /**
     * Flags the system to recalculate stats on next access.
     */
    flagForRecalculation(): void {
        this.needsRecalculation = true;
    }
    
    /**
     * Applies all skill effects to the player's base stats.
     * @param baseStats The player's base stats without skill bonuses
     * @returns The player's stats with all skill bonuses applied
     */
    applyAllSkillEffects(baseStats: Record<string, any>): Record<string, any> {
        // If no recalculation is needed and we have cached stats, return them
        if (!this.needsRecalculation && Object.keys(this.cachedPlayerStats).length > 0) {
            return this.cachedPlayerStats;
        }
        
        // Clone the base stats to avoid modifying the original
        const modifiedStats = { ...baseStats };
        
        // Get all learned skills
        const learnedSkills = this.skillManager.getLearnedSkills();
        
        // Apply each skill's effects
        for (const skill of learnedSkills) {
            this.applySingleSkillEffect(skill, modifiedStats);
        }
        
        // Apply specialization effects if any
        const specialization = this.skillManager.getSpecialization();
        if (specialization) {
            this.applySingleSkillEffect(specialization, modifiedStats);
        }
        
        // Cache the result
        this.cachedPlayerStats = modifiedStats;
        this.needsRecalculation = false;
        
        return modifiedStats;
    }
    
    /**
     * Applies a single skill's effects to the player's stats.
     * @param skill The skill to apply
     * @param stats The stats to modify
     */
    private applySingleSkillEffect(skill: Skill, stats: Record<string, any>): void {
        // Skip skills that aren't learned yet
        if (skill.level === 0) {
            return;
        }
        
        // Apply effects based on skill ID and level
        switch (skill.id) {
            // Combat skills
            case 'cleave':
                // Cleave allows hitting multiple enemies
                stats.cleaveChance = 0.2 + (skill.level * 0.1); // 30%/40%/50% chance at levels 1/2/3
                stats.cleaveTargets = 1 + skill.level; // 2/3/4 targets at levels 1/2/3
                break;
                
            case 'fatality':
                // Increases critical hit chance and damage
                stats.critChance = (stats.critChance || 0.05) + (skill.level * 0.05); // +5%/10%/15% at levels 1/2/3
                stats.critDamageMultiplier = (stats.critDamageMultiplier || 1.5) + (skill.level * 0.2); // +20%/40%/60% at levels 1/2/3
                break;
                
            case 'focus':
                // Increases accuracy and reduces miss chance
                stats.accuracy = (stats.accuracy || 0.9) + (skill.level * 0.03); // +3%/6%/9% at levels 1/2/3
                break;
                
            case 'heroism':
                // Increases damage when at low health
                stats.lowHealthDamageBonus = skill.level * 0.15; // +15%/30%/45% at levels 1/2/3
                stats.lowHealthThreshold = 0.3; // Below 30% health
                break;
                
            case 'pierce_armor':
                // Chance to ignore enemy armor
                stats.armorPierceChance = skill.level * 0.1; // 10%/20%/30% at levels 1/2/3
                stats.armorPierceAmount = 0.3 + (skill.level * 0.2); // 50%/70%/90% at levels 1/2/3
                break;
                
            case 'plague_strike':
                // Applies poison damage over time
                stats.poisonChance = 0.2 + (skill.level * 0.1); // 30%/40%/50% at levels 1/2/3
                stats.poisonDamage = 2 + skill.level; // 3/4/5 damage per tick at levels 1/2/3
                stats.poisonDuration = 3 + skill.level; // 4/5/6 seconds at levels 1/2/3
                break;
                
            case 'rally_cry':
                // Temporary buff to damage and defense
                stats.rallyCryDamageBonus = 0.1 + (skill.level * 0.05); // +15%/20%/25% at levels 1/2/3
                stats.rallyCryDefenseBonus = 0.1 + (skill.level * 0.05); // +15%/20%/25% at levels 1/2/3
                stats.rallyCryDuration = 5 + (skill.level * 2); // 7/9/11 seconds at levels 1/2/3
                stats.rallyCryCooldown = 30 - (skill.level * 5); // 25/20/15 seconds at levels 1/2/3
                break;
                
            case 'relentless_assault':
                // Increases attack speed
                stats.attackSpeedBonus = 0.1 + (skill.level * 0.05); // +15%/20%/25% at levels 1/2/3
                break;
                
            case 'shield_charge':
                // Allows charging into enemies with a shield
                stats.shieldChargeUnlocked = true;
                stats.shieldChargeDamage = 5 + (skill.level * 3); // 8/11/14 damage at levels 1/2/3
                stats.shieldChargeStunDuration = 1 + (skill.level * 0.5); // 1.5/2/2.5 seconds at levels 1/2/3
                stats.shieldChargeCooldown = 15 - (skill.level * 2); // 13/11/9 seconds at levels 1/2/3
                break;
                
            case 'taunt':
                // Forces enemies to attack the player
                stats.tauntUnlocked = true;
                stats.tauntRadius = 100 + (skill.level * 50); // 150/200/250 pixels at levels 1/2/3
                stats.tauntDuration = 3 + skill.level; // 4/5/6 seconds at levels 1/2/3
                stats.tauntCooldown = 20 - (skill.level * 3); // 17/14/11 seconds at levels 1/2/3
                break;
                
            case 'triumph':
                // Heals on kill
                stats.triumphHealAmount = 5 + (skill.level * 3); // 8/11/14 health at levels 1/2/3
                break;
                
            // Specialization skills
            case 'warrior_training':
                // Warrior specialization
                stats.maxHealth = (stats.maxHealth || 100) + (skill.level * 20); // +20/40/60/80/100 health at levels 1-5
                stats.baseDamage = (stats.baseDamage || 5) + (skill.level * 2); // +2/4/6/8/10 damage at levels 1-5
                
                // Bonus damage with axes
                stats.axeDamageBonus = 0.1 + (skill.level * 0.05); // +15%/20%/25%/30%/35% at levels 1-5
                
                // Low health damage bonus
                stats.lowHealthDamageBonus = (stats.lowHealthDamageBonus || 0) + (skill.level * 0.05); // +5%/10%/15%/20%/25% at levels 1-5
                stats.lowHealthThreshold = 0.4; // Below 40% health
                break;
                
            case 'ranger_training':
                // Ranger specialization
                stats.rangedDamageBonus = 0.1 + (skill.level * 0.05); // +15%/20%/25%/30%/35% at levels 1-5
                stats.rangedAttackRange = (stats.rangedAttackRange || 200) + (skill.level * 20); // +20/40/60/80/100 range at levels 1-5
                stats.movementSpeed = (stats.movementSpeed || 1) + (skill.level * 0.05); // +5%/10%/15%/20%/25% at levels 1-5
                break;
                
            case 'ninja_training':
                // Ninja specialization
                stats.dodgeChance = (stats.dodgeChance || 0) + (skill.level * 0.05); // +5%/10%/15%/20%/25% at levels 1-5
                stats.movementSpeed = (stats.movementSpeed || 1) + (skill.level * 0.08); // +8%/16%/24%/32%/40% at levels 1-5
                stats.critChance = (stats.critChance || 0.05) + (skill.level * 0.03); // +3%/6%/9%/12%/15% at levels 1-5
                break;
                
            // Add more skills as needed
            
            default:
                // For skills not explicitly handled, call their applyEffects method
                try {
                    skill.applyEffects(stats);
                } catch (error) {
                    console.warn(`Failed to apply effects for skill ${skill.id}:`, error);
                }
                break;
        }
    }
    
    /**
     * Modifies damage dealt by the player based on skills.
     * @param baseDamage The base damage amount
     * @param damageType The type of damage
     * @param target The target being damaged
     * @returns The modified damage amount
     */
    modifyOutgoingDamage(baseDamage: number, damageType: DamageType, target: any): number {
        // Ensure stats are up to date
        if (this.needsRecalculation) {
            this.applyAllSkillEffects((this.scene as any).playerStats || {});
        }
        
        let damage = baseDamage;
        const stats = this.cachedPlayerStats;
        
        // Apply weapon-specific bonuses
        const inventory = (this.scene as any).inventorySystem;
        if (inventory) {
            const weapon = inventory.getEquippedWeapon();
            if (weapon) {
                // Apply axe damage bonus for warriors
                if (weapon.type === 'axe' && stats.axeDamageBonus) {
                    damage *= (1 + stats.axeDamageBonus);
                }
                
                // Apply ranged damage bonus for rangers
                if (weapon.isRanged && stats.rangedDamageBonus) {
                    damage *= (1 + stats.rangedDamageBonus);
                }
            }
        }
        
        // Apply low health damage bonus
        if (stats.lowHealthDamageBonus && stats.lowHealthThreshold) {
            const healthPercent = stats.health / stats.maxHealth;
            if (healthPercent <= stats.lowHealthThreshold) {
                damage *= (1 + stats.lowHealthDamageBonus);
            }
        }
        
        // Apply poison damage if plague strike procs
        if (stats.poisonChance && Math.random() < stats.poisonChance) {
            // Apply poison effect to target
            if (target && typeof target.applyEffect === 'function') {
                target.applyEffect('poison', {
                    damage: stats.poisonDamage,
                    duration: stats.poisonDuration,
                    source: 'player'
                });
            }
        }
        
        // Apply armor piercing
        if (stats.armorPierceChance && Math.random() < stats.armorPierceChance) {
            // Set a flag on the damage info to indicate armor piercing
            (target as any).tempArmorPierceAmount = stats.armorPierceAmount;
        }
        
        return Math.floor(damage);
    }
    
    /**
     * Modifies damage taken by the player based on skills.
     * @param baseDamage The base damage amount
     * @param damageType The type of damage
     * @param source The source of the damage
     * @returns The modified damage amount
     */
    modifyIncomingDamage(baseDamage: number, damageType: DamageType, source: any): number {
        // Ensure stats are up to date
        if (this.needsRecalculation) {
            this.applyAllSkillEffects((this.scene as any).playerStats || {});
        }
        
        let damage = baseDamage;
        const stats = this.cachedPlayerStats;
        
        // Apply dodge chance (mainly for ninja)
        if (stats.dodgeChance && Math.random() < stats.dodgeChance) {
            // Show dodge text
            this.showDodgeText();
            return 0; // Completely avoid damage
        }
        
        // Apply rally cry defense bonus if active
        if (stats.rallyCryActive && stats.rallyCryDefenseBonus) {
            damage *= (1 - stats.rallyCryDefenseBonus);
        }
        
        return Math.max(1, Math.floor(damage));
    }
    
    /**
     * Shows a "Dodge" text above the player.
     */
    private showDodgeText(): void {
        const player = (this.scene as any).playerSystem?.player;
        if (!player) return;
        
        const x = player.x;
        const y = player.y - 40;
        
        const text = this.scene.add.text(x, y, 'DODGE!', {
            fontFamily: 'Arial',
            fontSize: '18px',
            color: '#FFFFFF',
            stroke: '#000000',
            strokeThickness: 3
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