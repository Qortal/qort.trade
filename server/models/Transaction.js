const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const transactionSchema = new Schema({
  signature: { type: String, required: true, unique: true },
  amount: { type: Number, required: true },
  fromAddress: { type: String, required: true },
  toAddress: { type: String, required: true },
  game: { type: mongoose.Schema.Types.ObjectId, ref: 'Game', required: true },
});

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;
