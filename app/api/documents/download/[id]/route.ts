import { NextRequest, NextResponse } from 'next/server';
import { createDocumentGenerationEngine } from '@/lib/documents/document-generation-engine';

const documentEngine = createDocumentGenerationEngine();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const documentId = params.id;
    const document = documentEngine.getGeneratedDocument(documentId);

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Set appropriate headers for file download
    const headers = new Headers();
    headers.set('Content-Type', getContentType(document.type));
    headers.set('Content-Disposition', `attachment; filename="${document.filename}"`);
    headers.set('Content-Length', document.buffer.length.toString());
    headers.set('Cache-Control', 'private, max-age=0');

    return new NextResponse(document.buffer, {
      status: 200,
      headers
    });

  } catch (error) {
    console.error('Document download error:', error);
    return NextResponse.json(
      { error: 'Download failed' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const documentId = params.id;
    const deleted = await documentEngine.deleteDocument(documentId);

    if (!deleted) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Document deletion error:', error);
    return NextResponse.json(
      { error: 'Deletion failed' },
      { status: 500 }
    );
  }
}

function getContentType(documentType: string): string {
  const contentTypes = {
    'excel': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'powerpoint': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'pdf': 'application/pdf',
    'word': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  };

  return contentTypes[documentType as keyof typeof contentTypes] || 'application/octet-stream';
}