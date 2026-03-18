const { generateEmbedding } = require('./rag/embeddings');

async function test() {
    console.log("Testing Embeddings...");
    try {
        const emb = await generateEmbedding("Hello world");
        if (emb && emb.length > 0) {
            console.log("Embedding success, length:", emb.length);
        } else {
            console.error("Embedding returned null/empty");
        }
    } catch (error) {
        console.error("Test failed:", error);
    }
}

test();
