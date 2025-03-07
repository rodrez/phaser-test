import { Skill, SkillPrerequisite, SkillTier, SkillCategory } from './Skill';

/**
 * Base class for all core skills (Tier 1).
 */
export abstract class CoreSkill extends Skill {
    constructor(
        id: string,
        name: string,
        description: string,
        maxLevel: number = 3,
        levelCosts: number[] = [1, 1, 1],
        prerequisites: SkillPrerequisite[] = [],
        iconUrl?: string
    ) {
        super(id, name, description, maxLevel, levelCosts, prerequisites, iconUrl);
    }
}

/**
 * Archery skill implementation.
 * Allows the use of ranged weapons and increases proficiency with them.
 */
export class ArcherySkill extends CoreSkill {
    constructor() {
        super(
            'archery',
            'Archery',
            'Archery is a great skill for anybody that wants to use ranged weapons. Without archery, you cannot use Crossbows, Longbows, or Slings. Archery also helps to improve your shooting skill when using Longbows, Crossbows, and Slings.'
        );
    }
    
    getEffectsDescription(): string {
        switch (this.level) {
            case 0:
                return 'Not learned yet.';
            case 1:
                return '+1 with Crossbows and Longbows.\nEnables you to craft Longbows and Crossbows.';
            case 2:
                return '+2 with Longbows and Crossbows.\n+25 Range with Longbows and Crossbows.';
            case 3:
                return '+3 with Longbows and Crossbows.\n+50 Range with Longbows and Crossbows.\nGain access to three Specialization Skills: Militia Training, Ranger Training, Mercenary Training.';
            default:
                return 'Unknown level';
        }
    }
    
    applyEffects(player: any): void {
        // Implementation would depend on the player system
        // This is where we would apply bonuses to the player's stats
        if (this.level >= 1) {
            // Add +1 to crossbows and longbows
            // Enable crafting of longbows and crossbows
        }
        
        if (this.level >= 2) {
            // Add +2 to crossbows and longbows (total)
            // Add +25 range with longbows and crossbows
        }
        
        if (this.level >= 3) {
            // Add +3 to crossbows and longbows (total)
            // Add +50 range with longbows and crossbows
            // Unlock specializations would be handled by the skill manager
        }
    }
}

/**
 * Cleave skill implementation.
 * Improves melee combat by giving a chance to hit multiple targets.
 */
export class CleaveSkill extends CoreSkill {
    constructor() {
        super(
            'cleave',
            'Cleave',
            'Cleave is a great, all-around skill, especially for melee fighters. If you have a melee weapon (Sword, Axe, Dagger, Brass Knuckles, Spear, or Staff), Cleave gives it a chance to hit more enemies than before. This is even more useful when fighting a large group of monsters.'
        );
    }
    
    getEffectsDescription(): string {
        switch (this.level) {
            case 0:
                return 'Not learned yet.';
            case 1:
                return '5% chance of dealing 50% of normal attack damage to 3 nearby targets (does not include original target) when using Melee Weapons.';
            case 2:
                return '10% chance of dealing 50% of normal attack damage to 4 nearby targets when using Melee Weapons.';
            case 3:
                return '15% chance of dealing 50% of normal attack damage to 5 nearby targets when using Melee Weapons.\nUnlocks Specialization Classes: Knight Training, Legion Training, Warrior Training.';
            default:
                return 'Unknown level';
        }
    }
    
    applyEffects(player: any): void {
        // Implementation would depend on the player system
        if (this.level >= 1) {
            // 5% chance to hit 3 nearby targets for 50% damage
        }
        
        if (this.level >= 2) {
            // 10% chance to hit 4 nearby targets for 50% damage
        }
        
        if (this.level >= 3) {
            // 15% chance to hit 5 nearby targets for 50% damage
            // Unlock specializations would be handled by the skill manager
        }
    }
}

/**
 * Oiyoi Martial Art skill implementation.
 * Provides dodge chance and ability to use specialized weapons.
 */
export class OiyoiMartialArtSkill extends CoreSkill {
    constructor() {
        super(
            'oiyoi_martial_art',
            'Oiyoi Martial Art',
            'Train your body to Dodge attacks with Unarmed combat. Provides access to special Oiyoi weapons and armor.'
        );
    }
    
    getEffectsDescription(): string {
        switch (this.level) {
            case 0:
                return 'Not learned yet.';
            case 1:
                return 'When you have no weapon or armor equipped, your attack and defense strengths will be determined by the level of your character (up to level 25); this Oiyoi type of defense is different and more effective than the Unarmed type of defense.\n+1 with Blowdarts and Shurikens.\nCan use Oiyoi weapons and armor: Shuriken, Blowdart, Brass Knuckles, Staff, Tunic.';
            case 2:
                return '15% Dodge Chance when unarmed or when using Oiyoi Gear.\n+2 With Blow Darts and Shurikens.';
            case 3:
                return '30% Dodge Chance when unarmed or when using Oiyoi Gear.\nCan craft Oiyoi Gear.\n+3 With Blow Darts and Shurikens.\nGain access to four Specialization Skills: Assassin Training, Ninja Training, Oiyoi Master Training and Thief Training.';
            default:
                return 'Unknown level';
        }
    }
    
    applyEffects(player: any): void {
        // Implementation would depend on the player system
        if (this.level >= 1) {
            // Scale attack/defense with player level when unarmed
            // +1 with blowdarts and shurikens
            // Allow use of Oiyoi weapons and armor
        }
        
        if (this.level >= 2) {
            // 15% dodge chance with Oiyoi gear or unarmed
            // +2 with blowdarts and shurikens
        }
        
        if (this.level >= 3) {
            // 30% dodge chance with Oiyoi gear or unarmed
            // Enable crafting of Oiyoi gear
            // +3 with blowdarts and shurikens
            // Unlock specializations would be handled by the skill manager
        }
    }
}

/**
 * Tactics skill implementation.
 * Provides bonuses to combat planning and preparation.
 */
export class TacticsSkill extends CoreSkill {
    constructor() {
        super(
            'tactics',
            'Tactics',
            'Plan your assaults outside of battle to fight more efficiently. Gain damage bonuses against monsters when not aggressive.'
        );
    }
    
    getEffectsDescription(): string {
        switch (this.level) {
            case 0:
                return 'Not learned yet.';
            case 1:
                return 'Gain a +0.1 Damage bonus (Tactics) against Monsters for every Chopped Tree or 30 seconds spent Unaggressive.\nFor every 10 seconds you are Aggressive, you lose +0.1 of the bonus.\n(Max of +1)';
            case 2:
                return 'Tactics bonus gains +0.2 each time. You still lose +0.1 while Aggressive.\n(Max of +2)';
            case 3:
                return 'Tactics bonus gains +0.3 each time. You still lose +0.1 while Aggressive.\n(Max of +3)\nGain access to four Specialization Skills: Merchant Training, Crafter Training, Druid Training, Explorer Training.';
            default:
                return 'Unknown level';
        }
    }
    
    applyEffects(player: any): void {
        // Implementation would depend on the player system
        if (this.level >= 1) {
            // +0.1 damage bonus for tree chopping or being unaggressive
            // Max bonus +1
        }
        
        if (this.level >= 2) {
            // +0.2 damage bonus for tree chopping or being unaggressive
            // Max bonus +2
        }
        
        if (this.level >= 3) {
            // +0.3 damage bonus for tree chopping or being unaggressive
            // Max bonus +3
            // Unlock specializations would be handled by the skill manager
        }
    }
}

/**
 * Creates all core skills.
 * @returns Array of all core skills
 */
export function createCoreSkills(): CoreSkill[] {
    return [
        new ArcherySkill(),
        new CleaveSkill(),
        new OiyoiMartialArtSkill(),
        new TacticsSkill()
    ];
} 