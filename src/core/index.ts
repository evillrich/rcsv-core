/**
 * RCSV Core Library
 * Parser and calculation engine for Rich CSV format
 */

export * from './parser';
export * from './engine/types';
export * from './engine/calculator';

import { parseStructure } from './parser';
import { calculate } from './engine/calculator';
import type { RCSVDocument } from './engine/types';

/**
 * Parse RCSV text and calculate all formulas
 * @param text - Raw RCSV text
 * @returns Parsed and calculated document
 */
export function parseRCSV(text: string): RCSVDocument {
  const doc = parseStructure(text);
  return calculate(doc);
}

/**
 * Convert RCSV document to JSON
 * @param doc - Parsed RCSV document
 * @returns JSON representation
 */
export function toJSON(doc: RCSVDocument): object {
  return {
    metadata: doc.metadata,
    sheets: doc.sheets.map(sheet => ({
      name: sheet.name,
      metadata: sheet.metadata,
      charts: sheet.charts,
      data: sheet.data
    }))
  };
}

/**
 * Convert RCSV document to CSV (calculated values only)
 * @param doc - Parsed RCSV document
 * @returns CSV string
 */
export function toCSV(_doc: RCSVDocument): string {
  // TODO: Implement CSV export
  throw new Error('Not implemented');
}