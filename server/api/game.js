const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const Game = require("../models/Game");
const User = require("../models/User");
const ShortUniqueId = require("short-unique-id");
const uid = new ShortUniqueId({ length: 5 });
const axios = require('axios');
const crypto = require('crypto');
const {Sha256} = require("asmcrypto.js")

const moment = require('moment'); // using moment.js to handle dates easily
const { findUsableApi } = require("../utils");
const { transaction, signChat, base58ToUint8Array, createKeyPair, createTransaction } = require("../transactions/transactions");
const { Base58 } = require("../deps/Base58");
const fs = require('fs');
const path = require('path');
const util = require('util');
const readFile = util.promisify(fs.readFile);  // Promisify readFile for use with async/await
const initialBrk = 512 * 1024;
let brk = 512 * 1024; // Initialize brk outside to maintain state
const waitingQueue = [];
const memory = new WebAssembly.Memory({ initial: 256, maximum: 256 });
const heap = new Uint8Array(memory.buffer);
const jwt = require('jsonwebtoken');

let oauthSecretKeys = {};

const generateToken = ({user}) => {
  return jwt.sign({ id: user.id }, process.env.TOKEN_SECRET_KEY, { expiresIn: '750h' }); // 1 month
};

const storageProxy = new Proxy(oauthSecretKeys, {
  get(target, key, receiver) {
      cleanupOldEntries(); // Clean up before accessing any key
      return Reflect.get(target, key, receiver); // Proceed with the default get operation
  },
  set(target, key, value, receiver) {
      value.timestamp = Date.now(); // Add a timestamp to each item when it's added
      return Reflect.set(target, key, value, receiver); // Proceed with the default set operation
  }
});
function cleanupOldEntries() {
  const tenMinutesAgo = Date.now() - 10 * 60 * 1000; // 10 minutes in milliseconds
  Object.keys(oauthSecretKeys).forEach(key => {
      if (oauthSecretKeys[key].timestamp < tenMinutesAgo) {
          delete oauthSecretKeys[key];
      }
  });
}
function sbrk(size) {
  const oldBrk = brk;
  if (brk + size > heap.length) { // Check if the heap can accommodate the request
      console.log('Not enough memory available, adding to waiting queue');
      return null; // Not enough memory, return null
  }
  brk += size; // Advance brk by the size of the requested memory
  return oldBrk; // Return the old break point (start of the newly allocated block)
}

function processWaitingQueue() {
  console.log('Processing waiting queue...');
  let i = 0;
  while (i < waitingQueue.length) {
      const request = waitingQueue[i];
      const ptr = sbrk(request.size);
      if (ptr !== null) { // Check if memory was successfully allocated
          request.resolve(ptr);
          waitingQueue.splice(i, 1); // Remove the processed request
      } else {
          i++; // Continue if the current request cannot be processed
      }
  }
}

function requestMemory(size) {
  return new Promise((resolve, reject) => {
      const ptr = sbrk(size);
      if (ptr !== null) {
          resolve(ptr);
      } else {
          waitingQueue.push({ size, resolve, reject }); // Add to queue if not enough memory
      }
  });
}

function resetMemory() {
  brk = initialBrk; // Reset the break point
  processWaitingQueue(); // Try to process any waiting memory requests
}

 const processTransactionVersion2 = async (bytes, validApi) => {
  try {
    const response = await axios.post(`${validApi}/transactions/process?apiVersion=2`, Base58.encode(bytes));

    return response.data;  // Return the response data from the server
  } catch (error) {
    console.error('Error processing transaction:', error.message);
    throw error;  // Rethrow the error for further handling
  }
};

async function signChatFunc(chatBytesArray, chatNonce, validApi ){
  let response
		try {
      const privateKey = base58ToUint8Array(process.env.KEY_PAIR_PRIVATE);
			const signedChatBytes =  signChat(
				chatBytesArray,
				chatNonce,
				privateKey
			)
		
			const	res = await processTransactionVersion2(signedChatBytes, validApi)
			response = res
		} catch (e) {
			console.error(e)
			console.error(e.message)
			response = false
		}
		return response
}

async function loadWebAssembly(memory) {
  const importObject = {
    env: {
      memory: memory  // Pass the WebAssembly.Memory object to the module
    }
  };

  // Correct the path to point to the specific location of the .wasm file
  const filename = path.join(__dirname, '../memory-pow/memory-pow.wasm.full');

  try {
    // Read the .wasm file from the filesystem
    const buffer = await readFile(filename);
    const module = await WebAssembly.compile(buffer);

    // Create the WebAssembly instance with the compiled module and import object
    const instance = new WebAssembly.Instance(module, importObject);

    return instance;  // Return the instance to be used elsewhere in your application
  } catch (error) {
    console.error('Error loading WebAssembly module:', error);
    throw error;  // Rethrow the error for further handling
  }
}



const computePow = async (memory, hashPtr, workBufferPtr, workBufferLength, difficulty) => {

  let response = null

 await new Promise((resolve, reject)=> {


loadWebAssembly(memory)
    .then(wasmModule => {
        response =  wasmModule.exports.compute2(hashPtr, workBufferPtr, workBufferLength, difficulty)

         resolve()

    });


 })

  return response
}

module.exports = function (io) {

    router.get("/", async (req, res) => {
        try {
            const games = await Game.find()
          res.json('hello');
        } catch (err) {
          console.error(err.message);
          res.status(500).json({
            errors: [
              { msg: "Server error. Please try again or refresh the page." },
            ],
          });
        }
      });
      router.get("/weeklystanding", async (req, res) => {
        // For example, to get rankings for the current week:
const startOfWeek = moment().startOf('week').toDate();
const endOfWeek = moment().endOf('week').toDate();
        try {
          Game.aggregate([
            {
              $match: {
                createdAt: { $gte: startOfWeek, $lte: endOfWeek }, // Filter games within the week
                winner: { $ne: null } // Consider games where there is a winner
              }
            },
            {
              $group: {
                _id: "$winner", // Group by winner
                count: { $sum: 1 } // Count the number of wins
              }
            },
            {
              $lookup: {
                from: "users", // Assuming the User collection is named 'users'
                localField: "_id",
                foreignField: "_id",
                as: "winnerDetails"
              }
            },
            {
              $unwind: "$winnerDetails" // Flatten the winnerDetails array
            },
            {
              $sort: { count: -1 } // Sort by the number of wins descending
            },
            {
              $limit: 50 // Limit to the top 50 results
            },
            {
              $project: { // Structure the output to include the qortAddress
                _id: 0,
                winnerId: "$_id",
                winnerQortAddress: "$winnerDetails.qortAddress", // Assuming 'qortAddress' is a field in the User model
                winnerName: "$winnerDetails.name", // Include the name field
                numberOfWins: "$count"
              }
            }
          ]).then(results => {
            res.json(results)
          }).catch(err => {
            console.error(err); // Handle possible errors
            res.status(500).json({
              errors: [
                { msg: "Server error. Please try again or refresh the page." },
              ],
            });
          });
        } catch (err) {
          console.error(err.message);
          res.status(500).json({
            errors: [
              { msg: "Server error. Please try again or refresh the page." },
            ],
          });
        }
      });

      router.post("/oauth",  async (req, res) => {
        
        try {
          const validApi = await findUsableApi();

          const qortAddress = req.body.qortAddress
          const publickey = req.body.publicKey
          const id = uid.rnd();
          storageProxy[qortAddress] = { secret: id };

          const recipientPublicKey = publickey
          let _reference = crypto.randomBytes(64);

        let sendTimestamp = Date.now()

        let reference = Base58.encode(_reference)
        const keyPair = createKeyPair();
        const {chatBytes} = await createTransaction(
          18,
          keyPair,
 {
                timestamp: sendTimestamp,
                recipient: qortAddress,
                recipientPublicKey: recipientPublicKey,
                hasChatReference:  0,
                message: id,
                lastReference: reference,
                proofOfWorkNonce: 0,
                isEncrypted: 1,
                isText: 1
            },
            
        )
           
            const _chatBytesArray = Object.keys(chatBytes).map(function (key) { return chatBytes[key]; });
            const chatBytesArray = new Uint8Array(_chatBytesArray)
            const chatBytesHash = new Sha256().process(chatBytesArray).finish().result
            const hashPtr = sbrk(32, heap);
            const hashAry = new Uint8Array(memory.buffer, hashPtr, 32);
            hashAry.set(chatBytesHash);

            const difficulty = 8;

            const workBufferLength = 8 * 1024 * 1024;
            // const workBufferPtr = sbrk(workBufferLength, heap);
            const workBufferPtr = await requestMemory(workBufferLength);

            let nonce = await computePow(memory, hashPtr, workBufferPtr, workBufferLength, difficulty)
            brk = initialBrk;

            let _response = await signChatFunc(chatBytesArray,
               nonce, validApi
            )
          res.json({..._response, validApi});
        } catch (err) {
          console.error(err.message);
          res.status(500).json({
            errors: [
              { msg: "Server error. Please try again or refresh the page." },
            ],
          });
        } finally {
          resetMemory()

        }
      });

      router.post("/oauth/verify",  async (req, res) => {
        
        try {
         const {qortAddress, code} = req.body
         const {secret} = storageProxy[qortAddress]
          if(code === secret){
            const token = generateToken({
              user: {
                id: qortAddress
              }
            }) 
            res.json(token)
          } else {
            res.json(false)
          }
        } catch (err) {
          console.error(err.message);
          res.status(500).json({
            errors: [
              { msg: "Server error. Please try again or refresh the page." },
            ],
          });
        } finally {

        }
      });

      router.get("/standingbetween", async (req, res) => {
        const { before, after } = req.query;
    
        // Create an object to hold the match criteria for createdAt
        let matchCriteria = { winner: { $ne: null } }; // Ensure there is a winner
    
        // Conditionally add date filters based on provided query parameters
        if (after) {
            const startDate = new Date(parseInt(after, 10));
            if (isNaN(startDate.getTime())) {
                return res.status(400).json({ errors: [{ msg: "Invalid 'after' date format." }] });
            }
            matchCriteria.createdAt = matchCriteria.createdAt || {};
            matchCriteria.createdAt.$gte = startDate;
        }
        if (before) {
            const endDate = new Date(parseInt(before, 10));
            if (isNaN(endDate.getTime())) {
                return res.status(400).json({ errors: [{ msg: "Invalid 'before' date format." }] });
            }
            matchCriteria.createdAt = matchCriteria.createdAt || {};
            matchCriteria.createdAt.$lte = endDate;
        }
    
        try {
            const results = await Game.aggregate([
                {
                    $match: matchCriteria
                },
                {
                    $group: {
                        _id: "$winner",
                        count: { $sum: 1 }
                    }
                },
                {
                    $lookup: {
                        from: "users",
                        localField: "_id",
                        foreignField: "_id",
                        as: "winnerDetails"
                    }
                },
                {
                    $unwind: "$winnerDetails"
                },
                {
                    $sort: { count: -1 }
                },
                {
                    $limit: 50
                },
                {
                    $project: {
                        _id: 0,
                        winnerId: "$_id",
                        winnerQortAddress: "$winnerDetails.qortAddress",
                        winnerName: "$winnerDetails.name",
                        numberOfWins: "$count"
                    }
                }
            ]);
            res.json(results);
        } catch (err) {
            console.error(err);
            res.status(500).json({
                errors: [{ msg: "Server error. Please try again or refresh the page." }]
            });
        }
    });
    
    
      return router;

}