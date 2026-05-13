# Makefile for Flex Lexical Analyzer

CC      = gcc
FLEX    = flex
TARGET  = lexer
SRC     = lexer.l
GEN_C   = lex.yy.c

.PHONY: all clean install-deps

all: $(TARGET)

$(TARGET): $(GEN_C)
	$(CC) -o $(TARGET) $(GEN_C) -lfl

$(GEN_C): $(SRC)
	$(FLEX) $(SRC)

clean:
	rm -f $(GEN_C) $(TARGET)

install-deps:
	@echo "Installing flex..."
	@which flex > /dev/null 2>&1 || (apt-get update && apt-get install -y flex)
	@echo "flex is ready."
