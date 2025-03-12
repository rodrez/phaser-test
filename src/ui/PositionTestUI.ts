import { Scene } from 'phaser';
import { PositionTestSystem } from '../systems/PositionTestSystem';
import { CoordinateCalibrator } from '../systems/CoordinateCalibrator';

/**
 * UI component for controlling the position testing system
 */
export class PositionTestUI {
    private scene: Scene;
    private positionTestSystem: PositionTestSystem;
    private coordinateCalibrator: CoordinateCalibrator;
    
    // UI elements
    private container: HTMLElement;
    private isVisible: boolean = false;
    
    constructor(scene: Scene, positionTestSystem: PositionTestSystem, coordinateCalibrator: CoordinateCalibrator) {
        this.scene = scene;
        this.positionTestSystem = positionTestSystem;
        this.coordinateCalibrator = coordinateCalibrator;
        
        // Create UI container
        this.createUIContainer();
    }
    
    /**
     * Create the UI container and elements
     */
    private createUIContainer(): void {
        // Create container
        this.container = document.createElement('div');
        this.container.id = 'position-test-ui';
        this.container.className = 'position-test-ui';
        this.container.style.position = 'absolute';
        this.container.style.top = '10px';
        this.container.style.right = '10px';
        this.container.style.width = '250px';
        this.container.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        this.container.style.color = 'white';
        this.container.style.padding = '10px';
        this.container.style.borderRadius = '5px';
        this.container.style.fontFamily = 'Arial, sans-serif';
        this.container.style.fontSize = '14px';
        this.container.style.zIndex = '1000';
        this.container.style.display = 'none'; // Initially hidden
        
        // Create title
        const title = document.createElement('h3');
        title.textContent = 'Position Test Controls';
        title.style.margin = '0 0 10px 0';
        title.style.textAlign = 'center';
        this.container.appendChild(title);
        
        // Create buttons
        this.addButton('Start Testing', () => this.positionTestSystem.startTesting());
        this.addButton('Stop Testing', () => this.positionTestSystem.stopTesting());
        this.addButton('Place Flag', () => this.positionTestSystem.placeReferenceFlag());
        this.addButton('Clear Results', () => this.positionTestSystem.clearTestResults());
        this.addButton('Add Calibration Point', () => this.addCurrentPositionAsCalibrationPoint());
        this.addButton('Apply Calibration', () => this.coordinateCalibrator.applyCalibrationToMapSystem());
        this.addButton('Clear Calibration', () => this.coordinateCalibrator.clearCalibration());
        this.addButton('Generate Report', () => this.showCalibrationReport());
        
        // Add toggle button
        const toggleButton = document.createElement('button');
        toggleButton.textContent = 'Toggle Position Test UI';
        toggleButton.style.position = 'absolute';
        toggleButton.style.top = '10px';
        toggleButton.style.right = '10px';
        toggleButton.style.zIndex = '1001';
        toggleButton.style.padding = '5px 10px';
        toggleButton.style.backgroundColor = '#444';
        toggleButton.style.color = 'white';
        toggleButton.style.border = 'none';
        toggleButton.style.borderRadius = '3px';
        toggleButton.style.cursor = 'pointer';
        toggleButton.onclick = () => this.toggleVisibility();
        
        // Add to document
        document.body.appendChild(this.container);
        document.body.appendChild(toggleButton);
    }
    
    /**
     * Add a button to the UI container
     */
    private addButton(text: string, onClick: () => void): HTMLButtonElement {
        const button = document.createElement('button');
        button.textContent = text;
        button.style.display = 'block';
        button.style.width = '100%';
        button.style.padding = '8px';
        button.style.margin = '5px 0';
        button.style.backgroundColor = '#555';
        button.style.color = 'white';
        button.style.border = 'none';
        button.style.borderRadius = '3px';
        button.style.cursor = 'pointer';
        button.onclick = onClick;
        
        this.container.appendChild(button);
        return button;
    }
    
    /**
     * Toggle UI visibility
     */
    public toggleVisibility(): void {
        this.isVisible = !this.isVisible;
        this.container.style.display = this.isVisible ? 'block' : 'none';
    }
    
    /**
     * Add the current player position as a calibration point
     */
    private addCurrentPositionAsCalibrationPoint(): void {
        // Get player sprite position
        const player = (this.scene as any).playerSystem?.getPlayerSprite();
        if (!player) {
            console.error('Player not found');
            return;
        }
        
        const playerX = player.x;
        const playerY = player.y;
        
        // Get the navigation circle position (expected position)
        const mapSystem = (this.scene as any).mapSystem;
        if (!mapSystem) {
            console.error('Map system not found');
            return;
        }
        
        const navCircleInfo = mapSystem.getNavigationCircleInfo();
        if (!navCircleInfo) {
            console.error('Navigation circle info not available');
            return;
        }
        
        // Add calibration point
        this.coordinateCalibrator.addCalibrationPoint(
            playerX,
            playerY,
            navCircleInfo.lat,
            navCircleInfo.lon
        );
        
        // Show confirmation
        this.showNotification(`Added calibration point at [${navCircleInfo.lat.toFixed(6)}, ${navCircleInfo.lon.toFixed(6)}]`);
    }
    
    /**
     * Show a notification message
     */
    private showNotification(message: string): void {
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.style.position = 'absolute';
        notification.style.bottom = '20px';
        notification.style.left = '50%';
        notification.style.transform = 'translateX(-50%)';
        notification.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        notification.style.color = 'white';
        notification.style.padding = '10px 20px';
        notification.style.borderRadius = '5px';
        notification.style.zIndex = '2000';
        
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 3000);
    }
    
    /**
     * Show calibration report
     */
    private showCalibrationReport(): void {
        // Get calibration status
        const calibrationStatus = this.coordinateCalibrator.getCalibrationStatus();
        
        // Get test statistics
        const report = this.positionTestSystem.generateCalibrationReport();
        
        // Create modal for the report
        const modal = document.createElement('div');
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.width = '100%';
        modal.style.height = '100%';
        modal.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        modal.style.display = 'flex';
        modal.style.justifyContent = 'center';
        modal.style.alignItems = 'center';
        modal.style.zIndex = '2000';
        
        // Create report container
        const reportContainer = document.createElement('div');
        reportContainer.style.backgroundColor = '#222';
        reportContainer.style.color = 'white';
        reportContainer.style.padding = '20px';
        reportContainer.style.borderRadius = '5px';
        reportContainer.style.maxWidth = '600px';
        reportContainer.style.maxHeight = '80%';
        reportContainer.style.overflow = 'auto';
        
        // Add title
        const title = document.createElement('h2');
        title.textContent = 'Position Calibration Report';
        title.style.marginTop = '0';
        reportContainer.appendChild(title);
        
        // Add calibration status
        const statusTitle = document.createElement('h3');
        statusTitle.textContent = 'Calibration Status';
        reportContainer.appendChild(statusTitle);
        
        const statusInfo = document.createElement('pre');
        statusInfo.textContent = `Points: ${calibrationStatus.pointsCount}
Calibrated: ${calibrationStatus.isCalibrated ? 'Yes' : 'No'}
Scale X: ${calibrationStatus.parameters.scaleX.toFixed(6)}
Scale Y: ${calibrationStatus.parameters.scaleY.toFixed(6)}
Offset X: ${calibrationStatus.parameters.offsetX.toFixed(6)}
Offset Y: ${calibrationStatus.parameters.offsetY.toFixed(6)}
Rotation: ${calibrationStatus.parameters.rotationDegrees.toFixed(2)}°`;
        statusInfo.style.backgroundColor = '#333';
        statusInfo.style.padding = '10px';
        statusInfo.style.borderRadius = '3px';
        reportContainer.appendChild(statusInfo);
        
        // Add test report
        const reportTitle = document.createElement('h3');
        reportTitle.textContent = 'Test Results';
        reportContainer.appendChild(reportTitle);
        
        const reportText = document.createElement('pre');
        reportText.textContent = report;
        reportText.style.backgroundColor = '#333';
        reportText.style.padding = '10px';
        reportText.style.borderRadius = '3px';
        reportText.style.whiteSpace = 'pre-wrap';
        reportContainer.appendChild(reportText);
        
        // Add close button
        const closeButton = document.createElement('button');
        closeButton.textContent = 'Close';
        closeButton.style.display = 'block';
        closeButton.style.margin = '20px auto 0';
        closeButton.style.padding = '8px 20px';
        closeButton.style.backgroundColor = '#555';
        closeButton.style.color = 'white';
        closeButton.style.border = 'none';
        closeButton.style.borderRadius = '3px';
        closeButton.style.cursor = 'pointer';
        closeButton.onclick = () => document.body.removeChild(modal);
        reportContainer.appendChild(closeButton);
        
        // Add to modal and display
        modal.appendChild(reportContainer);
        document.body.appendChild(modal);
    }
    
    /**
     * Clean up resources
     */
    public destroy(): void {
        // Remove UI elements
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
        
        // Remove toggle button
        const toggleButton = document.querySelector('button[textContent="Toggle Position Test UI"]');
        if (toggleButton && toggleButton.parentNode) {
            toggleButton.parentNode.removeChild(toggleButton);
        }
    }
} 