import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';
import authRoutes from './routes/auth.js';
import quotesRoutes from './routes/quotes.js';
import proposalsRoutes from './routes/proposals.js';
import usersRoutes from './routes/users.js';
import financialRoutes from './routes/financial.js';
import { initializeDatabase } from './database/init.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create upload directory if it doesn't exist
const uploadDir = path.join(__dirname, '../upload');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Serve uploaded files
app.use('/upload', express.static(uploadDir));

// Initialize database
await initializeDatabase();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/quotes', quotesRoutes);
app.use('/api/proposals', proposalsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/financial', financialRoutes);

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});