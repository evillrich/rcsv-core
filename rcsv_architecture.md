# RCSV Implementation Architecture

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
function inferType(value: string): DataType {
  // Boolean check
  if (/^(true|false)$/i.test(value)) return DataType.BOOLEAN;
  
  // Date check (ISO format first, then common formats)
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return DataType.DATE;
  if (/^(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})$/.test(value)) return DataType.DATE;
  
  // Currency check
  if (/^[\$€£¥][\d,]+\.?\d*$/.test(value)) return DataType.CURRENCY;
  
  // Percentage check
  if (/^\d+\.?\d*%$/.test(value)) return DataType.PERCENTAGE;
  
  // Number check
  if (/^-?\d+\.?\d*$/.test(value)) return DataType.NUMBER;
  
  // Default to text
  return DataType.TEXT;
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
function prepareChartData(chart: ChartMetadata, sheet: Sheet): ChartData {
  const xColumn = sheet.getColumn(chart.x);
  const yColumn = sheet.getColumn(chart.y);
  
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

## Error Handling Strategy

### 1. Parse Error Recovery
```typescript
function parseWithErrorRecovery(input: string): ParseResult {
  const errors: ParseError[] = [];
  const warnings: ParseWarning[] = [];
  
  try {
    // Attempt full parse
    return parseRCSV(input);
  } catch (error) {
    // Fallback to line-by-line parsing
    return parseLineByLine(input, errors, warnings);
  }
}
```

### 2. Graceful Degradation
- Invalid metadata → Skip with warning
- Unknown functions → Display as `#NAME?`
- Type mismatches → Fall back to text display
- Circular references → Attempt resolution, then error

## Technology Stack Recommendations

### 1. Core Libraries

**JavaScript/TypeScript:**
- **CSV Parsing**: `papaparse` or `csv-parser`
- **Formula Engine**: Custom implementation using `chevrotain` for parsing
- **Charts**: `Chart.js` or `D3.js` for flexibility
- **Date Handling**: `date-fns` or `luxon`

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
- **Parse time**: <100ms for typical documents (target: 1,000-10,000 rows)
- **Calculation time**: <50ms for formula recalculation
- **Memory usage**: <50MB for typical documents
- **File size**: Target <5MB for typical RCSV files
- **Row limits**: Performance testing will determine practical limits (target support for 10,000+ rows)

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

*RCSV Implementation Architecture v1.0*