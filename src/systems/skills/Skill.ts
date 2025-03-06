/**
 * Represents a skill in the game.
 * All specific skills will extend this base class.
 */
export abstract class Skill {
    /** Unique identifier for the skill */
    readonly id: string;
    
    /** Display name of the skill */
    readonly name: string;
    
    /** Detailed description of the skill */
    readonly description: string;
    
    /** Current level of the skill (0 = not learned, max is typically 3) */
    protected _level: number = 0;
    
    /** Maximum level this skill can reach */
    readonly maxLevel: number;
    
    /** Skill point cost for each level */
    readonly levelCosts: number[];
    
    /** Prerequisites for learning this skill */
    readonly prerequisites: SkillPrerequisite[] = [];
    
    /** Icon for the skill in the UI */
    readonly iconUrl?: string;
    
    /** Whether this skill is a specialization (class) skill */
    readonly isSpecialization: boolean = false;
    
    /**
     * Creates a new skill.
     * 
     * @param id Unique identifier for the skill
     * @param name Display name of the skill
     * @param description Detailed description of the skill
     * @param maxLevel Maximum level this skill can reach
     * @param levelCosts Skill point costs for each level 
     * @param prerequisites Prerequisites for learning this skill
     * @param iconUrl URL for the skill icon
     * @param isSpecialization Whether this skill is a specialization (class) skill
     */
    constructor(
        id: string,
        name: string,
        description: string,
        maxLevel: number = 3,
        levelCosts: number[] = [1, 1, 1],
        prerequisites: SkillPrerequisite[] = [],
        iconUrl?: string,
        isSpecialization: boolean = false
    ) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.maxLevel = maxLevel;
        this.levelCosts = levelCosts;
        this.prerequisites = prerequisites;
        this.iconUrl = iconUrl;
        this.isSpecialization = isSpecialization;
    }
    
    /**
     * Gets the current level of the skill.
     * @returns The current level (0 = not learned)
     */
    get level(): number {
        return this._level;
    }
    
    /**
     * Sets the current level of the skill.
     * @param value The new level
     */
    set level(value: number) {
        // Ensure level is within valid range
        this._level = Math.max(0, Math.min(value, this.maxLevel));
    }
    
    /**
     * Checks if the skill can be upgraded to the next level.
     * @param availableSkillPoints Available skill points
     * @param playerSkills All learned skills
     * @returns Whether the skill can be upgraded
     */
    canUpgrade(availableSkillPoints: number, playerSkills: Map<string, Skill>): boolean {
        // Can't upgrade if already at max level
        if (this._level >= this.maxLevel) {
            return false;
        }
        
        // Check if we have enough skill points
        const nextLevelCost = this.levelCosts[this._level];
        if (availableSkillPoints < nextLevelCost) {
            return false;
        }
        
        // If this is the first level, check prerequisites
        if (this._level === 0 && !this.meetsPrerequisites(playerSkills)) {
            return false;
        }
        
        return true;
    }
    
    /**
     * Checks if all prerequisites for this skill are met.
     * @param playerSkills All learned skills
     * @returns Whether all prerequisites are met
     */
    meetsPrerequisites(playerSkills: Map<string, Skill>): boolean {
        return this.prerequisites.every(prereq => {
            const skill = playerSkills.get(prereq.skillId);
            return skill && skill.level >= prereq.level;
        });
    }
    
    /**
     * Levels up the skill if possible.
     * @param availableSkillPoints Available skill points
     * @param playerSkills All learned skills
     * @returns The number of skill points consumed (-1 if upgrade failed)
     */
    upgrade(availableSkillPoints: number, playerSkills: Map<string, Skill>): number {
        if (!this.canUpgrade(availableSkillPoints, playerSkills)) {
            return -1;
        }
        
        const cost = this.levelCosts[this._level];
        this._level++;
        return cost;
    }
    
    /**
     * Gets the effects/bonuses for the current level of this skill.
     * Should be implemented by each specific skill.
     * @returns Description of the effects at the current level
     */
    abstract getEffectsDescription(): string;
    
    /**
     * Applies the effects of this skill to the player.
     * Should be implemented by each specific skill.
     * @param player The player to apply effects to
     */
    abstract applyEffects(player: any): void;
}

/**
 * Represents a prerequisite for learning a skill.
 */
export interface SkillPrerequisite {
    /** The ID of the required skill */
    skillId: string;
    
    /** The minimum level required */
    level: number;
}

/**
 * Represents a skill tier (difficulty/progression level).
 */
export enum SkillTier {
    CORE = 1,       // Basic skills (1st tier)
    INTERMEDIATE = 2, // 2nd tier skills
    ADVANCED = 3,   // 3rd tier skills
    EXPERT = 4      // 4th tier skills
}

/**
 * Categories of skills.
 */
export enum SkillCategory {
    COMBAT = 'Combat',
    CRAFTING = 'Crafting',
    KNOWLEDGE = 'Knowledge',
    EXPLORATION = 'Exploration',
    SPECIALIZATION = 'Specialization',
    OTHER = 'Other'
} 