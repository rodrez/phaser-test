import { Scene } from 'phaser';
import { PlayerSystem } from '../systems/Player';
import { InventorySystem } from '../systems/Inventory';
import { EquipmentSystem } from '../systems/Equipment';
import { ArmorItem, ArmorType, BaseItem, ItemRarity, ItemType, WeaponItem, WeaponType } from '../systems/Item';

export class EquipmentDemoScene extends Scene {
    // Systems
    playerSystem!: PlayerSystem;
    inventorySystem!: InventorySystem;
    equipmentSystem!: EquipmentSystem;
    
    // UI elements
    equipButtons: Phaser.GameObjects.Text[] = [];
    
    constructor() {
        super({ key: 'EquipmentDemo' });
    }
    
    preload() {
        // Load player sprite
        this.load.spritesheet('player', 'assets/player.png', {
            frameWidth: 48,
            frameHeight: 48
        });
        
        // Create and initialize equipment system
        this.equipmentSystem = new EquipmentSystem(this);
        
        // Preload equipment assets
        this.equipmentSystem.preloadEquipmentAssets();
    }
    
    create() {
        // Initialize systems
        this.playerSystem = new PlayerSystem(this);
        this.inventorySystem = new InventorySystem(this);
        
        // Create player
        this.playerSystem.createPlayer();
        
        // Position player in center
        const { width, height } = this.scale;
        this.playerSystem.player.setPosition(width / 2, height / 2);
        
        // Create equipment animations
        this.equipmentSystem.createEquipmentAnimations();
        
        // Create demo equipment items
        this.createDemoItems();
        
        // Create UI for equipping items
        this.createEquipmentUI();
        
        // Add keyboard controls
        this.playerSystem.setupInput();
        
        // Add instructions
        this.add.text(20, 20, 'Use WASD to move\nClick buttons to equip/unequip items', {
            fontSize: '18px',
            color: '#ffffff'
        });
    }
    
    update(time: number, delta: number) {
        // Handle player movement
        this.playerSystem.handlePlayerMovement();
        
        // Update player physics
        this.playerSystem.updatePlayerPhysics(delta);
    }
    
    /**
     * Creates demo equipment items and adds them to inventory
     */
    private createDemoItems() {
        // Create a sword
        const sword = new WeaponItem({
            id: 'basic_sword',
            name: 'Basic Sword',
            description: 'A simple sword for beginners',
            iconUrl: 'assets/sword.png',
            type: ItemType.WEAPON,
            weaponType: WeaponType.SWORD,
            rarity: ItemRarity.COMMON,
            weight: 2,
            value: 50,
            stackable: false,
            maxStackSize: 1,
            usable: false,
            attributes: {
                damage: 5
            }
        });
        
        // Create a chest armor
        const chestArmor = new ArmorItem({
            id: 'basic_chest',
            name: 'Basic Chest Armor',
            description: 'A simple chest armor for protection',
            iconUrl: 'assets/breast_plate.png',
            type: ItemType.ARMOR,
            armorType: ArmorType.CHEST,
            rarity: ItemRarity.COMMON,
            weight: 3,
            value: 80,
            stackable: false,
            maxStackSize: 1,
            usable: false,
            attributes: {
                defense: 5
            }
        });
        
        // Add items to inventory
        this.inventorySystem.addItem(sword);
        this.inventorySystem.addItem(chestArmor);
    }
    
    /**
     * Creates UI for equipping and unequipping items
     */
    private createEquipmentUI() {
        const { width, height } = this.scale;
        const startY = 100;
        const spacing = 40;
        
        // Create buttons for each equipment type
        const equipmentTypes = [
            { name: 'Equip Sword', slot: 'mainHand', itemId: 'basic_sword' },
            { name: 'Equip Chest Armor', slot: 'chest', itemId: 'basic_chest' },
            { name: 'Unequip All', slot: null, itemId: null }
        ];
        
        equipmentTypes.forEach((item, index) => {
            const button = this.add.text(width - 200, startY + (index * spacing), item.name, {
                fontSize: '16px',
                color: '#ffffff',
                backgroundColor: '#333333',
                padding: {
                    left: 10,
                    right: 10,
                    top: 5,
                    bottom: 5
                }
            });
            
            button.setInteractive({ useHandCursor: true });
            
            button.on('pointerdown', () => {
                if (item.slot === null) {
                    // Unequip all items
                    this.unequipAllItems();
                } else {
                    // Find the item in inventory
                    const allItems = this.inventorySystem.getAllItems();
                    const slotIndex = allItems.findIndex(stack => 
                        stack && stack.item.id === item.itemId
                    );
                    
                    if (slotIndex !== -1) {
                        // Equip the item
                        this.inventorySystem.equipItem(slotIndex);
                        
                        // Update equipment visuals
                        this.playerSystem.updateEquipmentVisual(item.slot as any);
                    }
                }
            });
            
            this.equipButtons.push(button);
        });
    }
    
    /**
     * Unequips all items
     */
    private unequipAllItems() {
        const slots = ['head', 'chest', 'mainHand', 'offHand'];
        
        slots.forEach(slot => {
            this.inventorySystem.unequipItem(slot as any);
            this.playerSystem.hideEquipmentVisual(slot as any);
        });
    }
} 