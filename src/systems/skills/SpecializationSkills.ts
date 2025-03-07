import { SpecializationSkill } from './SpecializationSkill';
import { SkillPrerequisite } from './Skill';

/**
 * Warrior specialization skill implementation.
 * Warriors are brutes that deal more powerful blows with Axes as their improved Health lowers.
 */
export class WarriorSkill extends SpecializationSkill {
    constructor() {
        super(
            'warrior_training',
            'Warrior Training',
            'Warrior',
            'Warriors are brutes that deal more powerful blows with Axes as their improved Health lowers.',
            'Tank/DPS',
            1, // Low difficulty (Beginner-friendly)
            ['Axe'],
            ['Heavy Armor'],
            [
                'Increased maximum HP',
                'Bonus damage with axes',
                'Additional attack bonus when at low health',
                'Cleave ability to hit multiple targets'
            ],
            [{ skillId: 'cleave', level: 3 }],
            'assets/skills/warrior.png'
        );
    }
    
    getEffectsDescription(): string {
        switch (this.level) {
            case 0:
                return 'Not learned yet.';
            case 1:
                return '+10 Max HP\n+1 attack bonus with Axe';
            case 2:
                return '+20 Max HP\n+1 melee attack bonus when HP < 50%';
            case 3:
                return '+30 Max HP\n+2 attack bonus with Axe';
            case 4:
                return '+40 Max HP\nAdditional +2 attack bonus with Axe when HP < 35%';
            case 5:
                return '+50 Max HP\n+3 attack bonus with axe\n+3 melee attack bonus when HP < 25%';
            default:
                return 'Unknown level';
        }
    }
    
    applyEffects(player: any): void {
        // Implementation would depend on the player system
        if (this.level >= 1) {
            // +10 Max HP
            // +1 attack bonus with Axe
        }
        
        if (this.level >= 2) {
            // +20 Max HP
            // +1 melee attack bonus when HP < 50%
        }
        
        if (this.level >= 3) {
            // +30 Max HP
            // +2 attack bonus with Axe
        }
        
        if (this.level >= 4) {
            // +40 Max HP
            // Additional +2 attack bonus with Axe when HP < 35%
        }
        
        if (this.level >= 5) {
            // +50 Max HP
            // +3 attack bonus with axe
            // +3 melee attack bonus when HP < 25%
        }
    }
}

/**
 * Druid specialization skill implementation.
 * Masters of nature, these healing wardens guard the secrets of nature and support their allies in combat.
 */
export class DruidSkill extends SpecializationSkill {
    constructor() {
        super(
            'druid_training',
            'Druid Training',
            'Druid',
            'Masters of nature, these healing wardens guard the secrets of nature and support their allies in combat. Capable of transferring their own health, as well as wielding Staves, Spears, and Axes.',
            'Support/Healer',
            3, // Medium difficulty
            ['Staff', 'Spear', 'Axe'],
            ['Light armor', 'No armor'],
            [
                'Healing Aura that affects allies within range',
                'Replenish ability to transfer health to allies',
                'Dodge bonus when not using heavy armor or shields',
                'Pets and minions gain tactics bonus when equipped with a staff'
            ],
            [{ skillId: 'tactics', level: 3 }],
            'assets/skills/druid.png'
        );
    }
    
    getEffectsDescription(): string {
        switch (this.level) {
            case 0:
                return 'Not learned yet.';
            case 1:
                return 'Can use Staff without requiring Oiyoi Martial Art\n+30 Healing Aura Range\nReplenish Ability\nCosts 5 Berries to use\nDruid transfers HP to Target at a rate of 0.7 to 1 (Target gets 0.7 HP for every 1 HP the druid loses)\nRate is 0.3 to 1 on Shaded Targets\nForces Druid Aggressive and must be done in Melee Range of Target\nCan not lower Druid\'s HP below 1';
            case 2:
                return 'Tactics Maximum Bonus increased to +4\nHealing Aura heals Shaded Targets at 50% effectiveness\nPets only rest for 6 hours.';
            case 3:
                return '15% Dodge when not using Heavy Armor or Shields\nReplenish transfers 1HP per 1HP\nEquipping a Staff gives Pets and Minions 50% of your Tactics Bonus';
            case 4:
                return 'Tactics Bonus Maximum increased to +5\nHealing Aura heals Shaded Targets at 100% effectiveness';
            case 5:
                return 'Tactics Bonus Maximum increased to +6\nReplenish transfers at a rate of 1.3 to 1\n30% Dodge when not wearing Heavy Armors or Shields\nEquipping a Staff gives Pets and Minions 100% of your Tactics Bonus';
            default:
                return 'Unknown level';
        }
    }
    
    applyEffects(player: any): void {
        // Implementation would depend on the player system
        if (this.level >= 1) {
            // Can use Staff without requiring Oiyoi Martial Art
            // +30 Healing Aura Range
            // Replenish Ability with 0.7:1 transfer rate
        }
        
        if (this.level >= 2) {
            // Tactics Maximum Bonus increased to +4
            // Healing Aura heals Shaded Targets at 50% effectiveness
            // Pets only rest for 6 hours
        }
        
        if (this.level >= 3) {
            // 15% Dodge when not using Heavy Armor or Shields
            // Replenish transfers 1HP per 1HP
            // Equipping a Staff gives Pets and Minions 50% of your Tactics Bonus
        }
        
        if (this.level >= 4) {
            // Tactics Bonus Maximum increased to +5
            // Healing Aura heals Shaded Targets at 100% effectiveness
        }
        
        if (this.level >= 5) {
            // Tactics Bonus Maximum increased to +6
            // Replenish transfers at a rate of 1.3 to 1
            // 30% Dodge when not wearing Heavy Armors or Shields
            // Equipping a Staff gives Pets and Minions 100% of your Tactics Bonus
        }
    }
}

/**
 * Ninja specialization skill implementation.
 * With incredible Speed, Ninjas dance around their enemies slashing and throwing Shurikens.
 */
export class NinjaSkill extends SpecializationSkill {
    constructor() {
        super(
            'ninja_training',
            'Ninja Training',
            'Ninja',
            'A tracker in the shadows, capable of attacking at lightning fast speeds from range or up close. If you\'ve always wanted to sulk around in the shadows and deliver swift death to your enemies from afar or up close while simultaneously dodging their blows, become a Ninja.',
            'Speed/Evasion DPS',
            4, // Medium-High difficulty
            ['Shurikens'],
            ['Oiyoi gear'],
            [
                'Significantly increased movement speed',
                'High dodge chance (up to 40% with skills combined)',
                'Can use ranged weapons in close combat',
                'Excels at mobility and avoiding damage'
            ],
            [{ skillId: 'oiyoi_martial_art', level: 3 }],
            'assets/skills/ninja.png'
        );
    }
    
    getEffectsDescription(): string {
        switch (this.level) {
            case 0:
                return 'Not learned yet.';
            case 1:
                return '+1 attack bonus with Shurikens\nCan use Shurikens at close range';
            case 2:
                return '+10 base speed bonus (land)\n+3% chance to Dodge when using Oiyoi';
            case 3:
                return '+2 attack bonus with Shurikens';
            case 4:
                return '+20 speed bonus (land)\n+6% chance to dodge when using Oiyoi';
            case 5:
                return '+3 attack bonus with Shuriken\n+30 base speed (land)\n+10% chance to dodge when using Oiyoi';
            default:
                return 'Unknown level';
        }
    }
    
    applyEffects(player: any): void {
        // Implementation would depend on the player system
        if (this.level >= 1) {
            // +1 attack bonus with Shurikens
            // Can use Shurikens at close range
        }
        
        if (this.level >= 2) {
            // +10 base speed bonus (land)
            // +3% chance to Dodge when using Oiyoi
        }
        
        if (this.level >= 3) {
            // +2 attack bonus with Shurikens
        }
        
        if (this.level >= 4) {
            // +20 speed bonus (land)
            // +6% chance to dodge when using Oiyoi
        }
        
        if (this.level >= 5) {
            // +3 attack bonus with Shuriken
            // +30 base speed (land)
            // +10% chance to dodge when using Oiyoi
        }
    }
}

/**
 * Ranger specialization skill implementation.
 * Excellent archers and swordsmen, Rangers use their Speed and increased Range to keep their opponents at bay.
 */
export class RangerSkill extends SpecializationSkill {
    constructor() {
        super(
            'ranger_training',
            'Ranger Training',
            'Ranger',
            'Rangers are unmatched in their ability to strike from a distance while maintaining mobility. These wilderness experts use their superior range and speed to control combat situations, keeping enemies at bay with their longbows while remaining effective in close quarters with swords when necessary.',
            'Range/Mobility',
            3, // Medium difficulty
            ['Longbow', 'Sword'],
            ['Leather Armor'],
            [
                'Significantly extended range with longbows',
                'Increased movement speed',
                'Proficiency with both longbows and swords',
                'Special defense against melee attacks while wearing leather armor'
            ],
            [{ skillId: 'archery', level: 3 }],
            'assets/skills/ranger.png'
        );
    }
    
    getEffectsDescription(): string {
        switch (this.level) {
            case 0:
                return 'Not learned yet.';
            case 1:
                return '+1 with Longbows and Swords';
            case 2:
                return '+5 Base Speed bonus\n+25 Range bonus with Longbows';
            case 3:
                return '+2 with Longbows and Swords';
            case 4:
                return '+50 Range bonus with Longbows\n+1 Defense versus melee attacks with Leather Armor (Does not apply while wearing a shield).';
            case 5:
                return '+3 with Longbows and Swords\n+10 Base Speed bonus\n+2 Defense versus melee attacks with Leather Armor (Does not apply while wearing a shield).';
            default:
                return 'Unknown level';
        }
    }
    
    applyEffects(player: any): void {
        // Implementation would depend on the player system
        if (this.level >= 1) {
            // +1 with Longbows and Swords
        }
        
        if (this.level >= 2) {
            // +5 Base Speed bonus
            // +25 Range bonus with Longbows
        }
        
        if (this.level >= 3) {
            // +2 with Longbows and Swords
        }
        
        if (this.level >= 4) {
            // +50 Range bonus with Longbows
            // +1 Defense versus melee attacks with Leather Armor
        }
        
        if (this.level >= 5) {
            // +3 with Longbows and Swords
            // +10 Base Speed bonus
            // +2 Defense versus melee attacks with Leather Armor
        }
    }
}

/**
 * Creates all specialization skills.
 * @returns Array of all specialization skills
 */
export function createSpecializationSkills(): SpecializationSkill[] {
    return [
        new WarriorSkill(),
        new DruidSkill(),
        new NinjaSkill(),
        new RangerSkill()
        // Add more specializations as needed
    ];
} 