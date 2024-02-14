const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const data = JSON.parse(event.body);
  const { cash, baseLevel, score } = data;
  const saveFilePath = path.join(process.env.LAMBDA_TASK_ROOT, '..', '..', 'src', 'save_file.json');

  try {
    let saveData = { cash, baseLevel, highestScore: 0, newHighest: false, latestScore: score };
    try {
      const existingData = JSON.parse(await readFile(saveFilePath, 'utf8'));
      saveData.highestScore = existingData.highestScore || 0;

      if (score > saveData.highestScore) {
        saveData.highestScore = score;
        saveData.newHighest = true;
      }
    } catch (err) {
      // Handle file not existing as if it's the first save
      saveData.highestScore = score;
      saveData.newHighest = true;
    }

    await writeFile(saveFilePath, JSON.stringify(saveData, null, 2), 'utf8');
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Game data saved successfully', ...saveData }),
    };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ message: 'Error saving game data' }) };
  }
};

exports.handler = handler;
