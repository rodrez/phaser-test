import { Skill } from './Skill';
import { SpecializationSkill } from './SpecializationSkill';
import { WarriorSkill, RangerSkill, NinjaSkill } from './SpecializationSkills';
import { SKILL_DATA } from './SkillData';

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
    
    // Add skills from SKILL_DATA if available
    if (SKILL_DATA && SKILL_DATA.length > 0) {
        skills.push(...SKILL_DATA);
    }
    
    return skills;
} 