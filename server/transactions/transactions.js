const bs58 = require("bs58");

const {Base58} = require("../deps/Base58");
const axios = require("axios");
const {  nodeUrl } = require("../utils");
const { PaymentTransaction } = require("./PaymentTransaction");
const { ChatTransaction } = require("./ChatTransaction");

const { homeAddress } = require("../constants");
const { nacl } = require("../deps/nacl-fast");
const utils = require("./utils");

const transactionTypes = {
  2: PaymentTransaction,
  18: ChatTransaction
};

const base58ToUint8Array = (base58Encoded) => {
  const bytes = bs58.decode(base58Encoded);

  // Convert the Buffer to Uint8Array
  const uint8Array = new Uint8Array(bytes);
  return uint8Array;
};

const createKeyPair = () => {
  const publicKey = base58ToUint8Array(process.env.KEY_PAIR_PUBLIC);
  const privateKey = base58ToUint8Array(process.env.KEY_PAIR_PRIVATE);
  return {
    publicKey,
    privateKey,
  };
};

const createTransaction = (type, keyPair, params) => {
  const tx = new transactionTypes[type]();
  tx.keyPair = keyPair;
  Object.keys(params).forEach((param) => {
    tx[param] = params[param];
  });

  return tx;
};

const processTransactionVersion2 = async (body, validApi) => {
	const url = validApi + "/transactions/process?apiVersion=2";
	
	try {
	  const response = await axios.post(url, body);
	  return response.data; // Directly return the parsed JSON data
	} catch (error) {
	  // Axios error handling
	  if (error.response) {
      
		// The server responded with a status code outside of the 2xx range
		console.error('Error response:', error.response.data);
		throw error // Returning the server's error message
	  } else if (error.request) {
		// The request was made but no response was received
		console.error('No response received:', error.request);
	  } else {
		// Something else happened in setting up the request
		console.error('Error setting up the request:', error.message);
	  }
	  return null;
	}
  };

const transaction = async ({ type, params, apiVersion, keyPair }, validApi) => {
  const tx = createTransaction(type, keyPair, params);
  let res;

  if (apiVersion && apiVersion === 2) {
    const signedBytes = Base58.encode(tx.signedBytes);
    res = await processTransactionVersion2(signedBytes, validApi);
  }

  return {
    success: true,
    data: res,
  };
};

const makeTransactionRequest = async (
  receiver,
  lastRef,
  amount,
  fee,
  keyPair,
  validApi
) => {
  try {
    
    const myTxnrequest = await transaction(
      {
        nonce: 0,
        type: 2,
        params: {
          recipient: receiver,
          amount: amount,
          lastReference: lastRef,
          fee: fee,
        },
        apiVersion: 2,
        keyPair,
      },
      validApi
    );
    return myTxnrequest;
  } catch (error) {
    console.error(error)
    throw error;
  }

};

 const validateAddress = (address) => {
  let isAddress = false;
  try {
    const decodePubKey = Base58.decode(address);

    if (!(decodePubKey instanceof Uint8Array && decodePubKey.length == 25)) {
      isAddress = false;
    } else {
      isAddress = true;
    }
  } catch (error) {
	console.error(error)
  }

  return isAddress;
};

const getNameOrAddress = async (receiver) => {
  try {
    const isAddress = validateAddress(receiver);
    if (isAddress) {
      return receiver;
    }

    // Using axios to replace fetch
    const response = await axios.get(`${nodeUrl}/names/${receiver}`);
    const data = response.data;
    if (data?.owner) return data.owner;
    if (data?.error) {
      throw new Error("Name does not exist");
    }
    // Axios handles HTTP error status automatically in the catch block
    return { error: "cannot validate address or name" };
  } catch (error) {
    throw new Error(
      error?.response?.data?.message ||
        error?.message ||
        "cannot validate address or name"
    );
  }
};

const getLastRef = async (address) => {

  // Using axios to replace fetch
  try {
    const response = await axios.get(
      `${nodeUrl}/addresses/lastreference/${address}`
    );
    return response.data; // Axios handles text content via data attribute
  } catch (error) {
    throw new Error("Cannot fetch balance");
  }
};

const sendQortFee = async () => {
  try {
    const response = await axios.get(
      `${nodeUrl}/transactions/unitfee?txType=PAYMENT`
    );
    const data = response.data;
    const qortFee = (Number(data) / 1e8).toFixed(8);
    return qortFee;
  } catch (error) {
    throw new Error("Error when fetching join fee");
  }
};

const sendCoin = async ({ amount, receiver }) => {
  try {
    const confirmReceiver = await getNameOrAddress(receiver);
    if (confirmReceiver.error)
      throw new Error("Invalid receiver address or name");
    const keyPair = createKeyPair();
    const lastRef = await getLastRef(homeAddress);
    const fee = await sendQortFee();

    const res = await makeTransactionRequest(
      confirmReceiver,
      lastRef,
      amount,
      fee,
      keyPair,
      nodeUrl
    );
    return { res, validApi: nodeUrl };
  } catch (error) {
    console.error(error?.message)
    throw error;
  }
};

const checkBlockchain = async (signature)=> {
  try {
    const response = await axios.get(
      `${nodeUrl}/transactions/signature/${signature}`
    );
    return response.data
  } catch (error) {
    
  }
}


const signChat = (chatBytes, nonce, privateKey) => {

	if (!chatBytes) {
		throw new Error('Chat Bytes not defined')
	}

	if (!nonce) {
		throw new Error('Nonce not defined')
	}

	if (!privateKey) {
		throw new Error('keyPair not defined')
	}

	const _nonce = utils.int32ToBytes(nonce)
	if (chatBytes.length === undefined) {
		const _chatBytesBuffer = Object.keys(chatBytes).map(function (key) { return chatBytes[key]; })

		const chatBytesBuffer = new Uint8Array(_chatBytesBuffer)
		chatBytesBuffer.set(_nonce, 112)

		const signature = nacl.sign.detached(chatBytesBuffer, privateKey)

		return utils.appendBuffer(chatBytesBuffer, signature)
	} else {
		const chatBytesBuffer = new Uint8Array(chatBytes)
		chatBytesBuffer.set(_nonce, 112)

		const signature = nacl.sign.detached(chatBytesBuffer, privateKey)

		return utils.appendBuffer(chatBytesBuffer, signature)
	}
}




module.exports = { sendCoin, checkBlockchain, transaction, signChat, base58ToUint8Array, createKeyPair, createTransaction };
