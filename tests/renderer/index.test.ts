/**
 * Tests for Main Renderer
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the sub-renderers - must be before imports
vi.mock('../../src/renderer/table', () => ({
  renderTable: vi.fn(() => {
    const table = document.createElement('table');
    table.className = 'mock-table';
    return table;
  })
}));

vi.mock('../../src/renderer/charts', () => ({
  renderChart: vi.fn(() => {
    const canvas = document.createElement('canvas');
    canvas.className = 'mock-chart';
    return canvas;
  })
}));

// Mock Chart.js completely for these tests
const mockChart = vi.fn();
mockChart.register = vi.fn();
vi.mock('chart.js', () => ({
  Chart: mockChart,
  registerables: []
}));

import { renderRCSV } from '../../src/renderer';
import type { RCSVDocument, Sheet, ChartMetadata } from '../../src/core/engine/types';
import { DataType } from '../../src/core/engine/types';

/**
 * Helper to create a mock RCSV document
 */
function createMockDocument(
  sheets: Sheet[],
  metadata: { title?: string; author?: string } = {}
): RCSVDocument {
  return {
    metadata,
    sheets,
    memoryStats: {
      estimatedRows: 100,
      estimatedMemoryMB: 0.5
    }
  };
}

/**
 * Helper to create a mock sheet
 */
function createMockSheet(
  name: string,
  hasCharts: boolean = false
): Sheet {
  const charts: ChartMetadata[] = hasCharts ? [{
    type: 'bar',
    title: 'Test Chart',
    x: 'Month',
    y: 'Sales'
  }] : [];

  const contentBlocks = hasCharts ? [{
    type: 'chart' as const,
    sourceOrder: 0,
    lineNumber: 1,
    chart: charts[0]
  }] : [];

  return {
    name,
    metadata: {
      columns: [
        { name: 'Month', type: DataType.TEXT },
        { name: 'Sales', type: DataType.NUMBER }
      ],
      charts,
      tables: [],
      contentBlocks
    },
    charts,
    data: [
      [{ raw: 'Jan', value: 'Jan', type: DataType.TEXT }, { raw: '100', value: 100, type: DataType.NUMBER }],
      [{ raw: 'Feb', value: 'Feb', type: DataType.TEXT }, { raw: '200', value: 200, type: DataType.NUMBER }]
    ],
    rowCount: 2,
    columnCount: 2
  };
}

describe('renderRCSV', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    vi.clearAllMocks();
    container = document.createElement('div');
  });

  it('should render document title and author', () => {
    const doc = createMockDocument(
      [createMockSheet('Sheet1')],
      { title: 'Test Document', author: 'Test Author' }
    );

    renderRCSV(doc, container);

    const title = container.querySelector('.rcsv-title');
    const author = container.querySelector('.rcsv-author');

    expect(title?.textContent).toBe('Test Document');
    expect(author?.textContent).toBe('By: Test Author');
  });

  it('should not render title and author if not provided', () => {
    const doc = createMockDocument([createMockSheet('Sheet1')]);

    renderRCSV(doc, container);

    const title = container.querySelector('.rcsv-title');
    const author = container.querySelector('.rcsv-author');

    expect(title).toBeNull();
    expect(author).toBeNull();
  });

  it('should render single sheet without sheet title for default name', () => {
    const doc = createMockDocument([createMockSheet('Sheet1')]);

    renderRCSV(doc, container);

    const sheetDiv = container.querySelector('.rcsv-sheet');
    const sheetTitle = sheetDiv?.querySelector('.rcsv-sheet-title');

    expect(sheetDiv).toBeTruthy();
    expect(sheetTitle).toBeNull();
  });

  it('should render sheet title for non-default sheet names', () => {
    const doc = createMockDocument([createMockSheet('Sales Data')]);

    renderRCSV(doc, container);

    const sheetTitle = container.querySelector('.rcsv-sheet-title');
    expect(sheetTitle?.textContent).toBe('Sales Data');
  });

  it('should render multiple sheets', () => {
    const doc = createMockDocument([
      createMockSheet('Sheet1'),
      createMockSheet('Sales Data'),
      createMockSheet('Analytics')
    ]);

    renderRCSV(doc, container);

    const sheets = container.querySelectorAll('.rcsv-sheet');
    expect(sheets).toHaveLength(3);

    // First sheet (default name) should not have title
    const firstSheetTitle = sheets[0].querySelector('.rcsv-sheet-title');
    expect(firstSheetTitle).toBeNull();

    // Other sheets should have titles
    const secondSheetTitle = sheets[1].querySelector('.rcsv-sheet-title');
    const thirdSheetTitle = sheets[2].querySelector('.rcsv-sheet-title');
    expect(secondSheetTitle?.textContent).toBe('Sales Data');
    expect(thirdSheetTitle?.textContent).toBe('Analytics');
  });

  it('should render charts before tables', () => {
    const doc = createMockDocument([createMockSheet('TestSheet', true)]);

    renderRCSV(doc, container);

    const sheetDiv = container.querySelector('.rcsv-sheet');
    const children = Array.from(sheetDiv?.children || []);

    // Find layout rows containing chart and table
    const chartRowIndex = children.findIndex(el => 
      el.classList.contains('rcsv-layout-row') && 
      el.querySelector('.rcsv-chart-wrapper')
    );
    const tableRowIndex = children.findIndex(el => 
      el.classList.contains('rcsv-layout-row') && 
      el.querySelector('.rcsv-table-wrapper')
    );

    expect(chartRowIndex).toBeLessThan(tableRowIndex);
    expect(chartRowIndex).toBeGreaterThan(-1);
    expect(tableRowIndex).toBeGreaterThan(-1);
  });

  it('should render charts in layout rows', () => {
    const doc = createMockDocument([createMockSheet('TestSheet', true)]);

    renderRCSV(doc, container);

    const chartWrapper = container.querySelector('.rcsv-chart-wrapper');
    const chart = chartWrapper?.querySelector('.mock-chart');

    expect(chartWrapper).toBeTruthy();
    expect(chart).toBeTruthy();
  });

  it('should not render chart wrappers if no charts', () => {
    const doc = createMockDocument([createMockSheet('TestSheet', false)]);

    renderRCSV(doc, container);

    const chartWrapper = container.querySelector('.rcsv-chart-wrapper');
    expect(chartWrapper).toBeNull();
  });

  it('should render table in table wrapper', () => {
    const doc = createMockDocument([createMockSheet('TestSheet')]);

    renderRCSV(doc, container);

    const tableWrapper = container.querySelector('.rcsv-table-wrapper');
    const table = tableWrapper?.querySelector('.mock-table');

    expect(tableWrapper).toBeTruthy();
    expect(table).toBeTruthy();
  });

  it('should render memory stats', () => {
    const doc = createMockDocument([createMockSheet('TestSheet')]);

    renderRCSV(doc, container);

    const stats = container.querySelector('.rcsv-stats');
    expect(stats?.textContent).toContain('Rows: 100');
    expect(stats?.textContent).toContain('Memory: ~0.50 MB');
  });

  it('should not render memory stats if not available', () => {
    const doc = createMockDocument([createMockSheet('TestSheet')]);
    delete doc.memoryStats;

    renderRCSV(doc, container);

    const stats = container.querySelector('.rcsv-stats');
    expect(stats).toBeNull();
  });

  it('should handle chart rendering errors gracefully', async () => {
    const { renderChart } = vi.mocked(await import('../../src/renderer/charts'));
    renderChart.mockImplementation(() => {
      throw new Error('Chart rendering failed');
    });

    const doc = createMockDocument([createMockSheet('TestSheet', true)]);

    renderRCSV(doc, container);

    const chartError = container.querySelector('.rcsv-chart-error');
    expect(chartError).toBeTruthy();
    expect(chartError?.textContent).toContain('Chart rendering error: Chart rendering failed');
  });

  it('should handle table rendering errors gracefully', async () => {
    const { renderTable } = vi.mocked(await import('../../src/renderer/table'));
    renderTable.mockImplementation(() => {
      throw new Error('Table rendering failed');
    });

    const doc = createMockDocument([createMockSheet('TestSheet')]);

    renderRCSV(doc, container);

    const tableError = container.querySelector('.rcsv-table-error');
    expect(tableError?.textContent).toContain('Table rendering error: Table rendering failed');
  });

  it('should clear container before rendering', () => {
    container.innerHTML = '<div>Previous content</div>';
    
    const doc = createMockDocument([createMockSheet('TestSheet')]);

    renderRCSV(doc, container);

    expect(container.textContent).not.toContain('Previous content');
    expect(container.querySelector('.rcsv-sheet')).toBeTruthy();
  });

  it('should call renderTable and renderChart with correct parameters', async () => {
    const { renderTable } = vi.mocked(await import('../../src/renderer/table'));
    const { renderChart } = vi.mocked(await import('../../src/renderer/charts'));

    const sheet = createMockSheet('TestSheet', true);
    const doc = createMockDocument([sheet]);

    renderRCSV(doc, container);

    expect(renderTable).toHaveBeenCalledWith(sheet);
    expect(renderChart).toHaveBeenCalledWith(sheet.charts[0], sheet);
  });
});