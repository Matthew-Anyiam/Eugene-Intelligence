import { NextRequest, NextResponse } from 'next/server';
import { createDocumentGenerationEngine } from '@/lib/documents/document-generation-engine';

const documentEngine = createDocumentGenerationEngine();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'templates':
        const category = searchParams.get('category');
        const templates = category 
          ? documentEngine.getTemplatesByCategory(category)
          : Array.from((documentEngine as any).templates.values());
        return NextResponse.json(templates);

      case 'template':
        const templateId = searchParams.get('templateId');
        if (!templateId) {
          return NextResponse.json({ error: 'Template ID required' }, { status: 400 });
        }
        
        const template = documentEngine.getTemplate(templateId);
        if (!template) {
          return NextResponse.json({ error: 'Template not found' }, { status: 404 });
        }
        
        return NextResponse.json(template);

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Document generation API error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case 'generate_excel':
        const excelDoc = await documentEngine.generateExcel({
          templateId: data.templateId,
          data: data.data,
          customizations: data.customizations,
          outputFormat: 'excel',
          includeCharts: data.includeCharts || false,
          includeCalculations: data.includeCalculations || true
        });
        
        return NextResponse.json({
          documentId: excelDoc.id,
          filename: excelDoc.filename,
          downloadUrl: excelDoc.downloadUrl,
          metadata: excelDoc.metadata
        });

      case 'generate_powerpoint':
        const pptDoc = await documentEngine.generatePowerPoint({
          templateId: data.templateId,
          data: data.data,
          customizations: data.customizations,
          outputFormat: 'powerpoint',
          includeCharts: data.includeCharts || true
        });
        
        return NextResponse.json({
          documentId: pptDoc.id,
          filename: pptDoc.filename,
          downloadUrl: pptDoc.downloadUrl,
          metadata: pptDoc.metadata
        });

      case 'natural_language_to_model':
        if (!data.description) {
          return NextResponse.json({ error: 'Description required' }, { status: 400 });
        }
        
        const modelStructure = await documentEngine.convertNaturalLanguageToModel(data.description);
        return NextResponse.json(modelStructure);

      case 'intelligent_formatting':
        if (!data.documentType || !data.data) {
          return NextResponse.json({ error: 'Document type and data required' }, { status: 400 });
        }
        
        const formatting = await documentEngine.applyIntelligentFormatting(
          data.documentType,
          data.data
        );
        
        return NextResponse.json(formatting);

      case 'create_template':
        const newTemplate = await documentEngine.createTemplate({
          name: data.name,
          type: data.type,
          category: data.category,
          description: data.description,
          sections: data.sections || [],
          formatting: data.formatting || {
            theme: 'professional',
            primaryColor: '#1e40af',
            secondaryColor: '#64748b',
            font: 'Calibri'
          },
          requiredData: data.requiredData || []
        });
        
        return NextResponse.json(newTemplate);

      case 'generate_comprehensive_analysis':
        // Generate a complete financial analysis package
        const analysisPackage = await generateComprehensiveAnalysis(data);
        return NextResponse.json(analysisPackage);

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Document generation POST error:', error);
    return NextResponse.json(
      { error: 'Generation failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

async function generateComprehensiveAnalysis(data: any): Promise<any> {
  const documents = [];

  // Generate Excel analysis
  if (data.includeExcel !== false) {
    const excelDoc = await documentEngine.generateExcel({
      templateId: data.templateId || 'portfolio_analysis',
      data: data.analysisData,
      customizations: {
        title: `${data.symbol || 'Portfolio'} Analysis`,
        author: data.author || 'Eugene Intelligence',
        date: new Date()
      },
      outputFormat: 'excel',
      includeCharts: true,
      includeCalculations: true
    });
    
    documents.push({
      type: 'excel',
      document: excelDoc
    });
  }

  // Generate PowerPoint presentation
  if (data.includePresentation !== false) {
    const pptDoc = await documentEngine.generatePowerPoint({
      templateId: 'pitch_deck',
      data: data.analysisData,
      customizations: {
        title: `${data.symbol || 'Investment'} Presentation`,
        author: data.author || 'Eugene Intelligence',
        date: new Date()
      },
      outputFormat: 'powerpoint',
      includeCharts: true
    });
    
    documents.push({
      type: 'powerpoint',
      document: pptDoc
    });
  }

  return {
    packageId: `package_${Date.now()}`,
    documents,
    summary: {
      totalDocuments: documents.length,
      generatedAt: new Date(),
      analysisScope: data.analysisData ? Object.keys(data.analysisData) : []
    }
  };
}