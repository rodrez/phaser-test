import { Skill } from './Skill';
import { SpecializationSkill } from './SpecializationSkill';
import { WarriorSkill, RangerSkill, NinjaSkill } from './SpecializationSkills';
import { SKILL_DATA } from './SkillData';
import { SkillCategory } from './SkillTypes';

/**
 * Concrete implementation of the Skill abstract class
 * Used to create skill instances from data
 */
class ConcreteSkill extends Skill {
    private tier: number;
    private category: SkillCategory;
    
    constructor(
        id: string,
        name: string,
        description: string,
        tier: number,
        category: SkillCategory,
        maxLevel: number = 3,
        levelCosts: number[] = [1, 1, 1],
        prerequisites: any[] = [],
        iconUrl: string = ''
    ) {
        super(id, name, description, maxLevel, levelCosts, prerequisites, iconUrl);
        this.tier = tier;
        this.category = category;
    }
    
    /**
     * Gets the skill's tier
     */
    getTier(): number {
        return this.tier;
    }
    
    /**
     * Gets the skill's category
     */
    getCategory(): SkillCategory {
        return this.category;
    }
    
    /**
     * Gets a description of the skill's effects at the current level
     * @returns Description of the skill's effects
     */
    getEffectsDescription(): string {
        return `${this.name} (Level ${this.level})`;
    }
    
    /**
     * Apply the skill's effects to the player
     * @param stats: any The player's stats object
     */
    applyEffects(stats: any): void {
        // Default implementation does nothing
        // Specific skills would override this
    }
}

/**
 * Creates a Skill instance from skill data
 * @param data The skill data from SKILL_DATA
 * @returns A new Skill instance
 */
export function createSkillFromData(data: any): Skill {
    // Create a concrete implementation of the Skill abstract class
    return new ConcreteSkill(
        data.id,
        data.name,
        data.description,
        data.tier ? data.tier : 1,
        data.category || SkillCategory.Other,
        data.levels ? data.levels.length : 3,
        data.levels ? data.levels.map((l: any) => l.cost || 1) : [1, 1, 1],
        [], // prerequisites
        data.iconUrl || ''
    );
}

/**
 * Creates all available skills in the game.
 * @returns Array of all available skills
 */
export function createAllSkills(): Skill[] {
    const skills: Skill[] = [];
    
    // Add specialization skills
    skills.push(new WarriorSkill());
    skills.push(new RangerSkill());
    skills.push(new NinjaSkill());
    
    // Convert and add skills from SKILL_DATA
    if (SKILL_DATA && SKILL_DATA.length > 0) {
        for (const skillData of SKILL_DATA) {
            skills.push(createSkillFromData(skillData));
        }
    }
    
    return skills;
} 