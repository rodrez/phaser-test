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
                        <button class="action-btn info-btn">Examine</button>
                        <button class="action-btn danger-btn">Chop</button>
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
     * Examine a tree
     */
    private examineTree(tree: Phaser.GameObjects.Image | Phaser.GameObjects.Sprite): void {
        const treeName = tree.getData('treeName') || 'Tree';
        const messages = [
            `You found a ${treeName}!`,
            `A majestic ${treeName} stands before you.`,
            `This ${treeName} looks healthy.`,
            `Birds are nesting in this ${treeName}.`
        ];
        
        const message = messages[Math.floor(Math.random() * messages.length)];
        
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
     * Chop down a tree
     */
    private chopTree(tree: Phaser.GameObjects.Image | Phaser.GameObjects.Sprite): void {
        // Create wood particles effect
        this.createWoodChipParticles(tree.x, tree.y);
        
        // Get wood amount
        const woodAmountData = tree.getData('woodAmount') || { min: 1, max: 3 };
        const woodAmount = Phaser.Math.Between(woodAmountData.min, woodAmountData.max);
        
        // Emit wood gathered event
        this.scene.events.emit('wood-gathered', woodAmount);
        
        // Create stump
        this.createTreeStump(tree);
        
        // Emit tree destroyed event
        this.scene.events.emit('tree-destroyed', tree);
        
        // Make the tree disappear
        this.scene.tweens.add({
            targets: tree,
            y: tree.y + 20,
            alpha: 0,
            angle: tree.angle + Phaser.Math.Between(-15, 15),
            duration: 800,
            ease: 'Quad.easeIn',
            onComplete: () => tree.destroy()
        });
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
     * Create a tree stump
     */
    private createTreeStump(tree: Phaser.GameObjects.Image | Phaser.GameObjects.Sprite): void {
        const stump = this.scene.add.graphics();
        stump.fillStyle(0x8B4513, 1);
        stump.fillCircle(tree.x, tree.y, 10);
        stump.fillStyle(0x654321, 1);
        stump.fillCircle(tree.x, tree.y, 6);
        stump.fillStyle(0x8B4513, 1);
        stump.fillCircle(tree.x, tree.y, 3);
        
        stump.setDepth(tree.depth - 1);
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
} 