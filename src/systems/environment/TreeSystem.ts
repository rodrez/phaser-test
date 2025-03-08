import { Scene } from 'phaser';
import { PopupSystem, PopupContent } from '../PopupSystem';

/**
 * System to handle tree-related functionality
 */
export class TreeSystem {
    private scene: Scene;
    private environmentGroup: Phaser.GameObjects.Group;
    private popupSystem?: PopupSystem;
    
    constructor(scene: Scene, environmentGroup: Phaser.GameObjects.Group) {
        this.scene = scene;
        this.environmentGroup = environmentGroup;
        this.setupTreeInteractions();
    }
    
    /**
     * Set the popup system reference
     */
    setPopupSystem(popupSystem: PopupSystem): void {
        this.popupSystem = popupSystem;
    }
    
    /**
     * Setup tree interaction events
     */
    private setupTreeInteractions(): void {
        this.scene.events.on('tree-interact', (tree: Phaser.GameObjects.Image | Phaser.GameObjects.Sprite) => {
            this.showTreeInteractionPopup(tree);
        });
    }
    
    /**
     * Show tree interaction popup
     */
    private showTreeInteractionPopup(tree: Phaser.GameObjects.Image | Phaser.GameObjects.Sprite): void {
        if (!this.popupSystem) return;
        
        const treeName = tree.getData('treeName') || 'Tree';
        const isHealingSpruce = tree.getData('isHealingSpruce') || false;
        
        // Check if the tree has fruits
        const hasFruits = this.checkTreeHasFruits(tree);
        
        // Create HTML content for the popup
        let popupContent: PopupContent = {
            html: `
                <div class="tree-interaction-popup">
                    <h3>${treeName}</h3>
                    <div class="tree-description">
                        ${isHealingSpruce ? 
                            'A magical tree with healing properties. Its needles shimmer with a faint green glow.' : 
                            'A sturdy tree with thick branches and lush foliage.'}
                    </div>
                    <div class="tree-actions">
                        <button class="action-btn info-btn examine-btn">Examine</button>
                        <button class="action-btn danger-btn chop-btn">Chop</button>
                        ${hasFruits ? '<button class="action-btn success-btn gather-btn" style="background-color: #4CAF50; color: white;">Gather Fruits</button>' : ''}
                    </div>
                </div>
            `,
            buttons: [
                {
                    selector: '.examine-btn',
                    onClick: () => {
                        // Close the popup first
                        this.popupSystem?.closePopupsByClass('tree-popup');
                        // Then perform the examine action
                        this.examineTree(tree);
                    }
                },
                {
                    selector: '.chop-btn',
                    onClick: () => {
                        // Close the popup first
                        this.popupSystem?.closePopupsByClass('tree-popup');
                        // Then perform the chop action
                        this.chopTree(tree);
                    }
                }
            ]
        };
        
        // Add gather fruits button if the tree has fruits
        if (hasFruits) {
            popupContent.buttons?.push({
                selector: '.gather-btn',
                onClick: () => {
                    // Close the popup first
                    this.popupSystem?.closePopupsByClass('tree-popup');
                    // Then perform the gather fruits action
                    this.handleGatherFruits(tree);
                }
            });
        }
        
        // Convert world position to screen position
        const camera = this.scene.cameras.main;
        const screenX = (tree.x - camera.scrollX) * camera.zoom;
        const screenY = (tree.y - tree.height * 0.5 - camera.scrollY) * camera.zoom;
        
        // Create popup at tree's screen position
        this.popupSystem.createPopupAtScreenPosition(
            screenX,
            screenY,
            popupContent,
            {
                className: 'tree-popup',
                closeButton: true,
                width: 250,
                offset: { x: 0, y: -20 }
            }
        );
    }
    
    /**
     * Check if a tree has fruits
     */
    private checkTreeHasFruits(tree: Phaser.GameObjects.Image | Phaser.GameObjects.Sprite): boolean {
        // Get all sprites at the tree's position
        const sprites = this.scene.children.list.filter(obj => {
            // Check if it's a sprite and has fruitType data
            return obj instanceof Phaser.GameObjects.Sprite && 
                   obj.getData('fruitType') !== undefined &&
                   // Check if it's close to the tree (within the tree's canopy)
                   Phaser.Math.Distance.Between(obj.x, obj.y, tree.x, tree.y) < tree.displayWidth * 0.6;
        });
        
        return sprites.length > 0;
    }
    
    /**
     * Add trees within a circular area
     */
    addTreesInCircle(count: number, centerX: number, centerY: number, radius: number): void {
        // Determine number of trees to add (between 3 and specified count, maximum 12)
        const treesToAdd = Phaser.Math.Between(3, Math.min(12, count));
        
        // Track positions to avoid overlap
        const treePositions: {x: number, y: number, radius: number}[] = [];
        const minDistanceBetweenTrees = 30;
        
        let attempts = 0;
        const maxAttempts = 100;
        let treesPlaced = 0;
        
        while (treesPlaced < treesToAdd && attempts < maxAttempts) {
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.sqrt(Math.random()) * radius;
            
            const x = centerX + Math.cos(angle) * distance;
            const y = centerY + Math.sin(angle) * distance;
            
            if (!this.isPositionTooCloseToTrees(x, y, treePositions, minDistanceBetweenTrees)) {
                const treeType = Math.random() > 0.5 ? 'tree' : 'spruce-tree';
                const tree = this.addTreeWithVariation(x, y, treeType);
                
                treePositions.push({
                    x,
                    y,
                    radius: minDistanceBetweenTrees / 2
                });
                
                treesPlaced++;
            }
            
            attempts++;
        }
    }
    
    /**
     * Check if a position is too close to existing trees
     */
    private isPositionTooCloseToTrees(x: number, y: number, treePositions: {x: number, y: number, radius: number}[], minDistance: number): boolean {
        return treePositions.some(pos => {
            const dx = pos.x - x;
            const dy = pos.y - y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            return dist < minDistance;
        });
    }
    
    /**
     * Add a tree with random variations
     */
    private addTreeWithVariation(x: number, y: number, treeType: string): Phaser.GameObjects.GameObject {
        let tree;
        
        if (treeType === 'spruce-tree') {
            tree = this.createSpruceTree(x, y);
        } else {
            tree = this.createRegularTree(x, y);
        }
        
        // Add some randomness to scale
        const scale = 0.8 + Math.random() * 0.4;
        tree.setScale(scale);
        
        // Add slight rotation for non-animated trees
        if (treeType !== 'spruce-tree') {
            const rotation = (Math.random() * 10 - 5) * (Math.PI / 180);
            tree.setRotation(rotation);
        }
        
        // Set origin and depth
        tree.setOrigin(0.5, 1);
        tree.setDepth(10 + Math.random() * 5);
        
        // Make interactive
        this.makeTreeInteractive(tree as Phaser.GameObjects.Image);
        
        // Add to environment group
        this.environmentGroup.add(tree);
        
        return tree;
    }
    
    /**
     * Create a spruce tree with healing properties
     */
    private createSpruceTree(x: number, y: number): Phaser.GameObjects.Sprite {
        const tree = this.scene.add.sprite(x, y, 'spruce-tree');
        
        // Setup spruce tree animation if it doesn't exist
        if (!this.scene.anims.exists('spruce-sway')) {
            this.scene.anims.create({
                key: 'spruce-sway',
                frames: this.scene.anims.generateFrameNumbers('spruce-tree', { start: 0, end: 21 }),
                frameRate: 5,
                repeat: -1,
                yoyo: true
            });
        }
        
        // Play animation
        tree.anims.play('spruce-sway');
        tree.anims.setProgress(Math.random());
        
        // Set tree data
        tree.setData('woodAmount', { min: 1, max: 2 });
        tree.setData('treeName', 'Healing Spruce');
        tree.setData('isHealingSpruce', true);
        
        // Add healing aura
        this.addHealingAura(tree);
        
        return tree;
    }
    
    /**
     * Create a regular tree
     */
    private createRegularTree(x: number, y: number): Phaser.GameObjects.Image {
        const tree = this.scene.add.image(x, y, 'tree');
        
        // Set tree data
        tree.setData('woodAmount', { min: 2, max: 4 });
        tree.setData('treeName', 'Oak Tree');
        tree.setData('isHealingSpruce', false);
        
        return tree;
    }
    
    /**
     * Add a healing aura to a tree
     */
    private addHealingAura(tree: Phaser.GameObjects.Sprite): void {
        const healingRadius = 100;
        const healingAura = this.scene.add.circle(tree.x, tree.y, healingRadius, 0x00ff00, 0.1);
        healingAura.setVisible(false);
        healingAura.setData('healingPower', 1);
        healingAura.setData('parentTree', tree);
        tree.setData('healingAura', healingAura);
        
        this.environmentGroup.add(healingAura);
    }
    
    /**
     * Make a tree interactive
     */
    private makeTreeInteractive(tree: Phaser.GameObjects.Image | Phaser.GameObjects.Sprite): void {
        tree.setInteractive({ useHandCursor: true });
        
        const originalScale = tree.scale;
        
        // Hover effects
        tree.on('pointerover', () => {
            this.scene.tweens.add({
                targets: tree,
                scaleX: originalScale * 1.05,
                scaleY: originalScale * 1.05,
                duration: 200,
                ease: 'Sine.easeOut'
            });
        });
        
        tree.on('pointerout', () => {
            this.scene.tweens.add({
                targets: tree,
                scaleX: originalScale,
                scaleY: originalScale,
                duration: 200,
                ease: 'Sine.easeOut'
            });
        });
        
        // Click effect
        tree.on('pointerdown', () => {
            this.scene.tweens.add({
                targets: tree,
                x: tree.x + 2,
                y: tree.y - 2,
                duration: 50,
                yoyo: true,
                repeat: 3,
                ease: 'Sine.easeInOut',
                onComplete: () => {
                    this.scene.events.emit('tree-interact', tree);
                    this.createLeafParticles(tree.x, tree.y - tree.height * 0.6);
                }
            });
        });
    }
    
    /**
     * Create leaf particles effect
     */
    private createLeafParticles(x: number, y: number): void {
        const numParticles = 10;
        
        for (let i = 0; i < numParticles; i++) {
            const leaf = this.scene.add.rectangle(
                x, 
                y - 40, 
                4, 
                4, 
                Phaser.Display.Color.GetColor(
                    100 + Math.floor(Math.random() * 50), 
                    150 + Math.floor(Math.random() * 50), 
                    50 + Math.floor(Math.random() * 50)
                )
            );
            
            const vx = (Math.random() - 0.5) * 60;
            const vy = -30 - Math.random() * 50;
            
            this.scene.tweens.add({
                targets: leaf,
                x: leaf.x + vx * 2,
                y: leaf.y + 100,
                angle: Math.random() * 360,
                alpha: 0,
                duration: 1000 + Math.random() * 1000,
                ease: 'Sine.easeIn',
                onComplete: () => leaf.destroy()
            });
        }
    }
    
    /**
     * Chop down a tree
     */
    private chopTree(tree: Phaser.GameObjects.Image | Phaser.GameObjects.Sprite): void {
        // Check if player has the right tool (optional)
        // For now, we'll allow chopping without a tool
        
        // Get player from the scene
        const player = this.scene.registry.get('player') as Phaser.Physics.Arcade.Sprite;
        if (!player) return;
        
        // Move player closer to the tree if they're far away
        const distance = Phaser.Math.Distance.Between(player.x, player.y, tree.x, tree.y);
        if (distance > 50) {
            // Player is too far, move closer first
            const angle = Phaser.Math.Angle.Between(player.x, player.y, tree.x, tree.y);
            const targetX = tree.x - Math.cos(angle) * 40;
            const targetY = tree.y - Math.sin(angle) * 40;
            
            // Move player to the tree first, then chop
            this.scene.tweens.add({
                targets: player,
                x: targetX,
                y: targetY,
                duration: distance * 5, // Speed based on distance
                ease: 'Linear',
                onComplete: () => {
                    // After moving, perform the chopping action
                    this.performChopAction(tree, player);
                }
            });
        } else {
            // Player is close enough, chop immediately
            this.performChopAction(tree, player);
        }
    }
    
    /**
     * Perform the actual tree chopping action and gather wood
     */
    private performChopAction(tree: Phaser.GameObjects.Image | Phaser.GameObjects.Sprite, player: Phaser.Physics.Arcade.Sprite): void {
        // Face the player toward the tree
        if (tree.x > player.x) {
            player.setFlipX(false);
        } else {
            player.setFlipX(true);
        }
        
        // Play chopping animation (shake the tree)
        this.scene.tweens.add({
            targets: tree,
            x: tree.x + 3,
            duration: 50,
            yoyo: true,
            repeat: 5,
            ease: 'Sine.easeInOut',
            onComplete: () => {
                // Create wood particles effect
                this.createWoodChipParticles(tree.x, tree.y);
                
                // Get the tree's wood amount data or use default values
                const woodAmountData = tree.getData('woodAmount') || { min: 1, max: 3 };
                
                // Determine amount of wood to give based on tree type
                const woodAmount = Phaser.Math.Between(woodAmountData.min, woodAmountData.max);
                
                // Emit an event for the Game scene to add wood to inventory
                this.scene.events.emit('add-item-to-inventory', { itemId: 'wood', quantity: woodAmount });
                
                // Show success message
                const treeName = tree.getData('treeName') || 'tree';
                const message = `You gathered ${woodAmount} wood from the ${treeName}!`;
                
                // Display the message
                const woodMsg = this.scene.add.text(tree.x, tree.y - 50, message, {
                    fontSize: '16px',
                    fontFamily: 'Cinzel, Times New Roman, serif',
                    color: '#e8d4b9',
                    stroke: '#2a1a0a',
                    strokeThickness: 4,
                    align: 'center',
                    shadow: {
                        offsetX: 2,
                        offsetY: 2,
                        color: '#000',
                        blur: 4,
                        fill: true
                    }
                }).setOrigin(0.5);
                
                // Fade out and destroy
                this.scene.tweens.add({
                    targets: woodMsg,
                    alpha: 0,
                    y: woodMsg.y - 30,
                    duration: 2000,
                    onComplete: () => woodMsg.destroy()
                });
                
                // Create stump effect
                this.createTreeStump(tree);
                
                // Remove any fruits attached to this tree
                this.removeFruitsFromTree(tree);
                
                // Make the tree disappear with a falling animation
                this.scene.tweens.add({
                    targets: tree,
                    y: tree.y + 20,
                    alpha: 0,
                    angle: tree.angle + Phaser.Math.Between(-15, 15),
                    duration: 800,
                    ease: 'Quad.easeIn',
                    onComplete: () => {
                        // Emit tree destroyed event
                        this.scene.events.emit('tree-destroyed', tree);
                        // Remove the tree from the game
                        tree.destroy();
                    }
                });
                
                // Add some XP for woodcutting
                this.scene.events.emit('add-skill-points', 1);
            }
        });
    }
    
    /**
     * Create a tree stump where the tree was chopped
     */
    private createTreeStump(tree: Phaser.GameObjects.Image | Phaser.GameObjects.Sprite): void {
        // Create a simple stump graphic
        const stump = this.scene.add.graphics();
        stump.fillStyle(0x8B4513, 1); // Brown color
        stump.fillCircle(tree.x, tree.y, 10);
        stump.fillStyle(0x654321, 1); // Darker brown for rings
        stump.fillCircle(tree.x, tree.y, 6);
        stump.fillStyle(0x8B4513, 1); // Brown again
        stump.fillCircle(tree.x, tree.y, 3);
        
        // Set depth to be below the tree but above the ground
        stump.setDepth(tree.depth - 1);
    }
    
    /**
     * Remove all fruits associated with a tree
     */
    private removeFruitsFromTree(tree: Phaser.GameObjects.Image | Phaser.GameObjects.Sprite): void {
        // Get all fruit sprites near the tree
        const fruitSprites = this.scene.children.list.filter(obj => {
            // Check if it's a sprite and has fruitType data
            return obj instanceof Phaser.GameObjects.Sprite && 
                   obj.getData('fruitType') !== undefined &&
                   // Check if it's close to the tree (within the tree's canopy)
                   Phaser.Math.Distance.Between(obj.x, obj.y, tree.x, tree.y) < tree.displayWidth * 0.6;
        }) as Phaser.GameObjects.Sprite[];
        
        // Make fruits fall to the ground and disappear
        for (const fruit of fruitSprites) {
            this.scene.tweens.add({
                targets: fruit,
                y: fruit.y + 100,
                alpha: 0,
                angle: Phaser.Math.Between(-180, 180),
                duration: 600,
                ease: 'Quad.easeIn',
                onComplete: () => fruit.destroy()
            });
        }
    }
    
    /**
     * Examine a tree
     */
    private examineTree(tree: Phaser.GameObjects.Image | Phaser.GameObjects.Sprite): void {
        const treeName = tree.getData('treeName') || 'Tree';
        const isHealingSpruce = tree.getData('isHealingSpruce') || false;
        
        // Random messages for tree interaction
        const messages = [
            `You found a ${treeName}!`,
            `A majestic ${treeName} stands before you.`,
            `This ${treeName} looks healthy.`,
            `Birds are nesting in this ${treeName}.`
        ];
        
        // Add special messages for healing spruce
        if (isHealingSpruce) {
            messages.push(
                `The ${treeName} emits a soft, healing aura.`,
                `The needles of this ${treeName} shimmer with magical energy.`
            );
        }
        
        // Select a random message
        const message = messages[Math.floor(Math.random() * messages.length)];
        
        // Show notification
        const treeMessage = this.scene.add.text(tree.x, tree.y - 50, message, {
            fontSize: '16px',
            fontFamily: 'Cinzel, Times New Roman, serif',
            color: '#e8d4b9',
            stroke: '#2a1a0a',
            strokeThickness: 4,
            align: 'center',
            shadow: {
                offsetX: 2,
                offsetY: 2,
                color: '#000',
                blur: 4,
                fill: true
            }
        }).setOrigin(0.5);
        
        // Add a nice fade out effect
        this.scene.tweens.add({
            targets: treeMessage,
            y: treeMessage.y - 30,
            alpha: 0,
            duration: 2000,
            ease: 'Cubic.easeOut',
            onComplete: () => treeMessage.destroy()
        });
    }
    
    /**
     * Handle gathering fruits from a tree
     */
    private handleGatherFruits(tree: Phaser.GameObjects.Image | Phaser.GameObjects.Sprite): void {
        // Get player from the scene
        const player = this.scene.registry.get('player') as Phaser.Physics.Arcade.Sprite;
        if (!player) return;
        
        // Get all fruit sprites near the tree
        const fruitSprites = this.scene.children.list.filter(obj => {
            // Check if it's a sprite and has fruitType data
            return obj instanceof Phaser.GameObjects.Sprite && 
                   obj.getData('fruitType') !== undefined &&
                   // Check if it's close to the tree (within the tree's canopy)
                   Phaser.Math.Distance.Between(obj.x, obj.y, tree.x, tree.y) < tree.displayWidth * 0.6;
        }) as Phaser.GameObjects.Sprite[];
        
        if (fruitSprites.length === 0) {
            // No fruits found
            const noFruitsMsg = this.scene.add.text(tree.x, tree.y - 50, "No fruits to gather!", {
                fontSize: '16px',
                fontFamily: 'Cinzel, Times New Roman, serif',
                color: '#e8d4b9',
                stroke: '#2a1a0a',
                strokeThickness: 4,
                align: 'center',
                shadow: {
                    offsetX: 2,
                    offsetY: 2,
                    color: '#000',
                    blur: 4,
                    fill: true
                }
            }).setOrigin(0.5);
            
            // Add a nice fade out effect
            this.scene.tweens.add({
                targets: noFruitsMsg,
                y: noFruitsMsg.y - 30,
                alpha: 0,
                duration: 2000,
                ease: 'Cubic.easeOut',
                onComplete: () => noFruitsMsg.destroy()
            });
            
            return;
        }
        
        // Move player closer to the tree if they're far away
        const distance = Phaser.Math.Distance.Between(player.x, player.y, tree.x, tree.y);
        
        if (distance > 50) {
            // Player is too far, move closer first
            const angle = Phaser.Math.Angle.Between(player.x, player.y, tree.x, tree.y);
            const targetX = tree.x - Math.cos(angle) * 40;
            const targetY = tree.y - Math.sin(angle) * 40;
            
            // Move player to the tree
            this.scene.tweens.add({
                targets: player,
                x: targetX,
                y: targetY,
                duration: distance * 5, // Speed based on distance
                ease: 'Linear',
                onComplete: () => {
                    // After moving, perform the gathering action
                    this.performGatherFruits(tree, fruitSprites, player);
                }
            });
        } else {
            // Player is close enough, gather immediately
            this.performGatherFruits(tree, fruitSprites, player);
        }
    }
    
    /**
     * Perform the actual fruit gathering action
     */
    private performGatherFruits(
        tree: Phaser.GameObjects.Image | Phaser.GameObjects.Sprite, 
        fruitSprites: Phaser.GameObjects.Sprite[],
        player: Phaser.Physics.Arcade.Sprite
    ): void {
        // Face the player toward the tree
        if (tree.x > player.x) {
            player.setFlipX(false);
        } else {
            player.setFlipX(true);
        }
        
        // Track gathered fruits
        const gatheredFruits: { [key: string]: number } = {};
        let totalFruits = 0;
        let totalHealing = 0;
        let hasHealingFruits = false;
        
        // Process each fruit with a slight delay between them
        for (let index = 0; index < fruitSprites.length; index++) {
            const fruit = fruitSprites[index];
            
            // Get fruit data
            const fruitFrame = fruit.getData('fruitFrame');
            const healingPower = fruit.getData('healingPower') || 0;
            const isHealingFruit = fruit.getData('fromHealingSpruce') || false;
            
            if (isHealingFruit) {
                hasHealingFruits = true;
                totalHealing += healingPower;
            }
            
            // Determine which fruit item to add based on the frame
            let itemId = 'food_apple';
            let fruitName = 'Fruit';
            
            switch (fruitFrame) {
                case 0:
                    itemId = 'food_apple';
                    fruitName = isHealingFruit ? 'Healing Apple' : 'Apple';
                    break;
                case 1:
                    itemId = 'food_orange';
                    fruitName = isHealingFruit ? 'Healing Orange' : 'Orange';
                    break;
                case 3:
                    itemId = 'food_cherry';
                    fruitName = isHealingFruit ? 'Healing Cherry' : 'Cherry';
                    break;
                default:
                    itemId = 'food_apple'; // Default to apple
                    fruitName = isHealingFruit ? 'Healing Fruit' : 'Fruit';
            }
            
            // Add to gathered count
            if (!gatheredFruits[fruitName]) {
                gatheredFruits[fruitName] = 0;
            }
            gatheredFruits[fruitName]++;
            totalFruits++;
            
            // Add tween to animate fruit collection
            this.scene.tweens.add({
                targets: fruit,
                x: player.x,
                y: player.y,
                alpha: 0,
                scale: 0.5,
                duration: 500,
                ease: 'Quad.easeIn',
                delay: index * 200, // Stagger the collection
                onComplete: () => {
                    // Add the fruit to inventory
                    this.scene.events.emit('add-item-to-inventory', { itemId, quantity: 1 });
                    
                    // If this is a healing fruit, create a healing effect
                    if (isHealingFruit && healingPower > 0) {
                        // Emit healing event
                        this.scene.events.emit('player-healed', healingPower);
                    }
                    
                    // Remove the fruit sprite and its glow effect if it exists
                    const glowEffect = fruit.getData('glowEffect');
                    if (glowEffect) {
                        glowEffect.destroy();
                    }
                    fruit.destroy();
                    
                    // If this is the last fruit, show the summary message and apply healing
                    if (index === fruitSprites.length - 1) {
                        // Apply healing if there were healing fruits
                        if (hasHealingFruits && totalHealing > 0) {
                            // Emit healing event
                            this.scene.events.emit('player-healed', totalHealing);
                        }
                        
                        // Show success message after all fruits are gathered
                        let message = "You gathered:";
                        for (const [fruitName, count] of Object.entries(gatheredFruits)) {
                            message += `\n${count}x ${fruitName}`;
                        }
                        
                        // Add healing message if applicable
                        if (hasHealingFruits && totalHealing > 0) {
                            message += `\n\nHealed for ${totalHealing} HP!`;
                        }
                        
                        // Display the message
                        const gatherMsg = this.scene.add.text(tree.x, tree.y - 50, message, {
                            fontSize: '16px',
                            fontFamily: 'Cinzel, Times New Roman, serif',
                            color: '#e8d4b9',
                            stroke: '#2a1a0a',
                            strokeThickness: 4,
                            align: 'center',
                            shadow: {
                                offsetX: 2,
                                offsetY: 2,
                                color: '#000',
                                blur: 4,
                                fill: true
                            }
                        }).setOrigin(0.5);
                        
                        // Fade out and destroy
                        this.scene.tweens.add({
                            targets: gatherMsg,
                            alpha: 0,
                            y: gatherMsg.y - 30,
                            duration: 2000,
                            onComplete: () => gatherMsg.destroy()
                        });
                        
                        // Add some XP for gathering
                        this.scene.events.emit('add-skill-points', Math.ceil(totalFruits / 2));
                    }
                }
            });
        }
    }
    
    /**
     * Create wood chip particles
     */
    private createWoodChipParticles(x: number, y: number): void {
        if (!this.scene.textures.exists('wood-chip')) {
            const graphics = this.scene.make.graphics({x: 0, y: 0});
            graphics.fillStyle(0x8B4513);
            graphics.fillRect(0, 0, 8, 4);
            graphics.generateTexture('wood-chip', 8, 4);
        }
        
        const particles = this.scene.add.particles(x, y, 'wood-chip', {
            speed: { min: 50, max: 150 },
            angle: { min: 0, max: 360 },
            scale: { start: 0.5, end: 0 },
            lifespan: 1000,
            gravityY: 300,
            quantity: 10,
            emitting: false
        });
        
        particles.explode();
        
        this.scene.time.delayedCall(1100, () => particles.destroy());
    }
    
    /**
     * Get all healing auras in the environment
     */
    getHealingAuras(): Phaser.GameObjects.GameObject[] {
        return this.environmentGroup.getChildren().filter(obj => {
            return obj instanceof Phaser.GameObjects.Arc && obj.getData('healingPower') !== undefined;
        });
    }
    
    /**
     * Clean up resources
     */
    destroy(): void {
        this.scene.events.off('tree-interact');
    }

    /**
     * Show a visual effect for a healing aura around a tree
     * @param tree The tree with the healing aura
     */
    showHealingAuraEffect(tree: Phaser.GameObjects.GameObject): void {
        // Get the tree as a sprite or image to access position properties
        const treeObj = tree as Phaser.GameObjects.Sprite | Phaser.GameObjects.Image;
        
        // Create a subtle green circle around the tree
        const auraCircle = this.scene.add.circle(treeObj.x, treeObj.y, 100, 0x00ff00, 0.05);
        auraCircle.setDepth(treeObj.depth - 1); // Behind the tree
        
        // Store the circle on the tree
        tree.setData('auraCircle', auraCircle);
        
        // Create a pulsing effect
        this.scene.tweens.add({
            targets: auraCircle,
            alpha: 0.15,
            scale: 1.1,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        // Auto-hide after 5 seconds if player leaves the area
        this.scene.time.delayedCall(5000, () => {
            if (!tree.getData('auraVisible') && auraCircle && auraCircle.active) {
                this.scene.tweens.add({
                    targets: auraCircle,
                    alpha: 0,
                    duration: 500,
                    onComplete: () => {
                        auraCircle.destroy();
                    }
                });
            }
        });
    }
} 