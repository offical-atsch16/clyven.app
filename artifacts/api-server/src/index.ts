import app from "./app";
import { logger } from "./lib/logger";

const rawPort = process.env["PORT"];
let port = 10000;

if (rawPort) {
  const parsedPort = Number(rawPort);
  if (!Number.isNaN(parsedPort) && parsedPort > 0) {
    port = parsedPort;
  } else {
    logger.warn({ rawPort }, "Invalid PORT value provided, falling back to 10000");
  }
} else {
  logger.info("No PORT environment variable provided, falling back to 10000");
}

app.listen(port, "0.0.0.0", () => {
  logger.info({ port, host: "0.0.0.0" }, "Server listening");
});
