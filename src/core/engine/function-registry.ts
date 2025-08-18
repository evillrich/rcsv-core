/**
 * Central function registry for RCSV formula engine
 * Imports all function modules and creates a unified function map
 * Provides clean interface for calculator to call functions
 */

import type { ASTNode } from './types';
import type { SpreadsheetFunction } from './functions/function-utils';

// Import all function modules
import { mathFunctions } from './functions/function-math';
import { statsFunctions } from './functions/function-stats';
import { logicalFunctions } from './functions/function-logical';
import { textFunctions } from './functions/function-text';
import { dateFunctions } from './functions/function-date';
import { lookupFunctions } from './functions/function-lookup';
import { financeFunctions } from './functions/function-finance';
import { arrayFunctions } from './functions/function-array';

/**
 * Master function registry containing all available spreadsheet functions
 * Functions are organized by category but accessed through a single map
 */
export const functionRegistry: Map<string, SpreadsheetFunction> = new Map();

/**
 * Initialize the function registry by adding all functions from all modules
 */
function initializeRegistry() {
  // Add math functions
  Object.entries(mathFunctions).forEach(([name, func]) => {
    functionRegistry.set(name.toUpperCase(), func);
  });
  
  // Add statistical functions
  Object.entries(statsFunctions).forEach(([name, func]) => {
    functionRegistry.set(name.toUpperCase(), func);
  });
  
  // Add logical functions
  Object.entries(logicalFunctions).forEach(([name, func]) => {
    functionRegistry.set(name.toUpperCase(), func);
  });
  
  // Add text functions
  Object.entries(textFunctions).forEach(([name, func]) => {
    functionRegistry.set(name.toUpperCase(), func);
  });
  
  // Add date functions
  Object.entries(dateFunctions).forEach(([name, func]) => {
    functionRegistry.set(name.toUpperCase(), func);
  });
  
  // Add lookup functions
  Object.entries(lookupFunctions).forEach(([name, func]) => {
    functionRegistry.set(name.toUpperCase(), func);
  });
  
  // Add financial functions
  Object.entries(financeFunctions).forEach(([name, func]) => {
    functionRegistry.set(name.toUpperCase(), func);
  });
  
  // Add array functions
  Object.entries(arrayFunctions).forEach(([name, func]) => {
    functionRegistry.set(name.toUpperCase(), func);
  });
}

// Initialize the registry when this module is loaded
initializeRegistry();

/**
 * Execute a function by name with the given arguments
 * @param functionName - Name of the function to execute (case-insensitive)
 * @param args - AST nodes representing function arguments
 * @param evaluateAST - Function to evaluate AST nodes to values
 * @param getRangeRawValues - Optional function to get raw values from ranges (for COUNTA)
 * @returns Result of function execution
 * @throws Error if function is not found or execution fails
 */
export function executeFunction(
  functionName: string, 
  args: ASTNode[], 
  evaluateAST: (node: ASTNode) => any,
  getRangeRawValues?: (start: string, end: string) => any[]
): any {
  const upperName = functionName.toUpperCase();
  const func = functionRegistry.get(upperName);
  
  if (!func) {
    throw new Error(`Unknown function: ${functionName}`);
  }
  
  // Special handling for COUNTA which needs access to raw values
  if (upperName === 'COUNTA' && getRangeRawValues) {
    // Cast to access the special COUNTA execute method
    const countAFunc = func as any;
    return countAFunc.execute(args, evaluateAST, getRangeRawValues);
  }
  
  return func.execute(args, evaluateAST);
}

/**
 * Check if a function exists in the registry
 * @param functionName - Name of the function to check (case-insensitive)
 * @returns True if function exists, false otherwise
 */
export function hasFunction(functionName: string): boolean {
  return functionRegistry.has(functionName.toUpperCase());
}

/**
 * Get list of all available function names
 * @returns Array of function names in uppercase
 */
export function getAvailableFunctions(): string[] {
  return Array.from(functionRegistry.keys()).sort();
}

/**
 * Get function categories for documentation or UI purposes
 * @returns Object mapping category names to function lists
 */
export function getFunctionCategories(): Record<string, string[]> {
  return {
    'Math': Object.keys(mathFunctions),
    'Statistical': Object.keys(statsFunctions),
    'Logical': Object.keys(logicalFunctions),
    'Text': Object.keys(textFunctions),
    'Date & Time': Object.keys(dateFunctions),
    'Lookup & Reference': Object.keys(lookupFunctions),
    'Financial': Object.keys(financeFunctions),
    'Array': Object.keys(arrayFunctions),
  };
}

/**
 * Get count of implemented vs placeholder functions
 * @returns Object with implementation statistics
 */
export function getImplementationStats(): { implemented: number; placeholder: number; total: number } {
  const total = functionRegistry.size;
  let implemented = 0;
  let placeholder = 0;
  
  for (const func of functionRegistry.values()) {
    try {
      // Try to determine if it's a placeholder by checking for "not yet implemented" in error message
      const testResult = func.execute([], () => 0);
      implemented++;
    } catch (error) {
      if (error instanceof Error && error.message.includes('not yet implemented')) {
        placeholder++;
      } else {
        implemented++; // Real functions that fail validation
      }
    }
  }
  
  return { implemented, placeholder, total };
}