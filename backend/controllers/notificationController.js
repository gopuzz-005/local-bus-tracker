const Notification = require('../models/Notification');

// @desc    Get all notifications
// @route   GET /api/notifications
// @access  Public
const getNotifications = async (req, res) => {
  try {
    const data = await Notification.find();
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Create a notification
// @route   POST /api/notifications
// @access  Private/Admin
const createNotification = async (req, res) => {
  try {
    const data = new Notification(req.body);
    const createdData = await data.save();
    res.status(201).json(createdData);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

const getUserNotifications = async (req, res) => {
  try {
    const data = await Notification.find({ user: req.params.userId }).sort({ createdAt: -1 });
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

const markNotificationRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ message: 'Not found' });
    }
    notification.read = true;
    await notification.save();
    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = { getNotifications, createNotification, getUserNotifications, markNotificationRead };
