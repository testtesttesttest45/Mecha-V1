document.addEventListener('DOMContentLoaded', (event) => {
    const gameScreen = document.getElementById('game-screen');
    const battleScene = document.getElementById('battle-scene');
    const playButton = document.querySelector('.play-button');

    let game;

    function preload() {
        this.load.image('land', 'assets/images/land.png');
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
            font: '1.2vw Orbitron',
            fill: '#ff0000',
            align: 'center'
        });
        this.messageText.setOrigin(0.5, 0.5);
        this.messageText.setVisible(false);

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
                    // console.log('Hex color:', hexColor);

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
                    }
                } else {
                    console.log('No color data available');
                }
            }
        }, this);

    }

    function rgbToHex(r, g, b) {
        r = r.toString(16);
        g = g.toString(16);
        b = b.toString(16);

        if (r.length == 1)
            r = "0" + r;
        if (g.length == 1)
            g = "0" + g;
        if (b.length == 1)
            b = "0" + b;

        return "#" + r + g + b;
    }

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
