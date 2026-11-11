const Trip = require('../models/Trip');
const Bus = require('../models/Bus');
const Route = require('../models/Route');
const LiveLocation = require('../models/LiveLocation');

// @desc    Get all trips
// @route   GET /api/trips
// @access  Public / Admin
const getTrips = async (req, res) => {
  try {
    const trips = await Trip.find()
      .populate('bus', 'name busNumber type operator status')
      .populate('driver', 'name email phone')
      .populate({
        path: 'route',
        populate: { path: 'source destination orderedStops', select: 'name latitude longitude' }
      })
      .populate('currentStop nextStop', 'name latitude longitude')
      .sort({ createdAt: -1 });

    res.json(trips);
  } catch (error) {
    console.error('getTrips error:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get active trip for current driver or specified bus
// @route   GET /api/trips/active
// @access  Private
const getActiveTrip = async (req, res) => {
  try {
    const query = { status: { $in: ['ACTIVE', 'PAUSED'] } };

    if (req.query.busId) {
      query.bus = req.query.busId;
    } else if (req.user) {
      // If driver is querying, find trip for this driver or their assigned bus
      query.$or = [
        { driver: req.user._id },
        { bus: { $in: await Bus.find({ $or: [{ driver: req.user._id }, { currentDriver: req.user._id }] }).distinct('_id') } }
      ];
      delete query.bus;
    }

    const trip = await Trip.findOne(query)
      .populate('bus', 'name busNumber type operator status currentLocation district')
      .populate('driver', 'name email phone')
      .populate({
        path: 'route',
        populate: { path: 'source destination orderedStops', select: 'name latitude longitude' }
      })
      .populate('currentStop nextStop', 'name latitude longitude')
      .sort({ createdAt: -1 });

    if (!trip) {
      return res.json({ active: false, trip: null, message: 'No active trip in progress' });
    }

    res.json({
      active: true,
      trip
    });
  } catch (error) {
    console.error('getActiveTrip error:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Start a live trip
// @route   POST /api/trips/start
// @access  Private/Driver or Admin
const startTrip = async (req, res) => {
  try {
    const { busId, routeId } = req.body;

    if (!busId) {
      return res.status(400).json({ message: 'Bus ID is required to start a trip' });
    }

    // Find bus by ID or busNumber
    let bus = null;
    if (busId.toString().match(/^[0-9a-fA-F]{24}$/)) {
      bus = await Bus.findById(busId);
    }
    if (!bus) {
      bus = await Bus.findOne({ busNumber: busId.toString() });
    }

    if (!bus) {
      return res.status(404).json({ message: `Bus with identifier "${busId}" not found in database.` });
    }

    // Prevent duplicate active trips for this bus
    const existingBusTrip = await Trip.findOne({
      bus: bus._id,
      status: { $in: ['ACTIVE', 'PAUSED'] }
    })
      .populate('bus', 'name busNumber type operator status currentLocation district')
      .populate('driver', 'name email phone')
      .populate({
        path: 'route',
        populate: { path: 'source destination orderedStops', select: 'name latitude longitude' }
      })
      .populate('currentStop nextStop', 'name latitude longitude');

    if (existingBusTrip) {
      // If the current driver is the one who owns this active trip, return it cleanly
      if (existingBusTrip.driver?._id?.toString() === req.user._id.toString()) {
        return res.json({
          message: 'Active trip restored for this bus',
          trip: existingBusTrip,
          restored: true
        });
      } else {
        return res.status(400).json({
          message: `Bus "${bus.busNumber}" is already in an active trip by another driver (${existingBusTrip.driver?.name || 'Driver'}).`,
          trip: existingBusTrip
        });
      }
    }

    // Check if this driver already has another active trip on a different bus
    const existingDriverTrip = await Trip.findOne({
      driver: req.user._id,
      status: { $in: ['ACTIVE', 'PAUSED'] }
    });

    if (existingDriverTrip) {
      // Complete previous active trip cleanly
      existingDriverTrip.status = 'COMPLETED';
      existingDriverTrip.endTime = new Date();
      await existingDriverTrip.save();
    }

    // Determine Route
    let targetRouteId = routeId || bus.route;
    if (!targetRouteId) {
      // Find a default active route if not explicitly set
      const defaultRoute = await Route.findOne({ active: true });
      if (defaultRoute) targetRouteId = defaultRoute._id;
    }

    if (!targetRouteId) {
      return res.status(400).json({ message: 'No route assigned to this bus. Please assign a route first.' });
    }

    const route = await Route.findById(targetRouteId).populate('orderedStops source destination');
    if (!route) {
      return res.status(404).json({ message: 'Assigned route not found' });
    }

    const firstStop = route.orderedStops?.[0]?._id || route.source?._id;
    const secondStop = route.orderedStops?.[1]?._id || route.destination?._id;

    // Create the new active trip
    const trip = await Trip.create({
      bus: bus._id,
      driver: req.user._id,
      route: route._id,
      startTime: new Date(),
      status: 'ACTIVE',
      currentStop: firstStop || null,
      nextStop: secondStop || null
    });

    // Update bus state
    bus.currentDriver = req.user._id;
    bus.status = 'Active';
    bus.route = route._id;
    if (route.routeCoordinates && route.routeCoordinates.length > 0) {
      bus.currentLocation = {
        lat: route.routeCoordinates[0].latitude,
        lng: route.routeCoordinates[0].longitude,
        updatedAt: new Date()
      };
    }
    await bus.save();

    // Record initial live location
    if (bus.currentLocation?.lat) {
      await LiveLocation.create({
        trip: trip._id,
        bus: bus._id,
        latitude: bus.currentLocation.lat,
        longitude: bus.currentLocation.lng,
        timestamp: new Date()
      });
    }

    // Fetch fully populated trip to return
    const populatedTrip = await Trip.findById(trip._id)
      .populate('bus', 'name busNumber type operator status currentLocation district')
      .populate('driver', 'name email phone')
      .populate({
        path: 'route',
        populate: { path: 'source destination orderedStops', select: 'name latitude longitude' }
      })
      .populate('currentStop nextStop', 'name latitude longitude');

    // Emit live notification through Socket.IO if available
    if (req.io) {
      req.io.to(bus._id.toString()).emit('tripStarted', {
        busId: bus._id.toString(),
        trip: populatedTrip
      });
    }

    res.status(201).json({
      message: 'Trip started successfully',
      trip: populatedTrip
    });
  } catch (error) {
    console.error('startTrip error:', error);
    res.status(500).json({ message: 'Failed to start trip', error: error.message });
  }
};

// @desc    Update trip status (Pause / Resume / Cancel)
// @route   PUT /api/trips/:id/status
// @access  Private/Driver or Admin
const updateTripStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const trip = await Trip.findById(req.params.id);
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    trip.status = status;
    if (status === 'COMPLETED' || status === 'CANCELLED') {
      trip.endTime = new Date();
      // Update bus status
      await Bus.findByIdAndUpdate(trip.bus, { status: 'Inactive' });
    }
    await trip.save();

    const populatedTrip = await Trip.findById(trip._id)
      .populate('bus', 'name busNumber type operator status currentLocation district')
      .populate('driver', 'name email phone')
      .populate({
        path: 'route',
        populate: { path: 'source destination orderedStops', select: 'name latitude longitude' }
      })
      .populate('currentStop nextStop', 'name latitude longitude');

    if (req.io) {
      req.io.to(trip.bus.toString()).emit('tripStatusChanged', {
        busId: trip.bus.toString(),
        status,
        trip: populatedTrip
      });
    }

    res.json({
      message: `Trip status updated to ${status}`,
      trip: populatedTrip
    });
  } catch (error) {
    console.error('updateTripStatus error:', error);
    res.status(500).json({ message: 'Failed to update trip status', error: error.message });
  }
};

// @desc    Update trip live location & current/next stop
// @route   PUT /api/trips/:id/location
// @access  Private/Driver or Admin
const updateTripLocation = async (req, res) => {
  try {
    const { lat, lng, latitude, longitude, currentStopId, nextStopId } = req.body;
    const finalLat = lat !== undefined ? Number(lat) : Number(latitude);
    const finalLng = lng !== undefined ? Number(lng) : Number(longitude);

    if (isNaN(finalLat) || isNaN(finalLng)) {
      return res.status(400).json({ message: 'Valid latitude and longitude are required' });
    }

    const trip = await Trip.findById(req.params.id);
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    if (currentStopId) trip.currentStop = currentStopId;
    if (nextStopId) trip.nextStop = nextStopId;
    await trip.save();

    // Update Bus current location
    await Bus.findByIdAndUpdate(trip.bus, {
      currentLocation: {
        lat: finalLat,
        lng: finalLng,
        updatedAt: new Date()
      },
      status: 'Active'
    });

    // Record in LiveLocation history
    await LiveLocation.create({
      trip: trip._id,
      bus: trip.bus,
      latitude: finalLat,
      longitude: finalLng,
      timestamp: new Date()
    });

    // Broadcast through socket
    if (req.io) {
      req.io.to(trip.bus.toString()).emit('busLocation', {
        busId: trip.bus.toString(),
        lat: finalLat,
        lng: finalLng,
        latitude: finalLat,
        longitude: finalLng,
        status: trip.status === 'PAUSED' ? 'PAUSED' : 'LIVE',
        tripId: trip._id,
        timestamp: new Date()
      });
    }

    res.json({
      success: true,
      currentLocation: { lat: finalLat, lng: finalLng },
      tripStatus: trip.status
    });
  } catch (error) {
    console.error('updateTripLocation error:', error);
    res.status(500).json({ message: 'Failed to update location', error: error.message });
  }
};

// @desc    End an active trip
// @route   PUT /api/trips/:id/end
// @access  Private/Driver or Admin
const endTrip = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    trip.status = 'COMPLETED';
    trip.endTime = new Date();
    await trip.save();

    // Mark bus inactive
    await Bus.findByIdAndUpdate(trip.bus, {
      status: 'Inactive',
      currentDriver: null
    });

    if (req.io) {
      req.io.to(trip.bus.toString()).emit('tripEnded', {
        busId: trip.bus.toString(),
        tripId: trip._id
      });
    }

    res.json({
      message: 'Trip ended successfully',
      trip
    });
  } catch (error) {
    console.error('endTrip error:', error);
    res.status(500).json({ message: 'Failed to end trip', error: error.message });
  }
};

// @desc    Get trip history for logged in driver
// @route   GET /api/trips/driver-history
// @access  Private/Driver
const getDriverHistory = async (req, res) => {
  try {
    const trips = await Trip.find({ driver: req.user._id })
      .populate('bus', 'name busNumber type')
      .populate({
        path: 'route',
        populate: { path: 'source destination', select: 'name' }
      })
      .sort({ createdAt: -1 })
      .limit(20);

    res.json(trips);
  } catch (error) {
    console.error('getDriverHistory error:', error);
    res.status(500).json({ message: 'Failed to fetch driver trip history', error: error.message });
  }
};

// @desc    Create a trip (Admin)
// @route   POST /api/trips
// @access  Private/Admin
const createTrip = async (req, res) => {
  try {
    const data = new Trip(req.body);
    const createdData = await data.save();
    res.status(201).json(createdData);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

module.exports = {
  getTrips,
  getActiveTrip,
  startTrip,
  updateTripStatus,
  updateTripLocation,
  endTrip,
  getDriverHistory,
  createTrip
};
