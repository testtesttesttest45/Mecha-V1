import Player from './player.js';
import Enemy from './enemy.js';
import { rgbToHex, resize, createGrid, loadDynamicSpriteSheet } from './utilities.js';

class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        this.gameGrid = null;
        this.player = null;
        this.enemy = null;
    }

    preload() {

    }

    init(data) {
        this.gameGrid = data.gameGrid; // Receive the grid from LoadingScene
    }
    create() {
        const width = this.sys.game.config.width;
        const height = this.sys.game.config.height;

        const land = this.add.image(width / 2, height / 2, 'land').setOrigin(0.5, 0.5);
        land.setDisplaySize(width, height);
        land.setVisible(true);

        // Scale factors
        const scaleX = width / land.width;
        const scaleY = height / land.height;
        // this.input.setDefaultCursor(`url('assets/images/mouse_cursor.png'), pointer`);
        // offset by (5,10) for the cursor
        this.input.setDefaultCursor(`url('assets/images/mouse_cursor.png') 15 10, pointer`);

        // Create and setup player, enemy, etc. using this.gameGrid
        // Player creation example (adjust as needed):
        this.player = new Player(this, 45 * scaleX, 113 * scaleY, 1);
        this.player.create();
        const originalWidth = land.texture.source[0].width;
        const originalHeight = land.texture.source[0].height;

        this.enemy = new Enemy(this, 1000, 500, 3);
        this.enemy.create();
        
        // Change cursor when hovering over the enemy
        this.enemy.sprite.on('pointerover', () => {
            this.input.setDefaultCursor(`url('assets/images/mouse_cursor_attack.png') 15 10, pointer`);
        });
        this.enemy.sprite.on('pointerout', () => {
            this.input.setDefaultCursor(`url('assets/images/mouse_cursor.png') 15 10, pointer`);
        });

        // const color = this.textures.getPixel(player.getPosition().x, player.getPosition().y, 'land');
        let textureX = this.player.getPosition().x * (originalWidth / width);
        let textureY = this.player.getPosition().y * (originalHeight / height);
        const color = this.textures.getPixel(Math.floor(textureX), Math.floor(textureY), 'land');
        const hexColor = rgbToHex(color.red, color.green, color.blue);
        // console.log('Hex color red cube is standing on:', hexColor);

        this.messageText = this.add.text(width / 2, height / 2, '', {
            font: '24px Orbitron',
            fill: '#ff0000',
            align: 'center'
        });
        this.messageText.setOrigin(0.5, 0.5);
        this.messageText.setVisible(false);

        this.input.on('pointerdown', function (pointer) {
            if (pointer.leftButtonDown()) {
                const x = Math.floor((pointer.x - land.x + width / 2) * (originalWidth / width));
                const y = Math.floor((pointer.y - land.y + height / 2) * (originalHeight / height));
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

                        let x = Phaser.Math.Clamp(pointer.x, this.messageText.width / 2, this.sys.game.config.width - this.messageText.width / 2); // ensure the text is within the canvas
                        let y = Phaser.Math.Clamp(pointer.y, this.messageText.height / 2, this.sys.game.config.height - this.messageText.height / 2);
                        // The minimum x and y are set to half of the text's width and height, respectively, to prevent the text from going off the left and top edges of the screen.
                        this.messageText.setPosition(x, y);
                        this.messageText.setText("Can't go there!");
                        this.messageText.setVisible(true);

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
                        const cubeX = (x * width) / originalWidth;
                        const cubeY = (y * height) / originalHeight;

                        if (this.player.canMoveTo(this.player.getPosition().x, this.player.getPosition().y, cubeX, cubeY, originalWidth, originalHeight, width, height, this.textures)) {
                            console.log("Land to land with no ocean in between");
                            const newTargetPosition = { x: (x * width) / originalWidth, y: (y * height) / originalHeight };
                            const speed = 150;
                            this.player.moveStraight(newTargetPosition.x, newTargetPosition.y, speed);
                            console.log("Player position:", this.player.getPosition());
                        } else {
                            console.log("Path has ocean in between, using A* algorithm");

                            let gridStartX = Math.floor(this.player.getPosition().x * (originalWidth / width));
                            let gridStartY = Math.floor(this.player.getPosition().y * (originalHeight / height));
                            let gridEndX = Math.floor((cubeX) * (originalWidth / width));
                            let gridEndY = Math.floor((cubeY) * (originalHeight / height));
                            let path = this.player.findPath(this.gameGrid, { x: gridStartX, y: gridStartY }, { x: gridEndX, y: gridEndY });

                            if (path.length > 0) {
                                // player.drawPath(path, originalWidth, originalHeight, width, height);

                                let moveIndex = 0;
                                const moveAlongPathRecursive = () => {
                                    if (moveIndex >= path.length) {
                                        return; // End of path
                                    }

                                    let point = path[moveIndex];
                                    let screenX = (point.x * width) / originalWidth;
                                    let screenY = (point.y * height) / originalHeight;
                                    let speed = 450;

                                    this.player.moveAlongPath(screenX, screenY, speed);

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
                this.player.lastActionTime = this.time.now;
            }
        }, this);

        this.input.enabled = true;

        this.sceneName = "battle-scene";
    }

    update(time) {
        if (this.player) {
            this.player.update(time);
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
        loadDynamicSpriteSheet.call(this, 'blackRobotIdle', 'assets/sprites/1_idle_spritesheet.png', 5, 12);
        loadDynamicSpriteSheet.call(this, 'blackRobotMoving', 'assets/sprites/1_moving_spritesheet.png', 12, 10);
        // loadDynamicSpriteSheet.call(this, 'goldenWarriorIdle', 'assets/sprites/2_idle_spritesheet.png', 5, 12);
        // loadDynamicSpriteSheet.call(this, 'goldenWarriorMoving', 'assets/sprites/2_moving_spritesheet.png', 12, 10);
        loadDynamicSpriteSheet.call(this, 'enemyIdle', 'assets/sprites/3_idle_spritesheet.png', 5, 12);
        this.load.on('progress', (value) => {
            this.assetProgress = value * 100; // Convert to percentage
            this.updateTotalProgress();
        });
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
                    debug: false // true to see physics bodies for debugging
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