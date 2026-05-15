const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Path to the lexer binary (in the root lexer directory)
const LEXER_BIN = path.join(__dirname, '../lexer/lexer');

/**
 * Parse lexer output into tokens and summary
 */
function parseLexerOutput(raw) {
  const lines = raw.trim().split('\n');
  const tokens = [];
  let summary = null;

  for (const line of lines) {
    if (!line.trim()) continue;

    if (line.startsWith('TOKEN|')) {
      const parts = line.split('|');
      tokens.push({ type: parts[1], value: parts[2] || '' });
    } else if (line.startsWith('SUMMARY|')) {
      const rest = line.slice('SUMMARY|'.length);
      summary = {};
      rest.split('|').forEach((kv) => {
        const [k, v] = kv.split('=');
        summary[k] = parseInt(v, 10);
      });
    }
  }

  return { tokens, summary };
}

/**
 * Main serverless function handler
 */
module.exports = (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code } = req.body;

  if (typeof code !== 'string') {
    return res.status(400).json({ error: "Missing 'code' field." });
  }

  if (code.length > 100_000) {
    return res.status(400).json({ error: 'Input too large (max 100 KB).' });
  }

  // Write code to a temp file
  const tmpFile = path.join(os.tmpdir(), `lex_input_${Date.now()}.txt`);
  
  fs.writeFile(tmpFile, code, (writeErr) => {
    if (writeErr) {
      return res.status(500).json({ error: 'Failed to write temp file.' });
    }

    // Execute lexer with the temp file as input
    execFile(LEXER_BIN, [], { 
      timeout: 10_000,
      input: code // pipe code directly to stdin
    }, (err, stdout, stderr) => {
      // Clean up temp file
      fs.unlink(tmpFile, () => {});

      if (err && !stdout) {
        return res.status(500).json({ error: 'Lexer error: ' + stderr });
      }

      try {
        const result = parseLexerOutput(stdout);
        return res.json(result);
      } catch (parseErr) {
        return res.status(500).json({ error: 'Failed to parse lexer output.' });
      }
    });
  });
};
