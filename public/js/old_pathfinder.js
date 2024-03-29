import Player from './player.js';
import Enemy from './enemy.js';
import { rgbToHex, resize, createGrid, loadDynamicSpriteSheet, setAttackCursor, setDefaultCursor } from './utilities.js';

class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        this.gameGrid = null;
        this.player = null;
        this.enemy = null;
        this.land = null;
        this.width = 0;
        this.height = 0;
    }

    init(data) {
        this.gameGrid = data.gameGrid; // Receive the grid from LoadingScene
    }

    create() {
        this.width = this.sys.game.config.width;
        this.height = this.sys.game.config.height;

        this.createLand();
        this.createPlayer();
        this.createEnemy();
        this.setupInputHandlers();
        this.messageText = this.add.text(0, 0, '', { font: '24px Orbitron', fill: '#ff0000', align: 'center' });
        this.messageText.setVisible(false);
    }

    createLand() {
        this.land = this.add.image(this.width / 2, this.height / 2, 'land').setOrigin(0.5, 0.5);
        this.land.setDisplaySize(this.width, this.height);
        this.land.setVisible(true);
    }

    createPlayer() {
        const scaleX = this.width / this.land.width;
        const scaleY = this.height / this.land.height;

        this.player = new Player(this, 245 * scaleX, 200 * scaleY, 1);
        this.player.create();
    }

    createEnemy() {
        const originalWidth = this.land.texture.source[0].width;
        const originalHeight = this.land.texture.source[0].height;

        this.enemy = new Enemy(this, 1000, 500, 3);
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
        
                // Calculate the grid coordinates for the player and enemy
                const playerPosition = this.player.getPosition();
                const gridStartX = Math.floor(playerPosition.x * (originalWidth / this.width));
                const gridStartY = Math.floor(playerPosition.y * (originalHeight / this.height));
                const gridEndX = Math.floor(enemyX * (originalWidth / this.width));
                const gridEndY = Math.floor(enemyY * (originalHeight / this.height));
        
                // Determine if moveStraight or moveAlongPath should be used
                if (this.player.canMoveTo(playerPosition.x, playerPosition.y, enemyX, enemyY, originalWidth, originalHeight, this.width, this.height, this.textures)) {
                    // Use moveStraight
                    this.player.moveStraight(enemyX, enemyY, () => {
                        this.player.playAttackAnimation(this.enemy);
                    });
                } else {
                    // Use moveAlongPath with pathfinding
                    let path = this.player.findPath(this.gameGrid, { x: gridStartX, y: gridStartY }, { x: gridEndX, y: gridEndY });
                    if (path.length > 0) {
                        // Move along the path and then play attack animation
                        let moveIndex = 0;
                        const moveAlongPathRecursive = () => {
                            if (moveIndex >= path.length) {
                                this.player.playAttackAnimation(); // Play attack animation after reaching the enemy
                                return;
                            }
        
                            let point = path[moveIndex];
                            let screenX = (point.x * this.width) / originalWidth;
                            let screenY = (point.y * this.height) / originalHeight;
                            this.player.moveAlongPath(screenX, screenY, () => {
                                moveIndex++;
                                moveAlongPathRecursive();
                            });
                        };
        
                        moveAlongPathRecursive();
                    } else {
                        console.log("No valid path to the enemy");
                    }
                }
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
                const x = Math.floor((pointer.x - this.land.x + this.width / 2) * (originalWidth / this.width));
                const y = Math.floor((pointer.y - this.land.y + this.height / 2) * (originalHeight / this.height));
                // console.log(`Pointer screen coordinates: (${pointer.x}, ${pointer.y})`);
                // console.log(`Transformed grid coordinates: (${x}, ${y})`);
                // Constrain x and y to the dimensions of the texture
                const constrainedX = Math.max(0, Math.min(x, originalWidth - 1));
                const constrainedY = Math.max(0, Math.min(y, originalHeight - 1));

                const color = this.textures.getPixel(constrainedX, constrainedY, 'land');

                if (color.alpha !== 0) {
                    const hexColor = rgbToHex(color.red, color.green, color.blue);
                    // console.log('Hex color:', hexColor);

                    if (color.blue > 200) {
                        console.log("This area is ocean");
                        this.messageText.setText("Can't go there!");
                        this.messageText.setOrigin(0.5, 0.5);
                        this.messageText.setVisible(true);

                        let x = Phaser.Math.Clamp(pointer.x, this.messageText.width / 2, this.sys.game.config.width - this.messageText.width / 2); // ensure the text is within the canvas
                        let y = Phaser.Math.Clamp(pointer.y, this.messageText.height / 2, this.sys.game.config.height - this.messageText.height / 2);
                        // The minimum x and y are set to half of the text's width and height, respectively, to prevent the text from going off the left and top edges of the screen.
                        this.messageText.setPosition(x, y);
                        
                        this.tweens.add({
                            targets: this.messageText,
                            alpha: { start: 0, to: 1 },
                            duration: 500,
                            ease: 'Linear',
                            yoyo: true,
                            repeat: 0,
                            onComplete: () => {
                                this.messageText.setVisible(false);
                                this.messageText.setAlpha(1); // Reset alpha value for the next use
                            }
                        });
                    } else {
                        console.log("This area is land");
                        const cubeX = (x * this.width) / originalWidth;
                        const cubeY = (y * this.height) / originalHeight;

                        if (this.player.canMoveTo(this.player.getPosition().x, this.player.getPosition().y, cubeX, cubeY, originalWidth, originalHeight, this.width, this.height, this.textures)) {
                            console.log("Land to land with no ocean in between");

                            // Normal movement
                            const x = Math.floor((pointer.x - this.land.x + this.width / 2) * (originalWidth / this.width));
                            const y = Math.floor((pointer.y - this.land.y + this.height / 2) * (originalHeight / this.height));
                            const constrainedX = Math.max(0, Math.min(x, originalWidth - 1));
                            const constrainedY = Math.max(0, Math.min(y, originalHeight - 1));
                            const newTargetPosition = { x: (x * this.width) / originalWidth, y: (y * this.height) / originalHeight };

                            this.player.moveStraight(newTargetPosition.x, newTargetPosition.y);

                            // console.log("Player position:", this.player.getPosition());
                        } else {
                            console.log("Path has ocean in between, using A* algorithm");

                            let gridStartX = Math.floor(this.player.getPosition().x * (originalWidth / this.width));
                            let gridStartY = Math.floor(this.player.getPosition().y * (originalHeight / this.height));
                            let gridEndX = Math.floor((cubeX) * (originalWidth / this.width));
                            let gridEndY = Math.floor((cubeY) * (originalHeight / this.height));
                            let path = this.player.findPath(this.gameGrid, { x: gridStartX, y: gridStartY }, { x: gridEndX, y: gridEndY });

                            if (path.length > 0) {
                                // player.drawPath(path, originalWidth, originalHeight, width, height);

                                let moveIndex = 0;
                                const moveAlongPathRecursive = () => {
                                    if (moveIndex >= path.length) {
                                        return; // End of path
                                    }

                                    let point = path[moveIndex];
                                    let screenX = (point.x * this.width) / originalWidth;
                                    let screenY = (point.y * this.height) / originalHeight;

                                    this.player.moveAlongPath(screenX, screenY);

                                    this.player.currentTween.on('complete', () => {
                                        moveIndex++;
                                        moveAlongPathRecursive();
                                    });
                                };

                                moveAlongPathRecursive();


                            } else {
                                console.log("No valid path to the destination");
                            }
                        }
                    }
                } else {
                    console.log('No color data available');
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
        this.assetProgress = 0; // Progress of asset loading
        this.gridProgress = 0;
    }

    preload() {
        this.loadingStartTime = Date.now();
        this.createLoadingText();
        this.loadAssets();

    }

    create() {
        const landTexture = this.textures.get('land');
        const originalWidth = landTexture.getSourceImage().width;
        const originalHeight = landTexture.getSourceImage().height;

        this.createGrid(originalWidth, originalHeight);
        // set default cursor
        this.input.setDefaultCursor(`url('assets/images/mouse_cursor.png') 15 10, pointer`);
    }

    createGrid(originalWidth, originalHeight) {
        this.grid = createGrid(originalWidth, originalHeight, this.textures, (progress) => {
            this.gridProgress = progress;
            this.updateTotalProgress();
        });
    }

    updateTotalProgress() {
        let totalProgress = (this.assetProgress + this.gridProgress) / 2;
        this.loadingText.setText(`Loading... ${Math.round(totalProgress)}%`);

        if (totalProgress >= 100) {
            let loadingEndTime = Date.now();
            let loadingDuration = (loadingEndTime - this.loadingStartTime) / 1000;
            console.log(`Loading completed in ${loadingDuration.toFixed(2)} seconds`);
            this.loadingText.setVisible(false);
            this.scene.start('GameScene', { gameGrid: this.grid });
        }
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
        this.load.image('land', 'assets/images/land.png');
        this.load.image('mouse_cursor', 'assets/images/mouse_cursor.png');
        this.load.image('mouse_cursor_attack', 'assets/images/mouse_cursor_attack.png');
        loadDynamicSpriteSheet.call(this, 'blackRobotIdle', 'assets/sprites/1_idle_spritesheet.png', 5, 12); // no. of col, no. of row
        loadDynamicSpriteSheet.call(this, 'blackRobotMoving', 'assets/sprites/1_moving_spritesheet.png', 12, 10);
        loadDynamicSpriteSheet.call(this, 'blackRobotAttacking', 'assets/sprites/1_attacking_spritesheet.png', 8, 8);
        loadDynamicSpriteSheet.call(this, 'blackRobotDeath', 'assets/sprites/1_death_spritesheet.png', 5, 10);
        // loadDynamicSpriteSheet.call(this, 'goldenWarriorIdle', 'assets/sprites/2_idle_spritesheet.png', 5, 12);
        // loadDynamicSpriteSheet.call(this, 'goldenWarriorMoving', 'assets/sprites/2_moving_spritesheet.png', 12, 10);
        loadDynamicSpriteSheet.call(this, 'enemyIdle', 'assets/sprites/3_idle_spritesheet.png', 5, 12);
        loadDynamicSpriteSheet.call(this, 'enemyMoving', 'assets/sprites/3_moving_spritesheet.png', 10, 12);
        loadDynamicSpriteSheet.call(this, 'enemyDeath', 'assets/sprites/3_death_spritesheet.png', 5, 10);
        loadDynamicSpriteSheet.call(this, 'enemyAttacking', 'assets/sprites/3_attacking_spritesheet.png', 8, 8);
        // loadDynamicSpriteSheet.call(this, 'enemy2Idle', 'assets/sprites/4_idle_spritesheet.png', 14, 8);
        this.load.on('progress', (value) => {
            this.assetProgress = value * 100; // Convert to percentage
            this.updateTotalProgress();
        });
    }

}

document.addEventListener('DOMContentLoaded', (event) => {
    const gameScreen = document.getElementById('main-menu');
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
