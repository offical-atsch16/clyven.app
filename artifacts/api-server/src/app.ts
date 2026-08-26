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
