// THIS FILE SERVES AS A BACKUP BEFORE A FEATURE/TASK
class Catastrophe {
    constructor(scene) {
        this.scene = scene;
        this.minX = 1200;
        this.maxX = 2800;
        this.minY = 700;
        this.maxY = 1300;
        this.fireballTimer = this.scene.time.now + 10000;
        this.stormInterval = 10000;
        this.indicatorDuration = 1000;
        this.fireballPositions = [];
        this.minDistance = 350;
        this.indicators = []; // Store active indicator references
    }

    launchStorm() {
        this.fireballPositions = [];
        for (let i = 0; i < 6; i++) {
            let position = this.getValidFireballPosition();
            let { x, endY } = position;

            let startY = endY - 700;
            let indicatorRadius = 135;
            let indicator = this.scene.add.circle(x, endY, indicatorRadius, 0xff0000, 0.5);
            indicator.setDepth(1);
            this.indicators.push({ indicator, x, y: endY, radius: indicatorRadius }); // Add to active indicators

            this.scene.tweens.add({
                targets: indicator,
                ease: 'Linear',
                alpha: 0.5,
                duration: this.indicatorDuration,
                onComplete: () => {
                    let fireball = this.scene.add.sprite(x, startY, 'fireball').setScale(0.5);
                    fireball.setDepth(2);
                    fireball.setOrigin(0.5, 1);
                    this.scene.tweens.add({
                        targets: fireball,
                        y: endY + 60,
                        ease: 'Linear',
                        alpha: 0.7,
                        duration: 1500,
                        onComplete: () => {
                            this.checkPlayerDamage(x, endY, indicatorRadius); // Check if player is within the indicator
                            indicator.destroy();
                            fireball.destroy();
                            this.indicators = this.indicators.filter(item => item.indicator !== indicator); // Remove from active indicators
                        }
                    });
                },
            });
        }
    }

    getValidFireballPosition() {
        let validPosition = false;
        let x, endY;
        while (!validPosition) {
            x = Phaser.Math.Between(this.minX, this.maxX);
            endY = Phaser.Math.Between(this.minY, this.maxY);
            validPosition = true;
            for (let pos of this.fireballPositions) {
                let distance = Phaser.Math.Distance.Between(x, endY, pos.x, pos.endY);
                if (distance < this.minDistance) {
                    validPosition = false;
                    break;
                }
            }
        }
        this.fireballPositions.push({ x, endY }); // Add the new position to the list
        return { x, endY };
    }

    checkPlayerDamage(x, y, radius) {
        let playerPos = this.scene.player.getPosition();
        let distance = Phaser.Math.Distance.Between(x, y, playerPos.x, playerPos.y);
        if (distance <= radius) {
            // Player is within the fireball impact zone
            this.scene.player.takeDamage(200);
        }
    }

    update(time, delta) {
        if (time > this.fireballTimer) {
            console.log('Launching storm');
            this.launchStorm();
            this.fireballTimer = time + this.stormInterval;
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
        this.robotSprite.setDepth(1);
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
        this.detectionField = this.scene.add.circle(this.x, this.y, this.range);
        this.detectionField.setStrokeStyle(4, 0xff0000);

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
        damageText.setDepth(1);
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
            this.attacker.stopAttackingPlayer();
        }

        this.healthBar.destroy();
    }

    update(time, delta) {
        this.detectionField.setPosition(this.robotSprite.x, this.robotSprite.y);
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
        if (!this.isDead && this.targetedEnemy && (this.targetedEnemy.returningToCamp || this.targetedEnemy.reachedCamp)) {
            //console.log('Targeted enemy is returning to camp');
            let enemyPosition = this.targetedEnemy.getPosition();
            let distanceToEnemy = Phaser.Math.Distance.Between(this.position.x, this.position.y, enemyPosition.x, enemyPosition.y);
            if (distanceToEnemy <= this.range) {
                if (this.currentTween) {
                    this.currentTween.stop();
                }
                this.isMovingTowardsEnemy = false;
                this.continueAttacking = true;
                this.playAttackAnimation(this.targetedEnemy); // Attack the targeted enemy
            } else {
                this.scene.cancelClick = false;
                this.moveStraight(enemyPosition.x, enemyPosition.y);
            }

        } else if (this.isMovingTowardsEnemy && !this.isDead && this.targetedEnemy && !this.targetedEnemy.returningToCamp && !this.targetedEnemy.reachedCamp) {
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

}


class Enemy {
    constructor(scene, x, y, characterCode = 2, originalCamp, player) {
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
        this.reachedCamp = false;
        this.lastHealTime = 0;
        this.isEnraged = false;
        this.enrageDuration = 6000;
        this.enrageStartTime = 0;
        this.player = player;
        this.customSquare = null;
        this.customSquareText = null; // the left side of the health bar
        this.fireTimerEvent = null; // a flag to fix the stacking of fire effect, causing stackable speed
        this.idleAnimations = [`character${this.characterCode}Idle1`, `character${this.characterCode}Idle2`, `character${this.characterCode}Idle3`, `character${this.characterCode}Idle4`];
    }

    create() {
        const character = characterMap[this.characterCode];

        this.sprite = this.scene.add.sprite(this.x, this.y, character.idle);
        this.sprite.setOrigin(0.5, 0.5);
        this.sprite.setScale(0.5);

        // Check and create idle animations
        for (let i = 0; i < 4; i++) {
            let idleKey = `character${this.characterCode}Idle${i + 1}`;
            if (!this.scene.anims.exists(idleKey)) {
                this.scene.anims.create({
                    key: idleKey,
                    frames: this.scene.anims.generateFrameNumbers(this.spritesheetKey, { start: i * 5, end: i * 5 + 4 }),
                    frameRate: 6,
                    repeat: -1,
                });
            }
        }

        // Check and create death animation
        let deathKey = `character${this.characterCode}Death`;
        if (!this.scene.anims.exists(deathKey)) {
            this.scene.anims.create({
                key: deathKey,
                frames: this.scene.anims.generateFrameNumbers(this.spritesheetKey, { start: 100, end: 104 }),
                frameRate: 6,
                repeat: 0
            });
        }

        const directions = ['southeast', 'southwest', 'south', 'east', 'west', 'northeast', 'northwest', 'north'];

        // Check and create moving animations
        directions.forEach((dir, index) => {
            let movingKey = `character${this.characterCode}Moving${dir}`;
            if (!this.scene.anims.exists(movingKey)) {
                this.scene.anims.create({
                    key: movingKey,
                    frames: this.scene.anims.generateFrameNumbers(this.spritesheetKey, { start: 20 + (index * 5), end: 20 + (index * 5) + 4 }),
                    frameRate: 6,
                    repeat: -1
                });
            }
        });

        // Check and create attack animations
        directions.forEach((dir, index) => {
            let attackKey = `character${this.characterCode}Attack${dir}`;
            if (!this.scene.anims.exists(attackKey)) {
                this.scene.anims.create({
                    key: attackKey,
                    frames: this.scene.anims.generateFrameNumbers(this.spritesheetKey, { start: 60 + (index * 5), end: 60 + (index * 5) + 4 }),
                    frameRate: 6 * this.attackSpeed,
                    repeat: 0
                });
            }
        });

        const randomIdleAnimation = this.idleAnimations[Math.floor(Math.random() * this.idleAnimations.length)];
        this.sprite.play(randomIdleAnimation);
        this.scene.physics.world.enable(this.sprite);

        const bodyWidth = this.sprite.width * 0.6;
        const bodyHeight = this.sprite.height * 0.6;
        const offsetX = (this.sprite.width - bodyWidth) / 2;
        const offsetY = (this.sprite.height - bodyHeight) / 2;

        this.sprite.body.setSize(bodyWidth, bodyHeight);
        this.sprite.body.setOffset(offsetX, offsetY);

        const hitArea = new Phaser.Geom.Rectangle(offsetX, offsetY, bodyWidth, bodyHeight);
        this.sprite.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);

        this.createHealthBar();

        // this.detectionField = this.scene.add.circle(this.x, this.y, 200);
        // this.detectionField.setStrokeStyle(4, 0xff0000);

        this.detectionBar = this.scene.add.graphics();
        this.updateDetectionBar(1);
        // let dot = this.scene.add.graphics();
        // dot.fillStyle(0xffffff, 1);
        // dot.fillCircle(this.sprite.x, this.sprite.y, 5);
    }

    takeDamage(damage, player) {
        console.log('Enemy taking damage');
        if (this.isDead || this.returningToCamp) return;
        this.attacker = player; // Store reference to the attacking player

        this.health -= damage;
        this.health = Math.max(this.health, 0);
        this.hasPlayerBeenDetected = true;

        // console.log(`Enemy took ${damage} damage. ${this.health} health remaining`);

        // Create and display damage text
        this.createDamageText(damage);

        if (this.health <= 0 && !this.isDead) {
            this.die();
        }

        this.updateHealthBar();

        if (this.hasPlayerBeenDetected) {
            this.timeInAlert = 0;
            this.timeOutOfDetection = 0;
            this.isAlert = true; // Ensure the enemy is in an alert state
            this.updateDetectionBar(1); // Full detection bar
        }
    }


    updateEnemy(playerX, playerY, player, delta) {
        this.attacker = player;
        if (this.isDead || this.attacker.isDead) return;
        const distance = Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, playerX, playerY);

        // Determine the direction to the player
        const direction = this.determineDirectionToPoint(playerX, playerY);
        const attackAnimationKey = `character${this.characterCode}Attack${direction}`;
        if (this.isEnraged) {
            this.hasPlayerBeenDetected = true;
            // Keep the enemy alert and the detection bar full
            this.isAlert = true;
            this.updateDetectionBar(1);  // Full detection bar

            // If the player is within attack range, attack; otherwise, move towards the player
            if (distance <= this.attackRange && !this.isAttacking) {
                this.isMoving = false;
                if (this.moveTween) this.moveTween.stop();
                this.sprite.play(`character${this.characterCode}Attack${this.determineDirectionToPoint(playerX, playerY)}`);
                this.attackPlayer(player);
            } else if (distance > this.attackRange && !this.isMoving) {
                this.moveToPlayer(playerX, playerY);
            }

            // During the enraged state, the alert timer does not decrease
            this.timeInAlert = this.alertTime;

            // Check if the enrage duration has elapsed
            if (this.scene.time.now - this.enrageStartTime > this.enrageDuration) {
                this.disenrage();
            }
        } else {
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
    }

    getPosition() {
        return {
            x: this.sprite.x,
            y: this.sprite.y
        };
    }


    createDamageText(damage) {
        const damageText = this.scene.add.text(this.sprite.x, this.sprite.y - 100, `-${damage}`, { font: '36px Orbitron', fill: '#ff0000' });
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
        if (this.scene.player.targetedEnemy === this) {
            this.scene.player.targetedEnemy = null;
        }
        this.isDead = true;
        console.log('Enemy died');

        // Stop any ongoing movement
        if (this.moveTween) {
            this.moveTween.stop();
        }
        this.isMoving = false;

        // Stop any ongoing animation and play the death animation
        this.sprite.stop();
        this.sprite.play(`character${this.characterCode}Death`);
        this.sprite.removeInteractive();

        if (this.attacker) {
            this.attacker.stopAttackingEnemy();
        }

        this.healthBar.destroy();

        this.detectionBar.destroy();

        this.customSquareContainer.destroy();

        [this.attackRangeArc, this.attackRangeRect].forEach(banana => {
            if (banana) banana.destroy();
        });
        // this.detectionField.setVisible(false);
    }

    returnToCamp() {
        if (!this.originalCamp) return;
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
                if (this.isEnraged) {
                    this.returningToCamp = false;
                    this.isMoving = false;
                    if (this.moveTween) {
                        this.moveTween.stop();
                    }
                }
                else {
                    this.returningToCamp = true;
                }
                let updatedDirection = this.determineDirectionToPoint(randomPosition.x, randomPosition.y);
                let updatedAnimationKey = `character${this.characterCode}Moving${updatedDirection}`;
                if (this.sprite.anims.currentAnim.key !== updatedAnimationKey) {
                    this.sprite.play(updatedAnimationKey);
                }
            },
            onComplete: () => {
                this.isMoving = false;
                this.returningToCamp = false;
                this.reachedCamp = true
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
                const randomIdleAnimation = this.idleAnimations[Math.floor(Math.random() * this.idleAnimations.length)];
                this.sprite.play(randomIdleAnimation);
                this.lastActionTime = time;
            }
        } else {
            this.lastActionTime = time; // Reset the last action time if the enemy is moving or attacking
        }

        const distanceFromCamp = Phaser.Math.Distance.Between(
            this.sprite.x, this.sprite.y,
            this.originalCamp.x, this.originalCamp.y
        );

        if (distanceFromCamp > this.originalCamp.radius) {
            this.reachedCamp = false;
        } else if (!this.isMoving && !this.isAttacking) {
            this.reachedCamp = true;
        } else {
            this.reachedCamp = false;
        }


        if (this.reachedCamp && this.health < this.totalHealth) {
            if (time - this.lastHealTime > 1000) { // Heal every 1 second
                this.heal(20); // +20 health per second
                this.lastHealTime = time;
            }
        }

        if (this.isEnraged && time - this.enrageStartTime > this.enrageDuration) {
            this.disenrage();
        }

    }

}
