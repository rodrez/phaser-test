import { Scene } from 'phaser';
import { BaseMonster } from './BaseMonster';
import { PopupSystem, PopupContent, PopupOptions } from '../PopupSystem';
import { MonsterBehavior } from './MonsterTypes';

/**
 * MonsterPopupSystem - Handles displaying information popups for monsters
 */
export class MonsterPopupSystem {
    private scene: Scene;
    private popupSystem: PopupSystem;
    private activeMonsterPopup: HTMLElement | null = null;
    private clickTarget: BaseMonster | null = null;

    constructor(scene: Scene, popupSystem: PopupSystem) {
        this.scene = scene;
        this.popupSystem = popupSystem;
        
        // Set up click interaction on monsters
        this.setupMonsterInteraction();
    }
    
    /**
     * Sets up input handling for monster interactions
     */
    private setupMonsterInteraction(): void {
        console.log("Setting up monster interaction in MonsterPopupSystem");
        
        // Add pointer down event to the scene's input manager
        this.scene.input.on('gameobjectdown', (pointer: Phaser.Input.Pointer, gameObject: any) => {
            console.log("Clicked on object:", gameObject);
            
            // Check if the clicked object is a monster
            if (gameObject instanceof BaseMonster) {
                console.log("Clicked on monster:", gameObject.monsterName);
                this.showMonsterPopup(gameObject, pointer.worldX, pointer.worldY);
            }
        });
        
        // Alternative approach: add direct click handlers to all monsters
        const scene = this.scene as any;
        if (scene.monsterSystem && scene.monsterSystem.getMonsters) {
            const monsters = scene.monsterSystem.getMonsters();
            console.log(`Adding click handlers to ${monsters.length} monsters`);
            
            monsters.forEach((monster: BaseMonster) => {
                monster.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
                    console.log(`Direct click on monster: ${monster.monsterName}`);
                    this.showMonsterPopup(monster, pointer.worldX, pointer.worldY);
                });
            });
        }
    }
    
    /**
     * Shows a popup with monster information and interaction options
     */
    public showMonsterPopup(monster: BaseMonster, x: number, y: number): void {
        // Close any existing popup
        this.closeMonsterPopup();
        
        // Store reference to clicked monster
        this.clickTarget = monster;
        
        // Get behavior description
        const behaviorDescription = this.getBehaviorDescription(monster.behavior);
        
        // Create HTML content for the popup
        const content: PopupContent = {
            html: `
                <div class="monster-popup">
                    <h3>${monster.monsterName}</h3>
                    <div class="monster-stats">
                        <div class="stat-row">
                            <span class="stat-label">Health:</span>
                            <span class="stat-value">${monster.attributes.health}/${monster.attributes.maxHealth}</span>
                        </div>
                        <div class="stat-row">
                            <span class="stat-label">Behavior:</span>
                            <span class="stat-value">${behaviorDescription}</span>
                        </div>
                        <div class="stat-row">
                            <span class="stat-label">State:</span>
                            <span class="stat-value">${this.formatState(monster.currentState)}</span>
                        </div>
                    </div>
                    <div class="monster-actions">
                        <button class="monster-action-btn attack-btn" id="attack-monster-btn">Attack</button>
                        <button class="monster-action-btn info-btn" id="monster-info-btn">More Info</button>
                    </div>
                </div>
            `,
            buttons: [
                {
                    selector: '#attack-monster-btn',
                    onClick: () => this.attackMonster(monster)
                },
                {
                    selector: '#monster-info-btn',
                    onClick: () => this.showDetailedMonsterInfo(monster)
                }
            ]
        };
        
        // Configure popup options
        const options: PopupOptions = {
            className: 'monster-popup-container',
            closeButton: true,
            width: 280,
            offset: { x: 10, y: 10 },
            zIndex: 1000
        };
        
        // Create the popup
        this.activeMonsterPopup = this.popupSystem.createPopupAtScreenPosition(x, y, content, options);
    }
    
    /**
     * Closes the active monster popup
     */
    public closeMonsterPopup(): void {
        if (this.activeMonsterPopup) {
            this.popupSystem.closePopup(this.activeMonsterPopup);
            this.activeMonsterPopup = null;
            this.clickTarget = null;
        }
    }
    
    /**
     * Handles attacking the monster
     */
    private attackMonster(monster: BaseMonster): void {
        // Close the popup
        this.closeMonsterPopup();
        
        // Use combat system if available
        const scene = this.scene as any;
        if (scene.combatSystem) {
            scene.combatSystem.playerAttackMonster(monster);
        } else {
            // Fallback for backward compatibility
            monster.takeDamage(10); // Deal 10 damage to the monster
        }
        
        // Show feedback
        if (scene.uiSystem) {
            scene.uiSystem.showMessage(`Attacking ${monster.monsterName}!`, 'info', 2000);
        }
    }
    
    /**
     * Shows detailed monster information
     */
    private showDetailedMonsterInfo(monster: BaseMonster): void {
        // We'll replace the current popup content with more detailed information
        if (!this.activeMonsterPopup) return;
        
        // Get loot table as formatted string
        const lootTableHtml = monster.lootTable.map(loot => 
            `<div class="loot-item">
                <span>${loot.itemId}</span>
                <span>${loot.minQuantity}-${loot.maxQuantity}</span>
                <span>${Math.round(loot.dropChance * 100)}%</span>
            </div>`
        ).join('');
        
        // Create new content with detailed info
        const detailedContent: PopupContent = {
            html: `
                <div class="monster-popup detailed">
                    <h3>${monster.monsterName} Details</h3>
                    <div class="monster-stats detailed">
                        <div class="stat-section">
                            <h4>Combat Stats</h4>
                            <div class="stat-row">
                                <span class="stat-label">Health:</span>
                                <span class="stat-value">${monster.attributes.health}/${monster.attributes.maxHealth}</span>
                            </div>
                            <div class="stat-row">
                                <span class="stat-label">Damage:</span>
                                <span class="stat-value">${monster.attributes.damage}</span>
                            </div>
                            <div class="stat-row">
                                <span class="stat-label">Defense:</span>
                                <span class="stat-value">${monster.attributes.defense}</span>
                            </div>
                            <div class="stat-row">
                                <span class="stat-label">Speed:</span>
                                <span class="stat-value">${monster.attributes.speed}</span>
                            </div>
                        </div>
                        <div class="stat-section">
                            <h4>Potential Loot</h4>
                            <div class="loot-table">
                                <div class="loot-header">
                                    <span>Item</span>
                                    <span>Quantity</span>
                                    <span>Chance</span>
                                </div>
                                ${lootTableHtml}
                            </div>
                        </div>
                    </div>
                    <div class="monster-actions">
                        <button class="monster-action-btn attack-btn" id="attack-monster-btn-2">Attack</button>
                        <button class="monster-action-btn back-btn" id="back-btn">Back</button>
                    </div>
                </div>
            `,
            buttons: [
                {
                    selector: '#attack-monster-btn-2',
                    onClick: () => this.attackMonster(monster)
                },
                {
                    selector: '#back-btn',
                    onClick: () => {
                        // Go back to the basic info view
                        if (this.clickTarget) {
                            const position = this.clickTarget.getCenter();
                            this.showMonsterPopup(this.clickTarget, position.x, position.y);
                        }
                    }
                }
            ]
        };
        
        // Update the popup content
        this.popupSystem.updatePopupContent(this.activeMonsterPopup, detailedContent);
    }
    
    /**
     * Gets a human-readable description of the monster's behavior
     */
    private getBehaviorDescription(behavior: MonsterBehavior): string {
        switch (behavior) {
            case MonsterBehavior.PASSIVE:
                return "Peaceful, flees when attacked";
            case MonsterBehavior.NEUTRAL:
                return "Peaceful, will defend itself";
            case MonsterBehavior.AGGRESSIVE:
                return "Aggressive, attacks on sight";
            case MonsterBehavior.TERRITORIAL:
                return "Defends territory";
            default:
                return "Unknown";
        }
    }
    
    /**
     * Formats the monster state for display
     */
    private formatState(state: string): string {
        // Convert snake_case to Title Case
        return state.split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    }
    
    /**
     * Updates the monster popup if the monster is still visible and selected
     */
    public update(): void {
        // If we have an active popup and monster, update it
        if (this.activeMonsterPopup && this.clickTarget && this.clickTarget.active) {
            // Update only the dynamic content (like health)
            const healthElement = this.activeMonsterPopup.querySelector('.monster-stats .stat-value');
            if (healthElement) {
                healthElement.textContent = `${this.clickTarget.attributes.health}/${this.clickTarget.attributes.maxHealth}`;
            }
            
            // Update state if present
            const stateElement = this.activeMonsterPopup.querySelector('.monster-stats .stat-value:nth-child(2)');
            if (stateElement) {
                stateElement.textContent = this.formatState(this.clickTarget.currentState);
            }
        } else if (this.activeMonsterPopup && (!this.clickTarget || !this.clickTarget.active)) {
            // If the monster is no longer active, close the popup
            this.closeMonsterPopup();
        }
    }
}