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
  const { incomingCash, baseLevel, score } = req.body;
  const saveFilePath = path.join(__dirname, 'save_file.json');

  fs.readFile(saveFilePath, (err, data) => {
      let saveData;
      if (!err && data) {
          const existingData = JSON.parse(data);
          // Update 'initialCash' to be the sum of the existing 'initialCash' and 'incomingCash'
          const updatedInitialCash = (existingData.initialCash || 0) + (existingData.incomingCash || 0);

          saveData = {
              initialCash: updatedInitialCash, // Now 'initialCash' includes the previous 'incomingCash'
              incomingCash: incomingCash, // The fresh 'incomingCash' from the current session
              baseLevel: baseLevel,
              highestScore: existingData.highestScore || 0, // Preserve existing highestScore
              newHighest: false,
              latestScore: score
          };

          // Check if the current session's score is a new highest score
          if (score > saveData.highestScore) {
              saveData.highestScore = score;
              saveData.newHighest = true;
          }
      } else {
          // This is the first save, so 'initialCash' is 0 and 'incomingCash' comes from the session
          saveData = {
              initialCash: 0,
              incomingCash: incomingCash,
              baseLevel: baseLevel,
              highestScore: score,
              newHighest: true, // It's the first game, so it's a new high score
              latestScore: score
          };
      }

      // Write the updated save file
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
                  initialCash: 0,
                  incomingCash: 0,
                  baseLevel: 0,
                  highestScore: 0,
                  newHighest: false,
                  latestScore: 0
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
      } else { // file exist and read successfully
          res.json(JSON.parse(data));
      }
  });
});


app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
