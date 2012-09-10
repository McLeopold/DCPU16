(function () {
  var A = 0, B = 1, C = 2
    , X = 3, Y = 4, Z = 5
    , I = 6, J = 7
    , SP = 8, PC = 9, EX = 10, IA = 11
  ;

  // no var so that Keyboard is global
  Keyboard = function (el) {
    this.id = 0x30cf7406;
    this.version = 0x1;
    this.manufacturer = 0x0; // TODO: figure out manufacturer
    this.reset();
    this.el = el;
    var that = this;
    // used to translate between browser keyCode and 0x10c keyboard numbers
    var key_num = {
       8: 0x10, // backspace
      13: 0x11, // return
      45: 0x12, // insert
      46: 0x13, // delete
      38: 0x80, // up
      40: 0x81, // down
      37: 0x82, // left
      39: 0x83, // right
      16: 0x90, // shift
      17: 0x91  // control
    };
    $(el).keydown(function (evt) {
      if (evt.target.nodeName !== 'TEXTAREA') {
        if (evt.which >= 37 && evt.which <= 40 || evt.which === 8) evt.preventDefault();
        var key = key_num[evt.which] || evt.which;
        that.pressed[key] = true;
        if (key >= 0x10 && key <= 0x13) that.buffer.push(key);
        if (that.intrpt_msg !== 0) that.intrpt_fn(that.intrpt_msg);
      }
    });
    $(el).keyup(function (evt) {
      if (evt.target.nodeName !== 'TEXTAREA') {
        evt.preventDefault();
        that.pressed[key_num[evt.which] || evt.which] = false;
        if (that.intrpt_msg !== 0) that.intrpt_fn(that.intrpt_msg);
      }
    });
    $(el).keypress(function (evt) {
      if (evt.target.nodeName !== 'TEXTAREA') {
        evt.preventDefault();
        that.buffer.push(key_num[evt.which] || evt.which);
        if (that.intrpt_msg !== 0) that.intrpt_fn(that.intrpt_msg);
      }
    });
  };

  Keyboard.prototype.reset = function () {
    this.buffer = [];
    this.pressed = {};
    this.intrpt_msg = 0;
  }

  Keyboard.prototype.connect = function (fn) {
    this.intrpt_fn = fn;
  }

  Keyboard.prototype.intrpt = function (URAM, SRAM, UREG, SREG) {
    var that = this;
    switch (UREG[A]) {
      case 0x0:  // clear buffer
        this.buffer = [];
        break;
      case 0x1:  // store next key in C, or 0
        UREG[C] = this.buffer.shift() || 0;
        break;
      case 0x2:  // set C if key B is pressed
        UREG[C] = this.pressed[UREG[B]] ? 1 : 0
        break;
      case 0x3:  // turn on/off interrupts
        this.intrpt_msg = UREG[B];
        break;
    }
  };

}());

/*

Name: Generic Keyboard (compatible)
ID: 0x30cf7406
Version: 1

Interrupts do different things depending on contents of the A register:

 A | BEHAVIOR
---+----------------------------------------------------------------------------
 0 | Clear keyboard buffer
 1 | Store next key typed in C register, or 0 if the buffer is empty
 2 | Set C register to 1 if the key specified by the B register is pressed, or
   | 0 if it's not pressed
 3 | If register B is non-zero, turn on interrupts with message B. If B is zero,
   | disable interrupts
---+----------------------------------------------------------------------------

When interrupts are enabled, the keyboard will trigger an interrupt when one or
more keys have been pressed, released, or typed.

Key numbers are:
  0x10: Backspace
  0x11: Return
  0x12: Insert
  0x13: Delete
  0x20-0x7f: ASCII characters
  0x80: Arrow up
  0x81: Arrow down
  0x82: Arrow left
  0x83: Arrow right
  0x90: Shift
  0x91: Control

*/