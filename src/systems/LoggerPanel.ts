import { logger } from './Logger';

/**
 * A simple UI panel for controlling logger settings
 */
export class LoggerPanel {
    private container: HTMLElement;
    private isVisible: boolean = false;
    private toggleButton: HTMLElement;

    constructor() {
        // Create container
        this.container = document.createElement('div');
        this.container.style.position = 'fixed';
        this.container.style.top = '10px';
        this.container.style.right = '10px';
        this.container.style.zIndex = '1000';
        this.container.style.display = 'none';
        this.container.style.width = '300px';
        this.container.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        this.container.style.color = 'white';
        this.container.style.borderRadius = '5px';
        this.container.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.5)';
        document.body.appendChild(this.container);

        // Create toggle button
        this.toggleButton = document.createElement('button');
        this.toggleButton.textContent = '🔍 Logger';
        this.toggleButton.style.position = 'fixed';
        this.toggleButton.style.top = '50px';
        this.toggleButton.style.right = '10px';
        this.toggleButton.style.zIndex = '1001';
        this.toggleButton.style.padding = '5px 10px';
        this.toggleButton.style.backgroundColor = '#333';
        this.toggleButton.style.color = 'white';
        this.toggleButton.style.border = 'none';
        this.toggleButton.style.borderRadius = '3px';
        this.toggleButton.style.cursor = 'pointer';
        this.toggleButton.addEventListener('click', () => this.toggle());
        document.body.appendChild(this.toggleButton);

        // Initialize the panel
        this.initPanel();
    }

    /**
     * Initialize the logger panel
     */
    private initPanel(): void {
        logger.createLoggerControlPanel(this.container);
    }

    /**
     * Toggle the visibility of the logger panel
     */
    public toggle(): void {
        this.isVisible = !this.isVisible;
        this.container.style.display = this.isVisible ? 'block' : 'none';
        
        // Update button text
        this.toggleButton.textContent = this.isVisible ? '❌ Close' : '🔍 Logger';
    }

    /**
     * Show the logger panel
     */
    public show(): void {
        if (!this.isVisible) {
            this.toggle();
        }
    }

    /**
     * Hide the logger panel
     */
    public hide(): void {
        if (this.isVisible) {
            this.toggle();
        }
    }
}

// Export a singleton instance
export const loggerPanel = new LoggerPanel(); 