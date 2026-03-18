const { retrieveContext } = require('./rag/ragService');

async function test() {
    console.log("Testing RAG Retrieval...");

    const queries = [
        "kit mikai en ango?",
        "nango",
        "rais en ng'a",
        "(Achiel nyaka Apar)",
        "kwan nyaka apar"
    ];

    for (const q of queries) {
        console.log(`\nQuery: "${q}"`);
        try {
            const context = await retrieveContext(q);
            console.log("Result:", context ? context.substring(0, 200) + "..." : "NO CONTEXT FOUND");
        } catch (e) {
            console.error("Error:", e);
        }
    }
}

test();
