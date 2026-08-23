import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import { clerkMiddleware } from "@clerk/express";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map(url => url.trim()).filter(Boolean)
  : ['http://localhost:5173'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.pages.dev')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.get('/', (req, res) => {
  res.status(200).send('OK');
});

const healthHandler = (_req: express.Request, res: express.Response) => {
  res.send('OK');
};

app.get('/health', healthHandler);
app.get('/api/health', healthHandler);
app.use(cookieParser());

// Anti-CSRF protection middleware for cookie-authenticated state-changing requests
app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
  const isStateChanging = ["POST", "PUT", "PATCH", "DELETE"].includes(req.method.toUpperCase());
  const hasCookies = req.cookies && Object.keys(req.cookies).length > 0;

  if (isStateChanging && hasCookies) {
    const origin = req.headers["origin"] || req.headers["referer"];
    const secFetchSite = req.headers["sec-fetch-site"];
    const authHeader = req.headers["authorization"] || req.headers["x-requested-with"] || req.headers["x-csrf-token"];

    if (authHeader) {
      return next();
    }

    if (secFetchSite && ["same-origin", "same-site", "none"].includes(secFetchSite as string)) {
      return next();
    }

    if (origin) {
      const originStr = String(origin);
      const isAllowed = allowedOrigins.some((allowed) => originStr.startsWith(allowed)) || originStr.endsWith(".pages.dev");
      if (!isAllowed) {
        return res.status(403).json({ error: "Forbidden: CSRF protection triggered due to unallowed request origin" });
      }
    }
  }
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

import { readOnlyGuard } from "./middlewares/readOnly.js";

app.use(clerkMiddleware({
  publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
}));

app.use("/api", readOnlyGuard, router);

app.use((err: any, req: any, res: any, next: any) => {
  console.error("=== DETAILED ROUTE ERROR ===");
  console.error(err);
  res.status(500).json({
    error: err.message || "Internal Server Error",
    details: String(err)
  });
});

export default app;
