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
**Decision**: Chart.js (in demo renderer only)
- **Core parser**: NO chart library needed - only parses/validates metadata
- **Demo renderer**: Uses Chart.js to demonstrate rendering
- **Rationale**: 
  - Charts are purely a rendering concern
  - Core only needs to understand chart metadata structure
  - Each renderer (web, CLI, PDF) chooses its own visualization approach
- **Key insight**: The core parser treats charts like any other metadata

### 4. Date Handling
**Decision**: Native JavaScript Date for POC
- **Rationale**: Sufficient for basic date parsing
- **MVP**: Add date-fns when more date functions needed

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

### 11. Formula Engine Design

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

### 12. Cell Addressing

**Decision**: A1-style throughout
- **Internal**: Store as "A1", "B2", etc.
- **Conversion**: Utils for row/col index when needed
- **Rationale**: Matches user mental model, simpler for POC

### 13. Error Handling

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

### 14. State Management

**Decision**: Plain objects for POC
- No reactive library
- Simple mutation for calculations
- Re-render entire table on change (demo only)

### 15. API Design

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