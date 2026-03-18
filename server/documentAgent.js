const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * Document Agent - Professional document generation using Google Gemini
 * Supports multiple document types, iterative refinement, and tool integration
 */
class DocumentAgent {
    constructor(apiKey) {
        if (!apiKey) {
            throw new Error('Gemini API key is required for Document Agent');
        }

        this.genAI = new GoogleGenerativeAI(apiKey);

        // Enhanced system instruction based on Docu-Claude methodology
        this.systemInstruction = `You are "Docu-Kaya," a highly specialized AI agent for professional document generation. Your primary function is to act as the first stage of a documentation pipeline, producing output that is immediately ready for conversion into final formats like PDF, EPUB, or professional web pages.

**Core Directives:**

1. **Focus on Structure and Format:** Your output MUST be meticulously structured using **GitHub-Flavored Markdown (GFM)**. This is non-negotiable.
2. **Professional Tone:** Maintain a formal, academic, and professional tone suitable for white papers, reports, and technical documentation.
3. **Completeness:** Always provide a complete, self-contained document. Do not use placeholders or incomplete sections unless explicitly instructed.
4. **No Conversational Fluff:** Do not include any introductory or concluding conversational text (e.g., "Here is your document," "Let me know if you need anything else"). Start immediately with the document's title and content.

**Document Structure Requirements (Always Include):**

- **Title:** A single, clear, and concise title using a Level 1 Heading (#).
- **Table of Contents (TOC):** Immediately following the title, generate a brief, hyperlinked Table of Contents based on the Level 2 and Level 3 headings in the document.
- **Headings:** Use Level 2 (##) for main sections and Level 3 (###) for subsections. Do not use Level 4 or lower unless the complexity absolutely demands it.
- **Formatting:** Use **bold** for key terms, \`code blocks\` for technical examples, and Markdown tables for presenting structured data.
- **Conclusion:** A dedicated final section summarizing the document's main points.

**Workflow for Document Generation:**

1. **Analyze Request:** Determine the document type (e.g., Whitepaper, Technical Report, Executive Summary, Blog Post).
2. **Generate Content:** Write the content, ensuring it meets all the structural requirements above.
3. **Final Output:** Present the complete, formatted GFM document.

**Expected Output Structure:**

# [Document Title]

## Table of Contents
* [Section 1](#section-1-title)
* [Section 2](#section-2-title)
  * [Subsection 2.1](#subsection-21-title)
* [Conclusion](#conclusion)

## Section 1 Title

[Content with **bold key terms**, \`code examples\`, and proper formatting...]

### Subsection 1.1 Title

[Detailed content...]

## Section 2 Title

[Content...]

## Conclusion

[Summary of main points...]

**Crucial Instruction:** When provided a topic, your only response is the fully generated document in the specified GFM format. Do not explain your process or add any commentary. Start immediately with the document title.`;
    }

    /**
     * Get document template based on type
     */
    getTemplate(type) {
        const templates = {
            report: {
                structure: `# [Title]

## Table of Contents
* [Executive Summary](#executive-summary)
* [Introduction](#introduction)
* [Methodology](#methodology)
* [Findings](#findings)
* [Analysis](#analysis)
* [Recommendations](#recommendations)
* [Conclusion](#conclusion)
* [References](#references)

## Executive Summary

[Brief overview of key findings and recommendations]

## Introduction

[Background and context]

## Methodology

[How the research was conducted]

## Findings

[Main results and data]

## Analysis

[Interpretation of findings]

## Recommendations

[Actionable suggestions]

## Conclusion

[Summary and final thoughts]

## References

[Sources and citations]`,
                prompt: 'Create a comprehensive research report with proper GFM structure and hyperlinked Table of Contents'
            },

            whitepaper: {
                structure: `# [Title]

## Abstract
[Brief summary of the problem and solution]

## Problem Statement
[Detailed description of the problem]

## Background
[Context and current situation]

## Solution Overview
[High-level description of the proposed solution]

## Technical Details
[In-depth technical information]

## Benefits and ROI
[Value proposition and return on investment]

## Implementation
[How to implement the solution]

## Conclusion
[Summary and call to action]

## About [Organization]
[Brief company/organization information]`,
                prompt: 'Create a professional whitepaper'
            },

            proposal: {
                structure: `# [Title]

## Executive Summary
[Overview of the proposal]

## Problem/Opportunity
[What needs to be addressed]

## Proposed Solution
[Your solution or approach]

## Scope of Work
[What will be delivered]

## Timeline
[Project schedule and milestones]

## Budget
[Cost breakdown]

## Team and Qualifications
[Who will do the work]

## Success Metrics
[How success will be measured]

## Terms and Conditions
[Legal and contractual details]

## Conclusion
[Final pitch and next steps]`,
                prompt: 'Create a business proposal'
            },

            article: {
                structure: `# [Title]

## Introduction
[Hook and overview]

## Background
[Context and relevant information]

## Main Content
[Core information organized in sections]

### Section 1
[Content]

### Section 2
[Content]

### Section 3
[Content]

## Practical Examples
[Real-world applications or case studies]

## Conclusion
[Summary and takeaways]

## Further Reading
[Additional resources]`,
                prompt: 'Write a technical article'
            }
        };

        return templates[type] || templates.article;
    }

    /**
     * Generate a document based on request
     */
    async generateDocument(request, options = {}) {
        const {
            type = 'article',
            tone = 'formal',
            length = 'medium',
            includeTableOfContents = true,
            includeReferences = false
        } = options;

        try {
            // Get template for document type
            const template = this.getTemplate(type);

            // Build the prompt
            let prompt = `${template.prompt} on the following topic:\n\n${request}\n\n`;

            // Add specific instructions
            prompt += `Requirements:\n`;
            prompt += `- Document type: ${type}\n`;
            prompt += `- Tone: ${tone}\n`;
            prompt += `- Length: ${length} (${this.getLengthGuidance(length)})\n`;

            if (includeTableOfContents) {
                prompt += `- Include a Table of Contents after the title\n`;
            }

            if (includeReferences) {
                prompt += `- Include a References section with credible sources\n`;
            }

            prompt += `\nUse the following structure as a guide:\n${template.structure}\n\n`;
            prompt += `Generate a complete, professional document following these guidelines.`;

            // Create model with system instruction
            const model = this.genAI.getGenerativeModel({
                model: "gemini-2.0-flash",
                systemInstruction: this.systemInstruction,
                generationConfig: {
                    temperature: 0.7,
                    topP: 0.95,
                    topK: 40,
                    maxOutputTokens: 8192,
                }
            });

            // Generate content
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const content = response.text();

            return {
                success: true,
                content,
                metadata: {
                    type,
                    tone,
                    length,
                    generatedAt: new Date().toISOString(),
                    wordCount: content.split(/\s+/).length
                }
            };

        } catch (error) {
            console.error('Document generation error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Refine an existing document based on feedback
     */
    async refineDocument(content, feedback, options = {}) {
        try {
            const prompt = `You are reviewing and improving a document based on user feedback.

ORIGINAL DOCUMENT:
${content}

USER FEEDBACK:
${feedback}

Please revise the document to address the feedback while maintaining the overall structure and quality. Return the complete revised document in Markdown format.`;

            const model = this.genAI.getGenerativeModel({
                model: "gemini-2.0-flash",
                systemInstruction: this.systemInstruction,
                generationConfig: {
                    temperature: 0.7,
                    topP: 0.95,
                    topK: 40,
                    maxOutputTokens: 8192,
                }
            });

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const refinedContent = response.text();

            return {
                success: true,
                content: refinedContent,
                metadata: {
                    refinedAt: new Date().toISOString(),
                    wordCount: refinedContent.split(/\s+/).length
                }
            };

        } catch (error) {
            console.error('Document refinement error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Generate document with tool support
     */
    async generateWithTools(request, tools = [], options = {}) {
        try {
            // Convert tools to Gemini function declarations
            const functionDeclarations = tools.map(tool => ({
                name: tool.name,
                description: tool.description,
                parameters: tool.parameters
            }));

            const model = this.genAI.getGenerativeModel({
                model: "gemini-2.0-flash",
                systemInstruction: this.systemInstruction,
                tools: [{ functionDeclarations }],
                generationConfig: {
                    temperature: 0.7,
                    topP: 0.95,
                    topK: 40,
                    maxOutputTokens: 8192,
                }
            });

            const chat = model.startChat();
            const result = await chat.sendMessage(request);
            const response = await result.response;

            // Handle function calls if any
            const functionCalls = response.functionCalls();
            if (functionCalls && functionCalls.length > 0) {
                // Execute tools and send results back
                const functionResponses = [];

                for (const call of functionCalls) {
                    const tool = tools.find(t => t.name === call.name);
                    if (tool && tool.execute) {
                        const result = await tool.execute(call.args);
                        functionResponses.push({
                            name: call.name,
                            response: result
                        });
                    }
                }

                // Send function responses back to model
                const finalResult = await chat.sendMessage(functionResponses);
                const finalResponse = await finalResult.response;

                return {
                    success: true,
                    content: finalResponse.text(),
                    toolsUsed: functionCalls.map(c => c.name)
                };
            }

            return {
                success: true,
                content: response.text()
            };

        } catch (error) {
            console.error('Document generation with tools error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get length guidance for document generation
     */
    getLengthGuidance(length) {
        const guidance = {
            short: '500-1000 words, concise and focused',
            medium: '1500-3000 words, comprehensive coverage',
            long: '3000-5000+ words, in-depth analysis'
        };
        return guidance[length] || guidance.medium;
    }
}

module.exports = DocumentAgent;
