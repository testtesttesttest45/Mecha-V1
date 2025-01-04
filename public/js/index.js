import Player from './player.js';
import Enemy from './enemy.js';
import Camp from './camp.js';
import Base from './base.js';
import Catastrophe from './catastrophe.js';
import BattleUI from './battle_ui.js';
import characterMap from './characters.js';
import { rgbToHex, resize, loadDynamicSpriteSheet, setAttackCursor, setDefaultCursor } from './utilities.js';
import musicManager from './music_manager.js';

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
        this.activeGameTime = 0;
        this.isGamePaused = false;
        this.characterInUse = null;
        this.isGameOver = false;
        this.isWinterFrostActive = false;
        this.isTreasureHunterActive = false;
    }

    preload() {
        this.load.audio('battle_music', 'assets/audio/battle_music.mp3');
    }

    create(data) {
        const isMuted = localStorage.getItem('isMuted') === 'true';
        musicManager.stop();
        if (!isMuted) {
            musicManager.play('assets/audio/battle_music.mp3');
        }

        this.gameScreenWidth = this.sys.game.config.width;
        this.gameScreenHeight = this.sys.game.config.height;
        this.characterInUse = data.characterInUse;
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
        this.catastrophe.drawstormShelter();

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

        // this.input.keyboard.on('keydown-SPACE', () => {
        //     this.isCameraFollowingPlayer = !this.isCameraFollowingPlayer;
        //     if (this.isCameraFollowingPlayer) {
        //         // Start following the player
        //         this.cameras.main.startFollow(this.player.getPosition(), true, 0.01, 0.01);
        //     } else {
        //         // Stop following the player
        //         this.cameras.main.stopFollow();
        //     }
        // });

        this.isCameraDraggable = true;
        this.isZoomEnabled = true; // Ensure zoom is enabled by default

        // this.input.keyboard.on('keydown-L', () => {
        //     if (this.isCameraLocked) {
        //         // Unlock the camera
        //         this.isCameraLocked = false;
        //         this.isCameraDraggable = true;
        //         this.isZoomEnabled = true;
        //     } else {
        //         // Lock the camera
        //         this.isCameraLocked = true;
        //         this.isCameraDraggable = false;
        //         this.isZoomEnabled = false;
        //         this.cameras.main.stopFollow();
        //         this.cameras.main.setZoom(0.7);
        //         this.cameras.main.scrollX = 1300;
        //         this.cameras.main.scrollY = this.land.y - this.gameScreenHeight / 2;
        //     }
        // });

    }

    toggleCameraLock() {
        // If the camera is currently following the player, stop following before locking the camera
        if (this.isCameraFollowingPlayer) {
            this.toggleCameraFollow();
            this.scene.get('BattleUI').updateLocationIcon();
        }

        this.isCameraLocked = !this.isCameraLocked;
        if (this.isCameraLocked) {
            this.lockCamera();
        } else {
            this.unlockCamera();
        }
    }

    lockCamera() {
        this.isCameraDraggable = false;
        this.isZoomEnabled = false;
        this.cameras.main.stopFollow();
        this.cameras.main.setZoom(0.75);
        this.cameras.main.scrollX = 1300;
        this.cameras.main.scrollY = this.land.y - this.gameScreenHeight / 2;
    }

    unlockCamera() {
        this.isCameraDraggable = true;
        this.isZoomEnabled = true;
    }

    toggleCameraFollow() {
        // If the camera is currently locked, unlock it before starting to follow the player
        if (this.isCameraLocked) {
            this.toggleCameraLock();
            this.scene.get('BattleUI').updateCameraIcon();
        }

        this.isCameraFollowingPlayer = !this.isCameraFollowingPlayer;
        if (this.isCameraFollowingPlayer) {
            // Start following the player
            this.cameras.main.startFollow(this.player.getPosition(), true, 0.01, 0.01);
        } else {
            // Stop following the player
            this.cameras.main.stopFollow();
        }
    }


    handlePlayerClick(pointer) {
        if (!this.allowInput || pointer.button !== 0) return;

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
        this.player = new Player(this, 1500, 800, this.characterInUse, this.enemies);
        this.player.create();
    }

    createEnemy() {
        this.enemies = [];
        const camps = [this.camp1, this.camp2, this.camp3];
        const enemiesCount = this.base.baseLevel === 1 ? 1 : 3;
        const patrollerCount = this.base.baseLevel === 1 ? 1 : 2;

        // normal camp enemies
        camps.forEach(camp => {
            for (let i = 0; i < enemiesCount; i++) {
                const randomPosition = camp.getRandomPositionInRadius();
                const characterCode = this.selectEnemyCharacterCode();
                const enemy = new Enemy(this, randomPosition.x, randomPosition.y, characterCode, camp, this.player, this.base.baseLevel, this.base, this.isWinterFrostActive, this.isTreasureHunterActive);
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
                    // console.log("Enemy clicked");
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

        // patrolling enemies
        for (let i = 0; i < patrollerCount; i++) {
            const basePos = this.base.getPosition();
            const enemy = new Enemy(this, basePos.x, basePos.y, 1, null, this.player, this.base.baseLevel, this.base, this.isWinterFrostActive, this.isTreasureHunterActive);
            enemy.patrolling = true;
            enemy.create();
            this.enemies.push(enemy);

            enemy.sprite.on('pointerover', () => {
                if (!enemy.isDead) {
                    setAttackCursor(this);
                }
            });

            enemy.sprite.on('pointerout', () => {
                setDefaultCursor(this);
            });

            enemy.sprite.on('pointerdown', () => {
                // console.log("Enemy clicked");
                this.enemyClicked = true;
                this.player.targetedEnemy = enemy;
                this.player.isMovingTowardsEnemy = true;
                if (this.player.targetedEnemy === enemy && this.player.isAttacking) {
                    return;
                }
                this.cancelClick = true;
                this.player.moveStraight(enemy.sprite.x, enemy.sprite.y, () => {
                    this.player.playAttackAnimation(enemy);
                    this.player.continueAttacking = true;
                });
            });
        }

        // update this.base.enemies to include updated array of enemies
        this.base.enemies = this.enemies;
    }

    selectEnemyCharacterCode() {
        // filter characterMap by 'easy' tier
        let easyEnemies = Object.entries(characterMap).filter(([key, value]) => value.tier === 'easy').map(([key]) => key);

        // ff base level is 4 or higher, might have 'hard' tier enemies
        if (this.base.baseLevel >= 4) {
            let hardEnemies = Object.entries(characterMap).filter(([key, value]) => value.tier === 'hard').map(([key]) => key);

            // 70% chance to choose from 'hard' tier if base level >= 4
            if (Math.random() < 0.7) {
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
            // console.log("Base clicked");
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
        if (this.isGameOver) return;
        const targetPosition = { x: 3000, y: 1000 }
        this.tweens.add({
            targets: goldSprite,
            x: targetPosition.x,
            y: targetPosition.y,
            alpha: 0,
            scale: 2,
            ease: 'Power2',
            onComplete: () => {
                // console.log(goldSprite.getData('value') + ' gold collected');
                this.scene.get('BattleUI').addGold(goldSprite.getData('value'));
                goldSprite.destroy();
            }
        });
    }

    collectCash(cashSprite) {
        if (this.isGameOver) return;
        const targetPosition = { x: 3000, y: 1600 }
        this.tweens.add({
            targets: cashSprite,
            x: targetPosition.x,
            y: targetPosition.y,
            alpha: 0,
            scale: 2,
            ease: 'Power2',
            onComplete: () => {
                // console.log(cashSprite.getData('value') + ' cash collected');
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
        if (!this.isGamePaused) {
            this.activeGameTime += delta;
        }
        if (this.player) {
            this.player.update(this.activeGameTime, delta, this.enemies);
        }
        this.enemies.forEach(enemy => {
            if (enemy) {
                if (!enemy.timerStarted) {
                    enemy.startTimer();
                }
                let playerPosition = this.player.getPosition();
                enemy.updateEnemy(playerPosition.x, playerPosition.y, this.player, delta);
                enemy.update(this.activeGameTime, delta);
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
            this.base.update(this.activeGameTime, delta);
        }

        if (this.catastrophe) {
            if (!this.catastrophe.timerStarted) {
                this.catastrophe.startStormTimer();
            }
            this.catastrophe.update(this.activeGameTime, delta);
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
            const timeElapsedSinceDestruction = this.activeGameTime - this.base.destroyedTime;
            const rebuildProgress = Math.min(timeElapsedSinceDestruction / this.base.rebuildTime, 1);

            if (rebuildProgress < 1) {
                this.scene.get('BattleUI').updateBaseRebuildUI(rebuildProgress);
            }
        }
    }

    togglePause() {
        this.isGamePaused = !this.isGamePaused;
    }

    shutdown() {
        musicManager.play('assets/audio/background_music.mp3');
        super.shutdown();
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
            "Sometimes enemies can drop Cash. New characters can be purchased with Cash in the main menu.",
            "When enemies die, they drop gold. Destruction of the base drops extra gold. Gold drops are reduced if enemies died as a result of the base being destroyed.",
            "Spend the gold you earned in the Battle Shop to purchase items that make you stronger!",
            "The Blue Square on the left of the health bar of enemies represents the stats they inherit from the current Base Level. The Black Hexagon on the right of the health bar of enemies represents additional stats they gain after periodic Enemy Strengthenings. Don't take too long to kill them, or they become too strong to kill!",
            "Every few seconds, the player heals back some amount of health based on his Max Health.",
            "Stronger enemies appear on Base level 4 onwards. Beware!",
            "Pay attention to the Catastrophe timer, avoid shopping when the Catastrophe is approaching!",
            "Every increase in the Base level amplifies the health and damage of all enemies.",
            "Each time the Base level increases, the damage from Catastrophe grows by an additional 20% from the last level!",
            "Press [L] to lock/unlock the camera. Press [Space] to toggle camera follow mode.",
            "The strongest character is the Thunder Epic Dragon! If you see him, RUN!!!",
            "Enemy attacks can be dodged.",
            "Gold and Cash drops are collected automatically, don't worry about picking them up.",
            "Although destroying the base is the main objective, gold drops from enemies are reduced. Think of your strategy!",
            "The game is played best with full screen mode. Press [F11] to toggle full screen.",
            "The Storm Shelter is a safe zone for players only, marked by a blue circle. Stay inside the circle to avoid Catastrophe damage while shopping.",
            "Patrolling enemies can be a nuisance if left unchecked. They are also immune to Catastrophe.",
            "The sole developer of this game would like to thank you for playing! Enjoy the game!",
            "Here's a reward for reading this: The promo code is [abc123] Enter it in the Main Menu settings to claim your reward!"
        ];
        this.background = null;
        this.progressBar = null;
        this.progressBox = null;
    }

    preload() {
        this.loadingStartTime = Date.now();
        this.load.image('hand_pointer', 'assets/images/tips.png');
        this.load.once('filecomplete-image-hand_pointer', this.createTooltipText, this);

        this.createBackground();
        this.createLoadingText();
        this.createProgressBar();

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
        fetch('/get-game-data')
            .then(response => response.json())
            .then(data => {
                const characterInUse = data.characterInUse;
                console.log('All assets loaded, switching to GameScene with character:', characterInUse);
                let loadingEndTime = Date.now();
                let loadingDuration = (loadingEndTime - this.loadingStartTime) / 1000;
                console.log(`Loading completed in ${loadingDuration.toFixed(2)} seconds`);
                this.progressBar.destroy();
                this.progressBox.destroy();
                this.createStartButton(data.characterInUse);
            })
            .catch(error => {
                console.error('Error fetching game data:', error);
            });
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

        this.handPointerImage = this.add.image(width / 2 + 500, tooltipY + 150, 'hand_pointer').setOrigin(0.5, 1);
        this.updateTooltipText();
    }

    updateTooltipText() {
        const randomIndex = Phaser.Math.Between(0, this.tooltips.length - 1);
        this.tooltipText.setText(this.tooltips[randomIndex]);
    }

    createStartButton(characterInUse) {
        const padding = 10;
        const buttonWidth = 150;
        const buttonHeight = 50;
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        let startX = width / 2 + 500;
        let startY = 400;

        let background = this.add.graphics({ x: startX, y: startY });
        background.fillStyle(0x5cb85c, 1);
        background.fillRoundedRect(0, 0, buttonWidth, buttonHeight, 20);

        let startText = this.add.text(startX + buttonWidth / 2, startY + buttonHeight / 2, 'START', {
            font: '20px Orbitron',
            fill: '#FFFFFF',
        }).setOrigin(0.5, 0.5);

        let buttonContainer = this.add.container(0, 0);
        buttonContainer.add([background, startText]);

        background.setInteractive(new Phaser.Geom.Rectangle(0, 0, buttonWidth, buttonHeight), Phaser.Geom.Rectangle.Contains)
            .on('pointerover', () => {
                background.clear().fillStyle(0x05e814, 1).fillRoundedRect(0, 0, buttonWidth, buttonHeight, 20);
            })
            .on('pointerout', () => {
                background.clear().fillStyle(0x5cb85c, 1).fillRoundedRect(0, 0, buttonWidth, buttonHeight, 20);
            })
            .on('pointerdown', () => {
                this.scene.start('GameScene', { characterInUse: characterInUse });
            });
    }

    loadAssets() {
        this.load.image('ocean', 'assets/images/ocean.png');
        this.load.image('land', 'assets/images/land2.png');

        this.load.image('mouse_cursor', 'assets/images/mouse_cursor.png');
        this.load.image('mouse_cursor_attack', 'assets/images/mouse_cursor_attack.png');
        this.load.image('enemy_camp', 'assets/images/enemy_camp1.png');
        this.load.image('enemy_base', 'assets/images/enemy_base1.png');
        this.load.image('storm_shelter', 'assets/images/storm_shelter.png');

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
        loadDynamicSpriteSheet.call(this, 'character11', 'assets/sprites/character_11.png', 4000, 4400);
        loadDynamicSpriteSheet.call(this, 'character12', 'assets/sprites/character_12.png', 4000, 4400);
        loadDynamicSpriteSheet.call(this, 'character13', 'assets/sprites/character_13.png', 4000, 4400);
        loadDynamicSpriteSheet.call(this, 'character14', 'assets/sprites/character_14.png', 4000, 4400);
        loadDynamicSpriteSheet.call(this, 'character15', 'assets/sprites/character_15.png', 4000, 4400);
        loadDynamicSpriteSheet.call(this, 'character16', 'assets/sprites/character_16.png', 4000, 4400);
        loadDynamicSpriteSheet.call(this, 'character17', 'assets/sprites/character_17.png', 4000, 4400);
        loadDynamicSpriteSheet.call(this, 'character18', 'assets/sprites/character_18.png', 4000, 4400);
        loadDynamicSpriteSheet.call(this, 'character19', 'assets/sprites/character_19.png', 4000, 4400);
        loadDynamicSpriteSheet.call(this, 'character20', 'assets/sprites/character_20.png', 4000, 4400);
        loadDynamicSpriteSheet.call(this, 'character21', 'assets/sprites/character_21.png', 4000, 4400);
        loadDynamicSpriteSheet.call(this, 'character22', 'assets/sprites/character_22.png', 4000, 4400);
        loadDynamicSpriteSheet.call(this, 'character23', 'assets/sprites/character_23.png', 4000, 4400);
        loadDynamicSpriteSheet.call(this, 'character24', 'assets/sprites/character_24.png', 4000, 4400);

        this.load.image('blueBullet', 'assets/projectiles/blue_bullet.png');
        this.load.image('fireball', 'assets/projectiles/fireball.png');
        this.load.image('flame', 'assets/projectiles/flame.png');
        this.load.image('bluePlasmaBall', 'assets/projectiles/blue_plasma_ball.png');
        this.load.image('redPlasmaBall', 'assets/projectiles/red_plasma_ball.png');

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
        this.load.image('thunderlordSeal', 'assets/images/thunderlordSeal.png');
        this.load.image('elixirOfLife', 'assets/images/elixirOfLife.png');
        this.load.image('winterFrost', 'assets/images/winterFrost.png');
        this.load.image('treasureFinder', 'assets/images/treasureFinder.png');

        this.load.image('darkEtherMessiah', 'assets/images/characterIcons/darkEtherMessiah.png');
        this.load.image('orc', 'assets/images/characterIcons/orc.png');
        this.load.image('dino', 'assets/images/characterIcons/dino.png');
        this.load.image('burningSlayer', 'assets/images/characterIcons/burningSlayer.png');
        this.load.image('spectreMech', 'assets/images/characterIcons/spectreMech.png');
        this.load.image('samuraiMech', 'assets/images/characterIcons/samuraiMech.png');
        this.load.image('bahamutDragon', 'assets/images/characterIcons/bahamutDragon.png');
        this.load.image('protowingedMech', 'assets/images/characterIcons/protowingedMech.png');
        this.load.image('brutusMech', 'assets/images/characterIcons/brutusMech.png');
        this.load.image('ravenMech', 'assets/images/characterIcons/ravenMech.png');
        this.load.image('thunderEpicDragon', 'assets/images/characterIcons/thunderEpicDragon.png');
        this.load.image('avengerMech', 'assets/images/characterIcons/avengerMech.png');
        this.load.image('ninja', 'assets/images/characterIcons/ninja.png');
        this.load.image('spartanWarriorMech', 'assets/images/characterIcons/spartanWarriorMech.png');
        this.load.image('executionerMech', 'assets/images/characterIcons/executionerMech.png');
        this.load.image('primeAutomech', 'assets/images/characterIcons/primeAutomech.png');
        this.load.image('ignition', 'assets/images/characterIcons/ignition.png');
        this.load.image('razorMech', 'assets/images/characterIcons/razorMech.png');
        this.load.image('harvester', 'assets/images/characterIcons/harvester.png');
        this.load.image('fireGodzillaMech', 'assets/images/characterIcons/fireGodzillaMech.png');
        this.load.image('steelGladiator', 'assets/images/characterIcons/steelGladiator.png');
        this.load.image('zProjectMech', 'assets/images/characterIcons/zProjectMech.png');
        this.load.image('glaivestormMech', 'assets/images/characterIcons/glaivestormMech.png');
    }
}

class Collections extends Phaser.Scene {
    constructor() {
        super({ key: 'Collections', active: false });
        this.selectedIcon = null;
        this.selectedCharacterKey = null;
        this.characterUIElements = {};
    }

    preload() {
        const { width, height } = this.sys.game.config;

        this.cameras.main.setBackgroundColor('#000');

        this.loadingText = this.add.text(
            width / 2,
            height / 2,
            'Loading...',
            { font: '36px Orbitron', fill: '#ffffff' }
        ).setOrigin(0.5, 0.5);
        this.load.audio('background_music', 'assets/audio/background_music.mp3');
        this.load.image('cash', 'assets/images/cash.png');
        this.load.image('darkEtherMessiah', 'assets/images/characterIcons/darkEtherMessiah.png');
        this.load.image('orc', 'assets/images/characterIcons/orc.png');
        this.load.image('dino', 'assets/images/characterIcons/dino.png');
        this.load.image('burningSlayer', 'assets/images/characterIcons/burningSlayer.png');
        this.load.image('spectreMech', 'assets/images/characterIcons/spectreMech.png');
        this.load.image('samuraiMech', 'assets/images/characterIcons/samuraiMech.png');
        this.load.image('bahamutDragon', 'assets/images/characterIcons/bahamutDragon.png');
        this.load.image('protowingedMech', 'assets/images/characterIcons/protowingedMech.png');
        this.load.image('brutusMech', 'assets/images/characterIcons/brutusMech.png');
        this.load.image('ravenMech', 'assets/images/characterIcons/ravenMech.png');
        this.load.image('thunderEpicDragon', 'assets/images/characterIcons/thunderEpicDragon.png');
        this.load.image('avengerMech', 'assets/images/characterIcons/avengerMech.png');
        this.load.image('ninja', 'assets/images/characterIcons/ninja.png');
        this.load.image('spartanWarriorMech', 'assets/images/characterIcons/spartanWarriorMech.png');
        this.load.image('executionerMech', 'assets/images/characterIcons/executionerMech.png');
        this.load.image('primeAutomech', 'assets/images/characterIcons/primeAutomech.png');
        this.load.image('ignition', 'assets/images/characterIcons/ignition.png');
        this.load.image('razorMech', 'assets/images/characterIcons/razorMech.png');
        this.load.image('harvester', 'assets/images/characterIcons/harvester.png');
        this.load.image('fireGodzillaMech', 'assets/images/characterIcons/fireGodzillaMech.png');
        this.load.image('steelGladiator', 'assets/images/characterIcons/steelGladiator.png');
        this.load.image('zProjectMech', 'assets/images/characterIcons/zProjectMech.png');
        this.load.image('glaivestormMech', 'assets/images/characterIcons/glaivestormMech.png');

        this.load.image('health_icon', 'assets/images/collections/statsIcons/health_icon.png');
        this.load.image('damage_icon', 'assets/images/collections/statsIcons/damage_icon.png');
        this.load.image('attack_speed_icon', 'assets/images/collections/statsIcons/attack_speed_icon.png');
        this.load.image('speed_icon', 'assets/images/collections/statsIcons/speed_icon.png');
        this.load.image('range_icon', 'assets/images/collections/statsIcons/range_icon.png');

        loadDynamicSpriteSheet.call(this, 'character1Idle', 'assets/images/idleDisplays/character1_idle.png', 2250, 900, 5, 2);
        loadDynamicSpriteSheet.call(this, 'character2Idle', 'assets/images/idleDisplays/character2_idle.png', 2250, 900, 5, 2);
        loadDynamicSpriteSheet.call(this, 'character3Idle', 'assets/images/idleDisplays/character3_idle.png', 2250, 900, 5, 2);
        loadDynamicSpriteSheet.call(this, 'character4Idle', 'assets/images/idleDisplays/character4_idle.png', 2250, 900, 5, 2);
        loadDynamicSpriteSheet.call(this, 'character5Idle', 'assets/images/idleDisplays/character5_idle.png', 2250, 900, 5, 2);
        loadDynamicSpriteSheet.call(this, 'character6Idle', 'assets/images/idleDisplays/character6_idle.png', 2250, 900, 5, 2);
        loadDynamicSpriteSheet.call(this, 'character7Idle', 'assets/images/idleDisplays/character7_idle.png', 2250, 900, 5, 2);
        loadDynamicSpriteSheet.call(this, 'character8Idle', 'assets/images/idleDisplays/character8_idle.png', 2250, 900, 5, 2);
        loadDynamicSpriteSheet.call(this, 'character9Idle', 'assets/images/idleDisplays/character9_idle.png', 2250, 900, 5, 2);
        loadDynamicSpriteSheet.call(this, 'character10Idle', 'assets/images/idleDisplays/character10_idle.png', 2250, 900, 5, 2);
        loadDynamicSpriteSheet.call(this, 'character11Idle', 'assets/images/idleDisplays/character11_idle.png', 2250, 900, 5, 2);
        loadDynamicSpriteSheet.call(this, 'character13Idle', 'assets/images/idleDisplays/character13_idle.png', 2250, 900, 5, 2);
        loadDynamicSpriteSheet.call(this, 'character14Idle', 'assets/images/idleDisplays/character14_idle.png', 2250, 900, 5, 2);
        loadDynamicSpriteSheet.call(this, 'character15Idle', 'assets/images/idleDisplays/character15_idle.png', 2250, 900, 5, 2);
        loadDynamicSpriteSheet.call(this, 'character16Idle', 'assets/images/idleDisplays/character16_idle.png', 2250, 900, 5, 2);
        loadDynamicSpriteSheet.call(this, 'character17Idle', 'assets/images/idleDisplays/character17_idle.png', 2250, 900, 5, 2);
        loadDynamicSpriteSheet.call(this, 'character18Idle', 'assets/images/idleDisplays/character18_idle.png', 2250, 900, 5, 2);
        loadDynamicSpriteSheet.call(this, 'character19Idle', 'assets/images/idleDisplays/character19_idle.png', 2250, 900, 5, 2);
        loadDynamicSpriteSheet.call(this, 'character20Idle', 'assets/images/idleDisplays/character20_idle.png', 2250, 900, 5, 2);
        loadDynamicSpriteSheet.call(this, 'character21Idle', 'assets/images/idleDisplays/character21_idle.png', 2250, 900, 5, 2);
        loadDynamicSpriteSheet.call(this, 'character22Idle', 'assets/images/idleDisplays/character22_idle.png', 2250, 900, 5, 2);
        loadDynamicSpriteSheet.call(this, 'character23Idle', 'assets/images/idleDisplays/character23_idle.png', 2250, 900, 5, 2);
        loadDynamicSpriteSheet.call(this, 'character24Idle', 'assets/images/idleDisplays/character24_idle.png', 2250, 900, 5, 2);
    }

    init(data) {
        this.totalCash = data.totalCash;
        this.charactersOwned = data.charactersOwned;
        this.characterInUse = data.characterInUse;
    }

    create() {
        if (this.loadingText) {
            this.loadingText.destroy();
        }

        this.attributeTexts = [];
        const { width, height } = this.sys.game.config;
        // vertical line to visually split the screen in half
        const verticalLine = this.add.graphics();
        verticalLine.lineStyle(2, 0xffffff, 1);
        verticalLine.beginPath();
        verticalLine.moveTo(width / 2, 0);
        verticalLine.lineTo(width / 2, height);
        verticalLine.closePath();
        verticalLine.strokePath();

        // used to split the other half on the right
        const verticalLine2 = this.add.graphics();
        verticalLine2.lineStyle(2, 0xffffff, 1);
        verticalLine2.beginPath();
        verticalLine2.moveTo(width / 2 + 600, 0);
        verticalLine2.lineTo(width / 2 + 600, height);
        verticalLine2.closePath();
        verticalLine2.strokePath();

        // Character list
        const sortedCharacters = Object.entries(characterMap).sort((a, b) => a[1].cost - b[1].cost);

        const squareSize = 100;
        const startX = 50;
        let x = startX;
        let y = 230;
        const padding = 20;
        const perRow = 7;

        sortedCharacters.forEach(([key, character], index) => {
            if (index % perRow === 0 && index !== 0) {
                x = startX;
                y += squareSize + padding + 20;
            }

            let container = this.add.container(x, y);

            const square = this.add.graphics({ fillStyle: { color: 0xffffff } });
            square.fillRect(0, 0, squareSize, squareSize);
            container.add(square);

            const icon = this.add.image(squareSize / 2, squareSize / 2, character.icon).setDisplaySize(squareSize - 20, squareSize - 20);
            container.add(icon);

            icon.setInteractive();
            icon.on('pointerdown', () => {
                this.handleCharacterSelection(key, character, square);
            });
            const isCharacterInUse = parseInt(key) === this.characterInUse;
            const isOwned = this.charactersOwned.includes(parseInt(key));
            const buttonText = isCharacterInUse ? "IN USE" : isOwned ? "USE" : character.cost;
            const costColor = isCharacterInUse ? '#ffff00' : isOwned ? '#00ff00' : character.cost > this.totalCash ? '#ff0000' : '#00ff00';
            const textElement = this.add.text(x + squareSize / 2, y + squareSize, buttonText, { font: '18px Orbitron', fill: costColor }).setOrigin(0.5, 0);
            if (!isCharacterInUse && !isOwned) {
                const costLogo = this.add.image(textElement.x + textElement.width / 2 + 15, y + squareSize + 15, 'cash').setDisplaySize(25, 25);
                this.characterUIElements[key] = {
                    costText: textElement,
                    costLogo: costLogo,
                };
            } else {
                this.characterUIElements[key] = {
                    costText: textElement,
                };
            }

            x += squareSize + padding;
        });

        this.totalCashText = this.add.text(350, 120, this.totalCash, { font: '48px Orbitron', fill: '#00ff00' });
        this.add.image(this.totalCashText.x + this.totalCashText.width + 60, 150, 'cash');

        // left arrow as back button
        const backButton = this.add.graphics({ fillStyle: { color: 0xffffff } });
        backButton.beginPath();
        backButton.moveTo(50, 150);
        backButton.lineTo(70, 130);
        backButton.lineTo(70, 140);
        backButton.lineTo(90, 140);
        backButton.lineTo(90, 160);
        backButton.lineTo(70, 160);
        backButton.lineTo(70, 170);
        backButton.lineTo(50, 150);
        backButton.closePath();
        backButton.fillPath();
        backButton.setInteractive(new Phaser.Geom.Polygon([
            50, 150, 70, 130, 70, 140, 90, 140, 90, 160, 70, 160, 70, 170, 50, 150
        ]), Phaser.Geom.Polygon.Contains).on('pointerdown', () => {
            document.getElementById('collections-scene').style.display = 'none';
            document.getElementById('main-menu').style.display = 'flex';
        });

        // Horizontal line below the total cash and back button
        const horizontalLine = this.add.graphics();
        horizontalLine.lineStyle(2, 0xffffff, 1);
        horizontalLine.beginPath();
        horizontalLine.moveTo(0, 200);
        horizontalLine.lineTo(width / 2, 200);
        horizontalLine.closePath();
        horizontalLine.strokePath();
    }

    handleCharacterSelection(key, character, square) {
        const squareSize = 100;
        if (this.selectedCharacterKey === key) {
            return;
        }
        if (this.selectedIcon) {
            // Reset previous selection
            this.selectedIcon.fillStyle(0xffffff, 1);
            this.selectedIcon.fillRect(0, 0, squareSize, squareSize);
        }

        // Update current selection
        this.selectedIcon = square;
        this.selectedCharacterKey = key;
        square.fillStyle(0xffff00, 1);
        square.fillRect(0, 0, squareSize, squareSize);

        this.showIdleAnimation(character.idle, character);
    }

    showIdleAnimation(idleKey, character) {
        const { width, height } = this.sys.game.config;

        // Clean up previous animations and panels
        if (this.idleAnimationSprite) {
            this.idleAnimationSprite.destroy();
        }
        if (this.panelContainer) {
            this.panelContainer.destroy();
        }

        this.clearAttributesDisplay();

        const animationX = width / 2 + ((width / 2 + 600) - (width / 2)) / 2;
        const animationY = height / 2;

        // Create and play idle animation sprite
        this.idleAnimationSprite = this.add.sprite(animationX, animationY, idleKey).setScale(1.2);
        if (!this.anims.get(`${idleKey}Anim`)) {
            this.anims.create({
                key: `${idleKey}Anim`,
                frames: this.anims.generateFrameNumbers(idleKey, { start: 0, end: 9 }),
                frameRate: 5,
                repeat: -1
            });
        }
        this.idleAnimationSprite.play(`${idleKey}Anim`);

        const textColor = this.characterInUse === parseInt(this.selectedCharacterKey) ? '#ffff00' : this.charactersOwned.includes(parseInt(this.selectedCharacterKey)) ? '#00ff00' : character.cost > this.totalCash ? '#ff0000' : '#00ff00';
        let buttonText = this.characterInUse === parseInt(this.selectedCharacterKey) ? "IN USE" : this.charactersOwned.includes(parseInt(this.selectedCharacterKey)) ? "USE" : `BUY FOR ${character.cost} CASH`;

        // Instead of using Phaser graphics, use a sprite for the panel for better control and visibility
        const panelSprite = this.add.rectangle(0, 0, 500, 40, 0xffffff);
        panelSprite.setFillStyle(0x0000ff, 0.5);
        this.actionText = this.add.text(0, -15, buttonText, { font: '24px Orbitron', fill: textColor }).setStroke('#000', 3);
        this.actionText.setOrigin(0.5, 0);

        // Create container and add both panel and text
        this.panelContainer = this.add.container(animationX, animationY + 300, [panelSprite, this.actionText]);
        this.panelContainer.setSize(500, 40);
        this.panelContainer.setInteractive(new Phaser.Geom.Rectangle(0, 0, 500, 40), Phaser.Geom.Rectangle.Contains);
        this.panelContainer.on('pointerdown', () => {
            this.handleActionButton(character);
        });

        this.displayCharacterAttributes(character, animationX + 300, animationY - 300);
    }

    displayCharacterAttributes(character, startX, startY) {
        this.clearAttributesDisplay();

        const nameText = this.add.text(startX + 25, startY, character.name, {
            font: '26px Orbitron',
            fill: '#FFCC00'
        });
        nameText.setStroke('#ffffff', 1);
        this.attributeTexts.push(nameText);

        startY += nameText.height + 10;

        const descriptionText = this.add.text(startX + 25, startY, character.description, {
            font: '20px Orbitron',
            fill: '#FFFFFF',
            wordWrap: { width: 280 }
        });
        this.attributeTexts.push(descriptionText);

        startY = 500;

        const statsText = this.add.text(startX + 50, startY, 'Stats:', {
            font: '24px Orbitron',
            fill: '#FFCC00'
        });
        this.attributeTexts.push(statsText);

        startY += statsText.height + 20;

        const attributeIcons = {
            health: 'health_icon',
            damage: 'damage_icon',
            range: 'range_icon',
            speed: 'speed_icon',
            attackSpeed: 'attack_speed_icon'
        };

        const attributes = [
            { key: 'health', value: `Health: ${character.health}` },
            { key: 'damage', value: `Damage: ${character.damage}` },
            { key: 'range', value: `Range: ${character.range}` },
            { key: 'speed', value: `Speed: ${character.speed}` },
            { key: 'attackSpeed', value: `Attack Speed: ${character.attackSpeed}` }
        ];

        attributes.forEach((attribute, index) => {
            const panel = this.add.graphics({ x: startX + 30, y: startY + index * 70 });
            panel.fillStyle(0xfff4a1, 0.5);
            panel.fillRect(0, 0, 300, 40);
            this.attributeTexts.push(panel);

            if (attributeIcons[attribute.key]) {
                const icon = this.add.image(startX + 40, startY + index * 70 + 20, attributeIcons[attribute.key]);
                icon.setScale(0.5);
                this.attributeTexts.push(icon);
            }

            const text = this.add.text(startX + 80, startY + index * 70 + 5, attribute.value, {
                font: '18px Orbitron',
                fill: '#FFFFFF'
            });
            this.attributeTexts.push(text);
        });
    }


    clearAttributesDisplay() {
        if (this.attributeTexts && this.attributeTexts.length > 0) {
            this.attributeTexts.forEach(text => text.destroy());
            this.attributeTexts = [];
        }
    }

    handleActionButton(character) {
        if (this.charactersOwned.includes(parseInt(this.selectedCharacterKey))) {
            // Check if the character is already in use
            if (this.characterInUse !== parseInt(this.selectedCharacterKey)) {
                fetch('/use-character', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        characterId: parseInt(this.selectedCharacterKey)
                    }),
                })
                    .then(response => response.json())
                    .then(data => {
                        console.log(`${character.name} is now in use.`);
                        this.actionText.setText("IN USE");
                        this.actionText.setFill('#ffff00');
                        this.characterInUse = parseInt(this.selectedCharacterKey);
                        updateCharacterDisplay(this.characterInUse);

                        this.refreshCharacterList();
                    })
                    .catch(error => {
                        console.error('Error using character:', error.message);
                    });
            }
        } else {
            if (this.totalCash >= character.cost) {
                fetch('/purchase-character', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        characterId: parseInt(this.selectedCharacterKey),
                        cost: character.cost,
                    }),
                })
                    .then(response => {
                        if (response.ok) {
                            return response.json();
                        }
                        throw new Error('Failed to purchase character');
                    })
                    .then(data => {
                        this.totalCash = data.gameData.initialCash + data.gameData.incomingCash;
                        this.charactersOwned = data.gameData.charactersOwned;
                        this.updateTotalCashText();
                        this.updateActionButtonState(character);
                        this.refreshCharacterList();
                        this.createPurchaseReceipt('success', character, character.cost);
                        window.fetchHighestScore();
                    })
                    .catch(error => {
                        console.error('Error purchasing character:', error.message);
                    });
            } else {
                this.createPurchaseReceipt('failed', character, character.cost);
            }
        }
    }

    updateTotalCashText() {
        this.totalCashText.setText(`${this.totalCash}`);
    }

    refreshCharacterList() {
        Object.values(this.characterUIElements).forEach(element => {
            element.costText.destroy();
            if (element.costLogo) {
                element.costLogo.destroy();
            }
        });

        const squareSize = 100;
        const startX = 50;
        let x = startX;
        let y = 230;
        const padding = 20;
        const perRow = 7;

        const sortedCharacters = Object.entries(characterMap).sort((a, b) => a[1].cost - b[1].cost);

        sortedCharacters.forEach(([key, character], index) => {
            if (index % perRow === 0 && index !== 0) {
                x = startX;
                y += squareSize + padding + 20;
            }

            const isCharacterInUse = parseInt(key) === this.characterInUse;
            const isOwned = this.charactersOwned.includes(parseInt(key));
            const costColor = isCharacterInUse ? '#ffff00' : isOwned ? '#00ff00' : character.cost > this.totalCash ? '#ff0000' : '#00ff00';
            const buttonText = isCharacterInUse ? "IN USE" : isOwned ? "USE" : character.cost;
            const textElement = this.add.text(x + squareSize / 2, y + squareSize, buttonText, { font: '18px Orbitron', fill: costColor }).setOrigin(0.5, 0);
            if (!isCharacterInUse && !isOwned) {
                const costLogo = this.add.image(textElement.x + textElement.width / 2 + 15, y + squareSize + 15, 'cash').setDisplaySize(25, 25);
                this.characterUIElements[key] = {
                    costText: textElement,
                    costLogo: costLogo,
                };
            } else {
                this.characterUIElements[key] = {
                    costText: textElement,
                };
            }

            x += squareSize + padding;
        });
    }

    updateActionButtonState(character) {
        if (this.actionText && this.charactersOwned.includes(parseInt(this.selectedCharacterKey))) {
            this.actionText.setText("USE");
        }
    }

    createPurchaseReceipt(purchaseStatus, character, cash) {
        let purchaseReceipt;
        if (purchaseStatus === 'success') {
            purchaseReceipt = this.add.text(600, 130, `Purchased ${character.name} for ${cash} cash!`, { font: '20px Orbitron', fill: '#ffff00', wordWrap: { width: 300 } });
        } else {
            purchaseReceipt = this.add.text(600, 130, `Not enough cash to buy!`, { font: '20px Orbitron', fill: '#ff0000', wordWrap: { width: 300 } });
        }
        purchaseReceipt.setDepth(1);
        this.tweens.add({
            targets: purchaseReceipt,
            alpha: { from: 1, to: 0 },
            ease: 'Linear',
            duration: 2000,
            repeat: 0,
            onComplete: () => {
                purchaseReceipt.destroy();
            }
        });
    }

}

document.addEventListener('DOMContentLoaded', (event) => {
    const gameScreen = document.getElementById('main-menu');
    const battleScene = document.getElementById('battle-scene');
    const collectionsScene = document.getElementById('collections-scene');
    const playButton = document.querySelector('.play-button');
    const collectionsButton = document.querySelector('.collections-button');
    const promoCodeInput = document.getElementById('promo-code-input');
    const promoCodeSubmitButton = document.getElementById('promo-code-submit');

    const audioToggleButton = document.querySelector('.audio-toggle-button');
    const audioIcon = audioToggleButton.querySelector('i');

    localStorage.setItem('isMuted', true);
    let isMuted = true;

    function updateAudioButtonIcon() {
        isMuted = localStorage.getItem('isMuted') === 'true';
        if (isMuted) {
            audioIcon.classList.remove('fa-volume-up');
            audioIcon.classList.add('fa-volume-mute');
            musicManager.stop();
        } else {
            audioIcon.classList.remove('fa-volume-mute');
            audioIcon.classList.add('fa-volume-up');
            musicManager.play('assets/audio/background_music.mp3');
        }
    }

    function toggleAudio() {
        isMuted = !isMuted;
        localStorage.setItem('isMuted', isMuted);
        updateAudioButtonIcon();
    }

    audioToggleButton.addEventListener('click', toggleAudio);

    if (!isMuted) {
        musicManager.play('assets/audio/background_music.mp3');
    }
    updateAudioButtonIcon();


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
        resize(game, 'battle-scene');

        window.addEventListener('resize', () => {
            resize(game, 'battle-scene');
        });
    }

    playButton.addEventListener('click', () => {
        gameScreen.style.display = 'none';
        battleScene.style.display = 'flex';
        startGame();
    });

    const observer = new MutationObserver(() => {
        if (gameScreen.style.display === 'flex') {
            updateAudioButtonIcon();
        }
    });

    observer.observe(gameScreen, { attributes: true, attributeFilter: ['style'] });

    function displayHighestScore(score, incomingCash, initialCash, highestBaseLevel, newHighestScore) {
        const highestScoreElement = document.querySelector('.highest-score');
        const cashElement = document.querySelector('.cash-text');
        const baseLevelElement = document.querySelector('.base-level');
        const rankTextElement = document.querySelector('.rank-text');
        const rankImageElement = document.querySelector('.rank-image');
        const newHighScoreIconElement = document.querySelector('.new-highscore-icon');

        const totalCash = incomingCash + initialCash;

        // Updated rank definitions with divisions
        const ranks = [
            { threshold: 0, name: 'UNRANKED', image: '/assets/images/ranks/rank_unranked.png' },
            { threshold: 1, divisions: 10000, name: 'IRON', image: '/assets/images/ranks/rank_iron.png' },
            { threshold: 10000, divisions: 10000, name: 'BRONZE', image: '/assets/images/ranks/rank_bronze.png' },
            { threshold: 20000, divisions: 10000, name: 'SILVER', image: '/assets/images/ranks/rank_silver.png' },
            { threshold: 30000, divisions: 10000, name: 'GOLD', image: '/assets/images/ranks/rank_gold.png' },
            { threshold: 40000, divisions: 10000, name: 'PLATINUM', image: '/assets/images/ranks/rank_platinum.png' },
            { threshold: 50000, divisions: 10000, name: 'EMERALD', image: '/assets/images/ranks/rank_emerald.png' },
            { threshold: 60000, divisions: 10000, name: 'DIAMOND', image: '/assets/images/ranks/rank_diamond.png' },
            { threshold: 70000, name: 'MASTER', image: '/assets/images/ranks/rank_master.png' },
            { threshold: 80000, name: 'GRANDMASTER', image: '/assets/images/ranks/rank_grandmaster.png' },
            { threshold: 90000, name: 'CHALLENGER', image: '/assets/images/ranks/rank_challenger.png' },
        ];

        let rank = ranks[0]; // Default to Unranked
        let division = '';
        for (let i = ranks.length - 1; i >= 0; i--) {
            if (score >= ranks[i].threshold) {
                rank = ranks[i];
                // Calculate division for ranks with divisions
                if (rank.divisions) {
                    const divisionIndex = Math.floor((score - rank.threshold) / (rank.divisions / 4));
                    const romanNumerals = ['IV', 'III', 'II', 'I'];
                    division = ` ${romanNumerals[divisionIndex] || ''}`;
                }
                break;
            }
        }

        if (highestScoreElement && cashElement && baseLevelElement && rankTextElement && rankImageElement && newHighScoreIconElement) {
            highestScoreElement.textContent = score;
            cashElement.textContent = totalCash;
            baseLevelElement.textContent = highestBaseLevel;
            rankTextElement.textContent = rank.name + division; // Include division in rank name if applicable
            rankImageElement.src = rank.image;
            newHighScoreIconElement.style.display = newHighestScore ? 'block' : 'none';
        }
    }


    window.fetchHighestScore = function () {
        fetch('/get-game-data')
            .then(response => response.json())
            .then(data => {
                const { highestScore, incomingCash, initialCash, highestBaseLevel, characterInUse, newHighest, bonusClaimed } = data;
                updateCharacterDisplay(characterInUse);
                displayHighestScore(highestScore, incomingCash, initialCash, highestBaseLevel, newHighest);
                if (bonusClaimed) {
                    disablePromoCodeSubmission();
                }
            })
            .catch(error => console.error('Error fetching saves:', error));
    };

    window.fetchHighestScore();

    function viewCollections() {
        fetch('/get-game-data')
            .then(response => response.json())
            .then(data => {
                const { initialCash, incomingCash, charactersOwned, characterInUse } = data;
                const totalCash = initialCash + incomingCash;

                if (game) {
                    game.destroy(true);
                }

                const config = {
                    type: Phaser.AUTO,
                    width: 1920,
                    height: 1080,
                    parent: 'collections-scene',
                    scene: [Collections],
                    render: {
                        pixelArt: true,
                    },
                };

                game = new Phaser.Game(config);
                game.canvas.id = 'collections-canvas';

                game.scene.start('Collections', { totalCash: totalCash, charactersOwned: charactersOwned, characterInUse: characterInUse });

                resize(game, 'collections-scene');
                window.addEventListener('resize', () => {
                    resize(game, 'collections-scene');
                });
            })
            .catch(error => console.error('Error fetching saves:', error));
    }

    collectionsButton.addEventListener('click', () => {
        gameScreen.style.display = 'none';
        collectionsScene.style.display = 'flex';
        viewCollections();
    });

    const settingsButton = document.querySelector('.settings-button');
    const modal = document.getElementById('settings-modal');
    const closeButton = document.querySelector('.close-button');
    const resetButton = document.getElementById('reset-game-button');

    settingsButton.addEventListener('click', () => {
        modal.style.display = 'block';
    });

    closeButton.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    window.onclick = function (event) {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    };

    resetButton.addEventListener('click', () => {
        if (confirm('Are you sure you want to reset your game progress?')) {
            fetch('/reset-game', {
                method: 'DELETE',
            })
                .then(response => {
                    if (response.ok) {
                        console.log('Game progress reset successfully');
                        modal.style.display = 'none';
                        window.fetchHighestScore();
                        enablePromoCodeSubmission();
                    } else {
                        console.error('Failed to reset game progress');
                    }
                })
                .catch(error => console.error('Error:', error));
        }
    });

    function disablePromoCodeSubmission() {
        promoCodeInput.disabled = true;
        promoCodeSubmitButton.disabled = true;
        promoCodeSubmitButton.textContent = 'Bonus already claimed!';
    }

    function enablePromoCodeSubmission() {
        promoCodeInput.disabled = false;
        promoCodeSubmitButton.disabled = false;
        promoCodeSubmitButton.textContent = 'Claim Bonus Cash!';
        promoCodeInput.value = '';
    }

    promoCodeSubmitButton.addEventListener('click', () => {
        const promoCode = promoCodeInput.value;
        fetch('/claim-promo-code', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ promoCode: promoCode }),
        })
            .then(response => response.json())
            .then(data => {
                alert(data.message);
                if (data.message.includes('successfully')) {
                    disablePromoCodeSubmission();
                    window.fetchHighestScore();
                }
            })
            .catch(error => console.error('Error:', error));
    });

});

// set animation interval at a higher scope. then, ensure only 1 interval is running at a time. if the interval is already running, clear it and set it to null. if it's null, set it to a new interval.
let animationInterval = null;
function updateCharacterDisplay(characterInUse) {
    const characterDisplay = document.querySelector('.character-display');
    if (!characterDisplay) return;

    const imageUrl = `assets/images/idleDisplays/character${characterInUse}_idle.png`;
    characterDisplay.style.width = '450px';
    characterDisplay.style.height = '450px';
    characterDisplay.style.backgroundImage = `url(${imageUrl})`;
    characterDisplay.style.backgroundRepeat = 'no-repeat';

    let currentFrame = 0;
    const framesPerRow = 5;
    const frameWidth = 2250 / framesPerRow;
    const frameHeight = 900 / 2;

    function animate() {
        const row = Math.floor(currentFrame / framesPerRow);
        const col = currentFrame % framesPerRow;

        characterDisplay.style.backgroundPosition = `-${col * frameWidth}px -${row * frameHeight}px`; // for horizontal and vertical position

        currentFrame = (currentFrame + 1) % 10;
    }

    if (animationInterval) {
        clearInterval(animationInterval);
        animationInterval = null;
    }

    animationInterval = setInterval(animate, 250);

    const guideButton = document.querySelector('.tutorial-button');
    const guideModal = document.getElementById('guide-modal');
    const closeButton = guideModal.querySelector('.close-button');
    const leftButton = guideModal.querySelector('.left-button');
    const rightButton = guideModal.querySelector('.right-button');
    const guideImage = document.getElementById('guide-image');
    const dotsContainer = guideModal.querySelector('.dots-container');

    const guideImages = [
        '/assets/images/guide/1.png',
        '/assets/images/guide/2.png',
        '/assets/images/guide/3.png',
        '/assets/images/guide/4.png',
        '/assets/images/guide/5.png',
        '/assets/images/guide/6.png',
        '/assets/images/guide/7.png',
        '/assets/images/guide/8.png',
        '/assets/images/guide/9.png',
        '/assets/images/guide/10.png',
        '/assets/images/guide/11.png',
    ];
    let currentImageIndex = 0;

    function createDots() {
        dotsContainer.innerHTML = '';
        guideImages.forEach((_, idx) => {
            const dot = document.createElement('span');
            dot.classList.add('dot');
            if (idx === currentImageIndex) dot.classList.add('active');
            dotsContainer.appendChild(dot);
            dot.addEventListener('click', () => {
                currentImageIndex = idx;
                displayCurrentImage();
            });
        });
    }

    function updateActiveDot() {
        const dots = dotsContainer.querySelectorAll('.dot');
        dots.forEach((dot, idx) => {
            if (idx === currentImageIndex) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
    }

    function displayCurrentImage() {
        guideImage.src = guideImages[currentImageIndex];
        updateActiveDot();
    }

    guideButton.addEventListener('click', () => {
        guideModal.style.display = 'block';
        if (!dotsContainer.hasChildNodes()) {
            createDots();
        }
        displayCurrentImage();
    });

    closeButton.addEventListener('click', () => {
        guideModal.style.display = 'none';
    });

    leftButton.addEventListener('click', () => {
        currentImageIndex = (currentImageIndex + guideImages.length - 1) % guideImages.length;
        displayCurrentImage();
    });

    rightButton.addEventListener('click', () => {
        currentImageIndex = (currentImageIndex + 1) % guideImages.length;
        displayCurrentImage();
    });

    window.onclick = function (event) {
        if (event.target === guideModal) {
            guideModal.style.display = 'none';
        }
    };

}
