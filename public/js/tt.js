// THIS FILE SERVES AS A BACKUP BEFORE A FEATURE/TASK


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

    takeDamage(damage, source) {
        // console.log('Enemy taking damage');
        if (this.isDead) return;
    
        // Enemy is immune to all damage when returning to camp
        if (this.returningToCamp) return;
    
        // Enemy is immune to catastrophe damage if it has reached camp but not to player damage
        if (this.reachedCamp && source === 'catastrophe') return;
    
        this.health -= damage;
        this.health = Math.max(this.health, 0);
    
        // Enemy detects player if damage source is the player
        if (source !== 'catastrophe') {
            this.hasPlayerBeenDetected = true;
        };
    
        const color = source === 'catastrophe' ? '#ff0' : '#ff0000'; // Yellow for catastrophe, red for player
        this.createDamageText(damage, color);
    
        // Enemy dies if health drops to 0
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
            if (this.returningToCamp) return;
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

class BattleUI extends Phaser.Scene {
    constructor() {
        super({ key: 'BattleUI', active: false });
    }

    create() {
        const panel = this.add.rectangle(this.scale.width - 30, 150, 350, 600, 0x000000, 0.5);
        panel.setOrigin(1, 0);
        panel.setScrollFactor(0);

        const panelCenterX = this.scale.width - 30 - panel.width / 2;
        const statsTextY = 175;
        this.add.text(panelCenterX, statsTextY, "Battle Panel", {
            font: '20px Orbitron',
            fill: '#ffffff'
        }).setOrigin(0.5, 0).setScrollFactor(0);

        const approachingTextY = statsTextY + 50;
        this.approachingText = this.add.text(panelCenterX + 10, approachingTextY, "Catastrophe approaches", {
            font: '16px Orbitron',
            fill: '#ffffff',
        }).setOrigin(0.5, 0).setScrollFactor(0);

        this.catastropheIcon = this.add.image(panelCenterX - 150, approachingTextY + 15, 'catastrophe').setScale(0.5).setScrollFactor(0).setOrigin(0, 0.5);
        
        this.flashing = false;
        this.flashingTween = null;

        this.timerBarBackground = this.add.rectangle(panelCenterX, approachingTextY + 40, 300, 20, 0xffffff, 0.2).setOrigin(0.5, 0).setScrollFactor(0);
        this.timerBarFill = this.add.rectangle(this.timerBarBackground.x - this.timerBarBackground.width / 2, approachingTextY + 40, 0, 20, 0x00ff00).setOrigin(0, 0).setScrollFactor(0);

        this.maxTime = this.scene.get('GameScene').catastrophe.stormInterval;
        this.currentTime = 0;

        const strengthenTextY = approachingTextY + 80;
        this.add.text(panelCenterX, strengthenTextY, "Enemy strengthens", {
            font: '16px Orbitron',
            fill: '#ffffff'
        }).setOrigin(0.5, 0).setScrollFactor(0);

        this.strengthenIcon = this.add.image(panelCenterX - 150, strengthenTextY + 15, 'strengthen').setScale(0.5).setScrollFactor(0).setOrigin(0, 0.5);

        const strengthenBarBackground = this.add.rectangle(panelCenterX, strengthenTextY + 40, 300, 20, 0xffffff, 0.2).setOrigin(0.5, 0).setScrollFactor(0);
        this.strengthenBarFill = this.add.rectangle(strengthenBarBackground.x - strengthenBarBackground.width / 2, strengthenTextY + 40, 0, 20, 0xff0000).setOrigin(0, 0).setScrollFactor(0);


        const scorePanelX = this.scale.width - 30;
        const scorePanelY = this.scale.height - 150;
        const scorePanelWidth = 350;
        const scorePanelHeight = 100;

        
        const scorePanelBackground = this.add.rectangle(scorePanelX, scorePanelY, scorePanelWidth, scorePanelHeight, 0x000000, 0.5);
        scorePanelBackground.setOrigin(1, 1);

        const scoreTextX = scorePanelX - scorePanelWidth + 20;
        const scoreTextY = scorePanelY - scorePanelHeight / 2;
        this.add.text(scoreTextX, scoreTextY, 'Score:', {
            font: '20px Orbitron',
            fill: '#ffffff'
        }).setOrigin(0, 0.5);
    }

    updateTimer(currentTime) {
        this.currentTime = currentTime;
        const fillWidth = Math.max(0, (this.currentTime / this.maxTime) * this.timerBarBackground.width);
        this.timerBarFill.width = fillWidth;

        // Determine if we need to flash
        if (this.currentTime / this.maxTime <= 0.5) {
            this.timerBarFill.setFillStyle(0xff0000); // red
            if (!this.flashing) {
                this.flashing = true;
                this.startFlashing();
            }
        } else {
            this.timerBarFill.setFillStyle(0x00ff00);
            if (this.flashing) {
                this.flashing = false;
                this.stopFlashing();
            }
        }
    }

    startFlashing() {
        if (this.flashingTween) {
            this.flashingTween.restart();
        } else {
            this.flashingTween = this.tweens.add({
                targets: this.timerBarFill,
                alpha: { from: 1, to: 0.2 },
                ease: 'Linear',
                duration: 500,
                repeat: -1,
                yoyo: true
            });
        }
    }

    stopFlashing() {
        if (this.flashingTween) {
            this.flashingTween.stop();
            this.timerBarFill.alpha = 1;
            this.flashingTween = null;
        }
    }

    updateCatastropheText(isStormLaunching) {
        this.approachingText.setText(isStormLaunching ? "Storm launching!" : "Catastrophe approaches");
    }
}