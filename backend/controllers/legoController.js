const LegoSet = require('../models/LegoSet');
const UserCollection = require('../models/UserCollection');
const OlxOffer = require('../models/OlxOffer');
const { validationResult } = require('express-validator');
const { info, warn, error, performance } = require('../utils/logger');
const redisService = require('../utils/redisService');
const { AppError, asyncHandler } = require('../middleware/errorHandler');

// Helper function to invalidate user collection cache
async function invalidateUserCollectionCache(userId) {
  try {
    const deletedCount = await redisService.invalidateUserCollectionCache(userId);
    console.log(`Invalidated ${deletedCount} collection cache entries for user ${userId}`);
  } catch (error) {
    console.error('Failed to invalidate collection cache:', error.message);
    throw error; // Rzuć błąd zamiast ignorować
  }
}
class LegoController {
  /**
   * @swagger
   * /api/lego/sets:
   *   get:
   *     summary: Get all LEGO sets with pagination and filtering
   *     tags: [LEGO Sets]
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           default: 1
   *         description: Page number for pagination
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 20
   *         description: Number of items per page
   *       - in: query
   *         name: theme
   *         schema:
   *           type: string
   *         description: Filter by theme
   *       - in: query
   *         name: year
   *         schema:
   *           type: integer
   *         description: Filter by year
   *       - in: query
   *         name: search
   *         schema:
   *           type: string
   *         description: Search term
   *       - in: query
   *         name: sortBy
   *         schema:
   *           type: string
   *           default: set_number
   *         description: Sort field
   *       - in: query
   *         name: sortOrder
   *         schema:
   *           type: string
   *           default: ASC
   *           enum: [ASC, DESC]
   *         description: Sort order
   *     responses:
   *       200:
   *         description: List of LEGO sets
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *                   properties:
   *                     sets:
   *                       type: array
   *                       items:
   *                         $ref: '#/components/schemas/LegoSet'
   *                     pagination:
   *                       type: object
   *                       properties:
   *                         currentPage:
   *                           type: integer
   *                         totalPages:
   *                           type: integer
   *                         totalItems:
   *                           type: integer
   *                         itemsPerPage:
   *                           type: integer
   *       500:
   *         description: Server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  // Get all LEGO sets with pagination and filtering
  static async getAllSets(req, res) {
    const startTime = Date.now();
    
    try {
      const { 
        page = 1, 
        limit = 20, 
        theme, 
        year, 
        search,
        sortBy = 'set_number',
        sortOrder = 'ASC'
      } = req.query;

      info('Fetching LEGO sets with filters', { 
        page, limit, theme, year, search, 
        userId: req.user?.userId,
        ip: req.ip 
      });

      const offset = (page - 1) * limit;
      const options = {
        theme,
        year,
        limit: parseInt(limit),
        offset: parseInt(offset),
        sortBy,
        sortOrder
      };

      let sets;
      if (search) {
        sets = await LegoSet.search(search, options);
      } else {
        sets = await LegoSet.findAll(options);
      }

      // Get total count for pagination
      const totalQuery = search 
        ? 'SELECT COUNT(*) FROM lego_sets WHERE name ILIKE $1 OR set_number ILIKE $1 OR theme ILIKE $1'
        : 'SELECT COUNT(*) FROM lego_sets WHERE 1=1';
      
      let totalCount;
      const { Pool } = require('pg');
      const pool = new Pool({
        user: process.env.POSTGRES_USER || 'lego_user',
        host: process.env.POSTGRES_HOST || 'localhost',
        database: process.env.POSTGRES_DB || 'lego_purchase_system',
        port: process.env.POSTGRES_PORT || 5432,
      });
      
      if (search) {
        const countResult = await pool.query(totalQuery, [`%${search}%`]);
        totalCount = parseInt(countResult.rows[0].count);
      } else {
        const countResult = await pool.query(totalQuery);
        totalCount = parseInt(countResult.rows[0].count);
      }

      res.json({
        success: true,
        data: {
          sets,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalCount / limit),
            totalItems: totalCount,
            itemsPerPage: parseInt(limit)
          }
        }
      });
    } catch (error) {
      error('Error getting LEGO sets', { error: error.message, stack: error.stack });
      throw new AppError('Błąd podczas pobierania zestawów LEGO', 500);
    } finally {
      const duration = Date.now() - startTime;
      performance('LEGO sets fetch', duration, { userId: req.user?.userId });
    }
  }

  // Get single LEGO set by set number
  static async getSetByNumber(req, res) {
    try {
      const { setNumber } = req.params;
      const set = await LegoSet.findBySetNumber(setNumber);

      if (!set) {
        return res.status(404).json({
          success: false,
          error: 'Zestaw LEGO nie został znaleziony'
        });
      }

      // Get offers for this set
      const offers = await OlxOffer.findBySetNumber(setNumber, {
        activeOnly: true,
        limit: 10,
        sortBy: 'price',
        sortOrder: 'ASC'
      });

      // Get price statistics
      const priceStats = await OlxOffer.getPriceStats(setNumber);

      res.json({
        success: true,
        data: {
          set,
          offers,
          priceStats
        }
      });
    } catch (error) {
      console.error('Error getting LEGO set:', error);
      res.status(500).json({
        success: false,
        error: 'Błąd podczas pobierania zestawu LEGO'
      });
    }
  }

  // Create new LEGO set (admin only)
  static async createSet(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Nieprawidłowe dane',
          details: errors.array()
        });
      }

      const setData = req.body;
      const newSet = await LegoSet.create(setData);

      res.status(201).json({
        success: true,
        data: newSet,
        message: 'Zestaw LEGO został utworzony pomyślnie'
      });
    } catch (error) {
      console.error('Error creating LEGO set:', error);
      if (error.code === '23505') { // Unique constraint violation
        res.status(409).json({
          success: false,
          error: 'Zestaw o tym numerze już istnieje'
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Błąd podczas tworzenia zestawu LEGO'
        });
      }
    }
  }

  // Update LEGO set (admin only)
  static async updateSet(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Nieprawidłowe dane',
          details: errors.array()
        });
      }

      const { id } = req.params;
      const updateData = req.body;
      
      const updatedSet = await LegoSet.update(id, updateData);

      if (!updatedSet) {
        return res.status(404).json({
          success: false,
          error: 'Zestaw LEGO nie został znaleziony'
        });
      }

      res.json({
        success: true,
        data: updatedSet,
        message: 'Zestaw LEGO został zaktualizowany pomyślnie'
      });
    } catch (error) {
      console.error('Error updating LEGO set:', error);
      res.status(500).json({
        success: false,
        error: 'Błąd podczas aktualizacji zestawu LEGO'
      });
    }
  }

  // Delete LEGO set (admin only)
  static async deleteSet(req, res) {
    try {
      const { id } = req.params;
      const deleted = await LegoSet.delete(id);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: 'Zestaw LEGO nie został znaleziony'
        });
      }

      res.json({
        success: true,
        message: 'Zestaw LEGO został usunięty pomyślnie'
      });
    } catch (error) {
      console.error('Error deleting LEGO set:', error);
      res.status(500).json({
        success: false,
        error: 'Błąd podczas usuwania zestawu LEGO'
      });
    }
  }

  // Get themes for filtering
  static async getThemes(req, res) {
    try {
      const themes = await LegoSet.getThemes();
      res.json({
        success: true,
        data: themes
      });
    } catch (error) {
      console.error('Error getting themes:', error);
      res.status(500).json({
        success: false,
        error: 'Błąd podczas pobierania motywów'
      });
    }
  }

  // Get years for filtering
  static async getYears(req, res) {
    try {
      const years = await LegoSet.getYears();
      res.json({
        success: true,
        data: years
      });
    } catch (error) {
      console.error('Error getting years:', error);
      res.status(500).json({
        success: false,
        error: 'Błąd podczas pobierania lat'
      });
    }
  }

  // Get LEGO sets statistics
  static async getStats(req, res) {
    try {
      const stats = await LegoSet.getStats();
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error getting LEGO stats:', error);
      res.status(500).json({
        success: false,
        error: 'Błąd podczas pobierania statystyk'
      });
    }
  }

  // Add set to user collection
  static async addToCollection(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Nieprawidłowe dane',
          details: errors.array()
        });
      }

      const userId = req.user.id;
      const { setNumber, collectionType, quantity = 1, paidPrice, condition = 'new', notes = '' } = req.body;

      // Verify set exists
      const set = await LegoSet.findBySetNumber(setNumber);
      if (!set) {
        return res.status(404).json({
          success: false,
          error: 'Zestaw LEGO nie został znaleziony'
        });
      }

      const collectionItem = await UserCollection.addToCollection(
        userId,
        setNumber,
        collectionType, 
        quantity,
        paidPrice,
        condition,
        notes
      );

      // Invalidate cache for this user
      await invalidateUserCollectionCache(userId);

      res.json({
        success: true,
        data: collectionItem,
        message: `Zestaw został dodany do kolekcji jako ${collectionType === 'owned' ? 'posiadany' : 'pożądany'}`
      });
    } catch (error) {
      console.error('Error adding to collection:', error);
      res.status(500).json({
        success: false,
        error: 'Błąd podczas dodawania do kolekcji'
      });
    }
  }

  // Remove set from user collection
  static async removeFromCollection(req, res) {
    try {
      const userId = req.user.id;
      const { setNumber, collectionType } = req.params;

      const removed = await UserCollection.removeFromCollection(userId, setNumber, collectionType);

      if (!removed) {
        return res.status(404).json({
          success: false,
          error: 'Element nie został znaleziony w kolekcji'
        });
      }

      // Invalidate cache for this user
      await invalidateUserCollectionCache(userId);

      res.json({
        success: true,
        message: 'Element został usunięty z kolekcji'
      });
    } catch (error) {
      console.error('Error removing from collection:', error);
      res.status(500).json({
        success: false,
        error: 'Błąd podczas usuwania z kolekcji'
      });
    }
  }

  // Get user collection
  static async getUserCollection(req, res) {
    try {
      const userId = req.user.id;
      const { type } = req.query; // 'owned', 'wanted', or null for all

      // Try to get from Redis cache first
      let cachedData = null;
      
      try {
        cachedData = await redisService.getCollectionCache(userId, type || 'all');
      } catch (redisError) {
        console.error('Redis cache error:', redisError.message);
        throw redisError; // Rzuć błąd zamiast ignorować
      }
      
      if (cachedData) {
        console.log('Returning cached collection data');
        return res.json({
          success: true,
          data: cachedData,
          cached: true
        });
      }

      // If not in cache, get from database
      const collection = await UserCollection.getUserCollection(userId, type);
      const stats = await UserCollection.getCollectionStats(userId);

      const responseData = {
        collection,
        stats
      };
      
      // Cache the result for 5 minutes
      try {
        await redisService.setCollectionCache(userId, type || 'all', responseData, 300); // 5 minutes
      } catch (redisError) {
        console.error('Failed to cache collection data:', redisError.message);
        throw redisError; // Rzuć błąd zamiast ignorować
      }

      res.json({
        success: true,
        data: responseData,
        cached: false
      });
    } catch (error) {
      console.error('Error getting user collection:', error);
      res.status(500).json({
        success: false,
        error: 'Błąd podczas pobierania kolekcji'
      });
    }
  }

  /**
   * @swagger
   * /api/lego/sets/{setNumber}/offers:
   *   get:
   *     summary: Get OLX offers for a specific LEGO set
   *     tags: [OLX Offers]
   *     parameters:
   *       - in: path
   *         name: setNumber
   *         required: true
   *         schema:
   *           type: string
   *         description: LEGO set number
   *         example: "75399-1"
   *       - in: query
   *         name: activeOnly
   *         schema:
   *           type: boolean
   *           default: true
   *         description: Show only active offers
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 20
   *         description: Number of items per page
   *       - in: query
   *         name: offset
   *         schema:
   *           type: integer
   *           default: 0
   *         description: Number of items to skip
   *       - in: query
   *         name: sortBy
   *         schema:
   *           type: string
   *           default: price
   *         description: Sort field
   *       - in: query
   *         name: sortOrder
   *         schema:
   *           type: string
   *           default: ASC
   *           enum: [ASC, DESC]
   *         description: Sort order
   *     responses:
   *       200:
   *         description: List of offers for the specified set
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *                   properties:
   *                     set:
   *                       $ref: '#/components/schemas/LegoSet'
   *                     offers:
   *                       type: array
   *                       items:
   *                         $ref: '#/components/schemas/OlxOffer'
   *                     priceStats:
   *                       type: object
   *                       properties:
   *                         total_offers:
   *                           type: integer
   *                         min_price:
   *                           type: number
   *                         max_price:
   *                           type: number
   *                         avg_price:
   *                           type: number
   *                         median_price:
   *                           type: number
   *                         active_offers:
   *                           type: integer
   *                     offersByCondition:
   *                       type: array
   *                       items:
   *                         type: object
   *                         properties:
   *                           condition:
   *                             type: string
   *                           count:
   *                             type: integer
   *                           min_price:
   *                             type: number
   *                           max_price:
   *                             type: number
   *                           avg_price:
   *                             type: number
   *                     offersByLocation:
   *                       type: array
   *                       items:
   *                         type: object
   *                         properties:
   *                           location:
   *                             type: string
   *                           count:
   *                             type: integer
   *                           min_price:
   *                             type: number
   *                           max_price:
   *                             type: number
   *                           avg_price:
   *                             type: number
   *       404:
   *         description: LEGO set not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       500:
   *         description: Server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  // Get OLX offers for a specific set
  static async getSetOffers(req, res) {
    try {
      const { setNumber } = req.params;
      const { 
        activeOnly = true, 
        limit = 20, 
        offset = 0, 
        sortBy = 'price', 
        sortOrder = 'ASC',
      } = req.query;

      // Verify set exists
      const set = await LegoSet.findBySetNumber(setNumber);
      if (!set) {
        return res.status(404).json({
          success: false,
          error: 'Zestaw LEGO nie został znaleziony'
        });
      }

      const offers = await OlxOffer.findBySetNumber(setNumber, {
        activeOnly: activeOnly === 'true',
        limit: parseInt(limit),
        offset: parseInt(offset),
        sortBy,
        sortOrder: sortOrder.toUpperCase()
      });

      // Get price statistics
      const priceStats = await OlxOffer.getPriceStats(setNumber);
      const offersByCondition = await OlxOffer.getOffersByCondition(setNumber);
      const offersByLocation = await OlxOffer.getOffersByLocation(setNumber);

      res.json({
        success: true,
        data: {
          set,
          offers,
          priceStats,
          offersByCondition,
          offersByLocation
        }
      });
    } catch (error) {
      console.error('Error getting set offers:', error);
      res.status(500).json({
        success: false,
        error: 'Błąd podczas pobierania ofert'
      });
    }
  }

  /**
   * @swagger
   * /api/lego/offers:
   *   get:
   *     summary: Get all OLX offers with pagination
   *     tags: [OLX Offers]
   *     parameters:
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 20
   *         description: Number of items per page
   *       - in: query
   *         name: offset
   *         schema:
   *           type: integer
   *           default: 0
   *         description: Number of items to skip
   *       - in: query
   *         name: sortBy
   *         schema:
   *           type: string
   *           default: created_at
   *         description: Sort field
   *       - in: query
   *         name: sortOrder
   *         schema:
   *           type: string
   *           default: DESC
   *           enum: [ASC, DESC]
   *         description: Sort order
   *     responses:
   *       200:
   *         description: List of OLX offers
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *                   properties:
   *                     offers:
   *                       type: array
   *                       items:
   *                         $ref: '#/components/schemas/OlxOffer'
   *                     totalCount:
   *                       type: integer
   *                     currentPage:
   *                       type: integer
   *                     totalPages:
   *                       type: integer
   *       500:
   *         description: Server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  // Get all offers (for deals modal)
  static async getAllOffers(req, res) {
    try {
      const { 
        limit = 20, 
        offset = 0, 
        sortBy = 'created_at', 
        sortOrder = 'DESC',
      } = req.query;

      const options = {
        limit: parseInt(limit),
        offset: parseInt(offset),
        sortBy,
        sortOrder,
        activeOnly: true
      };

      const offers = await OlxOffer.findAll(options);
      const totalCount = await OlxOffer.count(options);

      res.json({
        success: true,
        data: {
          offers,
          totalCount,
          currentPage: Math.floor(offset / limit) + 1,
          totalPages: Math.ceil(totalCount / limit)
        }
      });
    } catch (error) {
      console.error('Error fetching all offers:', error);
      res.status(500).json({
        success: false,
        error: 'Błąd podczas pobierania ofert'
      });
    }
  }
}

module.exports = LegoController;
