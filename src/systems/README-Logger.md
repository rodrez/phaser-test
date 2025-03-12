# Logger System

A flexible logging system that allows toggling different categories of logs. This helps with debugging specific systems while keeping the console clean from other logs.

## Features

- **Categorized Logging**: Organize logs by system (Player, Combat, Inventory, etc.)
- **Log Levels**: Support for DEBUG, INFO, WARN, and ERROR levels
- **Toggleable Categories**: Enable/disable specific categories of logs
- **Colored Output**: Color-coded logs for better readability
- **Persistent Configuration**: Settings are saved to localStorage
- **UI Panel**: Built-in UI panel for controlling logger settings
- **Additional Data**: Support for logging additional structured data

## Usage

### Basic Usage

```typescript
import { logger, LogCategory } from './systems/Logger';

// Log messages with different levels
logger.debug(LogCategory.PLAYER, 'Debug message');
logger.info(LogCategory.COMBAT, 'Info message');
logger.warn(LogCategory.INVENTORY, 'Warning message');
logger.error(LogCategory.MAP, 'Error message');

// Log with additional data
logger.info(LogCategory.PLAYER, 'Player moved', { 
    position: { x: 100, y: 200 },
    speed: 5
});
```

### Adding the Logger Panel

```typescript
import { loggerPanel } from './systems/LoggerPanel';

// Show the logger panel
loggerPanel.show();

// Hide the logger panel
loggerPanel.hide();

// Toggle the logger panel
loggerPanel.toggle();
```

### Controlling Logger Settings Programmatically

```typescript
import { logger, LogCategory, LogLevel } from './systems/Logger';

// Enable/disable the entire logging system
logger.setEnabled(true);

// Set the minimum log level
logger.setLevel(LogLevel.INFO);

// Enable/disable a specific category
logger.setCategory(LogCategory.PLAYER, true);
logger.setCategory(LogCategory.COMBAT, false);

// Enable/disable all categories
logger.enableAllCategories();
logger.disableAllCategories();

// Check if a category is enabled
const isPlayerEnabled = logger.isCategoryEnabled(LogCategory.PLAYER);

// Get all categories and their status
const categories = logger.getCategories();
```

## Demo

A demo scene is included to showcase the logger system. You can access it by adding the `LoggerDemoScene` to your game's scenes:

```typescript
import { LoggerDemoScene } from './examples/LoggerDemo';

// Add to your game config
const config = {
    // ...
    scene: [
        // ...
        LoggerDemoScene
    ]
};
```

Then navigate to the scene with:

```typescript
this.scene.start('LoggerDemo');
```

## Adding Logging to Existing Systems

To add logging to an existing system:

1. Import the logger and LogCategory:
   ```typescript
   import { logger, LogCategory } from './systems/Logger';
   ```

2. Add log statements to key methods:
   ```typescript
   methodName() {
       logger.debug(LogCategory.PLAYER, 'Method called');
       
       // Your existing code...
       
       logger.info(LogCategory.PLAYER, 'Operation completed', { result });
   }
   ```

3. Use appropriate log levels:
   - `debug`: Detailed information for debugging
   - `info`: General information about system operation
   - `warn`: Warning conditions that don't cause errors
   - `error`: Error conditions that affect functionality

## Extending the Logger

### Adding New Categories

To add new categories, update the `LogCategory` enum in `Logger.ts`:

```typescript
export enum LogCategory {
    // Existing categories...
    NEW_CATEGORY = 'new-category',
}
```

Then add a color for the new category in the `categoryColors` object:

```typescript
private readonly categoryColors: { [key in LogCategory]?: string } = {
    // Existing colors...
    [LogCategory.NEW_CATEGORY]: '#abcdef',
};
```

## Best Practices

1. **Use Appropriate Categories**: Choose the most specific category for your logs
2. **Use Appropriate Levels**: Use DEBUG for detailed debugging, INFO for general information, WARN for warnings, and ERROR for errors
3. **Include Context**: Include relevant context in your log messages
4. **Structure Additional Data**: When including additional data, structure it in a way that's easy to read
5. **Don't Over-Log**: Avoid logging too much information, especially in performance-critical code
6. **Toggle Categories**: Use the UI panel to toggle categories on/off as needed during debugging 