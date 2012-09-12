(function () {
  var A = 0, B = 1, C = 2
    , X = 3, Y = 4, Z = 5
    , I = 6, J = 7
    , SP = 8, PC = 9, EX = 10, IA = 11
  ;
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
    var key_char = {
      0x10: '\u232b',
      0x11: '\u21a9',
      0x12: '\u2759',
      0x13: '\u2326',
      0x80: '\u2191',
      0x81: '\u2193',
      0x82: '\u2190',
      0x83: '\u2192',
      0x90: '\u21e7',
      0x91: '\u2318',
      0x20: '\u2423',
      0x09: '\u21e5'
    }
    var pressed_map = {
      192: 96,  // ` ~
      189: 45,  // - _
      187: 61,  // = +
      219: 91,  // [ {
      221: 93,  // ] }
      220: 92,  // \ |
      186: 59,  // ; :
      222: 39,  // ' "
      188: 44,  // , <
      190: 46,  // . >
      191: 47   // / ?       
    }

  // no var so that Keyboard is global
  Keyboard = function () {
    this.id = 0x30cf7406;
    this.version = 0x1;
    this.manufacturer = 0x0; // TODO: figure out manufacturer
    this.reset();
    this.el = document;
    var that = this;
    // used to translate between browser keyCode and 0x10c keyboard numbers
    $(document).keydown(function (evt) {
      if (evt.target.nodeName !== 'TEXTAREA') {
        console.log('keydown: ' + evt.which);
        if (evt.which >= 37 && evt.which <= 40 || evt.which === 8) evt.preventDefault();
        var key = pressed_map[evt.which] || evt.which;
        that.pressed[key] = true;
        if (key >= 0x10 && key <= 0x13 || key === 9) that.buffer.push(key);
        if (that.intrpt_msg !== 0) that.intrpt_fn(that.intrpt_msg);
        that.show_status();
      }
    });
    $(document).keyup(function (evt) {
      if (evt.target.nodeName !== 'TEXTAREA') {
        evt.preventDefault();
        that.pressed[pressed_map[evt.which] || evt.which] = false;
        if (that.intrpt_msg !== 0) that.intrpt_fn(that.intrpt_msg);
        that.show_status();
      }
    });
    $(document).keypress(function (evt) {
      if (evt.target.nodeName !== 'TEXTAREA' && evt.keyCode !== 13) {
        console.log('keypress: ' + evt.which);
        evt.preventDefault();
        that.buffer.push(evt.which);
        if (that.intrpt_msg !== 0) that.intrpt_fn(that.intrpt_msg);
        that.show_status();
      }
    });
  };

  Keyboard.description = 'keyboard';
  Keyboard.specification = 'keyboard.txt';

  Keyboard.prototype.create_ui = function () {
    // refresh ui once after DOM is updated
    var that = this;
    setTimeout(function () {
      that.show_status();
    },0);

    return (this.ui = $('<pre></pre>'));    
  }

  Keyboard.prototype.show_status = function () {
    if (this.ui) {
      var pressed = [];
      for (var prop in this.pressed) { if (this.pressed.hasOwnProperty(prop)) {
        if (this.pressed[prop]) {
          pressed.push(prop);
        }
      }}
      this.ui.text(
        '   Buffer: ' + this.buffer.map(function (c) {
          return (key_char[c] || String.fromCharCode(c));
        }).join('') + '\n' +
        '  Pressed: ' + pressed.map(function (c) {
          return (key_char[c] || String.fromCharCode(c)) + ' ';
        }).join(' ') + '\n' +
        'Interrupt: ' + this.intrpt_msg
      );
    }
  }

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
        this.show_status();
        break;
      case 0x1:  // store next key in C, or 0
        UREG[C] = this.buffer.shift() || 0;
        break;
      case 0x2:  // set C if key B is pressed
        UREG[C] = this.pressed[UREG[B]] ? 1 : 0
        break;
      case 0x3:  // turn on/off interrupts
        this.intrpt_msg = UREG[B];
        this.show_status();
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