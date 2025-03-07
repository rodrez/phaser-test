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
            /* Global styles for custom popups */
            .custom-popup {
                position: fixed !important; /* Use fixed positioning to ensure it's always on top */
                background: #1e1e1e;
                color: #ffffff;
                border-radius: 8px;
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.5);
                overflow: hidden;
                font-family: 'Arial', sans-serif;
                z-index: 1000;
                max-width: 90vw;
                max-height: 80vh;
                overflow-y: auto;
                padding: 15px;
                transition: opacity 0.3s ease;
            }
            
            .custom-popup-close {
                position: absolute;
                top: 10px;
                right: 10px;
                width: 25px;
                height: 25px;
                background: #444;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                color: white;
                font-size: 16px;
                font-weight: bold;
                z-index: 1001;
            }
            
            .custom-popup-close:hover {
                background: #666;
            }
            
            /* Monster popup specific styles */
            .monster-popup-container {
                min-width: 280px;
            }
            
            .monster-popup {
                font-family: 'Arial', sans-serif;
            }
            
            .monster-popup h3 {
                margin-top: 0;
                margin-bottom: 15px;
                color: #ffd700;
                text-align: center;
                font-size: 20px;
            }
            
            .monster-popup h4 {
                margin: 10px 0;
                color: #ffd700;
                font-size: 16px;
            }
            
            .monster-stats {
                margin-bottom: 15px;
            }
            
            .stat-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 8px;
                font-size: 14px;
            }
            
            .stat-label {
                font-weight: bold;
                color: #aaa;
            }
            
            .stat-value {
                color: #fff;
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
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-weight: bold;
                font-size: 14px;
                transition: all 0.2s ease;
            }
            
            .attack-btn {
                background-color: #b71c1c;
                color: white;
            }
            
            .attack-btn:hover {
                background-color: #d32f2f;
            }
            
            .info-btn, .back-btn {
                background-color: #1976d2;
                color: white;
            }
            
            .info-btn:hover, .back-btn:hover {
                background-color: #2196f3;
            }
            
            /* Detailed monster info styles */
            .monster-popup.detailed .monster-stats {
                display: flex;
                flex-direction: column;
                gap: 15px;
            }
            
            .stat-section {
                background-color: rgba(0, 0, 0, 0.2);
                padding: 10px;
                border-radius: 5px;
                border: 1px solid rgba(255, 255, 255, 0.1);
            }
            
            .loot-table {
                display: flex;
                flex-direction: column;
                gap: 5px;
                font-size: 13px;
            }
            
            .loot-header {
                display: flex;
                justify-content: space-between;
                font-weight: bold;
                border-bottom: 1px solid rgba(255, 255, 255, 0.2);
                padding-bottom: 5px;
                margin-bottom: 5px;
            }
            
            .loot-header span {
                flex: 1;
            }
            
            .loot-item {
                display: flex;
                justify-content: space-between;
            }
            
            .loot-item span {
                flex: 1;
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