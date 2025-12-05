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

    private removeCeWrapper(math: string): string {
        // Remove \ce{...} wrapper and convert chemistry notation to standard LaTeX
        // Chemistry notation: _{Z}^{A}X means element X with subscript Z and superscript A
        // Standard LaTeX: X_{Z}^{A} - subscripts/superscripts come AFTER the base element
        let result = math;
        let changed = true;
        
        while (changed) {
            changed = false;
            const ceIndex = result.indexOf('\\ce{');
            if (ceIndex !== -1) {
                // Find the matching closing brace
                let depth = 0;
                let start = ceIndex + 4; // After '\ce{'
                let end = -1;
                
                for (let i = start; i < result.length; i++) {
                    if (result[i] === '{') {
                        depth++;
                    } else if (result[i] === '}') {
                        if (depth === 0) {
                            end = i;
                            break;
                        }
                        depth--;
                    }
                }
                
                if (end !== -1) {
                    let content = result.substring(start, end);
                    
                    // Convert chemistry notation: _{Z}^{A}X -> X_{Z}^{A}
                    // This regex captures subscript, superscript, and the following element
                    content = content.replace(/(_{[^}]+})(\^{[^}]+})?\s*(\w+)/g, (match, sub, sup, element) => {
                        // Reorder: element comes first, then subscript, then superscript
                        return element + sub + (sup || '');
                    });
                    
                    // Also handle cases with just subscript: _{Z}X -> X_{Z}
                    content = content.replace(/_{([^}]+)}\s*(\w+)(?![_{^])/g, (match, sub, element) => {
                        return element + '_{' + sub + '}';
                    });
                    
                    // And cases with just superscript: ^{A}X -> X^{A}
                    content = content.replace(/\^{([^}]+)}\s*(\w+)(?![_{^])/g, (match, sup, element) => {
                        return element + '^{' + sup + '}';
                    });
                    
                    result = result.substring(0, ceIndex) + content + result.substring(end + 1);
                    changed = true;
                }
            }
        }
        
        return result;
    }

    private processInlineMath(text: string): string {
        // First handle display math with $$ delimiters (must be done before inline $)
        let processed = text.replace(/\$\$([\s\S]+?)\$\$/g, (match, mathContent) => {
            try {
                // Remove \ce{} wrapper if present (mhchem not available)
                const cleanMath = this.removeCeWrapper(mathContent.trim());
                
                const html = katex.renderToString(cleanMath, {
                    displayMode: true,
                    throwOnError: false,
                    strict: false
                });
                return `<div class="math-block" style="margin: 1em 0; text-align: center;">${html}</div>`;
            } catch (error) {
                console.warn('Display LaTeX rendering error:', error, 'for content:', mathContent);
                return `<pre class="math-error">$$${this.escapeHtml(mathContent)}$$</pre>`;
            }
        });

        // Then handle inline math with single $ delimiters
        processed = processed.replace(/\$([^$\n]+)\$/g, (match, mathContent) => {
            try {
                // Remove \ce{} wrapper if present (mhchem not available)
                const cleanMath = this.removeCeWrapper(mathContent.trim());
                
                const html = katex.renderToString(cleanMath, {
                    displayMode: false,
                    throwOnError: false,
                    strict: false
                });

                return `<span class="math-inline">${html}</span>`;
            } catch (error) {
                console.warn('Inline LaTeX rendering error:', error, 'for content:', mathContent);
                return `<code class="math-error">$${this.escapeHtml(mathContent)}$</code>`;
            }
        });
        
        return processed;
    }

    private processCodeBlock(code: string, language: string | undefined): string {
        if (language === 'latex' || language === 'math') {
            try {
                // Remove \ce{} wrapper if present (mhchem not available)
                const cleanCode = this.removeCeWrapper(code.trim());
                
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

            // Sanitize the HTML with DOMPurify to preserve KaTeX positioning and inline citations
            const sanitizedResult = DOMPurify.sanitize(result as string, {
                ADD_ATTR: ['style', 'xmlns', 'aria-hidden', 'title', 'data-doc', 'data-preview'], // Allow inline styles, MathML attributes, and citation data attributes
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
        return /\$\$[\s\S]+?\$\$/.test(content) || /\$[^$]+\$/.test(content) || /```(?:latex|math)/.test(content);
    }

    // Utility method to check if content contains markdown
    containsMarkdown(content: string): boolean {
        return /[*_`#\[\]()]/.test(content) || /```/.test(content);
    }
}