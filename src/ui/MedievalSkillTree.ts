import type { Scene } from 'phaser';
import { DOMUIHelper } from './DOMUIHelper';
import { getHighestTier } from '../systems/skills/SkillData';

// Define types for skill data
interface Skill {
    id: string;
    name: string;
    description: string;
    levels: SkillLevel[];
    prerequisites?: string[];
    tier: number;
    category: SkillCategory;
    specialization?: string;
    isExpertise?: boolean;
    expertiseLevel?: number;
    expertisePath?: string;
}

interface SkillLevel {
    level: number;
    cost: number;
    effects: string[];
    unlocks?: string[];
}

// Skill categories based on the documentation
enum SkillCategory {
    Combat = 'Combat',
    Crafting = 'Crafting',
    Knowledge = 'Knowledge',
    ClassSpecific = 'Class-Specific',
    Other = 'Other'
}

// Player's skill data
interface PlayerSkills {
    skillPoints: number;
    unlockedSkills: Map<string, number>; // skill id -> current level
    specialization: string | null;
    expertisePath?: string;
}

/**
 * MedievalSkillTree - A medieval-themed HTML/CSS overlay for skill tree
 * This class creates DOM elements for displaying and interacting with skills
 * styled to match a medieval fantasy theme
 */
export class MedievalSkillTree {
    private scene: Scene;
    private uiHelper: DOMUIHelper;
    private container: HTMLDivElement;
    private skillTreeContainer: HTMLDivElement;
    private skillDetailsPanel: HTMLDivElement;
    private skillPointsDisplay: HTMLDivElement;
    private categoryFilters: HTMLDivElement;
    private searchInput: HTMLInputElement;
    
    private skills: Skill[] = [];
    private playerSkills: PlayerSkills = {
        skillPoints: 0,
        unlockedSkills: new Map(),
        specialization: null
    };
    
    private selectedSkill: Skill | null = null;
    private activeCategory: SkillCategory | 'All' = 'All';
    
    constructor(scene: Scene) {
        this.scene = scene;
        this.uiHelper = new DOMUIHelper(scene);
        
        // Load the CSS files
        this.uiHelper.loadCSS('/styles/popups.css');
        this.uiHelper.loadCSS('/styles/medieval-vitals.css');
        this.uiHelper.loadCSS('/styles/medieval-skill-tree.css');
        
        // Add global scrollbar styles
        this.addGlobalScrollbarStyles();
        
        // Add direct CSS styles to ensure they're applied
        this.addDirectStyles();
        
        // Create the main container
        this.createContainer();
        
        // Create UI elements
        this.createSkillPointsDisplay();
        this.createCategoryFilters();
        this.createSearchInput();
        this.createSkillTreeContainer();
        this.createSkillDetailsPanel();
    }
    
    /**
     * Adds global scrollbar styles to the document
     */
    private addGlobalScrollbarStyles(): void {
        const styleElement = document.createElement('style');
        styleElement.textContent = `
            /* Global scrollbar styles */
            * {
                scrollbar-width: thin;
                scrollbar-color: #8b5a2b #2a1a0a;
            }
            
            /* WebKit browsers (Chrome, Safari, etc.) */
            ::-webkit-scrollbar {
                width: 8px;
                height: 8px;
            }
            
            ::-webkit-scrollbar-track {
                background: #2a1a0a;
                border-radius: 4px;
            }
            
            ::-webkit-scrollbar-thumb {
                background: #8b5a2b;
                border-radius: 4px;
            }
            
            ::-webkit-scrollbar-thumb:hover {
                background: #c8a165;
            }
            
            ::-webkit-scrollbar-corner {
                background: #2a1a0a;
            }
        `;
        document.head.appendChild(styleElement);
    }
    
    /**
     * Adds direct CSS styles to the document head
     */
    private addDirectStyles(): void {
        const styleTag = document.createElement('style');
        styleTag.textContent = `
            .skill-tree-container {
                position: fixed !important;
                top: 50% !important;
                left: 50% !important;
                transform: translate(-50%, -50%) !important;
                width: 90% !important;
                height: 80% !important;
                background: #2a2018 !important;
                color: #e8d4b9 !important;
                border: 2px solid #c8a165 !important;
                z-index: 99999 !important;
                display: flex !important;
                flex-direction: column !important;
                visibility: visible !important;
                opacity: 1 !important;
            }
            
            /* Hide the skill tree initially */
            .skill-tree-container.hidden {
                display: none !important;
            }
        `;
        document.head.appendChild(styleTag);
    }
    
    /**
     * Creates the main container
     */
    private createContainer(): void {
        // Create the container
        this.container = this.uiHelper.createContainer('skill-tree-container');
        this.container.classList.add('medieval-skill-tree');
        this.container.classList.add('hidden'); // Add hidden class by default
        
        // Add event listeners to prevent clicks from passing through
        const mouseEvents = ['click', 'mousedown', 'mouseup', 'mousemove', 'mouseover', 'mouseout', 'mouseenter', 'mouseleave', 'contextmenu'];
        for (const eventType of mouseEvents) {
            this.container.addEventListener(eventType, (event) => {
                event.stopPropagation();
                event.preventDefault();
            });
        }
        
        // Style the container
        Object.assign(this.container.style, {
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '90%',
            maxWidth: '1200px',
            height: '85%',
            maxHeight: '800px',
            background: '#2a2018', // Medieval theme dark background
            color: '#e8d4b9',
            borderRadius: '8px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.8), inset 0 0 15px rgba(200, 161, 101, 0.3)',
            border: '2px solid #c8a165', // Medieval theme gold border
            padding: '15px',
            zIndex: '9999', // High z-index to ensure visibility
            fontFamily: 'Cinzel, Times New Roman, serif',
            display: 'none', // Start hidden
            flexDirection: 'column',
            overflow: 'hidden'
        });
        
        document.body.appendChild(this.container);
        
        // Add a header with title
        const header = this.uiHelper.createElement<HTMLDivElement>('div', 'skill-tree-header');
        
        // Style the header
        Object.assign(header.style, {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '10px 15px',
            borderBottom: '2px solid #8b5a2b',
            marginBottom: '10px'
        });
        
        const title = this.uiHelper.createElement<HTMLDivElement>('div', 'skill-tree-title');
        title.textContent = 'Skills & Abilities';
        
        // Style the title
        Object.assign(title.style, {
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#f0c070',
            textShadow: '1px 1px 2px rgba(0, 0, 0, 0.7)'
        });
        
        const closeButton = this.uiHelper.createElement<HTMLButtonElement>('button', 'close-button');
        closeButton.textContent = '×';
        
        // Style the close button
        Object.assign(closeButton.style, {
            background: 'none',
            border: 'none',
            color: '#e8d4b9',
            fontSize: '24px',
            cursor: 'pointer',
            padding: '0 5px'
        });
        
        closeButton.addEventListener('click', (event) => {
            event.stopPropagation();
            event.preventDefault();
            this.hide();
        });
        
        header.appendChild(title);
        header.appendChild(closeButton);
        this.container.appendChild(header);
    }
    
    /**
     * Creates the skill points display
     */
    private createSkillPointsDisplay(): void {
        const skillPointsRow = this.uiHelper.createElement<HTMLDivElement>('div', 'skill-points-row');
        
        // Style the skill points row
        Object.assign(skillPointsRow.style, {
            display: 'flex',
            alignItems: 'center',
            padding: '5px 15px',
            marginBottom: '10px',
            background: 'rgba(0, 0, 0, 0.2)',
            borderRadius: '4px'
        });
        
        const skillPointsLabel = this.uiHelper.createElement<HTMLDivElement>('div', 'skill-points-label');
        skillPointsLabel.textContent = 'Available Skill Points:';
        
        // Style the skill points label
        Object.assign(skillPointsLabel.style, {
            fontWeight: 'bold',
            color: '#f0c070',
            marginRight: '10px'
        });
        
        this.skillPointsDisplay = this.uiHelper.createElement<HTMLDivElement>('div', 'skill-points-value');
        this.skillPointsDisplay.textContent = '0';
        
        // Style the skill points value
        Object.assign(this.skillPointsDisplay.style, {
            fontSize: '18px',
            color: '#e8d4b9',
            fontWeight: 'bold'
        });
        
        skillPointsRow.appendChild(skillPointsLabel);
        skillPointsRow.appendChild(this.skillPointsDisplay);
        this.container.appendChild(skillPointsRow);
    }
    
    /**
     * Creates category filter buttons
     */
    private createCategoryFilters(): void {
        this.categoryFilters = this.uiHelper.createElement<HTMLDivElement>('div', 'category-filters');
        
        // Style the category filters container
        Object.assign(this.categoryFilters.style, {
            display: 'flex',
            flexWrap: 'wrap',
            gap: '5px',
            padding: '5px 15px',
            marginBottom: '10px'
        });
        
        // Create "All" filter
        this.createFilterButton('All', true);
        
        // Create category filters
        for (const category of Object.values(SkillCategory)) {
            this.createFilterButton(category);
        }
        
        this.container.appendChild(this.categoryFilters);
    }
    
    /**
     * Creates a single filter button
     */
    private createFilterButton(category: string, isActive = false): void {
        const button = this.uiHelper.createElement<HTMLButtonElement>('button', `filter-button ${isActive ? 'active' : ''}`);
        button.textContent = category;
        
        // Style the button
        Object.assign(button.style, {
            background: isActive ? '#8b5a2b' : '#3c2815',
            border: '1px solid #8b5a2b',
            color: isActive ? '#fff' : '#e8d4b9',
            padding: '5px 10px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontFamily: 'Cinzel, Times New Roman, serif',
            transition: 'all 0.2s ease'
        });
        
        button.addEventListener('click', (event) => {
            event.stopPropagation();
            event.preventDefault();
            
            // Remove active class from all buttons
            const buttons = this.categoryFilters.querySelectorAll('.filter-button');
            for (const btn of buttons) {
                btn.classList.remove('active');
            }
            
            // Add active class to this button
            button.classList.add('active');
            
            // Update active category and filter skills
            this.activeCategory = category === 'All' ? 'All' : category as SkillCategory;
            this.filterSkills();
        });
        
        this.categoryFilters.appendChild(button);
    }
    
    /**
     * Creates search input for skills
     */
    private createSearchInput(): void {
        const searchContainer = this.uiHelper.createElement<HTMLDivElement>('div', 'search-container');
        
        // Style the search container
        Object.assign(searchContainer.style, {
            padding: '5px 15px',
            marginBottom: '10px'
        });
        
        this.searchInput = this.uiHelper.createElement<HTMLInputElement>('input', 'search-input');
        this.searchInput.type = 'text';
        this.searchInput.placeholder = 'Search skills...';
        
        // Style the search input
        Object.assign(this.searchInput.style, {
            width: '100%',
            padding: '8px 12px',
            background: '#3c2815',
            border: '1px solid #8b5a2b',
            borderRadius: '4px',
            color: '#e8d4b9',
            fontFamily: 'Cinzel, Times New Roman, serif'
        });
        
        this.searchInput.addEventListener('input', (event) => {
            event.stopPropagation();
            this.filterSkills();
        });
        
        searchContainer.appendChild(this.searchInput);
        this.container.appendChild(searchContainer);
    }
    
    /**
     * Creates the skill tree container
     */
    private createSkillTreeContainer(): void {
        const contentContainer = this.uiHelper.createElement<HTMLDivElement>('div', 'content-container');
        
        // Style the content container
        Object.assign(contentContainer.style, {
            display: 'flex',
            flex: '1',
            overflow: 'hidden',
            margin: '0 0 0 0',
            border: '1px solid #8b5a2b',
            borderRadius: '4px'
        });
        
        this.skillTreeContainer = this.uiHelper.createElement<HTMLDivElement>('div', 'skill-tree');
        
        // Style the skill tree
        Object.assign(this.skillTreeContainer.style, {
            flex: '1',
            overflow: 'hidden',
            padding: '0',
            background: 'rgba(0, 0, 0, 0.2)'
        });
        
        contentContainer.appendChild(this.skillTreeContainer);
        
        this.container.appendChild(contentContainer);
        
        // Add resize event listener to handle responsive adjustments
        window.addEventListener('resize', this.handleResize.bind(this));
    }
    
    /**
     * Handle window resize events to adjust the skill tree layout
     */
    private handleResize(): void {
        if (!this.container || this.container.style.display === 'none') return;
        
        const isMobile = window.innerWidth <= 768;
        const isSmallMobile = window.innerWidth <= 480;
        
        // Adjust the tree structure padding
        const treeStructure = document.querySelector('.skill-tree-structure') as HTMLDivElement;
        if (treeStructure) {
            treeStructure.style.padding = isSmallMobile ? '15px' : '30px';
        }
        
        // Adjust tier groups for better mobile layout
        const tierGroups = document.querySelectorAll('.tier-group') as NodeListOf<HTMLDivElement>;
        for (const tierGroup of tierGroups) {
            // Find the skills container within this tier group
            const skillsContainer = tierGroup.querySelector('.skills-container') as HTMLDivElement;
            if (skillsContainer) {
                if (isSmallMobile) {
                    // For very small screens, use flexbox with space-between
                    Object.assign(skillsContainer.style, {
                        display: 'flex',
                        flexWrap: 'wrap',
                        justifyContent: 'space-between',
                        gap: '8px'
                    });
                } else if (isMobile) {
                    // For tablets, use flexbox with center alignment
                    Object.assign(skillsContainer.style, {
                        display: 'flex',
                        flexWrap: 'wrap',
                        justifyContent: 'center',
                        gap: '8px'
                    });
                } else {
                    // For desktop, use flexbox with center alignment
                    Object.assign(skillsContainer.style, {
                        display: 'flex',
                        flexWrap: 'wrap',
                        justifyContent: 'center',
                        gap: '10px'
                    });
                }
            }
            
            // Adjust skill nodes
            const skillNodes = tierGroup.querySelectorAll('.skill-node') as NodeListOf<HTMLDivElement>;
            for (const node of skillNodes) {
                if (isSmallMobile) {
                    // For mobile, make nodes take up exactly 50% of the width minus gap
                    Object.assign(node.style, {
                        width: 'calc(50% - 10px)',
                        height: '0',
                        paddingBottom: 'calc(50% - 10px)',
                        margin: '0 0 10px 0',
                        position: 'relative'
                    });
                    
                    // Adjust the content inside the node
                    const children = node.children;
                    for (let i = 0; i < children.length; i++) {
                        const child = children[i] as HTMLElement;
                        Object.assign(child.style, {
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: '90%',
                            textAlign: 'center'
                        });
                    }
                } else if (isMobile) {
                    // For tablets, use fixed size
                    Object.assign(node.style, {
                        width: '120px',
                        height: '120px',
                        paddingBottom: 'initial',
                        margin: '5px',
                        position: 'relative'
                    });
                    
                    // Reset any absolute positioning on children
                    const children = node.children;
                    for (let i = 0; i < children.length; i++) {
                        const child = children[i] as HTMLElement;
                        Object.assign(child.style, {
                            position: '',
                            top: '',
                            left: '',
                            transform: '',
                            width: '',
                            textAlign: ''
                        });
                    }
                } else {
                    // For desktop, use fixed size
                    Object.assign(node.style, {
                        width: '130px',
                        height: '130px',
                        paddingBottom: 'initial',
                        margin: '5px',
                        position: 'relative'
                    });
                    
                    // Reset any absolute positioning on children
                    const children = node.children;
                    for (let i = 0; i < children.length; i++) {
                        const child = children[i] as HTMLElement;
                        Object.assign(child.style, {
                            position: '',
                            top: '',
                            left: '',
                            transform: '',
                            width: '',
                            textAlign: ''
                        });
                    }
                }
            }
        }
    }
    
    /**
     * Creates the skill details panel
     */
    private createSkillDetailsPanel(): void {
        this.skillDetailsPanel = this.uiHelper.createElement<HTMLDivElement>('div', 'skill-details-panel');
        
        // Style the skill details panel
        Object.assign(this.skillDetailsPanel.style, {
            width: '350px', // Increased from 300px
            background: '#3c2815',
            padding: '15px',
            overflowY: 'auto',
            borderLeft: '1px solid #8b5a2b',
            // Custom scrollbar styling
            scrollbarWidth: 'thin',
            scrollbarColor: '#8b5a2b #2a1a0a'
        });
        
        // Add custom scrollbar styling for webkit browsers
        const scrollbarStyle = document.createElement('style');
        scrollbarStyle.textContent = `
            .skill-details-panel::-webkit-scrollbar {
                width: 8px;
            }
            .skill-details-panel::-webkit-scrollbar-track {
                background: #2a1a0a;
                border-radius: 4px;
            }
            .skill-details-panel::-webkit-scrollbar-thumb {
                background: #8b5a2b;
                border-radius: 4px;
            }
            .skill-details-panel::-webkit-scrollbar-thumb:hover {
                background: #c8a165;
            }
        `;
        this.skillDetailsPanel.appendChild(scrollbarStyle);
        
        // Default content when no skill is selected
        const defaultContent = this.uiHelper.createElement<HTMLDivElement>('div', 'default-content');
        defaultContent.textContent = 'Select a skill to view details';
        
        // Style the default content
        Object.assign(defaultContent.style, {
            color: '#a89078',
            fontStyle: 'italic',
            textAlign: 'center',
            marginTop: '50px',
            fontSize: '16px'
        });
        
        this.skillDetailsPanel.appendChild(defaultContent);
        
        const contentContainer = this.container.querySelector('.content-container');
        if (contentContainer) {
            contentContainer.appendChild(this.skillDetailsPanel);
        }
    }
    
    /**
     * Filters skills based on active category and search input
     */
    private filterSkills(): void {
        const searchTerm = this.searchInput.value.toLowerCase();
        
        // Clear the skill tree container
        this.skillTreeContainer.innerHTML = '';
        
        // Create a tree structure instead of a grid
        const treeContainer = this.uiHelper.createElement<HTMLDivElement>('div', 'skill-tree-structure');
        Object.assign(treeContainer.style, {
            position: 'relative',
            width: '100%',
            height: '100%',
            padding: window.innerWidth <= 480 ? '15px' : '30px',
            overflowX: 'auto',
            overflowY: 'auto'
        });
        
        // Group skills by tier
        const tierGroups = new Map<number, Skill[]>();
        
        // First, collect all skills that match the filters
        const filteredSkills: Skill[] = [];
        for (const skill of this.skills) {
            // Filter by category if not "All"
            if (this.activeCategory !== 'All' && skill.category !== this.activeCategory) {
                continue;
            }
            
            // Filter by search term
            if (searchTerm && !skill.name.toLowerCase().includes(searchTerm) && 
                !skill.description.toLowerCase().includes(searchTerm)) {
                continue;
            }
            
            filteredSkills.push(skill);
            
            // Add to tier group
            if (!tierGroups.has(skill.tier)) {
                tierGroups.set(skill.tier, []);
            }
            tierGroups.get(skill.tier)?.push(skill);
        }
        
        // Get the highest tier from SkillData
        const highestTier = getHighestTier();
        
        // Create empty tier groups for any missing tiers up to the highest tier
        for (let tier = 1; tier <= highestTier; tier++) {
            if (!tierGroups.has(tier)) {
                tierGroups.set(tier, []);
            }
        }
        
        // Sort tiers
        const sortedTiers = Array.from(tierGroups.keys()).sort((a, b) => a - b);
        
        // Create a map to store skill elements by ID for drawing connections later
        const skillElementsById = new Map<string, HTMLDivElement>();
        
        // Calculate the highest tier the player has unlocked
        let highestUnlockedTier = 1;
        for (const [skillId, level] of this.playerSkills.unlockedSkills.entries()) {
            if (level > 0) {
                const skill = this.skills.find(s => s.id === skillId);
                if (skill && skill.tier > highestUnlockedTier) {
                    highestUnlockedTier = skill.tier;
                }
            }
        }
        
        // Create tier groups
        for (const tier of sortedTiers) {
            const tierSkills = tierGroups.get(tier) || [];
            
            const tierGroup = this.createTierGroup(tier, tier > highestUnlockedTier + 1);
            
            // Create skills container with responsive grid
            const skillsContainer = this.uiHelper.createElement<HTMLDivElement>('div', 'skills-container');
            
            // Set layout based on screen size
            const isMobile = window.innerWidth <= 768;
            const isSmallMobile = window.innerWidth <= 480;
            
            if (isSmallMobile) {
                // For very small screens, use flexbox with space-between
                Object.assign(skillsContainer.style, {
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    gap: '8px'
                });
            } else if (isMobile) {
                // For tablets, use flexbox with center alignment
                Object.assign(skillsContainer.style, {
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                    gap: '8px'
                });
            } else {
                // For desktop, use flexbox with center alignment
                Object.assign(skillsContainer.style, {
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                    gap: '10px'
                });
            }
            
            // Add skills to container
            for (const skill of tierSkills) {
                const skillElement = this.createSkillNodeElement(skill);
                skillsContainer.appendChild(skillElement);
                
                // Store reference for drawing connections
                skillElementsById.set(skill.id, skillElement);
                
                // Add click handler
                skillElement.addEventListener('click', (event) => {
                    event.stopPropagation();
                    event.preventDefault();
                    this.selectSkill(skill);
                });
            }
            
            tierGroup.appendChild(skillsContainer);
            treeContainer.appendChild(tierGroup);
        }
        
        // Draw connections between skills
        this.drawSkillConnections(treeContainer, skillElementsById);
        
        this.skillTreeContainer.appendChild(treeContainer);
        
        // Update the selected skill details if there is one
        if (this.selectedSkill) {
            this.updateSkillDetailsPanel();
        }
    }
    
    /**
     * Creates a tier group with a visual separator
     */
    private createTierGroup(tier: number, isLocked: boolean): HTMLDivElement {
        const tierGroup = this.uiHelper.createElement<HTMLDivElement>('div', 'tier-group');
        tierGroup.dataset.tier = tier.toString();
        
        // Create tier header
        const tierHeader = this.uiHelper.createElement<HTMLDivElement>('div', 'tier-header');
        tierHeader.textContent = `Tier ${tier}`;
        
        // Add locked indicator if tier is locked
        if (isLocked) {
            tierHeader.textContent += ' (Locked)';
            tierHeader.style.color = '#a89078';
        }
        
        tierGroup.appendChild(tierHeader);
        
        return tierGroup;
    }
    
    /**
     * Creates a skill node element for the tree view
     */
    private createSkillNodeElement(skill: Skill): HTMLDivElement {
        const currentLevel = this.playerSkills.unlockedSkills.get(skill.id) || 0;
        const canUnlock = this.canUnlockSkill(skill);
        
        const skillNode = this.uiHelper.createElement<HTMLDivElement>('div', 'skill-node');
        skillNode.dataset.id = skill.id;
        
        // Determine styling based on screen size
        const isMobile = window.innerWidth <= 768;
        const isSmallMobile = window.innerWidth <= 480;
        
        // Set base styles for the skill node
        if (isSmallMobile) {
            // For mobile, use percentage-based sizing
            Object.assign(skillNode.style, {
                width: 'calc(50% - 10px)',
                height: '0',
                paddingBottom: 'calc(50% - 10px)',
                borderRadius: '50%',
                margin: '0 0 10px 0',
                position: 'relative',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxSizing: 'border-box'
            });
        } else {
            // For tablet and desktop, use fixed sizing
            const nodeSize = isMobile ? '120px' : '130px';
            Object.assign(skillNode.style, {
                width: nodeSize,
                height: nodeSize,
                borderRadius: '50%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '10px',
                cursor: 'pointer',
                position: 'relative',
                transition: 'all 0.3s ease',
                textAlign: 'center',
                boxSizing: 'border-box',
                margin: '5px'
            });
        }
        
        // Apply different styles based on skill status and type
        if (skill.isExpertise) {
            // Expertise skills have a special appearance
            if (currentLevel > 0) {
                // Unlocked expertise
                Object.assign(skillNode.style, {
                    background: 'radial-gradient(circle, #9370db 0%, #663399 100%)',
                    border: '3px solid #b19cd9',
                    boxShadow: '0 0 15px rgba(147, 112, 219, 0.7)'
                });
            } else if (canUnlock) {
                // Available expertise
                Object.assign(skillNode.style, {
                    background: 'radial-gradient(circle, #7851a9 0%, #4b2882 100%)',
                    border: '3px solid #9370db',
                    boxShadow: '0 0 10px rgba(147, 112, 219, 0.4)'
                });
            } else {
                // Locked expertise
                Object.assign(skillNode.style, {
                    background: 'radial-gradient(circle, #4b2882 0%, #2a1758 100%)',
                    border: '3px solid #4b2882',
                    opacity: '0.7'
                });
            }
        } else {
            // Regular skills
            if (currentLevel > 0) {
                // Unlocked skill
                Object.assign(skillNode.style, {
                    background: 'radial-gradient(circle, #6b8e23 0%, #556b2f 100%)',
                    border: '3px solid #8fbc8f',
                    boxShadow: '0 0 10px rgba(107, 142, 35, 0.5)'
                });
            } else if (canUnlock) {
                // Available skill
                Object.assign(skillNode.style, {
                    background: 'radial-gradient(circle, #5d3c1e 0%, #3c2815 100%)',
                    border: '3px solid #c8a165',
                    boxShadow: '0 0 10px rgba(200, 161, 101, 0.3)'
                });
            } else {
                // Locked skill
                Object.assign(skillNode.style, {
                    background: 'radial-gradient(circle, #3c2815 0%, #2a1a0a 100%)',
                    border: '3px solid #5d3c1e',
                    opacity: '0.7'
                });
            }
        }
        
        // Create content container for mobile layout
        const contentContainer = this.uiHelper.createElement<HTMLDivElement>('div', 'skill-content');
        
        if (isSmallMobile) {
            // For mobile, position content absolutely
            Object.assign(contentContainer.style, {
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '90%',
                textAlign: 'center'
            });
        } else {
            // For tablet and desktop, use flex layout
            Object.assign(contentContainer.style, {
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                height: '100%'
            });
        }
        
        // Add skill name
        const skillName = this.uiHelper.createElement<HTMLDivElement>('div', 'skill-name');
        skillName.textContent = skill.name;
        Object.assign(skillName.style, {
            fontWeight: 'bold',
            fontSize: isSmallMobile ? '12px' : '15px',
            color: '#ffffff',
            textShadow: '1px 1px 2px rgba(0, 0, 0, 0.7)',
            marginBottom: '5px'
        });
        
        // Add skill level indicator
        const skillLevel = this.uiHelper.createElement<HTMLDivElement>('div', 'skill-level');
        
        // Special text for expertise skills
        if (skill.isExpertise) {
            skillLevel.textContent = currentLevel > 0 ? 
                `Expertise ${skill.expertiseLevel}` : 
                'Expertise';
        } else {
            skillLevel.textContent = currentLevel > 0 ? 
                `Level ${currentLevel}/${skill.levels.length}` : 
                'Locked';
        }
        
        Object.assign(skillLevel.style, {
            fontSize: isSmallMobile ? '10px' : '12px',
            color: currentLevel > 0 ? '#ffffff' : '#a89078'
        });
        
        // Add elements to the content container
        contentContainer.appendChild(skillName);
        contentContainer.appendChild(skillLevel);
        
        // Add content container to the skill node
        skillNode.appendChild(contentContainer);
        
        return skillNode;
    }
    
    /**
     * Draws connection lines between skills based on prerequisites
     */
    private drawSkillConnections(container: HTMLDivElement, skillElementsById: Map<string, HTMLDivElement>): void {
        // Create an SVG element for drawing connections
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        Object.assign(svg.style, {
            position: 'absolute',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: '1'
        });
        container.appendChild(svg);
        
        // Draw connections for each skill with prerequisites
        for (const skill of this.skills) {
            if (!skill.prerequisites || skill.prerequisites.length === 0) continue;
            
            const targetElement = skillElementsById.get(skill.id);
            if (!targetElement) continue;
            
            for (const prereq of skill.prerequisites) {
                // Parse prerequisite format (skillId:level)
                const [prereqId, prereqLevel] = prereq.split(':');
                
                const sourceElement = skillElementsById.get(prereqId);
                if (!sourceElement) continue;
                
                // Get positions of elements
                const sourceRect = sourceElement.getBoundingClientRect();
                const targetRect = targetElement.getBoundingClientRect();
                
                // Get container position for offset calculation
                const containerRect = container.getBoundingClientRect();
                
                // Calculate center points relative to the container
                const sourceX = (sourceRect.left + sourceRect.width / 2) - containerRect.left;
                const sourceY = (sourceRect.top + sourceRect.height / 2) - containerRect.top;
                const targetX = (targetRect.left + targetRect.width / 2) - containerRect.left;
                const targetY = (targetRect.top + targetRect.height / 2) - containerRect.top;
                
                // Create path element
                const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                
                // Determine if this is an expertise path connection
                const sourceSkill = this.skills.find(s => s.id === prereqId);
                const isExpertisePath = sourceSkill?.isExpertise && skill.isExpertise && 
                                       sourceSkill.expertisePath === skill.expertisePath;
                
                // Set path attributes
                path.setAttribute('fill', 'none');
                path.setAttribute('stroke', isExpertisePath ? '#9370db' : '#8b5a2b');
                path.setAttribute('stroke-width', isExpertisePath ? '3' : '2');
                path.setAttribute('stroke-dasharray', isExpertisePath ? 'none' : '5,3');
                
                // Create a curved path between the two points
                // Calculate control points for a nice curve
                const dx = targetX - sourceX;
                const dy = targetY - sourceY;
                const midX = sourceX + dx / 2;
                const midY = sourceY + dy / 2;
                
                // Adjust curve based on relative positions
                let controlX1: number;
                let controlY1: number;
                let controlX2: number;
                let controlY2: number;

                if (Math.abs(dy) > Math.abs(dx) * 2) {
                    // Mostly vertical connection
                    controlX1 = sourceX;
                    controlY1 = sourceY + dy / 3;
                    controlX2 = targetX;
                    controlY2 = targetY - dy / 3;
                } else {
                    // More horizontal or diagonal connection
                    controlX1 = sourceX + dx / 3;
                    controlY1 = sourceY;
                    controlX2 = targetX - dx / 3;
                    controlY2 = targetY;
                }
                
                // Create the path data
                const pathData = `M ${sourceX} ${sourceY} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${targetX} ${targetY}`;
                path.setAttribute('d', pathData);
                
                // Add path to SVG
                svg.appendChild(path);
                
                // Add arrow at the end of the path
                const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                
                // Calculate the angle of the line at the target point
                const angle = Math.atan2(targetY - controlY2, targetX - controlX2);
                
                // Calculate arrow points
                const arrowSize = 8;
                const arrowX1 = targetX - arrowSize * Math.cos(angle - Math.PI / 6);
                const arrowY1 = targetY - arrowSize * Math.sin(angle - Math.PI / 6);
                const arrowX2 = targetX - arrowSize * Math.cos(angle + Math.PI / 6);
                const arrowY2 = targetY - arrowSize * Math.sin(angle + Math.PI / 6);
                
                arrow.setAttribute('points', `${targetX},${targetY} ${arrowX1},${arrowY1} ${arrowX2},${arrowY2}`);
                arrow.setAttribute('fill', isExpertisePath ? '#9370db' : '#8b5a2b');
                
                svg.appendChild(arrow);
            }
        }
    }
    
    /**
     * Selects a skill and shows its details
     */
    private selectSkill(skill: Skill): void {
        this.selectedSkill = skill;
        this.updateSkillDetailsPanel();
        
        // Remove selected styling from all skills
        const skillNodes = this.skillTreeContainer.querySelectorAll('.skill-node');
        for (const node of skillNodes) {
            // Remove glow effect
            (node as HTMLDivElement).style.boxShadow = '';
            (node as HTMLDivElement).style.transform = '';
        }
        
        // Add selected styling to clicked skill
        const selectedNode = this.skillTreeContainer.querySelector(`.skill-node[data-id="${skill.id}"]`) as HTMLDivElement;
        if (selectedNode) {
            // Add glow effect and slight scale
            selectedNode.style.boxShadow = '0 0 20px rgba(255, 215, 0, 0.8)';
            selectedNode.style.transform = 'scale(1.1)';
        }
    }
    
    /**
     * Updates the skill details panel with selected skill info
     */
    private updateSkillDetailsPanel(): void {
        // Clear the panel
        this.skillDetailsPanel.innerHTML = '';
        
        if (!this.selectedSkill) {
            const defaultContent = this.uiHelper.createElement<HTMLDivElement>('div', 'default-content');
            defaultContent.textContent = 'Select a skill to view details';
            Object.assign(defaultContent.style, {
                color: '#a89078',
                fontStyle: 'italic',
                textAlign: 'center',
                marginTop: '50px'
            });
            this.skillDetailsPanel.appendChild(defaultContent);
            return;
        }
        
        const skill = this.selectedSkill;
        
        // Skill header with icon
        const skillHeader = this.uiHelper.createElement<HTMLDivElement>('div', 'skill-detail-header');
        Object.assign(skillHeader.style, {
            display: 'flex',
            alignItems: 'center',
            marginBottom: '15px',
            padding: '10px',
            background: 'rgba(0, 0, 0, 0.2)',
            borderRadius: '5px',
            border: '1px solid #8b5a2b'
        });
        
        // Add skill icon/category indicator
        const skillIcon = this.uiHelper.createElement<HTMLDivElement>('div', 'skill-icon');
        Object.assign(skillIcon.style, {
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            marginRight: '10px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            fontSize: '20px',
            fontWeight: 'bold',
            color: '#fff'
        });
        
        // Set icon background based on category
        switch (skill.category) {
            case 'Combat':
                skillIcon.style.background = '#b22222';
                skillIcon.textContent = 'C';
                break;
            case 'Crafting':
                skillIcon.style.background = '#228b22';
                skillIcon.textContent = 'Cr';
                break;
            case 'Knowledge':
                skillIcon.style.background = '#4169e1';
                skillIcon.textContent = 'K';
                break;
            case 'Class-Specific':
                skillIcon.style.background = '#9370db';
                skillIcon.textContent = 'S';
                break;
            default:
                skillIcon.style.background = '#daa520';
                skillIcon.textContent = 'O';
        }
        
        // Skill name and category container
        const nameContainer = this.uiHelper.createElement<HTMLDivElement>('div', 'name-container');
        Object.assign(nameContainer.style, {
            display: 'flex',
            flexDirection: 'column'
        });
        
        const skillName = this.uiHelper.createElement<HTMLDivElement>('div', 'skill-detail-name');
        skillName.textContent = skill.name;
        Object.assign(skillName.style, {
            fontSize: '20px',
            fontWeight: 'bold',
            color: '#f0c070',
            marginBottom: '3px'
        });
        
        const skillCategory = this.uiHelper.createElement<HTMLDivElement>('div', 'skill-detail-category');
        skillCategory.textContent = `${skill.category}${skill.specialization ? ' • Specialization' : ''}`;
        Object.assign(skillCategory.style, {
            fontSize: '14px',
            color: '#a89078'
        });
        
        nameContainer.appendChild(skillName);
        nameContainer.appendChild(skillCategory);
        
        skillHeader.appendChild(skillIcon);
        skillHeader.appendChild(nameContainer);
        this.skillDetailsPanel.appendChild(skillHeader);
        
        // Skill description
        const skillDescription = this.uiHelper.createElement<HTMLDivElement>('div', 'skill-detail-description');
        skillDescription.textContent = skill.description;
        Object.assign(skillDescription.style, {
            marginBottom: '20px',
            lineHeight: '1.5',
            padding: '12px',
            background: 'rgba(0, 0, 0, 0.1)',
            borderRadius: '5px',
            border: '1px solid #5d3c1e',
            fontSize: '15px',
            color: '#e8d4b9'
        });
        this.skillDetailsPanel.appendChild(skillDescription);
        
        // Current level and progress
        const currentLevel = this.playerSkills.unlockedSkills.get(skill.id) || 0;
        const maxLevel = skill.levels.length;
        
        const progressContainer = this.uiHelper.createElement<HTMLDivElement>('div', 'progress-container');
        Object.assign(progressContainer.style, {
            marginBottom: '20px',
            padding: '10px',
            background: 'rgba(0, 0, 0, 0.1)',
            borderRadius: '5px',
            border: '1px solid #5d3c1e'
        });
        
        const levelInfo = this.uiHelper.createElement<HTMLDivElement>('div', 'skill-level-info');
        levelInfo.textContent = `Level: ${currentLevel}/${maxLevel}`;
        Object.assign(levelInfo.style, {
            fontWeight: 'bold',
            marginBottom: '10px',
            color: currentLevel > 0 ? '#6b8e23' : '#a89078'
        });
        progressContainer.appendChild(levelInfo);
        
        // Progress bar
        const progressBar = this.uiHelper.createElement<HTMLDivElement>('div', 'progress-bar');
        Object.assign(progressBar.style, {
            width: '100%',
            height: '10px',
            background: '#2a1a0a',
            borderRadius: '5px',
            overflow: 'hidden',
            marginBottom: '10px'
        });
        
        const progressFill = this.uiHelper.createElement<HTMLDivElement>('div', 'progress-fill');
        const progressPercent = (currentLevel / maxLevel) * 100;
        Object.assign(progressFill.style, {
            width: `${progressPercent}%`,
            height: '100%',
            background: currentLevel > 0 ? '#6b8e23' : '#5d3c1e',
            transition: 'width 0.3s ease'
        });
        progressBar.appendChild(progressFill);
        progressContainer.appendChild(progressBar);
        
        // Prerequisites
        if (skill.prerequisites && skill.prerequisites.length > 0) {
            const prerequisites = this.uiHelper.createElement<HTMLDivElement>('div', 'skill-prerequisites');
            Object.assign(prerequisites.style, {
                marginBottom: '10px'
            });
            
            const prereqTitle = this.uiHelper.createElement<HTMLDivElement>('div', 'prereq-title');
            prereqTitle.textContent = 'Prerequisites:';
            Object.assign(prereqTitle.style, {
                fontWeight: 'bold',
                marginBottom: '5px',
                color: '#f0c070'
            });
            prerequisites.appendChild(prereqTitle);
            
            const prereqList = this.uiHelper.createElement<HTMLUListElement>('ul', 'prereq-list');
            Object.assign(prereqList.style, {
                marginLeft: '20px',
                marginTop: '5px'
            });
            
            for (const prereq of skill.prerequisites) {
                const [prereqId, requiredLevel] = prereq.split(':');
                const prereqSkill = this.skills.find(s => s.id === prereqId);
                if (!prereqSkill) continue;
                
                const playerLevel = this.playerSkills.unlockedSkills.get(prereqId) || 0;
                const isMet = playerLevel >= Number.parseInt(requiredLevel);
                
                const prereqItem = this.uiHelper.createElement<HTMLLIElement>('li', 'prereq-item');
                prereqItem.textContent = `${prereqSkill.name} (Level ${requiredLevel})`;
                Object.assign(prereqItem.style, {
                    color: isMet ? '#6b8e23' : '#a89078',
                    marginBottom: '3px'
                });
                
                // Add status indicator
                if (isMet) {
                    prereqItem.textContent += ' ✓';
                } else {
                    prereqItem.textContent += ' ✗';
                }
                
                prereqList.appendChild(prereqItem);
            }
            
            prerequisites.appendChild(prereqList);
            progressContainer.appendChild(prerequisites);
        }
        
        this.skillDetailsPanel.appendChild(progressContainer);
        
        // Skill levels
        const levelsContainer = this.uiHelper.createElement<HTMLDivElement>('div', 'skill-levels-container');
        Object.assign(levelsContainer.style, {
            marginTop: '20px'
        });
        
        const levelsTitle = this.uiHelper.createElement<HTMLDivElement>('div', 'levels-title');
        levelsTitle.textContent = 'Skill Levels:';
        Object.assign(levelsTitle.style, {
            fontWeight: 'bold',
            marginBottom: '15px',
            color: '#f0c070',
            fontSize: '18px',
            textShadow: '1px 1px 2px rgba(0, 0, 0, 0.7)',
            borderBottom: '1px solid #8b5a2b',
            paddingBottom: '5px'
        });
        levelsContainer.appendChild(levelsTitle);
        
        for (const level of skill.levels) {
            const levelElement = this.uiHelper.createElement<HTMLDivElement>('div', 'skill-level-element');
            Object.assign(levelElement.style, {
                background: currentLevel >= level.level ? 'rgba(107, 142, 35, 0.2)' : 'rgba(0, 0, 0, 0.2)',
                border: `1px solid ${currentLevel >= level.level ? '#6b8e23' : '#5d3c1e'}`,
                borderRadius: '5px',
                padding: '12px',
                marginBottom: '15px',
                boxShadow: currentLevel >= level.level ? '0 0 10px rgba(107, 142, 35, 0.2)' : 'none'
            });
            
            const levelHeader = this.uiHelper.createElement<HTMLDivElement>('div', 'level-header');
            levelHeader.textContent = `Level ${level.level} (Cost: ${level.cost} Skill Point${level.cost > 1 ? 's' : ''})`;
            Object.assign(levelHeader.style, {
                fontWeight: 'bold',
                marginBottom: '10px',
                color: currentLevel >= level.level ? '#6b8e23' : '#f0c070',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '16px',
                textShadow: '1px 1px 1px rgba(0, 0, 0, 0.5)'
            });
            
            // Add status indicator
            const statusIndicator = this.uiHelper.createElement<HTMLSpanElement>('span', 'status');
            if (currentLevel >= level.level) {
                statusIndicator.textContent = '✓ Unlocked';
                statusIndicator.style.color = '#6b8e23';
            } else if (currentLevel === level.level - 1 && this.canUnlockNextLevel(skill)) {
                statusIndicator.textContent = '⚡ Available';
                statusIndicator.style.color = '#f0c070';
            } else {
                statusIndicator.textContent = '🔒 Locked';
                statusIndicator.style.color = '#a89078';
            }
            levelHeader.appendChild(statusIndicator);
            
            levelElement.appendChild(levelHeader);
            
            const effectsList = this.uiHelper.createElement<HTMLUListElement>('ul', 'effects-list');
            Object.assign(effectsList.style, {
                margin: '0 0 10px 20px',
                padding: '0'
            });
            
            for (const effect of level.effects) {
                const effectItem = this.uiHelper.createElement<HTMLLIElement>('li', 'effect-item');
                effectItem.textContent = effect;
                Object.assign(effectItem.style, {
                    marginBottom: '8px',
                    fontSize: '15px',
                    color: currentLevel >= level.level ? '#e8d4b9' : '#a89078',
                    lineHeight: '1.4'
                });
                effectsList.appendChild(effectItem);
            }
            levelElement.appendChild(effectsList);
            
            // Show unlocks if any
            if (level.unlocks && level.unlocks.length > 0) {
                const unlocksContainer = this.uiHelper.createElement<HTMLDivElement>('div', 'unlocks-container');
                Object.assign(unlocksContainer.style, {
                    fontSize: '14px',
                    color: '#a89078',
                    marginTop: '8px',
                    borderTop: '1px solid #5d3c1e',
                    paddingTop: '8px'
                });
                
                const unlocksTitle = this.uiHelper.createElement<HTMLDivElement>('div', 'unlocks-title');
                unlocksTitle.textContent = 'Unlocks:';
                unlocksTitle.style.fontWeight = 'bold';
                unlocksContainer.appendChild(unlocksTitle);
                
                const unlocksList = this.uiHelper.createElement<HTMLUListElement>('ul', 'unlocks-list');
                Object.assign(unlocksList.style, {
                    margin: '5px 0 0 20px',
                    padding: '0'
                });
                
                for (const unlock of level.unlocks) {
                    const unlockItem = this.uiHelper.createElement<HTMLLIElement>('li', 'unlock-item');
                    unlockItem.textContent = unlock;
                    unlocksList.appendChild(unlockItem);
                }
                
                unlocksContainer.appendChild(unlocksList);
                levelElement.appendChild(unlocksContainer);
            }
            
            levelsContainer.appendChild(levelElement);
        }
        
        this.skillDetailsPanel.appendChild(levelsContainer);
        
        // Add upgrade button if skill can be upgraded
        if (currentLevel < maxLevel && this.canUnlockNextLevel(skill)) {
            const upgradeButton = this.uiHelper.createElement<HTMLButtonElement>('button', 'upgrade-button');
            upgradeButton.textContent = currentLevel === 0 ? 'Learn Skill' : 'Upgrade Skill';
            Object.assign(upgradeButton.style, {
                display: 'block',
                width: '100%',
                padding: '12px',
                marginTop: '20px',
                background: '#6b8e23',
                border: 'none',
                borderRadius: '4px',
                color: '#fff',
                fontFamily: 'Cinzel, Times New Roman, serif',
                fontWeight: 'bold',
                fontSize: '16px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
            });
            
            upgradeButton.addEventListener('mouseover', () => {
                upgradeButton.style.background = '#7c9f34';
            });
            
            upgradeButton.addEventListener('mouseout', () => {
                upgradeButton.style.background = '#6b8e23';
            });
            
            upgradeButton.addEventListener('click', (event) => {
                event.stopPropagation();
                event.preventDefault();
                this.upgradeSkill(skill);
            });
            this.skillDetailsPanel.appendChild(upgradeButton);
        }
        
        // Add expertise information if applicable
        if (skill.isExpertise) {
            const expertiseInfo = this.uiHelper.createElement<HTMLDivElement>('div', 'expertise-info');
            Object.assign(expertiseInfo.style, {
                marginTop: '15px',
                padding: '12px',
                background: 'rgba(147, 112, 219, 0.1)',
                borderRadius: '5px',
                border: '1px solid #9370db'
            });
            
            const expertiseTitle = this.uiHelper.createElement<HTMLDivElement>('div', 'expertise-title');
            expertiseTitle.textContent = `${skill.expertisePath} Expertise - Level ${skill.expertiseLevel}`;
            Object.assign(expertiseTitle.style, {
                fontWeight: 'bold',
                color: '#9370db',
                marginBottom: '8px',
                fontSize: '16px',
                textShadow: '1px 1px 1px rgba(0, 0, 0, 0.5)'
            });
            expertiseInfo.appendChild(expertiseTitle);
            
            const expertiseDescription = this.uiHelper.createElement<HTMLDivElement>('div', 'expertise-description');
            
            // Check if player has already chosen a different expertise path
            const hasOtherExpertise = this.playerSkills.expertisePath && 
                                     this.playerSkills.expertisePath !== skill.expertisePath;
            
            if (hasOtherExpertise) {
                expertiseDescription.textContent = `You have already chosen the ${this.playerSkills.expertisePath} expertise path. You cannot choose a different expertise path.`;
                Object.assign(expertiseDescription.style, {
                    color: '#a89078',
                    fontStyle: 'italic'
                });
            } else if (currentLevel > 0) {
                expertiseDescription.textContent = `You have chosen the ${skill.expertisePath} expertise path. Continue to unlock higher levels of expertise as you progress.`;
                Object.assign(expertiseDescription.style, {
                    color: '#e8d4b9'
                });
            } else {
                // Find previous expertise level if this is not level 1
                if (skill.expertiseLevel && skill.expertiseLevel > 1) {
                    const previousExpertise = this.skills.find(s => 
                        s.isExpertise && 
                        s.expertisePath === skill.expertisePath && 
                        s.expertiseLevel === (skill.expertiseLevel || 0) - 1
                    );
                    
                    if (previousExpertise) {
                        const previousLevel = this.playerSkills.unlockedSkills.get(previousExpertise.id) || 0;
                        if (previousLevel === 0) {
                            expertiseDescription.textContent = `You must first unlock ${previousExpertise.name} (Expertise Level ${previousExpertise.expertiseLevel}) before you can unlock this expertise level.`;
                            Object.assign(expertiseDescription.style, {
                                color: '#a89078',
                                fontStyle: 'italic'
                            });
                        } else {
                            expertiseDescription.textContent = `This is the next level of your ${skill.expertisePath} expertise path. Unlock it to continue your progression.`;
                            Object.assign(expertiseDescription.style, {
                                color: '#e8d4b9'
                            });
                        }
                    }
                } else {
                    expertiseDescription.textContent = 'Choosing an expertise path is a permanent decision. You can only follow one expertise path throughout your journey.';
                    Object.assign(expertiseDescription.style, {
                        color: '#e8d4b9'
                    });
                }
            }
            
            expertiseInfo.appendChild(expertiseDescription);
            
            // Add expertise progression
            if (skill.expertisePath) {
                const expertiseProgression = this.uiHelper.createElement<HTMLDivElement>('div', 'expertise-progression');
                Object.assign(expertiseProgression.style, {
                    marginTop: '15px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                });
                
                // Find all expertise levels for this path
                const expertiseLevels = this.skills.filter(s => 
                    s.isExpertise && s.expertisePath === skill.expertisePath
                ).sort((a, b) => (a.expertiseLevel || 0) - (b.expertiseLevel || 0));
                
                for (const expSkill of expertiseLevels) {
                    const expLevel = this.playerSkills.unlockedSkills.get(expSkill.id) || 0;
                    const expNode = this.uiHelper.createElement<HTMLDivElement>('div', 'exp-node');
                    Object.assign(expNode.style, {
                        width: '30px',
                        height: '30px',
                        borderRadius: '50%',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        color: '#fff',
                        background: expLevel > 0 ? '#9370db' : '#3c2815',
                        border: `2px solid ${expLevel > 0 ? '#b19cd9' : '#5d3c1e'}`,
                        position: 'relative'
                    });
                    
                    expNode.textContent = expSkill.expertiseLevel?.toString() || '';
                    
                    // Add connecting line except for the first node
                    if (expSkill !== expertiseLevels[0]) {
                        const line = this.uiHelper.createElement<HTMLDivElement>('div', 'exp-line');
                        Object.assign(line.style, {
                            position: 'absolute',
                            right: '30px',
                            top: '50%',
                            width: '20px',
                            height: '2px',
                            background: expLevel > 0 ? '#9370db' : '#5d3c1e'
                        });
                        expNode.appendChild(line);
                    }
                    
                    // Highlight current skill
                    if (expSkill.id === skill.id) {
                        expNode.style.boxShadow = '0 0 10px rgba(147, 112, 219, 0.7)';
                        expNode.style.transform = 'scale(1.2)';
                    }
                    
                    expertiseProgression.appendChild(expNode);
                }
                
                expertiseInfo.appendChild(expertiseProgression);
            }
            
            this.skillDetailsPanel.appendChild(expertiseInfo);
        }
    }
    
    /**
     * Checks if a skill can be unlocked
     */
    private canUnlockSkill(skill: Skill): boolean {
        // Check if player has enough skill points
        if (this.playerSkills.skillPoints < skill.levels[0].cost) {
            return false;
        }
        
        // Check if skill is already at max level
        const currentLevel = this.playerSkills.unlockedSkills.get(skill.id) || 0;
        if (currentLevel >= skill.levels.length) {
            return false;
        }
        
        // Check prerequisites
        if (skill.prerequisites) {
            for (const prereq of skill.prerequisites) {
                const [prereqId, requiredLevel] = prereq.split(':');
                const playerLevel = this.playerSkills.unlockedSkills.get(prereqId) || 0;
                
                if (playerLevel < Number.parseInt(requiredLevel)) {
                    return false;
                }
            }
        }
        
        // Check expertise restrictions
        if (skill.isExpertise) {
            // If this is a higher level expertise, check if player has the previous level
            if (skill.expertiseLevel && skill.expertiseLevel > 1) {
                // Find the previous expertise level
                const previousExpertise = this.skills.find(s => 
                    s.isExpertise && 
                    s.expertisePath === skill.expertisePath && 
                    s.expertiseLevel === (skill.expertiseLevel || 0) - 1
                );
                
                if (previousExpertise) {
                    const previousLevel = this.playerSkills.unlockedSkills.get(previousExpertise.id) || 0;
                    if (previousLevel === 0) {
                        return false; // Can't unlock higher expertise without previous level
                    }
                }
            } else {
                // If this is a level 1 expertise, check if player has already chosen a different expertise
                const hasOtherExpertise = Array.from(this.playerSkills.unlockedSkills.entries())
                    .some(([skillId, level]) => {
                        if (level === 0) return false;
                        
                        const otherSkill = this.skills.find(s => s.id === skillId);
                        return otherSkill?.isExpertise && 
                               otherSkill.expertisePath !== skill.expertisePath;
                    });
                
                if (hasOtherExpertise) {
                    return false; // Can't choose a different expertise path
                }
            }
        }
        
        // Check specialization restrictions
        if (skill.specialization && this.playerSkills.specialization && 
            skill.specialization !== this.playerSkills.specialization) {
            return false;
        }
        
        return true;
    }
    
    /**
     * Checks if the next level of a skill can be unlocked
     */
    private canUnlockNextLevel(skill: Skill): boolean {
        const currentLevel = this.playerSkills.unlockedSkills.get(skill.id) || 0;
        
        // Check if already at max level
        if (currentLevel >= skill.levels.length) {
            return false;
        }
        
        // Get cost of next level
        const nextLevelCost = skill.levels[currentLevel].cost;
        
        // Check if player has enough skill points
        return this.playerSkills.skillPoints >= nextLevelCost;
    }
    
    /**
     * Upgrades a skill to the next level
     */
    private upgradeSkill(skill: Skill): void {
        const currentLevel = this.playerSkills.unlockedSkills.get(skill.id) || 0;
        
        // Check if can upgrade
        if (!this.canUnlockNextLevel(skill)) {
            return;
        }
        
        // Get cost of next level
        const nextLevelCost = skill.levels[currentLevel].cost;
        
        // Deduct skill points
        this.playerSkills.skillPoints -= nextLevelCost;
        
        // Upgrade skill
        this.playerSkills.unlockedSkills.set(skill.id, currentLevel + 1);
        
        // If this is a specialization skill and it's the first level, set specialization
        if (skill.specialization && currentLevel === 0) {
            this.playerSkills.specialization = skill.specialization;
        }
        
        // If this is an expertise skill, record the expertise path
        if (skill.isExpertise && skill.expertisePath && currentLevel === 0) {
            this.playerSkills.expertisePath = skill.expertisePath;
        }
        
        // Update UI
        this.updateSkillPointsDisplay();
        this.filterSkills();
        this.updateSkillDetailsPanel();
        
        // Show a success message
        this.showSkillUpgradeMessage(skill, currentLevel + 1);
    }
    
    /**
     * Shows a message when a skill is upgraded
     */
    private showSkillUpgradeMessage(skill: Skill, newLevel: number): void {
        // Create a message element
        const messageContainer = this.uiHelper.createElement<HTMLDivElement>('div', 'skill-upgrade-message');
        Object.assign(messageContainer.style, {
            position: 'absolute',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(0, 0, 0, 0.8)',
            color: '#f0c070',
            padding: '15px 20px',
            borderRadius: '5px',
            border: '2px solid #8b5a2b',
            boxShadow: '0 0 20px rgba(240, 192, 112, 0.5)',
            zIndex: '2000',
            textAlign: 'center',
            fontWeight: 'bold',
            fontSize: '18px',
            pointerEvents: 'none',
            opacity: '0',
            transition: 'opacity 0.3s ease'
        });
        
        // Set message text
        let messageText = `${skill.name} upgraded to Level ${newLevel}!`;
        
        // Special message for expertise skills
        if (skill.isExpertise) {
            messageText = `${skill.name} Level ${skill.expertiseLevel} unlocked!`;
            
            if (skill.expertiseLevel === 1) {
                messageText += ` You have chosen the ${skill.expertisePath} path.`;
            }
        }
        
        messageContainer.textContent = messageText;
        
        // Add to container
        this.container.appendChild(messageContainer);
        
        // Animate in
        setTimeout(() => {
            messageContainer.style.opacity = '1';
        }, 10);
        
        // Remove after delay
        setTimeout(() => {
            messageContainer.style.opacity = '0';
            setTimeout(() => {
                if (messageContainer.parentNode) {
                    messageContainer.parentNode.removeChild(messageContainer);
                }
            }, 300);
        }, 3000);
    }
    
    /**
     * Updates the skill points display
     */
    private updateSkillPointsDisplay(): void {
        this.skillPointsDisplay.textContent = this.playerSkills.skillPoints.toString();
    }
    
    /**
     * Initialize the skill tree with data
     */
    public initialize(skills: Skill[], playerSkills: PlayerSkills): void {
        console.log(`Initializing skill tree with ${skills.length} skills, highest tier: ${getHighestTier()}`);
        
        this.skills = skills;
        this.playerSkills = playerSkills;
        
        // Update skill points display
        this.skillPointsDisplay.textContent = playerSkills.skillPoints.toString();
        
        // Filter and display skills
        this.filterSkills();
        
        // Add event listeners for responsive design
        window.addEventListener('orientationchange', this.handleResize.bind(this));
    }
    
    /**
     * Loads skill data
     */
    public loadSkills(skills: Skill[]): void {
        console.log(`Loading ${skills.length} skills, highest tier: ${getHighestTier()}`);
        
        // Group skills by tier for logging
        const tierCounts = new Map<number, number>();
        for (const skill of skills) {
            tierCounts.set(skill.tier, (tierCounts.get(skill.tier) || 0) + 1);
        }
        
        // Log the number of skills in each tier
        console.log('Skills by tier:');
        for (const [tier, count] of tierCounts.entries()) {
            console.log(`Tier ${tier}: ${count} skills`);
        }
        
        this.skills = skills;
        this.filterSkills();
    }
    
    /**
     * Sets player skill data
     */
    public setPlayerSkills(playerSkills: PlayerSkills): void {
        this.playerSkills = playerSkills;
        this.updateSkillPointsDisplay();
        this.filterSkills();
    }
    
    /**
     * Shows the skill tree
     */
    public show(): void {
        console.log('Showing skill tree');
        
        // Remove the hidden class to show the container
        this.container.classList.remove('hidden');
        
        // Force the container to be visible
        this.container.style.display = 'flex';
        this.container.style.visibility = 'visible';
        this.container.style.opacity = '1';
        
        // Make sure it's in the DOM
        if (!this.container.parentNode) {
            document.body.appendChild(this.container);
            console.log('Added skill tree container to document body');
        }
        
        // Apply responsive adjustments
        this.handleResize();
        
        // Log the current state
        console.log('Skill tree container display:', this.container.style.display);
        console.log('Skill tree container visibility:', this.container.style.visibility);
        console.log('Skill tree container z-index:', this.container.style.zIndex);
        console.log('Skill tree container in DOM:', !!this.container.parentNode);
        console.log('Skill tree container classes:', this.container.className);
        
        // Force a reflow
        void this.container.offsetHeight;
        
        // Double-check visibility after a short delay
        setTimeout(() => {
            if (this.isHidden()) {
                console.log('Skill tree still hidden after show() - forcing display');
                this.container.classList.remove('hidden');
                this.container.style.display = 'flex';
                this.container.style.visibility = 'visible';
                this.container.style.opacity = '1';
                
                // Check computed style
                const computedStyle = window.getComputedStyle(this.container);
                console.log('Computed display:', computedStyle.display);
                console.log('Computed visibility:', computedStyle.visibility);
                console.log('Computed opacity:', computedStyle.opacity);
            }
        }, 50);
    }
    
    /**
     * Hides the skill tree
     */
    public hide(): void {
        console.log('Hiding skill tree');
        
        // Add the hidden class to hide the container
        this.container.classList.add('hidden');
        
        // Also set display none for backward compatibility
        this.container.style.display = 'none';
    }
    
    /**
     * Toggles the skill tree visibility
     */
    public toggle(): void {
        console.log('Toggling skill tree, current display:', this.container.style.display);
        if (this.container.style.display === 'none') {
            this.show();
        } else {
            this.hide();
        }
    }
    
    /**
     * Checks if the skill tree is currently hidden
     */
    public isHidden(): boolean {
        return this.container.style.display === 'none' || this.container.classList.contains('hidden');
    }
    
    /**
     * Destroys the skill tree
     */
    public destroy(): void {
        this.container?.parentNode?.removeChild(this.container);
    }
} 