'use strict';

const { createHash } = require('crypto');
const { Transaction } = require('./blockchain');
const signing = require('./signing');
let sha256 = str => createHash("sha256").update(str).digest();
/**
 * A simple validation function for transactions. Accepts a transaction
 * and returns true or false. It should reject transactions that:
 *   - have negative amounts
 *   - were improperly signed
 *   - have been modified since signing
 */
const isValidTransaction = t => {
  // get the current sig, getPubK
  // create a new messag
 
  let sig = t.signature,
      src = t.source,
      msg = src + t.recipient + t.amount;
  // use verify method: pubK, msg, sig
  let valid = signing.verify(src, msg, sig);

  // pubKey !== source
  // amount > 0
  // sig === newSig(verified) against the source pubK
  if (!valid) return false;
  if (t.amount < 0) return false;

  return true;
};

/**
 * Validation function for blocks. Accepts a block and returns true or false.
 * It should reject blocks if:
 *   - their hash or any other properties were altered
 *   - they contain any invalid transactions
 */
const isValidBlock = block => {
  // need to verify:
  // nonce: set on the block inthe constructor > hash  is calculted using nonce > if hash changes nonce fails
  // previous hash: used in hash > if hash changes this fails
  // hash: uses transactions sigs > nonce > prevhash
  // calculate hash: method calcultes the hash > verify new hash after calc matches old hash(or expected hash)
  let validTs = true,
      newSigs = '',
      n = block.nonce,
      prevHash = block.previousHash,
      expHash;

  for (let i = 0; i < block.transactions.length; i++) {
    let t = block.transactions[i];
    if (validTs) {
      newSigs += t.signature;
      validTs = isValidTransaction(t);
    } else {
      break;
    }
  }

  
  if (!validTs) return false;
  // hash: signatures + none + prevHash
  expHash = sha256(newSigs + n + prevHash).toString('hex');
  if (expHash !== block.hash) return false;

  return true;
};

/**
 * One more validation function. Accepts a blockchain, and returns true
 * or false. It should reject any blockchain that:
 *   - is a missing genesis block
 *   - has any block besides genesis with a null hash
 *   - has any block besides genesis with a previousHash that does not match
 *     the previous hash
 *   - contains any invalid blocks
 *   - contains any invalid transactions
 */
const isValidChain = blockchain => {
  // validations per block:
    // blobk + transaction: isVaildBlock
    // block hash: is valid block
    // block prevHash: store the hash of each block and compare to next block

  let prevHash = null;
  // traverse the blockchain
  for (let i = 0; i < blockchain.blocks.length; i++) {
    let currBlock = blockchain.blocks[i];

    if (i === 0 && currBlock.previousHash !== null) return false;
    if (!isValidBlock(currBlock)) return false;
    if (prevHash !== currBlock.previousHash) return false;

    prevHash = currBlock.hash;
  }
    // validate current block
    // validate block prev hash is as expected
    // store current block hash as prev hash
 
  return true;
};

/**
 * This last one is just for fun. Become a hacker and tamper with the passed in
 * blockchain, mutating it for your own nefarious purposes. This should
 * (in theory) make the blockchain fail later validation checks;
 */
const breakChain = blockchain => {
  // change one of the transactions in the block chain so it goes to my address
  
  let firstBlock = blockchain.blocks[0];
  let transactions = firstBlock.transactions;
  
  let fakePk = signing.createPrivateKey();
  let myPubK = signing.getPublicKey(fakePk);

  transactions.push(new Transaction(fakePk, myPubK, 100));
  return;
};

module.exports = {
  isValidTransaction,
  isValidBlock,
  isValidChain,
  breakChain
};
