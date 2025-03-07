/**
 * Skill categories in the game
 */
export enum SkillCategory {
    Combat = 'Combat',
    Crafting = 'Crafting',
    Knowledge = 'Knowledge',
    ClassSpecific = 'Class-Specific',
    Other = 'Other'
}

/**
 * Represents a skill level with its effects and costs
 */
export interface SkillLevel {
    level: number;
    cost: number;
    effects: string[];
    unlocks?: string[];
}

/**
 * Represents a skill in the skill tree
 */
export interface Skill {
    id: string;
    name: string;
    description: string;
    tier: number;
    category: SkillCategory;
    levels: SkillLevel[];
    prerequisites?: string[];
    isExpertise?: boolean;
    expertiseLevel?: number;
    expertisePath?: string;
}

/**
 * Represents the player's progress in a skill
 */
export interface PlayerSkill {
    skillId: string;
    currentLevel: number;
    maxLevel: number;
}

/**
 * Represents the player's expertise choice
 */
export interface PlayerExpertise {
    path: string | null;
    level: number;
} 