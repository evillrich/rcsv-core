# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **rcsv-core**, the core parser and calculation engine for Rich CSV (RCSV) format - a lightweight, text-based format designed to be "Markdown for spreadsheets." RCSV extends standard CSV with formulas, formatting, multi-sheet structures, and charts while maintaining CSV compatibility.

The project is currently in POC (Proof of Concept) phase, implementing basic functionality to validate the core concepts before building the full MVP.

## Commands

### Development

- `npm run dev` - Start Vite development server for demo
- `npm run demo` - Alternative command to serve demo application
- `npm run preview` - Preview built demo application

### Building

- `npm run build` - Build library using TypeScript compiler and Vite
- Output goes to `dist/` directory with separate entry points for core and renderer

### Testing

- `npm test` - Run all tests with Vitest (single run)
- `npm run test:watch` - Run tests in watch mode
- `npm run test:ui` - Run tests with Vitest UI
- `npm run test:coverage` - Run tests with coverage report

### Code Quality

- `npm run lint` - Run ESLint on TypeScript files
- `npm run format` - Format TypeScript files with Prettier

## Architecture

### Monolithic POC Structure

The project uses a single repository approach for POC validation, planned to split into modular packages for MVP:

```
src/
├── core/           # Core parser and calculation engine (future @rcsv/core)
│   ├── parser/     # RCSV format parsing
│   ├── engine/     # Formula calculation and type system
│   └── index.ts    # Main public API
├── renderer/       # Web rendering components (future @rcsv/web)
│   ├── table.ts    # HTML table generation
│   ├── charts.ts   # Chart.js integration
│   └── index.ts    # Renderer exports
└── demo/           # Integration demo application
    ├── index.html  # Demo page
    ├── demo.ts     # Uses core + renderer
    └── style.css   # Basic styling
```

### Key Technology Decisions

**CSV Parsing**: Uses PapaParse for universal browser/Node.js support with error recovery
**Formula Engine**: Custom implementation using Peggy parser generator (planned)
**Chart Rendering**: Chart.js v4.5+ with tree-shaking (renderer only, ~80KB)
**Date Handling**: date-fns as required dependency for robust EU/US date parsing
**Build System**: Vite for fast development and library bundling
**Testing**: Vitest for Jest-compatible testing with TypeScript support

### Core Data Flow

```
Raw RCSV Text → Parser → Type Inference → Formula Calculation → Rendered Output
```

1. **Parser**: Extracts metadata, parses CSV data, builds document structure
2. **Type Inference**: Two-phase algorithm (pre/post formula calculation)
3. **Calculator**: Resolves formula dependencies and calculates values
4. **Renderer**: Generates HTML tables and Chart.js charts

### Formula System

- Excel-compatible syntax starting with `=`
- MVP scope: Full mathematical, logical, lookup, text, and date functions
- Cell references: A1-style notation throughout
- Cross-sheet references planned for MVP

### Type System

Implements sophisticated two-phase type inference matching Excel/Google Sheets:

- **Phase 1**: Pre-calculation analysis of non-formula cells
- **Phase 2**: Post-calculation analysis of formula results for formula-heavy columns
- **UNSPECIFIED** type: Temporary type for deferred inference
- Native type storage: numbers as `number`, text as `string`, empty cells as `null`

## File Locations

### Core Parser Components

- `src/core/parser/index.ts` - Main parsing logic and CSV integration
- `src/core/engine/types.ts` - TypeScript interfaces and enums
- `src/core/engine/calculator.ts` - Formula calculation engine
- `src/core/index.ts` - Public API (`parseRCSV`, `toJSON`, `toCSV`)

### Test Structure

```
tests/
├── core/
│   ├── engine/          # Calculator and type tests
│   └── parser/          # Parser, formula, and type inference tests
└── renderer/            # Chart and table rendering tests
```

### Configuration Files

- `package.json` - Project dependencies and scripts
- `tsconfig.json` - TypeScript configuration (strict mode)
- `vite.config.ts` - Vite build configuration
- `vitest.config.ts` - Vitest test configuration

### Documentation

- `rcsv_architecture.md` - Complete technical architecture and algorithms
- `TECHNICAL_DECISIONS.md` - implementation decisions and rationale
- `spec/rcsv_spec_v1.md` - Full RCSV format specification
- `examples/budget.rcsv` - example file

## Development Guidelines

### Type Safety

- All code uses TypeScript with strict mode enabled
- Core types defined in `src/core/engine/types.ts`
- Interfaces for all major data structures (Document, Sheet, Cell, etc.)

### Error Handling

- `RCSVError` base class for parsing errors
- `RCSVMemoryError` for dataset size limits
- Console warnings for malformed data (lenient parsing mode)
- Formula errors use Excel-style codes (`#VALUE!`, `#REF!`, etc.)

### Memory Management

- Target capacity: 10,000 rows for interactive performance
- Current implementation: Simple in-memory storage
- Memory estimation included in document stats
- Clear size limits with helpful error messages

### Testing Strategy

- Unit tests for all parser components and type inference
- Integration tests with example RCSV files
- Formula calculation verification
- Error handling validation

## Key Algorithms

### Two-Phase Type Inference

Located in `src/core/parser/index.ts`:

1. **Phase 1**: Analyze non-formula cells, defer formula-heavy columns (>50% formulas)
2. **Phase 2**: Analyze calculated results for deferred columns (post-calculation)
3. **Configurable thresholds**: Sample size, confidence level, formula ratio

### CSV Empty Cell Handling

RCSV differentiates between truly empty cells and empty strings:

- **Empty CSV cells** (`,,,`): Become `null` values
- **Empty string results** (`""`): From formulas, remain as strings
- This matches Excel/Google Sheets behavior

### Formula Parsing

Current: Basic arithmetic and SUM() function
Planned: Full Peggy-based parser for 30+ Excel-compatible functions

## Future Roadmap

### MVP Features (Currently working on)

- Multi-sheet support with cross-sheet references
- Full data type support (date, boolean, percentage, category)
- Complete function library (mathematical, logical, lookup, text, date)
- All chart types (column, line, pie, scatter)
- Column-level formatting and styling
- Type inference for untyped columns
- Comprehensive error handling

### Post-MVP Features

- Conditional formatting with simple rules
- Advanced chart customization
- Import/export tools for Excel/Sheets
- Enhanced date/time functions
- Data validation constraints

## Integration Examples

### Core Library Usage

```typescript
import { parseRCSV, toJSON, toCSV } from './src/core';

const doc = parseRCSV(rcsvText);
const json = toJSON(doc);
const csv = toCSV(doc); // TODO: Not yet implemented
```

### Web Renderer Usage

```typescript
import { renderTable, renderChart } from './src/renderer';

const tableHtml = renderTable(doc.sheets[0]);
const chartConfig = renderChart(doc.sheets[0].charts[0], doc.sheets[0]);
```

## Compatibility Notes

### Excel/Google Sheets Round-Trip

- Designed for nearly perfect bidirectional compatibility
- Only features that round-trip cleanly are included in RCSV
- Export behavior: RCSV → Excel/Sheets maps directly to native functionality
- Import behavior: Excel/Sheets → RCSV preserves supported features only

### CSV Forward Compatibility

- Every CSV file with headers is a valid RCSV file
- Standard business CSV files can be opened directly as RCSV
- Progressive enhancement: Start with CSV, add RCSV features incrementally

This codebase implements the foundational layer for making spreadsheet functionality as embeddable and universal as Markdown.
