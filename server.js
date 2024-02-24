const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 4000;
const fs = require('fs');
const bodyParser = require('body-parser');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/save-game', (req, res) => {
    const { incomingCash, latestBaseLevel, score } = req.body;
    const saveFilePath = path.join(__dirname, 'save_file.json');

    fs.readFile(saveFilePath, (err, data) => {
        let saveData;
        if (!err && data) {
            const existingData = JSON.parse(data);
            // Update 'initialCash' to include 'incomingCash' from the current session
            const updatedInitialCash = (existingData.initialCash || 0) + (existingData.incomingCash || 0);

            // If 'charactersOwned' does not exist, initialize as an empty array
            const charactersOwned = existingData.charactersOwned || [1]; // Character 1 owned by default
            const characterInUse = existingData.characterInUse || 1;
            saveData = {
                initialCash: updatedInitialCash,
                incomingCash: incomingCash,
                latestBaseLevel: latestBaseLevel,
                highestBaseLevel: Math.max(existingData.highestBaseLevel || 0, latestBaseLevel), // Update 'highestBaseLevel' if 'latestBaseLevel' is higher
                highestScore: existingData.highestScore || 0,
                newHighest: false,
                latestScore: score,
                charactersOwned: charactersOwned,
                characterInUse: characterInUse 
            };

            if (score > saveData.highestScore) {
                saveData.highestScore = score;
                saveData.newHighest = true;
            }
        } else {
            console.error(err);
            return res.status(500).json({ message: 'Error reading game data' });
        }

        fs.writeFile(saveFilePath, JSON.stringify(saveData, null, 2), 'utf8', (writeErr) => {
            if (writeErr) {
                console.error(writeErr);
                return res.status(500).json({ message: 'Error saving game data' });
            }
            res.json({ message: 'Game data saved successfully', ...saveData });
        });
    });
});

app.get('/get-game-data', (req, res) => {
    const saveFilePath = path.join(__dirname, 'save_file.json');

    fs.readFile(saveFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error(err);
            if (err.code === 'ENOENT') { // if not found, create a new file with initial data
                const initialData = {
                    initialCash: 750,
                    incomingCash: 0,
                    highestBaseLevel: 0,
                    latestBaseLevel: 0,
                    highestScore: 0,
                    newHighest: false,
                    latestScore: 0,
                    charactersOwned: [1, 10], // Character 1 owned by default
                    characterInUse: 1
                };
                fs.writeFile(saveFilePath, JSON.stringify(initialData, null, 2), 'utf8', (writeErr) => {
                    if (writeErr) {
                        console.error(writeErr);
                        return res.status(500).json({ message: 'Error creating initial game data file' });
                    }
                    return res.json(initialData);
                });
            } else { // all other errors
                return res.status(500).json({ message: 'Error reading game data' });
            }
        }
        else if (Object.keys(JSON.parse(data)).length !== 9) {
            console.log('Game data file is corrupted. Creating a new one...')
            const initialData = {
                initialCash: 750,
                incomingCash: 0,
                highestBaseLevel: 0,
                latestBaseLevel: 0,
                highestScore: 0,
                newHighest: false,
                latestScore: 0,
                charactersOwned: [1, 10], // Character 1 owned by default
                characterInUse: 1
            };
            fs.writeFile(saveFilePath, JSON.stringify(initialData, null, 2), 'utf8', (writeErr) => {
                if (writeErr) {
                    console.error(writeErr);
                    return res.status(500).json({ message: 'Error creating initial game data file' });
                }
                return res.json(initialData);
            });
        }
        else { // file exist and read successfully
            res.json(JSON.parse(data));
        }
    });
});

app.post('/purchase-character', (req, res) => {
    const saveFilePath = path.join(__dirname, 'save_file.json');
    const { characterId, cost } = req.body;

    fs.readFile(saveFilePath, (err, data) => {
        if (err) {
            console.error('Error reading save file:', err);
            return res.status(500).json({ message: 'Error reading game data' });
        }

        const gameData = JSON.parse(data);
        let totalCashAvailable = gameData.initialCash + gameData.incomingCash;

        // Check if the player can afford the character
        if (totalCashAvailable >= cost) {
            // Deduct cost from initialCash first, then incomingCash if necessary
            let costDeduction = cost;
            if (gameData.initialCash >= cost) {
                gameData.initialCash -= cost;
            } else {
                costDeduction -= gameData.initialCash; // Deduct whatever is left from initialCash
                gameData.initialCash = 0; // Set initialCash to 0 as it's fully used
                gameData.incomingCash -= costDeduction; // Deduct the remainder from incomingCash
            }

            // Add character to the owned list if not already owned
            if (!gameData.charactersOwned.includes(characterId)) {
                gameData.charactersOwned.push(characterId);
            }

            // Save updated game data
            fs.writeFile(saveFilePath, JSON.stringify(gameData, null, 2), 'utf8', (writeErr) => {
                if (writeErr) {
                    console.error('Error writing save file:', writeErr);
                    return res.status(500).json({ message: 'Error saving game data' });
                }
                res.json({ message: 'Character purchased successfully', gameData });
            });
        } else {
            res.status(400).json({ message: 'Not enough cash to purchase character' });
        }
    });
});

app.post('/use-character', (req, res) => {
    const { characterId } = req.body;
    const saveFilePath = path.join(__dirname, 'save_file.json');

    fs.readFile(saveFilePath, (err, data) => {
        if (err) {
            console.error('Error reading save file:', err);
            return res.status(500).json({ message: 'Error reading game data' });
        }

        const gameData = JSON.parse(data);
        
        gameData.characterInUse = characterId;

        // Save updated game data
        fs.writeFile(saveFilePath, JSON.stringify(gameData, null, 2), 'utf8', (writeErr) => {
            if (writeErr) {
                console.error('Error writing save file:', writeErr);
                return res.status(500).json({ message: 'Error saving game data' });
            }
            res.json({ message: 'Character set to use successfully', gameData });
        });
    });
});

app.delete('/reset-game', (req, res) => {
    const saveFilePath = path.join(__dirname, 'save_file.json');
    fs.unlink(saveFilePath, (err) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Error deleting save file' });
        }
        res.json({ message: 'Save file deleted successfully' });
    });
});


app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
