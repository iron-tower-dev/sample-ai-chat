import { Injectable, inject, resource, ResourceRef, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface LLMRequest {
  user_id: string;
  ad_group: string;
  prompt: string;
  thread_id: string;
  filtered_dataset: string;
}

export interface LLMResponseChunk {
  response: string;
  message_id: string;
  tool_call_reasoning: string;
  generated_reasoning: string;
  generated_response: string;
  cited_sources: CitedSource[];
  retrieved_sources: RetrievedSource[];
  guardrail_reasoning: string;
  guardrail_response: string;
  sources: string;
  topic: string;
  summary: string;
  retrieval_time: number;
  generation_time: number;
  guardrail_time: number;
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
  AccessionNumber: string;
  chunk_id: string;
  text: string;
  bounding_boxes: string;
  AuthorName: string;
  milvus_id: number;
  distance: number;
  rank: number;
}

export interface StreamingResponse {
  chunks: LLMResponseChunk[];
  isComplete: boolean;
  error?: Error;
}

@Injectable({
  providedIn: 'root'
})
export class LlmApiService {
  private http = inject(HttpClient);
  
  private apiUrl = signal(`${environment.apiUrl}/chat`);

  /**
   * Send a message to the LLM API and stream the NDJSON response
   * using Angular's resource API.
   */
  sendMessage(request: LLMRequest): ResourceRef<StreamingResponse | undefined> {
    return resource({
      loader: async ({ abortSignal }) => {
        const chunks: LLMResponseChunk[] = [];
        let isComplete = false;
        let error: Error | undefined;

        try {
          const response = await fetch(this.apiUrl(), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(request),
            signal: abortSignal,
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const reader = response.body?.getReader();
          if (!reader) {
            throw new Error('Response body is not readable');
          }

          const decoder = new TextDecoder();
          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
              isComplete = true;
              break;
            }

            // Decode the chunk and add to buffer
            buffer += decoder.decode(value, { stream: true });

            // Split by newlines to process complete NDJSON lines
            const lines = buffer.split('\n');
            
            // Keep the last incomplete line in the buffer
            buffer = lines.pop() || '';

            // Process each complete line
            for (const line of lines) {
              const trimmedLine = line.trim();
              if (trimmedLine) {
                try {
                  const chunk = JSON.parse(trimmedLine) as LLMResponseChunk;
                  chunks.push(chunk);
                } catch (parseError) {
                  console.error('Failed to parse NDJSON line:', parseError, 'Line:', trimmedLine);
                }
              }
            }
          }

          // Process any remaining data in buffer
          if (buffer.trim()) {
            try {
              const chunk = JSON.parse(buffer) as LLMResponseChunk;
              chunks.push(chunk);
            } catch (parseError) {
              console.error('Failed to parse final NDJSON line:', parseError);
            }
          }
        } catch (err) {
          error = err instanceof Error ? err : new Error(String(err));
          isComplete = true;
        }

        return { chunks, isComplete, error };
      },
    });
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
}
