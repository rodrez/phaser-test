import { Scene, GameObjects } from 'phaser';

export class MainMenu extends Scene
{
    background: GameObjects.Image;
    logo: GameObjects.Image;
    title: GameObjects.Text;

    constructor ()
    {
        super('MainMenu');
    }

    create ()
    {
        this.background = this.add.image(512, 384, 'background');

        this.logo = this.add.image(512, 300, 'logo');

        this.title = this.add.text(512, 460, 'Main Menu', {
            fontFamily: 'Arial Black', fontSize: 38, color: '#ffffff',
            stroke: '#000000', strokeThickness: 8,
            align: 'center'
        }).setOrigin(0.5);

        // Add button to start the game
        const gameButton = this.add.text(512, 520, 'Start Game', {
            fontFamily: 'Arial Black', fontSize: 26, color: '#ffffff',
            stroke: '#000000', strokeThickness: 6,
            align: 'center'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        // Add button to open the menu scene
        const menuButton = this.add.text(512, 580, 'Open Menu', {
            fontFamily: 'Arial Black', fontSize: 26, color: '#ffffff',
            stroke: '#000000', strokeThickness: 6,
            align: 'center'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        // Add button to start the Medieval Vitals Example
        const vitalsButton = this.add.text(512, 640, 'Medieval Vitals UI', {
            fontFamily: 'Arial Black', fontSize: 26, color: '#ffffff',
            stroke: '#000000', strokeThickness: 6,
            align: 'center'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        // Add hover effects
        gameButton.on('pointerover', () => gameButton.setTint(0xffff00));
        gameButton.on('pointerout', () => gameButton.clearTint());
        menuButton.on('pointerover', () => menuButton.setTint(0xffff00));
        menuButton.on('pointerout', () => menuButton.clearTint());
        vitalsButton.on('pointerover', () => vitalsButton.setTint(0xffff00));
        vitalsButton.on('pointerout', () => vitalsButton.clearTint());

        // Add click handlers
        gameButton.on('pointerdown', () => this.scene.start('Game'));
        menuButton.on('pointerdown', () => this.scene.start('MenuScene'));
        vitalsButton.on('pointerdown', () => this.scene.start('MedievalVitalsExample'));
    }
}
