// Dummy embedding generator since we switched to keyword search
// This keeps the interface compatible without needing actual embeddings

async function generateEmbedding(text) {
    return []; // Return empty array
}

async function generateEmbeddings(texts) {
    // Return array of empty arrays
    return texts.map(() => []);
}

module.exports = { generateEmbedding, generateEmbeddings };
