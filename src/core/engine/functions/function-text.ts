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
  execute(args: ASTNode[], evaluateAST: (node: ASTNode) => any, getCellValueAsNumber: (ref: string) => number, getCellValueAsString: (ref: string) => string): string {
    validateArgumentRange('CONCATENATE', args, 1);
    
    let result = '';
    for (const arg of args) {
      const value = arg.type === 'cell' ? getCellValueAsString(arg.ref) : evaluateAST(arg);
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
  execute(args: ASTNode[], evaluateAST: (node: ASTNode) => any, getCellValueAsNumber: (ref: string) => number, getCellValueAsString: (ref: string) => string): string {
    validateArgumentCount('LEFT', args, 2);
    
    // Use string resolver for text parameter, number resolver for numeric parameter
    const text = args[0].type === 'cell' ? getCellValueAsString(args[0].ref) : toString(evaluateAST(args[0]));
    const numChars = args[1].type === 'cell' ? getCellValueAsNumber(args[1].ref) : Math.floor(toNumber(evaluateAST(args[1])));
    
    if (numChars < 0) {
      throw new Error('#VALUE!');
    }
    
    // Use Array.from to handle Unicode characters properly
    const chars = Array.from(text);
    return chars.slice(0, numChars).join('');
  }
}

/**
 * RIGHT function - Returns rightmost characters from a string
 * Usage: RIGHT(text, num_chars)
 */
export class RightFunction extends BaseFunction {
  execute(args: ASTNode[], evaluateAST: (node: ASTNode) => any, getCellValueAsNumber: (ref: string) => number, getCellValueAsString: (ref: string) => string): string {
    validateArgumentCount('RIGHT', args, 2);
    
    const text = args[0].type === 'cell' ? getCellValueAsString(args[0].ref) : toString(evaluateAST(args[0]));
    const numChars = args[1].type === 'cell' ? getCellValueAsNumber(args[1].ref) : Math.floor(toNumber(evaluateAST(args[1])));
    
    if (numChars < 0) {
      throw new Error('#VALUE!');
    }
    
    if (numChars === 0) {
      return '';
    }
    
    // Use Array.from to handle Unicode characters properly
    const chars = Array.from(text);
    return chars.slice(-numChars).join('');
  }
}

/**
 * MID function - Returns characters from middle of a string
 * Usage: MID(text, start_num, num_chars)
 */
export class MidFunction extends BaseFunction {
  execute(args: ASTNode[], evaluateAST: (node: ASTNode) => any, getCellValueAsNumber: (ref: string) => number, getCellValueAsString: (ref: string) => string): string {
    validateArgumentCount('MID', args, 3);
    
    const text = args[0].type === 'cell' ? getCellValueAsString(args[0].ref) : toString(evaluateAST(args[0]));
    const startNum = args[1].type === 'cell' ? getCellValueAsNumber(args[1].ref) : Math.floor(toNumber(evaluateAST(args[1])));
    const numChars = args[2].type === 'cell' ? getCellValueAsNumber(args[2].ref) : Math.floor(toNumber(evaluateAST(args[2])));
    
    if (startNum < 1 || numChars < 0) {
      throw new Error('#VALUE!');
    }
    
    // Use Array.from to handle Unicode characters properly
    const chars = Array.from(text);
    // Excel uses 1-based indexing
    const startIndex = startNum - 1;
    return chars.slice(startIndex, startIndex + numChars).join('');
  }
}

/**
 * LEN function - Returns the length of a string
 * Usage: LEN(text)
 */
export class LenFunction extends BaseFunction {
  execute(args: ASTNode[], evaluateAST: (node: ASTNode) => any, getCellValueAsNumber: (ref: string) => number, getCellValueAsString: (ref: string) => string): number {
    validateArgumentCount('LEN', args, 1);
    
    const text = args[0].type === 'cell' ? getCellValueAsString(args[0].ref) : toString(evaluateAST(args[0]));
    // Use Array.from to count Unicode characters properly
    return Array.from(text).length;
  }
}

/**
 * UPPER function - Converts text to uppercase
 * Usage: UPPER(text)
 */
export class UpperFunction extends BaseFunction {
  execute(args: ASTNode[], evaluateAST: (node: ASTNode) => any, getCellValueAsNumber: (ref: string) => number, getCellValueAsString: (ref: string) => string): string {
    validateArgumentCount('UPPER', args, 1);
    
    const text = args[0].type === 'cell' ? getCellValueAsString(args[0].ref) : toString(evaluateAST(args[0]));
    return text.toUpperCase();
  }
}

/**
 * LOWER function - Converts text to lowercase
 * Usage: LOWER(text)
 */
export class LowerFunction extends BaseFunction {
  execute(args: ASTNode[], evaluateAST: (node: ASTNode) => any, getCellValueAsNumber: (ref: string) => number, getCellValueAsString: (ref: string) => string): string {
    validateArgumentCount('LOWER', args, 1);
    
    const text = args[0].type === 'cell' ? getCellValueAsString(args[0].ref) : toString(evaluateAST(args[0]));
    return text.toLowerCase();
  }
}

/**
 * TRIM function - Removes leading and trailing spaces
 * Usage: TRIM(text)
 */
export class TrimFunction extends BaseFunction {
  execute(args: ASTNode[], evaluateAST: (node: ASTNode) => any, getCellValueAsNumber: (ref: string) => number, getCellValueAsString: (ref: string) => string): string {
    validateArgumentCount('TRIM', args, 1);
    
    const text = args[0].type === 'cell' ? getCellValueAsString(args[0].ref) : toString(evaluateAST(args[0]));
    return text.trim();
  }
}

/**
 * FIND function - Returns position of substring (case-sensitive)
 * Usage: FIND(find_text, within_text, [start_num])
 */
export class FindFunction extends BaseFunction {
  execute(args: ASTNode[], evaluateAST: (node: ASTNode) => any, getCellValueAsNumber: (ref: string) => number, getCellValueAsString: (ref: string) => string): number {
    validateArgumentRange('FIND', args, 2, 3);
    
    const findText = args[0].type === 'cell' ? getCellValueAsString(args[0].ref) : toString(evaluateAST(args[0]));
    const withinText = args[1].type === 'cell' ? getCellValueAsString(args[1].ref) : toString(evaluateAST(args[1]));
    const startNum = args.length > 2 ? (args[2].type === 'cell' ? getCellValueAsNumber(args[2].ref) : Math.floor(toNumber(evaluateAST(args[2])))) : 1;
    
    if (startNum < 1) {
      throw new Error('#VALUE!');
    }
    
    // Excel uses 1-based indexing
    const startIndex = startNum - 1;
    const position = withinText.indexOf(findText, startIndex);
    
    if (position === -1) {
      throw new Error('#VALUE!');
    }
    
    return position + 1; // Convert back to 1-based
  }
}

/**
 * SEARCH function - Returns position of substring (case-insensitive)
 * Usage: SEARCH(find_text, within_text, [start_num])
 */
export class SearchFunction extends BaseFunction {
  execute(args: ASTNode[], evaluateAST: (node: ASTNode) => any, getCellValueAsNumber: (ref: string) => number, getCellValueAsString: (ref: string) => string): number {
    validateArgumentRange('SEARCH', args, 2, 3);
    
    const findText = (args[0].type === 'cell' ? getCellValueAsString(args[0].ref) : toString(evaluateAST(args[0]))).toLowerCase();
    const withinText = (args[1].type === 'cell' ? getCellValueAsString(args[1].ref) : toString(evaluateAST(args[1]))).toLowerCase();
    const startNum = args.length > 2 ? (args[2].type === 'cell' ? getCellValueAsNumber(args[2].ref) : Math.floor(toNumber(evaluateAST(args[2])))) : 1;
    
    if (startNum < 1) {
      throw new Error('#VALUE!');
    }
    
    // Excel uses 1-based indexing
    const startIndex = startNum - 1;
    const position = withinText.indexOf(findText, startIndex);
    
    if (position === -1) {
      throw new Error('#VALUE!');
    }
    
    return position + 1; // Convert back to 1-based
  }
}

/**
 * REPLACE function - Replaces characters at specific position
 * Usage: REPLACE(old_text, start_num, num_chars, new_text)
 */
export class ReplaceFunction extends BaseFunction {
  execute(args: ASTNode[], evaluateAST: (node: ASTNode) => any, getCellValueAsNumber: (ref: string) => number, getCellValueAsString: (ref: string) => string): string {
    validateArgumentCount('REPLACE', args, 4);
    
    const oldText = args[0].type === 'cell' ? getCellValueAsString(args[0].ref) : toString(evaluateAST(args[0]));
    const startNum = args[1].type === 'cell' ? getCellValueAsNumber(args[1].ref) : Math.floor(toNumber(evaluateAST(args[1])));
    const numChars = args[2].type === 'cell' ? getCellValueAsNumber(args[2].ref) : Math.floor(toNumber(evaluateAST(args[2])));
    const newText = args[3].type === 'cell' ? getCellValueAsString(args[3].ref) : toString(evaluateAST(args[3]));
    
    if (startNum < 1 || numChars < 0) {
      throw new Error('#VALUE!');
    }
    
    // Excel uses 1-based indexing
    const startIndex = startNum - 1;
    const beforeReplace = oldText.substring(0, startIndex);
    const afterReplace = oldText.substring(startIndex + numChars);
    
    return beforeReplace + newText + afterReplace;
  }
}

/**
 * SUBSTITUTE function - Replaces occurrences of substring
 * Usage: SUBSTITUTE(text, old_text, new_text, [instance_num])
 */
export class SubstituteFunction extends BaseFunction {
  execute(args: ASTNode[], evaluateAST: (node: ASTNode) => any, getCellValueAsNumber: (ref: string) => number, getCellValueAsString: (ref: string) => string): string {
    validateArgumentRange('SUBSTITUTE', args, 3, 4);
    
    const text = args[0].type === 'cell' ? getCellValueAsString(args[0].ref) : toString(evaluateAST(args[0]));
    const oldText = args[1].type === 'cell' ? getCellValueAsString(args[1].ref) : toString(evaluateAST(args[1]));
    const newText = args[2].type === 'cell' ? getCellValueAsString(args[2].ref) : toString(evaluateAST(args[2]));
    const instanceNum = args.length > 3 ? (args[3].type === 'cell' ? getCellValueAsNumber(args[3].ref) : Math.floor(toNumber(evaluateAST(args[3])))) : null;
    
    if (instanceNum !== null && instanceNum < 1) {
      throw new Error('#VALUE!');
    }
    
    if (oldText === '') {
      return text; // Can't replace empty string
    }
    
    if (instanceNum === null) {
      // Replace all occurrences
      return text.split(oldText).join(newText);
    } else {
      // Replace only the specified instance
      let result = text;
      let currentInstance = 0;
      let searchStart = 0;
      
      while (true) {
        const pos = result.indexOf(oldText, searchStart);
        if (pos === -1) break;
        
        currentInstance++;
        if (currentInstance === instanceNum) {
          result = result.substring(0, pos) + newText + result.substring(pos + oldText.length);
          break;
        }
        
        searchStart = pos + oldText.length;
      }
      
      return result;
    }
  }
}

/**
 * REPT function - Repeats text a specified number of times
 * Usage: REPT(text, number_times)
 */
export class ReptFunction extends BaseFunction {
  execute(args: ASTNode[], evaluateAST: (node: ASTNode) => any, getCellValueAsNumber: (ref: string) => number, getCellValueAsString: (ref: string) => string): string {
    validateArgumentCount('REPT', args, 2);
    
    const text = args[0].type === 'cell' ? getCellValueAsString(args[0].ref) : toString(evaluateAST(args[0]));
    const numberTimes = args[1].type === 'cell' ? getCellValueAsNumber(args[1].ref) : Math.floor(toNumber(evaluateAST(args[1])));
    
    if (numberTimes < 0) {
      throw new Error('#VALUE!');
    }
    
    if (numberTimes === 0) {
      return '';
    }
    
    // Prevent excessive memory usage
    if (numberTimes > 32767 || (text.length * numberTimes) > 32767) {
      throw new Error('#VALUE!');
    }
    
    return text.repeat(numberTimes);
  }
}

/**
 * EXACT function - Compares two strings exactly (case-sensitive)
 * Usage: EXACT(text1, text2)
 */
export class ExactFunction extends BaseFunction {
  execute(args: ASTNode[], evaluateAST: (node: ASTNode) => any, getCellValueAsNumber: (ref: string) => number, getCellValueAsString: (ref: string) => string): boolean {
    validateArgumentCount('EXACT', args, 2);
    
    const text1 = args[0].type === 'cell' ? getCellValueAsString(args[0].ref) : toString(evaluateAST(args[0]));
    const text2 = args[1].type === 'cell' ? getCellValueAsString(args[1].ref) : toString(evaluateAST(args[1]));
    
    return text1 === text2;
  }
}

/**
 * CHAR function - Converts number to ASCII character
 * Usage: CHAR(number)
 */
export class CharFunction extends BaseFunction {
  execute(args: ASTNode[], evaluateAST: (node: ASTNode) => any, getCellValueAsNumber: (ref: string) => number, getCellValueAsString: (ref: string) => string): string {
    validateArgumentCount('CHAR', args, 1);
    
    const num = args[0].type === 'cell' ? getCellValueAsNumber(args[0].ref) : Math.floor(toNumber(evaluateAST(args[0])));
    
    if (num < 1 || num > 255) {
      throw new Error('#VALUE!');
    }
    
    return String.fromCharCode(num);
  }
}


/**
 * VALUE function - Converts text to number
 * Usage: VALUE(text)
 */
export class ValueFunction extends BaseFunction {
  execute(args: ASTNode[], evaluateAST: (node: ASTNode) => any, getCellValueAsNumber: (ref: string) => number, getCellValueAsString: (ref: string) => string): number {
    validateArgumentCount('VALUE', args, 1);
    
    const text = (args[0].type === 'cell' ? getCellValueAsString(args[0].ref) : toString(evaluateAST(args[0]))).trim();
    
    if (text === '') {
      return 0;
    }
    
    // Handle percentage
    if (text.endsWith('%')) {
      const numPart = text.slice(0, -1);
      const num = parseFloat(numPart);
      if (isNaN(num)) {
        throw new Error('#VALUE!');
      }
      return num / 100;
    }
    
    // Handle currency symbols (basic)
    const cleanText = text.replace(/^[\$£€¥₹]/, '').replace(/[,\s]/g, '');
    const num = parseFloat(cleanText);
    
    if (isNaN(num)) {
      throw new Error('#VALUE!');
    }
    
    return num;
  }
}

/**
 * TEXT function - Formats number as text with format string
 * Usage: TEXT(value, format_text)
 */
export class TextFunction extends BaseFunction {
  execute(args: ASTNode[], evaluateAST: (node: ASTNode) => any, getCellValueAsNumber: (ref: string) => number, getCellValueAsString: (ref: string) => string): string {
    validateArgumentCount('TEXT', args, 2);
    
    const value = args[0].type === 'cell' ? getCellValueAsNumber(args[0].ref) : toNumber(evaluateAST(args[0]));
    const formatText = args[1].type === 'cell' ? getCellValueAsString(args[1].ref) : toString(evaluateAST(args[1]));
    
    // Basic format implementations (subset of Excel formats)
    switch (formatText.toLowerCase()) {
      case '0':
        return Math.round(value).toString();
      case '0.0':
        return value.toFixed(1);
      case '0.00':
        return value.toFixed(2);
      case '#,##0':
        return Math.round(value).toLocaleString();
      case '#,##0.00':
        return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      case '0%':
        return Math.round(value * 100) + '%';
      case '0.0%':
        return (value * 100).toFixed(1) + '%';
      case '0.00%':
        return (value * 100).toFixed(2) + '%';
      case 'yyyy-mm-dd':
        // Simple date formatting (assumes value is Excel date serial)
        const date = new Date((value - 25569) * 86400 * 1000);
        return date.toISOString().split('T')[0];
      case 'mm/dd/yyyy':
        const dateUS = new Date((value - 25569) * 86400 * 1000);
        return (dateUS.getMonth() + 1).toString().padStart(2, '0') + '/' + 
               dateUS.getDate().toString().padStart(2, '0') + '/' + 
               dateUS.getFullYear();
      default:
        // Fallback to simple number formatting
        return value.toString();
    }
  }
}

/**
 * Export all text functions
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
  'FIND': new FindFunction(),
  'SEARCH': new SearchFunction(),
  'REPLACE': new ReplaceFunction(),
  'SUBSTITUTE': new SubstituteFunction(),
  'REPT': new ReptFunction(),
  'EXACT': new ExactFunction(),
  'CHAR': new CharFunction(),
  'VALUE': new ValueFunction(),
  'TEXT': new TextFunction(),
};