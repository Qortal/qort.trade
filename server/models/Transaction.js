const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const transactionSchema = new Schema({
  qortalAtAddress: { type: String, required: true },
  qortAddress: { type: String, required: true },
  node: { type: String, required: true },
  status: { type: String, enum: ['started', 'message-not-sent', 'message-sent', 'message-received'], default: 'started' },
});

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;
