const mongoose = require('mongoose');
const config = require('./config');
const Technician = require('./models/Technician');

// Rough coordinates around Kiryat Ata / Haifa area, [lng, lat]
const technicians = [
  { name: 'Dani Tow', type: 'tow', location: { type: 'Point', coordinates: [35.1092, 32.8102] }, status: 'AVAILABLE' },
  { name: 'Moshe Rescue', type: 'tow', location: { type: 'Point', coordinates: [35.0818, 32.7940] }, status: 'AVAILABLE' },
  { name: 'Yossi Technician', type: 'repair', location: { type: 'Point', coordinates: [35.1340, 32.8220] }, status: 'AVAILABLE' },
  { name: 'Ronit Service', type: 'repair', location: { type: 'Point', coordinates: [35.0700, 32.8000] }, status: 'AVAILABLE' },
];

async function seed() {
  await mongoose.connect(config.mongodbUri);
  await Technician.deleteMany({});
  await Technician.insertMany(technicians);
  console.log(`Seeded ${technicians.length} technicians`);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
