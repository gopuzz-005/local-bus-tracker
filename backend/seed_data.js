const mongoose = require('mongoose');
const dotenv = require('dotenv');
const District = require('./models/District');
const Stop = require('./models/Stop');
const Bus = require('./models/Bus');
const Route = require('./models/Route');

dotenv.config();

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/local-bus-tracker');
    
    // Create Districts
    let kk = await District.findOne({ name: 'Kanyakumari' });
    if (!kk) kk = await District.create({ name: 'Kanyakumari', state: 'Tamil Nadu', code: 'KK' });
    
    let tvm = await District.findOne({ name: 'Thiruvananthapuram' });
    if (!tvm) tvm = await District.create({ name: 'Thiruvananthapuram', state: 'Kerala', code: 'TVM' });

    // Stops list for KK
    const kkStops = [
      'Kanyakumari', 'Suchindram', 'Kottaram', 'Anjugramam', 'Kovalam',
      'Manakudy', 'Nagercoil', 'Kottar', 'Vadasery', 'Asaripallam',
      'Parvathipuram', 'Thovalai', 'Rajakkamangalam', 'Thuckalay',
      'Padmanabhapuram', 'Colachel', 'Mandaikad', 'Manavalakurichi',
      'Muttam', 'Kulasekaram', 'Marthandam', 'Kuzhithurai'
    ];
    
    // Stops list for TVM
    const tvmStops = ['East Fort', 'Thampanoor', 'Technopark'];

    const createStops = async (names, district) => {
      let result = {};
      for (let name of names) {
        let stop = await Stop.findOne({ name, district: district._id });
        if (!stop) stop = await Stop.create({ name, district: district._id, latitude: 8.0, longitude: 77.0 }); // Dummy coords
        result[name] = stop;
      }
      return result;
    };

    const kkStopMap = await createStops(kkStops, kk);
    const tvmStopMap = await createStops(tvmStops, tvm);

    // Route 1: Kanyakumari → Suchindram → Nagercoil → Kottar → Vadasery
    let r1Stops = ['Kanyakumari', 'Suchindram', 'Nagercoil', 'Kottar', 'Vadasery'].map(name => kkStopMap[name]._id);
    let route1 = await Route.findOne({ routeNumber: 'R-KK-01' });
    if (!route1) {
      route1 = await Route.create({
        routeName: 'Kanyakumari to Vadasery',
        routeNumber: 'R-KK-01',
        district: kk._id,
        source: r1Stops[0],
        destination: r1Stops[r1Stops.length-1],
        orderedStops: r1Stops,
        routeCoordinates: []
      });
    } else {
      route1.orderedStops = r1Stops;
      await route1.save();
    }

    // Route 2: TVM Route
    let r2Stops = ['East Fort', 'Thampanoor', 'Technopark'].map(name => tvmStopMap[name]._id);
    let route2 = await Route.findOne({ routeNumber: 'R-TVM-01' });
    if (!route2) {
      route2 = await Route.create({
        routeName: 'East Fort to Technopark',
        routeNumber: 'R-TVM-01',
        district: tvm._id,
        source: r2Stops[0],
        destination: r2Stops[r2Stops.length-1],
        orderedStops: r2Stops,
        routeCoordinates: []
      });
    } else {
      route2.orderedStops = r2Stops;
      await route2.save();
    }

    // Create or Update Bus 1
    let bus1 = await Bus.findOne({ busNumber: 'TN-74-A-1234' });
    if (!bus1) {
      bus1 = await Bus.create({ name: 'Cape Express', busNumber: 'TN-74-A-1234', operator: 'SETC', type: 'Fast Passenger', district: kk._id, route: route1._id });
    } else {
      bus1.route = route1._id;
      await bus1.save();
    }

    // Create or Update Bus 2
    let bus2 = await Bus.findOne({ busNumber: 'KL-01-B-5678' });
    if (!bus2) {
      bus2 = await Bus.create({ name: 'Ananthapuri Route', busNumber: 'KL-01-B-5678', operator: 'KSRTC', type: 'Ordinary', district: tvm._id, route: route2._id });
    } else {
      bus2.route = route2._id;
      await bus2.save();
    }

    // Existing buses missing routes update
    let allBuses = await Bus.find({route: {$exists: false}});
    for (let bus of allBuses) {
        if (bus.district.toString() === kk._id.toString()) {
            bus.route = route1._id;
        } else {
            bus.route = route2._id;
        }
        await bus.save();
    }

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error("Error seeding data:", error);
    process.exit(1);
  }
};

seed();
