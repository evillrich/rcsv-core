/**
 * RCSV Formula Calculator
 * Handles formula calculation and dependency resolution
 */

import { parseFormula } from '../parser/formula';
import type { RCSVDocument, ASTNode, CellValue, Sheet } from './types';

/**
 * Calculate all formulas in the document
 * @param doc - Parsed document with formulas
 * @returns Document with calculated values
 */
export function calculate(doc: RCSVDocument): RCSVDocument {
  // Create a copy to avoid modifying the original
  const calculatedDoc = JSON.parse(JSON.stringify(doc));
  
  // Calculate formulas in each sheet
  for (const sheet of calculatedDoc.sheets) {
    calculateSheet(sheet);
  }
  
  return calculatedDoc;
}

/**
 * Calculate all formulas in a sheet
 */
function calculateSheet(sheet: Sheet): void {
  const calculator = new SheetCalculator(sheet);
  calculator.calculateAll();
}

/**
 * Sheet-level calculator with dependency resolution
 */
class SheetCalculator {
  private sheet: Sheet;
  private dependencies = new Map<string, Set<string>>();
  private calculated = new Set<string>();
  private calculating = new Set<string>();
  
  constructor(sheet: Sheet) {
    this.sheet = sheet;
    this.buildDependencyGraph();
  }
  
  /**
   * Calculate all formulas in dependency order
   */
  calculateAll(): void {
    // Find all cells with formulas
    for (let row = 0; row < this.sheet.data.length; row++) {
      for (let col = 0; col < this.sheet.data[row].length; col++) {
        const cell = this.sheet.data[row][col];
        if (cell.formula) {
          const cellRef = this.getCellRef(row, col);
          this.calculateCell(cellRef);
        }
      }
    }
  }
  
  /**
   * Build dependency graph for all formulas
   */
  private buildDependencyGraph(): void {
    for (let row = 0; row < this.sheet.data.length; row++) {
      for (let col = 0; col < this.sheet.data[row].length; col++) {
        const cell = this.sheet.data[row][col];
        if (cell.formula) {
          const cellRef = this.getCellRef(row, col);
          const deps = this.extractDependencies(cell.formula);
          this.dependencies.set(cellRef, deps);
        }
      }
    }
  }
  
  /**
   * Extract cell dependencies from a formula
   */
  private extractDependencies(formula: string): Set<string> {
    const dependencies = new Set<string>();
    
    try {
      const ast = parseFormula(formula);
      this.collectDependencies(ast, dependencies);
    } catch (error) {
      // If formula parsing fails, assume no dependencies
      console.warn(`Failed to parse formula ${formula}:`, error);
    }
    
    return dependencies;
  }
  
  /**
   * Recursively collect dependencies from AST
   */
  private collectDependencies(node: ASTNode, dependencies: Set<string>): void {
    switch (node.type) {
      case 'cell':
        dependencies.add(node.ref);
        break;
      case 'range':
        const range = this.expandRange(node.start, node.end);
        range.forEach(ref => dependencies.add(ref));
        break;
      case 'binary':
        this.collectDependencies(node.left, dependencies);
        this.collectDependencies(node.right, dependencies);
        break;
      case 'unary':
        this.collectDependencies(node.operand, dependencies);
        break;
      case 'function':
        node.args.forEach(arg => this.collectDependencies(arg, dependencies));
        break;
    }
  }
  
  /**
   * Calculate a specific cell, resolving dependencies first
   */
  private calculateCell(cellRef: string): number | string | boolean | null {
    // Check for circular reference
    if (this.calculating.has(cellRef)) {
      const cell = this.getCellByRef(cellRef);
      if (cell) {
        cell.error = '#CIRCULAR!';
        cell.value = '#CIRCULAR!';
      }
      return '#CIRCULAR!';
    }
    
    // Return if already calculated
    if (this.calculated.has(cellRef)) {
      const cell = this.getCellByRef(cellRef);
      return cell?.value ?? null;
    }
    
    const cell = this.getCellByRef(cellRef);
    if (!cell || !cell.formula) {
      return cell?.value ?? null;
    }
    
    // Mark as being calculated
    this.calculating.add(cellRef);
    
    try {
      // Calculate dependencies first
      const deps = this.dependencies.get(cellRef) || new Set();
      for (const dep of deps) {
        this.calculateCell(dep);
      }
      
      // Parse and evaluate the formula
      const ast = parseFormula(cell.formula);
      const result = this.evaluateAST(ast);
      
      // Store the calculated value
      cell.value = result;
      cell.error = undefined;
      this.calculated.add(cellRef);
      
      return result;
    } catch (error) {
      // Handle calculation errors
      const errorMessage = error instanceof Error ? error.message : 'Calculation error';
      cell.error = errorMessage;
      cell.value = `#ERROR!`;
      console.warn(`Error calculating ${cellRef}:`, error);
      return `#ERROR!`;
    } finally {
      // Remove from calculating set
      this.calculating.delete(cellRef);
    }
  }
  
  /**
   * Evaluate an AST node
   */
  private evaluateAST(node: ASTNode): any {
    switch (node.type) {
      case 'number':
        return node.value;
      
      case 'string':
        return node.value;
      
      case 'boolean':
        return node.value;
      
      case 'cell':
        const cellValue = this.getCellValue(node.ref);
        if (typeof cellValue === 'string' && cellValue.startsWith('#')) {
          throw new Error(`Reference error: ${cellValue}`);
        }
        return cellValue;
      
      case 'range':
        return this.getRangeValues(node.start, node.end);
      
      case 'binary':
        return this.evaluateBinaryOp(node.op, node.left, node.right);
      
      case 'unary':
        return this.evaluateUnaryOp(node.op, node.operand);
      
      case 'function':
        return this.evaluateFunction(node.name, node.args);
      
      default:
        throw new Error(`Unknown AST node type: ${(node as any).type}`);
    }
  }
  
  /**
   * Evaluate binary operations
   */
  private evaluateBinaryOp(op: string, left: ASTNode, right: ASTNode): number {
    const leftVal = this.evaluateAST(left);
    const rightVal = this.evaluateAST(right);
    
    // Convert to numbers for arithmetic
    const leftNum = this.toNumber(leftVal);
    const rightNum = this.toNumber(rightVal);
    
    switch (op) {
      case '+': return leftNum + rightNum;
      case '-': return leftNum - rightNum;
      case '*': return leftNum * rightNum;
      case '/': 
        if (rightNum === 0) throw new Error('#DIV/0!');
        return leftNum / rightNum;
      case '^': return Math.pow(leftNum, rightNum);
      default:
        throw new Error(`Unknown binary operator: ${op}`);
    }
  }
  
  /**
   * Evaluate unary operations
   */
  private evaluateUnaryOp(op: string, operand: ASTNode): number {
    const value = this.evaluateAST(operand);
    const numValue = this.toNumber(value);
    
    switch (op) {
      case '+': return numValue;
      case '-': return -numValue;
      default:
        throw new Error(`Unknown unary operator: ${op}`);
    }
  }
  
  /**
   * Evaluate function calls
   */
  private evaluateFunction(name: string, args: ASTNode[]): any {
    switch (name.toUpperCase()) {
      case 'SUM':
        return this.functionSum(args);
      case 'AVERAGE':
        return this.functionAverage(args);
      case 'COUNT':
        return this.functionCount(args);
      case 'MIN':
        return this.functionMin(args);
      case 'MAX':
        return this.functionMax(args);
      default:
        throw new Error(`Unknown function: ${name}`);
    }
  }
  
  /**
   * SUM function implementation
   */
  private functionSum(args: ASTNode[]): number {
    let sum = 0;
    for (const arg of args) {
      const values = this.flattenToNumbers(this.evaluateAST(arg));
      sum += values.reduce((a, b) => a + b, 0);
    }
    return sum;
  }
  
  /**
   * AVERAGE function implementation
   */
  private functionAverage(args: ASTNode[]): number {
    const allValues: number[] = [];
    for (const arg of args) {
      const values = this.flattenToNumbers(this.evaluateAST(arg));
      allValues.push(...values);
    }
    if (allValues.length === 0) throw new Error('#DIV/0!');
    return allValues.reduce((a, b) => a + b, 0) / allValues.length;
  }
  
  /**
   * COUNT function implementation
   */
  private functionCount(args: ASTNode[]): number {
    let count = 0;
    for (const arg of args) {
      const values = this.flattenToNumbers(this.evaluateAST(arg));
      count += values.length;
    }
    return count;
  }
  
  /**
   * MIN function implementation
   */
  private functionMin(args: ASTNode[]): number {
    const allValues: number[] = [];
    for (const arg of args) {
      const values = this.flattenToNumbers(this.evaluateAST(arg));
      allValues.push(...values);
    }
    if (allValues.length === 0) throw new Error('No values for MIN');
    return Math.min(...allValues);
  }
  
  /**
   * MAX function implementation
   */
  private functionMax(args: ASTNode[]): number {
    const allValues: number[] = [];
    for (const arg of args) {
      const values = this.flattenToNumbers(this.evaluateAST(arg));
      allValues.push(...values);
    }
    if (allValues.length === 0) throw new Error('No values for MAX');
    return Math.max(...allValues);
  }
  
  /**
   * Helper functions
   */
  private toNumber(value: any): number {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const num = parseFloat(value);
      if (isNaN(num)) throw new Error(`Cannot convert '${value}' to number`);
      return num;
    }
    if (typeof value === 'boolean') return value ? 1 : 0;
    throw new Error(`Cannot convert ${typeof value} to number`);
  }
  
  private flattenToNumbers(value: any): number[] {
    if (Array.isArray(value)) {
      return value.map(v => this.toNumber(v));
    }
    return [this.toNumber(value)];
  }
  
  private getCellRef(row: number, col: number): string {
    const colStr = this.numberToColumn(col);
    return `${colStr}${row + 2}`; // +2 because row 1 is header (not in data array)
  }
  
  private numberToColumn(num: number): string {
    let result = '';
    while (num >= 0) {
      result = String.fromCharCode(65 + (num % 26)) + result;
      num = Math.floor(num / 26) - 1;
    }
    return result;
  }
  
  private parseRef(ref: string): { row: number; col: number } {
    const match = ref.match(/^([A-Z]+)(\d+)$/);
    if (!match) throw new Error(`Invalid cell reference: ${ref}`);
    
    const [, colStr, rowStr] = match;
    const col = this.columnToNumber(colStr);
    const row = parseInt(rowStr) - 2; // -2 because row 1 is header (not in data array)
    
    return { row, col };
  }
  
  private columnToNumber(col: string): number {
    let result = 0;
    for (let i = 0; i < col.length; i++) {
      result = result * 26 + (col.charCodeAt(i) - 65 + 1);
    }
    return result - 1;
  }
  
  private getCellByRef(ref: string): CellValue | null {
    try {
      const { row, col } = this.parseRef(ref);
      return this.sheet.data[row]?.[col] || null;
    } catch {
      return null;
    }
  }
  
  private getCellValue(ref: string): any {
    const cell = this.getCellByRef(ref);
    return cell?.value ?? 0;
  }
  
  private getRangeValues(start: string, end: string): any[] {
    const range = this.expandRange(start, end);
    return range.map(ref => this.getCellValue(ref));
  }
  
  private expandRange(start: string, end: string): string[] {
    const startPos = this.parseRef(start);
    const endPos = this.parseRef(end);
    const refs: string[] = [];
    
    for (let row = startPos.row; row <= endPos.row; row++) {
      for (let col = startPos.col; col <= endPos.col; col++) {
        refs.push(this.getCellRef(row, col));
      }
    }
    
    return refs;
  }
}