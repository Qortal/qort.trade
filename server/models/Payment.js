const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    game: { type: mongoose.Schema.Types.ObjectId, ref: 'Game', required: true },
    createdAt: { type: Date, default: Date.now },
    signature: { type: String, required: true },  // New required string field
    status: { type: String, enum: ['payment-in-not-confirmed', 'payment-in-confirmed', 'payment-out-pending', 'payment-out-done'], default: null }
});

module.exports = Payment = mongoose.model('Payment', paymentSchema);
