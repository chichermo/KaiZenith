import express from 'express';
import { query, validationResult } from 'express-validator';
import { authenticateToken } from './auth-simple';
import { aiSearchService } from '../services/ai-search.service';

const router = express.Router();

// Inicializar índice al cargar
aiSearchService.initializeIndex().catch(console.error);

/**
 * Búsqueda inteligente con IA
 */
router.get('/search', authenticateToken, [
  query('q').notEmpty().trim(),
  query('category').optional().isString(),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('price_min').optional().isFloat({ min: 0 }),
  query('price_max').optional().isFloat({ min: 0 }),
  query('suppliers').optional().isString(),
], async (req: express.Request, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: 'Parámetros inválidos' });
    }

    const { q, category, limit, price_min, price_max, suppliers } = req.query;

    const results = await aiSearchService.intelligentSearch(
      q as string,
      category as string | undefined,
      {
        limit: limit ? parseInt(limit as string) : 50,
        priceMin: price_min ? parseFloat(price_min as string) : undefined,
        priceMax: price_max ? parseFloat(price_max as string) : undefined,
        suppliers: suppliers ? (suppliers as string).split(',') : undefined,
      }
    );

    res.json({
      success: true,
      data: results,
    });
  } catch (error: any) {
    console.error('Error in AI search:', error);
    res.status(500).json({ success: false, error: 'Error en búsqueda inteligente' });
  }
});

/**
 * Búsqueda por descripción de imagen
 */
router.post('/search-by-image', authenticateToken, [
  query('description').notEmpty().trim(),
], async (req: express.Request, res: express.Response) => {
  try {
    const { description } = req.body;

    const results = await aiSearchService.searchByImageDescription(description);

    res.json({
      success: true,
      data: results,
    });
  } catch (error: any) {
    console.error('Error in image search:', error);
    res.status(500).json({ success: false, error: 'Error en búsqueda por imagen' });
  }
});

/**
 * Obtener recomendaciones
 */
router.get('/recommendations', authenticateToken, [
  query('userId').notEmpty(),
], async (req: express.Request, res: express.Response) => {
  try {
    const { userId } = req.query;
    
    // TODO: Obtener historial real del usuario
    const purchaseHistory: any[] = []; // await getPurchaseHistory(userId as string);

    const recommendations = await aiSearchService.getRecommendations(
      userId as string,
      purchaseHistory
    );

    res.json({
      success: true,
      data: recommendations,
    });
  } catch (error: any) {
    console.error('Error getting recommendations:', error);
    res.status(500).json({ success: false, error: 'Error obteniendo recomendaciones' });
  }
});

/**
 * Indexar productos (para Meilisearch)
 */
router.post('/index-products', authenticateToken, async (req: express.Request, res: express.Response) => {
  try {
    const { products } = req.body;

    if (!Array.isArray(products)) {
      return res.status(400).json({ success: false, error: 'products debe ser un array' });
    }

    await aiSearchService.indexProducts(products);

    res.json({
      success: true,
      message: `${products.length} productos indexados`,
    });
  } catch (error: any) {
    console.error('Error indexing products:', error);
    res.status(500).json({ success: false, error: 'Error indexando productos' });
  }
});

export default router;

