import { Scene } from 'phaser';
import { MedievalVitals } from './MedievalVitals';

/**
 * MedievalVitalsIntegration - A helper class to integrate the medieval vitals UI with a Phaser game scene
 * This class handles the creation, updating, and destruction of the vitals UI
 */
export class MedievalVitalsIntegration {
    private scene: Scene;
    private vitals: MedievalVitals | null = null;
    private updateCallback: Function | null = null;
    private isCompact: boolean = false;
    
    constructor(scene: Scene) {
        this.scene = scene;
    }
    
    /**
     * Initializes the medieval vitals UI
     * @param mode Display mode: 'normal', 'compact', or 'ultra-compact'
     */
    public initialize(mode: 'normal' | 'compact' | 'ultra-compact' = 'compact'): void {
        // Create the vitals UI
        this.vitals = new MedievalVitals(this.scene);
        this.isCompact = mode !== 'normal';
        
        // Set display mode
        if (mode === 'ultra-compact') {
            this.setUltraCompactMode(true);
        } else if (mode === 'compact') {
            this.setCompactMode(true);
        }
        
        // Set up update callback
        this.updateCallback = () => {
            if (this.vitals) {
                this.vitals.updateUI();
            }
        };
        
        // Add update callback to scene
        this.scene.events.on('update', this.updateCallback);
        
        // Listen for player events
        this.setupEventListeners();
    }
    
    /**
     * Sets up event listeners for player events
     */
    private setupEventListeners(): void {
        if (!this.vitals) return;
        
        // Listen for aggression toggle
        this.scene.events.on('player-aggression-changed', (isAggressive: boolean) => {
            if (this.vitals) {
                this.vitals.setAggression(isAggressive);
            }
        });
        
        // Listen for god mode toggle
        this.scene.events.on('god-mode-changed', (enabled: boolean) => {
            if (this.vitals) {
                this.vitals.setGodMode(enabled);
            }
        });
        
        // Listen for level up
        this.scene.events.on('player-level-up', (level: number) => {
            if (this.vitals) {
                this.vitals.showLevelUpNotification(level);
            }
        });
        
        // Listen for messages
        this.scene.events.on('show-message', (message: string, type: 'info' | 'success' | 'warning' | 'error', duration: number) => {
            if (this.vitals) {
                this.vitals.showMessage(message, type, duration);
            }
        });
    }
    
    /**
     * Shows a message in the UI
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
     * Sets the god mode state
     * @param enabled Whether god mode is enabled
     */
    public setGodMode(enabled: boolean): void {
        if (this.vitals) {
            this.vitals.setGodMode(enabled);
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
     * Toggles between normal, compact, and ultra-compact UI modes
     * @returns The new mode
     */
    public cycleDisplayMode(): 'normal' | 'compact' | 'ultra-compact' {
        // Get the container element
        const container = document.querySelector('.vitals-container');
        if (!container) {
            console.warn('Vitals container not found');
            return 'compact';
        }
        
        // Determine current mode
        const isCompact = container.classList.contains('compact');
        const isUltraCompact = container.classList.contains('ultra-compact');
        
        // Cycle through modes
        if (!isCompact && !isUltraCompact) {
            // Normal -> Compact
            this.setCompactMode(true);
            return 'compact';
        } else if (isCompact && !isUltraCompact) {
            // Compact -> Ultra-compact
            this.setUltraCompactMode(true);
            return 'ultra-compact';
        } else {
            // Ultra-compact -> Normal
            this.setUltraCompactMode(false);
            this.setCompactMode(false);
            return 'normal';
        }
    }
    
    /**
     * Sets the ultra-compact mode
     * @param ultraCompact Whether to use ultra-compact mode
     */
    public setUltraCompactMode(ultraCompact: boolean): void {
        // Get the container element
        const container = document.querySelector('.vitals-container');
        if (!container) {
            console.warn('Vitals container not found');
            return;
        }
        
        // Set the ultra-compact class
        if (ultraCompact) {
            container.classList.add('ultra-compact');
            container.classList.add('compact'); // Ultra-compact includes compact
            container.setAttribute('style', 'width: 180px; padding: 5px; bottom: 10px; left: 10px; position: fixed; z-index: 1000;');
            
            // Hide gold label text in ultra-compact mode
            const goldLabel = document.querySelector('.gold-display .stat-label');
            if (goldLabel) {
                goldLabel.textContent = '';
            }
        } else {
            container.classList.remove('ultra-compact');
            // Don't remove compact class here, use setCompactMode for that
        }
    }
    
    /**
     * Sets the compact mode
     * @param compact Whether to use compact mode
     */
    public setCompactMode(compact: boolean): void {
        this.isCompact = compact;
        
        // Get the container element
        const container = document.querySelector('.vitals-container');
        if (!container) {
            console.warn('Vitals container not found');
            return;
        }
        
        // Check if we're in ultra-compact mode
        const isUltraCompact = container.classList.contains('ultra-compact');
        if (isUltraCompact) {
            // Don't change compact mode if we're in ultra-compact mode
            return;
        }
        
        // Set the compact class
        if (compact) {
            container.classList.add('compact');
            container.setAttribute('style', 'width: 280px; padding: 8px; bottom: 10px; left: 10px; position: fixed; z-index: 1000;');
            
            // Hide gold label text in compact mode
            const goldLabel = document.querySelector('.gold-display .stat-label');
            if (goldLabel) {
                goldLabel.textContent = '';
            }
        } else {
            container.classList.remove('compact');
            container.setAttribute('style', 'width: 350px; padding: 10px; bottom: 10px; left: 10px; position: fixed; z-index: 1000;');
            
            // Show gold label text in normal mode
            const goldLabel = document.querySelector('.gold-display .stat-label');
            if (goldLabel) {
                goldLabel.textContent = 'Gold';
            }
        }
    }
    
    /**
     * Gets the current compact mode state
     * @returns Whether compact mode is enabled
     */
    public isCompactMode(): boolean {
        return this.isCompact;
    }
    
    /**
     * Destroys the vitals UI and removes event listeners
     */
    public destroy(): void {
        // Remove update callback
        if (this.updateCallback) {
            this.scene.events.off('update', this.updateCallback);
            this.updateCallback = null;
        }
        
        // Remove event listeners
        this.scene.events.off('player-aggression-changed');
        this.scene.events.off('god-mode-changed');
        this.scene.events.off('player-level-up');
        this.scene.events.off('show-message');
        
        // Destroy vitals UI
        if (this.vitals) {
            this.vitals.destroy();
            this.vitals = null;
        }
    }
    
    /**
     * Updates all UI elements based on player stats
     */
    public updateUI(): void {
        // Get player stats
        const playerStats = (this.scene as any).playerStats;
        if (!playerStats || !this.vitals) return;
        
        this.vitals.updateHealthBar(playerStats.health, playerStats.maxHealth);
        this.vitals.updateXPBar(playerStats.xp, playerStats.xpToNextLevel);
        this.vitals.updateGoldDisplay(playerStats.gold);
    }
    
    /**
     * Updates the gold display with animation
     * @param gold New gold amount
     * @param animate Whether to animate the change
     */
    public updateGold(gold: number, animate: boolean = true): void {
        if (!this.vitals) return;
        
        // Update the gold display with animation
        this.vitals.updateGoldWithAnimation(gold, animate);
        
        // Also update the player stats if they exist
        const playerStats = (this.scene as any).playerStats;
        if (playerStats) {
            playerStats.gold = gold;
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