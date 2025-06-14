import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { db } from '../database/init.js';
import { authenticateToken } from './auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// Configure multer for technical drawings
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
    cb(null, 'technical-' + uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|dwg|dxf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype) || 
                    file.mimetype === 'application/pdf';
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images, PDFs, and CAD files are allowed for technical drawings'));
    }
  },
  limits: { fileSize: 20 * 1024 * 1024 } // 20MB limit for technical drawings
});

// Create proposal
router.post('/', authenticateToken, (req, res) => {
  if (req.user.role === 'admin') {
    return res.status(403).json({ error: 'Admins cannot create proposals' });
  }

  const { quoteId, value, observations } = req.body;

  // Check if quote exists and is pending
  db.get(
    'SELECT supplier_type, status FROM quotes WHERE id = ?',
    [quoteId],
    (err, quote) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!quote) {
        return res.status(404).json({ error: 'Quote not found' });
      }

      if (quote.status !== 'pending') {
        return res.status(400).json({ error: 'Quote is no longer accepting proposals' });
      }

      // Check if supplier type matches
      const supplierType = req.user.role === 'knife-supplier' ? 'knife' : 'die';
      if (quote.supplier_type !== supplierType) {
        return res.status(403).json({ error: 'Quote not available for your supplier type' });
      }

      // Check if proposal already exists
      db.get(
        'SELECT id FROM proposals WHERE quote_id = ? AND supplier_id = ?',
        [quoteId, req.user.userId],
        (err, existing) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }

          if (existing) {
            return res.status(400).json({ error: 'Proposal already submitted for this quote' });
          }

          // Create proposal
          db.run(
            'INSERT INTO proposals (quote_id, supplier_id, value, observations) VALUES (?, ?, ?, ?)',
            [quoteId, req.user.userId, value, observations || ''],
            function(err) {
              if (err) {
                return res.status(500).json({ error: 'Database error' });
              }

              res.json({
                id: this.lastID,
                message: 'Proposal submitted successfully'
              });
            }
          );
        }
      );
    }
  );
});

// Upload technical drawing
router.post('/:id/technical-drawing', authenticateToken, upload.single('technicalDrawing'), (req, res) => {
  if (req.user.role === 'admin') {
    return res.status(403).json({ error: 'Admins cannot upload technical drawings' });
  }

  const proposalId = req.params.id;

  if (!req.file) {
    return res.status(400).json({ error: 'Technical drawing file is required' });
  }

  // Check if proposal exists and is approved
  db.get(
    `SELECT p.status, p.supplier_id, q.supplier_type 
     FROM proposals p 
     JOIN quotes q ON p.quote_id = q.id 
     WHERE p.id = ?`,
    [proposalId],
    (err, proposal) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!proposal) {
        return res.status(404).json({ error: 'Proposal not found' });
      }

      if (proposal.supplier_id !== req.user.userId) {
        return res.status(403).json({ error: 'Not authorized to upload for this proposal' });
      }

      if (proposal.status !== 'approved') {
        return res.status(400).json({ error: 'Can only upload technical drawings for approved proposals' });
      }

      if (proposal.supplier_type !== 'knife') {
        return res.status(400).json({ error: 'Technical drawings are only required for knife suppliers' });
      }

      // Check if technical drawing already exists
      db.get(
        'SELECT id FROM technical_drawings WHERE proposal_id = ?',
        [proposalId],
        (err, existing) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }

          if (existing) {
            return res.status(400).json({ error: 'Technical drawing already uploaded' });
          }

          // Create technical drawing record
          db.run(
            'INSERT INTO technical_drawings (proposal_id, file_path, file_name) VALUES (?, ?, ?)',
            [proposalId, req.file.filename, req.file.originalname],
            function(err) {
              if (err) {
                return res.status(500).json({ error: 'Database error' });
              }

              res.json({
                id: this.lastID,
                message: 'Technical drawing uploaded successfully'
              });
            }
          );
        }
      );
    }
  );
});

// Get pending technical drawings (admin only)
router.get('/technical-drawings/pending', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only admins can view pending technical drawings' });
  }

  db.all(
    `SELECT td.*, p.value as proposal_value, q.name as quote_name, q.quote_number,
            u.name as supplier_name, u.company_name as supplier_company
     FROM technical_drawings td
     JOIN proposals p ON td.proposal_id = p.id
     JOIN quotes q ON p.quote_id = q.id
     JOIN users u ON p.supplier_id = u.id
     WHERE td.status = 'pending'
     ORDER BY td.created_at ASC`,
    [],
    (err, drawings) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      res.json(drawings);
    }
  );
});

// Review technical drawing (admin only)
router.post('/technical-drawings/:id/review', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only admins can review technical drawings' });
  }

  const { status, rejectionReason } = req.body;
  const drawingId = req.params.id;

  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  if (status === 'rejected' && !rejectionReason) {
    return res.status(400).json({ error: 'Rejection reason is required' });
  }

  db.run(
    `UPDATE technical_drawings 
     SET status = ?, rejection_reason = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP 
     WHERE id = ?`,
    [status, rejectionReason || null, req.user.userId, drawingId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Technical drawing not found' });
      }

      res.json({ message: 'Technical drawing reviewed successfully' });
    }
  );
});

// Resubmit technical drawing (after rejection)
router.post('/:id/technical-drawing/resubmit', authenticateToken, upload.single('technicalDrawing'), (req, res) => {
  if (req.user.role === 'admin') {
    return res.status(403).json({ error: 'Admins cannot upload technical drawings' });
  }

  const proposalId = req.params.id;

  if (!req.file) {
    return res.status(400).json({ error: 'Technical drawing file is required' });
  }

  // Check if proposal exists and has a rejected technical drawing
  db.get(
    `SELECT td.id, td.file_path, p.supplier_id 
     FROM technical_drawings td
     JOIN proposals p ON td.proposal_id = p.id
     WHERE p.id = ? AND td.status = 'rejected'`,
    [proposalId],
    (err, drawing) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!drawing) {
        return res.status(404).json({ error: 'No rejected technical drawing found for this proposal' });
      }

      if (drawing.supplier_id !== req.user.userId) {
        return res.status(403).json({ error: 'Not authorized to resubmit for this proposal' });
      }

      // Delete old file
      const oldFilePath = path.join(__dirname, '../../upload', drawing.file_path);
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }

      // Update technical drawing record
      db.run(
        `UPDATE technical_drawings 
         SET file_path = ?, file_name = ?, status = 'pending', rejection_reason = NULL, 
             reviewed_by = NULL, reviewed_at = NULL, created_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [req.file.filename, req.file.originalname, drawing.id],
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }

          res.json({ message: 'Technical drawing resubmitted successfully' });
        }
      );
    }
  );
});

export default router;