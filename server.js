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
  const { cash, baseLevel, score } = req.body;
  const saveFilePath = path.join(__dirname, 'save_file.json');

  fs.readFile(saveFilePath, (err, data) => {
    let saveData = { cash, baseLevel, highestScore: 0, newHighest: false, latestScore: score };

    if (!err && data) {
      const existingData = JSON.parse(data);

      saveData.highestScore = existingData.highestScore || 0; // Initialize highestScore from existing data if available

      // Check if the current session's score is a new highest score
      if (score > saveData.highestScore) {
        saveData.highestScore = score;
        saveData.newHighest = true;
      }
    } else {
      // error area, such as missing file or invalid JSON
      // since this is the first save, latestScore will also be the highestScore
      saveData.highestScore = score;
      saveData.newHighest = true; // since it's the first game, it's implicitly a new high score
    }

    // write the (new or updated) save file
    fs.writeFile(saveFilePath, JSON.stringify(saveData, null, 2), 'utf8', (writeErr) => {
      if (writeErr) {
        console.error(writeErr);
        return res.status(500).json({ message: 'Error saving game data' });
      }
      res.json({ message: 'Game data saved successfully', ...saveData }); // spread operator used to include all properties of saveData
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
                  cash: 0,
                  baseLevel: 1,
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
