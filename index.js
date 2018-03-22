"use strict";

class Random {
  /**
   * Returns a new random number generator
   * @param {integer: negative numbers transformed to 32-bit unsigned} lowSeed 
   * @param {integer: negative numbers transformed to 32-bit unsigned} highSeed 
   */
  constructor(lowSeed = 0xf02386, highSeed = 0xfa472) {
    //multiplier taken from http://www.ams.org/journals/mcom/1999-68-225/S0025-5718-99-00996-5/S0025-5718-99-00996-5.pdf

    this.highMultiplier = 0x27bb2ee6;
    this.lowMultiplier = 0x87b0b0fd;
    this.highConstant = 0x14057b7e;
    this.lowConstant = 0xf767814f;
    this.highSeed = highSeed >>> 0;
    this.lowSeed = lowSeed >>> 0;
    this.highState = this.highSeed >>> 0;
    this.lowState = this.lowSeed >>> 0;
    this.highStateCount = 0;
    this.lowStateCount = 0;
    this._imul = Math.imul;
    if (!this._imul) {
      this._imul = function(a, b) {
        var ah = (a >>> 16) & 0xffff,
          al = a & 0xffff;
        var bh = (b >>> 16) & 0xffff,
          bl = b & 0xffff;
        return (al * bl + (((ah * bl + al * bh) << 16) >>> 0)) | 0;
      };
    }
    this.nextNumber = this.nextNumber.bind(this);
    this.nthNumber = this.nthNumber.bind(this);
    this.nthSkip = this.nthSkip.bind(this);
  }
  /**
   * Set the seed of the RNG, state and count is reset
   * @param {integer: negative numbers transformed to 32-bit unsigned} lowSeed
   * @param {integer: negative numbers transformed to 32-bit unsigned} highSeed
   */
  setSeed(lowSeed, highSeed) {
    if (lowSeed) {
      this.lowSeed = lowSeed >>> 0;
      this.lowState = this.lowSeed >>> 0;
    }
    if (highSeed) {
      this.highSeed = highSeed >>> 0;
      this.highState = this.highSeed >>> 0;
    }
    this.highStateCount = 0;
    this.lowStateCount = 0;
  }

  /**
   * Returns the seed of the RNG
   */
  getSeed() {
    return [this.lowSeed, this.highSeed];
  }

  /**
   * Set the RNG to the nth state
   * If no params: Reset the RNG sequence to the zeroth state
   * @param {integer: negative numbers transformed to 32-bit unsigned} lowCount 
   * @param {integer: negative numbers transformed to 32-bit unsigned} highCount 
   */
  setStateCount(lowCount = 0, highCount = 0) {
    this.highState = this.highSeed >>> 0;
    this.lowState = this.lowSeed >>> 0;
    this.highStateCount = 0;
    this.lowStateCount = 0;
    this.nthSkip(lowCount, highCount);
  }

  /**
   * Returns the state count of the RNG
   */
  getStateCount() {
    return [this.lowStateCount, this.highStateCount];
  }

  /**
   * Set the incrementer of the RNG, defaults to current constants
   * @param {integer: negative numbers transformed to 32-bit unsigned} lowConstant 
   * @param {integer: negative numbers transformed to 32-bit unsigned} highConstant 
   */
  setIncrementer(
    lowConstant = this.lowConstant,
    highConstant = this.highConstant
  ) {
    this.lowConstant = lowConstant >>> 0;
    this.highConstant = highConstant >>> 0;
  }

  /**
   * Returns the current incrementer used by the RNG
   */
  getIncrementer() {
    return [this.lowConstant, this.highConstant];
  }

  /**
   * Save the full set of states that represent the RNG
   */
  saveRngStates() {
    return [
      this.lowSeed,
      this.highSeed,
      this.lowStateCount,
      this.highStateCount,
      this.lowConstant,
      this.highConstant
    ];
  }

  /**
   * Load a full set of states to the RNG
   * @param {integer: negative numbers transformed to 32-bit unsigned} lowSeed 
   * @param {integer: negative numbers transformed to 32-bit unsigned} highSeed 
   * @param {integer: negative numbers transformed to 32-bit unsigned} lowStateCount 
   * @param {integer: negative numbers transformed to 32-bit unsigned} highStateCount 
   * @param {integer: negative numbers transformed to 32-bit unsigned} lowConstant 
   * @param {integer: negative numbers transformed to 32-bit unsigned} highConstant 
   */
  loadRngStates(
    lowSeed,
    highSeed,
    lowStateCount,
    highStateCount,
    lowConstant,
    highConstant
  ) {
    this.setSeed(lowSeed, highSeed);
    this.setIncrementer(lowConstant, highConstant);
    this.setStateCount(lowStateCount, highStateCount);
  }

  /**
   * Returns the next random number in the RNG sequence.
   */
  nextNumber() {
    this._nextState();
    return this._generateRandomNumber();
  }

  /**
   * Get the next random number by skipping forward by n steps.
   * If no params: Behaves like nextNumber.
   * @param {integer: negative numbers transformed to 32-bit unsigned} lowSkip
   * @param {integer: negative numbers transformed to 32-bit unsigned} highSkip 
   */
  nthSkip(lowSkip = 1, highSkip = 0) {
    this._fastForward(lowSkip >>> 0, highSkip >>> 0);
    return this._generateRandomNumber();
  }

  /**
   * Get the nth random number in the RNG sequence
   * If no params: Returns the zeroth number in the RNG sequence
   * @param {integer: negative numbers transformed to 32-bit unsigned} lowNumber 
   * @param {integer: negative numbers transformed to 32-bit unsigned} highNumber 
   */
  nthNumber(lowNumber = 0, highNumber = 0) {
    this.highState = this.highSeed >>> 0;
    this.lowState = this.lowSeed >>> 0;
    this.highStateCount = 0;
    this.lowStateCount = 0;
    this._generateRandomNumber();
    return this.nthSkip(lowNumber, highNumber);
  }

  //Multiply state by multiplier
  _multiply(aHi, aLo, bHi, bLo) {
    var c1 = ((aLo >>> 16) * (bLo & 0xffff)) >>> 0;
    var c0 = ((aLo & 0xffff) * (bLo >>> 16)) >>> 0;

    var lo = ((aLo & 0xffff) * (bLo & 0xffff)) >>> 0;
    var hi = ((aLo >>> 16) * (bLo >>> 16) + ((c0 >>> 16) + (c1 >>> 16))) >>> 0;

    c0 = (c0 << 16) >>> 0;
    lo = (lo + c0) >>> 0;
    if (lo >>> 0 < c0 >>> 0) {
      hi = (hi + 1) >>> 0;
    }

    c1 = (c1 << 16) >>> 0;
    lo = (lo + c1) >>> 0;
    if (lo >>> 0 < c1 >>> 0) {
      hi = (hi + 1) >>> 0;
    }

    hi = (hi + this._imul(aLo, bHi)) >>> 0;
    hi = (hi + this._imul(aHi, bLo)) >>> 0;

    return [hi >>> 0, lo >>> 0];
  }

  //Add constant to state
  _add(aHi, aLo, bHi, bLo) {
    var hi = (aHi + bHi) >>> 0;
    var lo = (aLo + bLo) >>> 0;
    if (lo >>> 0 < aLo >>> 0) {
      hi = (hi + 1) | 0;
    }
    return [hi >>> 0, lo >>> 0];
  }

  //Get the next state
  _nextState() {
    let [newHi, newLow] = this._multiply(
      this.highMultiplier,
      this.lowMultiplier,
      this.highState,
      this.lowState
    );
    [newHi, newLow] = this._add(
      this.highConstant,
      this.lowConstant,
      newHi,
      newLow
    );
    this.highState = newHi >>> 0;
    this.lowState = newLow >>> 0;
    [this.highStateCount, this.lowStateCount] = this._add(
      this.highStateCount,
      this.lowStateCount,
      0,
      1
    );
  }

  _isOdd(hi, lo) {
    if (lo > 0) {
      return (lo & 1) === 1;
    }
    return (hi & 1) === 1;
  }

  _rightShift(hi, lo, num) {
    const newHi = hi >>> num;
    const newLo = ((hi << (32 - num)) | (lo >>> num)) >>> 0;
    return [newHi, newLo];
  }

  //Fast forward the RNG by jumpDistance.
  // https://laws.lanl.gov/vhosts/mcnp.lanl.gov/pdf_files/anl-rn-arb-stride.pdf
  _fastForward(jumpDistanceLo, jumpDistanceHi) {
    let GHi = 0;
    let GLo = 1;
    let hHi = this.highMultiplier;
    let hLo = this.lowMultiplier;
    let iHi = jumpDistanceHi;
    let iLo = jumpDistanceLo;
    while (iLo > 0 || iHi > 0) {
      //if Odd
      if (this._isOdd(iHi, iLo)) {
        [GHi, GLo] = this._multiply(GHi, GLo, hHi, hLo);
      }
      [hHi, hLo] = this._multiply(hHi, hLo, hHi, hLo);
      [iHi, iLo] = this._rightShift(iHi, iLo, 1);
    }
    let CHi = 0;
    let CLo = 0;
    let fHi = this.highConstant;
    let fLo = this.lowConstant;
    hHi = this.highMultiplier;
    hLo = this.lowMultiplier;
    iHi = jumpDistanceHi;
    iLo = jumpDistanceLo;
    while (iLo > 0 || iHi > 0) {
      if (this._isOdd(iHi, iLo)) {
        [CHi, CLo] = this._multiply(CHi, CLo, hHi, hLo);
        [CHi, CLo] = this._add(CHi, CLo, fHi, fLo);
      }
      let [h1Hi, h1Lo] = this._add(hHi, hLo, 0, 1);
      [fHi, fLo] = this._multiply(fHi, fLo, h1Hi, h1Lo);
      [hHi, hLo] = this._multiply(hHi, hLo, hHi, hLo);
      [iHi, iLo] = this._rightShift(iHi, iLo, 1);
    }
    [this.highStateCount, this.lowStateCount] = this._add(
      this.highStateCount,
      this.lowStateCount,
      jumpDistanceHi,
      jumpDistanceLo
    );
    [this.highState, this.lowState] = this._multiply(
      GHi,
      GLo,
      this.highState,
      this.lowState
    );
    [this.highState, this.lowState] = this._add(
      CHi,
      CLo,
      this.highState,
      this.lowState
    );
  }
  //Generates random number from state using the PCG-XSH-RR algorithm
  //output = rotate32((state ^ (state >> 18)) >> 27, state >> 59);
  _generateRandomNumber() {
    var [hi, lo] = this._rightShift(this.highState, this.lowState, 18);
    hi = hi ^ this.highState;
    lo = lo ^ this.lowState;
    [hi, lo] = this._rightShift(hi, lo, 27);
    const rot = this.highState >>> 27;
    return (((lo >>> rot) | (lo << (32 - rot))) >>> 0) / (-1 >>> 0);
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = Random;
}
