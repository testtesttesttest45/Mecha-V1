class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        this.player = null;
        this.enemies = [];
        this.land = null;
        this.ocean = null;
        this.initialZoom = 0.8;
        this.isDragging = false;
        this.dragStartPoint = null;
    }

    create() {
        this.gameScreenWidth = this.sys.game.config.width;
        this.gameScreenHeight = this.sys.game.config.height;
        this.createStaticBackground();
        this.createLand();
        this.createCamps();
        this.createEnemy();
        this.createPlayer();
        this.setupCamera();

        this.messageText = this.add.text(0, 0, '', { font: '24px Orbitron', fill: '#ff0000', align: 'center' });
        this.messageText.setVisible(false);
    }


    handlePlayerClick(pointer) {
        if (this.enemyClicked) {
            this.enemyClicked = false;
            return; // Click was on the enemy, skip the general click logic
        }

        // Convert screen coordinates to world coordinates
        const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        const originalWidth = this.land.texture.source[0].width;
        const originalHeight = this.land.texture.source[0].height;

        // Check if the clicked point is within the bounds of the land
        if (worldPoint.x >= this.land.x - originalWidth / 2 &&
            worldPoint.x <= this.land.x + originalWidth / 2 &&
            worldPoint.y >= this.land.y - originalHeight / 2 &&
            worldPoint.y <= this.land.y + originalHeight / 2) {
            // If within bounds, move the player
            this.player.moveStraight(worldPoint.x, worldPoint.y);
        } else {
            this.showOutOfBoundsMessage(worldPoint);
        }
    }


    createPlayer() {
        this.player = new Player(this, 1500, 800, 6, this.enemies);
        this.player.create();
    }

    createEnemy() {
        // Array of camp objects
        const camps = [this.camp1, this.camp2, this.camp3];

        camps.forEach(camp => {
            for (let i = 0; i < 2; i++) {
                const randomPosition = camp.getRandomPositionInRadius();
                let enemy = new Enemy(this, randomPosition.x, randomPosition.y, 2);
                enemy.create();
                this.enemies.push(enemy);

                // Add pointer events for each enemy
                enemy.sprite.on('pointerover', () => {
                    if (!enemy.isDead) {
                        setAttackCursor(this);
                    }
                });

                enemy.sprite.on('pointerout', () => {
                    setDefaultCursor(this);
                });

                enemy.sprite.on('pointerdown', () => {
                    console.log("Enemy clicked");
                    this.enemyClicked = true;
                    this.player.targetedEnemy = enemy;
                    if (!this.player.isAttacking) {
                        console.log("banana")
                        this.player.moveStraight(enemy.sprite.x, enemy.sprite.y, () => {
                            this.player.playAttackAnimation(enemy);
                            this.player.continueAttacking = true;
                        });
                    }
                });
                
            }
        });
    }


    createCamps() {
        this.camp1 = new Camp(this, 1240, 1250);
        this.camp1.create();

        this.camp2 = new Camp(this, 1900, 700);
        this.camp2.create();

        this.camp3 = new Camp(this, 2620, 1220);
        this.camp3.create();
    }

    setupInputHandlers() {
        const originalWidth = this.land.texture.source[0].width;
        const originalHeight = this.land.texture.source[0].height;

        this.input.on('pointerdown', function (pointer) {
            if (pointer.leftButtonDown()) {
                if (this.enemyClicked) {
                    this.enemyClicked = false; // Reset the flag
                    return; // Click was on the enemy, so skip the general click logic/no callback
                }

                // Convert screen coordinates to world coordinates
                const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);

                // Check if the clicked point is within the bounds of the island
                if (worldPoint.x >= this.land.x - originalWidth / 2 &&
                    worldPoint.x <= this.land.x + originalWidth / 2 &&
                    worldPoint.y >= this.land.y - originalHeight / 2 &&
                    worldPoint.y <= this.land.y + originalHeight / 2) {
                    // If within bounds, move the player
                    this.player.moveStraight(worldPoint.x, worldPoint.y);
                } else {
                    this.messageText.setText("Can't go there!");
                    this.messageText.setOrigin(0.5, 0.5);
                    this.messageText.setVisible(true);

                    // this.messageText.setPosition(worldPoint.x, worldPoint.y);
                    // ensure the text is seen fully within this.sys.game.config.width
                    if (worldPoint.x < this.sys.game.config.width / 2) {
                        this.messageText.setPosition(worldPoint.x + 100, worldPoint.y);
                    } else {
                        this.messageText.setPosition(worldPoint.x - 50, worldPoint.y);
                    }
                    this.tweens.add({
                        targets: this.messageText,
                        alpha: { start: 0, to: 1 },
                        duration: 1000,
                        ease: 'Linear',
                        yoyo: true,
                        repeat: 0,
                        onComplete: () => {
                            this.messageText.setVisible(false);
                            this.messageText.setAlpha(1); // Reset alpha value for the next use
                        }
                    });
                }
            }
        }, this);

        this.input.enabled = true;

        this.sceneName = "battle-scene";
    }


    update(time, delta) {
        if (this.player) {
            this.player.update(time, delta, this.enemies);
        }

        this.enemies.forEach(enemy => {
            if (enemy) {
                let playerPosition = this.player.getPosition();
                enemy.updateEnemy(playerPosition.x, playerPosition.y, this.player, delta);
                enemy.update(time, delta);
            }
        });

        if (this.isCameraFollowingPlayer) {
            // Update the camera to follow the player's current position
            this.cameras.main.startFollow(this.player.getPosition(), true, 0.01, 0.01);
        }


    }
}
class Player {
    constructor(scene, initialX, initialY, characterCode = 1, enemies) {
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
        this.damage = character.damage;
        this.attackSpeed = character.attackSpeed;
        this.spritesheetKey = character.spritesheetKey;
        this.isAttacking = false;
        this.attackEvent = null;
        this.health = character.health;
        this.totalHealth = character.health; // Store the total health
        this.healthBar = null;
        this.isDead = false;
        this.idleAnimations = ['idle1', 'idle2', 'idle3', 'idle4'];
        this.isMovingTowardsEnemy = false;
        this.continueAttacking = false;
        this.attackAnimationComplete = true;
        this.projectile = character.projectile;
        this.attackCount = character.attackCount;
        this.enemies = enemies;
        this.targetedEnemy = null;
    }

    create() {
        this.robotSprite = this.scene.add.sprite(this.position.x, this.position.y);
        this.robotSprite.setOrigin(0.5, 0.7);
        for (let i = 0; i < 4; i++) {
            this.scene.anims.create({
                key: `idle${i + 1}`,
                frames: this.scene.anims.generateFrameNumbers(this.spritesheetKey, { start: i * 5, end: i * 5 + 4 }),
                frameRate: 6,
                repeat: -1,
            }); // the above code looops through the idle animation and creates a new animation for each of the 4 directions
        }
        const randomIdleAnimation = this.idleAnimations[Math.floor(Math.random() * this.idleAnimations.length)];
        this.robotSprite.play(randomIdleAnimation);
        this.lastAnimationChange = this.scene.time.now;


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
                frameRate: 6 * this.attackSpeed,
                repeat: 0
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
        if (this.isDead) return;
        this.stopAttackingEnemy();

        const currentAnim = this.robotSprite.anims.currentAnim;
        const hasReachedTarget = Math.round(this.robotSprite.x) === Math.round(newX) && Math.round(this.robotSprite.y) === Math.round(newY);

        // Check if already at the target and playing an idle animation
        if (hasReachedTarget && currentAnim && currentAnim.key.startsWith('idle')) {
            return; // Do nothing if already at the target and idle
        }

        if (this.currentTween) {
            this.currentTween.stop();
        }
        if (currentAnim && currentAnim.key.startsWith('idle') || currentAnim.key.startsWith('attack')) {
            if (this.lastDirection !== null) {
                this.robotSprite.play(`move${this.lastDirection}`);
            }
        }

        let targetDistance = Phaser.Math.Distance.Between(this.robotSprite.x, this.robotSprite.y, newX, newY);

        if (this.scene.enemyClicked && targetDistance <= this.range) {
            this.isMovingTowardsEnemy = true;
            // this.playAttackAnimation(this.scene.enemy);
            return; // Don't continue moving
        } else if (this.scene.enemyClicked && targetDistance > this.range) {
            this.isMovingTowardsEnemy = true;
            // Adjust the target position to stop at the attack range
            let angleToTarget = Phaser.Math.Angle.Between(this.robotSprite.x, this.robotSprite.y, newX, newY);
            newX = this.robotSprite.x + Math.cos(angleToTarget) * (targetDistance - this.range);
            newY = this.robotSprite.y + Math.sin(angleToTarget) * (targetDistance - this.range);
        }

        const direction = this.determineDirection(newX, newY);

        // Check if the player is already moving in the same direction. this prevents player from restarting animation if its already on same direction
        if (this.lastDirection !== direction) {
            this.robotSprite.play(`move${direction}`);
            this.lastDirection = direction;
        }

        let distance = Phaser.Math.Distance.Between(this.robotSprite.x, this.robotSprite.y, newX, newY);
        let duration = distance / this.speed * 1000;  // Duration based on speed
        this.currentTween = this.scene.tweens.add({
            targets: this.robotSprite,
            x: newX,
            y: newY,
            duration: duration,
            ease: 'Linear',
            onUpdate: () => {
                this.updatePosition();
            },
            onComplete: () => {
                if (this.isDead) return;

                if (this.scene.enemyClicked) {
                    this.scene.enemyClicked = false;
                } else {
                    // Check if the sprite has reached the target
                    if (Math.round(this.robotSprite.x) === Math.round(newX) && Math.round(this.robotSprite.y) === Math.round(newY)) {
                        // Play a random idle animation
                        const randomIdleAnimation = this.idleAnimations[Math.floor(Math.random() * this.idleAnimations.length)];
                        this.robotSprite.play(randomIdleAnimation);
                    }
                }
                if (onCompleteCallback) {
                    onCompleteCallback();
                }
            }
        });

        this.lastActionTime = this.scene.time.now; // Reset last action time on movement
    }

    playAttackAnimation(targetEnemy) {
        if (!targetEnemy || targetEnemy.isDead) {
            // Reset attack state if the target is invalid or dead
            this.isAttacking = false;
            this.continueAttacking = false;
            return;
        }
        const direction = this.determineDirectionToEnemy(targetEnemy);
        const attackAnimationKey = `attack${direction}`;

        if (this.isAttacking && !this.attackAnimationComplete) {
            console.log("Already attacking");
            return;
        }

        this.isAttacking = true;
        this.attackAnimationComplete = false;
        this.attacker = targetEnemy;
        this.robotSprite.play(attackAnimationKey);
        this.robotSprite.off('animationupdate');
        this.robotSprite.off('animationcomplete');

        let damageFrames = [];
        if (this.attackCount > 1 && !this.projectile) { // multi strikes usually applies to melee attacks
            for (let i = 1; i <= this.attackCount; i++) {
                damageFrames.push(Math.ceil((5 / this.attackCount) * i)); // 5 / (2) * 1 = 2.5. round upwards to 3
            }
        } else if (!this.projectile) {
            // Default to last frame for single attack
            damageFrames.push(5);
        }

        this.robotSprite.on('animationupdate', (anim, frame) => {
            if (anim.key === attackAnimationKey) {
                if (this.projectile && this.projectile !== '' && frame.index === 4) {
                    this.launchProjectile(enemy);
                } else if (!this.projectile && damageFrames.includes(frame.index)) {
                    if (this.attacker) {
                        this.attacker.takeDamage(this.damage, this);
                    }
                }
            }
        });

        this.robotSprite.once('animationcomplete', anim => {
            if (anim.key === attackAnimationKey) {
                this.attackAnimationComplete = true;
                if (!this.projectile) {
                    this.robotSprite.play(attackAnimationKey);
                }
            }
        });
    }

    launchProjectile(enemy) {
        let projectile = this.scene.add.sprite(this.robotSprite.x + 10, this.robotSprite.y - 80, this.projectile);
        projectile.setOrigin(0.5, 0.5);
        projectile.setScale(0.5);

        let targetX = enemy.sprite.x;
        let targetY = enemy.sprite.y;
        let angle = Phaser.Math.Angle.Between(this.robotSprite.x, this.robotSprite.y, targetX, targetY);

        projectile.setRotation(angle); // 90 deg.

        // Calculate a more realistic impact point instead of the center of the enemy
        const enemyWidth = enemy.sprite.width;
        const enemyHeight = enemy.sprite.height;
        const impactOffsetX = enemyWidth / 2 * Math.cos(angle); // ratio of the adjacent side to the hypotenuse of a right-angled triangle. gives x offset
        const impactOffsetY = enemyHeight / 2 * Math.sin(angle); // ratio of the opposite side to the hypotenuse of a right-angled triangle gives y offset
        targetX -= impactOffsetX;
        targetY -= impactOffsetY;

        this.scene.tweens.add({
            targets: projectile,
            x: targetX,
            y: targetY,
            duration: 500,
            ease: 'Linear',
            onComplete: () => {
                if (enemy) {
                    enemy.takeDamage(this.damage, this); // apply damage when projectile hits
                }
                projectile.destroy(); // after hitting the target
            }
        });
    }



    update(time, delta) {
        const isMoving = this.currentTween && this.currentTween.isPlaying();
        const isAttacking = this.robotSprite.anims.isPlaying && this.robotSprite.anims.currentAnim.key.startsWith('attack');
    
        if (!isMoving && !isAttacking && !this.isDead) {
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
    
        // Check if the player is moving towards the targeted enemy
        if (this.isMovingTowardsEnemy && !this.isDead && this.targetedEnemy) {
            let enemyPosition = this.targetedEnemy.getPosition();
            let distanceToEnemy = Phaser.Math.Distance.Between(this.position.x, this.position.y, enemyPosition.x, enemyPosition.y);
            
            if (distanceToEnemy <= this.range) {
                if (this.currentTween) {
                    this.currentTween.stop();
                }
                this.isMovingTowardsEnemy = false;
                this.continueAttacking = true;
                this.playAttackAnimation(this.targetedEnemy); // Attack the targeted enemy
            }
        }
    
        if (this.continueAttacking && !this.isDead && this.targetedEnemy) {
            this.playAttackAnimation(this.targetedEnemy); // Continue attacking the targeted enemy
        }
    
        this.updateHealthBar();
    }
    

    stopAttackingEnemy() {
        this.isMovingTowardsEnemy = false;
        this.continueAttacking = false;
        this.isAttacking = false;
        this.attacker = null;
        if (this.attackEvent) {
            this.attackEvent.remove(false);
            this.attackEvent = null;
        }
        const currentAnim = this.robotSprite.anims.currentAnim;
        if (currentAnim && currentAnim.key.startsWith('attack')) {
            const randomIdleAnimation = this.idleAnimations[Math.floor(Math.random() * this.idleAnimations.length)];
            this.robotSprite.play(randomIdleAnimation);
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

    // determineDirectionToEnemy() {
    //     const enemyX = this.scene.enemy.sprite.x;
    //     const enemyY = this.scene.enemy.sprite.y;
    //     const dx = enemyX - this.robotSprite.x;
    //     const dy = enemyY - this.robotSprite.y;
    //     const angle = Math.atan2(dy, dx) * 180 / Math.PI;

    //     if (angle >= -22.5 && angle < 22.5) return 'east';
    //     if (angle >= 22.5 && angle < 67.5) return 'southeast';
    //     if (angle >= 67.5 && angle < 112.5) return 'south';
    //     if (angle >= 112.5 && angle < 157.5) return 'southwest';
    //     if (angle >= 157.5 || angle < -157.5) return 'west';
    //     if (angle >= -157.5 && angle < -112.5) return 'northwest';
    //     if (angle >= -112.5 && angle < -67.5) return 'north';
    //     if (angle >= -67.5 && angle < -22.5) return 'northeast';
    // }

    determineDirectionToEnemy(enemy) {
        const enemyX = enemy.sprite.x;
        const enemyY = enemy.sprite.y;
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
        if (this.isDead) return;
        this.position.x = this.robotSprite.x;
        this.position.y = this.robotSprite.y;
    }

    getPosition() {
        return this.robotSprite ? { x: this.robotSprite.x, y: this.robotSprite.y } : this.position;
    }

    createHealthBar() {
        this.healthBar = this.scene.add.graphics();  // Create the graphics object, but don't draw anything yet

        // Draw the initial health bar
        this.updateHealthBar();
    }

    updateHealthBar() {
        // Calculate the position of the health bar above the player
        const barX = this.robotSprite.x - 70;
        const barY = this.robotSprite.y - this.robotSprite.displayHeight + 120;

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
        // console.log('Player taking damage');


        this.attacker = enemy; // Store reference to the attacking enemy

        this.health -= damage;
        this.health = Math.max(this.health, 0);
        // console.log(`Player took ${damage} damage. ${this.health} health remaining`);

        // Create and display damage text
        this.createDamageText(damage);

        if (this.health <= 0 && !this.isDead) {
            this.die();
        }

        this.updateHealthBar();
    }

    createDamageText(damage) {
        const damageText = this.scene.add.text(this.robotSprite.x, this.robotSprite.y - 100, `-${damage}`, { font: '36px Orbitron', fill: '#000' });
        damageText.setOrigin(0.5, 0.5);

        // Animation for damage text (move up and fade out)
        this.scene.tweens.add({
            targets: damageText,
            y: damageText.y - 30, // Move up
            alpha: 0, // Fade out
            duration: 800,
            ease: 'Power2',
            onComplete: () => {
                damageText.destroy(); // Remove the text object
            }
        });
    }

    die() {
        if (this.isDead) return;

        this.isDead = true;
        console.log('Player died');

        // Stop any ongoing movement
        if (this.moveTween) {
            this.moveTween.stop();
        }
        this.isMoving = false;

        // Stop any ongoing animation and play the death animation
        this.robotSprite.stop();
        this.robotSprite.play(`death`);

        if (this.attacker) {
            console.log('Stopping attacker');
            this.attacker.stopAttackingPlayer();
        }

        this.healthBar.destroy();
    }

}
