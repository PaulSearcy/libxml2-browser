import { DatabaseSync } from 'node:sqlite';
import fs from 'fs';
const database = new DatabaseSync('./matches.db', { create: true });
 const escape = (value) =>
            value == null
                ? 'NULL'
                : `'${String(value).replace(/'/g, "''")}'`;
const sqlSchema = `
CREATE TABLE sections (
  id TEXT PRIMARY KEY,
  text TEXT
);

CREATE TABLE matches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  section_id TEXT,        -- Foreign key to sections.id
  bookId TEXT,
  xmlId TEXT,
  title TEXT,
  text TEXT,
  label TEXT,
  ordinal TEXT,
  FOREIGN KEY(section_id) REFERENCES sections(id)
);
`
// Execute SQL statements from strings.
database.exec(sqlSchema);
// const insertSection = database.prepare('INSERT INTO sections (id, text) VALUES (?, ?)');
const insertSection = { run: (id ,text) =>  database.exec(`INSERT INTO sections (id, text) VALUES (${escape(id)}, ${escape(text)})`)};
// const insertMatches = database.prepare('INSERT INTO matches (section_id, bookId, xmlId, title, text, label, ordinal) VALUES (?, ?, ?, ?, ?, ?, ?)');
const insertMatches = {
    run: (sectionId, bookId, xmlId, title, text, label, ordinal) => {
        return database.exec(`INSERT INTO matches (section_id, bookId, xmlId, title, text, label, ordinal) VALUES (${escape(sectionId)}, ${escape(bookId)}, ${escape(xmlId)}, ${escape(title)}, ${escape(text)}, ${escape(label)}, ${escape(ordinal)})`);
    }
}

const matchesData = fs.readFileSync('./matchesAsJSON.json', 'utf8');

const matches = JSON.parse(matchesData);

matches.forEach(match => {
    try {
        insertSection.run(
            match.id,
            match.text
        );
    } catch (error) {
        console.error('Error inserting section:', error);
        console.log(`Section ID: ${match.id}, Text: ${match.text}`);
    }

    match.matches.forEach(m => {
        try {
            insertMatches.run(
                match.id,
                m.bookId,
                m.xmlId,
                m.title,
                m.text,
                m.label,
                m.ordinal
            );
        } catch (error) {
            console.error('Error inserting match:', error);
            console.log(`Match Data: ${JSON.stringify(m)}`);
        }
    });
})


// const query = database.prepare('SELECT * FROM matches ORDER BY id');
// console.log(query.all());
