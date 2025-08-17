/**
 * Formula Parser using Peggy-generated parser
 */

import type { ASTNode } from '../engine/types';

// This will be replaced by the generated parser from Peggy
// For now, we'll implement a simple recursive descent parser
// TODO: Replace with Peggy-generated parser

/**
 * Parse a formula string into an AST
 * @param formula - Formula string starting with =
 * @returns AST representing the formula
 */
export function parseFormula(formula: string): ASTNode {
  if (!formula.startsWith('=')) {
    throw new Error('Formula must start with =');
  }
  
  const expression = formula.substring(1).trim();
  return parseExpression(expression);
}

/**
 * Simple recursive descent parser for POC
 * This will be replaced by Peggy-generated parser
 */
function parseExpression(expr: string): ASTNode {
  const tokens = tokenize(expr);
  const parser = new FormulaParser(tokens);
  return parser.parseExpression();
}

/**
 * Tokenize formula expression
 */
function tokenize(expr: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  
  while (i < expr.length) {
    const char = expr[i];
    
    // Skip whitespace
    if (/\s/.test(char)) {
      i++;
      continue;
    }
    
    // Numbers
    if (/\d/.test(char)) {
      let numStr = '';
      while (i < expr.length && (/\d/.test(expr[i]) || expr[i] === '.')) {
        numStr += expr[i];
        i++;
      }
      tokens.push({ type: 'NUMBER', value: parseFloat(numStr) });
      continue;
    }
    
    // Cell references (A1, B2, etc.) and function names
    if (/[A-Za-z]/.test(char)) {
      let refStr = '';
      while (i < expr.length && (/[A-Za-z0-9]/.test(expr[i]))) {
        refStr += expr[i];
        i++;
      }
      
      // Check if it's a function or cell reference
      if (i < expr.length && expr[i] === '(') {
        tokens.push({ type: 'FUNCTION', value: refStr.toUpperCase() });
      } else {
        tokens.push({ type: 'CELL', value: refStr.toUpperCase() });
      }
      continue;
    }
    
    // Operators and punctuation
    switch (char) {
      case '+':
        tokens.push({ type: 'PLUS', value: '+' });
        break;
      case '-':
        tokens.push({ type: 'MINUS', value: '-' });
        break;
      case '*':
        tokens.push({ type: 'MULTIPLY', value: '*' });
        break;
      case '/':
        tokens.push({ type: 'DIVIDE', value: '/' });
        break;
      case '^':
        tokens.push({ type: 'POWER', value: '^' });
        break;
      case '(':
        tokens.push({ type: 'LPAREN', value: '(' });
        break;
      case ')':
        tokens.push({ type: 'RPAREN', value: ')' });
        break;
      case ':':
        tokens.push({ type: 'COLON', value: ':' });
        break;
      case ',':
        tokens.push({ type: 'COMMA', value: ',' });
        break;
      default:
        throw new Error(`Unexpected character: ${char}`);
    }
    i++;
  }
  
  return tokens;
}

interface Token {
  type: string;
  value: any;
}

/**
 * Simple recursive descent parser
 */
class FormulaParser {
  private tokens: Token[];
  private current = 0;
  
  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }
  
  parseExpression(): ASTNode {
    return this.parseAddition();
  }
  
  parseAddition(): ASTNode {
    let left = this.parseMultiplication();
    
    while (this.match('PLUS', 'MINUS')) {
      const operator = this.previous().value;
      const right = this.parseMultiplication();
      left = {
        type: 'binary',
        op: operator,
        left,
        right
      };
    }
    
    return left;
  }
  
  parseMultiplication(): ASTNode {
    let left = this.parsePower();
    
    while (this.match('MULTIPLY', 'DIVIDE')) {
      const operator = this.previous().value;
      const right = this.parsePower();
      left = {
        type: 'binary',
        op: operator,
        left,
        right
      };
    }
    
    return left;
  }
  
  parsePower(): ASTNode {
    let left = this.parseUnary();
    
    while (this.match('POWER')) {
      const operator = this.previous().value;
      const right = this.parseUnary();
      left = {
        type: 'binary',
        op: operator,
        left,
        right
      };
    }
    
    return left;
  }
  
  parseUnary(): ASTNode {
    if (this.match('MINUS', 'PLUS')) {
      const operator = this.previous().value;
      const operand = this.parseUnary();
      return {
        type: 'unary',
        op: operator,
        operand
      };
    }
    
    return this.parsePrimary();
  }
  
  parsePrimary(): ASTNode {
    if (this.match('NUMBER')) {
      return {
        type: 'number',
        value: this.previous().value
      };
    }
    
    if (this.match('CELL')) {
      const cellRef = this.previous().value;
      
      // Check for range (A1:B2)
      if (this.match('COLON')) {
        if (!this.match('CELL')) {
          throw new Error('Expected cell reference after :');
        }
        const endRef = this.previous().value;
        return {
          type: 'range',
          start: cellRef,
          end: endRef
        };
      }
      
      return {
        type: 'cell',
        ref: cellRef
      };
    }
    
    if (this.match('FUNCTION')) {
      const functionName = this.previous().value;
      
      if (!this.match('LPAREN')) {
        throw new Error('Expected ( after function name');
      }
      
      const args: ASTNode[] = [];
      
      if (!this.check('RPAREN')) {
        do {
          args.push(this.parseExpression());
        } while (this.match('COMMA'));
      }
      
      if (!this.match('RPAREN')) {
        throw new Error('Expected ) after function arguments');
      }
      
      return {
        type: 'function',
        name: functionName,
        args
      };
    }
    
    if (this.match('LPAREN')) {
      const expr = this.parseExpression();
      if (!this.match('RPAREN')) {
        throw new Error('Expected ) after expression');
      }
      return expr;
    }
    
    throw new Error(`Unexpected token: ${this.peek().type}`);
  }
  
  private match(...types: string[]): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }
    return false;
  }
  
  private check(type: string): boolean {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }
  
  private advance(): Token {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }
  
  private isAtEnd(): boolean {
    return this.current >= this.tokens.length;
  }
  
  private peek(): Token {
    if (this.isAtEnd()) {
      return { type: 'EOF', value: null };
    }
    return this.tokens[this.current];
  }
  
  private previous(): Token {
    return this.tokens[this.current - 1];
  }
}