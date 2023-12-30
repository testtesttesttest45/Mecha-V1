class Player {

    constructor(scene, initialX, initialY) {
        this.scene = scene;
        this.robotSprite = null;
        // this.position = { x: initialX, y: initialY };
        // this.position will not be center of robot, but on bottom center, which is the feet
        this.position = { x: initialX, y: initialY };
        this.currentTween = null;
        this.idleAnimationIndex = 0;
        this.lastAnimationChange = this.scene.time.now; // Add this line
        this.lastActionTime = this.scene.time.now; // Add this line

    }

    create() {
        this.robotSprite = this.scene.add.sprite(this.position.x, this.position.y, 'blackRobot');
        this.robotSprite.setOrigin(0.5, 1); // Sets the anchor to the bottom middle of the sprite


        for (let i = 0; i < 4; i++) {
            this.scene.anims.create({
                key: `idle${i + 1}`,
                frames: this.scene.anims.generateFrameNumbers('blackRobot', { start: i * 15, end: (i + 1) * 15 - 1 }),
                frameRate: 10,
                repeat: -1
            });
        }

        this.robotSprite.play('idle1');
        this.lastAnimationChange = this.scene.time.now;
        this.robotSprite.setScale(0.5);
    }
    

    move(newX, newY, speed) {
        if (this.currentTween) {
            this.currentTween.stop();  // Stop any existing tween animation
        }

        // Calculate the distance for the tween
        let distance = Phaser.Math.Distance.Between(this.robotSprite.x, this.robotSprite.y, newX, newY);
        let duration = distance / speed * 1000;  // Duration based on speed

        // Create a new tween for smooth movement
        this.currentTween = this.scene.tweens.add({
            targets: this.robotSprite,
            x: newX,
            y: newY,
            duration: duration,
            ease: 'Linear',
            onUpdate: () => this.updatePosition()
        });
        this.lastActionTime = this.scene.time.now; // Reset last action time on movement
    }

    updatePosition() {
        // Update the internal position object to match the sprite's position
        this.position.x = this.robotSprite.x;
        this.position.y = this.robotSprite.y;
    }

    update(time, delta) {
        // If there is an active tween, update the robot's position
        if (this.currentTween && this.currentTween.isPlaying()) {
            this.robotSprite.setPosition(this.position.x, this.position.y);
        }
    
        // Check if the player has been idle for more than 5 seconds
        if (time - this.lastActionTime > 5000) {
            // Check if it's time to change the idle animation
            if (time - this.lastAnimationChange > 5000) {
                this.idleAnimationIndex = (this.idleAnimationIndex + 1) % 4;
                this.robotSprite.play(`idle${this.idleAnimationIndex + 1}`);
                this.lastAnimationChange = time;
            }
        }
    }

    getPosition() {
        return this.robotSprite ? { x: this.robotSprite.x, y: this.robotSprite.y } : this.position;
    }

    canMoveTo(startX, startY, endX, endY, originalWidth, originalHeight, width, height, textures) {
        let x1 = Math.floor(startX * (originalWidth / width));
        let y1 = Math.floor(startY * (originalHeight / height));
        let x2 = Math.floor(endX * (originalWidth / width));
        let y2 = Math.floor(endY * (originalHeight / height));
        console.log(`Checking path from grid (${x1}, ${y1}) to (${x2}, ${y2})`);

        let dx = Math.abs(x2 - x1);
        let dy = Math.abs(y2 - y1);

        let sx = (x1 < x2) ? 1 : -1;
        let sy = (y1 < y2) ? 1 : -1;

        let err = dx - dy;

        while (true) {
            const color = textures.getPixel(x1, y1, 'land');

            if (color.blue > 200) {
                return false; // Path is invalid
            }

            if (x1 === x2 && y1 === y2) break;
            let e2 = 2 * err;
            if (e2 > -dy) { err -= dy; x1 += sx; }
            if (e2 < dx) { err += dx; y1 += sy; }
        }

        return true; // Path is valid
    }

    aStarAlgorithm(grid, start, end) {
        let openSet = [start];
        let cameFrom = grid.map(row => row.map(() => null));

        let gScores = grid.map(row => row.map(() => Infinity));
        gScores[start.y][start.x] = 0;

        let fScores = grid.map(row => row.map(() => Infinity));
        fScores[start.y][start.x] = this.heuristic(start, end);

        while (openSet.length > 0) {
            let current = this.lowestFScore(openSet, fScores);
            if (current.x === end.x && current.y === end.y) {
                return this.reconstructPath(cameFrom, current);
            }

            openSet = openSet.filter(node => node.x !== current.x || node.y !== current.y);

            for (let neighbor of this.getNeighbors(current, grid)) {
                let tentativeGScore = gScores[current.y][current.x] + 1;
                if (tentativeGScore < gScores[neighbor.y][neighbor.x]) {
                    cameFrom[neighbor.y][neighbor.x] = current;
                    gScores[neighbor.y][neighbor.x] = tentativeGScore;
                    fScores[neighbor.y][neighbor.x] = tentativeGScore + this.heuristic(neighbor, end);
                    if (!openSet.some(node => node.x === neighbor.x && node.y === neighbor.y)) {
                        openSet.push(neighbor);
                    }
                }
            }
        }

        return []; // Return an empty array if no path was found
    }

    heuristic(node, end) {
        return Math.abs(node.x - end.x) + Math.abs(node.y - end.y);
    }

    getNeighbors(node, grid) {
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

            if (x >= 0 && y >= 0 && x < grid[0].length && y < grid.length) {
                if (grid[y][x] === 0) {
                    neighbors.push({ x: x, y: y });
                } else {
                    // console.log(`(${x}, ${y}) is blocked`);
                }
            }
        }

        return neighbors;
    }


    lowestFScore(openSet, fScores) {
        let lowest = openSet[0];
        for (let node of openSet) {
            if (fScores[node.y][node.x] < fScores[lowest.y][lowest.x]) {
                lowest = node;
            }
        }

        return lowest;
    }

    reconstructPath(cameFrom, current) {
        let path = [];
        while (current !== null) {
            path.push(current);
            current = cameFrom[current.y][current.x];
        }
        return path.reverse();
    }

    findPath(grid, start, end) {
        return this.aStarAlgorithm(grid, start, end);
    }


}

export default Player;
