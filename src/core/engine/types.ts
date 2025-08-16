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
}

export interface ColumnMetadata {
  name: string;
  type?: DataType;
  validationList?: string[]; // For category type
  formatting?: {
    align?: 'left' | 'center' | 'right';
    bold?: boolean;
    italic?: boolean;
    color?: string;
  };
}

export interface SheetMetadata {
  charts: ChartMetadata[];
  columns: ColumnMetadata[];
}

export interface Sheet {
  name: string;
  metadata: SheetMetadata;
  data: CellValue[][];
  charts: ChartMetadata[];
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
}