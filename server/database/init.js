import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = path.join(__dirname, '../database.sqlite');

export const db = new sqlite3.Database(dbPath);

export const initializeDatabase = async () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Users table
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          role TEXT NOT NULL CHECK (role IN ('admin', 'knife-supplier', 'die-supplier')),
          name TEXT NOT NULL,
          company_name TEXT,
          is_active BOOLEAN DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Quotes table
      db.run(`
        CREATE TABLE IF NOT EXISTS quotes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          quote_number INTEGER UNIQUE NOT NULL,
          name TEXT NOT NULL,
          supplier_type TEXT NOT NULL CHECK (supplier_type IN ('knife', 'die')),
          material_type TEXT CHECK (material_type IN ('micro-ondulado', 'onda-t', 'onda-b', 'onda-c', 'onda-tt', 'onda-bc')),
          knife_type TEXT CHECK (knife_type IN ('plana', 'rotativa', 'rotativa-plana')),
          observations TEXT,
          original_file_path TEXT,
          original_file_name TEXT,
          correction_file_path TEXT,
          correction_file_name TEXT,
          status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'completed')),
          approved_supplier_id INTEGER,
          created_by INTEGER NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (created_by) REFERENCES users(id),
          FOREIGN KEY (approved_supplier_id) REFERENCES users(id)
        )
      `);

      // Proposals table
      db.run(`
        CREATE TABLE IF NOT EXISTS proposals (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          quote_id INTEGER NOT NULL,
          supplier_id INTEGER NOT NULL,
          value DECIMAL(10,2) NOT NULL,
          observations TEXT,
          status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE,
          FOREIGN KEY (supplier_id) REFERENCES users(id),
          UNIQUE(quote_id, supplier_id)
        )
      `);

      // Technical drawings table
      db.run(`
        CREATE TABLE IF NOT EXISTS technical_drawings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          proposal_id INTEGER NOT NULL,
          file_path TEXT NOT NULL,
          file_name TEXT NOT NULL,
          status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
          rejection_reason TEXT,
          reviewed_by INTEGER,
          reviewed_at DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (proposal_id) REFERENCES proposals(id) ON DELETE CASCADE,
          FOREIGN KEY (reviewed_by) REFERENCES users(id)
        )
      `);

      // Quote counter table
      db.run(`
        CREATE TABLE IF NOT EXISTS quote_counter (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          last_number INTEGER DEFAULT 0
        )
      `);

      // Insert initial quote counter
      db.run(`INSERT OR IGNORE INTO quote_counter (id, last_number) VALUES (1, 0)`);

      // Create default admin user
      const adminPassword = bcrypt.hashSync('admin123', 10);
      db.run(`
        INSERT OR IGNORE INTO users (email, password, role, name, company_name) 
        VALUES (?, ?, 'admin', 'Administrador Onducart', 'Onducart Embalagens')
      `, ['onducartembalagens@gmail.com', adminPassword]);

      console.log('Database initialized successfully');
      resolve();
    });
  });
};

export const getNextQuoteNumber = () => {
  return new Promise((resolve, reject) => {
    db.run('UPDATE quote_counter SET last_number = last_number + 1 WHERE id = 1', function(err) {
      if (err) {
        reject(err);
        return;
      }
      
      db.get('SELECT last_number FROM quote_counter WHERE id = 1', (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(row.last_number);
      });
    });
  });
};