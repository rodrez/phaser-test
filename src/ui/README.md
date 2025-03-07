# ScrollableContainer for Phaser 3

A reusable scrollable container component for Phaser 3 games that provides an easy way to create scrollable content areas.

## Features

- Scrollable content with mouse wheel and drag support
- Custom styling options for background and scroll elements
- Optional scrollbar that automatically sizes based on content
- Up/down scroll buttons
- Mask that properly clips content
- Fluid, physics-based scrolling behavior

## Usage

### Basic Example

```typescript
import { ScrollableContainer } from './ui/ScrollableContainer';

// Create a scrollable container
const scrollableContainer = new ScrollableContainer(this, {
    x: 400,
    y: 300,
    width: 400,
    height: 400,
    background: {
        color: 0x382613,
        alpha: 0.8,
        strokeWidth: 2,
        strokeColor: 0xb89d65
    },
    padding: 20,
    scrollbarEnabled: true
});

// Add game objects to the container
const text = this.add.text(0, 0, 'Scrollable content goes here', { 
    color: '#ffffff' 
});
scrollableContainer.add(text);

// Add more content
for (let i = 0; i < 10; i++) {
    const item = this.add.text(0, 50 + (i * 30), `Item ${i}`, { 
        color: '#ffffff' 
    });
    scrollableContainer.add(item);
}
```

### Configuration Options

The `ScrollableContainer` constructor accepts the following configuration options:

```typescript
interface ScrollableContainerConfig {
    x: number;             // X position of the container
    y: number;             // Y position of the container
    width: number;         // Width of the container
    height: number;        // Height of the container
    background?: {         // Optional background styling
        color: number;     // Background color (hex)
        alpha?: number;    // Background alpha (0-1)
        strokeWidth?: number; // Border width
        strokeColor?: number; // Border color (hex)
    };
    scrollbarEnabled?: boolean; // Whether to show a scrollbar (default: true)
    padding?: number;      // Additional padding at the bottom of content (default: 0)
    mask?: boolean;        // Whether to apply a mask (default: true)
}
```

### Available Methods

#### `add(gameObjects)`
Add game objects to the scrollable content area.

```typescript
// Add a single object
scrollableContainer.add(myText);

// Add multiple objects
scrollableContainer.add([myText, myImage, myRectangle]);
```

#### `remove(gameObjects)`
Remove game objects from the scrollable content.

```typescript
scrollableContainer.remove(myText);
```

#### `clear()`
Remove all content from the container.

```typescript
scrollableContainer.clear();
```

#### `scroll(amount)`
Programmatically scroll the content by a specified amount.

```typescript
// Scroll up by 50 pixels
scrollableContainer.scroll(-50);

// Scroll down by 50 pixels
scrollableContainer.scroll(50);
```

#### `getContainer()`
Get the main Phaser container that holds everything.

```typescript
const container = scrollableContainer.getContainer();
```

#### `getContentContainer()`
Get the inner container that holds the scrollable content.

```typescript
const contentContainer = scrollableContainer.getContentContainer();
```

#### `setVisible(visible)`
Show or hide the entire scrollable container.

```typescript
// Hide the container
scrollableContainer.setVisible(false);

// Show the container
scrollableContainer.setVisible(true);
```

#### `destroy()`
Clean up and destroy the container when no longer needed.

```typescript
scrollableContainer.destroy();
```

## Implementation Notes

- The scrollable container uses Phaser's GeometryMask to clip content that exceeds the container's bounds
- Content is added to an inner container that moves up and down when scrolling
- The scrollbar thumb size is proportional to the amount of visible content
- Mouse wheel events are captured only when the pointer is over the container

## Troubleshooting

If you encounter any issues with the scrollable container:

1. Make sure game objects are added using the `add()` method rather than directly to the container
2. Check that the container dimensions are appropriate for your content
3. Ensure proper positioning of content within the scrollable area (centered on x=0)
4. If content isn't visible, check that the mask is working correctly