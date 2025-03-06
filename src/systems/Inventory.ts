import { Scene } from 'phaser';
import { BaseItem, ItemStack, ItemType } from './Item';

// Slot type for equipped items
export type EquipmentSlot = 'head' | 'chest' | 'legs' | 'feet' | 'hands' | 'mainHand' | 'offHand' | 'necklace' | 'ring1' | 'ring2';

// Interface for inventory options
export interface InventoryOptions {
    maxSlots?: number;
    maxWeight?: number;
    startingGold?: number;
}

// Event data for inventory events
export interface InventoryEventData {
    item?: BaseItem;
    stack?: ItemStack;
    slot?: number;
    equipmentSlot?: EquipmentSlot;
    quantity?: number;
}

export class InventorySystem {
    private scene: Scene;
    
    // Basic inventory properties
    private slots: (ItemStack | null)[] = [];
    private maxSlots: number;
    private maxWeight: number;
    private gold: number;
    
    // Equipment slots
    private equipment: Map<EquipmentSlot, ItemStack | null> = new Map();
    
    // Event emitter for inventory events
    private events: Phaser.Events.EventEmitter;
    
    constructor(scene: Scene, options: InventoryOptions = {}) {
        this.scene = scene;
        this.maxSlots = options.maxSlots || 20;
        this.maxWeight = options.maxWeight || 50;
        this.gold = options.startingGold || 0;
        
        // Initialize inventory slots
        for (let i = 0; i < this.maxSlots; i++) {
            this.slots.push(null);
        }
        
        // Initialize equipment slots
        const equipmentSlots: EquipmentSlot[] = [
            'head', 'chest', 'legs', 'feet', 'hands', 
            'mainHand', 'offHand', 'necklace', 'ring1', 'ring2'
        ];
        
        equipmentSlots.forEach(slot => {
            this.equipment.set(slot, null);
        });
        
        // Create event emitter
        this.events = new Phaser.Events.EventEmitter();
    }
    
    // Get the current gold amount
    getGold(): number {
        return this.gold;
    }
    
    // Add gold to the inventory
    addGold(amount: number): void {
        if (amount <= 0) return;
        
        this.gold += amount;
        this.events.emit('gold-changed', { amount });
    }
    
    // Remove gold from the inventory
    removeGold(amount: number): boolean {
        if (amount <= 0) return false;
        if (this.gold < amount) return false;
        
        this.gold -= amount;
        this.events.emit('gold-changed', { amount: -amount });
        return true;
    }
    
    // Get all items in the inventory
    getAllItems(): (ItemStack | null)[] {
        return [...this.slots];
    }
    
    // Get all equipped items
    getEquippedItems(): Map<EquipmentSlot, ItemStack | null> {
        return new Map(this.equipment);
    }
    
    // Get a specific equipped item
    getEquippedItem(slot: EquipmentSlot): ItemStack | null {
        return this.equipment.get(slot) || null;
    }
    
    // Calculate the total current weight of the inventory
    getCurrentWeight(): number {
        let totalWeight = 0;
        
        // Add weight from inventory
        this.slots.forEach(stack => {
            if (stack) {
                totalWeight += stack.getTotalWeight();
            }
        });
        
        // Add weight from equipped items
        this.equipment.forEach(stack => {
            if (stack) {
                totalWeight += stack.getTotalWeight();
            }
        });
        
        return totalWeight;
    }
    
    // Check if the inventory has enough space for a given weight
    hasWeightCapacity(weight: number): boolean {
        return this.getCurrentWeight() + weight <= this.maxWeight;
    }
    
    // Get the weight capacity
    getWeightCapacity(): { current: number, max: number } {
        return {
            current: this.getCurrentWeight(),
            max: this.maxWeight
        };
    }
    
    // Find the first free slot
    findFreeSlot(): number {
        return this.slots.findIndex(slot => slot === null);
    }
    
    // Find existing stack of the same item that has space
    findStackWithSpace(item: BaseItem): number {
        if (!item.stackable) return -1;
        
        return this.slots.findIndex(stack => {
            if (!stack) return false;
            return stack.canStackWith(item) && stack.canAddMore();
        });
    }
    
    // Add an item to the inventory
    addItem(item: BaseItem, quantity: number = 1): boolean {
        if (quantity <= 0) return false;
        
        // Check if we have enough weight capacity
        const totalWeight = item.weight * quantity;
        if (!this.hasWeightCapacity(totalWeight)) {
            this.events.emit('inventory-full', { item, quantity });
            return false;
        }
        
        let remaining = quantity;
        
        // First try to add to existing stacks
        if (item.stackable) {
            for (let i = 0; i < this.slots.length && remaining > 0; i++) {
                const stack = this.slots[i];
                if (stack && stack.canStackWith(item) && stack.canAddMore()) {
                    const leftover = stack.add(remaining);
                    remaining = leftover;
                    
                    this.events.emit('item-added', { 
                        item, 
                        stack, 
                        slot: i,
                        quantity: quantity - remaining 
                    });
                    
                    if (remaining === 0) break;
                }
            }
        }
        
        // If we still have items left, create new stacks
        while (remaining > 0) {
            const freeSlot = this.findFreeSlot();
            if (freeSlot === -1) {
                // No more free slots
                this.events.emit('inventory-full', { 
                    item, 
                    quantity: remaining 
                });
                return quantity !== remaining; // Return true if at least some items were added
            }
            
            // Create a new stack in the free slot
            const stackSize = Math.min(remaining, item.maxStackSize);
            const newStack = new ItemStack(item.clone(), stackSize);
            this.slots[freeSlot] = newStack;
            
            remaining -= stackSize;
            
            this.events.emit('item-added', { 
                item, 
                stack: newStack, 
                slot: freeSlot,
                quantity: stackSize 
            });
        }
        
        return true;
    }
    
    // Remove an item from a specific slot
    removeItemFromSlot(slotIndex: number, quantity: number = 1): ItemStack | null {
        if (slotIndex < 0 || slotIndex >= this.slots.length) return null;
        if (quantity <= 0) return null;
        
        const stack = this.slots[slotIndex];
        if (!stack) return null;
        
        if (quantity >= stack.quantity) {
            // Remove the entire stack
            this.slots[slotIndex] = null;
            
            this.events.emit('item-removed', { 
                item: stack.item, 
                stack, 
                slot: slotIndex,
                quantity: stack.quantity 
            });
            
            return stack;
        } else {
            // Remove part of the stack
            const removedQuantity = stack.remove(quantity);
            
            // Create a new stack for the removed items
            const removedStack = new ItemStack(stack.item.clone(), removedQuantity);
            
            this.events.emit('item-removed', { 
                item: stack.item, 
                stack: removedStack, 
                slot: slotIndex,
                quantity: removedQuantity 
            });
            
            return removedStack;
        }
    }
    
    // Remove a specific item (by ID) from the inventory
    removeItemById(itemId: string, quantity: number = 1): boolean {
        if (quantity <= 0) return false;
        
        let remaining = quantity;
        
        // Find all stacks with this item
        for (let i = 0; i < this.slots.length && remaining > 0; i++) {
            const stack = this.slots[i];
            if (stack && stack.item.id === itemId) {
                const amountToRemove = Math.min(remaining, stack.quantity);
                this.removeItemFromSlot(i, amountToRemove);
                remaining -= amountToRemove;
            }
        }
        
        return remaining < quantity; // Return true if at least some items were removed
    }
    
    // Move an item from one slot to another
    moveItem(fromSlot: number, toSlot: number, quantity: number = 1): boolean {
        if (fromSlot < 0 || fromSlot >= this.slots.length) return false;
        if (toSlot < 0 || toSlot >= this.slots.length) return false;
        if (fromSlot === toSlot) return false;
        if (quantity <= 0) return false;
        
        const sourceStack = this.slots[fromSlot];
        if (!sourceStack) return false;
        
        const targetStack = this.slots[toSlot];
        
        // If target slot is empty, simply move the stack (or part of it)
        if (!targetStack) {
            if (quantity >= sourceStack.quantity) {
                // Move the entire stack
                this.slots[toSlot] = sourceStack;
                this.slots[fromSlot] = null;
            } else {
                // Split the stack
                const newStack = sourceStack.split(quantity);
                if (!newStack) return false;
                
                this.slots[toSlot] = newStack;
            }
            
            this.events.emit('item-moved', {
                item: sourceStack.item,
                slot: toSlot,
                quantity
            });
            
            return true;
        }
        
        // If target slot has an item, check if we can stack them
        if (sourceStack.canStackWith(targetStack.item)) {
            const amountToMove = Math.min(quantity, sourceStack.quantity, targetStack.getAvailableSpace());
            if (amountToMove <= 0) return false;
            
            // Remove from source
            sourceStack.remove(amountToMove);
            
            // Add to target
            targetStack.add(amountToMove);
            
            // Clean up empty source stack
            if (sourceStack.isEmpty()) {
                this.slots[fromSlot] = null;
            }
            
            this.events.emit('item-moved', {
                item: sourceStack.item,
                slot: toSlot,
                quantity: amountToMove
            });
            
            return true;
        }
        
        // If we can't stack, swap the items
        this.slots[fromSlot] = targetStack;
        this.slots[toSlot] = sourceStack;
        
        this.events.emit('item-swapped', {
            slot: fromSlot
        });
        
        return true;
    }
    
    // Equip an item from a specific inventory slot
    equipItem(slotIndex: number): boolean {
        if (slotIndex < 0 || slotIndex >= this.slots.length) return false;
        
        const stack = this.slots[slotIndex];
        if (!stack) return false;
        
        const item = stack.item;
        
        // Determine the equipment slot based on item type and subtype
        let equipSlot: EquipmentSlot | null = null;
        
        switch (item.type) {
            case ItemType.WEAPON:
                equipSlot = 'mainHand';
                break;
            case ItemType.ARMOR:
                // Cast as any to access armorType property
                const armorType = (item as any).armorType;
                if (armorType) {
                    switch (armorType) {
                        case 'helmet': equipSlot = 'head'; break;
                        case 'chest': equipSlot = 'chest'; break;
                        case 'legs': equipSlot = 'legs'; break;
                        case 'boots': equipSlot = 'feet'; break;
                        case 'gloves': equipSlot = 'hands'; break;
                        case 'shield': equipSlot = 'offHand'; break;
                    }
                }
                break;
            default:
                return false; // Item can't be equipped
        }
        
        if (!equipSlot) return false;
        
        // Check if something is already equipped in that slot
        const existingItem = this.equipment.get(equipSlot) || null;
        
        // Swap with the existing item if any
        this.equipment.set(equipSlot, stack);
        this.slots[slotIndex] = existingItem;
        
        this.events.emit('item-equipped', {
            item: stack.item,
            equipmentSlot: equipSlot
        });
        
        return true;
    }
    
    // Unequip an item from a specific equipment slot
    unequipItem(equipSlot: EquipmentSlot): boolean {
        const equippedItem = this.equipment.get(equipSlot);
        if (!equippedItem) return false;
        
        // Find a free inventory slot
        const freeSlot = this.findFreeSlot();
        if (freeSlot === -1) {
            this.events.emit('inventory-full', { item: equippedItem.item });
            return false;
        }
        
        // Move the item from equipment to inventory
        this.slots[freeSlot] = equippedItem;
        this.equipment.set(equipSlot, null);
        
        this.events.emit('item-unequipped', {
            item: equippedItem.item,
            equipmentSlot: equipSlot,
            slot: freeSlot
        });
        
        return true;
    }
    
    // Use an item from a specific slot
    useItem(slotIndex: number): boolean {
        if (slotIndex < 0 || slotIndex >= this.slots.length) return false;
        
        const stack = this.slots[slotIndex];
        if (!stack || !stack.item.usable) return false;
        
        // Emit event before using the item
        this.events.emit('item-using', {
            item: stack.item,
            slot: slotIndex
        });
        
        // Use the item
        const result = stack.item.use();
        
        // If item was used successfully
        if (result) {
            this.events.emit('item-used', {
                item: stack.item,
                slot: slotIndex
            });
            
            // Check if the item has been consumed
            if (stack.item.uses !== undefined && stack.item.uses <= 0) {
                this.removeItemFromSlot(slotIndex, 1);
            }
            
            return true;
        }
        
        return false;
    }
    
    // Check if the player has a specific item
    hasItem(itemId: string, quantity: number = 1): boolean {
        if (quantity <= 0) return false;
        
        let count = 0;
        
        // Count items in inventory
        for (const stack of this.slots) {
            if (stack && stack.item.id === itemId) {
                count += stack.quantity;
                if (count >= quantity) return true;
            }
        }
        
        // Check equipped items too
        for (const [_, stack] of this.equipment) {
            if (stack && stack.item.id === itemId) {
                count += stack.quantity;
                if (count >= quantity) return true;
            }
        }
        
        return false;
    }
    
    // Calculate the total value of all items in the inventory
    getTotalInventoryValue(): number {
        let totalValue = 0;
        
        // Add value from inventory
        this.slots.forEach(stack => {
            if (stack) {
                totalValue += stack.getTotalValue();
            }
        });
        
        // Add value from equipped items
        this.equipment.forEach(stack => {
            if (stack) {
                totalValue += stack.getTotalValue();
            }
        });
        
        return totalValue;
    }
    
    // Subscribe to an inventory event
    on(event: string, callback: (data: InventoryEventData) => void): void {
        this.events.on(event, callback);
    }
    
    // Remove an event subscription
    off(event: string, callback: (data: InventoryEventData) => void): void {
        this.events.off(event, callback);
    }
} 