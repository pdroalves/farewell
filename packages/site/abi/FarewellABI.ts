
/*
  This file is auto-generated.
  Command: 'npm run genabi'
*/
export const FarewellABI = {
  "abi": [
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "user",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint64",
          "name": "when",
          "type": "uint64"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "notifier",
          "type": "address"
        }
      ],
      "name": "Deceased",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "user",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "index",
          "type": "uint256"
        }
      ],
      "name": "MessageAdded",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "user",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "index",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "bytes",
          "name": "recipientEmail",
          "type": "bytes"
        },
        {
          "indexed": false,
          "internalType": "bytes",
          "name": "data",
          "type": "bytes"
        },
        {
          "indexed": false,
          "internalType": "euint128",
          "name": "skShare",
          "type": "bytes32"
        }
      ],
      "name": "MessageClaimed",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "user",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint64",
          "name": "when",
          "type": "uint64"
        }
      ],
      "name": "Ping",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "user",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint64",
          "name": "checkInPeriod",
          "type": "uint64"
        },
        {
          "indexed": false,
          "internalType": "uint64",
          "name": "gracePeriod",
          "type": "uint64"
        },
        {
          "indexed": false,
          "internalType": "uint64",
          "name": "registeredOn",
          "type": "uint64"
        }
      ],
      "name": "UserRegistered",
      "type": "event"
    },
    {
      "inputs": [
        {
          "internalType": "bytes",
          "name": "recipientEmail",
          "type": "bytes"
        },
        {
          "internalType": "bytes",
          "name": "data",
          "type": "bytes"
        }
      ],
      "name": "addMessage",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "index",
          "type": "uint256"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "user",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "index",
          "type": "uint256"
        }
      ],
      "name": "claim",
      "outputs": [
        {
          "internalType": "euint128",
          "name": "",
          "type": "bytes32"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "user",
          "type": "address"
        }
      ],
      "name": "markDeceased",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "user",
          "type": "address"
        }
      ],
      "name": "messageCount",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "ping",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint64",
          "name": "checkInPeriod",
          "type": "uint64"
        },
        {
          "internalType": "uint64",
          "name": "gracePeriod",
          "type": "uint64"
        },
        {
          "internalType": "externalEuint128",
          "name": "skShare",
          "type": "bytes32"
        },
        {
          "internalType": "bytes",
          "name": "skShareProof",
          "type": "bytes"
        }
      ],
      "name": "register",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "externalEuint128",
          "name": "skShare",
          "type": "bytes32"
        },
        {
          "internalType": "bytes",
          "name": "skShareProof",
          "type": "bytes"
        }
      ],
      "name": "registerDefault",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "name": "users",
      "outputs": [
        {
          "internalType": "uint64",
          "name": "checkInPeriod",
          "type": "uint64"
        },
        {
          "internalType": "uint64",
          "name": "gracePeriod",
          "type": "uint64"
        },
        {
          "internalType": "uint64",
          "name": "lastCheckIn",
          "type": "uint64"
        },
        {
          "internalType": "uint64",
          "name": "registeredOn",
          "type": "uint64"
        },
        {
          "internalType": "bool",
          "name": "deceased",
          "type": "bool"
        },
        {
          "components": [
            {
              "internalType": "uint64",
              "name": "notificationTime",
              "type": "uint64"
            },
            {
              "internalType": "address",
              "name": "notifierAddress",
              "type": "address"
            }
          ],
          "internalType": "struct Farewell.Notifier",
          "name": "notifier",
          "type": "tuple"
        },
        {
          "internalType": "euint128",
          "name": "_skShare",
          "type": "bytes32"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ]
} as const;

