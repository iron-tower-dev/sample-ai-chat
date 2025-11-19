import { Injectable, signal } from '@angular/core';
import { environment } from '../../environments/environment';

export interface LLMRequest {
  user_query: string;
  username: string;
  session_id: string;
}

export interface LLMResponseChunk {
  thinkingText: string;
  toolingText: string;
  responseText: string;
  metadata?: Record<string, any>;
  isComplete: boolean;
}

export interface CitedSource {
  source_id: string;
  text: string;
  metadata: Record<string, unknown>;
}

export interface RetrievedSource {
  source_id: string;
  text: string;
  metadata: RetrievedSourceMetadata;
}

export interface RetrievedSourceMetadata {
  AccessionNumber?: string;  // For NRCAdams documents
  DocumentTitle?: string;     // For eDoc documents
  chunk_id: string;
  text: string;
  bounding_boxes?: string;
  AuthorName?: string;
  milvus_id?: number;
  distance: number;
  rank?: number;
  [key: string]: any;         // Allow additional metadata fields
}

export interface StreamingResponse {
  chunks: LLMResponseChunk[];
  currentChunk: LLMResponseChunk | null;
  isComplete: boolean;
  error?: Error;
  messageId?: string; // From x-message-id header
}

@Injectable({
  providedIn: 'root'
})
export class LlmApiService {
  private apiUrl = signal(`${environment.apiUrl}/chat`);

  /**
   * Send a message to the LLM API and stream the SSE response.
   * Returns a signal-based streaming response that updates as chunks arrive.
   */
  async sendMessage(
    request: LLMRequest,
    onChunk: (response: StreamingResponse) => void,
    abortSignal?: AbortSignal
  ): Promise<void> {
    const chunks: LLMResponseChunk[] = [];
    let error: Error | undefined;
    let messageId: string | undefined;

    try {
      // Build query parameters
      const params = new URLSearchParams({
        user_query: request.user_query,
        username: request.username,
        session_id: request.session_id
      });

      const response = await fetch(`${this.apiUrl()}?${params.toString()}`, {
        method: 'GET',
        signal: abortSignal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Extract message ID from header
      messageId = response.headers.get('x-message-id') || undefined;

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body is not readable');
      }

      const decoder = new TextDecoder();
      let buffer = '';
      let currentThinking = '';
      let currentTooling = '';
      let currentResponse = '';
      let inThinkTag = false;
      let inToolingTag = false;
      let inResponseTag = false;
      let metadataReceived = false;
      let metadata: Record<string, any> | undefined;

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          // Final chunk
          const finalChunk: LLMResponseChunk = {
            thinkingText: currentThinking,
            toolingText: currentTooling,
            responseText: currentResponse,
            metadata,
            isComplete: true
          };
          chunks.push(finalChunk);
          onChunk({
            chunks: [...chunks],
            currentChunk: finalChunk,
            isComplete: true,
            error,
            messageId
          });
          break;
        }

        // Decode the chunk and add to buffer
        buffer += decoder.decode(value, { stream: true });

        // Split by newlines to process complete SSE lines
        const lines = buffer.split('\n');
        
        // Keep the last incomplete line in the buffer
        buffer = lines.pop() || '';

        // Process each complete line
        for (const line of lines) {
          const trimmedLine = line.trim();
          
          // Skip empty lines
          if (!trimmedLine) continue;

          // SSE format: "data: <content>"
          if (trimmedLine.startsWith('data: ')) {
            const content = trimmedLine.substring(6); // Remove "data: " prefix
            
            // Check for tag markers
            if (content.includes('<think>')) {
              inThinkTag = true;
              inToolingTag = false;
              inResponseTag = false;
              continue;
            } else if (content.includes('</think>')) {
              inThinkTag = false;
              continue;
            } else if (content.includes('<tooling>')) {
              inToolingTag = true;
              inThinkTag = false;
              inResponseTag = false;
              continue;
            } else if (content.includes('</tooling>')) {
              inToolingTag = false;
              continue;
            } else if (content.includes('<response>')) {
              inResponseTag = true;
              inThinkTag = false;
              inToolingTag = false;
              continue;
            } else if (content.includes('</response>')) {
              inResponseTag = false;
              continue;
            }

            // Accumulate content based on current tag
            if (inThinkTag) {
              currentThinking += content;
            } else if (inToolingTag) {
              currentTooling += content;
            } else if (inResponseTag) {
              currentResponse += content;
            }

            // Send chunk update
            const chunk: LLMResponseChunk = {
              thinkingText: currentThinking,
              toolingText: currentTooling,
              responseText: currentResponse,
              metadata,
              isComplete: false
            };
            chunks.push(chunk);
            onChunk({
              chunks: [...chunks],
              currentChunk: chunk,
              isComplete: false,
              error,
              messageId
            });
          } else if (!metadataReceived && trimmedLine.includes('metadata:')) {
            // Parse metadata (comes after the SSE stream)
            try {
              const metadataStr = trimmedLine.substring(trimmedLine.indexOf('{'));
              metadata = JSON.parse(metadataStr);
              metadataReceived = true;
            } catch (parseError) {
              console.error('Failed to parse metadata:', parseError);
            }
          }
        }
      }
    } catch (err) {
      error = err instanceof Error ? err : new Error(String(err));
      onChunk({
        chunks: [...chunks],
        currentChunk: chunks[chunks.length - 1] || null,
        isComplete: true,
        error,
        messageId
      });
    }
  }

  /**
   * Set the API URL for the LLM service.
   * Useful for configuring different environments.
   */
  setApiUrl(url: string): void {
    this.apiUrl.set(url);
  }

  /**
   * Get the current API URL.
   */
  getApiUrl(): string {
    return this.apiUrl();
  }

  /**
   * Submit feedback for a message.
   * @param feedback The feedback request with message_id, feedback_sign, and optional feedback_text
   */
  async submitFeedback(feedback: FeedbackRequest): Promise<void> {
    try {
      const response = await fetch(`${environment.apiUrl}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(feedback),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      console.log('Feedback submitted successfully');
    } catch (error) {
      console.error('Error submitting feedback:', error);
      throw error;
    }
  }
}

export interface FeedbackRequest {
  message_id: string;
  feedback_sign: 'positive' | 'negative' | 'neutral';
  feedback_text?: string;
}
