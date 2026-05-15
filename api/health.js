const fs = require('fs');
const path = require('path');

/**
 * Find the lexer binary in multiple possible locations
 */
function getLexerBinary() {
  const possiblePaths = [
    path.join(__dirname, '../lexer/lexer'),
    path.join(process.cwd(), 'lexer/lexer'),
    '/var/task/lexer/lexer',
    path.resolve(__dirname, '../lexer/lexer'),
  ];

  for (const binPath of possiblePaths) {
    if (fs.existsSync(binPath)) {
      return binPath;
    }
  }

  return null;
}

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const LEXER_BIN = getLexerBinary();
  const lexerReady = LEXER_BIN !== null && fs.existsSync(LEXER_BIN);

  res.json({ 
    status: 'ok', 
    lexerReady,
    lexerPath: LEXER_BIN || 'not found',
    cwd: process.cwd(),
    __dirname: __dirname
  });
};
