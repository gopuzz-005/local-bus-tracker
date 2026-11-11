const Bus = require('../models/Bus');
const District = require('../models/District');
const Trip = require('../models/Trip');
const LiveLocation = require('../models/LiveLocation');

// @desc    Get all buses
// @route   GET /api/buses
// @access  Public
const getBuses = async (req, res) => {
  try {
    const { districtName, startStop, destinationStop } = req.query;
    let filter = {};

    if (districtName) {
      const district = await District.findOne({ name: districtName });
      if (district) {
        filter.district = district._id;
      }
    }

    let buses = await Bus.find(filter)
      .populate('district', 'name state code')
      .populate({
        path: 'route',
        populate: { path: 'source destination orderedStops', select: 'name latitude longitude' }
      })
      .populate('driver', 'name email phone')
      .populate('currentDriver', 'name email phone');

    if (startStop && destinationStop) {
      buses = buses.filter(bus => {
        if (!bus.route || !bus.route.orderedStops) return false;
        const startIndex = bus.route.orderedStops.findIndex(s => s._id?.toString() === startStop || s.toString() === startStop);
        const destIndex = bus.route.orderedStops.findIndex(s => s._id?.toString() === destinationStop || s.toString() === destinationStop);
        return startIndex !== -1 && destIndex !== -1 && startIndex < destIndex;
      });
    }

    res.json(buses);
  } catch (error) {
    console.error('getBuses error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Create a bus
// @route   POST /api/buses
// @access  Private/Admin
const createBus = async (req, res) => {
  try {
    const { name, busNumber, operator, type, district, route, driver } = req.body;

    const busExists = await Bus.findOne({ busNumber });
    if (busExists) {
      return res.status(400).json({ message: 'Bus already exists with this bus number' });
    }

    const bus = new Bus({
      name,
      busNumber,
      operator: operator || 'Transit Operator',
      type: type || 'Ordinary',
      district,
      route,
      driver
    });

    const createdBus = await bus.save();
    res.status(201).json(createdBus);
  } catch (error) {
    console.error('createBus error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Assign driver to bus
// @route   PUT /api/buses/:id/driver
// @access  Private/Admin
const assignDriver = async (req, res) => {
  try {
    const { driverId } = req.body;
    const bus = await Bus.findById(req.params.id);

    if (bus) {
      bus.driver = driverId;
      bus.currentDriver = driverId;
      bus.status = 'Active';
      const updatedBus = await bus.save();
      res.json(updatedBus);
    } else {
      res.status(404).json({ message: 'Bus not found' });
    }
  } catch (error) {
    console.error('assignDriver error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update bus location
// @route   PUT /api/buses/:id/location
// @access  Private/Driver or Admin
const updateLocation = async (req, res) => {
  try {
    const { lat, lng } = req.body;
    const bus = await Bus.findById(req.params.id);

    if (!bus) {
      return res.status(404).json({ message: 'Bus not found' });
    }

    // Allow driver assigned or admin
    const isAssigned =
      req.user.role === 'Admin' ||
      (bus.currentDriver && bus.currentDriver.toString() === req.user._id.toString()) ||
      (bus.driver && bus.driver.toString() === req.user._id.toString());

    if (!isAssigned) {
      return res.status(401).json({ message: 'Not authorized to update this bus location' });
    }

    bus.currentLocation = {
      lat: Number(lat),
      lng: Number(lng),
      updatedAt: new Date()
    };
    bus.status = 'Active';
    const updatedBus = await bus.save();

    // Also record in LiveLocation
    const activeTrip = await Trip.findOne({ bus: bus._id, status: { $in: ['ACTIVE', 'PAUSED'] } });
    if (activeTrip) {
      await LiveLocation.create({
        trip: activeTrip._id,
        bus: bus._id,
        latitude: Number(lat),
        longitude: Number(lng),
        timestamp: new Date()
      });
    }

    if (req.io) {
      req.io.to(bus._id.toString()).emit('busLocation', {
        busId: bus._id.toString(),
        lat: Number(lat),
        lng: Number(lng),
        latitude: Number(lat),
        longitude: Number(lng),
        status: 'LIVE',
        timestamp: new Date()
      });
    }

    res.json(updatedBus);
  } catch (error) {
    console.error('updateLocation error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get assigned bus for logged in driver
// @route   GET /api/buses/assigned
// @access  Private/Driver
const getAssignedBus = async (req, res) => {
  try {
    // Check driver or currentDriver assignment, or check active trip
    let bus = await Bus.findOne({
      $or: [
        { currentDriver: req.user._id },
        { driver: req.user._id }
      ]
    })
      .populate('district', 'name state code')
      .populate({
        path: 'route',
        populate: { path: 'source destination orderedStops', select: 'name latitude longitude' }
      })
      .populate('driver', 'name email phone')
      .populate('currentDriver', 'name email phone');

    // If still not found, check if there's any active trip with this driver
    if (!bus) {
      const activeTrip = await Trip.findOne({
        driver: req.user._id,
        status: { $in: ['ACTIVE', 'PAUSED'] }
      }).populate('bus');

      if (activeTrip && activeTrip.bus) {
        bus = await Bus.findById(activeTrip.bus._id)
          .populate('district', 'name state code')
          .populate({
            path: 'route',
            populate: { path: 'source destination orderedStops', select: 'name latitude longitude' }
          })
          .populate('driver', 'name email phone')
          .populate('currentDriver', 'name email phone');
      }
    }

    if (!bus) {
      // Find the first available bus as fallback recommendation
      const anyBus = await Bus.findOne()
        .populate('district', 'name state code')
        .populate({
          path: 'route',
          populate: { path: 'source destination orderedStops', select: 'name latitude longitude' }
        });
      return res.status(200).json(anyBus || null);
    }

    res.json(bus);
  } catch (error) {
    console.error('getAssignedBus error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get single bus by ID or busNumber
// @route   GET /api/buses/:id
// @access  Public / Private
const getBusById = async (req, res) => {
  try {
    const idParam = req.params.id;
    let query = {};

    if (idParam.match(/^[0-9a-fA-F]{24}$/)) {
      query._id = idParam;
    } else {
      query.busNumber = idParam;
    }

    const bus = await Bus.findOne(query)
      .populate('district', 'name state code')
      .populate({
        path: 'route',
        populate: { path: 'source destination orderedStops', select: 'name latitude longitude' }
      })
      .populate('driver', 'name email phone')
      .populate('currentDriver', 'name email phone');

    if (!bus) {
      return res.status(404).json({ message: 'Bus not found' });
    }

    // Attach active trip if one is running
    const activeTrip = await Trip.findOne({
      bus: bus._id,
      status: { $in: ['ACTIVE', 'PAUSED'] }
    })
      .populate('driver', 'name email phone')
      .populate('currentStop nextStop', 'name latitude longitude');

    const busObj = bus.toObject();
    busObj.activeTrip = activeTrip || null;
    busObj.operatorName = bus.operator || bus.currentDriver?.name || bus.driver?.name || 'Local Fleet Operator';
    busObj.driverName = activeTrip?.driver?.name || bus.currentDriver?.name || bus.driver?.name || 'Assigned Driver';

    res.json(busObj);
  } catch (error) {
    console.error('getBusById error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getBuses,
  createBus,
  assignDriver,
  updateLocation,
  getAssignedBus,
  getBusById
};
