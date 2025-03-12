# Position Testing System

This system provides tools for testing and calibrating the player position against map coordinates. It helps ensure accurate positioning between the game world and the map.

## Features

- Real-time visualization of calculated vs. expected player positions
- Distance and accuracy measurements
- Position calibration tools
- Statistical analysis of position accuracy
- Calibration reports
- Reference flag placement for testing

## Components

The position testing system consists of several components:

1. **PositionTestSystem**: Core system for testing player position against map position
2. **CoordinateCalibrator**: Utility for calibrating and improving coordinate calculations
3. **PositionTestUI**: User interface for controlling the position testing system
4. **PositionTestIntegration**: Integration class to add position testing to a game scene

## Usage

### Keyboard Shortcuts

- **Shift+P**: Toggle position test UI
- **Shift+T**: Start/stop position testing
- **Shift+F**: Place reference flag at current position

### UI Controls

The position test UI provides the following controls:

- **Start Testing**: Begin position testing
- **Stop Testing**: Stop position testing
- **Place Flag**: Place a reference flag at the current player position
- **Clear Results**: Clear all test results
- **Add Calibration Point**: Add the current position as a calibration point
- **Apply Calibration**: Apply calibration to improve coordinate calculations
- **Clear Calibration**: Clear all calibration data
- **Generate Report**: Generate a calibration report

### Player Menu

The position testing system can also be accessed from the player context menu.

## How It Works

The system works by comparing the calculated player position (from game world coordinates) with the expected position (from the navigation circle). It measures the distance between these positions and calculates an accuracy score.

### Calibration

The calibration system collects points with known game world and map coordinates. It then calculates transformation parameters (scale, offset, rotation) to improve the coordinate calculations.

### Visualization

The system visualizes the test results on the map with markers and lines:

- **Red marker**: Calculated position
- **Blue marker**: Expected position
- **Colored line**: Distance between positions (color indicates accuracy)

## Integration

To add the position testing system to a game scene:

```typescript
// In your game scene
import { PositionTestIntegration } from '../systems/PositionTestIntegration';

// Initialize the position testing system
this.positionTestIntegration = PositionTestIntegration.addToScene(this);
```

## Calibration Report

The calibration report provides statistics about the position accuracy:

- Total tests
- Average distance
- Average accuracy
- Min/max distance
- Standard deviation
- Calibration quality
- Recommendations for improvement

## Customization

The position testing system can be customized by modifying the following parameters:

- Test frequency
- Accuracy thresholds
- Visualization styles
- UI appearance

## Dependencies

- Phaser
- Leaflet 