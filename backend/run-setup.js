const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Database connection
const pool = new Pool({
  user: process.env.POSTGRES_USER || 'lego_user',
  host: process.env.POSTGRES_HOST || 'localhost',
  database: process.env.POSTGRES_DB || 'lego_purchase_system',
  port: process.env.POSTGRES_PORT || 5432,
  password: process.env.POSTGRES_PASSWORD || 'lego_password'
});

async function runSetup() {
  try {
    console.log('Setting up database...');
    
    // Read migration file
    const migrationPath = path.join(__dirname, 'migrations', 'create_lego_tables.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('Running migration...');
    await pool.query(migrationSQL);
    
    console.log('Migration completed successfully!');
    
    // Check if data was inserted
    const setsResult = await pool.query('SELECT COUNT(*) FROM lego_sets');
    const offersResult = await pool.query('SELECT COUNT(*) FROM olx_offers');
    
    console.log(`Sets in database: ${setsResult.rows[0].count}`);
    console.log(`Offers in database: ${offersResult.rows[0].count}`);
    
    // If no data, add sample data
    if (parseInt(setsResult.rows[0].count) === 0) {
      console.log('No data found, adding sample data...');
      
      // Add sample sets
      const sets = [
        {
          setNumber: '75399-1',
          name: 'Rebel U-Wing Starfighter',
          theme: 'Star Wars',
          year: 2024,
          pieces: 1065,
          retailPrice: 79.99,
          description: 'The Rebel U-Wing Starfighter is a versatile craft used by the Rebel Alliance for troop transport and combat missions.'
        },
        {
          setNumber: '75313-1',
          name: 'AT-AT',
          theme: 'Star Wars',
          year: 2023,
          pieces: 1267,
          retailPrice: 169.99,
          description: 'Build the ultimate AT-AT model with this impressive LEGO Star Wars set.'
        }
      ];
      
      for (const setData of sets) {
        try {
          await pool.query(`
            INSERT INTO lego_sets (set_number, name, theme, year, pieces, retail_price, description)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (set_number) DO NOTHING
          `, [setData.setNumber, setData.name, setData.theme, setData.year, setData.pieces, setData.retailPrice, setData.description]);
          console.log(`Added set: ${setData.setNumber} - ${setData.name}`);
        } catch (error) {
          console.error(`Error adding set ${setData.setNumber}:`, error.message);
        }
      }
      
      // Add sample offers
      const offers = [
        {
          setNumber: '75399-1',
          title: 'LEGO Star Wars Rebel U-Wing Starfighter 75399 - NOWY',
          price: 65,
          condition: 'Nowy',
          location: 'Warszawa',
          sellerName: 'LEGO_Fan_123',
          sellerRating: 4.8,
          offerUrl: 'https://www.olx.pl/d/oferta/lego-star-wars-75399-ID12345678.html',
          description: 'Zestaw w oryginalnym opakowaniu, nieotwarty'
        },
        {
          setNumber: '75399-1',
          title: 'LEGO Star Wars 75399 U-Wing - używany',
          price: 45,
          condition: 'Używany',
          location: 'Kraków',
          sellerName: 'Collector_456',
          sellerRating: 4.5,
          offerUrl: 'https://www.olx.pl/d/oferta/lego-75399-uzywany-ID12345679.html',
          description: 'Zestaw używany, kompletny, w bardzo dobrym stanie'
        },
        {
          setNumber: '75313-1',
          title: 'LEGO Star Wars 75313 AT-AT',
          price: 180,
          condition: 'Nowy',
          location: 'Warszawa',
          sellerName: 'LEGO_Store_Warsaw',
          sellerRating: 4.9,
          offerUrl: 'https://www.olx.pl/d/oferta/lego-at-at-75313-ID12345681.html',
          description: 'Nowy zestaw AT-AT, oryginalne opakowanie'
        }
      ];
      
      for (const offerData of offers) {
        try {
          await pool.query(`
            INSERT INTO olx_offers (set_number, title, price, condition, location, seller_name, seller_rating, offer_url, description)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            ON CONFLICT (offer_url) DO NOTHING
          `, [offerData.setNumber, offerData.title, offerData.price, offerData.condition, offerData.location, offerData.sellerName, offerData.sellerRating, offerData.offerUrl, offerData.description]);
          console.log(`Added offer: ${offerData.title}`);
        } catch (error) {
          console.error('Error adding offer:', error.message);
        }
      }
    }
    
    console.log('Setup completed successfully!');
    
  } catch (error) {
    console.error('Setup failed:', error);
  } finally {
    await pool.end();
  }
}

runSetup();
