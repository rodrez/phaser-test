# ScrollableContainer Troubleshooting Guide

## Common Issues and Solutions

### Content Is Not Visible

If your content is not visible in the ScrollableContainer, try these solutions:

1. **Check Content Positioning**:
   - Content should be positioned relative to the top-left corner of the content container
   - For centered content, use `containerWidth/2` for the x-position
   - Example: `const myText = scene.add.text(containerWidth/2, 20, 'My Text').setOrigin(0.5, 0);`

2. **Verify Content Is Added Correctly**:
   - Always use the `scrollableContainer.add()` method to add content
   - Never add directly to the container's internal containers
   - Check the console for the debug message showing child count

3. **Check Mask Position**:
   - The mask should be aligned with the content container
   - If you suspect mask issues, uncomment the debug line in `createMask()` to make the mask visible

4. **Look for the Debug Rectangle**:
   - A semi-transparent red rectangle shows the container bounds
   - Your content should be positioned within these bounds to be visible

5. **Z-Index Issues**:
   - If content is behind other elements, adjust the order in which objects are added to the scene

### Scrolling Not Working Properly

If scrolling behavior isn't working as expected:

1. **Content Height Detection**:
   - Make sure your content objects have proper dimensions
   - Complex or nested objects might not be detected correctly by the height calculation

2. **Scroll Boundaries**:
   - Scroll boundaries are calculated based on content height
   - If content doesn't scroll far enough, check `getContentHeight()` is returning the correct value
   - Add `console.log(scrollableContainer.getContentHeight())` to debug

3. **Wheel/Drag Sensitivity**:
   - Adjust wheel sensitivity by changing the multiplier in `setupMouseWheel()`
   - Adjust drag sensitivity in the `pointermove` handler

### Visual/Styling Issues

If the container doesn't look right:

1. **Background and Borders**:
   - Make sure your background configuration includes all properties you need
   - Check that colors are in the correct format (hexadecimal)

2. **Scrollbar Visibility**:
   - The scrollbar only appears if content is taller than the container
   - Check scrollbar positioning if it appears in the wrong place

3. **Button Styling**:
   - Scroll buttons can be customized by modifying the `createScrollButtons()` method

## Debugging Tips

1. **Enable Console Logging**:
   - Uncomment debug console.log statements in the code
   - Add your own logging to track container sizes and positions

2. **Visual Debugging**:
   - The red debug rectangle shows container bounds
   - Uncomment the mask graphics display to see the mask
   - Add temporary colored rectangles to check positioning

3. **Check Component Sizes**:
   - Verify your content fits within the container width
   - Make sure text has appropriate wordWrap settings for the container width

## Advanced Customization

If you need to customize the ScrollableContainer beyond its configuration options:

1. **Content Layout**:
   - For complex layouts, create a container for your content first
   - Position elements within that container, then add it to the ScrollableContainer

2. **Custom Scrolling Behavior**:
   - Override the `scroll()` method for custom animation or behavior
   - Create a subclass of ScrollableContainer for extensive modifications 