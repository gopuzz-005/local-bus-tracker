const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const District = require('../models/District');
const Stop = require('../models/Stop');
const Route = require('../models/Route');
const Bus = require('../models/Bus');
const Trip = require('../models/Trip');
const LiveLocation = require('../models/LiveLocation');
const Alert = require('../models/Alert');
const Notification = require('../models/Notification');
const Favorite = require('../models/Favorite');

dotenv.config({ path: path.join(__dirname, '../.env') });

const hashPassword = async (plainPassword) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(plainPassword, salt);
};

const seedDatabase = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/local_bus_tracking';
    console.log(`Connecting to MongoDB at: ${mongoUri}`);
    await mongoose.connect(mongoUri);
    console.log('MongoDB Connected successfully for Demo Seeding.');

    // =========================================================================
    // 1. DEMO USERS (Admin, Drivers, Passengers)
    // =========================================================================
    console.log('\n--- Seeding Users ---');
    const demoUsers = [
      {
        name: 'Chief Transit Admin',
        email: 'admin@tracker.com',
        plainPassword: 'Admin@123',
        role: 'Admin',
        phone: '+91 98765 00001'
      },
      {
        name: 'Anand Kumar',
        email: 'driver.anand@tracker.com',
        plainPassword: 'Driver@123',
        role: 'Driver',
        phone: '+91 98765 00002'
      },
      {
        name: 'Suresh Nair',
        email: 'driver.suresh@tracker.com',
        plainPassword: 'Driver@123',
        role: 'Driver',
        phone: '+91 98765 00003'
      },
      {
        name: 'Meera Pillai',
        email: 'passenger.meera@tracker.com',
        plainPassword: 'Passenger@123',
        role: 'Passenger',
        phone: '+91 98765 00004'
      },
      {
        name: 'Rahul Varma',
        email: 'passenger.rahul@tracker.com',
        plainPassword: 'Passenger@123',
        role: 'Passenger',
        phone: '+91 98765 00005'
      },
      {
        name: 'Priya Chandran',
        email: 'passenger.priya@tracker.com',
        plainPassword: 'Passenger@123',
        role: 'Passenger',
        phone: '+91 98765 00006'
      }
    ];

    const userDocs = {};
    for (const u of demoUsers) {
      let user = await User.findOne({ email: u.email });
      const hashedPassword = await hashPassword(u.plainPassword);

      if (!user) {
        user = await User.create({
          name: u.name,
          email: u.email,
          password: u.plainPassword, // User schema pre-save will hash
          role: u.role,
          phone: u.phone,
          active: true
        });
      } else {
        user.name = u.name;
        user.password = hashedPassword;
        user.role = u.role;
        user.phone = u.phone;
        user.active = true;
        await user.save();
      }
      userDocs[u.email] = user;
      console.log(`  ✓ ${u.role}: ${u.name} (${u.email}) [Password: ${u.plainPassword}]`);
    }

    // =========================================================================
    // 2. DISTRICTS
    // =========================================================================
    console.log('\n--- Seeding Districts ---');
    const tvmDist = await District.findOneAndUpdate(
      { name: 'Thiruvananthapuram' },
      { name: 'Thiruvananthapuram', state: 'Kerala', code: 'TVM' },
      { upsert: true, returnDocument: 'after' }
    );
    console.log(`  ✓ District: ${tvmDist.name} (${tvmDist.code})`);

    const kkDist = await District.findOneAndUpdate(
      { name: 'Kanyakumari' },
      { name: 'Kanyakumari', state: 'Tamil Nadu', code: 'KK' },
      { upsert: true, returnDocument: 'after' }
    );
    console.log(`  ✓ District: ${kkDist.name} (${kkDist.code})`);

    // =========================================================================
    // 3. STOPS
    // =========================================================================
    console.log('\n--- Seeding Stops ---');
    const demoStops = [
      // TVM Stops
      { name: 'East Fort Terminal', district: tvmDist._id, lat: 8.4832, lng: 76.9482 },
      { name: 'Thampanoor Central Bus Station', district: tvmDist._id, lat: 8.4875, lng: 76.9525 },
      { name: 'Palayam Junction', district: tvmDist._id, lat: 8.5020, lng: 76.9515 },
      { name: 'Pattom Plaza', district: tvmDist._id, lat: 8.5244, lng: 76.9427 },
      { name: 'Kesavadasapuram Junction', district: tvmDist._id, lat: 8.5367, lng: 76.9366 },
      { name: 'Technopark Phase-1 Campus', district: tvmDist._id, lat: 8.5583, lng: 76.8812 },
      { name: 'Kazhakkoottam Junction', district: tvmDist._id, lat: 8.5686, lng: 76.8731 },
      { name: 'Thiruvallam Bridge', district: tvmDist._id, lat: 8.4411, lng: 76.9592 },
      { name: 'Kovalam Beach Junction', district: tvmDist._id, lat: 8.4004, lng: 76.9787 },

      // KK Stops
      { name: 'Nagercoil Vadasery Terminal', district: kkDist._id, lat: 8.1833, lng: 77.4119 },
      { name: 'Suchindram Temple Stop', district: kkDist._id, lat: 8.1567, lng: 77.4658 },
      { name: 'Kanyakumari Cape Point', district: kkDist._id, lat: 8.0883, lng: 77.5385 }
    ];

    const stopDocs = {};
    for (const s of demoStops) {
      const stop = await Stop.findOneAndUpdate(
        { name: s.name, district: s.district },
        { name: s.name, district: s.district, latitude: s.lat, longitude: s.lng },
        { upsert: true, returnDocument: 'after' }
      );
      stopDocs[s.name] = stop;
      console.log(`  ✓ Stop: ${s.name} [${s.lat}, ${s.lng}]`);
    }

    // =========================================================================
    // 4. ROUTES
    // =========================================================================
    console.log('\n--- Seeding Routes ---');
    const demoRoutes = [
      {
        routeName: 'East Fort to Technopark IT Corridor',
        routeNumber: 'R-TVM-01',
        district: tvmDist._id,
        source: stopDocs['East Fort Terminal']._id,
        destination: stopDocs['Kazhakkoottam Junction']._id,
        orderedStops: [
          stopDocs['East Fort Terminal']._id,
          stopDocs['Thampanoor Central Bus Station']._id,
          stopDocs['Palayam Junction']._id,
          stopDocs['Pattom Plaza']._id,
          stopDocs['Kesavadasapuram Junction']._id,
          stopDocs['Technopark Phase-1 Campus']._id,
          stopDocs['Kazhakkoottam Junction']._id
        ],
        routeCoordinates: [
          { latitude: 8.4832, longitude: 76.9482 },
          { latitude: 8.4875, longitude: 76.9525 },
          { latitude: 8.5020, longitude: 76.9515 },
          { latitude: 8.5244, longitude: 76.9427 },
          { latitude: 8.5367, longitude: 76.9366 },
          { latitude: 8.5583, longitude: 76.8812 },
          { latitude: 8.5686, longitude: 76.8731 }
        ],
        distance: 16,
        estimatedDuration: 35,
        active: true
      },
      {
        routeName: 'Thampanoor to Kovalam Coastal Shuttle',
        routeNumber: 'R-TVM-02',
        district: tvmDist._id,
        source: stopDocs['Thampanoor Central Bus Station']._id,
        destination: stopDocs['Kovalam Beach Junction']._id,
        orderedStops: [
          stopDocs['Thampanoor Central Bus Station']._id,
          stopDocs['East Fort Terminal']._id,
          stopDocs['Thiruvallam Bridge']._id,
          stopDocs['Kovalam Beach Junction']._id
        ],
        routeCoordinates: [
          { latitude: 8.4875, longitude: 76.9525 },
          { latitude: 8.4832, longitude: 76.9482 },
          { latitude: 8.4411, longitude: 76.9592 },
          { latitude: 8.4004, longitude: 76.9787 }
        ],
        distance: 14,
        estimatedDuration: 30,
        active: true
      },
      {
        routeName: 'Nagercoil to Kanyakumari Scenic Express',
        routeNumber: 'R-KK-01',
        district: kkDist._id,
        source: stopDocs['Nagercoil Vadasery Terminal']._id,
        destination: stopDocs['Kanyakumari Cape Point']._id,
        orderedStops: [
          stopDocs['Nagercoil Vadasery Terminal']._id,
          stopDocs['Suchindram Temple Stop']._id,
          stopDocs['Kanyakumari Cape Point']._id
        ],
        routeCoordinates: [
          { latitude: 8.1833, longitude: 77.4119 },
          { latitude: 8.1567, longitude: 77.4658 },
          { latitude: 8.0883, longitude: 77.5385 }
        ],
        distance: 19,
        estimatedDuration: 40,
        active: true
      }
    ];

    const routeDocs = {};
    for (const r of demoRoutes) {
      const route = await Route.findOneAndUpdate(
        { routeNumber: r.routeNumber },
        r,
        { upsert: true, returnDocument: 'after' }
      );
      routeDocs[r.routeNumber] = route;
      console.log(`  ✓ Route: ${r.routeNumber} - "${r.routeName}" (${r.distance} km)`);
    }

    // =========================================================================
    // 5. BUSES
    // =========================================================================
    console.log('\n--- Seeding Buses ---');
    const demoBuses = [
      {
        name: 'Ananthapuri Fast Express',
        busNumber: 'KL-01-AZ-1001',
        operator: 'KSRTC Swift',
        type: 'Fast Passenger',
        district: tvmDist._id,
        route: routeDocs['R-TVM-01']._id,
        driver: userDocs['driver.anand@tracker.com']._id,
        currentDriver: userDocs['driver.anand@tracker.com']._id,
        status: 'Active',
        currentLocation: {
          lat: 8.5244,
          lng: 76.9427,
          updatedAt: new Date()
        },
        active: true
      },
      {
        name: 'Kovalam Beach Shuttle',
        busNumber: 'KL-01-BY-2002',
        operator: 'Kerala State RTC',
        type: 'Ordinary',
        district: tvmDist._id,
        route: routeDocs['R-TVM-02']._id,
        driver: userDocs['driver.suresh@tracker.com']._id,
        currentDriver: userDocs['driver.suresh@tracker.com']._id,
        status: 'Active',
        currentLocation: {
          lat: 8.4004,
          lng: 76.9787,
          updatedAt: new Date(Date.now() - 3600000)
        },
        active: true
      },
      {
        name: 'Cape City Connect',
        busNumber: 'TN-74-CX-3003',
        operator: 'SETC Tamil Nadu',
        type: 'Express',
        district: kkDist._id,
        route: routeDocs['R-KK-01']._id,
        driver: userDocs['driver.anand@tracker.com']._id,
        status: 'Inactive',
        currentLocation: {
          lat: 8.1833,
          lng: 77.4119,
          updatedAt: new Date(Date.now() - 86400000)
        },
        active: true
      },
      {
        name: 'Techno City Metro Feeder',
        busNumber: 'KL-01-DW-4004',
        operator: 'KSRTC City Circular',
        type: 'Limited Stop',
        district: tvmDist._id,
        route: routeDocs['R-TVM-01']._id,
        driver: userDocs['driver.suresh@tracker.com']._id,
        status: 'Active',
        currentLocation: {
          lat: 8.5583,
          lng: 76.8812,
          updatedAt: new Date()
        },
        active: true
      }
    ];

    const busDocs = {};
    for (const b of demoBuses) {
      const bus = await Bus.findOneAndUpdate(
        { busNumber: b.busNumber },
        b,
        { upsert: true, returnDocument: 'after' }
      );
      busDocs[b.busNumber] = bus;
      console.log(`  ✓ Bus: ${b.busNumber} - "${b.name}" (${b.type}, Status: ${b.status})`);
    }

    // =========================================================================
    // 6. TRIPS (Active, Completed, Scheduled)
    // =========================================================================
    console.log('\n--- Seeding Trips ---');

    // Trip 1: ACTIVE live trip for Bus 1 & Driver Anand
    let activeTrip = await Trip.findOne({
      bus: busDocs['KL-01-AZ-1001']._id,
      driver: userDocs['driver.anand@tracker.com']._id,
      status: 'ACTIVE'
    });

    if (!activeTrip) {
      activeTrip = await Trip.create({
        bus: busDocs['KL-01-AZ-1001']._id,
        driver: userDocs['driver.anand@tracker.com']._id,
        route: routeDocs['R-TVM-01']._id,
        startTime: new Date(Date.now() - 2400000), // started 40 mins ago
        currentStop: stopDocs['Pattom Plaza']._id,
        nextStop: stopDocs['Kesavadasapuram Junction']._id,
        status: 'ACTIVE'
      });
    } else {
      activeTrip.startTime = new Date(Date.now() - 2400000);
      activeTrip.currentStop = stopDocs['Pattom Plaza']._id;
      activeTrip.nextStop = stopDocs['Kesavadasapuram Junction']._id;
      activeTrip.status = 'ACTIVE';
      await activeTrip.save();
    }
    console.log(`  ✓ Active Trip: ID ${activeTrip._id} (Bus: KL-01-AZ-1001, Driver: Anand Kumar, Status: ACTIVE)`);

    // Record Live Location for Active Trip
    await LiveLocation.create({
      trip: activeTrip._id,
      bus: busDocs['KL-01-AZ-1001']._id,
      latitude: 8.5244,
      longitude: 76.9427,
      accuracy: 8,
      timestamp: new Date()
    });

    // Trip 2: COMPLETED trip for Bus 2 & Driver Suresh
    const completedTrip = await Trip.findOneAndUpdate(
      {
        bus: busDocs['KL-01-BY-2002']._id,
        driver: userDocs['driver.suresh@tracker.com']._id,
        status: 'COMPLETED'
      },
      {
        bus: busDocs['KL-01-BY-2002']._id,
        driver: userDocs['driver.suresh@tracker.com']._id,
        route: routeDocs['R-TVM-02']._id,
        startTime: new Date(Date.now() - 10800000), // 3 hours ago
        endTime: new Date(Date.now() - 3600000),   // 1 hour ago
        status: 'COMPLETED'
      },
      { upsert: true, returnDocument: 'after' }
    );
    console.log(`  ✓ Completed Trip: ID ${completedTrip._id} (Bus: KL-01-BY-2002, Status: COMPLETED)`);

    // Trip 3: NOT_STARTED / Scheduled trip
    const scheduledTrip = await Trip.findOneAndUpdate(
      {
        bus: busDocs['TN-74-CX-3003']._id,
        status: 'NOT_STARTED'
      },
      {
        bus: busDocs['TN-74-CX-3003']._id,
        driver: userDocs['driver.anand@tracker.com']._id,
        route: routeDocs['R-KK-01']._id,
        startTime: null,
        status: 'NOT_STARTED',
        currentStop: stopDocs['Nagercoil Vadasery Terminal']._id,
        nextStop: stopDocs['Suchindram Temple Stop']._id
      },
      { upsert: true, returnDocument: 'after' }
    );
    console.log(`  ✓ Scheduled Trip: ID ${scheduledTrip._id} (Bus: TN-74-CX-3003, Status: NOT_STARTED)`);

    // =========================================================================
    // 7. ALERTS, NOTIFICATIONS & FAVORITES
    // =========================================================================
    console.log('\n--- Seeding Alerts, Notifications & Favorites ---');
    await Alert.findOneAndUpdate(
      { title: 'Traffic Delay Advisory: Pattom Junction' },
      {
        title: 'Traffic Delay Advisory: Pattom Junction',
        message: 'Flyover maintenance near Pattom Junction. Expect 5-10 minutes additional transit time.',
        severity: 'Medium',
        route: routeDocs['R-TVM-01']._id,
        district: tvmDist._id
      },
      { upsert: true }
    );
    console.log('  ✓ Alert created: Traffic Delay Advisory');

    await Notification.findOneAndUpdate(
      { title: 'Welcome to Local Bus Tracker' },
      {
        user: userDocs['passenger.meera@tracker.com']._id,
        title: 'Welcome to Local Bus Tracker',
        message: 'Track real-time city buses across Thiruvananthapuram and Kanyakumari with live GPS updates.',
        type: 'System'
      },
      { upsert: true }
    );
    console.log('  ✓ Notification created for passenger Meera');

    await Favorite.findOneAndUpdate(
      { user: userDocs['passenger.meera@tracker.com']._id, type: 'Route' },
      {
        user: userDocs['passenger.meera@tracker.com']._id,
        type: 'Route',
        referenceId: routeDocs['R-TVM-01']._id
      },
      { upsert: true }
    );
    console.log('  ✓ Favorite route saved for passenger Meera');

    console.log('\n===============================================================');
    console.log('🎉 DEMO DATA SEEDED SUCCESSFULLY WITH 100% IDEMPOTENCY!');
    console.log('===============================================================');
    console.log('LOGIN CREDENTIALS:');
    console.log('  👑 ADMIN:     admin@tracker.com        / Admin@123');
    console.log('  🚌 DRIVER 1:  driver.anand@tracker.com  / Driver@123 (Active Trip on KL-01-AZ-1001)');
    console.log('  🚌 DRIVER 2:  driver.suresh@tracker.com / Driver@123');
    console.log('  👥 PASSENGER: passenger.meera@tracker.com / Passenger@123');
    console.log('===============================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('Demo Seed Error:', error);
    process.exit(1);
  }
};

seedDatabase();
