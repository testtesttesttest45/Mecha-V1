import Player from './player.js';
import { rgbToHex, resize, createGrid } from './utilities.js';

document.addEventListener('DOMContentLoaded', (event) => {
    const gameScreen = document.getElementById('game-screen');
    const battleScene = document.getElementById('battle-scene');
    const playButton = document.querySelector('.play-button');

    let game;
    let gameGrid = null;
    let player;

    function preload() {
        this.load.image('land', 'assets/images/land.png');
    }

    function create() {
        const landTexture = this.textures.get('land');
        console.log(`Texture Dimensions: ${landTexture.getSourceImage().width} x ${landTexture.getSourceImage().height}`);
        const width = this.sys.game.config.width;
        const height = this.sys.game.config.height;
        console.log(`Canvas dimensions: ${width} x ${height}`);
        this.loadingText = this.add.text(width / 2, (height / 2) - 100, 'Loading...', {
            font: '74px Orbitron',
            fill: '#fff',
            align: 'center'
        });
        this.loadingText.setOrigin(0.5, 0.5);
        this.loadingText.setVisible(true);  // Show the loading text

        const land = this.add.image(width / 2, height / 2, 'land').setInteractive();
        land.setScale(2);
        land.setOrigin(0.5, 0.5);
        const originalWidth = land.width;
        const originalHeight = land.height;
        console.log(`Original Dimensions: ${originalWidth} x ${originalHeight}`);

        land.setDisplaySize(width, height);
        land.setVisible(false);  // Hide the land for now
        const scaleX = width / originalWidth;
        const scaleY = height / originalHeight;

        setTimeout(() => {
            if (!gameGrid) {
                gameGrid = createGrid(originalWidth, originalHeight, this.textures, (progress) => { // texture might have a problem. on coordiantes (23, 121), it is a yellow color, but when creating grid, it shows the coordiantes as blue

                    console.log(`Original Dimensions2: ${originalWidth} x ${originalHeight}`);

                    this.loadingText.setText(`Loading... ${Math.round(progress)}%`);

                    if (progress >= 100) {
                        this.loadingText.setVisible(false);
                        land.setVisible(true);
                        // After land image is set up
                        // use gold color

                        player = new Player(this, 45 * scaleX, 113 * scaleY);
                        player.create();
                        // const color = this.textures.getPixel(player.getPosition().x, player.getPosition().y, 'land');
                        let textureX = player.getPosition().x * (originalWidth / width);
                        let textureY = player.getPosition().y * (originalHeight / height);
                        const color = this.textures.getPixel(Math.floor(textureX), Math.floor(textureY), 'land');
                        const hexColor = rgbToHex(color.red, color.green, color.blue);
                        console.log('Hex color red cube is standing on:', hexColor);
                    }
                });
            }
        }, 10);  // createGrid() function is computationally expensive and is "blocking" the rendering of the 'Loading...' text until it completes



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
                console.log(`Pointer screen coordinates: (${pointer.x}, ${pointer.y})`);
                console.log(`Transformed grid coordinates: (${x}, ${y})`);
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
                            yoyo: true, // tween play in reverse/fade-out effect
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

                        if (player.canMoveTo(player.getPosition().x, player.getPosition().y, cubeX, cubeY, originalWidth, originalHeight, width, height, this.textures)) {
                            const newTargetPosition = { x: (x * width) / originalWidth , y: (y * height) / originalHeight  };
                            const speed = 150;
                            player.move(newTargetPosition.x, newTargetPosition.y, speed);

                        } else {
                            console.log("Path crosses over the ocean");

                            let gridStartX = Math.floor(player.getPosition().x * (originalWidth / width));
                            let gridStartY = Math.floor(player.getPosition().y * (originalHeight / height));
                            let gridEndX = Math.floor((cubeX) * (originalWidth / width));
                            let gridEndY = Math.floor((cubeY) * (originalHeight / height));
                            let path = player.findPath(gameGrid, { x: gridStartX, y: gridStartY }, { x: gridEndX, y: gridEndY });

                            if (path.length > 0) {
                                let moveAlongPath = (path, index) => {
                                    if (index >= path.length) return; // End of path
                                
                                    let nextPoint = path[index];
                                    let screenX = (nextPoint.x * width) / originalWidth;
                                    let screenY = (nextPoint.y * height) / originalHeight;
                                
                                    const speed = 500;
                                
                                    player.move(screenX, screenY, speed);
                                    // it doesnt move. if i change the speed to 100, it moves but super slow. if i use higher, 
                                
                                    player.currentTween.on('complete', () => {
                                        moveAlongPath(path, index + 1);
                                    });
                                };

                                moveAlongPath(path, 0);

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

        this.input.enabled = true; // Ensure the input is enabled at the beginning

        this.sceneName = "battle-scene"; // Add a custom property to identify the scene

    }

    function startGame() {
        const config = {
            type: Phaser.AUTO,
            width: 1920,
            height: 1080,
            parent: 'battle-scene',
            scene: {
                preload: preload,
                create: create,
            },
            render: {
                pixelArt: true,
            },
        };
        game = new Phaser.Game(config);

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
