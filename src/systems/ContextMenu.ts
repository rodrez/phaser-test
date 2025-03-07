import { Scene } from 'phaser';

type ContextMenuOption = {
    text: string;
    callback: () => void;
    icon?: string;
    enabled?: boolean;
};

type ContextMenuConfig = {
    width?: number;
    itemHeight?: number;
    background?: {
        color?: number;
        alpha?: number;
        radius?: number;
    };
    text?: {
        color?: string;
        fontFamily?: string;
        fontSize?: string;
    };
    hoverColor?: number;
    iconSize?: number;
};

export class ContextMenuSystem {
    private scene: Scene;
    private container: Phaser.GameObjects.Container;
    private background: Phaser.GameObjects.Graphics;
    private options: ContextMenuOption[] = [];
    private config: ContextMenuConfig;
    private isOpen: boolean = false;
    private selectedIndex: number = -1;
    private optionItems: {
        background: Phaser.GameObjects.Rectangle;
        text: Phaser.GameObjects.Text;
        icon?: Phaser.GameObjects.Image;
    }[] = [];

    constructor(scene: Scene, config: ContextMenuConfig = {}) {
        this.scene = scene;
        this.config = {
            width: config.width || 250,
            itemHeight: config.itemHeight || 40,
            background: {
                color: config.background?.color || 0x2a1a0a, // Dark brown background
                alpha: config.background?.alpha || 0.95,
                radius: config.background?.radius || 0 // Square corners for medieval look
            },
            text: {
                color: config.text?.color || '#e8d4b9', // Light parchment color
                fontFamily: config.text?.fontFamily || 'Cinzel, Times New Roman, serif', // Medieval-style font
                fontSize: config.text?.fontSize || '16px'
            },
            hoverColor: config.hoverColor || 0x4a3520, // Dark brown hover
            iconSize: config.iconSize || 24
        };

        // Create container for menu
        this.container = this.scene.add.container(0, 0);
        this.container.setDepth(1000); // Make sure it's on top of everything
        this.container.setVisible(false);

        // Create background graphics
        this.background = this.scene.add.graphics();
        this.container.add(this.background);

        // Add input listeners
        this.setupInputListeners();
    }

    /**
     * Shows the context menu with the specified options at the given position
     */
    show(x: number, y: number, options: ContextMenuOption[]): void {
        // Update options and clear any existing menu items
        this.options = options;
        this.clearMenuItems();
        
        // Position the menu in the center of the screen if no coordinates provided
        if (x === undefined || y === undefined) {
            const { width, height } = this.scene.scale;
            x = width / 2;
            y = height / 2;
        }
        
        this.container.setPosition(x, y);
        
        // Draw menu
        this.drawMenu();
        
        // Show the container
        this.container.setVisible(true);
        this.isOpen = true;
        
        // Reset selected index
        this.selectedIndex = -1;
    }

    /**
     * Hides the context menu
     */
    hide(): void {
        this.container.setVisible(false);
        this.isOpen = false;
        this.selectedIndex = -1;
    }

    /**
     * Checks if the context menu is currently open
     */
    getIsOpen(): boolean {
        return this.isOpen;
    }

    /**
     * Handles item selection
     */
    private selectOption(index: number): void {
        console.log(`Selecting option at index ${index}`);
        if (index >= 0 && index < this.options.length && this.options[index].enabled !== false) {
            console.log(`Option is valid: ${this.options[index].text}`);
            try {
                // Execute the callback
                this.options[index].callback();
                console.log(`Callback executed for ${this.options[index].text}`);
            } catch (error) {
                console.error(`Error executing callback for ${this.options[index].text}:`, error);
            }
            
            // Hide the menu
            this.hide();
        } else {
            console.log(`Option is invalid or disabled: index=${index}, options length=${this.options.length}, enabled=${index >= 0 && index < this.options.length ? this.options[index].enabled : 'N/A'}`);
        }
    }

    /**
     * Draws the menu with background and options
     */
    private drawMenu(): void {
        const totalHeight = this.options.length * this.config.itemHeight!;
        const width = this.config.width!;
        
        // Draw background
        this.background.clear();
        this.background.fillStyle(this.config.background!.color!, this.config.background!.alpha!);
        this.background.fillRoundedRect(-width/2, -totalHeight/2, width, totalHeight, this.config.background!.radius!);
        
        // Add border for medieval look
        this.background.lineStyle(3, 0x8b5a2b, 1); // Brown border
        this.background.strokeRoundedRect(-width/2, -totalHeight/2, width, totalHeight, this.config.background!.radius!);
        
        console.log(`Drawing menu with ${this.options.length} options`);
        
        // Create menu items
        for (let i = 0; i < this.options.length; i++) {
            const option = this.options[i];
            const yPos = -totalHeight/2 + i * this.config.itemHeight! + this.config.itemHeight!/2;
            
            // Create background for the item
            const bg = this.scene.add.rectangle(0, yPos, width, this.config.itemHeight!, 0x000000, 0);
            bg.setOrigin(0.5);
            bg.setInteractive({ useHandCursor: true });
            
            // Add separator line between items (except for the last one)
            if (i < this.options.length - 1) {
                const separator = this.scene.add.graphics();
                separator.lineStyle(1, 0x8b5a2b, 0.5); // Brown separator
                separator.beginPath();
                separator.moveTo(-width/2 + 10, yPos + this.config.itemHeight!/2);
                separator.lineTo(width/2 - 10, yPos + this.config.itemHeight!/2);
                separator.strokePath();
                this.container.add(separator);
            }
            
            // Make disabled options appear grayed out
            const textColor = option.enabled === false ? '#666666' : this.config.text!.color;
            
            // Create text
            const textX = option.icon ? -width/2 + 40 : -width/2 + 20;
            const text = this.scene.add.text(textX, yPos, option.text, {
                fontFamily: this.config.text!.fontFamily,
                fontSize: this.config.text!.fontSize,
                color: textColor
            });
            text.setOrigin(0, 0.5);
            
            // Add text shadow for medieval look
            text.setShadow(1, 1, 'rgba(0,0,0,0.5)', 2);
            
            // Create icon if provided
            let icon;
            if (option.icon) {
                try {
                    // Try the original texture first
                    let textureKey = option.icon;
                    
                    if (!this.scene.textures.exists(textureKey)) {
                        // If not found, try the fallback texture
                        textureKey = option.icon + '-fallback';
                        console.log(`Using fallback texture ${textureKey} for option "${option.text}"`);
                    }
                    
                    // Check if either texture exists
                    if (this.scene.textures.exists(textureKey)) {
                        icon = this.scene.add.image(-width/2 + 20, yPos, textureKey);
                        icon.setOrigin(0.5);
                        icon.setScale(this.config.iconSize! / Math.max(icon.width, 1));
                        if (option.enabled === false) {
                            icon.setAlpha(0.5);
                        }
                        this.container.add(icon);
                        console.log(`Added icon ${textureKey} for option "${option.text}"`);
                    } else {
                        console.warn(`No texture found for option "${option.text}"`);
                        // Adjust text position since icon is missing
                        text.setX(-width/2 + 20);
                    }
                } catch (error) {
                    console.error(`Error adding icon for option "${option.text}":`, error);
                    // Adjust text position since icon is missing
                    text.setX(-width/2 + 20);
                }
            }
            
            // Add event listeners
            if (option.enabled !== false) {
                bg.on('pointerover', () => {
                    bg.setFillStyle(this.config.hoverColor!);
                    // Add a gold border on hover for medieval look
                    bg.setStrokeStyle(2, 0xc8a165);
                    this.selectedIndex = i;
                });
                
                bg.on('pointerout', () => {
                    bg.setFillStyle(0x000000, 0);
                    // Remove border on pointer out
                    bg.setStrokeStyle(0);
                    this.selectedIndex = -1;
                });
                
                bg.on('pointerdown', () => {
                    console.log(`Clicked on option "${option.text}" at index ${i}`);
                    this.selectOption(i);
                });
            }
            
            // Add to container
            this.container.add(bg);
            this.container.add(text);
            
            // Store references
            this.optionItems.push({
                background: bg,
                text,
                icon
            });
        }
    }
    
    /**
     * Clears all menu items from the container
     */
    private clearMenuItems(): void {
        this.optionItems.forEach(item => {
            item.background.destroy();
            item.text.destroy();
            if (item.icon) item.icon.destroy();
        });
        
        this.optionItems = [];
    }
    
    /**
     * Sets up global input listeners
     */
    private setupInputListeners(): void {
        // Listen for global click to close menu
        this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            if (this.isOpen) {
                // Check if click is outside the menu
                const bounds = this.container.getBounds();
                if (!Phaser.Geom.Rectangle.Contains(bounds, pointer.x, pointer.y)) {
                    this.hide();
                }
            }
        });
        
        // Listen for keyboard input
        this.scene.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
            if (!this.isOpen) return;
            
            switch(event.code) {
                case 'ArrowUp':
                    this.navigateMenu(-1);
                    break;
                case 'ArrowDown':
                    this.navigateMenu(1);
                    break;
                case 'Enter':
                    if (this.selectedIndex >= 0) {
                        this.selectOption(this.selectedIndex);
                    }
                    break;
                case 'Escape':
                    this.hide();
                    break;
            }
        });
    }
    
    /**
     * Navigates the menu with keyboard
     */
    private navigateMenu(direction: number): void {
        let newIndex = this.selectedIndex + direction;
        
        // Loop through enabled options only
        while (newIndex >= 0 && newIndex < this.options.length) {
            if (this.options[newIndex].enabled !== false) {
                break;
            }
            newIndex += direction;
        }
        
        // Clamp to valid range
        newIndex = Math.max(0, Math.min(this.options.length - 1, newIndex));
        
        // If still on a disabled option after trying, don't change selection
        if (this.options[newIndex].enabled === false) {
            return;
        }
        
        // Clear previous selection
        if (this.selectedIndex >= 0 && this.selectedIndex < this.optionItems.length) {
            this.optionItems[this.selectedIndex].background.setFillStyle(0x000000, 0);
            // Remove border on previous selection
            this.optionItems[this.selectedIndex].background.setStrokeStyle(0);
        }
        
        // Set new selection
        this.selectedIndex = newIndex;
        if (this.selectedIndex >= 0 && this.selectedIndex < this.optionItems.length) {
            this.optionItems[this.selectedIndex].background.setFillStyle(this.config.hoverColor!);
            // Add gold border to new selection for medieval look
            this.optionItems[this.selectedIndex].background.setStrokeStyle(2, 0xc8a165);
        }
    }
} 