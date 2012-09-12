(function () {
  var A = 0, B = 1, C = 2
    , X = 3, Y = 4, Z = 5
    , I = 6, J = 7
    , SP = 8, PC = 9, EX = 10, IA = 11
    // list of browser keycodes to translate to 0x10c keycodes
    , KEY_MAP = {
         8: 0x10,  // backspace
         9: 0x09,  // tab
        13: 0x11,  // return
        16: 0x90,  // shift
        17: 0x91,  // control
        18: null,  // alt
        19: null,  // pause
        20: null,  // caps lock
        27: 27,    // esc
        33: null,  // page up
        34: null,  // page down
        35: null,  // end
        36: null,  // home
        37: 0x82,  // left
        38: 0x80,  // up
        39: 0x83,  // right
        40: 0x81,  // down
        45: 0x12,  // insert
        46: 0x13,  // delete
        91: null,  // windows left
        92: null,  // windows right
        93: null,  // right click
        96: 48,    // num 0
        97: 49,    // num 1
        98: 50,    // num 2
        99: 51,    // num 3
        100: 52,   // num 4
        101: 53,   // num 5
        102: 54,   // num 6
        103: 55,   // num 7
        104: 56,   // num 8
        105: 57,   // num 9
        106: 42,   // num *
        107: 43,   // num +
        109: 45,   // num -
        110: 46,   // num .
        111: 47,   // num /
        112: null, // F1
        113: null, // F2
        114: null, // F3
        115: null, // F4
        116: null, // F5
        117: null, // F6
        118: null, // F7
        119: null, // F8
        120: null, // F9
        121: null, // F10
        122: null, // F11
        123: null, // F12
        144: null, // num lock
        145: null, // scroll lock
        186: 59, //58],  // ; :
        187: 61, //43],  // = +
        188: 44, //60],  // , <
        189: 45, //95],  // - _
        190: 46, //62],  // . >
        191: 47, //63],  // / ?
        192: 96, //126], // ` ~
        219: 91, //123], // [ {
        220: 92, //124], // \ |
        221: 93, //125], // ] }
        222: 39, //34],  // ' "
        255: null // windows right click
      }
    // list of 0x10c keycodes to use unicode symbol for status
    , KEY_CHAR = {
        0x10: '\u232b',
        0x11: '\u21a9',
        0x12: '\u2759',
        0x13: '\u2326',
        0x1b: '\u238b',
        0x80: '\u2191',
        0x81: '\u2193',
        0x82: '\u2190',
        0x83: '\u2192',
        0x90: '\u21e7',
        0x91: '\u2318',
        0x20: '\u2423',
        0x09: '\u21e5'
      }
    // list of 0x10c keycodes to place in buffer during keydown event
    , KEY_TO_BUFFER = [
        0x09, 0x10, 0x12, 0x13, 0x80, 0x81, 0x82, 0x83
      ]
    // list of browser keycodes to prevent default behavior of
    , KEY_PREVENT = [
        8, 9, 37, 38, 39, 40
      ]
  ;

  // no var so that Keyboard is global
  Keyboard = function () {
    this.id = 0x30cf7406;
    this.version = 0x1;
    this.manufacturer = 0x0; // TODO: figure out manufacturer
    this.reset();
  };

  Keyboard.description = 'keyboard';
  Keyboard.specification = 'keyboard.txt';

  Keyboard.prototype.create_ui = function () {
    // refresh ui once after DOM is updated
    var that = this;
    setTimeout(function () {
      that.show_status();
    },0);

    this.ui = $('<div tabindex="0" class="keyboard"><pre></pre>' +
                '<span class="help">set focus here to type</span></div>');

    this.ui.keydown(function (evt) {
      // keydown event receives keyboard keycode, translate to ascii
      if (evt.target.nodeName !== 'TEXTAREA' && evt.target.nodeName !== 'INPUT') {
        if (KEY_PREVENT.indexOf(evt.which) !== -1) evt.preventDefault();
        var key = KEY_MAP[evt.which] || evt.which;
        that.pressed[key] = true;
        if (KEY_TO_BUFFER.indexOf(key) !== -1) that.buffer.push(key);
        if (that.intrpt_msg !== 0) that.intrpt_fn(that.intrpt_msg);
        that.show_status();
      }
    });
    this.ui.keyup(function (evt) {
      if (evt.target.nodeName !== 'TEXTAREA' && evt.target.nodeName !== 'INPUT') {
        if (KEY_PREVENT.indexOf(evt.which) !== -1) evt.preventDefault();
        var key = KEY_MAP[evt.which] || evt.which;
        that.pressed[key] = false;
        if (that.intrpt_msg !== 0) that.intrpt_fn(that.intrpt_msg);
        that.show_status();
      }
    });
    this.ui.keypress(function (evt) {
      // keypress event receives the ascii keycode and places it in the buffer
      if (evt.target.nodeName !== 'TEXTAREA' && evt.target.nodeName !== 'INPUT') {
        evt.preventDefault();
        var key = (evt.which <= 0x20 && evt.which >= 0x80) ? KEY_MAP[evt.which] || evt.which : evt.which;
        that.buffer.push(key);
        if (that.intrpt_msg !== 0) that.intrpt_fn(that.intrpt_msg);
        that.show_status();
      }
    });

    return this.ui;    
  }

  Keyboard.prototype.show_status = function () {
    if (this.ui) {
      var pressed = [];
      for (var prop in this.pressed) { if (this.pressed.hasOwnProperty(prop)) {
        if (this.pressed[prop]) {
          pressed.push(prop);
        }
      }}
      this.ui.find('pre').text(
        '   Buffer: ' + this.buffer.map(function (c) {
          return (KEY_CHAR[c] || String.fromCharCode(c));
        }).join('') + '\n' +
        '  Pressed: ' + pressed.map(function (c) {
          return (KEY_CHAR[c] || String.fromCharCode(c)) + ' ';
        }).join(' ') + '\n' +
        'Interrupt: ' + this.intrpt_msg
      );
    }
  }

  Keyboard.prototype.reset = function () {
    this.buffer = [];
    this.pressed = {};
    this.intrpt_msg = 0;
    this.show_status();
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