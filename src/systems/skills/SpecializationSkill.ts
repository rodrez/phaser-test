import { Skill, SkillPrerequisite } from './Skill';

/**
 * Represents a specialization (class) skill in the game.
 * Specialization skills define a player's class and provide unique abilities.
 */
export abstract class SpecializationSkill extends Skill {
    /** The name of the class this specialization represents */
    readonly className: string;
    
    /** Primary role of this class (e.g. "Tank/DPS") */
    readonly role: string;
    
    /** Difficulty level for the class (1-5) */
    readonly difficulty: number;
    
    /** Weapons that this class works best with */
    readonly optimalWeapons: string[];
    
    /** Armor that this class works best with */
    readonly optimalArmor: string[];
    
    /** Key abilities provided by this class */
    readonly keyAbilities: string[];
    
    /**
     * Creates a new specialization skill.
     * 
     * @param id Unique identifier for the skill
     * @param name Display name of the skill (e.g. "Warrior Training")
     * @param className The class name (e.g. "Warrior")
     * @param description Detailed description of the skill
     * @param role The primary role(s) of this class
     * @param difficulty Difficulty level of the class (1-5)
     * @param optimalWeapons Weapons this class works best with
     * @param optimalArmor Armor this class works best with
     * @param keyAbilities Key abilities this class provides
     * @param prerequisites Prerequisites for learning this skill
     * @param iconUrl URL for the skill icon
     */
    constructor(
        id: string,
        name: string,
        className: string,
        description: string,
        role: string,
        difficulty: number,
        optimalWeapons: string[],
        optimalArmor: string[],
        keyAbilities: string[],
        prerequisites: SkillPrerequisite[] = [],
        iconUrl?: string
    ) {
        // Specialization skills always have 5 levels and are indeed specializations
        super(id, name, description, 5, [1, 1, 2, 2, 3], prerequisites, iconUrl, true);
        
        this.className = className;
        this.role = role;
        this.difficulty = difficulty;
        this.optimalWeapons = optimalWeapons;
        this.optimalArmor = optimalArmor;
        this.keyAbilities = keyAbilities;
    }
    
    /**
     * Gets the class description for the specialization.
     * This combines the class name, role, difficulty, and general description.
     */
    getClassDescription(): string {
        const difficultyText = this.getDifficultyText();
        return `${this.className}: ${this.role}\nDifficulty: ${difficultyText}\n\n${this.description}`;
    }
    
    /**
     * Gets text representation of the difficulty level.
     */
    private getDifficultyText(): string {
        switch (this.difficulty) {
            case 1: return "Low (Beginner-friendly)";
            case 2: return "Low-Medium";
            case 3: return "Medium";
            case 4: return "Medium-High";
            case 5: return "High";
            default: return "Medium";
        }
    }
    
    /**
     * Gets the recommended gear text for this class.
     */
    getRecommendedGearText(): string {
        const weapons = this.optimalWeapons.join(', ');
        const armor = this.optimalArmor.join(', ');
        
        return `Optimal Weapons: ${weapons}\nOptimal Armor: ${armor}`;
    }
    
    /**
     * Lists the key abilities of this class.
     */
    getKeyAbilitiesText(): string {
        return this.keyAbilities.map(ability => `• ${ability}`).join('\n');
    }
} 