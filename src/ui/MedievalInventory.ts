import type { Scene } from 'phaser';
import { DOMUIHelper } from './DOMUIHelper';
import { ItemRarity } from '../systems/Item';
import type { BaseItem } from '../systems/Item';
import type { InventorySystem } from '../systems/Inventory';

/**
 * Interface for inventory item display
 */
interface InventoryItemDisplay {
    item: BaseItem;
    quantity: number;
    slots: number[];
}

/**
 * Options for the medieval inventory
 */
export interface MedievalInventoryOptions {
    title?: string;
    showWeight?: boolean;
    showFilters?: boolean;
    showSearch?: boolean;
    maxHeight?: string;
    width?: string;
}

/**
 * MedievalInventory - A medieval-themed HTML/CSS inventory display
 * This class creates a DOM-based inventory UI with item grouping, filtering, and search
 */
export class MedievalInventory {
    private scene: Scene;
    private inventory: InventorySystem;
    private uiHelper: DOMUIHelper;
    
    // DOM Elements
    private container: HTMLDivElement;
    private header: HTMLDivElement;
    private titleElement: HTMLDivElement;
    private closeButton: HTMLButtonElement;
    private searchContainer: HTMLDivElement;
    private searchInput: HTMLInputElement;
    private filterContainer: HTMLDivElement;
    private filterButtons: Map<string, HTMLButtonElement> = new Map();
    private itemsContainer: HTMLDivElement;
    private weightDisplay: HTMLDivElement;
    
    // State
    private isVisible = false;
    private activeFilter: string | null = null;
    private searchTerm = '';
    private options: Required<MedievalInventoryOptions>;
    
    constructor(scene: Scene, inventory: InventorySystem, options: MedievalInventoryOptions = {}) {
        this.scene = scene;
        this.inventory = inventory;
        this.uiHelper = new DOMUIHelper(scene);
        
        // Set default options
        this.options = {
            title: options.title || 'Inventory',
            showWeight: options.showWeight !== undefined ? options.showWeight : true,
            showFilters: options.showFilters !== undefined ? options.showFilters : true,
            showSearch: options.showSearch !== undefined ? options.showSearch : true,
            maxHeight: options.maxHeight || '70vh',
            width: options.width || '400px'
        };
        
        // Load CSS
        this.uiHelper.loadCSS('/styles/medieval-inventory.css');
        
        // Create UI elements
        this.createContainer();
        this.createHeader();
        
        if (this.options.showSearch) {
            this.createSearchBar();
        }
        
        if (this.options.showFilters) {
            this.createFilterButtons();
        }
        
        this.createItemsContainer();
        
        if (this.options.showWeight) {
            this.createWeightDisplay();
        }
        
        // Now that all UI elements are created, set the active filter
        if (this.options.showFilters) {
            this.setActiveFilter(null);
        }
        
        // Add to DOM but hide initially
        document.body.appendChild(this.container);
        this.hide();
        
        // Subscribe to inventory events
        this.inventory.on('item-added', () => this.refresh());
        this.inventory.on('item-removed', () => this.refresh());
        this.inventory.on('item-moved', () => this.refresh());
        this.inventory.on('item-equipped', () => this.refresh());
        this.inventory.on('item-unequipped', () => this.refresh());
    }
    
    /**
     * Creates the main container
     */
    private createContainer(): void {
        this.container = this.uiHelper.createContainer(
            'medieval-inventory',
            {
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: this.options.width,
                maxHeight: this.options.maxHeight,
                backgroundColor: '#2a1a0a', // Dark brown background
                color: '#e8d4b9', // Light parchment text color
                borderRadius: '8px',
                border: '3px solid',
                borderImage: 'linear-gradient(to bottom, #c8a165, #8b5a2b) 1',
                padding: '0',
                fontFamily: 'Cinzel, "Times New Roman", serif', // Medieval-style font
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.8), inset 0 0 15px rgba(200, 161, 101, 0.2)',
                display: 'flex',
                flexDirection: 'column',
                zIndex: '1000',
                overflow: 'hidden'
            }
        );
    }
    
    /**
     * Creates the header with title and close button
     */
    private createHeader(): void {
        this.header = this.uiHelper.createContainer(
            'inventory-header',
            {
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 15px',
                borderBottom: '2px solid #8b5a2b',
                backgroundColor: 'rgba(0, 0, 0, 0.2)'
            }
        );
        
        this.titleElement = this.uiHelper.createElement<HTMLDivElement>(
            'div',
            'inventory-title',
            {
                fontSize: '1.2rem',
                fontWeight: 'bold'
            },
            this.header
        );
        this.titleElement.textContent = this.options.title;
        
        this.closeButton = this.uiHelper.createButton(
            '×',
            'inventory-close-btn',
            () => this.hide(),
            {
                fontSize: '1.5rem',
                background: 'none',
                border: 'none',
                color: '#e8d4b9',
                cursor: 'pointer',
                padding: '0 5px',
                lineHeight: '1'
            }
        );
        
        this.header.appendChild(this.closeButton);
        this.container.appendChild(this.header);
    }
    
    /**
     * Creates the search bar
     */
    private createSearchBar(): void {
        this.searchContainer = this.uiHelper.createContainer(
            'inventory-search',
            {
                padding: '10px 15px',
                borderBottom: '1px solid #8b5a2b'
            }
        );
        
        this.searchInput = this.uiHelper.createElement<HTMLInputElement>(
            'input',
            'inventory-search-input',
            {
                width: '96%',
                padding: '8px 10px',
                backgroundColor: 'rgba(0, 0, 0, 0.2)',
                border: '1px solid #8b5a2b',
                borderRadius: '4px',
                color: '#e8d4b9',
                fontSize: '0.9rem'
            }
        );
        
        this.searchInput.type = 'text';
        this.searchInput.placeholder = 'Search items...';
        this.searchInput.addEventListener('input', () => {
            this.searchTerm = this.searchInput.value.toLowerCase();
            this.refresh();
        });
        
        this.searchContainer.appendChild(this.searchInput);
        this.container.appendChild(this.searchContainer);
    }
    
    /**
     * Creates filter buttons for item types
     */
    private createFilterButtons(): void {
        this.filterContainer = this.uiHelper.createContainer(
            'inventory-filters',
            {
                display: 'flex',
                flexWrap: 'wrap',
                padding: '10px 15px',
                gap: '5px',
                borderBottom: '1px solid #8b5a2b',
                backgroundColor: 'rgba(0, 0, 0, 0.1)'
            }
        );
        
        // Add "All" filter
        const allButton = this.createFilterButton('All', null);
        this.filterButtons.set('all', allButton);
        
        // Add type filters
        const types = ['weapon', 'armor', 'consumable', 'resource', 'quest', 'tool', 'misc'];
        for (const type of types) {
            const button = this.createFilterButton(
                type.charAt(0).toUpperCase() + type.slice(1), 
                type
            );
            this.filterButtons.set(type, button);
        }
        
        this.container.appendChild(this.filterContainer);
        
        // Note: We'll set the active filter after all UI elements are created
        // Don't call setActiveFilter here
    }
    
    /**
     * Creates a single filter button
     */
    private createFilterButton(label: string, filterValue: string | null): HTMLButtonElement {
        const button = this.uiHelper.createButton(
            label,
            'inventory-filter-btn',
            () => this.setActiveFilter(filterValue),
            {
                padding: '5px 10px',
                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid #8b5a2b',
                borderRadius: '4px',
                color: '#e8d4b9',
                cursor: 'pointer',
                fontSize: '0.8rem',
                transition: 'all 0.2s ease'
            }
        );
        
        this.filterContainer.appendChild(button);
        return button;
    }
    
    /**
     * Sets the active filter and updates the UI
     */
    private setActiveFilter(filter: string | null): void {
        this.activeFilter = filter;
        
        // Update button styles
        for (const [type, button] of this.filterButtons) {
            if ((type === 'all' && filter === null) || type === filter) {
                button.style.backgroundColor = '#8b5a2b';
                button.style.color = '#fff';
            } else {
                button.style.backgroundColor = 'rgba(0, 0, 0, 0.3)';
                button.style.color = '#e8d4b9';
            }
        }
        
        this.refresh();
    }
    
    /**
     * Creates the container for inventory items
     */
    private createItemsContainer(): void {
        this.itemsContainer = this.uiHelper.createContainer(
            'inventory-items',
            {
                padding: '10px',
                overflowY: 'auto',
                flex: '1',
                display: 'flex',
                flexDirection: 'column',
                gap: '5px'
            }
        );
        
        this.container.appendChild(this.itemsContainer);
    }
    
    /**
     * Creates the weight display
     */
    private createWeightDisplay(): void {
        this.weightDisplay = this.uiHelper.createContainer(
            'inventory-weight',
            {
                padding: '10px 15px',
                borderTop: '1px solid #8b5a2b',
                textAlign: 'right',
                fontSize: '0.9rem',
                backgroundColor: 'rgba(0, 0, 0, 0.2)'
            }
        );
        
        this.container.appendChild(this.weightDisplay);
        this.updateWeightDisplay();
    }
    
    /**
     * Updates the weight display
     */
    private updateWeightDisplay(): void {
        if (!this.options.showWeight || !this.weightDisplay) return;
        
        const { current, max } = this.inventory.getWeightCapacity();
        const percentage = Math.floor((current / max) * 100);
        
        // Determine color based on weight percentage
        let color = '#4CAF50'; // Green
        if (percentage > 90) {
            color = '#F44336'; // Red
        } else if (percentage > 75) {
            color = '#FF9800'; // Orange
        } else if (percentage > 50) {
            color = '#FFEB3B'; // Yellow
        }
        
        this.weightDisplay.innerHTML = `Weight: <span style="color: ${color}">${current.toFixed(1)}/${max} (${percentage}%)</span>`;
    }
    
    /**
     * Groups similar items together
     */
    private getGroupedItems(): InventoryItemDisplay[] {
        const allItems = this.inventory.getAllItems();
        const groupedItems: Map<string, InventoryItemDisplay> = new Map();
        
        allItems.forEach((stack, slotIndex) => {
            if (!stack) return;
            
            const item = stack.item;
            
            // Skip if filtered out
            if (this.activeFilter && item.type.toLowerCase() !== this.activeFilter) {
                return;
            }
            
            // Skip if doesn't match search
            if (this.searchTerm && !this.matchesSearch(item)) {
                return;
            }
            
            // Create a unique key for the item
            const key = this.getItemUniqueKey(item);
            
            if (groupedItems.has(key)) {
                // Add to existing group
                const group = groupedItems.get(key);
                if (group) {
                    group.quantity += stack.quantity;
                    group.slots.push(slotIndex);
                }
            } else {
                // Create new group
                groupedItems.set(key, {
                    item,
                    quantity: stack.quantity,
                    slots: [slotIndex]
                });
            }
        });
        
        return Array.from(groupedItems.values());
    }
    
    /**
     * Checks if an item matches the current search term
     */
    private matchesSearch(item: BaseItem): boolean {
        const term = this.searchTerm.toLowerCase();
        return (
            item.name.toLowerCase().includes(term) ||
            item.description.toLowerCase().includes(term) ||
            item.type.toLowerCase().includes(term) ||
            item.rarity.toLowerCase().includes(term)
        );
    }
    
    /**
     * Creates a unique key for grouping identical items
     */
    private getItemUniqueKey(item: BaseItem): string {
        // For stackable items, we just need the ID
        if (item.stackable) {
            return item.id;
        }
        
        // For non-stackable items, we need to consider durability and other properties
        // that might make them different from each other
        return `${item.id}-${item.durability || 0}-${item.uses || 0}`;
    }
    
    /**
     * Refreshes the inventory display
     */
    public refresh(): void {
        // Safety check - make sure itemsContainer exists
        if (!this.itemsContainer) {
            return;
        }
        
        // Clear existing items
        this.itemsContainer.innerHTML = '';
        
        // Get grouped items
        const groupedItems = this.getGroupedItems();
        
        if (groupedItems.length === 0) {
            // Show empty message
            const emptyMessage = this.uiHelper.createElement<HTMLDivElement>(
                'div',
                'inventory-empty',
                {
                    padding: '20px',
                    textAlign: 'center',
                    color: '#8b5a2b',
                    fontStyle: 'italic'
                },
                this.itemsContainer
            );
            
            emptyMessage.textContent = 'No items found';
        } else {
            // Display items
            for (const group of groupedItems) {
                this.createItemElement(group);
            }
        }
        
        // Update weight display
        this.updateWeightDisplay();
    }
    
    /**
     * Creates an item element in the inventory
     */
    private createItemElement(itemDisplay: InventoryItemDisplay): void {
        const { item, quantity, slots } = itemDisplay;
        
        // Create item row
        const itemRow = this.uiHelper.createElement<HTMLDivElement>(
            'div',
            'inventory-item',
            {
                display: 'flex',
                alignItems: 'center',
                padding: '8px 10px',
                backgroundColor: 'rgba(0, 0, 0, 0.2)',
                borderRadius: '4px',
                border: '1px solid #8b5a2b',
                gap: '10px',
                cursor: 'pointer'
            }
        );
        
        // Add hover effect
        itemRow.addEventListener('mouseenter', () => {
            itemRow.style.backgroundColor = 'rgba(139, 90, 43, 0.3)';
        });
        
        itemRow.addEventListener('mouseleave', () => {
            itemRow.style.backgroundColor = 'rgba(0, 0, 0, 0.2)';
        });
        
        // Add click handler to use/equip item
        itemRow.addEventListener('click', () => {
            if (slots.length > 0) {
                // Try to use or equip the item from the first slot
                const slotIndex = slots[0];
                
                if (item.type === 'weapon' || item.type === 'armor') {
                    this.inventory.equipItem(slotIndex);
                } else if (item.usable) {
                    this.inventory.useItem(slotIndex);
                }
            }
        });
        
        // Create item icon
        const iconContainer = this.uiHelper.createElement<HTMLDivElement>(
            'div',
            'item-icon-container',
            {
                width: '32px',
                height: '32px',
                position: 'relative',
                flexShrink: '0'
            },
            itemRow
        );
        
        const icon = this.uiHelper.createElement<HTMLImageElement>(
            'img',
            'item-icon',
            {
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                border: `1px solid ${this.getRarityBorderColor(item.rarity)}`,
                borderRadius: '4px',
                backgroundColor: 'rgba(0, 0, 0, 0.5)'
            },
            iconContainer
        );
        
        icon.src = item.iconUrl;
        icon.alt = item.name;
        
        // Create item details container
        const detailsContainer = this.uiHelper.createElement<HTMLDivElement>(
            'div',
            'item-details',
            {
                flex: '1',
                overflow: 'hidden'
            },
            itemRow
        );
        
        // Create item name with rarity color
        const nameElement = this.uiHelper.createElement<HTMLDivElement>(
            'div',
            'item-name',
            {
                fontWeight: 'bold',
                color: this.getRarityColor(item.rarity),
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
            },
            detailsContainer
        );
        
        nameElement.textContent = item.name;
        
        // Add level if present
        if (item.level) {
            nameElement.textContent += ` (Lvl ${item.level})`;
        }
        
        // Create item info row (type, weight, etc)
        const infoRow = this.uiHelper.createElement<HTMLDivElement>(
            'div',
            'item-info',
            {
                display: 'flex',
                fontSize: '0.8rem',
                color: '#a89682',
                marginTop: '2px'
            },
            detailsContainer
        );
        
        // Item type
        const typeElement = this.uiHelper.createElement<HTMLDivElement>(
            'div',
            'item-type',
            {
                marginRight: '10px'
            },
            infoRow
        );
        
        typeElement.textContent = item.type.charAt(0).toUpperCase() + item.type.slice(1);
        
        // Item weight
        const weightElement = this.uiHelper.createElement<HTMLDivElement>(
            'div',
            'item-weight',
            {},
            infoRow
        );
        
        const totalWeight = (item.weight * quantity).toFixed(1);
        weightElement.textContent = `${totalWeight} wt`;
        
        // Create quantity badge if more than 1
        if (quantity > 1) {
            const quantityBadge = this.uiHelper.createElement<HTMLDivElement>(
                'div',
                'item-quantity',
                {
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    color: '#fff',
                    padding: '2px 6px',
                    borderRadius: '10px',
                    fontSize: '0.8rem',
                    marginLeft: 'auto',
                    fontWeight: 'bold'
                },
                itemRow
            );
            
            quantityBadge.textContent = `x${quantity}`;
        }
        
        // Add to container
        this.itemsContainer.appendChild(itemRow);
    }
    
    /**
     * Gets the color for an item's rarity
     */
    private getRarityColor(rarity: ItemRarity): string {
        switch (rarity) {
            case ItemRarity.COMMON: return '#FFFFFF'; // White
            case ItemRarity.UNCOMMON: return '#00FF00'; // Green
            case ItemRarity.RARE: return '#0070DD'; // Blue
            case ItemRarity.EPIC: return '#A335EE'; // Purple
            case ItemRarity.LEGENDARY: return '#FF8000'; // Orange
            case ItemRarity.MYTHIC: return '#FF0000'; // Red
            default: return '#FFFFFF';
        }
    }
    
    /**
     * Gets the border color for an item's rarity
     */
    private getRarityBorderColor(rarity: ItemRarity): string {
        switch (rarity) {
            case ItemRarity.COMMON: return '#9d9d9d'; // Gray
            case ItemRarity.UNCOMMON: return '#1eff00'; // Green
            case ItemRarity.RARE: return '#0070dd'; // Blue
            case ItemRarity.EPIC: return '#a335ee'; // Purple
            case ItemRarity.LEGENDARY: return '#ff8000'; // Orange
            case ItemRarity.MYTHIC: return '#ff0000'; // Red
            default: return '#9d9d9d';
        }
    }
    
    /**
     * Shows the inventory
     */
    public show(): void {
        this.container.style.display = 'flex';
        this.isVisible = true;
        this.refresh();
        
        // Focus search input if available
        if (this.searchInput) {
            setTimeout(() => this.searchInput.focus(), 100);
        }
    }
    
    /**
     * Hides the inventory
     */
    public hide(): void {
        this.container.style.display = 'none';
        this.isVisible = false;
    }
    
    /**
     * Toggles the inventory visibility
     */
    public toggle(): void {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }
    
    /**
     * Cleans up resources
     */
    public destroy(): void {
        if (this.container?.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
    }
} 