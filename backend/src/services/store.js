// Simple file-backed JSON store. Chosen over SQLite/Postgres so that the
// project runs with zero infrastructure for a take-home review while still
// modeling persistence cleanly behind a small interface.

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

function fileFor(name) {
  return path.join(DATA_DIR, `${name}.json`);
}

function readAll(name) {
  const file = fileFor(name);
  if (!fs.existsSync(file)) return [];
  try {
    return JSON.parse(fs.readFileSync(file, 'utf-8')) || [];
  } catch {
    return [];
  }
}

function writeAll(name, items) {
  fs.writeFileSync(fileFor(name), JSON.stringify(items, null, 2));
}

function add(name, item) {
  const items = readAll(name);
  const record = { id: cryptoRandomId(), createdAt: new Date().toISOString(), ...item };
  items.unshift(record);
  writeAll(name, items);
  return record;
}

function remove(name, id) {
  const items = readAll(name);
  const next = items.filter((it) => it.id !== id);
  writeAll(name, next);
  return items.length !== next.length;
}

function update(name, id, patch) {
  const items = readAll(name);
  const idx = items.findIndex((it) => it.id === id);
  if (idx === -1) return null;
  items[idx] = { ...items[idx], ...patch, id: items[idx].id };
  writeAll(name, items);
  return items[idx];
}

function clear(name) {
  writeAll(name, []);
}

function cryptoRandomId() {
  // Avoid pulling in a uuid dependency — 12 hex chars is enough for a local store.
  return Math.random().toString(16).slice(2, 14).padEnd(12, '0');
}

module.exports = { readAll, writeAll, add, remove, update, clear };
