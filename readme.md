<p align="center">
  <img src="https://quek-wei-lin-website.in/wp-content/uploads/2024/02/mecha-v1-2.png" alt="logo" width="400"/>
</p>

## Overview

Mecha V1 is a **highscore-based action-strategy game** made for the web using JavaScript, HTML, CSS and PhaserJS.  
The goal of the game is to defeat as many enemies as possible, destroy their base, survive catastrophe storms, and spend your gold wisely in the shop to grow stronger. Strategy and quick reactions are key!  

It is one of the most challenging and fun projects I’ve ever done.  

---

### Main Menu
- Displays the character you will be using, with animation.  
- Contains the Play button to start the game, Collections button to view characters, and Settings button to reset the game state.  
- Includes a scoreboard that displays the highest score achieved and current Cash owned.  

### Collections Scene
- Displays all character icons neatly.  
- Clicking a character shows details (damage, health, attack speed, range, movement speed).  
- If you have enough Cash, you can **Buy** the character.  
- If you already own it, click **Use** to set it as your playable character in the Main Menu.  

### Game Scene
- Begins with a Loading screen that displays random tooltips/instructions.  
- A Start button ensures you are ready before gameplay begins.  
- The island contains **3 enemy camps**, each with 1 enemy, a patrolling enemy, and a randomly placed enemy Base (never near the player).  
- Includes a **Battle Panel** showing countdowns for Catastrophes, Enemy Strengthening, Score Multiplier, Player Stats, Score, Cash, and a **Shop button**.  

#### Catastrophes
- Periodic storms where fireballs fall randomly from the sky, dealing massive damage.  
- Warning circles appear before impact to allow dodging.  
- Enemies in camps or returning to camps are immune (indicated by white hex borders).  
- A **Storm Shelter** (blue circle) protects players and is a safe place for shopping.  

#### Enemy Strengthening
- At intervals, enemies gain +27% damage and max health (compounding).  
- If battles drag too long, they become extremely strong.  

#### Score Multiplier
- The faster you win, the higher your score multiplier.  
- Multiplier decreases by 0.5x at each interval.  

#### Enemy Base
- Destroying the base is the only way to progress.  
- Attacking it while enemies are alive enrages them (double speed, double damage).  
- Destroying a Base kills all enemies instantly and drops gold.  
- New bases and enemies scale health and stats by +30% each level.  

#### Enraged Enemies
- Triggered when you damage a Base.  
- Enraged state doubles speed and attack damage.  
- Cooldown timer resets if Base is attacked again.  

#### Player
- Controlled with left mouse click to move.  
- Click enemies or Bases to attack when in range.  
- Enemy detection bar appears when you’re spotted; escape for 5s to reset them.  
- Returning enemies heal at their camp and are immune to Catastrophes.  

#### Enemy
- Drop Gold (for upgrades) and sometimes Cash (for character purchases).  
- Attacks can be dodged if you move before the weapon lands.  
- If killed by Base destruction, their gold drops are halved.  

#### Shop
- Spend Gold on upgrades: damage, health, attack speed, movement speed.  
- Legendary upgrades exist (e.g., **Treasure Hunter** doubles all future Gold drops).  

#### Saves
- Progress saves when you Game Over or return to Main Menu.  
- Saves include: highest score, cash earned, characters purchased, highest Base level reached.  

---

## Screenshots

<div align="center">
  <img src="https://quek-wei-lin-website.in/wp-content/uploads/2024/02/mecha-v1-content-image-1.png" alt="Main Menu" width="100%"/><br/>
  <em>Main Menu</em>
</div>
<br/><br/>

<div align="center">
  <img src="https://quek-wei-lin-website.in/wp-content/uploads/2024/02/mecha-v1-content-image-2-1536x693.png" alt="Collections Scene" width="100%"/><br/>
  <em>Collections Scene</em>
</div>
<br/><br/>

<div align="center">
  <img src="https://quek-wei-lin-website.in/wp-content/uploads/2024/12/tutorial.png" alt="Tutorial" width="100%"/><br/>
  <em>Tutorial</em>
</div>
<br/><br/>

<div align="center">
  <img src="https://quek-wei-lin-website.in/wp-content/uploads/2024/02/mecha-v1-content-image-3.png" alt="Interactive Loading Scene" width="100%"/><br/>
  <em>Interactive Loading Scene</em>
</div>
<br/><br/>

<div align="center">
  <img src="https://quek-wei-lin-website.in/wp-content/uploads/2025/08/REUPLOAD-mecha-v1-content-image-4-1536x696.png" alt="Game Scene" width="100%"/><br/>
  <em>Game Scene</em>
</div>
<br/><br/>

<div align="center">
  <img src="https://quek-wei-lin-website.in/wp-content/uploads/2025/08/REUPLOAD-mecha-v1-content-image-5-1536x705.png" alt="Attacking enemies with incoming Catastrophe" width="100%"/><br/>
  <em>Attacking enemies with incoming Catastrophe</em>
</div>
<br/><br/>

<div align="center">
  <img src="https://quek-wei-lin-website.in/wp-content/uploads/2025/08/REUPLOAD-mecha-v1-content-image-6-1536x708.png" alt="Attacking the Base with Enraged Enemies" width="100%"/><br/>
  <em>Attacking the Base and being attacked by Enraged Enemies</em>
</div>
<br/><br/>

<div align="center">
  <img src="https://quek-wei-lin-website.in/wp-content/uploads/2024/02/mecha-v1-content-image-7.png" alt="Shop Menu" width="100%"/><br/>
  <em>Shop Menu</em>
</div>

---

## Links

**Github Repository:**  
[https://github.com/testtesttesttest45/Mecha-V1](https://github.com/testtesttesttest45/Mecha-V1)

Documentation attached <a href="https://drive.google.com/file/d/1ChXDNNHaxv-9ZKOAjJ5OQJeoJewqsEVW/view?usp=drive_link" target="_blank">here</a>.

**Play Online:**  
[https://mecha-v1.onrender.com/](https://mecha-v1.onrender.com/)  

> ⚠️ Note: The game is deployed on **Render free tier**.  
> This may cause slow loading at first, as the server needs time to wake up.  

---

## Credits

**=== Game Title ===**  
Mecha V1  

**=== Created By ===**  
Wei Lin, Developer  

**=== Made Using ===**  
- JavaScript  
- HTML  
- CSS  
- PhaserJS  

**=== Public Assets (Sprites and Audio) Used ===**  
- Social Wars Preservation Project by AcidCaos: https://github.com/AcidCaos/socialwarriors
