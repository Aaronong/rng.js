let assert = require("assert");
const Random = require("../index");
// const RandomSkip = require("./index");

describe("RNG", function() {
  it("should generate the same number given same seed", () => {
    let rng = new Random(-23920393, 2332332);
    let rngSkip = new Random(-23920393, 2332332);
    for (let i = 0; i < 10; i++) {
      assert.deepEqual(rng.nextNumber(), rngSkip.nextNumber());
    }
  });
  it("should generate different numbers given different seeds", () => {
    let rng = new Random(-23923393, 2332332);
    let rngSkip = new Random(-43920393, 3352362);
    for (let i = 0; i < 10; i++) {
      assert.notDeepEqual(rng.nextNumber(), rngSkip.nextNumber());
    }
  });
  it("should generate different numbers sequentially", () => {
    let rng = new Random();
    let rngOffset = new Random();
    rngOffset.nextNumber();
    for (let i = 0; i < 10; i++) {
      assert.notDeepEqual(rng.nextNumber(), rngOffset.nextNumber());
    }
  });
  it("should skip to the nth skip properly", () => {
    let rng = new Random(-45540393, 3432332);
    let rngSkip = new Random(-45540393, 3432332);
    for (let i = 23; i < 277; i += 7) {
      for (let x = i - 1; x > 0; x--) {
        rng.nextNumber();
      }
      assert.deepEqual(rng.nextNumber(), rngSkip.nthSkip(i));
    }
  });
  it("should generate the nth number accurately", () => {
    count = 0;
    let rngNth = new Random(87234);
    let rngSkip = new Random(87234);
    for (let i = 3745; i < 4642; i++) {
      count += i;
      // The next number command is for unwanted mutations
      rngNth.nextNumber();
      rngSkip.nthSkip(i);
    }
    assert.deepEqual(rngNth.nthNumber(count + 1), rngSkip.nextNumber());
    assert.deepEqual(rngNth.getStateCount(), rngSkip.getStateCount());
    assert.deepEqual(count + 1, rngSkip.getStateCount()[1]);
  });
});
