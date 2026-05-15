const fs = require('fs');
const path = require('path');

const LEXER_BIN = path.join(__dirname, '../lexer/lexer');

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const lexerReady = fs.existsSync(LEXER_BIN);
  res.json({ status: 'ok', lexerReady });
};
