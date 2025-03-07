import { Scene, Types, GameObjects } from 'phaser';
import { ScrollableContainer } from './ScrollableContainer';

export class ScrollableContentDemo extends Scene {
    private scrollableContainer: ScrollableContainer;
    private containerWidth: number = 400; // Default width
    private containerHeight: number = 400; // Default height
    
    constructor() {
        super({ key: 'ScrollableContentDemo' });
    }
    
    preload() {
        // Load assets
        this.load.image('background', 'assets/ui/background.png');
        this.load.image('item-icon', 'assets/ui/item.png');
    }
    
    create() {
        // Add background
        this.add.image(this.cameras.main.width / 2, this.cameras.main.height / 2, 'background')
            .setDisplaySize(this.cameras.main.width, this.cameras.main.height);
            
        // Create a title
        this.add.text(this.cameras.main.width / 2, 50, 'Scrollable Container Demo', {
            fontFamily: 'Times New Roman, serif',
            fontSize: '32px',
            color: '#ffffff'
        }).setOrigin(0.5);
        
        // Set container dimensions
        this.containerWidth = 400;
        this.containerHeight = 400;
        
        // Create scrollable container
        this.scrollableContainer = new ScrollableContainer(this, {
            x: this.cameras.main.width / 2,
            y: this.cameras.main.height / 2,
            width: this.containerWidth,
            height: this.containerHeight,
            background: {
                color: 0x382613,
                alpha: 0.8,
                strokeWidth: 2,
                strokeColor: 0xb89d65
            },
            padding: 20,
            scrollbarEnabled: true
        });
        
        // Add content to the scrollable container
        this.addDemoContent();
        
        // Add some instructions
        this.add.text(this.cameras.main.width / 2, this.cameras.main.height - 50, 
            'Use mouse wheel or drag to scroll\nPress ESC to return to main menu', {
            fontFamily: 'Arial',
            fontSize: '16px',
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);
        
        // Add escape key handler
        this.input.keyboard.on('keydown-ESC', () => {
            this.scene.start('MainScene');
        });
    }
    
    private addDemoContent() {
        // Add a heading - adjust position for top-left origin of content container
        const heading = this.add.text(
            this.containerWidth / 2, // Center horizontally within the container
            20, // Position from top
            'Inventory Items', 
            {
                fontFamily: 'Times New Roman, serif',
                fontSize: '24px',
                color: '#f0e0c0',
                align: 'center'
            }
        ).setOrigin(0.5, 0); // Center text horizontally
        
        // Add content
        const items = [
            { name: 'Legendary Sword', description: 'A powerful sword forged by the ancient dragons.' },
            { name: 'Health Potion', description: 'Restores 100 health points when consumed.' },
            { name: 'Mana Crystal', description: 'Restores 50 mana points when consumed.' },
            { name: 'Dragon Scale Armor', description: 'Provides excellent protection against fire damage.' },
            { name: 'Shadow Cloak', description: 'Increases stealth abilities and provides camouflage in dark areas.' },
            { name: 'Enchanted Boots', description: 'Increases movement speed by 15%.' },
            { name: 'Magic Scroll', description: 'Contains a powerful spell that can be learned.' },
            { name: 'Golden Key', description: 'Opens a mysterious chest found in the ancient ruins.' },
            { name: 'Silver Necklace', description: 'A beautiful necklace that grants resistance to dark magic.' },
            { name: 'Ancient Map', description: 'Reveals the location of hidden treasures.' },
            { name: 'Mythril Ore', description: 'A rare material used to craft powerful weapons and armor.' },
            { name: 'Dragon\'s Eye', description: 'A magical gem that allows the user to see in the dark.' },
            { name: 'Healing Herbs', description: 'Can be used to craft healing potions.' },
            { name: 'Arcane Dust', description: 'A magical substance used in various enchantments.' },
            { name: 'Phoenix Feather', description: 'When equipped, automatically revives the user once upon death.' }
        ];
        
        // Create item containers - adjust y position to start below heading
        let yPos = 60; // Start position after the heading
        const itemContainers: GameObjects.Container[] = [];
        
        items.forEach((item, index) => {
            const itemContainer = this.createItemUI(item.name, item.description, yPos);
            itemContainers.push(itemContainer);
            yPos += 80; // Spacing between items
        });
        
        // Add all elements to the scrollable container
        this.scrollableContainer.add([heading, ...itemContainers]);
    }
    
    private createItemUI(name: string, description: string, yPos: number): GameObjects.Container {
        // Position container relative to content container's top-left origin
        const container = this.add.container(this.containerWidth / 2, yPos);
        
        // Create background for the item
        const bg = this.add.rectangle(0, 0, 360, 70, 0x000000, 0.3)
            .setStrokeStyle(1, 0xb89d65, 0.5);
        
        // Create item icon placeholder
        const icon = this.add.rectangle(-150, 0, 50, 50, 0x704214, 1)
            .setStrokeStyle(2, 0xb89d65, 1);
        
        // Add item name
        const nameText = this.add.text(-110, -15, name, {
            fontFamily: 'Times New Roman, serif',
            fontSize: '18px',
            color: '#f0e0c0'
        }).setOrigin(0, 0);
        
        // Add item description
        const descText = this.add.text(-110, 10, description, {
            fontFamily: 'Arial',
            fontSize: '12px',
            color: '#d0c0a0',
            wordWrap: { width: 240 }
        }).setOrigin(0, 0);
        
        // Add all elements to the container
        container.add([bg, icon, nameText, descText]);
        
        // Make the item interactive
        bg.setInteractive();
        bg.on('pointerover', () => {
            bg.setFillStyle(0x704214, 0.3);
        });
        bg.on('pointerout', () => {
            bg.setFillStyle(0x000000, 0.3);
        });
        bg.on('pointerdown', () => {
            console.log(`Selected item: ${name}`);
        });
        
        return container;
    }
} 