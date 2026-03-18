const fs = require('fs');
const path = require('path');
const { extractTextFromPDF, extractTextFromDocx, extractTextFromCSV, chunkText } = require('./rag/documentProcessor');
const { generateEmbeddings } = require('./rag/embeddings');
const vectorStore = require('./rag/vectorStore');
const dotenv = require('dotenv');
dotenv.config();

const DOCUMENTS_DIR = path.join(__dirname, 'documents');

async function ingestDocuments() {
    console.log("Starting document ingestion...");

    if (!fs.existsSync(DOCUMENTS_DIR)) {
        fs.mkdirSync(DOCUMENTS_DIR);
        console.log(`Created ${DOCUMENTS_DIR}. Place your PDF/DOCX files here.`);
        return;
    }

    const files = fs.readdirSync(DOCUMENTS_DIR);
    let totalDocs = 0;

    for (const file of files) {
        const filePath = path.join(DOCUMENTS_DIR, file);
        const ext = path.extname(file).toLowerCase();

        let text = "";
        if (ext === '.pdf') {
            console.log(`Processing PDF: ${file}`);
            text = await extractTextFromPDF(filePath);
        } else if (ext === '.docx') {
            console.log(`Processing DOCX: ${file}`);
            text = await extractTextFromDocx(filePath);
        } else if (ext === '.csv') {
            console.log(`Processing CSV: ${file}`);
            text = await extractTextFromCSV(filePath);
        } else if (ext === '.txt' || ext === '.md') {
            console.log(`Processing Text: ${file}`);
            text = fs.readFileSync(filePath, 'utf-8');
        } else {
            continue;
        }

        if (!text) {
            console.log(`Skipping empty/unreadable file: ${file}`);
            continue;
        }

        const chunks = chunkText(text);
        console.log(`Generated ${chunks.length} chunks for ${file}`);

        // Process in batches of 20 to avoid rate limits
        const BATCH_SIZE = 20;
        for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
            const batchChunks = chunks.slice(i, i + BATCH_SIZE);
            const batchEmbeddings = await generateEmbeddings(batchChunks);

            if (batchEmbeddings.length > 0) {
                await vectorStore.addDocuments(batchChunks, batchEmbeddings, Array(batchChunks.length).fill({ source: file }));
            }
        }

        totalDocs++;
    }

    console.log(`Ingestion complete! Processed ${totalDocs} documents.`);
}

ingestDocuments();
