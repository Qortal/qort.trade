const express = require("express");
const router = express.Router();
const Transaction = require("../models/Transaction");
const nodeUrl = 'https://appnode.qortal.org'
const axios = require('axios')



router.post("/updatetx", async (req, res) => {
  try {
    const { qortalAtAddress, qortAddress, node, status, message = '' } = req.body;

    try {
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
    res.status(500).json({
      errors: [
        { msg: "Server error. Please try again or refresh the page." },
      ],
    });
  }
});

  // Define the GET endpoint with query parameters
router.get('/fetch-qortAddress', async (req, res) => {
  try {
    const { qortAddress } = req.query;
    console.log({qortAddress})
    // Validate the qortAddress parameter
    if (!qortAddress) {
      return res.status(400).json({ error: 'qortAddress query parameter is required' });
    }

    const fortyMinutesAgo = new Date(Date.now() - 25 * 60 * 1000);

    // Fetch the transactions created in the last 15 minutes, sorted newest to oldest, filtering by qortAddress
    const transactions = await Transaction.find({
      createdAt: { $gte: fortyMinutesAgo },
      qortAddress: qortAddress
    })
    .sort({ createdAt: -1 })
    .exec();
    console.log({transactions})
    // Placeholder for async action to get more data for each qortAddress
 

    const fetchTradeInfo = async (qortalAtAddress) => {
      // Replace with your async action
      const checkIfOfferingRes = await axios.get(
        `${nodeUrl}/crosschain/trade/${qortalAtAddress}`
      );
      const data = checkIfOfferingRes.data
      console.log({data})
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



module.exports = router;

