import { Scene, GameObjects } from 'phaser';
import { SkillManager } from './SkillManager';
import { Skill, SkillCategory, SkillTier } from './Skill';
import { SpecializationSkill } from './SpecializationSkill';

/**
 * Handles the UI for displaying and interacting with skills.
 */
export class SkillsUI {
    /** Reference to the game scene */
    private scene: Scene;
    
    /** Reference to the skill manager */
    private skillManager: SkillManager;
    
    /** Container for all skill UI elements */
    private container: GameObjects.Container;
    
    /** Panel for displaying available skills */
    private skillsPanel: GameObjects.Rectangle;
    
    /** Panel for displaying skill details */
    private detailPanel: GameObjects.Rectangle;
    
    /** Panel for displaying specialization information */
    private specializationPanel: GameObjects.Rectangle;
    
    /** Currently selected skill */
    private selectedSkill: Skill | null = null;
    
    /** Skill point display */
    private skillPointsText: GameObjects.Text;
    
    /** Maps skill elements to their corresponding skill objects */
    private skillElements: Map<GameObjects.Text, Skill> = new Map();
    
    /** All UI elements for skills by category */
    private skillElementsByCategory: Map<SkillCategory, GameObjects.Text[]> = new Map();
    
    /** Selected skill indicator */
    private selectedIndicator: GameObjects.Rectangle;
    
    /** Upgrade button */
    private upgradeButton: GameObjects.Container;
    
    /** Reset skills button */
    private resetButton: GameObjects.Container;
    
    /** Text displaying skill details */
    private detailText: GameObjects.Text;
    
    /** Specialization info text */
    private specializationText: GameObjects.Text;
    
    /** Skill category tabs */
    private categoryTabs: Map<SkillCategory, GameObjects.Container> = new Map();
    
    /** Current selected category */
    private selectedCategory: SkillCategory = SkillCategory.COMBAT;
    
    /**
     * Creates a new SkillsUI.
     * @param scene The game scene
     * @param skillManager The skill manager
     */
    constructor(scene: Scene, skillManager: SkillManager) {
        this.scene = scene;
        this.skillManager = skillManager;
        
        // Create the main container
        this.container = this.scene.add.container(0, 0);
        this.container.setVisible(false);
        
        // Create UI elements
        this.createPanels();
        this.createSkillPointsDisplay();
        this.createCategoryTabs();
        this.createUpgradeButton();
        this.createResetButton();
        this.createDetailPanel();
        this.createSpecializationPanel();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Initially render the first category
        this.renderSkillCategory(SkillCategory.COMBAT);
    }
    
    /**
     * Creates the main panels for the UI.
     */
    private createPanels() {
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;
        
        // Create background panel
        const background = this.scene.add.rectangle(0, 0, width, height, 0x000000, 0.7)
            .setOrigin(0)
            .setInteractive()
            .on('pointerdown', (pointer: Phaser.Input.Pointer) => {
                // Only close if clicking directly on the background (not UI elements)
                if (pointer.downElement === background) {
                    this.hide();
                }
            });
        
        this.container.add(background);
        
        // Skills panel (left side)
        this.skillsPanel = this.scene.add.rectangle(
            width * 0.05, 
            height * 0.1, 
            width * 0.4, 
            height * 0.8, 
            0x222222, 
            0.9
        );
        this.skillsPanel.setOrigin(0);
        this.skillsPanel.setStrokeStyle(2, 0x444444);
        this.container.add(this.skillsPanel);
        
        // Detail panel (right side, top)
        this.detailPanel = this.scene.add.rectangle(
            width * 0.5, 
            height * 0.1, 
            width * 0.45, 
            height * 0.4, 
            0x222222, 
            0.9
        );
        this.detailPanel.setOrigin(0);
        this.detailPanel.setStrokeStyle(2, 0x444444);
        this.container.add(this.detailPanel);
        
        // Specialization panel (right side, bottom)
        this.specializationPanel = this.scene.add.rectangle(
            width * 0.5, 
            height * 0.55, 
            width * 0.45, 
            height * 0.35, 
            0x222222, 
            0.9
        );
        this.specializationPanel.setOrigin(0);
        this.specializationPanel.setStrokeStyle(2, 0x444444);
        this.container.add(this.specializationPanel);
        
        // Title text
        const titleText = this.scene.add.text(
            width * 0.5,
            height * 0.05,
            'Skills & Specializations',
            {
                fontSize: '32px',
                fontFamily: 'Arial',
                color: '#FFFFFF'
            }
        );
        titleText.setOrigin(0.5);
        this.container.add(titleText);
        
        // Skills panel title
        const skillsPanelTitle = this.scene.add.text(
            width * 0.25,
            height * 0.115,
            'Available Skills',
            {
                fontSize: '24px',
                fontFamily: 'Arial',
                color: '#FFFFFF'
            }
        );
        skillsPanelTitle.setOrigin(0.5);
        this.container.add(skillsPanelTitle);
        
        // Detail panel title
        const detailPanelTitle = this.scene.add.text(
            width * 0.725,
            height * 0.115,
            'Skill Details',
            {
                fontSize: '24px',
                fontFamily: 'Arial',
                color: '#FFFFFF'
            }
        );
        detailPanelTitle.setOrigin(0.5);
        this.container.add(detailPanelTitle);
        
        // Specialization panel title
        const specPanelTitle = this.scene.add.text(
            width * 0.725,
            height * 0.565,
            'Specialization',
            {
                fontSize: '24px',
                fontFamily: 'Arial',
                color: '#FFFFFF'
            }
        );
        specPanelTitle.setOrigin(0.5);
        this.container.add(specPanelTitle);
        
        // Close button
        const closeButton = this.scene.add.text(
            width * 0.95,
            height * 0.05,
            'X',
            {
                fontSize: '28px',
                fontFamily: 'Arial',
                color: '#FFFFFF'
            }
        );
        closeButton.setOrigin(0.5);
        closeButton.setInteractive({ useHandCursor: true });
        closeButton.on('pointerdown', () => this.hide());
        closeButton.on('pointerover', () => closeButton.setTint(0xff0000));
        closeButton.on('pointerout', () => closeButton.clearTint());
        this.container.add(closeButton);
        
        // Selected skill indicator
        this.selectedIndicator = this.scene.add.rectangle(0, 0, 0, 0, 0x3498db, 0.5);
        this.selectedIndicator.setVisible(false);
        this.container.add(this.selectedIndicator);
    }
    
    /**
     * Creates the skill points display.
     */
    private createSkillPointsDisplay() {
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;
        
        const skillPointsContainer = this.scene.add.container(width * 0.25, height * 0.155);
        
        const skillPointsLabel = this.scene.add.text(
            0,
            0,
            'Available Skill Points:',
            {
                fontSize: '20px',
                fontFamily: 'Arial',
                color: '#FFFFFF'
            }
        );
        skillPointsLabel.setOrigin(0.5);
        
        this.skillPointsText = this.scene.add.text(
            0,
            30,
            this.skillManager.getAvailableSkillPoints().toString(),
            {
                fontSize: '24px',
                fontFamily: 'Arial',
                color: '#FFFF00'
            }
        );
        this.skillPointsText.setOrigin(0.5);
        
        skillPointsContainer.add(skillPointsLabel);
        skillPointsContainer.add(this.skillPointsText);
        
        this.container.add(skillPointsContainer);
    }
    
    /**
     * Creates tabs for switching between skill categories.
     */
    private createCategoryTabs() {
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;
        const tabWidth = width * 0.08;
        const tabHeight = 40;
        const tabY = height * 0.2;
        
        // Define categories and their display names
        const categories = [
            { category: SkillCategory.COMBAT, name: 'Combat' },
            { category: SkillCategory.CRAFTING, name: 'Crafting' },
            { category: SkillCategory.KNOWLEDGE, name: 'Knowledge' },
            { category: SkillCategory.EXPLORATION, name: 'Exploration' },
            { category: SkillCategory.SPECIALIZATION, name: 'Class' }
        ];
        
        // Create a tab for each category
        categories.forEach((cat, index) => {
            const tabX = width * 0.05 + (tabWidth * index);
            
            const tabContainer = this.scene.add.container(tabX, tabY);
            
            const tabBg = this.scene.add.rectangle(
                0,
                0,
                tabWidth,
                tabHeight,
                cat.category === this.selectedCategory ? 0x3498db : 0x555555,
                0.9
            );
            tabBg.setOrigin(0);
            tabBg.setStrokeStyle(2, 0x444444);
            
            const tabText = this.scene.add.text(
                tabWidth / 2,
                tabHeight / 2,
                cat.name,
                {
                    fontSize: '16px',
                    fontFamily: 'Arial',
                    color: '#FFFFFF'
                }
            );
            tabText.setOrigin(0.5);
            
            tabContainer.add(tabBg);
            tabContainer.add(tabText);
            
            // Make the tab interactive
            tabBg.setInteractive({ useHandCursor: true });
            tabBg.on('pointerdown', () => {
                this.selectedCategory = cat.category;
                this.updateCategoryTabs();
                this.renderSkillCategory(cat.category);
            });
            
            this.categoryTabs.set(cat.category, tabContainer);
            this.container.add(tabContainer);
        });
    }
    
    /**
     * Updates the appearance of category tabs.
     */
    private updateCategoryTabs() {
        for (const [category, container] of this.categoryTabs.entries()) {
            const tabBg = container.getAt(0) as GameObjects.Rectangle;
            tabBg.fillColor = category === this.selectedCategory ? 0x3498db : 0x555555;
        }
    }
    
    /**
     * Creates the upgrade button.
     */
    private createUpgradeButton() {
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;
        
        this.upgradeButton = this.scene.add.container(width * 0.725, height * 0.45);
        
        const buttonBg = this.scene.add.rectangle(
            0,
            0,
            200,
            50,
            0x27ae60,
            1
        );
        buttonBg.setOrigin(0.5);
        buttonBg.setStrokeStyle(2, 0x444444);
        
        const buttonText = this.scene.add.text(
            0,
            0,
            'Upgrade Skill',
            {
                fontSize: '20px',
                fontFamily: 'Arial',
                color: '#FFFFFF'
            }
        );
        buttonText.setOrigin(0.5);
        
        this.upgradeButton.add(buttonBg);
        this.upgradeButton.add(buttonText);
        
        // Make the button interactive
        buttonBg.setInteractive({ useHandCursor: true });
        buttonBg.on('pointerdown', () => {
            if (this.selectedSkill) {
                this.upgradeSelectedSkill();
            }
        });
        
        buttonBg.on('pointerover', () => {
            buttonBg.fillColor = 0x2ecc71;
        });
        
        buttonBg.on('pointerout', () => {
            buttonBg.fillColor = 0x27ae60;
        });
        
        // Initially hide the button
        this.upgradeButton.setVisible(false);
        
        this.container.add(this.upgradeButton);
    }
    
    /**
     * Creates the reset skills button.
     */
    private createResetButton() {
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;
        
        this.resetButton = this.scene.add.container(width * 0.725, height * 0.9);
        
        const buttonBg = this.scene.add.rectangle(
            0,
            0,
            250,
            50,
            0xe74c3c,
            1
        );
        buttonBg.setOrigin(0.5);
        buttonBg.setStrokeStyle(2, 0x444444);
        
        const buttonText = this.scene.add.text(
            0,
            0,
            'Reset All Skills (500 Food)',
            {
                fontSize: '18px',
                fontFamily: 'Arial',
                color: '#FFFFFF'
            }
        );
        buttonText.setOrigin(0.5);
        
        this.resetButton.add(buttonBg);
        this.resetButton.add(buttonText);
        
        // Make the button interactive
        buttonBg.setInteractive({ useHandCursor: true });
        buttonBg.on('pointerdown', () => {
            // Show confirmation dialog
            this.showResetConfirmation();
        });
        
        buttonBg.on('pointerover', () => {
            buttonBg.fillColor = 0xf65446;
        });
        
        buttonBg.on('pointerout', () => {
            buttonBg.fillColor = 0xe74c3c;
        });
        
        this.container.add(this.resetButton);
    }
    
    /**
     * Creates the detail panel for displaying skill information.
     */
    private createDetailPanel() {
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;
        
        this.detailText = this.scene.add.text(
            width * 0.52,
            height * 0.15,
            'Select a skill to view details',
            {
                fontSize: '18px',
                fontFamily: 'Arial',
                color: '#FFFFFF',
                wordWrap: { width: width * 0.4 }
            }
        );
        
        this.container.add(this.detailText);
    }
    
    /**
     * Creates the specialization panel for displaying class information.
     */
    private createSpecializationPanel() {
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;
        
        this.specializationText = this.scene.add.text(
            width * 0.52,
            height * 0.6,
            'No specialization selected',
            {
                fontSize: '18px',
                fontFamily: 'Arial',
                color: '#FFFFFF',
                wordWrap: { width: width * 0.4 }
            }
        );
        
        this.container.add(this.specializationText);
        
        // Update specialization text based on current specialization
        this.updateSpecializationDisplay();
    }
    
    /**
     * Sets up event listeners.
     */
    private setupEventListeners() {
        // Listen for skill point changes
        this.skillManager.on('skill-points-changed', (points: number) => {
            this.skillPointsText.setText(points.toString());
            this.updateUpgradeButton();
        });
        
        // Listen for skill learned/upgraded
        this.skillManager.on('skill-learned', () => {
            this.renderSkillCategory(this.selectedCategory);
        });
        
        this.skillManager.on('skill-upgraded', () => {
            this.renderSkillCategory(this.selectedCategory);
            if (this.selectedSkill) {
                this.updateSkillDetails(this.selectedSkill);
            }
        });
        
        // Listen for specialization changes
        this.skillManager.on('specialization-changed', () => {
            this.updateSpecializationDisplay();
            // Need to re-render specialization category if it's selected
            if (this.selectedCategory === SkillCategory.SPECIALIZATION) {
                this.renderSkillCategory(SkillCategory.SPECIALIZATION);
            }
        });
    }
    
    /**
     * Renders skills for a specific category.
     * @param category The category to render
     */
    private renderSkillCategory(category: SkillCategory) {
        // Clear existing skill elements
        this.skillElements.forEach((_, element) => {
            element.destroy();
        });
        this.skillElements.clear();
        
        // Get the skills for this category
        const skills = this.getSkillsByCategory(category);
        
        // Calculate layout
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;
        const startY = height * 0.25;
        const itemHeight = 40;
        const padding = 10;
        
        // Create a text element for each skill
        skills.forEach((skill, index) => {
            const y = startY + (index * (itemHeight + padding));
            
            // Create skill name text
            let textColor = '#FFFFFF';
            let levelString = '';
            
            // Set color based on whether the skill can be upgraded
            if (skill.level === 0) {
                // Not learned
                textColor = '#888888';
                levelString = '(Not Learned)';
            } else if (skill.level >= skill.maxLevel) {
                // Maxed out
                textColor = '#27ae60';
                levelString = `(Level ${skill.level}/${skill.maxLevel})`;
            } else {
                // Partially learned
                textColor = '#f39c12';
                levelString = `(Level ${skill.level}/${skill.maxLevel})`;
            }
            
            const skillText = this.scene.add.text(
                width * 0.08,
                y,
                `${skill.name} ${levelString}`,
                {
                    fontSize: '18px',
                    fontFamily: 'Arial',
                    color: textColor
                }
            );
            
            // Make the text interactive
            skillText.setInteractive({ useHandCursor: true });
            
            // Add events
            skillText.on('pointerdown', () => {
                this.selectSkill(skill, skillText);
            });
            
            skillText.on('pointerover', () => {
                skillText.setTint(0x3498db);
            });
            
            skillText.on('pointerout', () => {
                skillText.clearTint();
            });
            
            // Add to container and map
            this.container.add(skillText);
            this.skillElements.set(skillText, skill);
        });
        
        // Clear the selection if the skill is no longer visible
        if (this.selectedSkill && !skills.includes(this.selectedSkill)) {
            this.selectSkill(null, null);
        }
    }
    
    /**
     * Gets skills for a specific category.
     * @param category The category to get skills for
     * @returns Skills for the category
     */
    private getSkillsByCategory(category: SkillCategory): Skill[] {
        // This is a simple implementation
        // In a real game, you'd probably want to tag skills with their category
        
        const allSkills = this.skillManager.getAllSkills();
        
        switch (category) {
            case SkillCategory.COMBAT:
                return allSkills.filter(skill => 
                    !skill.isSpecialization && 
                    ['archery', 'cleave', 'fatality', 'focus', 'heroism',
                     'pierce_armor', 'plague_strike', 'rally_cry', 'relentless_assault',
                     'shield_charge', 'taunt', 'triumph'].includes(skill.id)
                );
                
            case SkillCategory.CRAFTING:
                return allSkills.filter(skill => 
                    !skill.isSpecialization && 
                    ['alchemy', 'blacksmithing', 'leatherworking',
                     'metallurgy', 'monolith_drafting'].includes(skill.id)
                );
                
            case SkillCategory.KNOWLEDGE:
                return allSkills.filter(skill => 
                    !skill.isSpecialization && 
                    ['aquarian_inscriptions', 'cartography', 'dungeoneering',
                     'monster_bane', 'scavenge', 'troll_lore', 'troodont_doctrine',
                     'warden_knowledge'].includes(skill.id)
                );
                
            case SkillCategory.EXPLORATION:
                return allSkills.filter(skill => 
                    !skill.isSpecialization && 
                    ['bond', 'cleanse', 'deathsoar_judgement', 'dragon_master', 
                     'hunter_eye', 'oiyoi_strike', 'serenity'].includes(skill.id)
                );
                
            case SkillCategory.SPECIALIZATION:
                return allSkills.filter(skill => skill.isSpecialization);
                
            default:
                return allSkills.filter(skill => 
                    !skill.isSpecialization && 
                    ['oiyoi_martial_art', 'tactics'].includes(skill.id)
                );
        }
    }
    
    /**
     * Selects a skill and updates the UI.
     * @param skill The skill to select
     * @param element The UI element corresponding to the skill
     */
    private selectSkill(skill: Skill | null, element: GameObjects.Text | null) {
        // Update selection
        this.selectedSkill = skill;
        
        // Update selected indicator
        if (skill && element) {
            this.selectedIndicator.setPosition(element.x - 15, element.y + 10);
            this.selectedIndicator.setSize(element.width + 30, element.height + 6);
            this.selectedIndicator.setVisible(true);
        } else {
            this.selectedIndicator.setVisible(false);
        }
        
        // Update detail panel
        if (skill) {
            this.updateSkillDetails(skill);
        } else {
            this.detailText.setText('Select a skill to view details');
        }
        
        // Update upgrade button
        this.updateUpgradeButton();
    }
    
    /**
     * Updates the skill details in the UI.
     * @param skill The skill to display details for
     */
    private updateSkillDetails(skill: Skill) {
        let detailsText = `**${skill.name}**\n\n${skill.description}\n\n`;
        
        // Current effects
        detailsText += '**Current Effects:**\n';
        detailsText += skill.getEffectsDescription();
        
        // Prerequisites
        if (skill.prerequisites.length > 0) {
            detailsText += '\n\n**Prerequisites:**\n';
            for (const prereq of skill.prerequisites) {
                const prereqSkill = this.skillManager.getSkill(prereq.skillId);
                if (prereqSkill) {
                    detailsText += `- ${prereqSkill.name} (Level ${prereq.level})\n`;
                }
            }
        }
        
        // Format text with colors
        let formattedText = detailsText
            .replace(/\*\*(.*?)\*\*/g, '<span style="color:#3498db">$1</span>')
            .replace(/\n/g, '<br>');
        
        this.detailText.setText(formattedText);
    }
    
    /**
     * Updates the specialization display based on the current specialization.
     */
    private updateSpecializationDisplay() {
        const specialization = this.skillManager.getSpecialization();
        
        if (!specialization) {
            this.specializationText.setText('No specialization selected yet. Choose a specialization to define your character class.');
            return;
        }
        
        let specText = `**${specialization.className}: ${specialization.role}**\n\n`;
        
        // Display level
        specText += `Current Level: ${specialization.level}/${specialization.maxLevel}\n\n`;
        
        // Recommended gear
        specText += '**Recommended Gear:**\n';
        specText += specialization.getRecommendedGearText();
        
        // Key abilities
        specText += '\n\n**Key Abilities:**\n';
        specText += specialization.getKeyAbilitiesText();
        
        // Format text with colors
        let formattedText = specText
            .replace(/\*\*(.*?)\*\*/g, '<span style="color:#e74c3c">$1</span>')
            .replace(/\n/g, '<br>');
        
        this.specializationText.setText(formattedText);
    }
    
    /**
     * Updates the upgrade button based on the selected skill.
     */
    private updateUpgradeButton() {
        if (!this.selectedSkill) {
            this.upgradeButton.setVisible(false);
            return;
        }
        
        const canUpgrade = this.selectedSkill.canUpgrade(
            this.skillManager.getAvailableSkillPoints(),
            this.skillManager.getLearnedSkills()
        );
        
        this.upgradeButton.setVisible(true);
        
        const buttonBg = this.upgradeButton.getAt(0) as GameObjects.Rectangle;
        const buttonText = this.upgradeButton.getAt(1) as GameObjects.Text;
        
        if (canUpgrade) {
            buttonBg.fillColor = 0x27ae60;
            buttonText.setText(`Upgrade (${this.selectedSkill.levelCosts[this.selectedSkill.level]} SP)`);
        } else {
            buttonBg.fillColor = 0x7f8c8d;
            
            if (this.selectedSkill.level >= this.selectedSkill.maxLevel) {
                buttonText.setText('Max Level Reached');
            } else if (!this.selectedSkill.meetsPrerequisites(this.skillManager.getLearnedSkills())) {
                buttonText.setText('Prerequisites Not Met');
            } else {
                buttonText.setText(`Need ${this.selectedSkill.levelCosts[this.selectedSkill.level]} SP`);
            }
        }
    }
    
    /**
     * Upgrades the selected skill.
     */
    private upgradeSelectedSkill() {
        if (!this.selectedSkill) return;
        
        const success = this.skillManager.learnOrUpgradeSkill(this.selectedSkill.id);
        
        if (success) {
            // Success feedback
            this.scene.cameras.main.flash(250, 0, 255, 0);
            
            // Play a sound if available
            // this.scene.sound.play('skill_upgrade');
        } else {
            // Failure feedback
            this.scene.cameras.main.shake(250, 0.01);
            
            // Play a sound if available
            // this.scene.sound.play('skill_error');
        }
    }
    
    /**
     * Shows a confirmation dialog for resetting skills.
     */
    private showResetConfirmation() {
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;
        
        // Create a confirmation dialog
        const dialogContainer = this.scene.add.container(width / 2, height / 2);
        
        // Background
        const dialogBg = this.scene.add.rectangle(
            0,
            0,
            400,
            200,
            0x333333,
            0.95
        );
        dialogBg.setOrigin(0.5);
        dialogBg.setStrokeStyle(2, 0x444444);
        
        // Title
        const titleText = this.scene.add.text(
            0,
            -70,
            'Confirm Skill Reset',
            {
                fontSize: '24px',
                fontFamily: 'Arial',
                color: '#FFFFFF'
            }
        );
        titleText.setOrigin(0.5);
        
        // Message
        const messageText = this.scene.add.text(
            0,
            -20,
            'Are you sure you want to reset all skills?\nThis will cost 500 Food and refund all skill points.',
            {
                fontSize: '18px',
                fontFamily: 'Arial',
                color: '#FFFFFF',
                align: 'center'
            }
        );
        messageText.setOrigin(0.5);
        
        // Yes button
        const yesButton = this.scene.add.container(-100, 60);
        
        const yesBg = this.scene.add.rectangle(
            0,
            0,
            150,
            50,
            0xe74c3c,
            1
        );
        yesBg.setOrigin(0.5);
        yesBg.setStrokeStyle(2, 0x444444);
        
        const yesText = this.scene.add.text(
            0,
            0,
            'Yes, Reset',
            {
                fontSize: '18px',
                fontFamily: 'Arial',
                color: '#FFFFFF'
            }
        );
        yesText.setOrigin(0.5);
        
        yesButton.add(yesBg);
        yesButton.add(yesText);
        
        // No button
        const noButton = this.scene.add.container(100, 60);
        
        const noBg = this.scene.add.rectangle(
            0,
            0,
            150,
            50,
            0x27ae60,
            1
        );
        noBg.setOrigin(0.5);
        noBg.setStrokeStyle(2, 0x444444);
        
        const noText = this.scene.add.text(
            0,
            0,
            'Cancel',
            {
                fontSize: '18px',
                fontFamily: 'Arial',
                color: '#FFFFFF'
            }
        );
        noText.setOrigin(0.5);
        
        noButton.add(noBg);
        noButton.add(noText);
        
        // Add everything to the dialog container
        dialogContainer.add(dialogBg);
        dialogContainer.add(titleText);
        dialogContainer.add(messageText);
        dialogContainer.add(yesButton);
        dialogContainer.add(noButton);
        
        // Add to the main container
        this.container.add(dialogContainer);
        
        // Make buttons interactive
        yesBg.setInteractive({ useHandCursor: true });
        yesBg.on('pointerdown', () => {
            // Reset skills
            this.skillManager.resetSkills();
            
            // Remove dialog
            dialogContainer.destroy();
            
            // Success feedback
            this.scene.cameras.main.flash(250, 0, 255, 0);
            
            // Update UI
            this.renderSkillCategory(this.selectedCategory);
            this.selectSkill(null, null);
        });
        
        yesBg.on('pointerover', () => {
            yesBg.fillColor = 0xf65446;
        });
        
        yesBg.on('pointerout', () => {
            yesBg.fillColor = 0xe74c3c;
        });
        
        noBg.setInteractive({ useHandCursor: true });
        noBg.on('pointerdown', () => {
            // Remove dialog
            dialogContainer.destroy();
        });
        
        noBg.on('pointerover', () => {
            noBg.fillColor = 0x2ecc71;
        });
        
        noBg.on('pointerout', () => {
            noBg.fillColor = 0x27ae60;
        });
    }
    
    /**
     * Shows the skills UI.
     */
    show() {
        this.container.setVisible(true);
        
        // Update skill points display
        this.skillPointsText.setText(this.skillManager.getAvailableSkillPoints().toString());
        
        // Render current category
        this.renderSkillCategory(this.selectedCategory);
        
        // Update specialization display
        this.updateSpecializationDisplay();
        
        // Add keyboard listener for ESC key
        this.scene.input.keyboard?.on('keydown-ESC', this.hide, this);
    }
    
    /**
     * Hides the skills UI.
     */
    hide() {
        this.container.setVisible(false);
        
        // Remove keyboard listener for ESC key
        this.scene.input.keyboard?.off('keydown-ESC', this.hide, this);
    }
    
    /**
     * Toggles the visibility of the skills UI.
     */
    toggle() {
        if (this.container.visible) {
            this.hide();
        } else {
            this.show();
        }
    }
} 