/**
 * RCSV Parser Module
 * Handles parsing of RCSV format including metadata, CSV data, and formulas
 */

import { parse } from 'csv-parse/browser/esm/sync';
import { DataType, DEFAULT_CONFIG } from '../engine/types';
import type { RCSVDocument, DocumentMetadata, ChartMetadata, TableMetadata, CellValue, ColumnMetadata, TypeInferenceConfig, ContentBlock } from '../engine/types';
import { convertValueForType } from '../engine/type-utils';

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
    const { charts, tables, contentBlocks, dataStartLine } = extractSheetMetadata(sheetLines);
    
    // Extract CSV data (everything after metadata comments)
    const csvData = sheetLines.slice(dataStartLine).join('\n');
    
    // Parse CSV with csv-parse
    const { data, columns } = parseCSVData(csvData);
    
    return {
      name: name || `Sheet${index + 1}`,
      metadata: {
        charts,
        tables,
        contentBlocks,
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
        metadata[key.toLowerCase()] = unquoteValue(value.trim());
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
  tables: TableMetadata[];
  contentBlocks: ContentBlock[];
  dataStartLine: number;
} {
  const charts: ChartMetadata[] = [];
  const tables: TableMetadata[] = [];
  const contentBlocks: ContentBlock[] = [];
  let dataStartLine = 0;
  let sourceOrder = 0;
  
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
          contentBlocks.push({
            type: 'chart',
            sourceOrder: sourceOrder++,
            lineNumber: i + 1,
            chart
          });
        }
      }
      // Check if it's a table definition
      else if (comment.toLowerCase().startsWith('table:')) {
        const table = parseTableMetadata(comment, i + 1);
        if (table) {
          tables.push(table);
          contentBlocks.push({
            type: 'table',
            sourceOrder: sourceOrder++,
            lineNumber: i + 1,
            table
          });
        }
      }
    } else if (!line.startsWith('#')) {
      // First non-comment line is start of data
      dataStartLine = i;
      break;
    }
  }
  
  return { charts, tables, contentBlocks, dataStartLine };
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
          const typeValue = unquoteValue(value);
          if (['bar', 'column', 'line', 'pie', 'scatter'].includes(typeValue)) {
            chart.type = typeValue as ChartMetadata['type'];
          }
          break;
        case 'title':
          // Remove quotes and handle escaped quotes
          chart.title = unquoteValue(value);
          break;
        case 'x':
          // Single column reference - remove quotes if present
          chart.x = unquoteValue(value);
          break;
        case 'y':
          // Handle multiple y values with proper quote parsing
          chart.y = parseCommaSeparatedValues(value);
          break;
        case 'series':
          // Handle series values - convert to array if needed
          const seriesValue = parseCommaSeparatedValues(value);
          chart.series = Array.isArray(seriesValue) ? seriesValue : [seriesValue];
          break;
        case 'values':
          // Single column reference for pie charts
          chart.values = unquoteValue(value);
          break;
        case 'labels':
          // Single column reference for pie charts
          chart.labels = unquoteValue(value);
          break;
        case 'position':
          // Layout positioning
          const positionValue = unquoteValue(value);
          if (['bottom', 'right'].includes(positionValue)) {
            chart.position = positionValue as 'bottom' | 'right';
          }
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
 * Parse table metadata from comment line
 */
function parseTableMetadata(comment: string, lineNumber: number): TableMetadata | null {
  try {
    // Remove "table:" prefix
    const tableDef = comment.substring(6).trim();
    
    // Parse key=value pairs
    const table: Partial<TableMetadata> = {};
    const pairs = parseKeyValuePairs(tableDef);
    
    for (const [key, value] of pairs) {
      switch (key.toLowerCase()) {
        case 'position':
          // Layout positioning
          const positionValue = unquoteValue(value);
          if (['bottom', 'right'].includes(positionValue)) {
            table.position = positionValue as 'bottom' | 'right';
          }
          break;
      }
    }
    
    return table as TableMetadata;
  } catch (error) {
    console.warn(`Failed to parse table metadata at line ${lineNumber}:`, error);
    return null;
  }
}

/**
 * Parse comma-separated values that may contain quoted items
 * Uses CSV-style escaping: quotes are escaped by doubling ("")
 * Examples:
 * - "Revenue,Expenses" -> "Revenue,Expenses" (single quoted value with comma)
 * - '"Revenue, After Tax",Expenses' -> ["Revenue, After Tax", "Expenses"]
 * - '"Sales ""2024""",Profit' -> ["Sales \"2024\"", "Profit"]
 * - 'Revenue' -> "Revenue" (single value)
 */
function parseCommaSeparatedValues(value: string): string | string[] {
  if (!value.includes(',')) {
    // Single value - just unquote if needed
    return unquoteValue(value.trim());
  }
  
  const items: string[] = [];
  let current = '';
  let inQuote = false;
  let quoteChar = '';
  
  for (let i = 0; i < value.length; i++) {
    const char = value[i];
    
    if (!inQuote) {
      if ((char === '"' || char === "'") && current.trim() === '') {
        // Starting a quoted value (only at beginning of item)
        inQuote = true;
        quoteChar = char;
        current += char; // Include the opening quote
      } else if (char === ',') {
        // End of current item
        items.push(unquoteValue(current.trim()));
        current = '';
      } else {
        current += char;
      }
    } else {
      // Inside quotes
      current += char;
      if (char === quoteChar) {
        // Check if it's escaped (doubled) or end of quote
        if (i + 1 < value.length && value[i + 1] === quoteChar) {
          // Escaped quote - add the next quote and skip it
          current += quoteChar;
          i++; // Skip the next character
        } else {
          // End of quoted value
          inQuote = false;
          quoteChar = '';
        }
      }
    }
  }
  
  // Add the last item
  if (current.trim()) {
    items.push(unquoteValue(current.trim()));
  }
  
  // Return single item as string, multiple as array
  return items.length === 1 ? items[0] : items;
}

/**
 * Remove quotes from a value and handle escaped quotes
 * "value" -> value
 * "val""ue" -> val"ue
 */
function unquoteValue(value: string): string {
  if (!value) return value;
  
  // Check if wrapped in quotes
  if ((value.startsWith('"') && value.endsWith('"')) || 
      (value.startsWith("'") && value.endsWith("'"))) {
    const quote = value[0];
    let unquoted = value.slice(1, -1);
    // Replace doubled quotes with single quotes
    unquoted = unquoted.replace(new RegExp(quote + quote, 'g'), quote);
    return unquoted;
  }
  
  return value;
}

/**
 * Parse key=value pairs, handling quoted values and commas
 * Uses CSV-style escaping: quotes are escaped by doubling ("")
 * Supports:
 * - Simple values: x=Month
 * - Quoted values: title="Q4 Report, Final"
 * - Comma-separated lists: y=Revenue,Expenses,Profit
 * - Mixed quoted/unquoted lists: y="Revenue, After Tax",Expenses,"Profit, Net"
 * - Escaped quotes: title="Sales ""2024"" Report"
 */
function parseKeyValuePairs(input: string): [string, string][] {
  const pairs: [string, string][] = [];
  let pos = 0;
  
  while (pos < input.length) {
    // Skip leading whitespace
    while (pos < input.length && input[pos] === ' ') pos++;
    if (pos >= input.length) break;
    
    // Find the key (everything before =)
    let keyEnd = pos;
    while (keyEnd < input.length && input[keyEnd] !== '=') keyEnd++;
    
    if (keyEnd >= input.length) break; // No = found
    
    const key = input.substring(pos, keyEnd).trim();
    pos = keyEnd + 1; // Skip the =
    
    // Skip whitespace after =
    while (pos < input.length && input[pos] === ' ') pos++;
    
    // Find the value (handle quoted values and look for next key pattern)
    let value = '';
    let inQuote = false;
    let quoteChar = '';
    
    while (pos < input.length) {
      const char = input[pos];
      
      if (!inQuote) {
        // Check if starting a quote
        if (char === '"' || char === "'") {
          inQuote = true;
          quoteChar = char;
          value += char; // Include the opening quote
          pos++;
        } else if (char === ',') {
          // Check if this comma starts a new key=value pair
          // Look ahead for pattern: optional spaces, word chars, optional spaces, then =
          let lookahead = pos + 1;
          while (lookahead < input.length && input[lookahead] === ' ') lookahead++;
          
          let hasKeyPattern = false;
          if (lookahead < input.length) {
            // Check if we have word characters followed by optional spaces and =
            let keyStart = lookahead;
            while (lookahead < input.length && input[lookahead].match(/\w/)) lookahead++;
            // Skip optional spaces after key
            while (lookahead < input.length && input[lookahead] === ' ') lookahead++;
            if (lookahead < input.length && input[lookahead] === '=' && lookahead > keyStart) {
              hasKeyPattern = true;
            }
          }
          
          if (hasKeyPattern) {
            // This comma separates key=value pairs
            break;
          } else {
            // This comma is part of the value
            value += char;
            pos++;
          }
        } else {
          value += char;
          pos++;
        }
      } else {
        // Inside quotes - add everything including the closing quote
        value += char;
        if (char === quoteChar) {
          // Check if it's escaped (doubled)
          if (pos + 1 < input.length && input[pos + 1] === quoteChar) {
            // Escaped quote - add the next quote too
            pos++;
            value += char; // Add the second quote
          } else {
            // End of quoted value
            inQuote = false;
            quoteChar = '';
          }
        }
        pos++;
      }
    }
    
    pairs.push([key, value.trim()]);
    
    // Skip comma separator if present
    if (pos < input.length && input[pos] === ',') pos++;
  }
  
  return pairs;
}


/**
 * Parse CSV data using csv-parse and create cell value matrix
 */
function parseCSVData(csvText: string): {
  data: CellValue[][];
  columns: ColumnMetadata[];
} {
  if (!csvText.trim()) {
    return { data: [], columns: [] };
  }
  
  // Parse with csv-parse - smart null vs "" handling with quoting detection
  const rawRows = parse(csvText, {
    cast: (value: string, context: any) => {
      // Truly empty cell (unquoted) -> null (missing data)
      if (value === "" && !context.quoting) {
        return null;
      }
      
      // Quoted empty string -> "" (intentional empty)
      if (value === "" && context.quoting) {
        return "";
      }
      
      // Quoted fields with content -> preserve all spaces
      if (context.quoting) {
        return value;
      }
      
      // Unquoted fields -> trim spaces (standard CSV behavior)
      return value.trim();
    },
    skip_empty_lines: true,
    relax_quotes: true,
    relax_column_count: true, // Allow varying column counts across rows
    skip_records_with_error: false // Don't skip malformed records, try to parse them
  });
  
  if (rawRows.length === 0) {
    return { data: [], columns: [] };
  }
  
  // Filter out rows that are effectively empty (all cells are empty/whitespace)
  const filteredRows = rawRows.filter(row => 
    row.some(cell => cell !== null && cell !== undefined && cell.trim() !== '')
  );
  
  if (filteredRows.length === 0) {
    return { data: [], columns: [] };
  }
  
  // First row should be column headers with optional type annotations
  const headerRow = filteredRows[0];
  const dataRows = filteredRows.slice(1);
  
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
    return row.map((cellText, _colIndex) => {
      const cell: CellValue = {
        raw: cellText,
        value: cellText,
        type: DataType.TEXT // Will be inferred later
      };
      
      // Check if it's a formula (cellText could be null from transform)
      if (cellText && typeof cellText === 'string' && cellText.startsWith('=')) {
        cell.formula = cellText;
        cell.value = null; // Will be calculated later
        // Formulas keep TEXT type for now
      }
      
      return cell;
    });
  });
  
  // csv-parse handles whitespace processing with cast function, no post-processing needed
  
  // Infer types for columns that don't have explicit type annotations
  inferColumnTypes(data, columns, DEFAULT_CONFIG.typeInference);
  
  return { data, columns };
}


/**
 * Phase 1: Pre-calculation type inference for columns without explicit type annotations
 */
function inferColumnTypes(data: CellValue[][], columns: ColumnMetadata[], config: TypeInferenceConfig): void {
  for (let colIndex = 0; colIndex < columns.length; colIndex++) {
    const column = columns[colIndex];
    
    // Skip columns that already have explicit type annotations
    if (column.type && column.type !== 'UNSPECIFIED') {
      // Apply the explicit type to all cells in this column
      applyTypeToColumn(data, colIndex, column.type);
      continue;
    }
    
    // Phase 1: Analyze formula vs value ratio
    const sample = data.slice(0, Math.min(data.length, config.sampleSize));
    let valueCount = 0;
    let formulaCount = 0;
    const values: string[] = [];
    
    for (let rowIndex = 0; rowIndex < sample.length; rowIndex++) {
      const cell = sample[rowIndex]?.[colIndex];
      if (cell && cell.raw !== null && cell.raw !== undefined && cell.raw.trim() !== '') {
        if (cell.formula) {
          formulaCount++;
        } else {
          valueCount++;
          values.push(cell.raw.trim());
        }
      }
    }
    
    const totalCells = valueCount + formulaCount;
    const formulaRatio = totalCells > 0 ? formulaCount / totalCells : 0;
    
    // If too many formulas, defer to Phase 2 (post-calculation)
    if (formulaRatio >= config.formulaThreshold) {
      column.type = 'UNSPECIFIED';
      continue; // Don't apply type yet, wait for Phase 2
    }
    
    // If not enough non-formula values, defer to Phase 2
    if (values.length === 0) {
      column.type = 'UNSPECIFIED';
      continue;
    }
    
    // Phase 1: Infer type from non-formula values
    const inferredType = inferColumnType(values, config);
    column.type = inferredType;
    
    // Apply the inferred type to all cells in this column
    applyTypeToColumn(data, colIndex, inferredType);
  }
}

/**
 * Apply a data type to all cells in a column
 */
function applyTypeToColumn(data: CellValue[][], colIndex: number, dataType: DataType | 'UNSPECIFIED'): void {
  // Skip type application for UNSPECIFIED columns - will be handled in Phase 2
  if (dataType === 'UNSPECIFIED') {
    return;
  }
  
  for (let rowIndex = 0; rowIndex < data.length; rowIndex++) {
    const cell = data[rowIndex]?.[colIndex];
    if (cell) {
      cell.type = dataType;
      // Only convert the value for non-formula cells (formulas will be calculated later)
      if (!cell.formula) {
        // Store native value based on type conversion
        cell.value = convertValueForType(cell.raw, dataType);
      }
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
        if (cell && nextCell && cell.startsWith('=') && !cell.includes(')') && nextCell.includes(')')) {
          const possibleFormula = cell + ',' + nextCell;
          console.warn(`Warning: Possible split formula detected at row ${rowIndex + 1}.`);
          console.warn(`Found: "${cell}" followed by "${nextCell}"`);
          console.warn(`Did you mean: "${possibleFormula}" (quoted)?`);
          console.warn('Tip: Formulas containing commas should be quoted, e.g., "=SUM(A1,B1)"');
        }
        
        // Pattern 2: Cell starts with function name but has unclosed parentheses
        if (cell && nextCell && cell.match(/^=\w+\([^)]*$/) && nextCell.match(/[^(]*\)/)) {
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
      if (cell && cell.startsWith('=')) {
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