# Platform Compatibility Guide

This document details how RCSV data types and features map to Excel and Google Sheets, ensuring smooth import/export workflows and predictable behavior across platforms.

## Data Type Compatibility Matrix

| **RCSV DataType** | **Excel Support** | **Google Sheets Support** | **Import/Export Notes** |
|---|---|---|---|
| `TEXT` | ✅ Text format | ✅ Text format | Perfect compatibility, no conversion needed |
| `NUMBER` | ✅ Number/General format | ✅ Number format | Perfect compatibility, handles decimals and integers |
| `CURRENCY` | ✅ Currency format | ✅ Currency format | Full support with currency symbols ($, €, £, etc.) |
| `PERCENTAGE` | ✅ Percentage format | ✅ Percentage format | Perfect compatibility (0.75 ↔ 75%) |
| `DATE` | ✅ Date/Time formats | ✅ Date formats | Full compatibility with multiple date formats |
| `BOOLEAN` | ✅ TRUE/FALSE values | ✅ TRUE/FALSE values | Perfect compatibility |
| `CATEGORY` | ⚠️ Data Validation Lists | ⚠️ Data Validation | Maps to dropdown validation, not core data type |

## Platform-Specific Format Details

### Excel Capabilities

**Data Types:**
- **General/Number**: Default format, supports integers, decimals, scientific notation
- **Currency**: Supports multiple currency symbols with locale-aware formatting
- **Percentage**: Automatically converts decimals to percentage display (0.25 → 25%)
- **Date/Time**: Extensive format options (MM/DD/YYYY, DD-MMM-YY, etc.)
- **Text**: Preserves leading zeros, prevents auto-conversion
- **Boolean**: TRUE/FALSE logical values

**API Integration:**
- **Excel JavaScript API**: `numberFormat` property for programmatic control
- **Format Application**: Can set column-wide formatting via Range objects
- **Data Types**: Supports FormattedNumberCellValue for complex formatting

### Google Sheets Capabilities

**Data Types:**
- **Automatic Detection**: Aggressive auto-detection of data types from content
- **Number**: Supports various numeric formats including scientific notation
- **Currency**: Auto-detects currency symbols, supports international currencies
- **Percentage**: Automatic percentage formatting and calculations
- **Date**: Flexible date recognition and formatting options
- **Text**: Plain text format prevents auto-conversion
- **Boolean**: TRUE/FALSE logical operations

**API Integration:**
- **Google Sheets API**: `NumberFormat` object with type and pattern properties
- **Format Control**: `batchUpdate` requests for programmatic formatting
- **Smart Fill**: AI-powered pattern detection and completion

## Import/Export Strategies

### RCSV → Excel/Google Sheets Export

When exporting RCSV to native spreadsheet formats:

```
RCSV Type → Excel/Sheets Format
TEXT      → Text format (preserves leading zeros, prevents conversion)
NUMBER    → Number/General format (automatic numeric handling)
CURRENCY  → Currency format with appropriate symbol ($, €, £, etc.)
PERCENTAGE → Percentage format (displays 0.75 as 75%)
DATE      → Date format based on locale settings
BOOLEAN   → TRUE/FALSE values
CATEGORY  → Data validation dropdown list
```

**Implementation Approach:**
1. Use platform APIs to set `numberFormat` properties based on RCSV column types
2. Apply formatting at the column level for consistency
3. Preserve original formulas and references
4. Maintain chart definitions and metadata

### Excel/Google Sheets → RCSV Import

When importing from native spreadsheet formats:

```
Excel/Sheets Format → RCSV Type
Text format         → TEXT
Number/General      → NUMBER  
Currency format     → CURRENCY
Percentage format   → PERCENTAGE
Date format         → DATE
TRUE/FALSE          → BOOLEAN
Data validation     → CATEGORY
```

**Implementation Approach:**
1. Read `numberFormat` properties to determine RCSV type annotations
2. Analyze format patterns to infer appropriate RCSV types
3. Preserve formulas in RCSV syntax
4. Convert chart metadata to RCSV comment format

### CSV Limitations and Handling

**Export to CSV:**
- **Type Information Lost**: CSV format cannot store data types or formatting
- **Values Only**: Only displays calculated values, formulas become text
- **Simple Data Export**: Best for basic data sharing, not round-trip preservation

**Import from CSV:**
- **Content-Based Inference**: Apply RCSV's two-phase type inference algorithm
- **No Format Preservation**: Rely entirely on content patterns for type detection
- **Header Requirement**: First row must contain column headers for RCSV compatibility

## Round-Trip Compatibility

### Perfect Round-Trip Features

These RCSV features have guaranteed perfect round-trip compatibility:

- **Data Types**: All 7 core types (TEXT, NUMBER, CURRENCY, PERCENTAGE, DATE, BOOLEAN, CATEGORY)
- **Formulas**: All supported functions and operations
- **Basic Formatting**: Column alignment, bold, italic, colors
- **Charts**: Bar, column, line, pie, scatter charts
- **Multi-Sheet**: Sheet organization and cross-sheet references
- **Metadata**: Document and sheet-level metadata preservation

### Export Considerations

**To Excel (.xlsx):**
- Use Excel JavaScript API or Office.js for programmatic control
- Set `Range.numberFormat` properties based on RCSV types
- Apply column-wide formatting for consistency
- Preserve chart types and configuration

**To Google Sheets:**
- Use Google Sheets API v4 for programmatic access
- Apply `NumberFormat` objects with appropriate type/pattern
- Use `batchUpdate` requests for efficient formatting
- Maintain chart definitions and positioning

### Import Considerations

**From Excel (.xlsx):**
- Read `Range.numberFormat` to infer RCSV type annotations
- Parse chart metadata and convert to RCSV comment syntax
- Preserve formula syntax and cross-sheet references
- Extract column formatting preferences

**From Google Sheets:**
- Access `NumberFormat` properties via API
- Convert chart configurations to RCSV metadata format
- Maintain sheet structure and organization
- Preserve formula calculations and references

## Type Inference Compatibility

### How RCSV Compares to Excel/Sheets

RCSV's two-phase type inference algorithm replicates the behavior of Excel and Google Sheets:

**Phase 1 (Pre-Calculation):**
- **Excel/Sheets**: Analyze non-formula content to determine initial column types
- **RCSV**: Sample non-formula cells, apply 70% threshold for type consistency

**Phase 2 (Post-Calculation):**
- **Excel/Sheets**: Analyze formula results to refine type assignments  
- **RCSV**: Apply same inference logic to calculated formula values

**Column-Level Application:**
- **Excel/Sheets**: Apply formatting at column level with cell-level overrides
- **RCSV**: Apply inferred types to entire columns for consistency

This alignment ensures that RCSV documents behave predictably when imported into Excel or Google Sheets, and that Excel/Sheets documents convert naturally to RCSV format.

## Best Practices

### For Reliable Export

1. **Use Explicit Types**: When precision is important, specify types explicitly (`Revenue:currency`)
2. **Test Round-Trips**: Verify export → import → export cycles preserve your data
3. **Validate Formulas**: Ensure formula syntax is compatible across platforms
4. **Check Formatting**: Verify that column formatting preferences are preserved

### For Reliable Import

1. **Understand Source Format**: Know whether source uses text, number, or date formatting
2. **Verify Type Detection**: Check that RCSV inference matches your expectations
3. **Handle Edge Cases**: Be aware of platform-specific formatting quirks
4. **Preserve Metadata**: Ensure chart and formatting metadata survives conversion

### Universal Compatibility

1. **Use Standard Formats**: Stick to common date formats (ISO 8601) and currency symbols
2. **Avoid Platform-Specific Features**: Don't rely on Excel-only or Sheets-only functionality
3. **Test Across Platforms**: Verify behavior in both Excel and Google Sheets
4. **Document Assumptions**: Make data type expectations explicit in your RCSV files

---

*This compatibility guide ensures smooth interoperability between RCSV and major spreadsheet platforms while maintaining the simplicity and portability that makes RCSV valuable for embedded and collaborative scenarios.*