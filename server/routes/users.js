import express from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../database/init.js';
import { authenticateToken } from './auth.js';

const router = express.Router();

// Get all users (admin only)
router.get('/', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only admins can view users' });
  }

  db.all(
    'SELECT id, email, role, name, company_name, is_active, created_at FROM users ORDER BY created_at DESC',
    [],
    (err, users) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      res.json(users);
    }
  );
});

// Create user (admin only)
router.post('/', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only admins can create users' });
  }

  const { email, password, role, name, companyName } = req.body;

  if (!email || !password || !role || !name) {
    return res.status(400).json({ error: 'Email, password, role, and name are required' });
  }

  if (!['admin', 'knife-supplier', 'die-supplier'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);

  db.run(
    'INSERT INTO users (email, password, role, name, company_name) VALUES (?, ?, ?, ?, ?)',
    [email, hashedPassword, role, name, companyName || null],
    function(err) {
      if (err) {
        console.error('Database error:', err);
        if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
          return res.status(400).json({ error: 'Email already exists' });
        }
        return res.status(500).json({ error: 'Database error' });
      }

      res.json({
        id: this.lastID,
        message: 'User created successfully'
      });
    }
  );
});

// Update user (admin only)
router.put('/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only admins can update users' });
  }

  const { email, password, role, name, companyName, isActive } = req.body;
  const userId = req.params.id;

  if (!email || !role || !name) {
    return res.status(400).json({ error: 'Email, role, and name are required' });
  }

  let query = 'UPDATE users SET email = ?, role = ?, name = ?, company_name = ?, is_active = ?';
  let params = [email, role, name, companyName || null, isActive !== undefined ? isActive : true];

  if (password) {
    const hashedPassword = bcrypt.hashSync(password, 10);
    query += ', password = ?';
    params.push(hashedPassword);
  }

  query += ' WHERE id = ?';
  params.push(userId);

  db.run(query, params, function(err) {
    if (err) {
      console.error('Database error:', err);
      if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        return res.status(400).json({ error: 'Email already exists' });
      }
      return res.status(500).json({ error: 'Database error' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User updated successfully' });
  });
});

// Delete user (admin only)
router.delete('/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only admins can delete users' });
  }

  const userId = req.params.id;

  // Prevent deleting the current admin user
  if (parseInt(userId) === req.user.userId) {
    return res.status(400).json({ error: 'Cannot delete your own account' });
  }

  db.run('DELETE FROM users WHERE id = ?', [userId], function(err) {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  });
});

// Toggle user active status (admin only)
router.patch('/:id/toggle-status', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only admins can toggle user status' });
  }

  const userId = req.params.id;

  db.run(
    'UPDATE users SET is_active = NOT is_active WHERE id = ?',
    [userId],
    function(err) {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({ message: 'User status updated successfully' });
    }
  );
});

export default router;