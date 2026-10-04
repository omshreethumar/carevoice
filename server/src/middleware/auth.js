const jwt = require('jsonwebtoken');
const { AppError } = require('./errorHandler');

function signToken(user, rememberMe = false) {
  const expiresIn = rememberMe
    ? process.env.JWT_REMEMBER_EXPIRES_IN || '30d'
    : process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign(
    { sub: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn }
  );
}

function authRequired(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    return next(new AppError('Please sign in to continue.', 401, 'UNAUTHORIZED'));
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.sub;
    req.userEmail = payload.email;
    return next();
  } catch {
    return next(new AppError('Your session has expired. Please sign in again.', 401, 'UNAUTHORIZED'));
  }
}

module.exports = { signToken, authRequired };
