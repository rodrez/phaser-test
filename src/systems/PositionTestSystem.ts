import { Scene } from 'phaser';
import { MapSystem } from './Map';
import { PlayerSystem } from './Player';
import { FlagSystem } from './flags/FlagSystem';
import * as L from 'leaflet';

/**
 * A system for testing and validating player position against map coordinates
 * This helps ensure accurate positioning between the game world and map
 */
export class PositionTestSystem {
    private scene: Scene;
    private mapSystem: MapSystem;
    private playerSystem: PlayerSystem;
    private flagSystem: FlagSystem;
    
    // Debug visualization elements
    private debugMarkers: L.Marker[] = [];
    private debugLines: L.Polyline[] = [];
    private debugOverlay: Phaser.GameObjects.Container | null = null;
    private debugText: Phaser.GameObjects.Text | null = null;
    
    // Test results storage
    private positionTests: PositionTest[] = [];
    private isTestingActive: boolean = false;
    private testInterval: number = 0;
    private testFrequency: number = 1000; // ms between tests
    
    // Custom pane for debug elements
    private readonly DEBUG_PANE_NAME = 'positionTestPane';
    private readonly DEBUG_PANE_Z_INDEX = 650;
    
    constructor(scene: Scene, mapSystem: MapSystem, playerSystem: PlayerSystem, flagSystem: FlagSystem) {
        this.scene = scene;
        this.mapSystem = mapSystem;
        this.playerSystem = playerSystem;
        this.flagSystem = flagSystem;
        
        // Initialize the debug overlay
        this.createDebugOverlay();
        
        // Create custom pane for debug elements if map is available
        if (this.mapSystem.leafletMap) {
            this.createCustomPane();
        }
    }
    
    /**
     * Create a custom pane for debug visualization elements
     */
    private createCustomPane(): void {
        if (!this.mapSystem.leafletMap) return;
        
        // Create a custom pane for debug elements with high z-index
        this.mapSystem.leafletMap.createPane(this.DEBUG_PANE_NAME);
        const pane = this.mapSystem.leafletMap.getPane(this.DEBUG_PANE_NAME);
        if (pane) {
            pane.style.zIndex = this.DEBUG_PANE_Z_INDEX.toString();
        }
    }
    
    /**
     * Create the debug overlay for displaying position information
     */
    private createDebugOverlay(): void {
        // Create a container for debug information
        this.debugOverlay = this.scene.add.container(10, 10);
        
        // Add a semi-transparent background
        const background = this.scene.add.rectangle(0, 0, 300, 150, 0x000000, 0.7);
        background.setOrigin(0, 0);
        this.debugOverlay.add(background);
        
        // Add text for displaying position information
        this.debugText = this.scene.add.text(10, 10, 'Position Test: Inactive', {
            fontSize: '14px',
            color: '#ffffff',
            fontFamily: 'Arial'
        });
        this.debugText.setOrigin(0, 0);
        this.debugOverlay.add(this.debugText);
        
        // Initially hide the overlay
        this.debugOverlay.setVisible(false);
        
        // Make sure it stays on top and doesn't move with the camera
        this.debugOverlay.setDepth(1000);
        this.debugOverlay.setScrollFactor(0);
    }
    
    /**
     * Start position testing
     */
    public startTesting(): void {
        if (this.isTestingActive) return;
        
        this.isTestingActive = true;
        this.clearTestResults();
        
        // Show the debug overlay
        if (this.debugOverlay) {
            this.debugOverlay.setVisible(true);
        }
        
        // Start periodic testing
        this.testInterval = window.setInterval(() => {
            this.performPositionTest();
        }, this.testFrequency);
        
        console.log('Position testing started');
    }
    
    /**
     * Stop position testing
     */
    public stopTesting(): void {
        if (!this.isTestingActive) return;
        
        this.isTestingActive = false;
        
        // Clear the test interval
        if (this.testInterval) {
            window.clearInterval(this.testInterval);
            this.testInterval = 0;
        }
        
        // Hide the debug overlay
        if (this.debugOverlay) {
            this.debugOverlay.setVisible(false);
        }
        
        console.log('Position testing stopped');
    }
    
    /**
     * Perform a single position test
     */
    public performPositionTest(): void {
        if (!this.mapSystem.leafletMap) return;
        
        // Get player sprite position in game world
        const player = this.playerSystem.getPlayerSprite();
        const playerX = player.x;
        const playerY = player.y;
        
        // Get the calculated map position
        const calculatedPosition = this.mapSystem.getExactPlayerPosition(playerX, playerY);
        if (!calculatedPosition) return;
        
        // Get the navigation circle position (expected position)
        const navCircleInfo = this.mapSystem.getNavigationCircleInfo();
        if (!navCircleInfo) return;
        
        // Calculate the distance between expected and calculated positions
        const distance = this.calculateDistance(
            calculatedPosition.lat, calculatedPosition.lon,
            navCircleInfo.lat, navCircleInfo.lon
        );
        
        // Create a test result
        const test: PositionTest = {
            timestamp: Date.now(),
            playerX,
            playerY,
            calculatedLat: calculatedPosition.lat,
            calculatedLon: calculatedPosition.lon,
            expectedLat: navCircleInfo.lat,
            expectedLon: navCircleInfo.lon,
            distance,
            accuracy: this.calculateAccuracy(distance)
        };
        
        // Store the test result
        this.positionTests.push(test);
        if (this.positionTests.length > 100) {
            // Keep only the last 100 tests
            this.positionTests.shift();
        }
        
        // Visualize the test result
        this.visualizeTest(test);
        
        // Update the debug text
        this.updateDebugText(test);
    }
    
    /**
     * Calculate the distance between two geographic points in meters
     */
    private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
        // Haversine formula to calculate distance between two points on Earth
        const R = 6371e3; // Earth radius in meters
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;
        
        const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ/2) * Math.sin(Δλ/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        
        return R * c; // Distance in meters
    }
    
    /**
     * Calculate accuracy score based on distance (0-100%)
     */
    private calculateAccuracy(distance: number): number {
        // Define thresholds for accuracy
        const perfectThreshold = 1; // meters
        const goodThreshold = 10; // meters
        const maxDistance = 100; // meters
        
        if (distance <= perfectThreshold) {
            return 100; // Perfect accuracy
        } else if (distance <= goodThreshold) {
            // Linear interpolation between perfect and good
            return 90 + (10 * (goodThreshold - distance) / (goodThreshold - perfectThreshold));
        } else if (distance <= maxDistance) {
            // Linear interpolation between good and poor
            return 50 + (40 * (maxDistance - distance) / (maxDistance - goodThreshold));
        } else {
            return Math.max(0, 50 - (distance - maxDistance) / 10); // Poor accuracy
        }
    }
    
    /**
     * Visualize a position test on the map
     */
    private visualizeTest(test: PositionTest): void {
        if (!this.mapSystem.leafletMap) return;
        
        // Clear previous markers
        this.clearDebugVisualizations();
        
        // Create a marker for the calculated position
        const calculatedMarker = L.marker([test.calculatedLat, test.calculatedLon], {
            icon: L.divIcon({
                html: `<div class="position-test-marker calculated"></div>`,
                className: 'position-test-marker-container',
                iconSize: [10, 10]
            }),
            pane: this.DEBUG_PANE_NAME
        }).addTo(this.mapSystem.leafletMap);
        
        // Create a marker for the expected position
        const expectedMarker = L.marker([test.expectedLat, test.expectedLon], {
            icon: L.divIcon({
                html: `<div class="position-test-marker expected"></div>`,
                className: 'position-test-marker-container',
                iconSize: [10, 10]
            }),
            pane: this.DEBUG_PANE_NAME
        }).addTo(this.mapSystem.leafletMap);
        
        // Create a line connecting the two positions
        const line = L.polyline([
            [test.calculatedLat, test.calculatedLon],
            [test.expectedLat, test.expectedLon]
        ], {
            color: this.getAccuracyColor(test.accuracy),
            weight: 2,
            opacity: 0.7,
            pane: this.DEBUG_PANE_NAME
        }).addTo(this.mapSystem.leafletMap);
        
        // Store the debug elements
        this.debugMarkers.push(calculatedMarker, expectedMarker);
        this.debugLines.push(line);
        
        // Add tooltips to markers
        calculatedMarker.bindTooltip(`Calculated: [${test.calculatedLat.toFixed(6)}, ${test.calculatedLon.toFixed(6)}]`);
        expectedMarker.bindTooltip(`Expected: [${test.expectedLat.toFixed(6)}, ${test.expectedLon.toFixed(6)}]`);
        line.bindTooltip(`Distance: ${test.distance.toFixed(2)}m, Accuracy: ${test.accuracy.toFixed(1)}%`);
    }
    
    /**
     * Clear all debug visualizations from the map
     */
    private clearDebugVisualizations(): void {
        if (!this.mapSystem.leafletMap) return;
        
        // Remove all debug markers
        this.debugMarkers.forEach(marker => {
            marker.remove();
        });
        this.debugMarkers = [];
        
        // Remove all debug lines
        this.debugLines.forEach(line => {
            line.remove();
        });
        this.debugLines = [];
    }
    
    /**
     * Update the debug text with the latest test information
     */
    private updateDebugText(test: PositionTest): void {
        if (!this.debugText) return;
        
        // Calculate average accuracy from recent tests
        const recentTests = this.positionTests.slice(-10);
        const avgAccuracy = recentTests.reduce((sum, t) => sum + t.accuracy, 0) / recentTests.length;
        
        // Format the debug text
        const text = [
            `Position Test: Active`,
            `Player: (${test.playerX.toFixed(1)}, ${test.playerY.toFixed(1)})`,
            `Calculated: [${test.calculatedLat.toFixed(6)}, ${test.calculatedLon.toFixed(6)}]`,
            `Expected: [${test.expectedLat.toFixed(6)}, ${test.expectedLon.toFixed(6)}]`,
            `Distance: ${test.distance.toFixed(2)}m`,
            `Accuracy: ${test.accuracy.toFixed(1)}%`,
            `Avg Accuracy: ${avgAccuracy.toFixed(1)}%`,
            `Tests: ${this.positionTests.length}`
        ].join('\n');
        
        this.debugText.setText(text);
        
        // Resize the background to fit the text
        const background = this.debugOverlay?.getAt(0) as Phaser.GameObjects.Rectangle;
        if (background) {
            background.width = this.debugText.width + 20;
            background.height = this.debugText.height + 20;
        }
    }
    
    /**
     * Get a color based on accuracy score
     */
    private getAccuracyColor(accuracy: number): string {
        if (accuracy >= 90) {
            return '#00ff00'; // Green for excellent
        } else if (accuracy >= 70) {
            return '#ffff00'; // Yellow for good
        } else if (accuracy >= 50) {
            return '#ff9900'; // Orange for moderate
        } else {
            return '#ff0000'; // Red for poor
        }
    }
    
    /**
     * Clear all test results
     */
    public clearTestResults(): void {
        this.positionTests = [];
        this.clearDebugVisualizations();
        
        if (this.debugText) {
            this.debugText.setText('Position Test: Active\nNo tests performed yet');
        }
    }
    
    /**
     * Place a flag at the current player position for reference
     */
    public placeReferenceFlag(): string {
        // Get player sprite position
        const player = this.playerSystem.getPlayerSprite();
        const playerX = player.x;
        const playerY = player.y;
        
        // Get the calculated map position
        const position = this.mapSystem.getExactPlayerPosition(playerX, playerY);
        if (!position) return '';
        
        // Create a flag at this position
        return this.flagSystem.createFlagAtPosition(position.lat, position.lon);
    }
    
    /**
     * Get test statistics
     */
    public getTestStatistics(): TestStatistics {
        if (this.positionTests.length === 0) {
            return {
                totalTests: 0,
                averageDistance: 0,
                averageAccuracy: 0,
                maxDistance: 0,
                minDistance: 0,
                standardDeviation: 0
            };
        }
        
        const distances = this.positionTests.map(test => test.distance);
        const accuracies = this.positionTests.map(test => test.accuracy);
        
        const avgDistance = distances.reduce((sum, d) => sum + d, 0) / distances.length;
        const avgAccuracy = accuracies.reduce((sum, a) => sum + a, 0) / accuracies.length;
        const maxDistance = Math.max(...distances);
        const minDistance = Math.min(...distances);
        
        // Calculate standard deviation
        const squaredDiffs = distances.map(d => Math.pow(d - avgDistance, 2));
        const variance = squaredDiffs.reduce((sum, d) => sum + d, 0) / distances.length;
        const stdDev = Math.sqrt(variance);
        
        return {
            totalTests: this.positionTests.length,
            averageDistance: avgDistance,
            averageAccuracy: avgAccuracy,
            maxDistance,
            minDistance,
            standardDeviation: stdDev
        };
    }
    
    /**
     * Generate a calibration report
     */
    public generateCalibrationReport(): string {
        const stats = this.getTestStatistics();
        
        if (stats.totalTests === 0) {
            return 'No position tests have been performed yet.';
        }
        
        return `
Position Calibration Report
==========================
Total tests: ${stats.totalTests}
Average distance: ${stats.averageDistance.toFixed(2)}m
Average accuracy: ${stats.averageAccuracy.toFixed(1)}%
Min distance: ${stats.minDistance.toFixed(2)}m
Max distance: ${stats.maxDistance.toFixed(2)}m
Standard deviation: ${stats.standardDeviation.toFixed(2)}m

Calibration Quality: ${this.getCalibrationQualityDescription(stats)}

Recommendations:
${this.generateRecommendations(stats)}
`;
    }
    
    /**
     * Get a description of calibration quality
     */
    private getCalibrationQualityDescription(stats: TestStatistics): string {
        if (stats.averageAccuracy >= 90) {
            return 'Excellent';
        } else if (stats.averageAccuracy >= 75) {
            return 'Good';
        } else if (stats.averageAccuracy >= 60) {
            return 'Moderate';
        } else if (stats.averageAccuracy >= 40) {
            return 'Poor';
        } else {
            return 'Very Poor';
        }
    }
    
    /**
     * Generate recommendations based on test statistics
     */
    private generateRecommendations(stats: TestStatistics): string {
        const recommendations: string[] = [];
        
        if (stats.averageDistance > 20) {
            recommendations.push('- The coordinate calculation system needs significant improvement.');
        }
        
        if (stats.standardDeviation > 10) {
            recommendations.push('- Position calculations are inconsistent. Check for variable factors affecting calculations.');
        }
        
        if (stats.maxDistance > 50) {
            recommendations.push('- Extreme outliers detected. Review the getExactPlayerPosition method for edge cases.');
        }
        
        if (recommendations.length === 0) {
            if (stats.averageAccuracy >= 90) {
                recommendations.push('- Current calibration is excellent. No changes needed.');
            } else {
                recommendations.push('- Fine-tune the coordinate calculation for better precision.');
            }
        }
        
        return recommendations.join('\n');
    }
    
    /**
     * Add CSS styles for debug visualization
     */
    public addDebugStyles(): void {
        // Create a style element if it doesn't exist
        if (!document.getElementById('position-test-styles')) {
            const style = document.createElement('style');
            style.id = 'position-test-styles';
            style.textContent = `
                .position-test-marker-container {
                    background: transparent;
                }
                .position-test-marker {
                    width: 10px;
                    height: 10px;
                    border-radius: 50%;
                    border: 2px solid white;
                }
                .position-test-marker.calculated {
                    background-color: #ff0000;
                }
                .position-test-marker.expected {
                    background-color: #0000ff;
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    /**
     * Clean up resources
     */
    public destroy(): void {
        // Stop testing
        this.stopTesting();
        
        // Clear visualizations
        this.clearDebugVisualizations();
        
        // Remove the debug overlay
        if (this.debugOverlay) {
            this.debugOverlay.destroy();
            this.debugOverlay = null;
        }
        
        // Remove debug styles
        const styleElement = document.getElementById('position-test-styles');
        if (styleElement) {
            styleElement.remove();
        }
    }
}

/**
 * Interface for position test results
 */
interface PositionTest {
    timestamp: number;
    playerX: number;
    playerY: number;
    calculatedLat: number;
    calculatedLon: number;
    expectedLat: number;
    expectedLon: number;
    distance: number;
    accuracy: number;
}

/**
 * Interface for test statistics
 */
interface TestStatistics {
    totalTests: number;
    averageDistance: number;
    averageAccuracy: number;
    maxDistance: number;
    minDistance: number;
    standardDeviation: number;
} 