// THIS FILE SERVES AS A BACKUP BEFORE A FEATURE/TASK


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
        this.originalSpeed = character.speed;
        this.originalDamage = character.damage;
        this.damage = character.damage;
        this.attackSpeed = character.attackSpeed;
        this.originalAttackSpeed = character.attackSpeed;
        this.spritesheetKey = character.spritesheetKey;
        this.isAttacking = false;
        this.attackEvent = null;
        this.originalHealth = character.health;
        this.maxHealth = character.health;
        this.currentHealth = character.health;
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
        this.name = character.name;
    }

    create() {
        this.robotSprite = this.scene.add.sprite(this.position.x, this.position.y);
        this.robotSprite.setOrigin(0.5, 0.5);
        this.robotSprite.setDepth(1);
        if (!this.scene.anims.exists('idle1')) {
            for (let i = 0; i < 4; i++) {
                this.scene.anims.create({
                    key: `idle${i + 1}`,
                    frames: this.scene.anims.generateFrameNumbers(this.spritesheetKey, { start: i * 5, end: i * 5 + 4 }),
                    frameRate: 6,
                    repeat: -1,
                }); // the above code looops through the idle animation and creates a new animation for each of the 4 directions
            }
        }
        const randomIdleAnimation = this.idleAnimations[Math.floor(Math.random() * this.idleAnimations.length)];
        this.robotSprite.play(randomIdleAnimation);
        this.lastAnimationChange = this.scene.time.now;


        const directions = ['southeast', 'southwest', 'south', 'east', 'west', 'northeast', 'northwest', 'north'];
        if (!this.scene.anims.exists('moveeast')) {
            directions.forEach((dir, index) => {
                this.scene.anims.create({
                    key: `move${dir}`,
                    frames: this.scene.anims.generateFrameNumbers(this.spritesheetKey, { start: 20 + (index * 5), end: 20 + (index * 5) + 4 }),
                    frameRate: 6,
                    repeat: -1
                });
            });
        }

        // Create attacking animations
        if (!this.scene.anims.exists('attackeast')) {
            directions.forEach((dir, index) => {
                this.scene.anims.create({
                    key: `attack${dir}`,
                    frames: this.scene.anims.generateFrameNumbers(this.spritesheetKey, { start: 60 + (index * 5), end: 60 + (index * 5) + 4 }),
                    frameRate: 6 * this.originalAttackSpeed,
                    repeat: 0
                });
            });
        }

        // Create death animation
        if (!this.scene.anims.exists('death')) {
            this.scene.anims.create({
                key: 'death',
                frames: this.scene.anims.generateFrameNumbers(this.spritesheetKey, { start: 100, end: 105 }), // 105 does not exist. i use it to hide the final frame
                frameRate: 6,
                repeat: 0
            });
        }

        this.createHealthBar();
        this.detectionField = this.scene.add.circle(this.x, this.y, this.range);
        this.detectionField.setStrokeStyle(4, 0xff0000);

        this.healTimer = this.scene.time.addEvent({
            delay: 5000,
            callback: this.autoHeal,
            callbackScope: this,
            loop: true
        });

    }

    autoHeal() {
        if (this.currentHealth < this.maxHealth && !this.isDead) {
            // calc heal amount as 5% of max health
            const healPercentage = 0.05;
            let healAmount = Math.floor(this.maxHealth * healPercentage);
    
            healAmount = Math.min(healAmount, this.maxHealth - this.currentHealth);
    
            this.currentHealth += healAmount;
            this.updateHealthBar();
            this.createHealingText(healAmount);
        }
    }

    takeDamage(damage, source) {
        if (this.isDead) return;

        this.currentHealth -= damage;
        this.currentHealth = Math.max(this.currentHealth, 0);

        const color = source === 'catastrophe' ? '#ff0' : '#000'; // Yellow for catastrophe, black for others
        this.createDamageText(damage, color);

        if (this.currentHealth <= 0 && !this.isDead) {
            this.die();
        }

        this.updateHealthBar();
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
        if (!this.isDead && this.targetedEnemy && (this.targetedEnemy.returningToCamp || this.targetedEnemy.inCamp || this.targetedEnemy instanceof Base)) {
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

        } else if (this.isMovingTowardsEnemy && !this.isDead && this.targetedEnemy && !this.targetedEnemy.returningToCamp && !this.targetedEnemy.inCamp) {
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
