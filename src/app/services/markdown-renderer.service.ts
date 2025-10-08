import { Injectable } from '@angular/core';
import { marked } from 'marked';
import katex from 'katex';
import DOMPurify from 'dompurify';

@Injectable({
    providedIn: 'root'
})
export class MarkdownRendererService {
    constructor() {
        this.initializeMarked();
    }

    private initializeMarked(): void {
        // Configure marked options
        marked.setOptions({
            breaks: true,
            gfm: true
        });
    }

    private processInlineMath(text: string): string {
        // Handle inline math with $ delimiters
        return text.replace(/\$([^$]+)\$/g, (match, mathContent) => {
            try {
                // Clean up the math content
                const cleanMath = mathContent.trim();
                const html = katex.renderToString(cleanMath, {
                    displayMode: false,
                    throwOnError: false,
                    strict: false
                });

                // Modify the KaTeX HTML to fix superscript positioning and line height
                let modifiedHtml = html.replace(/style="top:-3\.063em/g, 'style="top:-0.3em');
                // Fix line height issues by reducing the height of strut elements moderately
                modifiedHtml = modifiedHtml.replace(/style="height:0\.8141em"/g, 'style="height:0.3em"');
                modifiedHtml = modifiedHtml.replace(/style="height:0\.6833em"/g, 'style="height:0.2em"');
                // Aggressively reduce the height of the pstrut elements that create the extra line
                modifiedHtml = modifiedHtml.replace(/style="height:2\.7em"/g, 'style="height:0.1em"');
                // Fix the quadratic equation block positioning
                modifiedHtml = modifiedHtml.replace(/style="height:1\.3845em;vertical-align:-0\.345em"/g, 'style="height:0.8em;vertical-align:0em"');

                // Add simple inline styles to fix positioning and prevent extra line spacing
                return `<span class="math-inline" style="vertical-align: baseline; display: inline-block; line-height: 1; margin: 0; padding: 0;">${modifiedHtml}</span>`;
            } catch (error) {
                console.warn('Inline LaTeX rendering error:', error, 'for content:', mathContent);
                return `<code class="math-error">$${this.escapeHtml(mathContent)}$</code>`;
            }
        });
    }

    private processCodeBlock(code: string, language: string | undefined): string {
        if (language === 'latex' || language === 'math') {
            try {
                // Clean up the code content
                const cleanCode = code.trim();
                const html = katex.renderToString(cleanCode, {
                    displayMode: true,
                    throwOnError: false,
                    strict: false
                });
                return `<div class="math-block">${html}</div>`;
            } catch (error) {
                console.warn('LaTeX rendering error:', error, 'for content:', code);
                return `<pre class="math-error"><code>${this.escapeHtml(code)}</code></pre>`;
            }
        }

        // Handle inline math with $ delimiters
        if (language === 'inline-math') {
            try {
                const cleanCode = code.trim();
                const html = katex.renderToString(cleanCode, {
                    displayMode: false,
                    throwOnError: false,
                    strict: false
                });
                return `<span class="math-inline">${html}</span>`;
            } catch (error) {
                console.warn('Inline LaTeX rendering error:', error, 'for content:', code);
                return `<code class="math-error">${this.escapeHtml(code)}</code>`;
            }
        }

        // Default code block rendering
        const escapedCode = this.escapeHtml(code);
        return `<pre class="code-block"><code class="language-${language || ''}">${escapedCode}</code></pre>`;
    }

    private escapeHtml(text: string): string {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    async renderMarkdown(markdown: string): Promise<string> {
        try {
            // First, protect code blocks from inline math processing
            const codeBlockPlaceholders: string[] = [];
            let processedMarkdown = markdown.replace(/```(\w+)?\n?([\s\S]*?)```/g, (match, language, code) => {
                const placeholder = `__CODE_BLOCK_${codeBlockPlaceholders.length}__`;
                codeBlockPlaceholders.push(match);
                return placeholder;
            });

            // Now process inline math (excluding code blocks)
            processedMarkdown = this.processInlineMath(processedMarkdown);

            // Restore and process code blocks
            processedMarkdown = processedMarkdown.replace(/__CODE_BLOCK_(\d+)__/g, (match, index) => {
                const originalCodeBlock = codeBlockPlaceholders[parseInt(index)];
                const codeBlockMatch = originalCodeBlock.match(/```(\w+)?\n?([\s\S]*?)```/);
                if (codeBlockMatch) {
                    const [, language, code] = codeBlockMatch;
                    const result = this.processCodeBlock(code, language);
                    return result;
                }
                return originalCodeBlock;
            });

            // Render the markdown
            const result = await marked(processedMarkdown);

            // Sanitize the HTML with DOMPurify to preserve KaTeX positioning
            const sanitizedResult = DOMPurify.sanitize(result as string, {
                ADD_ATTR: ['style', 'xmlns', 'aria-hidden', 'title'], // Allow inline styles and MathML attributes
                ADD_TAGS: [
                    'math', 'semantics', 'mrow', 'mi', 'mo', 'msup', 'mfrac', 'msqrt', 'annotation',
                    'munder', 'mover', 'msub', 'mtable', 'mtr', 'mtd', 'mtext', 'mspace', 'mstyle',
                    'menclose', 'merror', 'mfenced', 'mfrac', 'mglyph', 'mi', 'mlabeledtr', 'mlongdiv',
                    'mmultiscripts', 'mn', 'mo', 'mover', 'mpadded', 'mphantom', 'mroot', 'mrow',
                    'ms', 'mscarries', 'mscarry', 'msgroup', 'msline', 'mstack', 'mstyle', 'msub',
                    'msubsup', 'msup', 'mtable', 'mtd', 'mtext', 'mtr', 'munder', 'munderover',
                    'semantics', 'annotation', 'annotation-xml'
                ],
                KEEP_CONTENT: true,
                ALLOW_DATA_ATTR: true,
                ALLOW_UNKNOWN_PROTOCOLS: false
            });

            return sanitizedResult;
        } catch (error) {
            console.error('Markdown rendering error:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return `<p class="markdown-error">Error rendering markdown: ${this.escapeHtml(errorMessage)}</p>`;
        }
    }


    // Utility method to check if content contains math
    containsMath(content: string): boolean {
        return /\$[^$]+\$/.test(content) || /```(?:latex|math)/.test(content);
    }

    // Utility method to check if content contains markdown
    containsMarkdown(content: string): boolean {
        return /[*_`#\[\]()]/.test(content) || /```/.test(content);
    }
}