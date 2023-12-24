class Player {

    constructor(scene, initialX, initialY) {
        this.scene = scene;
        this.redCube = null;
        this.redCubePosition = { x: initialX, y: initialY };
        this.currentTween = null;
    }

    create() {
        this.redCube = this.scene.add.graphics();
        this.redCube.fillStyle(0xff0000);
        this.redCube.fillRect(
            this.redCubePosition.x - 25, // Subtract half the width of the cube
            this.redCubePosition.y - 25, // Subtract half the height of the cube
            50, 50 // Width and height of the cube
        );
    }

    move(newX, newY, speed) {
        if (this.currentTween) {
            this.currentTween.stop();
        }

        let distance = Phaser.Math.Distance.Between(this.redCubePosition.x, this.redCubePosition.y, newX, newY);
        let duration = distance / speed * 1000;

        this.currentTween = this.scene.tweens.add({
            targets: this.redCubePosition,
            x: newX,
            y: newY,
            duration: duration,
            ease: 'Linear',
            onUpdate: () => this.update()
        });
    }

    update() {
        this.redCube.clear();
        this.redCube.fillStyle(0xff0000);
        this.redCube.fillRect(
            this.redCubePosition.x - 25, // Subtract half the width of the cube
            this.redCubePosition.y - 25, // Subtract half the height of the cube
            50, 50 // Width and height of the cube
        );
        this.redCube.fillStyle(0x00ff00); // Use a different color for visibility
        this.redCube.fillCircle(this.redCubePosition.x, this.redCubePosition.y, 5);
    }

    getPosition() {
        return this.redCubePosition;
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
