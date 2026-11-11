const mongoose = require('mongoose');
const dotenv = require('dotenv');
const District = require('./models/District');
const Stop = require('./models/Stop');
const Bus = require('./models/Bus');
const Route = require('./models/Route');

dotenv.config();

const seedDatabase = async () => {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/local-bus-tracker');
    
    console.log("Clearing existing data...");
    await District.deleteMany();
    await Stop.deleteMany();
    await Bus.deleteMany();
    await Route.deleteMany();

    console.log("Adding Districts...");
    const kk = await District.create({ name: 'Kanyakumari', state: 'Tamil Nadu', code: 'KK' });
    const tvm = await District.create({ name: 'Thiruvananthapuram', state: 'Kerala', code: 'TVM' });

    console.log("Adding Stops...");
    const stop1 = await Stop.create({ name: 'Nagercoil', district: kk._id, latitude: 8.1833, longitude: 77.4119 });
    const stop2 = await Stop.create({ name: 'Kanyakumari', district: kk._id, latitude: 8.0883, longitude: 77.5385 });
    const stop3 = await Stop.create({ name: 'Marthandam', district: kk._id, latitude: 8.3114, longitude: 77.2272 });

    const stop4 = await Stop.create({ name: 'Thampanoor', district: tvm._id, latitude: 8.4875, longitude: 76.9525 });
    const stop5 = await Stop.create({ name: 'Kovalam', district: tvm._id, latitude: 8.4004, longitude: 76.9787 });

    console.log("Adding Buses...");
    const bus1 = await Bus.create({ name: 'Cape Express', busNumber: 'TN-74-A-1234', operator: 'SETC', type: 'Fast Passenger', district: kk._id });
    const bus2 = await Bus.create({ name: 'Ananthapuri Route', busNumber: 'KL-01-B-5678', operator: 'KSRTC', type: 'Ordinary', district: tvm._id });

    console.log("Adding Routes...");
    await Route.create({
      routeName: 'Nagercoil - Kanyakumari',
      routeNumber: 'R101',
      district: kk._id,
      source: stop1._id,
      destination: stop2._id,
      orderedStops: [stop1._id, stop3._id, stop2._id],
      routeCoordinates: [{ latitude: 8.1833, longitude: 77.4119 }, { latitude: 8.0883, longitude: 77.5385 }]
    });

    console.log("Data seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding data:", error);
    process.exit(1);
  }
};

seedDatabase();
