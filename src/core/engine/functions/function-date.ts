/**
 * Date and time functions for RCSV formula engine
 * Implements NOW, TODAY, DATE, YEAR, MONTH, DAY, etc.
 * 
 * Note: This module is prepared for future implementation
 * Currently contains placeholder structure for MVP development
 */

import type { ASTNode } from '../types';
import { BaseFunction, validateArgumentCount, toNumber } from './function-utils';

/**
 * NOW function - Returns the current date and time
 * Usage: NOW()
 */
export class NowFunction extends BaseFunction {
  execute(args: ASTNode[], _evaluateAST: (node: ASTNode) => any, _getCellValueAsNumber?: (ref: string) => number, _getCellValueAsString?: (ref: string) => string): Date {
    validateArgumentCount('NOW', args, 0);
    
    return new Date();
  }
}

/**
 * TODAY function - Returns the current date (without time)
 * Usage: TODAY()
 */
export class TodayFunction extends BaseFunction {
  execute(args: ASTNode[], _evaluateAST: (node: ASTNode) => any, _getCellValueAsNumber?: (ref: string) => number, _getCellValueAsString?: (ref: string) => string): Date {
    validateArgumentCount('TODAY', args, 0);
    
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
}

/**
 * DATE function - Returns a date from year, month, day values
 * Usage: DATE(year, month, day)
 */
export class DateFunction extends BaseFunction {
  execute(args: ASTNode[], evaluateAST: (node: ASTNode) => any, _getCellValueAsNumber?: (ref: string) => number, _getCellValueAsString?: (ref: string) => string): Date {
    validateArgumentCount('DATE', args, 3);
    
    const year = Math.floor(toNumber(evaluateAST(args[0])));
    const month = Math.floor(toNumber(evaluateAST(args[1])));
    const day = Math.floor(toNumber(evaluateAST(args[2])));
    
    // JavaScript Date constructor uses 0-based months
    return new Date(year, month - 1, day);
  }
}

/**
 * YEAR function - Returns the year from a date
 * Usage: YEAR(date)
 */
export class YearFunction extends BaseFunction {
  execute(args: ASTNode[], evaluateAST: (node: ASTNode) => any, _getCellValueAsNumber?: (ref: string) => number, _getCellValueAsString?: (ref: string) => string): number {
    validateArgumentCount('YEAR', args, 1);
    
    const value = evaluateAST(args[0]);
    
    let date: Date;
    if (value instanceof Date) {
      date = value;
    } else {
      date = new Date(value);
    }
    
    if (isNaN(date.getTime())) {
      throw new Error('#VALUE!');
    }
    
    return date.getFullYear();
  }
}

/**
 * MONTH function - Returns the month from a date
 * Usage: MONTH(date)
 */
export class MonthFunction extends BaseFunction {
  execute(args: ASTNode[], evaluateAST: (node: ASTNode) => any, _getCellValueAsNumber?: (ref: string) => number, _getCellValueAsString?: (ref: string) => string): number {
    validateArgumentCount('MONTH', args, 1);
    
    const value = evaluateAST(args[0]);
    
    let date: Date;
    if (value instanceof Date) {
      date = value;
    } else {
      date = new Date(value);
    }
    
    if (isNaN(date.getTime())) {
      throw new Error('#VALUE!');
    }
    
    // JavaScript returns 0-based months, Excel expects 1-based
    return date.getMonth() + 1;
  }
}

/**
 * DAY function - Returns the day from a date
 * Usage: DAY(date)
 */
export class DayFunction extends BaseFunction {
  execute(args: ASTNode[], evaluateAST: (node: ASTNode) => any, _getCellValueAsNumber?: (ref: string) => number, _getCellValueAsString?: (ref: string) => string): number {
    validateArgumentCount('DAY', args, 1);
    
    const value = evaluateAST(args[0]);
    
    let date: Date;
    if (value instanceof Date) {
      date = value;
    } else {
      date = new Date(value);
    }
    
    if (isNaN(date.getTime())) {
      throw new Error('#VALUE!');
    }
    
    return date.getDate();
  }
}

/**
 * Export all date functions
 * Note: Additional functions like DATEDIF, WEEKDAY, WORKDAY will be added in future versions
 */
export const dateFunctions = {
  'NOW': new NowFunction(),
  'TODAY': new TodayFunction(),
  'DATE': new DateFunction(),
  'YEAR': new YearFunction(),
  'MONTH': new MonthFunction(),
  'DAY': new DayFunction(),
};