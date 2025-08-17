# RCSV Technical Decisions

## POC Implementation Strategy

### Repository Structure Decision

**Question**: Should we build everything in `rcsv-core` for POC, or start with the modular structure?

**Decision**: **Start with monolithic POC in `rcsv-core`, refactor to modules for MVP**

**Rationale**:
- Faster iteration during POC phase
- Easier to refactor once interfaces are clear
- Avoid premature optimization of module boundaries
- Single repo simplifies initial development and testing

### POC Deliverables

The POC will include two main components in this repo:

1. **Core Library** (`src/core/`)
   - Parse RCSV format with metadata extraction
   - Type inference for `text`, `number`, `currency`
   - Formula parsing for `SUM()` and basic math
   - Calculate formulas and resolve dependencies
   - Export parsed structure (no rendering)

2. **Web Renderer** (`src/renderer/`)
   - HTML table generation from parsed data
   - Chart.js integration for chart metadata
   - Clean separation from core parser
   - Future home of `rcsv-web` package

3. **Demo Application** (`src/demo/`)
   - Integration example using both core and renderer
   - Shows how to build applications with RCSV
   - Served via `npm run demo`

### MVP Repository Split

After POC validation, split into:
- `rcsv-core` - Parser and calculation engine only (no rendering)
- `rcsv-web` - Web renderer with Chart.js integration
- Additional renderers as needed (React components, Vue components, etc.)

## Technology Decisions

### 1. CSV Parsing
**Decision**: PapaParse
- **Rationale**: Universal browser/Node.js support, streaming, error recovery
- **POC Usage**: Synchronous parsing for simplicity

### 2. Formula Parser
**Decision**: Peggy (PEG parser generator)
- **Rationale**: 
  - **Scales to full spec**: Handles 30+ functions from MVP and future backlog
  - **Balanced approach**: More powerful than hand-written, lighter than Chevrotain
  - **Bundle size**: ~80KB vs Chevrotain's 150KB (important for embedding)
  - **Proven for formulas**: Used by spreadsheet tools and math expression parsers
  - **Good error messages**: Sufficient for formula syntax errors
  - **Simple grammar syntax**: Easy to maintain and extend
  - **No runtime overhead**: Parser generated at build time
- **Alternative considered**: Chevrotain (too heavy), hand-written (doesn't scale)

### 3. Chart Library
**Decision**: Chart.js v4.5+ with tree-shaking (renderer only)
- **Core parser**: NO chart library needed - only parses/validates metadata
- **Renderer**: Uses Chart.js with selective imports to minimize bundle

**2024 Research Results**:
- **Chart.js**: ~80KB with tree-shaking (vs 265KB full), excellent docs, active development
- **uPlot**: ~48KB but poor documentation, time-series focused
- **Frappe Charts**: ~19KB but unmaintained (4 years old)
- **Plotly.js**: 3.5MB - too heavy for embedding

**Chart.js Tree-Shaking Implementation**:
```typescript
// Import only needed components (~80KB vs 265KB)
import {
  Chart, BarController, LineController, PieController,
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Title, Tooltip, Legend
} from 'chart.js';
```

**Rationale**: 
- **Best documentation** - Critical for implementation
- **Performance improvements** - 2024 version handles large datasets
- **Future-proof** - Can add features incrementally
- **Bundle size acceptable** - 80KB is reasonable for full chart functionality
- **Active maintenance** - Regular updates, huge community

### 4. Date Handling
**Decision**: date-fns as required dependency
- **Bundle Size**: ~5KB (tree-shaken to only needed functions)
- **EU/US Format Support**: Robust parsing for both DD/MM/YYYY and MM/DD/YYYY
- **Industry Reality**: 31M weekly downloads - most embedding apps already have it
- **Zero Fallback**: No complexity of native Date fallbacks

**Required Functions**:
```typescript
import { parse, isValid, getYear, getMonth, getDate } from 'date-fns';

// Robust date parsing with locale support
function parseRCSVDate(dateStr: string, locale: 'US' | 'EU' = 'US'): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return parse(dateStr, 'yyyy-MM-dd', new Date());
  }
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr)) {
    const format = locale === 'EU' ? 'dd/MM/yyyy' : 'MM/dd/yyyy';
    return parse(dateStr, format, new Date());
  }
  throw new Error(`Invalid date: ${dateStr}`);
}
```

**Rationale**:
- **Most target apps already use date-fns** (business dashboards, CRM, analytics)
- **Reliable EU date parsing** - Critical for international use
- **No complexity** - Just require the dependency everyone already has
- **Professional grade** - Handle edge cases that native Date misses

### 5. Build System
**Decision**: Vite
- **Rationale**:
  - Fast development server for web demo
  - Built-in TypeScript support
  - Easy library mode for core parser
  - Simple configuration

### 6. Testing Framework
**Decision**: Vitest
- **Rationale**:
  - Vite-native for consistency
  - Jest-compatible API
  - Fast execution
  - Built-in TypeScript support

### 7. Project Structure
```
rcsv-core/
├── src/
│   ├── core/                # Core library (future @rcsv/core)
│   │   ├── parser/
│   │   │   ├── tokenizer.ts      # Split RCSV into tokens
│   │   │   ├── metadata.ts       # Parse comments and metadata
│   │   │   ├── csv.ts           # PapaParse wrapper
│   │   │   ├── formula.ts       # Formula parser
│   │   │   └── index.ts         # Parser exports
│   │   ├── engine/
│   │   │   ├── calculator.ts    # Formula calculation
│   │   │   ├── functions.ts     # SUM implementation
│   │   │   └── types.ts         # TypeScript interfaces
│   │   └── index.ts         # Main core exports
│   ├── renderer/            # Web renderer (future @rcsv/web)
│   │   ├── table.ts         # HTML table rendering
│   │   ├── charts.ts        # Chart.js integration
│   │   └── index.ts         # Renderer exports
│   └── demo/                # Integration demo
│       ├── index.html       # Demo page
│       ├── demo.ts          # Uses core + renderer
│       └── style.css        # Basic styling
├── tests/
│   ├── core/
│   │   ├── parser/
│   │   └── engine/
│   └── renderer/
├── examples/
│   └── budget.rcsv          # POC example file
└── package.json
```

### 8. Package Configuration
**Decision**: Single package with multiple entry points
```json
{
  "name": "@rcsv/core",
  "version": "0.1.0-poc",
  "exports": {
    ".": "./dist/core/index.js",
    "./renderer": "./dist/renderer/index.js"
  },
  "scripts": {
    "dev": "vite dev src/demo",
    "build": "vite build",
    "test": "vitest",
    "demo": "vite src/demo"
  }
}
```

### 9. TypeScript Configuration
**Decision**: Strict mode from start
```json
{
  "compilerOptions": {
    "strict": true,
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "node",
    "lib": ["ES2020", "DOM"]
  }
}
```

### 10. Parser Architecture

**Decision**: Two-pass parsing

**Pass 1 - Structure & Metadata**:
```typescript
function extractStructure(text: string): {
  metadata: DocumentMetadata;
  sheets: SheetRawData[];
}
```

**Pass 2 - CSV & Formula Parsing**:
```typescript
function parseSheets(sheets: SheetRawData[]): Sheet[]
```

**Rationale**:
- Clear separation of concerns
- Easier to handle multi-sheet documents
- Metadata available before parsing data

### 11. Type Inference Algorithm

**Decision**: Two-phase inference with formula handling and configurable parameters

**Approach**: **Two-Phase Type Inference**

**Phase 1: Pre-calculation Inference**
- Analyzes columns with explicit type annotations (e.g., `Sales:currency`)
- Analyzes columns with low formula ratios (< 50% formulas by default)
- Defers formula-heavy columns to Phase 2

**Phase 2: Post-calculation Inference** 
- Analyzes formula results after calculation engine runs
- Handles columns that were marked as `UNSPECIFIED` in Phase 1
- More accurate for formula-derived data

**Configuration Interface**:
```typescript
interface TypeInferenceConfig {
  sampleSize: number;           // Default: 100 rows
  confidenceThreshold: number;  // Default: 0.8 (80%)
  formulaThreshold: number;     // Default: 0.5 (50%) - defer to Phase 2
}
```

**Phase 1 Algorithm**:
```typescript
function inferColumnTypes(data: CellValue[][], columns: ColumnMetadata[], config: TypeInferenceConfig): void {
  for (let colIndex = 0; colIndex < columns.length; colIndex++) {
    const column = columns[colIndex];
    
    // Skip columns with explicit type annotations
    if (column.type && column.type !== 'UNSPECIFIED') {
      applyTypeToColumn(data, colIndex, column.type);
      continue;
    }
    
    // Analyze formula vs value ratio
    const sample = data.slice(0, config.sampleSize);
    let valueCount = 0;
    let formulaCount = 0;
    const values: string[] = [];
    
    for (const row of sample) {
      const cell = row[colIndex];
      if (cell && cell.raw.trim() !== '') {
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
      continue;
    }
    
    // If not enough non-formula values, defer to Phase 2
    if (values.length === 0) {
      column.type = 'UNSPECIFIED';
      continue;
    }
    
    // Phase 1: Infer type from non-formula values
    const inferredType = inferColumnType(values, config);
    column.type = inferredType;
    applyTypeToColumn(data, colIndex, inferredType);
  }
}
```

**Phase 2: Post-calculation Inference**
```typescript
// Phase 2 happens after formula calculation in the engine
function finalizeColumnTypes(document: RCSVDocument): void {
  document.sheets.forEach(sheet => {
    sheet.metadata.columns.forEach((column, colIndex) => {
      if (column.type === 'UNSPECIFIED') {
        // Analyze calculated formula results
        const calculatedValues = sheet.data.map(row => {
          const cell = row[colIndex];
          return cell?.value?.toString() || '';
        }).filter(v => v.trim() !== '');
        
        // Apply same inference logic to calculated results
        const inferredType = inferColumnType(calculatedValues, config);
        column.type = inferredType;
        
        // Update all cells in this column with the final type
        applyTypeToColumn(sheet.data, colIndex, inferredType);
      }
    });
  });
}
```

**UNSPECIFIED Type Handling**:
- Temporary type assigned during Phase 1
- Indicates "defer to post-calculation inference"
- Never appears in final output - always resolved to concrete type
- Allows formula results to influence type decisions

**Why Two Phases?**
1. **Performance**: Avoid re-inferring types for obvious cases
2. **Accuracy**: Formula results provide better type signals than raw formulas
3. **Flexibility**: Handle mixed data patterns (some formulas, some values)
4. **Excel Compatibility**: Matches how Excel handles dynamic typing

**Configuration Options**:
- **Sample size**: 100 rows (default), configurable 50-500
- **Confidence threshold**: 80% (default), configurable 70-95%
- **Formula threshold**: 50% (default), configurable 0-90%
  - If ≥50% of cells are formulas, defer to post-calculation inference
  - Lower values = more aggressive Phase 1 inference
  - Higher values = more deferred to Phase 2
- **Priority handling**: More specific types beat general ones

**Excel/Sheets Compatibility**:
- Matches Excel's conservative approach
- Handles formula-heavy columns like Excel's dynamic typing
- Handles mixed data gracefully
- Preserves leading zeros (ID columns stay text)

### 12. Formula Engine Design

**Decision**: Direct calculation with simple dependency tracking

**POC Scope**:
- Parse formula to AST
- Extract cell references
- Calculate in dependency order
- No circular reference support (error if detected)

**Example AST**:
```typescript
type ASTNode = 
  | { type: 'number'; value: number }
  | { type: 'cell'; ref: string }
  | { type: 'range'; start: string; end: string }
  | { type: 'function'; name: string; args: ASTNode[] }
  | { type: 'binary'; op: string; left: ASTNode; right: ASTNode }
```

### 13. Cell Addressing

**Decision**: A1-style throughout
- **Internal**: Store as "A1", "B2", etc.
- **Conversion**: Utils for row/col index when needed
- **Rationale**: Matches user mental model, simpler for POC

### 14. Error Handling

**Decision**: Simple for POC, full codes for MVP

**POC**:
```typescript
class RCSVError extends Error {
  constructor(message: string, public line?: number) {
    super(message);
  }
}
```

**MVP**: Implement full error codes (#NAME?, #VALUE!, etc.)

### 15. State Management

**Decision**: Plain objects for POC
- No reactive library
- Simple mutation for calculations
- Re-render entire table on change (demo only)

### 16. Configuration Strategy

**Decision**: Configuration object passed to parser

**Type Inference Config**:
```typescript
interface RCSVConfig {
  typeInference: {
    sampleSize: number;           // Default: 100
    confidenceThreshold: number;  // Default: 0.8 (80%)
    formulaThreshold: number;     // Default: 0.5 (50%)
  };
  parser: {
    strict: boolean;              // Default: false
    locale?: string;              // Default: auto-detect
  };
}

// Usage
const doc = parseRCSV(text, {
  typeInference: { 
    sampleSize: 50, 
    confidenceThreshold: 0.7,
    formulaThreshold: 0.3  // More aggressive Phase 1 inference
  },
  parser: { strict: true }
});
```

### 17. Memory Strategy

**Decision**: Simple in-memory storage for POC/MVP, optimize based on user feedback

**POC/MVP Implementation**:
```typescript
interface RCSVDocument {
  sheets: Sheet[];
  metadata: DocumentMetadata;
  memoryStats: {
    estimatedRows: number;
    estimatedMemoryMB: number;
  };
}

interface Sheet {
  name: string;
  data: CellValue[][];     // Simple 2D array - all data in memory
  charts: ChartMetadata[];
  rowCount: number;
  columnCount: number;
}

// Size limits with clear error messages
const MEMORY_LIMITS = {
  maxRows: 10000,          // Target from spec
  maxMemoryMB: 50,         // Target from spec  
  warnAtRows: 5000         // Early warning
};
```

**Memory Estimation**:
- **Small doc** (100 rows): ~100KB
- **Medium doc** (1,000 rows): ~1MB  
- **Large doc** (10,000 rows): ~10MB
- **At limit**: Clear error with guidance

**Error Handling**:
```typescript
class RCSVMemoryError extends Error {
  constructor(rows: number, limit: number) {
    super(`Dataset too large: ${rows} rows exceeds limit of ${limit}. 
           For large datasets, consider Excel/Sheets or breaking into multiple files.`);
  }
}
```

**Future Optimization Path** (based on user feedback):
1. **If users hit limits frequently**: Implement lazy loading/virtual scrolling
2. **If memory usage problematic**: Add sparse cell storage (Map vs Array)
3. **If parse time slow**: Add streaming parser for large files
4. **If charts need more data**: Implement data sampling for chart generation

**Rationale**:
- **Covers 95% of target use cases** - Budget trackers, dashboards, reports
- **Simple implementation** - Reduces POC/MVP complexity
- **Clear upgrade path** - Can optimize based on real user needs
- **Aligns with "good enough"** - Handle typical business scenarios
- **User-driven optimization** - Don't optimize for problems we don't have yet

### 18. Metadata Escaping Design

**Decision**: Quote-based escaping similar to CSV

**Implementation**:
```typescript
// Parse key=value pairs with proper quote handling
function parseKeyValuePairs(input: string): [string, string][]

// Parse comma-separated values that may contain quoted items  
function parseCommaSeparatedValues(value: string): string | string[]
```

**Escaping Rules**:
1. **Simple values**: No quotes needed for basic values
   - `x=Month`, `type=bar`
2. **Special characters**: Quote values containing commas or equals
   - `title="Q4 Report, Final"`
3. **Multiple values**: Comma-separated lists with optional quoting
   - `y=Revenue,Expenses,Profit`
   - `y="Revenue, After Tax",Expenses,"Profit, Net"`
4. **Quote escaping**: Use backslash within quoted strings
   - `title="Sales Report \"2024\""`

**Rationale**:
- **CSV consistency**: Matches existing CSV escaping conventions users know
- **Familiar syntax**: Same as spreadsheet software formulas
- **Flexible parsing**: Handles both simple and complex column names
- **Backward compatible**: Simple cases work without quotes
- **Clear rules**: Easy to document and understand

**Examples**:
```csv
## Chart: type=bar, x=Month, y=Sales
## Chart: type=line, title="Q4 Report, Final", x=Month, y=Revenue,Expenses
## Chart: type=pie, title="John's Report", labels="Category, Type", values=Amount
```

### 19. API Design

**POC Public API**:
```typescript
// Main parser function
export function parseRCSV(text: string): RCSVDocument;

// Calculate all formulas
export function calculate(doc: RCSVDocument): RCSVDocument;

// Export to JSON - includes chart metadata
export function toJSON(doc: RCSVDocument): object;

// Export to CSV (calculated values, no formulas or metadata)
export function toCSV(doc: RCSVDocument): string;

// Chart metadata is just parsed data:
interface RCSVDocument {
  sheets: Sheet[];
}

interface Sheet {
  charts: ChartMetadata[]; // Parsed but not rendered
  data: CellData[][];
}

interface ChartMetadata {
  type: 'bar' | 'line' | 'pie' | 'scatter' | 'column';
  title?: string;
  x?: string;
  y?: string | string[];
  // No rendering logic - just data
}
```

## Development Workflow

### Phase 1: Core Parser (Week 1)
1. Setup project with Vite and TypeScript
2. Implement metadata parser
3. Integrate PapaParse
4. Add type inference

### Phase 2: Formula Engine (Week 2)
1. Formula tokenizer
2. Recursive descent parser
3. SUM function
4. Basic operators (+, -, *, /)
5. Dependency resolution

### Phase 3: Renderer & Demo (Week 3)
1. HTML table renderer
2. Chart.js integration for chart metadata
3. Demo page combining core + renderer
4. Demonstrate clean separation of concerns
5. Example files

### Phase 4: Testing & Documentation (Week 4)
1. Unit tests for parser
2. Integration tests with examples
3. API documentation
4. README with examples

## Out of Scope for POC

- Multi-sheet support
- Cross-sheet references
- Advanced functions beyond SUM
- Formatting/styling
- Error recovery (fail fast)
- Circular references
- Performance optimization
- Web Workers
- Streaming parse

## Success Criteria

The POC is successful if it can:
1. Parse the example budget RCSV file (including chart metadata)
2. Calculate SUM formulas correctly
3. Export parsed structure as JSON/CSV from core library
4. Display data in HTML table (web renderer)
5. Render a bar chart from metadata (web renderer)
6. Demonstrate clear separation: core parses, renderer visualizes

## Example POC File

```csv
## Chart: type=bar, title="Budget Overview", x=Category, y=Budget
Category:text,Budget:currency,Actual:currency,Total:currency
Housing,2000,1950,=B2+C2
Food,800,850,=B3+C3
Total,=SUM(B2:B3),=SUM(C2:C3),=SUM(D2:D3)
```

## Next Steps After POC

1. Validate approach with stakeholders
2. Refactor into modular repositories
3. Implement full formula functions
4. Add multi-sheet support
5. Build production CLI and web renderer
6. Create VS Code extension
7. Develop GitHub integration

---

*Last Updated: 2024-12-19*
*Status: DRAFT - Pending team review*