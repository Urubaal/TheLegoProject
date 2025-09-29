const LegoSet = require('./models/LegoSet');
const OlxOffer = require('./models/OlxOffer');

async function testOlxApi() {
  try {
    console.log('Testing OLX API...');
    
    // Test if we can connect to database
    console.log('Testing database connection...');
    
    // Try to get all offers
    try {
      const offers = await OlxOffer.findAll({ limit: 5 });
      console.log('✅ OLX offers API working!');
      console.log(`Found ${offers.length} offers`);
      offers.forEach(offer => {
        console.log(`- ${offer.title} (${offer.price} PLN)`);
      });
    } catch (error) {
      console.log('❌ OLX offers API not working:', error.message);
      
      // Check if tables exist
      if (error.message.includes('nie istnieje')) {
        console.log('Tables do not exist. Need to run migration.');
        return;
      }
    }
    
    // Test if we can get sets
    try {
      const sets = await LegoSet.findAll({ limit: 5 });
      console.log('✅ LEGO sets API working!');
      console.log(`Found ${sets.length} sets`);
      sets.forEach(set => {
        console.log(`- ${set.set_number} - ${set.name}`);
      });
    } catch (error) {
      console.log('❌ LEGO sets API not working:', error.message);
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testOlxApi();
