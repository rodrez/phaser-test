import { Skill } from './Skill';
import { SpecializationSkill } from './SpecializationSkill';
import { Scene } from 'phaser';

/**
 * Manages the player's skills, including learning skills,
 * spending skill points, and tracking progress.
 */
export class SkillManager {
    /** Reference to the main game scene */
    readonly scene: Scene;
    
    /** Map of all skills that the player has learned */
    private learnedSkills: Map<string, Skill> = new Map();
    
    /** The player's chosen specialization, if any */
    private specialization: SpecializationSkill | null = null;
    
    /** Available skill points to spend */
    private availableSkillPoints: number = 0;
    
    /** All skills available in the game */
    private allSkills: Skill[] = [];
    
    /**
     * Creates a new SkillManager
     * @param scene The main game scene
     */
    constructor(scene: Scene) {
        this.scene = scene;
    }
    
    /**
     * Sets up the skill system by initializing available skills.
     * @param skillPoints Initial skill points to allocate
     * @param allSkills All available skills in the game
     */
    initialize(skillPoints: number, allSkills: Skill[]): void {
        this.availableSkillPoints = skillPoints;
        this.allSkills = allSkills;
    }
    
    /**
     * Gets all skills available in the game.
     * @returns All available skills
     */
    getAllSkills(): Skill[] {
        return this.allSkills;
    }
    
    /**
     * Gets a skill by its ID.
     * @param id The skill ID to find
     * @returns The skill, or null if not found
     */
    getSkill(id: string): Skill | null {
        // First check learned skills
        if (this.learnedSkills.has(id)) {
            return this.learnedSkills.get(id)!;
        }
        
        // Then check all available skills
        return this.allSkills.find(s => s.id === id) || null;
    }
    
    /**
     * Gets all skills that the player has learned.
     * @returns Array of learned skills
     */
    getLearnedSkills(): Skill[] {
        return Array.from(this.learnedSkills.values());
    }
    
    /**
     * Gets all skills the player has learned as a map.
     * @returns Map of learned skills with skill ID as key
     */
    getLearnedSkillsMap(): Map<string, Skill> {
        return new Map(this.learnedSkills);
    }
    
    /**
     * Gets the player's specialization.
     * @returns The specialization, or null if none chosen
     */
    getSpecialization(): SpecializationSkill | null {
        return this.specialization;
    }
    
    /**
     * Gets the available skill points.
     * @returns Available skill points
     */
    getAvailableSkillPoints(): number {
        return this.availableSkillPoints;
    }
    
    /**
     * Adds skill points to the player.
     * @param points Points to add
     * @returns Actual points added (capped if exceeds max)
     */
    addSkillPoints(points: number): number {
        const pointsAdded = Math.max(0, points);
        this.availableSkillPoints += pointsAdded;
        
        // Notify listeners
        this.triggerEvent('skill-points-changed', this.availableSkillPoints);
        
        return pointsAdded;
    }
    
    /**
     * Tries to learn or upgrade a skill.
     * @param skillId The skill ID to learn or upgrade
     * @returns Whether the skill was learned/upgraded successfully
     */
    learnOrUpgradeSkill(skillId: string): boolean {
        // Check if we already have this skill
        if (this.learnedSkills.has(skillId)) {
            const learnedSkill = this.learnedSkills.get(skillId)!;
            
            // Check if we can upgrade
            if (learnedSkill.level >= learnedSkill.maxLevel) {
                return false; // Already at max level
            }
            
            // Check if we have enough skill points
            const cost = learnedSkill.levelCosts[learnedSkill.level];
            if (this.availableSkillPoints < cost) {
                return false; // Not enough skill points
            }
            
            // Check prerequisites
            if (!learnedSkill.meetsPrerequisites(this.learnedSkills)) {
                return false; // Prerequisites not met
            }
            
            // Upgrade the skill
            learnedSkill.level++;
            
            this.availableSkillPoints -= cost;
            this.triggerEvent('skill-upgraded', learnedSkill);
            this.triggerEvent('skill-points-changed', this.availableSkillPoints);
            return true;
        } else {
            // Try to learn a new skill
            const skill = this.allSkills.find(s => s.id === skillId);
            if (!skill) {
                return false; // Skill doesn't exist
            }
            
            // Check if we have enough skill points
            const cost = skill.levelCosts[0];
            if (this.availableSkillPoints < cost) {
                return false; // Not enough skill points
            }
            
            // Check prerequisites
            if (!skill.meetsPrerequisites(this.learnedSkills)) {
                return false; // Prerequisites not met
            }
            
            // Learn the skill
            skill.level = 1;
            this.learnedSkills.set(skill.id, skill);
            this.availableSkillPoints -= cost;
            
            this.triggerEvent('skill-learned', skill);
            this.triggerEvent('skill-points-changed', this.availableSkillPoints);
            return true;
        }
    }
    
    /**
     * Tries to learn or upgrade a specialization skill.
     * @param specializationId The specialization skill ID to learn
     * @returns Whether the specialization was learned successfully
     */
    learnOrUpgradeSpecialization(specializationId: string): boolean {
        const skill = this.allSkills.find(s => s.id === specializationId && s.isSpecialization);
        if (!skill) {
            return false; // Skill doesn't exist or is not a specialization
        }
        
        // Cast to specialization skill
        const specializationSkill = skill as SpecializationSkill;
        
        // If we already have a specialization, check if it's the same one
        if (this.specialization) {
            if (this.specialization.id !== specializationId) {
                return false; // Can't learn a different specialization
            }
            
            // Check if we can upgrade
            if (this.specialization.level >= this.specialization.maxLevel) {
                return false; // Already at max level
            }
            
            // Check if we have enough skill points
            const cost = this.specialization.levelCosts[this.specialization.level];
            if (this.availableSkillPoints < cost) {
                return false; // Not enough skill points
            }
            
            // Upgrade the specialization
            this.specialization.level++;
                
            this.availableSkillPoints -= cost;
            this.triggerEvent('skill-upgraded', this.specialization);
            this.triggerEvent('skill-points-changed', this.availableSkillPoints);
            return true;
        } else {
            // Learn a new specialization
            const cost = specializationSkill.levelCosts[0];
            if (this.availableSkillPoints < cost) {
                return false; // Not enough skill points
            }
            
            // Set the specialization
            const newSpecialization = Object.assign({}, specializationSkill);
            newSpecialization.level = 1;
            this.specialization = newSpecialization;
            this.learnedSkills.set(newSpecialization.id, newSpecialization);
            
            this.availableSkillPoints -= cost;
            
            this.triggerEvent('skill-learned', newSpecialization);
            this.triggerEvent('specialization-changed', this.specialization);
            this.triggerEvent('skill-points-changed', this.availableSkillPoints);
            return true;
        }
    }
    
    /**
     * Resets all skills, refunding skill points.
     * @returns True if skills were reset
     */
    resetSkills(): boolean {
        // Calculate refund
        let refund = 0;
        this.learnedSkills.forEach(skill => {
            for (let i = 0; i < skill.level; i++) {
                refund += skill.levelCosts[i];
            }
        });
        
        // Reset skills
        this.learnedSkills.clear();
        this.specialization = null;
        this.availableSkillPoints += refund;
        
        // Notify listeners
        this.triggerEvent('skill-points-changed', this.availableSkillPoints);
        this.triggerEvent('specialization-changed', null);
        
        return true;
    }
    
    /**
     * Sets the player's specialization directly.
     * @param specialization The specialization to set
     */
    setSpecialization(specialization: SpecializationSkill): void {
        this.specialization = specialization;
        this.learnedSkills.set(specialization.id, specialization);
        
        // Notify listeners
        this.triggerEvent('skill-points-changed', this.availableSkillPoints);
        this.triggerEvent('specialization-changed', this.specialization);
    }
    
    /**
     * Triggers an event in the game scene event system.
     * @param event The event name
     * @param data Event data
     */
    private triggerEvent(event: string, data: any): void {
        this.scene.events.emit(`skill-manager-${event}`, data);
    }
    
    /**
     * Registers an event handler.
     * @param event The event name to listen for
     * @param callback The callback function
     */
    on(event: string, callback: Function): void {
        this.scene.events.on(`skill-manager-${event}`, callback);
    }
    
    /**
     * Removes an event handler.
     * @param event The event name
     * @param callback The callback function
     */
    off(event: string, callback: Function): void {
        this.scene.events.off(`skill-manager-${event}`, callback);
    }
} 