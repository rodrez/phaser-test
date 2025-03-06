// Export all skill system components
export * from './Skill';
export * from './SpecializationSkill';
export * from './SkillManager';
export * from './CoreSkills';
export * from './SpecializationSkills';

// Import creators and export them for easy access
import { createCoreSkills } from './CoreSkills';
import { createSpecializationSkills } from './SpecializationSkills';

/**
 * Creates all skills in the game.
 * @returns Array of all skills
 */
export function createAllSkills() {
    return [
        ...createCoreSkills(),
        ...createSpecializationSkills()
    ];
} 