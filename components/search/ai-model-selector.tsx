"use client";

import * as React from "react";
import * as Select from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp, Zap, Brain, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AIModel } from "@/types";

const aiModels: { 
  value: AIModel; 
  label: string; 
  provider: string;
  icon: React.ReactNode;
  description: string;
}[] = [
  { 
    value: "claude-4", 
    label: "Claude 4", 
    provider: "Anthropic",
    icon: <Brain className="h-4 w-4" />,
    description: "Most advanced reasoning"
  },
  { 
    value: "gpt-4o", 
    label: "GPT-4o", 
    provider: "OpenAI",
    icon: <Sparkles className="h-4 w-4" />,
    description: "Multimodal capabilities"
  },
  { 
    value: "grok-3", 
    label: "Grok 3", 
    provider: "xAI",
    icon: <Zap className="h-4 w-4" />,
    description: "Real-time information"
  },
  { 
    value: "gemini-2.5", 
    label: "Gemini 2.5", 
    provider: "Google",
    icon: <Sparkles className="h-4 w-4" />,
    description: "Long context window"
  },
  { 
    value: "qwen-2.5", 
    label: "Qwen 2.5", 
    provider: "Groq",
    icon: <Zap className="h-4 w-4" />,
    description: "Ultra-fast inference"
  },
  { 
    value: "llama-4", 
    label: "Llama 4", 
    provider: "Groq",
    icon: <Zap className="h-4 w-4" />,
    description: "Open-source power"
  },
];

interface AIModelSelectorProps {
  value: AIModel;
  onValueChange: (value: AIModel) => void;
  disabled?: boolean;
}

export function AIModelSelector({ value, onValueChange, disabled }: AIModelSelectorProps) {
  const selectedModel = aiModels.find(model => model.value === value);

  return (
    <Select.Root value={value} onValueChange={onValueChange} disabled={disabled}>
      <Select.Trigger
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          "sm:w-48"
        )}
      >
        <Select.Value placeholder="Select AI model">
          <div className="flex items-center space-x-2">
            {selectedModel?.icon}
            <span>{selectedModel?.label}</span>
          </div>
        </Select.Value>
        <Select.Icon asChild>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Select.Icon>
      </Select.Trigger>
      
      <Select.Portal>
        <Select.Content
          className={cn(
            "relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md",
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
          )}
          position="popper"
        >
          <Select.ScrollUpButton className="flex cursor-default items-center justify-center py-1">
            <ChevronUp className="h-4 w-4" />
          </Select.ScrollUpButton>
          
          <Select.Viewport className="p-1">
            {aiModels.map((model) => (
              <Select.Item
                key={model.value}
                value={model.value}
                className={cn(
                  "relative flex w-full cursor-default select-none items-center rounded-sm py-2 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                )}
              >
                <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                  <Select.ItemIndicator>
                    <Check className="h-4 w-4" />
                  </Select.ItemIndicator>
                </span>
                
                <div className="flex items-center space-x-3 min-w-0">
                  {model.icon}
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center space-x-2">
                      <Select.ItemText className="font-medium">
                        {model.label}
                      </Select.ItemText>
                      <span className="text-xs text-muted-foreground">
                        {model.provider}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {model.description}
                    </span>
                  </div>
                </div>
              </Select.Item>
            ))}
          </Select.Viewport>
          
          <Select.ScrollDownButton className="flex cursor-default items-center justify-center py-1">
            <ChevronDown className="h-4 w-4" />
          </Select.ScrollDownButton>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}