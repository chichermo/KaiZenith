import OpenAI from 'openai';
import { MeiliSearch } from 'meilisearch';
import { createClient } from 'redis';

// Configuración
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

const meilisearch = new MeiliSearch({
  host: process.env.MEILISEARCH_HOST || 'http://localhost:7700',
  apiKey: process.env.MEILISEARCH_MASTER_KEY || '',
});

let redis: ReturnType<typeof createClient> | null = null;

try {
  redis = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  });
  redis.on('error', (err) => console.error('Redis Client Error', err));
  redis.connect().catch(console.error);
} catch (error) {
  console.warn('Redis no disponible, usando cache en memoria');
}

// Tipos
interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  supplier: string;
  [key: string]: any;
}

interface SearchResult {
  products: Product[];
  query: string;
  expandedTerms: string[];
  suggestedCategory?: string;
  total: number;
  searchTime: number;
}

/**
 * Servicio de Búsqueda Inteligente con IA
 */
export class AISearchService {
  private indexName = 'products';

  /**
   * Inicializar índice de Meilisearch
   */
  async initializeIndex() {
    try {
      const index = meilisearch.index(this.indexName);
      
      // Configurar filtros y ordenamiento
      await index.updateSettings({
        searchableAttributes: ['name', 'description', 'category', 'brand'],
        filterableAttributes: ['category', 'supplier', 'price', 'available'],
        sortableAttributes: ['price', 'rating', 'created_at'],
        rankingRules: [
          'words',
          'typo',
          'proximity',
          'attribute',
          'sort',
          'exactness'
        ],
        synonyms: {
          'cemento': ['hormigón', 'concreto', 'mezcla'],
          'teja': ['tejuela', 'teja asfáltica'],
          'ladrillo': ['bloque', 'tabique'],
        }
      });

      console.log('✅ Meilisearch index initialized');
    } catch (error) {
      console.error('Error initializing Meilisearch:', error);
    }
  }

  /**
   * Expandir búsqueda con sinónimos usando IA
   */
  async expandQueryWithAI(query: string): Promise<string[]> {
    try {
      // Verificar cache
      if (redis) {
        const cacheKey = `query_expand:${query.toLowerCase()}`;
        const cached = await redis.get(cacheKey);
        if (cached) {
          return JSON.parse(cached);
        }
      }

      // Usar OpenAI para expandir términos
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'Eres un asistente que ayuda a expandir términos de búsqueda para materiales de construcción en Chile. Responde solo con un array JSON de términos relacionados, sin explicaciones.'
          },
          {
            role: 'user',
            content: `Dame sinónimos y términos relacionados para: "${query}". Incluye variaciones comunes en Chile.`
          }
        ],
        temperature: 0.3,
        max_tokens: 100,
      });

      const response = completion.choices[0].message.content;
      let expandedTerms: string[] = [query];

      try {
        const terms = JSON.parse(response || '[]');
        expandedTerms = [query, ...terms].slice(0, 10);
      } catch {
        // Si falla el parse, usar solo el término original
        expandedTerms = [query];
      }

      // Cachear por 24 horas
      if (redis) {
        await redis.setEx(cacheKey, 86400, JSON.stringify(expandedTerms));
      }

      return expandedTerms;
    } catch (error) {
      console.error('Error expanding query with AI:', error);
      return [query];
    }
  }

  /**
   * Clasificar categoría automáticamente con IA
   */
  async classifyCategoryWithAI(query: string): Promise<string | null> {
    try {
      if (redis) {
        const cacheKey = `category:${query.toLowerCase()}`;
        const cached = await redis.get(cacheKey);
        if (cached) return cached;
      }

      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'Clasifica términos de construcción en categorías: materiales, herramientas, acabados, electricidad, plomería, otros. Responde solo con la categoría.'
          },
          {
            role: 'user',
            content: `¿A qué categoría pertenece "${query}"?`
          }
        ],
        temperature: 0.2,
        max_tokens: 20,
      });

      const category = completion.choices[0].message.content?.trim() || null;

      if (category && redis) {
        await redis.setEx(cacheKey, 86400, category);
      }

      return category;
    } catch (error) {
      console.error('Error classifying category:', error);
      return null;
    }
  }

  /**
   * Búsqueda inteligente principal
   */
  async intelligentSearch(
    query: string,
    category?: string,
    filters?: any
  ): Promise<SearchResult> {
    const startTime = Date.now();

    try {
      // 1. Expandir términos con IA
      const expandedTerms = await this.expandQueryWithAI(query);

      // 2. Clasificar categoría si no se proporciona
      const suggestedCategory = category || await this.classifyCategoryWithAI(query);

      // 3. Buscar en Meilisearch con términos expandidos
      const index = meilisearch.index(this.indexName);
      
      const searchOptions: any = {
        limit: filters?.limit || 50,
        filter: [],
      };

      if (suggestedCategory) {
        searchOptions.filter.push(`category = "${suggestedCategory}"`);
      }

      if (filters?.priceMin) {
        searchOptions.filter.push(`price >= ${filters.priceMin}`);
      }

      if (filters?.priceMax) {
        searchOptions.filter.push(`price <= ${filters.priceMax}`);
      }

      if (filters?.suppliers && filters.suppliers.length > 0) {
        searchOptions.filter.push(`supplier IN [${filters.suppliers.map((s: string) => `"${s}"`).join(', ')}]`);
      }

      searchOptions.filter = searchOptions.filter.join(' AND ');

      // Buscar con el término principal (Meilisearch maneja typos automáticamente)
      const searchResults = await index.search(query, searchOptions);

      // 4. Re-rankear resultados con IA si hay muchos resultados
      let products = searchResults.hits as Product[];
      
      if (products.length > 10) {
        products = await this.rerankWithAI(query, products);
      }

      const searchTime = Date.now() - startTime;

      return {
        products,
        query,
        expandedTerms,
        suggestedCategory: suggestedCategory || undefined,
        total: searchResults.estimatedTotalHits || products.length,
        searchTime,
      };
    } catch (error) {
      console.error('Error in intelligent search:', error);
      throw error;
    }
  }

  /**
   * Re-rankear resultados con IA para mejor relevancia
   */
  private async rerankWithAI(query: string, products: Product[]): Promise<Product[]> {
    try {
      // Tomar solo los primeros 20 para re-ranking (más rápido)
      const topProducts = products.slice(0, 20);

      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'Eres un asistente que ordena productos por relevancia. Responde solo con un array JSON de IDs en orden de relevancia.'
          },
          {
            role: 'user',
            content: `Ordena estos productos por relevancia para la búsqueda "${query}":\n${JSON.stringify(topProducts.map(p => ({ id: p.id, name: p.name, description: p.description })), null, 2)}`
          }
        ],
        temperature: 0.1,
        max_tokens: 200,
      });

      const response = completion.choices[0].message.content;
      try {
        const rankedIds = JSON.parse(response || '[]');
        const rankedMap = new Map(rankedIds.map((id: string, index: number) => [id, index]));
        
        return topProducts.sort((a, b) => {
          const rankA = rankedMap.get(a.id) ?? 999;
          const rankB = rankedMap.get(b.id) ?? 999;
          return rankA - rankB;
        });
      } catch {
        return topProducts;
      }
    } catch (error) {
      console.error('Error reranking:', error);
      return products;
    }
  }

  /**
   * Indexar productos en Meilisearch
   */
  async indexProducts(products: Product[]) {
    try {
      const index = meilisearch.index(this.indexName);
      await index.addDocuments(products, { primaryKey: 'id' });
      console.log(`✅ Indexed ${products.length} products`);
    } catch (error) {
      console.error('Error indexing products:', error);
      throw error;
    }
  }

  /**
   * Búsqueda por imagen (usando descripción generada por IA)
   */
  async searchByImageDescription(description: string): Promise<SearchResult> {
    // Usar la descripción generada por Vision API para buscar
    return this.intelligentSearch(description);
  }

  /**
   * Obtener recomendaciones basadas en historial
   */
  async getRecommendations(userId: string, purchaseHistory: any[]): Promise<Product[]> {
    try {
      // Analizar patrones de compra
      const categories = purchaseHistory.map(item => item.category);
      const frequentCategory = this.mostFrequent(categories);

      // Buscar productos relacionados
      const results = await this.intelligentSearch(frequentCategory || 'materiales');
      
      return results.products.slice(0, 10);
    } catch (error) {
      console.error('Error getting recommendations:', error);
      return [];
    }
  }

  private mostFrequent(arr: string[]): string | null {
    if (arr.length === 0) return null;
    const frequency: { [key: string]: number } = {};
    arr.forEach(item => {
      frequency[item] = (frequency[item] || 0) + 1;
    });
    return Object.keys(frequency).reduce((a, b) => 
      frequency[a] > frequency[b] ? a : b
    );
  }
}

export const aiSearchService = new AISearchService();

