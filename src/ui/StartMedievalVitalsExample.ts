/**
 * This script provides a way to directly start the MedievalVitalsExample scene
 * for testing purposes.
 * 
 * Usage: Call startMedievalVitalsExample() from the browser console
 */

/**
 * Starts the MedievalVitalsExample scene
 */
export function startMedievalVitalsExample() {
    // Get the Phaser game instance
    const game = (window as any).game;
    
    if (!game) {
        console.error('Phaser game instance not found. Make sure the game is initialized.');
        return;
    }
    
    // Stop all currently running scenes
    game.scene.scenes.forEach((scene: Phaser.Scene) => {
        if (scene.scene.isActive()) {
            scene.scene.stop();
        }
    });
    
    // Start the MedievalVitalsExample scene
    game.scene.start('MedievalVitalsExample');
    
    console.log('MedievalVitalsExample scene started!');
}

// Add the function to the window object for easy access from the console
(window as any).startMedievalVitalsExample = startMedievalVitalsExample; 