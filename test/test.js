let assert = require("assert");
const Random = require("../index");

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
    assert.deepEqual(count + 1, rngSkip.getStateCount()[0]);
  });
  it("should support 64bit skips", () => {
    let rngNth = new Random(-455, -34);
    let rngSkip = new Random(-455, -34);
    const skip1 = [21474, 2367];
    const skip2 = [214748, 543];
    const skip3 = [347923, 9683];
    assert.deepEqual(
      rngSkip.nthSkip(skip1[0], skip1[1]),
      rngNth.nthNumber(skip1[0], skip1[1])
    );
    assert.deepEqual(
      rngSkip.nthSkip(skip2[0], skip2[1]),
      rngNth.nthNumber(skip1[0] + skip2[0], skip1[1] + skip2[1])
    );
    assert.deepEqual(
      rngSkip.nthSkip(skip3[0], skip3[1]),
      rngNth.nthNumber(
        skip1[0] + skip2[0] + skip3[0],
        skip1[1] + skip2[1] + skip3[1]
      )
    );
  });
  it("should save and load states properly", () => {
    let rng = new Random(-23512, 30498);
    rng.nthSkip(-234, 553);
    let saveState = rng.saveRngStates();
    let currRandomNumber = rng.nthNumber(0);
    rng.setSeed(2334, 7);
    rng.setIncrementer(2334, 675);
    rng.nthSkip(54, -23853);
    rng.loadRngStates(...saveState);
    assert.deepEqual(rng.nthNumber(0), currRandomNumber);
  });
  it("should behave differently with different incrementers", () => {
    let rng1 = new Random();
    let rng2 = new Random();
    rng2.setIncrementer(7564345453, 3245);
    assert.deepEqual(rng1.nthNumber(0), rng2.nthNumber(0));
    for (let i = 1; i < 30; i++) {
      assert.notDeepEqual(rng1.nextNumber(), rng2.nextNumber());
    }
  });
});
