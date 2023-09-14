import { rgbToHex } from './test.js';
document.addEventListener('DOMContentLoaded', (event) => {
    const gameScreen = document.getElementById('game-screen');
    const battleScene = document.getElementById('battle-scene');
    const playButton = document.querySelector('.play-button');

    let game;
    let redCube;

    function preload() {
        this.load.image('land', 'assets/images/land.png');
    }

    function isValidPath(startX, startY, endX, endY, originalWidth, originalHeight, width, height, textures) { // based on Bresenham's line algorithm
        let x1 = Math.round(startX * (originalWidth / width));
        let y1 = Math.round(startY * (originalHeight / height));
        let x2 = Math.round(endX * (originalWidth / width));
        let y2 = Math.round(endY * (originalHeight / height));

        let dx = Math.abs(x2 - x1); // find the absolute value of the difference between the x-coordinates of the two points
        let dy = Math.abs(y2 - y1);

        let sx = (x1 < x2) ? 1 : -1; // increment or decrement the x and y values as we step along the line. If x1 is less than x2, we increment x1 by 1, otherwise we decrement it by 1
        let sy = (y1 < y2) ? 1 : -1;

        let err = dx - dy; // to determine when we need to step in the y direction (as opposed to the x direction)

        while (true) {
            const color = textures.getPixel(x1, y1, 'land');

            if (color.blue > 155) {
                return false;
            }

            if (x1 === x2 && y1 === y2) break; // we've reached the end of the line
            let e2 = 2 * err; // calculate the error value for the next step
            if (e2 > -dy) { err -= dy; x1 += sx; } // if the error is greater than -dy, we step in the x direction
            if (e2 < dx) { err += dx; y1 += sy; } // if the error is less than dx, we step in the y direction
        }

        return true;
    }

    function create() {
        const width = this.sys.game.config.width;
        const height = this.sys.game.config.height;

        const land = this.add.image(width / 2, height / 2, 'land').setInteractive();
        land.setScale(2);  // Adjust the scale value to maintain the image quality
        land.setOrigin(0.5, 0.5);
        const originalWidth = land.width;
        const originalHeight = land.height;

        land.setDisplaySize(width, height);

        this.messageText = this.add.text(width / 2, height / 2, '', {
            font: '24px Orbitron',
            fill: '#ff0000',
            align: 'center'
        });
        this.messageText.setOrigin(0.5, 0.5);
        this.messageText.setVisible(false);

        redCube = this.add.graphics();
        redCube.fillStyle(0xff0000);
        const scaleX = width / originalWidth;
        const scaleY = height / originalHeight;

        let redCubePosition = { x: 61 * scaleX, y: 387 * scaleY };

        redCube.fillRect(redCubePosition.x, redCubePosition.y, 50, 50);

        this.input.on('pointerdown', function (pointer) {
            if (pointer.leftButtonDown()) {
                const x = Math.round((pointer.x - land.x + width / 2) * (originalWidth / width));
                const y = Math.round((pointer.y - land.y + height / 2) * (originalHeight / height));

                // Constrain x and y to the dimensions of the texture
                const constrainedX = Math.max(0, Math.min(x, originalWidth - 1));
                const constrainedY = Math.max(0, Math.min(y, originalHeight - 1));

                const color = this.textures.getPixel(constrainedX, constrainedY, 'land');

                if (color.alpha !== 0) {
                    const hexColor = rgbToHex(color.red, color.green, color.blue);
                    console.log('Hex color:', hexColor);

                    if (color.blue > 155) {
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
                        console.log('x:', x, 'y:', y); // coordinates of the pixel
                        // Convert game coordinates to pixel coordinates for the cube
                        const cubeX = (x * width) / originalWidth;
                        const cubeY = (y * height) / originalHeight;

                        const targetPosition = { x: cubeX - 25, y: cubeY - 25 };
                        if (isValidPath(redCubePosition.x + 25, redCubePosition.y + 25, cubeX, cubeY, originalWidth, originalHeight, width, height, this.textures)) {
                            const distance = Phaser.Math.Distance.Between(redCubePosition.x, redCubePosition.y, targetPosition.x, targetPosition.y);
                            const speed = 150; // Adjust the speed value as necessary; units are pixels per second
                            const duration = (distance / speed) * 1000; // Convert from seconds to milliseconds
                    
                            this.tweens.add({
                                targets: redCubePosition,
                                x: targetPosition.x,
                                y: targetPosition.y,
                                duration: duration, // Duration calculated based on speed and distance
                                ease: 'Linear',
                                onUpdate: () => {
                                    redCube.clear();
                                    redCube.fillStyle(0xff0000);
                                    redCube.fillRect(redCubePosition.x, redCubePosition.y, 50, 50);
                                }
                            });
                        } else {
                            console.log("Path crosses over the ocean, cannot move.");
                        }
                    }
                } else {
                    console.log('No color data available');
                }
            }
        }, this);

    }

    // function rgbToHex(r, g, b) {
    //     r = r.toString(16);
    //     g = g.toString(16);
    //     b = b.toString(16);

    //     if (r.length == 1)
    //         r = "0" + r;
    //     if (g.length == 1)
    //         g = "0" + g;
    //     if (b.length == 1)
    //         b = "0" + b;

    //     return "#" + r + g + b;
    // }



    function startGame() {
        const config = {
            type: Phaser.AUTO,
            width: 1920,  // Replace with your desired width
            height: 1080,  // Replace with your desired height
            parent: 'battle-scene',
            scene: {
                preload: preload,
                create: create,
            },
            render: {
                pixelArt: true,  // Maintain this property
            },
        };
        game = new Phaser.Game(config);

        game.canvas.id = 'battle-canvas';
        resize();

        window.addEventListener('resize', () => {
            resize();
        });
    }

    function resize() {
        const battleScene = document.getElementById('battle-scene');
        const gameWidth = game.config.width;
        const gameHeight = game.config.height;

        // Set the canvas dimensions to be exactly the same as the container dimensions
        game.canvas.style.width = battleScene.offsetWidth + 'px';
        game.canvas.style.height = battleScene.offsetHeight + 'px';

        // Remove the margin settings to ensure the canvas fully covers the container
        game.canvas.style.marginTop = '0px';
        game.canvas.style.marginLeft = '0px';
    }

    playButton.addEventListener('click', () => {
        gameScreen.style.display = 'none';
        battleScene.style.display = 'flex';
        startGame();
    });
});
