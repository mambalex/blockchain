var express = require('express');
const axios = require('axios');
var app = express();
const bodyParser = require('body-parser');
const Blockchain = require('./blockchain');
const { v1: uuid } = require('uuid');
const port = process.argv[2];

const nodeAddress = uuid().split('-').join('');

const bitcoin = new Blockchain();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.get('/blockchain', function (req, res) {
  res.send(bitcoin);
});

app.post('/transaction', function (req, res) {
  const { newTransaction } = req.body;
  const blockIndex = bitcoin.addTransactionToPendingTransactions(
    newTransaction
  );
  res.json({ note: `Transaction will be added in block ${blockIndex}` });
});

app.post('/transaction/broadcast', function (req, res) {
  const { amount, sender, recipient } = req.body;
  const newTransaction = bitcoin.createNewTransaction(
    amount,
    sender,
    recipient
  );
  // Add the new transaction to the current node
  bitcoin.addTransactionToPendingTransactions(newTransaction);

  const allPromises = [];
  // Broadcast the new transaction
  bitcoin.networkNodes.forEach((networkNodeUrl) => {
    allPromises.push(
      axios.post(`${networkNodeUrl}/transaction`, { newTransaction })
    );
  });

  Promise.all(allPromises).then(() => {
    res.json({ note: 'Transaction created and broadcast successfully' });
  });
});

// Create and broadcast a new block
app.get('/mine', function (req, res) {
  const lastBlock = bitcoin.getLastBlock();
  const previousBlockHash = lastBlock['hash'];
  const currentBlockData = {
    transactions: bitcoin.pendingTransactions,
    index: lastBlock['index'] + 1,
  };

  const nonce = bitcoin.proofOfWork(previousBlockHash, currentBlockData);
  const blockhash = bitcoin.hashBlock(
    previousBlockHash,
    currentBlockData,
    nonce
  );
  const newBlock = bitcoin.createNewBlock(nonce, blockhash, previousBlockHash);

  const miningPromises = [];
  // Broadcast the new block
  bitcoin.networkNodes.forEach((networkNodeUrl) => {
    miningPromises.push(
      axios.post(`${networkNodeUrl}/receive-new-block`, { newBlock })
    );
  });

  Promise.all(miningPromises)
    .then(() => {
      // Broadcast the reward transaction, the mining reward is added to the next block.
      return axios.post(`${bitcoin.currentNodeUrl}/transaction/broadcast`, {
        amount: 6.25,
        sender: '00',
        recipient: nodeAddress,
      });
    })
    .then(() => {
      res.json({
        note: 'New block mined & broadcast successfully',
        block: newBlock,
      });
    });
});

// Receive a new block
app.post('/receive-new-block', function (req, res) {
  const { newBlock } = req.body;
  // Validating the new block
  const lastBlock = bitcoin.getLastBlock();
  const isCorrectHash = lastBlock.hash === newBlock.previousBlockHash;
  const isCorrectIndex = lastBlock['index'] + 1 === newBlock['index'];
  if (isCorrectHash && isCorrectIndex) {
    bitcoin.chain.push(newBlock);
    bitcoin.pendingTransactions = [];
    res.json({ note: 'New block received and accepted.', newBlock });
  } else {
    res.json({ note: 'New block rejected.', newBlock });
  }
});

// Register a node and broadcast it to the network
app.post('/register-and-broadcast-node', function (req, res) {
  const newNodeUrl = req.body.newNodeUrl;
  if (bitcoin.networkNodes.indexOf(newNodeUrl) === -1)
    bitcoin.networkNodes.push(newNodeUrl);

  const regNodesPromises = [];

  // Broadcast the new node
  bitcoin.networkNodes.forEach((networkNodeUrl) => {
    let promise = axios.post(`${networkNodeUrl}/register-node`, { newNodeUrl });
    regNodesPromises.push[promise];
  });

  Promise.all(regNodesPromises)
    .then(() => {
      // Register all existing nodes in the new node
      return axios.post(`${newNodeUrl}/register-nodes-bulk`, {
        allNetworkNodes: [...bitcoin.networkNodes, bitcoin.currentNodeUrl],
      });
    })
    .then(() => {
      res.json({ node: 'New node registered with network successfully' });
    });
});

// Register a node with the network
app.post('/register-node', function (req, res) {
  const newNodeUrl = req.body.newNodeUrl;
  const nodeNotAlreadyPresent = bitcoin.networkNodes.indexOf(newNodeUrl) == -1;
  const notCurrentNode = bitcoin.currentNodeUrl !== newNodeUrl;

  if (nodeNotAlreadyPresent && notCurrentNode)
    bitcoin.networkNodes.push(newNodeUrl);

  res.json({ note: 'New node registered successfully.' });
});

// Register multiple nodes at once
app.post('/register-nodes-bulk', function (req, res) {
  const { allNetworkNodes } = req.body;

  allNetworkNodes.forEach((networkNodeUrl) => {
    const nodeNotAlreadyPresent =
      bitcoin.networkNodes.indexOf(networkNodeUrl) == -1;
    const notCurrentNode = bitcoin.currentNodeUrl !== networkNodeUrl;
    if (nodeNotAlreadyPresent && notCurrentNode)
      bitcoin.networkNodes.push(networkNodeUrl);
  });

  res.json({ note: 'Bulk registration successful.' });
});

app.get('/consensus', function (req, res) {
  const promises = [];
  // Get all blockchains
  bitcoin.networkNodes.forEach((networkNodeUrl) => {
    promises.push(axios.get(`${networkNodeUrl}/blockchain`));
  });

  // Replace current chain with the longest chain
  Promise.all(promises).then((blockchains) => {
    const currentChainLength = bitcoin.chain.length;
    let maxChainLength = currentChainLength;
    let newLongestChain = null;
    let newPendingTransactions = null;

    blockchains.forEach((blockchainObj) => {
      const blockchain = blockchainObj.data;
      if (blockchain.chain.length > maxChainLength) {
        maxChainLength = blockchain.chain.length;
        newLongestChain = blockchain.chain;
        newPendingTransactions = blockchain.pendingTransactions;
      }
    });

    if (
      !newLongestChain ||
      (newLongestChain && !bitcoin.chainIsValid(newLongestChain))
    ) {
      res.json({
        note: 'Current chain has not been replaced.',
        chain: bitcoin.chain,
      });
    } else if (newLongestChain && bitcoin.chainIsValid(newLongestChain)) {
      bitcoin.chain = newLongestChain;
      bitcoin.pendingTransactions = newPendingTransactions;
      res.json({
        note: 'This chain has been replaced.',
        chain: bitcoin.chain,
      });
    }
  });
});

app.get('/block/:blockHash', function (req, res) {
  const blockHash = req.params.blockHash;
  const correctBlock = bitcoin.getBlock(blockHash);

  res.json({ block: correctBlock });
});

app.get('/transaction/:transactionId', function (req, res) {
  const transactionId = req.params.transactionId;
  const transactionData = bitcoin.getTransaction(transactionId);

  res.json({
    transaction: transactionData.transaction,
    block: transactionData.block,
  });
});

app.get('/address/:address', function (req, res) {
  const address = req.params.address;
  const addressData = bitcoin.getAddressData(address);
  res.json({
    addressData,
  });
});

app.get('/block-explorer', function (req, res) {
  res.sendFile('./block-explorer/index.html', { root: __dirname });
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
