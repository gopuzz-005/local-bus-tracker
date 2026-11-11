const mongoose = require('mongoose');
const dotenv = require('dotenv');
const District = require('./models/District');
const Stop = require('./models/Stop');
const Bus = require('./models/Bus');
const Route = require('./models/Route');
const Trip = require('./models/Trip');
const Alert = require('./models/Alert');
const Notification = require('./models/Notification');
const User = require('./models/User');

dotenv.config();

const seedExpanded = async () => {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/local-bus-tracker');
    
    console.log("Adding detailed stops for Kanyakumari and Trivandrum...");
    let kk = await District.findOne({ name: 'Kanyakumari' });
    let tvm = await District.findOne({ name: 'Thiruvananthapuram' });

    if (!kk) kk = await District.create({ name: 'Kanyakumari', state: 'Tamil Nadu', code: 'KK' });
    if (!tvm) tvm = await District.create({ name: 'Thiruvananthapuram', state: 'Kerala', code: 'TVM' });

    // New stops requested by user
    const stopAru = await Stop.create({ name: 'Arumanai', district: kk._id, latitude: 8.3582, longitude: 77.1652 });
    const stopMel = await Stop.create({ name: 'Melpuram', district: kk._id, latitude: 8.3421, longitude: 77.2023 });
    const stopKottar = await Stop.create({ name: 'Kottar', district: kk._id, latitude: 8.1697, longitude: 77.4429 });

    const stopNey = await Stop.create({ name: 'Neyyattinkara', district: tvm._id, latitude: 8.4011, longitude: 77.0863 });
    const stopLulu = await Stop.create({ name: 'Lulu Mall Stop', district: tvm._id, latitude: 8.5135, longitude: 76.9038 });

    console.log("Adding extensive routes and buses...");
    const bus3 = await Bus.create({ name: 'Malabar Rider', busNumber: 'KL-01-C-9999', operator: 'Private', type: 'Fast Passenger', district: tvm._id });
    const bus4 = await Bus.create({ name: 'KK Local', busNumber: 'TN-74-B-8888', operator: 'SETC', type: 'Ordinary', district: kk._id });

    const routeTVM = await Route.create({
      routeName: 'Neyyattinkara - Lulu Mall',
      routeNumber: 'R202',
      district: tvm._id,
      source: stopNey._id,
      destination: stopLulu._id,
      orderedStops: [stopNey._id, stopLulu._id],
      routeCoordinates: [{ latitude: 8.4011, longitude: 77.0863 }, { latitude: 8.5135, longitude: 76.9038 }]
    });

    const routeKK = await Route.create({
      routeName: 'Arumanai - Kottar via Melpuram',
      routeNumber: 'R303',
      district: kk._id,
      source: stopAru._id,
      destination: stopKottar._id,
      orderedStops: [stopAru._id, stopMel._id, stopKottar._id],
      routeCoordinates: [{ latitude: 8.3582, longitude: 77.1652 }, { latitude: 8.1697, longitude: 77.4429 }]
    });

    // Mock trips, alerts, notifications for history
    const driver = await User.findOne({ role: 'Driver' });
    const passenger = await User.findOne({ role: 'Passenger' });

    if (driver) {
      await Trip.create({
        bus: bus3._id,
        driver: driver._id,
        route: routeTVM._id,
        startTime: Date.now() - 3600000,
        endTime: Date.now(),
        status: 'COMPLETED'
      });
    }

    if (passenger) {
      await Notification.create({
        user: passenger._id,
        title: 'Welcome to Bus Tracker',
        message: 'Your account is ready for tracking!',
        type: 'System'
      });
    }

    await Alert.create({
      title: 'Heavy Rain Warning',
      message: 'Buses in Kanyakumari district may experience delays of up to 30 mins.',
      severity: 'High',
      district: kk._id
    });

    console.log("Expanded data seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding expanded data:", error);
    process.exit(1);
  }
};

seedExpanded();
