const Blockchain = require('./blockchain');

const bitcoin = new Blockchain();

const previousBlockHash = 'HSHFHSFSF';
const currentBlockData = [
  { amount: 101, sender: 'ADFJDHF', recipient: 'DAFLAJFHJDAF' },
  { amount: 102, sender: 'ADFJDHF', recipient: 'DAFLAJFHJDAF' },
  { amount: 103, sender: 'ADFJDHF', recipient: 'DAFLAJFHJDAF' },
];

// console.log(bitcoin.proofOfWork(previousBlockHash, currentBlockData));
console.log(bitcoin.hashBlock(previousBlockHash, currentBlockData, 130905));
