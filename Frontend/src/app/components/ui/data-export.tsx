import { Download, FileText, Table } from 'lucide-react';
import { RiskData } from '../../../services/api';

// CSV Export utility functions
export class DataExporter {
  // Convert array of objects to CSV string
  static arrayToCSV(data: any[], filename: string): string {
    if (data.length === 0) return '';

    // Get headers from the first object
    const headers = Object.keys(data[0]);
    
    // Create CSV content
    const csvContent = [
      // Header row
      headers.join(','),
      // Data rows
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          // Handle different data types
          if (value === null || value === undefined) return '';
          if (typeof value === 'object') return JSON.stringify(value).replace(/,/g, ';');
          if (typeof value === 'string' && value.includes(',')) return `"${value}"`;
          return value;
        }).join(',')
      )
    ].join('\n');

    return csvContent;
  }

  // Download CSV file
  static downloadCSV(csvContent: string, filename: string): void {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  }

  // Export risk data to CSV
  static exportRiskData(riskData: RiskData[], filename?: string): void {
    const processedData = riskData.map(risk => ({
      'Risk ID': risk.id,
      'Entity ID': risk.entity_id,
      'Entity Type': risk.entity_type,
      'Risk Score': risk.risk_score,
      'Risk Level': risk.risk_level,
      'Confidence': risk.confidence,
      'Risk Factors': risk.risk_factors?.join('; ') || '',
      'Source': risk.source,
      'Created At': new Date(risk.created_at).toLocaleString(),
      'Features': JSON.stringify(risk.features).replace(/,/g, '; ')
    }));

    const csvContent = this.arrayToCSV(processedData, filename || 'risk-data.csv');
    this.downloadCSV(csvContent, filename || `risk-data-${new Date().toISOString().split('T')[0]}.csv`);
  }

  // Export market data to CSV
  static exportMarketData(marketData: any[], filename?: string): void {
    const processedData = marketData.map(data => ({
      'Timestamp': new Date(data.timestamp || Date.now()).toLocaleString(),
      'Symbol': data.symbol || '',
      'Price': data.price || 0,
      'Change': data.change || 0,
      'Change %': data.changePercent || 0,
      'Volume': data.volume || 0,
      'High': data.high || 0,
      'Low': data.low || 0,
      'Open': data.open || 0,
      'Close': data.close || 0
    }));

    const csvContent = this.arrayToCSV(processedData, filename || 'market-data.csv');
    this.downloadCSV(csvContent, filename || `market-data-${new Date().toISOString().split('T')[0]}.csv`);
  }

  // Export analytics summary
  static exportAnalyticsSummary(data: {
    totalRisks: number;
    avgRiskScore: number;
    riskDistribution: any;
    timeRange: string;
  }, filename?: string): void {
    const summaryData = [
      { 'Metric': 'Total Risk Events', 'Value': data.totalRisks },
      { 'Metric': 'Average Risk Score', 'Value': data.avgRiskScore.toFixed(2) },
      { 'Metric': 'Time Range', 'Value': data.timeRange },
      { 'Metric': 'Export Date', 'Value': new Date().toLocaleString() }
    ];

    const csvContent = this.arrayToCSV(summaryData, filename || 'analytics-summary.csv');
    this.downloadCSV(csvContent, filename || `analytics-summary-${new Date().toISOString().split('T')[0]}.csv`);
  }
}

// Export Button Component
interface ExportButtonProps {
  data: any[];
  exportType: 'risk' | 'market' | 'analytics';
  filename?: string;
  className?: string;
  isDarkMode: boolean;
  disabled?: boolean;
}

export function ExportButton({ 
  data, 
  exportType, 
  filename, 
  className = '', 
  isDarkMode,
  disabled = false 
}: ExportButtonProps) {
  const handleExport = () => {
    if (disabled || data.length === 0) return;

    try {
      switch (exportType) {
        case 'risk':
          DataExporter.exportRiskData(data as RiskData[], filename);
          break;
        case 'market':
          DataExporter.exportMarketData(data, filename);
          break;
        case 'analytics':
          DataExporter.exportAnalyticsSummary(data[0], filename);
          break;
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const getIcon = () => {
    switch (exportType) {
      case 'risk':
        return <FileText className="size-4" />;
      case 'market':
        return <Table className="size-4" />;
      default:
        return <Download className="size-4" />;
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={disabled || data.length === 0}
      className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all ${
        disabled || data.length === 0
          ? 'opacity-50 cursor-not-allowed'
          : isDarkMode
            ? 'bg-teal-600 text-white hover:bg-teal-500'
            : 'bg-teal-500 text-white hover:bg-teal-600'
      } ${className}`}
      title={data.length === 0 ? 'No data to export' : `Export ${exportType} data as CSV`}
    >
      {getIcon()}
      Export CSV
    </button>
  );
}

// Export Menu Component
interface ExportMenuProps {
  riskData: RiskData[];
  marketData?: any[];
  isDarkMode: boolean;
  className?: string;
}

export function ExportMenu({ riskData, marketData, isDarkMode, className = '' }: ExportMenuProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      <h3 className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
        Export Data
      </h3>
      
      <div className="space-y-2">
        <ExportButton
          data={riskData}
          exportType="risk"
          isDarkMode={isDarkMode}
          className="w-full justify-start"
        />
        
        {marketData && marketData.length > 0 && (
          <ExportButton
            data={marketData}
            exportType="market"
            isDarkMode={isDarkMode}
            className="w-full justify-start"
          />
        )}
        
        <ExportButton
          data={[{
            totalRisks: riskData.length,
            avgRiskScore: riskData.reduce((acc, risk) => acc + risk.risk_score, 0) / riskData.length || 0,
            riskDistribution: {},
            timeRange: 'Last 24 hours'
          }]}
          exportType="analytics"
          isDarkMode={isDarkMode}
          className="w-full justify-start"
        />
      </div>
      
      <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
        Export data in CSV format for external analysis
      </p>
    </div>
  );
}