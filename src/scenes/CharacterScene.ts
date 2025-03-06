import { Scene, GameObjects } from 'phaser';
import { Game } from './Game';

interface CharacterSceneData {
    game: Game;
    playerData: {
        health: number;
        maxHealth: number;
        level: number;
        xp: number;
        xpToNextLevel: number;
        gold: number;
        // Add any additional stats we want to display
        strength?: number;
        dexterity?: number;
        intelligence?: number;
        vitality?: number;
    };
}

export class CharacterScene extends Scene {
    // Reference to the main game scene
    private gameScene: Game;
    
    // Container for all character UI elements
    private container: GameObjects.Container;
    
    // Background elements
    private background: GameObjects.Rectangle;
    private statsPanel: GameObjects.Rectangle;
    private attributesPanel: GameObjects.Rectangle;
    private progressionPanel: GameObjects.Rectangle;
    
    // Title and headers
    private titleText: GameObjects.Text;
    private statsText: GameObjects.Text;
    private attributesText: GameObjects.Text;
    private progressionText: GameObjects.Text;
    private closeButton: GameObjects.Text;
    
    // Stats display elements
    private healthText: GameObjects.Text;
    private healthBar: GameObjects.Graphics;
    private levelText: GameObjects.Text;
    private xpText: GameObjects.Text;
    private xpBar: GameObjects.Graphics;
    private goldText: GameObjects.Text;
    
    // Attributes display elements
    private strengthText: GameObjects.Text;
    private dexterityText: GameObjects.Text;
    private intelligenceText: GameObjects.Text;
    private vitalityText: GameObjects.Text;
    
    // Player data
    private playerData: CharacterSceneData['playerData'];
    
    constructor() {
        super('CharacterScene');
    }
    
    init(data: CharacterSceneData) {
        this.gameScene = data.game;
        this.playerData = data.playerData;
    }
    
    create() {
        // Get game dimensions
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Create semi-transparent background
        this.background = this.add.rectangle(0, 0, width, height, 0x000000, 0.7)
            .setOrigin(0)
            .setInteractive()
            .on('pointerdown', (pointer: Phaser.Input.Pointer) => {
                // Only close if clicking directly on the background (not UI elements)
                if (pointer.downElement === this.background) {
                    this.closeCharacter();
                }
            });
            
        // Create container for all UI elements
        this.container = this.add.container(0, 0);
        
        // Create the panels
        this.createPanels();
        
        // Create headers
        this.createHeaders();
        
        // Create the content for each panel
        this.createStatsPanel();
        this.createAttributesPanel();
        this.createProgressionPanel();
        
        // Setup keyboard handlers (ESC to close)
        this.setupKeyboardHandlers();
    }
    
    private createPanels() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Stats panel (top-left)
        this.statsPanel = this.add.rectangle(width * 0.25, height * 0.3, width * 0.45, height * 0.25, 0x333333, 0.9)
            .setOrigin(0.5)
            .setStrokeStyle(2, 0xffffff);
        this.container.add(this.statsPanel);
        
        // Attributes panel (top-right)
        this.attributesPanel = this.add.rectangle(width * 0.75, height * 0.3, width * 0.45, height * 0.25, 0x333333, 0.9)
            .setOrigin(0.5)
            .setStrokeStyle(2, 0xffffff);
        this.container.add(this.attributesPanel);
        
        // Progression panel (bottom)
        this.progressionPanel = this.add.rectangle(width * 0.5, height * 0.65, width * 0.9, height * 0.3, 0x333333, 0.9)
            .setOrigin(0.5)
            .setStrokeStyle(2, 0xffffff);
        this.container.add(this.progressionPanel);
    }
    
    private createHeaders() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Main title
        this.titleText = this.add.text(width / 2, height * 0.1, 'CHARACTER', {
            fontFamily: 'Arial Black',
            fontSize: '32px',
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);
        this.container.add(this.titleText);
        
        // Close button
        this.closeButton = this.add.text(width * 0.9, height * 0.1, 'X', {
            fontFamily: 'Arial',
            fontSize: '24px',
            color: '#ffffff'
        })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.closeCharacter())
            .on('pointerover', () => this.closeButton.setStyle({ color: '#ff0000' }))
            .on('pointerout', () => this.closeButton.setStyle({ color: '#ffffff' }));
        this.container.add(this.closeButton);
        
        // Stats header
        this.statsText = this.add.text(width * 0.25, height * 0.18, 'STATS', {
            fontFamily: 'Arial',
            fontSize: '20px',
            color: '#ffff00',
            align: 'center'
        }).setOrigin(0.5);
        this.container.add(this.statsText);
        
        // Attributes header
        this.attributesText = this.add.text(width * 0.75, height * 0.18, 'ATTRIBUTES', {
            fontFamily: 'Arial',
            fontSize: '20px',
            color: '#ffff00',
            align: 'center'
        }).setOrigin(0.5);
        this.container.add(this.attributesText);
        
        // Progression header
        this.progressionText = this.add.text(width * 0.5, height * 0.5, 'PROGRESSION', {
            fontFamily: 'Arial',
            fontSize: '20px',
            color: '#ffff00',
            align: 'center'
        }).setOrigin(0.5);
        this.container.add(this.progressionText);
    }
    
    private createStatsPanel() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Health info
        this.healthText = this.add.text(width * 0.15, height * 0.25, `Health: ${this.playerData.health}/${this.playerData.maxHealth}`, {
            fontFamily: 'Arial',
            fontSize: '18px',
            color: '#ffffff'
        });
        this.container.add(this.healthText);
        
        // Health bar
        this.healthBar = this.add.graphics();
        this.drawHealthBar();
        this.container.add(this.healthBar);
        
        // Gold info
        this.goldText = this.add.text(width * 0.15, height * 0.35, `Gold: ${this.playerData.gold}`, {
            fontFamily: 'Arial',
            fontSize: '18px',
            color: '#ffdd00'
        });
        this.container.add(this.goldText);
    }
    
    private createAttributesPanel() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Default values if not provided
        const strength = this.playerData.strength || 10;
        const dexterity = this.playerData.dexterity || 10;
        const intelligence = this.playerData.intelligence || 10;
        const vitality = this.playerData.vitality || 10;
        
        // Strength
        this.strengthText = this.add.text(width * 0.65, height * 0.23, `Strength: ${strength}`, {
            fontFamily: 'Arial',
            fontSize: '18px',
            color: '#ffffff'
        });
        this.container.add(this.strengthText);
        
        // Dexterity
        this.dexterityText = this.add.text(width * 0.65, height * 0.27, `Dexterity: ${dexterity}`, {
            fontFamily: 'Arial',
            fontSize: '18px',
            color: '#ffffff'
        });
        this.container.add(this.dexterityText);
        
        // Intelligence
        this.intelligenceText = this.add.text(width * 0.65, height * 0.31, `Intelligence: ${intelligence}`, {
            fontFamily: 'Arial',
            fontSize: '18px',
            color: '#ffffff'
        });
        this.container.add(this.intelligenceText);
        
        // Vitality
        this.vitalityText = this.add.text(width * 0.65, height * 0.35, `Vitality: ${vitality}`, {
            fontFamily: 'Arial',
            fontSize: '18px',
            color: '#ffffff'
        });
        this.container.add(this.vitalityText);
    }
    
    private createProgressionPanel() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Level info
        this.levelText = this.add.text(width * 0.5, height * 0.55, `Level: ${this.playerData.level}`, {
            fontFamily: 'Arial',
            fontSize: '20px',
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);
        this.container.add(this.levelText);
        
        // XP info
        this.xpText = this.add.text(width * 0.3, height * 0.6, `XP: ${this.playerData.xp}/${this.playerData.xpToNextLevel}`, {
            fontFamily: 'Arial',
            fontSize: '18px',
            color: '#ffffff'
        });
        this.container.add(this.xpText);
        
        // XP bar
        this.xpBar = this.add.graphics();
        this.drawXpBar();
        this.container.add(this.xpBar);
    }
    
    private drawHealthBar() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        const barWidth = 200;
        const barHeight = 15;
        const x = width * 0.15;
        const y = height * 0.29;
        
        this.healthBar.clear();
        
        // Background
        this.healthBar.fillStyle(0x666666);
        this.healthBar.fillRect(x, y, barWidth, barHeight);
        
        // Calculate health percentage
        const healthPercentage = this.playerData.health / this.playerData.maxHealth;
        
        // Health bar color based on health percentage
        let healthColor = 0x00ff00; // Green
        if (healthPercentage < 0.3) {
            healthColor = 0xff0000; // Red for low health
        } else if (healthPercentage < 0.6) {
            healthColor = 0xffff00; // Yellow for medium health
        }
        
        // Fill
        this.healthBar.fillStyle(healthColor);
        this.healthBar.fillRect(x, y, barWidth * healthPercentage, barHeight);
        
        // Border
        this.healthBar.lineStyle(2, 0xffffff);
        this.healthBar.strokeRect(x, y, barWidth, barHeight);
    }
    
    private drawXpBar() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        const barWidth = 400;
        const barHeight = 20;
        const x = width * 0.3;
        const y = height * 0.65;
        
        this.xpBar.clear();
        
        // Background
        this.xpBar.fillStyle(0x666666);
        this.xpBar.fillRect(x, y, barWidth, barHeight);
        
        // Calculate XP percentage
        const xpPercentage = this.playerData.xp / this.playerData.xpToNextLevel;
        
        // Fill
        this.xpBar.fillStyle(0x00aaff); // Blue for XP
        this.xpBar.fillRect(x, y, barWidth * xpPercentage, barHeight);
        
        // Border
        this.xpBar.lineStyle(2, 0xffffff);
        this.xpBar.strokeRect(x, y, barWidth, barHeight);
    }
    
    private setupKeyboardHandlers() {
        // Add ESC key to close the inventory
        this.input.keyboard?.on('keydown-ESC', () => {
            this.closeCharacter();
        });
    }
    
    private closeCharacter() {
        // Resume the game scene
        this.scene.resume('Game');
        // Stop this scene
        this.scene.stop();
    }
} 