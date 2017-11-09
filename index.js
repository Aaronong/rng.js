class Random {
  constructor(lowSeed = 0xf02386, highSeed = 0) {
    //multiplier taken from http://www.ams.org/journals/mcom/1999-68-225/S0025-5718-99-00996-5/S0025-5718-99-00996-5.pdf

    this.highMultiplier = 0x27bb2ee6;
    this.lowMultiplier = 0x87b0b0fd;
    this.highConstant = 0x14057b7e;
    this.lowConstant = 0xf767814f;
    this.highSeed = highSeed;
    this.lowSeed = lowSeed;
    this.highState = this.highSeed;
    this.lowState = this.lowSeed;
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
  }
  /**
   * Set the seed of the RNG, returns the modified RNG, count is reset
   * @param {integer: negative numbers transformed to unsigned} low 
   * @param {integer: negative numbers transformed to unsigned} high 
   */
  setSeed(low, high) {
    if (low) {
      this.lowSeed = low >>> 0;
      this.lowState = this.lowSeed;
    }
    if (high) {
      this.highSeed = high >>> 0;
      this.highState = this.highSeed;
    }
    this.highStateCount = 0;
    this.lowStateCount = 0;
    return this;
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
   * @param {integer: negative numbers transformed to unsigned} nLo 
   * @param {integer: negative numbers transformed to unsigned} nHi 
   */
  setStateCount(lowCount = 0, highCount = 0) {
    this.highState = this.highSeed;
    this.lowState = this.lowSeed;
    this.highStateCount = 0;
    this.lowStateCount = 0;
    this.nthSkip(lowCount, highCount);
  }

  /**
   * Get the state count of the RNG
   */
  getStateCount() {
    return [this.lowStateCount, this.highStateCount];
  }

  /**
   * Set the incrementer of the RNG, defaults to current constants
   * @param {integer: negative numbers transformed to unsigned} lowConstant 
   * @param {integer: negative numbers transformed to unsigned} highConstant 
   */
  setIncrementer(
    lowConstant = this.lowConstant,
    highConstant = this.highConstant
  ) {
    this.lowConstant = lowConstant >>> 0;
    this.highConstant = highConstant >>> 0;
  }

  /**
   * Returns the current incrementers used by the RNG
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
   * @param {integer: negative numbers transformed to unsigned} lowSeed 
   * @param {integer: negative numbers transformed to unsigned} highSeed 
   * @param {integer: negative numbers transformed to unsigned} lowStateCount 
   * @param {integer: negative numbers transformed to unsigned} highStateCount 
   * @param {integer: negative numbers transformed to unsigned} lowConstant 
   * @param {integer: negative numbers transformed to unsigned} highConstant 
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
   * Get the next random number.
   */
  nextNumber() {
    this._nextState();
    return [this.highState, this.lowState];
  }

  /**
   * Get the next random number by skipping forward by n steps.
   * If no params: Behaves like nextNumber.
   * @param {integer: negative numbers transformed to unsigned} nLo 
   * @param {integer: negative numbers transformed to unsigned} nHi 
   */
  nthSkip(nLo = 1, nHi = 0) {
    this._fastForward(nLo >>> 0, nHi >>> 0);
    return [this.highState, this.lowState];
  }

  /**
   * Get the nth random number in the RNG sequence
   * If no params: Returns the zeroth number in the RNG sequence
   * @param {integer: negative numbers transformed to unsigned} nLo 
   * @param {integer: negative numbers transformed to unsigned} nHi 
   */
  nthNumber(nLo = 0, nHi = 0) {
    this.highState = this.highSeed;
    this.lowState = this.lowSeed;
    this.highStateCount = 0;
    this.lowStateCount = 0;
    return this.nthSkip(nLo, nHi);
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
    this.highState = newHi;
    this.lowState = newLow;
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

  _div2(hi, lo) {
    const newHi = hi >>> 1;
    const newLo = (((hi & 1) << 31) | (lo >>> 1)) >>> 0;
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
      [iHi, iLo] = this._div2(iHi, iLo);
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
      [iHi, iLo] = this._div2(iHi, iLo);
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
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = Random;
}
