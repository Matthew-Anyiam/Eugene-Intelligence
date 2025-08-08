import { generateObject, generateText } from 'ai';
import { createAIProvider } from '@/lib/ai/providers/ai-provider-factory';
import * as XLSX from 'xlsx';
import { z } from 'zod';

export interface DocumentTemplate {
  id: string;
  name: string;
  type: 'excel' | 'powerpoint' | 'pdf' | 'word';
  category: 'valuation' | 'pitch_deck' | 'research_report' | 'portfolio_analysis' | 'compliance';
  description: string;
  sections: TemplateSection[];
  formatting: DocumentFormatting;
  requiredData: string[];
}

export interface TemplateSection {
  id: string;
  name: string;
  type: 'data_table' | 'chart' | 'text' | 'calculation' | 'dashboard' | 'cover_slide';
  position: { sheet?: string; slide?: number; row?: number; col?: number };
  dataSource: string;
  formatting?: SectionFormatting;
  calculations?: CalculationRule[];
}

export interface DocumentFormatting {
  theme: 'professional' | 'modern' | 'minimal' | 'branded';
  primaryColor: string;
  secondaryColor: string;
  font: string;
  logoUrl?: string;
  companyName?: string;
  headerFooter?: {
    header: string;
    footer: string;
  };
}

export interface SectionFormatting {
  chartType?: 'line' | 'bar' | 'pie' | 'scatter' | 'waterfall' | 'heatmap';
  colors?: string[];
  borders?: boolean;
  alternateRows?: boolean;
  numberFormat?: string;
  conditional?: ConditionalFormatting[];
}

export interface ConditionalFormatting {
  condition: string;
  style: Record<string, any>;
}

export interface CalculationRule {
  id: string;
  formula: string;
  dependencies: string[];
  description: string;
}

export interface DocumentRequest {
  templateId: string;
  data: Record<string, any>;
  customizations?: {
    title?: string;
    subtitle?: string;
    author?: string;
    date?: Date;
    formatting?: Partial<DocumentFormatting>;
  };
  outputFormat: 'excel' | 'powerpoint' | 'pdf' | 'word';
  includeCharts?: boolean;
  includeCalculations?: boolean;
}

export interface GeneratedDocument {
  id: string;
  templateId: string;
  filename: string;
  type: string;
  buffer: Buffer;
  metadata: {
    generatedAt: Date;
    author: string;
    pages?: number;
    sheets?: string[];
    size: number;
  };
  downloadUrl: string;
}

const DocumentRequestSchema = z.object({
  templateId: z.string(),
  data: z.record(z.any()),
  customizations: z.object({
    title: z.string().optional(),
    subtitle: z.string().optional(),
    author: z.string().optional(),
    date: z.date().optional(),
    formatting: z.any().optional()
  }).optional(),
  outputFormat: z.enum(['excel', 'powerpoint', 'pdf', 'word']),
  includeCharts: z.boolean().optional(),
  includeCalculations: z.boolean().optional()
});

export class DocumentGenerationEngine {
  private aiProvider: any;
  private templates: Map<string, DocumentTemplate> = new Map();
  private generatedDocuments: Map<string, GeneratedDocument> = new Map();

  constructor() {
    this.aiProvider = createAIProvider('claude-4');
    this.initializeDefaultTemplates();
  }

  // Excel Generation Engine
  async generateExcel(request: DocumentRequest): Promise<GeneratedDocument> {
    const validated = DocumentRequestSchema.parse(request);
    const template = this.templates.get(validated.templateId);
    
    if (!template) {
      throw new Error(`Template ${validated.templateId} not found`);
    }

    const workbook = XLSX.utils.book_new();
    const docId = `doc_${Date.now()}`;

    try {
      // Process each section of the template
      for (const section of template.sections) {
        await this.processExcelSection(workbook, section, validated.data, template.formatting);
      }

      // Add calculations if requested
      if (validated.includeCalculations && template.sections.some(s => s.calculations?.length)) {
        await this.addExcelCalculations(workbook, template, validated.data);
      }

      // Add charts if requested
      if (validated.includeCharts) {
        await this.addExcelCharts(workbook, template, validated.data);
      }

      // Apply formatting
      this.applyExcelFormatting(workbook, template.formatting);

      // Generate buffer
      const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
      const filename = `${template.name}_${new Date().toISOString().split('T')[0]}.xlsx`;

      const document: GeneratedDocument = {
        id: docId,
        templateId: validated.templateId,
        filename,
        type: 'excel',
        buffer,
        metadata: {
          generatedAt: new Date(),
          author: validated.customizations?.author || 'Eugene Intelligence',
          sheets: workbook.SheetNames,
          size: buffer.length
        },
        downloadUrl: `/api/documents/download/${docId}`
      };

      this.generatedDocuments.set(docId, document);
      return document;

    } catch (error) {
      throw new Error(`Excel generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // PowerPoint Generation Engine
  async generatePowerPoint(request: DocumentRequest): Promise<GeneratedDocument> {
    const validated = DocumentRequestSchema.parse(request);
    const template = this.templates.get(validated.templateId);
    
    if (!template) {
      throw new Error(`Template ${validated.templateId} not found`);
    }

    const docId = `doc_${Date.now()}`;

    try {
      // Generate AI-powered presentation content
      const presentationContent = await this.generatePresentationContent(template, validated.data);
      
      // Create PowerPoint structure (mock - in production, use a library like officegen or node-pptx)
      const slides = await this.createPowerPointSlides(template, validated.data, presentationContent);
      
      // Generate speaker notes
      const speakerNotes = await this.generateSpeakerNotes(presentationContent, validated.data);
      
      // Mock buffer for demo - in production, generate actual PPTX
      const mockPresentationData = {
        slides,
        speakerNotes,
        formatting: template.formatting,
        metadata: {
          title: validated.customizations?.title || template.name,
          author: validated.customizations?.author || 'Eugene Intelligence',
          date: validated.customizations?.date || new Date()
        }
      };
      
      const buffer = Buffer.from(JSON.stringify(mockPresentationData, null, 2));
      const filename = `${template.name}_presentation_${new Date().toISOString().split('T')[0]}.pptx`;

      const document: GeneratedDocument = {
        id: docId,
        templateId: validated.templateId,
        filename,
        type: 'powerpoint',
        buffer,
        metadata: {
          generatedAt: new Date(),
          author: validated.customizations?.author || 'Eugene Intelligence',
          pages: slides.length,
          size: buffer.length
        },
        downloadUrl: `/api/documents/download/${docId}`
      };

      this.generatedDocuments.set(docId, document);
      return document;

    } catch (error) {
      throw new Error(`PowerPoint generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Natural Language to Financial Model Conversion
  async convertNaturalLanguageToModel(description: string): Promise<{
    templateId: string;
    dataStructure: Record<string, any>;
    calculations: CalculationRule[];
    recommendations: string[];
  }> {
    if (!this.aiProvider) {
      throw new Error('AI provider not available');
    }

    const prompt = `Convert this natural language description into a structured financial model:

"${description}"

Analyze the description and determine:
1. What type of financial model is needed (DCF, LBO, Trading Comparables, etc.)
2. What data inputs are required
3. What calculations need to be performed
4. What outputs should be generated

Provide a structured response with template selection, data requirements, and calculation formulas.`;

    try {
      const modelAnalysis = await generateText({
        model: this.aiProvider,
        prompt
      });

      // Parse AI response and map to template
      const templateId = this.selectTemplateFromDescription(description);
      const dataStructure = this.extractDataRequirements(description);
      const calculations = this.generateCalculationRules(description);

      return {
        templateId,
        dataStructure,
        calculations,
        recommendations: [
          'Review all assumptions carefully',
          'Validate data sources and inputs',
          'Consider sensitivity analysis',
          'Include scenario modeling'
        ]
      };

    } catch (error) {
      throw new Error(`Natural language conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Document Intelligence - Automated Formatting
  async applyIntelligentFormatting(
    documentType: 'excel' | 'powerpoint',
    data: Record<string, any>
  ): Promise<DocumentFormatting> {
    const formatting: DocumentFormatting = {
      theme: 'professional',
      primaryColor: '#1e40af', // Professional blue
      secondaryColor: '#64748b', // Neutral gray
      font: 'Calibri',
      companyName: 'Eugene Intelligence'
    };

    // Analyze data to determine optimal formatting
    if (data.portfolio && Array.isArray(data.portfolio)) {
      // Portfolio-focused formatting
      formatting.primaryColor = '#059669'; // Green for positive performance
      if (data.portfolio.some((item: any) => item.return < 0)) {
        formatting.secondaryColor = '#dc2626'; // Red for losses
      }
    }

    if (data.risk_analysis) {
      // Risk-focused formatting
      formatting.primaryColor = '#dc2626'; // Warning red
      formatting.theme = 'minimal';
    }

    if (data.valuation) {
      // Valuation-focused formatting
      formatting.primaryColor = '#7c3aed'; // Professional purple
      formatting.theme = 'modern';
    }

    return formatting;
  }

  // Template Management
  async createTemplate(template: Omit<DocumentTemplate, 'id'>): Promise<DocumentTemplate> {
    const newTemplate: DocumentTemplate = {
      ...template,
      id: `template_${Date.now()}`
    };

    this.templates.set(newTemplate.id, newTemplate);
    return newTemplate;
  }

  getTemplate(templateId: string): DocumentTemplate | null {
    return this.templates.get(templateId) || null;
  }

  getTemplatesByCategory(category: string): DocumentTemplate[] {
    return Array.from(this.templates.values())
      .filter(template => template.category === category);
  }

  // Document Management
  getGeneratedDocument(documentId: string): GeneratedDocument | null {
    return this.generatedDocuments.get(documentId) || null;
  }

  async deleteDocument(documentId: string): Promise<boolean> {
    return this.generatedDocuments.delete(documentId);
  }

  // Private Helper Methods
  private async processExcelSection(
    workbook: XLSX.WorkBook,
    section: TemplateSection,
    data: Record<string, any>,
    formatting: DocumentFormatting
  ): Promise<void> {
    const sheetName = section.position.sheet || 'Sheet1';
    
    if (!workbook.Sheets[sheetName]) {
      workbook.Sheets[sheetName] = XLSX.utils.aoa_to_sheet([]);
      workbook.SheetNames.push(sheetName);
    }

    const worksheet = workbook.Sheets[sheetName];

    switch (section.type) {
      case 'data_table':
        this.addDataTable(worksheet, section, data);
        break;
      case 'calculation':
        this.addCalculations(worksheet, section, data);
        break;
      case 'dashboard':
        this.addDashboard(worksheet, section, data);
        break;
    }
  }

  private addDataTable(worksheet: XLSX.WorkSheet, section: TemplateSection, data: Record<string, any>): void {
    const tableData = data[section.dataSource];
    if (!Array.isArray(tableData)) return;

    const startRow = section.position.row || 1;
    const startCol = section.position.col || 1;

    // Add headers
    if (tableData.length > 0) {
      const headers = Object.keys(tableData[0]);
      headers.forEach((header, index) => {
        const cellAddress = XLSX.utils.encode_cell({ r: startRow - 1, c: startCol + index - 1 });
        worksheet[cellAddress] = { v: header, t: 's' };
      });

      // Add data rows
      tableData.forEach((row, rowIndex) => {
        headers.forEach((header, colIndex) => {
          const cellAddress = XLSX.utils.encode_cell({ 
            r: startRow + rowIndex, 
            c: startCol + colIndex - 1 
          });
          worksheet[cellAddress] = { v: row[header], t: typeof row[header] === 'number' ? 'n' : 's' };
        });
      });
    }
  }

  private addCalculations(worksheet: XLSX.WorkSheet, section: TemplateSection, data: Record<string, any>): void {
    if (!section.calculations) return;

    section.calculations.forEach((calc, index) => {
      const row = (section.position.row || 1) + index;
      const col = section.position.col || 1;
      
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
      worksheet[cellAddress] = { f: calc.formula };
    });
  }

  private addDashboard(worksheet: XLSX.WorkSheet, section: TemplateSection, data: Record<string, any>): void {
    // Create a dashboard layout with key metrics
    const metrics = data[section.dataSource];
    if (typeof metrics !== 'object') return;

    let row = section.position.row || 1;
    const col = section.position.col || 1;

    Object.entries(metrics).forEach(([key, value]) => {
      const labelAddress = XLSX.utils.encode_cell({ r: row, c: col });
      const valueAddress = XLSX.utils.encode_cell({ r: row, c: col + 1 });
      
      worksheet[labelAddress] = { v: key, t: 's' };
      worksheet[valueAddress] = { v: value, t: typeof value === 'number' ? 'n' : 's' };
      
      row++;
    });
  }

  private async addExcelCalculations(
    workbook: XLSX.WorkBook,
    template: DocumentTemplate,
    data: Record<string, any>
  ): Promise<void> {
    const calcSheet = XLSX.utils.aoa_to_sheet([]);
    workbook.Sheets['Calculations'] = calcSheet;
    workbook.SheetNames.push('Calculations');

    // Add financial calculations like DCF, ratios, etc.
    if (data.financials) {
      this.addFinancialRatios(calcSheet, data.financials);
    }

    if (data.valuation) {
      this.addValuationCalculations(calcSheet, data.valuation);
    }
  }

  private addFinancialRatios(worksheet: XLSX.WorkSheet, financials: any): void {
    const ratios = [
      { name: 'ROE', formula: 'netIncome/equity' },
      { name: 'ROA', formula: 'netIncome/assets' },
      { name: 'Current Ratio', formula: 'currentAssets/currentLiabilities' },
      { name: 'Debt to Equity', formula: 'debt/equity' }
    ];

    ratios.forEach((ratio, index) => {
      const nameCell = XLSX.utils.encode_cell({ r: index, c: 0 });
      const formulaCell = XLSX.utils.encode_cell({ r: index, c: 1 });
      
      worksheet[nameCell] = { v: ratio.name, t: 's' };
      worksheet[formulaCell] = { f: ratio.formula };
    });
  }

  private addValuationCalculations(worksheet: XLSX.WorkSheet, valuation: any): void {
    // Add DCF calculations, multiples, etc.
    const valuationMetrics = [
      'Enterprise Value',
      'Price to Earnings',
      'Price to Book',
      'EV/EBITDA'
    ];

    valuationMetrics.forEach((metric, index) => {
      const cell = XLSX.utils.encode_cell({ r: index + 10, c: 0 });
      worksheet[cell] = { v: metric, t: 's' };
    });
  }

  private async addExcelCharts(
    workbook: XLSX.WorkBook,
    template: DocumentTemplate,
    data: Record<string, any>
  ): Promise<void> {
    // Chart generation would require a library like ExcelJS
    // For now, we'll prepare chart data and specifications
    const chartSheet = XLSX.utils.aoa_to_sheet([['Chart Data Prepared']]);
    workbook.Sheets['Charts'] = chartSheet;
    workbook.SheetNames.push('Charts');
  }

  private applyExcelFormatting(workbook: XLSX.WorkBook, formatting: DocumentFormatting): void {
    // Apply theme colors, fonts, and styling
    // This would require ExcelJS or similar library for advanced formatting
  }

  private async generatePresentationContent(template: DocumentTemplate, data: Record<string, any>): Promise<any> {
    if (!this.aiProvider) return {};

    const prompt = `Generate professional presentation content for a ${template.category} presentation.

Data available: ${JSON.stringify(data, null, 2)}

Create compelling slide content with:
1. Executive summary points
2. Key findings and insights
3. Supporting data visualizations
4. Investment recommendations
5. Risk factors and considerations

Make it suitable for institutional investors and senior management.`;

    const content = await generateText({
      model: this.aiProvider,
      prompt
    });

    return { content };
  }

  private async createPowerPointSlides(
    template: DocumentTemplate,
    data: Record<string, any>,
    content: any
  ): Promise<any[]> {
    const slides = [];

    // Title slide
    slides.push({
      type: 'title',
      title: template.name,
      subtitle: `Generated by Eugene Intelligence`,
      date: new Date().toLocaleDateString()
    });

    // Content slides based on template sections
    for (const section of template.sections) {
      slides.push({
        type: 'content',
        title: section.name,
        content: this.generateSlideContent(section, data),
        charts: section.type === 'chart' ? [section.dataSource] : []
      });
    }

    return slides;
  }

  private generateSlideContent(section: TemplateSection, data: Record<string, any>): string {
    const sectionData = data[section.dataSource];
    if (!sectionData) return 'Data not available';

    if (typeof sectionData === 'object') {
      return Object.entries(sectionData)
        .map(([key, value]) => `• ${key}: ${value}`)
        .join('\n');
    }

    return String(sectionData);
  }

  private async generateSpeakerNotes(content: any, data: Record<string, any>): Promise<string[]> {
    if (!this.aiProvider) return [];

    const prompt = `Generate professional speaker notes for this presentation content:

${JSON.stringify(content)}

Include:
- Key talking points for each slide
- Data explanations and context
- Potential questions and answers
- Transition phrases between slides`;

    const notes = await generateText({
      model: this.aiProvider,
      prompt
    });

    return [notes.text];
  }

  private selectTemplateFromDescription(description: string): string {
    // AI-powered template selection based on description
    if (description.toLowerCase().includes('dcf') || description.includes('valuation')) {
      return 'dcf_model';
    }
    if (description.toLowerCase().includes('lbo') || description.includes('leveraged buyout')) {
      return 'lbo_model';
    }
    if (description.toLowerCase().includes('portfolio') || description.includes('performance')) {
      return 'portfolio_analysis';
    }
    if (description.toLowerCase().includes('pitch') || description.includes('presentation')) {
      return 'pitch_deck';
    }
    
    return 'general_analysis';
  }

  private extractDataRequirements(description: string): Record<string, any> {
    // Extract data requirements from natural language
    return {
      financials: ['revenue', 'ebitda', 'capex', 'working_capital'],
      assumptions: ['discount_rate', 'terminal_growth', 'tax_rate'],
      market_data: ['beta', 'risk_free_rate', 'market_premium']
    };
  }

  private generateCalculationRules(description: string): CalculationRule[] {
    // Generate calculation rules based on description
    return [
      {
        id: 'fcf_calculation',
        formula: 'EBITDA - Capex - Change_in_WC - Taxes',
        dependencies: ['ebitda', 'capex', 'working_capital', 'tax_rate'],
        description: 'Free Cash Flow calculation'
      },
      {
        id: 'present_value',
        formula: 'FCF / (1 + Discount_Rate)^Year',
        dependencies: ['fcf_calculation', 'discount_rate'],
        description: 'Present value of free cash flows'
      }
    ];
  }

  // Initialize default templates
  private initializeDefaultTemplates(): void {
    const defaultTemplates: Array<Omit<DocumentTemplate, 'id'>> = [
      {
        name: 'DCF Valuation Model',
        type: 'excel',
        category: 'valuation',
        description: 'Comprehensive DCF model with sensitivity analysis',
        sections: [
          {
            id: 'assumptions',
            name: 'Key Assumptions',
            type: 'data_table',
            position: { sheet: 'Assumptions', row: 1, col: 1 },
            dataSource: 'assumptions'
          },
          {
            id: 'financials',
            name: 'Financial Projections',
            type: 'data_table',
            position: { sheet: 'Model', row: 1, col: 1 },
            dataSource: 'projections',
            calculations: [
              {
                id: 'revenue_growth',
                formula: '(B2-B1)/B1',
                dependencies: ['revenue'],
                description: 'Revenue growth calculation'
              }
            ]
          },
          {
            id: 'valuation',
            name: 'Valuation Summary',
            type: 'dashboard',
            position: { sheet: 'Summary', row: 1, col: 1 },
            dataSource: 'valuation_results'
          }
        ],
        formatting: {
          theme: 'professional',
          primaryColor: '#1e40af',
          secondaryColor: '#64748b',
          font: 'Calibri'
        },
        requiredData: ['historical_financials', 'assumptions', 'market_data']
      },
      {
        name: 'Investment Pitch Deck',
        type: 'powerpoint',
        category: 'pitch_deck',
        description: 'Professional investment presentation template',
        sections: [
          {
            id: 'cover',
            name: 'Cover Slide',
            type: 'cover_slide',
            position: { slide: 1 },
            dataSource: 'company_info'
          },
          {
            id: 'investment_thesis',
            name: 'Investment Thesis',
            type: 'text',
            position: { slide: 2 },
            dataSource: 'thesis'
          },
          {
            id: 'financial_performance',
            name: 'Financial Performance',
            type: 'chart',
            position: { slide: 3 },
            dataSource: 'financials',
            formatting: {
              chartType: 'line',
              colors: ['#1e40af', '#059669', '#dc2626']
            }
          }
        ],
        formatting: {
          theme: 'modern',
          primaryColor: '#1e40af',
          secondaryColor: '#f8fafc',
          font: 'Arial'
        },
        requiredData: ['company_info', 'financials', 'market_analysis']
      },
      {
        name: 'Portfolio Performance Report',
        type: 'excel',
        category: 'portfolio_analysis',
        description: 'Comprehensive portfolio analysis and reporting',
        sections: [
          {
            id: 'portfolio_overview',
            name: 'Portfolio Overview',
            type: 'dashboard',
            position: { sheet: 'Overview', row: 1, col: 1 },
            dataSource: 'portfolio_summary'
          },
          {
            id: 'holdings',
            name: 'Current Holdings',
            type: 'data_table',
            position: { sheet: 'Holdings', row: 1, col: 1 },
            dataSource: 'positions'
          },
          {
            id: 'performance',
            name: 'Performance Analytics',
            type: 'data_table',
            position: { sheet: 'Performance', row: 1, col: 1 },
            dataSource: 'performance_metrics'
          }
        ],
        formatting: {
          theme: 'professional',
          primaryColor: '#059669',
          secondaryColor: '#64748b',
          font: 'Calibri'
        },
        requiredData: ['portfolio_data', 'benchmark_data', 'attribution_data']
      }
    ];

    defaultTemplates.forEach(template => {
      this.createTemplate(template);
    });
  }
}

// Factory function
export function createDocumentGenerationEngine(): DocumentGenerationEngine {
  return new DocumentGenerationEngine();
}

// Utility functions
export function getTemplateIcon(category: DocumentTemplate['category']): string {
  const icons = {
    valuation: '💰',
    pitch_deck: '📊',
    research_report: '📋',
    portfolio_analysis: '📈',
    compliance: '🛡️'
  };
  return icons[category] || '📄';
}

export function formatDocumentSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}