import { SkillCategory } from './SkillTypes';
import type { Skill } from './SkillTypes';

/**
 * Complete skill tree data based on the game's skill system
 */
export const SKILL_DATA: Skill[] = [
    // Tier 1 Skills
    {
        id: 'archery',
        name: 'Archery',
        description: 'A valuable skill for users of ranged weapons. Without Archery, you can\'t wield Crossbows, Longbows, or Slings. This skill also enhances your accuracy and effectiveness with these weapons.',
        tier: 1,
        category: SkillCategory.Combat,
        levels: [
            {
                level: 1,
                cost: 1,
                effects: [
                    '+1 with Crossbows and Longbows',
                    'Enables you to craft Longbows and Crossbows'
                ]
            },
            {
                level: 2,
                cost: 1,
                effects: [
                    '+2 with Longbows and Crossbows',
                    '+25 Range with Longbows and Crossbows'
                ]
            },
            {
                level: 3,
                cost: 1,
                effects: [
                    '+3 with Longbows and Crossbows',
                    '+50 Range with Longbows and Crossbows'
                ],
                unlocks: ['Militia Training', 'Ranger Training', 'Mercenary Training']
            }
        ]
    },
    {
        id: 'sunder',
        name: 'Sunder',
        description: 'An essential melee skill that lets your weapon strike through multiple enemies in one powerful swing. Effective when using Swords, Axes, Daggers, Brass Knuckles, Spears, or Staves, but unusable with ranged weapons.',
        tier: 1,
        category: SkillCategory.Combat,
        levels: [
            {
                level: 1,
                cost: 1,
                effects: [
                    '5% chance of dealing 50% of normal attack damage to 3 nearby targets (does not include original target) when using Melee Weapons'
                ]
            },
            {
                level: 2,
                cost: 1,
                effects: [
                    '10% chance of dealing 50% of normal attack damage to 4 nearby targets when using Melee Weapons'
                ]
            },
            {
                level: 3,
                cost: 2,
                effects: [
                    '15% chance of dealing 50% of normal attack damage to 5 nearby targets when using Melee Weapons'
                ],
                unlocks: ['Knight Training', 'Legion Training', 'Warrior Training']
            }
        ]
    },
    {
        id: 'martial-arts',
        name: 'Martial Arts',
        description: 'Train your body to swiftly dodge incoming attacks, improving your defense during unarmed combat.',
        tier: 1,
        category: SkillCategory.Combat,
        levels: [
            {
                level: 1,
                cost: 1,
                effects: [
                    'When you have no weapon or armor equipped, your attack and defense strengths will be determined by the level of your character (up to level 25)',
                    '+1 with Blowdarts and Shurikens',
                    'Can use Oiyoi weapons and armor'
                ]
            },
            {
                level: 2,
                cost: 1,
                effects: [
                    '15% Dodge Chance when unarmed or when using Oiyoi Gear',
                    '+2 With Blow Darts and Shurikens'
                ]
            },
            {
                level: 3,
                cost: 1,
                effects: [
                    '30% Dodge Chance when unarmed or when using Oiyoi Gear',
                    'Can craft Oiyoi Gear',
                    '+3 With Blow Darts and Shurikens'
                ],
                unlocks: ['Assassin Training', 'Ninja Training', 'Oiyoi Master Training', 'Thief Training']
            }
        ]
    },
    {
        id: 'strategist',
        name: 'Strategist',
        description: 'Carefully plan your moves before combat, increasing your effectiveness and efficiency in battle.',
        tier: 1,
        category: SkillCategory.Combat,
        levels: [
            {
                level: 1,
                cost: 1,
                effects: [
                    'Gain a +0.1 Damage bonus (Tactics) against Monsters for every Chopped Tree or 30 seconds spent Unaggressive',
                    'For every 10 seconds you are Aggressive, you lose +0.1 of the bonus',
                    '(Max of +1)'
                ]
            },
            {
                level: 2,
                cost: 1,
                effects: [
                    'Tactics bonus gains +0.2 each time. You still lose +0.1 while Aggressive',
                    '(Max of +2)'
                ]
            },
            {
                level: 3,
                cost: 1,
                effects: [
                    'Tactics bonus gains +0.3 each time. You still lose +0.1 while Aggressive',
                    '(Max of +3)'
                ],
                unlocks: ['Merchant Training', 'Crafter Training', 'Druid Training', 'Explorer Training']
            }
        ]
    },
    
    // Tier 2 Skills
    {
        id: 'foraging',
        name: 'Foraging',
        description: 'Increase your chances of finding extra resources and items when defeating monsters.',
        tier: 2,
        category: SkillCategory.Crafting,
        levels: [
            {
                level: 1,
                cost: 1,
                effects: [
                    '5% chance of finding 1 Wood or Great Fern Sap whenever a Monster you kill drops an Item'
                ]
            },
            {
                level: 2,
                cost: 1,
                effects: [
                    '10% chance of finding additional items whenever a Monster you kill drops something',
                    'Now also find Leather and Iron Ore'
                ]
            },
            {
                level: 3,
                cost: 1,
                effects: [
                    '15% chance of finding additional items whenever a Monster you kill drops something',
                    'Now also find Sulfur and Stone'
                ]
            }
        ]
    },
    {
        id: 'tracker',
        name: 'Tracker',
        description: 'Identify a monster\'s vulnerabilities to deliver devastating attacks and increased damage.',
        tier: 2,
        category: SkillCategory.Combat,
        levels: [
            {
                level: 1,
                cost: 1,
                effects: [
                    '3% chance of applying Exposed Weakness, a 1.5x a debuff to a Monster that lasts until the Monster is dead',
                    'Doesn\'t work for Bosses or Player-owned Creatures'
                ]
            },
            {
                level: 2,
                cost: 1,
                effects: [
                    '6% change of applying a 1.5x Damage debuff to a Monster that lasts until the Monster is dead'
                ]
            },
            {
                level: 3,
                cost: 1,
                effects: [
                    '9% change of applying a 2x Damage debuff to a Monster that lasts until the Monster is dead'
                ]
            }
        ]
    },
    {
        id: 'blacksmithing',
        name: 'Blacksmithing',
        description: 'Enhance your ability to craft metal items and reduce the durability loss of your gear.',
        tier: 2,
        category: SkillCategory.Crafting,
        levels: [
            {
                level: 1,
                cost: 1,
                effects: [
                    'Can Repair Gear at a rate of 150 Gold per 10%, up to 100%',
                    'Gear you are wielding lasts 1.5x longer'
                ]
            },
            {
                level: 2,
                cost: 1,
                effects: [
                    'Can Repair Gear at a rate of 125 Gold per 10%, up to 100%',
                    'Gear you are wielding lasts 2x longer'
                ]
            },
            {
                level: 3,
                cost: 1,
                effects: [
                    'Can Repair Gear at a rate of 100 Gold per 10%, up to 100%',
                    'Gear you are wielding lasts 3x longer',
                    'Can craft Traps',
                    'Killing an enemy in your Trap returns the trap to your inventory'
                ]
            }
        ]
    },
    {
        id: 'alchemy',
        name: 'Alchemy',
        description: 'Learn to craft and use magical Potions and Bombs.',
        tier: 2,
        category: SkillCategory.Crafting,
        levels: [
            {
                level: 1,
                cost: 1,
                effects: [
                    'Can craft Inspiration Tonic and Halvar\'s Resin',
                    'Halvar\'s Resin you use is 50% more effective'
                ]
            },
            {
                level: 2,
                cost: 1,
                effects: [
                    'Can craft Anti-poison and Keldor\'s Rage',
                    'Alchemy potions you use last 50% longer'
                ]
            },
            {
                level: 3,
                cost: 1,
                effects: [
                    'Can craft Fire Bombs and Rolly\'s Serum',
                    'Fire Bombs you use do 25% more damage',
                    'Fire Bombs on Monsters applies the Exposed Weakness damage debuff'
                ]
            }
        ]
    },
    
    // Tier 3 Skills
    {
        id: 'troglodyte-philosophy',
        name: 'Troglodyte Philosophy',
        description: 'Gain the ability to craft practical items and gear from leather materials.',
        tier: 3,
        category: SkillCategory.Knowledge,
        levels: [
            {
                level: 1,
                cost: 1,
                effects: [
                    'Can craft Slings, Boots, and Backpacks',
                    'Leatherworking Boots and Gloves wear 25% slower',
                    '+1 defense against Monsters that drop Leather'
                ]
            },
            {
                level: 2,
                cost: 1,
                effects: [
                    'Can craft Gloves and Nets',
                    'Leatherworking Boots and Gloves wear 50% slower',
                    '+1 Attack against Monsters that drop Leather'
                ]
            },
            {
                level: 3,
                cost: 1,
                effects: [
                    'Can craft Roc Boots, Midas Gloves, and Leather Armor',
                    '20% change of getting double Leather when a Monster drops Leather',
                    '75% Chance of reclaiming a Net that was thrown'
                ]
            }
        ]
    },
    {
        id: 'leatherworking',
        name: 'Leatherworking',
        description: 'Master the art of crafting with leather to create durable and effective gear.',
        tier: 3,
        category: SkillCategory.Crafting,
        levels: [
            {
                level: 1,
                cost: 1,
                effects: [
                    'Can craft basic leather items',
                    'Leather items you craft have 10% more durability'
                ]
            },
            {
                level: 2,
                cost: 1,
                effects: [
                    'Can craft advanced leather armor',
                    'Leather items you craft have 25% more durability'
                ]
            },
            {
                level: 3,
                cost: 1,
                effects: [
                    'Can craft masterwork leather items',
                    'Leather items you craft have 50% more durability',
                    '15% chance to use less leather when crafting'
                ]
            }
        ]
    },
    
    // Tier 4 Skills - Expertise Level 1
    {
        id: 'expertise-combat-1',
        name: 'Combat Expertise',
        description: 'Choose the path of combat expertise to gain specialized combat abilities and bonuses.',
        tier: 4,
        category: SkillCategory.ClassSpecific,
        isExpertise: true,
        expertiseLevel: 1,
        expertisePath: 'Combat',
        levels: [
            {
                level: 1,
                cost: 2,
                effects: [
                    '+10% damage with all weapons',
                    'Unlock special combat techniques',
                    'Access to unique combat equipment'
                ]
            }
        ]
    },
    {
        id: 'expertise-crafting-1',
        name: 'Crafting Expertise',
        description: 'Choose the path of crafting expertise to gain specialized crafting abilities and bonuses.',
        tier: 4,
        category: SkillCategory.ClassSpecific,
        isExpertise: true,
        expertiseLevel: 1,
        expertisePath: 'Crafting',
        levels: [
            {
                level: 1,
                cost: 2,
                effects: [
                    '25% faster crafting speed',
                    'Craft items with 15% better quality',
                    'Access to unique crafting recipes'
                ]
            }
        ]
    },
    {
        id: 'expertise-knowledge-1',
        name: 'Knowledge Expertise',
        description: 'Choose the path of knowledge expertise to gain specialized knowledge abilities and bonuses.',
        tier: 4,
        category: SkillCategory.ClassSpecific,
        isExpertise: true,
        expertiseLevel: 1,
        expertisePath: 'Knowledge',
        levels: [
            {
                level: 1,
                cost: 2,
                effects: [
                    '20% more experience from all sources',
                    'Identify monster weaknesses more easily',
                    'Access to unique knowledge-based abilities'
                ]
            }
        ]
    },
    
    // Tier 5 Skills
    {
        id: 'lizardfolk-philosophy',
        name: 'Lizardfolk Philosophy',
        description: 'Learn the ancient knowledge of lizard people to gain unique abilities.',
        tier: 5,
        category: SkillCategory.Knowledge,
        levels: [
            {
                level: 1,
                cost: 2,
                effects: [
                    'Gain resistance to poison damage',
                    'Unlock special lizard-themed equipment'
                ]
            },
            {
                level: 2,
                cost: 2,
                effects: [
                    'Regenerate health slowly over time',
                    'Improved swimming speed'
                ]
            },
            {
                level: 3,
                cost: 2,
                effects: [
                    'Gain the ability to camouflage in natural environments',
                    'Resistance to extreme temperatures'
                ]
            }
        ]
    },
    {
        id: 'rebound',
        name: 'Rebound',
        description: 'Master the art of deflecting attacks back at your enemies.',
        tier: 5,
        category: SkillCategory.Combat,
        levels: [
            {
                level: 1,
                cost: 2,
                effects: [
                    '10% chance to reflect melee damage back to attacker',
                    'Reduced damage from reflected attacks'
                ]
            },
            {
                level: 2,
                cost: 2,
                effects: [
                    '20% chance to reflect melee damage back to attacker',
                    'Reflected damage increased by 25%'
                ]
            },
            {
                level: 3,
                cost: 2,
                effects: [
                    '30% chance to reflect melee damage back to attacker',
                    'Reflected damage increased by 50%',
                    '5% chance to stun attacker when reflecting damage'
                ]
            }
        ]
    },
    {
        id: 'barrage',
        name: 'Barrage',
        description: 'Unleash a rapid series of attacks with ranged weapons.',
        tier: 5,
        category: SkillCategory.Combat,
        levels: [
            {
                level: 1,
                cost: 2,
                effects: [
                    'Fire two arrows in quick succession with a 15% damage penalty',
                    'Reduced stamina cost for consecutive shots'
                ]
            },
            {
                level: 2,
                cost: 2,
                effects: [
                    'Fire three arrows in quick succession with a 10% damage penalty',
                    'Increased attack speed with ranged weapons'
                ]
            },
            {
                level: 3,
                cost: 2,
                effects: [
                    'Fire four arrows in quick succession with a 5% damage penalty',
                    'Chance to apply bleeding effect to targets hit by multiple arrows'
                ]
            }
        ]
    },
    
    // Tier 6 Skills - Expertise Level 2
    {
        id: 'expertise-combat-2',
        name: 'Combat Expertise II',
        description: 'Further specialize in combat expertise to gain more powerful combat abilities.',
        tier: 6,
        category: SkillCategory.ClassSpecific,
        isExpertise: true,
        expertiseLevel: 2,
        expertisePath: 'Combat',
        prerequisites: ['expertise-combat-1:1'],
        levels: [
            {
                level: 1,
                cost: 3,
                effects: [
                    '+20% damage with all weapons',
                    'Unlock advanced combat techniques',
                    'Access to rare combat equipment',
                    '10% chance to land critical hits'
                ]
            }
        ]
    },
    {
        id: 'expertise-crafting-2',
        name: 'Crafting Expertise II',
        description: 'Further specialize in crafting expertise to gain more powerful crafting abilities.',
        tier: 6,
        category: SkillCategory.ClassSpecific,
        isExpertise: true,
        expertiseLevel: 2,
        expertisePath: 'Crafting',
        prerequisites: ['expertise-crafting-1:1'],
        levels: [
            {
                level: 1,
                cost: 3,
                effects: [
                    '50% faster crafting speed',
                    'Craft items with 30% better quality',
                    'Access to rare crafting recipes',
                    '20% chance to use fewer materials when crafting'
                ]
            }
        ]
    },
    {
        id: 'expertise-knowledge-2',
        name: 'Knowledge Expertise II',
        description: 'Further specialize in knowledge expertise to gain more powerful knowledge abilities.',
        tier: 6,
        category: SkillCategory.ClassSpecific,
        isExpertise: true,
        expertiseLevel: 2,
        expertisePath: 'Knowledge',
        prerequisites: ['expertise-knowledge-1:1'],
        levels: [
            {
                level: 1,
                cost: 3,
                effects: [
                    '40% more experience from all sources',
                    'Automatically identify monster weaknesses',
                    'Access to rare knowledge-based abilities',
                    'Increased effectiveness of potions and scrolls'
                ]
            }
        ]
    },
    
    // Continue with the rest of the tiers...
    // Tier 7 Skills
    {
        id: 'guardian-insight',
        name: 'Guardian Insight',
        description: 'Gain the wisdom of ancient guardians to protect yourself and allies.',
        tier: 7,
        category: SkillCategory.Knowledge,
        levels: [
            {
                level: 1,
                cost: 2,
                effects: [
                    'Create a protective aura that reduces damage for nearby allies',
                    'Gain insight into enemy attack patterns'
                ]
            },
            {
                level: 2,
                cost: 2,
                effects: [
                    'Protective aura strength increased by 25%',
                    'Chance to predict and avoid enemy attacks'
                ]
            },
            {
                level: 3,
                cost: 2,
                effects: [
                    'Protective aura strength increased by 50%',
                    'Share a portion of your health regeneration with allies'
                ]
            }
        ]
    },
    
    // Add more skills for all tiers...
    
    // Tier 8 Skills - Expertise Level 3
    {
        id: 'expertise-combat-3',
        name: 'Combat Expertise III',
        description: 'Master combat expertise to unlock its full potential.',
        tier: 8,
        category: SkillCategory.ClassSpecific,
        isExpertise: true,
        expertiseLevel: 3,
        expertisePath: 'Combat',
        prerequisites: ['expertise-combat-2:1'],
        levels: [
            {
                level: 1,
                cost: 4,
                effects: [
                    '+30% damage with all weapons',
                    'Unlock master combat techniques',
                    'Access to legendary combat equipment',
                    '20% chance to land critical hits with 2x damage'
                ]
            }
        ]
    },
    
    // Tier 11 Skills - Expertise Level 4
    {
        id: 'expertise-combat-4',
        name: 'Combat Expertise IV',
        description: 'Achieve legendary status in combat expertise, unlocking godlike abilities.',
        tier: 11,
        category: SkillCategory.ClassSpecific,
        isExpertise: true,
        expertiseLevel: 4,
        expertisePath: 'Combat',
        prerequisites: ['expertise-combat-3:1'],
        levels: [
            {
                level: 1,
                cost: 5,
                effects: [
                    '+50% damage with all weapons',
                    'Unlock legendary combat techniques',
                    'Access to mythical combat equipment',
                    '30% chance to land critical hits with 3x damage',
                    'Chance to instantly defeat non-boss enemies'
                ]
            }
        ]
    },
    
    // Tier 15 Skills
    {
        id: 'valor',
        name: 'Valor',
        description: 'Channel your inner courage to perform heroic feats in battle.',
        tier: 15,
        category: SkillCategory.Combat,
        levels: [
            {
                level: 1,
                cost: 3,
                effects: [
                    'Gain temporary invulnerability when health drops below 20%',
                    'Increased damage when fighting multiple enemies'
                ]
            },
            {
                level: 2,
                cost: 3,
                effects: [
                    'Inspire nearby allies, granting them combat bonuses',
                    'Reduced damage from boss monsters'
                ]
            },
            {
                level: 3,
                cost: 3,
                effects: [
                    'Chance to perform critical strikes that ignore armor',
                    'Gain a second wind when defeated, returning with partial health'
                ]
            }
        ]
    },
    
    // Tier 16 Skills
    {
        id: 'unity',
        name: 'Unity',
        description: 'Forge unbreakable bonds with allies to achieve greater strength together.',
        tier: 16,
        category: SkillCategory.Other,
        levels: [
            {
                level: 1,
                cost: 4,
                effects: [
                    'Share a portion of your health regeneration with nearby allies',
                    'Gain damage bonus when fighting alongside allies'
                ]
            },
            {
                level: 2,
                cost: 4,
                effects: [
                    'Create a protective aura that reduces damage for all allies',
                    'Chance to intercept attacks targeted at low-health allies'
                ]
            },
            {
                level: 3,
                cost: 4,
                effects: [
                    'Coordinated attacks with allies deal bonus damage',
                    'When an ally falls, gain temporary strength and speed bonuses'
                ]
            }
        ]
    },
    {
        id: 'pierce-armor',
        name: 'Pierce Armor',
        description: 'Master techniques to bypass enemy armor and defenses.',
        tier: 16,
        category: SkillCategory.Combat,
        levels: [
            {
                level: 1,
                cost: 4,
                effects: [
                    'Attacks have a 15% chance to ignore 50% of enemy armor',
                    'Increased damage against heavily armored opponents'
                ]
            },
            {
                level: 2,
                cost: 4,
                effects: [
                    'Attacks have a 25% chance to ignore 75% of enemy armor',
                    'Special attacks that target weak points in armor'
                ]
            },
            {
                level: 3,
                cost: 4,
                effects: [
                    'Attacks have a 35% chance to completely ignore enemy armor',
                    'Permanently reduce the armor of enemies hit by your attacks'
                ]
            }
        ]
    },
    {
        id: 'blight-strike',
        name: 'Blight Strike',
        description: 'Infuse your attacks with corrupting energy that weakens and damages enemies over time.',
        tier: 16,
        category: SkillCategory.Combat,
        levels: [
            {
                level: 1,
                cost: 4,
                effects: [
                    'Attacks have a 20% chance to apply Blight, dealing damage over time',
                    'Blighted enemies have reduced healing'
                ]
            },
            {
                level: 2,
                cost: 4,
                effects: [
                    'Blight chance increased to 35%',
                    'Blight damage increased by 50%',
                    'Blighted enemies have reduced attack power'
                ]
            },
            {
                level: 3,
                cost: 4,
                effects: [
                    'Blight chance increased to 50%',
                    'Blight damage increased by 100%',
                    'Blight can spread to nearby enemies',
                    'Killing a Blighted enemy restores some of your health'
                ]
            }
        ]
    }
];

/**
 * Get a skill by its ID
 */
export function getSkillById(id: string): Skill | undefined {
    return SKILL_DATA.find(skill => skill.id === id);
}

/**
 * Get all skills for a specific tier
 */
export function getSkillsByTier(tier: number): Skill[] {
    return SKILL_DATA.filter(skill => skill.tier === tier);
}

/**
 * Get all expertise skills for a specific path
 */
export function getExpertiseSkillsByPath(path: string): Skill[] {
    return SKILL_DATA.filter(skill => skill.isExpertise && skill.expertisePath === path)
        .sort((a, b) => (a.expertiseLevel || 0) - (b.expertiseLevel || 0));
}

/**
 * Get all skills by category
 */
export function getSkillsByCategory(category: SkillCategory): Skill[] {
    return SKILL_DATA.filter(skill => skill.category === category);
}

/**
 * Get the highest tier available in the skill tree
 */
export function getHighestTier(): number {
    return Math.max(...SKILL_DATA.map(skill => skill.tier));
}

/**
 * Get all available expertise paths
 */
export function getExpertisePaths(): string[] {
    const paths = new Set<string>();
    
    for (const skill of SKILL_DATA) {
        if (skill.isExpertise && skill.expertisePath) {
            paths.add(skill.expertisePath);
        }
    }
    
    return Array.from(paths);
} 