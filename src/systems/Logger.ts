/**
 * Logger System
 * 
 * A flexible logging system that allows toggling different categories of logs.
 * This helps with debugging specific systems while keeping the console clean.
 */

// Define log categories based on the systems in the game
export enum LogCategory {
    GENERAL = 'GENERAL',
    PLAYER = 'PLAYER',
    COMBAT = 'COMBAT',
    INVENTORY = 'INVENTORY',
    EQUIPMENT = 'EQUIPMENT',
    MONSTER = 'MONSTER',
    ENVIRONMENT = 'ENVIRONMENT',
    UI = 'UI',
    MAP = 'MAP',
    FLAG = 'FLAG',
    SKILL = 'SKILL',
    GAME = 'GAME',
    MMO = 'MMO',
    POSITION = 'POSITION',
    NETWORK = 'NETWORK',
    DEBUG = 'DEBUG',
    MENU = 'menu',
    CHAT = 'chat',
    // Add more categories as needed
}

// Define log levels
export enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3,
}

// Logger configuration interface
interface LoggerConfig {
    enabled: boolean;
    level: LogLevel;
    categories: {
        [key in LogCategory]?: boolean;
    };
    useColors: boolean;
}

export class Logger {
    private static instance: Logger;
    private config: LoggerConfig;
    
    // Color codes for different log levels
    private readonly colors = {
        [LogLevel.DEBUG]: '#9999ff',
        [LogLevel.INFO]: '#33cc33',
        [LogLevel.WARN]: '#ffcc00',
        [LogLevel.ERROR]: '#ff3333',
    };
    
    // Category colors
    private readonly categoryColors: { [key in LogCategory]?: string } = {
        [LogCategory.PLAYER]: '#ff9966',
        [LogCategory.COMBAT]: '#ff6666',
        [LogCategory.INVENTORY]: '#66ccff',
        [LogCategory.EQUIPMENT]: '#cc99ff',
        [LogCategory.MONSTER]: '#ff6699',
        [LogCategory.MAP]: '#99cc66',
        [LogCategory.MMO]: '#ffcc66',
        [LogCategory.UI]: '#66ffcc',
        [LogCategory.SKILL]: '#cc66ff',
        [LogCategory.ENVIRONMENT]: '#99ff99',
        [LogCategory.POSITION]: '#ffff66',
        [LogCategory.NETWORK]: '#66cccc',
        [LogCategory.GENERAL]: '#cccccc',
        [LogCategory.FLAG]: '#ff6666',
        [LogCategory.MENU]: '#ff9966',
        [LogCategory.CHAT]: '#ff6699',
    };

    private constructor() {
        // Default configuration
        this.config = {
            enabled: true,
            level: LogLevel.DEBUG,
            categories: {
                // By default, enable all categories
                ...Object.values(LogCategory).reduce((acc, category) => {
                    acc[category as LogCategory] = true;
                    return acc;
                }, {} as { [key in LogCategory]: boolean }),
            },
            useColors: true,
        };

        // Try to load configuration from localStorage
        this.loadConfig();
    }

    /**
     * Get the singleton instance of the Logger
     */
    public static getInstance(): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }

    /**
     * Save the current configuration to localStorage
     */
    private saveConfig(): void {
        try {
            localStorage.setItem('logger_config', JSON.stringify(this.config));
        } catch (e) {
            console.error('Failed to save logger configuration:', e);
        }
    }

    /**
     * Load configuration from localStorage
     */
    private loadConfig(): void {
        try {
            const savedConfig = localStorage.getItem('logger_config');
            if (savedConfig) {
                this.config = { ...this.config, ...JSON.parse(savedConfig) };
            }
        } catch (e) {
            console.error('Failed to load logger configuration:', e);
        }
    }

    /**
     * Enable or disable the entire logging system
     */
    public setEnabled(enabled: boolean): void {
        this.config.enabled = enabled;
        this.saveConfig();
    }

    /**
     * Set the minimum log level
     */
    public setLevel(level: LogLevel): void {
        this.config.level = level;
        this.saveConfig();
    }

    /**
     * Enable or disable a specific category
     */
    public setCategory(category: LogCategory, enabled: boolean): void {
        this.config.categories[category] = enabled;
        this.saveConfig();
    }

    /**
     * Enable or disable color output
     */
    public setUseColors(useColors: boolean): void {
        this.config.useColors = useColors;
        this.saveConfig();
    }

    /**
     * Enable all categories
     */
    public enableAllCategories(): void {
        Object.values(LogCategory).forEach(category => {
            this.config.categories[category as LogCategory] = true;
        });
        this.saveConfig();
    }

    /**
     * Disable all categories
     */
    public disableAllCategories(): void {
        Object.values(LogCategory).forEach(category => {
            this.config.categories[category as LogCategory] = false;
        });
        this.saveConfig();
    }

    /**
     * Check if a category is enabled
     */
    public isCategoryEnabled(category: LogCategory): boolean {
        return !!this.config.categories[category];
    }

    /**
     * Get all categories and their status
     */
    public getCategories(): { category: LogCategory, enabled: boolean }[] {
        return Object.values(LogCategory).map(category => ({
            category: category as LogCategory,
            enabled: !!this.config.categories[category as LogCategory]
        }));
    }

    /**
     * Format a log message with colors if enabled
     */
    private formatMessage(level: LogLevel, category: LogCategory, message: string): string {
        if (!this.config.useColors) {
            return `[${LogLevel[level]}][${category}] ${message}`;
        }

        const levelColor = this.colors[level];
        const categoryColor = this.categoryColors[category] || '#ffffff';
        
        return `%c[${LogLevel[level]}]%c[${category}]%c ${message}`;
    }

    /**
     * Get style strings for colored output
     */
    private getStyles(level: LogLevel, category: LogCategory): string[] {
        if (!this.config.useColors) {
            return [];
        }

        const levelColor = this.colors[level];
        const categoryColor = this.categoryColors[category] || '#ffffff';
        
        return [
            `color: ${levelColor}; font-weight: bold;`,
            `color: ${categoryColor}; font-weight: bold;`,
            'color: inherit;'
        ];
    }

    /**
     * Log a debug message
     */
    public debug(category: LogCategory, message: string, ...args: any[]): void {
        this.log(LogLevel.DEBUG, category, message, ...args);
    }

    /**
     * Log an info message
     */
    public info(category: LogCategory, message: string, ...args: any[]): void {
        this.log(LogLevel.INFO, category, message, ...args);
    }

    /**
     * Log a warning message
     */
    public warn(category: LogCategory, message: string, ...args: any[]): void {
        this.log(LogLevel.WARN, category, message, ...args);
    }

    /**
     * Log an error message
     */
    public error(category: LogCategory, message: string, ...args: any[]): void {
        this.log(LogLevel.ERROR, category, message, ...args);
    }

    /**
     * Main log method
     */
    private log(level: LogLevel, category: LogCategory, message: string, ...args: any[]): void {
        // Check if logging is enabled and if the category is enabled
        if (!this.config.enabled || !this.config.categories[category] || level < this.config.level) {
            return;
        }

        const formattedMessage = this.formatMessage(level, category, message);
        const styles = this.getStyles(level, category);

        switch (level) {
            case LogLevel.DEBUG:
                console.debug(formattedMessage, ...styles, ...args);
                break;
            case LogLevel.INFO:
                console.info(formattedMessage, ...styles, ...args);
                break;
            case LogLevel.WARN:
                console.warn(formattedMessage, ...styles, ...args);
                break;
            case LogLevel.ERROR:
                console.error(formattedMessage, ...styles, ...args);
                break;
        }
    }

    /**
     * Create a UI panel to control logging settings
     * This can be called from a debug menu or settings screen
     */
    public createLoggerControlPanel(container: HTMLElement): void {
        // Clear existing content
        container.innerHTML = '';
        container.style.padding = '10px';
        container.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        container.style.color = 'white';
        container.style.borderRadius = '5px';
        container.style.maxHeight = '400px';
        container.style.overflowY = 'auto';

        // Create title
        const title = document.createElement('h3');
        title.textContent = 'Logger Settings';
        title.style.marginTop = '0';
        container.appendChild(title);

        // Create global enable/disable toggle
        const globalToggle = document.createElement('div');
        globalToggle.style.marginBottom = '10px';
        
        const globalCheckbox = document.createElement('input');
        globalCheckbox.type = 'checkbox';
        globalCheckbox.id = 'logger-enabled';
        globalCheckbox.checked = this.config.enabled;
        globalCheckbox.addEventListener('change', () => {
            this.setEnabled(globalCheckbox.checked);
        });
        
        const globalLabel = document.createElement('label');
        globalLabel.htmlFor = 'logger-enabled';
        globalLabel.textContent = 'Enable Logging';
        globalLabel.style.marginLeft = '5px';
        globalLabel.style.marginTop= '10px';
        
        globalToggle.appendChild(globalCheckbox);
        globalToggle.appendChild(globalLabel);
        container.appendChild(globalToggle);

        // Create log level selector
        const levelSelector = document.createElement('div');
        levelSelector.style.marginBottom = '10px';
        
        const levelLabel = document.createElement('label');
        levelLabel.htmlFor = 'logger-level';
        levelLabel.textContent = 'Log Level: ';
        
        const levelSelect = document.createElement('select');
        levelSelect.id = 'logger-level';
        
        Object.values(LogLevel)
            .filter(value => typeof value === 'number')
            .forEach(level => {
                const option = document.createElement('option');
                option.value = level.toString();
                option.textContent = LogLevel[level as number];
                option.selected = this.config.level === level;
                levelSelect.appendChild(option);
            });
        
        levelSelect.addEventListener('change', () => {
            this.setLevel(parseInt(levelSelect.value) as LogLevel);
        });
        
        levelSelector.appendChild(levelLabel);
        levelSelector.appendChild(levelSelect);
        container.appendChild(levelSelector);

        // Create category toggles
        const categoriesTitle = document.createElement('h4');
        categoriesTitle.textContent = 'Categories';
        categoriesTitle.style.marginBottom = '5px';
        container.appendChild(categoriesTitle);

        // Add buttons to enable/disable all
        const categoryButtons = document.createElement('div');
        categoryButtons.style.marginBottom = '10px';
        
        const enableAllBtn = document.createElement('button');
        enableAllBtn.textContent = 'Enable All';
        enableAllBtn.style.marginRight = '10px';
        enableAllBtn.addEventListener('click', () => {
            this.enableAllCategories();
            // Update checkboxes
            document.querySelectorAll('.category-checkbox').forEach((checkbox) => {
                (checkbox as HTMLInputElement).checked = true;
            });
        });
        
        const disableAllBtn = document.createElement('button');
        disableAllBtn.textContent = 'Disable All';
        disableAllBtn.addEventListener('click', () => {
            this.disableAllCategories();
            // Update checkboxes
            document.querySelectorAll('.category-checkbox').forEach((checkbox) => {
                (checkbox as HTMLInputElement).checked = false;
            });
        });
        
        categoryButtons.appendChild(enableAllBtn);
        categoryButtons.appendChild(disableAllBtn);
        container.appendChild(categoryButtons);

        // Create a grid for categories
        const categoryGrid = document.createElement('div');
        categoryGrid.style.display = 'grid';
        categoryGrid.style.gridTemplateColumns = 'repeat(2, 1fr)';
        categoryGrid.style.gap = '5px';
        
        Object.values(LogCategory).forEach(category => {
            const categoryToggle = document.createElement('div');
            
            const categoryCheckbox = document.createElement('input');
            categoryCheckbox.type = 'checkbox';
            categoryCheckbox.id = `logger-category-${category}`;
            categoryCheckbox.className = 'category-checkbox';
            categoryCheckbox.checked = !!this.config.categories[category as LogCategory];
            categoryCheckbox.addEventListener('change', () => {
                this.setCategory(category as LogCategory, categoryCheckbox.checked);
            });
            
            const categoryLabel = document.createElement('label');
            categoryLabel.htmlFor = `logger-category-${category}`;
            categoryLabel.textContent = category;
            categoryLabel.style.marginLeft = '5px';
            
            if (this.config.useColors) {
                const color = this.categoryColors[category as LogCategory] || '#ffffff';
                categoryLabel.style.color = color;
            }
            
            categoryToggle.appendChild(categoryCheckbox);
            categoryToggle.appendChild(categoryLabel);
            categoryGrid.appendChild(categoryToggle);
        });
        
        container.appendChild(categoryGrid);

        // Create color toggle
        const colorToggle = document.createElement('div');
        colorToggle.style.marginTop = '10px';
        
        const colorCheckbox = document.createElement('input');
        colorCheckbox.type = 'checkbox';
        colorCheckbox.id = 'logger-colors';
        colorCheckbox.checked = this.config.useColors;
        colorCheckbox.addEventListener('change', () => {
            this.setUseColors(colorCheckbox.checked);
            // Refresh the panel to update colors
            this.createLoggerControlPanel(container);
        });
        
        const colorLabel = document.createElement('label');
        colorLabel.htmlFor = 'logger-colors';
        colorLabel.textContent = 'Use Colors';
        colorLabel.style.marginLeft = '5px';
        
        colorToggle.appendChild(colorCheckbox);
        colorToggle.appendChild(colorLabel);
        container.appendChild(colorToggle);
    }
}

// Create a singleton logger instance for easier access
export const logger = Logger.getInstance(); 