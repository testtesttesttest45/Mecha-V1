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
    
        const originalWidth = land.width;
        const originalHeight = land.height;
    
        land.setDisplaySize(width, height);
    
        this.input.on('pointerdown', function (pointer) {
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
                } else {
                    console.log("This area is land");
                }
            } else {
                console.log('No color data available');
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
            width: battleScene.offsetWidth,
            height: battleScene.offsetHeight,
            parent: 'battle-scene',
            scene: {
                preload: preload,
                create: create,
            }
        };
        game = new Phaser.Game(config);

        game.canvas.id = 'battle-canvas';
    }
    playButton.addEventListener('click', () => {
        gameScreen.style.display = 'none';
        battleScene.style.display = 'flex';
        startGame();
    });
});
