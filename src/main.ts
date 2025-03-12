import { Boot } from './scenes/Boot';
import { Game as MainGame } from './scenes/Game';
import { GameOver } from './scenes/GameOver';
import { MainMenu } from './scenes/MainMenu';
import { Preloader } from './scenes/Preloader';
import { MenuScene } from './scenes/MenuScene';
// import { InventoryScene } from './scenes/InventoryScene'; // Removed - now using MedievalInventory component
import { CharacterScene } from './scenes/CharacterScene';
import { EquipmentDemoScene } from './scenes/EquipmentDemo';
import { SkillsScene } from './scenes/SkillsScene';
import { LoggerDemoScene } from './examples/LoggerDemo';

import { Game } from "phaser";
import type { Types } from "phaser";

// Import CSS
import './styles/position-test.css';

//  Find out more information about the Game Config at:
//  https://newdocs.phaser.io/docs/3.70.0/Phaser.Types.Core.GameConfig
const config: Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: 1024,
    height: 768,
    parent: 'game-container',
    transparent: true,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: [
        Boot,
        Preloader,
        MainMenu,
        MainGame,
        GameOver,
        MenuScene,
        CharacterScene,
        EquipmentDemoScene,
        SkillsScene,
        LoggerDemoScene
    ],
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0, x: 0 },
            debug: false
        }
    }
};

export default new Game(config);
