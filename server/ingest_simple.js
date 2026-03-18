const fs = require('fs');
const path = require('path');
const { chunkText } = require('./rag/documentProcessor');
const { generateEmbeddings } = require('./rag/embeddings');
const vectorStore = require('./rag/vectorStore');
const dotenv = require('dotenv');
dotenv.config();

const DOCUMENTS_DIR = path.join(__dirname, 'documents');

async function ingestTextFiles() {
    console.log("Starting TEXT-ONLY document ingestion...");

    if (!fs.existsSync(DOCUMENTS_DIR)) {
        console.log(`Directory ${DOCUMENTS_DIR} not found.`);
        return;
    }

    const files = fs.readdirSync(DOCUMENTS_DIR);
    let totalDocs = 0;

    for (const file of files) {
        const filePath = path.join(DOCUMENTS_DIR, file);
        const ext = path.extname(file).toLowerCase();

        if (ext !== '.txt' && ext !== '.md') continue;

        console.log(`Processing Text: ${file}`);
        const text = fs.readFileSync(filePath, 'utf-8');

        if (!text) continue;

        const chunks = chunkText(text);
        console.log(`Generated ${chunks.length} chunks for ${file}`);

        // Process in batches
        const BATCH_SIZE = 10;
        for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
            const batchChunks = chunks.slice(i, i + BATCH_SIZE);
            const batchEmbeddings = await generateEmbeddings(batchChunks);

            if (batchEmbeddings.length > 0) {
                await vectorStore.addDocuments(batchChunks, batchEmbeddings, Array(batchChunks.length).fill({ source: file }));
            }
        }

        totalDocs++;
    }

    console.log(`Ingestion complete! Processed ${totalDocs} text documents.`);
}

ingestTextFiles();
