/**
 * This script provides debugging utilities for the MedievalVitals UI
 * 
 * Usage: Call the debug functions from the browser console
 */

/**
 * Creates a simple test container to verify that DOM elements can be created and styled
 */
export function testDOMCreation() {
    // Create a test container
    const testContainer = document.createElement('div');
    testContainer.id = 'test-container';
    testContainer.style.position = 'fixed';
    testContainer.style.bottom = '10px';
    testContainer.style.left = '10px';
    testContainer.style.width = '350px';
    testContainer.style.padding = '10px';
    testContainer.style.zIndex = '1000';
    testContainer.style.backgroundColor = '#2a1a0a';
    testContainer.style.color = '#e8d4b9';
    testContainer.style.border = '3px solid #8b5a2b';
    testContainer.style.borderRadius = '8px';
    
    // Add some content
    testContainer.innerHTML = `
        <h3 style="color: #f0c070; text-align: center;">Test Container</h3>
        <div style="margin-bottom: 10px;">This is a test container to verify that DOM elements can be created and styled.</div>
        <div style="height: 10px; background-color: rgba(0, 0, 0, 0.4); border-radius: 4px; overflow: hidden;">
            <div style="height: 100%; width: 70%; background-color: #27ae60;"></div>
        </div>
    `;
    
    // Add to DOM
    document.body.appendChild(testContainer);
    
    console.log('Test container created. Check the bottom left of the screen.');
    
    // Return a function to remove the test container
    return () => {
        if (testContainer.parentNode) {
            testContainer.parentNode.removeChild(testContainer);
            console.log('Test container removed.');
        }
    };
}

/**
 * Checks if the CSS files are loaded
 */
export function checkCSSLoaded() {
    const cssFiles = ['/styles/popups.css', '/styles/medieval-vitals.css'];
    const loadedFiles: string[] = [];
    
    // Check all link elements in the document
    const links = document.querySelectorAll('link[rel="stylesheet"]');
    links.forEach(link => {
        const href = link.getAttribute('href');
        if (href && cssFiles.includes(href)) {
            loadedFiles.push(href);
        }
    });
    
    console.log('CSS files loaded:', loadedFiles);
    console.log('Missing CSS files:', cssFiles.filter(file => !loadedFiles.includes(file)));
    
    return loadedFiles.length === cssFiles.length;
}

/**
 * Manually loads the CSS files
 */
export function loadCSS() {
    const cssFiles = ['/styles/popups.css', '/styles/medieval-vitals.css'];
    
    cssFiles.forEach(cssPath => {
        // Check if this CSS file has already been loaded
        const links = document.querySelectorAll('link[rel="stylesheet"]');
        let isLoaded = false;
        
        links.forEach(link => {
            const href = link.getAttribute('href');
            if (href === cssPath) {
                isLoaded = true;
            }
        });
        
        if (!isLoaded) {
            // Create a link element for the CSS file
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.type = 'text/css';
            link.href = cssPath;
            
            // Add to document head
            document.head.appendChild(link);
            
            console.log(`Loaded CSS file: ${cssPath}`);
        } else {
            console.log(`CSS file already loaded: ${cssPath}`);
        }
    });
}

/**
 * Creates a manual vitals UI container
 */
export function createManualVitals() {
    // First, load the CSS
    loadCSS();
    
    // Create the container
    const container = document.createElement('div');
    container.className = 'custom-popup vitals-container';
    container.style.position = 'fixed';
    container.style.bottom = '10px';
    container.style.left = '10px';
    container.style.width = '350px';
    container.style.padding = '10px';
    container.style.zIndex = '1000';
    
    // Add a title
    const title = document.createElement('h3');
    title.textContent = 'Character Vitals';
    container.appendChild(title);
    
    // Create health bar
    const healthRow = document.createElement('div');
    healthRow.className = 'stat-row';
    
    const healthLabel = document.createElement('div');
    healthLabel.className = 'stat-label';
    healthLabel.textContent = 'Health';
    
    const healthValue = document.createElement('div');
    healthValue.className = 'stat-value';
    healthValue.textContent = '100/100';
    
    healthRow.appendChild(healthLabel);
    healthRow.appendChild(healthValue);
    
    const healthBar = document.createElement('div');
    healthBar.className = 'progress-bar';
    
    const healthFill = document.createElement('div');
    healthFill.className = 'progress-fill health';
    healthFill.style.width = '100%';
    
    healthBar.appendChild(healthFill);
    
    container.appendChild(healthRow);
    container.appendChild(healthBar);
    
    // Add to DOM
    document.body.appendChild(container);
    
    console.log('Manual vitals UI created. Check the bottom left of the screen.');
    
    // Return a function to remove the container
    return () => {
        if (container.parentNode) {
            container.parentNode.removeChild(container);
            console.log('Manual vitals UI removed.');
        }
    };
}

// Add the functions to the window object for easy access from the console
(window as any).testDOMCreation = testDOMCreation;
(window as any).checkCSSLoaded = checkCSSLoaded;
(window as any).loadCSS = loadCSS;
(window as any).createManualVitals = createManualVitals; 