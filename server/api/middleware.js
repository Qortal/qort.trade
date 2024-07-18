const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
  
    if (token == null) return res.sendStatus(401); // No token provided
  
    jwt.verify(token, process.env.TOKEN_SECRET_KEY, (err, user) => {
      if (err) return res.sendStatus(403); // Invalid token
  
      req.user = user; // Attach the user to the request
      next(); // Proceed to the next middleware or route handler
    });
  };

  module.exports = { authenticateToken };