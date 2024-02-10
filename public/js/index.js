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

        this.catastrophe = new Catastrophe(this);

        this.scene.launch('BattleUI');
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
        this.player = new Player(this, 1500, 800, 8, this.enemies);
        this.player.create();
    }

    createEnemy() {
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

    collectGold(goldSprite) {
        const targetPosition = { x: 3000, y: 1000}
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
        const targetPosition = { x: 3000, y: 1600}
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
    }

    preload() {
        this.loadingStartTime = Date.now();
        this.createLoadingText();
        this.loadAssets();

        this.load.on('progress', (value) => {
            this.assetProgress = value * 100; // Convert to percentage
            this.loadingText.setText(`Loading... ${Math.round(this.assetProgress)}%`);
        });

        this.load.on('complete', () => {
            // All assets are loaded
            console.log('All assets loaded, switching to GameScene');
            let loadingEndTime = Date.now();
            let loadingDuration = (loadingEndTime - this.loadingStartTime) / 1000;
            console.log(`Loading completed in ${loadingDuration.toFixed(2)} seconds`);
            this.loadingText.setVisible(false);
            this.scene.start('GameScene');
        });
    }

    create() {
        // set default cursor
        this.input.setDefaultCursor(`url('assets/images/mouse_cursor.png') 15 10, pointer`);
    }

    createLoadingText() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        this.loadingText = this.add.text(width / 2, height / 2, 'Loading...', {
            font: '74px Orbitron',
            fill: '#fff',
            align: 'center'
        }).setOrigin(0.5, 0.5);
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
    }


}

document.addEventListener('DOMContentLoaded', (event) => {
    const gameScreen = document.getElementById('game-screen');
    const battleScene = document.getElementById('battle-scene');
    const playButton = document.querySelector('.play-button');

    function startGame() {
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

        const game = new Phaser.Game(config);
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