const mongoose = require('mongoose');
const dotenv = require('dotenv');
const District = require('./models/District');
const Stop = require('./models/Stop');
const Bus = require('./models/Bus');
const Route = require('./models/Route');

dotenv.config();

const test = async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/local-bus-tracker');
  
  const kk = await District.findOne({ name: 'Kanyakumari' });
  const startStop = await Stop.findOne({ name: 'Kanyakumari' });
  const destinationStop = await Stop.findOne({ name: 'Nagercoil' });

  console.log(`kk: ${kk._id}, start: ${startStop._id}, dest: ${destinationStop._id}`);

  let filter = { district: kk._id };
  let buses = await Bus.find(filter).populate('route').populate('driver', 'name');

  buses = buses.filter(bus => {
    if (!bus.route || !bus.route.orderedStops) return false;
    const startIndex = bus.route.orderedStops.findIndex(s => s.toString() === startStop._id.toString());
    const destIndex = bus.route.orderedStops.findIndex(s => s.toString() === destinationStop._id.toString());
    return startIndex !== -1 && destIndex !== -1 && startIndex < destIndex;
  });

  console.log('Result for Kanyakumari -> Nagercoil:', buses.length);

  const startStop2 = await Stop.findOne({ name: 'Nagercoil' });
  const destinationStop2 = await Stop.findOne({ name: 'Kanyakumari' });
  
  let buses2 = await Bus.find(filter).populate('route').populate('driver', 'name');
  buses2 = buses2.filter(bus => {
    if (!bus.route || !bus.route.orderedStops) return false;
    const startIndex = bus.route.orderedStops.findIndex(s => s.toString() === startStop2._id.toString());
    const destIndex = bus.route.orderedStops.findIndex(s => s.toString() === destinationStop2._id.toString());
    return startIndex !== -1 && destIndex !== -1 && startIndex < destIndex;
  });
  console.log('Result for Nagercoil -> Kanyakumari (invalid order):', buses2.length);

  process.exit(0);
};

test();
