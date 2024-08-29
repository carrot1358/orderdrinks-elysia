import { Elysia } from "elysia";
import { lineLogin, lineCallback } from "~/controllers/lineAuthController";

const lineAuthRoutes = (app: Elysia) => {
  app.group("/line", (app) =>
    app.get("/login", lineLogin).get("/callback", lineCallback)
  );
};

export default lineAuthRoutes as any;
