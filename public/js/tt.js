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
        this.enrageDuration = 8000;
        this.enrageStartTime = 0;
        this.player = player;
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


    moveToPlayer(playerX, playerY) {
        if (this.isDead || this.isMoving || this.isAttacking) {
            return;
        }

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
                    if (this.player.isDead) {
                        this.moveTween.stop();
                        this.isMoving = false;
                        this.isAttacking = false;
                        this.sprite.play(`character${this.characterCode}Idle1`);
                        return;
                    }
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
        this.attacker = player;
        if (this.isDead || this.attacker.isDead) return;
    
        const distance = Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, playerX, playerY);
        const direction = this.determineDirectionToPoint(playerX, playerY);
        const attackAnimationKey = `character${this.characterCode}Attack${direction}`;
    
        // Handle when the enemy is enraged
        if (this.isEnraged) {
            this.isAlert = true;
            this.updateDetectionBar(1); // Keep detection bar full
    
            if (distance <= this.attackRange && !this.isAttacking) {
                // Attack the player if in range
                this.isMoving = false;
                if (this.moveTween) {
                    this.moveTween.stop();
                }
                this.sprite.play(attackAnimationKey);
                this.attackPlayer(player);
            } else if (distance > this.attackRange && !this.isMoving) {
                // Move towards the player if not in range
                this.moveToPlayer(playerX, playerY);
            }
    
            // Reset the alert timer to avoid exiting the alert state
            this.timeInAlert = 0;
    
            // Check if the enrage duration has elapsed
            if (this.scene.time.now - this.enrageStartTime > this.enrageDuration) {
                this.disenrage();
            }
        } else {
            // Normal behavior when not enraged
            if (distance < this.detectionRadius || (distance <= this.attackRange && this.hasPlayerBeenDetected)) {
                if (!this.hasPlayerBeenDetected && distance < this.detectionRadius) {
                    this.hasPlayerBeenDetected = true;
                }
    
                this.isAlert = true;
                this.updateDetectionBar(1); // Keep detection bar full if alert
    
                if (distance <= this.attackRange && !this.isAttacking) {
                    this.isMoving = false;
                    if (this.moveTween) this.moveTween.stop();
                    this.sprite.play(attackAnimationKey);
                    this.attackPlayer(player);
                } else if (distance > this.attackRange && !this.isMoving) {
                    this.moveToPlayer(playerX, playerY);
                }
    
                // Reset alert timer when attacking, otherwise increment
                if (this.isAttacking) {
                    this.timeInAlert = 0;
                } else {
                    this.timeInAlert += Math.round(delta);
                }
            } else {
                if (this.hasPlayerBeenDetected) {
                    if (distance > this.attackRange && !this.isMoving) {
                        this.moveToPlayer(playerX, playerY);
                    }
    
                    // Handling alert time and going idle
                    if (this.isAlert && !this.isAttacking && this.timeInAlert >= this.alertTime) {
                        this.isAlert = false;
                        this.timeOutOfDetection += Math.round(delta);
                    } else if (distance > this.attackRange) {
                        this.timeOutOfDetection += Math.round(delta);
                        this.updateDetectionBar(Math.max(1 - (this.timeOutOfDetection / 4000), 0));
                        if (this.timeOutOfDetection >= 4000) {
                            this.returnToCamp();
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

    determineDirectionToPoint(playerX, playerY) {
        const dx = playerX - this.sprite.x
        const dy = playerY - this.sprite.y
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

    updateDetectionBar(percentage) {
        if (!this.hasPlayerBeenDetected) return;
        const barX = this.sprite.x - 30; // same x as the health bar
        const barY = (this.sprite.y - this.sprite.body.height / 2) + 8;

        // this.detectionField.alpha = percentage;
        this.detectionBar.clear();
        this.detectionBar.setPosition(barX, barY);

        // White background
        this.detectionBar.fillStyle(0xffffff, 1);
        this.detectionBar.fillRect(0, 0, 60 * percentage, 5);

        // transparent background
        this.detectionBar.fillStyle(0xffffff, 0.4);
        this.detectionBar.fillRect(60 * percentage, 0, 60 * (1 - percentage), 5);

        if (percentage == 0) {
            this.detectionBar.clear();
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
                this.reachedCamp = true
                this.sprite.play(`character${this.characterCode}Idle1`);
            }
        });
    }

    setEnraged() {
        if (!this.isEnraged) {
            this.isEnraged = true;
            this.damage = this.damage * 2;
            this.speed = this.speed * 2;
            this.enrageStartTime = this.scene.time.now;
        } else { // reset enrage timer
            this.enrageStartTime = this.scene.time.now;
        }
    }

    disenrage() {
        this.isEnraged = false;
        this.damage = this.damage / 2;
        this.speed = this.speed / 2;
    }


    update(time, delta) {
        if (this.isDead) return;
    
        // Update health bar continuously
        this.updateHealthBar();
    
        const isMoving = this.moveTween && this.moveTween.isPlaying();
        const isAttacking = this.sprite.anims.isPlaying && this.sprite.anims.currentAnim.key.includes('Attack');
    
        // Update idle animation if not moving or attacking
        if (!isMoving && !isAttacking && time - this.lastActionTime > 5000) {
            const randomIdleAnimation = this.idleAnimations[Math.floor(Math.random() * this.idleAnimations.length)];
            this.sprite.play(randomIdleAnimation);
            this.lastActionTime = time;
        }
    
        // Check if the enemy has reached its camp
        const distanceFromCamp = Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, this.originalCamp.x, this.originalCamp.y);
        if (distanceFromCamp > this.originalCamp.radius) {
            this.reachedCamp = false;
        } else if (!isMoving && !isAttacking) {
            this.reachedCamp = true;
        }
    
        // Heal if reached camp and health is below total health
        if (this.reachedCamp && this.health < this.totalHealth && time - this.lastHealTime > 1000) {
            this.heal(20); // +20 health per second
            this.lastHealTime = time;
        }
    }
    

}