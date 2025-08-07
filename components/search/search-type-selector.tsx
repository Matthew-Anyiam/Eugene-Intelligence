"use client";

import * as React from "react";
import * as Select from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SearchType } from "@/types";

const searchTypes: { value: SearchType; label: string; description: string }[] = [
  { value: "web", label: "Web Search", description: "Search the entire web" },
  { value: "academic", label: "Academic", description: "Scholarly articles and papers" },
  { value: "social", label: "Social Media", description: "Reddit, Twitter, and more" },
  { value: "news", label: "News", description: "Latest news articles" },
  { value: "images", label: "Images", description: "Visual content search" },
  { value: "videos", label: "Videos", description: "Video content search" },
  { value: "code", label: "Code", description: "Code execution and analysis" },
  { value: "weather", label: "Weather", description: "Weather and forecasts" },
  { value: "maps", label: "Maps", description: "Location-based search" },
  { value: "financial", label: "Financial", description: "Market data and analysis" },
];

interface SearchTypeSelectorProps {
  value: SearchType;
  onValueChange: (value: SearchType) => void;
  disabled?: boolean;
}

export function SearchTypeSelector({ value, onValueChange, disabled }: SearchTypeSelectorProps) {
  const selectedType = searchTypes.find(type => type.value === value);

  return (
    <Select.Root value={value} onValueChange={onValueChange} disabled={disabled}>
      <Select.Trigger
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          "sm:w-48"
        )}
      >
        <Select.Value placeholder="Select search type">
          {selectedType?.label}
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
            {searchTypes.map((type) => (
              <Select.Item
                key={type.value}
                value={type.value}
                className={cn(
                  "relative flex w-full cursor-default select-none items-center rounded-sm py-2 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                )}
              >
                <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                  <Select.ItemIndicator>
                    <Check className="h-4 w-4" />
                  </Select.ItemIndicator>
                </span>
                
                <div className="flex flex-col">
                  <Select.ItemText>{type.label}</Select.ItemText>
                  <span className="text-xs text-muted-foreground">
                    {type.description}
                  </span>
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