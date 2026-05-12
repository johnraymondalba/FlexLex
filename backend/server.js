const express = require("express");
const { exec, execFile } = require("child_process");
const path = require("path");
const fs = require("fs");
const os = require("os");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "../frontend/dist")));

const LEXER_DIR = path.join(__dirname, "../lexer");
const LEXER_BIN = path.join(LEXER_DIR, "lexer");

/* ── Build lexer binary on startup ─────────────────────────────────────── */
function buildLexer(callback) {
  exec("make -C " + LEXER_DIR, (err, stdout, stderr) => {
    if (err) {
      console.error("Build failed:", stderr);
      callback(err);
    } else {
      console.log("Lexer built successfully.");
      callback(null);
    }
  });
}

/* ── Parse lexer output ─────────────────────────────────────────────────── */
function parseLexerOutput(raw) {
  const lines = raw.trim().split("\n");
  const tokens = [];
  let summary = null;

  for (const line of lines) {
    if (!line.trim()) continue;

    if (line.startsWith("TOKEN|")) {
      const parts = line.split("|");
      // parts[0] = "TOKEN", parts[1] = type, parts[2] = value
      tokens.push({ type: parts[1], value: parts[2] || "" });
    } else if (line.startsWith("SUMMARY|")) {
      const rest = line.slice("SUMMARY|".length);
      summary = {};
      rest.split("|").forEach((kv) => {
        const [k, v] = kv.split("=");
        summary[k] = parseInt(v, 10);
      });
    }
  }

  return { tokens, summary };
}

/* ── POST /api/analyze ─────────────────────────────────────────────────── */
app.post("/api/analyze", (req, res) => {
  const { code } = req.body;

  if (typeof code !== "string") {
    return res.status(400).json({ error: "Missing 'code' field." });
  }

  if (code.length > 100_000) {
    return res.status(400).json({ error: "Input too large (max 100 KB)." });
  }

  // Write code to a temp file, pipe it to lexer
  const tmpFile = path.join(os.tmpdir(), `lex_input_${Date.now()}.txt`);
  fs.writeFile(tmpFile, code, (writeErr) => {
    if (writeErr) {
      return res.status(500).json({ error: "Failed to write temp file." });
    }

    const cmd = `"${LEXER_BIN}" < "${tmpFile}"`;
    exec(cmd, { timeout: 10_000 }, (err, stdout, stderr) => {
      fs.unlink(tmpFile, () => {}); // cleanup

      if (err && !stdout) {
        return res.status(500).json({ error: "Lexer error: " + stderr });
      }

      try {
        const result = parseLexerOutput(stdout);
        return res.json(result);
      } catch (parseErr) {
        return res
          .status(500)
          .json({ error: "Failed to parse lexer output." });
      }
    });
  });
});

/* ── Health check ──────────────────────────────────────────────────────── */
app.get("/api/health", (_req, res) => {
  const lexerReady = fs.existsSync(LEXER_BIN);
  res.json({ status: "ok", lexerReady });
});

/* ── Fallback to frontend SPA ──────────────────────────────────────────── */
app.get("*", (_req, res) => {
  const indexPath = path.join(__dirname, "../frontend/dist/index.html");
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.send("Frontend not built. Run: cd frontend && npm run build");
  }
});

/* ── Start ─────────────────────────────────────────────────────────────── */
buildLexer((buildErr) => {
  if (buildErr) {
    console.warn("WARNING: Lexer build failed. /api/analyze may not work.");
  }
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
});
