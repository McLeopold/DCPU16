(function () {
  var A = 0, B = 1, C = 2
    , X = 3, Y = 4, Z = 5
    , I = 6, J = 7
    , SP = 8, PC = 9, EX = 10, IA = 11
  ;

  // no var so that Clock is global
  Clock = function () {
    this.id = 0x12d0b402;
    this.version = 0x1;
    this.manufacturer = 0x0; // TODO: figure out manufacturer
    this.reset();
  };

  Clock.prototype.reset = function () {
    this.intrpt_msg = 0;
    if (this.interval) {
      clearInterval(this.interval);
    }
    this.interval = null;
  }

  Clock.prototype.connect = function (fn) {
    this.intrpt_fn = fn;
  }

  Clock.prototype.intrpt = function (URAM, SRAM, UREG, SREG) {
    var that = this;
    switch (UREG[A]) {
      case 0x0:
        if (UREG[B] === 0) {
          this.frequency = null;
          this.ticks = 0;
        } else {
          this.frequency = 1000 / (60 / UREG[B]);
          this.ticks = 0;
          this.interval = setInterval(function () {
            that.ticks++;
            if (that.intrpt_msg !== 0) {
              that.intrpt_fn(that.intrpt_msg);
            }
          }, this.frequency);
        }
        break;
      case 0x1:
        UREG[C] = this.ticks;
        break;
      case 0x2:
        //this.trigger_intrpt = UREG[B] !== 0;
        this.intrpt_msg = UREG[B];
        if (this.intrpt_msg === 0 && this.interval) {
          clearInterval(this.interval);
          this.interval = null;
        }
        break;
    }
  };

}());

/*

Name: Generic Clock (compatible)
ID: 0x12d0b402
Version: 1

Interrupts do different things depending on contents of the A register:

 A | BEHAVIOR
---+----------------------------------------------------------------------------
 0 | The B register is read, and the clock will tick 60/B times per second.
   | If B is 0, the clock is turned off.
 1 | Store number of ticks elapsed since last call to 0 in C register
 2 | If register B is non-zero, turn on interrupts with message B. If B is zero,
   | disable interrupts
---+----------------------------------------------------------------------------

When interrupts are enabled, the clock will trigger an interrupt whenever it
ticks.

*/