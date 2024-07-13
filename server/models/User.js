const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    qortAddress: { type: String, required: true, unique: true }
  });
  
module.exports = User = mongoose.model('User', userSchema);
  