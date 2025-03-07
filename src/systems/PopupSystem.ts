import { Scene } from 'phaser';
import { MapSystem } from './Map';

/**
 * Interface for popup options
 */
export interface PopupOptions {
    className?: string;
    closeButton?: boolean;
    offset?: { x: number; y: number };
    width?: number;
    zIndex?: number;
}

/**
 * Interface for popup content
 */
export interface PopupContent {
    html: string;
    buttons?: {
        selector: string;
        onClick: () => void;
    }[];
}

/**
 * PopupSystem - Handles custom popups that are always on top of other elements
 */
export class PopupSystem {
    private scene: Scene;
    private mapSystem: MapSystem;
    private activePopups: HTMLElement[] = [];
    
    constructor(scene: Scene, mapSystem: MapSystem) {
        this.scene = scene;
        this.mapSystem = mapSystem;
        
        // Add global CSS for popups
        this.addGlobalStyles();
    }
    
    /**
     * Add global CSS styles for popups
     */
    private addGlobalStyles(): void {
        const popupStyle = document.createElement('style');
        popupStyle.innerHTML = `
            /* Global styles for custom popups - Medieval RPG Theme */
            .custom-popup {
                position: fixed !important;
                background: #2a1a0a; /* Dark brown background */
                color: #e8d4b9; /* Light parchment text color */
                border-radius: 0; /* Square corners for medieval look */
                border: 3px solid #8b5a2b; /* Brown border */
                box-shadow: 0 5px 15px rgba(0, 0, 0, 0.7);
                overflow: hidden;
                font-family: 'Cinzel', 'Times New Roman', serif; /* Medieval-style font */
                z-index: 1000;
                max-width: 90vw;
                max-height: 80vh;
                overflow-y: auto;
                padding: 20px;
                transition: opacity 0.3s ease;
                background-image: url('data:image/png;base64,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');
            }
            
            .custom-popup-close {
                position: absolute;
                top: 10px;
                right: 10px;
                width: 25px;
                height: 25px;
                background: #8b5a2b; /* Brown background */
                border: 2px solid #c8a165; /* Gold border */
                border-radius: 0; /* Square for medieval look */
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                color: #e8d4b9; /* Light parchment color */
                font-size: 16px;
                font-weight: bold;
                z-index: 1001;
            }
            
            .custom-popup-close:hover {
                background: #a06633; /* Lighter brown on hover */
            }
            
            /* Common popup styles - to be used by all popup types */
            .popup-container {
                min-width: 280px;
            }
            
            .popup-content {
                font-family: 'Cinzel', 'Times New Roman', serif;
            }
            
            .popup-content h3 {
                margin-top: 0;
                margin-bottom: 15px;
                color: #c8a165; /* Gold color for headings */
                text-align: center;
                font-size: 20px;
                text-transform: uppercase;
                letter-spacing: 1px;
                border-bottom: 1px solid #8b5a2b;
                padding-bottom: 10px;
                text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
            }
            
            .popup-content h4 {
                margin: 10px 0;
                color: #c8a165; /* Gold color for headings */
                font-size: 16px;
                text-transform: uppercase;
                letter-spacing: 1px;
            }
            
            .popup-stats {
                margin-bottom: 15px;
            }
            
            .stat-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 8px;
                font-size: 14px;
                border-bottom: 1px dotted #8b5a2b;
                padding-bottom: 5px;
            }
            
            .stat-label {
                font-weight: bold;
                color: #c8a165; /* Gold color */
            }
            
            .stat-value {
                color: #e8d4b9; /* Light parchment color */
            }
            
            .popup-actions {
                display: flex;
                justify-content: space-between;
                gap: 10px;
                margin-top: 15px;
            }
            
            .popup-action-btn {
                flex: 1;
                padding: 8px 10px;
                border: 2px solid #8b5a2b; /* Brown border */
                border-radius: 0; /* Square corners for medieval look */
                cursor: pointer;
                font-weight: bold;
                font-size: 14px;
                font-family: 'Cinzel', 'Times New Roman', serif;
                text-transform: uppercase;
                letter-spacing: 1px;
                transition: all 0.2s ease;
                background-color: #2a1a0a; /* Dark brown background */
            }
            
            .popup-action-btn:hover {
                box-shadow: 0 0 10px #c8a165; /* Gold glow on hover */
            }
            
            .primary-btn {
                background-color: #4a3520; /* Dark brown */
                color: #c8a165; /* Gold text */
                border-color: #c8a165; /* Gold border */
            }
            
            .primary-btn:hover {
                background-color: #5a4530; /* Lighter brown on hover */
            }
            
            .danger-btn {
                background-color: #6b2b2b; /* Dark red */
                color: #e8d4b9; /* Light parchment color */
                border-color: #8b3a3a; /* Red border */
            }
            
            .danger-btn:hover {
                background-color: #7b3a3a; /* Lighter red on hover */
            }
            
            .secondary-btn {
                background-color: #3a3a2b; /* Dark olive */
                color: #e8d4b9; /* Light parchment color */
                border-color: #5a5a3b; /* Olive border */
            }
            
            .secondary-btn:hover {
                background-color: #4a4a3b; /* Lighter olive on hover */
            }
            
            .info-btn, .back-btn {
                background-color: #2b3a4a; /* Dark blue */
                color: #e8d4b9; /* Light parchment color */
                border-color: #3b4a5a; /* Blue border */
            }
            
            .info-btn:hover, .back-btn:hover {
                background-color: #3b4a5a; /* Lighter blue on hover */
                box-shadow: 0 0 10px #c8a165; /* Gold glow on hover */
            }
            
            /* Detailed info styles */
            .popup-content.detailed .popup-stats {
                display: flex;
                flex-direction: column;
                gap: 15px;
            }
            
            .stat-section {
                background-color: rgba(0, 0, 0, 0.2);
                padding: 10px;
                border: 1px solid #8b5a2b; /* Brown border */
                border-radius: 0; /* Square corners for medieval look */
            }
            
            /* Monster popup specific styles - keeping for backward compatibility but updating to match theme */
            .monster-popup-container {
                min-width: 280px;
            }
            
            .monster-popup {
                font-family: 'Cinzel', 'Times New Roman', serif;
            }
            
            .monster-popup h3 {
                margin-top: 0;
                margin-bottom: 15px;
                color: #c8a165; /* Gold color for headings */
                text-align: center;
                font-size: 20px;
                text-transform: uppercase;
                letter-spacing: 1px;
                border-bottom: 1px solid #8b5a2b;
                padding-bottom: 10px;
            }
            
            .monster-popup h4 {
                margin: 10px 0;
                color: #c8a165; /* Gold color for headings */
                font-size: 16px;
                text-transform: uppercase;
                letter-spacing: 1px;
            }
            
            .monster-stats {
                margin-bottom: 15px;
            }
            
            .monster-actions {
                display: flex;
                justify-content: space-between;
                gap: 10px;
                margin-top: 15px;
            }
            
            .monster-action-btn {
                flex: 1;
                padding: 8px 10px;
                border: 2px solid #8b5a2b; /* Brown border */
                border-radius: 0; /* Square corners for medieval look */
                cursor: pointer;
                font-weight: bold;
                font-size: 14px;
                font-family: 'Cinzel', 'Times New Roman', serif;
                text-transform: uppercase;
                letter-spacing: 1px;
                transition: all 0.2s ease;
                background-color: #2a1a0a; /* Dark brown background */
            }
            
            .monster-action-btn:hover {
                box-shadow: 0 0 10px #c8a165; /* Gold glow on hover */
            }
            
            .attack-btn {
                background-color: #6b2b2b; /* Dark red */
                color: #e8d4b9; /* Light parchment color */
                border-color: #8b3a3a; /* Red border */
            }
            
            .attack-btn:hover {
                background-color: #7b3a3a; /* Lighter red on hover */
            }
            
            /* Detailed monster info styles */
            .monster-popup.detailed .monster-stats {
                display: flex;
                flex-direction: column;
                gap: 15px;
            }
            
            /* Flag popup specific styles */
            .flag-popup {
                z-index: 10001 !important;
            }
            
            /* Table styles for data display */
            .data-table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 10px;
                font-size: 13px;
                border: 1px solid #8b5a2b; /* Brown border */
            }
            
            .data-table th {
                text-align: left;
                padding: 8px;
                border-bottom: 1px solid #8b5a2b;
                color: #c8a165; /* Gold color */
                font-weight: bold;
                background-color: rgba(0, 0, 0, 0.2);
            }
            
            .data-table td {
                padding: 8px;
                border-bottom: 1px solid rgba(139, 90, 43, 0.3); /* Lighter brown */
            }
            
            .data-table tr:last-child td {
                border-bottom: none;
            }
            
            /* Progress bar styles */
            .progress-bar {
                width: 100%;
                height: 8px;
                background-color: rgba(0, 0, 0, 0.3);
                border-radius: 0; /* Square corners for medieval look */
                overflow: hidden;
                margin-top: 5px;
                border: 1px solid #8b5a2b; /* Brown border */
            }
            
            .progress-fill {
                height: 100%;
                background-color: #4caf50;
                border-radius: 0; /* Square corners for medieval look */
                transition: width 0.3s ease;
            }
            
            .progress-fill.health {
                background-color: #5a7d3a; /* Earthy green */
            }
            
            .progress-fill.danger {
                background-color: #6b2b2b; /* Dark red */
            }
            
            .progress-fill.warning {
                background-color: #a06633; /* Brown-orange */
            }
            
            .progress-fill.mana {
                background-color: #2b3a4a; /* Dark blue */
            }
            
            .progress-fill.xp {
                background-color: #5a3a6b; /* Dark purple */
            }
        `;
        document.head.appendChild(popupStyle);
    }
    
    /**
     * Create a popup at the specified geographic coordinates
     */
    createPopup(lat: number, lon: number, content: PopupContent, options: PopupOptions = {}): HTMLElement | null {
        // Remove any existing popups with the same class
        if (options.className) {
            this.closePopupsByClass(options.className);
        }
        
        // Get screen coordinates for the popup
        const screenPos = this.mapSystem.geoToScreenCoordinates(lat, lon);
        if (!screenPos) return null;
        
        // Create a custom popup container
        const customPopup = document.createElement('div');
        customPopup.className = `custom-popup ${options.className || ''}`;
        customPopup.style.position = 'fixed';
        
        // Apply offset
        const offsetX = options.offset?.x || 0;
        const offsetY = options.offset?.y || -30; // Default offset above the target
        
        customPopup.style.left = `${screenPos.x + offsetX}px`;
        customPopup.style.top = `${screenPos.y + offsetY}px`;
        
        // Set custom width if provided
        if (options.width) {
            customPopup.style.width = `${options.width}px`;
            customPopup.style.minWidth = `${options.width}px`;
        }
        
        // Set custom z-index if provided
        if (options.zIndex) {
            customPopup.style.zIndex = `${options.zIndex}`;
        } else {
            customPopup.style.zIndex = '99999';
        }
        
        // Set content
        customPopup.innerHTML = content.html;
        
        // Add close button if requested
        if (options.closeButton !== false) {
            const closeButton = document.createElement('div');
            closeButton.className = 'custom-popup-close';
            closeButton.innerHTML = '×';
            closeButton.addEventListener('click', () => {
                this.closePopup(customPopup);
            });
            customPopup.appendChild(closeButton);
        }
        
        // Add the custom popup to the interaction layer or body
        if (this.mapSystem.interactionElement) {
            this.mapSystem.interactionElement.appendChild(customPopup);
        } else {
            document.body.appendChild(customPopup);
        }
        
        // Add event listeners to buttons
        if (content.buttons) {
            content.buttons.forEach(button => {
                const buttonEl = customPopup.querySelector(button.selector);
                if (buttonEl) {
                    buttonEl.addEventListener('click', () => {
                        button.onClick();
                    });
                }
            });
        }
        
        // Track the popup
        this.activePopups.push(customPopup);
        
        return customPopup;
    }
    
    /**
     * Create a popup at screen coordinates
     */
    createPopupAtScreenPosition(x: number, y: number, content: PopupContent, options: PopupOptions = {}): HTMLElement | null {
        // Remove any existing popups with the same class
        if (options.className) {
            this.closePopupsByClass(options.className);
        }
        
        // Create a custom popup container
        const customPopup = document.createElement('div');
        customPopup.className = `custom-popup ${options.className || ''}`;
        customPopup.style.position = 'fixed';
        
        // Apply offset
        const offsetX = options.offset?.x || 0;
        const offsetY = options.offset?.y || -30; // Default offset above the target
        
        customPopup.style.left = `${x + offsetX}px`;
        customPopup.style.top = `${y + offsetY}px`;
        
        // Set custom width if provided
        if (options.width) {
            customPopup.style.width = `${options.width}px`;
            customPopup.style.minWidth = `${options.width}px`;
        }
        
        // Set custom z-index if provided
        if (options.zIndex) {
            customPopup.style.zIndex = `${options.zIndex}`;
        } else {
            customPopup.style.zIndex = '99999';
        }
        
        // Set content
        customPopup.innerHTML = content.html;
        
        // Add close button if requested
        if (options.closeButton !== false) {
            const closeButton = document.createElement('div');
            closeButton.className = 'custom-popup-close';
            closeButton.innerHTML = '×';
            closeButton.addEventListener('click', () => {
                this.closePopup(customPopup);
            });
            customPopup.appendChild(closeButton);
        }
        
        // Add the custom popup to the interaction layer or body
        if (this.mapSystem.interactionElement) {
            this.mapSystem.interactionElement.appendChild(customPopup);
        } else {
            document.body.appendChild(customPopup);
        }
        
        // Add event listeners to buttons
        if (content.buttons) {
            content.buttons.forEach(button => {
                const buttonEl = customPopup.querySelector(button.selector);
                if (buttonEl) {
                    buttonEl.addEventListener('click', () => {
                        button.onClick();
                    });
                }
            });
        }
        
        // Track the popup
        this.activePopups.push(customPopup);
        
        return customPopup;
    }
    
    /**
     * Update a popup's content
     */
    updatePopupContent(popup: HTMLElement, content: PopupContent): void {
        if (!popup) return;
        
        // Store the close button if it exists
        const closeButton = popup.querySelector('.custom-popup-close');
        
        // Update content
        popup.innerHTML = content.html;
        
        // Re-add close button if it existed
        if (closeButton) {
            popup.appendChild(closeButton);
        }
        
        // Add event listeners to buttons
        if (content.buttons) {
            content.buttons.forEach(button => {
                const buttonEl = popup.querySelector(button.selector);
                if (buttonEl) {
                    buttonEl.addEventListener('click', () => {
                        button.onClick();
                    });
                }
            });
        }
    }
    
    /**
     * Close a specific popup
     */
    closePopup(popup: HTMLElement): void {
        if (!popup) return;
        
        // Remove from DOM
        if (popup.parentNode) {
            popup.parentNode.removeChild(popup);
        }
        
        // Remove from tracking array
        const index = this.activePopups.indexOf(popup);
        if (index !== -1) {
            this.activePopups.splice(index, 1);
        }
    }
    
    /**
     * Close all popups with a specific class
     */
    closePopupsByClass(className: string): void {
        const popups = document.querySelectorAll(`.custom-popup.${className}`);
        popups.forEach(popup => {
            if (popup.parentNode) {
                popup.parentNode.removeChild(popup);
            }
            
            // Remove from tracking array
            const index = this.activePopups.indexOf(popup as HTMLElement);
            if (index !== -1) {
                this.activePopups.splice(index, 1);
            }
        });
    }
    
    /**
     * Close all active popups
     */
    closeAllPopups(): void {
        // Make a copy of the array since we'll be modifying it
        const popupsCopy = [...this.activePopups];
        
        // Close each popup
        popupsCopy.forEach(popup => {
            this.closePopup(popup);
        });
        
        // Clear the array
        this.activePopups = [];
    }
    
    /**
     * Clean up resources
     */
    destroy(): void {
        this.closeAllPopups();
    }
} 