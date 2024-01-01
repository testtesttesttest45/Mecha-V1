import characterMap from './characters.js';
class Player {

    constructor(scene, initialX, initialY, characterCode = 1) {
        this.scene = scene;
        this.robotSprite = null;
        this.position = { x: initialX, y: initialY };
        this.currentTween = null;
        this.idleAnimationIndex = 0;
        this.lastAnimationChange = this.scene.time.now;
        this.lastActionTime = this.scene.time.now;
        this.lastDirection = null;
        this.directions = [];
        this.directionAveragingSteps = 10;
        this.characterCode = characterCode;
    }

    create() {
        const character = characterMap[this.characterCode];

        this.robotSprite = this.scene.add.sprite(this.position.x, this.position.y, character.idle);
        this.robotSprite.setOrigin(0.5, 1); // Set origin to bottom center


        for (let i = 0; i < 4; i++) {
            this.scene.anims.create({
                key: `idle${i + 1}`,
                frames: this.scene.anims.generateFrameNumbers(character.idle, { start: i * 15, end: (i + 1) * 15 - 1 }),
                frameRate: 10,
                repeat: -1
            });
        }

        this.robotSprite.play('idle1');
        this.lastAnimationChange = this.scene.time.now;
        this.robotSprite.setScale(0.5);

        const directions = ['southeast', 'southwest', 'south', 'east', 'west', 'northeast', 'northwest', 'north'];
        directions.forEach((dir, index) => {
            this.scene.anims.create({
                key: `move${dir}`,
                frames: this.scene.anims.generateFrameNumbers(character.moving, { start: index * 15, end: (index + 1) * 15 - 1 }),
                frameRate: 10,
                repeat: -1
            });
        });
    }


    moveAlongPath(newX, newY, speed) {
        if (this.currentTween) {
            this.currentTween.stop();
        }

        // Calculate the distance for the tween
        let distance = Phaser.Math.Distance.Between(this.robotSprite.x, this.robotSprite.y, newX, newY);
        let duration = distance / speed * 1000; // Duration based on speed

        // Determine the direction for the new segment
        const newDirection = this.determineDirection(newX, newY);

        // Update direction with averaging/smoothing
        this.directions.push(newDirection);
        if (this.directions.length > this.directionAveragingSteps) {
            this.directions.shift(); // Remove the oldest direction
        }
        const averageDirection = this.calculateAverageDirection(this.directions);

        // Update the sprite's animation based on the averaged direction
        if (this.lastDirection !== averageDirection) {
            this.robotSprite.play(`move${averageDirection}`);
            this.lastDirection = averageDirection;
        }

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

    moveStraight(newX, newY, speed) {
        if (this.currentTween) {
            this.currentTween.stop();
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
        const direction = this.determineDirection(newX, newY);
        this.robotSprite.play(`move${direction}`);
    }

    calculateAverageDirection(directions) {
        // Calculate the most frequent direction in the array
        const directionCounts = directions.reduce((acc, dir) => {
            acc[dir] = (acc[dir] || 0) + 1;
            return acc;
        }, {});

        let mostFrequentDirection = null;
        let maxCount = 0;
        for (let dir in directionCounts) {
            if (directionCounts[dir] > maxCount) {
                mostFrequentDirection = dir;
                maxCount = directionCounts[dir];
            }
        }
        return mostFrequentDirection;
    }

    determineDirection(newX, newY) {
        const dx = newX - this.position.x;
        const dy = newY - this.position.y;
        const angle = Math.atan2(dy, dx) * 180 / Math.PI;

        if (angle >= -22.5 && angle < 22.5) return 'east';
        if (angle >= 22.5 && angle < 67.5) return 'southeast';
        if (angle >= 67.5 && angle < 112.5) return 'south';
        if (angle >= 112.5 && angle < 157.5) return 'southwest';
        if (angle >= 157.5 || angle < -157.5) return 'west';
        if (angle >= -157.5 && angle < -112.5) return 'northwest';
        if (angle >= -112.5 && angle < -67.5) return 'north';
        if (angle >= -67.5 && angle < -22.5) return 'northeast';
    }

    updatePosition() {
        this.position.x = this.robotSprite.x;
        this.position.y = this.robotSprite.y;
    }

    update(time, delta) {
        if (this.currentTween && this.currentTween.isPlaying()) {
            this.robotSprite.setPosition(this.position.x, this.position.y);
        } else {
            if (time - this.lastActionTime > 5000) {
                if (time - this.lastAnimationChange > 5000) {
                    this.idleAnimationIndex = (this.idleAnimationIndex + 1) % 4;
                    this.robotSprite.play(`idle${this.idleAnimationIndex + 1}`);
                    this.lastAnimationChange = time;
                }
            } else if (!this.robotSprite.anims.isPlaying) {
                this.robotSprite.play(`idle${this.idleAnimationIndex + 1}`);
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
        // console.log(`Checking path from grid (${x1}, ${y1}) to (${x2}, ${y2})`);

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

    drawPath(path, originalWidth, originalHeight, width, height) {
        if (!this.pathGraphics) {
            this.pathGraphics = this.scene.add.graphics({ lineStyle: { width: 6, color: 0xff0000 } });
        }

        this.pathGraphics.clear(); // Clear previous path
        if (path.length < 2) return;

        this.pathGraphics.beginPath();
        let firstPoint = path[0];
        let firstScreenX = (firstPoint.x * width) / originalWidth;
        let firstScreenY = (firstPoint.y * height) / originalHeight;
        this.pathGraphics.moveTo(firstScreenX, firstScreenY);

        for (let i = 1; i < path.length; i++) {
            let point = path[i];
            let screenX = (point.x * width) / originalWidth;
            let screenY = (point.y * height) / originalHeight;
            this.pathGraphics.lineTo(screenX, screenY);
        }

        this.pathGraphics.strokePath();
    }

}

export default Player;
