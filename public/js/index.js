import Player from './player.js';
import Enemy from './enemy.js';
import Camp from './camp.js';
import Base from './base.js';
import Catastrophe from './catastrophe.js';
import BattleUI from './battle_ui.js';
import characterMap from './characters.js';
import { rgbToHex, resize, loadDynamicSpriteSheet, setAttackCursor, setDefaultCursor } from './utilities.js';

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
        this.cancelClick = false;
        this.catastrophe = null;
        this.base = null;
        this.allowInput = false;
    }

    create() {
        this.gameScreenWidth = this.sys.game.config.width;
        this.gameScreenHeight = this.sys.game.config.height;
        this.createStaticBackground();
        this.createLand();
        this.createPlayer();
        this.createCamps();
        this.createBase();
        this.createEnemy();
        this.setupCamera();

        this.messageText = this.add.text(0, 0, '', { font: '24px Orbitron', fill: '#ff0000', align: 'center' });
        this.messageText.setVisible(false);

        this.catastrophe = new Catastrophe(this, this.base.baseLevel);

        this.scene.launch('BattleUI');
        this.enableInputAfterDelay();
    }

    createStaticBackground() {
        this.ocean = this.add.image(0, 0, 'ocean').setOrigin(0, 0);
        this.ocean.setScale(8);
        this.ocean.setDepth(-1);
    }

    createLand() {
        // Place land image in the center of the ocean
        this.land = this.add.image(
            8000 / 4, 4000 / 4, 'land').setOrigin(0.5, 0.5);
    }

    setupCamera() {
        let pointerDownTime = 0;
        const dragThreshold = 20;

        this.isCameraLocked = false;
        this.isCameraFollowingPlayer = false;

        // Set the bounds and initial zoom of the camera
        this.cameras.main.setBounds(0, 0, this.sys.game.config.width * 2, this.sys.game.config.height * 2);
        this.cameras.main.setZoom(this.initialZoom);

        // Center the camera on the land initially
        this.cameras.main.scrollX = this.land.x - this.gameScreenWidth / 2;
        this.cameras.main.scrollY = this.land.y - this.gameScreenHeight / 2;

        // Enhanced Zoom controls
        this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY, deltaZ) => {
            if (this.isZoomEnabled) {
                const newZoom = deltaY > 0 ? Math.max(this.cameras.main.zoom - 0.25, 0.5) : Math.min(this.cameras.main.zoom + 0.25, 2.5);
                this.cameras.main.zoomTo(newZoom, 300);

            }
        });

        // Implementing Camera Dragging
        this.input.on('pointerdown', pointer => {
            pointerDownTime = Date.now();
            if (!this.isCameraDraggable) {
                return;
            }
            this.dragStartPoint = new Phaser.Math.Vector2(pointer.x, pointer.y);
            this.isDragging = false;
        });

        this.input.on('pointermove', pointer => {
            if (!this.isCameraDraggable) {
                return;
            }
            if (!pointer.isDown || !this.dragStartPoint) return;

            const distanceMoved = Phaser.Math.Distance.Between(this.dragStartPoint.x, this.dragStartPoint.y, pointer.x, pointer.y);
            if (distanceMoved > dragThreshold) {
                this.isDragging = true;

                const dragX = this.cameras.main.scrollX + (this.dragStartPoint.x - pointer.x);
                const dragY = this.cameras.main.scrollY + (this.dragStartPoint.y - pointer.y);

                this.cameras.main.scrollX = dragX;
                this.cameras.main.scrollY = dragY;

                this.dragStartPoint.x = pointer.x;
                this.dragStartPoint.y = pointer.y;
            }
        });

        this.input.on('pointerup', pointer => {
            const pointerUpTime = Date.now();
            const heldTime = pointerUpTime - pointerDownTime;

            if (!this.isDragging) {
                this.handlePlayerClick(pointer);
            }
            this.dragStartPoint = null;
            this.isDragging = false;  // Reset the dragging flag
        });

        this.input.keyboard.on('keydown-SPACE', () => {
            this.isCameraFollowingPlayer = !this.isCameraFollowingPlayer;
            if (this.isCameraFollowingPlayer) {
                // Start following the player
                this.cameras.main.startFollow(this.player.getPosition(), true, 0.01, 0.01);
            } else {
                // Stop following the player
                this.cameras.main.stopFollow();
            }
        });

        this.isCameraDraggable = true;
        this.isZoomEnabled = true; // Ensure zoom is enabled by default

        this.input.keyboard.on('keydown-L', () => {
            if (this.isCameraLocked) {
                // Unlock the camera
                this.isCameraLocked = false;
                this.isCameraDraggable = true;
                this.isZoomEnabled = true;
            } else {
                // Lock the camera
                this.isCameraLocked = true;
                this.isCameraDraggable = false;
                this.isZoomEnabled = false;
                this.cameras.main.setZoom(this.initialZoom);
                this.cameras.main.scrollX = this.land.x - this.gameScreenWidth / 2;
                this.cameras.main.scrollY = this.land.y - this.gameScreenHeight / 2;
                this.cameras.main.stopFollow();
            }
        });

    }

    handlePlayerClick(pointer) {
        if (!this.allowInput) return;
        if (this.enemyClicked) {
            this.enemyClicked = false; // Reset the flag
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
            this.player.targetedEnemy = null;
            this.cancelClick = true;
            this.player.moveStraight(worldPoint.x, worldPoint.y);
        } else {
            this.showOutOfBoundsMessage(worldPoint);
        }
    }

    showOutOfBoundsMessage(worldPoint) {
        this.messageText.setText("Can't go there!");
        this.messageText.setOrigin(0.5, 0.5);
        this.messageText.setVisible(true);

        // Adjust position of the message text
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


    createPlayer() {
        this.player = null;
        this.player = new Player(this, 1500, 800, 3, this.enemies);
        this.player.create();
    }

    createEnemy() {
        this.enemies = [];
        const camps = [this.camp1, this.camp2, this.camp3];

        camps.forEach(camp => {
            for (let i = 0; i < 3; i++) {
                const randomPosition = camp.getRandomPositionInRadius();
                const characterCode = this.selectEnemyCharacterCode();
                const enemy = new Enemy(this, randomPosition.x, randomPosition.y, characterCode, camp, this.player, this.base.baseLevel, this.base);
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
                    this.player.isMovingTowardsEnemy = true;
                    // Check if the targeted enemy is the same as the clicked enemy
                    if (this.player.targetedEnemy === enemy && this.player.isAttacking) {
                        return; // Do not reset attack animation if already attacking the same enemy
                    }
                    this.cancelClick = true;
                    this.player.moveStraight(enemy.sprite.x, enemy.sprite.y, () => {
                        this.player.playAttackAnimation(enemy);
                        this.player.continueAttacking = true;
                    });
                });



            }
        });

        // update this.base.enemies to include updated array of enemies
        this.base.enemies = this.enemies;
    }

    selectEnemyCharacterCode() {
        // filter characterMap by 'easy' tier
        let easyEnemies = Object.entries(characterMap).filter(([key, value]) => value.tier === 'easy').map(([key]) => key);

        // ff base level is 5 or higher, might have 'hard' tier enemies
        if (this.base.baseLevel >= 5) {
            let hardEnemies = Object.entries(characterMap).filter(([key, value]) => value.tier === 'hard').map(([key]) => key);

            // 50% chance to choose from 'hard' tier if base level >= 5
            if (Math.random() < 0.5) {
                return hardEnemies[Math.floor(Math.random() * hardEnemies.length)];
            }
        }

        // default to choose from 'easy' tier
        return easyEnemies[Math.floor(Math.random() * easyEnemies.length)];
    }

    createCamps() {
        this.camp1 = new Camp(this, 1240, 1250);
        this.camp1.create();

        this.camp2 = new Camp(this, 1900, 700);
        this.camp2.create();

        this.camp3 = new Camp(this, 2620, 1220);
        this.camp3.create();
    }

    createBase() {
        this.base = new Base(this, this.player, [this.camp1, this.camp2, this.camp3], this.enemies);
        this.base.create();

        // add hover effect
        this.base.sprite.on('pointerover', () => {
            if (!this.base.isDestroyed) {
                setAttackCursor(this);
            }
        });

        this.base.sprite.on('pointerout', () => {
            setDefaultCursor(this);
        });


        this.base.sprite.on('pointerdown', () => {
            console.log("Base clicked");
            this.enemyClicked = true;
            this.player.targetedEnemy = this.base;
            this.player.isMovingTowardsEnemy = true;
            if (this.player.targetedEnemy === this.base && this.player.isAttacking) {
                return; // Do not reset attack animation if already attacking the same enemy
            }
            this.cancelClick = true;
            this.player.moveStraight(this.base.sprite.x, this.base.sprite.y, () => {
                this.player.playAttackAnimation(this.base);
                this.player.continueAttacking = true;
            });
        });
    }

    collectGold(goldSprite) {
        const targetPosition = { x: 3000, y: 1000 }
        this.tweens.add({
            targets: goldSprite,
            x: targetPosition.x,
            y: targetPosition.y,
            alpha: 0,
            scale: 2,
            ease: 'Power2',
            onComplete: () => {
                console.log(goldSprite.getData('value') + ' gold collected');
                this.scene.get('BattleUI').addGold(goldSprite.getData('value'));
                goldSprite.destroy();
            }
        });
    }

    collectCash(cashSprite) {
        const targetPosition = { x: 3000, y: 1600 }
        this.tweens.add({
            targets: cashSprite,
            x: targetPosition.x,
            y: targetPosition.y,
            alpha: 0,
            scale: 2,
            ease: 'Power2',
            onComplete: () => {
                console.log(cashSprite.getData('value') + ' cash collected');
                this.scene.get('BattleUI').addCash(cashSprite.getData('value'));
                cashSprite.destroy();
            }
        });
    }

    enableInputAfterDelay() {
        this.time.delayedCall(100, () => {
            this.allowInput = true;
        });
    }

    update(time, delta) {
        if (this.player) {
            this.player.update(time, delta, this.enemies);
        }
        this.enemies.forEach(enemy => {
            if (enemy) {
                if (!enemy.timerStarted) {
                    enemy.startTimer();
                }
                let playerPosition = this.player.getPosition();
                enemy.updateEnemy(playerPosition.x, playerPosition.y, this.player, delta);
                enemy.update(time, delta);
                const timeUntilNextStrengthen = enemy.getTimeUntilNextStrengthen();
                this.scene.get('BattleUI').updateStrengthenTimer(timeUntilNextStrengthen);
            }
        });

        if (this.isCameraFollowingPlayer) {
            // Update the camera to follow the player's current position
            this.cameras.main.startFollow(this.player.getPosition(), true, 0.01, 0.01);
        }

        if (this.base) {
            // console.log(this.base.health)
            this.base.update(time, delta);
        }

        if (this.catastrophe && !this.catastrophe.timerStarted) {
            this.catastrophe.startStormTimer();
        }

        if (this.catastrophe) {
            this.catastrophe.update(time, delta);
            const timeUntilNextStorm = this.catastrophe.getTimeUntilNextStorm();
            this.scene.get('BattleUI').updateTimer(timeUntilNextStorm);
        }

        if (this.catastrophe.isStorming) {
            this.scene.get('BattleUI').updateCatastropheText(true);
        } else {
            this.scene.get('BattleUI').updateCatastropheText(false);
        }

        let battleUIScene = this.scene.get('BattleUI');
        if (battleUIScene && !battleUIScene.timerStarted) {
            battleUIScene.startMultiplierTimer();
        }

        if (this.base.isDestroyed) {
            const timeElapsedSinceDestruction = this.time.now - this.base.destroyedTime;
            const rebuildProgress = Math.min(timeElapsedSinceDestruction / this.base.rebuildTime, 1);

            if (rebuildProgress < 1) {
                this.scene.get('BattleUI').updateBaseRebuildUI(rebuildProgress);
            }
        }
    }
}

class LoadingScene extends Phaser.Scene {
    constructor() {
        super({ key: 'LoadingScene' });
        this.grid = null;
        this.loadingStartTime = 0;
        this.assetsLoaded = false;
        this.gridCreated = false;
        this.assetProgress = 0;
        this.gridProgress = 0;
        this.tooltips = [
            "Periodic Catastrophe storms do massive damage to all characters! Lure enemies into a storm to greatly reduce their health!",
            "Enemies are immune to Catastrophe if they are in camps. They are also immune to all forms of damage when returning to camps.",
            "The white bar below the enemies' health bar represents Interest. When the player stays out of range long enough, enemies' Interest bar drops and eventually gives up chasing the player.",
            "Destroying the base can kill all enemies alive. However, while the base is still standing, any enemies alive will be enraged, gaining increased movement speed and double damage. Take them out first!",
            "Enemies will lose their Enraged state after a while, but attacking their base again will reset their Enraged timer.",
            "Sometimes enemies can drop Cash. New characters can be purchased with Cash in the main menu. (Not available yet)",
            "When enemies die, they drop gold. Destruction of the base drops extra gold. Gold drops are reduced if enemies died as a result of the base being destroyed.",
            "Spend the gold you earned in the Battle Shop to purchase items that make you stronger!",
            "The blue square on the left of the health bar of enemies represents the stats they inherit from the current base level. The black hexagon on the right of the health bar of enemies represents additional stats they gain after periodic Enemy Strengthenings. Don't take too long to kill them, or they become too strong to kill!",
            "Every few seconds, the player heals back some amount of health based on his Max Health.",
            "Stronger enemies appear on Base level 5 onwards. Beware!",
            "Pay attention to the Catastrophe timer, avoid shopping when the Catastrophe is approaching!",
            "Every increase in the Base level amplifies the health and damage of all enemies.",
            "Each time the Base level increases, the damage from Catastrophe grows by an additional 20% from the last level!",
        ];
        this.background = null;
        this.progressBar = null;
        this.progressBox = null;
    }

    preload() {
        this.loadingStartTime = Date.now();

        this.createBackground();
        this.createLoadingText();
        this.createProgressBar();
        this.createTooltipText();

        this.loadAssets();

        this.load.on('progress', this.updateProgressBar, this);
        this.load.on('complete', this.onLoadComplete, this);

        this.input.on('pointerdown', this.updateTooltipText, this);
    }
    create() {
        // Set default cursor
        this.input.setDefaultCursor(`url('assets/images/mouse_cursor.png') 15 10, pointer`);
    }

    createBackground() {
        this.cameras.main.setBackgroundColor('#000');
    }

    createLoadingText() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        this.loadingText = this.add.text(width / 2, height / 2 - 50, 'Loading...', {
            font: '48px Orbitron',
            fill: '#ffffff'
        }).setOrigin(0.5, 0.5);
    }

    createProgressBar() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        this.progressBox = this.add.graphics();
        this.progressBar = this.add.graphics();

        // Progress box (border)
        this.progressBox.fillStyle(0x222222, 0.8);
        this.progressBox.fillRect(width / 2 - 160, height / 2 + 30, 320, 50);

        this.updateProgressBar(0);
    }

    updateProgressBar(progress) {
        this.progressBar.clear();
        this.progressBar.fillStyle(0xffffff, 1);
        this.progressBar.fillRect(this.cameras.main.width / 2 - 150, this.cameras.main.height / 2 + 40, 300 * progress, 30);

        this.loadingText.setText(`Loading... ${Math.round(progress * 100)}%`);
    }

    onLoadComplete() {
        console.log('All assets loaded, switching to GameScene');
        let loadingEndTime = Date.now();
        let loadingDuration = (loadingEndTime - this.loadingStartTime) / 1000;
        console.log(`Loading completed in ${loadingDuration.toFixed(2)} seconds`);
        this.progressBar.destroy();
        this.progressBox.destroy();
        this.createStartButton();
    }

    createTooltipText() {
        const width = this.cameras.main.width;
        const tooltipY = this.loadingText.y + this.loadingText.height + 100;
        this.tooltipText = this.add.text(width / 2, tooltipY, '', {
            font: '24px Orbitron',
            fill: '#fff',
            align: 'center',
            wordWrap: { width: width - 100, useAdvancedWrap: true }
        }).setOrigin(0.5, 0);

        this.updateTooltipText();
    }

    updateTooltipText() {
        const randomIndex = Phaser.Math.Between(0, this.tooltips.length - 1);
        this.tooltipText.setText(this.tooltips[randomIndex]);
    }

    createStartButton() {
        const padding = 10;
        const buttonWidth = 150;
        const buttonHeight = 50;
        const width = this.cameras.main.width;
        const height = this.cameras.main.height / 2;
    
        let startX = width - buttonWidth - padding;
        let startY = height - buttonHeight - padding;
    
        let startButton = this.add.text(startX, startY, 'Start', {
            font: '20px Orbitron',
            fill: '#FFFFFF',
            backgroundColor: '#5cb85c',
            padding: { x: 10, y: 5 }
        })
        .setInteractive({ useHandCursor: true })
        .setOrigin(0.5, 0.5)
        .on('pointerover', () => startButton.setStyle({ fill: '#4cae4c'}))
        .on('pointerout', () => startButton.setStyle({ fill: '#FFFFFF'}))
        .on('pointerdown', () => {
            this.scene.start('GameScene');
        });
    
        startButton.setStroke('#4cae4c', 4);
        startButton.setShadow(2, 2, 'rgba(0,0,0,0.5)', 2, true, true);
    
        let background = this.add.graphics();
        background.fillStyle(0x5cb85c, 1);
        background.fillRoundedRect(startX - buttonWidth, startY - buttonHeight, buttonWidth, buttonHeight, 5);
        background.setDepth(-1)
    
        startButton.setX(startX - buttonWidth / 2);
        startButton.setY(startY - buttonHeight / 2);
    }
    

    loadAssets() {
        this.load.image('ocean', 'assets/images/ocean.png');
        this.load.image('land', 'assets/images/land2.png');

        this.load.image('mouse_cursor', 'assets/images/mouse_cursor.png');
        this.load.image('mouse_cursor_attack', 'assets/images/mouse_cursor_attack.png');
        this.load.image('enemy_camp', 'assets/images/enemy_camp1.png');
        this.load.image('enemy_base', 'assets/images/enemy_base1.png');

        loadDynamicSpriteSheet.call(this, 'character1', 'assets/sprites/character_1.png', 4000, 4400);
        loadDynamicSpriteSheet.call(this, 'character2', 'assets/sprites/character_2.png', 4000, 4400);
        loadDynamicSpriteSheet.call(this, 'character3', 'assets/sprites/character_3.png', 4000, 3520);
        loadDynamicSpriteSheet.call(this, 'character4', 'assets/sprites/character_4.png', 4000, 4400);
        loadDynamicSpriteSheet.call(this, 'character5', 'assets/sprites/character_5.png', 4000, 2640);
        loadDynamicSpriteSheet.call(this, 'character6', 'assets/sprites/character_6.png', 4000, 4400);
        loadDynamicSpriteSheet.call(this, 'character7', 'assets/sprites/character_7.png', 4000, 4400);
        loadDynamicSpriteSheet.call(this, 'character8', 'assets/sprites/character_8.png', 4000, 4400);
        loadDynamicSpriteSheet.call(this, 'character9', 'assets/sprites/character_9.png', 4000, 4400);
        loadDynamicSpriteSheet.call(this, 'character10', 'assets/sprites/character_10.png', 4000, 4400);

        this.load.image('blueBullet', 'assets/projectiles/blue_bullet.png');
        this.load.image('fireball', 'assets/projectiles/fireball.png');

        this.load.image('catastrophe', 'assets/images/catastrophe.png');
        this.load.image('strengthen', 'assets/images/strengthen.png');
        this.load.image('player', 'assets/images/player.png');
        this.load.image('gold', 'assets/images/gold.png');
        this.load.image('cash', 'assets/images/cash.png');

        this.load.image('sword1', 'assets/images/sword1.png');
        this.load.image('sword2', 'assets/images/sword2.png');
        this.load.image('health1', 'assets/images/health1.png');
        this.load.image('health2', 'assets/images/health2.png');
        this.load.image('attackSpeed1', 'assets/images/attackSpeed1.png');
        this.load.image('attackSpeed2', 'assets/images/attackSpeed2.png');
        this.load.image('moveSpeed1', 'assets/images/moveSpeed1.png');
        this.load.image('moveSpeed2', 'assets/images/moveSpeed2.png');
    }
}
document.addEventListener('DOMContentLoaded', (event) => {
    const gameScreen = document.getElementById('main-menu');
    const battleScene = document.getElementById('battle-scene');
    const playButton = document.querySelector('.play-button');

    let game;

    function startGame() {
        if (game) {
            game.destroy(true);
        }

        const config = {
            type: Phaser.AUTO,
            width: 1920,
            height: 1080,
            parent: 'battle-scene',
            scene: [LoadingScene, GameScene, BattleUI],
            render: {
                pixelArt: true,
            },
            physics: {
                default: 'arcade',
                arcade: {
                    debug: false // true to see physics bodies for debugging
                }
            },
        };

        game = new Phaser.Game(config);
        game.canvas.id = 'battle-canvas';
        resize(game);

        window.addEventListener('resize', () => {
            resize(game);
        });
    }


    playButton.addEventListener('click', () => {
        gameScreen.style.display = 'none';
        battleScene.style.display = 'flex';
        startGame();
    });
});