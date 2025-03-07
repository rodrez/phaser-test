import { Scene, GameObjects, Physics, Math as PhaserMath } from 'phaser';
import { MapSystem } from './Map';
import { PlayerSystem } from './Player';
import { ItemSystem } from './Item';

// Re-export everything from the monsters directory for backward compatibility
export * from './monsters';

// Note: This file is now just a re-export for backward compatibility.
// New code should import directly from the 'monsters' directory.
// We may deprecate this file in the future.

// Monster types enum
export enum MonsterType {
    DEER = 'deer',
    WOLF = 'wolf',
    BEAR = 'bear',
    BOAR = 'boar',
}

// Monster behavior types
export enum MonsterBehavior {
    PASSIVE = 'passive',     // Runs away when attacked, never attacks
    NEUTRAL = 'neutral',     // Only attacks when provoked
    AGGRESSIVE = 'aggressive', // Attacks player on sight
    TERRITORIAL = 'territorial' // Attacks when player enters territory
}

// Monster attributes interface
export interface MonsterAttributes {
    health: number;
    maxHealth: number;
    damage: number;
    defense: number;
    speed: number;
    detectionRadius: number; // How far the monster can detect the player
    fleeRadius?: number;     // How far the monster flees when scared
    aggroRadius?: number;    // How far the monster will chase the player
    returnRadius?: number;   // How far from spawn point before returning
}

// Monster loot table item
export interface MonsterLoot {
    itemId: string;
    minQuantity: number;
    maxQuantity: number;
    dropChance: number; // 0-1 probability
}

// Monster data interface
export interface MonsterData {
    type: MonsterType;
    name: string;
    behavior: MonsterBehavior;
    attributes: MonsterAttributes;
    lootTable: MonsterLoot[];
    spriteKey: string;
    scale?: number;
}

// Monster state enum
export enum MonsterState {
    IDLE = 'idle',
    WANDERING = 'wandering',
    FLEEING = 'fleeing',
    CHASING = 'chasing',
    ATTACKING = 'attacking',
    RETURNING = 'returning',
    DEAD = 'dead'
}

// Monster class
export class Monster extends Physics.Arcade.Sprite {
    // Basic properties
    public monsterType: MonsterType;
    public monsterName: string;
    public behavior: MonsterBehavior;
    public attributes: MonsterAttributes;
    public lootTable: MonsterLoot[];
    public currentState: MonsterState = MonsterState.IDLE;
    
    // Movement and AI properties
    private spawnPoint: PhaserMath.Vector2;
    private wanderTarget: PhaserMath.Vector2 | null = null;
    private wanderTimer: number = 0;
    private stateTimer: number = 0;
    private lastStateChange: number = 0;
    
    // Reference to player and systems
    private playerSprite: Physics.Arcade.Sprite;
    private itemSystem: ItemSystem;
    
    // Visual elements
    private healthBar: GameObjects.Graphics;
    
    constructor(scene: Scene, x: number, y: number, monsterData: MonsterData, playerSprite: Physics.Arcade.Sprite, itemSystem: ItemSystem) {
        super(scene, x, y, monsterData.spriteKey);
        
        // Debug sprite texture
        console.log(`Creating monster with sprite key: ${monsterData.spriteKey}`);
        console.log(`Sprite texture exists: ${scene.textures.exists(monsterData.spriteKey)}`);
        
        // Set basic properties
        this.monsterType = monsterData.type;
        this.monsterName = monsterData.name;
        this.behavior = monsterData.behavior;
        this.attributes = { ...monsterData.attributes };
        this.lootTable = [...monsterData.lootTable];
        this.playerSprite = playerSprite;
        this.itemSystem = itemSystem;
        
        // Set spawn point
        this.spawnPoint = new PhaserMath.Vector2(x, y);
        
        // Set physics properties
        scene.physics.world.enable(this);
        this.setCollideWorldBounds(true);
        this.setBounce(0.1);
        
        // Set display properties
        if (monsterData.scale) {
            this.setScale(monsterData.scale);
        }
        
        // Make sure monsters are rendered above the map but below UI
        // Player is at 800, so use 700 for monsters
        this.setDepth(500);
        
        // Make sure the sprite is visible
        this.setActive(true);
        this.setVisible(true);
        
        // ALWAYS add the sprite to the scene to ensure it's rendered
        scene.add.existing(this);
        
        // Create health bar
        this.healthBar = scene.add.graphics();
        this.updateHealthBar();
        
        // Start in idle state
        this.changeState(MonsterState.IDLE);
        
        console.log(`Monster created: ${this.monsterName} at (${x}, ${y})`);
    }
    
    // Update health bar position and fill
    private updateHealthBar(): void {
        this.healthBar.clear();
        
        // Position below the monster (instead of above)
        const x = this.x - 15;
        const y = this.y + 30; // Position it below the monster
        
        // Draw background
        this.healthBar.fillStyle(0x000000, 0.5);
        this.healthBar.fillRect(x, y, 30, 5);
        
        // Calculate health percentage
        const healthPercent = this.attributes.health / this.attributes.maxHealth;
        
        // Choose color based on health percentage
        let color = 0x00ff00; // Green
        if (healthPercent < 0.3) {
            color = 0xff0000; // Red
        } else if (healthPercent < 0.6) {
            color = 0xffff00; // Yellow
        }
        
        // Draw health bar
        this.healthBar.fillStyle(color, 1);
        this.healthBar.fillRect(x, y, 30 * healthPercent, 5);
    }
    
    // Set monster state
    public changeState(newState: MonsterState): void {
        if (this.currentState === newState) return;
        
        this.currentState = newState;
        this.lastStateChange = this.scene.time.now;
        
        // Handle state changes
        switch (newState) {
            case MonsterState.IDLE:
                this.setVelocity(0, 0);
                break;
                
            case MonsterState.DEAD:
                this.setVelocity(0, 0);
                break;
        }
    }
    
    // Take damage and potentially die
    public takeDamage(amount: number): void {
        // Reduce damage by defense (minimum 1)
        const actualDamage = Math.max(1, amount - this.attributes.defense);
        this.attributes.health -= actualDamage;
        
        // Update health bar
        this.updateHealthBar();
        
        // Check if dead
        if (this.attributes.health <= 0) {
            this.die();
            return;
        }
        
        // React based on behavior
        if (this.behavior === MonsterBehavior.PASSIVE) {
            this.changeState(MonsterState.FLEEING);
        } else if (this.behavior === MonsterBehavior.NEUTRAL || 
                  this.behavior === MonsterBehavior.TERRITORIAL) {
            this.changeState(MonsterState.CHASING);
        }
    }
    
    // Die and drop loot
    private die(): void {
        this.changeState(MonsterState.DEAD);
        
        // Drop loot
        this.dropLoot();
        
        // Remove from physics world
        this.scene.physics.world.disable(this);
        
        // Set up a timer to remove the monster
        this.scene.time.delayedCall(2000, () => {
            this.healthBar.destroy();
            this.destroy();
        });
    }
    
    // Drop loot based on loot table
    private dropLoot(): void {
        this.lootTable.forEach(loot => {
            // Check if item should drop based on chance
            if (Math.random() <= loot.dropChance) {
                // Determine quantity
                const quantity = PhaserMath.Between(loot.minQuantity, loot.maxQuantity);
                
                // Create the item in the game world
                const item = this.itemSystem.createItem(loot.itemId);
                if (item) {
                    // TODO: Add item to the world at monster position
                    console.log(`Dropped ${quantity}x ${item.name}`);
                    
                    // For now, just give it directly to the player
                    // In a real implementation, you'd create a physical item in the world
                    const gameScene = this.scene as any;
                    if (gameScene.givePlayerItem) {
                        gameScene.givePlayerItem(loot.itemId, quantity);
                    }
                }
            }
        });
    }
    
    // Update monster behavior
    public update(time: number, delta: number): void {
        // Skip update if dead
        if (this.currentState === MonsterState.DEAD) return;
        
        // Update health bar position
        this.updateHealthBar();
        
        // Calculate distance to player
        const distToPlayer = PhaserMath.Distance.Between(
            this.x, this.y,
            this.playerSprite.x, this.playerSprite.y
        );
        
        // Handle behavior based on current state
        switch (this.currentState) {
            case MonsterState.IDLE:
                this.handleIdleState(time, delta, distToPlayer);
                break;
                
            case MonsterState.WANDERING:
                this.handleWanderingState(time, delta, distToPlayer);
                break;
                
            case MonsterState.FLEEING:
                this.handleFleeingState(time, delta, distToPlayer);
                break;
                
            case MonsterState.CHASING:
                this.handleChasingState(time, delta, distToPlayer);
                break;
                
            case MonsterState.ATTACKING:
                this.handleAttackingState(time, delta, distToPlayer);
                break;
                
            case MonsterState.RETURNING:
                this.handleReturningState(time, delta);
                break;
        }
        
        // Flip sprite based on movement direction
        if (this.body && this.body.velocity.x < 0) {
            this.setFlipX(true);
        } else if (this.body && this.body.velocity.x > 0) {
            this.setFlipX(false);
        }
    }
    
    // Handle idle state behavior
    private handleIdleState(time: number, delta: number, distToPlayer: number): void {
        // Check if player is within detection radius
        if (distToPlayer <= this.attributes.detectionRadius) {
            // React based on behavior type
            if (this.behavior === MonsterBehavior.PASSIVE) {
                this.changeState(MonsterState.FLEEING);
                return;
            } else if (this.behavior === MonsterBehavior.AGGRESSIVE) {
                this.changeState(MonsterState.CHASING);
                return;
            } else if (this.behavior === MonsterBehavior.TERRITORIAL && 
                      distToPlayer <= (this.attributes.aggroRadius || this.attributes.detectionRadius)) {
                this.changeState(MonsterState.CHASING);
                return;
            }
        }
        
        // Randomly decide to start wandering
        if (time > this.wanderTimer) {
            this.changeState(MonsterState.WANDERING);
            this.setNewWanderTarget();
            this.wanderTimer = time + PhaserMath.Between(5000, 10000); // Wander for 5-10 seconds
        }
    }
    
    // Handle wandering state behavior
    private handleWanderingState(time: number, delta: number, distToPlayer: number): void {
        // Check if player is within detection radius (same as idle state)
        if (distToPlayer <= this.attributes.detectionRadius) {
            if (this.behavior === MonsterBehavior.PASSIVE) {
                this.changeState(MonsterState.FLEEING);
                return;
            } else if (this.behavior === MonsterBehavior.AGGRESSIVE) {
                this.changeState(MonsterState.CHASING);
                return;
            } else if (this.behavior === MonsterBehavior.TERRITORIAL && 
                      distToPlayer <= (this.attributes.aggroRadius || this.attributes.detectionRadius)) {
                this.changeState(MonsterState.CHASING);
                return;
            }
        }
        
        // Move toward wander target if it exists
        if (this.wanderTarget) {
            const distToTarget = PhaserMath.Distance.Between(
                this.x, this.y,
                this.wanderTarget.x, this.wanderTarget.y
            );
            
            // If we've reached the target or it's time to change targets
            if (distToTarget < 10 || time > this.wanderTimer) {
                // Either go back to idle or set a new wander target
                if (Math.random() < 0.3) {
                    this.changeState(MonsterState.IDLE);
                    this.wanderTimer = time + PhaserMath.Between(2000, 5000); // Idle for 2-5 seconds
                } else {
                    this.setNewWanderTarget();
                    this.wanderTimer = time + PhaserMath.Between(5000, 10000); // Wander for 5-10 seconds
                }
                return;
            }
            
            // Move toward target
            this.scene.physics.moveTo(this, 
                this.wanderTarget.x, 
                this.wanderTarget.y, 
                this.attributes.speed * 0.5); // Wander at half speed
        } else {
            // No target, set a new one
            this.setNewWanderTarget();
        }
    }
    
    // Handle fleeing state behavior
    private handleFleeingState(time: number, delta: number, distToPlayer: number): void {
        // If we're far enough from the player, go back to idle
        if (distToPlayer > (this.attributes.fleeRadius || this.attributes.detectionRadius * 1.5)) {
            this.changeState(MonsterState.IDLE);
            return;
        }
        
        // Calculate direction away from player
        const angle = PhaserMath.Angle.Between(
            this.x, this.y,
            this.playerSprite.x, this.playerSprite.y
        );
        
        // Move in the opposite direction
        const velocityX = Math.cos(angle) * -this.attributes.speed;
        const velocityY = Math.sin(angle) * -this.attributes.speed;
        
        this.setVelocity(velocityX, velocityY);
    }
    
    // Handle chasing state behavior
    private handleChasingState(time: number, delta: number, distToPlayer: number): void {
        // If player is too far, return to spawn
        if (distToPlayer > this.attributes.detectionRadius) {
            this.changeState(MonsterState.RETURNING);
            return;
        }
        
        // If close enough to attack
        if (distToPlayer < 40) { // Attack range
            this.changeState(MonsterState.ATTACKING);
            return;
        }
        
        // Move toward player
        this.scene.physics.moveTo(this, 
            this.playerSprite.x, 
            this.playerSprite.y, 
            this.attributes.speed);
    }
    
    // Handle attacking state behavior
    private handleAttackingState(time: number, delta: number, distToPlayer: number): void {
        // If player moved away, chase again
        if (distToPlayer > 40) {
            this.changeState(MonsterState.CHASING);
            return;
        }
        
        // Attack logic - only attack once per second
        if (time > this.stateTimer) {
            // Deal damage to player using combat system if available
            const combatSystem = (this.scene as any).combatSystem;
            if (combatSystem) {
                combatSystem.monsterAttackPlayer(this, this.attributes.damage);
            } else {
                // Fallback for backward compatibility
                console.log(`${this.monsterName} attacks player for ${this.attributes.damage} damage`);
                
                // Try to use player's takeDamage method if available
                const playerSystem = (this.scene as any).playerSystem;
                if (playerSystem && typeof playerSystem.takeDamage === 'function') {
                    playerSystem.takeDamage(this.attributes.damage);
                }
            }
            
            // Set cooldown for next attack
            this.stateTimer = time + 1000; // 1 second cooldown
        }
    }
    
    // Handle returning to spawn state behavior
    private handleReturningState(time: number, delta: number): void {
        // Calculate distance to spawn point
        const distToSpawn = PhaserMath.Distance.Between(
            this.x, this.y,
            this.spawnPoint.x, this.spawnPoint.y
        );
        
        // If we're close to spawn, go back to idle
        if (distToSpawn < 10) {
            this.changeState(MonsterState.IDLE);
            return;
        }
        
        // Move toward spawn point
        this.scene.physics.moveTo(this, 
            this.spawnPoint.x, 
            this.spawnPoint.y, 
            this.attributes.speed);
    }
    
    // Set a new random wander target
    private setNewWanderTarget(): void {
        // Set a random point within a radius of the spawn point
        const wanderRadius = 100; // How far the monster will wander from spawn
        const randomAngle = Math.random() * Math.PI * 2;
        const randomRadius = Math.random() * wanderRadius;
        
        const targetX = this.spawnPoint.x + Math.cos(randomAngle) * randomRadius;
        const targetY = this.spawnPoint.y + Math.sin(randomAngle) * randomRadius;
        
        this.wanderTarget = new PhaserMath.Vector2(targetX, targetY);
    }
}

// Monster system class
export class MonsterSystem {
    private scene: Scene;
    private mapSystem: MapSystem;
    private playerSystem: PlayerSystem;
    private itemSystem: ItemSystem;
    private monsters: Monster[] = [];
    private monsterGroup: Physics.Arcade.Group;
    private monsterData: Map<MonsterType, MonsterData> = new Map();
    private spawnTimer: number = 0;
    private maxMonsters: number = 20;
    
    constructor(scene: Scene, mapSystem: MapSystem, playerSystem: PlayerSystem, itemSystem: ItemSystem) {
        this.scene = scene;
        this.mapSystem = mapSystem;
        this.playerSystem = playerSystem;
        this.itemSystem = itemSystem;
        
        // Create physics group for monsters
        this.monsterGroup = scene.physics.add.group({
            collideWorldBounds: true,
            bounceX: 0.1,
            bounceY: 0.1
        });
        
        // Initialize monster data
        this.initializeMonsterData();
        
        // Set up collisions
        scene.physics.add.collider(this.monsterGroup, this.monsterGroup);
        
        // Get player sprite and set up collision
        const player = playerSystem.player;
        if (player) {
            scene.physics.add.collider(
                this.monsterGroup, 
                player, 
                this.handlePlayerCollision.bind(this)
            );
        }
    }
    
    // Initialize monster data
    private initializeMonsterData(): void {
        // Deer data
        this.monsterData.set(MonsterType.DEER, {
            type: MonsterType.DEER,
            name: 'Deer',
            behavior: MonsterBehavior.PASSIVE,
            attributes: {
                health: 30,
                maxHealth: 30,
                damage: 0,
                defense: 0,
                speed: 120,
                detectionRadius: 150,
                fleeRadius: 200
            },
            lootTable: [
                {
                    itemId: 'leather',
                    minQuantity: 1,
                    maxQuantity: 3,
                    dropChance: 0.8
                }
            ],
            spriteKey: 'deer',
            scale: .75
        });
        
        // TODO: Add more monster types here
    }
    
    // Handle collision between player and monster
    private handlePlayerCollision(player: any, monster: any): void {
        // This is just a basic implementation
        // In a real game, you'd handle this in the combat system
        
        // For passive monsters, make them flee
        if (monster.behavior === MonsterBehavior.PASSIVE) {
            monster.changeState(MonsterState.FLEEING);
        }
    }
    
    // Spawn a monster of the given type at the specified position
    public spawnMonster(type: MonsterType, x: number, y: number): Monster | null {
        // Check if we've reached the monster limit
        if (this.monsters.length >= this.maxMonsters) {
            console.log("Max monsters reached, not spawning more");
            return null;
        }
        
        // Get monster data
        const data = this.monsterData.get(type);
        if (!data) {
            console.error(`Monster type ${type} not found in monster data`);
            return null;
        }
        
        // Get player sprite
        const player = this.playerSystem.player;
        if (!player) {
            console.error('Player sprite not found');
            return null;
        }
        
        // Create the monster
        const monster = new Monster(
            this.scene, 
            x, 
            y, 
            data, 
            player,
            this.itemSystem
        );
        
        // Add to group and list
        this.monsterGroup.add(monster);
        this.monsters.push(monster);
        
        console.log(`Spawned ${type} at (${x}, ${y}). Total monsters: ${this.monsters.length}`);
        return monster;
    }
    
    // Spawn monsters randomly around the player
    public spawnRandomMonsters(count: number, radius: number): void {
        console.log(`Attempting to spawn ${count} monsters within radius ${radius}`);
        
        const player = this.playerSystem.player;
        if (!player) {
            console.error("Cannot spawn monsters - player not found");
            return;
        }
        
        console.log(`Player position: (${player.x}, ${player.y})`);
        
        for (let i = 0; i < count; i++) {
            // Choose a random monster type (for now just deer)
            const type = MonsterType.DEER;
            
            // Choose a random position around the player
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * radius;
            const x = player.x + Math.cos(angle) * distance;
            const y = player.y + Math.sin(angle) * distance;
            
            // Spawn the monster
            this.spawnMonster(type, x, y);
        }
    }
    
    // Update all monsters
    public update(time: number, delta: number): void {
        // Skip if no monsters
        if (this.monsters.length === 0) {
            return;
        }
        
        // Update each monster
        for (let i = this.monsters.length - 1; i >= 0; i--) {
            const monster = this.monsters[i];
            
            // Remove destroyed monsters from the list
            if (!monster.active) {
                console.log(`Monster ${monster.monsterName} destroyed, removing from list`);
                this.monsters.splice(i, 1);
                continue;
            }
            
            // Update monster behavior
            monster.update(time, delta);
        }
        
        // Periodically spawn new monsters
        if (time > this.spawnTimer && this.monsters.length < this.maxMonsters) {
            console.log(`Attempting to spawn additional monster. Current count: ${this.monsters.length}`);
            this.spawnRandomMonsters(1, 300);
            this.spawnTimer = time + 10000; // Spawn every 10 seconds
        }
    }
    
    // Get all monsters
    public getMonsters(): Monster[] {
        return this.monsters;
    }
    
    // Get monster count
    public getMonsterCount(): number {
        return this.monsters.length;
    }
    
    // Preload monster assets
    // public preloadAssets(): void {
    //     // Load deer assets
    //     this.scene.load.image('deer', 'assets/monsters/deer.png');
        
    //     // TODO: Load more monster assets
    // }
} 