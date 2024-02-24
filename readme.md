# Mecha V1 Game Overview

A highscore-based game played on the web made by Javascript. Defeat as many enemies as you can, destroy their base, watch out for catastrophe storms, spend your gold in the shop. Strategy is key! The most challenging and fun project I've ever done!

**Game accessible on:** [https://mecha-v1.onrender.com/](https://mecha-v1.onrender.com/)

### Demo
A demo of the application is available on YouTube <a href="https://youtu.be/JSREUl9q_6A" target="_blank">here</a>.

## Main Menu
- Displays the character you will be using, with animation.
- Consist of the Play button which starts the game, the Collections button which starts the Collections scene to display characters.
- Settings button which allows you to reset the game state.
- Has a scoreboard that displays the highest score you have and the amount of Cash you have.

## Collections Scene
- Displays all the characters icons neatly. Click on a character to view more information, such as the damage, health, attack speed, attack range, movement speed.
- You can Buy the character if you have enough Cash, or click Use if you already own the character. Clicking Use will change the character that displays on the Main Menu.

## Game Scene
- When Play button is clicked from the Main Menu, you will see the Loading screen. The Loading screen includes Tooltips/Instructions and is randomly chosen. You can click on the screen to view the next random tooltip.
- After Loading is complete, there will be a Start button for you to click to ensure your reading isn’t interrupted.
- When Start button is clicked, you will see 3 camps, each with 1 enemy each. You will also spawn on a fixed location and be using the character you selected. Every camps consist of 1 enemy for the first round. There will also be an enemy Base that spawns at a random location but never near the player, and a Patrolling enemy will be moving randomly around the island.
- There will also be the Battle Panel which lets you know when the next Catastrophe, Enemy Strengthening will arrive in the form of a countdown bar. The Battle Panel also displays the Score Multiplier, Player Stats, Score, Cash obtained as well as a Shop button which opens up the Shop modal.
- Catastrophe: Every intervals, a Catastrophe will happen. A Catastrophe will shoot multiple fireballs from the sky down to the island. Fireballs target area is random, but it will be marked in a circle to give you time to react and dodge this. Catastrophe does massive damage to both the player and the enemies. However, if an enemy is in camps, or returning to camps, or patrolling, there will be a thick white outer lining on their hexagon beside their healthbars. This means they are immune to Catastrophe. They will lose this state only if they detect the player, which means they can be chasing/attacking the player. Bases are also immune to Catastrophe. You can enter the Storm Shelter which is marked with a blue circle. It is recommended to stand in this area while shopping so as to prevent getting hit by a Catastrophe. Enemies do not benefit from this Storm Shelter.
- Enemy Strengthening: Every intervals, enemies strengthen and gain additional percentage of their current damage and max health by compounding 27%. This will be shown on the hexagon beside their healthbars. Note that this buff is compounding, hence, don’t take too long to kill them else they will become too strong.
- Score Multiplier: Want to achieve the highest score in the current round? Win the round as soon as you can with a high score multiplier! Every intervals will cause the multiplier to drop by 0.5x.
- Enemy Base: This building is like their headquarter. Destroying it is the only way you can progress. However, if you attack the Base while there are still enemies alive, all of them will be Enraged, meaning they will move twice as fast, and deal twice as much damage. When this happens, you can see the square beside their healthbar turn from blue into a fire effect animation. When the current Base is destroyed, every enemies alive will immediately die. The Base will drop a bunch of Gold. During this time, the next Base will be built with more health, and new enemies will be created with their damage and max health attributed to the new Base level. Note that this is compounding 30%. For example, an enemy that came from Base level 1 has 10 damage. On Base level 2, the newly spawned enemy will have 13 damage. On Base level 2, the newly spawned enemy will have 17 damage. Catastrophe damage is also dependent on the current Base level.
- Enraged Enemies: As mentioned, enemies can become Enraged if you attack their Base. Enraged enemies lose this state after a few seconds. If you attack their Base again, they will not cool down and the Enraged timer will be back to maximum.
- Player: You control the player, you can use the left mouse to move around the island. Clicking on an enemy or a Base will enable the player to attack once he is in range. When you attack an enemy or if you enter the detection range of the enemy, this enemy’s detection bar will appear. They will begin chasing you and attacking you if they are in range. If you can stay out of their detection long enough (5 seconds), they will lose interest and return back to their respective camps. When an enemy is returning to camp, they are immune to Catastrophe.
- Enemy: When an enemy dies, they drop Gold and some chances to drop Cash. Cash is used to purchase new characters in the Collections scene, while Gold is used to purchase upgrades in the battle Shop. Both will be automatically collected when dropped. When an enemy attacks, you can see their attack range indicator. Before they swing their weapon down, you can actually dodge this attack if you move out of the range in time. No damage will be taken. If enemies died due to the destruction of Base, their gold drops are halved.
- Camera: You can zoom in/out, or press L to lock the camera, or press Space to enable camera following the player.
- Pause: Need a break? Click this button to pause the game, or leave the match!
- Shop: Here, you can spend the Gold you have acquired on upgrades such as more damage, health, attack speed, movement speed. You can also purchase legendary upgrades such as the Treasure Hunter, which can only be purchased once, and purchasing this item will cause every Gold drops to be doubled in value.
- Saves: Each time you get Gameover or clicked return to Main Menu from the pause menu, the game will save your progress, such as your score, whether you beat your highest score, cash earned from this game, and the highest Base level you have reached. Additionally, when you purchase new characters, the ownership of the newly purchased characters will also be saved.
