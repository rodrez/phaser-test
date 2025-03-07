import { Scene } from 'phaser';
import { InventorySystem } from '../Inventory';
import { BaseItem, ItemRarity, ItemType, WeaponType, ArmorType } from '../Item';
import { InventoryUI } from './InventoryUI';

export class InventoryDemoScene extends Scene {
    private inventory!: InventorySystem;
    private inventoryUI!: InventoryUI;
    private debugText!: Phaser.GameObjects.Text;
    
    constructor() {
        super({ key: 'InventoryDemoScene' });
    }
    
    create(): void {
        // Create a black background
        this.add.rectangle(0, 0, this.cameras.main.width, this.cameras.main.height, 0x000000)
            .setOrigin(0, 0);
        
        // Create title text
        this.add.text(20, 20, 'Inventory System Demo', { 
            fontSize: '32px', 
            color: '#ffffff',
            fontStyle: 'bold'
        });
        
        // Create instructions text
        this.add.text(20, 70, 'Press I to toggle inventory\nPress 1-5 to add different items\nPress C to clear inventory', { 
            fontSize: '18px', 
            color: '#cccccc'
        });
        
        // Create debug text
        this.debugText = this.add.text(20, this.cameras.main.height - 50, '', { 
            fontSize: '16px', 
            color: '#ffffff'
        });
        
        // Initialize inventory system
        this.inventory = new InventorySystem(this, {
            maxSlots: 20,
            maxWeight: 50,
            startingGold: 100
        });
        
        // Initialize inventory UI
        this.inventoryUI = new InventoryUI(this, this.inventory, {
            x: this.cameras.main.width / 2 - 200,
            y: this.cameras.main.height / 2 - 250,
            width: 400,
            height: 500,
            columns: 1,
            title: 'Inventory (Grouped Items)'
        });
        
        // Add keyboard input
        const keyboard = this.input.keyboard;
        if (keyboard) {
            keyboard.on('keydown-I', () => {
                this.inventoryUI.toggle();
            });
            
            keyboard.on('keydown-ONE', () => {
                this.addSword();
            });
            
            keyboard.on('keydown-TWO', () => {
                this.addArmor();
            });
            
            keyboard.on('keydown-THREE', () => {
                this.addPotion();
            });
            
            keyboard.on('keydown-FOUR', () => {
                this.addResource();
            });
            
            keyboard.on('keydown-FIVE', () => {
                this.addQuestItem();
            });
            
            keyboard.on('keydown-C', () => {
                this.clearInventory();
            });
        }
        
        // Add some initial items
        this.addSword();
        this.addArmor();
        this.addPotion();
        this.addResource();
        
        // Show inventory initially
        this.inventoryUI.show();
        
        // Update debug text
        this.updateDebugText();
    }
    
    private addSword(): void {
        // Create a sword with random level
        const level = Math.floor(Math.random() * 10) + 1;
        const sword = {
            id: 'sword',
            name: 'Steel Sword',
            description: 'A sharp steel sword',
            iconUrl: 'assets/items/sword.png',
            type: ItemType.WEAPON,
            rarity: level > 5 ? ItemRarity.RARE : ItemRarity.COMMON,
            weight: 2.5,
            value: 50 + (level * 10),
            level: level,
            stackable: false,
            maxStackSize: 1,
            usable: true,
            attributes: {
                damage: 10 + level,
                attackSpeed: 1.2
            },
            weaponType: WeaponType.SWORD
        };
        
        const item = new BaseItem(sword);
        this.inventory.addItem(item);
        this.updateDebugText(`Added Steel Sword (Lvl ${level})`);
    }
    
    private addArmor(): void {
        // Create armor with random level
        const level = Math.floor(Math.random() * 10) + 1;
        const armor = {
            id: 'chest_armor',
            name: 'Leather Armor',
            description: 'Protective leather armor',
            iconUrl: 'assets/items/armor.png',
            type: ItemType.ARMOR,
            rarity: level > 7 ? ItemRarity.EPIC : ItemRarity.UNCOMMON,
            weight: 4.0,
            value: 75 + (level * 15),
            level: level,
            stackable: false,
            maxStackSize: 1,
            usable: true,
            attributes: {
                defense: 8 + level
            },
            armorType: ArmorType.CHEST
        };
        
        const item = new BaseItem(armor);
        this.inventory.addItem(item);
        this.updateDebugText(`Added Leather Armor (Lvl ${level})`);
    }
    
    private addPotion(): void {
        // Create a healing potion (stackable)
        const potion = {
            id: 'healing_potion',
            name: 'Healing Potion',
            description: 'Restores 50 health',
            iconUrl: 'assets/items/potion.png',
            type: ItemType.CONSUMABLE,
            rarity: ItemRarity.COMMON,
            weight: 0.5,
            value: 25,
            stackable: true,
            maxStackSize: 10,
            usable: true,
            healthRestore: 50
        };
        
        const item = new BaseItem(potion);
        this.inventory.addItem(item);
        this.updateDebugText('Added Healing Potion');
    }
    
    private addResource(): void {
        // Create a resource item (stackable)
        const resource = {
            id: 'iron_ore',
            name: 'Iron Ore',
            description: 'Raw iron ore for crafting',
            iconUrl: 'assets/items/ore.png',
            type: ItemType.RESOURCE,
            rarity: ItemRarity.COMMON,
            weight: 1.0,
            value: 5,
            stackable: true,
            maxStackSize: 50,
            usable: false
        };
        
        const item = new BaseItem(resource);
        // Add random quantity between 1-5
        const quantity = Math.floor(Math.random() * 5) + 1;
        this.inventory.addItem(item, quantity);
        this.updateDebugText(`Added ${quantity} Iron Ore`);
    }
    
    private addQuestItem(): void {
        // Create a quest item
        const questItem = {
            id: 'ancient_relic',
            name: 'Ancient Relic',
            description: 'A mysterious ancient artifact',
            iconUrl: 'assets/items/relic.png',
            type: ItemType.QUEST,
            rarity: ItemRarity.LEGENDARY,
            weight: 0.1,
            value: 0, // Cannot be sold
            stackable: false,
            maxStackSize: 1,
            usable: false
        };
        
        const item = new BaseItem(questItem);
        this.inventory.addItem(item);
        this.updateDebugText('Added Ancient Relic (Quest Item)');
    }
    
    private clearInventory(): void {
        // Get all items
        const allItems = this.inventory.getAllItems();
        
        // Remove all items
        for (let i = 0; i < allItems.length; i++) {
            const stack = allItems[i];
            if (stack) {
                this.inventory.removeItemFromSlot(i, stack.quantity);
            }
        }
        
        this.updateDebugText('Cleared inventory');
    }
    
    private updateDebugText(message?: string): void {
        const weightCapacity = this.inventory.getWeightCapacity();
        let text = `Items: ${this.countItems()}/${this.inventory.getAllItems().length}`;
        text += ` | Weight: ${weightCapacity.current.toFixed(1)}/${weightCapacity.max.toFixed(1)}`;
        text += ` | Gold: ${this.inventory.getGold()}`;
        
        if (message) {
            text += ` | ${message}`;
        }
        
        this.debugText.setText(text);
    }
    
    private countItems(): number {
        return this.inventory.getAllItems().filter(item => item !== null).length;
    }
    
    update(): void {
        // Update logic if needed
    }
} 