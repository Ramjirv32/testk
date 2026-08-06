require('dotenv').config();
const jwt = require('jsonwebtoken');

const getSecret = () => process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

const generateToken = (payload) => {
  return jwt.sign(payload, getSecret(), {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, getSecret());
  } catch (error) {
    return null;
  }
};

const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    return null;
  }
};

module.exports = {
  generateToken,
  verifyToken,
  decodeToken,
};
