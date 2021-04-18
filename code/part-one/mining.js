'use strict';

const { createHash } = require('crypto');
const signing = require('./signing');
const { Block, Blockchain, Transaction } = require('./blockchain');
let sha256 = str => createHash("sha256").update(str).digest();

/**
 * A slightly modified version of a transaction. It should work mostly the
 * the same as the non-mineable version, but now recipient is optional,
 * allowing the creation of transactions that will reward miners by creating
 * new funds for their balances.
 */
class MineableTransaction {
  /**
   * If recipient is omitted, this is a reward transaction. The _source_ should
   * then be set to `null`, while the _recipient_ becomes the public key of the
   * signer.
   */
  constructor(privateKey, recipient = null, amount) {
    // Enter your solution here
    if (!recipient) {
      this.source = null;
      this.recipient = signing.getPublicKey(privateKey);
    } else {
      this.source = signing.getPublicKey(privateKey);
      this.recipient = recipient;
    }
    this.amount = amount;
    this.signature = signing.sign(privateKey, this.source + this.recipient + amount);
  }
}

/**
 * Almost identical to the non-mineable block. In fact, we'll extend it
 * so we can reuse the calculateHash method.
 */
class MineableBlock extends Block {
  /**
   * Unlike the non-mineable block, when this one is initialized, we want the
   * hash and nonce to not be set. This Block starts invalid, and will
   * become valid after it is mined.
   */
  constructor(transactions, previousHash) {
    // Your code here
    super(transactions, previousHash);
    this.hash = undefined;
    this.nonce = undefined;
  }
}

/**
 * The new mineable chain is a major update to our old Blockchain. We'll
 * extend it so we can use some of its methods, but it's going to look
 * very different when we're done.
 */
class MineableChain extends Blockchain {
  /**
   * In addition to initializing a blocks array with a genesis block, this will
   * create hard-coded difficulty and reward properties. These are settings
   * which will be used by the mining method.
   *
   * Properties:
   *   - blocks: an array of mineable blocks
   *   - difficulty: a number, how many hex digits must be zeroed out for a
   *     hash to be valid, this will increase mining time exponentially, so
   *     probably best to set it pretty low (like 2 or 3)
   *   - reward: a number, how much to award the miner of each new block
   *
   * Hint:
   *   You'll also need some sort of property to store pending transactions.
   *   This will only be used internally.
   */
  constructor() {
    // initialize the blocks array
    // create difficult and reward properties
    // create pendingTransactions array? queue?
    super();
    this.reward = 2;
    this.difficulty = 3;
    this.pendingTransactions = [];
  }

  /**
   * No more adding blocks directly.
   */
  addBlock() {
    throw new Error('Must mine to add blocks to this blockchain');
  }

  /**
   * Instead of blocks, we add pending transactions. This method should take a
   * mineable transaction and simply store it until it can be mined.
   */
  addTransaction(transaction) {
    this.pendingTransactions.push(transaction);
  }

  /**
   * This method takes a private key, and uses it to create a new transaction
   * rewarding the owner of the key. This transaction should be combined with
   * the pending transactions and included in a new block on the chain.
   *
   * Note:
   *   Only certain hashes are valid for blocks now! In order for a block to be
   *   valid it must have a hash that starts with as many zeros as the
   *   the blockchain's difficulty. You'll have to keep trying nonces until you
   *   find one that works!
   *
   * Hint:
   *   Don't forget to clear your pending transactions after you're done.
   */
  mine(privateKey) {
    // mine block: aka find matching transaction
    // get: pending transactions
    let pendingTs = this.pendingTransactions;
    // new transaction: privateKey, recipient(me), amount = reward
    // create new transaction
    pendingTs.push(new MineableTransaction(privateKey, null, this.reward));
    let lastBlock = this.getHeadBlock();
    let prevHash = lastBlock.hash;
    let newBlock = new MineableBlock(pendingTs, prevHash);
    let nonce = 0;
    newBlock.calculateHash(nonce);
    while (!newBlock.hash || newBlock.hash.slice(0, this.difficulty) !== '000') {
      nonce += 1;
      newBlock.calculateHash(nonce);
    }
      // create new block signature using transaction sigs
      // if first x of hash === this.dificulty
        // add transaction to block
        // add block to blockchain
        // clear transactions

    this.pendingTransactions = [];
    this.blocks.push(newBlock);
    return;
  }
}

/**
 * A new validation function for our mineable blockchains. Forget about all the
 * signature and hash validation we did before. Our old validation functions
 * may not work right, but rewriting them would be a very dull experience.
 *
 * Instead, this function will make a few brand new checks. It should reject
 * a blockchain with:
 *   - any hash other than genesis's that doesn't start with the right
 *     number of zeros
 *   - any block that has more than one transaction with a null source
 *   - any transaction with a null source that has an amount different
 *     than the reward
 *   - any public key that ever goes into a negative balance by sending
 *     funds they don't have
 */
 const isValidMineableChain = blockchain => {
  const zeros = '0'.repeat(blockchain.difficulty);
  const { blocks } = blockchain;

  // All blocks other than genesis begin with the right number of zeros
  if (blocks.slice(1).some(b => b.hash.slice(0, zeros.length) !== zeros)) {
    return false;
  }

  const balances = {};

  for (const { transactions } of blocks) {
    const rewards = transactions.filter(t => !t.source);

    // The block has no more than one reward transaction
    if (rewards.length > 1) {
      return false;
    }

    // If present, the reward transaction has the correct amount
    if (rewards[0] && rewards[0].amount !== blockchain.reward) {
      return false;
    }

    // Each transaction only withdraws from keys with enough funds
    for (const { source, recipient, amount } of transactions) {
      if (source) {
        balances[source] = balances[source] || 0;
        balances[source] = balances[source] - amount;

        if (balances[source] < 0) {
          return false;
        }
      }

      balances[recipient] = balances[recipient] || 0;
      balances[recipient] = balances[recipient] + amount;
    }
  }

  return true;
};


module.exports = {
  MineableTransaction,
  MineableBlock,
  MineableChain,
  isValidMineableChain
};
