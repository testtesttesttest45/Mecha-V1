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

    createEnemy() {
        // Array of camp objects
        const camps = [this.camp1, this.camp2, this.camp3];

        camps.forEach(camp => {
            for (let i = 0; i < 2; i++) {
                const randomPosition = camp.getRandomPositionInRadius();
                let enemy = new Enemy(this, randomPosition.x, randomPosition.y, 2, camp);
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
                    // Check if the targeted enemy is the same as the clicked enemy
                    if (this.player.targetedEnemy === enemy && this.player.isAttacking) {
                        return; // Do not reset attack animation if already attacking the same enemy
                    }
                    
                    this.player.stopAttackingEnemy();
                    this.player.moveStraight(enemy.sprite.x, enemy.sprite.y, () => {
                        this.player.playAttackAnimation(enemy);
                        this.player.continueAttacking = true;
                    });
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
        const direction = this.determineDirectionToEnemy(targetEnemy);
        const attackAnimationKey = `attack${direction}`;

        if (this.isAttacking && !this.attackAnimationComplete && this.targetedEnemy === targetEnemy) {
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
                    // if (this.attacker) {
                    //     this.attacker.takeDamage(this.damage, this);
                    // }
                    if (this.targetedEnemy) {
                        this.targetedEnemy.takeDamage(this.damage, this);
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

}

class Enemy {
    constructor(scene, x, y, characterCode = 2, originalCamp) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.characterCode = characterCode;
        this.sprite = null;
        this.currentAnimationIndex = 0;
        const character = characterMap[this.characterCode];
        this.health = character.health;
        this.isDead = false;
        this.totalHealth = character.health; // Store the total health
        this.healthBar = null;
        this.speed = character.speed;
        this.attackSpeed = character.attackSpeed;
        this.attackRange = character.range;
        this.isMoving = false;
        this.moveTween = null;
        this.spritesheetKey = character.spritesheetKey;
        this.detectionRadius = 200;
        this.timeOutOfDetection = 0;
        this.detectionBar = null;
        this.isAlert = false; // enemy is on alert. during alert, enemy will never stop chasing player
        this.alertTime = 2000;
        this.timeInAlert = 0;
        this.hasPlayerBeenDetected = false;
        this.lastActionTime = 0;
        this.isAttacking = false;
        this.attackEvent = null;
        this.damage = character.damage;
        this.attackRangeRect = null;
        this.attackRangeArc = null;
        this.projectile = character.projectile;
        this.originalCamp = originalCamp; // ref original camp to return to
        this.returningToCamp = false;
    }


    moveToPlayer(playerX, playerY) {
        if (this.isDead || this.isMoving || this.isAttacking) return;

        this.isMoving = true;
        this.isAttacking = false;
        const updateMovement = () => {
            if (!this.attacker || !this.attacker.getPosition || this.isDead) {
                console.warn("Attacking player is undefined or getPosition method is not available");
                return;
            }

            const playerPosition = this.attacker.getPosition();
            let distance = Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, playerPosition.x, playerPosition.y);
            let duration = distance / this.speed * 1000;

            // Determine the new direction
            const newDirection = this.determineDirectionToPoint(playerPosition.x, playerPosition.y);
            const movingAnimationKey = `character${this.characterCode}Moving${newDirection}`;

            // Play the moving animation only if it's not already playing
            if (this.sprite.anims.currentAnim.key !== movingAnimationKey) {
                this.sprite.play(movingAnimationKey);
            }

            if (this.moveTween) {
                this.moveTween.stop();
            }

            this.moveTween = this.scene.tweens.add({
                targets: this.sprite,
                x: playerPosition.x,
                y: playerPosition.y,
                duration: duration,
                ease: 'Linear',
                onUpdate: () => {
                    // Update direction based on player's current position
                    const updatedPlayerPosition = this.attacker.getPosition();
                    const updatedDirection = this.determineDirectionToPoint(updatedPlayerPosition.x, updatedPlayerPosition.y);
                    const updatedAnimationKey = `character${this.characterCode}Moving${updatedDirection}`;

                    // Play the updated moving animation only if it's different
                    if (this.sprite.anims.currentAnim.key !== updatedAnimationKey) {
                        this.sprite.play(updatedAnimationKey);
                    }

                    if (Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, updatedPlayerPosition.x, updatedPlayerPosition.y) > 100) {
                        playerX = updatedPlayerPosition.x;
                        playerY = updatedPlayerPosition.y;
                        updateMovement(); // Recalculate the path and direction
                    }
                },
                onComplete: () => {
                    this.isMoving = false;
                }
            });
        };

        updateMovement(); // Start the movement
    }

    updateEnemy(playerX, playerY, player, delta) {
        // console.log('fckng cb', this.isAttacking)
        this.attacker = player;
        if (this.isDead || this.attacker.isDead) return;

        const distance = Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, playerX, playerY);

        // Determine the direction to the player
        const direction = this.determineDirectionToPoint(playerX, playerY);
        const attackAnimationKey = `character${this.characterCode}Attack${direction}`;

        // Player is within detection radius or the enemy is attacking
        if (distance < this.detectionRadius || (distance <= this.attackRange && this.hasPlayerBeenDetected)) {
            // Set player as detected if within detection radius for the first time
            if (!this.hasPlayerBeenDetected && distance < this.detectionRadius) {
                this.hasPlayerBeenDetected = true;
            }

            this.isAlert = true;
            this.timeOutOfDetection = 0; // Reset out-of-detection timer
            this.updateDetectionBar(1); // full bar
            if (distance <= this.attackRange && !this.isAttacking) {
                this.isMoving = false;
                if (this.moveTween) {
                    this.moveTween.stop();
                }
                const direction = this.determineDirectionToPoint(playerX, playerY);
                const attackAnimationKey = `character${this.characterCode}Attack${direction}`;
                this.sprite.play(attackAnimationKey);
                this.attackPlayer(player);
            } else if (distance > this.attackRange && !this.isMoving) {
                this.moveToPlayer(playerX, playerY);
            }
            if (this.isAttacking) {
                this.timeInAlert = 0; // Reset alert timer when attacking
            } else {
                this.timeInAlert += Math.round(delta); // Increment alert timer when not attacking
            }
        }
        else {
            // Player is outside the detection radius and attack range
            if (this.hasPlayerBeenDetected) {
                // Enemy will try to move closer to the player if out of attack range
                if (distance > this.attackRange && !this.isMoving) {
                    this.moveToPlayer(playerX, playerY);
                }

                // Handling alert time and going idle
                if (this.isAlert && !this.isAttacking) {
                    if (distance > this.attackRange && this.timeInAlert >= this.alertTime) {
                        this.isAlert = false;
                        this.timeOutOfDetection += Math.round(delta);
                    } else {
                        this.timeInAlert += Math.round(delta);
                        this.updateDetectionBar(1);
                    }
                } else if (distance > this.attackRange) {
                    this.timeOutOfDetection += Math.round(delta);
                    const detectionPercentage = 1 - (this.timeOutOfDetection / 4000);
                    this.updateDetectionBar(Math.max(detectionPercentage, 0));
                    if (this.timeOutOfDetection >= 4000) {
                        this.isMoving = false;
                        if (this.moveTween) {
                            this.moveTween.stop();
                        }
                        // if (!this.sprite.anims.currentAnim || !this.sprite.anims.currentAnim.key.includes('Idle')) {
                        //     this.sprite.play(`character${this.characterCode}Idle1`);
                        // }
                        this.returnToCamp();
                        this.hasPlayerBeenDetected = false;
                    }
                }
            }
        }
    }

    returnToCamp() {
        if (!this.originalCamp) return;
        this.returningToCamp = true;
        this.isMoving = true;
        this.isAttacking = false;
        this.hasPlayerBeenDetected = false;
    
        let increasedSpeed = this.speed * 1.5; // Increase speed by 50%
        let randomPosition = this.originalCamp.getRandomPositionInRadius();
        
        let directionToCamp = this.determineDirectionToPoint(randomPosition.x, randomPosition.y);
        const movingAnimationKey = `character${this.characterCode}Moving${directionToCamp}`;
        
        // Play the moving animation towards the camp
        this.sprite.play(movingAnimationKey);
    
        let distance = Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, randomPosition.x, randomPosition.y);
        let duration = distance / increasedSpeed * 1000;
    
        if (this.moveTween) {
            this.moveTween.stop();
        }
    
        this.moveTween = this.scene.tweens.add({
            targets: this.sprite,
            x: randomPosition.x,
            y: randomPosition.y,
            duration: duration,
            ease: 'Linear',
            onUpdate: () => {
                let updatedDirection = this.determineDirectionToPoint(randomPosition.x, randomPosition.y);
                let updatedAnimationKey = `character${this.characterCode}Moving${updatedDirection}`;
                if (this.sprite.anims.currentAnim.key !== updatedAnimationKey) {
                    this.sprite.play(updatedAnimationKey);
                }
            },
            onComplete: () => {
                this.isMoving = false;
                this.returningToCamp = false;
                this.sprite.play(`character${this.characterCode}Idle1`);
            }
        });
    }
    
    
    

    update(time, delta) {
        if (this.isDead) return;
        // this.detectionField.setPosition(this.sprite.x, this.sprite.y);
        this.updateHealthBar();

        const isMoving = this.moveTween && this.moveTween.isPlaying();
        const isAttacking = this.sprite.anims.isPlaying && this.sprite.anims.currentAnim.key.includes('Attack');

        if (!isMoving && !isAttacking) {
            // Check if enough time has passed to change the animation
            if (time - this.lastActionTime > 5000) { // 5 seconds of inactivity
                this.currentAnimationIndex = (this.currentAnimationIndex + 1) % 4;
                this.sprite.play(`character${this.characterCode}Idle${this.currentAnimationIndex + 1}`);
                this.lastActionTime = time;
            }
        } else {
            this.lastActionTime = time; // Reset the last action time if the enemy is moving or attacking
        }

    }

}


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

    createEnemy() {
        // Array of camp objects
        const camps = [this.camp1, this.camp2, this.camp3];

        camps.forEach(camp => {
            for (let i = 0; i < 2; i++) {
                const randomPosition = camp.getRandomPositionInRadius();
                let enemy = new Enemy(this, randomPosition.x, randomPosition.y, 2, camp);
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
                });



            }
        });
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


