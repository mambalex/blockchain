const sha256 = require('sha256');
const { v1: uuid } = require('uuid');
const port = process.argv[2];
const currentNodeUrl = `http://localhost:${port}`;

function Blockchain() {
  this.chain = [];
  this.pendingTransactions = [];

  this.currentNodeUrl = currentNodeUrl;
  this.networkNodes = [];

  this.createNewBlock(100, '0', '0'); // Genesis Blcok
}

Blockchain.prototype.createNewBlock = function (
  nonce,
  hash,
  previousBlockHash
) {
  const newBlock = {
    index: this.chain.length + 1,
    timestamp: Date.now(),
    transactions: this.pendingTransactions,
    nonce,
    hash,
    previousBlockHash,
  };
  this.pendingTransactions = [];
  this.chain.push(newBlock);
  return newBlock;
};

Blockchain.prototype.getLastBlock = function () {
  return this.chain[this.chain.length - 1];
};

Blockchain.prototype.createNewTransaction = function (
  amount,
  sender,
  recipient
) {
  const newTransaction = {
    amount,
    sender,
    recipient,
    transactionId: uuid().split('-').join(''),
  };
  return newTransaction;
};

Blockchain.prototype.addTransactionToPendingTransactions = function (
  transactionObj
) {
  this.pendingTransactions.push(transactionObj);
  return this.getLastBlock()['index'] + 1;
};

Blockchain.prototype.hashBlock = function (
  previousBlockHash,
  currentBlockData,
  nonce
) {
  const dataAsString =
    previousBlockHash + nonce.toString() + JSON.stringify(currentBlockData);
  const hash = sha256(dataAsString);
  return hash;
};

Blockchain.prototype.proofOfWork = function (
  previousBlockHash,
  currentBlockData
) {
  let nonce = 0;
  let hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);
  while (hash.substring(0, 4) !== '0000') {
    nonce++;
    hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);
  }
  return nonce;
};

Blockchain.prototype.chainIsValid = function (blockchain) {
  let isChainValid = true;

  // Validate each block
  for (let i = 1; i < blockchain.length; i++) {
    const currentBlock = blockchain[i];
    const prevBlock = blockchain[i - 1];
    const blockHash = this.hashBlock(
      prevBlock['hash'],
      {
        transactions: currentBlock['transactions'],
        index: currentBlock['index'],
      },
      currentBlock['nonce']
    );
    if (blockHash.substring(0, 4) !== '0000') isChainValid = false;
    if (currentBlock['previousBlockHash'] !== prevBlock['hash'])
      isChainValid = false;
  }

  // Validate the genesis block
  const genesisBlock = blockchain[0];
  const isNonceCorrect = genesisBlock['nonce'] === 100;
  const isPreviousBlockHashCorrect = genesisBlock['previousBlockHash'] === '0';
  const isCorrectHash = genesisBlock['hash'] === '0';
  const isCorrectTransactions = genesisBlock['transactions'].length === 0;

  if (
    !isNonceCorrect |
    !isPreviousBlockHashCorrect |
    !isCorrectHash |
    !isCorrectTransactions
  )
    isChainValid = false;

  return isChainValid;
};

module.exports = Blockchain;
