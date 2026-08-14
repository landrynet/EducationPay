import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes/index.js";
import { logger } from "./lib/logger.js";
import { supabaseConfig } from "./lib/supabase-admin.js";

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
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, _res, next) => {
  if (req.url.startsWith("/api/index.ts")) {
    req.url = req.url.replace("/api/index.ts", "/api");
  } else if (req.url.startsWith("/api/index")) {
    req.url = req.url.replace("/api/index", "/api");
  }
  next();
});

app.use(["/api/establishment-applications", "/establishment-applications"], (_req, res, next) => {
  if (!supabaseConfig.isConfigured) {
    res.status(503).json({
      message:
        "Le service d’inscription est temporairement indisponible. Configurez Supabase puis réessayez.",
    });
    return;
  }
  next();
});

app.use("/api", router);
app.use("/", router);

app.use((req, res) => {
  res.status(404).json({
    message: `Route API introuvable : ${req.method} ${req.path}`,
  });
});

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error({ err }, "Unhandled API error");
  const statusCode =
    typeof err?.status === "number" && err.status >= 400 && err.status < 600
      ? err.status
      : 500;
  res.status(statusCode).json({
    message:
      typeof err?.message === "string" && err.message
        ? err.message
        : "Une erreur interne du serveur est survenue.",
  });
});

export default app;
