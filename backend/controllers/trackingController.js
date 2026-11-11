const Trip = require('../models/Trip');
const Bus = require('../models/Bus');
const LiveLocation = require('../models/LiveLocation');

// @desc    Get tracking data for a specific bus
// @route   GET /api/tracking/buses/:id
// @access  Public
const getBusTrackingData = async (req, res) => {
  try {
    const busParam = req.params.id;

    // Support either MongoDB ObjectId or busNumber
    let bus = null;
    if (busParam && busParam.match(/^[0-9a-fA-F]{24}$/)) {
      bus = await Bus.findById(busParam)
        .populate('district', 'name state code')
        .populate('driver', 'name email phone')
        .populate('currentDriver', 'name email phone')
        .populate({
          path: 'route',
          populate: { path: 'source destination orderedStops', select: 'name latitude longitude' }
        });
    }

    if (!bus && busParam) {
      bus = await Bus.findOne({ busNumber: busParam })
        .populate('district', 'name state code')
        .populate('driver', 'name email phone')
        .populate('currentDriver', 'name email phone')
        .populate({
          path: 'route',
          populate: { path: 'source destination orderedStops', select: 'name latitude longitude' }
        });
    }

    if (!bus) {
      return res.status(404).json({ message: 'Bus not found' });
    }

    // Find the active or paused trip for this bus
    const activeTrip = await Trip.findOne({ bus: bus._id, status: { $in: ['ACTIVE', 'PAUSED'] } })
      .populate('driver', 'name email phone')
      .populate({
        path: 'route',
        populate: { path: 'orderedStops source destination', select: 'name latitude longitude' }
      })
      .populate('currentStop nextStop', 'name latitude longitude');

    // Find latest live location from LiveLocation history
    let latestLocation = await LiveLocation.findOne({ bus: bus._id }).sort({ timestamp: -1 });

    // Fallback to bus.currentLocation if LiveLocation has no entries
    if (!latestLocation && bus.currentLocation?.lat && bus.currentLocation?.lng) {
      latestLocation = {
        latitude: bus.currentLocation.lat,
        longitude: bus.currentLocation.lng,
        lat: bus.currentLocation.lat,
        lng: bus.currentLocation.lng,
        timestamp: bus.currentLocation.updatedAt || bus.updatedAt
      };
    } else if (latestLocation) {
      // Normalize both lat/lng and latitude/longitude properties
      latestLocation = {
        _id: latestLocation._id,
        latitude: latestLocation.latitude,
        longitude: latestLocation.longitude,
        lat: latestLocation.latitude,
        lng: latestLocation.longitude,
        accuracy: latestLocation.accuracy,
        timestamp: latestLocation.timestamp
      };
    }

    // Determine resolved human-readable display fields
    const operatorName = bus.operator || bus.currentDriver?.name || bus.driver?.name || 'Local Fleet Operator';
    const driverName = activeTrip?.driver?.name || bus.currentDriver?.name || bus.driver?.name || 'Assigned Driver';
    const trackingStatus = activeTrip
      ? (activeTrip.status === 'PAUSED' ? 'PAUSED' : 'LIVE')
      : (latestLocation ? 'LAST KNOWN' : 'IDLE');

    res.json({
      bus,
      trip: activeTrip || null,
      liveLocation: latestLocation || null,
      status: trackingStatus,
      operatorName,
      driverName,
      currentStopName: activeTrip?.currentStop?.name || 'In Transit',
      nextStopName: activeTrip?.nextStop?.name || (activeTrip?.route?.destination?.name || 'En Route'),
      lastUpdated: latestLocation?.timestamp || bus.currentLocation?.updatedAt || bus.updatedAt
    });

  } catch (error) {
    console.error('getBusTrackingData error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { getBusTrackingData };
