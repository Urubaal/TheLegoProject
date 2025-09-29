const LegoSet = require('./models/LegoSet');
const OlxOffer = require('./models/OlxOffer');

async function addSampleData() {
  try {
    console.log('Adding sample data...');
    
    // Add LEGO sets
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
        await LegoSet.create(setData);
        console.log(`Added set: ${setData.setNumber} - ${setData.name}`);
      } catch (error) {
        if (error.code === '23505') { // Unique constraint violation
          console.log(`Set ${setData.setNumber} already exists`);
        } else {
          console.error(`Error adding set ${setData.setNumber}:`, error.message);
        }
      }
    }
    
    // Add OLX offers
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
        await OlxOffer.create(offerData);
        console.log(`Added offer: ${offerData.title}`);
      } catch (error) {
        if (error.code === '23505') { // Unique constraint violation
          console.log(`Offer ${offerData.offerUrl} already exists`);
        } else {
          console.error('Error adding offer:', error.message);
        }
      }
    }
    
    console.log('Sample data added successfully!');
    
  } catch (error) {
    console.error('Error adding sample data:', error);
  }
}

addSampleData();
