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
    /* Escape special characters for JSON-like output */
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

%option noyywrap
%option yylineno

/* Regular Definitions */
DIGIT       [0-9]
LETTER      [a-zA-Z_]
ALNUM       [a-zA-Z0-9_]
WS          [ \t\r\n]+

INTEGER     {DIGIT}+
FLOAT       {DIGIT}+"."{DIGIT}+([eE][+-]?{DIGIT}+)?
STRING      \"([^\"\\]|\\.)*\"
IDENTIFIER  {LETTER}{ALNUM}*

/* Single-line comment */
SL_COMMENT  "//"[^\n]*

/* Multi-line comment */
ML_COMMENT  "/*"([^*]|\*+[^*/])*\*+"/"

%%

 /* Keywords */
"int"       { keyword_count++; print_token("KEYWORD", yytext); }
"float"     { keyword_count++; print_token("KEYWORD", yytext); }
"double"    { keyword_count++; print_token("KEYWORD", yytext); }
"char"      { keyword_count++; print_token("KEYWORD", yytext); }
"string"    { keyword_count++; print_token("KEYWORD", yytext); }
"bool"      { keyword_count++; print_token("KEYWORD", yytext); }
"void"      { keyword_count++; print_token("KEYWORD", yytext); }
"if"        { keyword_count++; print_token("KEYWORD", yytext); }
"else"      { keyword_count++; print_token("KEYWORD", yytext); }
"while"     { keyword_count++; print_token("KEYWORD", yytext); }
"for"       { keyword_count++; print_token("KEYWORD", yytext); }
"do"        { keyword_count++; print_token("KEYWORD", yytext); }
"switch"    { keyword_count++; print_token("KEYWORD", yytext); }
"case"      { keyword_count++; print_token("KEYWORD", yytext); }
"break"     { keyword_count++; print_token("KEYWORD", yytext); }
"continue"  { keyword_count++; print_token("KEYWORD", yytext); }
"return"    { keyword_count++; print_token("KEYWORD", yytext); }
"struct"    { keyword_count++; print_token("KEYWORD", yytext); }
"class"     { keyword_count++; print_token("KEYWORD", yytext); }
"public"    { keyword_count++; print_token("KEYWORD", yytext); }
"private"   { keyword_count++; print_token("KEYWORD", yytext); }
"protected" { keyword_count++; print_token("KEYWORD", yytext); }
"new"       { keyword_count++; print_token("KEYWORD", yytext); }
"delete"    { keyword_count++; print_token("KEYWORD", yytext); }
"true"      { keyword_count++; print_token("KEYWORD", yytext); }
"false"     { keyword_count++; print_token("KEYWORD", yytext); }
"null"      { keyword_count++; print_token("KEYWORD", yytext); }
"nullptr"   { keyword_count++; print_token("KEYWORD", yytext); }
"const"     { keyword_count++; print_token("KEYWORD", yytext); }
"static"    { keyword_count++; print_token("KEYWORD", yytext); }
"include"   { keyword_count++; print_token("KEYWORD", yytext); }
"define"    { keyword_count++; print_token("KEYWORD", yytext); }
"printf"    { keyword_count++; print_token("KEYWORD", yytext); }
"scanf"     { keyword_count++; print_token("KEYWORD", yytext); }
"cout"      { keyword_count++; print_token("KEYWORD", yytext); }
"cin"       { keyword_count++; print_token("KEYWORD", yytext); }
"main"      { keyword_count++; print_token("KEYWORD", yytext); }
"endl"      { keyword_count++; print_token("KEYWORD", yytext); }

 /* Comments */
{SL_COMMENT}    { comment_count++; print_token("COMMENT", yytext); }
{ML_COMMENT}    { comment_count++; print_token("COMMENT", yytext); }

 /* Literals */
{FLOAT}         { float_count++; print_token("FLOAT_LITERAL", yytext); }
{INTEGER}       { integer_count++; print_token("INTEGER_LITERAL", yytext); }
{STRING}        { string_count++; print_token("STRING_LITERAL", yytext); }

 /* Identifiers */
{IDENTIFIER}    { identifier_count++; print_token("IDENTIFIER", yytext); }

 /* Operators */
"+"     { operator_count++; print_token("OPERATOR", yytext); }
"-"     { operator_count++; print_token("OPERATOR", yytext); }
"*"     { operator_count++; print_token("OPERATOR", yytext); }
"/"     { operator_count++; print_token("OPERATOR", yytext); }
"%"     { operator_count++; print_token("OPERATOR", yytext); }
"="     { operator_count++; print_token("OPERATOR", yytext); }
"=="    { operator_count++; print_token("OPERATOR", yytext); }
"!="    { operator_count++; print_token("OPERATOR", yytext); }
"<"     { operator_count++; print_token("OPERATOR", yytext); }
">"     { operator_count++; print_token("OPERATOR", yytext); }
"<="    { operator_count++; print_token("OPERATOR", yytext); }
">="    { operator_count++; print_token("OPERATOR", yytext); }
"&&"    { operator_count++; print_token("OPERATOR", yytext); }
"||"    { operator_count++; print_token("OPERATOR", yytext); }
"!"     { operator_count++; print_token("OPERATOR", yytext); }
"++"    { operator_count++; print_token("OPERATOR", yytext); }
"--"    { operator_count++; print_token("OPERATOR", yytext); }
"+="    { operator_count++; print_token("OPERATOR", yytext); }
"-="    { operator_count++; print_token("OPERATOR", yytext); }
"*="    { operator_count++; print_token("OPERATOR", yytext); }
"/="    { operator_count++; print_token("OPERATOR", yytext); }
"&"     { operator_count++; print_token("OPERATOR", yytext); }
"|"     { operator_count++; print_token("OPERATOR", yytext); }
"^"     { operator_count++; print_token("OPERATOR", yytext); }
"~"     { operator_count++; print_token("OPERATOR", yytext); }
"<<"    { operator_count++; print_token("OPERATOR", yytext); }
">>"    { operator_count++; print_token("OPERATOR", yytext); }
"->"    { operator_count++; print_token("OPERATOR", yytext); }
"."     { operator_count++; print_token("OPERATOR", yytext); }
"::"    { operator_count++; print_token("OPERATOR", yytext); }
"#"     { operator_count++; print_token("OPERATOR", yytext); }

 /* Delimiters */
"("     { delimiter_count++; print_token("DELIMITER", yytext); }
")"     { delimiter_count++; print_token("DELIMITER", yytext); }
"{"     { delimiter_count++; print_token("DELIMITER", yytext); }
"}"     { delimiter_count++; print_token("DELIMITER", yytext); }
"["     { delimiter_count++; print_token("DELIMITER", yytext); }
"]"     { delimiter_count++; print_token("DELIMITER", yytext); }
";"     { delimiter_count++; print_token("DELIMITER", yytext); }
","     { delimiter_count++; print_token("DELIMITER", yytext); }
":"     { delimiter_count++; print_token("DELIMITER", yytext); }

 /* Whitespace (skip but count) */
{WS}    { whitespace_count++; }

 /* Unknown characters */
.       { unknown_count++; print_token("UNKNOWN", yytext); }

%%

int main(void) {
    yylex();

    /* Print summary */
    printf("SUMMARY|keywords=%d|identifiers=%d|integers=%d|floats=%d|strings=%d|operators=%d|delimiters=%d|comments=%d|unknown=%d\n",
        keyword_count, identifier_count, integer_count, float_count,
        string_count, operator_count, delimiter_count, comment_count, unknown_count);

    return 0;
}
