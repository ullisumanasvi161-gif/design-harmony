import crypto from "node:crypto";

const SECRET = process.env.JWT_SECRET || "design-harmony-local-demo-secret";

const encode = (value) =>
  Buffer.from(JSON.stringify(value)).toString("base64url");

export function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(":");
  const attempt = crypto.scryptSync(password, salt, 64);
  return crypto.timingSafeEqual(attempt, Buffer.from(hash, "hex"));
}

export function signToken(payload, ttlSeconds = 60 * 60 * 24 * 7) {
  const header = encode({ alg: "HS256", typ: "JWT" });
  const body = encode({ ...payload, exp: Math.floor(Date.now() / 1000) + ttlSeconds });
  const signature = crypto
    .createHmac("sha256", SECRET)
    .update(`${header}.${body}`)
    .digest("base64url");
  return `${header}.${body}.${signature}`;
}

export function verifyToken(token) {
  const [header, body, signature] = token.split(".");
  if (!header || !body || !signature) throw new Error("Invalid token");
  const expected = crypto
    .createHmac("sha256", SECRET)
    .update(`${header}.${body}`)
    .digest("base64url");
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    throw new Error("Invalid signature");
  }
  const payload = JSON.parse(Buffer.from(body, "base64url").toString());
  if (payload.exp < Math.floor(Date.now() / 1000)) throw new Error("Expired token");
  return payload;
}

export function requireAuth(roles = []) {
  return (req, res, next) => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "");
      req.user = verifyToken(token);
      if (roles.length && !roles.includes(req.user.role)) {
        return res.status(403).json({ message: "You do not have access to this resource." });
      }
      next();
    } catch {
      res.status(401).json({ message: "Please sign in to continue." });
    }
  };
}
