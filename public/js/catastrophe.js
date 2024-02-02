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
                            indicator.destroy();
                            fireball.destroy();
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

    update(time, delta) {
        if (time > this.fireballTimer) {
            console.log('Launching storm');
            this.launchStorm();
            this.fireballTimer = time + this.stormInterval;
        }
    }
}



export default Catastrophe;