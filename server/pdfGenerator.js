const PDFDocument = require('pdfkit');
const fs = require('fs');

/**
 * Enhanced PDF Generator for Kaya AI
 * Built on PDFKit for true Node.js server-side PDF generation
 */
class PDFGenerator {
    constructor(options = {}) {
        this.options = {
            title: options.title || 'Kaya AI Document',
            fontSize: options.fontSize || 12,
            includeHeader: options.includeHeader !== false,
            includeFooter: options.includeFooter !== false,
            includePageNumbers: options.includePageNumbers !== false,
            headerColor: options.headerColor || [102, 126, 234],
            margin: options.margin || 50,
            ...options
        };

        this.doc = new PDFDocument({
            margins: {
                top: 60,
                bottom: 50,
                left: this.options.margin,
                right: this.options.margin
            },
            size: 'A4',
            bufferPages: true,
            info: {
                Title: this.options.title,
                Author: 'Kaya AI',
                Creator: 'Kaya AI PDF Generator'
            }
        });

        this.pageNumber = 0;

        // Draw header on every new page
        this.doc.on('pageAdded', () => {
            this.pageNumber++;
            if (this.options.includeHeader) {
                this._drawPageHeader();
            }
        });

        // Trigger header for page 1
        this.pageNumber++;
        if (this.options.includeHeader) {
            this._drawPageHeader();
        }
    }

    /**
     * Draw the Kaya AI header text at the top of a page
     */
    _drawPageHeader() {
        const savedY = this.doc.y;
        this.doc
            .save()
            .font('Helvetica')
            .fontSize(9)
            .fillColor('#aaaaaa')
            .text('Kaya AI', this.options.margin, 20, { align: 'left', lineBreak: false })
            .restore();
        // Don't change doc.y — ensure content continues from where it was
        this.doc.y = savedY;
    }

    /**
     * Add footers with page numbers to all buffered pages
     */
    _addFooters() {
        if (!this.options.includePageNumbers) return;

        const range = this.doc.bufferedPageRange();
        const totalPages = range.count;

        for (let i = 0; i < totalPages; i++) {
            this.doc.switchToPage(range.start + i);
            const pageNum = i + 1;
            const y = this.doc.page.height - 30;

            this.doc
                .save()
                .font('Helvetica')
                .fontSize(9)
                .fillColor('#aaaaaa')
                .text(
                    `Page ${pageNum} of ${totalPages}`,
                    this.options.margin,
                    y,
                    {
                        align: 'center',
                        width: this.doc.page.width - this.options.margin * 2,
                        lineBreak: false
                    }
                )
                .restore();
        }
    }

    /**
     * Add title to document
     */
    addTitle(title) {
        const [r, g, b] = this.options.headerColor;
        const colorHex = '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');

        this.doc
            .font('Helvetica-Bold')
            .fontSize(24)
            .fillColor(colorHex)
            .text(title, { align: 'left' })
            .moveDown(0.3);

        const lineY = this.doc.y;
        this.doc
            .moveTo(this.options.margin, lineY)
            .lineTo(this.doc.page.width - this.options.margin, lineY)
            .strokeColor(colorHex)
            .lineWidth(0.5)
            .stroke()
            .lineWidth(1);

        this.doc.moveDown(1).fillColor('#000000');
        return this;
    }

    /**
     * Add metadata block
     */
    addMetadata(metadata) {
        this.doc.font('Helvetica').fontSize(10).fillColor('#666666');
        Object.entries(metadata).forEach(([key, value]) => {
            this.doc.text(`${key}: ${value}`);
        });
        this.doc.moveDown(1).fillColor('#000000');
        return this;
    }

    /**
     * Parse and render markdown content
     */
    async addMarkdown(content) {
        const lines = content.split('\n');
        let inCodeBlock = false;
        let codeLines = [];

        for (const line of lines) {
            if (line.startsWith('```')) {
                if (!inCodeBlock) {
                    inCodeBlock = true;
                    codeLines = [];
                } else {
                    inCodeBlock = false;
                    this._addCodeBlock(codeLines.join('\n'));
                    codeLines = [];
                }
                continue;
            }

            if (inCodeBlock) {
                codeLines.push(line);
                continue;
            }

            this._processMarkdownLine(line);
        }

        if (inCodeBlock && codeLines.length > 0) {
            this._addCodeBlock(codeLines.join('\n'));
        }

        return this;
    }

    /**
     * Process a single markdown line
     */
    _processMarkdownLine(line) {
        if (!line.trim()) {
            this.doc.moveDown(0.4);
            return;
        }

        if (line.startsWith('# '))       return this._addHeading(line.substring(2).trim(), 20, 'Helvetica-Bold', '#111111');
        if (line.startsWith('## '))      return this._addHeading(line.substring(3).trim(), 16, 'Helvetica-Bold', '#222222');
        if (line.startsWith('### '))     return this._addHeading(line.substring(4).trim(), 14, 'Helvetica-Bold', '#333333');
        if (line.startsWith('#### '))    return this._addHeading(line.substring(5).trim(), 12, 'Helvetica-Bold', '#444444');

        if (line.match(/^(-{3,}|\*{3,}|_{3,})$/)) {
            return this._addHRule();
        }

        if (line.match(/^[\*\-\+]\s/))  return this._addListItem(line.substring(2).trim());
        if (line.match(/^\d+\.\s/))     return this._addOrderedListItem(line);
        if (line.startsWith('> '))       return this._addBlockquote(line.substring(2).trim());
        if (line.match(/!\[.*?\]\(.*?\)/)) {
            this.doc.font('Helvetica-Oblique').fontSize(10).fillColor('#888888')
                .text('[Image]', { align: 'center' }).fillColor('#000000');
            this.doc.moveDown(0.5);
            return;
        }

        this._addParagraph(line);
    }

    _addHeading(text, size, font, color) {
        this.doc.font(font).fontSize(size).fillColor(color)
            .text(this._strip(text)).moveDown(0.3).fillColor('#000000');
    }

    _addHRule() {
        this.doc.moveDown(0.5);
        const y = this.doc.y;
        this.doc.moveTo(this.options.margin, y).lineTo(this.doc.page.width - this.options.margin, y)
            .strokeColor('#cccccc').stroke();
        this.doc.moveDown(0.5);
    }

    _addParagraph(text) {
        this.doc.font('Helvetica').fontSize(this.options.fontSize).fillColor('#000000')
            .text(this._strip(text), { align: 'justify', lineGap: 2 }).moveDown(0.3);
    }

    _addListItem(text) {
        this.doc.font('Helvetica').fontSize(this.options.fontSize).fillColor('#000000')
            .text(`• ${this._strip(text)}`, { indent: 15, lineGap: 1 }).moveDown(0.2);
    }

    _addOrderedListItem(text) {
        const match = text.match(/^(\d+)\.\s(.+)/);
        if (match) {
            this.doc.font('Helvetica').fontSize(this.options.fontSize).fillColor('#000000')
                .text(`${match[1]}. ${this._strip(match[2].trim())}`, { indent: 15, lineGap: 1 }).moveDown(0.2);
        }
    }

    _addBlockquote(text) {
        const currentX = this.doc.x;
        const currentY = this.doc.y;

        this.doc.font('Helvetica-Oblique').fontSize(this.options.fontSize).fillColor('#555555')
            .text(this._strip(text), this.options.margin + 20, currentY, { lineGap: 2 })
            .fillColor('#000000').moveDown(0.5);

        // Draw left border
        const afterY = this.doc.y;
        this.doc.save()
            .moveTo(this.options.margin + 8, currentY - 2)
            .lineTo(this.options.margin + 8, afterY)
            .strokeColor('#aaaaaa').lineWidth(3).stroke().lineWidth(1)
            .restore();
    }

    _addCodeBlock(code) {
        if (!code.trim()) return;
        this.doc.font('Courier').fontSize(10).fillColor('#333333')
            .text(code, {
                indent: 10,
                lineGap: 2,
                background: '#f4f4f4'
            })
            .fillColor('#000000').moveDown(0.8);
    }

    _strip(text) {
        return text
            .replace(/\*\*(.*?)\*\*/g, '$1')
            .replace(/\*(.*?)\*/g, '$1')
            .replace(/__(.*?)__/g, '$1')
            .replace(/_(.*?)_/g, '$1')
            .replace(/`(.*?)`/g, '$1')
            .replace(/\[(.*?)\]\(.*?\)/g, '$1')
            .replace(/~~(.*?)~~/g, '$1');
    }

    /**
     * Save PDF to file (async)
     */
    save(filepath) {
        return new Promise((resolve, reject) => {
            this._addFooters();
            const stream = fs.createWriteStream(filepath);
            this.doc.pipe(stream);
            this.doc.end();
            stream.on('finish', () => resolve(filepath));
            stream.on('error', reject);
        });
    }

    /**
     * Generate PDF and return as Buffer
     */
    generate() {
        return new Promise((resolve, reject) => {
            this._addFooters();
            const chunks = [];
            this.doc.on('data', chunk => chunks.push(chunk));
            this.doc.on('end', () => resolve(Buffer.concat(chunks)));
            this.doc.on('error', reject);
            this.doc.end();
        });
    }
}

module.exports = PDFGenerator;
