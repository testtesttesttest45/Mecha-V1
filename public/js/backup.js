import { rgbToHex, resize, gamePause, isValidPath } from './functions.js';
document.addEventListener('DOMContentLoaded', (event) => {
    const gameScreen = document.getElementById('game-screen');
    const battleScene = document.getElementById('battle-scene');
    const playButton = document.querySelector('.play-button');
    const resumeButton = document.querySelector('.resume-button');
    const overlay = document.getElementById('loading-overlay');


    let game;
    let redCube;
    let resumeButtonPressed = false;
    let gameGrid = null;  // Will hold the grid data once computed
    let isLoading = false;


    function preload() {
        this.load.image('land', 'assets/images/land.png');
    }

    function create() {

        const width = this.sys.game.config.width;
        const height = this.sys.game.config.height;
        let currentTween;
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
        land.setDisplaySize(width, height);
        land.setVisible(false);  // Hide the land for now

        setTimeout(() => {
            if (!gameGrid) {
                gameGrid = createGrid(originalWidth, originalHeight, this.textures, (progress) => {
                    this.loadingText.setText(`Loading... ${Math.round(progress)}%`);

                    if (progress >= 100) {
                        this.loadingText.setVisible(false);
                        land.setVisible(true);
                        // initial red cube after the land is loaded
                        redCube = this.add.graphics();
                        redCube.fillStyle(0xff0000);
                        redCube.fillRect(redCubePosition.x, redCubePosition.y, 50, 50);
                    }
                });
            }
        }, 10);  // createGrid() function is computationally expensive and is "blocking" the rendering of the 'Loading...' text until it completes

        const scaleX = width / originalWidth;
        const scaleY = height / originalHeight;
        let redCubePosition = { x: 61 * scaleX, y: 387 * scaleY };

        this.messageText = this.add.text(width / 2, height / 2, '', {
            font: '24px Orbitron',
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
                        let lastTargetPosition = null;

                        // Inside your pointerdown event handler
                        console.log("This area is land");
                        const cubeX = (x * width) / originalWidth;
                        const cubeY = (y * height) / originalHeight;
                        const newTargetPosition = { x: cubeX - 25, y: cubeY - 25 };

                        if (isValidPath(redCubePosition.x + 25, redCubePosition.y + 25, cubeX, cubeY, originalWidth, originalHeight, width, height, this.textures)) {
                            // Check if the new target position is significantly different from the last target position
                            if (!lastTargetPosition || Phaser.Math.Distance.Between(newTargetPosition.x, newTargetPosition.y, lastTargetPosition.x, lastTargetPosition.y) > threshold) {
                                lastTargetPosition = newTargetPosition;

                                const distance = Phaser.Math.Distance.Between(redCubePosition.x, redCubePosition.y, newTargetPosition.x, newTargetPosition.y);
                                const speed = 200; // units are pixels per second
                                const duration = (distance / speed) * 1000;

                                if (currentTween) {
                                    console.log("HERE")
                                    currentTween.stop();
                                }

                                // Start a new tween for the new target position
                                currentTween = this.tweens.add({
                                    targets: redCubePosition,
                                    x: newTargetPosition.x,
                                    y: newTargetPosition.y,
                                    duration: duration, // Duration calculated based on speed and distance
                                    ease: 'Linear',
                                    onUpdate: () => {
                                        redCube.clear();
                                        redCube.fillStyle(0xff0000);
                                        redCube.fillRect(redCubePosition.x, redCubePosition.y, 50, 50);
                                    }
                                });
                            }
                        } else {
                            console.log("Path crosses over the ocean");

                            let screenPath = findShorelinePath(
                                Math.round(redCubePosition.x / scaleX),
                                Math.round(redCubePosition.y / scaleY),
                                x, y,
                                originalWidth, originalHeight,
                                width, height,
                                this.textures
                            );

                            if (screenPath.length > 0) {
                                

                                // Define a recursive function to handle sequential tweening
                                let createTween = (index) => {
                                    if (index >= screenPath.length) return; // Exit condition for the recursion

                                    const targetPosition = screenPath[index];
                                    const distance = Phaser.Math.Distance.Between(
                                        redCubePosition.x, redCubePosition.y, targetPosition.x, targetPosition.y
                                    );
                                    const speed = 300;
                                    const duration = (distance / speed) * 1000;

                                    // Stop any ongoing tween before creating a new one
                                    if (currentTween) {
                                        currentTween.stop();
                                    }

                                    currentTween = this.tweens.add({
                                        targets: redCubePosition,
                                        x: targetPosition.x,
                                        y: targetPosition.y,
                                        duration: duration,
                                        ease: 'Linear',
                                        onUpdate: () => {
                                            redCube.clear();
                                            redCube.fillStyle(0xff0000);
                                            redCube.fillRect(redCubePosition.x, redCubePosition.y, 50, 50);
                                        },
                                        onComplete: () => createTween(index + 1) // On complete, create a tween for the next point
                                    });
                                };

                                createTween(0);


                            } else {
                                console.log("No valid path found");
                            }
                        }
                    }
                } else {
                    console.log('No color data available');
                }
            }
        }, this);

        this.pauseText = this.add.text(width / 2, (height / 2) - 100, 'Pause', {
            font: '74px Orbitron',
            fill: '#ff0000',
            align: 'center',

        });
        this.pauseText.setOrigin(0.5, 0.5);
        this.pauseText.setVisible(false); // Hide the text initially

        this.input.enabled = true; // Ensure the input is enabled at the beginning

        this.sceneName = "battle-scene"; // Add a custom property to identify the scene


    }

    document.addEventListener('visibilitychange', () => {
        console.log(isLoading)
        if (!isLoading && (resumeButtonPressed || document.hidden)) {
            gamePause(document.hidden, game);
        }
        resumeButtonPressed = false;
    });

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

    resumeButton.addEventListener('click', () => {
        resumeButtonPressed = true; // Set the flag to true when the resume button is clicked
        game.scene.scenes[0].pauseText.setVisible(false);
        game.scene.scenes[0].input.enabled = true;
        if (!game.scene.scenes[0].scene.isActive()) {  // Ensure the scene is paused before resuming
            game.scene.scenes[0].scene.resume();  // Resuming the scene when resume button is clicked
        }
        game.scene.scenes[0].tweens.resumeAll();  // Resume all active tweens
        game.loop.resume();
        resumeButton.style.display = 'none';
    });

    function findShorelinePath(startX, startY, endX, endY, originalWidth, originalHeight, width, height, textures) {
        // Step 1: Create a 2D array representing the grid
        // let grid = createGrid(originalWidth, originalHeight, textures);

        // Step 2: Implement A* algorithm to find the shortest path avoiding the ocean
        let path = aStarAlgorithm(gameGrid, { x: startX, y: startY }, { x: endX, y: endY });
        // Step 3: Convert the path to screen coordinates
        let screenPath = path.map(node => ({
            x: (node.x * width) / originalWidth,
            y: (node.y * height) / originalHeight
        }));

        return screenPath;
    }

    function createGrid(width, height, textures, onProgress) {
        isLoading = true;
        overlay.style.display = 'block';
        let grid = new Array(height).fill(null).map(() => new Array(width).fill(0));
        const totalCells = width * height;
        let processedCells = 0;
        const rowsPerChunk = 10; // Adjust this number as necessary for performance

        function processChunk(startY) {
            let endY = Math.min(startY + rowsPerChunk, height);
            for (let y = startY; y < endY; y++) {
                for (let x = 0; x < width; x++) {
                    let color = textures.getPixel(x, y, 'land');
                    grid[y][x] = color.blue > 155 ? 1 : 0;

                    processedCells++;
                }
            }

            const progress = (processedCells / totalCells) * 100;
            if (onProgress && typeof onProgress === 'function') {
                onProgress(progress);
            }

            if (endY < height) {
                // Move on to the next chunk
                setTimeout(() => processChunk(endY), 0);
            } else {
                console.log('Grid created');
                isLoading = false;
                overlay.style.display = 'none';
            }
        }

        processChunk(0);
        return grid;
    }

    function aStarAlgorithm(grid, start, end) {
        let openSet = [start];
        let cameFrom = grid.map(row => row.map(() => null));

        let gScores = grid.map(row => row.map(() => Infinity));
        gScores[start.y][start.x] = 0;

        let fScores = grid.map(row => row.map(() => Infinity));
        fScores[start.y][start.x] = heuristic(start, end);

        while (openSet.length > 0) {
            let current = lowestFScore(openSet, fScores);
            if (current.x === end.x && current.y === end.y) {
                return reconstructPath(cameFrom, current);
            }

            openSet = openSet.filter(node => node.x !== current.x || node.y !== current.y);

            for (let neighbor of getNeighbors(current, grid)) {
                let tentativeGScore = gScores[current.y][current.x] + 1; // Assuming each move has a cost of 1
                if (tentativeGScore < gScores[neighbor.y][neighbor.x]) {
                    cameFrom[neighbor.y][neighbor.x] = current;
                    gScores[neighbor.y][neighbor.x] = tentativeGScore;
                    fScores[neighbor.y][neighbor.x] = tentativeGScore + heuristic(neighbor, end);
                    if (!openSet.some(node => node.x === neighbor.x && node.y === neighbor.y)) {
                        openSet.push(neighbor);
                    }
                }
            }
        }

        return []; // Return an empty array if no path was found
    }

    function heuristic(node, end) {
        return Math.abs(node.x - end.x) + Math.abs(node.y - end.y);
    }

    function getNeighbors(node, grid) {
        let neighbors = [];

        let directions = [
            { dx: 1, dy: 0 },
            { dx: -1, dy: 0 },
            { dx: 0, dy: 1 },
            { dx: 0, dy: -1 },
        ];

        for (let dir of directions) {
            let x = node.x + dir.dx;
            let y = node.y + dir.dy;

            if (x >= 0 && y >= 0 && x < grid[0].length && y < grid.length && grid[y][x] === 0) {
                neighbors.push({ x: x, y: y });
            }
        }

        return neighbors;
    }

    function lowestFScore(openSet, fScores) {
        let lowest = openSet[0];
        for (let node of openSet) {
            if (fScores[node.y][node.x] < fScores[lowest.y][lowest.x]) {
                lowest = node;
            }
        }

        return lowest;
    }

    function reconstructPath(cameFrom, current) {
        let path = [];
        while (current !== null) {
            path.push(current);
            current = cameFrom[current.y][current.x];
        }
        return path.reverse();
    }

});