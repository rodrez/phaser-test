import { Scene } from 'phaser';
import { PositionTestSystem } from './PositionTestSystem';
import { CoordinateCalibrator } from './CoordinateCalibrator';
import { PositionTestUI } from '../ui/PositionTestUI';
import { MapSystem } from './Map';
import { PlayerSystem } from './Player';
import { FlagSystem } from './flags/FlagSystem';

/**
 * Integration class to add position testing functionality to a game scene
 */
export class PositionTestIntegration {
    private scene: Scene;
    private positionTestSystem: PositionTestSystem;
    private coordinateCalibrator: CoordinateCalibrator;
    private positionTestUI: PositionTestUI;
    
    constructor(scene: Scene) {
        this.scene = scene;
        
        // Get required systems from the scene
        const mapSystem = (scene as any).mapSystem as MapSystem;
        const playerSystem = (scene as any).playerSystem as PlayerSystem;
        const flagSystem = (scene as any).flagSystem as FlagSystem;
        
        if (!mapSystem || !playerSystem || !flagSystem) {
            console.error('Required systems not found in scene. Position testing cannot be initialized.');
            return;
        }
        
        // Initialize the position test system
        this.positionTestSystem = new PositionTestSystem(scene, mapSystem, playerSystem, flagSystem);
        
        // Initialize the coordinate calibrator
        this.coordinateCalibrator = new CoordinateCalibrator(scene, mapSystem);
        
        // Initialize the UI
        this.positionTestUI = new PositionTestUI(scene, this.positionTestSystem, this.coordinateCalibrator);
        
        // Add CSS styles for debug visualization
        this.positionTestSystem.addDebugStyles();
        
        console.log('Position testing integration initialized');
    }
    
    /**
     * Initialize the position testing system
     * This method can be called after construction to set up the system
     */
    public initialize(): void {
        // Set up keyboard shortcuts
        this.setupKeyboardShortcuts();
        
        console.log('Position testing system initialized');
    }
    
    /**
     * Add keyboard shortcuts for position testing
     */
    public setupKeyboardShortcuts(): void {
        // Add keyboard shortcuts if the scene has keyboard input
        const keyboard = this.scene.input.keyboard;
        if (!keyboard) return;
        
        // Toggle position test UI with Shift+P
        keyboard.on('keydown-P', (event: KeyboardEvent) => {
            if (event.shiftKey) {
                this.positionTestUI.toggleVisibility();
            }
        });
        
        // Start/stop testing with Shift+T
        keyboard.on('keydown-T', (event: KeyboardEvent) => {
            if (event.shiftKey) {
                if ((this.positionTestSystem as any).isTestingActive) {
                    this.positionTestSystem.stopTesting();
                } else {
                    this.positionTestSystem.startTesting();
                }
            }
        });
        
        // Place flag with Shift+F
        keyboard.on('keydown-F', (event: KeyboardEvent) => {
            if (event.shiftKey) {
                this.positionTestSystem.placeReferenceFlag();
            }
        });
        
        console.log('Position testing keyboard shortcuts set up');
    }
    
    /**
     * Add position testing to the game scene
     * @param scene The game scene to add position testing to
     */
    public static addToScene(scene: Scene): PositionTestIntegration {
        // Create the integration
        const integration = new PositionTestIntegration(scene);
        
        // Set up keyboard shortcuts
        integration.setupKeyboardShortcuts();
        
        // Store the integration in the scene for reference
        (scene as any).positionTestIntegration = integration;
        
        return integration;
    }
    
    /**
     * Clean up resources
     */
    public destroy(): void {
        // Clean up the position test system
        this.positionTestSystem.destroy();
        
        // Clean up the UI
        this.positionTestUI.destroy();
    }
} 