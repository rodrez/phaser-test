# Popup Style Guide

This document provides guidelines for creating consistent popups throughout the application.

## Overview

All popups should use the standardized styles defined in `PopupSystem.ts`. This ensures a consistent look and feel across the application, making it easier for users to understand and interact with different types of popups.

## Basic Structure

A standard popup should follow this HTML structure:

```html
<div class="popup-content">
    <h3>Title Goes Here</h3>
    <div class="popup-stats">
        <div class="stat-row">
            <span class="stat-label">Label:</span>
            <span class="stat-value">Value</span>
        </div>
        <!-- More stat rows as needed -->
    </div>
    <div class="popup-actions">
        <button class="popup-action-btn primary-btn" id="action-id">Primary Action</button>
        <button class="popup-action-btn secondary-btn" id="another-action-id">Secondary Action</button>
    </div>
</div>
```

## CSS Classes

### Container Classes

- `popup-container`: Base class for the popup container
- `custom-popup`: Applied automatically by the PopupSystem
- `custom-popup-close`: Applied to the close button

### Content Classes

- `popup-content`: Wrapper for all popup content
- `popup-content.detailed`: For detailed/expanded views

### Heading Elements

- `h3`: Main popup title (centered, gold color)
- `h4`: Section headings within the popup

### Data Display

- `popup-stats`: Container for data/statistics
- `stat-row`: A row containing a label and value
- `stat-label`: Label for a data point (left-aligned, gray)
- `stat-value`: Value for a data point (right-aligned, white)
- `stat-section`: A grouped section of related stats with a background

### Action Buttons

- `popup-actions`: Container for action buttons
- `popup-action-btn`: Base class for all action buttons
- Button types:
  - `primary-btn`: Blue - for main/positive actions
  - `secondary-btn`: Gray - for neutral/alternative actions
  - `danger-btn`: Red - for destructive actions
  - `info-btn`: Teal - for informational actions

### Tables

For tabular data, use the `data-table` class:

```html
<table class="data-table">
    <thead>
        <tr>
            <th>Column 1</th>
            <th>Column 2</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>Data 1</td>
            <td>Data 2</td>
        </tr>
    </tbody>
</table>
```

### Progress Bars

For visual indicators:

```html
<div class="progress-bar">
    <div class="progress-fill health" style="width: 75%"></div>
</div>
```

Available progress fill types:
- `health`: Green
- `danger`: Red
- `warning`: Orange
- `mana`: Blue
- `xp`: Purple

## Usage Example

Here's how to create a popup using the PopupSystem:

```typescript
const content: PopupContent = {
    html: `
        <div class="popup-content">
            <h3>Item Details</h3>
            <div class="popup-stats">
                <div class="stat-row">
                    <span class="stat-label">Name:</span>
                    <span class="stat-value">Magic Sword</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">Damage:</span>
                    <span class="stat-value">10-15</span>
                </div>
            </div>
            <div class="popup-actions">
                <button class="popup-action-btn primary-btn" id="equip-btn">Equip</button>
                <button class="popup-action-btn danger-btn" id="drop-btn">Drop</button>
            </div>
        </div>
    `,
    buttons: [
        {
            selector: '#equip-btn',
            onClick: () => equipItem(item)
        },
        {
            selector: '#drop-btn',
            onClick: () => dropItem(item)
        }
    ]
};

const options: PopupOptions = {
    className: 'popup-container item-popup',
    closeButton: true,
    width: 280,
    offset: { x: 10, y: 10 },
    zIndex: 1000
};

this.popupSystem.createPopupAtScreenPosition(x, y, content, options);
```

## Backward Compatibility

The system maintains backward compatibility with existing popup implementations:
- Monster popups
- Flag popups

However, new popup implementations should use the standardized classes. 