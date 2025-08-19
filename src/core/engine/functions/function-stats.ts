/**
 * Statistical functions for RCSV formula engine
 * Implements SUM, AVERAGE, COUNT, MIN, MAX, and other statistical operations
 */

import type { ASTNode } from '../types';
import { 
  BaseFunction, 
  validateArgumentRange, 
  flattenToValues, 
  isNumeric, 
  isCountANonEmpty 
} from './function-utils';

/**
 * SUM function - Returns the sum of all numeric values
 * Usage: SUM(value1, [value2], ...)
 */
export class SumFunction extends BaseFunction {
  execute(args: ASTNode[], evaluateAST: (node: ASTNode) => any, _getCellValueAsNumber?: (ref: string) => number, _getCellValueAsString?: (ref: string) => string): number {
    validateArgumentRange('SUM', args, 1);
    
    const allNumbers = this.collectNumbers(args, evaluateAST);
    return allNumbers.reduce((sum, num) => sum + num, 0);
  }
}

/**
 * AVERAGE function - Returns the arithmetic mean of all numeric values
 * Usage: AVERAGE(value1, [value2], ...)
 */
export class AverageFunction extends BaseFunction {
  execute(args: ASTNode[], evaluateAST: (node: ASTNode) => any, _getCellValueAsNumber?: (ref: string) => number, _getCellValueAsString?: (ref: string) => string): number {
    validateArgumentRange('AVERAGE', args, 1);
    
    const allNumbers = this.collectNumbers(args, evaluateAST);
    
    if (allNumbers.length === 0) {
      throw new Error('#DIV/0!');
    }
    
    return allNumbers.reduce((sum, num) => sum + num, 0) / allNumbers.length;
  }
}

/**
 * COUNT function - Counts how many cells contain numbers
 * Usage: COUNT(value1, [value2], ...)
 */
export class CountFunction extends BaseFunction {
  execute(args: ASTNode[], evaluateAST: (node: ASTNode) => any, _getCellValueAsNumber?: (ref: string) => number, _getCellValueAsString?: (ref: string) => string): number {
    validateArgumentRange('COUNT', args, 1);
    
    let count = 0;
    for (const arg of args) {
      const values = flattenToValues(evaluateAST(arg));
      count += values.filter(v => isNumeric(v)).length;
    }
    return count;
  }
}

/**
 * COUNTA function - Counts how many cells are not empty
 * Usage: COUNTA(value1, [value2], ...)
 */
export class CountAFunction extends BaseFunction {
  execute(args: ASTNode[], evaluateAST: (node: ASTNode) => any, _getCellValueAsNumber?: (ref: string) => number, _getCellValueAsString?: (ref: string) => string, getRangeRawValues?: (start: string, end: string) => any[]): number {
    validateArgumentRange('COUNTA', args, 1);
    
    let count = 0;
    for (const arg of args) {
      if (arg.type === 'range' && getRangeRawValues) {
        // For ranges, get raw cell values to check if they're truly empty
        const rawValues = getRangeRawValues(arg.start, arg.end);
        count += rawValues.filter(v => isCountANonEmpty(v)).length;
      } else {
        // For individual cells or expressions, use normal evaluation
        const values = flattenToValues(evaluateAST(arg));
        count += values.filter(v => isCountANonEmpty(v)).length;
      }
    }
    return count;
  }
}

/**
 * MIN function - Returns the smallest numeric value
 * Usage: MIN(value1, [value2], ...)
 */
export class MinFunction extends BaseFunction {
  execute(args: ASTNode[], evaluateAST: (node: ASTNode) => any, _getCellValueAsNumber?: (ref: string) => number, _getCellValueAsString?: (ref: string) => string): number {
    validateArgumentRange('MIN', args, 1);
    
    const allNumbers = this.collectNumbers(args, evaluateAST);
    
    if (allNumbers.length === 0) {
      throw new Error('No values for MIN');
    }
    
    return Math.min(...allNumbers);
  }
}

/**
 * MAX function - Returns the largest numeric value
 * Usage: MAX(value1, [value2], ...)
 */
export class MaxFunction extends BaseFunction {
  execute(args: ASTNode[], evaluateAST: (node: ASTNode) => any, _getCellValueAsNumber?: (ref: string) => number, _getCellValueAsString?: (ref: string) => string): number {
    validateArgumentRange('MAX', args, 1);
    
    const allNumbers = this.collectNumbers(args, evaluateAST);
    
    if (allNumbers.length === 0) {
      throw new Error('No values for MAX');
    }
    
    return Math.max(...allNumbers);
  }
}

/**
 * MEDIAN function - Returns the median value
 * Usage: MEDIAN(value1, [value2], ...)
 */
export class MedianFunction extends BaseFunction {
  execute(args: ASTNode[], evaluateAST: (node: ASTNode) => any, _getCellValueAsNumber?: (ref: string) => number, _getCellValueAsString?: (ref: string) => string): number {
    validateArgumentRange('MEDIAN', args, 1);
    
    const allNumbers = this.collectNumbers(args, evaluateAST);
    
    if (allNumbers.length === 0) {
      throw new Error('No values for MEDIAN');
    }
    
    // Sort numbers
    const sorted = allNumbers.sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    
    if (sorted.length % 2 === 0) {
      // Even number of values - average the two middle values
      return (sorted[mid - 1] + sorted[mid]) / 2;
    } else {
      // Odd number of values - return the middle value
      return sorted[mid];
    }
  }
}

/**
 * MODE function - Returns the most frequently occurring value
 * Usage: MODE(value1, [value2], ...)
 */
export class ModeFunction extends BaseFunction {
  execute(args: ASTNode[], evaluateAST: (node: ASTNode) => any, _getCellValueAsNumber?: (ref: string) => number, _getCellValueAsString?: (ref: string) => string): number {
    validateArgumentRange('MODE', args, 1);
    
    const allNumbers = this.collectNumbers(args, evaluateAST);
    
    if (allNumbers.length === 0) {
      throw new Error('No values for MODE');
    }
    
    // Count frequency of each number
    const frequency = new Map<number, number>();
    for (const num of allNumbers) {
      frequency.set(num, (frequency.get(num) || 0) + 1);
    }
    
    // Find the number(s) with highest frequency
    let maxFreq = 0;
    let modes: number[] = [];
    
    for (const [num, freq] of frequency.entries()) {
      if (freq > maxFreq) {
        maxFreq = freq;
        modes = [num];
      } else if (freq === maxFreq) {
        modes.push(num);
      }
    }
    
    // If all numbers appear only once, there's no mode
    if (maxFreq === 1) {
      throw new Error('#N/A');
    }
    
    // Return the smallest mode if there are multiple
    return Math.min(...modes);
  }
}

/**
 * VAR function - Returns the variance (sample variance)
 * Usage: VAR(value1, [value2], ...)
 */
export class VarFunction extends BaseFunction {
  execute(args: ASTNode[], evaluateAST: (node: ASTNode) => any, _getCellValueAsNumber?: (ref: string) => number, _getCellValueAsString?: (ref: string) => string): number {
    validateArgumentRange('VAR', args, 1);
    
    const allNumbers = this.collectNumbers(args, evaluateAST);
    
    if (allNumbers.length < 2) {
      throw new Error('#DIV/0!');
    }
    
    const mean = allNumbers.reduce((sum, num) => sum + num, 0) / allNumbers.length;
    const variance = allNumbers.reduce((sum, num) => sum + Math.pow(num - mean, 2), 0) / (allNumbers.length - 1);
    
    return variance;
  }
}

/**
 * STDEV function - Returns the standard deviation (sample standard deviation)
 * Usage: STDEV(value1, [value2], ...)
 */
export class StdevFunction extends BaseFunction {
  execute(args: ASTNode[], evaluateAST: (node: ASTNode) => any, _getCellValueAsNumber?: (ref: string) => number, _getCellValueAsString?: (ref: string) => string): number {
    validateArgumentRange('STDEV', args, 1);
    
    // Use VAR function and take square root
    const variance = new VarFunction().execute(args, evaluateAST);
    return Math.sqrt(variance);
  }
}

/**
 * Export all statistical functions
 */
export const statsFunctions = {
  'SUM': new SumFunction(),
  'AVERAGE': new AverageFunction(),
  'COUNT': new CountFunction(),
  'COUNTA': new CountAFunction(),
  'MIN': new MinFunction(),
  'MAX': new MaxFunction(),
  'MEDIAN': new MedianFunction(),
  'MODE': new ModeFunction(),
  'VAR': new VarFunction(),
  'STDEV': new StdevFunction(),
};