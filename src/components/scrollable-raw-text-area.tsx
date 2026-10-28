'use client';

import React, { useState } from 'react';
import {
  Copy,
  Check,
  FileText,
  Download,
  Code2,
  Edit3,
  AlignLeft,
} from 'lucide-react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ScrollableRawTextAreaProps {
  rawText: string | null;
  isProcessing: boolean;
  onTextChange?: (text: string) => void;
  onDownload?: (format: 'txt' | 'docx') => void;
  className?: string;
}

export function ScrollableRawTextArea({
  rawText,
  isProcessing,
  onTextChange,
  onDownload,
  className,
}: ScrollableRawTextAreaProps) {
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'raw' | 'edit'>('raw');
  const { toast } = useToast();

  const handleCopy = async () => {
    if (!rawText) return;
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(rawText);
        setCopied(true);
        toast({
          title: 'Copied to Clipboard',
          description: 'Raw document text has been copied.',
        });
        setTimeout(() => setCopied(false), 2000);
      } else {
        throw new Error('Clipboard API is unavailable in this environment.');
      }
    } catch (err) {
      console.error('Failed to copy raw text to clipboard:', err);
      toast({
        variant: 'destructive',
        title: 'Copy Failed',
        description: 'Could not copy text to clipboard.',
      });
    }
  };

  const lineCount = rawText ? rawText.split('\n').length : 0;
  const wordCount = rawText ? rawText.trim().split(/\s+/).filter(Boolean).length : 0;
  const charCount = rawText ? rawText.length : 0;

  return (
    <div className={cn('flex flex-col space-y-4', className)}>
      {/* Controls & Metrics Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-border">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs font-normal">
            {lineCount} {lineCount === 1 ? 'line' : 'lines'}
          </Badge>
          <Badge variant="outline" className="text-xs font-normal">
            {wordCount} {wordCount === 1 ? 'word' : 'words'}
          </Badge>
          <Badge variant="outline" className="text-xs font-normal">
            {charCount} {charCount === 1 ? 'character' : 'characters'}
          </Badge>
        </div>

        {rawText !== null && !isProcessing && (
          <div className="flex items-center gap-1.5">
            <div className="flex items-center rounded-md border border-border p-0.5 bg-muted/40">
              <Button
                type="button"
                variant={viewMode === 'raw' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('raw')}
                className="h-7 px-2.5 text-xs font-medium gap-1"
                title="View raw extracted text with preserved whitespace"
              >
                <Code2 className="h-3.5 w-3.5" />
                Raw
              </Button>
              <Button
                type="button"
                variant={viewMode === 'edit' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('edit')}
                className="h-7 px-2.5 text-xs font-medium gap-1"
                title="Edit text content"
              >
                <Edit3 className="h-3.5 w-3.5" />
                Edit
              </Button>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="h-7 px-2.5 text-xs gap-1 font-medium"
              title="Copy raw text to clipboard"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-green-600" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  Copy
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Main Content / Scrollable Area */}
      {isProcessing ? (
        <div className="p-6 space-y-3 bg-muted/20 rounded-lg border border-border">
          <div className="flex items-center gap-2 mb-4 text-xs font-medium text-muted-foreground">
            <span className="inline-block h-2 w-2 rounded-full bg-accent animate-ping" />
            AI extracting document text and preserving layout...
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-11/12" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      ) : rawText === null ? (
        <div className="h-[360px] flex flex-col items-center justify-center p-8 border-2 border-dashed border-border rounded-lg text-center bg-muted/10">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-3">
            <AlignLeft className="h-6 w-6" />
          </div>
          <p className="font-medium text-sm text-foreground">
            No document scanned yet
          </p>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs">
            Upload an image, capture with your camera, or supply a URL to extract and view the raw text.
          </p>
        </div>
      ) : (
        <div className="relative rounded-lg border border-border bg-card">
          {viewMode === 'raw' ? (
            <ScrollArea className="h-[380px] w-full p-4 font-mono text-xs sm:text-sm">
              <pre className="whitespace-pre-wrap font-mono text-foreground leading-relaxed select-text m-0">
                {rawText || (
                  <span className="text-muted-foreground italic font-sans">
                    [No readable text detected in this document]
                  </span>
                )}
              </pre>
              <ScrollBar orientation="vertical" />
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          ) : (
            <ScrollArea className="h-[380px] w-full p-2">
              <Textarea
                value={rawText}
                onChange={(e) => onTextChange?.(e.target.value)}
                placeholder="Extracted text..."
                className="w-full min-h-[360px] resize-none border-0 p-2 font-mono text-xs sm:text-sm leading-relaxed focus-visible:ring-0 shadow-none"
                aria-label="Editable Extracted Raw Text"
              />
              <ScrollBar orientation="vertical" />
            </ScrollArea>
          )}
        </div>
      )}

      {/* Download Action Footer */}
      <div className="pt-2 flex flex-wrap gap-2 justify-end">
        <Button
          type="button"
          onClick={() => onDownload?.('txt')}
          disabled={rawText === null || isProcessing}
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs font-medium"
        >
          <FileText className="h-4 w-4" />
          Download .txt
        </Button>
        <Button
          type="button"
          onClick={() => onDownload?.('docx')}
          disabled={rawText === null || isProcessing}
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs font-medium"
        >
          <Download className="h-4 w-4" />
          Download .docx
        </Button>
      </div>
    </div>
  );
}
