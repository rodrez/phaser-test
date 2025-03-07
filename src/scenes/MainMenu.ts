import { Scene } from 'phaser';
import type { GameObjects } from 'phaser';
import { InventorySystem } from '../systems/Inventory';
import { MedievalInventory } from '../ui/MedievalInventory';
import { BaseItem, ItemRarity, ItemType } from '../systems/Item';
import type { IItem } from '../systems/Item';
import { MedievalMenuIntegration } from '../ui/MedievalMenuIntegration';
import { MedievalSkillTree } from '../ui/MedievalSkillTree';
import { SKILL_DATA } from '../systems/skills/SkillData';
import type { Skill } from '../systems/skills/SkillTypes';
import { SkillCategory } from '../systems/skills/SkillTypes';

export class MainMenu extends Scene
{
    background: GameObjects.Image;
    logo: GameObjects.Image;
    title: GameObjects.Text;
    
    // Add inventory system and UI
    private inventory: InventorySystem;
    private inventoryUI: MedievalInventory;
    private gameMenu: MedievalMenuIntegration;
    public skillTree: MedievalSkillTree;

    constructor ()
    {
        super('MainMenu');
    }

    create ()
    {
        this.background = this.add.image(512, 384, 'background');

        this.logo = this.add.image(512, 300, 'logo');

        this.title = this.add.text(512, 460, 'Main Menu', {
            fontFamily: 'Arial Black', fontSize: 38, color: '#ffffff',
            stroke: '#000000', strokeThickness: 8,
            align: 'center'
        }).setOrigin(0.5);

        // Add button to start the game
        const gameButton = this.add.text(512, 520, 'Start Game', {
            fontFamily: 'Arial Black', fontSize: 26, color: '#ffffff',
            stroke: '#000000', strokeThickness: 6,
            align: 'center'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        // Add button to open the menu scene
        const menuButton = this.add.text(512, 580, 'Open Menu', {
            fontFamily: 'Arial Black', fontSize: 26, color: '#ffffff',
            stroke: '#000000', strokeThickness: 6,
            align: 'center'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        // Add button to open the skill tree
        const skillTreeButton = this.add.text(512, 640, 'Skill Tree', {
            fontFamily: 'Arial Black', fontSize: 26, color: '#ffffff',
            stroke: '#000000', strokeThickness: 6,
            align: 'center'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        // Initialize inventory system
        this.inventory = new InventorySystem(this, {
            maxSlots: 20,
            maxWeight: 100,
            startingGold: 150
        });
        
        // Add example items to the inventory
        this.addExampleItems();
        
        // Create the inventory UI
        this.inventoryUI = new MedievalInventory(this, this.inventory, {
            title: 'Inventory',
            showWeight: true,
            showFilters: true,
            showSearch: true
        });
        
        // Initialize the game menu
        this.gameMenu = new MedievalMenuIntegration(this);
        this.gameMenu.initialize();
        
        // Initialize the skill tree with inline styles to ensure it works
        this.skillTree = new MedievalSkillTree(this);

        // Initialize the skill tree with data
        this.skillTree.initialize(this.getSampleSkills(), {
            skillPoints: 5,
            unlockedSkills: new Map([
                ['archery', 2],
                ['sunder', 1]
            ]),
            specialization: null
        });

        // Apply critical styles directly to ensure the skill tree is visible
        const applySkillTreeStyles = () => {
            // Find the skill tree container
            const skillTreeContainer = document.querySelector('.skill-tree-container') as HTMLDivElement;
            if (!skillTreeContainer) {
                console.warn('Skill tree container not found, will retry later');
                setTimeout(applySkillTreeStyles, 100);
                return;
            }

            console.log('Applying styles to skill tree container');
            
            // Apply essential styles directly
            Object.assign(skillTreeContainer.style, {
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '90%',
                maxWidth: '1000px',
                height: '80%',
                maxHeight: '700px',
                background: '#2a1a0a',
                color: '#e8d4b9',
                borderRadius: '8px',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.8), inset 0 0 15px rgba(200, 161, 101, 0.3)',
                border: '3px solid #8b5a2b',
                padding: '10px',
                zIndex: '1000',
                fontFamily: 'Cinzel, Times New Roman, serif',
                display: 'flex',
                flexDirection: 'column',
                overflowY: 'auto'
            });

            // Style the header
            const header = skillTreeContainer.querySelector('.skill-tree-header') as HTMLDivElement;
            if (header) {
                Object.assign(header.style, {
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 15px',
                    borderBottom: '2px solid #8b5a2b',
                    marginBottom: '10px'
                });
            }

            // Style the title
            const title = skillTreeContainer.querySelector('.skill-tree-title') as HTMLDivElement;
            if (title) {
                Object.assign(title.style, {
                    fontSize: '24px',
                    fontWeight: 'bold',
                    color: '#f0c070',
                    textShadow: '1px 1px 2px rgba(0, 0, 0, 0.7)'
                });
            }

            // Style the close button
            const closeButton = skillTreeContainer.querySelector('.close-button') as HTMLButtonElement;
            if (closeButton) {
                Object.assign(closeButton.style, {
                    background: 'none',
                    border: 'none',
                    color: '#e8d4b9',
                    fontSize: '24px',
                    cursor: 'pointer',
                    padding: '0 5px'
                });
            }

            // Style the content container
            const contentContainer = skillTreeContainer.querySelector('.content-container') as HTMLDivElement;
            if (contentContainer) {
                Object.assign(contentContainer.style, {
                    display: 'flex',
                    flex: '1',
                    overflow: 'hidden',
                    margin: '0 15px 15px',
                    border: '1px solid #8b5a2b',
                    borderRadius: '4px'
                });
            }

            // Style the skill tree
            const skillTree = skillTreeContainer.querySelector('.skill-tree') as HTMLDivElement;
            if (skillTree) {
                Object.assign(skillTree.style, {
                    flex: '1',
                    overflowY: 'auto',
                    padding: '15px',
                    background: 'rgba(0, 0, 0, 0.2)'
                });
            }

            // Style the skill details panel
            const skillDetailsPanel = skillTreeContainer.querySelector('.skill-details-panel') as HTMLDivElement;
            if (skillDetailsPanel) {
                Object.assign(skillDetailsPanel.style, {
                    width: '300px',
                    background: '#3c2815',
                    padding: '15px',
                    overflowY: 'auto',
                    borderLeft: '1px solid #8b5a2b'
                });
            }

            console.log('Skill tree styles applied successfully');
        };

        // Try to load the CSS file with the correct path
        const cssFiles = [
            './styles/medieval-skill-tree.css',
            '../styles/medieval-skill-tree.css',
            '/styles/medieval-skill-tree.css',
            'styles/medieval-skill-tree.css'
        ];

        let cssLoaded = false;
        for (const cssPath of cssFiles) {
            try {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.type = 'text/css';
                link.href = cssPath;
                document.head.appendChild(link);
                console.log(`Attempted to load CSS from: ${cssPath}`);
                cssLoaded = true;
            } catch (error) {
                console.error(`Failed to load CSS from ${cssPath}:`, error);
            }
        }

        // Apply inline styles as a fallback
        setTimeout(applySkillTreeStyles, 500);
        
        // Add hover effects
        gameButton.on('pointerover', () => gameButton.setTint(0xffff00));
        gameButton.on('pointerout', () => gameButton.clearTint());
        menuButton.on('pointerover', () => menuButton.setTint(0xffff00));
        menuButton.on('pointerout', () => menuButton.clearTint());
        skillTreeButton.on('pointerover', () => skillTreeButton.setTint(0xffff00));
        skillTreeButton.on('pointerout', () => skillTreeButton.clearTint());

        // Add click handlers
        gameButton.on('pointerdown', () => this.scene.start('Game'));
        menuButton.on('pointerdown', () => this.scene.start('MenuScene'));
        skillTreeButton.on('pointerdown', () => {
            this.skillTree.toggle();
            
            // Check if styles are applied when the skill tree is shown
            setTimeout(() => {
                const container = document.querySelector('.skill-tree-container') as HTMLDivElement;
                if (container && container.style.display !== 'none') {
                    // If the container is visible but doesn't have proper styling, apply it
                    if (!container.style.background || container.style.background === '') {
                        console.log('Skill tree visible but not styled, applying styles now');
                        applySkillTreeStyles();
                    }
                }
            }, 100);
        });
    }
    
    /**
     * Adds example items to the inventory
     */
    private addExampleItems(): void {
        // Add weapons
        this.addItem({
            id: 'iron-sword',
            name: 'Iron Sword',
            description: 'A basic iron sword',
            iconUrl: '/assets/icons/sword.svg',
            type: ItemType.WEAPON,
            rarity: ItemRarity.COMMON,
            weight: 3.5,
            value: 25,
            level: 1,
            stackable: false,
            maxStackSize: 1,
            usable: false,
            attributes: { damage: 5 },
            durability: 100,
            maxDurability: 100
        });
        
        // Add armor
        this.addItem({
            id: 'leather-helmet',
            name: 'Leather Helmet',
            description: 'A basic helmet made of leather',
            iconUrl: '/assets/icons/helmet.svg',
            type: ItemType.ARMOR,
            rarity: ItemRarity.COMMON,
            weight: 1.0,
            value: 15,
            stackable: false,
            maxStackSize: 1,
            usable: false,
            attributes: { defense: 2 },
            durability: 50,
            maxDurability: 50
        });
        
        // Add consumables
        this.addItem({
            id: 'health-potion',
            name: 'Health Potion',
            description: 'Restores 20 health points',
            iconUrl: '/assets/icons/potion-red.svg',
            type: ItemType.CONSUMABLE,
            rarity: ItemRarity.COMMON,
            weight: 0.5,
            value: 10,
            stackable: true,
            maxStackSize: 10,
            usable: true
        }, 5);
        
        // Add resources
        this.addItem({
            id: 'iron-ore',
            name: 'Iron Ore',
            description: 'Raw iron ore that can be smelted',
            iconUrl: '/assets/icons/ore.svg',
            type: ItemType.RESOURCE,
            rarity: ItemRarity.COMMON,
            weight: 1.0,
            value: 5,
            stackable: true,
            maxStackSize: 50,
            usable: false
        }, 12);
        
        // Add a rare item
        this.addItem({
            id: 'enchanted-amulet',
            name: 'Enchanted Amulet',
            description: 'A magical amulet that enhances abilities',
            iconUrl: '/assets/icons/amulet.svg',
            type: ItemType.MISC,
            rarity: ItemRarity.RARE,
            weight: 0.2,
            value: 250,
            stackable: false,
            maxStackSize: 1,
            usable: true
        });
    }
    
    /**
     * Adds an item to the inventory
     */
    private addItem(itemData: IItem, quantity = 1): void {
        const item = new BaseItem(itemData);
        this.inventory.addItem(item, quantity);
    }
    
    /**
     * Shows a message on the screen
     */
    private showMessage(message: string): void {
        // Create a message box
        const messageBox = this.add.container(this.cameras.main.centerX, this.cameras.main.centerY);
        
        // Add a background
        const bg = this.add.rectangle(0, 0, 400, 100, 0x000000, 0.8);
        bg.setStrokeStyle(2, 0xffffff);
        messageBox.add(bg);
        
        // Add text
        const text = this.add.text(0, 0, message, {
            fontFamily: 'Arial',
            fontSize: '24px',
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);
        messageBox.add(text);
        
        // Add to scene
        this.add.existing(messageBox);
        
        // Auto-remove after a delay
        this.time.delayedCall(2000, () => {
            messageBox.destroy();
        });
    }
    
    /**
     * Returns skill data for the skill tree
     */
    private getSampleSkills(): Skill[] {
        return SKILL_DATA;
    }
    
    /**
     * Clean up resources when scene is shut down
     */
    shutdown(): void {
        if (this.inventoryUI) {
            this.inventoryUI.destroy();
        }
        
        if (this.gameMenu) {
            this.gameMenu.destroy();
        }
        
        if (this.skillTree) {
            this.skillTree.destroy();
        }
    }
}
