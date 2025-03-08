import { Scene } from 'phaser';
import type { GameObjects } from 'phaser';
import { InventorySystem } from '../systems/Inventory';
import { MedievalInventory } from '../ui/MedievalInventory';
import { BaseItem, ItemRarity, ItemType } from '../systems/Item';
import type { IItem } from '../systems/Item';
import { MedievalMenuIntegration } from '../ui/MedievalMenuIntegration';
import { MedievalSkillTree } from '../ui/MedievalSkillTree';
import { SKILL_DATA } from '../systems/skills/SkillData';
import type { Skill } from '../systems/skills/SkillTypes';
import { SkillCategory } from '../systems/skills/SkillTypes';

export class MainMenu extends Scene
{
    background: GameObjects.Image;
    logo: GameObjects.Image;
    title: GameObjects.Text;
    
    // Add inventory system and UI
    private inventory: InventorySystem;
    private inventoryUI: MedievalInventory;
    private gameMenu: MedievalMenuIntegration;
    public skillTree: MedievalSkillTree;

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



        // Start Game Button
        gameButton.on('pointerdown', () => {
            this.scene.start('Game');
        });
        
    }
}
