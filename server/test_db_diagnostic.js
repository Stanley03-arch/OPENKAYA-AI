const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');

async function test() {
    try {
        const db = await open({
            filename: ':memory:',
            driver: sqlite3.Database
        });
        await db.exec('CREATE TABLE test (id INTEGER PRIMARY KEY)');
        await db.run('INSERT INTO test (id) VALUES (1)');
        const row = await db.get('SELECT * FROM test');
        console.log('Database Test Success:', row);
        process.exit(0);
    } catch (err) {
        console.error('Database Test Failed:', err);
        process.exit(1);
    }
}

test();
