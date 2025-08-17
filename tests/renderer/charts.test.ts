/**
 * Tests for Chart Renderer
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderChart } from '../../src/renderer/charts';
import type { ChartMetadata, Sheet, CellValue } from '../../src/core/engine/types';
import { DataType } from '../../src/core/engine/types';

// Mock Chart.js
vi.mock('chart.js', () => {
  const mockChart = vi.fn();
  mockChart.register = vi.fn();
  return {
    Chart: mockChart,
    registerables: []
  };
});

/**
 * Helper to create a mock sheet with data
 */
function createMockSheet(data: CellValue[][], columns: Array<{ name: string; type: DataType }>): Sheet {
  return {
    name: 'TestSheet',
    metadata: { columns },
    charts: [],
    data
  };
}

/**
 * Helper to create a cell value
 */
function createCell(value: any, type: DataType = DataType.TEXT): CellValue {
  return { value, type };
}

describe('renderChart', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a canvas element', () => {
    const chart: ChartMetadata = {
      type: 'bar',
      title: 'Test Chart',
      x: 'Month',
      y: 'Sales'
    };

    const sheet = createMockSheet(
      [
        [createCell('Jan'), createCell(100)],
        [createCell('Feb'), createCell(200)]
      ],
      [
        { name: 'Month', type: DataType.TEXT },
        { name: 'Sales', type: DataType.NUMBER }
      ]
    );

    const canvas = renderChart(chart, sheet);

    expect(canvas.tagName).toBe('CANVAS');
    expect(canvas.className).toBe('rcsv-chart');
  });

  it('should extract correct data for single y column', async () => {
    const { Chart } = vi.mocked(await import('chart.js'), true);
    
    const chart: ChartMetadata = {
      type: 'bar',
      title: 'Sales Chart',
      x: 'Month',
      y: 'Sales'
    };

    const sheet = createMockSheet(
      [
        [createCell('Jan'), createCell(100)],
        [createCell('Feb'), createCell(200)],
        [createCell('Mar'), createCell(150)]
      ],
      [
        { name: 'Month', type: DataType.TEXT },
        { name: 'Sales', type: DataType.NUMBER }
      ]
    );

    renderChart(chart, sheet);

    expect(Chart).toHaveBeenCalledWith(
      expect.any(HTMLCanvasElement),
      expect.objectContaining({
        type: 'bar',
        data: {
          labels: ['Jan', 'Feb', 'Mar'],
          datasets: [{
            label: 'Sales',
            data: [100, 200, 150],
            backgroundColor: expect.any(String),
            borderColor: expect.any(String),
            borderWidth: 1
          }]
        }
      })
    );
  });

  it('should extract correct data for multiple y columns', async () => {
    const { Chart } = vi.mocked(await import('chart.js'), true);
    
    const chart: ChartMetadata = {
      type: 'line',
      title: 'Multi-Series Chart',
      x: 'Month',
      y: ['Sales', 'Profit']
    };

    const sheet = createMockSheet(
      [
        [createCell('Jan'), createCell(100), createCell(20)],
        [createCell('Feb'), createCell(200), createCell(40)]
      ],
      [
        { name: 'Month', type: DataType.TEXT },
        { name: 'Sales', type: DataType.NUMBER },
        { name: 'Profit', type: DataType.NUMBER }
      ]
    );

    renderChart(chart, sheet);

    expect(Chart).toHaveBeenCalledWith(
      expect.any(HTMLCanvasElement),
      expect.objectContaining({
        type: 'line',
        data: {
          labels: ['Jan', 'Feb'],
          datasets: [
            {
              label: 'Sales',
              data: [100, 200],
              backgroundColor: expect.any(String),
              borderColor: expect.any(String),
              borderWidth: 1
            },
            {
              label: 'Profit',
              data: [20, 40],
              backgroundColor: expect.any(String),
              borderColor: expect.any(String),
              borderWidth: 1
            }
          ]
        }
      })
    );
  });

  it('should map chart types correctly', async () => {
    const { Chart } = vi.mocked(await import('chart.js'), true);
    
    const testCases = [
      { rcsvType: 'bar' as const, chartJsType: 'bar' },
      { rcsvType: 'column' as const, chartJsType: 'bar' },
      { rcsvType: 'line' as const, chartJsType: 'line' },
      { rcsvType: 'pie' as const, chartJsType: 'pie' },
      { rcsvType: 'scatter' as const, chartJsType: 'scatter' }
    ];

    const sheet = createMockSheet(
      [[createCell('A'), createCell(1)]],
      [
        { name: 'X', type: DataType.TEXT },
        { name: 'Y', type: DataType.NUMBER }
      ]
    );

    testCases.forEach(({ rcsvType, chartJsType }) => {
      const chart: ChartMetadata = {
        type: rcsvType,
        x: 'X',
        y: 'Y'
      };

      renderChart(chart, sheet);

      expect(Chart).toHaveBeenCalledWith(
        expect.any(HTMLCanvasElement),
        expect.objectContaining({
          type: chartJsType
        })
      );
    });
  });

  it('should handle null and undefined values in data', async () => {
    const { Chart } = vi.mocked(await import('chart.js'), true);
    
    const chart: ChartMetadata = {
      type: 'bar',
      x: 'Month',
      y: 'Sales'
    };

    const sheet = createMockSheet(
      [
        [createCell('Jan'), createCell(100)],
        [createCell('Feb'), createCell(null)],
        [createCell('Mar'), createCell(undefined)],
        [createCell('Apr'), createCell('')]
      ],
      [
        { name: 'Month', type: DataType.TEXT },
        { name: 'Sales', type: DataType.NUMBER }
      ]
    );

    renderChart(chart, sheet);

    expect(Chart).toHaveBeenCalledWith(
      expect.any(HTMLCanvasElement),
      expect.objectContaining({
        data: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr'],
          datasets: [{
            label: 'Sales',
            data: [100, null, null, null],
            backgroundColor: expect.any(String),
            borderColor: expect.any(String),
            borderWidth: 1
          }]
        }
      })
    );
  });

  it('should format date labels correctly', async () => {
    const { Chart } = vi.mocked(await import('chart.js'), true);
    
    const chart: ChartMetadata = {
      type: 'line',
      x: 'Date',
      y: 'Value'
    };

    const date1 = new Date('2023-01-15T00:00:00.000Z');
    const date2 = new Date('2023-02-15T00:00:00.000Z');

    const sheet = createMockSheet(
      [
        [createCell(date1), createCell(100)],
        [createCell(date2), createCell(200)]
      ],
      [
        { name: 'Date', type: DataType.DATE },
        { name: 'Value', type: DataType.NUMBER }
      ]
    );

    renderChart(chart, sheet);

    expect(Chart).toHaveBeenCalledWith(
      expect.any(HTMLCanvasElement),
      expect.objectContaining({
        data: {
          labels: [date1.toLocaleDateString(), date2.toLocaleDateString()],
          datasets: expect.any(Array)
        }
      })
    );
  });

  it('should configure chart options correctly', async () => {
    const { Chart } = vi.mocked(await import('chart.js'), true);
    
    const chart: ChartMetadata = {
      type: 'bar',
      title: 'Test Chart',
      x: 'X',
      y: 'Y'
    };

    const sheet = createMockSheet(
      [[createCell('A'), createCell(1)]],
      [
        { name: 'X', type: DataType.TEXT },
        { name: 'Y', type: DataType.NUMBER }
      ]
    );

    renderChart(chart, sheet);

    expect(Chart).toHaveBeenCalledWith(
      expect.any(HTMLCanvasElement),
      expect.objectContaining({
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: 'Test Chart'
            },
            legend: {
              display: false  // Single dataset
            }
          },
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      })
    );
  });

  it('should configure pie chart without scales', async () => {
    const { Chart } = vi.mocked(await import('chart.js'), true);
    
    const chart: ChartMetadata = {
      type: 'pie',
      x: 'Category',
      y: 'Value'
    };

    const sheet = createMockSheet(
      [[createCell('A'), createCell(1)]],
      [
        { name: 'Category', type: DataType.TEXT },
        { name: 'Value', type: DataType.NUMBER }
      ]
    );

    renderChart(chart, sheet);

    expect(Chart).toHaveBeenCalledWith(
      expect.any(HTMLCanvasElement),
      expect.objectContaining({
        options: expect.objectContaining({
          scales: {}
        })
      })
    );
  });

  it('should show legend for multiple datasets', async () => {
    const { Chart } = vi.mocked(await import('chart.js'), true);
    
    const chart: ChartMetadata = {
      type: 'bar',
      x: 'Month',
      y: ['Sales', 'Profit']
    };

    const sheet = createMockSheet(
      [[createCell('Jan'), createCell(100), createCell(20)]],
      [
        { name: 'Month', type: DataType.TEXT },
        { name: 'Sales', type: DataType.NUMBER },
        { name: 'Profit', type: DataType.NUMBER }
      ]
    );

    renderChart(chart, sheet);

    expect(Chart).toHaveBeenCalledWith(
      expect.any(HTMLCanvasElement),
      expect.objectContaining({
        options: expect.objectContaining({
          plugins: expect.objectContaining({
            legend: {
              display: true  // Multiple datasets
            }
          })
        })
      })
    );
  });
});