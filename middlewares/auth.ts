import { Context } from "elysia";
import { User } from "~/models";
import { jwt } from "~/utils";
import { swagger } from "@elysiajs/swagger";

interface DecodedToken {
  data: {
    userId: string;
  };
}

/**
 * @name auth
 * @description Middleware to protect routes with JWT
 */
export const auth: any = async (c: Context) => {
  let token;
  if (c.headers.authorization && c.headers.authorization.startsWith("Bearer")) {
    try {
      token = c.headers.authorization.split(" ")[1];
      const decoded = (await jwt.verify(token)) as unknown as DecodedToken;
      const user = await User.findOne({ userId: decoded.data.userId });

      c.request.headers.set("userId", user?.userId ?? "");
      c.request.headers.set("isAdmin", user?.isAdmin ? "true" : "false");
      c.request.headers.set("role", user?.role ?? "");
    } catch (error) {
      c.set.status = 401;
      throw new Error("Not authorized, Invalid token!");
    }
  }

  if (!token) {
    c.set.status = 401;
    throw new Error("Not authorized, No token found!");
  }
};

/**
 * @name admin
 * @description Middleware to protect routes with JWT and protect routes for admin only
 */
export const admin: any = async (c: Context) => {
  await auth(c);

  const isAdmin = c.request.headers.get("isAdmin");

  if (!isAdmin || isAdmin === "false") {
    c.set.status = 401;
    throw new Error("Not authorized as an Admin!");
  }
};

export const driver: any = async (c: Context) => {
  await auth(c);

  const role = c.request.headers.get("role");

  if (!role || (role !== "driver" && role !== "admin")) {
    c.set.status = 401;
    throw new Error("Not authorized as a driver!");
  }
};

// Add swagger plugin
export const swaggerMiddleware = swagger({
  documentation: {
    info: {
      title: "Elysia API",
      version: "1.0.0",
    },
  },
});
