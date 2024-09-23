const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const transactionSchema = new Schema({
  qortalAtAddress: { type: String, required: true },
  qortAddress: { type: String, required: true },
  node: { type: String, required: true },
  status: { type: String, enum: [ 'message-sent', 'trade-ongoing', 'trade-failed'], default: 'message-sent' },
  message: {type: String}
}, { timestamps: true });

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;
