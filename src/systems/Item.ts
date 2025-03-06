import { Scene } from 'phaser';

// Enum for item types
export enum ItemType {
    WEAPON = 'weapon',
    ARMOR = 'armor',
    CONSUMABLE = 'consumable',
    RESOURCE = 'resource',
    QUEST = 'quest',
    TOOL = 'tool',
    MISC = 'misc',
    FOOD = 'food'
}

// Enum for item rarities
export enum ItemRarity {
    COMMON = 'common',
    UNCOMMON = 'uncommon',
    RARE = 'rare',
    EPIC = 'epic',
    LEGENDARY = 'legendary',
    MYTHIC = 'mythic'
}

// Enum for weapon types
export enum WeaponType {
    SWORD = 'sword',
    AXE = 'axe',
    BOW = 'bow',
    STAFF = 'staff',
    DAGGER = 'dagger',
    SPEAR = 'spear',
    SHURIKEN = 'shuriken',
    CROSSBOW = 'crossbow',
    
}

// Enum for armor types
export enum ArmorType {
    HELMET = 'helmet',
    CHEST = 'chest',
    BOOTS = 'boots',
    SHIELD = 'shield'
}

// Enum for fruit types
export enum FruitType {
    APPLE = 'apple',
    ORANGE = 'orange',
    BANANA = 'banana',
    CHERRY = 'cherry',
    STRAWBERRY = 'strawberry',
    PEAR = 'pear',
    LEMON = 'lemon',
    WATERMELON = 'watermelon'
}

// Interface for item attributes
export interface ItemAttributes {
    damage?: number;
    defense?: number;
    attackSpeed?: number;
    poison?: boolean;
    normal?: boolean;
    fire?: boolean;
    ice?: boolean;
    electric?: boolean;
    holy?: boolean;
    demonic?: boolean;
    
}

// Interface for crafting requirements
export interface CraftingRequirement {
    itemId: string;
    quantity: number;
}

// Base item interface
export interface IItem {
    id: string;
    name: string;
    description: string;
    iconUrl: string;
    type: ItemType;
    rarity: ItemRarity;
    weight: number;
    value: number; // Gold value when sold
    level?: number;
    stackable: boolean;
    maxStackSize: number;
    usable: boolean;
    attributes?: ItemAttributes;
    craftingRequirements?: CraftingRequirement[];
    durability?: number;
    maxDurability?: number;
    uses?: number;
    maxUses?: number;
}

// Base Item class that implements the IItem interface
export class BaseItem implements IItem {
    id: string;
    name: string;
    description: string;
    iconUrl: string;
    type: ItemType;
    rarity: ItemRarity;
    weight: number;
    value: number;
    level?: number;
    stackable: boolean;
    maxStackSize: number;
    usable: boolean;
    attributes?: ItemAttributes;
    craftingRequirements?: CraftingRequirement[];
    durability?: number;
    maxDurability?: number;
    uses?: number;
    maxUses?: number;

    constructor(itemData: IItem) {
        this.id = itemData.id;
        this.name = itemData.name;
        this.description = itemData.description;
        this.iconUrl = itemData.iconUrl;
        this.type = itemData.type;
        this.rarity = itemData.rarity;
        this.weight = itemData.weight;
        this.value = itemData.value;
        this.level = itemData.level;
        this.stackable = itemData.stackable;
        this.maxStackSize = itemData.maxStackSize;
        this.usable = itemData.usable;
        this.attributes = itemData.attributes;
        this.craftingRequirements = itemData.craftingRequirements;
        this.durability = itemData.durability;
        this.maxDurability = itemData.maxDurability;
        this.uses = itemData.uses;
        this.maxUses = itemData.maxUses;
    }

    // Common methods
    use(): boolean {
        if (!this.usable) return false;
        
        if (this.uses !== undefined && this.maxUses !== undefined) {
            if (this.uses <= 0) return false;
            this.uses--;
        }
        
        return true;
    }
    
    applyDamage(amount: number): boolean {
        if (this.durability === undefined || this.maxDurability === undefined) return false;
        
        this.durability = Math.max(0, this.durability - amount);
        return this.durability > 0;
    }
    
    repair(amount: number): boolean {
        if (this.durability === undefined || this.maxDurability === undefined) return false;
        
        this.durability = Math.min(this.maxDurability, this.durability + amount);
        return true;
    }
    
    isBroken(): boolean {
        if (this.durability === undefined) return false;
        return this.durability <= 0;
    }
    
    getRepairCost(): number {
        if (this.durability === undefined || this.maxDurability === undefined) return 0;
        
        const missingDurability = this.maxDurability - this.durability;
        return Math.ceil((missingDurability / this.maxDurability) * this.value * 0.5);
    }
    
    getConditionPercentage(): number {
        if (this.durability === undefined || this.maxDurability === undefined) return 100;
        return Math.floor((this.durability / this.maxDurability) * 100);
    }
    
    // Get a color representation of the item's condition
    getConditionColor(): string {
        const percentage = this.getConditionPercentage();
        
        if (percentage > 75) return '#00FF00'; // Green
        if (percentage > 50) return '#FFFF00'; // Yellow
        if (percentage > 25) return '#FFA500'; // Orange
        return '#FF0000'; // Red
    }
    
    // Get a color representation of the item's rarity
    getRarityColor(): string {
        switch (this.rarity) {
            case ItemRarity.COMMON: return '#FFFFFF'; // White
            case ItemRarity.UNCOMMON: return '#00FF00'; // Green
            case ItemRarity.RARE: return '#0070DD'; // Blue
            case ItemRarity.EPIC: return '#A335EE'; // Purple
            case ItemRarity.LEGENDARY: return '#FF8000'; // Orange
            default: return '#FFFFFF';
        }
    }
    
    // Get a formatted string with the item name colored by rarity
    getFormattedName(): string {
        return `<span style="color: ${this.getRarityColor()}">${this.name}</span>`;
    }
    
    // Clone this item
    clone(): BaseItem {
        return new BaseItem({...this});
    }
}

// Specialized class for Weapon items
export class WeaponItem extends BaseItem {
    weaponType: WeaponType;
    
    constructor(itemData: IItem & { weaponType: WeaponType }) {
        super(itemData);
        this.weaponType = itemData.weaponType;
        this.type = ItemType.WEAPON;
    }
    
    getAttackDamage(): number {
        if (!this.attributes || this.attributes.damage === undefined) return 0;
        
        // Factor in condition - weapons at lower durability do less damage
        if (this.durability !== undefined && this.maxDurability !== undefined) {
            const conditionFactor = Math.max(0.5, this.durability / this.maxDurability);
            return Math.floor(this.attributes.damage * conditionFactor);
        }
        
        return this.attributes.damage;
    }
}

// Specialized class for Armor items
export class ArmorItem extends BaseItem {
    armorType: ArmorType;
    
    constructor(itemData: IItem & { armorType: ArmorType }) {
        super(itemData);
        this.armorType = itemData.armorType;
        this.type = ItemType.ARMOR;
    }
    
    getDefenseValue(): number {
        if (!this.attributes || this.attributes.defense === undefined) return 0;
        
        // Factor in condition - armor at lower durability provides less defense
        if (this.durability !== undefined && this.maxDurability !== undefined) {
            const conditionFactor = Math.max(0.5, this.durability / this.maxDurability);
            return Math.floor(this.attributes.defense * conditionFactor);
        }
        
        return this.attributes.defense;
    }
}

// Specialized class for Consumable items
export class ConsumableItem extends BaseItem {
    // Effects that happen when the item is consumed
    healthRestore?: number;
    tempAttributes?: ItemAttributes;
    effectDuration?: number; // In milliseconds
    
    constructor(itemData: IItem & {
        healthRestore?: number,
        tempAttributes?: ItemAttributes,
        effectDuration?: number
    }) {
        super(itemData);
        this.type = ItemType.CONSUMABLE;
        this.healthRestore = itemData.healthRestore;
        this.tempAttributes = itemData.tempAttributes;
        this.effectDuration = itemData.effectDuration;
    }
    
    override use(): boolean {
        // Use the base implementation first to decrement uses if applicable
        if (!super.use()) return false;
        
        // Consumable-specific logic would be implemented by the consumer of this class
        // For example, the player system would apply healing, etc.
        
        return true;
    }
}

// Fruit item class
export class FruitItem extends ConsumableItem {
    fruitType: FruitType;
    spriteFrame: number;
    
    constructor(itemData: IItem & {
        fruitType: FruitType,
        spriteFrame: number,
        healthRestore?: number,
        tempAttributes?: ItemAttributes,
        effectDuration?: number
    }) {
        super(itemData);
        this.fruitType = itemData.fruitType;
        this.spriteFrame = itemData.spriteFrame;
    }
    
    override clone(): FruitItem {
        return new FruitItem({
            ...this,
            attributes: this.attributes ? { ...this.attributes } : undefined,
            tempAttributes: this.tempAttributes ? { ...this.tempAttributes } : undefined,
            craftingRequirements: this.craftingRequirements ? [...this.craftingRequirements] : undefined
        });
    }
}

// Item stack class for inventory management
export class ItemStack {
    item: BaseItem;
    quantity: number;
    
    constructor(item: BaseItem, quantity: number = 1) {
        this.item = item;
        this.quantity = Math.min(quantity, item.maxStackSize);
    }
    
    // Add items to the stack, respecting the max stack size
    add(count: number): number {
        const spaceAvailable = this.item.maxStackSize - this.quantity;
        const amountToAdd = Math.min(count, spaceAvailable);
        
        this.quantity += amountToAdd;
        return count - amountToAdd; // Return the remaining amount that couldn't be added
    }
    
    // Remove items from the stack
    remove(count: number): number {
        const amountToRemove = Math.min(count, this.quantity);
        this.quantity -= amountToRemove;
        return amountToRemove;
    }
    
    // Check if the stack can accept more of this item
    canAddMore(): boolean {
        return this.quantity < this.item.maxStackSize;
    }
    
    // Get the space available in this stack
    getAvailableSpace(): number {
        return this.item.maxStackSize - this.quantity;
    }
    
    // Check if the stack is empty
    isEmpty(): boolean {
        return this.quantity <= 0;
    }
    
    // Check if another item can stack with this one
    canStackWith(otherItem: BaseItem): boolean {
        if (!this.item.stackable || !otherItem.stackable) return false;
        return this.item.id === otherItem.id;
    }
    
    // Split this stack into two stacks
    split(amount: number): ItemStack | null {
        if (amount <= 0 || amount >= this.quantity) return null;
        
        const newStack = new ItemStack(this.item.clone(), amount);
        this.quantity -= amount;
        return newStack;
    }
    
    // Get the total weight of this stack
    getTotalWeight(): number {
        return this.item.weight * this.quantity;
    }
    
    // Get the total value of this stack
    getTotalValue(): number {
        return this.item.value * this.quantity;
    }
}

// Item System class to manage items
export class ItemSystem {
    private scene: Scene;
    private itemDatabase: Map<string, BaseItem> = new Map();
    
    constructor(scene: Scene) {
        this.scene = scene;
        this.initializeItems();
    }
    
    // Initialize the item database with predefined items
    private initializeItems(): void {
        // Example items - in a real game, these would probably be loaded from a JSON file
        
        // Add some weapons
        const rustySword = new WeaponItem({
            id: 'weapon_rusty_sword',
            name: 'Rusty Sword',
            description: 'An old, rusty sword. Not very effective, but better than nothing.',
            iconUrl: '/items/rusty_sword.png',
            type: ItemType.WEAPON,
            weaponType: WeaponType.SWORD,
            rarity: ItemRarity.COMMON,
            weight: 2.5,
            value: 5,
            level: 1,
            stackable: false,
            maxStackSize: 1,
            usable: true,
            attributes: {
                damage: 3,
                attackSpeed: 1.2
            },
            durability: 20,
            maxDurability: 20
        });
        
        // Add some armor
        const leatherChest = new ArmorItem({
            id: 'armor_leather_chest',
            name: 'Leather Chest',
            description: 'A basic leather chest piece. Offers minimal protection.',
            iconUrl: '/items/leather_chest.png',
            type: ItemType.ARMOR,
            armorType: ArmorType.CHEST,
            rarity: ItemRarity.COMMON,
            weight: 3.0,
            value: 8,
            level: 1,
            stackable: false,
            maxStackSize: 1,
            usable: true,
            attributes: {
                defense: 5
            },
            durability: 30,
            maxDurability: 30
        });
        
        // Add some consumables
        const minorHealingPotion = new ConsumableItem({
            id: 'consumable_minor_healing_potion',
            name: 'Minor Healing Potion',
            description: 'A small potion that restores a little health.',
            iconUrl: '/items/minor_healing_potion.png',
            type: ItemType.CONSUMABLE,
            rarity: ItemRarity.COMMON,
            weight: 0.2,
            value: 5,
            stackable: true,
            maxStackSize: 20,
            usable: true,
            uses: 1,
            maxUses: 1,
            healthRestore: 20
        });
        
        // Add some resources
        const wood = new BaseItem({
            id: 'resource_wood',
            name: 'Wood',
            description: 'A piece of wood. Used in crafting.',
            iconUrl: '/items/wood.png',
            type: ItemType.RESOURCE,
            rarity: ItemRarity.COMMON,
            weight: 1.0,
            value: 1,
            stackable: true,
            maxStackSize: 50,
            usable: false
        });
        
        // Add fruit items
        const apple = new FruitItem({
            id: 'food_apple',
            name: 'Apple',
            description: 'A fresh apple. Restores a small amount of health.',
            iconUrl: '/items/fruits.png',
            type: ItemType.FOOD,
            rarity: ItemRarity.COMMON,
            weight: 0.2,
            value: 2,
            stackable: true,
            maxStackSize: 10,
            usable: true,
            fruitType: FruitType.APPLE,
            spriteFrame: 0,
            healthRestore: 5,
            uses: 1,
            maxUses: 1
        });
        
        const orange = new FruitItem({
            id: 'food_orange',
            name: 'Orange',
            description: 'A juicy orange. Restores a small amount of health.',
            iconUrl: '/items/fruits.png',
            type: ItemType.FOOD,
            rarity: ItemRarity.COMMON,
            weight: 0.2,
            value: 2,
            stackable: true,
            maxStackSize: 10,
            usable: true,
            fruitType: FruitType.ORANGE,
            spriteFrame: 1,
            healthRestore: 6,
            uses: 1,
            maxUses: 1
        });
        
        const cherry = new FruitItem({
            id: 'food_cherry',
            name: 'Cherry',
            description: 'A sweet cherry. Restores a tiny amount of health.',
            iconUrl: '/items/fruits.png',
            type: ItemType.FOOD,
            rarity: ItemRarity.COMMON,
            weight: 0.1,
            value: 1,
            stackable: true,
            maxStackSize: 20,
            usable: true,
            fruitType: FruitType.CHERRY,
            spriteFrame: 3,
            healthRestore: 3,
            uses: 1,
            maxUses: 1
        });
        
        // Register all items in the database
        this.registerItem(rustySword);
        this.registerItem(leatherChest);
        this.registerItem(minorHealingPotion);
        this.registerItem(wood);
        this.registerItem(apple);
        this.registerItem(orange);
        this.registerItem(cherry);
    }
    
    // Register a new item in the database
    registerItem(item: BaseItem): void {
        this.itemDatabase.set(item.id, item);
    }
    
    // Get an item by ID
    getItem(id: string): BaseItem | undefined {
        return this.itemDatabase.get(id);
    }
    
    // Create a new instance of an item by ID
    createItem(id: string): BaseItem | null {
        const template = this.getItem(id);
        if (!template) return null;
        
        return template.clone();
    }
    
    // Get all items of a specific type
    getItemsByType(type: ItemType): BaseItem[] {
        const items: BaseItem[] = [];
        
        this.itemDatabase.forEach(item => {
            if (item.type === type) {
                items.push(item);
            }
        });
        
        return items;
    }
    
    // Get all items that match a search term
    searchItems(term: string): BaseItem[] {
        const items: BaseItem[] = [];
        const searchTerm = term.toLowerCase();
        
        this.itemDatabase.forEach(item => {
            if (
                item.name.toLowerCase().includes(searchTerm) ||
                item.description.toLowerCase().includes(searchTerm)
            ) {
                items.push(item);
            }
        });
        
        return items;
    }
} 