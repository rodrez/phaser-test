import type { Scene } from 'phaser';

/**
 * DOMUIHelper - Utility class to help integrate HTML/CSS UI with Phaser
 * Handles loading CSS files and managing DOM elements
 */
export class DOMUIHelper {
    private scene: Scene;
    private cssFiles: string[] = [];
    private loadedCssFiles: Set<string> = new Set();
    
    constructor(scene: Scene) {
        this.scene = scene;
    }
    
    /**
     * Loads a CSS file into the document if it hasn't been loaded already
     * @param cssPath Path to the CSS file
     */
    public loadCSS(cssPath: string): void {
        // Check if this CSS file has already been loaded
        if (this.loadedCssFiles.has(cssPath)) {
            return;
        }
        
        // Create a link element for the CSS file
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.type = 'text/css';
        link.href = cssPath;
        
        // Add to document head
        document.head.appendChild(link);
        
        // Track that we've loaded this file
        this.cssFiles.push(cssPath);
        this.loadedCssFiles.add(cssPath);
        
        console.log(`Loaded CSS file: ${cssPath}`);
    }
    
    /**
     * Creates a DOM element with the given properties
     * @param tag HTML tag name
     * @param className CSS class name(s)
     * @param styles Optional inline styles
     * @param parent Optional parent element to append to
     * @returns The created HTML element
     */
    public createElement<T extends HTMLElement>(
        tag: string,
        className?: string,
        styles?: Partial<CSSStyleDeclaration>,
        parent?: HTMLElement
    ): T {
        console.log(`[DOMUIHelper] Creating element: ${tag}${className ? ` with class ${className}` : ''}`);
        const element = document.createElement(tag) as T;
        
        if (className) {
            element.className = className;
        }
        
        if (styles) {
            Object.assign(element.style, styles);
        }
        
        if (parent) {
            parent.appendChild(element);
        }
        
        return element;
    }
    
    /**
     * Creates a container div with the given class name
     * @param className CSS class name(s)
     * @param styles Optional inline styles
     * @returns The created container element
     */
    public createContainer(
        className?: string,
        styles?: Partial<CSSStyleDeclaration>
    ): HTMLDivElement {
        return this.createElement<HTMLDivElement>(
            'div',
            className || '',
            styles
        );
    }
    
    /**
     * Creates a button with the given text and class
     * @param text Button text
     * @param className CSS class name(s)
     * @param onClick Click event handler
     * @param styles Optional inline styles
     * @returns The created button element
     */
    public createButton(
        text: string,
        className: string,
        onClick: () => void,
        styles?: Partial<CSSStyleDeclaration>
    ): HTMLButtonElement {
        console.log(`[DOMUIHelper] Creating button: "${text}" with class ${className}`);
        const button = this.createElement<HTMLButtonElement>(
            'button',
            className,
            styles
        );
        
        button.textContent = text;
        
        // Add click handler with debugging
        button.addEventListener('click', (event) => {
            event.stopPropagation();
            event.preventDefault();
            
            console.log(`[DOMUIHelper] Button clicked: "${text}"`);
            console.log('[DOMUIHelper] Event target:', event.target);
            onClick();
        });
        
        return button;
    }
    
    /**
     * Creates a progress bar with the given class
     * @param className CSS class name(s)
     * @param fillClassName CSS class name(s) for the fill element
     * @param initialPercent Initial fill percentage (0-100)
     * @param styles Optional inline styles
     * @returns Object containing the bar container and fill elements
     */
    public createProgressBar(
        className: string,
        fillClassName: string,
        initialPercent: number = 100,
        styles?: Partial<CSSStyleDeclaration>
    ): { container: HTMLDivElement; fill: HTMLDivElement } {
        const container = this.createElement<HTMLDivElement>(
            'div',
            className,
            styles
        );
        
        const fill = this.createElement<HTMLDivElement>(
            'div',
            fillClassName,
            { width: `${initialPercent}%` }
        );
        
        container.appendChild(fill);
        
        return { container, fill };
    }
    
    /**
     * Updates a progress bar's fill percentage
     * @param fill The fill element to update
     * @param percent The new percentage (0-100)
     */
    public updateProgressBar(fill: HTMLDivElement, percent: number): void {
        fill.style.width = `${Math.max(0, Math.min(100, percent))}%`;
    }
    
    /**
     * Creates a stat row with label and value
     * @param label The label text
     * @param value The initial value text
     * @param labelClass CSS class for the label
     * @param valueClass CSS class for the value
     * @returns Object containing the row, label, and value elements
     */
    public createStatRow(
        label: string,
        value: string,
        labelClass = 'stat-label',
        valueClass= 'stat-value'
    ): { row: HTMLDivElement; label: HTMLDivElement; value: HTMLDivElement } {
        const row = this.createElement<HTMLDivElement>('div', 'stat-row');
        
        const labelElement = this.createElement<HTMLDivElement>(
            'div',
            labelClass,
            undefined,
            row
        );
        labelElement.textContent = label;
        
        const valueElement = this.createElement<HTMLDivElement>(
            'div',
            valueClass,
            undefined,
            row
        );
        valueElement.textContent = value;
        
        return { row, label: labelElement, value: valueElement };
    }
    
    /**
     * Removes all loaded CSS files from the document
     */
    public cleanupCSS(): void {
        const links = document.querySelectorAll('link[rel="stylesheet"]');
        
        for (const link of links) {
            const href = link.getAttribute('href');
            if (href && this.cssFiles.includes(href)) {
                link.parentNode?.removeChild(link);
            }
        }
        
        this.cssFiles = [];
    }
} 