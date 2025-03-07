import { Scene } from 'phaser';
import { MedievalVitals } from './MedievalVitals';
import { Game } from '../scenes/Game';

/**
 * MedievalVitalsIntegration - Integrates the MedievalVitals UI with the main game
 * This class serves as a bridge between the Game scene and the MedievalVitals UI
 */
export class MedievalVitalsIntegration {
    private scene: Scene;
    private vitals: MedievalVitals | null = null;
    private updateInterval: number = 100; // Update interval in ms
    private updateTimer: number = 0;
    
    constructor(scene: Scene) {
        this.scene = scene;
    }
    
    /**
     * Initializes the medieval vitals UI
     */
    public initialize(): void {
        // Create the medieval vitals UI
        this.vitals = new MedievalVitals(this.scene);
        
        // Initial update
        this.updateUI();
        
        // Set up event listeners for the game
        this.setupEventListeners();
    }
    
    /**
     * Sets up event listeners for the game
     */
    private setupEventListeners(): void {
        // Listen for relevant game events
        const gameScene = this.scene as Game;
        
        // Update UI when player stats change
        this.scene.events.on('player-stats-updated', this.updateUI, this);
        
        // Update UI when health changes
        this.scene.events.on('player-health-changed', this.updateUI, this);
        
        // Update UI when XP changes
        this.scene.events.on('player-xp-changed', this.updateUI, this);
        
        // Update UI when gold changes
        this.scene.events.on('player-gold-changed', this.updateGold, this);
        
        // Update UI when aggression changes
        this.scene.events.on('player-aggression-changed', this.updateAggression, this);
        
        // Update UI when god mode changes
        this.scene.events.on('player-god-mode-changed', this.updateGodMode, this);
        
        // Clean up when scene is shut down
        this.scene.events.once('shutdown', this.destroy, this);
    }
    
    /**
     * Updates the UI with current player stats
     */
    public updateUI(): void {
        if (!this.vitals) return;
        
        const gameScene = this.scene as Game;
        if (!gameScene.playerStats) return;
        
        // Update health
        this.vitals.updateHealthBar(gameScene.playerStats.health, gameScene.playerStats.maxHealth);
        
        // Update XP
        this.vitals.updateXPBar(gameScene.playerStats.xp, gameScene.playerStats.xpToNextLevel);
        
        // Update gold
        this.vitals.updateGoldDisplay(gameScene.playerStats.gold);
        
        // Update aggression
        this.vitals.setAggression(gameScene.playerStats.isAggressive);
        
        // Update god mode
        this.vitals.setGodMode(gameScene.playerStats.godMode);
    }
    
    /**
     * Updates the UI during the game loop
     * @param time Current time
     * @param delta Time since last update
     */
    public update(time: number, delta: number): void {
        // Update the UI periodically
        this.updateTimer += delta;
        if (this.updateTimer >= this.updateInterval) {
            this.updateTimer = 0;
            this.updateUI();
        }
    }
    
    /**
     * Shows a message
     * @param message The message to show
     * @param type The type of message (info, success, warning, error)
     * @param duration The duration to show the message (in ms)
     */
    public showMessage(message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info', duration: number = 3000): void {
        if (this.vitals) {
            this.vitals.showMessage(message, type, duration);
        }
    }
    
    /**
     * Toggles the player's aggression state
     */
    public toggleAggression(): void {
        if (this.vitals) {
            const gameScene = this.scene as Game;
            gameScene.toggleAggression();
            this.vitals.toggleAggression();
        }
    }
    
    /**
     * Sets the player's aggression state
     * @param isAggressive Whether the player is aggressive
     */
    public setAggression(isAggressive: boolean): void {
        if (this.vitals) {
            this.vitals.setAggression(isAggressive);
        }
    }
    
    /**
     * Updates the aggression state based on the game
     */
    private updateAggression(): void {
        if (!this.vitals) return;
        
        const gameScene = this.scene as Game;
        if (gameScene.playerStats) {
            this.vitals.setAggression(gameScene.playerStats.isAggressive);
        }
    }
    
    /**
     * Sets the god mode state
     * @param enabled Whether god mode is enabled
     */
    public setGodMode(enabled: boolean): void {
        if (this.vitals) {
            this.vitals.setGodMode(enabled);
        }
    }
    
    /**
     * Updates the god mode state based on the game
     */
    private updateGodMode(): void {
        if (!this.vitals) return;
        
        const gameScene = this.scene as Game;
        if (gameScene.playerStats) {
            this.vitals.setGodMode(gameScene.playerStats.godMode);
        }
    }
    
    /**
     * Shows a level up notification
     * @param level The new level
     */
    public showLevelUpNotification(level: number): void {
        if (this.vitals) {
            this.vitals.showLevelUpNotification(level);
        }
    }
    
    /**
     * Updates the gold display
     * @param gold New gold amount
     * @param animate Whether to animate the change
     */
    public updateGold(gold: number, animate: boolean = true): void {
        if (!this.vitals) return;
        
        // Update the gold display with animation
        this.vitals.updateGoldWithAnimation(gold, animate);
        
        // Also update the player stats if they exist
        const gameScene = this.scene as Game;
        if (gameScene.playerStats) {
            gameScene.playerStats.gold = gold;
        }
    }
    
    /**
     * Destroys the medieval vitals UI
     */
    public destroy(): void {
        // Remove event listeners
        this.scene.events.off('player-stats-updated', this.updateUI, this);
        this.scene.events.off('player-health-changed', this.updateUI, this);
        this.scene.events.off('player-xp-changed', this.updateUI, this);
        this.scene.events.off('player-gold-changed', this.updateGold, this);
        this.scene.events.off('player-aggression-changed', this.updateAggression, this);
        this.scene.events.off('player-god-mode-changed', this.updateGodMode, this);
        
        // Destroy the vitals UI
        if (this.vitals) {
            this.vitals.destroy();
            this.vitals = null;
        }
    }
}

/**
 * Example usage in a Phaser scene:
 * 
 * // In your scene's create method:
 * this.vitalsUI = new MedievalVitalsIntegration(this);
 * this.vitalsUI.initialize();
 * 
 * // To show a message:
 * this.vitalsUI.showMessage('You found a treasure!', 'success');
 * 
 * // To toggle aggression:
 * this.vitalsUI.toggleAggression();
 * 
 * // To show a level up notification:
 * this.vitalsUI.showLevelUpNotification(5);
 * 
 * // In your scene's shutdown method:
 * this.vitalsUI.destroy();
 */ 