/**
 * Chart Renderer for RCSV using Chart.js
 */

import { Chart, ChartConfiguration, registerables } from 'chart.js';
import type { ChartMetadata, Sheet, CellValue } from '../core/engine/types';

// Register all Chart.js components
Chart.register(...registerables);

/**
 * Render a chart from metadata
 * @param chart - Chart metadata from parser
 * @param sheet - Sheet containing the data
 * @returns Canvas element with rendered chart
 */
export function renderChart(chart: ChartMetadata, sheet: Sheet): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.className = 'rcsv-chart';
  
  // Extract data based on x/y columns
  const { labels, datasets } = extractChartData(chart, sheet);
  
  // Map RCSV chart type to Chart.js config
  const config = createChartConfig(chart, labels, datasets);
  
  // Create Chart.js instance
  new Chart(canvas, config);
  
  return canvas;
}

/**
 * Extract data from sheet based on chart metadata
 */
function extractChartData(chart: ChartMetadata, sheet: Sheet) {
  // Handle pie charts differently - they use 'labels' and 'values'
  if (chart.type === 'pie') {
    const labelsIndex = sheet.metadata.columns.findIndex(col => col.name === chart.labels);
    const valuesIndex = sheet.metadata.columns.findIndex(col => col.name === chart.values);
    
    if (labelsIndex === -1 || valuesIndex === -1) {
      console.warn('Pie chart missing labels or values column', { chart, columns: sheet.metadata.columns });
      return { labels: [], datasets: [] };
    }
    
    const labels = sheet.data.map(row => {
      const cell = row[labelsIndex];
      return formatLabel(cell);
    });
    
    const data = sheet.data.map(row => {
      const cell = row[valuesIndex];
      return extractNumericValue(cell);
    });
    
    const datasets = [{
      label: chart.values || 'Values',
      data,
      backgroundColor: data.map((_, sliceIndex) => getColor(sliceIndex, 0.7)),
      borderColor: data.map((_, sliceIndex) => getColor(sliceIndex, 1)),
      borderWidth: 1
    }];
    
    return { labels, datasets };
  }
  
  // For non-pie charts, use x and y columns
  const xIndex = chart.x ? sheet.metadata.columns.findIndex(col => col.name === chart.x) : -1;
  const yIndices = chart.y 
    ? (Array.isArray(chart.y) 
      ? chart.y.map(name => sheet.metadata.columns.findIndex(col => col.name === name))
      : [sheet.metadata.columns.findIndex(col => col.name === chart.y)])
    : [];
  
  if (xIndex === -1 || yIndices.some(idx => idx === -1)) {
    console.warn('Chart missing x or y columns', { chart, columns: sheet.metadata.columns });
    return { labels: [], datasets: [] };
  }
  
  // Extract labels from x column
  const labels = sheet.data.map(row => {
    const cell = row[xIndex];
    return formatLabel(cell);
  });
  
  // Extract datasets from y columns
  const datasets = yIndices.map((yIndex, i) => {
    const columnName = Array.isArray(chart.y) ? chart.y[i] : chart.y;
    const data = sheet.data.map(row => {
      const cell = row[yIndex];
      return extractNumericValue(cell);
    });
    
    return {
      label: columnName || `Series ${i + 1}`,
      data,
      backgroundColor: getColor(i, 0.5),
      borderColor: getColor(i, 1),
      borderWidth: 1
    };
  });
  
  return { labels, datasets };
}

/**
 * Create Chart.js configuration from RCSV metadata
 */
function createChartConfig(
  chart: ChartMetadata, 
  labels: string[], 
  datasets: any[]
): ChartConfiguration {
  // Map RCSV chart type to Chart.js type
  const chartType = mapChartType(chart.type);
  
  return {
    type: chartType,
    data: {
      labels,
      datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: !!chart.title,
          text: chart.title || ''
        },
        legend: {
          display: datasets.length > 1
        }
      },
      scales: chartType === 'pie' ? {} : {
        y: {
          beginAtZero: true
        }
      }
    }
  };
}

/**
 * Map RCSV chart type to Chart.js type
 */
function mapChartType(type: ChartMetadata['type']): ChartConfiguration['type'] {
  switch (type) {
    case 'bar':
      return 'bar';
    case 'column':
      return 'bar'; // Chart.js uses 'bar' for both
    case 'line':
      return 'line';
    case 'pie':
      return 'pie';
    case 'scatter':
      return 'scatter';
    default:
      return 'bar';
  }
}

/**
 * Format a cell value as a label
 */
function formatLabel(cell: CellValue): string {
  if (cell.value === null || cell.value === undefined) {
    return '';
  }
  
  if (cell.value instanceof Date) {
    return cell.value.toLocaleDateString();
  }
  
  return String(cell.value);
}

/**
 * Extract numeric value from cell
 */
function extractNumericValue(cell: CellValue): number | null {
  if (cell.value === null || cell.value === undefined || cell.value === '') {
    return null;
  }
  
  const num = Number(cell.value);
  return isNaN(num) ? null : num;
}

/**
 * Get a color from a palette
 */
function getColor(index: number, alpha: number = 1): string {
  const colors = [
    `rgba(54, 162, 235, ${alpha})`,  // Blue
    `rgba(255, 99, 132, ${alpha})`,  // Red
    `rgba(75, 192, 192, ${alpha})`,  // Teal
    `rgba(255, 206, 86, ${alpha})`,  // Yellow
    `rgba(153, 102, 255, ${alpha})`, // Purple
    `rgba(255, 159, 64, ${alpha})`,  // Orange
  ];
  
  return colors[index % colors.length];
}