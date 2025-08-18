/**
 * Mathematical functions for RCSV formula engine
 * Implements basic math operations like ABS, ROUND, POWER, etc.
 */

import type { ASTNode } from '../types';
import { BaseFunction, validateArgumentCount, toNumber } from './function-utils';

/**
 * ABS function - Returns the absolute value of a number
 * Usage: ABS(number)
 */
export class AbsFunction extends BaseFunction {
  execute(args: ASTNode[], evaluateAST: (node: ASTNode) => any): number {
    validateArgumentCount('ABS', args, 1);
    
    const value = evaluateAST(args[0]);
    const num = toNumber(value);
    return Math.abs(num);
  }
}

/**
 * ROUND function - Rounds a number to specified decimal places
 * Usage: ROUND(number, digits)
 */
export class RoundFunction extends BaseFunction {
  execute(args: ASTNode[], evaluateAST: (node: ASTNode) => any): number {
    validateArgumentCount('ROUND', args, 2);
    
    const value = evaluateAST(args[0]);
    const digits = evaluateAST(args[1]);
    
    const num = toNumber(value);
    const digitsNum = toNumber(digits);
    
    // Ensure digits is an integer
    const digitsInt = Math.floor(digitsNum);
    
    // Use the standard JavaScript rounding with precision
    const factor = Math.pow(10, digitsInt);
    return Math.round(num * factor) / factor;
  }
}

/**
 * POWER function - Returns the result of a number raised to a power
 * Usage: POWER(number, power) or use ^ operator
 */
export class PowerFunction extends BaseFunction {
  execute(args: ASTNode[], evaluateAST: (node: ASTNode) => any): number {
    validateArgumentCount('POWER', args, 2);
    
    const base = evaluateAST(args[0]);
    const exponent = evaluateAST(args[1]);
    
    const baseNum = toNumber(base);
    const expNum = toNumber(exponent);
    
    return Math.pow(baseNum, expNum);
  }
}

/**
 * SQRT function - Returns the square root of a number
 * Usage: SQRT(number)
 */
export class SqrtFunction extends BaseFunction {
  execute(args: ASTNode[], evaluateAST: (node: ASTNode) => any): number {
    validateArgumentCount('SQRT', args, 1);
    
    const value = evaluateAST(args[0]);
    const num = toNumber(value);
    
    if (num < 0) {
      throw new Error('#NUM!');
    }
    
    return Math.sqrt(num);
  }
}

/**
 * MOD function - Returns the remainder from division
 * Usage: MOD(number, divisor)
 */
export class ModFunction extends BaseFunction {
  execute(args: ASTNode[], evaluateAST: (node: ASTNode) => any): number {
    validateArgumentCount('MOD', args, 2);
    
    const dividend = evaluateAST(args[0]);
    const divisor = evaluateAST(args[1]);
    
    const dividendNum = toNumber(dividend);
    const divisorNum = toNumber(divisor);
    
    if (divisorNum === 0) {
      throw new Error('#DIV/0!');
    }
    
    return dividendNum % divisorNum;
  }
}

/**
 * CEILING function - Rounds a number up to the nearest integer or multiple
 * Usage: CEILING(number, significance)
 */
export class CeilingFunction extends BaseFunction {
  execute(args: ASTNode[], evaluateAST: (node: ASTNode) => any): number {
    validateArgumentCount('CEILING', args, 2);
    
    const number = evaluateAST(args[0]);
    const significance = evaluateAST(args[1]);
    
    const num = toNumber(number);
    const sig = toNumber(significance);
    
    if (sig === 0) {
      return 0;
    }
    
    return Math.ceil(num / sig) * sig;
  }
}

/**
 * FLOOR function - Rounds a number down to the nearest integer or multiple
 * Usage: FLOOR(number, significance)
 */
export class FloorFunction extends BaseFunction {
  execute(args: ASTNode[], evaluateAST: (node: ASTNode) => any): number {
    validateArgumentCount('FLOOR', args, 2);
    
    const number = evaluateAST(args[0]);
    const significance = evaluateAST(args[1]);
    
    const num = toNumber(number);
    const sig = toNumber(significance);
    
    if (sig === 0) {
      return 0;
    }
    
    return Math.floor(num / sig) * sig;
  }
}

/**
 * TRUNC function - Truncates a number to remove fractional part
 * Usage: TRUNC(number, digits)
 */
export class TruncFunction extends BaseFunction {
  execute(args: ASTNode[], evaluateAST: (node: ASTNode) => any): number {
    validateArgumentCount('TRUNC', args, 2);
    
    const number = evaluateAST(args[0]);
    const digits = evaluateAST(args[1]);
    
    const num = toNumber(number);
    const dig = Math.floor(toNumber(digits));
    
    const factor = Math.pow(10, dig);
    return Math.trunc(num * factor) / factor;
  }
}

/**
 * Export all math functions
 */
export const mathFunctions = {
  'ABS': new AbsFunction(),
  'ROUND': new RoundFunction(),
  'POWER': new PowerFunction(),
  'SQRT': new SqrtFunction(),
  'MOD': new ModFunction(),
  'CEILING': new CeilingFunction(),
  'FLOOR': new FloorFunction(),
  'TRUNC': new TruncFunction(),
};