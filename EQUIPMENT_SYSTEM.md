# Equipment System for Phaser Game

This document explains how to use the equipment system to visually display different equipment (head, weapon, armor) on the player character.

## Overview

The equipment system allows players to equip different items that will be visually displayed on their character. The system supports:

- Weapons (swords, axes, etc.)
- Armor (helmets, chest plates, etc.)
- Visual representation of equipped items
- Animation of equipment during attacks

## How It Works

1. The `EquipmentSystem` manages equipment assets and animations
2. The `PlayerSystem` handles displaying equipment on the player character
3. The `InventorySystem` manages equipping and unequipping items

## Adding New Equipment

To add new equipment visuals:

1. Add the equipment sprite to the appropriate directory:
   - Weapons: `public/assets/weapons/`
   - Armor: `public/assets/armors/`

2. Register the equipment in `EquipmentSystem.ts`:

```typescript
// For weapons
this.registerWeaponVisual('weapon_sword_epic', {
    key: 'weapon_sword_epic',
    frameWidth: 32,
    frameHeight: 32,
    assetPath: 'assets/epic_sword.png'
});

// For armor
this.registerArmorVisual('armor_helmet_epic', {
    key: 'armor_helmet_epic',
    frameWidth: 24,
    frameHeight: 24,
    assetPath: 'assets/epic_helmet.png'
});
```

3. Create the item in your game:

```typescript
const epicSword = new WeaponItem({
    id: 'epic_sword',
    name: 'Epic Sword',
    description: 'A powerful sword',
    iconUrl: 'assets/epic_sword.png',
    type: ItemType.WEAPON,
    weaponType: WeaponType.SWORD,
    rarity: ItemRarity.EPIC,
    // ... other properties
});
```

## Equipment Demo Scene

The `EquipmentDemoScene` demonstrates how to use the equipment system. You can access it by:

1. Starting the game
2. Navigating to the equipment demo scene

In the demo, you can:
- Equip different items
- See how they appear on the character
- Move around to see how equipment follows the player

## Integration with Existing Systems

The equipment system integrates with:

1. **Inventory System**: When items are equipped/unequipped in the inventory, the visual representation updates automatically.

2. **Combat System**: When attacking, weapon animations play to show the attack motion.

3. **Player System**: Equipment visuals follow the player and match their orientation.

## Customizing Equipment Positioning

You can customize how equipment is positioned on the player by modifying the `positionEquipment` method in `PlayerSystem.ts`:

```typescript
private positionEquipment(slot: EquipmentSlot, sprite: Phaser.GameObjects.Sprite): void {
    // Set offsets based on equipment slot
    switch (slot) {
        case 'head':
            // Position slightly above player's center
            sprite.setOrigin(0.5, 0.5);
            sprite.y = this.player.y - 15;
            break;
            
        // ... other slots
    }
}
```

## Animated Equipment

For equipment with animations (like glowing weapons):

1. Create a spritesheet for the equipment
2. Register it with frames:

```typescript
this.registerWeaponVisual('weapon_magic_sword', {
    key: 'weapon_magic_sword',
    frameWidth: 32,
    frameHeight: 32,
    frames: 4,  // Number of animation frames
    animationFrameRate: 8,
    assetPath: 'assets/magic_sword.png'
});
```

The system will automatically create idle and attack animations for the equipment. 