import { Scene, GameObjects, Geom, Input, Display, Math as PhaserMath } from 'phaser';

export interface ScrollableContainerConfig {
    x: number;
    y: number;
    width: number;
    height: number;
    background?: {
        color: number;
        alpha?: number;
        strokeWidth?: number;
        strokeColor?: number;
    };
    scrollbarEnabled?: boolean;
    padding?: number;
    mask?: boolean;
}

export class ScrollableContainer {
    private scene: Scene;
    private container: GameObjects.Container;
    private background?: GameObjects.Rectangle;
    private contentContainer: GameObjects.Container;
    private mask?: Display.Masks.GeometryMask;
    private maskGraphics?: GameObjects.Graphics;
    private scrollUpButton: GameObjects.Container;
    private scrollDownButton: GameObjects.Container;
    private dragZone: GameObjects.Zone;
    private scrollbar?: GameObjects.Rectangle;
    private scrollbarThumb?: GameObjects.Rectangle;
    
    private config: ScrollableContainerConfig;
    private isDragging: boolean = false;
    private lastY: number = 0;
    
    constructor(scene: Scene, config: ScrollableContainerConfig) {
        this.scene = scene;
        this.config = {
            ...config,
            padding: config.padding || 0,
            background: config.background || { color: 0x000000, alpha: 0 },
            scrollbarEnabled: config.scrollbarEnabled !== undefined ? config.scrollbarEnabled : true,
            mask: config.mask !== undefined ? config.mask : true
        };
        
        this.init();
    }
    
    private init(): void {
        // Create main container
        this.container = this.scene.add.container(this.config.x, this.config.y);
        
        // Create background if needed
        if (this.config.background && this.config.background.alpha && this.config.background.alpha > 0) {
            this.background = this.scene.add.rectangle(
                0, 0,
                this.config.width, 
                this.config.height,
                this.config.background.color,
                this.config.background.alpha
            );
            
            if (this.config.background.strokeWidth && this.config.background.strokeColor) {
                this.background.setStrokeStyle(
                    this.config.background.strokeWidth,
                    this.config.background.strokeColor
                );
            }
            
            this.container.add(this.background);
        }
        
        // Create content container - Critical fix: set it at (0,0) relative to parent
        this.contentContainer = this.scene.add.container(0, 0);
        this.container.add(this.contentContainer);
        
        // Make the content container origin at top-left for more predictable content positioning
        // This requires offsetting the container itself to maintain proper centering
        this.contentContainer.x = -this.config.width / 2;
        this.contentContainer.y = -this.config.height / 2;
        
        // Create mask
        if (this.config.mask) {
            this.createMask();
        }
        
        // Create drag zone
        this.createDragZone();
        
        // Create scroll buttons
        this.createScrollButtons();
        
        // Create scrollbar if enabled
        if (this.config.scrollbarEnabled) {
            this.createScrollbar();
        }
        
        // Add mouse wheel support
        this.setupMouseWheel();
        
        // Debug: Add a visual indicator for the container bounds
        const debugBounds = this.scene.add.rectangle(
            0, 0, 
            this.config.width, 
            this.config.height, 
            0xff0000, 
            0.1
        );
        this.container.add(debugBounds);
    }
    
    private createMask(): void {
        this.maskGraphics = this.scene.make.graphics({});
        
        // Match mask to the content container position (now top-left aligned)
        this.maskGraphics.fillRect(
            -this.config.width / 2,
            -this.config.height / 2,
            this.config.width,
            this.config.height
        );
        
        this.mask = new Display.Masks.GeometryMask(this.scene, this.maskGraphics);
        this.contentContainer.setMask(this.mask);
        
        // Debug: Add the mask graphics to see its position (makes it visible)
        // this.container.add(this.maskGraphics);
    }
    
    private createDragZone(): void {
        this.dragZone = this.scene.add.zone(
            0, 0,
            this.config.width,
            this.config.height
        ).setOrigin(0.5).setInteractive();
        
        this.dragZone.on('pointerdown', (pointer: Input.Pointer) => {
            this.isDragging = true;
            this.lastY = pointer.y;
        });
        
        this.dragZone.on('pointermove', (pointer: Input.Pointer) => {
            if (this.isDragging) {
                const deltaY = pointer.y - this.lastY;
                this.scroll(deltaY);
                this.lastY = pointer.y;
            }
        });
        
        this.dragZone.on('pointerup', () => {
            this.isDragging = false;
        });
        
        this.dragZone.on('pointerout', () => {
            this.isDragging = false;
        });
        
        this.container.add(this.dragZone);
    }
    
    private createScrollButtons(): void {
        const buttonSize = 30;
        const buttonX = this.config.width / 2 - 20;
        const buttonY = this.config.height / 2 - 20;
        
        // Up button
        this.scrollUpButton = this.scene.add.container(0, -buttonY);
        
        const upBg = this.scene.add.circle(0, 0, buttonSize / 2, 0x382613, 0.9)
            .setStrokeStyle(2, 0xb89d65, 1);
            
        const upArrow = this.scene.add.text(0, 0, '▲', {
            fontSize: '16px',
            color: '#e0d2b4'
        }).setOrigin(0.5);
        
        this.scrollUpButton.add([upBg, upArrow]);
        this.scrollUpButton.setInteractive(
            new Geom.Circle(0, 0, buttonSize / 2),
            Geom.Circle.Contains
        )
        .on('pointerdown', () => this.scroll(30))
        .on('pointerover', () => upBg.setFillStyle(0xb89d65, 0.4))
        .on('pointerout', () => upBg.setFillStyle(0x382613, 0.9));
        
        // Down button
        this.scrollDownButton = this.scene.add.container(0, buttonY);
        
        const downBg = this.scene.add.circle(0, 0, buttonSize / 2, 0x382613, 0.9)
            .setStrokeStyle(2, 0xb89d65, 1);
            
        const downArrow = this.scene.add.text(0, 0, '▼', {
            fontSize: '16px',
            color: '#e0d2b4'
        }).setOrigin(0.5);
        
        this.scrollDownButton.add([downBg, downArrow]);
        this.scrollDownButton.setInteractive(
            new Geom.Circle(0, 0, buttonSize / 2),
            Geom.Circle.Contains
        )
        .on('pointerdown', () => this.scroll(-30))
        .on('pointerover', () => downBg.setFillStyle(0xb89d65, 0.4))
        .on('pointerout', () => downBg.setFillStyle(0x382613, 0.9));
        
        this.scrollUpButton.x = buttonX;
        this.scrollDownButton.x = buttonX;
        
        this.container.add([this.scrollUpButton, this.scrollDownButton]);
    }
    
    private createScrollbar(): void {
        const scrollbarWidth = 10;
        const scrollbarX = this.config.width / 2 - scrollbarWidth / 2 - 5;
        
        // Create scrollbar track
        this.scrollbar = this.scene.add.rectangle(
            scrollbarX, 0,
            scrollbarWidth, 
            this.config.height - 20,
            0x382613, 0.5
        );
        
        // Create scrollbar thumb
        this.scrollbarThumb = this.scene.add.rectangle(
            scrollbarX, 0,
            scrollbarWidth,
            100, // Initial height, will be updated
            0xb89d65, 0.8
        );
        
        this.container.add([this.scrollbar, this.scrollbarThumb]);
        this.updateScrollbarThumb();
    }
    
    private setupMouseWheel(): void {
        this.scene.input.on('wheel', (pointer: Input.Pointer, gameObjects: GameObjects.GameObject[], deltaX: number, deltaY: number) => {
            // Check if the pointer is over our container
            const bounds = new Geom.Rectangle(
                this.container.x - this.config.width / 2,
                this.container.y - this.config.height / 2,
                this.config.width,
                this.config.height
            );
            
            if (bounds.contains(pointer.x, pointer.y)) {
                this.scroll(-deltaY * 0.5);
            }
        });
    }
    
    // Scroll content by a given amount
    public scroll(amount: number): void {
        const contentHeight = this.getContentHeight();
        const visibleHeight = this.config.height;
        
        // Only scroll if content is taller than visible area
        if (contentHeight > visibleHeight) {
            // Calculate min/max scroll positions
            // Adjust for top-left content positioning
            const minY = -this.config.height / 2; // Initial position (top)
            const maxY = -this.config.height / 2 - (contentHeight - visibleHeight); // Scrolled to bottom
            
            // Update content position with clamping
            const newY = PhaserMath.Clamp(
                this.contentContainer.y - amount, // Negative amount scrolls down
                maxY,
                minY
            );
            
            this.contentContainer.y = newY;
            
            // Update scrollbar if it exists
            if (this.scrollbarThumb) {
                this.updateScrollbarThumb();
            }
            
            // Debug: log position
            console.log(`Scrolling: y=${this.contentContainer.y}, content height=${contentHeight}, visible=${visibleHeight}`);
        }
    }
    
    // Get content height - improved to better detect all types of game objects
    private getContentHeight(): number {
        let lowestY = 0;
        
        this.contentContainer.each((child: GameObjects.GameObject) => {
            let childBottom = 0;
            
            // Handle different types of game objects
            if (child instanceof GameObjects.Container) {
                // For containers, check their children too
                child.each((grandchild: GameObjects.GameObject) => {
                    if ('y' in grandchild && 'displayHeight' in grandchild) {
                        const gameObj = grandchild as GameObjects.GameObject & { y: number, displayHeight: number };
                        const bottom = child.y + gameObj.y + (gameObj.displayHeight / 2);
                        childBottom = Math.max(childBottom, bottom);
                    }
                });
            } 
            else if ('y' in child && 'displayHeight' in child) {
                const gameObj = child as GameObjects.GameObject & { y: number, displayHeight: number };
                childBottom = gameObj.y + (gameObj.displayHeight / 2);
            }
            
            lowestY = Math.max(lowestY, childBottom);
        });
        
        const padding = this.config.padding || 0;
        return lowestY + padding;
    }
    
    // Update scrollbar thumb position and size
    private updateScrollbarThumb(): void {
        // Early return if scrollbar components don't exist
        if (!this.scrollbarThumb || !this.scrollbar) {
            return;
        }
        
        const contentHeight = this.getContentHeight();
        const visibleHeight = this.config.height;
        
        // Calculate thumb height proportional to view percentage
        const thumbHeightPercentage = Math.min(1, visibleHeight / contentHeight);
        const scrollbarHeight = this.scrollbar.height;
        const thumbHeight = Math.max(30, thumbHeightPercentage * scrollbarHeight);
        
        // Calculate thumb position
        const scrollRange = contentHeight - visibleHeight;
        const scrollPercent = scrollRange > 0 
            ? (this.contentContainer.y - visibleHeight / 2) / -scrollRange 
            : 0;
        
        const minThumbY = -scrollbarHeight / 2 + thumbHeight / 2;
        const maxThumbY = scrollbarHeight / 2 - thumbHeight / 2;
        const thumbY = PhaserMath.Linear(minThumbY, maxThumbY, scrollPercent);
        
        // Update thumb
        const thumbWidth = this.scrollbarThumb.width;
        this.scrollbarThumb.setSize(thumbWidth, thumbHeight);
        this.scrollbarThumb.y = thumbY;
        
        // Hide scrollbar if content fits within container
        const visible = contentHeight > visibleHeight;
        this.scrollbar.setVisible(visible);
        this.scrollbarThumb.setVisible(visible);
    }
    
    // Add a game object to the content container
    public add(gameObjects: GameObjects.GameObject | GameObjects.GameObject[]): this {
        if (Array.isArray(gameObjects)) {
            this.contentContainer.add(gameObjects);
        } else {
            this.contentContainer.add(gameObjects);
        }
        
        // Update scrollbar if it exists
        if (this.scrollbarThumb) {
            this.updateScrollbarThumb();
        }
        
        // Debug: log child count to verify content is being added
        console.log(`ScrollableContainer: Added content. Total children: ${this.contentContainer.length}`);
        
        return this;
    }
    
    // Remove a game object from the content container
    public remove(gameObjects: GameObjects.GameObject | GameObjects.GameObject[]): this {
        if (Array.isArray(gameObjects)) {
            this.contentContainer.remove(gameObjects);
        } else {
            this.contentContainer.remove(gameObjects);
        }
        
        // Update scrollbar if it exists
        if (this.scrollbarThumb) {
            this.updateScrollbarThumb();
        }
        
        return this;
    }
    
    // Clear all content
    public clear(): this {
        this.contentContainer.removeAll();
        
        // Update scrollbar if it exists
        if (this.scrollbarThumb) {
            this.updateScrollbarThumb();
        }
        
        return this;
    }
    
    // Get the container
    public getContainer(): GameObjects.Container {
        return this.container;
    }
    
    // Get the content container
    public getContentContainer(): GameObjects.Container {
        return this.contentContainer;
    }
    
    // Set visibility
    public setVisible(visible: boolean): this {
        this.container.setVisible(visible);
        return this;
    }
    
    // Destroy the container and all its components
    public destroy(): void {
        if (this.mask) {
            this.contentContainer.clearMask();
            if (this.maskGraphics) {
                this.maskGraphics.destroy();
            }
        }
        
        this.container.destroy();
    }
} 