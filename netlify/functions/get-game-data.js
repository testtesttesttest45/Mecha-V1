const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

const handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const saveFilePath = path.join(process.env.LAMBDA_TASK_ROOT, '..', '..', 'src', 'save_file.json');

  try {
    const data = await readFile(saveFilePath, 'utf8');
    return { statusCode: 200, body: data };
  } catch (err) {
    if (err.code === 'ENOENT') {
      const initialData = {
        cash: 0,
        baseLevel: 1,
        highestScore: 0,
        newHighest: false,
        latestScore: 0,
      };
      await writeFile(saveFilePath, JSON.stringify(initialData, null, 2), 'utf8');
      return { statusCode: 200, body: JSON.stringify(initialData) };
    }

    return { statusCode: 500, body: JSON.stringify({ message: 'Error reading game data' }) };
  }
};

exports.handler = handler;
