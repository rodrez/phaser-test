import { Scene } from 'phaser';

export class UISystem {
    private scene: Scene;
    private vitalsContainer: Phaser.GameObjects.Container;
    private vitalsBackground: Phaser.GameObjects.Rectangle;
    
    // UI Elements
    private healthBar: {
        background: Phaser.GameObjects.Rectangle;
        fill: Phaser.GameObjects.Rectangle;
        text: Phaser.GameObjects.Text;
    };
    
    private xpBar: {
        background: Phaser.GameObjects.Rectangle;
        fill: Phaser.GameObjects.Rectangle;
        text: Phaser.GameObjects.Text;
    };
    
    private goldDisplay: {
        icon: Phaser.GameObjects.Sprite;
        text: Phaser.GameObjects.Text;
    };
    
    private aggressionIndicator: {
        circle: Phaser.GameObjects.Arc;
        text: Phaser.GameObjects.Text;
    };
    
    private isAggressive: boolean = false;
    
    constructor(scene: Scene) {
        this.scene = scene;
        
        // Create a container for all UI elements
        this.vitalsContainer = this.scene.add.container(10, 10);
        this.vitalsContainer.setScrollFactor(0); // Fix UI to camera
        this.vitalsContainer.setDepth(1000); // Ensure UI is on top
        
        // Create background for vitals
        this.createVitalsBackground();
        
        // Initialize UI elements
        this.createHealthBar();
        this.createXPBar();
        this.createGoldDisplay();
        this.createAggressionIndicator();
        
        // Update the UI initially
        this.updateUI();
    }
    
    /**
     * Create a semi-transparent background for the vitals panel
     */
    private createVitalsBackground(): void {
        // Calculate dimensions to cover all vitals elements
        // Width: enough for bars + text (around 350px)
        // Height: enough for all elements plus some padding (around 85px)
        const width = 350;
        const height = 85;
        
        // Create background with brownish color and semi-transparency
        this.vitalsBackground = this.scene.add.rectangle(0, 0, width, height, 0x8B4513, 0.7);
        this.vitalsBackground.setOrigin(0, 0);
        this.vitalsBackground.setStrokeStyle(2, 0x483C32);
        // Rectangle doesn't support rounded corners in Phaser by default
        
        // Add to container (must be added first to be behind other elements)
        this.vitalsContainer.add(this.vitalsBackground);
    }
    
    /**
     * Create the health bar UI element
     */
    private createHealthBar(): void {
        // Health bar background
        const background = this.scene.add.rectangle(10, 10, 200, 20, 0x000000);
        background.setOrigin(0, 0);
        background.setStrokeStyle(1, 0xffffff);
        
        // Health bar fill
        const fill = this.scene.add.rectangle(12, 12, 196, 16, 0xff0000);
        fill.setOrigin(0, 0);
        
        // Health text
        const text = this.scene.add.text(220, 12, 'HP: 100/100', { 
            fontFamily: 'Arial', 
            fontSize: '16px',
            color: '#ffffff'
        });
        
        // Add elements to container
        this.vitalsContainer.add([background, fill, text]);
        
        this.healthBar = { background, fill, text };
    }
    
    /**
     * Create the XP bar UI element
     */
    private createXPBar(): void {
        // XP bar background
        const background = this.scene.add.rectangle(10, 35, 200, 20, 0x000000);
        background.setOrigin(0, 0);
        background.setStrokeStyle(1, 0xffffff);
        
        // XP bar fill
        const fill = this.scene.add.rectangle(12, 37, 196, 16, 0x0000ff);
        fill.setOrigin(0, 0);
        
        // XP text
        const text = this.scene.add.text(220, 37, 'XP: 0/100', { 
            fontFamily: 'Arial', 
            fontSize: '16px',
            color: '#ffffff'
        });
        
        // Add elements to container
        this.vitalsContainer.add([background, fill, text]);
        
        this.xpBar = { background, fill, text };
    }
    
    /**
     * Create the gold display UI element
     */
    private createGoldDisplay(): void {
        // Gold icon (placeholder until you have a gold coin sprite)
        const icon = this.scene.add.sprite(20, 70, 'player');
        icon.setDisplaySize(20, 20);
        icon.setTint(0xFFD700); // Gold color
        
        // Gold text
        const text = this.scene.add.text(50, 62, 'Gold: 0', { 
            fontFamily: 'Arial', 
            fontSize: '16px',
            color: '#ffffff'
        });
        
        // Add elements to container
        this.vitalsContainer.add([icon, text]);
        
        this.goldDisplay = { icon, text };
    }
    
    /**
     * Create the aggression indicator UI element
     */
    private createAggressionIndicator(): void {
        // Aggression circle
        const circle = this.scene.add.circle(290, 62, 10, 0x00ff00);
        circle.setStrokeStyle(1, 0xffffff);
        
        // Aggression text
        const text = this.scene.add.text(310, 52, 'Passive', { 
            fontFamily: 'Arial', 
            fontSize: '16px',
            color: '#ffffff'
        });
        
        // Add elements to container
        this.vitalsContainer.add([circle, text]);
        
        this.aggressionIndicator = { circle, text };
    }
    
    /**
     * Update all UI elements based on player stats
     */
    public updateUI(): void {
        // Get player stats
        const playerStats = (this.scene as any).playerStats;
        if (!playerStats) return;
        
        this.updateHealthBar(playerStats.health, playerStats.maxHealth);
        this.updateXPBar(playerStats.xp, playerStats.xpToNextLevel);
        this.updateGoldDisplay(playerStats.gold);
        // Aggression state would typically be controlled elsewhere
    }
    
    /**
     * Update health bar display
     */
    private updateHealthBar(health: number, maxHealth: number): void {
        const healthPercent = Math.max(0, health / maxHealth);
        
        // Update bar width
        this.healthBar.fill.width = 196 * healthPercent;
        
        // Update text
        this.healthBar.text.setText(`HP: ${health}/${maxHealth}`);
        
        // Change color based on health percentage
        if (healthPercent > 0.6) {
            this.healthBar.fill.setFillStyle(0x00ff00); // Green
        } else if (healthPercent > 0.3) {
            this.healthBar.fill.setFillStyle(0xffff00); // Yellow
        } else {
            this.healthBar.fill.setFillStyle(0xff0000); // Red
        }
    }
    
    /**
     * Update XP bar display
     */
    private updateXPBar(xp: number, xpToNextLevel: number): void {
        const xpPercent = Math.min(1, xp / xpToNextLevel);
        
        // Update bar width
        this.xpBar.fill.width = 196 * xpPercent;
        
        // Update text
        this.xpBar.text.setText(`XP: ${xp}/${xpToNextLevel}`);
    }
    
    /**
     * Update gold display
     */
    private updateGoldDisplay(gold: number): void {
        this.goldDisplay.text.setText(`Gold: ${gold}`);
    }
    
    /**
     * Toggle player aggression state
     */
    public toggleAggression(): void {
        this.isAggressive = !this.isAggressive;
        this.updateAggressionIndicator();
    }
    
    /**
     * Set player aggression state
     */
    public setAggression(isAggressive: boolean): void {
        this.isAggressive = isAggressive;
        this.updateAggressionIndicator();
    }
    
    /**
     * Update aggression indicator based on current state
     */
    private updateAggressionIndicator(): void {
        if (this.isAggressive) {
            this.aggressionIndicator.circle.setFillStyle(0xff0000); // Red for aggressive
            this.aggressionIndicator.text.setText('Aggressive');
        } else {
            this.aggressionIndicator.circle.setFillStyle(0x00ff00); // Green for passive
            this.aggressionIndicator.text.setText('Passive');
        }
    }
    
    /**
     * Show a temporary message notification
     * @param message The message to display
     * @param type The type of message ('info', 'success', 'warning', 'error')
     * @param duration How long to show the message in milliseconds (default: 3000ms)
     */
    public showMessage(message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info', duration: number = 3000): void {
        // Define colors for different message types
        const colors = {
            info: 0x2196F3,     // Blue
            success: 0x4CAF50,  // Green
            warning: 0xFF9800,  // Orange
            error: 0xF44336     // Red
        };
        
        // Create container for the message at the bottom center of the screen
        const { width, height } = this.scene.scale;
        const messageContainer = this.scene.add.container(width / 2, height - 100);
        messageContainer.setDepth(2000); // Above everything
        messageContainer.setScrollFactor(0); // Fixed to camera
        
        // Create background
        const padding = 20;
        const textStyle = { 
            fontFamily: 'Arial', 
            fontSize: '18px',
            color: '#ffffff',
            align: 'center'
        };
        
        // Measure text width
        const tempText = this.scene.add.text(0, 0, message, textStyle);
        const textWidth = tempText.width;
        tempText.destroy();
        
        // Create background with proper width
        const background = this.scene.add.rectangle(
            0, 
            0, 
            textWidth + (padding * 2), 
            40, 
            colors[type], 
            0.9
        );
        background.setStrokeStyle(2, 0xFFFFFF);
        
        // Create text
        const text = this.scene.add.text(0, 0, message, textStyle);
        text.setOrigin(0.5, 0.5);
        
        // Add to container
        messageContainer.add([background, text]);
        
        // Animate in
        messageContainer.setAlpha(0);
        this.scene.tweens.add({
            targets: messageContainer,
            alpha: 1,
            y: height - 120,
            duration: 300,
            ease: 'Power2',
            onComplete: () => {
                // After showing, animate out after duration
                this.scene.time.delayedCall(duration, () => {
                    this.scene.tweens.add({
                        targets: messageContainer,
                        alpha: 0,
                        y: height - 100,
                        duration: 300,
                        ease: 'Power2',
                        onComplete: () => {
                            messageContainer.destroy();
                        }
                    });
                });
            }
        });
    }
}
