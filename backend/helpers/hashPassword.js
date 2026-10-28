
const bcrypt = require("bcryptjs");

const BCRYPT_ROUNDS = 10;
const BCRYPT_MAX_BYTES = 72;

function validatePasswordLength(password) {
  if (typeof password !== "string") {
    return false;
  }

  return (
    password.length >= 8 &&
    Buffer.byteLength(password, "utf8") <= BCRYPT_MAX_BYTES
  );
}

async function hashPassword(password) {
  if (!validatePasswordLength(password)) {
    throw new Error("INVALID_PASSWORD_LENGTH");
  }

  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

async function verifyPassword(password, passwordHash) {
  if (
    typeof password !== "string" ||
    typeof passwordHash !== "string" ||
    Buffer.byteLength(password, "utf8") > BCRYPT_MAX_BYTES
  ) {
    return false;
  }

  return bcrypt.compare(password, passwordHash);
}

module.exports = {
  hashPassword,
  verifyPassword,
  validatePasswordLength,
  BCRYPT_MAX_BYTES,
};
