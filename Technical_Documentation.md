# Lexical Analyzer - Detailed Technical Documentation

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Components](#components)
4. [How It Works](#how-it-works)
5. [The Flex Framework](#the-flex-framework)
6. [Lexer Rules](#lexer-rules)
7. [Token Recognition](#token-recognition)
8. [Compilation and Execution](#compilation-and-execution)
9. [Examples](#examples)

---

## Overview

The **FlexLex** project implements a **lexical analyzer** (also called a **scanner** or **tokenizer**) using Flex (Fast Lexical Analyzer Generator). A lexical analyzer is the first phase of a compiler that reads source code characters and converts them into meaningful tokens—the building blocks of programming language syntax.

### Purpose
The lexical analyzer serves to:
- Break down source code into logical tokens
- Classify tokens by type (keywords, identifiers, operators, etc.)
- Remove whitespace and comments
- Track line numbers for error reporting
- Count and report statistics about the tokens found

---

## Architecture

The lexical analyzer follows a classic multi-stage architecture:

```
Source Code Input
        ↓
    [Flex Lexer]
        ↓
   [Pattern Matching via DFA]
        ↓
   [Action Execution]
        ↓
   [Token Output + Statistics]
```

### Key Layers

1. **Input Layer**: Reads source code character by character
2. **Pattern Matching Layer**: Uses a Deterministic Finite Automaton (DFA) to match input against defined patterns
3. **Action Layer**: Executes C code when a pattern matches
4. **Output Layer**: Generates tokens and maintains statistics

---

## Components

### 1. Declarations Section (%{...%})

Located at the beginning of `lexer.l`, the declarations section contains C code that:

```c
%{
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

/* Token type counters */
int keyword_count = 0;
int identifier_count = 0;
int integer_count = 0;
int float_count = 0;
int string_count = 0;
int operator_count = 0;
int delimiter_count = 0;
int comment_count = 0;
int whitespace_count = 0;
int unknown_count = 0;

void print_token(const char* type, const char* value) {
    printf("TOKEN|%s|", type);
    for (int i = 0; value[i]; i++) {
        if (value[i] == '\n') printf("\\n");
        else if (value[i] == '\t') printf("\\t");
        else if (value[i] == '"') printf("\\\"");
        else if (value[i] == '\\') printf("\\\\");
        else putchar(value[i]);
    }
    printf("\n");
}
%}
```

**Purpose**:
- **Includes**: Standard C libraries for I/O, memory, and string operations
- **Counters**: Global variables that track the count of each token type
- **Utility Function**: `print_token()` outputs tokens in a structured pipe-delimited format while escaping special characters

### 2. Options Section

```
%option noyywrap
%option yylineno
```

**Flags**:
- `noyywrap`: Tells Flex not to require a `yywrap()` function at end-of-file (simpler single-file handling)
- `yylineno`: Automatically tracks the current line number in the `yylineno` variable

### 3. Regular Definitions Section

```
DIGIT       [0-9]
LETTER      [a-zA-Z_]
ALNUM       [a-zA-Z0-9_]
WS          [ \t\r\n]+

INTEGER     {DIGIT}+
FLOAT       {DIGIT}+"."{DIGIT}+([eE][+-]?{DIGIT}+)?
STRING      \"([^\"\\]|\\.)*\"
IDENTIFIER  {LETTER}{ALNUM}*

SL_COMMENT  "//"[^\n]*
ML_COMMENT  "/*"([^*]|\*+[^*/])*\*+"/"
```

**Purpose**: Define reusable regex patterns that are referenced in the rules section

**Breakdown**:
- `DIGIT`: Matches any single digit 0-9
- `LETTER`: Matches letters (a-z, A-Z) or underscore
- `ALNUM`: Matches alphanumeric characters or underscore
- `WS`: Matches whitespace (spaces, tabs, carriage returns, newlines)
- `INTEGER`: One or more digits
- `FLOAT`: Digits + decimal point + digits, with optional scientific notation (e.g., `3.14e-2`)
- `STRING`: Double-quoted strings with escape sequences (`\"([^\"\\]|\\.)*\"`)
  - `[^\"\\]`: Any character except quote or backslash
  - `\\.`: Backslash followed by any character (escape sequences)
- `IDENTIFIER`: Starts with letter or underscore, followed by any alphanumeric or underscore
- `SL_COMMENT`: Double slash followed by anything except newline
- `ML_COMMENT`: Complex regex for `/* ... */` comments accounting for nested asterisks

### 4. Rules Section (%% ... %%)

The rules section defines pattern-action pairs:

```
Pattern         {Action}
```

#### 4.1 Keyword Recognition

```c
"int"       { keyword_count++; print_token("KEYWORD", yytext); }
"float"     { keyword_count++; print_token("KEYWORD", yytext); }
"if"        { keyword_count++; print_token("KEYWORD", yytext); }
/* ... 35+ keywords ... */
```

**Mechanism**:
- Exact string matching for reserved words
- When matched, increment counter and output token
- `yytext` is a Flex built-in variable containing the matched text

**Keywords Recognized** (38 total):
- Data types: `int`, `float`, `double`, `char`, `string`, `bool`, `void`
- Control flow: `if`, `else`, `while`, `for`, `do`, `switch`, `case`, `break`, `continue`, `return`
- Object-oriented: `struct`, `class`, `public`, `private`, `protected`, `new`, `delete`
- Values: `true`, `false`, `null`, `nullptr`
- Modifiers: `const`, `static`
- Special: `include`, `define`, `printf`, `scanf`, `cout`, `cin`, `main`, `endl`

#### 4.2 Comment Recognition

```c
{SL_COMMENT}    { comment_count++; print_token("COMMENT", yytext); }
{ML_COMMENT}    { comment_count++; print_token("COMMENT", yytext); }
```

**Purpose**: Identifies and counts comments while preserving their content

#### 4.3 Literal Recognition

```c
{FLOAT}         { float_count++; print_token("FLOAT_LITERAL", yytext); }
{INTEGER}       { integer_count++; print_token("INTEGER_LITERAL", yytext); }
{STRING}        { string_count++; print_token("STRING_LITERAL", yytext); }
```

**Order Matters**: Float is checked before integer because `{FLOAT}` is more specific. Flex tries patterns in order of appearance.

#### 4.4 Identifier Recognition

```c
{IDENTIFIER}    { identifier_count++; print_token("IDENTIFIER", yytext); }
```

**Placed After Keywords**: Ensures keywords (which have fixed spellings) are matched before the general identifier pattern. This is crucial for correct classification.

#### 4.5 Operator Recognition

```c
"+"     { operator_count++; print_token("OPERATOR", yytext); }
"-"     { operator_count++; print_token("OPERATOR", yytext); }
/* ... 30+ operators ... */
"=="    { operator_count++; print_token("OPERATOR", yytext); }
"!="    { operator_count++; print_token("OPERATOR", yytext); }
```

**Multi-character Operators**: Flex handles longest-match rule automatically. When input is `==`, Flex prefers matching `==` over two `=` tokens.

**Operators Recognized** (35 total):
- Arithmetic: `+`, `-`, `*`, `/`, `%`
- Assignment: `=`, `+=`, `-=`, `*=`, `/=`
- Comparison: `==`, `!=`, `<`, `>`, `<=`, `>=`
- Logical: `&&`, `||`, `!`
- Bitwise: `&`, `|`, `^`, `~`, `<<`, `>>`
- Increment/Decrement: `++`, `--`
- Member access: `.`, `->`, `::`
- Miscellaneous: `#`

#### 4.6 Delimiter Recognition

```c
"("     { delimiter_count++; print_token("DELIMITER", yytext); }
")"     { delimiter_count++; print_token("DELIMITER", yytext); }
"{"     { delimiter_count++; print_token("DELIMITER", yytext); }
```

**Delimiters** (9 total): `()`, `{}`, `[]`, `;`, `,`, `:`

#### 4.7 Whitespace Handling

```c
{WS}    { whitespace_count++; }
```

**Purpose**: Count whitespace but discard it (no output). Whitespace is a separator but not a token.

#### 4.8 Unknown Character Fallback

```c
.       { unknown_count++; print_token("UNKNOWN", yytext); }
```

**Catch-all Rule**: The `.` pattern matches any single character not matched by above rules. Used for error detection.

### 5. User Code Section

```c
int main(void) {
    yylex();

    printf("SUMMARY|keywords=%d|identifiers=%d|integers=%d|floats=%d|strings=%d|operators=%d|delimiters=%d|comments=%d|unknown=%d\n",
        keyword_count, identifier_count, integer_count, float_count,
        string_count, operator_count, delimiter_count, comment_count, unknown_count);

    return 0;
}
```

**Purpose**:
- **`yylex()`**: Flex-generated function that performs the actual lexical analysis
- **Statistics Output**: Prints a summary of all token counts in pipe-delimited format

---

## How It Works

### 1. Flex Preprocessing

When `flex lexer.l` is run:
- Flex reads the lexer specification
- Converts regex patterns into a **Deterministic Finite Automaton (DFA)**
- Generates C code (`lex.yy.c`) implementing the DFA
- The DFA provides O(n) scanning complexity (linear in input length)

### 2. Pattern Matching Algorithm (DFA-based)

The generated lexer uses a state machine:

```
State 0 (Initial)
    ├─ 'i' → State 1
    ├─ 'f' → State 2
    ├─ '"' → String State
    ├─ '/' → Operator State
    └─ [a-z_] → Identifier Start
         └─ [a-zA-Z0-9_] → Keep reading identifier

State 1 (after 'i')
    ├─ 'n' + 't' → "int" keyword (accept)
    └─ [a-zA-Z0-9_] → Regular identifier
```

### 3. Longest Match Rule

Flex applies the **longest match rule**:
- The lexer reads as many characters as possible
- Prefers longer matching patterns
- Example: `int` vs. identifier starting with `i`
  - Flex reads `i`, then `n`, then `t`, then checks next char
  - If next char is not alphanumeric, commit to `int` keyword
  - If next is alphanumeric, rewind and treat as identifier `int_var`

### 4. Rule Priority

When multiple patterns could match:
1. Pattern appearing **first in lexer.l** has priority
2. **Longest match** takes precedence
3. Example resolution:
   ```
   "int" (exact) vs. {IDENTIFIER} (general)
   → "int" wins because it appears first
   ```

### 5. Action Execution

When a pattern matches:
1. `yytext` is set to the matched string
2. `yylength` is set to the matched length
3. The corresponding C code action executes
4. Control returns to scanning for next token

---

## The Flex Framework

### Built-in Variables

| Variable | Purpose |
|----------|---------|
| `yytext` | Buffer containing matched text |
| `yylength` | Length of matched text |
| `yylineno` | Current line number (with `%option yylineno`) |
| `yyin` | Input file stream (default: stdin) |
| `yyout` | Output file stream (default: stdout) |

### Generated Functions

| Function | Purpose |
|----------|---------|
| `int yylex()` | Main scanning function; returns token code |
| `int yywrap()` | Called at EOF; returns 1 to stop scanning (optional) |
| `void yyrestart(FILE*)` | Restart scanning from a new file |

### Regex Syntax in Flex

| Pattern | Meaning |
|---------|---------|
| `abc` | Literal string "abc" |
| `[abc]` | Any single character: a, b, or c |
| `[^abc]` | Any character except a, b, c |
| `[a-z]` | Any lowercase letter |
| `.` | Any character except newline |
| `*` | Zero or more of previous pattern |
| `+` | One or more of previous pattern |
| `?` | Zero or one of previous pattern |
| `\|` | Alternation (or) |
| `()` | Grouping |
| `{n}` | Exactly n of previous pattern |
| `{n,}` | n or more of previous pattern |
| `{n,m}` | Between n and m of previous pattern |

---

## Lexer Rules

### Rule Ordering Strategy

The lexer uses a specific ordering strategy to ensure correct tokenization:

```
1. Keywords (most specific) - checked first
2. Comments - prevent keywords in comments from matching
3. Literals (integers, floats, strings)
4. Identifiers (general pattern)
5. Operators
6. Delimiters
7. Whitespace (skip)
8. Unknown (catch-all for errors)
```

**Why This Order?**

- **Keywords before identifiers**: Ensures `if` is recognized as keyword, not identifier
- **Comments early**: Any text in comments shouldn't create tokens
- **Longest match rule**: Ensures `3.14` is one float, not `3` + `.` + `14`

### Multi-line Comment Pattern Analysis

```regex
"/*"([^*]|\*+[^*/])*\*+"/"
```

Breaks down as:
- `"/*"`: Literal opening
- `([^*]|\*+[^*/])*`: Zero or more of:
  - `[^*]`: Any non-asterisk character, OR
  - `\*+[^*/]`: One or more asterisks followed by non-slash (handles `**` inside comment)
- `\*+"/"`: One or more asterisks followed by literal `/`

**Example matching**: `/* comment with ** asterisks */`

---

## Token Recognition

### Token Classes

| Token Type | Pattern | Example |
|-----------|---------|---------|
| KEYWORD | Reserved word | `int`, `if`, `while` |
| IDENTIFIER | User-defined name | `myVar`, `_count`, `func123` |
| INTEGER_LITERAL | Digits only | `42`, `0`, `1000` |
| FLOAT_LITERAL | Digits + decimal + optional exponent | `3.14`, `2.0e-5` |
| STRING_LITERAL | Quoted text with escapes | `"hello"`, `"line\n"` |
| OPERATOR | Symbol operation | `+`, `==`, `&&` |
| DELIMITER | Structural punctuation | `(`, `)`, `{`, `}` |
| COMMENT | Code annotation | `// comment`, `/* block */` |
| UNKNOWN | Unrecognized character | `@`, `$` (in standard C) |

### Output Format

Each token produces a line:
```
TOKEN|<TYPE>|<VALUE>
```

Examples:
```
TOKEN|KEYWORD|int
TOKEN|IDENTIFIER|myVariable
TOKEN|OPERATOR|=
TOKEN|INTEGER_LITERAL|42
TOKEN|STRING_LITERAL|"hello world"
TOKEN|DELIMITER|;
```

### Summary Output

Final line:
```
SUMMARY|keywords=5|identifiers=3|integers=2|floats=1|strings=0|operators=8|delimiters=4|comments=0|unknown=0
```

---

## Compilation and Execution

### Build Process

```bash
make all
```

Steps:
1. **Flex preprocessing**: `flex lexer.l` → `lex.yy.c`
   - Reads `lexer.l` specification
   - Generates DFA in C code
   - Creates scannerfunction

2. **C compilation**: `gcc -o lexer lex.yy.c -lfl`
   - Compiles generated C code
   - Links against Flex library (`-lfl`)
   - Produces executable `lexer`

### Execution

```bash
./lexer < input.c
```

- Reads source code from stdin
- Processes each character through DFA
- Outputs tokens to stdout
- Prints summary statistics

### Dependencies

- **Flex**: Fast Lexical Analyzer Generator (installed via `make install-deps`)
- **GCC**: C compiler

---

## Examples

### Example 1: Simple C Code

**Input** (`test.c`):
```c
int main() {
    int x = 42;
    return x;
}
```

**Output**:
```
TOKEN|KEYWORD|int
TOKEN|KEYWORD|main
TOKEN|DELIMITER|(
TOKEN|DELIMITER|)
TOKEN|DELIMITER|{
TOKEN|KEYWORD|int
TOKEN|IDENTIFIER|x
TOKEN|OPERATOR|=
TOKEN|INTEGER_LITERAL|42
TOKEN|DELIMITER|;
TOKEN|KEYWORD|return
TOKEN|IDENTIFIER|x
TOKEN|DELIMITER|;
TOKEN|DELIMITER|}
SUMMARY|keywords=4|identifiers=2|integers=1|floats=0|strings=0|operators=1|delimiters=6|comments=0|unknown=0
```

### Example 2: With Comments and Floats

**Input**:
```c
// This is a comment
float pi = 3.14159;
```

**Output**:
```
TOKEN|COMMENT|// This is a comment
TOKEN|KEYWORD|float
TOKEN|IDENTIFIER|pi
TOKEN|OPERATOR|=
TOKEN|FLOAT_LITERAL|3.14159
TOKEN|DELIMITER|;
SUMMARY|keywords=1|identifiers=1|integers=0|floats=1|strings=0|operators=1|delimiters=1|comments=1|unknown=0
```

### Example 3: String with Escapes

**Input**:
```c
printf("Hello\nWorld");
```

**Output**:
```
TOKEN|KEYWORD|printf
TOKEN|DELIMITER|(
TOKEN|STRING_LITERAL|"Hello\nWorld"
TOKEN|DELIMITER|)
TOKEN|DELIMITER|;
SUMMARY|keywords=1|identifiers=0|integers=0|floats=0|strings=1|operators=0|delimiters=3|comments=0|unknown=0
```

---

## Advanced Concepts

### 1. Start Conditions

Not used in this lexer, but Flex supports multiple "start conditions" for context-sensitive lexing:
```c
%x COMMENT
BEGIN(COMMENT);  // Switch to COMMENT context
```

### 2. Left/Right Context

Patterns can depend on what comes before/after:
```c
pattern1/pattern2  /* pattern1 only if followed by pattern2 */
```

### 3. Regular Expression Optimization

Flex optimizes patterns:
- Converts to DFA for O(1) character processing
- Minimizes DFA states
- Generates efficient lookup tables

### 4. Escape Sequences in Strings

The pattern `\"([^\"\\]|\\.)*\"` correctly handles:
- `"simple"` - no escapes
- `"with\"quote"` - escaped quote
- `"with\\backslash"` - escaped backslash
- `"multiline\ntext"` - escaped newline

---

## Error Handling

### Unknown Characters

Characters not matching any pattern trigger the catch-all rule:
```c
.       { unknown_count++; print_token("UNKNOWN", yytext); }
```

**Examples**:
- `@` in C source (invalid)
- `$` as variable prefix (not standard C)

### Unclosed Strings

A string missing closing quote like `"unclosed` won't match `{STRING}` pattern because it requires closing `"`. Instead:
- Characters between `"` and newline match individual patterns
- Can cause cascading errors in parsing

### Handling Errors

The current lexer:
1. Counts unknown tokens
2. Reports them in output
3. Lets downstream parser handle semantic validation

---

## Performance Characteristics

### Time Complexity
- **Per character**: O(1) - DFA processes one character per state transition
- **Total**: O(n) where n = number of input characters
- **No backtracking**: Unlike regex engines, Flex DFA never needs to backtrack

### Space Complexity
- **Input buffer**: O(max token length)
- **DFA tables**: O(|states| × |alphabet|)
- Typically very efficient for typical source code

### Practical Performance
- Can scan thousands of lines per second
- Limited mainly by I/O, not scanning logic
- Suitable for real-time compilation tools

---

## Conclusion

The FlexLex lexical analyzer demonstrates core compiler design principles:

1. **Pattern Recognition**: Regular expressions capture language structure
2. **Efficient Matching**: DFA provides linear-time scanning
3. **Modular Design**: Separates tokenization from parsing
4. **Extensibility**: Easy to add new token types
5. **Metrics**: Provides useful statistical output for analysis

This architecture forms the foundation of any compiler or interpreter's front-end.
