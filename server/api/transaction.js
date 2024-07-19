const express = require("express");
const router = express.Router();
const Transaction = require("../models/Transaction");
const nodeUrl = 'https://appnode.qortal.org'
const axios = require('axios');
const { authenticateToken } = require("./middleware");
const BuyOrder = require("../models/BuyOrder");



router.post("/updatetx", authenticateToken, async (req, res) => {
  try {
    const { qortalAtAddress, qortAddress, node, status, message = '', encryptedMessageToBase58 = undefined, chatSignature = '', sender = '', senderPublicKey = '', reference = ''} = req.body;
    const authId = req.user.id
    if(authId !== qortAddress){
      res.status(500).json({
        errors: [
          { msg: "Not authorized" },
        ],
      });
      return
    }

    try {
      if(encryptedMessageToBase58){
        const buyOrder = new BuyOrder({
          data: encryptedMessageToBase58,
          recipient: "QXPejUe5Za1KD3zCMViWCX35AreMQ9H7ku",
          sender,
          signature: chatSignature,
          senderPublicKey,
          isEncrypted: true,
          reference
        });
        await buyOrder.save();
      }
      const transaction =await Transaction.findOne(
        { qortalAtAddress, qortAddress }
      );
      if(transaction && transaction?.status === 'trade-ongoing') res.json(true)
      const updatedTransaction = await Transaction.findOneAndUpdate(
        { qortalAtAddress, qortAddress },
        { qortalAtAddress, qortAddress, node, status, message},
        { new: true, upsert: true, runValidators: true }
      );
      res.json(true);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  } catch (err) {
    console.error(err.message);
    
  }
});

  // Define the GET endpoint with query parameters
router.get('/fetch-qortAddress', authenticateToken, async (req, res) => {
  try {
    const authId = req.user.id
   
    const { qortAddress } = req.query;
    if(authId !== qortAddress){
      res.status(500).json({
        errors: [
          { msg: "Not authorized" },
        ],
      });
      return
    }
    // Validate the qortAddress parameter
    if (!qortAddress) {
      return res.status(400).json({ error: 'qortAddress query parameter is required' });
    }

    const fortyMinutesAgo = new Date(Date.now() - 22 * 60 * 1000);

    // Fetch the transactions created in the last 15 minutes, sorted newest to oldest, filtering by qortAddress
    const transactions = await Transaction.find({
      createdAt: { $gte: fortyMinutesAgo },
      qortAddress: qortAddress
    })
    .sort({ createdAt: -1 })
    .exec();
    // Placeholder for async action to get more data for each qortAddress
 

    const fetchTradeInfo = async (qortalAtAddress) => {
      // Replace with your async action
      const checkIfOfferingRes = await axios.get(
        `${nodeUrl}/crosschain/trade/${qortalAtAddress}`
      );
      const data = checkIfOfferingRes.data
       return data
    };

    const results = [];
    for (const transaction of transactions) {
      const tradeData = await fetchTradeInfo(transaction.qortalAtAddress);
      if(tradeData.qortalPartnerReceivingAddress && tradeData.qortalPartnerReceivingAddress !== qortAddress) continue
      let newStatus = transaction.status
      if(tradeData.qortalPartnerReceivingAddress && tradeData.qortalPartnerReceivingAddress === qortAddress){
        newStatus = tradeData.mode.toLowerCase()
      }
      results.push({...transaction.toJSON(), tradeInfo: tradeData, status: newStatus});
    }

    res.json(results);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

router.get('/buyorders/recent', async (req, res) => {
  try {
    const { secretKey } = req.query;
    if(secretKey !== process.env.SECRET_KEY_ENDPOINT){
      res.json([])
      return
    }
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    const recentBuyOrders = await BuyOrder.find({
      createdAt: { $gte: thirtyMinutesAgo }
    });
    res.json(recentBuyOrders);
  } catch (err) {
    console.error('Error fetching recent buy orders:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});


module.exports = router;

