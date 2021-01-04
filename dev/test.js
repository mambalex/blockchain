const Blockchain = require('./blockchain');

const bitcoin = new Blockchain();
const bc1 = {
  chain: [
    {
      index: 1,
      timestamp: 1609727503844,
      transactions: [],
      nonce: 100,
      hash: '0',
      previousBlockHash: '0',
    },
    {
      index: 2,
      timestamp: 1609727724980,
      transactions: [],
      nonce: 18140,
      hash: '0000b9135b054d1131392c9eb9d03b0111d4b516824a03c35639e12858912100',
      previousBlockHash: '0',
    },
    {
      index: 3,
      timestamp: 1609727778630,
      transactions: [
        {
          amount: 12.5,
          sender: '00',
          recipient: 'fc05da404e3411eb935db9ac65699936',
          transactionId: '7fd6f8404e3511eb935db9ac65699936',
        },
        {
          amount: 800,
          sender: 'ALEXXXXyy',
          recipient: 'LUCYYYYYxx',
          transactionId: '8ec8a7404e3511eb935db9ac65699936',
        },
        {
          amount: 300,
          sender: 'ALEXXXXyy',
          recipient: 'LUCYYYYYxx',
          transactionId: '917f14b04e3511eb935db9ac65699936',
        },
        {
          amount: 20,
          sender: 'ALEXXXXyy',
          recipient: 'LUCYYYYYxx',
          transactionId: '95227a304e3511eb935db9ac65699936',
        },
        {
          amount: 290,
          sender: 'ALEXXXXyy',
          recipient: 'LUCYYYYYxx',
          transactionId: '996072004e3511eb935db9ac65699936',
        },
      ],
      nonce: 7160,
      hash: '0000b1cf59ff3ad35a3aac745ef4dc3fbf638b25acd33e816805d225b7dfcd3b',
      previousBlockHash:
        '0000b9135b054d1131392c9eb9d03b0111d4b516824a03c35639e12858912100',
    },
    {
      index: 4,
      timestamp: 1609727793937,
      transactions: [
        {
          amount: 12.5,
          sender: '00',
          recipient: 'fc05da404e3411eb935db9ac65699936',
          transactionId: '9fcf2c804e3511eb935db9ac65699936',
        },
      ],
      nonce: 211960,
      hash: '000073fa54aa959a2a46fba6a3885f510ee53fa767e9c58b9012e43fb4732a88',
      previousBlockHash:
        '0000b1cf59ff3ad35a3aac745ef4dc3fbf638b25acd33e816805d225b7dfcd3b',
    },
    {
      index: 5,
      timestamp: 1609727796027,
      transactions: [
        {
          amount: 12.5,
          sender: '00',
          recipient: 'fc05da404e3411eb935db9ac65699936',
          transactionId: 'a8eed6304e3511eb935db9ac65699936',
        },
      ],
      nonce: 73841,
      hash: '000036b3948b221202932005254a3a07ad7802a3847d09fe06951ebb7099dbd8',
      previousBlockHash:
        '000073fa54aa959a2a46fba6a3885f510ee53fa767e9c58b9012e43fb4732a88',
    },
  ],
  pendingTransactions: [
    {
      amount: 12.5,
      sender: '00',
      recipient: 'fc05da404e3411eb935db9ac65699936',
      transactionId: 'aa2dbed04e3511eb935db9ac65699936',
    },
  ],
  currentNodeUrl: 'http://localhost:3001',
  networkNodes: [],
};

console.table(bitcoin.chainIsValid(bc1.chain));
