import express from 'express';
import { db } from '../database/init.js';
import { authenticateToken } from './auth.js';

const router = express.Router();

// Get financial report (admin only)
router.get('/report', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only admins can view financial reports' });
  }

  const { month, year } = req.query;

  let query = `
    SELECT q.id, q.quote_number, q.name as quote_name, q.supplier_type, q.created_at,
           p.value, u.name as supplier_name, u.company_name as supplier_company
    FROM quotes q
    JOIN proposals p ON q.approved_supplier_id = p.supplier_id AND p.quote_id = q.id
    JOIN users u ON p.supplier_id = u.id
    WHERE q.status = 'approved'
  `;

  let params = [];

  if (year) {
    query += ` AND strftime('%Y', q.created_at) = ?`;
    params.push(year);
  }

  if (month) {
    query += ` AND strftime('%m', q.created_at) = ?`;
    params.push(month.toString().padStart(2, '0'));
  }

  query += ' ORDER BY q.created_at DESC';

  db.all(query, params, (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    // Calculate total
    const total = results.reduce((sum, item) => sum + parseFloat(item.value), 0);

    res.json({
      items: results,
      total,
      count: results.length
    });
  });
});

// Get financial summary (admin only)
router.get('/summary', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only admins can view financial summary' });
  }

  db.all(`
    SELECT 
      strftime('%Y-%m', q.created_at) as month,
      COUNT(*) as count,
      SUM(p.value) as total,
      q.supplier_type
    FROM quotes q
    JOIN proposals p ON q.approved_supplier_id = p.supplier_id AND p.quote_id = q.id
    WHERE q.status = 'approved'
    GROUP BY strftime('%Y-%m', q.created_at), q.supplier_type
    ORDER BY month DESC
  `, [], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    res.json(results);
  });
});

export default router;