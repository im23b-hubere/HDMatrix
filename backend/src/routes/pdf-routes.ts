import express, { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { PDFService } from '../services/pdf-service';

const router = express.Router();
const pdfService = new PDFService();

// Multer-Konfiguration für den Datei-Upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB Limit
  },
  fileFilter: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    console.log('Empfangene Datei:', file.originalname, 'Typ:', file.mimetype);
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Nur PDF-Dateien sind erlaubt'));
    }
  },
});

// Error Handler für Multer
const handleMulterError = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'Datei ist zu groß (Max: 10MB)' });
    }
    return res.status(400).json({ error: err.message });
  }
  if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
};

// Route zum Extrahieren von Text aus einer PDF
router.post(
  '/extract-text',
  (req: Request, res: Response, next: NextFunction) => {
    console.log('PDF-Route aufgerufen');
    next();
  },
  upload.single('file'),
  handleMulterError,
  async (req: Request, res: Response) => {
    try {
      console.log('PDF-Upload-Anfrage empfangen');
      
      if (!req.file) {
        console.log('Keine Datei im Request gefunden');
        return res.status(400).json({ error: 'Keine Datei hochgeladen' });
      }

      console.log('Verarbeite PDF:', req.file.originalname);
      const text = await pdfService.extractText(req.file.buffer);
      
      console.log('PDF erfolgreich verarbeitet, sende Antwort');
      res.json({ text });
    } catch (error) {
      console.error('Fehler bei der PDF-Verarbeitung:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Fehler bei der PDF-Verarbeitung' 
      });
    }
  }
);

export default router; 