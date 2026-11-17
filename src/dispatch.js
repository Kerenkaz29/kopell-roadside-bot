const Technician = require('./models/Technician');

const AVG_SPEED_KMH = 40;

function haversineKm(a, b) {
  const [lng1, lat1] = a;
  const [lng2, lat2] = b;
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(h));
}

// Finds the nearest available technician to a location, marks them BUSY, and returns
// the technician plus a rough ETA (straight-line distance at a fixed average speed).
async function assignTechnician(location) {
  const technician = await Technician.findOne({
    status: 'AVAILABLE',
    location: { $near: { $geometry: location, $maxDistance: 50000 } },
  });

  if (!technician) return null;

  technician.status = 'BUSY';
  await technician.save();

  const distanceKm = haversineKm(location.coordinates, technician.location.coordinates);
  const etaMinutes = Math.max(3, Math.round((distanceKm / AVG_SPEED_KMH) * 60));

  return { technician, etaMinutes };
}

module.exports = { assignTechnician };
