const mongoose = require("mongoose");

const gameSchema = new mongoose.Schema({
  players: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // This remains to keep track of all players in the game
  playerPayments: [{
    player: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    payment: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment', default: null } // Reference to their payment
  }],
  history: [{
    state: [[String]],  // 2D array representing the game's final state
    winner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },  // Game winner
    startedAt: { type: Date, default: Date.now },
    tie: { type: Boolean, default: false },  // Indicates if the game ended in a tie
  }],
  winner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  status: { type: String, enum: ['waiting', 'active', 'finished', 'finished-forfeit', 'finished-both-disconnected'], default: 'waiting' },
  createdAt: { type: Date, default: Date.now },
  roomId: { type: String, required: true, unique: true },  // Makes `roomId` a required field
  payoutStatus: { type: String, enum: ['paid', 'refund', 'pending'], default: 'pending' },
  payoutPayments: [{
    player: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    payment: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment', default: null } 
  }],
  // New fields for series handling
  series: {
    totalGames: { type: Number, default: 3 }, // Default to a best-of-3 series
    scores: [{
      player: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Reference to the User model
      score: Number
    }]
  }
});

module.exports = Game = mongoose.model('Game', gameSchema);
