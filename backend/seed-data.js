const fs = require('fs');
const path = require('path');

// Mock data for LEGO sets and offers
const mockData = {
    sets: [
        {
            setNumber: '75399-1',
            name: 'Rebel U-Wing Starfighter',
            theme: 'Star Wars',
            year: 2024,
            pieces: 1065,
            minifigures: 4,
            age: '18+',
            description: 'The Rebel U-Wing Starfighter is a versatile craft used by the Rebel Alliance for troop transport and combat missions. This detailed LEGO set features authentic details from Rogue One: A Star Wars Story.',
            retailPrice: 79.99,
            imageUrl: 'https://www.lego.com/cdn/cs/set/assets/blt1234567890/75399.png'
        },
        {
            setNumber: '75313-1',
            name: 'AT-AT',
            theme: 'Star Wars',
            year: 2023,
            pieces: 1267,
            minifigures: 4,
            age: '18+',
            description: 'Build the ultimate AT-AT model with this impressive LEGO Star Wars set featuring authentic details and minifigures.',
            retailPrice: 169.99,
            imageUrl: 'https://www.lego.com/cdn/cs/set/assets/blt1234567890/75313.png'
        }
    ],
    offers: [
        {
            setNumber: '75399-1',
            title: 'LEGO Star Wars Rebel U-Wing Starfighter 75399 - NOWY',
            price: 65,
            location: 'Warszawa',
            condition: 'Nowy',
            source: 'OLX',
            url: 'https://www.olx.pl/d/oferta/lego-star-wars-75399-ID12345678.html'
        },
        {
            setNumber: '75399-1',
            title: 'LEGO Star Wars 75399 U-Wing - używany',
            price: 45,
            location: 'Kraków',
            condition: 'Używany',
            source: 'OLX',
            url: 'https://www.olx.pl/d/oferta/lego-75399-uzywany-ID12345679.html'
        },
        {
            setNumber: '75399-1',
            title: '75399 Rebel U-Wing Starfighter',
            price: 55,
            location: 'Gdańsk',
            condition: 'Bardzo dobry',
            source: 'OLX',
            url: 'https://www.olx.pl/d/oferta/75399-rebel-u-wing-ID12345680.html'
        },
        {
            setNumber: '75313-1',
            title: 'LEGO Star Wars 75313 AT-AT',
            price: 180,
            location: 'Warszawa',
            condition: 'Nowy',
            source: 'OLX',
            url: 'https://www.olx.pl/d/oferta/lego-at-at-75313-ID12345681.html'
        },
        {
            setNumber: '31120-1',
            title: 'LEGO Creator 31120 Medieval Castle',
            price: 95,
            location: 'Kraków',
            condition: 'Używany',
            source: 'OLX',
            url: 'https://www.olx.pl/d/oferta/lego-castle-31120-ID12345682.html'
        }
    ]
};

// Save mock data to JSON files for the frontend to use
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
}

fs.writeFileSync(
    path.join(dataDir, 'sets.json'),
    JSON.stringify(mockData.sets, null, 2)
);

fs.writeFileSync(
    path.join(dataDir, 'offers.json'),
    JSON.stringify(mockData.offers, null, 2)
);

console.log('Mock data generated successfully!');
console.log(`Sets: ${mockData.sets.length}`);
console.log(`Offers: ${mockData.offers.length}`);
