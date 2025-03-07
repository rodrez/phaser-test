import 'phaser';
import { MedievalSkillTreeExample } from './MedievalSkillTreeExample';

// Configure the game
const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    scene: [MedievalSkillTreeExample],
    backgroundColor: '#2a1a0a'
};

// Create the game instance
const game = new Phaser.Game(config);

// Export the game instance for debugging
// Using declaration merging to add game property to Window interface
declare global {
    interface Window {
        game: Phaser.Game;
    }
}

window.game = game; 