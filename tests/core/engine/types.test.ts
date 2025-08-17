import { describe, it, expect } from 'vitest';
import { DataType, DEFAULT_CONFIG, MEMORY_LIMITS, RCSVError, RCSVMemoryError } from '../../../src/core/engine/types';

describe('Core Types', () => {
  describe('DataType enum', () => {
    it('should have all expected data types', () => {
      expect(DataType.TEXT).toBe('text');
      expect(DataType.NUMBER).toBe('number');
      expect(DataType.CURRENCY).toBe('currency');
      expect(DataType.PERCENTAGE).toBe('percentage');
      expect(DataType.DATE).toBe('date');
      expect(DataType.BOOLEAN).toBe('boolean');
      expect(DataType.CATEGORY).toBe('category');
    });
  });

  describe('DEFAULT_CONFIG', () => {
    it('should have correct default configuration', () => {
      expect(DEFAULT_CONFIG.typeInference.sampleSize).toBe(100);
      expect(DEFAULT_CONFIG.typeInference.confidenceThreshold).toBe(0.8);
      expect(DEFAULT_CONFIG.parser.strict).toBe(false);
    });
  });

  describe('MEMORY_LIMITS', () => {
    it('should have reasonable memory limits', () => {
      expect(MEMORY_LIMITS.maxRows).toBe(10000);
      expect(MEMORY_LIMITS.maxMemoryMB).toBe(50);
      expect(MEMORY_LIMITS.warnAtRows).toBe(5000);
    });
  });

  describe('RCSVError', () => {
    it('should create error with message', () => {
      const error = new RCSVError('Test error');
      expect(error.message).toBe('Test error');
      expect(error.name).toBe('RCSVError');
      expect(error).toBeInstanceOf(Error);
    });

    it('should include line and column information', () => {
      const error = new RCSVError('Test error', 5, 10);
      expect(error.line).toBe(5);
      expect(error.column).toBe(10);
    });
  });

  describe('RCSVMemoryError', () => {
    it('should create memory error with helpful message', () => {
      const error = new RCSVMemoryError(15000, 10000);
      expect(error.message).toContain('15000 rows exceeds limit of 10000');
      expect(error.message).toContain('Excel/Sheets');
      expect(error.name).toBe('RCSVMemoryError');
      expect(error).toBeInstanceOf(RCSVError);
    });
  });
});