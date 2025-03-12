import { Scene } from 'phaser';
import { logger, LogCategory, LogLevel } from '../systems/Logger';
import { loggerPanel } from '../systems/LoggerPanel';

/**
 * A demo scene that shows how to use the logger system
 */
export class LoggerDemoScene extends Scene {
    constructor() {
        super({ key: 'LoggerDemo' });
    }

    create() {
        // Set up the logger panel
        // The panel is already created as a singleton, but we can show it
        loggerPanel.show();

        // Create some UI elements for the demo
        this.createDemoUI();

        // Log some messages to demonstrate the logger
        logger.info(LogCategory.GENERAL, 'Logger demo scene started');
        logger.debug(LogCategory.PLAYER, 'Player debug message');
        logger.warn(LogCategory.COMBAT, 'Combat warning message');
        logger.error(LogCategory.INVENTORY, 'Inventory error message');

        // Log a message with additional data
        logger.info(LogCategory.MAP, 'Map loaded', {
            mapName: 'demo-map',
            size: { width: 1000, height: 1000 },
            entities: 25
        });

        // Set up a timer to log messages periodically
        this.time.addEvent({
            delay: 3000,
            callback: this.logRandomMessage,
            callbackScope: this,
            loop: true
        });
    }

    /**
     * Creates a simple UI for the demo
     */
    private createDemoUI() {
        // Add a title
        this.add.text(this.cameras.main.centerX, 50, 'Logger Demo', {
            fontSize: '32px',
            color: '#ffffff'
        }).setOrigin(0.5);

        // Add instructions
        this.add.text(this.cameras.main.centerX, 100, 'Use the Logger panel in the top-right to toggle categories', {
            fontSize: '16px',
            color: '#ffffff'
        }).setOrigin(0.5);

        // Add buttons to generate different log types
        const buttonStyle = {
            fontSize: '16px',
            color: '#ffffff',
            backgroundColor: '#333333',
            padding: { x: 10, y: 5 }
        };

        // Debug button
        const debugButton = this.add.text(this.cameras.main.centerX - 200, 200, 'Log Debug', buttonStyle)
            .setInteractive()
            .on('pointerdown', () => {
                logger.debug(LogCategory.PLAYER, 'Debug message from button click');
            });

        // Info button
        const infoButton = this.add.text(this.cameras.main.centerX - 100, 200, 'Log Info', buttonStyle)
            .setInteractive()
            .on('pointerdown', () => {
                logger.info(LogCategory.COMBAT, 'Info message from button click');
            });

        // Warning button
        const warnButton = this.add.text(this.cameras.main.centerX, 200, 'Log Warning', buttonStyle)
            .setInteractive()
            .on('pointerdown', () => {
                logger.warn(LogCategory.INVENTORY, 'Warning message from button click');
            });

        // Error button
        const errorButton = this.add.text(this.cameras.main.centerX + 100, 200, 'Log Error', buttonStyle)
            .setInteractive()
            .on('pointerdown', () => {
                logger.error(LogCategory.MAP, 'Error message from button click');
            });

        // Add buttons to toggle categories
        const togglePlayerButton = this.add.text(this.cameras.main.centerX - 200, 250, 'Toggle Player Logs', buttonStyle)
            .setInteractive()
            .on('pointerdown', () => {
                const isEnabled = logger.isCategoryEnabled(LogCategory.PLAYER);
                logger.setCategory(LogCategory.PLAYER, !isEnabled);
                logger.info(LogCategory.GENERAL, `Player logs ${!isEnabled ? 'enabled' : 'disabled'}`);
            });

        const toggleCombatButton = this.add.text(this.cameras.main.centerX, 250, 'Toggle Combat Logs', buttonStyle)
            .setInteractive()
            .on('pointerdown', () => {
                const isEnabled = logger.isCategoryEnabled(LogCategory.COMBAT);
                logger.setCategory(LogCategory.COMBAT, !isEnabled);
                logger.info(LogCategory.GENERAL, `Combat logs ${!isEnabled ? 'enabled' : 'disabled'}`);
            });

        // Add button to toggle all logs
        const toggleAllButton = this.add.text(this.cameras.main.centerX, 300, 'Toggle All Logs', buttonStyle)
            .setInteractive()
            .on('pointerdown', () => {
                const anyEnabled = logger.getCategories().some(c => c.enabled);
                if (anyEnabled) {
                    logger.disableAllCategories();
                    logger.setCategory(LogCategory.GENERAL, true); // Keep general enabled to see the message
                    logger.info(LogCategory.GENERAL, 'All logs disabled');
                } else {
                    logger.enableAllCategories();
                    logger.info(LogCategory.GENERAL, 'All logs enabled');
                }
            });
    }

    /**
     * Logs a random message for demo purposes
     */
    private logRandomMessage() {
        const categories = Object.values(LogCategory);
        const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
        
        const randomCategory = categories[Math.floor(Math.random() * categories.length)] as LogCategory;
        const randomLevel = levels[Math.floor(Math.random() * levels.length)];
        
        const messages = [
            'Player moved to position',
            'Monster spawned',
            'Item dropped',
            'Skill activated',
            'Damage calculated',
            'Experience gained',
            'Level up available',
            'Map area discovered',
            'Quest updated',
            'NPC interaction'
        ];
        
        const randomMessage = messages[Math.floor(Math.random() * messages.length)];
        
        // Generate some random data
        const data = {
            timestamp: new Date().toISOString(),
            value: Math.floor(Math.random() * 100),
            position: {
                x: Math.floor(Math.random() * 1000),
                y: Math.floor(Math.random() * 1000)
            }
        };
        
        // Log the message with the random level
        switch (randomLevel) {
            case LogLevel.DEBUG:
                logger.debug(randomCategory, randomMessage, data);
                break;
            case LogLevel.INFO:
                logger.info(randomCategory, randomMessage, data);
                break;
            case LogLevel.WARN:
                logger.warn(randomCategory, randomMessage, data);
                break;
            case LogLevel.ERROR:
                logger.error(randomCategory, randomMessage, data);
                break;
        }
    }
} 