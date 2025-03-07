import { Scene } from 'phaser';
import { MedievalVitalsIntegration } from './MedievalVitalsIntegration';

/**
 * Example scene showing how to use the medieval vitals UI
 */
export class MedievalVitalsExample extends Scene {
    private vitalsUI!: MedievalVitalsIntegration;
    private player!: Phaser.Physics.Arcade.Sprite;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private playerStats: any = {
        health: 100,
        maxHealth: 100,
        xp: 0,
        xpToNextLevel: 100,
        gold: 0,
        level: 1
    };
    private isAggressive: boolean = false;
    private godMode: boolean = false;
    private buttonContainer: HTMLDivElement | null = null;
    
    constructor() {
        super({ key: 'MedievalVitalsExample' });
    }
    
    preload(): void {
        // Load player sprite
        this.load.image('player', 'assets/player.png');
        
        // Load CSS files (can also be done in the MedievalVitals class)
        const link1 = document.createElement('link');
        link1.rel = 'stylesheet';
        link1.href = '/styles/popups.css';
        document.head.appendChild(link1);
        
        const link2 = document.createElement('link');
        link2.rel = 'stylesheet';
        link2.href = '/styles/medieval-vitals.css';
        document.head.appendChild(link2);
    }
    
    create(): void {
        // Create a simple background
        this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x3a5e52)
            .setOrigin(0, 0);
        
        // Create player
        this.player = this.physics.add.sprite(
            this.scale.width / 2,
            this.scale.height / 2,
            'player'
        );
        this.player.setCollideWorldBounds(true);
        
        // Initialize the medieval vitals UI
        this.vitalsUI = new MedievalVitalsIntegration(this);
        this.vitalsUI.initialize();
        
        // Show welcome message
        this.vitalsUI.showMessage('Welcome to the Medieval Vitals Example!', 'info', 5000);
        
        // Add test buttons
        this.createTestButtons();
        
        // Set up keyboard controls
        this.setupControls();
    }
    
    /**
     * Creates test buttons for demonstrating UI features
     */
    private createTestButtons(): void {
        // Create button container
        const buttonContainer = document.createElement('div');
        buttonContainer.style.position = 'fixed';
        buttonContainer.style.bottom = '10px';
        buttonContainer.style.right = '10px';
        buttonContainer.style.display = 'flex';
        buttonContainer.style.flexDirection = 'column';
        buttonContainer.style.gap = '10px';
        
        // Take damage button
        const damageButton = document.createElement('button');
        damageButton.className = 'action-btn danger-btn';
        damageButton.textContent = 'Take Damage';
        damageButton.onclick = () => this.takeDamage(10);
        buttonContainer.appendChild(damageButton);
        
        // Heal button
        const healButton = document.createElement('button');
        healButton.className = 'action-btn success-btn';
        healButton.textContent = 'Heal';
        healButton.onclick = () => this.heal(20);
        buttonContainer.appendChild(healButton);
        
        // Gain XP button
        const xpButton = document.createElement('button');
        xpButton.className = 'action-btn info-btn';
        xpButton.textContent = 'Gain XP';
        xpButton.onclick = () => this.gainXP(25);
        buttonContainer.appendChild(xpButton);
        
        // Gain Gold button
        const goldButton = document.createElement('button');
        goldButton.className = 'action-btn';
        goldButton.textContent = 'Gain Gold';
        goldButton.style.backgroundColor = '#f0c070';
        goldButton.onclick = () => this.gainGold(50);
        buttonContainer.appendChild(goldButton);
        
        // Toggle Aggression button
        const aggressionButton = document.createElement('button');
        aggressionButton.className = 'action-btn attack-btn';
        aggressionButton.textContent = 'Toggle Combat Mode';
        aggressionButton.onclick = () => this.toggleAggression();
        buttonContainer.appendChild(aggressionButton);
        
        // Toggle God Mode button
        const godModeButton = document.createElement('button');
        godModeButton.className = 'action-btn teleport-btn';
        godModeButton.textContent = 'Toggle God Mode';
        godModeButton.onclick = () => this.toggleGodMode();
        buttonContainer.appendChild(godModeButton);
        
        // Cycle UI Mode button
        const uiModeButton = document.createElement('button');
        uiModeButton.className = 'action-btn';
        uiModeButton.textContent = 'Cycle UI Mode';
        uiModeButton.style.backgroundColor = '#3498db';
        uiModeButton.onclick = () => this.cycleUIMode();
        buttonContainer.appendChild(uiModeButton);
        
        // Add to DOM
        document.body.appendChild(buttonContainer);
        
        // Store reference for cleanup
        this.buttonContainer = buttonContainer;
    }
    
    /**
     * Sets up keyboard controls for the player
     */
    private setupControls(): void {
        // Create cursor keys
        this.cursors = this.input.keyboard.createCursorKeys();
    }
    
    update(): void {
        // Handle player movement
        if (!this.cursors) return;
        
        const speed = 200;
        
        if (this.cursors.left.isDown) {
            this.player.setVelocityX(-speed);
        } else if (this.cursors.right.isDown) {
            this.player.setVelocityX(speed);
        } else {
            this.player.setVelocityX(0);
        }
        
        if (this.cursors.up.isDown) {
            this.player.setVelocityY(-speed);
        } else if (this.cursors.down.isDown) {
            this.player.setVelocityY(speed);
        } else {
            this.player.setVelocityY(0);
        }
    }
    
    /**
     * Makes the player take damage
     * @param amount Amount of damage to take
     */
    private takeDamage(amount: number): void {
        // Reduce health
        this.playerStats.health = Math.max(0, this.playerStats.health - amount);
        
        // Show message
        this.vitalsUI.showMessage(`Took ${amount} damage!`, 'error');
        
        // Check for death
        if (this.playerStats.health <= 0) {
            this.vitalsUI.showMessage('You died!', 'error', 5000);
            
            // Respawn after a delay
            this.time.delayedCall(2000, () => {
                this.playerStats.health = this.playerStats.maxHealth;
                this.vitalsUI.showMessage('Respawned!', 'info');
            });
        }
    }
    
    /**
     * Heals the player
     * @param amount Amount to heal
     */
    private heal(amount: number): void {
        // Increase health
        const oldHealth = this.playerStats.health;
        this.playerStats.health = Math.min(this.playerStats.maxHealth, this.playerStats.health + amount);
        
        // Calculate actual healing done
        const healingDone = this.playerStats.health - oldHealth;
        
        // Show message
        this.vitalsUI.showMessage(`Healed for ${healingDone} health!`, 'success');
    }
    
    /**
     * Gives the player XP
     * @param amount Amount of XP to give
     */
    private gainXP(amount: number): void {
        // Add XP
        this.playerStats.xp += amount;
        
        // Show message
        this.vitalsUI.showMessage(`Gained ${amount} XP!`, 'info');
        
        // Check for level up
        if (this.playerStats.xp >= this.playerStats.xpToNextLevel) {
            // Level up
            this.playerStats.level++;
            this.playerStats.xp -= this.playerStats.xpToNextLevel;
            this.playerStats.xpToNextLevel = Math.floor(this.playerStats.xpToNextLevel * 1.5);
            this.playerStats.maxHealth += 20;
            this.playerStats.health = this.playerStats.maxHealth;
            
            // Show level up notification
            this.vitalsUI.showLevelUpNotification(this.playerStats.level);
            
            // Emit level up event
            this.events.emit('player-level-up', this.playerStats.level);
        }
    }
    
    /**
     * Gives the player gold
     * @param amount Amount of gold to give
     */
    private gainGold(amount: number): void {
        // Add gold
        this.playerStats.gold += amount;
        
        // Update UI with animation
        this.vitalsUI.updateGold(this.playerStats.gold, true);
        
        // Show message
        this.vitalsUI.showMessage(`Found ${amount} gold!`, 'success');
    }
    
    /**
     * Toggles the player's aggression state
     */
    private toggleAggression(): void {
        // Toggle aggression
        this.vitalsUI.toggleAggression();
        
        // Toggle and store new state
        this.isAggressive = !this.isAggressive;
        
        // Emit event
        this.events.emit('player-aggression-changed', this.isAggressive);
        
        // Show message
        const state = this.isAggressive ? 'Aggressive' : 'Passive';
        this.vitalsUI.showMessage(`Combat Mode: ${state}`, 'info');
    }
    
    /**
     * Toggles god mode
     */
    private toggleGodMode(): void {
        // Toggle god mode
        this.godMode = !this.godMode;
        
        // Update UI
        this.vitalsUI.setGodMode(this.godMode);
        
        // Emit event
        this.events.emit('god-mode-changed', this.godMode);
        
        // Show message
        const state = this.godMode ? 'Enabled' : 'Disabled';
        this.vitalsUI.showMessage(`God Mode: ${state}`, this.godMode ? 'success' : 'info');
    }
    
    /**
     * Cycles through UI display modes (normal, compact, ultra-compact)
     */
    private cycleUIMode(): void {
        // Use the integration class to cycle through display modes
        const newMode = this.vitalsUI.cycleDisplayMode();
        
        // Show a message
        this.vitalsUI.showMessage(`UI Mode: ${newMode}`, 'info');
    }
    
    shutdown(): void {
        // Clean up button container
        if (this.buttonContainer && this.buttonContainer.parentNode) {
            this.buttonContainer.parentNode.removeChild(this.buttonContainer);
        }
        
        // Destroy vitals UI
        if (this.vitalsUI) {
            this.vitalsUI.destroy();
        }
    }
}