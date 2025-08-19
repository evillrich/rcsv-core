/**
 * Common utility functions for spreadsheet function implementations
 * Provides type coercion, validation, and helper functions used across all function modules
 */

import type { ASTNode } from '../types';

/**
 * Convert any value to a number for mathematical operations
 * @param value - Value to convert
 * @returns Numeric representation
 * @throws Error if conversion fails
 */
export function toNumber(value: any): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const num = parseFloat(value);
    if (isNaN(num)) throw new Error(`Cannot convert '${value}' to number`);
    return num;
  }
  if (typeof value === 'boolean') return value ? 1 : 0;
  throw new Error(`Cannot convert ${typeof value} to number`);
}

/**
 * Convert any value to a string
 * @param value - Value to convert
 * @returns String representation
 */
export function toString(value: any): string {
  if (value === null || value === undefined) return '';
  return String(value);
}

/**
 * Convert any value to a boolean
 * @param value - Value to convert
 * @returns Boolean representation
 */
export function toBoolean(value: any): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') {
    const lower = value.toLowerCase().trim();
    if (['true', 'yes', 'y', '1'].includes(lower)) return true;
    if (['false', 'no', 'n', '0', ''].includes(lower)) return false;
    // Non-empty strings are truthy
    return value.trim() !== '';
  }
  if (value === null || value === undefined) return false;
  return Boolean(value);
}

/**
 * Flatten a value or array to an array of numbers
 * @param value - Value to flatten
 * @returns Array of numbers
 */
export function flattenToNumbers(value: any): number[] {
  if (Array.isArray(value)) {
    return value.map(v => toNumber(v));
  }
  return [toNumber(value)];
}

/**
 * Flatten a value or array to an array of values
 * @param value - Value to flatten
 * @returns Array of values
 */
export function flattenToValues(value: any): any[] {
  if (Array.isArray(value)) {
    return value;
  }
  return [value];
}

/**
 * Check if a value is numeric (for COUNT function)
 * @param value - Value to check
 * @returns True if value can be treated as a number
 */
export function isNumeric(value: any): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'number') return !isNaN(value);
  if (typeof value === 'string') {
    // Try to parse as number, return false if it fails
    const num = parseFloat(value);
    return !isNaN(num) && isFinite(num);
  }
  if (typeof value === 'boolean') return true; // Booleans can be converted to numbers
  return false;
}

/**
 * COUNTA-specific non-empty check
 * For COUNTA: only null/undefined are considered empty
 * Empty strings (""), whitespace, and all other values count as non-empty
 * @param value - Value to check
 * @returns True if value should be counted by COUNTA
 */
export function isCountANonEmpty(value: any): boolean {
  return value !== null && value !== undefined;
}

/**
 * General non-empty check
 * @param value - Value to check
 * @returns True if value is not null, undefined, or empty string
 */
export function isNonEmpty(value: any): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string' && value.trim() === '') return false;
  return true;
}

/**
 * Validate function argument count
 * @param functionName - Name of the function
 * @param args - Arguments provided
 * @param expectedCount - Expected number of arguments (exact count)
 * @throws Error if argument count doesn't match
 */
export function validateArgumentCount(functionName: string, args: ASTNode[], expectedCount: number): void {
  if (args.length !== expectedCount) {
    throw new Error(`${functionName} function requires exactly ${expectedCount} argument${expectedCount === 1 ? '' : 's'}`);
  }
}

/**
 * Validate function argument count with range
 * @param functionName - Name of the function
 * @param args - Arguments provided
 * @param minCount - Minimum number of arguments
 * @param maxCount - Maximum number of arguments (optional, defaults to unlimited)
 * @throws Error if argument count is out of range
 */
export function validateArgumentRange(functionName: string, args: ASTNode[], minCount: number, maxCount?: number): void {
  if (args.length < minCount) {
    throw new Error(`${functionName} function requires at least ${minCount} argument${minCount === 1 ? '' : 's'}`);
  }
  if (maxCount !== undefined && args.length > maxCount) {
    throw new Error(`${functionName} function accepts at most ${maxCount} argument${maxCount === 1 ? '' : 's'}`);
  }
}

/**
 * Check if a value represents an error (starts with #)
 * @param value - Value to check
 * @returns True if value is an error
 */
export function isError(value: any): boolean {
  return typeof value === 'string' && value.startsWith('#');
}

/**
 * Propagate errors from arguments
 * If any argument is an error, throw that error
 * @param values - Array of values to check
 * @throws Error if any value is an error
 */
export function checkForErrors(values: any[]): void {
  for (const value of values) {
    if (isError(value)) {
      throw new Error(value);
    }
  }
}

/**
 * Interface for function implementations
 * All spreadsheet functions should implement this interface
 */
export interface SpreadsheetFunction {
  /**
   * Execute the function
   * @param args - AST nodes representing function arguments
   * @param evaluateAST - Function to evaluate AST nodes to values
   * @param getCellValueAsNumber - Function to get cell values as numbers (missing = 0)
   * @param getCellValueAsString - Function to get cell values as strings (missing = "")
   * @returns Calculated result
   */
  execute(
    args: ASTNode[], 
    evaluateAST: (node: ASTNode) => any,
    getCellValueAsNumber: (ref: string) => number,
    getCellValueAsString: (ref: string) => string
  ): any;
}

/**
 * Base class for function implementations
 * Provides common functionality and error handling
 */
export abstract class BaseFunction implements SpreadsheetFunction {
  abstract execute(
    args: ASTNode[], 
    evaluateAST: (node: ASTNode) => any,
    getCellValueAsNumber: (ref: string) => number,
    getCellValueAsString: (ref: string) => string
  ): any;
  
  /**
   * Helper to evaluate all arguments to values
   * @param args - AST nodes to evaluate
   * @param evaluateAST - Function to evaluate AST nodes
   * @returns Array of evaluated values
   */
  protected evaluateArgs(args: ASTNode[], evaluateAST: (node: ASTNode) => any): any[] {
    return args.map(arg => evaluateAST(arg));
  }
  
  /**
   * Helper to collect all numeric values from arguments (flattening arrays)
   * @param args - AST nodes to evaluate
   * @param evaluateAST - Function to evaluate AST nodes
   * @returns Array of all numeric values
   */
  protected collectNumbers(args: ASTNode[], evaluateAST: (node: ASTNode) => any): number[] {
    const allValues: number[] = [];
    for (const arg of args) {
      const values = flattenToNumbers(evaluateAST(arg));
      allValues.push(...values);
    }
    return allValues;
  }
  
  /**
   * Helper to collect all values from arguments (flattening arrays)
   * @param args - AST nodes to evaluate
   * @param evaluateAST - Function to evaluate AST nodes
   * @returns Array of all values
   */
  protected collectValues(args: ASTNode[], evaluateAST: (node: ASTNode) => any): any[] {
    const allValues: any[] = [];
    for (const arg of args) {
      const values = flattenToValues(evaluateAST(arg));
      allValues.push(...values);
    }
    return allValues;
  }
}

/**
 * Get cell value as a string with null handling
 * This is a helper function for text functions to consistently handle null vs empty string
 * @param value - The cell value to convert
 * @returns String representation (null becomes "")
 */
export function getCellValueAsString(value: any): string {
  if (value === null || value === undefined) {
    return "";
  }
  return String(value);
}