import { Scene, GameObjects } from 'phaser';

// TODO: This should be cleaned up to prevent 
// orphaned objects from being created

// Define an interface for the scene data
interface MenuSceneData {
    onClose?: () => void;
}

export class MenuScene extends Scene {
    // Static counter to track instances
    private static instanceCounter = 0;
    private instanceId: number;

    // Background elements
    private background: GameObjects.Image;
    private menuContainer: GameObjects.Container;
    private menuTitle: GameObjects.Text;
    
    // Menu sections
    private menuSidebar: GameObjects.Container;
    private menuContent: GameObjects.Container;
    
    // Character content
    private characterPortrait: GameObjects.Image;
    private characterName: GameObjects.Text;
    private characterDetails: GameObjects.Text;
    
    // Menu items
    private menuItems: GameObjects.Container[] = [];
    private activeMenuItem: number = 3; // Character is active by default
    
    // Menu sections data
    private menuSections = [
        { id: 'inventory', icon: 'icon-inventory', text: 'Inventory' },
        { id: 'inbox', icon: 'icon-inbox', text: 'Inbox' },
        { id: 'create', icon: 'icon-create', text: 'Create' },
        { id: 'character', icon: 'icon-character', text: 'Character' },
        { id: 'skills', icon: 'icon-skills', text: 'Skills' },
        { id: 'leaderboard', icon: 'icon-leaderboard', text: 'Leaderboard' },
        { id: 'map', icon: 'icon-map', text: 'Map' },
        { id: 'food', icon: 'icon-rest', text: 'Food' } // Using rest icon as fallback for food
    ];

    constructor() {
        super('MenuScene');
        // Assign a unique instance ID
        MenuScene.instanceCounter++;
        this.instanceId = MenuScene.instanceCounter;
        console.log(`[MenuScene] Constructor called. Instance #${this.instanceId}`);
    }

    init() {
        // Initialize or reset all properties to prevent duplicates
        // Destroy any existing game objects first
        console.log(`[MenuScene] init: Starting initialization for instance #${this.instanceId}`);
        
        // Check if there are other active instances of this scene
        const activeScenes = this.scene.manager.getScenes(true);
        const menuScenes = activeScenes.filter(s => s.scene.key === 'MenuScene' && s !== this);
        if (menuScenes.length > 0) {
            console.warn(`[MenuScene] WARNING: Found ${menuScenes.length} other active MenuScene instances!`);
        }
        
        this.destroyAllGameObjects();
        
        // Reset all properties to undefined
        this.background = undefined as any;
        this.menuContainer = undefined as any;
        this.menuTitle = undefined as any;
        this.menuSidebar = undefined as any;
        this.menuContent = undefined as any;
        this.characterPortrait = undefined as any;
        this.characterName = undefined as any;
        this.characterDetails = undefined as any;
        this.menuItems = [];
        this.activeMenuItem = 3; // Character is active by default
        console.log(`[MenuScene] init: Completed initialization for instance #${this.instanceId}`);
    }

    create() {
        console.log(`[MenuScene] create: Starting scene creation for instance #${this.instanceId}`);
        // First, destroy any existing game objects to prevent duplication
        this.destroyAllGameObjects();
        
        // Reset menu items array
        this.menuItems = [];
        
        // Create background with blur effect
        this.createBackground();
        
        // Create menu container with border
        this.createMenuContainer();
        
        // Create menu title
        this.createMenuTitle();
        
        // Create sidebar with menu items
        this.createMenuSidebar();
        
        // Create content area - this will add it to the menuContainer
        console.log(`[MenuScene] create: About to create menu content for instance #${this.instanceId}`);
        this.createMenuContent();
        console.log(`[MenuScene] create: Menu content created, position for instance #${this.instanceId}:`, 
            this.menuContent ? `x:${this.menuContent.x}, y:${this.menuContent.y}` : 'undefined');
        
        // Ensure menu content is properly positioned
        this.fixMenuContentPosition();
        
        // Check for duplicate containers
        this.checkForDuplicateContainers();
        
        // Check for orphaned game objects
        this.checkForOrphanedGameObjects();
        
        // If we still have orphaned objects, try to find and destroy them
        this.destroyOrphanedObjects();
        
        // Set default active menu item (Character) only after all menu items are created
        // Make sure we have menu items before trying to set the active one
        if (this.menuItems && this.menuItems.length > 0) {
            // Make sure the active menu item index is valid
            if (this.activeMenuItem >= this.menuItems.length) {
                this.activeMenuItem = 0;
            }
            console.log(`[MenuScene] create: Setting active menu item to ${this.activeMenuItem} for instance #${this.instanceId}`);
            this.setActiveMenuItem(this.activeMenuItem);
        }
        
        // Add close button or back functionality
        if (this.input && this.input.keyboard) {
            this.input.keyboard.on('keydown-ESC', () => {
                this.returnToGame();
            });
        }
        console.log(`[MenuScene] create: Scene creation completed for instance #${this.instanceId}`);
        
        // Check for duplicate containers again after everything is set up
        this.checkForDuplicateContainers();
        
        // Check for orphaned game objects again
        this.checkForOrphanedGameObjects();
        
        // Final cleanup of any remaining orphaned objects
        this.destroyOrphanedObjects();
    }
    
    private createBackground() {
        // If there's an existing background, destroy it first
        if (this.background) {
            this.background.destroy();
            this.background = undefined as any;
        }
        
        // Add a semi-transparent background
        this.background = this.add.image(this.cameras.main.width / 2, this.cameras.main.height / 2, 'background')
            .setDisplaySize(this.cameras.main.width, this.cameras.main.height)
            .setTint(0x000000)
            .setAlpha(0.7);
            
        // We can't easily do blur in Phaser, but we can darken it to simulate the effect
    }
    
    private createMenuContainer() {
        console.log(`[MenuScene] createMenuContainer: Starting container creation for instance #${this.instanceId}`);
        // If there's an existing container, destroy it first
        if (this.menuContainer) {
            console.log(`[MenuScene] createMenuContainer: Destroying existing container for instance #${this.instanceId}`);
            this.menuContainer.destroy();
            this.menuContainer = undefined as any;
        }
        
        // Create the main container for the menu
        this.menuContainer = this.add.container(this.cameras.main.width / 2, this.cameras.main.height / 2);
        console.log(`[MenuScene] createMenuContainer: Created container at position for instance #${this.instanceId}:`, 
            `x:${this.menuContainer.x}, y:${this.menuContainer.y}`);
        
        // Add a background rectangle for the menu - increase height from 500 to 600
        const menuBg = this.add.rectangle(0, 0, 800, 600, 0x20160B, 0.85);
        
        // Add a border around the menu (simulating the fancy border from HTML)
        const borderWidth = 12;
        const menuBorder = this.add.rectangle(0, 0, 800 + borderWidth * 2, 600 + borderWidth * 2, 0xb89d65, 0);
        menuBorder.setStrokeStyle(borderWidth, 0xb89d65, 1);
        
        // Add a close button in the top-right corner
        const closeButton = this.add.text(380, -330, 'X', {
            fontFamily: 'Arial',
            fontSize: '28px',
            color: '#b89d65'
        }).setOrigin(0.5)
          .setInteractive({ useHandCursor: true })
          .on('pointerover', () => closeButton.setTint(0xffff00))
          .on('pointerout', () => closeButton.clearTint())
          .on('pointerdown', () => this.returnToGame());
        
        this.menuContainer.add([menuBorder, menuBg, closeButton]);
    }
    
    private createMenuTitle() {
        // Add the menu title - adjust Y position for taller menu
        this.menuTitle = this.add.text(0, -350, 'AGE OF LEGENDS', {
            fontFamily: 'Times New Roman',
            fontSize: '36px',
            color: '#f0e0c0',
            align: 'center'
        }).setOrigin(0.5);
        
        // Add shadow effect to the text
        this.menuTitle.setShadow(0, 0, '#000000', 10, true, true);
        
        this.menuContainer.add(this.menuTitle);
    }
    
    private createMenuSidebar() {
        // Create a container for the sidebar
        this.menuSidebar = this.add.container(-290, 0);
        this.menuContainer.add(this.menuSidebar);
        
        // Reset menu items array to ensure we start fresh
        this.menuItems = [];
        
        // Create menu items with more spacing between items
        this.menuSections.forEach((section, index) => {
            const menuItem = this.createMenuItem(section.icon, section.text, index);
            // Adjust starting position and spacing between items
            menuItem.setPosition(0, -230 + (index * 65));
            this.menuSidebar.add(menuItem);
            this.menuItems.push(menuItem);
        });
    }
    
    private createMenuItem(iconKey: string, text: string, index: number): GameObjects.Container {
        const container = this.add.container(0, 0);
        
        // Create the menu item background
        const itemBg = this.add.rectangle(0, 0, 220, 50, 0x000000, 0);
        container.add(itemBg);
        
        // Try to add the icon, fallback to a circle if not available
        let icon: GameObjects.Image | null = null;
        try {
            // Try to use the SVG icon first
            icon = this.add.image(-80, 0, iconKey);
        } catch (error) {
            // Fallback to the fallback texture
            try {
                icon = this.add.image(-80, 0, `${iconKey}-fallback`);
            } catch (fallbackError) {
                // If all else fails, create a simple circle
                const graphics = this.add.graphics();
                graphics.fillStyle(0xe0d2b4, 1);
                graphics.fillCircle(-80, 0, 15);
                container.add(graphics);
            }
        }
        
        if (icon) {
            icon.setDisplaySize(30, 30);
            container.add(icon);
        }
        
        // Add the text
        const itemText = this.add.text(-55, 0, text, {
            fontFamily: 'Times New Roman',
            fontSize: '18px',
            color: '#e0d2b4'
        }).setOrigin(0, 0.5);
        
        container.add(itemText);
        
        // Make the entire container interactive
        container.setInteractive(new Phaser.Geom.Rectangle(-110, -25, 220, 50), Phaser.Geom.Rectangle.Contains)
            .on('pointerover', () => this.onMenuItemHover(container, index, true))
            .on('pointerout', () => this.onMenuItemHover(container, index, false))
            .on('pointerdown', () => {
                console.log(`[MenuScene] Menu item ${text} (index ${index}) clicked for instance #${this.instanceId}`);
                this.setActiveMenuItem(index);
            });
        
        // Also make the background interactive for better hit detection
        itemBg.setInteractive({ useHandCursor: true })
            .on('pointerover', () => this.onMenuItemHover(container, index, true))
            .on('pointerout', () => this.onMenuItemHover(container, index, false))
            .on('pointerdown', () => {
                console.log(`[MenuScene] Menu item background ${text} (index ${index}) clicked for instance #${this.instanceId}`);
                this.setActiveMenuItem(index);
            });
        
        // Store the background and other elements for later reference
        container.setData('background', itemBg);
        container.setData('text', itemText);
        container.setData('index', index);
        
        return container;
    }
    
    private onMenuItemHover(container: GameObjects.Container, index: number, isOver: boolean) {
        if (index === this.activeMenuItem) return;
        
        const itemBg = container.getData('background') as GameObjects.Rectangle;
        if (!itemBg) return;
        
        if (isOver) {
            itemBg.setStrokeStyle(1, 0xb89d65, 1);
            itemBg.setFillStyle(0xb89d65, 0.2);
            // Add a slight movement effect
            container.x = 5;
        } else {
            itemBg.setStrokeStyle(1, 0xb89d65, 0);
            itemBg.setFillStyle(0x000000, 0);
            // Reset position
            container.x = 0;
        }
    }
    
    private setActiveMenuItem(index: number) {
        console.log(`[MenuScene] setActiveMenuItem: Setting active item to index ${index} for instance #${this.instanceId}`);
        
        // Don't do anything if the index is already active
        if (this.activeMenuItem === index) {
            console.log(`[MenuScene] setActiveMenuItem: Item ${index} is already active for instance #${this.instanceId}`);
            return;
        }
        
        // Deactivate the current active item
        if (this.activeMenuItem !== null && this.menuItems && this.menuItems.length > 0 && this.activeMenuItem < this.menuItems.length && this.menuItems[this.activeMenuItem]) {
            const prevItem = this.menuItems[this.activeMenuItem];
            const prevBg = prevItem.getData('background') as GameObjects.Rectangle;
            if (prevBg) {
                prevBg.setStrokeStyle(1, 0xb89d65, 0);
                prevBg.setFillStyle(0x000000, 0);
            }
            prevItem.x = 0;
        }
        
        // Activate the new item
        this.activeMenuItem = index;
        
        // Make sure menuItems array exists and has items before trying to access them
        if (!this.menuItems || this.menuItems.length === 0 || index >= this.menuItems.length) {
            console.warn(`[MenuScene] setActiveMenuItem: Cannot set active item - menu items not ready or index out of bounds for instance #${this.instanceId}`);
            return; // Exit early if menu items aren't ready yet
        }
        
        const activeItem = this.menuItems[index];
        if (activeItem) {
            const activeBg = activeItem.getData('background') as GameObjects.Rectangle;
            if (activeBg) {
                activeBg.setStrokeStyle(1, 0xb89d65, 1);
                activeBg.setFillStyle(0xb89d65, 0.4);
            }
            activeItem.x = 5;
            
            // Fix menu content position before updating content
            this.fixMenuContentPosition();
            
            // First destroy any orphaned objects that might be left from previous updates
            this.destroyOrphanedObjects();
            
            // Update content based on selected menu item
            if (this.menuSections && index < this.menuSections.length) {
                const sectionId = this.menuSections[index].id;
                console.log(`[MenuScene] setActiveMenuItem: Updating content to section '${sectionId}' for instance #${this.instanceId}`);
                
                // Update the content for the selected section
                this.updateMenuContent(sectionId);
                
                // Check for orphaned objects after updating content
                this.checkForOrphanedGameObjects();
                this.destroyOrphanedObjects();
            }
        }
    }
    
    private createMenuContent() {
        console.log(`[MenuScene] createMenuContent: Starting content creation for instance #${this.instanceId}`);
        // Check if menuContent already exists and destroy it first
        if (this.menuContent) {
            console.log(`[MenuScene] createMenuContent: Destroying existing content container for instance #${this.instanceId}`);
            this.menuContent.destroy();
            this.menuContent = undefined as any;
        }
        
        // Make sure the menuContainer exists before creating content
        if (!this.menuContainer) {
            console.error(`[MenuScene] createMenuContent: Menu container does not exist when creating menu content for instance #${this.instanceId}`);
            return;
        }
        
        try {
            // Create a container for the content with a fixed position relative to the menu container
            this.menuContent = this.add.container(120, 0);
            console.log(`[MenuScene] createMenuContent: Created content container at position for instance #${this.instanceId}:`, 
                `x:${this.menuContent.x}, y:${this.menuContent.y}`);
            
            // Add the content container to the main menu container
            this.menuContainer.add(this.menuContent);
            console.log(`[MenuScene] createMenuContent: Added content to menu container for instance #${this.instanceId}. Content global position:`, 
                `x:${this.menuContent.x + this.menuContainer.x}, y:${this.menuContent.y + this.menuContainer.y}`);
            
            // Add a background for the content area with a distinctive border using our helper method
            const contentBg = this.createGameObject<GameObjects.Rectangle>(
                'rectangle',
                0, 0,
                [400, 550, 0x382613, 0.7],
                this.menuContent
            );
            contentBg.setStrokeStyle(2, 0xff0000, 1); // Red border to make it more visible for debugging
            
            // Add a debug label to identify this container using our helper method
            const debugLabel = this.createGameObject<GameObjects.Text>(
                'text',
                0, -250,
                ['CONTENT AREA', {
                    fontFamily: 'Arial',
                    fontSize: '14px',
                    color: '#ff0000',
                    backgroundColor: '#000000'
                }],
                this.menuContent
            );
            debugLabel.setOrigin(0.5);
            
            // Create character content (default view)
            this.createCharacterContent();
            
            // These checks should no longer be necessary with our helper method
            // but we'll keep them for now as a safety measure
            this.checkForOrphanedGameObjects();
            this.destroyOrphanedObjects();
            
            console.log(`[MenuScene] createMenuContent: Content creation completed for instance #${this.instanceId}`);
        } catch (error) {
            console.error(`[MenuScene] createMenuContent: Error creating content: ${error} for instance #${this.instanceId}`);
        }
    }
    
    private createCharacterContent() {
        // Make sure menuContent exists before trying to add to it
        if (!this.menuContent) {
            console.error(`[MenuScene] createCharacterContent: Menu content container does not exist when creating character content for instance #${this.instanceId}`);
            return;
        }
        
        console.log(`[MenuScene] createCharacterContent: Creating character content for instance #${this.instanceId}`);
        
        // First, clear any existing character content
        if (this.characterPortrait) {
            this.characterPortrait.destroy();
            this.characterPortrait = undefined as any;
        }
        if (this.characterName) {
            this.characterName.destroy();
            this.characterName = undefined as any;
        }
        if (this.characterDetails) {
            this.characterDetails.destroy();
            this.characterDetails = undefined as any;
        }
        
        // Create objects directly in the container
        try {
            // Create a circular mask for the character portrait
            const mask = this.make.graphics({});
            mask.fillStyle(0xffffff);
            mask.fillCircle(0, -150, 100);
            const maskImage = mask.createGeometryMask();
            
            // Create all objects using our helper method
            
            // Portrait
            this.characterPortrait = this.createGameObject<GameObjects.Image>(
                'image', 
                0, -150, 
                ['player', 0], 
                this.menuContent
            );
            this.characterPortrait.setDisplaySize(200, 200).setMask(maskImage);
            
            // Border
            const portraitBorder = this.createGameObject<GameObjects.Arc>(
                'circle', 
                0, -150, 
                [100, 0x000000, 0], 
                this.menuContent
            );
            portraitBorder.setStrokeStyle(5, 0xb89d65, 1);
            
            // Name
            this.characterName = this.createGameObject<GameObjects.Text>(
                'text', 
                0, -20, 
                ['Sir Lancelot', {
                    fontFamily: 'Times New Roman',
                    fontSize: '32px',
                    color: '#f0e0c0',
                    align: 'center'
                }], 
                this.menuContent
            );
            this.characterName.setOrigin(0.5).setShadow(0, 0, '#704214', 10, true, true);
            
            // Details
            this.characterDetails = this.createGameObject<GameObjects.Text>(
                'text', 
                0, 80, 
                ['Level 32 Knight\n' +
                'Guild: Knights of the Round Table\n\n' +
                'Health: 245/245\n' +
                'Mana: 120/120\n' +
                'Stamina: 180/180\n\n' +
                'Current Quest: Slay the Dragon of Blackrock Mountain', 
                {
                    fontFamily: 'Times New Roman',
                    fontSize: '16px',
                    color: '#d0c0a0',
                    align: 'center',
                    lineSpacing: 8
                }], 
                this.menuContent
            );
            this.characterDetails.setOrigin(0.5);
            
            console.log(`[MenuScene] createCharacterContent: Successfully added character content to container. Total children: ${this.menuContent.length} for instance #${this.instanceId}`);
        } catch (error) {
            console.error(`[MenuScene] createCharacterContent: Error creating character content: ${error} for instance #${this.instanceId}`);
        }
    }
    
    private updateMenuContent(sectionId: string) {
        console.log(`[MenuScene] updateMenuContent: Updating content for section '${sectionId}' for instance #${this.instanceId}`);
        // Make sure menuContent exists before trying to update it
        if (!this.menuContent) {
            console.error(`[MenuScene] updateMenuContent: Menu content container does not exist when updating menu content for instance #${this.instanceId}`);
            return;
        }
        
        // Fix menu content position before updating
        this.fixMenuContentPosition();
        
        // Log the current state of menuContent before changes
        console.log(`[MenuScene] updateMenuContent: Content container before update for instance #${this.instanceId}:`, 
            `position: x:${this.menuContent.x}, y:${this.menuContent.y}, ` +
            `children count: ${this.menuContent.length}, ` +
            `parent: ${this.menuContent.parentContainer ? 'exists' : 'none'}`);
        
        // Clear existing content but keep the container
        this.menuContent.removeAll();
        console.log(`[MenuScene] updateMenuContent: Removed all children from content container for instance #${this.instanceId}`);
        
        try {
            // First, destroy any orphaned objects that might be left from previous updates
            this.destroyOrphanedObjects();
            
            // Add the background again with a distinctive border using our helper method
            const contentBg = this.createGameObject<GameObjects.Rectangle>(
                'rectangle',
                0, 0,
                [400, 550, 0x382613, 0.7],
                this.menuContent
            );
            contentBg.setStrokeStyle(2, 0xff0000, 1); // Red border to make it more visible for debugging
            
            // Add a debug label to identify this container using our helper method
            const debugLabel = this.createGameObject<GameObjects.Text>(
                'text',
                0, -250,
                [`CONTENT: ${sectionId.toUpperCase()}`, {
                    fontFamily: 'Arial',
                    fontSize: '14px',
                    color: '#ff0000',
                    backgroundColor: '#000000'
                }],
                this.menuContent
            );
            debugLabel.setOrigin(0.5);
            
            // Show different content based on the selected section
            switch (sectionId) {
                case 'character':
                    this.createCharacterContent();
                    break;
                case 'inventory':
                case 'inbox':
                case 'create':
                case 'skills':
                case 'leaderboard':
                case 'map':
                case 'food':
                    // For other sections, just show a placeholder text
                    const section = this.menuSections.find(s => s.id === sectionId);
                    
                    // Create the title text using our helper method
                    const title = this.createGameObject<GameObjects.Text>(
                        'text',
                        0, -200,
                        [section ? section.text : sectionId, {
                            fontFamily: 'Times New Roman',
                            fontSize: '32px',
                            color: '#f0e0c0',
                            align: 'center'
                        }],
                        this.menuContent
                    );
                    title.setOrigin(0.5).setShadow(0, 0, '#704214', 10, true, true);
                    
                    // Create the coming soon text using our helper method
                    const comingSoon = this.createGameObject<GameObjects.Text>(
                        'text',
                        0, 0,
                        ['Coming Soon', {
                            fontFamily: 'Times New Roman',
                            fontSize: '24px',
                            color: '#d0c0a0',
                            align: 'center'
                        }],
                        this.menuContent
                    );
                    comingSoon.setOrigin(0.5);
                    
                    // Log the number of children in the container after adding
                    console.log(`[MenuScene] updateMenuContent: Added placeholder content for '${sectionId}'. Total children: ${this.menuContent.length} for instance #${this.instanceId}`);
                    break;
            }
            
            // We still keep these checks for now, but they should no longer be necessary
            // as our helper method should prevent orphaned objects
            this.checkForOrphanedGameObjects();
            this.destroyOrphanedObjects();
        } catch (error) {
            console.error(`[MenuScene] updateMenuContent: Error updating content: ${error} for instance #${this.instanceId}`);
        }
        
        // Check for duplicate containers after content update
        this.checkForDuplicateContainers();
        
        // Check for orphaned game objects
        this.checkForOrphanedGameObjects();
    }
    
    // Add a method to destroy orphaned objects
    private destroyOrphanedObjects() {
        console.log(`[MenuScene] destroyOrphanedObjects: Attempting to destroy orphaned objects for instance #${this.instanceId}`);
        
        // Look for objects at specific positions that might be orphaned
        this.children.each((child) => {
            // Skip containers we know about
            if (child === this.menuContainer || child === this.background) {
                return;
            }
            
            // Check for objects at specific positions that match our orphaned objects
            if (child instanceof GameObjects.Rectangle && 
                Math.abs(child.x) < 1 && Math.abs(child.y) < 1) {
                console.log(`[MenuScene] destroyOrphanedObjects: Destroying orphaned Rectangle at 0,0 for instance #${this.instanceId}`);
                child.destroy();
            }
            
            if (child instanceof GameObjects.Text && 
                Math.abs(child.x) < 1 && Math.abs(child.y + 250) < 1) {
                console.log(`[MenuScene] destroyOrphanedObjects: Destroying orphaned Text at 0,-250 for instance #${this.instanceId}`);
                child.destroy();
            }
            
            // Check for other potential orphaned objects at common positions
            if (child instanceof GameObjects.Text && 
                Math.abs(child.x) < 1 && Math.abs(child.y + 200) < 1) {
                console.log(`[MenuScene] destroyOrphanedObjects: Destroying orphaned Text at 0,-200 for instance #${this.instanceId}`);
                child.destroy();
            }
            
            if (child instanceof GameObjects.Text && 
                Math.abs(child.x) < 1 && Math.abs(child.y) < 1) {
                console.log(`[MenuScene] destroyOrphanedObjects: Destroying orphaned Text at 0,0 for instance #${this.instanceId}`);
                child.destroy();
            }
            
            // Check for character content orphans
            if (child instanceof GameObjects.Image && 
                Math.abs(child.x) < 1 && Math.abs(child.y + 150) < 1) {
                console.log(`[MenuScene] destroyOrphanedObjects: Destroying orphaned Image at 0,-150 for instance #${this.instanceId}`);
                child.destroy();
            }
            
            if (child instanceof GameObjects.Text && 
                Math.abs(child.x) < 1 && Math.abs(child.y + 20) < 1) {
                console.log(`[MenuScene] destroyOrphanedObjects: Destroying orphaned Text at 0,-20 for instance #${this.instanceId}`);
                child.destroy();
            }
            
            if (child instanceof GameObjects.Text && 
                Math.abs(child.x) < 1 && Math.abs(child.y - 80) < 1) {
                console.log(`[MenuScene] destroyOrphanedObjects: Destroying orphaned Text at 0,80 for instance #${this.instanceId}`);
                child.destroy();
            }
        });
    }
    
    // Add a method to properly return to the game scene
    private returnToGame() {
        // Get the onClose callback from the scene data if it exists
        const data = this.scene.settings.data as MenuSceneData;
        if (data && typeof data.onClose === 'function') {
            data.onClose();
        }
        
        // Clean up all resources before stopping the scene
        this.destroyAllGameObjects();
        
        // Stop this scene
        this.scene.stop();
    }
    
    // Add a shutdown method to clean up resources when the scene is stopped
    shutdown() {
        console.log(`[MenuScene] shutdown: Shutting down instance #${this.instanceId}`);
        // Clean up all game objects
        this.destroyAllGameObjects();
        
        // Reset menu items array
        this.menuItems = [];
        
        // Remove keyboard listeners
        if (this.input && this.input.keyboard) {
            this.input.keyboard.off('keydown-ESC');
        }
    }
    
    // Helper method to destroy all game objects
    private destroyAllGameObjects() {
        console.log(`[MenuScene] destroyAllGameObjects: Starting cleanup for instance #${this.instanceId}`);
        
        // Destroy all containers and their children
        if (this.menuContainer) {
            console.log(`[MenuScene] destroyAllGameObjects: Destroying menu container for instance #${this.instanceId}`);
            this.menuContainer.destroy();
            this.menuContainer = undefined as any;
        }
        
        if (this.menuContent) {
            console.log(`[MenuScene] destroyAllGameObjects: Destroying menu content for instance #${this.instanceId}`);
            this.menuContent.destroy();
            this.menuContent = undefined as any;
        }
        
        if (this.menuSidebar) {
            console.log(`[MenuScene] destroyAllGameObjects: Destroying menu sidebar for instance #${this.instanceId}`);
            this.menuSidebar.destroy();
            this.menuSidebar = undefined as any;
        }
        
        if (this.background) {
            console.log(`[MenuScene] destroyAllGameObjects: Destroying background for instance #${this.instanceId}`);
            this.background.destroy();
            this.background = undefined as any;
        }
        
        // Clear the entire scene to be extra safe
        const childCount = this.children.length;
        this.children.removeAll(true);
        console.log(`[MenuScene] destroyAllGameObjects: Removed ${childCount} children from scene for instance #${this.instanceId}`);
    }
    
    // Add a diagnostic method to check for duplicate containers
    private checkForDuplicateContainers() {
        console.log(`[MenuScene] checkForDuplicateContainers: Checking for duplicate containers for instance #${this.instanceId}`);
        
        // Count all containers in the scene
        let contentContainers = 0;
        let contentContainerPositions: string[] = [];
        
        // Check all game objects in the scene
        this.children.each((child) => {
            if (child instanceof GameObjects.Container) {
                // Check if this is a content container (based on position or other properties)
                // This is a heuristic and may need adjustment based on your specific implementation
                if (child !== this.menuContainer && child !== this.menuSidebar && 
                    child !== this.menuContent && !this.menuItems.includes(child)) {
                    contentContainers++;
                    contentContainerPositions.push(`x:${child.x}, y:${child.y}`);
                    console.log(`[MenuScene] Found potential duplicate container for instance #${this.instanceId}:`, 
                        `position: x:${child.x}, y:${child.y}, ` +
                        `children: ${(child as GameObjects.Container).length}, ` +
                        `parent: ${child.parentContainer ? 'exists' : 'none'}`);
                }
            }
        });
        
        console.log(`[MenuScene] checkForDuplicateContainers: Found ${contentContainers} potential duplicate containers for instance #${this.instanceId}`);
        if (contentContainers > 0) {
            console.log(`[MenuScene] Positions for instance #${this.instanceId}:`, contentContainerPositions.join(' | '));
        }
        
        // Also check if our tracked menuContent is properly added to menuContainer
        if (this.menuContent && this.menuContainer) {
            const isInContainer = this.menuContainer.getAll().includes(this.menuContent);
            console.log(`[MenuScene] menuContent is ${isInContainer ? '' : 'NOT '}properly added to menuContainer for instance #${this.instanceId}`);
        }
    }
    
    // Add a method to fix any positioning issues with the menu content
    private fixMenuContentPosition() {
        console.log(`[MenuScene] fixMenuContentPosition: Checking menu content position for instance #${this.instanceId}`);
        
        // Check if menuContent exists and is properly positioned
        if (this.menuContent && this.menuContainer) {
            // Check if menuContent is a child of menuContainer
            const isInContainer = this.menuContainer.getAll().includes(this.menuContent);
            
            if (!isInContainer) {
                console.log(`[MenuScene] fixMenuContentPosition: Fixing menu content position - adding to container for instance #${this.instanceId}`);
                
                // If menuContent is not in the container, add it
                this.menuContainer.add(this.menuContent);
                
                // Make sure it's at the correct position relative to the container
                this.menuContent.x = 120;
                this.menuContent.y = 0;
                
                console.log(`[MenuScene] fixMenuContentPosition: Fixed position for instance #${this.instanceId}:`, 
                    `x:${this.menuContent.x}, y:${this.menuContent.y}, ` +
                    `global: x:${this.menuContent.x + this.menuContainer.x}, y:${this.menuContent.y + this.menuContainer.y}`);
            }
        }
    }

    // Add a method to check for orphaned game objects
    private checkForOrphanedGameObjects() {
        console.log(`[MenuScene] checkForOrphanedGameObjects: Checking for orphaned game objects for instance #${this.instanceId}`);
        
        // Count all game objects directly in the scene (not in containers)
        let orphanedObjects = 0;
        let orphanedPositions: string[] = [];
        
        // Check all game objects in the scene
        this.children.each((child) => {
            // Skip containers we know about
            if (child === this.menuContainer || child === this.background) {
                return;
            }
            
            // Check if this is an orphaned object
            if (child instanceof GameObjects.Text || 
                child instanceof GameObjects.Rectangle || 
                child instanceof GameObjects.Image) {
                orphanedObjects++;
                orphanedPositions.push(`${child.constructor.name} at x:${child.x}, y:${child.y}`);
                console.log(`[MenuScene] Found orphaned ${child.constructor.name} for instance #${this.instanceId}:`, 
                    `position: x:${child.x}, y:${child.y}, ` +
                    `visible: ${child.visible}, ` +
                    `alpha: ${child.alpha}`);
                
                // Make it obvious in the scene for debugging
                if (child instanceof GameObjects.Rectangle) {
                    child.setStrokeStyle(4, 0x00ff00, 1); // Green border
                } else if (child instanceof GameObjects.Text) {
                    child.setBackgroundColor('#00ff00'); // Green background
                    child.setText(`ORPHANED: ${child.text}`);
                } else if (child instanceof GameObjects.Image) {
                    child.setTint(0x00ff00); // Green tint
                }
            }
        });
        
        console.log(`[MenuScene] checkForOrphanedGameObjects: Found ${orphanedObjects} orphaned objects for instance #${this.instanceId}`);
        if (orphanedObjects > 0) {
            console.log(`[MenuScene] Orphaned objects for instance #${this.instanceId}:`, orphanedPositions.join(' | '));
        }
    }

    // Helper method to create game objects that are properly added to containers
    private createGameObject<T extends GameObjects.GameObject>(
        type: string,
        x: number,
        y: number,
        args: any[] = [],
        container?: GameObjects.Container
    ): T {
        let gameObject: T;
        
        // Create the game object based on its type
        switch (type) {
            case 'rectangle':
                gameObject = this.add.rectangle(x, y, ...args) as unknown as T;
                break;
            case 'text':
                gameObject = this.add.text(x, y, args[0], args[1]) as unknown as T;
                break;
            case 'image':
                gameObject = this.add.image(x, y, args[0], args[1]) as unknown as T;
                break;
            case 'circle':
                gameObject = this.add.circle(x, y, ...args) as unknown as T;
                break;
            default:
                throw new Error(`Unsupported game object type: ${type}`);
        }
        
        // Remove from scene and add to container if specified
        if (container) {
            this.children.remove(gameObject);
            container.add(gameObject);
        }
        
        return gameObject;
    }
}
