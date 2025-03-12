import { Scene } from 'phaser';
import { MapSystem } from './Map';

/**
 * A utility class to calibrate and improve coordinate calculations
 * between the game world and map coordinates
 */
export class CoordinateCalibrator {
    private scene: Scene;
    private mapSystem: MapSystem;
    
    // Calibration data
    private calibrationPoints: CalibrationPoint[] = [];
    private calibrationMatrix: number[] | null = null;
    
    // Default calibration parameters
    private scaleFactorX: number = 1.0;
    private scaleFactorY: number = 1.0;
    private offsetX: number = 0;
    private offsetY: number = 0;
    private rotationAngle: number = 0;
    
    constructor(scene: Scene, mapSystem: MapSystem) {
        this.scene = scene;
        this.mapSystem = mapSystem;
    }
    
    /**
     * Add a calibration point with known game world and map coordinates
     */
    public addCalibrationPoint(
        gameX: number, 
        gameY: number, 
        mapLat: number, 
        mapLon: number
    ): void {
        this.calibrationPoints.push({
            gameX,
            gameY,
            mapLat,
            mapLon,
            timestamp: Date.now()
        });
        
        // Recalculate calibration matrix if we have enough points
        if (this.calibrationPoints.length >= 3) {
            this.calculateCalibrationMatrix();
        }
    }
    
    /**
     * Calculate the calibration matrix based on collected points
     * This uses a least squares approach to find the best transformation
     */
    private calculateCalibrationMatrix(): void {
        if (this.calibrationPoints.length < 3) {
            console.warn('Need at least 3 calibration points to calculate matrix');
            return;
        }
        
        try {
            // Use the most recent points (up to 10)
            const points = this.calibrationPoints
                .sort((a, b) => b.timestamp - a.timestamp)
                .slice(0, 10);
            
            // Extract coordinates
            const gameCoords = points.map(p => [p.gameX, p.gameY]);
            const mapCoords = points.map(p => [p.mapLat, p.mapLon]);
            
            // Calculate average values for normalization
            const avgGameX = gameCoords.reduce((sum, p) => sum + p[0], 0) / gameCoords.length;
            const avgGameY = gameCoords.reduce((sum, p) => sum + p[1], 0) / gameCoords.length;
            const avgMapLat = mapCoords.reduce((sum, p) => sum + p[0], 0) / mapCoords.length;
            const avgMapLon = mapCoords.reduce((sum, p) => sum + p[1], 0) / mapCoords.length;
            
            // Calculate scale factors
            const gameXRange = Math.max(...gameCoords.map(p => p[0])) - Math.min(...gameCoords.map(p => p[0]));
            const gameYRange = Math.max(...gameCoords.map(p => p[1])) - Math.min(...gameCoords.map(p => p[1]));
            const mapLatRange = Math.max(...mapCoords.map(p => p[0])) - Math.min(...mapCoords.map(p => p[0]));
            const mapLonRange = Math.max(...mapCoords.map(p => p[1])) - Math.min(...mapCoords.map(p => p[1]));
            
            // Calculate basic transformation parameters
            this.scaleFactorX = mapLonRange / gameXRange;
            this.scaleFactorY = mapLatRange / gameYRange;
            this.offsetX = avgMapLon - (avgGameX * this.scaleFactorX);
            this.offsetY = avgMapLat - (avgGameY * this.scaleFactorY);
            
            // Calculate rotation if we have enough points
            if (points.length >= 4) {
                // This is a simplified approach - a full affine transformation would be more accurate
                // but requires more complex matrix operations
                const dx1 = gameCoords[1][0] - gameCoords[0][0];
                const dy1 = gameCoords[1][1] - gameCoords[0][1];
                const dx2 = mapCoords[1][0] - mapCoords[0][0];
                const dy2 = mapCoords[1][1] - mapCoords[0][1];
                
                const angle1 = Math.atan2(dy1, dx1);
                const angle2 = Math.atan2(dy2, dx2);
                this.rotationAngle = angle2 - angle1;
            }
            
            console.log('Calibration parameters calculated:', {
                scaleX: this.scaleFactorX,
                scaleY: this.scaleFactorY,
                offsetX: this.offsetX,
                offsetY: this.offsetY,
                rotation: this.rotationAngle * (180 / Math.PI) // in degrees
            });
        } catch (error) {
            console.error('Error calculating calibration matrix:', error);
        }
    }
    
    /**
     * Convert game world coordinates to map coordinates using calibration
     */
    public gameToMapCoordinates(gameX: number, gameY: number): { lat: number, lon: number } {
        // If we don't have calibration data, use the default method
        if (this.calibrationPoints.length < 3) {
            const result = this.mapSystem.getExactPlayerPosition(gameX, gameY);
            if (result) return result;
            
            // Fallback to a simple calculation
            return this.simpleGameToMapCoordinates(gameX, gameY);
        }
        
        // Apply rotation if needed
        let rotatedX = gameX;
        let rotatedY = gameY;
        
        if (this.rotationAngle !== 0) {
            const cos = Math.cos(this.rotationAngle);
            const sin = Math.sin(this.rotationAngle);
            rotatedX = gameX * cos - gameY * sin;
            rotatedY = gameX * sin + gameY * cos;
        }
        
        // Apply scale and offset
        const lon = rotatedX * this.scaleFactorX + this.offsetX;
        const lat = rotatedY * this.scaleFactorY + this.offsetY;
        
        return { lat, lon };
    }
    
    /**
     * Simple conversion from game to map coordinates
     * Used as a fallback when calibration data is not available
     */
    private simpleGameToMapCoordinates(gameX: number, gameY: number): { lat: number, lon: number } {
        // Get the center of the map as reference
        const center = this.mapSystem.getNavigationCircleInfo();
        if (!center) {
            return { lat: 0, lon: 0 }; // Default fallback
        }
        
        // Get screen dimensions
        const screenWidth = this.scene.scale.width;
        const screenHeight = this.scene.scale.height;
        
        // Calculate offset from screen center
        const offsetX = gameX - (screenWidth / 2);
        const offsetY = gameY - (screenHeight / 2);
        
        // Get current map bounds to calculate scale
        const map = this.mapSystem.leafletMap;
        if (!map) {
            return { lat: center.lat, lon: center.lon };
        }
        
        const bounds = map.getBounds();
        const northEast = bounds.getNorthEast();
        const southWest = bounds.getSouthWest();
        
        // Calculate degrees per pixel
        const degreesPerPixelX = (northEast.lng - southWest.lng) / screenWidth;
        const degreesPerPixelY = (northEast.lat - southWest.lat) / screenHeight;
        
        // Apply offset to center coordinates
        const lon = center.lon + (offsetX * degreesPerPixelX);
        const lat = center.lat - (offsetY * degreesPerPixelY); // Negative because Y increases downward in screen space
        
        return { lat, lon };
    }
    
    /**
     * Convert map coordinates to game world coordinates
     */
    public mapToGameCoordinates(lat: number, lon: number): { x: number, y: number } {
        // If we don't have calibration data, use the default method
        if (this.calibrationPoints.length < 3) {
            const result = this.mapSystem.geoToScreenCoordinates(lat, lon);
            if (result) return result;
            
            // Fallback to a simple calculation
            return this.simpleMapToGameCoordinates(lat, lon);
        }
        
        // Inverse of the game to map transformation
        // First remove offset
        const x = (lon - this.offsetX) / this.scaleFactorX;
        const y = (lat - this.offsetY) / this.scaleFactorY;
        
        // Apply inverse rotation if needed
        if (this.rotationAngle !== 0) {
            const cos = Math.cos(-this.rotationAngle);
            const sin = Math.sin(-this.rotationAngle);
            return {
                x: x * cos - y * sin,
                y: x * sin + y * cos
            };
        }
        
        return { x, y };
    }
    
    /**
     * Simple conversion from map to game coordinates
     * Used as a fallback when calibration data is not available
     */
    private simpleMapToGameCoordinates(lat: number, lon: number): { x: number, y: number } {
        // Get the center of the map as reference
        const center = this.mapSystem.getNavigationCircleInfo();
        if (!center) {
            return { x: 0, y: 0 }; // Default fallback
        }
        
        // Get screen dimensions
        const screenWidth = this.scene.scale.width;
        const screenHeight = this.scene.scale.height;
        
        // Get current map bounds to calculate scale
        const map = this.mapSystem.leafletMap;
        if (!map) {
            return { x: screenWidth / 2, y: screenHeight / 2 };
        }
        
        const bounds = map.getBounds();
        const northEast = bounds.getNorthEast();
        const southWest = bounds.getSouthWest();
        
        // Calculate pixels per degree
        const pixelsPerDegreeX = screenWidth / (northEast.lng - southWest.lng);
        const pixelsPerDegreeY = screenHeight / (northEast.lat - southWest.lat);
        
        // Calculate offset from center in degrees
        const offsetLon = lon - center.lon;
        const offsetLat = lat - center.lat;
        
        // Convert to pixels and apply to screen center
        const x = (screenWidth / 2) + (offsetLon * pixelsPerDegreeX);
        const y = (screenHeight / 2) - (offsetLat * pixelsPerDegreeY); // Negative because Y increases downward in screen space
        
        return { x, y };
    }
    
    /**
     * Apply calibration to improve the MapSystem's coordinate calculations
     */
    public applyCalibrationToMapSystem(): void {
        // This method would patch or enhance the MapSystem's coordinate calculation methods
        // In a real implementation, you might modify the MapSystem class directly
        // or use a proxy pattern to intercept and improve its calculations
        
        console.log('Applying calibration to MapSystem');
        
        // For demonstration purposes, we'll just log the calibration parameters
        if (this.calibrationPoints.length >= 3) {
            console.log('Current calibration parameters:', {
                scaleX: this.scaleFactorX,
                scaleY: this.scaleFactorY,
                offsetX: this.offsetX,
                offsetY: this.offsetY,
                rotation: this.rotationAngle * (180 / Math.PI) // in degrees
            });
        } else {
            console.warn('Not enough calibration points to apply calibration');
        }
    }
    
    /**
     * Clear all calibration data
     */
    public clearCalibration(): void {
        this.calibrationPoints = [];
        this.calibrationMatrix = null;
        this.scaleFactorX = 1.0;
        this.scaleFactorY = 1.0;
        this.offsetX = 0;
        this.offsetY = 0;
        this.rotationAngle = 0;
        
        console.log('Calibration data cleared');
    }
    
    /**
     * Get the current calibration status
     */
    public getCalibrationStatus(): CalibrationStatus {
        return {
            pointsCount: this.calibrationPoints.length,
            isCalibrated: this.calibrationPoints.length >= 3,
            parameters: {
                scaleX: this.scaleFactorX,
                scaleY: this.scaleFactorY,
                offsetX: this.offsetX,
                offsetY: this.offsetY,
                rotationDegrees: this.rotationAngle * (180 / Math.PI)
            }
        };
    }
}

/**
 * Interface for a calibration point
 */
interface CalibrationPoint {
    gameX: number;
    gameY: number;
    mapLat: number;
    mapLon: number;
    timestamp: number;
}

/**
 * Interface for calibration status
 */
interface CalibrationStatus {
    pointsCount: number;
    isCalibrated: boolean;
    parameters: {
        scaleX: number;
        scaleY: number;
        offsetX: number;
        offsetY: number;
        rotationDegrees: number;
    };
} 