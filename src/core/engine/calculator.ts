/**
 * RCSV Formula Calculator
 * Handles formula calculation and dependency resolution
 */

import { parseFormula } from '../parser/formula';
import { DEFAULT_CONFIG, DataType } from './types';
import type { RCSVDocument, ASTNode, CellValue, Sheet, TypeInferenceConfig } from './types';

/**
 * Calculate all formulas in the document
 * @param doc - Parsed document with formulas
 * @returns Document with calculated values
 */
export function calculate(doc: RCSVDocument): RCSVDocument {
  // Create a copy to avoid modifying the original
  const calculatedDoc = JSON.parse(JSON.stringify(doc));
  
  // Use DocumentCalculator for multi-sheet support
  const calculator = new DocumentCalculator(calculatedDoc);
  calculator.calculateAll();
  
  return calculatedDoc;
}

/**
 * Document-level calculator with multi-sheet support
 */
class DocumentCalculator {
  private sheetCalculators = new Map<string, SheetCalculator>();
  
  constructor(doc: RCSVDocument) {
    
    // Create a calculator for each sheet
    for (const sheet of doc.sheets) {
      this.sheetCalculators.set(sheet.name, new SheetCalculator(sheet, this));
    }
  }
  
  /**
   * Calculate all formulas across all sheets
   */
  calculateAll(): void {
    // Calculate each sheet
    for (const calculator of this.sheetCalculators.values()) {
      calculator.calculateAll();
    }
  }
  
  /**
   * Get a value from a specific sheet
   */
  getSheetCellValue(sheetName: string, cellRef: string): any {
    const calculator = this.sheetCalculators.get(sheetName);
    if (!calculator) {
      throw new Error(`Sheet not found: ${sheetName}`);
    }
    return calculator.getCellValue(cellRef);
  }
  
  /**
   * Get range values from a specific sheet
   */
  getSheetRangeValues(sheetName: string, startRef: string, endRef: string): any[] {
    const calculator = this.sheetCalculators.get(sheetName);
    if (!calculator) {
      throw new Error(`Sheet not found: ${sheetName}`);
    }
    return calculator.getRangeValues(startRef, endRef);
  }
}

/**
 * Sheet-level calculator with dependency resolution
 */
class SheetCalculator {
  private sheet: Sheet;
  private documentCalc: DocumentCalculator;
  private dependencies = new Map<string, Set<string>>();
  private calculated = new Set<string>();
  private calculating = new Set<string>();
  
  constructor(sheet: Sheet, documentCalc: DocumentCalculator) {
    this.sheet = sheet;
    this.documentCalc = documentCalc;
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
    
    // Phase 2: Post-calculation type inference for UNSPECIFIED columns
    this.applyPhase2TypeInference();
  }
  
  /**
   * Phase 2: Post-calculation type inference for UNSPECIFIED columns
   */
  private applyPhase2TypeInference(): void {
    const config = DEFAULT_CONFIG.typeInference;
    
    for (let colIndex = 0; colIndex < this.sheet.metadata.columns.length; colIndex++) {
      const column = this.sheet.metadata.columns[colIndex];
      
      // Only process columns marked as UNSPECIFIED
      if (column.type !== 'UNSPECIFIED') {
        continue;
      }
      
      // Collect all calculated values (including formula results)
      const values: string[] = [];
      const sampleSize = Math.min(this.sheet.data.length, config.sampleSize);
      
      for (let rowIndex = 0; rowIndex < sampleSize; rowIndex++) {
        const cell = this.sheet.data[rowIndex]?.[colIndex];
        if (cell) {
          // Use calculated value for formulas, raw value for non-formulas
          const valueToAnalyze = cell.formula ? cell.value : cell.raw;
          if (valueToAnalyze != null && String(valueToAnalyze).trim() !== '') {
            values.push(String(valueToAnalyze).trim());
          }
        }
      }
      
      // If still no values to analyze, default to TEXT
      if (values.length === 0) {
        column.type = DataType.TEXT;
        this.applyTypeToColumn(colIndex, DataType.TEXT);
        continue;
      }
      
      // Infer type from calculated values
      const inferredType = this.inferColumnTypeFromValues(values, config);
      column.type = inferredType;
      
      // Apply the inferred type to all cells in this column
      this.applyTypeToColumn(colIndex, inferredType);
    }
  }
  
  /**
   * Apply a data type to all cells in a column (Phase 2 version)
   */
  private applyTypeToColumn(colIndex: number, dataType: DataType): void {
    for (let rowIndex = 0; rowIndex < this.sheet.data.length; rowIndex++) {
      const cell = this.sheet.data[rowIndex]?.[colIndex];
      if (cell) {
        cell.type = dataType;
        // Only convert non-formula values (formulas already calculated)
        if (!cell.formula) {
          cell.value = this.convertValueForType(cell.raw, dataType);
        }
      }
    }
  }
  
  /**
   * Infer column type from calculated values (Phase 2 version)
   */
  private inferColumnTypeFromValues(values: string[], config: TypeInferenceConfig): DataType {
    if (values.length === 0) return DataType.TEXT;
    
    const sample = values.slice(0, config.sampleSize);
    const typeCounts = new Map<DataType, number>();
    
    // Count type matches for each value
    sample.forEach(value => {
      const inferredType = this.inferSingleValueType(value);
      typeCounts.set(inferredType, (typeCounts.get(inferredType) || 0) + 1);
    });
    
    // Check if any type has required confidence
    const threshold = Math.ceil(sample.length * config.confidenceThreshold);
    
    // Priority order: boolean > date > currency > percentage > number > text
    const priorityOrder: DataType[] = [DataType.BOOLEAN, DataType.DATE, DataType.CURRENCY, DataType.PERCENTAGE, DataType.NUMBER];
    
    for (const type of priorityOrder) {
      if ((typeCounts.get(type) || 0) >= threshold) {
        return type;
      }
    }
    
    return DataType.TEXT; // Conservative fallback
  }
  
  /**
   * Infer the type of a single value (Phase 2 version)
   */
  private inferSingleValueType(value: string): DataType {
    const trimmed = value.trim();
    
    // Boolean check
    if (/^(true|false|yes|no|y|n)$/i.test(trimmed)) {
      return DataType.BOOLEAN;
    }
    
    // Currency check (starts with currency symbol or ends with currency code)
    if (/^[\$£€¥₹][\d,]+\.?\d*$/.test(trimmed) || /^\d+\.?\d*\s*(USD|EUR|GBP|JPY|INR)$/i.test(trimmed)) {
      return DataType.CURRENCY;
    }
    
    // Percentage check (ends with %)
    if (/^\d+\.?\d*%$/.test(trimmed)) {
      return DataType.PERCENTAGE;
    }
    
    // Date check (various formats)
    if (this.isDateString(trimmed)) {
      return DataType.DATE;
    }
    
    // Number check (integers or decimals, with optional commas)
    if (/^-?\d{1,3}(,\d{3})*(\.\d+)?$/.test(trimmed) || /^-?\d+\.?\d*$/.test(trimmed)) {
      return DataType.NUMBER;
    }
    
    return DataType.TEXT;
  }
  
  /**
   * Check if a string represents a date (Phase 2 version)
   */
  private isDateString(value: string): boolean {
    // ISO date format: YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return !isNaN(Date.parse(value));
    }
    
    // US format: MM/DD/YYYY
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(value)) {
      return !isNaN(Date.parse(value));
    }
    
    // EU format: DD/MM/YYYY (harder to validate without context)
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(value)) {
      const parts = value.split('/');
      const day = parseInt(parts[0]);
      const month = parseInt(parts[1]);
      // If day > 12, it's likely DD/MM/YYYY format
      if (day > 12 && month <= 12) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Convert a raw string value to the appropriate type (Phase 2 version)
   */
  private convertValueForType(raw: string, dataType: DataType): any {
    const trimmed = raw.trim();
    
    switch (dataType) {
      case 'number':
        // Remove commas and parse as number
        const numStr = trimmed.replace(/,/g, '');
        const num = parseFloat(numStr);
        return isNaN(num) ? trimmed : num;
        
      case 'currency':
        // Extract numeric value from currency
        const currencyMatch = trimmed.match(/[\d,]+\.?\d*/);
        if (currencyMatch) {
          const numVal = parseFloat(currencyMatch[0].replace(/,/g, ''));
          return isNaN(numVal) ? trimmed : numVal;
        }
        return trimmed;
        
      case 'percentage':
        // Convert percentage to decimal
        const percentMatch = trimmed.match(/^(\d+\.?\d*)%$/);
        if (percentMatch) {
          return parseFloat(percentMatch[1]) / 100;
        }
        return trimmed;
        
      case 'boolean':
        const lower = trimmed.toLowerCase();
        return ['true', 'yes', 'y'].includes(lower);
        
      case 'date':
        // Return as Date object
        const date = new Date(trimmed);
        return isNaN(date.getTime()) ? trimmed : date;
        
      default:
        return trimmed;
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
      const ast = parseFormula(formula, {});
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
      const ast = parseFormula(cell.formula, {});
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
      
      case 'sheet_cell':
        const sheetCellValue = this.documentCalc.getSheetCellValue(node.sheet, node.ref);
        if (typeof sheetCellValue === 'string' && sheetCellValue.startsWith('#')) {
          throw new Error(`Reference error: ${sheetCellValue}`);
        }
        return sheetCellValue;
      
      case 'range':
        return this.getRangeValues(node.start, node.end);
      
      case 'sheet_range':
        return this.documentCalc.getSheetRangeValues(node.sheet, node.start, node.end);
      
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
      case 'ABS':
        return this.functionAbs(args);
      case 'ROUND':
        return this.functionRound(args);
      case 'COUNTA':
        return this.functionCountA(args);
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
   * ABS function implementation
   */
  private functionAbs(args: ASTNode[]): number {
    if (args.length !== 1) {
      throw new Error('ABS function requires exactly 1 argument');
    }
    
    const value = this.evaluateAST(args[0]);
    const num = this.toNumber(value);
    return Math.abs(num);
  }
  
  /**
   * ROUND function implementation
   */
  private functionRound(args: ASTNode[]): number {
    if (args.length !== 2) {
      throw new Error('ROUND function requires exactly 2 arguments');
    }
    
    const value = this.evaluateAST(args[0]);
    const digits = this.evaluateAST(args[1]);
    
    const num = this.toNumber(value);
    const digitsNum = this.toNumber(digits);
    
    // Ensure digits is an integer
    const digitsInt = Math.floor(digitsNum);
    
    // Use the standard JavaScript rounding with precision
    const factor = Math.pow(10, digitsInt);
    return Math.round(num * factor) / factor;
  }
  
  /**
   * COUNTA function implementation
   */
  private functionCountA(args: ASTNode[]): number {
    let count = 0;
    for (const arg of args) {
      const values = this.flattenToValues(this.evaluateAST(arg));
      // Count non-empty values (any type)
      count += values.filter(v => this.isNonEmpty(v)).length;
    }
    return count;
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
  
  private flattenToValues(value: any): any[] {
    if (Array.isArray(value)) {
      return value;
    }
    return [value];
  }
  
  private isNonEmpty(value: any): boolean {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string' && value.trim() === '') return false;
    return true;
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
  
  getCellValue(ref: string): any {
    const cell = this.getCellByRef(ref);
    return cell?.value ?? 0;
  }
  
  getRangeValues(start: string, end: string): any[] {
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