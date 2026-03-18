const vectorStore = require('./vectorStore');
const { generateEmbedding } = require('./embeddings');

async function retrieveContext(query, topK = 3) {
    try {
        // Keyword search doesn't need embedding
        // const queryEmbedding = await generateEmbedding(query);

        // Search store directly with text query
        const results = await vectorStore.search(query, topK);

        if (!results.documents || results.documents.length === 0 || !results.documents[0] || results.documents[0].length === 0) return "";

        // Format context
        // results.documents is an array of arrays (one per query)
        const context = results.documents[0].map((doc, i) => {
            // Basic safeguard against very short/empty docs
            if (!doc || doc.length < 10) return "";
            return `[Source ${i + 1}]: ${doc}`;
        }).filter(d => d).join('\n\n');

        return context;
    } catch (error) {
        console.error("Error in retrieveContext:", error);
        return "";
    }
}

module.exports = { retrieveContext };
