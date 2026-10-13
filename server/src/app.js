
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import cookieParser from 'cookie-parser';
import { UPLOAD_ROOT } from './config/paths.js';

// Routes
import authRoutes from './routes/auth.routes.js';
import profileRoutes from './routes/profile.routes.js';
import companyRoutes from './routes/company.routes.js';
import jobRoutes from './routes/job.routes.js';
import applicationRoutes from './routes/application.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import recommendationRoutes from './routes/recommendation.routes.js';
import adminRoutes from './routes/admin.routes.js';

const app = express();

/* =====================================================
   PROXY CONFIGURATION
===================================================== */

// Render/Railway/Heroku run behind a proxy.
// Required for correct client IP detection and secure cookies.
app.set('trust proxy', 1);

/* =====================================================
   CORS CONFIGURATION
===================================================== */

const allowedOrigins = [
  'https://jobportalmernapp.netlify.app',
  'http://localhost:5173',
];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests without an Origin header
    // such as server-to-server requests and health checks.
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.error(`CORS blocked origin: ${origin}`);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204,
};

// Register CORS once, before routes and other middleware.
app.use(cors(corsOptions));

/* =====================================================
   SECURITY MIDDLEWARE
===================================================== */

app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: 'cross-origin',
    },
  })
);

/* =====================================================
   BODY PARSING & COOKIES
===================================================== */

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

/* =====================================================
   DATA SANITIZATION
===================================================== */

// Protect against NoSQL injection.
app.use(mongoSanitize());

// Protect against XSS attacks.
app.use(xss());

/* =====================================================
   STATIC FILES
===================================================== */

// Resume / uploaded files.
app.use('/uploads', express.static(UPLOAD_ROOT));

/* =====================================================
   ROOT / HEALTH CHECK
===================================================== */

app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Job Portal Backend API is running',
    status: 'OK',
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'OK',
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
  });
});

/* =====================================================
   API ROUTES
===================================================== */

// Authentication
app.use('/api/v1/auth', authRoutes);

// User profiles
app.use('/api/v1/profile', profileRoutes);

// Companies
app.use('/api/v1/companies', companyRoutes);

// Jobs
app.use('/api/v1/jobs', jobRoutes);

// Applications
app.use('/api/v1/applications', applicationRoutes);

// Notifications
app.use('/api/v1/notifications', notificationRoutes);

// Job recommendations
app.use('/api/v1/recommendations', recommendationRoutes);

// Admin
app.use('/api/v1/admin', adminRoutes);

/* =====================================================
   404 HANDLER
===================================================== */

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'API Endpoint Not Found',
    path: req.originalUrl,
  });
});

/* =====================================================
   CENTRALIZED ERROR HANDLER
===================================================== */

app.use((err, req, res, next) => {
  let statusCode = err.status || err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors;

  if (err.name === 'ValidationError' && err.errors) {
    statusCode = 400;
    errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    message = 'Validation Error';
  } else if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path}`;
  } else if (err.code === 11000) {
    statusCode = 409;
    message = 'Duplicate value: this record already exists';
  } else if (err.name === 'MulterError') {
    statusCode = 400;
    message =
      err.code === 'LIMIT_FILE_SIZE'
        ? 'File is too large (maximum 5MB)'
        : err.message;
  } else if (err.type === 'entity.parse.failed') {
    statusCode = 400;
    message = 'Invalid JSON body';
  } else if (err.message === 'Not allowed by CORS') {
    statusCode = 403;
    message = 'Origin not allowed by CORS policy';
  }

  if (statusCode >= 500) {
    console.error('ERROR:', err);
  }

  if (res.headersSent) {
    return next(err);
  }

  res.status(statusCode).json({
    success: false,
    message:
      statusCode >= 500 && process.env.NODE_ENV === 'production'
        ? 'Internal Server Error'
        : message,
    ...(errors && { errors }),
    ...(process.env.NODE_ENV === 'development' &&
      statusCode >= 500 && { stack: err.stack }),
  });
});

/* =====================================================
   EXPORT APP
===================================================== */

export default app;
