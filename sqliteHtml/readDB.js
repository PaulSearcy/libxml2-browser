import { DatabaseSync } from 'node:sqlite';
import fs from 'fs';
const database = new DatabaseSync('./matches.db');

const query = database.prepare('SELECT * FROM matches ORDER BY id');
console.log(query.all());