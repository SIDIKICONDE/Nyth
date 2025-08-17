const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const compression = require("compression");
const morgan = require("morgan");
const { config } = require("../config/env");

function buildCors() {
  const allowed = new Set(config.ALLOWED_ORIGINS);
  return cors({
    origin(origin, cb) {
      if (!origin || allowed.has(origin)) return cb(null, true);
      return cb(new Error("Not allowed by CORS"));
    },
    credentials: true,
    optionsSuccessStatus: 200,
  });
}

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Trop de requêtes, veuillez réessayer plus tard.",
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
});

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: "Limite de requêtes IA atteinte. Veuillez patienter.",
});

function applySecurity(app) {
  app.disable("x-powered-by");
  app.set("trust proxy", 1);
  app.use(compression());
  app.use(morgan("combined"));
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
      hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
    })
  );
  app.use(buildCors());
  app.use("/api/", globalLimiter);
  app.use("/api/auth/", authLimiter);
  app.use("/api/ai/", aiLimiter);
}

module.exports = { applySecurity };
