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
        const character = characterMap[this.characterCode];
        this.range = character.range;
        this.speed = character.speed;
        this.attack = character.attack;
        this.spritesheetKey = character.spritesheetKey;
        this.isAttacking = false;
        this.attackEvent = null;
        this.health = character.health;
        this.totalHealth = character.health; // Store the total health
        this.healthBar = null;
    }

    create() {

        this.robotSprite = this.scene.add.sprite(this.position.x, this.position.y);
        this.robotSprite.setOrigin(0.5, 0.8);


        // for (let i = 0; i < 4; i++) {
        //     this.scene.anims.create({
        //         key: `idle${i + 1}`,
        //         frames: this.scene.anims.generateFrameNumbers(this.idleAnimationKey, { start: i * 15, end: (i + 1) * 15 - 1 }),
        //         frameRate: 10,
        //         repeat: -1
        //     });
        // }// the above code looops through the idle animation and creates a new animation for each of the 4 directions

        for (let i = 0; i < 4; i++) {
            this.scene.anims.create({
                key: `idle${i + 1}`,
                frames: this.scene.anims.generateFrameNumbers(this.spritesheetKey, { start: i * 5, end: i * 5 + 4 }),
                frameRate: 6,
                repeat: -1,
            });
        }
        this.robotSprite.play('idle1');
        this.lastAnimationChange = this.scene.time.now;
        this.robotSprite.setScale(0.5);


        const directions = ['southeast', 'southwest', 'south', 'east', 'west', 'northeast', 'northwest', 'north'];
        directions.forEach((dir, index) => {
            this.scene.anims.create({
                key: `move${dir}`,
                frames: this.scene.anims.generateFrameNumbers(this.spritesheetKey, { start: 20 + (index * 5), end: 20 + (index * 5) + 4 }),
                frameRate: 6,
                repeat: -1
            });
        });


        // Create attacking animations
        directions.forEach((dir, index) => {
            this.scene.anims.create({
                key: `attack${dir}`,
                frames: this.scene.anims.generateFrameNumbers(this.spritesheetKey, { start: 60 + (index * 5), end: 60 + (index * 5) + 4 }),
                frameRate: 6,
                repeat: -1
            });
        });

        // Create death animation
        this.scene.anims.create({
            key: 'death',
            frames: this.scene.anims.generateFrameNumbers(this.spritesheetKey, { start: 100, end: 105 }), // 105 does not exist. i use it to hide the final frame
            frameRate: 6,
            repeat: 0
        });

        this.createHealthBar();

    }

    moveStraight(newX, newY, onCompleteCallback = null) {
        this.stopAttacking();
        if (this.currentTween) {
            this.currentTween.stop();
        }

        let targetDistance = Phaser.Math.Distance.Between(this.robotSprite.x, this.robotSprite.y, newX, newY);

        if (this.scene.enemyClicked && targetDistance <= this.range) {
            this.playAttackAnimation(this.scene.enemy);
            return; // dont continue moving
        } else if (this.scene.enemyClicked && targetDistance > this.range) {
            // Adjust the target position to stop at the attack range
            let angleToTarget = Phaser.Math.Angle.Between(this.robotSprite.x, this.robotSprite.y, newX, newY);
            newX = this.robotSprite.x + Math.cos(angleToTarget) * (targetDistance - this.range);
            newY = this.robotSprite.y + Math.sin(angleToTarget) * (targetDistance - this.range);
        }

        const direction = this.determineDirection(newX, newY);
        this.robotSprite.play(`move${direction}`);
        this.lastDirection = direction;
        // console.log('lastDirection: ' + this.lastDirection);

        let distance = Phaser.Math.Distance.Between(this.robotSprite.x, this.robotSprite.y, newX, newY);
        let duration = distance / this.speed * 1000;  // Duration based on speed
        this.currentTween = this.scene.tweens.add({
            targets: this.robotSprite,
            x: newX,
            y: newY,
            duration: duration,
            ease: 'Linear',
            onUpdate: () => this.updatePosition(),
            onComplete: () => {
                if (this.scene.enemyClicked) {
                    this.scene.enemyClicked = false; // Reset the flag after attacking
                }
                if (onCompleteCallback) {
                    onCompleteCallback();
                }
            }
        });

        this.lastActionTime = this.scene.time.now; // Reset last action time on movement
    }

    playAttackAnimation(enemy) {
        const direction = this.determineDirectionToEnemy();
        const currentAnim = this.robotSprite.anims.currentAnim;
        console.log(direction)
        if (currentAnim && currentAnim.key.startsWith('attack')) {
            return; // If already playing an attack animation, do nothing
        }

        this.isAttacking = true; // Set the flag to true when attack starts
        const attackAnimationKey = `attack${direction}`;
        this.robotSprite.play(attackAnimationKey);
        this.currentEnemy = enemy; // Store a reference to the current enemy being attacked

        if (this.attackEvent) {
            this.attackEvent.remove(false);
        }

        // Remove any existing listeners to avoid duplicates
        this.robotSprite.off('animationupdate');
        // Add a listener for the animation frame event
        this.robotSprite.on('animationupdate', (anim, frame) => {
            // Check if the current frame is the specific frame where damage should be applied
            if (anim.key === attackAnimationKey && frame.index === 4) {
                if (this.currentEnemy) {
                    this.currentEnemy.takeDamage(this.attack, this); // now then apply the damage
                }
            }
        }, this);

        // Ensure that the listener is removed after the attack animation completes
        this.robotSprite.once('animationcomplete', () => {
            this.robotSprite.off('animationupdate');
        }, this);
    }

    stopAttacking() {
        if (this.attackEvent) {
            this.attackEvent.remove(false);
            this.attackEvent = null;
        }
        this.isAttacking = false;
        this.currentEnemy = null;

        // Transition back to idle animation
        if (!this.currentTween || !this.currentTween.isPlaying()) {
            this.robotSprite.play(`death`); // Play the default idle animation
        }
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

    determineDirectionToEnemy() {
        const enemyX = this.scene.enemy.sprite.x;
        const enemyY = this.scene.enemy.sprite.y;
        const dx = enemyX - this.robotSprite.x;
        const dy = enemyY - this.robotSprite.y;
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
        // Check if the player is currently moving or attacking
        const isMoving = this.currentTween && this.currentTween.isPlaying();
        const isAttacking = this.robotSprite.anims.isPlaying && this.robotSprite.anims.currentAnim.key.startsWith('attack');

        // If the player is neither moving nor attacking
        if (!isMoving && !isAttacking) {
            if (time - this.lastActionTime > 5000) { // 5 seconds of inactivity
                if (time - this.lastAnimationChange > 5000) {
                    this.idleAnimationIndex = (this.idleAnimationIndex + 1) % 4;
                    this.robotSprite.play(`idle${this.idleAnimationIndex + 1}`);
                    this.lastAnimationChange = time;
                }
            }
        } else {
            this.lastActionTime = time; // Reset the last action time if the player is moving or attacking
        }

        if (this.currentTween && this.currentTween.isPlaying()) {
            this.robotSprite.setPosition(this.position.x, this.position.y);
        }

        const currentAnim = this.robotSprite.anims.currentAnim;
        if (!currentAnim || !currentAnim.key.startsWith('attack')) {
            this.isAttacking = false;
        }

        this.updateHealthBar();
    }

    getPosition() {
        return this.robotSprite ? { x: this.robotSprite.x, y: this.robotSprite.y } : this.position;
    }

    createHealthBar() {
        this.healthBar = this.scene.add.graphics();

        // Draw the initial health bar
        this.updateHealthBar();
    }

    updateHealthBar() {
        // Calculate the position of the health bar above the player
        const barX = this.robotSprite.x - 70;
        const barY = this.robotSprite.y - this.robotSprite.displayHeight;

        this.healthBar.clear();
        this.healthBar.setPosition(barX, barY);

        // Background of health bar (transparent part)
        this.healthBar.fillStyle(0x000000, 0.5);
        this.healthBar.fillRect(0, 0, 150, 10);

        // Health portion
        const healthPercentage = this.health / this.totalHealth;
        const healthBarWidth = healthPercentage * 150;
        // fill style dark green
        this.healthBar.fillStyle(0x00ff00, 1);
        this.healthBar.fillRect(0, 0, healthBarWidth, 10);
    }

    takeDamage(damage, enemy) {
        if (this.isDead) return;

        this.attackingPlayer = player; // Store reference to the attacking player

        this.health -= damage;
        this.health = Math.max(this.health, 0);
        console.log(`Enemy took ${damage} damage. ${this.health} health remaining`);

        // Create and display damage text
        this.createDamageText(damage);

        if (this.health <= 0 && !this.isDead) {
            this.die();
        }

        this.updateHealthBar();
    }

}

export default Player;


// Algorithm codes

// moveAlongPath(newX, newY, onCompleteCallback = null) {
//     if (this.currentTween) {
//         this.currentTween.stop();
//     }

//     // Calculate the distance for the tween
//     let distance = Phaser.Math.Distance.Between(this.robotSprite.x, this.robotSprite.y, newX, newY);
//     let duration = distance / (this.speed + 100) * 1000; // Duration based on speed

//     // Determine the direction for the new segment
//     const newDirection = this.determineDirection(newX, newY);

//     // Update direction with averaging/smoothing
//     this.directions.push(newDirection);
//     if (this.directions.length > this.directionAveragingSteps) {
//         this.directions.shift(); // Remove the oldest direction
//     }
//     const averageDirection = this.calculateAverageDirection(this.directions);

//     // Update the sprite's animation based on the averaged direction
//     if (this.lastDirection !== averageDirection) {
//         this.robotSprite.play(`move${averageDirection}`);
//         this.lastDirection = averageDirection;
//     }

//     // Create a new tween for smooth movement
//     this.currentTween = this.scene.tweens.add({
//         targets: this.robotSprite,
//         x: newX,
//         y: newY,
//         duration: duration,
//         ease: 'Linear',
//         onUpdate: () => this.updatePosition(),
//         onComplete: () => {
//             if (onCompleteCallback) {
//                 onCompleteCallback();
//             }
//         }
//     });

//     this.lastActionTime = this.scene.time.now; // Reset last action time on movement
// }

// moveToLocation(location) {
//     this.moveStraight(location.x, location.y);
// }

// canMoveTo(startX, startY, endX, endY, originalWidth, originalHeight, width, height, textures) {
//     let x1 = Math.floor(startX * (originalWidth / width));
//     let y1 = Math.floor(startY * (originalHeight / height));
//     let x2 = Math.floor(endX * (originalWidth / width));
//     let y2 = Math.floor(endY * (originalHeight / height));
//     // console.log(`Checking path from grid (${x1}, ${y1}) to (${x2}, ${y2})`);

//     let dx = Math.abs(x2 - x1);
//     let dy = Math.abs(y2 - y1);

//     let sx = (x1 < x2) ? 1 : -1;
//     let sy = (y1 < y2) ? 1 : -1;

//     let err = dx - dy;

//     while (true) {
//         const color = textures.getPixel(x1, y1, 'land');

//         if (color.blue > 200) {
//             return false; // Path is invalid
//         }

//         if (x1 === x2 && y1 === y2) break;
//         let e2 = 2 * err;
//         if (e2 > -dy) { err -= dy; x1 += sx; }
//         if (e2 < dx) { err += dx; y1 += sy; }
//     }

//     return true; // Path is valid
// }


// aStarAlgorithm(grid, start, end) {
//     let openSet = [start];
//     let cameFrom = grid.map(row => row.map(() => null));

//     let gScores = grid.map(row => row.map(() => Infinity));
//     gScores[start.y][start.x] = 0;

//     let fScores = grid.map(row => row.map(() => Infinity));
//     fScores[start.y][start.x] = this.heuristic(start, end);

//     while (openSet.length > 0) {
//         let current = this.lowestFScore(openSet, fScores);
//         if (current.x === end.x && current.y === end.y) {
//             return this.reconstructPath(cameFrom, current);
//         }

//         openSet = openSet.filter(node => node.x !== current.x || node.y !== current.y);

//         for (let neighbor of this.getNeighbors(current, grid)) {
//             let tentativeGScore = gScores[current.y][current.x] + 1;
//             if (tentativeGScore < gScores[neighbor.y][neighbor.x]) {
//                 cameFrom[neighbor.y][neighbor.x] = current;
//                 gScores[neighbor.y][neighbor.x] = tentativeGScore;
//                 fScores[neighbor.y][neighbor.x] = tentativeGScore + this.heuristic(neighbor, end);
//                 if (!openSet.some(node => node.x === neighbor.x && node.y === neighbor.y)) {
//                     openSet.push(neighbor);
//                 }
//             }
//         }
//     }

//     return []; // Return an empty array if no path was found
// }

// heuristic(node, end) {
//     return Math.abs(node.x - end.x) + Math.abs(node.y - end.y);
// }

// getNeighbors(node, grid) {
//     let neighbors = [];

//     let directions = [
//         { dx: 1, dy: 0 },
//         { dx: -1, dy: 0 },
//         { dx: 0, dy: 1 },
//         { dx: 0, dy: -1 },
//     ];

//     for (let dir of directions) {
//         let x = node.x + dir.dx;
//         let y = node.y + dir.dy;

//         if (x >= 0 && y >= 0 && x < grid[0].length && y < grid.length) {
//             if (grid[y][x] === 0) {
//                 neighbors.push({ x: x, y: y });
//             } else {
//                 // console.log(`(${x}, ${y}) is blocked`);
//             }
//         }
//     }

//     return neighbors;
// }


// lowestFScore(openSet, fScores) {
//     let lowest = openSet[0];
//     for (let node of openSet) {
//         if (fScores[node.y][node.x] < fScores[lowest.y][lowest.x]) {
//             lowest = node;
//         }
//     }

//     return lowest;
// }

// reconstructPath(cameFrom, current) {
//     let path = [];
//     while (current !== null) {
//         path.push(current);
//         current = cameFrom[current.y][current.x];
//     }
//     return path.reverse();
// }

// findPath(grid, start, end) {
//     return this.aStarAlgorithm(grid, start, end);
// }

// drawPath(path, originalWidth, originalHeight, width, height) {
//     if (!this.pathGraphics) {
//         this.pathGraphics = this.scene.add.graphics({ lineStyle: { width: 6, color: 0xff0000 } });
//     }

//     this.pathGraphics.clear(); // Clear previous path
//     if (path.length < 2) return;

//     this.pathGraphics.beginPath();
//     let firstPoint = path[0];
//     let firstScreenX = (firstPoint.x * width) / originalWidth;
//     let firstScreenY = (firstPoint.y * height) / originalHeight;
//     this.pathGraphics.moveTo(firstScreenX, firstScreenY);

//     for (let i = 1; i < path.length; i++) {
//         let point = path[i];
//         let screenX = (point.x * width) / originalWidth;
//         let screenY = (point.y * height) / originalHeight;
//         this.pathGraphics.lineTo(screenX, screenY);
//     }

//     this.pathGraphics.strokePath();
// }