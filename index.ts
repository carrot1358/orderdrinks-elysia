import { Elysia, t } from "elysia";
//
import {
  userRoutes,
  productRoutes,
  deviceRoutes,
  orderRoutes,
  paymentRoutes,
  lineAuthRoutes,
  lineWebhookRoutes,
  filterReportRoutes,
  reportRoute,
} from "./routes";
import { error, logger } from "./middlewares";
import { connectDB } from "./config";
import { swagger } from "@elysiajs/swagger";
import { setupWebSocket } from "./utils/websocket";
import { staticPlugin } from "@elysiajs/static";
import { cors } from "@elysiajs/cors";
import { User } from "~/models";
import { createDefaultPayment } from "~/controllers";
import cron from "node-cron";
import { checkAndSendMaintenanceNotifications } from "./utils";

// Create Elysia instance
const app = new Elysia();

// Config MongoDB
connectDB();

// Create default payment data
createDefaultPayment();

// Middlewares
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(
  swagger({
    documentation: {
      info: {
        title: "Elysia API",
        version: "1.0.0",
      },
      tags: [
        { name: "User", description: "User endpoints" },
        { name: "Product", description: "Product endpoints" },
        { name: "Device", description: "Device endpoints" },
        { name: "Order", description: "Order endpoints" },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
        },
      },
    },
  })
);
app.use(logger());
app.use(error());

// Setup WebSocket
setupWebSocket(app);

// Root Routes
app.get("/", ({ set }) => {
  set.headers["Content-Type"] = "text/html";
  return Bun.file("root.html");
});

// User Routes [api/v1/users]
app.use(userRoutes);

// Product Routes [api/v1/products]
app.use(productRoutes);

// Device Routes [api/v1/devices]
app.use(deviceRoutes);

// Order Routes [api/v1/orders]
app.use(orderRoutes);

// Payment Routes
app.use(paymentRoutes);

// Line Auth Routes
app.use(lineAuthRoutes);

// Line Webhook Routes
app.use(lineWebhookRoutes);

// Report Routes
app.use(reportRoute);

// Filter Report Routes
app.use(filterReportRoutes);

// Static Route for 'image' folder
app.use(
  staticPlugin({
    assets: "image",
    prefix: "/image",
  })
);

// ตั้งเวลาให้ทำงานทุกวันเวลา 00:00
cron.schedule("0 0 * * *", async () => {
  console.log("กำลังตรวจสอบการบำรุงรักษา...");
  await checkAndSendMaintenanceNotifications();
});

// Start the server
app.listen(Bun.env.PORT || 9000);

const hostname = Bun.env.HOSTNAME || "yourdomain.com";
const port = app.server?.port || 9000;
const protocol = Bun.env.NODE_ENV === "production" ? "https" : "http";
const url = `${protocol}://${hostname}${
  port !== 80 && port !== 443 ? `:${port}` : ""
}`;
const wsUrl = `ws://${hostname}:${port}`;

console.log(
  `🚀 Server is running at \u001b]8;;${url}\u001b\\${url}\u001b]8;;\u001b\\`
);
console.log(` Swagger: ${url}/swagger`);
console.log(` Websocket: ${wsUrl}/ws`);
