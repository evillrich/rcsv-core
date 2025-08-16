# RCSV Implementation Architecture

## Implementation Phases

### POC (Proof of Concept) Scope

**Minimal viable parser to validate core concepts:**

- **Single sheet support only**
- **Basic data types**: `text`, `number`, `currency`
- **One formula function**: `SUM()`
- **Basic cell references**: `=A1+B2`
- **One chart type**: `bar`
- **No formatting support**

**POC Example:**
```csv
## Chart: type=bar, title="Budget Overview", x=Category, y=Budget
Category:text,Budget:currency,Actual:currency,Total:currency
Housing,2000,1950,=B2+C2
Food,800,850,=B3+C3
Total,=SUM(B2:B3),=SUM(C2:C3),=SUM(D2:D3)
```

### MVP (v1.0) Scope

**Full feature set for public release:**

- **Multi-sheet support** with cross-references
- **All data types**: `text`, `number`, `currency`, `percentage`, `date`, `boolean`, `category`
- **Essential functions**: Mathematical, logical, lookup, text, date
- **All chart types**: `bar`, `column`, `line`, `pie`, `scatter`
- **Column formatting**: colors, bold, italic, alignment
- **Type inference** for untyped columns
- **Comprehensive error handling** with standard error codes
- **Parser modes**: strict and lenient

## Repository Structure

The RCSV ecosystem is designed as a modular set of repositories to enable flexible adoption and community contribution:

### Core Repositories

**1. `rcsv-spec`**
- **Purpose**: Official specification and documentation
- **Contents**: Format specification, grammar definitions, examples, test cases
- **Audience**: Implementers, contributors, standards body
- **Dependencies**: None (documentation only)

**2. `rcsv-core`** (Primary parser/engine)
- **Purpose**: Core parsing and calculation engine
- **Contents**: CSV parser, formula engine, type inference, dependency resolution
- **API**: `parseRCSV()`, `calculateFormulas()`, `validateRCSV()`
- **Dependencies**: Minimal (CSV parser, date library)
- **Output**: Structured data objects (no rendering)

**3. `rcsv-charts`** 
- **Purpose**: Chart generation from RCSV data
- **Contents**: Chart.js/D3 wrapper, chart type implementations
- **API**: `renderChart(chartMetadata, data)`
- **Dependencies**: `rcsv-core`, Chart.js or D3
- **Output**: SVG/Canvas chart elements

**4. `rcsv-web`**
- **Purpose**: Web-based table and spreadsheet renderer
- **Contents**: HTML table generation, CSS styling, interactive editing
- **API**: `renderRCSV(document, container)`
- **Dependencies**: `rcsv-core`, `rcsv-charts`
- **Output**: Interactive HTML components

### Ecosystem Repositories

**5. `rcsv-cli`**
- **Purpose**: Command line tools and utilities
- **Contents**: File conversion, validation, static generation
- **Commands**: `rcsv convert`, `rcsv validate`, `rcsv render`
- **Dependencies**: `rcsv-core`, export libraries

**6. `rcsv-extensions`**
- **Purpose**: Editor and platform integrations
- **Contents**: VS Code extension, GitHub renderer, markdown-it plugin
- **Integrations**: VS Code, GitHub, GitLab, various documentation platforms
- **Dependencies**: Platform-specific APIs + `rcsv-core`

### Benefits of Modular Architecture

**For Core Development:**
- Clear separation of concerns
- Independent versioning and releases
- Easier testing and maintenance
- Focused contributor expertise

**For Ecosystem Growth:**
- Companies can adopt just the parser without UI dependencies
- Mobile apps can use core + custom native renderer  
- Terminal applications can use core + ASCII rendering
- PDF generators can use core + print-specific formatting
- Reduces bundle sizes for specific use cases

**For Community:**
- Multiple entry points for contributors
- Alternate implementations possible (Python, Go, Rust)
- Platform-specific optimizations
- Innovation in rendering approaches

### Example Usage Patterns

**Basic parsing:**
```typescript
import { parseRCSV, calculateFormulas } from '@rcsv/core';
const doc = parseRCSV(input);
const calculated = calculateFormulas(doc);
```

**Web application:**
```typescript
import { renderRCSV } from '@rcsv/web';
renderRCSV(document, containerElement);
```

**Custom renderer:**
```typescript
import { parseRCSV } from '@rcsv/core';
import { generateChart } from '@rcsv/charts';
import { MyCustomRenderer } from './my-renderer';

const doc = parseRCSV(input);
const charts = doc.sheets.map(sheet => 
  sheet.charts.map(chart => generateChart(chart, sheet.data))
);
return <MyCustomRenderer data={doc} charts={charts} />;
```

## Overview

This document outlines the technical implementation approach for Rich CSV (RCSV) parsers and renderers. It covers algorithms, data structures, libraries, and implementation strategies.

## Core Architecture Components

### 1. Parser Pipeline
```
Raw RCSV Text → Tokenizer → Structure Parser → Type Inference → Formula Parser → Dependency Graph → Calculator → Renderer
```

### 2. Data Structures

#### Document Structure
```typescript
interface RCSVDocument {
  metadata: DocumentMetadata;
  sheets: Map<string, Sheet>;
  version: string;
}

interface Sheet {
  name: string;
  metadata: SheetMetadata;
  columns: Column[];
  rows: Row[];
  charts: Chart[];
}

interface Cell {
  value: any;
  formula?: string;
  type: DataType;
  formatting?: CellFormatting;
  dependencies?: CellReference[];
  dependents?: CellReference[];
  validationList?: string[]; // For category type
}
```

#### Dependency Graph
```typescript
interface DependencyGraph {
  nodes: Map<CellReference, DependencyNode>;
  edges: Map<CellReference, Set<CellReference>>;
  calculationOrder: CellReference[];
  circularReferences: CellReference[][];
}
```

## Parsing Algorithm

### 1. Tokenization
```typescript
enum TokenType {
  COMMENT,          // # comment
  METADATA,         // ## metadata
  HEADER,           // column headers
  DATA_ROW,         // data values
  FORMULA,          // =expression
  INLINE_FORMAT     // value:format
}
```

### 2. Structure Parsing

**Multi-sheet Detection:**
- Scan for `# Sheet:` markers
- Split document into sheet sections
- Parse each sheet independently

**Metadata Extraction:**
- Document-level: Lines starting with `# Key:`
- Sheet-level: Lines starting with `## Key:`
- Store in metadata objects

**CSV Parsing:**
- Use standard CSV library for data rows
- Handle escaping according to RFC 4180
- Process column headers separately for type information

### 3. Type Inference Algorithm

```typescript
enum DataType {
  TEXT = 'text',
  NUMBER = 'number',
  CURRENCY = 'currency',
  PERCENTAGE = 'percentage',
  DATE = 'date',
  BOOLEAN = 'boolean',
  CATEGORY = 'category'
}

function inferType(value: string, validationList?: string[]): DataType {
  // Boolean check (highest priority)
  if (/^(true|false)$/i.test(value)) return DataType.BOOLEAN;
  
  // Date check (ISO format first, then common formats)
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return DataType.DATE;
  if (/^(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})$/.test(value)) return DataType.DATE;
  
  // Currency check (currency symbols)
  if (/^[\$€£¥][\d,]+\.?\d*$/.test(value)) return DataType.CURRENCY;
  
  // Percentage check
  if (/^\d+\.?\d*%$/.test(value)) return DataType.PERCENTAGE;
  
  // Number check
  if (/^-?\d+\.?\d*$/.test(value)) return DataType.NUMBER;
  
  // Category check (if validation list provided)
  if (validationList && validationList.includes(value)) {
    return DataType.CATEGORY;
  }
  
  // Default to text
  return DataType.TEXT;
}

// Parse category type with validation
function parseColumnType(typeStr: string): { type: DataType; validationList?: string[] } {
  const categoryMatch = typeStr.match(/^category\((.+)\)$/);
  if (categoryMatch) {
    const validationList = categoryMatch[1].split(',').map(s => s.trim());
    return { type: DataType.CATEGORY, validationList };
  }
  return { type: typeStr as DataType };
}
```

## Formula Processing

### 1. Formula Parsing

**Lexical Analysis:**
```typescript
enum FormulaToken {
  FUNCTION,     // SUM, AVERAGE, etc.
  CELL_REF,     // A1, B2:C4
  SHEET_REF,    // Sheet1.A1, 'My Sheet'.A1
  OPERATOR,     // +, -, *, /, =, <, >
  LITERAL,      // 42, "text", TRUE
  PARENTHESIS   // (, )
}
```

**Grammar (Simplified BNF):**
```
formula := "=" expression
expression := term (("+"|"-") term)*
term := factor (("*"|"/") factor)*
factor := number | string | boolean | cell_ref | function_call | "(" expression ")"
function_call := function_name "(" argument_list ")"
cell_ref := [sheet_name "."] cell_address [":" cell_address]
```

### 2. Dependency Tracking

**Build Phase:**
```typescript
function buildDependencyGraph(sheets: Sheet[]): DependencyGraph {
  const graph = new DependencyGraph();
  
  // First pass: identify all formulas and their dependencies
  for (const sheet of sheets) {
    for (const row of sheet.rows) {
      for (const cell of row.cells) {
        if (cell.formula) {
          const deps = extractDependencies(cell.formula);
          graph.addNode(cell.reference, deps);
        }
      }
    }
  }
  
  // Second pass: build reverse dependencies (dependents)
  for (const [cellRef, node] of graph.nodes) {
    for (const dep of node.dependencies) {
      graph.addEdge(dep, cellRef);
    }
  }
  
  return graph;
}
```

**Topological Sort:**
```typescript
function calculateOrder(graph: DependencyGraph): CellReference[] {
  const visited = new Set<CellReference>();
  const temp = new Set<CellReference>();
  const result: CellReference[] = [];
  
  function visit(node: CellReference) {
    if (temp.has(node)) {
      // Circular dependency detected
      graph.circularReferences.push(findCycle(node));
      return;
    }
    
    if (visited.has(node)) return;
    
    temp.add(node);
    for (const dep of graph.nodes.get(node)?.dependencies || []) {
      visit(dep);
    }
    temp.delete(node);
    visited.add(node);
    result.push(node);
  }
  
  for (const node of graph.nodes.keys()) {
    if (!visited.has(node)) {
      visit(node);
    }
  }
  
  return result;
}
```

### 3. Circular Reference Resolution

**Detection:**
- Identified during topological sort
- Track strongly connected components

**Resolution Algorithm:**
```typescript
function resolveCircularReferences(cycles: CellReference[][], maxIterations = 10): void {
  for (const cycle of cycles) {
    let converged = false;
    let iteration = 0;
    
    // Store previous values for convergence check
    const previousValues = new Map<CellReference, number>();
    for (const cellRef of cycle) {
      previousValues.set(cellRef, getCellValue(cellRef));
    }
    
    while (!converged && iteration < maxIterations) {
      let maxChange = 0;
      
      // Calculate all cells in cycle once
      for (const cellRef of cycle) {
        const oldValue = getCellValue(cellRef);
        const newValue = calculateFormula(cellRef);
        setCellValue(cellRef, newValue);
        
        const change = Math.abs(newValue - oldValue);
        maxChange = Math.max(maxChange, change);
      }
      
      // Check for convergence (change < 0.001)
      converged = maxChange < 0.001;
      iteration++;
    }
    
    // If not converged, mark cells with error
    if (!converged) {
      for (const cellRef of cycle) {
        setCellError(cellRef, "#CIRCULAR!");
      }
    }
  }
}
```

## Function Implementation

### 1. Function Registry
```typescript
interface FunctionDefinition {
  name: string;
  minArgs: number;
  maxArgs: number;
  implementation: (args: FormulaValue[]) => FormulaValue;
  description: string;
}

const FUNCTION_REGISTRY = new Map<string, FunctionDefinition>([
  ["SUM", {
    name: "SUM",
    minArgs: 1,
    maxArgs: 255,
    implementation: (args) => {
      let total = 0;
      for (const arg of args) {
        if (typeof arg === 'number') total += arg;
        else if (Array.isArray(arg)) {
          total += arg.filter(v => typeof v === 'number').reduce((a, b) => a + b, 0);
        }
      }
      return total;
    },
    description: "Sum of values in range"
  }],
  // ... other functions
]);
```

### 2. Range Processing
```typescript
function expandRange(rangeRef: string, sheet: Sheet): any[] {
  const [start, end] = rangeRef.split(':');
  const startCoord = parseCoordinate(start);
  const endCoord = parseCoordinate(end || start);
  
  const values = [];
  for (let row = startCoord.row; row <= endCoord.row; row++) {
    for (let col = startCoord.col; col <= endCoord.col; col++) {
      const cell = sheet.getCell(row, col);
      values.push(cell?.value);
    }
  }
  
  return values;
}
```

## Performance Optimizations

### 1. Incremental Calculation
```typescript
class CalculationEngine {
  private dirtyKeys = new Set<CellReference>();
  
  markDirty(cellRef: CellReference): void {
    this.dirtyKeys.add(cellRef);
    
    // Mark all dependents as dirty
    const dependents = this.graph.getDependents(cellRef);
    for (const dependent of dependents) {
      this.dirtyKeys.add(dependent);
    }
  }
  
  recalculate(): void {
    // Only recalculate dirty cells in dependency order
    const dirtyInOrder = this.calculateOrder.filter(ref => 
      this.dirtyKeys.has(ref)
    );
    
    for (const cellRef of dirtyInOrder) {
      this.calculateCell(cellRef);
      this.dirtyKeys.delete(cellRef);
    }
  }
}
```

### 2. Lazy Evaluation
- Calculate formulas only when needed for display/export
- Cache calculated values until dependencies change
- Use virtual scrolling for large datasets

### 3. Memory Management
- Weak references for dependency graph to prevent memory leaks
- Garbage collect unused formula ASTs
- Limit maximum worksheet size (practical limits TBD via performance testing)

## Chart Rendering

### 1. Chart Data Processing
```typescript
interface ChartMetadata {
  type: 'bar' | 'column' | 'line' | 'pie' | 'scatter';
  title?: string;
  x?: string;
  y?: string | string[]; // Multiple columns for multi-series
  series?: string[]; // Custom series names
  values?: string; // For pie charts
  labels?: string; // For pie charts
}

function prepareChartData(chart: ChartMetadata, sheet: Sheet): ChartData {
  // Handle multi-series charts
  if (Array.isArray(chart.y)) {
    const xColumn = sheet.getColumn(chart.x);
    const series = chart.series || chart.y;
    
    const datasets = chart.y.map((yCol, idx) => {
      const yColumn = sheet.getColumn(yCol);
      const data = [];
      for (let i = 0; i < sheet.rowCount; i++) {
        data.push({
          x: xColumn.getValue(i),
          y: yColumn.getValue(i)
        });
      }
      return {
        label: series[idx],
        data: data
      };
    });
    
    return {
      type: chart.type,
      datasets: datasets,
      options: {
        title: chart.title,
        responsive: true
      }
    };
  }
  
  // Handle pie charts
  if (chart.type === 'pie') {
    const valuesColumn = sheet.getColumn(chart.values);
    const labelsColumn = sheet.getColumn(chart.labels);
    
    const data = [];
    for (let i = 0; i < sheet.rowCount; i++) {
      data.push({
        label: labelsColumn.getValue(i),
        value: valuesColumn.getValue(i)
      });
    }
    
    return {
      type: 'pie',
      data: data,
      options: {
        title: chart.title,
        responsive: true
      }
    };
  }
  
  // Handle single series charts
  const xColumn = sheet.getColumn(chart.x);
  const yColumn = sheet.getColumn(chart.y as string);
  
  const data = [];
  for (let i = 0; i < sheet.rowCount; i++) {
    data.push({
      x: xColumn.getValue(i),
      y: yColumn.getValue(i)
    });
  }
  
  return {
    type: chart.type,
    data: data,
    options: {
      title: chart.title,
      responsive: true
    }
  };
}
```

### 2. Chart Types Implementation
Each chart type maps to specific rendering library configurations:
- **Bar/Column**: Vertical/horizontal bar charts
- **Line**: Line charts with optional points
- **Pie**: Pie charts with percentage labels
- **Scatter**: X-Y scatter plots
- **Multi-series**: Support for multiple data series in line, bar, and column charts

## Error Handling Strategy

### 1. Parser Modes
```typescript
interface ParserOptions {
  strict: boolean; // Default: false (lenient mode)
  locale?: string; // For internationalization
}

function parseRCSV(input: string, options: ParserOptions = { strict: false }): ParseResult {
  const errors: ParseError[] = [];
  const warnings: ParseWarning[] = [];
  
  if (options.strict) {
    // Strict mode: fail on any error
    return parseStrict(input);
  } else {
    // Lenient mode: continue with warnings
    return parseLenient(input, errors, warnings);
  }
}
```

### 2. Standard Error Codes
```typescript
enum ErrorCode {
  NAME_ERROR = '#NAME?',     // Unknown function or named range
  VALUE_ERROR = '#VALUE!',    // Wrong type of argument
  REF_ERROR = '#REF!',       // Invalid cell reference
  DIV_ZERO = '#DIV/0!',      // Division by zero
  CIRCULAR = '#CIRCULAR!',    // Unresolved circular reference
  NULL_ERROR = '#NULL!',     // Intersection of ranges is null
  NUM_ERROR = '#NUM!',       // Invalid numeric value
  NA_ERROR = '#N/A'          // Value not available
}

function handleFormulaError(error: Error): ErrorCode {
  if (error instanceof UnknownFunctionError) return ErrorCode.NAME_ERROR;
  if (error instanceof TypeMismatchError) return ErrorCode.VALUE_ERROR;
  if (error instanceof InvalidReferenceError) return ErrorCode.REF_ERROR;
  if (error instanceof DivisionByZeroError) return ErrorCode.DIV_ZERO;
  if (error instanceof CircularReferenceError) return ErrorCode.CIRCULAR;
  if (error instanceof NumericError) return ErrorCode.NUM_ERROR;
  return ErrorCode.NA_ERROR;
}
```

### 3. Graceful Degradation
- Invalid metadata → Skip with warning (lenient mode) or fail (strict mode)
- Unknown functions → Display `#NAME?` error
- Type mismatches → Display `#VALUE!` error
- Invalid references → Display `#REF!` error
- Circular references → Attempt resolution, then `#CIRCULAR!`

## Technology Stack Recommendations

### 1. Core Libraries

**JavaScript/TypeScript:**
- **CSV Parsing**: `papaparse` - Universal browser/Node.js support with streaming, error recovery, and Web Workers
- **Formula Engine**: Custom implementation using `peggy` parser generator - balanced approach between power and bundle size
- **Charts**: `Chart.js` for renderer - simple API perfect for basic charts
- **Date Handling**: `date-fns` or `luxon`

**Why PapaParse:**
- **Universal platform support**: Works in both browser and Node.js (essential for "embeddable everywhere")
- **Error recovery**: Row-by-row error handling aligns with RCSV's lenient parsing mode
- **Streaming support**: Handles large files progressively up to 10,000+ rows
- **Web Workers**: Offload parsing to background threads in browser environments
- **Flexible parsing**: Both synchronous (small embedded tables) and asynchronous (large files) modes

**Python:**
- **CSV Parsing**: Built-in `csv` module or `pandas`
- **Formula Engine**: Custom implementation using `pyparsing`
- **Charts**: `matplotlib` or `plotly`
- **Date Handling**: Built-in `datetime` module

### 2. Web Implementation
```typescript
// Example parser architecture
class RCSVParser {
  private csvParser = new CSVParser();
  private formulaEngine = new FormulaEngine();
  private chartRenderer = new ChartRenderer();
  
  parse(input: string): RCSVDocument {
    // Implementation here
  }
}
```

### 3. Performance Targets
- **Parse time**: <100ms for typical documents (up to 10,000 rows)
- **Calculation time**: <100ms for formula recalculation
- **Memory usage**: <50MB for documents within recommended limits
- **Target capacity**: Up to 10,000 rows for typical interactive performance
- **Recommended limits**: 100 sheets per document, 1,000 columns per sheet
- **File size**: Optimized for <5MB RCSV files

## Testing Strategy

### 1. Unit Tests
- Parser components (tokenizer, structure parser, type inference)
- Formula engine (individual functions, dependency resolution)
- Error handling (malformed input, circular references)

### 2. Integration Tests
- Full document parsing and calculation
- Cross-sheet references
- Chart generation

### 3. Performance Tests
- Large document parsing (1000+ rows)
- Complex formula chains
- Memory usage profiling

### 4. Compatibility Tests
- CSV round-trip compatibility
- Excel import/export accuracy
- Different platform behaviors

## Internationalization (i18n)

### 1. Locale Support
```typescript
interface LocaleSettings {
  dateFormat: 'ISO' | 'US' | 'EU'; // YYYY-MM-DD, MM/DD/YYYY, DD/MM/YYYY
  decimalSeparator: '.' | ',';
  thousandsSeparator: ',' | '.' | ' ';
  currencySymbol: string;
  currencyPosition: 'prefix' | 'suffix';
}

function detectLocale(): LocaleSettings {
  // Detect from system settings or browser locale
  const systemLocale = navigator.language || 'en-US';
  return getLocaleSettings(systemLocale);
}
```

### 2. Canonical Serialization
```typescript
// RCSV files MUST use canonical format for data exchange
const CANONICAL_FORMAT = {
  decimalSeparator: '.',
  thousandsSeparator: ',',
  dateFormat: 'ISO' // YYYY-MM-DD
};

function serializeNumber(value: number, locale: LocaleSettings): string {
  // Always serialize to canonical format for file storage
  return value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function parseNumber(text: string, locale: LocaleSettings): number {
  // Accept locale-specific input but store canonically
  if (locale.decimalSeparator === ',') {
    text = text.replace(',', '.');
  }
  if (locale.thousandsSeparator !== ',') {
    text = text.replace(new RegExp(`\\${locale.thousandsSeparator}`, 'g'), '');
  }
  return parseFloat(text);
}
```

### 3. Date Handling
```typescript
function parseDate(text: string, locale: LocaleSettings): Date {
  // Support multiple formats based on locale
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    // ISO format (universal)
    return new Date(text);
  } else if (locale.dateFormat === 'US' && /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(text)) {
    // MM/DD/YYYY
    const [month, day, year] = text.split('/');
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  } else if (locale.dateFormat === 'EU' && /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(text)) {
    // DD/MM/YYYY
    const [day, month, year] = text.split('/');
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }
  throw new Error('Invalid date format');
}
```

## Escaping Rules

### 1. CSV Standard Escaping
```typescript
function escapeCSVValue(value: string): string {
  // Quote if contains comma, quote, or newline
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    // Double quotes to escape them
    value = value.replace(/"/g, '""');
    return `"${value}"`;
  }
  return value;
}
```

### 2. RCSV-Specific Escaping
```typescript
// Hash symbols in data are literal, not comments
function isComment(line: string): boolean {
  // Comments only at start of line (with optional whitespace)
  return /^\s*#/.test(line);
}

// Double colon escaping in column formatting
function parseColumnFormat(format: string): ColumnFormat {
  // Replace :: with placeholder, then parse
  const escaped = format.replace('::', '\u0000');
  const parts = escaped.split(':');
  
  return {
    name: parts[0].replace('\u0000', ':'),
    type: parts[1] as DataType,
    alignment: parts[2] as Alignment,
    style: parseStyle(parts.slice(3))
  };
}

// Sheet name escaping for references
function escapeSheetName(name: string): string {
  // Always use quotes if contains spaces or apostrophes
  if (name.includes(' ') || name.includes("'")) {
    // Double apostrophes to escape
    name = name.replace(/'/g, "''");
    return `'${name}'`;
  }
  return name;
}
```

### 3. Formatting Without Types
```typescript
function parseColumnMetadata(metadata: string): ColumnMetadata {
  const parts = metadata.split(',').map(s => s.trim());
  
  return parts.map(part => {
    const colParts = part.split(':');
    const name = colParts[0];
    
    // Check if next part is a type or formatting
    let type: DataType | undefined;
    let formatIndex = 1;
    
    if (colParts[1] && isDataType(colParts[1])) {
      type = colParts[1] as DataType;
      formatIndex = 2;
    }
    
    // Parse remaining as formatting
    const formatting = colParts.slice(formatIndex);
    
    return {
      name,
      type, // undefined triggers type inference
      formatting: parseFormatting(formatting)
    };
  });
}
```

## Security Considerations

### 1. Formula Injection Prevention
- Sandboxed formula execution
- Function whitelist (no file system access)
- Input sanitization for external data

### 2. Resource Limits
- Maximum formula complexity
- Calculation timeout limits
- Memory usage caps

### 3. Safe Defaults
- Disable external references by default
- Validate all user inputs
- Escape special characters in output

---

*RCSV Implementation Architecture v1.1*