import { NextResponse } from "next/server";
import { AIResponseGenerator } from "@/lib/ai/ai-response-generator";
import { AI_MODELS, isModelAvailable } from "@/lib/ai/config";

export async function GET() {
  try {
    const generator = new AIResponseGenerator();
    const modelStatus = await generator.getModelStatus();

    const modelsInfo = Object.entries(AI_MODELS).map(([key, config]) => ({
      id: key,
      name: config.name,
      provider: config.provider,
      description: config.description,
      contextWindow: config.contextWindow,
      maxTokens: config.maxTokens,
      streaming: config.streaming,
      multimodal: config.multimodal,
      available: isModelAvailable(key as any),
      status: modelStatus[key as keyof typeof modelStatus],
    }));

    const availableModels = modelsInfo.filter(model => model.available);
    const unavailableModels = modelsInfo.filter(model => !model.available);

    return NextResponse.json({
      success: true,
      models: modelsInfo,
      summary: {
        total: modelsInfo.length,
        available: availableModels.length,
        unavailable: unavailableModels.length,
        availableModels: availableModels.map(m => ({ id: m.id, name: m.name })),
        unavailableModels: unavailableModels.map(m => ({ 
          id: m.id, 
          name: m.name,
          error: m.status.error 
        })),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("AI models API error:", error);
    
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to get AI model status",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}