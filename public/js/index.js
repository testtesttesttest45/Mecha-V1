import Player from './player.js';
import Enemy from './enemy.js';
import { rgbToHex, resize, loadDynamicSpriteSheet, setAttackCursor, setDefaultCursor } from './utilities.js';

class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        this.player = null;
        this.enemy = null;
        this.land = null;
        this.ocean = null;
        this.initialZoom = 1;
        this.isDragging = false;
        this.dragStartPoint = null;
    }

    create() {
        this.gameScreenWidth = this.sys.game.config.width;
        this.gameScreenHeight = this.sys.game.config.height;
        this.createStaticBackground();
        this.createLand();

        this.createEnemy();
        this.createPlayer();
        // this.setupInputHandlers();
        this.setupCamera();

        this.messageText = this.add.text(0, 0, '', { font: '24px Orbitron', fill: '#ff0000', align: 'center' });
        this.messageText.setVisible(false);
    }

    createStaticBackground() {
        // Ocean setup
        this.ocean = this.add.image(0, 0, 'ocean').setOrigin(0, 0);
        this.ocean.setDisplaySize(4000, 2000);
        this.ocean.setDepth(-1);
    }

    createLand() {
        // Place land image in the center of the ocean
        this.land = this.add.image(
            2000, 1000, 'land').setOrigin(0.5, 0.5);
    }

    setupCamera() {
        let pointerDownTime = 0;
        const dragThreshold = 20;
        // Set the bounds and initial zoom of the camera
        this.cameras.main.setBounds(0, 0, 4000, 2000);
        this.cameras.main.setZoom(this.initialZoom);
        
        // Center the camera on the land initially
        this.cameras.main.scrollX = this.land.x - this.gameScreenWidth / 2;
        this.cameras.main.scrollY = this.land.y - this.gameScreenHeight / 2;

        // Enhanced Zoom controls
        this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY, deltaZ) => {
            const newZoom = deltaY > 0 ? Math.max(this.cameras.main.zoom - 0.4, 0.7) : Math.min(this.cameras.main.zoom + 0.4, 2.5);
            this.cameras.main.zoomTo(newZoom, 300);
        });

        // Implementing Camera Dragging
        this.input.on('pointerdown', pointer => {
            console.log("Pointer down");
            pointerDownTime = Date.now();
            
            this.dragStartPoint = new Phaser.Math.Vector2(pointer.x, pointer.y);
            this.isDragging = false;
        });
    
        this.input.on('pointermove', pointer => {
            if (!pointer.isDown || !this.dragStartPoint) return;
    
            const distanceMoved = Phaser.Math.Distance.Between(this.dragStartPoint.x, this.dragStartPoint.y, pointer.x, pointer.y);
            if (distanceMoved > dragThreshold) {
                this.isDragging = true;

                const dragX = this.cameras.main.scrollX + (this.dragStartPoint.x - pointer.x);
                const dragY = this.cameras.main.scrollY + (this.dragStartPoint.y - pointer.y);

                this.cameras.main.scrollX = dragX;
                this.cameras.main.scrollY = dragY;

                this.dragStartPoint.x = pointer.x;
                this.dragStartPoint.y = pointer.y;
            }
        });

        this.input.on('pointerup', pointer => {
            console.log("Pointer up");
            const pointerUpTime = Date.now();
            const heldTime = pointerUpTime - pointerDownTime;
            console.log(`Pointer was held down for ${heldTime} milliseconds`);
    
            if (!this.isDragging) {
                console.log("Is not dragging, handling click");
                this.handlePlayerClick(pointer);
            } else {
                console.log("Is dragging, so don't handle click");
            }
            this.dragStartPoint = null;
            this.isDragging = false;  // Reset the dragging flag
        });
    }

    handlePlayerClick(pointer) {
        if (this.enemyClicked) {
            console.log("Enemy clicked, dont come here");
            this.enemyClicked = false;
            return; // Click was on the enemy, skip the general click logic
        }

        // Convert screen coordinates to world coordinates
        const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        const originalWidth = this.land.texture.source[0].width;
        const originalHeight = this.land.texture.source[0].height;

        // Check if the clicked point is within the bounds of the land
        if (worldPoint.x >= this.land.x - originalWidth / 2 &&
            worldPoint.x <= this.land.x + originalWidth / 2 &&
            worldPoint.y >= this.land.y - originalHeight / 2 &&
            worldPoint.y <= this.land.y + originalHeight / 2) {
            // If within bounds, move the player
            this.player.moveStraight(worldPoint.x, worldPoint.y);
        } else {
            this.showOutOfBoundsMessage(worldPoint);
        }
    }

    showOutOfBoundsMessage(worldPoint) {
        this.messageText.setText("Can't go there!");
        this.messageText.setOrigin(0.5, 0.5);
        this.messageText.setVisible(true);

        // Adjust position of the message text
        if (worldPoint.x < this.sys.game.config.width / 2) {
            this.messageText.setPosition(worldPoint.x + 100, worldPoint.y);
        } else {
            this.messageText.setPosition(worldPoint.x - 50, worldPoint.y);
        }

        this.tweens.add({
            targets: this.messageText,
            alpha: { start: 0, to: 1 },
            duration: 1000,
            ease: 'Linear',
            yoyo: true,
            repeat: 0,
            onComplete: () => {
                this.messageText.setVisible(false);
                this.messageText.setAlpha(1); // Reset alpha value for the next use
            }
        });
    }


    createPlayer() {
        const scaleX = this.width / this.land.width;
        const scaleY = this.height / this.land.height;

        this.player = new Player(this, 1500, 800, 1);
        this.player.create();
    }

    createEnemy() {

        this.enemy = new Enemy(this, 1500, 900, 2);
        this.enemy.create();

        this.enemy.sprite.on('pointerover', () => {
            if (!this.enemy.isDead) {
                setAttackCursor(this);
            }
        });

        this.enemy.sprite.on('pointerout', () => {
            setDefaultCursor(this);
        });

        this.enemyClicked = false; // Add a flag to track enemy clicks

        this.enemy.sprite.on('pointerdown', () => {
            console.log("Enemy clicked");
            this.enemyClicked = true;
            if (!this.player.isAttacking) {
                const enemyX = this.enemy.sprite.x;
                const enemyY = this.enemy.sprite.y;

                this.player.moveStraight(enemyX, enemyY, () => {
                    this.player.playAttackAnimation(this.enemy);
                });

            }
        });

    }

    setupInputHandlers() {
        const originalWidth = this.land.texture.source[0].width;
        const originalHeight = this.land.texture.source[0].height;

        this.input.on('pointerdown', function (pointer) {
            if (pointer.leftButtonDown()) {
                if (this.enemyClicked) {
                    this.enemyClicked = false; // Reset the flag
                    return; // Click was on the enemy, so skip the general click logic/no callback
                }

                // Convert screen coordinates to world coordinates
                const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);

                // Check if the clicked point is within the bounds of the island
                if (worldPoint.x >= this.land.x - originalWidth / 2 &&
                    worldPoint.x <= this.land.x + originalWidth / 2 &&
                    worldPoint.y >= this.land.y - originalHeight / 2 &&
                    worldPoint.y <= this.land.y + originalHeight / 2) {
                    // If within bounds, move the player
                    this.player.moveStraight(worldPoint.x, worldPoint.y);
                } else {
                    this.messageText.setText("Can't go there!");
                    this.messageText.setOrigin(0.5, 0.5);
                    this.messageText.setVisible(true);

                    // this.messageText.setPosition(worldPoint.x, worldPoint.y);
                    // ensure the text is seen fully within this.sys.game.config.width
                    if (worldPoint.x < this.sys.game.config.width / 2) {
                        this.messageText.setPosition(worldPoint.x + 100, worldPoint.y);
                    } else {
                        this.messageText.setPosition(worldPoint.x - 50, worldPoint.y);
                    }
                    this.tweens.add({
                        targets: this.messageText,
                        alpha: { start: 0, to: 1 },
                        duration: 1000,
                        ease: 'Linear',
                        yoyo: true,
                        repeat: 0,
                        onComplete: () => {
                            this.messageText.setVisible(false);
                            this.messageText.setAlpha(1); // Reset alpha value for the next use
                        }
                    });
                }
            }
        }, this);

        this.input.enabled = true;

        this.sceneName = "battle-scene";
    }


    update(time) {
        if (this.player) {
            this.player.update(time);
        }

        if (this.enemy) {
            let x = this.player.getPosition().x;
            // console.log("Player position:", this.player.getPosition().x, this.player.getPosition().y);
            let y = this.player.getPosition().y;
            // console.log("Enemy position:", this.enemy.sprite.x, this.enemy.sprite.y);
            this.enemy.updateEnemy(x, y);
            this.enemy.update(time);
        }
    }
}

class LoadingScene extends Phaser.Scene {
    constructor() {
        super({ key: 'LoadingScene' });
        this.grid = null;
        this.loadingStartTime = 0;
        this.assetsLoaded = false;
        this.gridCreated = false;
        this.assetProgress = 0;
        this.gridProgress = 0;
    }

    preload() {
        this.loadingStartTime = Date.now();
        this.createLoadingText();
        this.loadAssets();

        this.load.on('progress', (value) => {
            this.assetProgress = value * 100; // Convert to percentage
            this.loadingText.setText(`Loading... ${Math.round(this.assetProgress)}%`);
        });

        this.load.on('complete', () => {
            // All assets are loaded
            console.log('All assets loaded, switching to GameScene');
            let loadingEndTime = Date.now();
            let loadingDuration = (loadingEndTime - this.loadingStartTime) / 1000;
            console.log(`Loading completed in ${loadingDuration.toFixed(2)} seconds`);
            this.loadingText.setVisible(false);
            this.scene.start('GameScene');
        });
    }

    create() {
        // set default cursor
        this.input.setDefaultCursor(`url('assets/images/mouse_cursor.png') 15 10, pointer`);
    }

    createLoadingText() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        this.loadingText = this.add.text(width / 2, height / 2, 'Loading...', {
            font: '74px Orbitron',
            fill: '#fff',
            align: 'center'
        }).setOrigin(0.5, 0.5);
    }

    loadAssets() {
        this.load.image('ocean', 'assets/images/ocean.png');
        this.load.image('land', 'assets/images/land2.png');

        this.load.image('mouse_cursor', 'assets/images/mouse_cursor.png');
        this.load.image('mouse_cursor_attack', 'assets/images/mouse_cursor_attack.png');

        loadDynamicSpriteSheet.call(this, 'character1', 'assets/sprites/character_1.png', 6000, 6600);
        loadDynamicSpriteSheet.call(this, 'character2', 'assets/sprites/character_2.png', 4000, 4400);
    }

    
}

document.addEventListener('DOMContentLoaded', (event) => {
    const gameScreen = document.getElementById('game-screen');
    const battleScene = document.getElementById('battle-scene');
    const playButton = document.querySelector('.play-button');

    function startGame() {
        const config = {
            type: Phaser.AUTO,
            width: 1920,
            height: 1080,
            parent: 'battle-scene',
            scene: [LoadingScene, GameScene],
            render: {
                pixelArt: true,
            },
            physics: {
                default: 'arcade',
                arcade: {
                    debug: true // true to see physics bodies for debugging
                }
            },
        };

        const game = new Phaser.Game(config);
        game.canvas.id = 'battle-canvas';
        resize(game);

        window.addEventListener('resize', () => {
            resize(game);
        });
    }

    playButton.addEventListener('click', () => {
        gameScreen.style.display = 'none';
        battleScene.style.display = 'flex';
        startGame();
    });
});