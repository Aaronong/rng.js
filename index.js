class Random {
  constructor(lowSeed = 0xf02386, highSeed = 0) {
    //constants taken from http://www.ams.org/journals/mcom/1999-68-225/S0025-5718-99-00996-5/S0025-5718-99-00996-5.pdf

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
    this.imul = Math.imul;
    if (!this.imul) {
      this.imul = function(a, b) {
        var ah = (a >>> 16) & 0xffff,
          al = a & 0xffff;
        var bh = (b >>> 16) & 0xffff,
          bl = b & 0xffff;
        return (al * bl + (((ah * bl + al * bh) << 16) >>> 0)) | 0;
      };
    }
  }

  //Set seed
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

    hi = (hi + this.imul(aLo, bHi)) >>> 0;
    hi = (hi + this.imul(aHi, bLo)) >>> 0;

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

  //Fast forward the RNG by jumpDistance.
  // https://laws.lanl.gov/vhosts/mcnp.lanl.gov/pdf_files/anl-rn-arb-stride.pdf
  _fastForward(jumpDistance) {
    let GHi = 0;
    let GLo = 1;
    let hHi = this.highMultiplier;
    let hLo = this.lowMultiplier;
    let i = jumpDistance;
    while (i > 0) {
      //if Odd
      if ((i >> 1) << 1 !== i) {
        [GHi, GLo] = this._multiply(GHi, GLo, hHi, hLo);
      }
      [hHi, hLo] = this._multiply(hHi, hLo, hHi, hLo);
      i = i >> 1;
    }
    let CHi = 0;
    let CLo = 0;
    let fHi = this.highConstant;
    let fLo = this.lowConstant;
    hHi = this.highMultiplier;
    hLo = this.lowMultiplier;
    i = jumpDistance;
    while (i > 0) {
      if ((i >> 1) << 1 !== i) {
        [CHi, CLo] = this._multiply(CHi, CLo, hHi, hLo);
        [CHi, CLo] = this._add(CHi, CLo, fHi, fLo);
      }
      let [h1Hi, h1Lo] = this._add(hHi, hLo, 0, 1);
      [fHi, fLo] = this._multiply(fHi, fLo, h1Hi, h1Lo);
      [hHi, hLo] = this._multiply(hHi, hLo, hHi, hLo);
      i = i >> 1;
    }
    [this.highStateCount, this.lowStateCount] = this._add(
      this.highStateCount,
      this.lowStateCount,
      0,
      jumpDistance
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

  //getStateCount
  getStateCount() {
    return [this.highStateCount, this.lowStateCount];
  }

  //Set the RNG to the given state number. Used for random access of generated random number.
  seekState(stateNumber) {}

  //Get the next random number.
  nextNumber() {
    this._nextState();
    return [this.highState, this.lowState];
  }

  //Get the next random number by skipping forward by n steps.
  nthSkip(n) {
    this._fastForward(n);
    return [this.highState, this.lowState];
  }

  //Get the nth random number in the RNG sequence
  nthNumber(n) {
    this.highState = this.highSeed;
    this.lowState = this.lowSeed;
    this.highStateCount = 0;
    this.lowStateCount = 0;
    return this.nthSkip(n);
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = Random;
}
