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
      let tagBuffer = ''; // Buffer for accumulating potential tag fragments
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
            let content = trimmedLine.substring(6); // Remove "data: " prefix
            
            // Try to parse as JSON string if it looks like one
            if (content.startsWith('"') && content.endsWith('"')) {
              try {
                content = JSON.parse(content);
              } catch {
                // If parsing fails, use content as-is
              }
            }
            
            // Add content to tag buffer to detect tags that may be split across chunks
            tagBuffer += content;
            console.log('[LLM API] tagBuffer:', tagBuffer);
            
            // Check for complete tag markers in the accumulated buffer
            let tagDetected = false;
            
            if (tagBuffer.includes('<think>')) {
              inThinkTag = true;
              inToolingTag = false;
              inResponseTag = false;
              // Remove the tag from buffer and keep the rest
              tagBuffer = tagBuffer.substring(tagBuffer.indexOf('<think>') + 7);
              console.log('[LLM API] Entered <think> tag, remaining buffer:', tagBuffer);
              tagDetected = true;
            }
            
            if (tagBuffer.includes('</think>')) {
              inThinkTag = false;
              tagBuffer = tagBuffer.substring(tagBuffer.indexOf('</think>') + 8);
              console.log('[LLM API] Exited </think> tag, remaining buffer:', tagBuffer);
              tagDetected = true;
            }
            
            // NEW: Handle inline tooling format: (tool: "...")
            const toolPattern = /\(tool:\s*"([^"]+)"\)/;
            const toolMatch = tagBuffer.match(toolPattern);
            if (toolMatch) {
              const toolData = toolMatch[1];
              console.log('[LLM API] Found inline tool call:', toolData);
              
              // Try to parse as JSON to extract the action
              try {
                const toolJson = JSON.parse(toolData.replace(/\\/g, ''));
                if (toolJson.action) {
                  currentTooling += (currentTooling ? '\n' : '') + toolJson.action;
                  console.log('[LLM API] Extracted tool action:', toolJson.action);
                }
              } catch (e) {
                // If not valid JSON, just append the raw tool data
                currentTooling += (currentTooling ? '\n' : '') + toolData;
                console.log('[LLM API] Could not parse tool JSON, using raw:', toolData);
              }
              
              // Remove the tool call from buffer
              tagBuffer = tagBuffer.replace(toolPattern, '');
              tagDetected = true;
            }
            
            // Legacy: Handle old <tooling> tags (kept for backward compatibility)
            if (tagBuffer.includes('<tooling>')) {
              inToolingTag = true;
              inThinkTag = false;
              inResponseTag = false;
              tagBuffer = tagBuffer.substring(tagBuffer.indexOf('<tooling>') + 9);
              console.log('[LLM API] Entered <tooling> tag, remaining buffer:', tagBuffer);
              tagDetected = true;
            }
            
            if (tagBuffer.includes('</tooling>')) {
              inToolingTag = false;
              tagBuffer = tagBuffer.substring(tagBuffer.indexOf('</tooling>') + 10);
              console.log('[LLM API] Exited </tooling> tag, remaining buffer:', tagBuffer);
              tagDetected = true;
            }
            
            if (tagBuffer.includes('<response>')) {
              inResponseTag = true;
              inThinkTag = false;
              inToolingTag = false;
              tagBuffer = tagBuffer.substring(tagBuffer.indexOf('<response>') + 10);
              console.log('[LLM API] Entered <response> tag, remaining buffer:', tagBuffer);
              tagDetected = true;
            }
            
            if (tagBuffer.includes('</response>')) {
              inResponseTag = false;
              tagBuffer = tagBuffer.substring(tagBuffer.indexOf('</response>') + 11);
              console.log('[LLM API] Exited </response> tag, remaining buffer:', tagBuffer);
              tagDetected = true;
            }

            // Process any remaining content in tagBuffer
            if (tagBuffer.length > 0 && (inThinkTag || inToolingTag || inResponseTag)) {
              // Only accumulate if we're inside a tag
              if (inThinkTag) {
                currentThinking += tagBuffer;
                console.log('[LLM API] Accumulated thinking:', currentThinking.length, 'chars');
              } else if (inToolingTag) {
                currentTooling += tagBuffer;
                console.log('[LLM API] Accumulated tooling:', currentTooling.length, 'chars');
              } else if (inResponseTag) {
                currentResponse += tagBuffer;
                console.log('[LLM API] Accumulated response:', currentResponse.length, 'chars', 'content:', tagBuffer.substring(0, 50));
              }
              
              // Clear the tag buffer after processing
              tagBuffer = '';
            } else if (!inThinkTag && !inToolingTag && !inResponseTag && tagBuffer.length > 0 && tagBuffer.length < 15) {
              // Keep partial tags in buffer (tags are usually < 15 chars)
              console.log('[LLM API] Keeping potential partial tag in buffer:', tagBuffer);
            } else if (tagBuffer.length > 0) {
              // Clear buffer if we have content but we're not in any tag and it's too long to be a partial tag
              console.log('[LLM API] Clearing buffer (not in tag):', tagBuffer);
              tagBuffer = '';
            }

            // Send chunk update
            const chunk: LLMResponseChunk = {
              thinkingText: currentThinking,
              toolingText: currentTooling,
              responseText: currentResponse,
              metadata,
              isComplete: false
            };
            console.log('[LLM API] Calling onChunk with:', {
              thinkingLength: currentThinking.length,
              toolingLength: currentTooling.length,
              responseLength: currentResponse.length
            });
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
