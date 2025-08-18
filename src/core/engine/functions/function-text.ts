/**
 * Text functions for RCSV formula engine
 * Implements string manipulation functions like LEFT, RIGHT, CONCAT, etc.
 * 
 * Note: This module is prepared for future implementation
 * Currently contains placeholder structure for MVP development
 */

import type { ASTNode } from '../types';
import { BaseFunction, validateArgumentCount, validateArgumentRange, toString, toNumber } from './function-utils';

/**
 * CONCATENATE function - Joins multiple text strings into one string
 * Usage: CONCATENATE(text1, [text2], ...)
 */
export class ConcatenateFunction extends BaseFunction {
  execute(args: ASTNode[], evaluateAST: (node: ASTNode) => any): string {
    validateArgumentRange('CONCATENATE', args, 1);
    
    let result = '';
    for (const arg of args) {
      const value = evaluateAST(arg);
      result += toString(value);
    }
    
    return result;
  }
}

/**
 * LEFT function - Returns leftmost characters from a string
 * Usage: LEFT(text, num_chars)
 */
export class LeftFunction extends BaseFunction {
  execute(args: ASTNode[], evaluateAST: (node: ASTNode) => any): string {
    validateArgumentCount('LEFT', args, 2);
    
    const text = toString(evaluateAST(args[0]));
    const numChars = Math.floor(toNumber(evaluateAST(args[1])));
    
    if (numChars < 0) {
      throw new Error('#VALUE!');
    }
    
    return text.substring(0, numChars);
  }
}

/**
 * RIGHT function - Returns rightmost characters from a string
 * Usage: RIGHT(text, num_chars)
 */
export class RightFunction extends BaseFunction {
  execute(args: ASTNode[], evaluateAST: (node: ASTNode) => any): string {
    validateArgumentCount('RIGHT', args, 2);
    
    const text = toString(evaluateAST(args[0]));
    const numChars = Math.floor(toNumber(evaluateAST(args[1])));
    
    if (numChars < 0) {
      throw new Error('#VALUE!');
    }
    
    return text.substring(Math.max(0, text.length - numChars));
  }
}

/**
 * MID function - Returns characters from middle of a string
 * Usage: MID(text, start_num, num_chars)
 */
export class MidFunction extends BaseFunction {
  execute(args: ASTNode[], evaluateAST: (node: ASTNode) => any): string {
    validateArgumentCount('MID', args, 3);
    
    const text = toString(evaluateAST(args[0]));
    const startNum = Math.floor(toNumber(evaluateAST(args[1])));
    const numChars = Math.floor(toNumber(evaluateAST(args[2])));
    
    if (startNum < 1 || numChars < 0) {
      throw new Error('#VALUE!');
    }
    
    // Excel uses 1-based indexing
    const startIndex = startNum - 1;
    return text.substring(startIndex, startIndex + numChars);
  }
}

/**
 * LEN function - Returns the length of a string
 * Usage: LEN(text)
 */
export class LenFunction extends BaseFunction {
  execute(args: ASTNode[], evaluateAST: (node: ASTNode) => any): number {
    validateArgumentCount('LEN', args, 1);
    
    const text = toString(evaluateAST(args[0]));
    return text.length;
  }
}

/**
 * UPPER function - Converts text to uppercase
 * Usage: UPPER(text)
 */
export class UpperFunction extends BaseFunction {
  execute(args: ASTNode[], evaluateAST: (node: ASTNode) => any): string {
    validateArgumentCount('UPPER', args, 1);
    
    const text = toString(evaluateAST(args[0]));
    return text.toUpperCase();
  }
}

/**
 * LOWER function - Converts text to lowercase
 * Usage: LOWER(text)
 */
export class LowerFunction extends BaseFunction {
  execute(args: ASTNode[], evaluateAST: (node: ASTNode) => any): string {
    validateArgumentCount('LOWER', args, 1);
    
    const text = toString(evaluateAST(args[0]));
    return text.toLowerCase();
  }
}

/**
 * TRIM function - Removes leading and trailing spaces
 * Usage: TRIM(text)
 */
export class TrimFunction extends BaseFunction {
  execute(args: ASTNode[], evaluateAST: (node: ASTNode) => any): string {
    validateArgumentCount('TRIM', args, 1);
    
    const text = toString(evaluateAST(args[0]));
    return text.trim();
  }
}

/**
 * Export all text functions
 * Note: Additional functions like FIND, REPLACE, SUBSTITUTE will be added in future versions
 */
export const textFunctions = {
  'CONCATENATE': new ConcatenateFunction(),
  'LEFT': new LeftFunction(),
  'RIGHT': new RightFunction(),
  'MID': new MidFunction(),
  'LEN': new LenFunction(),
  'UPPER': new UpperFunction(),
  'LOWER': new LowerFunction(),
  'TRIM': new TrimFunction(),
};