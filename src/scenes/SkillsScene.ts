import { Scene } from 'phaser';
import type { GameObjects } from 'phaser';

export class SkillsScene extends Scene {
    private background: GameObjects.Rectangle;
    private title: GameObjects.Text;
    private closeButton: GameObjects.Text;
    
    constructor() {
        super({ key: 'SkillsScene' });
    }
    
    create(): void {
        // Create a semi-transparent background
        this.background = this.add.rectangle(
            0, 0, 
            this.cameras.main.width, this.cameras.main.height, 
            0x000000, 0.7
        ).setOrigin(0);
        
        // Add title
        this.title = this.add.text(
            this.cameras.main.centerX, 
            100, 
            'Skills', 
            { 
                fontFamily: 'Arial Black', 
                fontSize: '32px', 
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 6
            }
        ).setOrigin(0.5);
        
        // Add close button
        this.closeButton = this.add.text(
            this.cameras.main.width - 20, 
            20, 
            'X', 
            { 
                fontFamily: 'Arial Black', 
                fontSize: '24px', 
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 4
            }
        ).setOrigin(1, 0)
        .setInteractive({ useHandCursor: true });
        
        this.closeButton.on('pointerdown', () => {
            this.scene.stop();
        });
        
        // Add placeholder text
        this.add.text(
            this.cameras.main.centerX, 
            this.cameras.main.centerY, 
            'Skills system coming soon!', 
            { 
                fontFamily: 'Arial', 
                fontSize: '24px', 
                color: '#ffffff' 
            }
        ).setOrigin(0.5);
        
        // Make this scene sit on top of the game scene
        this.scene.bringToTop();
    }
} 