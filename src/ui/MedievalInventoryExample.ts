import { Scene } from 'phaser';
import { InventorySystem } from '../systems/Inventory';
import { MedievalInventory } from './MedievalInventory';
import { BaseItem, ItemRarity, ItemType } from '../systems/Item';
import type { IItem } from '../systems/Item';

/**
 * Example scene to demonstrate the MedievalInventory
 */
export class MedievalInventoryExample extends Scene {
    private inventory: InventorySystem;
    private inventoryUI: MedievalInventory;
    private toggleButton: Phaser.GameObjects.Text;
    
    constructor() {
        super({ key: 'MedievalInventoryExample' });
    }
    
    create(): void {
        // Create a background
        this.add.rectangle(0, 0, this.cameras.main.width, this.cameras.main.height, 0x222222)
            .setOrigin(0, 0);
        
        // Create inventory system
        this.inventory = new InventorySystem(this, {
            maxSlots: 24,
            maxWeight: 100,
            startingGold: 150
        });
        
        // Add some example items
        this.addExampleItems();
        
        // Create the inventory UI
        this.inventoryUI = new MedievalInventory(this, this.inventory, {
            title: 'Medieval Inventory',
            showWeight: true,
            showFilters: true,
            showSearch: true
        });
        
        // Create a button to toggle the inventory
        this.toggleButton = this.add.text(20, 20, 'Open Inventory', {
            backgroundColor: '#8b5a2b',
            padding: { x: 10, y: 5 },
            color: '#ffffff'
        })
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => {
            this.inventoryUI.toggle();
        });
        
        // Add instructions
        this.add.text(20, 70, 'Click on items to use or equip them.\nItems are grouped by type and properties.', {
            color: '#ffffff',
            fontSize: '16px'
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
            iconUrl: '/assets/icons/sword.png',
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
        
        this.addItem({
            id: 'steel-axe',
            name: 'Steel Battle Axe',
            description: 'A heavy battle axe made of steel',
            iconUrl: '/assets/icons/axe.png',
            type: ItemType.WEAPON,
            rarity: ItemRarity.UNCOMMON,
            weight: 5.0,
            value: 45,
            level: 3,
            stackable: false,
            maxStackSize: 1,
            usable: false,
            attributes: { damage: 8 },
            durability: 100,
            maxDurability: 100
        });
        
        // Add armor
        this.addItem({
            id: 'leather-helmet',
            name: 'Leather Helmet',
            description: 'A basic helmet made of leather',
            iconUrl: '/assets/icons/helmet.png',
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
            iconUrl: '/assets/icons/potion-red.png',
            type: ItemType.CONSUMABLE,
            rarity: ItemRarity.COMMON,
            weight: 0.5,
            value: 10,
            stackable: true,
            maxStackSize: 10,
            usable: true
        }, 5);
        
        this.addItem({
            id: 'mana-potion',
            name: 'Mana Potion',
            description: 'Restores 20 mana points',
            iconUrl: '/assets/icons/potion-blue.png',
            type: ItemType.CONSUMABLE,
            rarity: ItemRarity.COMMON,
            weight: 0.5,
            value: 10,
            stackable: true,
            maxStackSize: 10,
            usable: true
        }, 3);
        
        // Add resources
        this.addItem({
            id: 'iron-ore',
            name: 'Iron Ore',
            description: 'Raw iron ore that can be smelted',
            iconUrl: '/assets/icons/ore.png',
            type: ItemType.RESOURCE,
            rarity: ItemRarity.COMMON,
            weight: 1.0,
            value: 5,
            stackable: true,
            maxStackSize: 50,
            usable: false
        }, 12);
        
        this.addItem({
            id: 'wood',
            name: 'Wood',
            description: 'Common wood for crafting',
            iconUrl: '/assets/icons/wood.png',
            type: ItemType.RESOURCE,
            rarity: ItemRarity.COMMON,
            weight: 0.8,
            value: 2,
            stackable: true,
            maxStackSize: 50,
            usable: false
        }, 20);
        
        // Add a rare item
        this.addItem({
            id: 'enchanted-amulet',
            name: 'Enchanted Amulet',
            description: 'A magical amulet that enhances abilities',
            iconUrl: '/assets/icons/amulet.png',
            type: ItemType.MISC,
            rarity: ItemRarity.RARE,
            weight: 0.2,
            value: 250,
            stackable: false,
            maxStackSize: 1,
            usable: true
        });
        
        // Add a legendary item
        this.addItem({
            id: 'dragon-slayer',
            name: 'Dragon Slayer',
            description: 'A legendary sword said to have slain dragons',
            iconUrl: '/assets/icons/legendary-sword.png',
            type: ItemType.WEAPON,
            rarity: ItemRarity.LEGENDARY,
            weight: 4.0,
            value: 5000,
            level: 10,
            stackable: false,
            maxStackSize: 1,
            usable: false,
            attributes: { damage: 25, fire: true },
            durability: 200,
            maxDurability: 200
        });
    }
    
    /**
     * Helper to add an item to the inventory
     */
    private addItem(itemData: IItem, quantity = 1): void {
        const item = new BaseItem(itemData);
        this.inventory.addItem(item, quantity);
    }
    
    /**
     * Clean up resources when scene is shut down
     */
    shutdown(): void {
        if (this.inventoryUI) {
            this.inventoryUI.destroy();
        }
    }
} 