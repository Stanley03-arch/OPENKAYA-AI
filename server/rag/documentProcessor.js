const pdf = require('pdf-parse');
const fs = require('fs');
const mammoth = require('mammoth');

async function extractTextFromPDF(filePath) {
    try {
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdf(dataBuffer);
        return data.text;
    } catch (error) {
        console.error("Error extracting PDF text:", error);
        return "";
    }
}

async function extractTextFromDocx(filePath) {
    try {
        const result = await mammoth.extractRawText({ path: filePath });
        return result.value;
    } catch (error) {
        console.error("Error extracting Docx text:", error);
        return "";
    }
}

function chunkText(text, chunkSize = 1000, overlap = 200) {
    const chunks = [];
    let start = 0;

    if (!text) return [];

    // Normalize whitespace but preserve paragraph breaks
    const cleanText = text.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n');

    while (start < cleanText.length) {
        const end = Math.min(start + chunkSize, cleanText.length);
        chunks.push(cleanText.slice(start, end));
        start += chunkSize - overlap;
    }

    return chunks;
}

async function extractTextFromCSV(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        // Simple CSV to text conversion by replacing commas and newlines with spaces/paragraphs
        // This makes it searchable for RAG without needing a full parser
        return content.replace(/,/g, ' ').replace(/\n/g, '\n\n');
    } catch (error) {
        console.error("Error extracting CSV text:", error);
        return "";
    }
}

module.exports = { extractTextFromPDF, extractTextFromDocx, extractTextFromCSV, chunkText };
