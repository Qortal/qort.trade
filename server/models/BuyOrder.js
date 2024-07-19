const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const buyOrderSchema = new Schema({
  data: { type: String, required: true },
  recipient: { type: String, required: true },
  sender: { type: String, required: true },
  signature: { type: String, required: true },
  senderPublicKey: { type: String, required: true },
  isEncrypted: { type: Boolean, required: true },
  reference: { type: String, required: true },
}, { timestamps: true });

const BuyOrder = mongoose.model('BuyOrder', buyOrderSchema);

module.exports = BuyOrder;
