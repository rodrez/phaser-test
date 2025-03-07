import { Scene } from 'phaser';
import { TreeSystem } from './TreeSystem';
import { FruitSystem } from './FruitSystem';
import { PopupSystem } from '../PopupSystem';

/**
 * Main environment system that coordinates all environment-related subsystems
 */
export class Environment {
    private scene: Scene;
    private environmentGroup: Phaser.GameObjects.Group;
    private treeSystem: TreeSystem;
    private fruitSystem: FruitSystem;
    private popupSystem?: PopupSystem;
    
    constructor(scene: Scene) {
        this.scene = scene;
        this.environmentGroup = this.scene.add.group();
        
        // Initialize subsystems
        this.treeSystem = new TreeSystem(scene, this.environmentGroup);
        this.fruitSystem = new FruitSystem(scene, this.environmentGroup);
        
        // Setup interactions between systems
        this.setupSystemInteractions();
    }
    
    /**
     * Set the popup system reference
     */
    setPopupSystem(popupSystem: PopupSystem): void {
        this.popupSystem = popupSystem;
        
        // Pass popup system to subsystems
        this.treeSystem.setPopupSystem(popupSystem);
        this.fruitSystem.setPopupSystem(popupSystem);
    }
    
    /**
     * Setup interactions between different environment systems
     */
    private setupSystemInteractions(): void {
        // Listen for tree destruction to handle attached fruits
        this.scene.events.on('tree-destroyed', (tree: Phaser.GameObjects.GameObject) => {
            this.fruitSystem.handleTreeDestruction(tree);
        });
    }
    
    /**
     * Generate environment elements within a circular area
     * @param centerX Center X of circle
     * @param centerY Center Y of circle
     * @param radius Radius of circle
     */
    generateEnvironment(centerX: number, centerY: number, radius: number): void {
        // Clear any existing environment objects
        this.clearEnvironment();
        
        // Add trees within the navigation circle
        this.treeSystem.addTreesInCircle(12, centerX, centerY, radius * 0.8);
        
        // Add fruits to healing spruce trees
        const trees = this.environmentGroup.getChildren().filter(obj => 
            (obj instanceof Phaser.GameObjects.Sprite || obj instanceof Phaser.GameObjects.Image) && 
            obj.getData('isHealingSpruce') === true
        );
        
        // Add fruits to each healing spruce tree
        trees.forEach(tree => {
            this.fruitSystem.addFruitsToTree(tree as Phaser.GameObjects.Sprite);
        });
    }
    
    /**
     * Get all healing auras in the environment
     */
    getHealingAuras(): Phaser.GameObjects.GameObject[] {
        return this.treeSystem.getHealingAuras();
    }
    
    /**
     * Clear all environment objects
     */
    clearEnvironment(): void {
        this.environmentGroup.clear(true, true);
    }
    
    /**
     * Get the environment group containing all environment objects
     */
    getEnvironmentGroup(): Phaser.GameObjects.Group {
        return this.environmentGroup;
    }
    
    /**
     * Clean up resources
     */
    destroy(): void {
        this.scene.events.off('tree-destroyed');
        this.clearEnvironment();
        this.treeSystem.destroy();
        this.fruitSystem.destroy();
    }
} 