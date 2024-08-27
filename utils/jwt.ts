import * as jose from "jose";

const secret = new TextEncoder().encode(Bun.env.JWT_SECRET || "secret");

type JWT = {
  data: jose.JWTPayload;
  exp?: string;
};

export const sign = async ({ data, exp = Bun.env.JWT_EXPIRE || "7d" }: JWT) =>
  await new jose.SignJWT({ data })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(exp)
    .sign(secret);

export const verify = async (jwt: string) =>
  (await jose.jwtVerify(jwt, secret)).payload;

export const getUserIdFromToken = async (authorizationHeader: string, raw: boolean): Promise<string | DecodedToken> => {
  if (!authorizationHeader || !authorizationHeader.startsWith("Bearer")) {
    throw new Error("ไม่พบ token");
  }

  const token = authorizationHeader.split(" ")[1];
  const decodedToken = await jwt.verify(token) as {data: DecodedToken};
  console.log("decodedToken", decodedToken);

  if (raw) {
    return decodedToken.data;
  } else {
    return decodedToken.data.userId;
  }
}

export const jwt = {
  sign,
  verify,
  getUserIdFromToken,
};

