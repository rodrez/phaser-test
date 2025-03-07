import { Scene, GameObjects } from 'phaser';
import { BaseItem, ItemStack, ItemType } from '../systems/Item';
import { EquipmentSlot, InventorySystem } from '../systems/Inventory';
import { Game } from './Game';

interface InventorySceneData {
    game: Game;
    inventoryData: {
        slots: (ItemStack | null)[];
        equipment: Map<EquipmentSlot, ItemStack | null>;
        weightCapacity: { current: number, max: number };
        gold: number;
    };
}

export class InventoryScene extends Scene {
    // Reference to the main game scene
    private gameScene: Game;
    
    // Container for all inventory UI elements
    private container: GameObjects.Container;
    
    // Background elements
    private background: GameObjects.Rectangle;
    private inventoryPanel: GameObjects.Rectangle;
    private equipmentPanel: GameObjects.Rectangle;
    private detailsPanel: GameObjects.Rectangle;
    
    // Title and headers
    private titleText: GameObjects.Text;
    private equipmentText: GameObjects.Text;
    private inventoryText: GameObjects.Text;
    private detailsText: GameObjects.Text;
    private closeButton: GameObjects.Text;
    
    // Inventory slots UI elements
    private inventorySlots: GameObjects.Rectangle[] = [];
    private inventoryItems: GameObjects.Container[] = [];
    
    // Equipment slots UI elements
    private equipmentSlots: Map<EquipmentSlot, GameObjects.Rectangle> = new Map();
    private equipmentItems: Map<EquipmentSlot, GameObjects.Container> = new Map();
    
    // Details panel elements
    private itemNameText: GameObjects.Text;
    private itemDescriptionText: GameObjects.Text;
    private itemStatsText: GameObjects.Text;
    private itemActionsContainer: GameObjects.Container;
    
    // Weight and gold display
    private weightText: GameObjects.Text;
    private goldText: GameObjects.Text;
    
    // Currently selected item/slot
    private selectedInventorySlot: number = -1;
    private selectedEquipmentSlot: EquipmentSlot | null = null;
    
    // Inventory data
    private inventoryData: {
        slots: (ItemStack | null)[];
        equipment: Map<EquipmentSlot, ItemStack | null>;
        weightCapacity: { current: number, max: number };
        gold: number;
    };
    
    constructor() {
        super('InventoryScene');
    }
    
    init(data: InventorySceneData) {
        this.gameScene = data.game;
        this.inventoryData = data.inventoryData;
    }
    
    create() {
        const { width, height } = this.scale;
        
        // Create semi-transparent background
        this.background = this.add.rectangle(0, 0, width, height, 0x000000, 0.7)
            .setOrigin(0)
            .setInteractive()
            .on('pointerdown', () => {
                // Close inventory when clicking outside panels
                if (this.input.activePointer.downElement === this.background) {
                    this.closeInventory();
                }
            });
            
        // Create main container for all inventory elements
        this.container = this.add.container(0, 0);
        
        // Create panels
        this.createPanels();
        
        // Create title and headers
        this.createHeaders();
        
        // Create inventory slots
        this.createInventorySlots();
        
        // Create equipment slots
        this.createEquipmentSlots();
        
        // Create details panel
        this.createDetailsPanel();
        
        // Create weight and gold display
        this.createWeightAndGoldDisplay();
        
        // Populate inventory with items
        this.populateInventory();
        
        // Populate equipment slots
        this.populateEquipment();
        
        // Set up event handlers for keyboard input
        this.setupKeyboardHandlers();
    }
    
    private createPanels() {
        const { width, height } = this.scale;
        
        // Equipment panel (left)
        this.equipmentPanel = this.add.rectangle(
            width * 0.2, 
            height * 0.5, 
            width * 0.25, 
            height * 0.7, 
            0x333333, 0.9
        ).setStrokeStyle(2, 0xffffff);
        
        // Inventory panel (right)
        this.inventoryPanel = this.add.rectangle(
            width * 0.6, 
            height * 0.4, 
            width * 0.4, 
            height * 0.5, 
            0x333333, 0.9
        ).setStrokeStyle(2, 0xffffff);
        
        // Details panel (bottom right)
        this.detailsPanel = this.add.rectangle(
            width * 0.6, 
            height * 0.75, 
            width * 0.4, 
            height * 0.3, 
            0x333333, 0.9
        ).setStrokeStyle(2, 0xffffff);
        
        // Add panels to container
        this.container.add([this.equipmentPanel, this.inventoryPanel, this.detailsPanel]);
    }
    
    private createHeaders() {
        const { width, height } = this.scale;
        
        // Create title
        this.titleText = this.add.text(width * 0.5, height * 0.05, 'INVENTORY', {
            fontFamily: 'Arial Black',
            fontSize: '32px',
            color: '#ffffff'
        }).setOrigin(0.5);
        
        // Create panel headers
        this.equipmentText = this.add.text(width * 0.2, height * 0.18, 'EQUIPMENT', {
            fontFamily: 'Arial',
            fontSize: '24px',
            color: '#ffffff'
        }).setOrigin(0.5);
        
        this.inventoryText = this.add.text(width * 0.6, height * 0.18, 'ITEMS', {
            fontFamily: 'Arial',
            fontSize: '24px',
            color: '#ffffff'
        }).setOrigin(0.5);
        
        this.detailsText = this.add.text(width * 0.6, height * 0.62, 'DETAILS', {
            fontFamily: 'Arial',
            fontSize: '20px',
            color: '#ffffff'
        }).setOrigin(0.5);
        
        // Create close button
        this.closeButton = this.add.text(width * 0.95, height * 0.05, 'X', {
            fontFamily: 'Arial',
            fontSize: '32px',
            color: '#ffffff'
        })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.closeInventory())
            .on('pointerover', () => this.closeButton.setStyle({ color: '#ff0000' }))
            .on('pointerout', () => this.closeButton.setStyle({ color: '#ffffff' }));
            
        // Add texts to container
        this.container.add([
            this.titleText,
            this.equipmentText,
            this.inventoryText,
            this.detailsText,
            this.closeButton
        ]);
    }
    
    private createInventorySlots() {
        const { width, height } = this.scale;
        
        // Get inventory slots count (with default fallback)
        const slotsCount = this.inventoryData.slots.length || 24;
        
        // Calculate grid layout
        const columns = 6;
        const rows = Math.ceil(slotsCount / columns);
        
        const slotSize = 50;
        const padding = 10;
        const startX = width * 0.6 - (columns * (slotSize + padding)) / 2 + slotSize / 2;
        const startY = height * 0.25;
        
        // Create slots
        for (let i = 0; i < slotsCount; i++) {
            const col = i % columns;
            const row = Math.floor(i / columns);
            
            const x = startX + col * (slotSize + padding);
            const y = startY + row * (slotSize + padding);
            
            // Create slot background
            const slot = this.add.rectangle(x, y, slotSize, slotSize, 0x555555)
                .setStrokeStyle(2, 0x888888)
                .setInteractive({ useHandCursor: true })
                .on('pointerdown', () => this.selectInventorySlot(i))
                .on('pointerover', () => slot.setStrokeStyle(2, 0xffffff))
                .on('pointerout', () => {
                    if (this.selectedInventorySlot !== i) {
                        slot.setStrokeStyle(2, 0x888888);
                    }
                });
                
            // Add slot index number for reference
            const slotIndex = this.add.text(x - (slotSize / 2) + 5, y - (slotSize / 2) + 5, `${i + 1}`, {
                fontFamily: 'Arial',
                fontSize: '12px',
                color: '#999999'
            });
            
            // Create container for item
            const itemContainer = this.add.container(x, y);
            
            // Add to arrays
            this.inventorySlots.push(slot);
            this.inventoryItems.push(itemContainer);
            
            // Add to main container
            this.container.add([slot, slotIndex, itemContainer]);
        }
    }
    
    private createEquipmentSlots() {
        const { width, height } = this.scale;
        
        // Define equipment slot positions
        const slotSize = 60;
        const labelFontSize = '16px';
        const positions: Record<EquipmentSlot, { x: number, y: number, label: string }> = {
            head: { x: width * 0.2, y: height * 0.24, label: 'Head' },
            chest: { x: width * 0.2, y: height * 0.34, label: 'Chest' },
            hands: { x: width * 0.12, y: height * 0.44, label: 'Hands' },
            legs: { x: width * 0.2, y: height * 0.54, label: 'Legs' },
            feet: { x: width * 0.2, y: height * 0.64, label: 'Feet' },
            mainHand: { x: width * 0.12, y: height * 0.74, label: 'Main Hand' },
            offHand: { x: width * 0.28, y: height * 0.74, label: 'Off Hand' },
            necklace: { x: width * 0.28, y: height * 0.28, label: 'Neck' },
            ring1: { x: width * 0.28, y: height * 0.44, label: 'Ring 1' },
            ring2: { x: width * 0.28, y: height * 0.54, label: 'Ring 2' }
        };
        
        // Create equipment slots
        Object.entries(positions).forEach(([slotKey, position]) => {
            const slot = slotKey as EquipmentSlot;
            
            // Create slot background
            const slotBg = this.add.rectangle(position.x, position.y, slotSize, slotSize, 0x555555)
                .setStrokeStyle(2, 0x888888)
                .setInteractive({ useHandCursor: true })
                .on('pointerdown', () => this.selectEquipmentSlot(slot))
                .on('pointerover', () => slotBg.setStrokeStyle(2, 0xffffff))
                .on('pointerout', () => {
                    if (this.selectedEquipmentSlot !== slot) {
                        slotBg.setStrokeStyle(2, 0x888888);
                    }
                });
                
            // Create label
            const label = this.add.text(position.x, position.y + slotSize / 2 + 10, position.label, {
                fontFamily: 'Arial',
                fontSize: labelFontSize,
                color: '#cccccc'
            }).setOrigin(0.5);
            
            // Create container for item
            const itemContainer = this.add.container(position.x, position.y);
            
            // Store references
            this.equipmentSlots.set(slot, slotBg);
            this.equipmentItems.set(slot, itemContainer);
            
            // Add to main container
            this.container.add([slotBg, label, itemContainer]);
        });
    }
    
    private createDetailsPanel() {
        const { width, height } = this.scale;
        
        // Create item name text
        this.itemNameText = this.add.text(width * 0.42, height * 0.65, 'Select an item', {
            fontFamily: 'Arial',
            fontSize: '20px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0, 0);
        
        // Create item description text
        this.itemDescriptionText = this.add.text(width * 0.42, height * 0.7, '', {
            fontFamily: 'Arial',
            fontSize: '16px',
            color: '#cccccc',
            wordWrap: { width: width * 0.35 }
        }).setOrigin(0, 0);
        
        // Create item stats text
        this.itemStatsText = this.add.text(width * 0.42, height * 0.76, '', {
            fontFamily: 'Arial',
            fontSize: '14px',
            color: '#aaaaaa'
        }).setOrigin(0, 0);
        
        // Create action buttons container
        this.itemActionsContainer = this.add.container(width * 0.6, height * 0.85);
        
        // Add to main container
        this.container.add([
            this.itemNameText,
            this.itemDescriptionText,
            this.itemStatsText,
            this.itemActionsContainer
        ]);
        
        // Set initial details state (empty)
        this.clearItemDetails();
    }
    
    private createWeightAndGoldDisplay() {
        const { width, height } = this.scale;
        
        // Create weight text
        this.weightText = this.add.text(width * 0.42, height * 0.92, 'Weight: 0/0', {
            fontFamily: 'Arial',
            fontSize: '16px',
            color: '#ffffff'
        }).setOrigin(0, 0);
        
        // Create gold text
        this.goldText = this.add.text(width * 0.75, height * 0.92, 'Gold: 0', {
            fontFamily: 'Arial',
            fontSize: '16px',
            color: '#ffdd00'
        }).setOrigin(0, 0);
        
        // Add to main container
        this.container.add([this.weightText, this.goldText]);
        
        // Update weight and gold display
        this.updateWeightAndGold();
    }
    
    private populateInventory() {
        // Clear any existing item sprites
        this.inventoryItems.forEach(container => container.removeAll(true));
        
        // Populate with current inventory data
        this.inventoryData.slots.forEach((stack, index) => {
            if (stack && index < this.inventoryItems.length) {
                const container = this.inventoryItems[index];
                this.createItemSprite(container, stack);
            }
        });
    }
    
    private populateEquipment() {
        // Clear any existing item sprites
        this.equipmentItems.forEach(container => container.removeAll(true));
        
        // Populate with current equipment data
        this.inventoryData.equipment.forEach((stack, slot) => {
            if (stack && this.equipmentItems.has(slot)) {
                const container = this.equipmentItems.get(slot)!;
                this.createItemSprite(container, stack);
            }
        });
    }
    
    private createItemSprite(container: GameObjects.Container, stack: ItemStack) {
        const item = stack.item;
        
        // Clear container first
        container.removeAll(true);
        
        // Create a colored rectangle representing the item with color based on rarity
        const itemColor = this.getRarityColor(item.rarity);
        const itemIcon = this.add.rectangle(0, 0, 40, 40, itemColor);
        
        // Add text based on item type
        let typeChar = '?';
        switch (item.type) {
            case ItemType.WEAPON: typeChar = 'W'; break;
            case ItemType.ARMOR: typeChar = 'A'; break;
            case ItemType.CONSUMABLE: typeChar = 'C'; break;
            case ItemType.RESOURCE: typeChar = 'R'; break;
            case ItemType.QUEST: typeChar = 'Q'; break;
            case ItemType.TOOL: typeChar = 'T'; break;
            case ItemType.MISC: typeChar = 'M'; break;
        }
        
        const itemText = this.add.text(0, 0, typeChar, {
            fontFamily: 'Arial Black',
            fontSize: '20px',
            color: '#ffffff'
        }).setOrigin(0.5);
        
        // Add quantity if item is stackable and has more than 1
        if (item.stackable && stack.quantity > 1) {
            const quantityText = this.add.text(15, 15, stack.quantity.toString(), {
                fontFamily: 'Arial',
                fontSize: '12px',
                color: '#ffffff',
                backgroundColor: '#000000',
                padding: { left: 2, right: 2, top: 2, bottom: 2 }
            }).setOrigin(1, 1);
            
            container.add(quantityText);
        }
        
        // Add to container
        container.add([itemIcon, itemText]);
        
        // If item is equipped, add a border
        if (this.isItemEquipped(item)) {
            const equipBorder = this.add.rectangle(0, 0, 44, 44, 0xffff00, 0)
                .setStrokeStyle(2, 0xffff00);
            container.add(equipBorder);
        }
        
        // If item has durability, add a durability bar
        if (item.durability !== undefined && item.maxDurability !== undefined) {
            const durabilityPercentage = (item.durability / item.maxDurability);
            const durabilityColor = this.getDurabilityColor(durabilityPercentage);
            
            const durabilityBar = this.add.rectangle(0, 22, 40 * durabilityPercentage, 4, durabilityColor);
            container.add(durabilityBar);
        }
    }
    
    private selectInventorySlot(index: number) {
        // Reset previous selection if any
        if (this.selectedInventorySlot !== -1) {
            this.inventorySlots[this.selectedInventorySlot].setStrokeStyle(2, 0x888888);
        }
        
        // Reset equipment selection if any
        if (this.selectedEquipmentSlot) {
            const equipSlot = this.equipmentSlots.get(this.selectedEquipmentSlot);
            if (equipSlot) {
                equipSlot.setStrokeStyle(2, 0x888888);
            }
            this.selectedEquipmentSlot = null;
        }
        
        // Set new selection
        this.selectedInventorySlot = index;
        this.inventorySlots[index].setStrokeStyle(2, 0xffff00);
        
        // Update details panel
        const stack = this.inventoryData.slots[index];
        if (stack) {
            this.showItemDetails(stack);
        } else {
            this.clearItemDetails();
        }
    }
    
    private selectEquipmentSlot(slot: EquipmentSlot) {
        // Reset previous inventory selection if any
        if (this.selectedInventorySlot !== -1) {
            this.inventorySlots[this.selectedInventorySlot].setStrokeStyle(2, 0x888888);
            this.selectedInventorySlot = -1;
        }
        
        // Reset previous equipment selection if any
        if (this.selectedEquipmentSlot) {
            const equipSlot = this.equipmentSlots.get(this.selectedEquipmentSlot);
            if (equipSlot) {
                equipSlot.setStrokeStyle(2, 0x888888);
            }
        }
        
        // Set new selection
        this.selectedEquipmentSlot = slot;
        const equipSlot = this.equipmentSlots.get(slot);
        if (equipSlot) {
            equipSlot.setStrokeStyle(2, 0xffff00);
        }
        
        // Update details panel
        const stack = this.inventoryData.equipment.get(slot);
        if (stack) {
            this.showItemDetails(stack);
        } else {
            this.clearItemDetails();
        }
    }
    
    private showItemDetails(stack: ItemStack) {
        // Clear action buttons first
        this.itemActionsContainer.removeAll(true);
        
        const item = stack.item;
        
        // Set item name with rarity color
        this.itemNameText.setText(item.name)
            .setColor(this.getRarityColorString(item.rarity));
            
        // Set item description
        this.itemDescriptionText.setText(item.description);
        
        // Build stats text
        let statsText = `Level: ${item.level || 1}   Weight: ${item.weight}   Value: ${item.value} gold\n`;
        
        // Add item-specific stats
        if (item.attributes) {
            const attrs = item.attributes;
            
            if (attrs.damage !== undefined) statsText += `Damage: ${attrs.damage}   `;
            if (attrs.defense !== undefined) statsText += `Defense: ${attrs.defense}   `;
            if (attrs.strength !== undefined) statsText += `Strength: ${attrs.strength}   `;
            if (attrs.dexterity !== undefined) statsText += `Dexterity: ${attrs.dexterity}   `;
            if (attrs.vitality !== undefined) statsText += `Vitality: ${attrs.vitality}   `;
        }
        
        // Add durability if item has it
        if (item.durability !== undefined && item.maxDurability !== undefined) {
            statsText += `\nDurability: ${item.durability}/${item.maxDurability} (${Math.floor((item.durability / item.maxDurability) * 100)}%)`;
        }
        
        // Add remaining uses if item has them
        if (item.uses !== undefined && item.maxUses !== undefined) {
            statsText += `\nUses: ${item.uses}/${item.maxUses}`;
        }
        
        this.itemStatsText.setText(statsText);
        
        // Create action buttons
        this.createItemActionButtons(stack);
    }
    
    private clearItemDetails() {
        this.itemNameText.setText('Select an item').setColor('#ffffff');
        this.itemDescriptionText.setText('');
        this.itemStatsText.setText('');
        this.itemActionsContainer.removeAll(true);
    }
    
    private createItemActionButtons(stack: ItemStack) {
        const { width } = this.scale;
        const item = stack.item;
        const buttonWidth = 100;
        const padding = 10;
        let posX = 0;
        
        // Available actions depend on whether this is from inventory or equipment
        const isEquipped = this.selectedEquipmentSlot !== null;
        const actionButtons: Array<{text: string, callback: () => void}> = [];
        
        // Create action buttons based on item properties and current location
        if (isEquipped) {
            // Unequip button
            actionButtons.push({
                text: 'Unequip',
                callback: () => this.unequipItem()
            });
        } else {
            // Use/Equip button if applicable
            if (item.usable) {
                if (item.type === ItemType.WEAPON || item.type === ItemType.ARMOR) {
                    actionButtons.push({
                        text: 'Equip',
                        callback: () => this.equipItem()
                    });
                } else {
                    actionButtons.push({
                        text: 'Use',
                        callback: () => this.useItem()
                    });
                }
            }
            
            // Drop button
            actionButtons.push({
                text: 'Drop',
                callback: () => this.dropItem()
            });
        }
        
        // Add buttons for all actions
        actionButtons.forEach((action, index) => {
            const button = this.add.rectangle(posX, 0, buttonWidth, 30, 0x444444)
                .setStrokeStyle(1, 0xcccccc)
                .setInteractive({ useHandCursor: true })
                .on('pointerdown', action.callback)
                .on('pointerover', () => {
                    button.setFillStyle(0x666666);
                    buttonText.setColor('#ffffff');
                })
                .on('pointerout', () => {
                    button.setFillStyle(0x444444);
                    buttonText.setColor('#cccccc');
                });
                
            const buttonText = this.add.text(posX, 0, action.text, {
                fontFamily: 'Arial',
                fontSize: '16px',
                color: '#cccccc'
            }).setOrigin(0.5);
            
            this.itemActionsContainer.add([button, buttonText]);
            
            posX += buttonWidth + padding;
        });
        
        // Center the container
        this.itemActionsContainer.setX(width * 0.6 - (posX - padding) / 2);
    }
    
    private equipItem() {
        if (this.selectedInventorySlot === -1) return;
        
        // Tell the Game scene to equip the item
        this.gameScene.inventorySystem.equipItem(this.selectedInventorySlot);
        
        // Refresh the UI
        this.refreshInventory();
    }
    
    private unequipItem() {
        if (!this.selectedEquipmentSlot) return;
        
        // Tell the Game scene to unequip the item
        this.gameScene.inventorySystem.unequipItem(this.selectedEquipmentSlot);
        
        // Refresh the UI
        this.refreshInventory();
    }
    
    private useItem() {
        if (this.selectedInventorySlot === -1) return;
        
        // Tell the Game scene to use the item
        this.gameScene.inventorySystem.useItem(this.selectedInventorySlot);
        
        // Refresh the UI
        this.refreshInventory();
    }
    
    private dropItem() {
        if (this.selectedInventorySlot === -1) return;
        
        // Remove the item from inventory
        this.gameScene.inventorySystem.removeItemFromSlot(this.selectedInventorySlot);
        
        // Refresh the UI
        this.refreshInventory();
    }
    
    private refreshInventory() {
        // Get fresh inventory data
        this.inventoryData = {
            slots: this.gameScene.inventorySystem.getAllItems(),
            equipment: this.gameScene.inventorySystem.getEquippedItems(),
            weightCapacity: this.gameScene.inventorySystem.getWeightCapacity(),
            gold: this.gameScene.inventorySystem.getGold()
        };
        
        // Repopulate UI
        this.populateInventory();
        this.populateEquipment();
        this.updateWeightAndGold();
        
        // Clear selection if the slot is now empty
        if (this.selectedInventorySlot !== -1) {
            const stack = this.inventoryData.slots[this.selectedInventorySlot];
            if (!stack) {
                this.clearItemDetails();
                this.inventorySlots[this.selectedInventorySlot].setStrokeStyle(2, 0x888888);
                this.selectedInventorySlot = -1;
            } else {
                this.showItemDetails(stack);
            }
        } else if (this.selectedEquipmentSlot) {
            const stack = this.inventoryData.equipment.get(this.selectedEquipmentSlot);
            if (!stack) {
                this.clearItemDetails();
                const equipSlot = this.equipmentSlots.get(this.selectedEquipmentSlot);
                if (equipSlot) {
                    equipSlot.setStrokeStyle(2, 0x888888);
                }
                this.selectedEquipmentSlot = null;
            } else {
                this.showItemDetails(stack);
            }
        }
    }
    
    private updateWeightAndGold() {
        const weight = this.inventoryData.weightCapacity;
        const gold = this.inventoryData.gold;
        
        this.weightText.setText(`Weight: ${weight.current.toFixed(1)}/${weight.max.toFixed(1)}`);
        this.goldText.setText(`Gold: ${gold}`);
        
        // Change color if near weight capacity
        if (weight.current / weight.max > 0.9) {
            this.weightText.setColor('#ff0000');
        } else if (weight.current / weight.max > 0.7) {
            this.weightText.setColor('#ffff00');
        } else {
            this.weightText.setColor('#ffffff');
        }
    }
    
    private isItemEquipped(item: BaseItem): boolean {
        // Check if the item is currently equipped
        let equipped = false;
        this.inventoryData.equipment.forEach((stack) => {
            if (stack && stack.item.id === item.id) {
                equipped = true;
            }
        });
        return equipped;
    }
    
    private getRarityColor(rarity: string): number {
        switch (rarity) {
            case 'common': return 0xffffff;
            case 'uncommon': return 0x00ff00;
            case 'rare': return 0x0070dd;
            case 'epic': return 0xa335ee;
            case 'legendary': return 0xff8000;
            default: return 0xffffff;
        }
    }
    
    private getRarityColorString(rarity: string): string {
        switch (rarity) {
            case 'common': return '#ffffff';
            case 'uncommon': return '#00ff00';
            case 'rare': return '#0070dd';
            case 'epic': return '#a335ee';
            case 'legendary': return '#ff8000';
            default: return '#ffffff';
        }
    }
    
    private getDurabilityColor(percentage: number): number {
        if (percentage > 0.7) return 0x00ff00; // Green
        if (percentage > 0.3) return 0xffff00; // Yellow
        return 0xff0000; // Red
    }
    
    private setupKeyboardHandlers() {
        // Close inventory with Escape key
        this.input.keyboard?.on('keydown-ESC', () => {
            this.closeInventory();
        });
    }
    
    private closeInventory() {
        // Resume the game scene
        this.scene.resume('Game');
        // Stop this scene
        this.scene.stop();
    }
} 