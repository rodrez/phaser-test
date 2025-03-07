import { Scene } from 'phaser';
import { ArmorType, WeaponType } from './Item';

/**
 * Interface for equipment visual data
 */
export interface EquipmentVisualData {
    key: string;
    frameWidth: number;
    frameHeight: number;
    frames?: number;
    animationFrameRate?: number;
    assetPath?: string; // Custom asset path if different from the default pattern
}

/**
 * System for managing equipment visuals and animations
 */
export class EquipmentSystem {
    private scene: Scene;
    
    // Maps to store equipment visual data
    private weaponVisuals: Map<string, EquipmentVisualData> = new Map();
    private armorVisuals: Map<string, EquipmentVisualData> = new Map();
    
    constructor(scene: Scene) {
        this.scene = scene;
        this.registerEquipmentVisuals();
    }
    
    /**
     * Preloads all equipment assets
     * Call this from the scene's preload method
     */
    preloadEquipmentAssets(): void {
        // Load weapon sprites
        this.weaponVisuals.forEach((data, key) => {
            const assetPath = data.assetPath || `assets/${key}.png`;
            
            if (data.frames && data.frames > 1) {
                // Spritesheet for animated equipment
                this.scene.load.spritesheet(key, assetPath, {
                    frameWidth: data.frameWidth,
                    frameHeight: data.frameHeight
                });
            } else {
                // Single image for static equipment
                this.scene.load.image(key, assetPath);
            }
        });
        
        // Load armor sprites
        this.armorVisuals.forEach((data, key) => {
            const assetPath = data.assetPath || `assets/${key}.png`;
            
            if (data.frames && data.frames > 1) {
                // Spritesheet for animated equipment
                this.scene.load.spritesheet(key, assetPath, {
                    frameWidth: data.frameWidth,
                    frameHeight: data.frameHeight
                });
            } else {
                // Single image for static equipment
                this.scene.load.image(key, assetPath);
            }
        });
        
        // Load placeholder for missing equipment
        this.scene.load.image('equipment_placeholder', 'assets/placeholder.png');
    }
    
    /**
     * Creates animations for equipment
     * Call this after assets are loaded
     */
    createEquipmentAnimations(): void {
        // Create weapon animations
        this.weaponVisuals.forEach((data, key) => {
            if (data.frames && data.frames > 1) {
                this.scene.anims.create({
                    key: `${key}_idle`,
                    frames: this.scene.anims.generateFrameNumbers(key, { start: 0, end: data.frames - 1 }),
                    frameRate: data.animationFrameRate || 8,
                    repeat: -1
                });
                
                // Add attack animation if it's a weapon
                this.scene.anims.create({
                    key: `${key}_attack`,
                    frames: this.scene.anims.generateFrameNumbers(key, { start: 0, end: data.frames - 1 }),
                    frameRate: (data.animationFrameRate || 8) * 1.5, // Faster for attack
                    repeat: 0
                });
            }
        });
        
        // Create armor animations if needed
        this.armorVisuals.forEach((data, key) => {
            if (data.frames && data.frames > 1) {
                this.scene.anims.create({
                    key: `${key}_idle`,
                    frames: this.scene.anims.generateFrameNumbers(key, { start: 0, end: data.frames - 1 }),
                    frameRate: data.animationFrameRate || 8,
                    repeat: -1
                });
            }
        });
    }
    
    /**
     * Registers all equipment visual data
     * This defines what equipment is available and how it looks
     */
    private registerEquipmentVisuals(): void {
        // Register weapon visuals using existing assets
        this.registerWeaponVisual('weapon_sword_basic', {
            key: 'weapon_sword_basic',
            frameWidth: 32,
            frameHeight: 32,
            assetPath: 'assets/sword.png'
        });
        
        // Register armor visuals using existing assets
        this.registerArmorVisual('armor_chest_basic', {
            key: 'armor_chest_basic',
            frameWidth: 32,
            frameHeight: 32,
            assetPath: 'assets/breast_plate.png'
        });
        
        // Register additional equipment as needed
        this.registerWeaponVisual('weapon_axe_basic', {
            key: 'weapon_axe_basic',
            frameWidth: 32,
            frameHeight: 32,
            assetPath: 'assets/placeholder.png' // Fallback to placeholder until we have an axe asset
        });
        
        this.registerArmorVisual('armor_helmet_basic', {
            key: 'armor_helmet_basic',
            frameWidth: 24,
            frameHeight: 24,
            assetPath: 'assets/placeholder.png' // Fallback to placeholder until we have a helmet asset
        });
        
        this.registerArmorVisual('armor_shield_basic', {
            key: 'armor_shield_basic',
            frameWidth: 24,
            frameHeight: 32,
            assetPath: 'assets/placeholder.png' // Fallback to placeholder until we have a shield asset
        });
    }
    
    /**
     * Registers a weapon visual
     */
    registerWeaponVisual(id: string, data: EquipmentVisualData): void {
        this.weaponVisuals.set(id, data);
    }
    
    /**
     * Registers an armor visual
     */
    registerArmorVisual(id: string, data: EquipmentVisualData): void {
        this.armorVisuals.set(id, data);
    }
    
    /**
     * Gets the texture key for a weapon
     */
    getWeaponTextureKey(weaponType: WeaponType, itemId: string): string {
        const key = `weapon_${weaponType}_${itemId}`;
        
        // Check if we have this specific weapon registered
        if (this.weaponVisuals.has(key)) {
            return key;
        }
        
        // Try a generic weapon of this type
        const genericKey = `weapon_${weaponType}_basic`;
        if (this.weaponVisuals.has(genericKey)) {
            return genericKey;
        }
        
        // Fallback to placeholder
        return 'equipment_placeholder';
    }
    
    /**
     * Gets the texture key for armor
     */
    getArmorTextureKey(armorType: ArmorType, itemId: string): string {
        const key = `armor_${armorType}_${itemId}`;
        
        // Check if we have this specific armor registered
        if (this.armorVisuals.has(key)) {
            return key;
        }
        
        // Try a generic armor of this type
        const genericKey = `armor_${armorType}_basic`;
        if (this.armorVisuals.has(genericKey)) {
            return genericKey;
        }
        
        // Fallback to placeholder
        return 'equipment_placeholder';
    }
    
    /**
     * Plays the appropriate animation for equipment
     */
    playEquipmentAnimation(sprite: Phaser.GameObjects.Sprite, textureKey: string, action: 'idle' | 'attack' = 'idle'): void {
        const animKey = `${textureKey}_${action}`;
        
        // Check if this animation exists
        if (this.scene.anims.exists(animKey)) {
            sprite.play(animKey, true);
        } else if (action === 'attack' && this.scene.anims.exists(`${textureKey}_idle`)) {
            // Fallback to idle animation if attack doesn't exist
            sprite.play(`${textureKey}_idle`, true);
        }
    }
} 