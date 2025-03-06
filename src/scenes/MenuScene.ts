import { Scene, GameObjects } from 'phaser';

export class MenuScene extends Scene {
    private background: GameObjects.Image;
    private menuContainer: GameObjects.Container;
    private menuPanel: GameObjects.Rectangle;
    private menuBorder: GameObjects.Graphics;
    private menuTitle: GameObjects.Text;
    private closeButton: GameObjects.Text;
    private menuOptions: GameObjects.Container[] = [];
    private contentPanel: GameObjects.Rectangle;
    private contentTitle: GameObjects.Text;
    private contentDescription: GameObjects.Text;
    private contentMask: GameObjects.Graphics;
    private contentScrollArea: GameObjects.Container;
    private scrollUpButton: GameObjects.Container;
    private scrollDownButton: GameObjects.Container;
    private characterPortrait: GameObjects.Image;
    private activeSection: string = 'Character';

    private menuItems = [
        { name: 'Inventory', icon: 'inventory', action: () => this.showInventory() },
        { name: 'Messaging', icon: 'inbox', action: () => this.showMessaging() },
        { name: 'Craft', icon: 'create', action: () => this.showCraft() },
        { name: 'Character', icon: 'character', action: () => this.showCharacter() },
        { name: 'Map', icon: 'map', action: () => this.showMap() },
        { name: 'Skills', icon: 'skills', action: () => this.showSkills() },
        { name: 'Leaderboard', icon: 'leaderboard', action: () => this.showLeaderboard() },
        { name: 'TestScroll', icon: 'test', action: () => this.updateContentPanel('TestScroll') },
    ];

    constructor() {
        super('MenuScene');
    }

    preload() {
        // Should preload necessary assets in the main loader scene
        // Temporarily creating placeholder loads for demonstration
        this.load.image('menu-background', '/background.jpg');
        this.load.image('character-portrait', '/character.jpg');

        // Preload icons for menu items
        this.menuItems.forEach(item => {
            this.load.svg(`icon-${item.icon.toLowerCase()}`, `/icons/${item.icon.toLowerCase()}.svg`);
        });
    }

    create() {
        // Get game dimensions
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Create blurred background image
        this.background = this.add.image(width / 2, height / 2, 'menu-background')
            .setDisplaySize(width, height)
            .setInteractive()
            .on('pointerdown', (pointer: Phaser.Input.Pointer) => {
                // Only close if clicking directly on the background (not menu items)
                if (pointer.downElement === this.background) {
                    this.closeMenu();
                }
            });

        // Apply blur filter - note: requires WebGL pipeline setup
        // For simplicity, using a semi-transparent overlay instead
        const darkOverlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.5)
            .setOrigin(0);

        // Create container for menu elements
        this.menuContainer = this.add.container(width / 2, height / 2);

        // Create fancy border using graphics
        this.createStyledMenuPanel();

        // Add title
        this.menuTitle = this.add.text(0, -this.menuPanel.height / 2 - 40, 'REALM OF LEGENDS', {
            fontFamily: 'Times New Roman, serif',
            fontSize: '36px',
            color: '#f0e0c0',
            align: 'center',
            stroke: '#704214',
            strokeThickness: 2
        }).setOrigin(0.5)
            .setShadow(0, 0, '#000000', 10, true);
        this.menuContainer.add(this.menuTitle);

        // Create menu sidebar and content area
        this.createMenuSidebar();
        this.createContentPanel();

        // Show character section by default
        this.updateContentPanel('Character');

        // Add mouse wheel input for scrolling
        this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY, deltaZ) => {
            // Only process wheel events if pointer is over content panel
            const bounds = this.contentPanel.getBounds();
            if (pointer.x >= bounds.left && pointer.x <= bounds.right &&
                pointer.y >= bounds.top && pointer.y <= bounds.bottom) {
                this.scrollContent(deltaY * 0.5);
            }
        });
    }

    // Create stylized menu panel with fancy border
    private createStyledMenuPanel() {
        // Size definition
        const panelWidth = 800;
        const panelHeight = 500;

        // Main panel background
        this.menuPanel = this.add.rectangle(0, 0, panelWidth, panelHeight, 0x20160b, 0.85)
            .setOrigin(0.5);
        this.menuContainer.add(this.menuPanel);

        // Create decorative border
        this.menuBorder = this.add.graphics();
        this.menuBorder.lineStyle(4, 0xb89d65, 1);

        // Outer border
        this.menuBorder.strokeRect(
            -panelWidth / 2 - 6,
            -panelHeight / 2 - 6,
            panelWidth + 12,
            panelHeight + 12
        );

        // Border details - corner decorations
        const cornerSize = 20;

        // Top left corner
        this.menuBorder.moveTo(-panelWidth / 2 - 6, -panelHeight / 2 - 6 + cornerSize);
        this.menuBorder.lineTo(-panelWidth / 2 - 6, -panelHeight / 2 - 6);
        this.menuBorder.lineTo(-panelWidth / 2 - 6 + cornerSize, -panelHeight / 2 - 6);

        // Top right corner
        this.menuBorder.moveTo(panelWidth / 2 + 6 - cornerSize, -panelHeight / 2 - 6);
        this.menuBorder.lineTo(panelWidth / 2 + 6, -panelHeight / 2 - 6);
        this.menuBorder.lineTo(panelWidth / 2 + 6, -panelHeight / 2 - 6 + cornerSize);

        // Bottom right corner
        this.menuBorder.moveTo(panelWidth / 2 + 6, panelHeight / 2 + 6 - cornerSize);
        this.menuBorder.lineTo(panelWidth / 2 + 6, panelHeight / 2 + 6);
        this.menuBorder.lineTo(panelWidth / 2 + 6 - cornerSize, panelHeight / 2 + 6);

        // Bottom left corner
        this.menuBorder.moveTo(-panelWidth / 2 - 6 + cornerSize, panelHeight / 2 + 6);
        this.menuBorder.lineTo(-panelWidth / 2 - 6, panelHeight / 2 + 6);
        this.menuBorder.lineTo(-panelWidth / 2 - 6, panelHeight / 2 + 6 - cornerSize);

        // Diagonal corner accents
        this.menuBorder.moveTo(-panelWidth / 2 - 6, -panelHeight / 2 - 6);
        this.menuBorder.lineTo(-panelWidth / 2 - 6 + 50, -panelHeight / 2 - 6 + 50);

        this.menuBorder.moveTo(panelWidth / 2 + 6, -panelHeight / 2 - 6);
        this.menuBorder.lineTo(panelWidth / 2 + 6 - 50, -panelHeight / 2 - 6 + 50);

        this.menuContainer.add(this.menuBorder);

        // Add close button
        this.closeButton = this.add.text(panelWidth / 2 - 25, -panelHeight / 2 + 15, 'X', {
            fontFamily: 'Times New Roman, serif',
            fontSize: '24px',
            color: '#e0d2b4'
        })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.closeMenu())
            .on('pointerover', () => this.closeButton.setStyle({ color: '#ff6347' }))
            .on('pointerout', () => this.closeButton.setStyle({ color: '#e0d2b4' }));
        this.menuContainer.add(this.closeButton);
    }

    // Create the menu sidebar with fantasy-styled items
    private createMenuSidebar() {
        const sidebarWidth = 200; // Reduced width to prevent overlap
        const contentWidth = this.menuPanel.width - sidebarWidth - 40;

        // Starting position for the first menu item - shifted further left
        const startX = -this.menuPanel.width / 2 + 5; // Reduced from 30 to 15
        const startY = -this.menuPanel.height / 2 + 60;
        const spacing = 55;

        // Create sidebar items
        this.menuItems.forEach((item, index) => {
            // Create container for menu item
            const menuItemContainer = this.add.container(startX, startY + (index * spacing));

            // Create background for the menu item
            const itemBg = this.add.rectangle(sidebarWidth / 2, 0, sidebarWidth, 45, 0x000000, 0)
                .setOrigin(0.5, 0.5)
                .setInteractive({ useHandCursor: true })
                .on('pointerdown', () => {
                    this.activateMenuItem(index);
                    item.action();
                })
                .on('pointerover', () => {
                    itemBg.setFillStyle(0xb89d65, 0.2);
                    itemBg.setStrokeStyle(1, 0xb89d65, 1);
                    menuItemContainer.x += 5;
                })
                .on('pointerout', () => {
                    if (this.activeSection !== item.name) {
                        itemBg.setFillStyle(0x000000, 0);
                        itemBg.setStrokeStyle(1, 0xb89d65, 0);
                    }
                    menuItemContainer.x = startX;
                });

            // Set the active item style if this is the character menu
            if (item.name === 'Character') {
                itemBg.setFillStyle(0xb89d65, 0.4);
                itemBg.setStrokeStyle(1, 0xb89d65, 1);
            }

            menuItemContainer.add(itemBg);

            // Try to add icon - using placeholder rectangle if icon not found
            let iconElement;
            try {
                iconElement = this.add.image(10, 0, `icon-${item.icon.toLowerCase()}`)
                    .setDisplaySize(30, 30)
                    .setOrigin(0, 0.5)
                    .setTint(0xe0d2b4);
            } catch (e) {
                // Fallback to rectangle if image not loaded
                iconElement = this.add.rectangle(10, 0, 30, 30, 0xe0d2b4, 0.7)
                    .setOrigin(0, 0.5);
            }

            menuItemContainer.add(iconElement);

            // Add text
            const itemText = this.add.text(50, 0, item.name, {
                fontFamily: 'Times New Roman, serif',
                fontSize: '18px',
                color: '#e0d2b4'
            }).setOrigin(0, 0.5);

            menuItemContainer.add(itemText);
            this.menuOptions.push(menuItemContainer);
            this.menuContainer.add(menuItemContainer);
        });
    }

    private createContentPanel() {
        const sidebarWidth = 200; // Match reduced sidebar width
        const padding = 20;
        const contentWidth = this.menuPanel.width - sidebarWidth - padding * 3;
        const contentHeight = this.menuPanel.height - padding * 2;

        // Content panel positioned to the right of the sidebar
        this.contentPanel = this.add.rectangle(
            (-this.menuPanel.width / 2 + sidebarWidth + padding) + contentWidth / 2,
            0,
            contentWidth,
            contentHeight,
            0x382613,
            0.7
        ).setStrokeStyle(1, 0xb89d65, 1);
        this.menuContainer.add(this.contentPanel);

        // Create a scroll container for content at the exact position of the content panel
        this.contentScrollArea = this.add.container(
            this.contentPanel.x - this.contentPanel.width / 2,
            this.contentPanel.y - this.contentPanel.height / 2
        );
        this.menuContainer.add(this.contentScrollArea);

        // Create mask for the content area to enable scrolling
        const graphics = this.make.graphics();
        graphics.fillRect(
            this.contentPanel.x - this.contentPanel.width / 2,
            this.contentPanel.y - this.contentPanel.height / 2,
            this.contentPanel.width,
            this.contentPanel.height
        );

        // Create and apply the geometry mask
        const mask = new Phaser.Display.Masks.GeometryMask(this, graphics);
        this.contentScrollArea.setMask(mask);

        // Adjust position to be relative to the content scroll area origin
        const portraitX = this.contentPanel.width / 2;
        const portraitY = 120;

        // Add character portrait
        this.characterPortrait = this.add.image(
            portraitX,
            portraitY,
            'character-portrait'
        ).setDisplaySize(200, 200)
            .setOrigin(0.5, 0.5);

        // Add circular mask for the portrait
        const portraitMask = this.make.graphics({});
        portraitMask.fillCircle(portraitX, portraitY, 100);
        this.characterPortrait.setMask(portraitMask.createGeometryMask());

        // Add a circle border around the portrait
        const portraitBorder = this.add.graphics();
        portraitBorder.lineStyle(5, 0xb89d65, 1);
        portraitBorder.strokeCircle(portraitX, portraitY, 100);
        this.contentScrollArea.add([this.characterPortrait, portraitBorder]);

        // Add title text - positioned relative to the scroll area
        this.contentTitle = this.add.text(
            portraitX,
            portraitY + 120,
            'Sir Lancelot',
            {
                fontFamily: 'Times New Roman, serif',
                fontSize: '32px',
                color: '#f0e0c0',
                align: 'center'
            }
        ).setOrigin(0.5)
            .setShadow(0, 0, '#704214', 10, true);

        // Add description text - positioned relative to the title
        this.contentDescription = this.add.text(
            portraitX,
            portraitY + 180,
            'Level 32 Knight\nGuild: Knights of the Round Table\n\nHealth: 245/245\nMana: 120/120\nStamina: 180/180\n\nCurrent Quest: Slay the Dragon of Blackrock Mountain',
            {
                fontFamily: 'Times New Roman, serif',
                fontSize: '16px',
                color: '#d0c0a0',
                align: 'center',
                lineSpacing: 10,
                wordWrap: { width: contentWidth - 40 }
            }
        ).setOrigin(0.5, 0);

        // Add more content to make scrolling necessary
        let yPosition = portraitY + 350;

        // Add equipment section
        const equipmentTitle = this.add.text(
            portraitX,
            yPosition,
            'EQUIPMENT',
            {
                fontFamily: 'Times New Roman, serif',
                fontSize: '24px',
                color: '#f0e0c0',
                align: 'center'
            }
        ).setOrigin(0.5, 0);

        yPosition += 40;

        const equipmentText = this.add.text(
            portraitX,
            yPosition,
            'Weapon: Excalibur (+15 Attack)\nArmor: Dragonscale Plate (+25 Defense)\nHelmet: Crown of Valor (+10 Charisma)\nGloves: Gauntlets of Might (+5 Strength)\nBoots: Swiftfoot Greaves (+10 Agility)',
            {
                fontFamily: 'Times New Roman, serif',
                fontSize: '16px',
                color: '#d0c0a0',
                align: 'center',
                lineSpacing: 10,
                wordWrap: { width: contentWidth - 40 }
            }
        ).setOrigin(0.5, 0);

        yPosition += 150;

        // Add inventory section
        const inventoryTitle = this.add.text(
            portraitX,
            yPosition,
            'INVENTORY',
            {
                fontFamily: 'Times New Roman, serif',
                fontSize: '24px',
                color: '#f0e0c0',
                align: 'center'
            }
        ).setOrigin(0.5, 0);

        yPosition += 40;

        const inventoryText = this.add.text(
            portraitX,
            yPosition,
            'Health Potion x5\nMana Potion x3\nDragon Scale x1\nGold Coins x250\nSilver Pendant x1\nDragon Slaying Guide x1\nRound Table Medallion x1',
            {
                fontFamily: 'Times New Roman, serif',
                fontSize: '16px',
                color: '#d0c0a0',
                align: 'center',
                lineSpacing: 10,
                wordWrap: { width: contentWidth - 40 }
            }
        ).setOrigin(0.5, 0);

        // Add all text elements to the scroll container
        this.contentScrollArea.add([
            this.contentTitle,
            this.contentDescription,
            equipmentTitle,
            equipmentText,
            inventoryTitle,
            inventoryText
        ]);

        // Calculate the total content height for scrolling limits
        const totalContentHeight = yPosition + inventoryText.height + 40;

        // Set up drag zone for scrolling
        const zone = this.add.zone(
            this.contentPanel.x - this.contentPanel.width / 2,
            this.contentPanel.y - this.contentPanel.height / 2,
            this.contentPanel.width,
            this.contentPanel.height
        ).setOrigin(0).setInteractive();

        zone.on('pointermove', pointer => {
            if (pointer.isDown) {
                // Move content based on drag velocity
                this.contentScrollArea.y += (pointer.velocity.y / 10);

                // Calculate scrolling boundaries
                // Allow scrolling up to show all content
                const minY = this.contentPanel.y - this.contentPanel.height / 2 - (totalContentHeight - this.contentPanel.height);
                // Don't scroll beyond the top of the panel
                const maxY = this.contentPanel.y - this.contentPanel.height / 2;

                // Clamp scrolling to keep content in view
                this.contentScrollArea.y = Phaser.Math.Clamp(
                    this.contentScrollArea.y,
                    minY,
                    maxY
                );
            }
        });

        // Add scroll buttons if you have them
        if (typeof this.createScrollButtons === 'function') {
            this.createScrollButtons();
        }
    }



    // Create scroll buttons for content
    private createScrollButtons() {
        const buttonSize = 30;
        const buttonX = this.contentPanel.x + this.contentPanel.width / 2 - 20;

        // Up button
        this.scrollUpButton = this.add.container(
            buttonX,
            this.contentPanel.y - this.contentPanel.height / 2 + 20
        );

        const upBg = this.add.circle(0, 0, buttonSize / 2, 0x382613, 0.9)
            .setStrokeStyle(2, 0xb89d65, 1);

        const upArrow = this.add.text(0, 0, '▲', {
            fontSize: '16px',
            color: '#e0d2b4'
        }).setOrigin(0.5);

        this.scrollUpButton.add([upBg, upArrow]);
        this.scrollUpButton.setInteractive(
            new Phaser.Geom.Circle(0, 0, buttonSize / 2),
            Phaser.Geom.Circle.Contains
        )
            .on('pointerdown', () => this.scrollContent(-30))
            .on('pointerover', () => upBg.setFillStyle(0xb89d65, 0.4))
            .on('pointerout', () => upBg.setFillStyle(0x382613, 0.9));

        // Down button
        this.scrollDownButton = this.add.container(
            buttonX,
            this.contentPanel.y + this.contentPanel.height / 2 - 20
        );

        const downBg = this.add.circle(0, 0, buttonSize / 2, 0x382613, 0.9)
            .setStrokeStyle(2, 0xb89d65, 1);

        const downArrow = this.add.text(0, 0, '▼', {
            fontSize: '16px',
            color: '#e0d2b4'
        }).setOrigin(0.5);

        this.scrollDownButton.add([downBg, downArrow]);
        this.scrollDownButton.setInteractive(
            new Phaser.Geom.Circle(0, 0, buttonSize / 2),
            Phaser.Geom.Circle.Contains
        )
            .on('pointerdown', () => this.scrollContent(30))
            .on('pointerover', () => downBg.setFillStyle(0xb89d65, 0.4))
            .on('pointerout', () => downBg.setFillStyle(0x382613, 0.9));

        this.menuContainer.add([this.scrollUpButton, this.scrollDownButton]);
    }

    // Handle scrolling content
    private scrollContent(amount: number) {
        // Calculate content height
        const contentHeight = this.getContentHeight();
        const visibleHeight = this.contentPanel.height;

        // Only allow scrolling if content is taller than visible area
        if (contentHeight > visibleHeight) {
            // Calculate min/max scroll positions
            const minY = visibleHeight / 2 - contentHeight;
            const maxY = visibleHeight / 2;

            // Update scroll position
            const newY = Phaser.Math.Clamp(
                this.contentScrollArea.y + amount,
                this.contentPanel.y + minY,
                this.contentPanel.y + maxY
            );

            this.contentScrollArea.y = newY;
        }
    }

    // Calculate total content height
    private getContentHeight(): number {
        // Find the lowest point of all content elements
        let lowestY = 0;

        this.contentScrollArea.each((child: GameObjects.GameObject) => {
            if (child instanceof GameObjects.Text || child instanceof GameObjects.Image) {
                const bounds = child.getBounds();
                const bottomY = bounds.bottom - this.contentScrollArea.y;
                if (bottomY > lowestY) {
                    lowestY = bottomY;
                }
            }
        });

        return lowestY + 20; // Add padding
    }

    // Activate a menu item and update styling
    private activateMenuItem(index: number) {
        // Update all menu items to non-active state
        this.menuOptions.forEach((option, i) => {
            const bg = option.getAt(0) as GameObjects.Rectangle;
            bg.setFillStyle(0x000000, 0);
            bg.setStrokeStyle(1, 0xb89d65, 0);
        });

        // Set selected item to active
        const activeBg = this.menuOptions[index].getAt(0) as GameObjects.Rectangle;
        activeBg.setFillStyle(0xb89d65, 0.4);
        activeBg.setStrokeStyle(1, 0xb89d65, 1);

        // Update active section
        this.activeSection = this.menuItems[index].name;
    }

    // Update content panel based on selected menu item
    private updateContentPanel(section: string) {
        // Reset scroll position
        this.contentScrollArea.y = this.contentPanel.y;

        // Update content based on section
        switch (section) {
            case 'Character':
                this.contentTitle.setText('Sir Lancelot');
                this.contentDescription.setText(
                    'Level 32 Knight\nGuild: Knights of the Round Table\n\n' +
                    'Health: 245/245\nMana: 120/120\nStamina: 180/180\n\n' +
                    'Current Quest: Slay the Dragon of Blackrock Mountain'
                );
                this.characterPortrait.setVisible(true);
                break;

            case 'Inventory':
                this.contentTitle.setText('Inventory');
                this.contentDescription.setText(
                    'Gold: 1,250\nWeight: 45/100\n\n' +
                    'Equipped:\n- Excalibur (+25 ATK)\n- Shield of Faith (+18 DEF)\n- Royal Armor (+30 DEF)\n\n' +
                    'Consumables:\n- Health Potion x5\n- Mana Potion x3\n- Stamina Potion x2\n\n' +
                    'Materials:\n- Dragon Scale x3\n- Enchanted Wood x7\n- Pure Gold x2\n- Magic Essence x12\n\n' +
                    'Quest Items:\n- Ancient Relic\n- Map to Dragon\'s Lair'
                );
                this.characterPortrait.setVisible(false);
                break;

            case 'Skills':
                this.contentTitle.setText('Skills');
                this.contentDescription.setText(
                    'Skill Points: 3\n\n' +
                    'Combat Skills:\n- Swordsmanship: Level 5\n- Shield Mastery: Level 4\n- Charge: Level 3\n- Dual Wielding: Level 2\n- Counter Attack: Level 3\n\n' +
                    'Magic Skills:\n- Holy Light: Level 2\n- Divine Protection: Level 3\n- Healing Touch: Level 1\n- Elemental Resistance: Level 2\n\n' +
                    'Passive Skills:\n- Endurance: Level 4\n- Leadership: Level 3\n- Perception: Level 2\n- Charisma: Level 3\n- Strength: Level 4\n- Agility: Level 3'
                );
                this.characterPortrait.setVisible(false);
                break;
            // New test case for scrollable content
            case 'TestScroll':
                this.contentTitle.setText('Test Scrollable Container');
                this.contentDescription.setText(
                    'This is sample text to test the scrollable container. ' +
                    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. ' +
                    'Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. ' +
                    'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. ' +
                    'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. ' +
                    'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.\n\n' +
                    'Additional text to ensure that the content exceeds the visible area. ' +
                    'Praesent sapien massa, convallis a pellentesque nec, egestas non nisi. ' +
                    'Curabitur arcu erat, accumsan id imperdiet et, porttitor at sem. ' +
                    'Sed porttitor lectus nibh. Donec sollicitudin molestie malesuada.'
                );
                this.characterPortrait.setVisible(false);
                break;
            default:
                this.contentTitle.setText(`${section}`);
                this.contentDescription.setText(`${section} feature coming soon!\n\nThis panel now supports scrolling for longer content. Try the scroll buttons or use your mouse wheel to scroll through content that doesn't fit within the visible area.\n\nAdditional ${section} features will be implemented in the next update.`);
                this.characterPortrait.setVisible(false);
        }
    }

    closeMenu() {
        // Return to the game scene
        if (this.scene.isActive('Game')) {
            this.scene.resume('Game');
        }
        this.scene.sleep();
    }

    // Menu action methods
    showInventory() {
        this.updateContentPanel('Inventory');

        // Original functionality
        if (this.scene.isActive('Game')) {
            const gameScene = this.scene.get('Game') as any;

            const inventoryData = {
                slots: gameScene.inventorySystem?.getAllItems() || [],
                equipment: gameScene.inventorySystem?.getEquippedItems() || [],
                weightCapacity: gameScene.inventorySystem?.getWeightCapacity() || 100,
                gold: gameScene.inventorySystem?.getGold() || 0
            };

            // Instead of launching scene, we'll just update our content panel
            // but keep the original behavior commented here for reference
            /* 
            this.closeMenu();
            gameScene.scene.pause();
            gameScene.scene.launch('InventoryScene', { game: gameScene, inventoryData });
            */
        }
    }

    showMessaging() {
        this.updateContentPanel('Messaging');
    }

    showCraft() {
        this.updateContentPanel('Craft');
    }

    showCharacter() {
        this.updateContentPanel('Character');

        // Get actual player data if available
        if (this.scene.isActive('Game')) {
            const gameScene = this.scene.get('Game') as any;

            if (gameScene.playerStats) {
                const health = gameScene.playerStats.health || 245;
                const maxHealth = gameScene.playerStats.maxHealth || 245;
                const level = gameScene.playerStats.level || 32;

                // Update with real player data
                this.contentDescription.setText(
                    `Level ${level} Knight\nGuild: Knights of the Round Table\n\n` +
                    `Health: ${health}/${maxHealth}\nMana: 120/120\nStamina: 180/180\n\n` +
                    'Current Quest: Slay the Dragon of Blackrock Mountain'
                );
            }
        }
    }

    showMap() {
        this.updateContentPanel('Map');
    }

    showSkills() {
        this.updateContentPanel('Skills');
    }

    showLeaderboard() {
        this.updateContentPanel('Leaderboard');
    }

    // Creates a flag for the player (implementation kept from original)
    createFlag() {
        console.log('Creating flag from craft menu');

        // Get reference to the Game scene
        const gameScene = this.scene.get('Game') as any;

        // Call the placePlayerFlag method in the Game scene
        if (gameScene && typeof gameScene.placePlayerFlag === 'function') {
            gameScene.placePlayerFlag();

            // Show confirmation
            const notification = this.add.text(0, this.contentPanel.height / 2 - 50, 'Flag created at your position!', {
                fontFamily: 'Arial',
                fontSize: '18px',
                color: '#00ff00',
                backgroundColor: '#333333',
                padding: { x: 15, y: 10 }
            }).setOrigin(0.5);

            this.menuContainer.add(notification);

            // Remove the notification after 2 seconds
            this.time.delayedCall(2000, () => {
                notification.destroy();
            });
        }
    }

    // Temporarily show a notification for unimplemented features
    showNotImplemented(feature: string) {
        // Display a message indicating the feature is not yet implemented
        const notification = this.add.text(0, this.contentPanel.height / 2 - 50, `${feature} feature coming soon!`, {
            fontFamily: 'Times New Roman, serif',
            fontSize: '18px',
            color: '#ffffff',
            backgroundColor: '#333333',
            padding: { x: 15, y: 10 }
        }).setOrigin(0.5);

        this.menuContainer.add(notification);

        // Remove the notification after 2 seconds
        this.time.delayedCall(2000, () => {
            notification.destroy();
        });
    }
}