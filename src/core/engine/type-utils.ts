/**
 * Type conversion utilities for RCSV parser and calculator
 * Shared functions for converting raw string values to appropriate types
 */

import { DataType } from './types';

/**
 * Convert a raw string value to the appropriate type based on DataType
 * Handles null values, type-specific parsing, and preserves text formatting preferences
 * 
 * @param raw - Raw string value from CSV parsing
 * @param dataType - Target data type for conversion
 * @returns Converted value in appropriate JavaScript type
 */
export function convertValueForType(raw: string | null, dataType: DataType): any {
  // Handle null values
  if (raw === null || raw === undefined) {
    return null;
  }
  
  // For text types, preserve the original value completely - no trimming
  if (dataType === DataType.TEXT || dataType === DataType.CATEGORY) {
    return raw;
  }
  
  const trimmed = raw.trim();
  
  // Handle empty strings after trimming (only for non-text types)
  if (trimmed === '') {
    return null;
  }
  
  switch (dataType) {
    case DataType.NUMBER:
      // Remove commas and parse as number
      const numStr = trimmed.replace(/,/g, '');
      const num = parseFloat(numStr);
      return isNaN(num) ? trimmed : num;
      
    case DataType.CURRENCY:
      // Extract numeric value from currency with better international support
      // Handle: $1,234.56, €1.234,56, £1,234.56, ¥1234, ₹1,234.56, 1234 USD, etc.
      const currencyMatch = trimmed.match(/[\d,\.]+/);
      if (currencyMatch) {
        let numStr = currencyMatch[0];
        // Handle European decimal notation (1.234,56 -> 1234.56)
        if (numStr.includes(',') && numStr.includes('.')) {
          // If both comma and dot, assume European format if comma is last
          if (numStr.lastIndexOf(',') > numStr.lastIndexOf('.')) {
            numStr = numStr.replace(/\./g, '').replace(',', '.');
          } else {
            // American format, just remove commas
            numStr = numStr.replace(/,/g, '');
          }
        } else if (numStr.includes(',')) {
          // Only comma - could be thousands separator or decimal
          const parts = numStr.split(',');
          if (parts.length === 2 && parts[1].length <= 2) {
            // Likely decimal separator (1,50)
            numStr = numStr.replace(',', '.');
          } else {
            // Likely thousands separator (1,234)
            numStr = numStr.replace(/,/g, '');
          }
        }
        const numVal = parseFloat(numStr);
        return isNaN(numVal) ? trimmed : numVal;
      }
      return trimmed;
      
    case DataType.PERCENTAGE:
      // Convert percentage to decimal with better parsing
      const percentMatch = trimmed.match(/^([\d,\.]+)%$/);
      if (percentMatch) {
        let numStr = percentMatch[1].replace(/,/g, '');
        const numVal = parseFloat(numStr);
        return isNaN(numVal) ? trimmed : numVal / 100;
      }
      return trimmed;
      
    case DataType.BOOLEAN:
      const lower = trimmed.toLowerCase();
      if (['true', 'yes', 'y', '1'].includes(lower)) {
        return true;
      } else if (['false', 'no', 'n', '0'].includes(lower)) {
        return false;
      }
      return trimmed;
      
    case DataType.DATE:
      // Better date parsing with multiple format support
      let date: Date;
      
      // Try ISO format first (YYYY-MM-DD)
      if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        date = new Date(trimmed);
      }
      // Try US format (MM/DD/YYYY)
      else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) {
        date = new Date(trimmed);
      }
      // Try European format (DD/MM/YYYY) - parse manually
      else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) {
        const parts = trimmed.split('/');
        const day = parseInt(parts[0]);
        const month = parseInt(parts[1]);
        // If day > 12, assume DD/MM/YYYY format
        if (day > 12 && month <= 12) {
          date = new Date(parseInt(parts[2]), month - 1, day);
        } else {
          date = new Date(trimmed); // Fall back to default parsing
        }
      }
      // Try other common formats
      else {
        date = new Date(trimmed);
      }
      
      return isNaN(date.getTime()) ? trimmed : date;
      
    default:
      return trimmed;
  }
}