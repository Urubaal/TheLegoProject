const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.POSTGRES_USER || 'lego_user',
  host: process.env.POSTGRES_HOST || 'localhost',
  database: process.env.POSTGRES_DB || 'lego_purchase_system',
  password: process.env.POSTGRES_PASSWORD || '',
  port: process.env.POSTGRES_PORT || 5432,
});

async function createOlxTable() {
  try {
    console.log('Connecting to local database...');
    
    // Sprawdź czy tabela istnieje
    const checkTable = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'olx_offers'
      );
    `);
    
    console.log('Table exists:', checkTable.rows[0].exists);
    
    if (!checkTable.rows[0].exists) {
      console.log('Creating olx_offers table...');
      
      const createTableQuery = `
        CREATE TABLE olx_offers (
          id SERIAL PRIMARY KEY,
          set_number VARCHAR(20) NOT NULL,
          title VARCHAR(500) NOT NULL,
          price NUMERIC(10,2) NOT NULL,
          condition VARCHAR(100),
          location VARCHAR(200),
          seller_name VARCHAR(200),
          seller_rating NUMERIC(3,2),
          offer_url TEXT NOT NULL UNIQUE,
          image_url TEXT,
          description TEXT,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `;
      
      await pool.query(createTableQuery);
      console.log('Table created successfully!');
      
      // Dodaj indeksy
      const indexes = [
        'CREATE INDEX idx_olx_offers_set_number ON olx_offers(set_number);',
        'CREATE INDEX idx_olx_offers_price ON olx_offers(price);',
        'CREATE INDEX idx_olx_offers_location ON olx_offers(location);',
        'CREATE INDEX idx_olx_offers_active ON olx_offers(is_active);',
        'CREATE INDEX idx_olx_offers_created_at ON olx_offers(created_at);'
      ];
      
      for (const index of indexes) {
        await pool.query(index);
      }
      console.log('Indexes created successfully!');
    }
    
    // Dodaj przykładowe dane
    console.log('Adding sample data...');
    const sampleData = [
      ['75399-1', 'LEGO Star Wars Rebel U-Wing Starfighter 75399 - NOWY', 45.00, 'nowy', 'Warszawa', 'LEGO_Fan_123', 4.80, 'https://www.olx.pl/oferta/lego-star-wars-rebel-u-wing-75399-CID123456', 'https://img.olx.pl/75399_1.jpg', 'Zestaw LEGO Star Wars Rebel U-Wing Starfighter 75399 w stanie idealnym, kompletny z instrukcją.'],
      ['75399-1', 'LEGO Star Wars 75399 U-Wing - używany', 38.00, 'używany', 'Kraków', 'Collector_Pro', 4.50, 'https://www.olx.pl/oferta/lego-star-wars-75399-u-wing-CID789012', 'https://img.olx.pl/75399_2.jpg', 'Zestaw w bardzo dobrym stanie, wszystkie elementy kompletne, lekko zużyte opakowanie.'],
      ['75399-1', 'LEGO Star Wars Andor Rebel U-Wing Starfighter 75399', 52.00, 'nowy', 'Gdańsk', 'LEGO_Store_PL', 4.90, 'https://www.olx.pl/oferta/lego-star-wars-andor-75399-CID345678', 'https://img.olx.pl/75399_3.jpg', 'Oryginalny zestaw LEGO Star Wars z serii Andor, fabrycznie zapakowany.'],
      ['75399-1', 'LEGO 75399 Rebel U-Wing Starfighter - bez pudełka', 35.00, 'używany', 'Wrocław', 'BrickMaster', 4.20, 'https://www.olx.pl/oferta/lego-75399-rebel-u-wing-CID901234', 'https://img.olx.pl/75399_4.jpg', 'Zestaw kompletny bez oryginalnego pudełka, wszystkie minifigurki i elementy.'],
      ['75399-1', 'LEGO Star Wars 75399 - NOWY w folii', 48.00, 'nowy', 'Poznań', 'LEGO_Hunter', 4.70, 'https://www.olx.pl/oferta/lego-star-wars-75399-nowy-CID567890', 'https://img.olx.pl/75399_5.jpg', 'Zestaw w oryginalnym opakowaniu, nieotwarty, w folii ochronnej.']
    ];
    
    for (const data of sampleData) {
      try {
        await pool.query(`
          INSERT INTO olx_offers (set_number, title, price, condition, location, seller_name, seller_rating, offer_url, image_url, description)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          ON CONFLICT (offer_url) DO NOTHING
        `, data);
      } catch (err) {
        console.log('Skipping duplicate:', data[8]);
      }
    }
    
    console.log('Sample data added!');
    
    // Sprawdź liczbę rekordów
    const count = await pool.query('SELECT COUNT(*) FROM olx_offers');
    console.log('Total records:', count.rows[0].count);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

createOlxTable();
