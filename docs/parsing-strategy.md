# RCSV Parsing Strategy Design Document

## Overview

RCSV (Rich CSV) implements a sophisticated multi-layered parsing strategy that transforms plain text into structured, calculable spreadsheet data. This document describes the parsing architecture from top-level document structure down to individual formula expressions.

## Philosophy: Progressive Enhancement

RCSV follows the "Markdown for Spreadsheets" philosophy, using progressive enhancement from basic CSV to rich spreadsheet functionality. This approach requires different parsing technologies at different layers:

- **Simple structure** → Custom string processing
- **Complex metadata** → Custom regex and key-value parsing  
- **Tabular data** → Battle-tested CSV library
- **Mathematical expressions** → Formal grammar parser

## Parsing Architecture (Top-Down)

### Layer 1: Document Structure Parser
**Location**: `src/core/parser/index.ts` - `parseStructure()`
**Technology**: Custom JavaScript line-by-line processing
**Input**: Raw RCSV text string
**Output**: Document structure with sheet sections

```typescript
// Example input:
# title: Q4 Budget Analysis
# author: Finance Team

# Sheet: Revenue
## chart: type=column, columns="Month,Revenue"
Month,Revenue:currency
Jan,50000
Feb,55000

# Sheet: Expenses  
Month,Expenses:currency
Jan,30000
Feb,32000
```

**Responsibilities**:
- Split document into metadata and sheet sections
- Extract document-level metadata (`# key: value` before first sheet)
- Identify sheet boundaries (`# Sheet: name`)
- Handle multi-sheet documents
- Calculate memory statistics

**Implementation Strategy**:
- Line-by-line processing with state machine
- Sheet boundary detection triggers section splitting
- Metadata extraction uses simple regex patterns
- Memory-efficient streaming approach for large documents

### Layer 2: Metadata Parser
**Location**: `src/core/parser/index.ts` - `extractSheetMetadata()`
**Technology**: Custom regex and key-value parsing
**Input**: Sheet section lines
**Output**: Parsed chart, table, and content metadata

```typescript
// Example metadata parsing:
"## chart: type=column, columns=\"Revenue,Profit\", title=\"Q4 Performance\""
// Becomes:
{
  type: 'column',
  columns: ['Revenue', 'Profit'],
  title: 'Q4 Performance'
}
```

**Responsibilities**:
- Parse chart definitions with complex attributes
- Handle table layout specifications
- Process content blocks for rich formatting
- CSV-style quote handling in metadata values
- Key-value pair parsing with nested quotes

**Key Features**:
- **Quote-aware parsing**: Handles `columns="Revenue, After Tax",Expenses`
- **Escaped quotes**: Supports `"Sales \"2024\"",Profit`  
- **Flexible syntax**: Both `key=value` and `key: value` formats
- **Error recovery**: Logs warnings and continues on malformed metadata

### Layer 3: CSV Data Parser
**Location**: `src/core/parser/index.ts` - `parseCSVData()`
**Technology**: `csv-parse/browser/esm/sync` library
**Input**: Raw CSV text (after metadata extraction)
**Output**: Structured cell matrix with column metadata

```typescript
// Smart empty cell handling:
"John,,Engineer"     → [John, null, Engineer]      // null = missing
"John,\"\",Engineer" → [John, "", Engineer]        // "" = intentional empty
```

**Responsibilities**:
- Parse CSV data with advanced empty cell differentiation
- Extract column headers with type annotations (`Revenue:currency`)
- Handle malformed CSV with recovery
- Process quoted vs unquoted fields differently
- Generate column metadata with type information

**Advanced Features**:
- **Smart null handling**: Distinguishes between missing data (null) and empty strings ("")
- **Type annotation parsing**: `Revenue:currency` → `{name: 'Revenue', type: DataType.CURRENCY}`
- **Whitespace processing**: Trims unquoted fields, preserves quoted field spacing
- **Error tolerance**: `relax_column_count` and `relax_quotes` for real-world data

**Library Choice Rationale**:
- **csv-parse**: Battle-tested, handles edge cases, browser/Node.js compatible
- **Streaming capable**: Can handle large datasets efficiently  
- **Flexible casting**: Custom cast function for smart type handling
- **Error recovery**: Continues parsing despite malformed records

### Layer 4: Formula Parser
**Location**: `src/core/parser/formula.pegjs` → `src/core/parser/formula.ts`
**Technology**: Peggy-generated PEG parser
**Input**: Formula strings (starting with `=`)
**Output**: Abstract Syntax Tree (AST)

```typescript
// Example formula parsing:
"=SUM(A1:B5) + Sheet2!C3 * 2"
// Becomes AST:
{
  type: 'binary',
  op: '+',
  left: { type: 'function', name: 'SUM', args: [...] },
  right: { type: 'binary', op: '*', left: {...}, right: {...} }
}
```

**Grammar Structure**:
```pegjs
Formula           = "=" _ expr:Expression
Expression        = ComparisonExpression  
ComparisonExpression = ConcatenationExpression (("<=" / ">=" / ...) ConcatenationExpression)*
ConcatenationExpression = AdditionExpression ("&" AdditionExpression)*
AdditionExpression   = MultiplicationExpression (("+" / "-") MultiplicationExpression)*
// ... precedence hierarchy continues
```

**Responsibilities**:
- Parse mathematical expressions with correct precedence
- Handle function calls with argument lists
- Process cell references (A1, B2) and ranges (A1:B5)  
- Support cross-sheet references (Sheet1!A1)
- Parse string literals with proper escaping
- Generate executable AST nodes

**Advanced Features**:
- **Operator precedence**: Full Excel-compatible precedence (^, *, /, +, -, &, comparisons)
- **Function support**: Extensible function call parsing
- **Cross-sheet refs**: `Sheet1!A1` and `'Sheet Name'!A1:B5`
- **String handling**: Double-quote escaping (`""` → `"`)
- **Error locations**: Precise error reporting with line/column positions

**Technology Choice Rationale**:
- **PEG grammar**: Handles complex precedence and left-recursion elegantly
- **Generated parser**: Fast, predictable performance
- **Extensible**: Easy to add new operators and functions
- **Error reporting**: Built-in location tracking for debugging

## Data Flow & Integration

### Sequential Processing Pipeline
```
Raw RCSV Text 
    ↓ (Layer 1: Document Parser)
Document Structure + Sheet Sections
    ↓ (Layer 2: Metadata Parser)  
Sheet Metadata + Raw CSV Data
    ↓ (Layer 3: CSV Parser)
Cell Matrix + Column Types
    ↓ (Layer 4: Formula Parser - on demand)
Executable AST + Calculated Values
```

### Error Handling Strategy
- **Graceful degradation**: Each layer handles errors independently
- **Continue on error**: Parse what's possible, log warnings for issues
- **Error context**: Preserve line numbers and positions for debugging
- **Recovery mechanisms**: Fallback to basic parsing when advanced features fail

### Performance Characteristics
- **Layer 1**: O(n) line processing, memory efficient
- **Layer 2**: O(n) regex matching, minimal memory overhead  
- **Layer 3**: O(n) CSV parsing, single pass with streaming support
- **Layer 4**: O(n) PEG parsing per formula, cached AST results

### Memory Management
- **Streaming support**: CSV layer can handle large datasets
- **Copy avoidance**: Parsers work with string slices where possible
- **AST caching**: Parsed formulas cached to avoid re-parsing
- **Memory estimation**: Document provides memory usage statistics

## Parser Technology Rationale

### Why Different Technologies Per Layer?

#### Custom String Processing (Layers 1-2)
**Use Case**: Document structure and metadata
**Rationale**: 
- Simple, predictable line-by-line processing
- No external dependencies for basic functionality
- Full control over error handling and recovery
- Efficient for the simple structures involved

#### CSV Library (Layer 3) 
**Use Case**: Tabular data parsing
**Rationale**:
- **Proven reliability**: csv-parse handles edge cases we'd miss
- **Standard compliance**: RFC 4180 compliant with extensions
- **Performance**: Optimized C-level parsing in Node.js
- **Feature completeness**: Quote handling, escaping, malformed data recovery
- **Cross-platform**: Works in browser and Node.js environments

#### PEG Grammar (Layer 4)
**Use Case**: Mathematical expressions  
**Rationale**:
- **Correctness**: Formal grammar ensures proper precedence
- **Maintainability**: Grammar rules are self-documenting
- **Extensibility**: Adding operators/functions requires only grammar changes
- **Performance**: Generated parsers are fast and predictable
- **Excel compatibility**: Can precisely match Excel's parsing behavior

### Trade-offs Analysis

| Approach | Pros | Cons | Best For |
|----------|------|------|----------|
| Custom parsing | Full control, no deps, efficient | Bug-prone, limited features | Simple structures |
| Library (csv-parse) | Reliable, feature-complete, tested | Dependency, less control | Complex structured data |
| Generated grammar | Formal, extensible, maintainable | Complex build, generated code | Mathematical expressions |

### Future Extensibility

#### Grammar Evolution
- **Peggy grammar**: Easy to extend with new functions and operators
- **Metadata parsing**: Regex patterns can be extended for new chart types
- **CSV handling**: Library provides hooks for custom data types

#### Performance Scaling
- **Layer 3 streaming**: CSV parser supports streaming for large datasets
- **Layer 4 caching**: Formula ASTs can be cached and reused
- **Incremental parsing**: Could add dirty-checking for partial re-parsing

#### Error Reporting Enhancement  
- **Source maps**: Could add mapping from parsed results back to source locations
- **Syntax highlighting**: Parser structure supports syntax highlighting
- **Interactive errors**: Could provide suggestions based on parsing context

## Implementation Details

### Key Parsing Functions

#### Document Structure (`parseStructure`)
```typescript
export function parseStructure(text: string): RCSVDocument {
  // 1. Split into lines and extract document metadata
  const { metadata, firstSheetLine } = extractDocumentMetadata(lines);
  
  // 2. Split into sheet sections
  const sheetSections = splitIntoSheets(lines.slice(firstSheetLine));
  
  // 3. Parse each sheet (metadata + CSV data)
  const sheets = sheetSections.map(parseSheet);
  
  return { metadata, sheets, version: '1.0', memoryStats };
}
```

#### CSV Data Processing (`parseCSVData`)
```typescript
function parseCSVData(csvText: string): { data: CellValue[][], columns: ColumnMetadata[] } {
  // Use csv-parse with custom cast function for smart empty handling
  const rawRows = parse(csvText, {
    cast: (value: string, context: any) => {
      if (value === "" && !context.quoting) return null;  // Missing data
      if (value === "" && context.quoting) return "";     // Intentional empty
      return context.quoting ? value : value.trim();      // Preserve/trim spaces
    }
  });
  
  // Extract headers with type annotations and generate column metadata
  const columns = parseColumnHeaders(rawRows[0]);
  return { data: rawRows.slice(1), columns };
}
```

#### Formula Processing (`parseFormula` wrapper)
```typescript
export function parseFormula(input: string) {
  try {
    return peggyParseFormula(input, {});
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(translateErrorMessage(error, input));
    }
    throw error;
  }
}
```

### Type Conversion Integration

The parsing layers integrate with the type system through `convertValueForType()`:

```typescript
// After CSV parsing, convert raw strings to typed values
return row.map((cellText, _colIndex) => {
  const column = columns[colIndex];
  if (column?.type) {
    return convertValueForType(cellText, column.type);
  }
  return cellText; // Keep as-is for type inference
});
```

### Build Process Integration

#### Parser Generation
```json
// package.json scripts
{
  "build:parser": "npm run build:peggy && npm run fix:exports",
  "build:peggy": "peggy --allowed-start-rules Formula --format es --output src/core/parser/formula.ts src/core/parser/formula.pegjs",
  "fix:exports": "node scripts/fix-parser-exports.js"
}
```

#### Generated Code Post-Processing
The `scripts/fix-parser-exports.js` script adds the required `parseFormula` export to the generated parser, maintaining compatibility with the existing codebase while using the Peggy-generated parser.

## Conclusion

RCSV's multi-layered parsing strategy provides:

1. **Robustness**: Each layer uses the best technology for its domain
2. **Maintainability**: Clear separation of concerns between parsing layers  
3. **Performance**: Efficient parsing optimized for each content type
4. **Extensibility**: Easy to enhance individual layers without affecting others
5. **Reliability**: Battle-tested libraries where appropriate, custom solutions where needed

This architecture enables RCSV to handle the full spectrum from simple CSV to complex multi-sheet spreadsheets while maintaining the simplicity and embeddability that makes it "Markdown for Spreadsheets."