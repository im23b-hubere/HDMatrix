import express from 'express';
import { AIService } from '../services/ai-service';

const router = express.Router();
const aiService = new AIService();

// Route zum Extrahieren von CV-Daten aus Text
router.post('/extract-cv', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Kein Text bereitgestellt' });
    }

    const cv = await aiService.extractCVFromText(text);
    res.json(cv);
  } catch (error) {
    console.error('Fehler bei der CV-Extraktion:', error);
    res.status(500).json({ error: 'Interner Server-Fehler bei der CV-Extraktion' });
  }
});

// Route zum Verbessern von CV-Daten
router.post('/enhance-cv', async (req, res) => {
  try {
    const { cv } = req.body;
    if (!cv) {
      return res.status(400).json({ error: 'Keine CV-Daten bereitgestellt' });
    }

    const enhancedCV = await aiService.enhanceCV(cv);
    res.json(enhancedCV);
  } catch (error) {
    console.error('Fehler bei der CV-Verbesserung:', error);
    res.status(500).json({ error: 'Interner Server-Fehler bei der CV-Verbesserung' });
  }
});

export default router; 