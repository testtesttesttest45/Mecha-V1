class Catastrophe {
    constructor(scene, baseLevel) {
        this.stormInterval = 12000;
        this.baseDamage = 220;
        this.baseLevel = baseLevel;
        this.scene = scene;
        this.minX = 1200;
        this.maxX = 2800;
        this.minY = 700;
        this.maxY = 1300;
        this.indicatorDuration = 1000;
        this.fireballPositions = [];
        this.minDistance = 350;
        this.indicators = [];
        this.damage = Math.round(this.baseDamage * Math.pow(1.2, this.baseLevel - 1));
        this.activeStormEffects = 0;
        this.timerStarted = false;
    }
    
    startStormTimer() {
        if (!this.timerStarted) {
            this.fireballTimer = this.stormInterval;
            this.isStorming = false;
            this.timerStarted = true;
        }
    }

    launchStorm() {
        if (!this.isStorming) {
            this.isStorming = true;
            this.activeStormEffects = 0;
            this.fireballPositions = [];
            for (let i = 0; i < 6; i++) {
                this.activeStormEffects++;
                let position = this.getValidFireballPosition();
                let { x, endY } = position;

                let startY = endY - 700;
                let indicatorRadius = 135;
                let indicator = this.scene.add.circle(x, endY, indicatorRadius, 0xff0000, 0.3);
                indicator.setDepth(1);
                this.indicators.push({ indicator, x, y: endY, radius: indicatorRadius });

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
                                this.checkDamage(x, endY, indicatorRadius);
                                indicator.destroy();
                                fireball.destroy();
                                this.indicators = this.indicators.filter(item => item.indicator !== indicator);
                                this.activeStormEffects--;

                                if (this.activeStormEffects === 0) {
                                    this.endStorm();
                                }
                            }
                        });
                    },
                });
            }
        }
    }

    endStorm() {
        this.isStorming = false;
        this.fireballTimer = this.scene.activeGameTime + this.stormInterval;
    }

    checkDamage(x, y, radius) {
        // Player damage check (existing logic)
        let playerPos = this.scene.player.getPosition();
        let distanceToPlayer = Phaser.Math.Distance.Between(x, y, playerPos.x, playerPos.y);
        if (distanceToPlayer <= radius) { // player within fireball impact zone
            this.scene.player.takeDamage(this.damage, 'catastrophe');
        }

        // Enemy damage check
        this.scene.enemies.forEach(enemy => {
            let enemyPos = enemy.getPosition();
            let distanceToEnemy = Phaser.Math.Distance.Between(x, y, enemyPos.x, enemyPos.y);
            if (distanceToEnemy <= radius && !enemy.returningToCamp && !enemy.inCamp) {
                enemy.takeDamage(this.damage, 'catastrophe');
            }
        });
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
        this.fireballPositions.push({ x, endY });
        return { x, endY };
    }

    getTimeUntilNextStorm() {
        return Math.max(0, this.fireballTimer - this.scene.activeGameTime);
    }

    updateDamage(newBaseLevel) {
        this.damage = Math.round(this.baseDamage * (1 + (newBaseLevel - 1) * 0.2)); // linear increase approach
        this.damage = Math.round(this.baseDamage * Math.pow(1.2, newBaseLevel - 1)); // compounded increase approach using exponential function
    }

    update(time, delta) {
        if (time > this.fireballTimer && !this.isStorming) {
            this.launchStorm();
        }
    }
}



export default Catastrophe;