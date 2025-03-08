import type { Scene } from 'phaser';
import { DOMUIHelper } from './DOMUIHelper';

/**
 * Options for the medieval menu
 */
export interface MedievalMenuOptions {
    position?: 'left' | 'right' | 'top' | 'bottom';
    orientation?: 'horizontal' | 'vertical';
    showIcons?: boolean;
    width?: string;
    iconSize?: string;
    menuButtonIcon?: string;
    menuButtonSize?: string;
    menuButtonText?: string;
}

/**
 * Menu item configuration
 */
export interface MenuItemConfig {
    id: string;
    label: string;
    icon?: string;
    onClick?: () => void;
    badge?: number | string;
}

/**
 * MedievalMenu - A medieval-themed HTML/CSS main menu
 * This class creates a DOM-based menu UI with customizable options
 */
export class MedievalMenu {
    private scene: Scene;
    private uiHelper: DOMUIHelper;
    
    // DOM Elements
    private container: HTMLDivElement;
    private menuButton: HTMLDivElement;
    private menuItems: Map<string, HTMLDivElement> = new Map();
    private activeItem: string | null = null;
    
    // State
    private isVisible = true;
    private options: Required<MedievalMenuOptions>;
    private menuItemConfigs: MenuItemConfig[] = [];
    
    constructor(scene: Scene, options: MedievalMenuOptions = {}) {
        this.scene = scene;
        this.uiHelper = new DOMUIHelper(scene);
        
        // Set default options
        this.options = {
            position: options.position || 'left',
            orientation: options.orientation || 'vertical',
            showIcons: options.showIcons !== undefined ? options.showIcons : true,
            width: options.width || '80px',
            iconSize: options.iconSize || '32px',
            menuButtonIcon: options.menuButtonIcon || '☰',
            menuButtonSize: options.menuButtonSize || '36px',
            menuButtonText: options.menuButtonText || 'Menu'
        };
        
        // Load the CSS files
        this.uiHelper.loadCSS('/styles/medieval-menu.css');
        
        // Create the menu button first (always visible)
        this.createMenuButton();
        
        // Create the main container
        this.createContainer();
        
        // Add default menu items
        this.addDefaultMenuItems();
    }
    
    /**
     * Creates the menu button that's always visible
     */
    private createMenuButton(): void {
        this.menuButton = this.uiHelper.createElement<HTMLDivElement>('div', 'medieval-menu-button');
        
        // Apply styles
        const styles: Partial<CSSStyleDeclaration> = {
            position: 'fixed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(30, 30, 30, 0.8)',
            border: '2px solid #8b7250',
            borderRadius: '8px',
            padding: '8px 16px',
            cursor: 'pointer',
            zIndex: '1001',
            boxShadow: '0 0 10px rgba(0, 0, 0, 0.5)',
            bottom: '20px',
            right: '20px',
            fontSize: '16px',
            fontFamily: 'serif',
            fontWeight: 'bold',
            color: '#d4b483'
        };
        
        Object.assign(this.menuButton.style, styles);
        
        // Create icon and text container
        const iconContainer = this.uiHelper.createElement<HTMLSpanElement>('span', 'menu-button-icon');
        iconContainer.textContent = this.options.menuButtonIcon;
        iconContainer.style.marginRight = '8px';
        iconContainer.style.fontSize = '18px';
        
        const textContainer = this.uiHelper.createElement<HTMLSpanElement>('span', 'menu-button-text');
        textContainer.textContent = this.options.menuButtonText;
        
        // Add icon and text to button
        this.menuButton.appendChild(iconContainer);
        this.menuButton.appendChild(textContainer);
        
        // Add click handler to toggle menu
        this.menuButton.addEventListener('click', (event) => {
            event.stopPropagation();
            event.preventDefault();
            
            console.log('[MedievalMenu] Menu button clicked');
            this.toggle();
        });
        
        // Add hover effects
        this.menuButton.addEventListener('mouseenter', () => {
            this.menuButton.style.backgroundColor = 'rgba(139, 114, 80, 0.5)';
            this.menuButton.style.transform = 'scale(1.05)';
        });
        
        this.menuButton.addEventListener('mouseleave', () => {
            if (!this.isVisible) {
                this.menuButton.style.backgroundColor = 'rgba(30, 30, 30, 0.8)';
            }
            this.menuButton.style.transform = 'scale(1)';
        });
        
        // Add to the DOM
        document.body.appendChild(this.menuButton);
    }
    
    /**
     * Creates the main container for the menu
     */
    private createContainer(): void {
        this.container = this.uiHelper.createContainer('medieval-menu');
        
        // Set position based on options
        const position = this.options.position;
        const orientation = this.options.orientation;
        
        // Apply styles based on position and orientation
        const styles: Partial<CSSStyleDeclaration> = {
            position: 'fixed',
            display: 'flex',
            flexDirection: orientation === 'vertical' ? 'column' : 'row',
            background: 'rgba(30, 30, 30, 0.8)',
            border: '2px solid #8b7250',
            borderRadius: '8px',
            padding: '10px',
            boxShadow: '0 0 10px rgba(0, 0, 0, 0.5)',
            zIndex: '1000',
            bottom: '70px',
            right: '20px'
        };
        
        // Apply width
        if (orientation === 'vertical') {
            styles.width = this.options.width;
        }
        
        Object.assign(this.container.style, styles);
        
        // Add to the DOM
        document.body.appendChild(this.container);
    }
    
    /**
     * Adds the default menu items
     */
    private addDefaultMenuItems(): void {
        this.menuItemConfigs = [
            { id: 'inventory', label: 'Inventory', icon: '🎒' },
            { id: 'communication', label: 'Communication', icon: '💬' },
            { id: 'craft', label: 'Craft', icon: '⚒️' },
            { id: 'map', label: 'Map', icon: '🗺️' },
            { id: 'character', label: 'Character', icon: '👤' },
            { id: 'leaderboard', label: 'Leaderboard', icon: '🏆' },
            { id: 'skills', label: 'Skills', icon: '⚔️' },
            { id: 'settings', label: 'Settings', icon: '⚙️' }
        ];
        
        // Create menu items
        for (const item of this.menuItemConfigs) {
            this.createMenuItem(item);
        }
    }
    
    /**
     * Creates a menu item
     */
    private createMenuItem(config: MenuItemConfig): void {
        const { id, label, icon, onClick, badge } = config;
        
        console.log(`[MedievalMenu] Creating menu item: ${id}`);
        
        // Create the menu item container
        const menuItem = this.uiHelper.createElement<HTMLDivElement>('div', 'medieval-menu-item');
        menuItem.dataset.id = id;
        
        // Apply styles
        const styles: Partial<CSSStyleDeclaration> = {
            display: 'flex',
            alignItems: 'center',
            justifyContent: this.options.orientation === 'vertical' ? 'flex-start' : 'center',
            padding: '10px',
            margin: '5px 0',
            cursor: 'pointer',
            borderRadius: '5px',
            transition: 'background-color 0.2s, transform 0.1s',
            position: 'relative'
        };
        
        Object.assign(menuItem.style, styles);
        
        // Add icon if enabled
        if (this.options.showIcons && icon) {
            const iconElement = this.uiHelper.createElement<HTMLDivElement>('div', 'medieval-menu-icon');
            iconElement.textContent = icon;
            
            const iconStyles: Partial<CSSStyleDeclaration> = {
                fontSize: this.options.iconSize,
                marginRight: this.options.orientation === 'vertical' ? '10px' : '0',
                marginBottom: this.options.orientation === 'horizontal' ? '5px' : '0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            };
            
            Object.assign(iconElement.style, iconStyles);
            menuItem.appendChild(iconElement);
        }
        
        // Add label
        const labelElement = this.uiHelper.createElement<HTMLDivElement>('div', 'medieval-menu-label');
        labelElement.textContent = label;
        
        // Show label based on orientation
        if (this.options.orientation === 'vertical') {
            labelElement.style.display = 'block';
        } else {
            labelElement.style.fontSize = '0.8em';
            labelElement.style.marginTop = '5px';
        }
        
        menuItem.appendChild(labelElement);
        
        // Add badge if provided
        if (badge !== undefined) {
            this.addBadge(menuItem, badge);
        }
        
        // Add click handler with detailed logging
        menuItem.addEventListener('click', (event) => {
            event.stopPropagation();
            event.preventDefault();
            
            console.log(`[MedievalMenu] Menu item clicked: ${id}`);
            console.log("[MedievalMenu] Event target:", event.target);
            console.log("[MedievalMenu] onClick handler exists:", !!onClick);
            
            // Set this item as active
            this.setActiveItem(id);
            
            // Execute the onClick handler if it exists
            if (onClick) {
                console.log(`[MedievalMenu] Executing onClick handler for: ${id}`);
                try {
                    onClick();
                    console.log(`[MedievalMenu] onClick handler executed successfully for: ${id}`);
                } catch (error) {
                    console.error(`[MedievalMenu] Error executing onClick handler for: ${id}`, error);
                }
            } else {
                console.log(`[MedievalMenu] No onClick handler defined for: ${id}`);
            }
        });
        
        // Add hover effects
        menuItem.addEventListener('mouseenter', () => {
            console.log(`[MedievalMenu] Mouse enter on menu item: ${id}`);
            if (id !== this.activeItem) {
                menuItem.style.backgroundColor = 'rgba(139, 114, 80, 0.3)';
            }
        });
        
        menuItem.addEventListener('mouseleave', () => {
            console.log(`[MedievalMenu] Mouse leave on menu item: ${id}`);
            if (id !== this.activeItem) {
                menuItem.style.backgroundColor = '';
            }
        });
        
        // Add to container
        this.container.appendChild(menuItem);
        console.log(`[MedievalMenu] Menu item added to container: ${id}`);
        
        // Store reference
        this.menuItems.set(id, menuItem);
        console.log(`[MedievalMenu] Menu item reference stored: ${id}`);
    }
    
    /**
     * Adds a badge to a menu item
     */
    private addBadge(menuItem: HTMLDivElement, value: number | string): void {
        const badge = this.uiHelper.createElement<HTMLDivElement>('div', 'medieval-menu-badge');
        badge.textContent = value.toString();
        
        const badgeStyles: Partial<CSSStyleDeclaration> = {
            position: 'absolute',
            top: '0',
            right: '0',
            backgroundColor: '#e74c3c',
            color: 'white',
            borderRadius: '50%',
            width: '20px',
            height: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: 'bold',
            transform: 'translate(50%, -50%)'
        };
        
        Object.assign(badge.style, badgeStyles);
        menuItem.appendChild(badge);
    }
    
    /**
     * Sets the active menu item
     */
    public setActiveItem(id: string | null): void {
        // Reset previous active item
        if (this.activeItem && this.menuItems.has(this.activeItem)) {
            const prevItem = this.menuItems.get(this.activeItem);
            if (prevItem) {
                prevItem.style.backgroundColor = '';
                prevItem.style.transform = '';
                prevItem.classList.remove('active');
            }
        }
        
        // Set new active item
        if (id && this.menuItems.has(id)) {
            const newItem = this.menuItems.get(id);
            if (newItem) {
                newItem.style.backgroundColor = 'rgba(139, 114, 80, 0.6)';
                newItem.style.transform = 'scale(1.05)';
                newItem.classList.add('active');
                this.activeItem = id;
            }
        } else {
            this.activeItem = null;
        }
    }
    
    /**
     * Updates a badge value for a menu item
     */
    public updateBadge(id: string, value: number | string | undefined): void {
        if (!this.menuItems.has(id)) return;
        
        const menuItem = this.menuItems.get(id);
        if (!menuItem) return;
        
        // Remove existing badge
        const existingBadge = menuItem.querySelector('.medieval-menu-badge');
        if (existingBadge) {
            menuItem.removeChild(existingBadge);
        }
        
        // Add new badge if value is provided
        if (value !== undefined) {
            this.addBadge(menuItem, value);
        }
    }
    
    /**
     * Sets a click handler for a menu item
     */
    public setClickHandler(id: string, handler: () => void): void {
        console.log(`[MedievalMenu] Setting click handler for menu item: ${id}`);
        
        // First, update the config
        const config = this.menuItemConfigs.find(item => item.id === id);
        if (config) {
            config.onClick = handler;
            console.log(`[MedievalMenu] Click handler set in config for: ${id}`);
        } else {
            console.warn(`[MedievalMenu] Failed to set click handler: Menu item with id '${id}' not found in configs`);
            return;
        }
        
        // Then, update the DOM element's click handler
        const menuItem = this.menuItems.get(id);
        if (menuItem) {
            console.log(`[MedievalMenu] Found menu item DOM element for: ${id}`);
            
            // Remove existing event listeners by cloning the node
            const oldMenuItem = menuItem;
            const newMenuItem = oldMenuItem.cloneNode(true) as HTMLDivElement;
            
            // Preserve dataset properties
            newMenuItem.dataset.id = id;
            
            // Replace the old element with the new one
            if (oldMenuItem.parentNode) {
                console.log(`[MedievalMenu] Replacing old menu item with new one for: ${id}`);
                oldMenuItem.parentNode.replaceChild(newMenuItem, oldMenuItem);
                
                // Add the new click handler
                newMenuItem.addEventListener('click', (event) => {
                    event.stopPropagation();
                    event.preventDefault();
                    
                    console.log(`[MedievalMenu] Menu item clicked (updated handler): ${id}`);
                    console.log("[MedievalMenu] Event target:", event.target);
                    this.setActiveItem(id);
                    console.log(`[MedievalMenu] Executing updated onClick handler for: ${id}`);
                    handler();
                });
                
                // Update the reference
                this.menuItems.set(id, newMenuItem);
                console.log(`[MedievalMenu] Updated menu item reference for: ${id}`);
                
                // Add hover effects
                newMenuItem.addEventListener('mouseenter', () => {
                    if (id !== this.activeItem) {
                        newMenuItem.style.backgroundColor = 'rgba(139, 114, 80, 0.3)';
                    }
                });
                
                newMenuItem.addEventListener('mouseleave', () => {
                    if (id !== this.activeItem) {
                        newMenuItem.style.backgroundColor = '';
                    }
                });
            } else {
                console.error(`[MedievalMenu] Cannot replace menu item: parent node is null for: ${id}`);
            }
        } else {
            console.error(`[MedievalMenu] Failed to set click handler: Menu item DOM element with id '${id}' not found`);
        }
    }
    
    /**
     * Shows the menu
     */
    public show(): void {
        console.log('[MedievalMenu] Show method called, isVisible:', this.isVisible);
        if (!this.isVisible) {
            console.log('[MedievalMenu] Setting display to flex');
            this.container.style.display = 'flex';
            this.isVisible = true;
            
            // Update menu button appearance
            this.menuButton.style.backgroundColor = 'rgba(139, 114, 80, 0.5)';
            
            console.log('[MedievalMenu] Menu is now visible');
        } else {
            console.log('[MedievalMenu] Menu is already visible, no action taken');
        }
    }
    
    /**
     * Hides the menu
     */
    public hide(): void {
        console.log('[MedievalMenu] Hide method called, isVisible:', this.isVisible);
        if (this.isVisible) {
            console.log('[MedievalMenu] Setting display to none');
            this.container.style.display = 'none';
            this.isVisible = false;
            
            // Update menu button appearance
            this.menuButton.style.backgroundColor = 'rgba(30, 30, 30, 0.8)';
            
            console.log('[MedievalMenu] Menu is now hidden');
        } else {
            console.log('[MedievalMenu] Menu is already hidden, no action taken');
        }
    }
    
    /**
     * Toggles the menu visibility
     */
    public toggle(): void {
        console.log('[MedievalMenu] Toggle method called, current isVisible:', this.isVisible);
        if (this.isVisible) {
            console.log('[MedievalMenu] Menu is visible, hiding it');
            this.hide();
        } else {
            console.log('[MedievalMenu] Menu is hidden, showing it');
            this.show();
        }
        console.log('[MedievalMenu] Toggle complete, new isVisible:', this.isVisible);
    }
    
    /**
     * Destroys the menu and removes it from the DOM
     */
    public destroy(): void {
        // Remove the menu container
        if (this.container?.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
        
        // Remove the menu button
        if (this.menuButton?.parentNode) {
            this.menuButton.parentNode.removeChild(this.menuButton);
        }
    }
} 