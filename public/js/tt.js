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
        this.reachedCamp = false;
        this.lastHealTime = 0;
        this.isEnraged = false;
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

        this.sprite.play(`character${this.characterCode}Idle1`);
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

    attackPlayer(player) {
        if (player.isDead) {
            this.stopAttackingPlayer();
            return;
        }

        this.isAttacking = true;
        this.attacker = player;

        const direction = this.determineDirectionToPoint(player.getPosition().x, player.getPosition().y);
        const attackAnimationKey = `character${this.characterCode}Attack${direction}`;
        this.sprite.play(attackAnimationKey);

        const angleToPlayer = Phaser.Math.Angle.Between(this.sprite.x, this.sprite.y, player.getPosition().x, player.getPosition().y);
        const hasProjectile = this.projectile !== '';

        if (hasProjectile) {
            this.createAttackRangeRectangle(angleToPlayer);
        } else {
            this.createAttackRangeArc(angleToPlayer);
        }

        this.sprite.off('animationupdate');
        this.sprite.on('animationupdate', (anim, frame) => {
            if (anim.key === attackAnimationKey) {
                if (frame.index === 4 && hasProjectile) {
                    this.launchProjectile(player, angleToPlayer);
                } else if (frame.index === 5 && !hasProjectile) {
                    const playerPos = player.getPosition();
                    if (this.isPlayerInArc(playerPos, this.sprite, this.attackRange, angleToPlayer - Math.PI / 6, angleToPlayer + Math.PI / 6)) {
                        player.takeDamage(this.damage, this);
                    } else {
                        this.createDodgeText(player);

                    }
                }
            }
        });

        this.sprite.once('animationcomplete', anim => {
            if (anim.key === attackAnimationKey) {
                this.isAttacking = false;
                if (this.attackRangeArc) this.attackRangeArc.destroy();
                if (this.attackRangeRect) this.attackRangeRect.destroy();
            }
        });
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
        
        console.log(this.isEnraged);

    }

}

class Base {
    constructor(scene, player, camps) {
        this.scene = scene;
        this.player = player;
        this.camps = camps;
        this.sprite = null;
        this.safeDistanceFromPlayer = 500; // not too close to player
        this.minX = 1200; this.maxX = 2800;
        this.minY = 700; this.maxY = 1300;
        this.health = 1000;
        this.totalHealth = 1000;
        this.healthBar = null;
        this.isDestroyed = false;
        this.rebuildTime = 3000; // 5sec after destroyed
        this.destroyedTime = 0;
    }

    create() {
        const baseLocation = this.findSuitableBaseLocation();
        this.sprite = this.scene.add.image(baseLocation.x, baseLocation.y, 'enemy_base');
        this.sprite.setOrigin(0.5, 0.5);
        this.sprite.setScale(2);
        this.sprite.setInteractive();
        this.isDestroyed = false;
        this.health = this.totalHealth;
    
        if (this.healthBar) {
            this.healthBar.clear();
        }
        this.createHealthBar();
    }
    

    findSuitableBaseLocation() {
        let baseX, baseY, tooCloseToPlayer, tooCloseToCamp;
        do { // keep execute until the base is not too close to player or camp
            baseX = Phaser.Math.Between(this.minX, this.maxX);
            baseY = Phaser.Math.Between(this.minY, this.maxY);
            tooCloseToPlayer = Phaser.Math.Distance.Between(this.player.position.x, this.player.position.y, baseX, baseY) < this.safeDistanceFromPlayer;

            tooCloseToCamp = this.camps.some(camp => {
                const distanceToCamp = Phaser.Math.Distance.Between(camp.x, camp.y, baseX, baseY);
                return distanceToCamp <= camp.radius;
            });
        } while (tooCloseToPlayer || tooCloseToCamp); // as long as the base is too close to player or camp, keep execute

        return { x: baseX, y: baseY }; // where the base is located
    }

    getPosition() {
        return {
            x: this.sprite.x,
            y: this.sprite.y
        };
    }

    createHealthBar() {
        this.healthBar = this.scene.add.graphics();
        this.healthBar.setDepth(1);
        this.updateHealthBar(); // initial display
    }

    updateHealthBar() {
        const barX = this.sprite.x - this.sprite.width / 2;
        const barY = this.sprite.y - 150;
        this.healthBar.clear();
        this.healthBar.setPosition(barX, barY);
        // Background of health bar (transparent part)
        this.healthBar.fillStyle(0x000000, 0.5);
        this.healthBar.fillRect(0, 0, this.sprite.width, 10);

        // Health portion (dynamic width based on current health)
        const healthPercentage = this.health / this.totalHealth;
        const healthBarWidth = healthPercentage * this.sprite.width; // Calculate the width based on health percentage
        this.healthBar.fillStyle(0xff0000, 1);
        this.healthBar.fillRect(0, 0, healthBarWidth, 10);
    }

    takeDamage(damage, player) {
        this.attacker = player; // Store reference to the attacking player

        this.health -= damage;
        this.health = Math.max(this.health, 0);
        this.hasPlayerBeenDetected = true;


        this.createDamageText(damage);

        if (this.health <= 0 && !this.isDestroyed) {
            this.destroyed();
        }
        this.updateHealthBar(); 
    }

    createDamageText(damage) {
        const damageText = this.scene.add.text(this.sprite.x, this.sprite.y - 100, `-${damage}`, { font: '36px Orbitron', fill: '#ff0000' });
        damageText.setOrigin(0.5, 0.5);

        this.scene.tweens.add({
            targets: damageText,
            y: damageText.y - 30,
            alpha: 0,
            duration: 800,
            ease: 'Power2',
            onComplete: () => {
                damageText.destroy();
            }
        });
    }

    destroyed() {
        if (this.scene.player.targetedEnemy === this) {
            this.scene.player.targetedEnemy = null;
        }
        this.isDestroyed = true;
        console.log('Base destroyed');
        this.sprite.disableInteractive();
        this.scene.tweens.add({
            targets: this.sprite,
            alpha: 0,
            duration: 1500,
            ease: 'Power1',
            onComplete: () => {
                this.sprite.setVisible(false);
            }
        });
    
        if (this.attacker) {
            this.attacker.stopAttackingEnemy();
        }
    
        this.healthBar.destroy();
        this.destroyedTime = this.scene.time.now;
    }
    
    update(time, delta) {
        if (this.isDestroyed) {
            if (time - this.destroyedTime > this.rebuildTime) {
                // recreate base
                const newBaseLocation = this.findSuitableBaseLocation();
                this.sprite.setPosition(newBaseLocation.x, newBaseLocation.y);
    
                this.sprite.setVisible(true);
                this.sprite.setAlpha(1);
                this.sprite.setInteractive(true);
    
                this.health = this.totalHealth;
                this.isDestroyed = false;
    
                if (this.healthBar) {
                    this.healthBar.clear();
                }
                this.createHealthBar();
            }
        }
    }
    

    
}