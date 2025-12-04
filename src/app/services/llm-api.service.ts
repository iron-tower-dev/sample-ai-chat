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
  followupQuestions?: { topic: string; followups: string[] };
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
      let followupQuestionsReceived = false;
      let metadata: Record<string, any> | undefined;
      let followupQuestions: { topic: string; followups: string[] } | undefined;

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          // Final chunk
          const finalChunk: LLMResponseChunk = {
            thinkingText: currentThinking,
            toolingText: currentTooling,
            responseText: currentResponse,
            metadata,
            followupQuestions,
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
          
          console.log('[LLM API] Processing line:', trimmedLine.substring(0, 50));
          
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
            // Match (tool: "...") or (tool: {"action": "..."})
            const toolPattern = /\(tool:\s*(["\{][^)]+)\)/;
            const toolMatch = tagBuffer.match(toolPattern);
            if (toolMatch) {
              let toolData = toolMatch[1];
              console.log('[LLM API] Found inline tool call:', toolData);
              
              // Remove surrounding quotes if present
              if (toolData.startsWith('"') && toolData.endsWith('"')) {
                toolData = toolData.slice(1, -1);
              }
              
              // Try to parse as JSON to extract the action
              try {
                // Handle escaped JSON string
                let jsonStr = toolData;
                // If it looks like escaped JSON, try to unescape it
                if (jsonStr.includes('\\"')) {
                  jsonStr = jsonStr.replace(/\\"/g, '"');
                }
                const toolJson = JSON.parse(jsonStr);
                if (toolJson.action) {
                  currentTooling = toolJson.action; // Replace, not append
                  console.log('[LLM API] Extracted tool action:', toolJson.action);
                } else {
                  // If no action field, use the whole JSON as string
                  currentTooling = JSON.stringify(toolJson);
                }
              } catch (e) {
                // If not valid JSON, just use the raw tool data
                currentTooling = toolData;
                console.log('[LLM API] Could not parse tool JSON, using raw:', toolData, 'Error:', e);
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
              followupQuestions,
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
          } else if (trimmedLine.startsWith('tool:')) {
            // Parse tool event: tool: {"action": "..."}
            console.log('[LLM API] FOUND TOOL EVENT, line:', trimmedLine);
            try {
              const toolStr = trimmedLine.substring(5).trim(); // Remove 'tool:' prefix
              console.log('[LLM API] Tool string to parse:', toolStr);
              
              // Handle double-encoded JSON (same as metadata and followup questions)
              let toolJson;
              try {
                // First parse attempt - might be a JSON string
                const firstParse = JSON.parse(toolStr);
                
                // If the result is a string, parse it again (double-encoded JSON)
                if (typeof firstParse === 'string') {
                  toolJson = JSON.parse(firstParse);
                  console.log('[LLM API] Detected double-encoded tool JSON, parsed twice');
                } else {
                  toolJson = firstParse;
                }
              } catch (initialError) {
                // If first parse fails, log and skip
                throw initialError;
              }
              
              console.log('[LLM API] Parsed tool JSON:', toolJson);
              console.log('[LLM API] toolJson.action value:', toolJson.action);
              console.log('[LLM API] toolJson.action type:', typeof toolJson.action);
              console.log('[LLM API] toolJson.action truthy?:', !!toolJson.action);
              console.log('[LLM API] toolJson keys:', Object.keys(toolJson));
              if (toolJson.action) {
                currentTooling = toolJson.action;
                console.log('[LLM API] Set currentTooling to:', currentTooling);
                console.log('[LLM API] Received tool event:', toolJson.action);
                
                // Send chunk update with tooling
                const chunk: LLMResponseChunk = {
                  thinkingText: currentThinking,
                  toolingText: currentTooling,
                  responseText: currentResponse,
                  metadata,
                  followupQuestions,
                  isComplete: false
                };
                console.log('[LLM API] Sending chunk after tool event:', {
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
              }
            } catch (parseError) {
              console.error('[LLM API] Failed to parse tool event:', parseError);
              console.error('[LLM API] Problematic tool line:', trimmedLine);
            }
          } else if (!metadataReceived && trimmedLine.includes('metadata:')) {
            // Parse metadata (comes after the SSE stream)
            try {
              // Extract content after 'metadata:'
              const colonIndex = trimmedLine.indexOf(':');
              if (colonIndex === -1) {
                console.warn('[LLM API] No colon found in metadata line:', trimmedLine);
                continue;
              }
              
              let metadataStr = trimmedLine.substring(colonIndex + 1).trim();
              
              // Handle double-encoded JSON: if the backend returns a JSON string containing JSON,
              // we need to parse twice (same as followup questions)
              let parsedData;
              try {
                // First parse attempt - might be a JSON string
                const firstParse = JSON.parse(metadataStr);
                
                // If the result is a string, parse it again (double-encoded JSON)
                if (typeof firstParse === 'string') {
                  parsedData = JSON.parse(firstParse);
                  console.log('[LLM API] Detected double-encoded metadata JSON, parsed twice');
                } else {
                  parsedData = firstParse;
                }
              } catch (initialError) {
                // If first parse fails, log and skip
                throw initialError;
              }
              
              // Validate the structure is an object (metadata should be a key-value map)
              if (parsedData && typeof parsedData === 'object' && !Array.isArray(parsedData)) {
                // Normalize malformed UUID keys: "{UUID" -> "{UUID}" or "UUID" -> "{UUID}"
                const normalizedMetadata: Record<string, any> = {};
                for (const [key, value] of Object.entries(parsedData)) {
                  let normalizedKey = key;
                  
                  // Check if key looks like a UUID (with or without braces)
                  // UUID format: 8-4-4-4-12 hex digits
                  const uuidPattern = /^"?\{?([0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12})\}?"?$/i;
                  const match = key.match(uuidPattern);
                  
                  if (match) {
                    // Normalize to format: {UUID}
                    normalizedKey = `{${match[1]}}`;
                    console.log('[LLM API] Normalized metadata key:', key, '->', normalizedKey);
                  }
                  
                  normalizedMetadata[normalizedKey] = value;
                }
                
                metadata = normalizedMetadata;
                metadataReceived = true;
                console.log('[LLM API] Received metadata with', Object.keys(metadata).length, 'documents');
                console.log('[LLM API] First 3 metadata keys:', Object.keys(metadata).slice(0, 3));
              } else {
                console.warn('[LLM API] Metadata data does not match expected format (should be object):', parsedData);
              }
            } catch (parseError) {
              console.error('Failed to parse metadata:', parseError);
              console.error('[LLM API] Problematic line:', trimmedLine);
            }
          } else if (!followupQuestionsReceived && trimmedLine.includes('followup_questions:')) {
            // Parse followup questions
            try {
              // Extract content after the colon
              const colonIndex = trimmedLine.indexOf(':');
              if (colonIndex === -1) {
                console.warn('[LLM API] No colon found in followup questions line:', trimmedLine);
                continue;
              }
              
              let followupStr = trimmedLine.substring(colonIndex + 1).trim();
              
              // Handle double-encoded JSON: if the backend returns a JSON string containing JSON,
              // we need to parse twice
              let parsedData;
              try {
                // First parse attempt - might be a JSON string
                const firstParse = JSON.parse(followupStr);
                
                // If the result is a string, parse it again (double-encoded JSON)
                if (typeof firstParse === 'string') {
                  parsedData = JSON.parse(firstParse);
                  console.log('[LLM API] Detected double-encoded JSON, parsed twice');
                } else {
                  parsedData = firstParse;
                }
              } catch (initialError) {
                // If first parse fails, log and skip
                throw initialError;
              }
              
              // Validate the structure matches expected format: { topic: string, followups: string[] }
              if (parsedData && typeof parsedData === 'object' && 
                  'topic' in parsedData && 'followups' in parsedData &&
                  Array.isArray(parsedData.followups)) {
                followupQuestions = parsedData;
                followupQuestionsReceived = true;
                console.log('[LLM API] Received followup questions:', followupQuestions);
              } else {
                console.warn('[LLM API] Followup questions data does not match expected format:', parsedData);
              }
            } catch (parseError) {
              console.error('Failed to parse followup questions:', parseError);
              console.error('[LLM API] Problematic line:', trimmedLine);
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
  feedback_text: string;
}
