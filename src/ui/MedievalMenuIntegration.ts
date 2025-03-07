import type { Scene } from 'phaser';
import { MedievalMenu } from './MedievalMenu';
import type { Game } from '../scenes/Game';
import type { MainMenu } from '../scenes/MainMenu';

/**
 * MedievalMenuIntegration - Integrates the MedievalMenu UI with the main game
 * This class serves as a bridge between the Game scene and the MedievalMenu UI
 */
export class MedievalMenuIntegration {
    private scene: Scene;
    private menu: MedievalMenu | null = null;
    private gameScene: Game;
    
    constructor(scene: Scene) {
        this.scene = scene;
        this.gameScene = scene as Game;
    }
    
    /**
     * Initializes the medieval menu UI
     */
    public initialize(): void {
        console.log('[MedievalMenuIntegration] Initializing medieval menu UI');
        
        // Create the medieval menu UI
        this.menu = new MedievalMenu(this.scene, {
            position: 'left',
            orientation: 'vertical',
            showIcons: true,
            width: '200px'
        });
        
        console.log('[MedievalMenuIntegration] Medieval menu created');
        
        // Set up menu item click handlers
        this.setupMenuHandlers();
        
        // Set up event listeners for the game
        this.setupEventListeners();
        
        // Hide the menu initially (can be toggled with a key)
        this.menu.hide();
        
        console.log('[MedievalMenuIntegration] Menu initialization complete');
    }
    
    /**
     * Sets up click handlers for menu items
     */
    private setupMenuHandlers(): void {
        console.log('[MedievalMenuIntegration] Setting up menu handlers');
        
        if (!this.menu) {
            console.error('[MedievalMenuIntegration] Cannot set up handlers: menu is null');
            return;
        }
        
        // Inventory
        this.menu.setClickHandler('inventory', () => {
            console.log('[MedievalMenuIntegration] Inventory clicked, opening inventory');
            this.gameScene.openInventory();
        });
        
        // Communication
        this.menu.setClickHandler('communication', () => {
            console.log('[MedievalMenuIntegration] Communication clicked');
            this.showMessage('Communication system not implemented yet');
        });
        
        // Craft
        this.menu.setClickHandler('craft', () => {
            console.log('[MedievalMenuIntegration] Craft clicked');
            this.showMessage('Crafting system not implemented yet');
        });
        
        // Map
        this.menu.setClickHandler('map', () => {
            console.log('[MedievalMenuIntegration] Map clicked');
            this.showMessage('Map system not implemented yet');
        });
        
        // Character
        this.menu.setClickHandler('character', () => {
            console.log('[MedievalMenuIntegration] Character clicked, showing player stats');
            this.gameScene.showPlayerStats();
        });
        
        // Leaderboard
        this.menu.setClickHandler('leaderboard', () => {
            console.log('[MedievalMenuIntegration] Leaderboard clicked');
            this.showMessage('Leaderboard system not implemented yet');
        });
        
        // Skills
        this.menu.setClickHandler('skills', () => {
            console.log('[MedievalMenuIntegration] Skills button clicked');
            console.log(`[MedievalMenuIntegration] Current scene key: ${this.scene.scene.key}`);
            
            // Check if we're in the Game scene or MainMenu scene
            if (this.scene.scene.key === 'Game') {
                // For Game scene
                const gameScene = this.scene as unknown as Game;
                console.log('[MedievalMenuIntegration] Game scene detected, skillTree exists:', !!gameScene.skillTree);
                
                if (gameScene.skillTree) {
                    console.log('[MedievalMenuIntegration] Toggling skill tree');
                    gameScene.skillTree.toggle();
                    
                    // Force show if it's still not visible
                    setTimeout(() => {
                        console.log('[MedievalMenuIntegration] Checking if skill tree is visible after toggle');
                        if (gameScene.skillTree?.isHidden()) {
                            console.log('[MedievalMenuIntegration] Forcing skill tree to show');
                            gameScene.skillTree.show();
                        } else {
                            console.log('[MedievalMenuIntegration] Skill tree is already visible');
                        }
                    }, 100);
                } else {
                    console.log('[MedievalMenuIntegration] Skill tree not available in Game scene');
                    this.showMessage('Skill tree not available in this scene');
                }
            } else if (this.scene.scene.key === 'MainMenu') {
                // For MainMenu scene
                console.log('[MedievalMenuIntegration] MainMenu scene detected');
                const mainMenuScene = this.scene as unknown as MainMenu;
                
                console.log('[MedievalMenuIntegration] MainMenu skillTree exists:', !!mainMenuScene.skillTree);
                if (mainMenuScene.skillTree) {
                    console.log('[MedievalMenuIntegration] Toggling skill tree in MainMenu');
                    mainMenuScene.skillTree.toggle();
                } else {
                    console.log('[MedievalMenuIntegration] Skill tree not available in MainMenu scene');
                    this.showMessage('Skill tree not available in this scene');
                }
            } else {
                console.log(`[MedievalMenuIntegration] Unknown scene: ${this.scene.scene.key}`);
                this.showMessage('Skill tree not available in this scene');
            }
        });
        
        // Settings
        this.menu.setClickHandler('settings', () => {
            this.scene.scene.launch('MenuScene');
        });
    }
    
    /**
     * Sets up event listeners for the game
     */
    private setupEventListeners(): void {
        // Listen for relevant game events
        
        // Update notification badges when new messages arrive
        this.scene.events.on('new-message', this.updateCommunicationBadge, this);
        
        // Update inventory badge when items are added
        this.scene.events.on('inventory-updated', this.updateInventoryBadge, this);
        
        // Update skills badge when skill points are available
        this.scene.events.on('skill-points-available', this.updateSkillsBadge, this);
    }
    
    /**
     * Updates the communication badge
     */
    public updateCommunicationBadge(count: number): void {
        if (!this.menu) return;
        
        if (count > 0) {
            this.menu.updateBadge('communication', count);
        } else {
            this.menu.updateBadge('communication', undefined);
        }
    }
    
    /**
     * Updates the inventory badge
     */
    public updateInventoryBadge(count: number): void {
        if (!this.menu) return;
        
        this.menu.updateBadge('inventory', count);
    }
    
    /**
     * Updates the skills badge
     */
    public updateSkillsBadge(count: number): void {
        if (!this.menu) return;
        
        if (count > 0) {
            this.menu.updateBadge('skills', count);
        } else {
            this.menu.updateBadge('skills', undefined);
        }
    }
    
    /**
     * Shows a message
     */
    public showMessage(message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info', duration = 3000): void {
        if (this.gameScene.medievalVitals) {
            this.gameScene.medievalVitals.showMessage(message, type, duration);
        }
    }
    
    /**
     * Toggles the menu visibility
     */
    public toggle(): void {
        console.log('[MedievalMenuIntegration] Toggle method called');
        
        if (!this.menu) {
            console.error('[MedievalMenuIntegration] Cannot toggle menu: menu is null');
            return;
        }
        
        console.log('[MedievalMenuIntegration] Toggling menu visibility');
        this.menu.toggle();
        console.log('[MedievalMenuIntegration] Menu toggled');
    }
    
    /**
     * Sets the active menu item
     * @param itemId The ID of the menu item to set as active, or null to clear
     */
    public setActiveItem(itemId: string | null): void {
        if (!this.menu) return;
        
        this.menu.setActiveItem(itemId);
    }
    
    /**
     * Destroys the menu
     */
    public destroy(): void {
        if (this.menu) {
            this.menu.destroy();
            this.menu = null;
        }
        
        // Clean up event listeners
        this.scene.events.off('new-message', this.updateCommunicationBadge, this);
        this.scene.events.off('inventory-updated', this.updateInventoryBadge, this);
        this.scene.events.off('skill-points-available', this.updateSkillsBadge, this);
    }
} 