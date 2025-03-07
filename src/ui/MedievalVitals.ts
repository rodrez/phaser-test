import { Scene } from 'phaser';
import { DOMUIHelper } from './DOMUIHelper';

/**
 * MedievalVitals - A medieval-themed HTML/CSS overlay for player vitals
 * This class creates DOM elements for health, XP, gold, and aggression status
 * styled to match the medieval theme from popups.css
 */
export class MedievalVitals {
    private scene: Scene;
    private uiHelper: DOMUIHelper;
    private container: HTMLDivElement;
    private healthBar: HTMLDivElement;
    private healthFill: HTMLDivElement;
    private healthText: HTMLDivElement;
    private xpBar: HTMLDivElement;
    private xpFill: HTMLDivElement;
    private xpText: HTMLDivElement;
    private goldDisplay: HTMLDivElement;
    private goldText: HTMLDivElement;
    private aggressionIndicator: HTMLDivElement;
    private aggressionText: HTMLDivElement;
    private godModeIndicator: HTMLDivElement;
    
    private isAggressive: boolean = false;
    private isGodMode: boolean = false;
    
    constructor(scene: Scene) {
        this.scene = scene;
        this.uiHelper = new DOMUIHelper(scene);
        
        // Load the CSS file with absolute paths
        this.uiHelper.loadCSS('/styles/popups.css');
        this.uiHelper.loadCSS('/styles/medieval-vitals.css');
        
        // Create the main container
        this.createContainer();
        
        // Create UI elements
        this.createHealthBar();
        this.createXPBar();
        this.createGoldDisplay();
        this.createAggressionIndicator();
        this.createGodModeIndicator();
        
        // Add the container to the DOM
        document.body.appendChild(this.container);
        
        // Initial update
        this.updateUI();
    }
    
    /**
     * Creates the main container for all vitals elements
     */
    private createContainer(): void {
        // Determine if we're in ultra-compact mode
        const isUltraCompact = this.container?.classList.contains('ultra-compact') || false;
        
        this.container = this.uiHelper.createContainer(
            isUltraCompact ? 'custom-popup vitals-container ultra-compact' : 'custom-popup vitals-container compact',
            {
                position: 'fixed',
                bottom: '10px',
                left: '10px',
                width: isUltraCompact ? '180px' : '280px',
                padding: isUltraCompact ? '5px' : '8px',
                zIndex: '1000'
            }
        );
        
        // Add a title
        const title = this.uiHelper.createElement<HTMLHeadingElement>(
            'h3',
            'compact-title',
            {
                marginTop: isUltraCompact ? '0' : '2px',
                marginBottom: isUltraCompact ? '5px' : '8px',
                fontSize: isUltraCompact ? '12px' : '16px'
            },
            this.container
        );
        title.textContent = isUltraCompact ? 'Vitals' : 'Character Vitals';
    }
    
    /**
     * Creates the health bar element
     */
    private createHealthBar(): void {
        // Determine if we're in ultra-compact mode
        const isUltraCompact = this.container.classList.contains('ultra-compact');
        
        if (isUltraCompact) {
            // Create a horizontal layout for ultra-compact mode
            this.createUltraCompactHealthBar();
            return;
        }
        
        // Regular compact layout
        // Create stat row
        const { row, value: healthValue } = this.uiHelper.createStatRow(
            'HP',
            '100/100'
        );
        
        // Add compact styling
        row.style.marginBottom = '3px';
        row.style.paddingBottom = '2px';
        
        // Store reference to health text
        this.healthText = healthValue;
        
        // Create progress bar
        const { container, fill } = this.uiHelper.createProgressBar(
            'progress-bar',
            'progress-fill health',
            100,
            { height: '6px', marginBottom: '6px' }
        );
        
        // Store references
        this.healthBar = container;
        this.healthFill = fill;
        
        // Add to container
        this.container.appendChild(row);
        this.container.appendChild(container);
    }
    
    /**
     * Creates an ultra-compact health bar with horizontal layout
     */
    private createUltraCompactHealthBar(): void {
        // Create stat container
        const statContainer = this.uiHelper.createElement<HTMLDivElement>(
            'div',
            'stat-container',
            undefined,
            this.container
        );
        
        // Create stat info container
        const statInfo = this.uiHelper.createElement<HTMLDivElement>(
            'div',
            'stat-info',
            undefined,
            statContainer
        );
        
        // Create label
        const label = this.uiHelper.createElement<HTMLDivElement>(
            'div',
            'stat-label',
            undefined,
            statInfo
        );
        label.textContent = 'HP';
        
        // Create health text
        this.healthText = this.uiHelper.createElement<HTMLDivElement>(
            'div',
            'stat-value',
            undefined,
            statInfo
        );
        this.healthText.textContent = '100/100';
        
        // Create progress container
        const progressContainer = this.uiHelper.createElement<HTMLDivElement>(
            'div',
            'progress-container',
            undefined,
            statContainer
        );
        
        // Create progress bar
        const { container, fill } = this.uiHelper.createProgressBar(
            'progress-bar',
            'progress-fill health',
            100,
            { height: '4px', marginBottom: '0' }
        );
        
        // Store references
        this.healthBar = container;
        this.healthFill = fill;
        
        // Add to progress container
        progressContainer.appendChild(container);
    }
    
    /**
     * Creates the XP bar element
     */
    private createXPBar(): void {
        // Determine if we're in ultra-compact mode
        const isUltraCompact = this.container.classList.contains('ultra-compact');
        
        if (isUltraCompact) {
            // Create a horizontal layout for ultra-compact mode
            this.createUltraCompactXPBar();
            return;
        }
        
        // Regular compact layout
        // Create stat row
        const { row, value: xpValue } = this.uiHelper.createStatRow(
            'XP',
            '0/100'
        );
        
        // Add compact styling
        row.style.marginTop = '4px';
        row.style.marginBottom = '3px';
        row.style.paddingBottom = '2px';
        
        // Store reference to XP text
        this.xpText = xpValue;
        
        // Create progress bar
        const { container, fill } = this.uiHelper.createProgressBar(
            'progress-bar',
            'progress-fill',
            0,
            { height: '6px', marginBottom: '6px' }
        );
        
        // Set XP color
        fill.style.backgroundColor = '#706fd3'; // Purple color for XP
        
        // Store references
        this.xpBar = container;
        this.xpFill = fill;
        
        // Add to container
        this.container.appendChild(row);
        this.container.appendChild(container);
    }
    
    /**
     * Creates an ultra-compact XP bar with horizontal layout
     */
    private createUltraCompactXPBar(): void {
        // Create stat container
        const statContainer = this.uiHelper.createElement<HTMLDivElement>(
            'div',
            'stat-container',
            undefined,
            this.container
        );
        
        // Create stat info container
        const statInfo = this.uiHelper.createElement<HTMLDivElement>(
            'div',
            'stat-info',
            undefined,
            statContainer
        );
        
        // Create label
        const label = this.uiHelper.createElement<HTMLDivElement>(
            'div',
            'stat-label',
            undefined,
            statInfo
        );
        label.textContent = 'XP';
        
        // Create XP text
        this.xpText = this.uiHelper.createElement<HTMLDivElement>(
            'div',
            'stat-value',
            undefined,
            statInfo
        );
        this.xpText.textContent = '0/100';
        
        // Create progress container
        const progressContainer = this.uiHelper.createElement<HTMLDivElement>(
            'div',
            'progress-container',
            undefined,
            statContainer
        );
        
        // Create progress bar
        const { container, fill } = this.uiHelper.createProgressBar(
            'progress-bar',
            'progress-fill',
            0,
            { height: '4px', marginBottom: '0' }
        );
        
        // Set XP color
        fill.style.backgroundColor = '#706fd3'; // Purple color for XP
        
        // Store references
        this.xpBar = container;
        this.xpFill = fill;
        
        // Add to progress container
        progressContainer.appendChild(container);
    }
    
    /**
     * Creates the gold display element
     */
    private createGoldDisplay(): void {
        // Determine if we're in ultra-compact mode
        const isUltraCompact = this.container.classList.contains('ultra-compact');
        
        if (isUltraCompact) {
            // Create a simplified gold display for ultra-compact mode
            this.createUltraCompactGoldDisplay();
            return;
        }
        
        // Regular compact layout
        // Create stat row
        const { row, value: goldValue } = this.uiHelper.createStatRow(
            'Gold',
            '0'
        );
        
        // Add compact styling
        row.style.marginTop = '4px';
        row.style.marginBottom = '3px';
        row.style.paddingBottom = '2px';
        
        // Replace the default label with a custom gold display
        const goldLabel = row.firstChild as HTMLElement;
        if (goldLabel) {
            // Remove the default label
            row.removeChild(goldLabel);
            
            // Create a custom gold display container
            const goldDisplay = this.uiHelper.createElement<HTMLDivElement>(
                'div',
                'gold-display',
                undefined,
                row
            );
            
            // Insert it at the beginning of the row
            row.insertBefore(goldDisplay, row.firstChild);
            
            // Create gold icon
            const goldIcon = this.uiHelper.createElement<HTMLDivElement>(
                'div',
                'gold-icon',
                undefined,
                goldDisplay
            );
            
            // Create gold label
            const goldText = this.uiHelper.createElement<HTMLDivElement>(
                'div',
                'stat-label',
                undefined,
                goldDisplay
            );
            
            // Set text based on whether the container has the compact class
            const isCompact = this.container.classList.contains('compact');
            goldText.textContent = isCompact ? '' : 'Gold';
        }
        
        // Style the gold value
        goldValue.className = 'gold-value';
        
        // Store references
        this.goldDisplay = row;
        this.goldText = goldValue;
        
        // Add to container
        this.container.appendChild(row);
    }
    
    /**
     * Creates an ultra-compact gold display
     */
    private createUltraCompactGoldDisplay(): void {
        // Create stat container
        const statContainer = this.uiHelper.createElement<HTMLDivElement>(
            'div',
            'stat-container',
            undefined,
            this.container
        );
        
        // Create gold display
        const goldDisplay = this.uiHelper.createElement<HTMLDivElement>(
            'div',
            'gold-display',
            {
                display: 'flex',
                alignItems: 'center',
                marginRight: '5px'
            },
            statContainer
        );
        
        // Create gold icon
        const goldIcon = this.uiHelper.createElement<HTMLDivElement>(
            'div',
            'gold-icon',
            undefined,
            goldDisplay
        );
        
        // Create gold value
        this.goldText = this.uiHelper.createElement<HTMLDivElement>(
            'div',
            'gold-value',
            {
                marginLeft: '3px'
            },
            statContainer
        );
        this.goldText.textContent = '0';
        
        // Store reference to the container
        this.goldDisplay = statContainer;
    }
    
    /**
     * Creates the aggression indicator element
     */
    private createAggressionIndicator(): void {
        // Determine if we're in ultra-compact mode
        const isUltraCompact = this.container.classList.contains('ultra-compact');
        
        if (isUltraCompact) {
            // Create a simplified aggression indicator for ultra-compact mode
            this.createUltraCompactAggressionIndicator();
            return;
        }
        
        // Regular compact layout
        // Create stat row
        const { row, value } = this.uiHelper.createStatRow(
            'Mode',
            ''
        );
        
        // Add compact styling
        row.style.marginTop = '4px';
        row.style.marginBottom = '0';
        
        // Create indicator container
        const indicatorContainer = this.uiHelper.createContainer('', {
            display: 'flex',
            alignItems: 'center'
        });
        
        // Create circle indicator
        this.aggressionIndicator = this.uiHelper.createElement<HTMLDivElement>(
            'div',
            'combat-indicator-circle',
            {
                backgroundColor: '#27ae60' // Green for passive
            },
            indicatorContainer
        );
        
        // Create text indicator
        this.aggressionText = this.uiHelper.createElement<HTMLDivElement>(
            'div',
            'stat-value compact',
            {
                fontSize: '12px',
                marginLeft: '4px'
            },
            indicatorContainer
        );
        this.aggressionText.textContent = 'Passive';
        
        // Replace the empty value with our indicator
        value.replaceWith(indicatorContainer);
        
        // Add to container
        this.container.appendChild(row);
    }
    
    /**
     * Creates an ultra-compact aggression indicator
     */
    private createUltraCompactAggressionIndicator(): void {
        // Create stat container
        const statContainer = this.uiHelper.createElement<HTMLDivElement>(
            'div',
            'stat-container',
            {
                marginTop: '2px'
            },
            this.container
        );
        
        // Create label
        const label = this.uiHelper.createElement<HTMLDivElement>(
            'div',
            'stat-label',
            {
                marginRight: '5px'
            },
            statContainer
        );
        label.textContent = 'Mode';
        
        // Create indicator container
        const indicatorContainer = this.uiHelper.createContainer('', {
            display: 'flex',
            alignItems: 'center'
        });
        
        // Create circle indicator
        this.aggressionIndicator = this.uiHelper.createElement<HTMLDivElement>(
            'div',
            'combat-indicator-circle',
            {
                backgroundColor: '#27ae60' // Green for passive
            },
            indicatorContainer
        );
        
        // Create text indicator
        this.aggressionText = this.uiHelper.createElement<HTMLDivElement>(
            'div',
            'stat-value',
            {
                fontSize: '10px',
                marginLeft: '3px'
            },
            indicatorContainer
        );
        this.aggressionText.textContent = 'Passive';
        
        // Add to container
        statContainer.appendChild(indicatorContainer);
    }
    
    /**
     * Creates the god mode indicator element
     */
    private createGodModeIndicator(): void {
        this.godModeIndicator = this.uiHelper.createElement<HTMLDivElement>(
            'div',
            'action-btn god-mode-indicator',
            {
                position: 'fixed',
                top: '10px',
                right: '10px',
                backgroundColor: '#f0c070', // Gold color
                display: 'none' // Hidden by default
            }
        );
        this.godModeIndicator.textContent = 'GOD MODE';
        
        document.body.appendChild(this.godModeIndicator);
    }
    
    /**
     * Updates all UI elements based on player stats
     */
    public updateUI(): void {
        // Get player stats from the scene
        const playerStats = (this.scene as any).playerStats;
        if (!playerStats) return;
        
        this.updateHealthBar(playerStats.health, playerStats.maxHealth);
        this.updateXPBar(playerStats.xp, playerStats.xpToNextLevel);
        this.updateGoldDisplay(playerStats.gold);
    }
    
    /**
     * Updates the health bar display
     */
    public updateHealthBar(health: number, maxHealth: number): void {
        const healthPercent = Math.max(0, health / maxHealth);
        
        // Update fill width
        this.uiHelper.updateProgressBar(this.healthFill, healthPercent * 100);
        
        // Update text
        this.healthText.textContent = `${health}/${maxHealth}`;
        
        // Change color based on health percentage
        if (healthPercent > 0.6) {
            this.healthFill.style.backgroundColor = '#27ae60'; // Green
            this.healthFill.className = 'progress-fill health';
        } else if (healthPercent > 0.3) {
            this.healthFill.style.backgroundColor = '#f39c12'; // Yellow/Orange
            this.healthFill.className = 'progress-fill health';
        } else {
            this.healthFill.style.backgroundColor = '#c0392b'; // Red
            this.healthFill.className = 'progress-fill danger';
        }
    }
    
    /**
     * Updates the XP bar display
     */
    public updateXPBar(xp: number, xpToNextLevel: number): void {
        const xpPercent = Math.min(1, xp / xpToNextLevel);
        
        // Update fill width
        this.uiHelper.updateProgressBar(this.xpFill, xpPercent * 100);
        
        // Update text
        this.xpText.textContent = `${xp}/${xpToNextLevel}`;
    }
    
    /**
     * Updates the gold display with an animation effect
     * @param gold New gold amount
     * @param animate Whether to animate the change
     */
    public updateGoldWithAnimation(gold: number, animate: boolean = true): void {
        if (!animate) {
            // Simple update without animation
            this.updateGoldDisplay(gold);
            return;
        }
        
        // Get current gold amount
        const currentGold = parseInt(this.goldText.textContent || '0');
        
        // Calculate difference
        const diff = gold - currentGold;
        
        if (diff === 0) return;
        
        // Create a floating indicator for the gold change
        const indicator = this.uiHelper.createElement<HTMLDivElement>(
            'div',
            `gold-change-indicator ${diff > 0 ? 'positive' : 'negative'}`,
            undefined,
            this.goldDisplay
        );
        
        // Set the indicator text
        indicator.textContent = diff > 0 ? `+${diff}` : `${diff}`;
        
        // Add the changing class to the gold value for pulse animation
        this.goldText.classList.add('changing');
        
        // Update gold icon to show pile for large amounts
        const goldIcon = this.goldDisplay.querySelector('.gold-icon');
        if (goldIcon && gold >= 1000) {
            goldIcon.classList.add('pile');
        } else if (goldIcon) {
            goldIcon.classList.remove('pile');
        }
        
        // Animate the gold value change
        let current = currentGold;
        const step = Math.ceil(Math.abs(diff) / 20); // Divide the change into steps
        const interval = setInterval(() => {
            if (diff > 0) {
                current = Math.min(current + step, gold);
            } else {
                current = Math.max(current - step, gold);
            }
            
            this.goldText.textContent = current.toString();
            
            if (current === gold) {
                clearInterval(interval);
                
                // Remove the changing class after animation
                setTimeout(() => {
                    this.goldText.classList.remove('changing');
                }, 500);
            }
        }, 50);
        
        // Remove the indicator after animation (it will animate out via CSS)
        setTimeout(() => {
            if (indicator.parentNode) {
                indicator.parentNode.removeChild(indicator);
            }
        }, 1000);
    }
    
    /**
     * Updates the gold display
     */
    public updateGoldDisplay(gold: number): void {
        this.goldText.textContent = gold.toString();
    }
    
    /**
     * Toggles the aggression state
     */
    public toggleAggression(): void {
        this.setAggression(!this.isAggressive);
    }
    
    /**
     * Sets the aggression state
     */
    public setAggression(isAggressive: boolean): void {
        this.isAggressive = isAggressive;
        this.updateAggressionIndicator();
    }
    
    /**
     * Updates the aggression indicator display
     */
    private updateAggressionIndicator(): void {
        if (this.isAggressive) {
            this.aggressionIndicator.style.backgroundColor = '#c0392b'; // Red for aggressive
            this.aggressionText.textContent = 'Aggressive';
        } else {
            this.aggressionIndicator.style.backgroundColor = '#27ae60'; // Green for passive
            this.aggressionText.textContent = 'Passive';
        }
    }
    
    /**
     * Sets the god mode state
     */
    public setGodMode(enabled: boolean): void {
        this.isGodMode = enabled;
        this.godModeIndicator.style.display = enabled ? 'block' : 'none';
    }
    
    /**
     * Shows a message notification
     */
    public showMessage(message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info', duration: number = 3000): void {
        // Create message container
        const messageContainer = this.uiHelper.createContainer('custom-popup message-popup', {
            position: 'fixed',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '10px 20px',
            zIndex: '1001',
            textAlign: 'center'
        });
        
        // Set color based on message type
        switch (type) {
            case 'success':
                messageContainer.style.borderColor = '#27ae60';
                break;
            case 'warning':
                messageContainer.style.borderColor = '#f39c12';
                break;
            case 'error':
                messageContainer.style.borderColor = '#c0392b';
                break;
            default: // info
                messageContainer.style.borderColor = '#3498db';
                break;
        }
        
        // Set message text
        messageContainer.textContent = message;
        
        // Add to DOM
        document.body.appendChild(messageContainer);
        
        // Remove after duration
        setTimeout(() => {
            document.body.removeChild(messageContainer);
        }, duration);
    }
    
    /**
     * Shows a level up notification
     */
    public showLevelUpNotification(level: number): void {
        // Create level up container
        const levelUpContainer = this.uiHelper.createContainer('custom-popup level-up-notification', {
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            padding: '20px',
            zIndex: '1002',
            textAlign: 'center'
        });
        
        // Add title
        const title = this.uiHelper.createElement<HTMLHeadingElement>(
            'h3',
            '',
            undefined,
            levelUpContainer
        );
        title.textContent = 'Level Up!';
        
        // Add message
        const message = this.uiHelper.createElement<HTMLDivElement>(
            'div',
            '',
            { marginBottom: '15px' },
            levelUpContainer
        );
        message.textContent = `You have reached level ${level}!`;
        
        // Add close button
        const closeButton = this.uiHelper.createButton(
            'Continue',
            'action-btn',
            () => {
                document.body.removeChild(levelUpContainer);
            }
        );
        levelUpContainer.appendChild(closeButton);
        
        // Add to DOM
        document.body.appendChild(levelUpContainer);
    }
    
    /**
     * Destroys the vitals UI
     */
    public destroy(): void {
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
        
        if (this.godModeIndicator && this.godModeIndicator.parentNode) {
            this.godModeIndicator.parentNode.removeChild(this.godModeIndicator);
        }
    }
} 