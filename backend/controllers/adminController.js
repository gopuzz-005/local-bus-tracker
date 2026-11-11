const Bus = require('../models/Bus');
const Route = require('../models/Route');
const User = require('../models/User');
const Trip = require('../models/Trip');

const getDashboardStats = async (req, res) => {
  try {
    const totalBuses = await Bus.countDocuments();
    const totalRoutes = await Route.countDocuments();
    const totalDrivers = await User.countDocuments({ role: 'Driver' });
    const totalPassengers = await User.countDocuments({ role: 'Passenger' });
    const activeTrips = await Trip.countDocuments({ status: 'ACTIVE' });
    const totalTrips = await Trip.countDocuments();

    res.json({
      totalBuses,
      totalRoutes,
      totalDrivers,
      totalPassengers,
      activeTrips,
      totalTrips
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching stats', error: error.message });
  }
};

const getAdminUsers = async (req, res) => {
  try {
    const filter = {};
    if (req.query.role) filter.role = req.query.role;
    const users = await User.find(filter).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
};

const getAdminDrivers = async (req, res) => {
  try {
    const drivers = await User.find({ role: 'Driver' }).select('-password').sort({ name: 1 });
    res.json(drivers);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching drivers', error: error.message });
  }
};

module.exports = {
  getDashboardStats,
  getAdminUsers,
  getAdminDrivers
};
