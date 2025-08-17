/**
 * RCSV Parser Module
 * Handles parsing of RCSV format including metadata, CSV data, and formulas
 */

import Papa from 'papaparse';
import { DataType, DEFAULT_CONFIG } from '../engine/types';
import type { RCSVDocument, DocumentMetadata, ChartMetadata, CellValue, ColumnMetadata, TypeInferenceConfig } from '../engine/types';

/**
 * Parse RCSV text into document structure
 * @param text - Raw RCSV text
 * @returns Parsed document (not yet calculated)
 */
export function parseStructure(text: string): RCSVDocument {
  const lines = text.split(/\r?\n/);
  
  // Extract document-level metadata (## comments before first sheet)
  const { metadata: docMetadata, firstSheetLine } = extractDocumentMetadata(lines);
  
  // Split into sheets by "# Sheet:" boundaries
  const sheetSections = splitIntoSheets(lines.slice(firstSheetLine));
  
  // Parse each sheet
  const sheets = sheetSections.map((section, index) => {
    const { name, lines: sheetLines } = section;
    
    // Extract sheet-level metadata and charts
    const { charts, dataStartLine } = extractSheetMetadata(sheetLines);
    
    // Extract CSV data (everything after metadata comments)
    const csvData = sheetLines.slice(dataStartLine).join('\n');
    
    // Parse CSV with PapaParse
    const { data, columns } = parseCSVData(csvData);
    
    return {
      name: name || `Sheet${index + 1}`,
      metadata: {
        charts,
        columns
      },
      data,
      charts,
      rowCount: data.length,
      columnCount: columns.length
    };
  });
  
  // Calculate total memory stats
  const estimatedRows = sheets.reduce((sum, sheet) => sum + sheet.rowCount, 0);
  const estimatedColumns = Math.max(...sheets.map(s => s.columnCount));
  const estimatedMemoryMB = Math.round((estimatedRows * estimatedColumns * 50) / (1024 * 1024) * 100) / 100;
  
  return {
    metadata: docMetadata,
    sheets,
    version: '1.0',
    memoryStats: {
      estimatedRows,
      estimatedMemoryMB
    }
  };
}

/**
 * Extract document-level metadata (before first sheet)
 */
function extractDocumentMetadata(lines: string[]): {
  metadata: DocumentMetadata;
  firstSheetLine: number;
} {
  const metadata: DocumentMetadata = {};
  let firstSheetLine = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines
    if (!line) continue;
    
    // Check for sheet declaration
    if (line.startsWith('# Sheet:')) {
      firstSheetLine = i;
      break;
    }
    
    // Check for document metadata (# comments before sheets)
    if (line.startsWith('#') && !line.startsWith('##')) {
      const comment = line.substring(1).trim();
      // Parse document metadata in key: value format
      const match = comment.match(/^(\w+):\s*(.+)$/);
      if (match) {
        const [, key, value] = match;
        metadata[key.toLowerCase()] = value.trim();
      }
    }
    
    // Skip data lines that aren't metadata
    if (!line.startsWith('#')) {
      // No sheet declaration found, treat as single sheet
      firstSheetLine = 0;
      break;
    }
  }
  
  return { metadata, firstSheetLine };
}

/**
 * Split lines into sheet sections by "# Sheet:" boundaries
 */
function splitIntoSheets(lines: string[]): Array<{ name: string | null; lines: string[] }> {
  const sheets: Array<{ name: string | null; lines: string[] }> = [];
  let currentSheet: { name: string | null; lines: string[] } | null = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    // Check for sheet declaration
    if (trimmed.startsWith('# Sheet:')) {
      // Save previous sheet if exists
      if (currentSheet && currentSheet.lines.some(l => l.trim() !== '')) {
        sheets.push(currentSheet);
      }
      
      // Start new sheet
      const sheetName = trimmed.substring(8).trim();
      currentSheet = {
        name: sheetName || null,
        lines: []
      };
    } else {
      // Add line to current sheet
      if (!currentSheet) {
        // No sheet declaration yet, create default sheet
        currentSheet = {
          name: null,
          lines: []
        };
      }
      currentSheet.lines.push(line);
    }
  }
  
  // Add the last sheet
  if (currentSheet && currentSheet.lines.some(l => l.trim() !== '')) {
    sheets.push(currentSheet);
  }
  
  // If no sheets found, treat entire content as single sheet
  if (sheets.length === 0) {
    sheets.push({
      name: null,
      lines: lines
    });
  }
  
  return sheets;
}

/**
 * Extract sheet-level metadata and chart definitions from ## comments
 */
function extractSheetMetadata(lines: string[]): {
  charts: ChartMetadata[];
  dataStartLine: number;
} {
  const charts: ChartMetadata[] = [];
  let dataStartLine = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines
    if (!line) continue;
    
    // Process metadata/chart comments
    if (line.startsWith('##')) {
      const comment = line.substring(2).trim();
      
      // Check if it's a chart definition
      if (comment.toLowerCase().startsWith('chart:')) {
        const chart = parseChartMetadata(comment, i + 1);
        if (chart) {
          charts.push(chart);
        }
      }
    } else if (!line.startsWith('#')) {
      // First non-comment line is start of data
      dataStartLine = i;
      break;
    }
  }
  
  return { charts, dataStartLine };
}

/**
 * Parse chart metadata from comment line
 */
function parseChartMetadata(comment: string, lineNumber: number): ChartMetadata | null {
  try {
    // Remove "chart:" prefix
    const chartDef = comment.substring(6).trim();
    
    // Parse key=value pairs more carefully to handle commas within values
    const chart: Partial<ChartMetadata> = {};
    const pairs = parseKeyValuePairs(chartDef);
    
    for (const [key, value] of pairs) {
      switch (key.toLowerCase()) {
        case 'type':
          const typeValue = value.replace(/^["']|["']$/g, '');
          if (['bar', 'column', 'line', 'pie', 'scatter'].includes(typeValue)) {
            chart.type = typeValue as ChartMetadata['type'];
          }
          break;
        case 'title':
          // Remove quotes only if they wrap the entire value
          chart.title = value.replace(/^["']|["']$/g, '');
          break;
        case 'x':
          // Single column reference - remove quotes if present
          chart.x = value.replace(/^["']|["']$/g, '');
          break;
        case 'y':
          // Handle multiple y values with proper quote parsing
          chart.y = parseCommaSeparatedValues(value);
          break;
        case 'series':
          // Handle multiple series values with proper quote parsing  
          chart.series = parseCommaSeparatedValues(value);
          break;
        case 'values':
          // Single column reference for pie charts
          chart.values = value.replace(/^["']|["']$/g, '');
          break;
        case 'labels':
          // Single column reference for pie charts
          chart.labels = value.replace(/^["']|["']$/g, '');
          break;
      }
    }
    
    // Validate required fields
    if (!chart.type) {
      console.warn(`Chart at line ${lineNumber}: missing required 'type' field`);
      return null;
    }
    
    return chart as ChartMetadata;
  } catch (error) {
    console.warn(`Failed to parse chart metadata at line ${lineNumber}:`, error);
    return null;
  }
}

/**
 * Parse comma-separated values that may contain quoted items
 * Examples:
 * - "Revenue,Expenses" -> ["Revenue", "Expenses"]
 * - '"Revenue, After Tax",Expenses' -> ["Revenue, After Tax", "Expenses"]
 * - 'Revenue' -> "Revenue" (single value)
 */
function parseCommaSeparatedValues(value: string): string | string[] {
  if (!value.includes(',')) {
    // Single value - just remove surrounding quotes if present
    return value.replace(/^["']|["']$/g, '');
  }
  
  const items: string[] = [];
  let current = '';
  let inQuote = false;
  let quoteChar = '';
  
  for (let i = 0; i < value.length; i++) {
    const char = value[i];
    
    if (!inQuote) {
      if ((char === '"' || char === "'") && (current === '' || current.match(/^\s*$/))) {
        // Starting a quoted value
        inQuote = true;
        quoteChar = char;
      } else if (char === ',') {
        // End of current item
        items.push(current.trim().replace(/^["']|["']$/g, ''));
        current = '';
      } else {
        current += char;
      }
    } else {
      // Inside quotes
      if (char === quoteChar && (i === value.length - 1 || value[i + 1] === ',' || value[i + 1] === ' ')) {
        // Ending quote
        inQuote = false;
        quoteChar = '';
      } else {
        current += char;
      }
    }
  }
  
  // Add the last item
  if (current) {
    items.push(current.trim().replace(/^["']|["']$/g, ''));
  }
  
  // Return single item as string, multiple as array
  return items.length === 1 ? items[0] : items;
}

/**
 * Parse key=value pairs, handling quoted values and commas
 * Supports:
 * - Simple values: x=Month
 * - Quoted values: title="Q4 Report, Final"
 * - Comma-separated lists: y=Revenue,Expenses,Profit
 * - Mixed quoted/unquoted lists: y="Revenue, After Tax",Expenses,"Profit, Net"
 */
function parseKeyValuePairs(input: string): [string, string][] {
  const pairs: [string, string][] = [];
  let currentKey = '';
  let currentValue = '';
  let inValue = false;
  let inQuote = false;
  let quoteChar = '';
  
  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    const nextChar = input[i + 1] || '';
    
    if (!inValue) {
      // Looking for key=value
      if (char === '=') {
        inValue = true;
        currentKey = currentKey.trim();
      } else if (char === ' ' || char === ',') {
        // Skip whitespace and commas between pairs
        if (currentKey.trim()) {
          currentKey += char;
        }
      } else {
        currentKey += char;
      }
    } else {
      // Building value
      if (!inQuote) {
        if ((char === '"' || char === "'") && (currentValue === '' || currentValue.endsWith(','))) {
          // Starting a quoted section
          inQuote = true;
          quoteChar = char;
          currentValue += char;
        } else if (char === ',' && nextChar.match(/\s*\w+\s*=/)) {
          // This comma separates key=value pairs (next item is a key)
          pairs.push([currentKey, currentValue.trim()]);
          currentKey = '';
          currentValue = '';
          inValue = false;
        } else {
          currentValue += char;
        }
      } else {
        // Inside quotes
        currentValue += char;
        if (char === quoteChar) {
          // Check if this closes the quote (not escaped)
          if (i === 0 || input[i - 1] !== '\\') {
            inQuote = false;
            quoteChar = '';
          }
        }
      }
    }
  }
  
  // Add the last pair
  if (currentKey && inValue) {
    pairs.push([currentKey, currentValue.trim()]);
  }
  
  return pairs;
}


/**
 * Parse CSV data using PapaParse and create cell value matrix
 */
function parseCSVData(csvText: string): {
  data: CellValue[][];
  columns: ColumnMetadata[];
} {
  if (!csvText.trim()) {
    return { data: [], columns: [] };
  }
  
  // Parse with PapaParse
  const parseResult = Papa.parse(csvText, {
    header: false,
    skipEmptyLines: true,
    transform: (value: string) => value.trim()
  });
  
  if (parseResult.errors.length > 0) {
    console.warn('CSV parsing warnings:', parseResult.errors);
  }
  
  const rawRows = parseResult.data as string[][];
  if (rawRows.length === 0) {
    return { data: [], columns: [] };
  }
  
  // First row should be column headers with optional type annotations
  const headerRow = rawRows[0];
  const dataRows = rawRows.slice(1);
  
  // Parse column metadata from headers (e.g., "Category:text", "Budget:currency")
  const columns: ColumnMetadata[] = headerRow.map(header => {
    const [name, typeAnnotation] = header.split(':');
    const column: ColumnMetadata = {
      name: name.trim()
    };
    
    // Parse type annotation if present
    if (typeAnnotation) {
      const type = typeAnnotation.trim().toLowerCase();
      switch (type) {
        case 'text':
          column.type = DataType.TEXT;
          break;
        case 'number':
          column.type = DataType.NUMBER;
          break;
        case 'currency':
          column.type = DataType.CURRENCY;
          break;
        case 'percentage':
          column.type = DataType.PERCENTAGE;
          break;
        case 'date':
          column.type = DataType.DATE;
          break;
        case 'boolean':
          column.type = DataType.BOOLEAN;
          break;
        case 'category':
          column.type = DataType.CATEGORY;
          break;
        default:
          console.warn(`Unknown type annotation: ${type}, defaulting to text`);
          column.type = DataType.TEXT;
      }
    }
    
    return column;
  });
  
  // Check for potentially split formulas and provide helpful error messages
  checkForSplitFormulas(dataRows, headerRow.length);
  
  // Convert raw data to CellValue matrix
  const data: CellValue[][] = dataRows.map(row => {
    return row.map((cellText) => {
      const cell: CellValue = {
        raw: cellText,
        value: cellText,
        type: DataType.TEXT // Will be inferred later
      };
      
      // Check if it's a formula
      if (cellText.startsWith('=')) {
        cell.formula = cellText;
        cell.value = null; // Will be calculated later
        // Formulas keep TEXT type for now
      }
      
      return cell;
    });
  });
  
  // Infer types for columns that don't have explicit type annotations
  inferColumnTypes(data, columns, DEFAULT_CONFIG.typeInference);
  
  return { data, columns };
}

/**
 * Infer column types for columns without explicit type annotations
 */
function inferColumnTypes(data: CellValue[][], columns: ColumnMetadata[], config: TypeInferenceConfig): void {
  for (let colIndex = 0; colIndex < columns.length; colIndex++) {
    const column = columns[colIndex];
    
    // Skip columns that already have explicit type annotations
    if (column.type) {
      // Apply the inferred type to all cells in this column
      applyTypeToColumn(data, colIndex, column.type);
      continue;
    }
    
    // Collect non-formula values for type inference
    const values: string[] = [];
    for (let rowIndex = 0; rowIndex < Math.min(data.length, config.sampleSize); rowIndex++) {
      const cell = data[rowIndex]?.[colIndex];
      if (cell && !cell.formula && cell.raw.trim() !== '') {
        values.push(cell.raw.trim());
      }
    }
    
    // Infer the column type
    const inferredType = inferColumnType(values, config);
    column.type = inferredType;
    
    // Apply the inferred type to all cells in this column
    applyTypeToColumn(data, colIndex, inferredType);
  }
}

/**
 * Apply a data type to all cells in a column
 */
function applyTypeToColumn(data: CellValue[][], colIndex: number, dataType: DataType): void {
  for (let rowIndex = 0; rowIndex < data.length; rowIndex++) {
    const cell = data[rowIndex]?.[colIndex];
    if (cell && !cell.formula) {
      cell.type = dataType;
      // Convert the value based on the inferred type
      cell.value = convertValueForType(cell.raw, dataType);
    }
  }
}

/**
 * Infer the type of a column based on sample values
 */
function inferColumnType(values: string[], config: TypeInferenceConfig): DataType {
  if (values.length === 0) return DataType.TEXT;
  
  const sample = values.slice(0, config.sampleSize);
  const typeCounts = new Map<DataType, number>();
  
  // Count type matches for each value
  sample.forEach(value => {
    const inferredType = inferSingleValue(value);
    typeCounts.set(inferredType, (typeCounts.get(inferredType) || 0) + 1);
  });
  
  // Check if any type has required confidence
  const threshold = Math.ceil(sample.length * config.confidenceThreshold);
  
  // Priority order: boolean > date > currency > percentage > number > text
  const priorityOrder = [DataType.BOOLEAN, DataType.DATE, DataType.CURRENCY, 
                        DataType.PERCENTAGE, DataType.NUMBER];
  
  for (const type of priorityOrder) {
    if ((typeCounts.get(type) || 0) >= threshold) {
      return type;
    }
  }
  
  return DataType.TEXT; // Conservative fallback
}

/**
 * Infer the type of a single value
 */
function inferSingleValue(value: string): DataType {
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
  if (isDateString(trimmed)) {
    return DataType.DATE;
  }
  
  // Number check (integers or decimals, with optional commas)
  if (/^-?\d{1,3}(,\d{3})*(\.\d+)?$/.test(trimmed) || /^-?\d+\.?\d*$/.test(trimmed)) {
    return DataType.NUMBER;
  }
  
  return DataType.TEXT;
}

/**
 * Check if a string represents a date
 */
function isDateString(value: string): boolean {
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
 * Convert a raw string value to the appropriate type
 */
function convertValueForType(raw: string, dataType: DataType): any {
  const trimmed = raw.trim();
  
  switch (dataType) {
    case DataType.NUMBER:
      // Remove commas and parse as number
      const numStr = trimmed.replace(/,/g, '');
      const num = parseFloat(numStr);
      return isNaN(num) ? trimmed : num;
      
    case DataType.CURRENCY:
      // Extract numeric value from currency
      const currencyMatch = trimmed.match(/[\d,]+\.?\d*/);
      if (currencyMatch) {
        const numVal = parseFloat(currencyMatch[0].replace(/,/g, ''));
        return isNaN(numVal) ? trimmed : numVal;
      }
      return trimmed;
      
    case DataType.PERCENTAGE:
      // Convert percentage to decimal
      const percentMatch = trimmed.match(/^(\d+\.?\d*)%$/);
      if (percentMatch) {
        return parseFloat(percentMatch[1]) / 100;
      }
      return trimmed;
      
    case DataType.BOOLEAN:
      const lower = trimmed.toLowerCase();
      return ['true', 'yes', 'y'].includes(lower);
      
    case DataType.DATE:
      // Return as Date object
      const date = new Date(trimmed);
      return isNaN(date.getTime()) ? trimmed : date;
      
    default:
      return trimmed;
  }
}

/**
 * Check for potentially split formulas and provide helpful error messages
 */
function checkForSplitFormulas(dataRows: string[][], expectedColumns: number): void {
  dataRows.forEach((row, rowIndex) => {
    // Check if row has more columns than expected (potential split formula)
    if (row.length > expectedColumns) {
      // Look for patterns that suggest split formulas
      for (let i = 0; i < row.length - 1; i++) {
        const cell = row[i];
        const nextCell = row[i + 1];
        
        // Pattern 1: Cell starts with = but doesn't look like complete formula
        if (cell.startsWith('=') && !cell.includes(')') && nextCell.includes(')')) {
          const possibleFormula = cell + ',' + nextCell;
          console.warn(`Warning: Possible split formula detected at row ${rowIndex + 1}.`);
          console.warn(`Found: "${cell}" followed by "${nextCell}"`);
          console.warn(`Did you mean: "${possibleFormula}" (quoted)?`);
          console.warn('Tip: Formulas containing commas should be quoted, e.g., "=SUM(A1,B1)"');
        }
        
        // Pattern 2: Cell starts with function name but has unclosed parentheses
        if (cell.match(/^=\w+\([^)]*$/) && nextCell.match(/[^(]*\)/)) {
          const possibleFormula = cell + ',' + nextCell;
          console.warn(`Warning: Possible split formula detected at row ${rowIndex + 1}.`);
          console.warn(`Found: "${cell}" followed by "${nextCell}"`);
          console.warn(`Did you mean: "${possibleFormula}" (quoted)?`);
          console.warn('Tip: Formulas containing commas should be quoted, e.g., "=SUM(A1,B1)"');
        }
      }
    }
    
    // Check for incomplete formulas (start with = but look incomplete)
    row.forEach((cell, colIndex) => {
      if (cell.startsWith('=')) {
        // Check if it looks like an incomplete formula
        if (cell.match(/^=\w+\([^)]*$/) && !cell.includes(',')) {
          // This might be the start of a split formula
          console.warn(`Warning: Potential incomplete formula "${cell}" at row ${rowIndex + 1}, column ${colIndex + 1}.`);
          console.warn('If this formula should contain commas, make sure to quote it: "=FUNCTION(arg1,arg2)"');
        }
      }
    });
  });
}