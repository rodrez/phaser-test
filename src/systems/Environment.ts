import { Scene } from 'phaser';
import { FruitType } from './Item';

/**
 * System to handle environment elements like trees, rocks, etc.
 */
export class EnvironmentSystem {
    private scene: Scene;
    private environmentGroup: Phaser.GameObjects.Group;
    
    constructor(scene: Scene) {
        this.scene = scene;
        this.environmentGroup = this.scene.add.group();
    }
    
    /**
     * Adds random trees to the scene
     * @param count Number of trees to add
     * @param minX Minimum x coordinate
     * @param maxX Maximum x coordinate
     * @param minY Minimum y coordinate
     * @param maxY Maximum y coordinate
     */
    addRandomTrees(count: number, minX: number, maxX: number, minY: number, maxY: number): void {
        for (let i = 0; i < count; i++) {
            // Randomly choose between regular tree and spruce tree
            const treeType = Math.random() > 0.5 ? 'tree' : 'spruce-tree';
            
            // Generate random position within boundaries
            const x = Phaser.Math.Between(minX, maxX);
            const y = Phaser.Math.Between(minY, maxY);
            
            this.addTreeWithVariation(x, y, treeType);
        }
    }
    
    /**
     * Adds trees in a cluster pattern
     * @param centerX Center X position of the cluster
     * @param centerY Center Y position of the cluster
     * @param count Number of trees in the cluster
     * @param radius Radius of the cluster area
     */
    addTreeCluster(centerX: number, centerY: number, count: number, radius: number): void {
        for (let i = 0; i < count; i++) {
            // Randomly choose tree type with more weight to the same types within a cluster
            const treeType = Math.random() > 0.7 ? 'tree' : 'spruce-tree';
            
            // Calculate position with distance from center and random angle
            const angle = Math.random() * Math.PI * 2; // Random angle in radians
            const distance = Math.random() * radius; // Random distance within radius
            
            const x = centerX + Math.cos(angle) * distance;
            const y = centerY + Math.sin(angle) * distance;
            
            this.addTreeWithVariation(x, y, treeType);
        }
    }
    
    /**
     * Adds trees in a line pattern (e.g., along a road or river)
     * @param startX Starting X position
     * @param startY Starting Y position
     * @param endX Ending X position
     * @param endY Ending Y position
     * @param count Number of trees to place
     * @param variationWidth Width of variation perpendicular to the line
     */
    addTreeLine(startX: number, startY: number, endX: number, endY: number, count: number, variationWidth: number): void {
        for (let i = 0; i < count; i++) {
            // Determine position along the line
            const t = i / (count - 1); // Value between 0 and 1
            const lineX = startX + (endX - startX) * t;
            const lineY = startY + (endY - startY) * t;
            
            // Calculate perpendicular vector
            const dx = endX - startX;
            const dy = endY - startY;
            const perpX = -dy;
            const perpY = dx;
            
            // Normalize and scale by random variation
            const length = Math.sqrt(perpX * perpX + perpY * perpY);
            const variation = (Math.random() * 2 - 1) * variationWidth;
            const offsetX = (perpX / length) * variation;
            const offsetY = (perpY / length) * variation;
            
            // Final position
            const x = lineX + offsetX;
            const y = lineY + offsetY;
            
            // Alternate tree types for a more natural look
            const treeType = i % 2 === 0 ? 'tree' : 'spruce-tree';
            
            this.addTreeWithVariation(x, y, treeType);
        }
    }
    
    /**
     * Helper method to add a tree with random variations
     * @param x X coordinate
     * @param y Y coordinate
     * @param treeType Type of tree
     */
    private addTreeWithVariation(x: number, y: number, treeType: string): Phaser.GameObjects.GameObject {
        let tree;
        
        if (treeType === 'spruce-tree') {
            // Create animated spruce tree
            tree = this.scene.add.sprite(x, y, treeType);
            
            // Add animation if it doesn't exist yet
            if (!this.scene.anims.exists('spruce-sway')) {
                this.scene.anims.create({
                    key: 'spruce-sway',
                    frames: this.scene.anims.generateFrameNumbers('spruce-tree', { start: 0, end: 21 }),
                    frameRate: 5,
                    repeat: -1,
                    yoyo: true
                });
            }
            
            // Play the animation with a random starting frame for variety
            tree.anims.play('spruce-sway');
            tree.anims.setProgress(Math.random()); // Start at random point in animation
            
            // Set data for healing spruce - provides less wood (1-2)
            tree.setData('woodAmount', { min: 1, max: 2 });
            tree.setData('treeName', 'Healing Spruce');
            tree.setData('isHealingSpruce', true);
            
            // Add a healing aura (invisible circle) around the tree
            const healingRadius = 100; // Radius in pixels
            const healingAura = this.scene.add.circle(tree.x, tree.y, healingRadius, 0x00ff00, 0.1);
            healingAura.setVisible(false); // Make it invisible by default
            healingAura.setData('healingPower', 1); // Healing amount per tick
            healingAura.setData('parentTree', tree);
            tree.setData('healingAura', healingAura);
            
            // Add the healing aura to the environment group
            this.environmentGroup.add(healingAura);
        } else {
            // Create regular tree image
            tree = this.scene.add.image(x, y, treeType);
            
            // Set data for regular tree - provides more wood (2-4)
            tree.setData('woodAmount', { min: 2, max: 4 });
            tree.setData('treeName', 'Oak Tree');
            tree.setData('isHealingSpruce', false);
        }
        
        // Add some randomness to scale (0.8 to 1.2 of original size)
        const scale = 0.8 + Math.random() * 0.4;
        tree.setScale(scale);
        
        // Add slight rotation for variety (-5 to 5 degrees) - only for non-animated trees
        if (treeType !== 'spruce-tree') {
            const rotation = (Math.random() * 10 - 5) * (Math.PI / 180);
            tree.setRotation(rotation);
        }
        
        // Adjust the origin to bottom center so trees "stand" on the ground
        tree.setOrigin(0.5, 1);
        
        // Set random depth within a small range to create layering effect
        tree.setDepth(10 + Math.random() * 5);
        
        // Make the tree interactive
        this.makeTreeInteractive(tree as Phaser.GameObjects.Image);
        
        // Add to environment group
        this.environmentGroup.add(tree);
        
        // Only add fruits to healing spruce trees (spruce-tree type)
        if (treeType === 'spruce-tree') {
            // 80% chance to add fruits to the healing spruce
            if (Math.random() < 0.8) {
                this.addFruitsToTree(tree as Phaser.GameObjects.Image | Phaser.GameObjects.Sprite);
            }
        }
        
        return tree;
    }
    
    /**
     * Makes a tree interactive with hover and click effects
     * @param tree The tree image or sprite to make interactive
     */
    private makeTreeInteractive(tree: Phaser.GameObjects.Image | Phaser.GameObjects.Sprite): void {
        tree.setInteractive({ useHandCursor: true });
        
        // Store original scale for hover effect
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
        
        // Click effect - slight shake
        tree.on('pointerdown', () => {
            // Small shake effect
            this.scene.tweens.add({
                targets: tree,
                x: tree.x + 2,
                y: tree.y - 2,
                duration: 50,
                yoyo: true,
                repeat: 3,
                ease: 'Sine.easeInOut',
                onComplete: () => {
                    // Emit a custom event for game logic to handle
                    this.scene.events.emit('tree-interact', tree);
                    
                    // Add a visual flourish - falling leaves particle effect
                    this.createLeafParticles(tree.x, tree.y - tree.height * 0.6);
                }
            });
        });
    }
    
    /**
     * Creates a leaf particle effect at the specified position
     * @param x X coordinate
     * @param y Y coordinate
     */
    private createLeafParticles(x: number, y: number): void {
        // Create a temporary visual effect for tree interaction
        const numParticles = 10;
        
        // Simple alternative: Create small leaves as images
        for (let i = 0; i < numParticles; i++) {
            // Create a small green rectangle representing a leaf
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
            
            // Random starting velocity
            const vx = (Math.random() - 0.5) * 60;
            const vy = -30 - Math.random() * 50;
            
            // Animate the leaf falling
            this.scene.tweens.add({
                targets: leaf,
                x: leaf.x + vx * 2,
                y: leaf.y + 100,
                angle: Math.random() * 360,
                alpha: 0,
                duration: 1000 + Math.random() * 1000,
                ease: 'Sine.easeIn',
                onComplete: () => {
                    leaf.destroy();
                }
            });
        }
    }
    
    /**
     * Adds a tree at a specific position
     * @param x X coordinate
     * @param y Y coordinate
     * @param treeType Type of tree ('tree' or 'spruce-tree')
     */
    addTree(x: number, y: number, treeType: string = 'tree'): Phaser.GameObjects.Image {
        return this.addTreeWithVariation(x, y, treeType) as Phaser.GameObjects.Image;
    }
    
    /**
     * Gets all environment objects
     */
    getEnvironmentGroup(): Phaser.GameObjects.Group {
        return this.environmentGroup;
    }
    
    /**
     * Clears all environment objects
     */
    clearEnvironment(): void {
        this.environmentGroup.clear(true, true);
    }
    
    /**
     * Adds random trees within a circular area
     * @param count Number of trees to add
     * @param centerX Center X of circle
     * @param centerY Center Y of circle
     * @param radius Radius of circle
     */
    addTreesInCircle(count: number, centerX: number, centerY: number, radius: number): void {
        // Determine number of trees to add (between 3 and specified count, maximum 12)
        const treesToAdd = Phaser.Math.Between(3, Math.min(12, count));
        
        console.log(`Adding ${treesToAdd} trees within circle`);
        
        // Track positions to avoid overlap
        const treePositions: {x: number, y: number, radius: number}[] = [];
        const minDistanceBetweenTrees = 30; // Minimum distance between tree centers
        
        // Attempt to place trees
        let attempts = 0;
        const maxAttempts = 100; // Avoid infinite loop
        let treesPlaced = 0;
        
        while (treesPlaced < treesToAdd && attempts < maxAttempts) {
            // Random angle and distance within circle
            const angle = Math.random() * Math.PI * 2;
            // Use square root for distance to ensure even distribution
            const distance = Math.sqrt(Math.random()) * radius;
            
            // Calculate position
            const x = centerX + Math.cos(angle) * distance;
            const y = centerY + Math.sin(angle) * distance;
            
            // Check if position is too close to existing trees
            let tooClose = false;
            for (const pos of treePositions) {
                const dx = pos.x - x;
                const dy = pos.y - y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < minDistanceBetweenTrees) {
                    tooClose = true;
                    break;
                }
            }
            
            if (!tooClose) {
                // Randomly choose between tree types
                const treeType = Math.random() > 0.5 ? 'tree' : 'spruce-tree';
                
                // Add the tree
                this.addTreeWithVariation(x, y, treeType);
                
                // Record position
                treePositions.push({
                    x,
                    y,
                    radius: minDistanceBetweenTrees / 2
                });
                
                treesPlaced++;
            }
            
            attempts++;
        }
        
        console.log(`Placed ${treesPlaced} trees after ${attempts} attempts`);
    }
    
    /**
     * Add fruits to a tree
     * @param tree The tree to add fruits to
     */
    private addFruitsToTree(tree: Phaser.GameObjects.Image | Phaser.GameObjects.Sprite): void {
        // Determine the number of fruits (1-3)
        const fruitCount = Math.floor(Math.random() * 3) + 1;
        
        // Get tree dimensions
        const treeWidth = tree.displayWidth;
        const treeHeight = tree.displayHeight;
        
        // Check if this is a healing spruce tree
        const isHealingSpruce = tree.getData('treeName') === 'Healing Spruce';
        
        // Select a random fruit type for this tree
        const fruitTypes = [
            { frame: 0, type: FruitType.APPLE },    // Apple
            { frame: 1, type: FruitType.ORANGE },   // Orange
            { frame: 3, type: FruitType.CHERRY }    // Cherry
        ];
        
        // For healing spruce, prefer apples and cherries which will have healing properties
        let selectedFruit;
        if (isHealingSpruce) {
            // 70% chance for healing fruits (apple or cherry)
            if (Math.random() < 0.7) {
                // Choose between apple and cherry
                selectedFruit = Math.random() < 0.5 ? 
                    fruitTypes[0] : // Apple
                    fruitTypes[2];  // Cherry
            } else {
                // 30% chance for orange
                selectedFruit = fruitTypes[1]; // Orange
            }
        } else {
            // Regular tree - random fruit
            selectedFruit = fruitTypes[Math.floor(Math.random() * fruitTypes.length)];
        }
        
        // Create fruits and add them to the tree
        for (let i = 0; i < fruitCount; i++) {
            // Position the fruit within the top 2/3 of the tree
            const offsetX = (Math.random() - 0.5) * treeWidth * 0.6;
            const offsetY = -treeHeight * (0.3 + Math.random() * 0.4); // Top 2/3 of the tree
            
            // Create the fruit sprite
            const fruit = this.scene.add.sprite(
                tree.x + offsetX,
                tree.y + offsetY,
                'fruits',
                selectedFruit.frame
            );
            
            // Scale the fruit (smaller than its original size)
            fruit.setScale(0.8 + Math.random() * 0.4);
            
            // Set the fruit's depth to be slightly in front of the tree
            fruit.setDepth(tree.depth + 1);
            
            // Store the fruit type on the fruit object for reference
            fruit.setData('fruitType', selectedFruit.type);
            fruit.setData('fruitFrame', selectedFruit.frame);
            
            // Add healing properties to fruits from healing spruce
            if (isHealingSpruce) {
                // Healing power depends on the fruit type
                let healingPower = 0;
                
                if (selectedFruit.type === FruitType.APPLE) {
                    healingPower = 10; // Apples heal 10 HP
                } else if (selectedFruit.type === FruitType.CHERRY) {
                    healingPower = 5;  // Cherries heal 5 HP
                } else if (selectedFruit.type === FruitType.ORANGE) {
                    healingPower = 8;  // Oranges heal 8 HP
                }
                
                fruit.setData('healingPower', healingPower);
                fruit.setData('fromHealingSpruce', true);
                
                // Add a subtle glow effect to healing fruits
                const glowColor = 0x88ff88; // Soft green glow
                const glowAlpha = 0.3;
                
                // Create a glow circle behind the fruit
                const glow = this.scene.add.circle(0, 0, fruit.width * 0.7, glowColor, glowAlpha);
                glow.setDepth(fruit.depth - 0.1);
                
                // Make the glow follow the fruit
                fruit.setData('glowEffect', glow);
                
                // Update glow position when fruit moves
                this.scene.events.on('update', () => {
                    if (glow && fruit && fruit.active) {
                        glow.setPosition(fruit.x, fruit.y);
                    } else if (glow && glow.active) {
                        glow.destroy();
                    }
                });
            }
            
            // Make the fruit interactive
            this.makeFruitInteractive(fruit, tree);
            
            // Add a gentle sway animation to the fruit
            this.scene.tweens.add({
                targets: fruit,
                x: fruit.x + (Math.random() - 0.5) * 3,
                duration: 2000 + Math.random() * 1000,
                ease: 'Sine.easeInOut',
                yoyo: true,
                repeat: -1
            });
            
            // Add to environment group
            this.environmentGroup.add(fruit);
        }
    }
    
    /**
     * Makes a fruit interactive with hover and click effects
     * @param fruit The fruit sprite to make interactive
     * @param tree The tree the fruit belongs to
     */
    private makeFruitInteractive(fruit: Phaser.GameObjects.Sprite, tree: Phaser.GameObjects.Image | Phaser.GameObjects.Sprite): void {
        fruit.setInteractive({ useHandCursor: true });
        
        // Store original scale for hover effect
        const originalScale = fruit.scale;
        
        // Hover effects
        fruit.on('pointerover', () => {
            this.scene.tweens.add({
                targets: fruit,
                scaleX: originalScale * 1.2,
                scaleY: originalScale * 1.2,
                duration: 200,
                ease: 'Sine.easeOut'
            });
        });
        
        fruit.on('pointerout', () => {
            this.scene.tweens.add({
                targets: fruit,
                scaleX: originalScale,
                scaleY: originalScale,
                duration: 200,
                ease: 'Sine.easeOut'
            });
        });
        
        // Click effect - collect the fruit
        fruit.on('pointerdown', () => {
            // Emit a custom event for game logic to handle
            this.scene.events.emit('fruit-collect', fruit);
            
            // Create collection animation
            this.createFruitCollectAnimation(fruit);
            
            // Remove the fruit from the scene
            fruit.destroy();
        });
    }
    
    /**
     * Creates an animation for fruit collection
     * @param fruit The fruit being collected
     */
    private createFruitCollectAnimation(fruit: Phaser.GameObjects.Sprite): void {
        // Create a copy of the fruit for the animation
        const collectAnim = this.scene.add.sprite(fruit.x, fruit.y, 'fruits', fruit.frame.name);
        collectAnim.setScale(fruit.scaleX, fruit.scaleY);
        collectAnim.setDepth(100); // Make sure it's on top
        
        // Play a collection animation
        this.scene.tweens.add({
            targets: collectAnim,
            y: collectAnim.y - 50,
            alpha: 0,
            scale: collectAnim.scaleX * 1.5,
            duration: 500,
            ease: 'Back.easeOut',
            onComplete: () => {
                collectAnim.destroy();
            }
        });
        
        // Create sparkle particles
        for (let i = 0; i < 5; i++) {
            const particle = this.scene.add.circle(
                fruit.x + (Math.random() - 0.5) * 20, 
                fruit.y + (Math.random() - 0.5) * 20, 
                2, 
                0xFFFFFF
            );
            
            this.scene.tweens.add({
                targets: particle,
                alpha: 0,
                scale: { from: 1, to: 2 },
                duration: 300 + Math.random() * 400,
                onComplete: () => {
                    particle.destroy();
                }
            });
        }
    }
    
    /**
     * Get all healing auras in the environment
     * @returns Array of healing aura game objects
     */
    getHealingAuras(): Phaser.GameObjects.GameObject[] {
        // Filter the environment group to find all healing auras
        return this.environmentGroup.getChildren().filter(obj => {
            return obj instanceof Phaser.GameObjects.Arc && obj.getData('healingPower') !== undefined;
        });
    }
}
