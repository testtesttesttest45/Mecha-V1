export function rgbToHex(r, g, b) {
    r = r.toString(16);
    g = g.toString(16);
    b = b.toString(16);

    if (r.length == 1)
        r = "0" + r;
    if (g.length == 1)
        g = "0" + g;
    if (b.length == 1)
        b = "0" + b;

    return "#" + r + g + b;
}

export function resize(game) {
    const battleScene = document.getElementById('battle-scene');
    const gameWidth = game.config.width;
    const gameHeight = game.config.height;

    // Set the canvas dimensions to be exactly the same as the container dimensions
    game.canvas.style.width = battleScene.offsetWidth + 'px';
    game.canvas.style.height = battleScene.offsetHeight + 'px';

    // Remove the margin settings to ensure the canvas fully covers the container
    game.canvas.style.marginTop = '0px';
    game.canvas.style.marginLeft = '0px';
}

export function gamePause(isPaused, game) {
    const resumeButton = document.querySelector('.resume-button');

    if (!game || game.scene.scenes[0].sceneName !== "battle-scene") {
        console.warn('Pause function is not applicable for the current scene');
        return;
    }

    if (isPaused) {
        game.loop.pause();
        if (game.scene.scenes[0].scene.isActive()) {  // Ensure the scene is active before pausing
            game.scene.scenes[0].scene.pause();
        }
        game.scene.scenes[0].tweens.pauseAll();  // Pause all active tweens
        game.scene.scenes[0].pauseText.setVisible(true);
        game.scene.scenes[0].input.enabled = false;
        resumeButton.style.display = 'block';
    } else {
        game.loop.resume();
        if (!game.scene.scenes[0].scene.isActive()) {  // Ensure the scene is paused before resuming
            game.scene.scenes[0].scene.resume();
        }
        game.scene.scenes[0].tweens.resumeAll();  // Resume all active tweens
        game.scene.scenes[0].input.enabled = true;
    }
}

export function isValidPath(startX, startY, endX, endY, originalWidth, originalHeight, width, height, textures) { // based on Bresenham's line algorithm
    let x1 = Math.round(startX * (originalWidth / width));
    let y1 = Math.round(startY * (originalHeight / height));
    let x2 = Math.round(endX * (originalWidth / width));
    let y2 = Math.round(endY * (originalHeight / height));

    let dx = Math.abs(x2 - x1); // find the absolute value of the difference between the x-coordinates of the two points
    let dy = Math.abs(y2 - y1);

    let sx = (x1 < x2) ? 1 : -1; // increment or decrement the x and y values as we step along the line. If x1 is less than x2, we increment x1 by 1, otherwise we decrement it by 1
    let sy = (y1 < y2) ? 1 : -1;

    let err = dx - dy; // to determine when we need to step in the y direction (as opposed to the x direction)

    while (true) {
        const color = textures.getPixel(x1, y1, 'land');

        if (color.blue > 155) {
            return false;
        }

        if (x1 === x2 && y1 === y2) break; // we've reached the end of the line
        let e2 = 2 * err; // calculate the error value for the next step
        if (e2 > -dy) { err -= dy; x1 += sx; } // if the error is greater than -dy, we step in the x direction
        if (e2 < dx) { err += dx; y1 += sy; } // if the error is less than dx, we step in the y direction
    }

    return true;
}