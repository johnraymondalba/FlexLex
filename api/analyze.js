const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * Find the lexer binary in multiple possible locations
 */
function getLexerBinary() {
  // Try multiple paths
  const possiblePaths = [
    path.join(__dirname, '../lexer/lexer'),
    path.join(process.cwd(), 'lexer/lexer'),
    '/var/task/lexer/lexer',
    path.resolve(__dirname, '../lexer/lexer'),
  ];

  for (const binPath of possiblePaths) {
    if (fs.existsSync(binPath)) {
      try {
        fs.accessSync(binPath, fs.constants.X_OK);
        return binPath;
      } catch (e) {
        // Try to make it executable if it exists
        try {
          fs.chmodSync(binPath, 0o755);
          return binPath;
        } catch (chmodErr) {
          continue;
        }
      }
    }
  }

  return null;
}

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

  // Find lexer binary
  const LEXER_BIN = getLexerBinary();
  if (!LEXER_BIN) {
    return res.status(500).json({ 
      error: 'Lexer binary not found. Please ensure lexer/lexer is committed to the repository.' 
    });
  }

  try {
    // Use execSync with stdin for better compatibility with Vercel
    const stdout = execSync(LEXER_BIN, {
      input: code,
      timeout: 10_000,
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer
      encoding: 'utf8'
    });

    try {
      const result = parseLexerOutput(stdout);
      return res.json(result);
    } catch (parseErr) {
      return res.status(500).json({ error: 'Failed to parse lexer output: ' + parseErr.message });
    }
  } catch (err) {
    const stderr = err.stderr ? err.stderr.toString() : '';
    const stdout = err.stdout ? err.stdout.toString() : '';
    
    return res.status(500).json({ 
      error: 'Lexer execution failed',
      details: stderr || stdout || err.message
    });
  }
};
