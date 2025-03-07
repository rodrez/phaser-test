# Inventory System

This inventory system provides a comprehensive solution for managing items in your Phaser game. It includes features for grouping identical items, displaying item details, and managing inventory weight.

## Features

- **Item Grouping**: Items with identical properties are automatically grouped together in the UI
- **Item Details**: Display item name, level (if applicable), quantity, and weight
- **Weight Management**: Track total inventory weight with visual indicators when approaching capacity
- **Gold Management**: Track player's gold with built-in display
- **Customizable UI**: Adjust columns, size, colors, and other display options

## Components

The inventory system consists of the following components:

1. **Item.ts**: Defines item types, attributes, and base classes
2. **Inventory.ts**: Manages the inventory slots, adding/removing items, and weight calculations
3. **InventoryUI.ts**: Handles the visual representation of the inventory with grouped items
4. **InventoryDemo.ts**: Provides a demo scene to showcase the inventory system

## Usage

### Basic Setup

```typescript
// Create inventory system
const inventory = new InventorySystem(scene, {
    maxSlots: 20,
    maxWeight: 50,
    startingGold: 100
});

// Create inventory UI
const inventoryUI = new InventoryUI(scene, inventory, {
    x: 100,
    y: 100,
    width: 400,
    height: 500,
    columns: 1,
    title: 'Inventory'
});

// Show the inventory
inventoryUI.show();
```

### Adding Items

```typescript
// Create an item
const sword = new BaseItem({
    id: 'sword',
    name: 'Steel Sword',
    description: 'A sharp steel sword',
    iconUrl: 'assets/items/sword.png',
    type: ItemType.WEAPON,
    rarity: ItemRarity.RARE,
    weight: 2.5,
    value: 100,
    level: 5,
    stackable: false,
    maxStackSize: 1,
    usable: true,
    attributes: {
        damage: 15,
        attackSpeed: 1.2
    }
});

// Add to inventory
inventory.addItem(sword);
```

### Grouping Items

Items are automatically grouped in the UI if they have identical properties. The grouping is based on:

- Item ID
- Item name
- Item level
- Item rarity
- Item type

This ensures that only truly identical items are grouped together.

### Keyboard Controls

The demo scene includes the following keyboard controls:

- **I**: Toggle inventory visibility
- **1-5**: Add different types of items
- **C**: Clear inventory

## Customization

The InventoryUI class accepts various options to customize the appearance:

```typescript
const inventoryUI = new InventoryUI(scene, inventory, {
    x: 100,                  // X position
    y: 100,                  // Y position
    width: 400,              // Width of the inventory panel
    height: 500,             // Height of the inventory panel
    padding: 10,             // Internal padding
    background: 0x000000,    // Background color
    title: 'Inventory',      // Title text
    columns: 2,              // Number of columns for items
    showWeight: true,        // Show weight indicator
    showGold: true,          // Show gold amount
    showClose: true          // Show close button
});
```

## Events

The inventory system emits events that you can listen to:

```typescript
inventory.on('item-added', (data) => {
    console.log('Item added:', data);
});

inventory.on('item-removed', (data) => {
    console.log('Item removed:', data);
});

inventory.on('item-moved', (data) => {
    console.log('Item moved:', data);
});

inventory.on('gold-changed', (data) => {
    console.log('Gold changed:', data);
});
``` 