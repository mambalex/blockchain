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

app.get('/mine', function (req, res) {
  const lastBlock = bitcoin.getLastBlock;
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

  // Mining reward
  bitcoin.createNewTransaction(12.5, '00', nodeAddress);

  const newBlock = bitcoin.createNewBlock(nonce, previousBlockHash, blockhash);

  res.json({
    note: 'New block mined successfully',
    block: newBlock,
  });
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
    .then((data) => {
      // Register all existing nodes in the new node
      return axios.post(`${newNodeUrl}/register-nodes-bulk`, {
        allNetworkNodes: [...bitcoin.networkNodes, bitcoin.currentNodeUrl],
      });
    })
    .then((data) => {
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

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
