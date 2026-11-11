const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const busRoutes = require('./routes/busRoutes');
const districtRoutes = require('./routes/districtRoutes');
const trackingRoutes = require('./routes/trackingRoutes');
const stopRoutes = require('./routes/stopRoutes');
const routeRoutes = require('./routes/routeRoutes');
const favoriteRoutes = require('./routes/favoriteRoutes');
const localityRoutes = require('./routes/localityRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');
const fareRoutes = require('./routes/fareRoutes');
const tripRoutes = require('./routes/tripRoutes');
const alertRoutes = require('./routes/alertRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();
const server = http.createServer(app);

// Socket.IO configuration
const allowedOrigins = ['http://localhost:5173', 'http://localhost:5174'];
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
  }
});

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET','POST','PUT','DELETE','OPTIONS']
}));
app.use(express.json());
app.use(cookieParser());

// Attach io to requests
app.use((req, res, next) => {
  req.io = io;
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/buses', busRoutes);
app.use('/api/districts', districtRoutes);
app.use('/api/tracking', trackingRoutes);
app.use('/api/stops', stopRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/localities', localityRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/fares', fareRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/notifications', notificationRoutes);

// Socket.IO Logic
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Driver joins a room for a specific bus
  socket.on('driverJoin', (busId) => {
    if (busId) {
      socket.join(busId.toString());
      console.log(`Driver joined room: ${busId}`);
    }
  });

  // Passenger joins a room for a specific bus to track
  socket.on('passengerJoin', (busId) => {
    if (busId) {
      socket.join(busId.toString());
      console.log(`Passenger joined room: ${busId}`);
    }
  });

  // Driver emits location update
  socket.on('locationUpdate', async (data) => {
    try {
      const lat = data.lat !== undefined ? Number(data.lat) : Number(data.latitude);
      const lng = data.lng !== undefined ? Number(data.lng) : Number(data.longitude);
      const busId = data.busId;

      if (!busId || isNaN(lat) || isNaN(lng)) return;

      const broadcastData = {
        busId: busId.toString(),
        lat,
        lng,
        latitude: lat,
        longitude: lng,
        status: data.status || 'LIVE',
        tripId: data.tripId,
        timestamp: new Date()
      };

      io.to(busId.toString()).emit('busLocation', broadcastData);

      // Persist to MongoDB
      const Bus = require('./models/Bus');
      const Trip = require('./models/Trip');
      const LiveLocation = require('./models/LiveLocation');

      await Bus.findByIdAndUpdate(busId, {
        currentLocation: { lat, lng, updatedAt: new Date() },
        status: 'Active'
      });

      const activeTrip = await Trip.findOne({ bus: busId, status: { $in: ['ACTIVE', 'PAUSED'] } });
      if (activeTrip) {
        await LiveLocation.create({
          trip: activeTrip._id,
          bus: busId,
          latitude: lat,
          longitude: lng,
          timestamp: new Date()
        });
      }
    } catch (err) {
      console.error('Socket locationUpdate persistence error:', err.message);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Basic Route
app.get('/', (req, res) => {
  res.send('Bus Tracking API is running...');
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
