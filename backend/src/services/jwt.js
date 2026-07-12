const crypto = require("crypto");

function base64url(input) {
  return Buffer.from(input).toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function base64urlJson(value) {
  return base64url(JSON.stringify(value));
}

function decodeBase64Url(input) {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  return Buffer.from(padded, "base64");
}

function parseExpiresIn(expiresIn) {
  if (typeof expiresIn === "number") {
    return expiresIn;
  }

  if (typeof expiresIn !== "string") {
    return 24 * 60 * 60;
  }

  const match = expiresIn.trim().match(/^(\d+)([smhd])$/i);
  if (!match) {
    return 24 * 60 * 60;
  }

  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();
  const multipliers = {
    s: 1,
    m: 60,
    h: 60 * 60,
    d: 60 * 60 * 24,
  };

  return amount * multipliers[unit];
}

function sign(payload, secret, options = {}) {
  const header = { alg: "HS256", typ: "JWT" };
  const issuedAt = Math.floor(Date.now() / 1000);
  const expiresIn = parseExpiresIn(options.expiresIn);
  const tokenPayload = {
    ...payload,
    iat: issuedAt,
    exp: issuedAt + expiresIn,
  };

  const encodedHeader = base64urlJson(header);
  const encodedPayload = base64urlJson(tokenPayload);
  const data = `${encodedHeader}.${encodedPayload}`;
  const signature = crypto.createHmac("sha256", secret).update(data).digest("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");

  return `${data}.${signature}`;
}

function verify(token, secret) {
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new Error("invalid token");
  }

  const [encodedHeader, encodedPayload, signature] = parts;
  const data = `${encodedHeader}.${encodedPayload}`;
  const expected = crypto.createHmac("sha256", secret).update(data).digest("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");

  if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    throw new Error("invalid signature");
  }

  const payload = JSON.parse(decodeBase64Url(encodedPayload).toString("utf8"));
  const now = Math.floor(Date.now() / 1000);

  if (payload.exp && payload.exp < now) {
    const error = new Error("jwt expired");
    error.name = "TokenExpiredError";
    throw error;
  }

  return payload;
}

module.exports = {
  sign,
  verify,
};
