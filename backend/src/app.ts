import express from 'express';
import cors from 'cors';
import aiRoutes from './routes/ai-routes';
import pdfRoutes from './routes/pdf-routes';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routen
app.use('/api/ai', aiRoutes);
app.use('/api/pdf', pdfRoutes);

// Error Handler Middleware (muss nach den Routen sein)
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: err.message || 'Interner Server-Fehler' });
});

const PORT = process.env.PORT || 5000;

// Server starten
const server = app.listen(PORT, () => {
  console.log(`Server läuft auf Port ${PORT}`);
  console.log('Verfügbare Routen:');
  console.log('- POST /api/pdf/extract-text');
  console.log('- POST /api/ai/extract-cv');
  console.log('- POST /api/ai/enhance-cv');
}); 