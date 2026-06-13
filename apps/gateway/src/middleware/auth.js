const { createRemoteJWKSClient } = require("jose");
const { jwtVerify, createRemoteJWKSet } = require("jose");

const JWKS_URI =
  process.env.KEYCLOAK_JWKS_URI ||
  "http://keycloak:8080/auth/realms/grailkits/protocol/openid-connect/certs";

const JWKS = createRemoteJWKSet(new URL(JWKS_URI));

const authenticate = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader?.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ error: "Missing or invalid Authorization header" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer:
        process.env.KEYCLOAK_ISSUER || "http://localhost/auth/realms/grailkits",
    });
    req.user = payload;
    req.roles = payload.realm_access?.roles || [];
    next();
  } catch (err) {
    return res
      .status(401)
      .json({ error: "Invalid or expired token", details: err.message });
  }
};

const requireRole = (role) => (req, res, next) => {
  if (!req.roles?.includes(role)) {
    return res.status(403).json({ error: "Forbidden — insufficient role" });
  }
  next();
};

module.exports = { authenticate, requireRole };
