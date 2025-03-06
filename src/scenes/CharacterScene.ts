import { Scene } from 'phaser';
import { SkillManager } from '../systems/skills/SkillManager';
import { createAllSkills } from '../systems/skills/index';
import { SkillsUI } from '../systems/skills/SkillsUI';
import { Game } from './Game';

/**
 * Scene for displaying and managing character information, including skills.
 */
export class CharacterScene extends Scene {
    /** Skill manager for handling character skills */
    private skillManager: SkillManager;
    
    /** UI for displaying skills */
    private skillsUI: SkillsUI;
    
    /** Main UI container */
    private uiContainer: Phaser.GameObjects.Container;
    
    /** Character level */
    private characterLevel: number = 1;
    
    /** Character name */
    private characterName: string = 'Adventurer';
    
    /** Character stats */
    private stats = {
        health: 100,
        mana: 50,
        strength: 10,
        agility: 10,
        intelligence: 10,
        stamina: 10
    };
    
    /** Reference to main game scene */
    private gameScene: Game;
    
    /** Whether to show skills tab on init */
    private showSkillsTab: boolean = false;
    
    /**
     * Creates a new character scene.
     */
    constructor() {
        super({ key: 'CharacterScene' });
    }
    
    /**
     * Initialize scene data
     */
    init(data: any) {
        // Get game scene reference
        this.gameScene = data.game;
        
        // Get character data
        if (data.playerData) {
            this.characterLevel = data.playerData.level || 1;
            this.stats.health = data.playerData.health || 100;
            this.stats.strength = data.playerData.strength || 10;
            this.stats.agility = data.playerData.dexterity || 10;
            this.stats.intelligence = data.playerData.intelligence || 10;
            this.stats.stamina = data.playerData.vitality || 10;
        }
        
        // Check if we should show skills tab
        this.showSkillsTab = data.showSkillsTab || false;
    }
    
    /**
     * Preload assets for the scene.
     */
    preload() {
        // Load character UI assets
        this.load.image('character_bg', 'assets/ui/character_bg.png');
        this.load.image('button', 'assets/ui/button.png');
        this.load.image('tab', 'assets/ui/tab.png');
        
        // Load character portrait placeholder
        this.load.image('character_portrait', 'assets/ui/portrait_placeholder.png');
    }
    
    /**
     * Create scene elements.
     */
    create() {
        // Use skill manager from the game scene if available
        if (this.gameScene && this.gameScene.skillManager) {
            this.skillManager = this.gameScene.skillManager;
        } else {
            // Create a new skill manager as fallback
            this.skillManager = new SkillManager(this);
            this.skillManager.initialize(10, createAllSkills());
        }
        
        // Create the main UI container
        this.uiContainer = this.add.container(0, 0);
        
        // Create UI elements
        this.createBackground();
        this.createCharacterInfo();
        this.createNavigation();
        
        // Create the skills UI
        this.skillsUI = new SkillsUI(this, this.skillManager);
        
        // Register event handlers
        this.events.on('shutdown', this.onShutdown, this);
        
        // Show skills tab if requested
        if (this.showSkillsTab) {
            this.skillsUI.show();
        }
    }
    
    /**
     * Creates the background for the scene.
     */
    private createBackground() {
        // Add a background color
        const bg = this.add.rectangle(0, 0, this.cameras.main.width, this.cameras.main.height, 0x111111);
        bg.setOrigin(0);
        this.uiContainer.add(bg);
        
        // If we have a background image, use it instead
        if (this.textures.exists('character_bg')) {
            const bgImage = this.add.image(0, 0, 'character_bg');
            bgImage.setOrigin(0);
            bgImage.setDisplaySize(this.cameras.main.width, this.cameras.main.height);
            this.uiContainer.add(bgImage);
        }
    }
    
    /**
     * Creates character information display.
     */
    private createCharacterInfo() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Container for character info
        const infoContainer = this.add.container(width * 0.5, height * 0.2);
        
        // Character name
        const nameText = this.add.text(0, -60, this.characterName, {
            fontSize: '32px',
            fontFamily: 'Arial',
            color: '#FFFFFF',
            stroke: '#000000',
            strokeThickness: 4
        });
        nameText.setOrigin(0.5);
        
        // Character level
        const levelText = this.add.text(0, -30, `Level ${this.characterLevel}`, {
            fontSize: '24px',
            fontFamily: 'Arial',
            color: '#FFFF00',
            stroke: '#000000',
            strokeThickness: 3
        });
        levelText.setOrigin(0.5);
        
        // Character portrait
        let portrait;
        if (this.textures.exists('character_portrait')) {
            portrait = this.add.image(-100, 40, 'character_portrait');
            portrait.setDisplaySize(150, 150);
        } else {
            // Placeholder if no portrait exists
            portrait = this.add.rectangle(-100, 40, 150, 150, 0x666666);
        }
        portrait.setOrigin(0.5);
        
        // Character stats
        const statsContainer = this.add.container(50, 40);
        
        const statStyle = {
            fontSize: '18px',
            fontFamily: 'Arial',
            color: '#FFFFFF'
        };
        
        // Create stat text objects
        const healthText = this.add.text(0, -50, `Health: ${this.stats.health}`, statStyle);
        const manaText = this.add.text(0, -25, `Mana: ${this.stats.mana}`, statStyle);
        const strengthText = this.add.text(0, 0, `Strength: ${this.stats.strength}`, statStyle);
        const agilityText = this.add.text(0, 25, `Agility: ${this.stats.agility}`, statStyle);
        const intelligenceText = this.add.text(0, 50, `Intelligence: ${this.stats.intelligence}`, statStyle);
        const staminaText = this.add.text(0, 75, `Stamina: ${this.stats.stamina}`, statStyle);
        
        // Add stats to container
        statsContainer.add([
            healthText,
            manaText,
            strengthText,
            agilityText,
            intelligenceText,
            staminaText
        ]);
        
        // Add everything to the info container
        infoContainer.add([
            nameText,
            levelText,
            portrait,
            statsContainer
        ]);
        
        // Add the info container to the main UI container
        this.uiContainer.add(infoContainer);
    }
    
    /**
     * Creates navigation buttons.
     */
    private createNavigation() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Navigation container
        const navContainer = this.add.container(width * 0.5, height * 0.85);
        
        // Create button style
        const createButton = (x: number, text: string, callback: () => void) => {
            const button = this.add.container(x, 0);
            
            // Button background
            let buttonBg;
            if (this.textures.exists('button')) {
                buttonBg = this.add.image(0, 0, 'button');
                buttonBg.setDisplaySize(200, 60);
            } else {
                buttonBg = this.add.rectangle(0, 0, 200, 60, 0x333333);
                buttonBg.setStrokeStyle(2, 0x666666);
            }
            
            // Button text
            const buttonText = this.add.text(0, 0, text, {
                fontSize: '24px',
                fontFamily: 'Arial',
                color: '#FFFFFF'
            });
            buttonText.setOrigin(0.5);
            
            // Add to button container
            button.add([buttonBg, buttonText]);
            
            // Make button interactive
            buttonBg.setInteractive({ useHandCursor: true });
            buttonBg.on('pointerdown', callback);
            buttonBg.on('pointerover', () => buttonText.setTint(0x00ffff));
            buttonBg.on('pointerout', () => buttonText.clearTint());
            
            return button;
        };
        
        // Create buttons
        const skillsButton = createButton(-220, 'Skills', () => {
            this.skillsUI.show();
        });
        
        const inventoryButton = createButton(0, 'Inventory', () => {
            // Show inventory (not implemented yet)
            console.log('Inventory button clicked');
        });
        
        const backButton = createButton(220, 'Back', () => {
            // Return to main game scene
            this.scene.stop();
            
            if (this.gameScene) {
                this.gameScene.scene.resume();
            } else {
                this.scene.get('Game').scene.resume();
            }
        });
        
        // Add buttons to navigation container
        navContainer.add([skillsButton, inventoryButton, backButton]);
        
        // Add navigation to UI container
        this.uiContainer.add(navContainer);
    }
    
    /**
     * Updates character stats based on skills.
     */
    private updateStats() {
        // Base stats
        this.stats = {
            health: 100,
            mana: 50,
            strength: 10,
            agility: 10,
            intelligence: 10,
            stamina: 10
        };
        
        // Apply skill effects to stats
        // In a real game, you would pass the player object to applyAllSkillEffects
        // and it would modify the player's stats directly
        // For now, we'll update our simple stats object
        
        const learnedSkills = this.skillManager.getLearnedSkills();
        for (const skill of learnedSkills) {
            // Example implementation - actual effects would depend on skill system
            if (skill.id === 'warrior') {
                this.stats.health += skill.level * 20;
                this.stats.strength += skill.level * 2;
            } else if (skill.id === 'ranger') {
                this.stats.agility += skill.level * 2;
                this.stats.stamina += skill.level;
            } else if (skill.id === 'druid') {
                this.stats.intelligence += skill.level * 2;
                this.stats.mana += skill.level * 15;
            } else if (skill.id === 'ninja') {
                this.stats.agility += skill.level * 3;
                this.stats.strength += skill.level;
            }
        }
    }
    
    /**
     * Handles scene shutdown.
     */
    private onShutdown() {
        // Clean up event listeners
        this.events.off('shutdown', this.onShutdown, this);
    }
    
    /**
     * Updates the scene.
     * @param time The current time
     * @param delta The time since the last update
     */
    update(time: number, delta: number) {
        // Update stats if needed
        this.updateStats();
    }
} 