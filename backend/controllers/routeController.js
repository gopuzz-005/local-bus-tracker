const Route = require('../models/Route');

const normalizeRoute = (route) => {
  const startPoint = route.source?.name || route.startPoint || 'Not specified';
  const endPoint = route.destination?.name || route.endPoint || 'Not specified';
  const orderedStops = Array.isArray(route.orderedStops)
    ? route.orderedStops.map((stop) => stop?.name || stop)
    : [];

  return {
    ...route.toObject ? route.toObject() : route,
    routeName: route.routeName || `${startPoint} - ${endPoint}`.trim(),
    routeNumber: route.routeNumber || route.routeName || 'N/A',
    startPoint,
    endPoint,
    stops: orderedStops.length ? orderedStops : route.stops || [],
    status: route.status || (route.active === false ? 'Inactive' : 'Active'),
    active: route.active ?? true,
  };
};

const getRoutes = async (req, res) => {
  try {
    const routes = await Route.find({})
      .populate('district', 'name state code')
      .populate('source', 'name latitude longitude')
      .populate('destination', 'name latitude longitude')
      .populate('orderedStops', 'name latitude longitude');

    res.json(routes.map(normalizeRoute));
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const createRoute = async (req, res) => {
  try {
    const { routeName, routeNumber, district, source, destination, orderedStops } = req.body;
    const routeExists = await Route.findOne({ routeNumber, district });
    if (routeExists) return res.status(400).json({ message: 'Route number already exists in this district' });
    
    const route = await Route.create({ 
      routeName,
      routeNumber,
      district,
      source,
      destination,
      orderedStops,
    });
    res.status(201).json(normalizeRoute(route));
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const deleteRoute = async (req, res) => {
  try {
    const route = await Route.findById(req.params.id);
    if (!route) return res.status(404).json({ message: 'Route not found' });
    
    await route.deleteOne();
    res.json({ message: 'Route removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { getRoutes, createRoute, deleteRoute };
