import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { db, getNextQuoteNumber } from '../database/init.js';
import { authenticateToken } from './auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../upload');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx|dwg|dxf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype) || 
                    file.mimetype === 'application/pdf' ||
                    file.mimetype === 'application/msword' ||
                    file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images, PDFs, and document files are allowed'));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Get all quotes (admin) or filtered by supplier type (suppliers)
router.get('/', authenticateToken, (req, res) => {
  let query = `
    SELECT q.*, u.name as created_by_name, 
           us.name as approved_supplier_name, us.company_name as approved_supplier_company
    FROM quotes q
    LEFT JOIN users u ON q.created_by = u.id
    LEFT JOIN users us ON q.approved_supplier_id = us.id
  `;
  
  let params = [];

  if (req.user.role !== 'admin') {
    // Suppliers only see quotes for their type and not approved by others
    const supplierType = req.user.role === 'knife-supplier' ? 'knife' : 'die';
    query += ` WHERE q.supplier_type = ? AND (q.status = 'pending' OR q.approved_supplier_id = ?)`;
    params = [supplierType, req.user.userId];
  }

  query += ' ORDER BY q.created_at DESC';

  db.all(query, params, (err, quotes) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    // Get proposals for each quote
    const quotesWithProposals = quotes.map(quote => {
      return new Promise((resolve) => {
        db.all(
          `SELECT p.*, u.name as supplier_name, u.company_name as supplier_company
           FROM proposals p
           JOIN users u ON p.supplier_id = u.id
           WHERE p.quote_id = ?`,
          [quote.id],
          (err, proposals) => {
            if (err) {
              resolve({ ...quote, proposals: [] });
            } else {
              resolve({ ...quote, proposals });
            }
          }
        );
      });
    });

    Promise.all(quotesWithProposals).then(results => {
      res.json(results);
    });
  });
});

// Create new quote
router.post('/', authenticateToken, upload.single('file'), async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only admins can create quotes' });
  }

  try {
    const { name, supplierType, materialType, knifeType, observations } = req.body;
    const quoteNumber = await getNextQuoteNumber();

    if (!req.file) {
      return res.status(400).json({ error: 'File is required' });
    }

    db.run(
      `INSERT INTO quotes (quote_number, name, supplier_type, material_type, knife_type, observations, 
                          original_file_path, original_file_name, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        quoteNumber,
        name,
        supplierType,
        materialType || null,
        knifeType || null,
        observations || '',
        req.file.filename,
        req.file.originalname,
        req.user.userId
      ],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        res.json({
          id: this.lastID,
          quoteNumber,
          message: 'Quote created successfully'
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Failed to create quote' });
  }
});

// Update quote (only name and observations)
router.put('/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only admins can update quotes' });
  }

  const { name, observations } = req.body;
  const quoteId = req.params.id;

  db.run(
    'UPDATE quotes SET name = ?, observations = ? WHERE id = ?',
    [name, observations, quoteId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Quote not found' });
      }

      res.json({ message: 'Quote updated successfully' });
    }
  );
});

// Upload correction file
router.post('/:id/correction', authenticateToken, upload.single('correctionFile'), (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only admins can upload correction files' });
  }

  const quoteId = req.params.id;

  if (!req.file) {
    return res.status(400).json({ error: 'Correction file is required' });
  }

  // Check if quote is still pending
  db.get('SELECT status FROM quotes WHERE id = ?', [quoteId], (err, quote) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!quote) {
      return res.status(404).json({ error: 'Quote not found' });
    }

    if (quote.status !== 'pending') {
      return res.status(400).json({ error: 'Cannot upload correction file for approved quotes' });
    }

    db.run(
      'UPDATE quotes SET correction_file_path = ?, correction_file_name = ? WHERE id = ?',
      [req.file.filename, req.file.originalname, quoteId],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        res.json({ message: 'Correction file uploaded successfully' });
      }
    );
  });
});

// Delete correction file
router.delete('/:id/correction', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only admins can delete correction files' });
  }

  const quoteId = req.params.id;

  db.get('SELECT correction_file_path, status FROM quotes WHERE id = ?', [quoteId], (err, quote) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!quote) {
      return res.status(404).json({ error: 'Quote not found' });
    }

    if (quote.status !== 'pending') {
      return res.status(400).json({ error: 'Cannot delete correction file for approved quotes' });
    }

    if (!quote.correction_file_path) {
      return res.status(404).json({ error: 'No correction file found' });
    }

    // Delete file from filesystem
    const filePath = path.join(__dirname, '../../upload', quote.correction_file_path);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    db.run(
      'UPDATE quotes SET correction_file_path = NULL, correction_file_name = NULL WHERE id = ?',
      [quoteId],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        res.json({ message: 'Correction file deleted successfully' });
      }
    );
  });
});

// Approve proposal
router.post('/:id/approve/:proposalId', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only admins can approve proposals' });
  }

  const quoteId = req.params.id;
  const proposalId = req.params.proposalId;

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    // Update quote status and approved supplier
    db.run(
      'UPDATE quotes SET status = "approved", approved_supplier_id = (SELECT supplier_id FROM proposals WHERE id = ?) WHERE id = ?',
      [proposalId, quoteId],
      function(err) {
        if (err) {
          db.run('ROLLBACK');
          return res.status(500).json({ error: 'Database error' });
        }

        // Update proposal statuses
        db.run(
          'UPDATE proposals SET status = "approved" WHERE id = ?',
          [proposalId],
          function(err) {
            if (err) {
              db.run('ROLLBACK');
              return res.status(500).json({ error: 'Database error' });
            }

            db.run(
              'UPDATE proposals SET status = "rejected" WHERE quote_id = ? AND id != ?',
              [quoteId, proposalId],
              function(err) {
                if (err) {
                  db.run('ROLLBACK');
                  return res.status(500).json({ error: 'Database error' });
                }

                db.run('COMMIT');
                res.json({ message: 'Proposal approved successfully' });
              }
            );
          }
        );
      }
    );
  });
});

// Delete quote
router.delete('/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only admins can delete quotes' });
  }

  const quoteId = req.params.id;

  // Get all files associated with the quote
  db.get(
    `SELECT original_file_path, correction_file_path FROM quotes WHERE id = ?`,
    [quoteId],
    (err, quote) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!quote) {
        return res.status(404).json({ error: 'Quote not found' });
      }

      // Get technical drawing files
      db.all(
        `SELECT td.file_path FROM technical_drawings td
         JOIN proposals p ON td.proposal_id = p.id
         WHERE p.quote_id = ?`,
        [quoteId],
        (err, drawings) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }

          // Delete all files
          const filesToDelete = [];
          if (quote.original_file_path) filesToDelete.push(quote.original_file_path);
          if (quote.correction_file_path) filesToDelete.push(quote.correction_file_path);
          drawings.forEach(drawing => filesToDelete.push(drawing.file_path));

          filesToDelete.forEach(filename => {
            const filePath = path.join(__dirname, '../../upload', filename);
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
            }
          });

          // Delete quote (cascade will handle related records)
          db.run('DELETE FROM quotes WHERE id = ?', [quoteId], function(err) {
            if (err) {
              return res.status(500).json({ error: 'Database error' });
            }

            res.json({ message: 'Quote deleted successfully' });
          });
        }
      );
    }
  );
});

// Download file
router.get('/download/:filename', authenticateToken, (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, '../../upload', filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }

  res.download(filePath);
});

export default router;