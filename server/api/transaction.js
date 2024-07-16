const express = require("express");
const router = express.Router();
const Transaction = require("../models/Transaction");



module.exports = function (io) {

router.post("/updatetx",  async (req, res) => {
        
    try {
        const { qortalAtAddress, qortAddress, node, status } = req.body;

        try {
          const updatedTransaction = await Transaction.findOneAndUpdate(
            { qortalAtAddress, qortAddress },
            { qortalAtAddress, qortAddress, node, status },
            { new: true, upsert: true, runValidators: true }
          );
      
          res.json(true);
        } catch (error) {
          res.status(500).json({ error: error.message });
        }
      res.json(true);
    } catch (err) {
      console.error(err.message);
      res.status(500).json({
        errors: [
          { msg: "Server error. Please try again or refresh the page." },
        ],
      });
    } 
  });

  return router;

}