import * as XLSX from 'xlsx';
import { generateObject, generateText } from 'ai';
import { createAIProvider } from '@/lib/ai/providers/ai-provider-factory';
import { z } from 'zod';

export interface ExcelTemplate {
  id: string;
  name: string;
  type: 'dcf' | 'lbo' | 'comps' | 'portfolio' | 'merger_model';
  description: string;
  sheets: SheetTemplate[];
  calculations: CalculationSet[];
  charts: ChartDefinition[];
}

export interface SheetTemplate {
  name: string;
  sections: SheetSection[];
  formatting: SheetFormatting;
}

export interface SheetSection {
  title: string;
  startCell: string; // e.g., "A1"
  type: 'assumptions' | 'historical' | 'projections' | 'calculations' | 'summary' | 'charts';
  data?: any;
  formulas?: FormulaDefinition[];
}

export interface SheetFormatting {
  headerStyle: CellStyle;
  dataStyle: CellStyle;
  calculationStyle: CellStyle;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

export interface CellStyle {
  font?: {
    bold?: boolean;
    size?: number;
    color?: string;
    name?: string;
  };
  fill?: {
    type: string;
    fgColor: string;
  };
  border?: {
    style: string;
    color: string;
  };
  alignment?: {
    horizontal?: string;
    vertical?: string;
  };
  numberFormat?: string;
}

export interface FormulaDefinition {
  cell: string;
  formula: string;
  description: string;
  dependencies: string[];
}

export interface CalculationSet {
  name: string;
  formulas: FormulaDefinition[];
  validationRules: ValidationRule[];
}

export interface ValidationRule {
  range: string;
  type: 'range' | 'positive' | 'percentage' | 'currency';
  criteria: any;
  errorMessage: string;
}

export interface ChartDefinition {
  name: string;
  type: 'line' | 'bar' | 'pie' | 'scatter' | 'waterfall' | 'combo';
  dataRange: string;
  sheet: string;
  position: {
    startCell: string;
    endCell: string;
  };
  styling: ChartStyling;
}

export interface ChartStyling {
  title: string;
  colors: string[];
  showLegend: boolean;
  showDataLabels: boolean;
  xAxisTitle?: string;
  yAxisTitle?: string;
}

const NaturalLanguageSchema = z.object({
  modelType: z.enum(['dcf', 'lbo', 'comps', 'portfolio', 'merger_model']),
  keyInputs: z.array(z.string()).describe("List of key financial inputs needed"),
  calculationSteps: z.array(z.object({
    step: z.string(),
    formula: z.string(),
    description: z.string()
  })).describe("Step-by-step calculation process"),
  outputMetrics: z.array(z.string()).describe("Key output metrics to calculate"),
  assumptions: z.array(z.object({
    name: z.string(),
    defaultValue: z.number().optional(),
    description: z.string()
  })).describe("Key assumptions needed for the model")
});

export class ExcelGenerationEngine {
  private aiProvider: any;
  private templates: Map<string, ExcelTemplate> = new Map();
  
  constructor() {
    this.aiProvider = createAIProvider('claude-4');
    this.initializeTemplates();
  }

  // Core Excel Generation
  async generateExcel(
    templateId: string,
    data: Record<string, any>,
    customizations?: {
      title?: string;
      assumptions?: Record<string, number>;
      includeCharts?: boolean;
    }
  ): Promise<{
    workbook: XLSX.WorkBook;
    buffer: Buffer;
    filename: string;
    metadata: {
      sheets: string[];
      calculatedCells: number;
      chartCount: number;
      generatedAt: Date;
    };
  }> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    const workbook = XLSX.utils.book_new();
    let calculatedCells = 0;
    let chartCount = 0;

    try {
      // Create each sheet from template
      for (const sheetTemplate of template.sheets) {
        const worksheet = await this.createWorksheet(sheetTemplate, data, customizations?.assumptions);
        workbook.Sheets[sheetTemplate.name] = worksheet;
        workbook.SheetNames.push(sheetTemplate.name);
      }

      // Add calculations
      for (const calcSet of template.calculations) {
        calculatedCells += await this.addCalculations(workbook, calcSet, data);
      }

      // Add charts if requested
      if (customizations?.includeCharts !== false) {
        for (const chartDef of template.charts) {
          await this.addChart(workbook, chartDef, data);
          chartCount++;
        }
      }

      // Apply formatting
      this.applyGlobalFormatting(workbook, template);

      // Generate buffer
      const buffer = XLSX.write(workbook, { 
        bookType: 'xlsx', 
        type: 'buffer',
        cellStyles: true 
      });

      const filename = `${customizations?.title || template.name}_${new Date().toISOString().split('T')[0]}.xlsx`;

      return {
        workbook,
        buffer,
        filename,
        metadata: {
          sheets: workbook.SheetNames,
          calculatedCells,
          chartCount,
          generatedAt: new Date()
        }
      };

    } catch (error) {
      throw new Error(`Excel generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Natural Language to Excel Model
  async convertNaturalLanguageToExcel(description: string): Promise<{
    templateId: string;
    suggestedData: Record<string, any>;
    generatedModel: {
      workbook: XLSX.WorkBook;
      buffer: Buffer;
      filename: string;
    };
  }> {
    if (!this.aiProvider) {
      throw new Error('AI provider not available');
    }

    const prompt = `Analyze this financial model request and structure it:

"${description}"

Determine:
1. What type of financial model is needed
2. Key inputs required
3. Calculation steps and formulas
4. Output metrics to generate
5. Key assumptions

Provide specific Excel formulas where possible (e.g., =B5*C5, =NPV(B2,C10:C15))`;

    try {
      const analysis = await generateObject({
        model: this.aiProvider,
        schema: NaturalLanguageSchema,
        prompt
      });

      const modelStructure = analysis.object;
      
      // Select appropriate template
      const templateId = this.selectBestTemplate(modelStructure.modelType);
      
      // Generate suggested data structure
      const suggestedData = this.generateDataStructure(modelStructure);
      
      // Create the Excel model
      const generatedModel = await this.generateExcel(templateId, suggestedData, {
        title: `AI Generated ${modelStructure.modelType.toUpperCase()} Model`,
        includeCharts: true
      });

      return {
        templateId,
        suggestedData,
        generatedModel
      };

    } catch (error) {
      throw new Error(`Natural language conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // DCF Model Generation
  async generateDCFModel(
    companyData: {
      symbol: string;
      financials: Array<{
        year: number;
        revenue: number;
        ebitda: number;
        capex: number;
        workingCapital: number;
        taxRate: number;
      }>;
      assumptions: {
        discountRate: number;
        terminalGrowthRate: number;
        projectionYears: number;
        revenueGrowthRates: number[];
        ebitdaMargins: number[];
      };
    }
  ): Promise<{ workbook: XLSX.WorkBook; buffer: Buffer; filename: string }> {
    
    const workbook = XLSX.utils.book_new();
    
    // Assumptions Sheet
    const assumptionsSheet = this.createAssumptionsSheet(companyData.assumptions);
    workbook.Sheets['Assumptions'] = assumptionsSheet;
    workbook.SheetNames.push('Assumptions');
    
    // Historical Financials Sheet
    const historicalSheet = this.createHistoricalSheet(companyData.financials);
    workbook.Sheets['Historical'] = historicalSheet;
    workbook.SheetNames.push('Historical');
    
    // DCF Model Sheet
    const dcfSheet = this.createDCFModelSheet(companyData);
    workbook.Sheets['DCF Model'] = dcfSheet;
    workbook.SheetNames.push('DCF Model');
    
    // Sensitivity Analysis Sheet
    const sensitivitySheet = this.createSensitivitySheet();
    workbook.Sheets['Sensitivity'] = sensitivitySheet;
    workbook.SheetNames.push('Sensitivity');
    
    // Summary Sheet
    const summarySheet = this.createSummarySheet(companyData.symbol);
    workbook.Sheets['Summary'] = summarySheet;
    workbook.SheetNames.push('Summary');

    const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
    const filename = `${companyData.symbol}_DCF_Model_${new Date().toISOString().split('T')[0]}.xlsx`;

    return { workbook, buffer, filename };
  }

  // LBO Model Generation
  async generateLBOModel(
    dealData: {
      targetCompany: string;
      purchasePrice: number;
      debtEquityRatio: number;
      interestRate: number;
      exitMultiple: number;
      holdPeriod: number;
      financials: any[];
    }
  ): Promise<{ workbook: XLSX.WorkBook; buffer: Buffer; filename: string }> {
    
    const workbook = XLSX.utils.book_new();
    
    // Transaction Summary
    const transactionSheet = this.createTransactionSheet(dealData);
    workbook.Sheets['Transaction'] = transactionSheet;
    workbook.SheetNames.push('Transaction');
    
    // Sources & Uses
    const sourcesUsesSheet = this.createSourcesUsesSheet(dealData);
    workbook.Sheets['Sources & Uses'] = sourcesUsesSheet;
    workbook.SheetNames.push('Sources & Uses');
    
    // Pro Forma Model
    const proFormaSheet = this.createProFormaSheet(dealData);
    workbook.Sheets['Pro Forma'] = proFormaSheet;
    workbook.SheetNames.push('Pro Forma');
    
    // Returns Analysis
    const returnsSheet = this.createReturnsSheet(dealData);
    workbook.Sheets['Returns'] = returnsSheet;
    workbook.SheetNames.push('Returns');

    const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
    const filename = `${dealData.targetCompany}_LBO_Model_${new Date().toISOString().split('T')[0]}.xlsx`;

    return { workbook, buffer, filename };
  }

  // Comparable Company Analysis
  async generateCompsAnalysis(
    companies: Array<{
      name: string;
      ticker: string;
      marketCap: number;
      revenue: number;
      ebitda: number;
      netIncome: number;
      bookValue: number;
    }>
  ): Promise<{ workbook: XLSX.WorkBook; buffer: Buffer; filename: string }> {
    
    const workbook = XLSX.utils.book_new();
    
    // Company Data Sheet
    const dataSheet = this.createCompanyDataSheet(companies);
    workbook.Sheets['Company Data'] = dataSheet;
    workbook.SheetNames.push('Company Data');
    
    // Multiples Analysis
    const multiplesSheet = this.createMultiplesSheet(companies);
    workbook.Sheets['Multiples'] = multiplesSheet;
    workbook.SheetNames.push('Multiples');
    
    // Statistics & Rankings
    const statsSheet = this.createStatsSheet(companies);
    workbook.Sheets['Statistics'] = statsSheet;
    workbook.SheetNames.push('Statistics');

    const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
    const filename = `Comparable_Companies_Analysis_${new Date().toISOString().split('T')[0]}.xlsx`;

    return { workbook, buffer, filename };
  }

  // Private Helper Methods for Sheet Creation
  private async createWorksheet(
    template: SheetTemplate, 
    data: Record<string, any>,
    assumptions?: Record<string, number>
  ): Promise<XLSX.WorkSheet> {
    const worksheet = XLSX.utils.aoa_to_sheet([]);
    
    for (const section of template.sections) {
      await this.createSection(worksheet, section, data, assumptions);
    }
    
    return worksheet;
  }

  private async createSection(
    worksheet: XLSX.WorkSheet,
    section: SheetSection,
    data: Record<string, any>,
    assumptions?: Record<string, number>
  ): Promise<void> {
    const startCell = XLSX.utils.decode_cell(section.startCell);
    let currentRow = startCell.r;
    
    // Add section title
    XLSX.utils.sheet_add_aoa(worksheet, [[section.title]], {
      origin: { r: currentRow, c: startCell.c }
    });
    currentRow += 2;

    switch (section.type) {
      case 'assumptions':
        currentRow = this.addAssumptionsSection(worksheet, currentRow, startCell.c, assumptions || {});
        break;
      case 'historical':
        currentRow = this.addHistoricalSection(worksheet, currentRow, startCell.c, data);
        break;
      case 'projections':
        currentRow = this.addProjectionsSection(worksheet, currentRow, startCell.c, data);
        break;
      case 'calculations':
        currentRow = this.addCalculationsSection(worksheet, currentRow, startCell.c, section.formulas || []);
        break;
      case 'summary':
        currentRow = this.addSummarySection(worksheet, currentRow, startCell.c, data);
        break;
    }
  }

  private addAssumptionsSection(
    worksheet: XLSX.WorkSheet,
    startRow: number,
    startCol: number,
    assumptions: Record<string, number>
  ): number {
    const headers = [['Assumption', 'Value', 'Notes']];
    XLSX.utils.sheet_add_aoa(worksheet, headers, {
      origin: { r: startRow, c: startCol }
    });

    let row = startRow + 1;
    Object.entries(assumptions).forEach(([key, value]) => {
      const rowData = [[key, value, '']];
      XLSX.utils.sheet_add_aoa(worksheet, rowData, {
        origin: { r: row, c: startCol }
      });
      row++;
    });

    return row + 1;
  }

  private addHistoricalSection(
    worksheet: XLSX.WorkSheet,
    startRow: number,
    startCol: number,
    data: Record<string, any>
  ): number {
    if (!data.historical || !Array.isArray(data.historical)) {
      return startRow + 1;
    }

    const years = data.historical.map((item: any) => item.year || item.period);
    const headers = [['Metric', ...years]];
    XLSX.utils.sheet_add_aoa(worksheet, headers, {
      origin: { r: startRow, c: startCol }
    });

    const metrics = ['Revenue', 'EBITDA', 'Net Income', 'Capex', 'Free Cash Flow'];
    let row = startRow + 1;

    metrics.forEach(metric => {
      const values = data.historical.map((item: any) => {
        switch (metric) {
          case 'Revenue': return item.revenue || 0;
          case 'EBITDA': return item.ebitda || 0;
          case 'Net Income': return item.netIncome || 0;
          case 'Capex': return item.capex || 0;
          case 'Free Cash Flow': return (item.ebitda || 0) - (item.capex || 0);
          default: return 0;
        }
      });
      
      const rowData = [[metric, ...values]];
      XLSX.utils.sheet_add_aoa(worksheet, rowData, {
        origin: { r: row, c: startCol }
      });
      row++;
    });

    return row + 1;
  }

  private addProjectionsSection(
    worksheet: XLSX.WorkSheet,
    startRow: number,
    startCol: number,
    data: Record<string, any>
  ): number {
    // Create projection years (usually 5 years)
    const currentYear = new Date().getFullYear();
    const projectionYears = Array.from({length: 5}, (_, i) => currentYear + i + 1);
    
    const headers = [['Metric', ...projectionYears]];
    XLSX.utils.sheet_add_aoa(worksheet, headers, {
      origin: { r: startRow, c: startCol }
    });

    let row = startRow + 1;
    const metrics = ['Revenue', 'Revenue Growth %', 'EBITDA', 'EBITDA Margin %', 'Capex', 'Free Cash Flow'];

    metrics.forEach((metric, metricIndex) => {
      const formulas = projectionYears.map((year, yearIndex) => {
        const col = startCol + yearIndex + 1;
        const prevCol = col - 1;
        const cellAddr = XLSX.utils.encode_cell({ r: row, c: col });
        
        switch (metric) {
          case 'Revenue':
            return yearIndex === 0 ? 100000 : { f: `${XLSX.utils.encode_cell({r: row, c: prevCol})}*1.1` };
          case 'Revenue Growth %':
            return yearIndex === 0 ? 0.1 : { f: `${XLSX.utils.encode_cell({r: row, c: col})}/${XLSX.utils.encode_cell({r: row-1, c: prevCol})}-1` };
          case 'EBITDA':
            return { f: `${XLSX.utils.encode_cell({r: row-2, c: col})}*0.2` };
          case 'EBITDA Margin %':
            return { f: `${XLSX.utils.encode_cell({r: row-1, c: col})}/${XLSX.utils.encode_cell({r: row-3, c: col})}` };
          case 'Capex':
            return { f: `${XLSX.utils.encode_cell({r: row-4, c: col})}*0.05` };
          case 'Free Cash Flow':
            return { f: `${XLSX.utils.encode_cell({r: row-3, c: col})}-${XLSX.utils.encode_cell({r: row-1, c: col})}` };
          default:
            return 0;
        }
      });

      const rowData = [[metric, ...formulas]];
      XLSX.utils.sheet_add_aoa(worksheet, rowData, {
        origin: { r: row, c: startCol }
      });
      row++;
    });

    return row + 1;
  }

  private addCalculationsSection(
    worksheet: XLSX.WorkSheet,
    startRow: number,
    startCol: number,
    formulas: FormulaDefinition[]
  ): number {
    let row = startRow;

    formulas.forEach(formula => {
      const cellRef = XLSX.utils.decode_cell(formula.cell);
      worksheet[formula.cell] = { f: formula.formula };
      row = Math.max(row, cellRef.r + 1);
    });

    return row + 1;
  }

  private addSummarySection(
    worksheet: XLSX.WorkSheet,
    startRow: number,
    startCol: number,
    data: Record<string, any>
  ): number {
    const summaryData = [
      ['Enterprise Value', { f: 'SUM(B10:F10)' }],
      ['Equity Value', { f: 'B15-B16' }],
      ['Share Price', { f: 'B16/B17' }]
    ];

    summaryData.forEach((row, index) => {
      XLSX.utils.sheet_add_aoa(worksheet, [row], {
        origin: { r: startRow + index, c: startCol }
      });
    });

    return startRow + summaryData.length + 1;
  }

  // DCF Model specific sheet creators
  private createAssumptionsSheet(assumptions: any): XLSX.WorkSheet {
    const data = [
      ['DCF MODEL ASSUMPTIONS'],
      [],
      ['Assumption', 'Value', 'Notes'],
      ['Discount Rate (WACC)', assumptions.discountRate || 0.10, 'Weighted Average Cost of Capital'],
      ['Terminal Growth Rate', assumptions.terminalGrowthRate || 0.025, 'Long-term growth assumption'],
      ['Projection Years', assumptions.projectionYears || 5, 'Number of years to project'],
      [],
      ['REVENUE ASSUMPTIONS'],
      ['Year 1 Growth', assumptions.revenueGrowthRates?.[0] || 0.15, ''],
      ['Year 2 Growth', assumptions.revenueGrowthRates?.[1] || 0.12, ''],
      ['Year 3 Growth', assumptions.revenueGrowthRates?.[2] || 0.10, ''],
      ['Year 4 Growth', assumptions.revenueGrowthRates?.[3] || 0.08, ''],
      ['Year 5 Growth', assumptions.revenueGrowthRates?.[4] || 0.06, ''],
      [],
      ['MARGIN ASSUMPTIONS'],
      ['Year 1 EBITDA Margin', assumptions.ebitdaMargins?.[0] || 0.20, ''],
      ['Year 2 EBITDA Margin', assumptions.ebitdaMargins?.[1] || 0.22, ''],
      ['Year 3 EBITDA Margin', assumptions.ebitdaMargins?.[2] || 0.24, ''],
      ['Year 4 EBITDA Margin', assumptions.ebitdaMargins?.[3] || 0.25, ''],
      ['Year 5 EBITDA Margin', assumptions.ebitdaMargins?.[4] || 0.25, '']
    ];

    return XLSX.utils.aoa_to_sheet(data);
  }

  private createHistoricalSheet(financials: any[]): XLSX.WorkSheet {
    if (!financials || financials.length === 0) {
      return XLSX.utils.aoa_to_sheet([['No historical data available']]);
    }

    const years = financials.map(f => f.year);
    const data = [
      ['HISTORICAL FINANCIALS'],
      [],
      ['Metric', ...years],
      ['Revenue', ...financials.map(f => f.revenue)],
      ['EBITDA', ...financials.map(f => f.ebitda)],
      ['Capex', ...financials.map(f => f.capex)],
      ['Working Capital', ...financials.map(f => f.workingCapital)],
      ['Tax Rate', ...financials.map(f => f.taxRate)]
    ];

    return XLSX.utils.aoa_to_sheet(data);
  }

  private createDCFModelSheet(companyData: any): XLSX.WorkSheet {
    const currentYear = new Date().getFullYear();
    const years = Array.from({length: 5}, (_, i) => currentYear + i + 1);
    
    const data = [
      [`DCF VALUATION MODEL - ${companyData.symbol}`],
      [],
      ['PROJECTIONS', ...years, 'Terminal'],
      ['Revenue', 
        { f: 'Historical!D4*(1+Assumptions!B9)' },
        { f: 'C4*(1+Assumptions!B10)' },
        { f: 'D4*(1+Assumptions!B11)' },
        { f: 'E4*(1+Assumptions!B12)' },
        { f: 'F4*(1+Assumptions!B13)' },
        ''
      ],
      ['EBITDA',
        { f: 'C4*Assumptions!B16' },
        { f: 'D4*Assumptions!B17' },
        { f: 'E4*Assumptions!B18' },
        { f: 'F4*Assumptions!B19' },
        { f: 'G4*Assumptions!B20' },
        ''
      ],
      ['EBIT', 
        { f: 'C5*0.9' }, // Assume D&A is 10% of EBITDA
        { f: 'D5*0.9' },
        { f: 'E5*0.9' },
        { f: 'F5*0.9' },
        { f: 'G5*0.9' },
        ''
      ],
      ['Taxes',
        { f: 'C6*0.25' }, // 25% tax rate
        { f: 'D6*0.25' },
        { f: 'E6*0.25' },
        { f: 'F6*0.25' },
        { f: 'G6*0.25' },
        ''
      ],
      ['NOPAT',
        { f: 'C6-C7' },
        { f: 'D6-D7' },
        { f: 'E6-E7' },
        { f: 'F6-F7' },
        { f: 'G6-G7' },
        ''
      ],
      ['Capex',
        { f: 'C4*0.05' }, // 5% of revenue
        { f: 'D4*0.05' },
        { f: 'E4*0.05' },
        { f: 'F4*0.05' },
        { f: 'G4*0.05' },
        ''
      ],
      ['Free Cash Flow',
        { f: 'C8-C9' },
        { f: 'D8-D9' },
        { f: 'E8-E9' },
        { f: 'F8-F9' },
        { f: 'G8-G9' },
        { f: 'G10*(1+Assumptions!B5)/(Assumptions!B4-Assumptions!B5)' }
      ],
      [],
      ['VALUATION'],
      ['Discount Factor',
        { f: '1/(1+Assumptions!B4)^1' },
        { f: '1/(1+Assumptions!B4)^2' },
        { f: '1/(1+Assumptions!B4)^3' },
        { f: '1/(1+Assumptions!B4)^4' },
        { f: '1/(1+Assumptions!B4)^5' },
        { f: '1/(1+Assumptions!B4)^5' }
      ],
      ['Present Value',
        { f: 'C10*C13' },
        { f: 'D10*D13' },
        { f: 'E10*E13' },
        { f: 'F10*F13' },
        { f: 'G10*G13' },
        { f: 'H10*H13' }
      ],
      [],
      ['Enterprise Value', { f: 'SUM(C14:H14)' }],
      ['Less: Net Debt', 50000], // Placeholder
      ['Equity Value', { f: 'C16-C17' }],
      ['Shares Outstanding', 100], // Placeholder
      ['Value Per Share', { f: 'C18/C19' }]
    ];

    return XLSX.utils.aoa_to_sheet(data);
  }

  private createSensitivitySheet(): XLSX.WorkSheet {
    const data = [
      ['SENSITIVITY ANALYSIS'],
      [],
      ['Discount Rate vs Terminal Growth Rate'],
      [],
      ['', '2.0%', '2.5%', '3.0%', '3.5%', '4.0%'],
      ['8.0%', { f: 'DCF!C20' }, { f: 'DCF!C20*1.05' }, { f: 'DCF!C20*1.10' }, { f: 'DCF!C20*1.15' }, { f: 'DCF!C20*1.20' }],
      ['9.0%', { f: 'DCF!C20*0.95' }, { f: 'DCF!C20' }, { f: 'DCF!C20*1.05' }, { f: 'DCF!C20*1.10' }, { f: 'DCF!C20*1.15' }],
      ['10.0%', { f: 'DCF!C20*0.90' }, { f: 'DCF!C20*0.95' }, { f: 'DCF!C20' }, { f: 'DCF!C20*1.05' }, { f: 'DCF!C20*1.10' }],
      ['11.0%', { f: 'DCF!C20*0.85' }, { f: 'DCF!C20*0.90' }, { f: 'DCF!C20*0.95' }, { f: 'DCF!C20' }, { f: 'DCF!C20*1.05' }],
      ['12.0%', { f: 'DCF!C20*0.80' }, { f: 'DCF!C20*0.85' }, { f: 'DCF!C20*0.90' }, { f: 'DCF!C20*0.95' }, { f: 'DCF!C20' }]
    ];

    return XLSX.utils.aoa_to_sheet(data);
  }

  private createSummarySheet(symbol: string): XLSX.WorkSheet {
    const data = [
      [`VALUATION SUMMARY - ${symbol}`],
      [],
      ['METHODOLOGY', 'VALUE PER SHARE', 'WEIGHT', 'WEIGHTED VALUE'],
      ['DCF Analysis', { f: 'DCF!C20' }, 0.6, { f: 'C4*D4' }],
      ['Trading Comps', 150, 0.25, { f: 'C5*D5' }], // Placeholder
      ['Transaction Comps', 160, 0.15, { f: 'C6*D6' }], // Placeholder
      [],
      ['BLENDED VALUATION', { f: 'SUM(E4:E6)' }],
      [],
      ['CURRENT STOCK PRICE', 140], // Placeholder
      ['UPSIDE/(DOWNSIDE)', { f: 'C8/C10-1' }],
      [],
      ['RECOMMENDATION'],
      [{ f: 'IF(C11>0.15,"BUY",IF(C11>0,"HOLD","SELL"))' }]
    ];

    return XLSX.utils.aoa_to_sheet(data);
  }

  // LBO Model Helper Methods
  private createTransactionSheet(dealData: any): XLSX.WorkSheet {
    const data = [
      [`LBO TRANSACTION SUMMARY - ${dealData.targetCompany}`],
      [],
      ['Purchase Price', dealData.purchasePrice],
      ['Transaction Multiple', { f: `B3/${dealData.ebitda || 100000}` }],
      ['Debt/Equity Ratio', dealData.debtEquityRatio],
      ['Interest Rate', dealData.interestRate],
      ['Hold Period (Years)', dealData.holdPeriod],
      ['Exit Multiple', dealData.exitMultiple]
    ];

    return XLSX.utils.aoa_to_sheet(data);
  }

  private createSourcesUsesSheet(dealData: any): XLSX.WorkSheet {
    const data = [
      ['SOURCES & USES OF FUNDS'],
      [],
      ['SOURCES', 'Amount', '%'],
      ['Senior Debt', { f: `Transaction!B3*Transaction!B5*0.6` }, { f: 'B4/B8' }],
      ['Subordinated Debt', { f: `Transaction!B3*Transaction!B5*0.4` }, { f: 'B5/B8' }],
      ['Sponsor Equity', { f: `Transaction!B3*(1-Transaction!B5)` }, { f: 'B6/B8' }],
      [],
      ['TOTAL SOURCES', { f: 'SUM(B4:B6)' }, { f: 'SUM(C4:C6)' }],
      [],
      ['USES', 'Amount', '%'],
      ['Purchase Price', dealData.purchasePrice, { f: 'B11/B15' }],
      ['Transaction Fees', { f: 'B11*0.02' }, { f: 'B12/B15' }],
      ['Financing Fees', { f: 'B4*0.03+B5*0.05' }, { f: 'B13/B15' }],
      [],
      ['TOTAL USES', { f: 'SUM(B11:B13)' }, { f: 'SUM(C11:C13)' }]
    ];

    return XLSX.utils.aoa_to_sheet(data);
  }

  private createProFormaSheet(dealData: any): XLSX.WorkSheet {
    const years = Array.from({length: dealData.holdPeriod}, (_, i) => 2024 + i);
    
    const data = [
      ['PRO FORMA PROJECTIONS', ...years],
      [],
      ['Revenue', ...years.map(() => ({ f: 'B3*1.1' }))],
      ['EBITDA', ...years.map(() => ({ f: 'B4*0.25' }))],
      ['Interest Expense', ...years.map(() => ({ f: `SourcesUses!B4*Transaction!B6` }))],
      ['EBT', ...years.map((_, i) => ({ f: `${String.fromCharCode(66 + i)}5-${String.fromCharCode(66 + i)}6` }))],
      ['Taxes', ...years.map((_, i) => ({ f: `${String.fromCharCode(66 + i)}7*0.25` }))],
      ['Net Income', ...years.map((_, i) => ({ f: `${String.fromCharCode(66 + i)}7-${String.fromCharCode(66 + i)}8` }))],
      [],
      ['Debt Paydown', ...years.map(() => ({ f: 'B5*0.5' }))],
      ['Ending Debt Balance', ...years.map((_, i) => ({ 
        f: i === 0 ? 'SourcesUses!B4-B11' : `${String.fromCharCode(65 + i)}12-${String.fromCharCode(66 + i)}11` 
      }))]
    ];

    return XLSX.utils.aoa_to_sheet(data);
  }

  private createReturnsSheet(dealData: any): XLSX.WorkSheet {
    const exitYear = String.fromCharCode(66 + dealData.holdPeriod - 1);
    
    const data = [
      ['RETURNS ANALYSIS'],
      [],
      ['Exit EBITDA', { f: `ProForma!${exitYear}5` }],
      ['Exit Multiple', dealData.exitMultiple],
      ['Exit Enterprise Value', { f: 'B3*B4' }],
      ['Less: Exit Debt', { f: `ProForma!${exitYear}12` }],
      ['Exit Equity Value', { f: 'B5-B6' }],
      [],
      ['Initial Equity Investment', { f: 'SourcesUses!B6' }],
      ['Exit Equity Value', { f: 'B7' }],
      ['Total Return Multiple', { f: 'B10/B9' }],
      ['IRR', { f: `POWER(B11,1/${dealData.holdPeriod})-1` }]
    ];

    return XLSX.utils.aoa_to_sheet(data);
  }

  // Comps Analysis Helper Methods
  private createCompanyDataSheet(companies: any[]): XLSX.WorkSheet {
    const headers = ['Company', 'Ticker', 'Market Cap', 'Revenue', 'EBITDA', 'Net Income', 'Book Value'];
    const data = [
      ['COMPARABLE COMPANIES'],
      [],
      headers,
      ...companies.map(company => [
        company.name,
        company.ticker,
        company.marketCap,
        company.revenue,
        company.ebitda,
        company.netIncome,
        company.bookValue
      ])
    ];

    return XLSX.utils.aoa_to_sheet(data);
  }

  private createMultiplesSheet(companies: any[]): XLSX.WorkSheet {
    const headers = ['Company', 'P/E', 'EV/Revenue', 'EV/EBITDA', 'P/B'];
    const startRow = 4; // After headers
    
    const data = [
      ['TRADING MULTIPLES'],
      [],
      headers,
      ...companies.map((company, index) => {
        const rowNum = startRow + index;
        return [
          company.name,
          { f: `CompanyData!C${rowNum}/CompanyData!F${rowNum}` }, // P/E
          { f: `CompanyData!C${rowNum}/CompanyData!D${rowNum}` }, // EV/Revenue  
          { f: `CompanyData!C${rowNum}/CompanyData!E${rowNum}` }, // EV/EBITDA
          { f: `CompanyData!C${rowNum}/CompanyData!G${rowNum}` }  // P/B
        ];
      }),
      [],
      ['STATISTICS'],
      ['Mean', { f: 'AVERAGE(B4:B' + (3 + companies.length) + ')' }, 
              { f: 'AVERAGE(C4:C' + (3 + companies.length) + ')' },
              { f: 'AVERAGE(D4:D' + (3 + companies.length) + ')' },
              { f: 'AVERAGE(E4:E' + (3 + companies.length) + ')' }],
      ['Median', { f: 'MEDIAN(B4:B' + (3 + companies.length) + ')' },
                { f: 'MEDIAN(C4:C' + (3 + companies.length) + ')' },
                { f: 'MEDIAN(D4:D' + (3 + companies.length) + ')' },
                { f: 'MEDIAN(E4:E' + (3 + companies.length) + ')' }]
    ];

    return XLSX.utils.aoa_to_sheet(data);
  }

  private createStatsSheet(companies: any[]): XLSX.WorkSheet {
    const data = [
      ['STATISTICAL ANALYSIS'],
      [],
      ['Metric', 'Min', 'Max', 'Mean', 'Median', 'Std Dev'],
      ['Market Cap', 
        { f: 'MIN(CompanyData!C4:C' + (3 + companies.length) + ')' },
        { f: 'MAX(CompanyData!C4:C' + (3 + companies.length) + ')' },
        { f: 'AVERAGE(CompanyData!C4:C' + (3 + companies.length) + ')' },
        { f: 'MEDIAN(CompanyData!C4:C' + (3 + companies.length) + ')' },
        { f: 'STDEV(CompanyData!C4:C' + (3 + companies.length) + ')' }
      ],
      ['Revenue',
        { f: 'MIN(CompanyData!D4:D' + (3 + companies.length) + ')' },
        { f: 'MAX(CompanyData!D4:D' + (3 + companies.length) + ')' },
        { f: 'AVERAGE(CompanyData!D4:D' + (3 + companies.length) + ')' },
        { f: 'MEDIAN(CompanyData!D4:D' + (3 + companies.length) + ')' },
        { f: 'STDEV(CompanyData!D4:D' + (3 + companies.length) + ')' }
      ]
    ];

    return XLSX.utils.aoa_to_sheet(data);
  }

  // Utility Methods
  private async addCalculations(
    workbook: XLSX.WorkBook,
    calcSet: CalculationSet,
    data: Record<string, any>
  ): Promise<number> {
    let addedCalculations = 0;
    
    for (const formula of calcSet.formulas) {
      // Find the appropriate sheet
      for (const sheetName of workbook.SheetNames) {
        const worksheet = workbook.Sheets[sheetName];
        if (worksheet[formula.cell]) {
          worksheet[formula.cell] = { f: formula.formula };
          addedCalculations++;
          break;
        }
      }
    }
    
    return addedCalculations;
  }

  private async addChart(
    workbook: XLSX.WorkBook,
    chartDef: ChartDefinition,
    data: Record<string, any>
  ): Promise<void> {
    // Chart creation would require a more advanced library
    // For now, we'll add a placeholder sheet with chart specifications
    const chartSheet = XLSX.utils.aoa_to_sheet([
      [`Chart: ${chartDef.name}`],
      [`Type: ${chartDef.type}`],
      [`Data Range: ${chartDef.dataRange}`],
      ['Chart data prepared for visualization']
    ]);
    
    workbook.Sheets[`Chart_${chartDef.name}`] = chartSheet;
    workbook.SheetNames.push(`Chart_${chartDef.name}`);
  }

  private applyGlobalFormatting(workbook: XLSX.WorkBook, template: ExcelTemplate): void {
    // Global formatting would require ExcelJS or similar for advanced styling
    // For now, we'll set basic properties
    for (const sheetName of workbook.SheetNames) {
      const worksheet = workbook.Sheets[sheetName];
      if (worksheet['!cols']) {
        worksheet['!cols'] = [
          { width: 20 },
          { width: 15 },
          { width: 15 },
          { width: 15 },
          { width: 15 }
        ];
      }
    }
  }

  private selectBestTemplate(modelType: string): string {
    const templateMap = {
      'dcf': 'dcf_model',
      'lbo': 'lbo_model', 
      'comps': 'comps_analysis',
      'portfolio': 'portfolio_analysis',
      'merger_model': 'merger_model'
    };
    
    return templateMap[modelType as keyof typeof templateMap] || 'dcf_model';
  }

  private generateDataStructure(modelStructure: any): Record<string, any> {
    return {
      assumptions: modelStructure.assumptions.reduce((acc: any, assumption: any) => {
        acc[assumption.name] = assumption.defaultValue || 0.1;
        return acc;
      }, {}),
      historical: [],
      keyInputs: modelStructure.keyInputs,
      outputMetrics: modelStructure.outputMetrics
    };
  }

  // Initialize default templates
  private initializeTemplates(): void {
    // DCF Template
    this.templates.set('dcf_model', {
      id: 'dcf_model',
      name: 'DCF Valuation Model',
      type: 'dcf',
      description: 'Comprehensive Discounted Cash Flow model',
      sheets: [
        {
          name: 'Assumptions',
          sections: [
            {
              title: 'Key Assumptions',
              startCell: 'A1',
              type: 'assumptions'
            }
          ],
          formatting: {
            headerStyle: { font: { bold: true, size: 14 } },
            dataStyle: { numberFormat: '#,##0.00' },
            calculationStyle: { font: { bold: true } },
            colors: { primary: '#1e40af', secondary: '#64748b', accent: '#059669' }
          }
        }
      ],
      calculations: [],
      charts: []
    });

    // Add other templates...
  }
}

// Factory function
export function createExcelGenerationEngine(): ExcelGenerationEngine {
  return new ExcelGenerationEngine();
}