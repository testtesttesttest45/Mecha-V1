class BattleUI extends Phaser.Scene {
    constructor() {
        super({ key: 'BattleUI', active: false });
        this.score = 0;
        this.scoreText = null;
        this.multiplier = 5;
        this.multiplierMin = 1;
        this.multiplierDuration = 10000;
        this.lastMultiplierUpdate = 0;
        this.timerStarted = false;
    }

    startMultiplierTimer() {
        if (!this.timerStarted) {
            this.timerStarted = true;
            this.lastMultiplierUpdate = this.time.now;
        }
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

        const multiplierTextY = strengthenTextY + 80;
        this.multiplierText = this.add.text(panelCenterX, multiplierTextY, `Multiplier: x${this.multiplier}`, {
            font: '16px Orbitron',
            fill: '#ffffff'
        }).setOrigin(0.5, 0).setScrollFactor(0);

        const multiplierBarBackground = this.add.rectangle(panelCenterX, multiplierTextY + 30, 300, 20, 0x000000, 0.5).setOrigin(0.5, 0);
        this.multiplierBarFill = this.add.rectangle(multiplierBarBackground.x - multiplierBarBackground.width / 2, multiplierTextY + 30, 300, 20, 0x00ff00).setOrigin(0, 0).setScrollFactor(0);

        this.lastMultiplierUpdate = this.scene.get('GameScene').time.now;

        const scorePanelX = this.scale.width - 30;
        const scorePanelY = this.scale.height - 150;
        const scorePanelWidth = 350;
        const scorePanelHeight = 100;

        
        const scorePanelBackground = this.add.rectangle(scorePanelX, scorePanelY, scorePanelWidth, scorePanelHeight, 0x000000, 0.5);
        scorePanelBackground.setOrigin(1, 1);

        const scoreTextX = scorePanelX - scorePanelWidth + 20;
        const scoreTextY = scorePanelY - scorePanelHeight / 2;
        this.scoreText = this.add.text(scoreTextX, scoreTextY, 'Score: 0', {
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

    updateScore(amount) {
        this.score += amount * this.multiplier;
        this.scoreText.setText(`Score: ${this.score}`);
    }

    update() {
        if (!this.timerStarted) return;
        this.updateMultiplierFill();
    }

    updateMultiplierFill() {
        if (!this.timerStarted) return;
        const currentTime = this.scene.get('GameScene').time.now;
        if (this.multiplier > this.multiplierMin) {
            const elapsedTime = currentTime - this.lastMultiplierUpdate;
            const remainingTime = this.multiplierDuration - elapsedTime;
            const fillPercentage = remainingTime / this.multiplierDuration;
    
            const newWidth = fillPercentage * 300;
            this.multiplierBarFill.width = newWidth;
    
            if (remainingTime <= 0) {
                this.multiplier--;
                this.multiplierText.setText(`Multiplier: x${this.multiplier}`);
                this.lastMultiplierUpdate = currentTime;
                this.multiplierBarFill.width = this.multiplier > this.multiplierMin ? 300 : this.multiplierBarFill.width;
            }
        } else {
            // If the multiplier is at its minimum, ensure the bar remains fully filled
            this.multiplierBarFill.width = 300;
        }
    }
}


export default BattleUI;

