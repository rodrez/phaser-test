import { Scene } from 'phaser';
import { MedievalSkillTree } from './MedievalSkillTree';

// Define skill categories based on the documentation
enum SkillCategory {
    Combat = 'Combat',
    Crafting = 'Crafting',
    Knowledge = 'Knowledge',
    ClassSpecific = 'Class-Specific',
    Other = 'Other'
}

// Define types for skill data
interface SkillLevel {
    level: number;
    cost: number;
    effects: string[];
    unlocks?: string[];
}

interface Skill {
    id: string;
    name: string;
    description: string;
    levels: SkillLevel[];
    prerequisites?: string[];
    tier: number;
    category: SkillCategory;
    specialization?: string;
}

/**
 * Example scene that demonstrates the MedievalSkillTree component
 */
export class MedievalSkillTreeExample extends Scene {
    private skillTree: MedievalSkillTree;
    private toggleButton: HTMLButtonElement;
    
    constructor() {
        super({ key: 'MedievalSkillTreeExample' });
    }
    
    create(): void {
        // Create a background
        this.add.rectangle(0, 0, this.cameras.main.width, this.cameras.main.height, 0x3c2815)
            .setOrigin(0, 0);
            
        // Add some text
        this.add.text(
            this.cameras.main.centerX, 
            100, 
            'Medieval Skill Tree Example', 
            { 
                fontFamily: 'serif', 
                fontSize: '32px',
                color: '#f0c070'
            }
        ).setOrigin(0.5);
        
        // Create the skill tree
        this.skillTree = new MedievalSkillTree(this);
        
        // Load sample skill data
        this.skillTree.loadSkills(this.getSampleSkills());
        
        // Set sample player skills
        this.skillTree.setPlayerSkills({
            skillPoints: 5,
            unlockedSkills: new Map([
                ['archery', 2],
                ['cleave', 1]
            ]),
            specialization: null
        });
        
        // Create a button to toggle the skill tree
        this.createToggleButton();
    }
    
    /**
     * Creates a button to toggle the skill tree visibility
     */
    private createToggleButton(): void {
        this.toggleButton = document.createElement('button');
        this.toggleButton.textContent = 'Show Skill Tree';
        this.toggleButton.className = 'toggle-skill-tree-button';
        this.toggleButton.style.position = 'absolute';
        this.toggleButton.style.top = '200px';
        this.toggleButton.style.left = '50%';
        this.toggleButton.style.transform = 'translateX(-50%)';
        this.toggleButton.style.padding = '10px 20px';
        this.toggleButton.style.background = '#8b5a2b';
        this.toggleButton.style.color = '#fff';
        this.toggleButton.style.border = 'none';
        this.toggleButton.style.borderRadius = '4px';
        this.toggleButton.style.fontFamily = 'Cinzel, serif';
        this.toggleButton.style.fontSize = '16px';
        this.toggleButton.style.cursor = 'pointer';
        
        this.toggleButton.addEventListener('click', () => {
            this.skillTree.toggle();
            this.toggleButton.textContent = 
                this.toggleButton.textContent === 'Show Skill Tree' 
                    ? 'Hide Skill Tree' 
                    : 'Show Skill Tree';
        });
        
        document.body.appendChild(this.toggleButton);
    }
    
    /**
     * Returns sample skill data for demonstration
     */
    private getSampleSkills(): Skill[] {
        return [
            {
                id: 'archery',
                name: 'Archery',
                description: 'Archery is a great skill for anybody that wants to use ranged weapons. Without archery, you cannot use Crossbows, Longbows, or Slings.',
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
                id: 'cleave',
                name: 'Cleave',
                description: 'Cleave is a great, all-around skill, especially for melee fighters. It improves your melee attack, giving it a chance to hit more enemies than before.',
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
                id: 'tactics',
                name: 'Tactics',
                description: 'Plan your assaults outside of battle to fight more efficiently.',
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
            {
                id: 'oiyoi',
                name: 'Oiyoi Martial Art',
                description: 'Train your body to Dodging attacks with Unarmed combat.',
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
                id: 'blacksmithing',
                name: 'Blacksmithing',
                description: 'Provides skill in crafting Metal Items and reducing Gear durability loss.',
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
                id: 'warrior-training',
                name: 'Warrior Training',
                description: 'Warriors are brutes that deal more powerful blows with Axes as their improved Health lowers.',
                tier: 3,
                category: SkillCategory.ClassSpecific,
                specialization: 'Warrior',
                prerequisites: ['cleave:3'],
                levels: [
                    {
                        level: 1,
                        cost: 1,
                        effects: [
                            '+10 Max HP',
                            '+1 attack bonus with Axe'
                        ]
                    },
                    {
                        level: 2,
                        cost: 1,
                        effects: [
                            '+20 Max HP',
                            '+1 melee attack bonus when HP < 50%'
                        ]
                    },
                    {
                        level: 3,
                        cost: 1,
                        effects: [
                            '+30 Max HP',
                            '+2 attack bonus with Axe'
                        ]
                    },
                    {
                        level: 4,
                        cost: 1,
                        effects: [
                            '+40 Max HP',
                            'Additional +2 attack bonus with Axe when HP < 35%'
                        ]
                    },
                    {
                        level: 5,
                        cost: 1,
                        effects: [
                            '+50 Max HP',
                            '+3 attack bonus with axe',
                            '+3 melee attack bonus when HP < 25%'
                        ]
                    }
                ]
            },
            {
                id: 'druid-training',
                name: 'Druid Training',
                description: 'The Druids are true heralds of nature with powerful healing abilities.',
                tier: 3,
                category: SkillCategory.ClassSpecific,
                specialization: 'Druid',
                prerequisites: ['tactics:3'],
                levels: [
                    {
                        level: 1,
                        cost: 1,
                        effects: [
                            'Can use Staff without requiring Oiyoi Martial Art',
                            '+30 Healing Aura Range',
                            'Replenish Ability',
                            'Costs 5 Berries to use'
                        ]
                    },
                    {
                        level: 2,
                        cost: 1,
                        effects: [
                            'Tactics Maximum Bonus increased to +4',
                            'Healing Aura heals Shaded Targets at 50% effectiveness',
                            'Pets only rest for 6 hours'
                        ]
                    },
                    {
                        level: 3,
                        cost: 1,
                        effects: [
                            '15% Dodge when not using Heavy Armor or Shields',
                            'Replenish transfers 1HP per 1HP',
                            'Equipping a Staff gives Pets and Minions 50% of your Tactics Bonus'
                        ]
                    },
                    {
                        level: 4,
                        cost: 1,
                        effects: [
                            'Tactics Bonus Maximum increased to +5',
                            'Healing Aura heals Shaded Targets at 100% effectiveness'
                        ]
                    },
                    {
                        level: 5,
                        cost: 1,
                        effects: [
                            'Tactics Bonus Maximum increased to +6',
                            'Replenish transfers at a rate of 1.3 to 1',
                            '30% Dodge when not wearing Heavy Armors or Shields',
                            'Equipping a Staff gives Pets and Minions 100% of your Tactics Bonus'
                        ]
                    }
                ]
            }
        ];
    }
    
    shutdown(): void {
        // Clean up
        this.toggleButton?.parentNode?.removeChild(this.toggleButton);
        
        this.skillTree.destroy();
    }
} 