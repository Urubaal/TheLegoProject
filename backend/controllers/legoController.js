const LegoSet = require('../models/LegoSet');
const UserCollection = require('../models/UserCollection');
const OlxOffer = require('../models/OlxOffer');
const { validationResult } = require('express-validator');

class LegoController {
  // Get all LEGO sets with pagination and filtering
  static async getAllSets(req, res) {
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
      console.error('Error getting LEGO sets:', error);
      res.status(500).json({
        success: false,
        error: 'Błąd podczas pobierania zestawów LEGO'
      });
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

      const collection = await UserCollection.getUserCollection(userId, type);
      const stats = await UserCollection.getCollectionStats(userId);

      res.json({
        success: true,
        data: {
          collection,
          stats
        }
      });
    } catch (error) {
      console.error('Error getting user collection:', error);
      res.status(500).json({
        success: false,
        error: 'Błąd podczas pobierania kolekcji'
      });
    }
  }

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
        minPrice,
        maxPrice,
        condition,
        location
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
}

module.exports = LegoController;
