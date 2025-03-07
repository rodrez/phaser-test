import type { Scene } from 'phaser';
import type { InventorySystem } from '../Inventory';
import type { BaseItem, ItemStack, ItemType } from '../Item';

export interface InventoryUIOptions {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    padding?: number;
    background?: number;
    title?: string;
    columns?: number;
    showWeight?: boolean;
    showGold?: boolean;
    showClose?: boolean;
}

export interface GroupedItem {
    item: BaseItem;
    totalQuantity: number;
    totalWeight: number;
    slots: number[]; // Slot indices where this item appears
}

export class InventoryUI {
    private scene: Scene;
    private inventory: InventorySystem;
    private container: Phaser.GameObjects.Container;
    private background: Phaser.GameObjects.Rectangle;
    private titleText: Phaser.GameObjects.Text;
    private closeButton?: Phaser.GameObjects.Text;
    private itemsContainer: Phaser.GameObjects.Container;
    private weightText?: Phaser.GameObjects.Text;
    private goldText?: Phaser.GameObjects.Text;
    
    private options: Required<InventoryUIOptions>;
    private isVisible = false;
    private itemElements: Phaser.GameObjects.Container[] = [];
    
    constructor(scene: Scene, inventory: InventorySystem, options: InventoryUIOptions = {}) {
        this.scene = scene;
        this.inventory = inventory;
        
        // Set default options
        this.options = {
            x: options.x ?? 100,
            y: options.y ?? 100,
            width: options.width ?? 400,
            height: options.height ?? 500,
            padding: options.padding ?? 10,
            background: options.background ?? 0x000000,
            title: options.title ?? 'Inventory',
            columns: options.columns ?? 1,
            showWeight: options.showWeight ?? true,
            showGold: options.showGold ?? true,
            showClose: options.showClose ?? true
        };
        
        // Create main container
        this.container = this.scene.add.container(this.options.x, this.options.y);
        this.container.setVisible(false);
        
        // Create background
        this.background = this.scene.add.rectangle(
            0,
            0,
            this.options.width,
            this.options.height,
            this.options.background,
            0.8
        );
        this.background.setOrigin(0, 0);
        this.container.add(this.background);
        
        // Create title
        this.titleText = this.scene.add.text(
            this.options.padding,
            this.options.padding,
            this.options.title,
            { fontSize: '24px', color: '#ffffff' }
        );
        this.container.add(this.titleText);
        
        // Create close button if needed
        if (this.options.showClose) {
            this.closeButton = this.scene.add.text(
                this.options.width - this.options.padding - 20,
                this.options.padding,
                'X',
                { fontSize: '24px', color: '#ffffff' }
            );
            this.closeButton.setInteractive({ useHandCursor: true });
            this.closeButton.on('pointerdown', () => this.hide());
            this.container.add(this.closeButton);
        }
        
        // Create items container
        this.itemsContainer = this.scene.add.container(
            this.options.padding,
            this.titleText.y + this.titleText.height + this.options.padding
        );
        this.container.add(this.itemsContainer);
        
        // Create weight text if needed
        if (this.options.showWeight) {
            const weightCapacity = this.inventory.getWeightCapacity();
            this.weightText = this.scene.add.text(
                this.options.padding,
                this.options.height - this.options.padding - 20,
                `Weight: ${weightCapacity.current.toFixed(1)}/${weightCapacity.max.toFixed(1)}`,
                { fontSize: '16px', color: '#ffffff' }
            );
            this.container.add(this.weightText);
        }
        
        // Create gold text if needed
        if (this.options.showGold) {
            this.goldText = this.scene.add.text(
                this.options.width - this.options.padding - 100,
                this.options.height - this.options.padding - 20,
                `Gold: ${this.inventory.getGold()}`,
                { fontSize: '16px', color: '#ffff00' }
            );
            this.container.add(this.goldText);
        }
        
        // Listen for inventory events
        this.inventory.on('item-added', () => this.refresh());
        this.inventory.on('item-removed', () => this.refresh());
        this.inventory.on('item-moved', () => this.refresh());
        this.inventory.on('gold-changed', () => this.updateGold());
    }
    
    // Show the inventory UI
    show(): void {
        this.isVisible = true;
        this.container.setVisible(true);
        this.refresh();
    }
    
    // Hide the inventory UI
    hide(): void {
        this.isVisible = false;
        this.container.setVisible(false);
    }
    
    // Toggle visibility
    toggle(): void {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }
    
    // Refresh the inventory display
    refresh(): void {
        if (!this.isVisible) return;
        
        // Clear existing items
        this.clearItems();
        
        // Get all items and group them
        const groupedItems = this.getGroupedItems();
        
        // Display grouped items
        this.displayGroupedItems(groupedItems);
        
        // Update weight display
        this.updateWeight();
    }
    
    // Clear all displayed items
    private clearItems(): void {
        for (const element of this.itemElements) {
            element.destroy();
        }
        this.itemElements = [];
        this.itemsContainer.removeAll();
    }
    
    // Group identical items together
    private getGroupedItems(): GroupedItem[] {
        const allItems = this.inventory.getAllItems();
        const groupedMap = new Map<string, GroupedItem>();
        
        for (const [slotIndex, stack] of allItems.entries()) {
            if (!stack) continue;
            
            // Create a unique key for each item based on all its properties
            // This ensures items are only grouped if they are exactly the same
            const item = stack.item;
            const key = this.getItemUniqueKey(item);
            
            if (!groupedMap.has(key)) {
                groupedMap.set(key, {
                    item: item,
                    totalQuantity: 0,
                    totalWeight: 0,
                    slots: []
                });
            }
            
            const group = groupedMap.get(key);
            if (group) {
                group.totalQuantity += stack.quantity;
                group.totalWeight += stack.getTotalWeight();
                group.slots.push(slotIndex);
            }
        }
        
        return Array.from(groupedMap.values());
    }
    
    // Generate a unique key for an item based on all its properties
    private getItemUniqueKey(item: BaseItem): string {
        // Include all relevant properties that make items identical
        return `${item.id}-${item.name}-${item.level || 0}-${item.rarity}-${item.type}`;
    }
    
    // Display grouped items in the UI
    private displayGroupedItems(groupedItems: GroupedItem[]): void {
        const itemHeight = 50;
        const itemWidth = this.options.width - (this.options.padding * 2);
        const columnWidth = itemWidth / this.options.columns;
        
        for (const [index, groupedItem] of groupedItems.entries()) {
            const column = index % this.options.columns;
            const row = Math.floor(index / this.options.columns);
            
            const x = column * columnWidth;
            const y = row * itemHeight;
            
            // Create item container
            const itemContainer = this.scene.add.container(x, y);
            
            // Create item background
            const itemBg = this.scene.add.rectangle(
                0,
                0,
                columnWidth - 5,
                itemHeight - 5,
                0x333333,
                0.8
            );
            itemBg.setOrigin(0, 0);
            itemBg.setInteractive({ useHandCursor: true });
            
            // Add click handler
            itemBg.on('pointerdown', () => {
                // You can implement item selection or context menu here
                console.log('Item clicked:', groupedItem);
            });
            
            itemContainer.add(itemBg);
            
            // Create item name text with level if needed
            let nameText = groupedItem.item.name;
            if (groupedItem.item.level && groupedItem.item.level > 0) {
                nameText += ` (Lvl ${groupedItem.item.level})`;
            }
            
            const name = this.scene.add.text(
                5,
                5,
                nameText,
                { fontSize: '16px', color: groupedItem.item.getRarityColor() }
            );
            itemContainer.add(name);
            
            // Create quantity text
            const quantity = this.scene.add.text(
                5,
                25,
                `Qty: ${groupedItem.totalQuantity}`,
                { fontSize: '14px', color: '#ffffff' }
            );
            itemContainer.add(quantity);
            
            // Create weight text
            const weight = this.scene.add.text(
                columnWidth - 80,
                25,
                `Wt: ${groupedItem.totalWeight.toFixed(1)}`,
                { fontSize: '14px', color: '#ffffff' }
            );
            itemContainer.add(weight);
            
            // Add to items container
            this.itemsContainer.add(itemContainer);
            this.itemElements.push(itemContainer);
        }
    }
    
    // Update weight display
    private updateWeight(): void {
        if (!this.options.showWeight || !this.weightText) return;
        
        const weightCapacity = this.inventory.getWeightCapacity();
        this.weightText.setText(`Weight: ${weightCapacity.current.toFixed(1)}/${weightCapacity.max.toFixed(1)}`);
        
        // Change color based on capacity
        const ratio = weightCapacity.current / weightCapacity.max;
        let color = '#ffffff';
        
        if (ratio > 0.9) {
            color = '#ff0000'; // Red when almost full
        } else if (ratio > 0.7) {
            color = '#ffff00'; // Yellow when getting heavy
        }
        
        this.weightText.setColor(color);
    }
    
    // Update gold display
    private updateGold(): void {
        if (!this.options.showGold || !this.goldText) return;
        
        this.goldText.setText(`Gold: ${this.inventory.getGold()}`);
    }
    
    // Destroy the UI
    destroy(): void {
        this.container.destroy();
        
        // Remove event listeners
        this.inventory.off('item-added', () => this.refresh());
        this.inventory.off('item-removed', () => this.refresh());
        this.inventory.off('item-moved', () => this.refresh());
        this.inventory.off('gold-changed', () => this.updateGold());
    }
} 