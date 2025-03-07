import type { Scene } from 'phaser';
import { DOMUIHelper } from './DOMUIHelper';

/**
 * Options for the menu button
 */
export interface MenuButtonOptions {
    position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    text?: string;
    backgroundColor?: string;
    textColor?: string;
    borderColor?: string;
    fontFamily?: string;
    fontSize?: string;
    padding?: string;
    onClick?: () => void;
}

/**
 * MenuButton - A medieval-themed HTML button for the game menu
 * This class creates a DOM-based button UI with customizable options
 */
export class MenuButton {
    private scene: Scene;
    private uiHelper: DOMUIHelper;
    private button: HTMLButtonElement;
    private styleElement: HTMLStyleElement | null = null;
    
    // Default options
    private defaultOptions: Required<MenuButtonOptions> = {
        position: 'bottom-right',
        text: 'MENU',
        backgroundColor: '#2a1a0a',
        textColor: '#f0c070',
        borderColor: '#f0c070',
        fontFamily: 'Cinzel, Times New Roman, serif',
        fontSize: '14px',
        padding: '8px 16px',
        onClick: () => {}
    };
    
    // Actual options after merging defaults with provided options
    private options: Required<MenuButtonOptions>;
    
    constructor(scene: Scene, options: MenuButtonOptions = {}) {
        console.log('[MenuButton] Initializing menu button');
        this.scene = scene;
        this.uiHelper = new DOMUIHelper(scene);
        
        // Merge provided options with defaults
        this.options = { ...this.defaultOptions, ...options };
        console.log('[MenuButton] Options:', this.options);
        
        // Create the button
        this.button = this.createButton();
        
        // Add the button to the DOM
        document.body.appendChild(this.button);
        console.log('[MenuButton] Button added to DOM');
        
        // Add the CSS animation
        this.addPulseAnimation();
        
        // Set up cleanup when scene is shut down
        this.scene.events.once('shutdown', this.destroy.bind(this));
        console.log('[MenuButton] Initialization complete');
    }
    
    /**
     * Creates the button element
     */
    private createButton(): HTMLButtonElement {
        // Create the button
        const button = this.uiHelper.createElement<HTMLButtonElement>('button', 'medieval-menu-button');
        
        // Set position based on option
        const positionStyles: Record<string, Partial<CSSStyleDeclaration>> = {
            'top-left': { top: '20px', left: '20px' },
            'top-right': { top: '20px', right: '20px' },
            'bottom-left': { bottom: '20px', left: '20px' },
            'bottom-right': { bottom: '20px', right: '20px' }
        };
        
        // Set button styles
        Object.assign(button.style, {
            position: 'absolute',
            padding: this.options.padding,
            backgroundColor: this.options.backgroundColor,
            color: this.options.textColor,
            border: `2px solid ${this.options.borderColor}`,
            borderRadius: '4px',
            fontFamily: this.options.fontFamily,
            fontSize: this.options.fontSize,
            fontWeight: 'bold',
            cursor: 'pointer',
            zIndex: '1000',
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
        }, positionStyles[this.options.position]);
        
        // Set button text
        button.textContent = this.options.text;
        
        // Add hover effects
        button.addEventListener('mouseover', () => {
            Object.assign(button.style, {
                backgroundColor: this.lightenColor(this.options.backgroundColor, 20),
                transform: 'scale(1.05)'
            });
        });
        
        button.addEventListener('mouseout', () => {
            Object.assign(button.style, {
                backgroundColor: this.options.backgroundColor,
                transform: 'scale(1)'
            });
        });
        
        // Add click handler
        button.addEventListener('click', (event) => {
            console.log('[MenuButton] Button clicked');
            console.log('[MenuButton] Event target:', event.target);
            console.log('[MenuButton] onClick handler exists:', !!this.options.onClick);
            
            // Add click animation using CSS
            button.style.transform = 'scale(0.95)';
            setTimeout(() => {
                button.style.transform = 'scale(1)';
                // Call the provided onClick handler
                console.log('[MenuButton] Executing onClick handler');
                this.options.onClick();
            }, 100);
        });
        
        return button;
    }
    
    /**
     * Adds the pulse animation to the button
     */
    private addPulseAnimation(): void {
        // Create a style element for the animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes pulse-border {
                0% { border-color: ${this.hexToRgba(this.options.borderColor, 0.6)}; }
                50% { border-color: ${this.hexToRgba(this.options.borderColor, 1)}; }
                100% { border-color: ${this.hexToRgba(this.options.borderColor, 0.6)}; }
            }
            .medieval-menu-button {
                animation: pulse-border 1.5s infinite;
            }
        `;
        document.head.appendChild(style);
        this.styleElement = style;
    }
    
    /**
     * Converts a hex color to rgba
     */
    private hexToRgba(hexColor: string, alpha: number): string {
        // Remove the # if present
        const cleanHex = hexColor.replace('#', '');
        
        // Parse the hex values
        const r = Number.parseInt(cleanHex.substring(0, 2), 16);
        const g = Number.parseInt(cleanHex.substring(2, 4), 16);
        const b = Number.parseInt(cleanHex.substring(4, 6), 16);
        
        // Return rgba
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    
    /**
     * Lightens a color by the specified amount
     */
    private lightenColor(hexColor: string, amount: number): string {
        // Remove the # if present
        const cleanHex = hexColor.replace('#', '');
        
        // Parse the hex values
        let r = Number.parseInt(cleanHex.substring(0, 2), 16);
        let g = Number.parseInt(cleanHex.substring(2, 4), 16);
        let b = Number.parseInt(cleanHex.substring(4, 6), 16);
        
        // Lighten the color
        r = Math.min(255, r + amount);
        g = Math.min(255, g + amount);
        b = Math.min(255, b + amount);
        
        // Convert back to hex
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }
    
    /**
     * Sets the click handler for the button
     */
    public setClickHandler(handler: () => void): void {
        this.options.onClick = handler;
    }
    
    /**
     * Shows the button
     */
    public show(): void {
        this.button.style.display = 'block';
    }
    
    /**
     * Hides the button
     */
    public hide(): void {
        this.button.style.display = 'none';
    }
    
    /**
     * Cleans up resources when no longer needed
     */
    public destroy(): void {
        // Remove the button from the DOM
        this.button.parentNode?.removeChild(this.button);
        
        // Remove the style element
        this.styleElement?.parentNode?.removeChild(this.styleElement);
    }
} 