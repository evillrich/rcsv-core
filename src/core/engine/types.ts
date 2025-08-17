/**
 * RCSV Type Definitions
 */

export enum DataType {
  TEXT = 'text',
  NUMBER = 'number',
  CURRENCY = 'currency',
  PERCENTAGE = 'percentage',
  DATE = 'date',
  BOOLEAN = 'boolean',
  CATEGORY = 'category'
}

export interface CellValue {
  raw: string;
  value: any;
  type: DataType;
  formula?: string;
  error?: string;
}

export interface ChartMetadata {
  type: 'bar' | 'column' | 'line' | 'pie' | 'scatter';
  title?: string;
  x?: string;
  y?: string | string[];
  series?: string[];
  values?: string;
  labels?: string;
  position?: 'bottom' | 'right';
}

export interface TableMetadata {
  position?: 'bottom' | 'right';
}

export interface ColumnMetadata {
  name: string;
  type?: DataType | 'UNSPECIFIED';  // UNSPECIFIED = defer to post-calculation
  validationList?: string[]; // For category type
  formatting?: {
    align?: 'left' | 'center' | 'right';
    bold?: boolean;
    italic?: boolean;
    color?: string;
  };
}

export interface ContentBlock {
  type: 'chart' | 'table';
  sourceOrder: number;
  lineNumber: number;
  chart?: ChartMetadata;
  table?: TableMetadata;
}

export interface SheetMetadata {
  charts: ChartMetadata[];
  tables: TableMetadata[];
  columns: ColumnMetadata[];
  contentBlocks: ContentBlock[];
}

export interface Sheet {
  name: string;
  metadata: SheetMetadata;
  data: CellValue[][];
  charts: ChartMetadata[];
  rowCount: number;
  columnCount: number;
}

export interface DocumentMetadata {
  title?: string;
  author?: string;
  created?: string;
  version?: string;
  [key: string]: string | undefined;
}

export interface RCSVDocument {
  metadata: DocumentMetadata;
  sheets: Sheet[];
  version: string;
  memoryStats: MemoryStats;
}

// Formula AST Node Types
export type ASTNode = 
  | { type: 'number'; value: number }
  | { type: 'string'; value: string }
  | { type: 'boolean'; value: boolean }
  | { type: 'cell'; ref: string }
  | { type: 'sheet_cell'; sheet: string; ref: string }
  | { type: 'range'; start: string; end: string }
  | { type: 'sheet_range'; sheet: string; start: string; end: string }
  | { type: 'function'; name: string; args: ASTNode[] }
  | { type: 'binary'; op: '+' | '-' | '*' | '/' | '^'; left: ASTNode; right: ASTNode }
  | { type: 'unary'; op: '-' | '+'; operand: ASTNode };

// Configuration Interfaces
export interface TypeInferenceConfig {
  sampleSize: number;           // Default: 100
  confidenceThreshold: number;  // Default: 0.8 (80%)
  formulaThreshold: number;     // Default: 0.5 (50%) - if >=50% formulas, defer to post-calc
}

export interface ParserConfig {
  strict: boolean;              // Default: false
  locale?: string;              // Default: auto-detect
}

export interface RCSVConfig {
  typeInference: TypeInferenceConfig;
  parser: ParserConfig;
}

// Memory Management
export interface MemoryStats {
  estimatedRows: number;
  estimatedMemoryMB: number;
}

// Error Handling
export class RCSVError extends Error {
  constructor(message: string, public line?: number, public column?: number) {
    super(message);
    this.name = 'RCSVError';
  }
}

export class RCSVMemoryError extends RCSVError {
  constructor(rows: number, limit: number) {
    super(`Dataset too large: ${rows} rows exceeds limit of ${limit}. 
           For large datasets, consider Excel/Sheets or breaking into multiple files.`);
    this.name = 'RCSVMemoryError';
  }
}

// Cell Reference Types
export interface CellRef {
  col: string;  // 'A', 'B', 'C', etc.
  row: number;  // 1, 2, 3, etc.
}

export interface RangeRef {
  start: CellRef;
  end: CellRef;
}

// Default Configuration
export const DEFAULT_CONFIG: RCSVConfig = {
  typeInference: {
    sampleSize: 100,
    confidenceThreshold: 0.8,
    formulaThreshold: 0.5
  },
  parser: {
    strict: false
  }
};

// Memory Limits
export const MEMORY_LIMITS = {
  maxRows: 10000,
  maxMemoryMB: 50,
  warnAtRows: 5000
};