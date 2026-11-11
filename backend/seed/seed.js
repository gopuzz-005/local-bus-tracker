
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const District = require('../models/District');
const Stop = require('../models/Stop');
const Route = require('../models/Route');
const Bus = require('../models/Bus');
const User = require('../models/User');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const kanyakumariStops = [
  // Kanyakumari district stops with verified coordinates
  { name: 'Kanyakumari', latitude: 8.0883, longitude: 77.5385 },
  { name: 'Suchindram', latitude: 8.1665, longitude: 77.4365 },
  { name: 'Kottaram', latitude: 8.1650, longitude: 77.4178 },
  { name: 'Anjugramam', latitude: 8.1728, longitude: 77.3812 },
  { name: 'Kovalam', latitude: 8.1386, longitude: 77.1649 },
  { name: 'Manakudy', latitude: 8.1580, longitude: 77.2871 },
  { name: 'Nagercoil', latitude: 8.1805, longitude: 77.4253 },
  { name: 'Kottar', latitude: 8.1800, longitude: 77.4200 },
  { name: 'Vadasery', latitude: 8.1843, longitude: 77.4340 },
  { name: 'Asaripallam', latitude: 8.2172, longitude: 77.4911 },
  { name: 'Parvathipuram', latitude: 8.2250, longitude: 77.4950 },
  { name: 'Thovalai', latitude: 8.2469, longitude: 77.2879 },
  { name: 'Rajakkamangalam', latitude: 8.2025, longitude: 77.5140 },
  { name: 'Thuckalay', latitude: 8.2090, longitude: 77.4050 },
  { name: 'Padmanabhapuram', latitude: 8.2095, longitude: 77.4255 },
  { name: 'Colachel', latitude: 8.2462, longitude: 77.4175 },
  { name: 'Mandaikad', latitude: 8.2600, longitude: 77.4300 },
  { name: 'Manavalakurichi', latitude: 8.2750, longitude: 77.4350 },
  { name: 'Muttam', latitude: 8.2800, longitude: 77.4400 },
  { name: 'Kulasekaram', latitude: 8.2560, longitude: 77.4470 },
  { name: 'Marthandam', latitude: 8.2680, longitude: 77.3950 },
  { name: 'Kuzhithurai', latitude: 8.2555, longitude: 77.3830 }
];

const tvmStopsData = [
  // TVM city / central stops
  { name: 'Thampanoor', latitude: 8.5061, longitude: 76.9508 },
  { name: 'East Fort', latitude: 8.5110, longitude: 76.9502 },
  { name: 'Palayam', latitude: 8.5115, longitude: 76.9530 },
  { name: 'Pattom', latitude: 8.5118, longitude: 76.9625 },
  { name: 'Medical College', latitude: 8.5152, longitude: 76.9770 },
  // Technopark corridor
  { name: 'Kesavadasapuram', latitude: 8.5445, longitude: 76.9810 },
  { name: 'Sreekaryam', latitude: 8.5720, longitude: 76.9870 },
  { name: 'Kazhakkoottam', latitude: 8.5890, longitude: 76.9950 },
  { name: 'Technopark', latitude: 8.5955, longitude: 76.9985 },
  // South corridor
  { name: 'Killipalam', latitude: 8.4690, longitude: 76.9580 },
  { name: 'Balaramapuram', latitude: 8.4525, longitude: 76.9605 },
  { name: 'Neyyattinkara', latitude: 8.4070, longitude: 77.0280 },
  { name: 'Parassala', latitude: 8.3475, longitude: 77.0645 }
];

// Demo routes definition – each entry lists start, destination and intermediate stops (in order)
const tvmDemoRoutes = [
  { start: 'Thampanoor', dest: 'Medical College', stops: ['East Fort', 'Palayam', 'Pattom'] }, // TVM City
  { start: 'East Fort', dest: 'Technopark', stops: ['Pattom', 'Kesavadasapuram', 'Sreekaryam', 'Kazhakkoottam'] }, // TVM Technopark
  { start: 'Thampanoor', dest: 'Parassala', stops: ['Killipalam', 'Balaramapuram', 'Neyyattinkara'] } // TVM South
];

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected for Seeding');

    // Admin Seeding
    let admin = await User.findOne({ email: process.env.ADMIN_EMAIL || 'admin@tracker.com' });
    if (!admin) {
      admin = await User.create({
        name: 'System Admin',
        email: process.env.ADMIN_EMAIL || 'admin@tracker.com',
        password: process.env.ADMIN_PASSWORD || 'Admin@123',
        role: 'Admin'
      });
      console.log('Admin user created');
    }

    // District Seeding
    const tvmDist = await District.findOneAndUpdate({ name: 'Thiruvananthapuram' }, { name: 'Thiruvananthapuram', state: 'Kerala', code: 'TVM' }, { upsert: true, returnDocument: 'after' });
    const kkDist = await District.findOneAndUpdate({ name: 'Kanyakumari' }, { name: 'Kanyakumari', state: 'Tamil Nadu', code: 'KK' }, { upsert: true, returnDocument: 'after' });

    // Seed Kanyakumari Stops with verified coordinates
    let kkStopDocs = {};
    for (const stop of kanyakumariStops) {
      const s = await Stop.findOneAndUpdate(
        { name: stop.name, district: kkDist._id },
        {
          name: stop.name,
          district: kkDist._id,
          latitude: stop.latitude,
          longitude: stop.longitude
        },
        { upsert: true, returnDocument: 'after' }
      );
      kkStopDocs[stop.name] = s._id;
    }

    // Seed TVM Stops and Routes
    for (const routeInfo of tvmDemoRoutes) {
      const allStopNames = [routeInfo.start, ...routeInfo.stops, routeInfo.dest];
      const stopIds = [];
      for (const name of allStopNames) {
        // Find stop data for latitude/longitude
        const stopData = tvmStopsData.find(s => s.name === name);
        const latitude = stopData?.latitude ?? 0;
        const longitude = stopData?.longitude ?? 0;
        const s = await Stop.findOneAndUpdate(
          { name, district: tvmDist._id },
          { name, district: tvmDist._id, latitude, longitude },
          { upsert: true, returnDocument: 'after' }
        );
        stopIds.push(s._id);
      }
      
      const routeName = `${routeInfo.start} - ${routeInfo.dest}`;
      const route = await Route.findOneAndUpdate(
        { routeName: routeName },
        { 
          routeName: routeName, 
          routeNumber: `R-${routeInfo.start.substring(0,3).toUpperCase()}`,
          district: tvmDist._id, 
          source: stopIds[0],
          destination: stopIds[stopIds.length - 1],
          orderedStops: stopIds, 
          distance: 15 
        },
        { upsert: true, returnDocument: 'after' }
      );

      // Seed a sample bus for this route
      await Bus.findOneAndUpdate(
        { busNumber: `TVM-${routeInfo.start.substring(0,3).toUpperCase()}` },
        { 
          name: `City Bus ${routeName}`, 
          busNumber: `TVM-${routeInfo.start.substring(0,3).toUpperCase()}`, 
          type: 'Ordinary', 
          district: tvmDist._id,
          route: route._id,
          capacity: 40
        },
        { upsert: true }
      );
    }
    
    // Seed Kanyakumari Routes
    const kkRoutesData = [
      { start: 'Kanyakumari', dest: 'Nagercoil', stops: ['Suchindram'] },
      { start: 'Nagercoil', dest: 'Colachel', stops: [] },
      { start: 'Thuckalay', dest: 'Colachel', stops: [] }
    ];

    for (const routeInfo of kkRoutesData) {
      const stopIds = [];
      const allNames = [routeInfo.start, ...routeInfo.stops, routeInfo.dest];
      for(const n of allNames) {
        stopIds.push(kkStopDocs[n]);
      }
      const routeName = `${routeInfo.start} - ${routeInfo.dest}`;
      const route = await Route.findOneAndUpdate(
        { routeName: routeName },
        { 
          routeName: routeName, 
          routeNumber: `R-${routeInfo.start.substring(0,3).toUpperCase()}`,
          district: kkDist._id, 
          source: stopIds[0] || kkStopDocs[routeInfo.start],
          destination: stopIds[stopIds.length - 1] || kkStopDocs[routeInfo.dest],
          orderedStops: stopIds, 
          distance: 20 
        },
        { upsert: true, returnDocument: 'after' }
      );

      await Bus.findOneAndUpdate(
        { busNumber: `KK-${routeInfo.start.substring(0,3).toUpperCase()}` },
        { 
          name: `Mofussil ${routeName}`, 
          busNumber: `KK-${routeInfo.start.substring(0,3).toUpperCase()}`, 
          type: 'Express', 
          district: kkDist._id,
          route: route._id,
          capacity: 50
        },
        { upsert: true }
      );
    }

    console.log('Seed completed successfully');
    process.exit();
  } catch (error) {
    console.error('Seed Error:', error);
    process.exit(1);
  }
};

seedData();
