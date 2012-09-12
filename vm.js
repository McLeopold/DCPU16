(function () {
  // constants
  var SIZE = 0x10000
    , A = 0, B = 1, C = 2
    , X = 3, Y = 4, Z = 5
    , I = 6, J = 7
    , SP = 8, PC = 9, EX = 10, IA = 11, LIT = 12
  ;

  // no var so that DCPU16 is global
  DCPU16 = function (kHz) {
    var that = this;

    this.HW = [];
    this.intrpt_queue = [];
    this.intrpt_on = true;
    this.on_fire = false;
    this.kHz = kHz || 100;

    // reset cpu RAM and registers
    this.reset();

    // TODO: move ui stuff out of CPU class
    // Hookup registers, ram and program text to html form inputs
    this.ram = $('#RAM');
    this.prog = $('#prog');

    // Hookup html buttons to cpu functions
    btnRun = $('#run').click(function () {
      that.run();
      that.showRAM();
    });
    btnStep = $('#step').click(function () {
      that.cycle += that.step(1);
      that.showRAM();
    });
    btnParse = $('#parse').click(function () {
      that.parse();
    });

  }

  DCPU16.prototype.attach_hw = function (hw) {
    this.HW.push(hw);
    var that = this;
    hw.connect(function (msg) {
      that.intrpt(msg);
    });
    return this.HW.length - 1;
  }

  DCPU16.prototype.detach_hw = function (hw) {
    var idx = this.HW.indexOf(hw);
    if (idx !== -1) this.HW.splice(idx, 1);
  }

  DCPU16.prototype.reset = function () {
    // registers are added to the end of the RAM array so that an address can
    // point to them.  This makes the implementation of the instructions slightly
    // easier.  The literal is so that a literal value (0x20-0x3f) is addressable too.
    this.RAM = new ArrayBuffer(SIZE*2+26); // RAM + 12 registers at 16bits each
                                           // + literal value storage area
    this.SRAM = new Int16Array(this.RAM);
    this.URAM = new Uint16Array(this.RAM);
    this.SREG = new Int16Array(this.RAM, SIZE * 2);
    this.UREG = new Uint16Array(this.RAM, SIZE * 2);
    this.cycle = 0;
    this.running = false;
    for (var i = 0; i < this.HW.length; ++i) {
      this.HW[i].reset();
    }
  }

  DCPU16.prototype.load = function (p) {
    var URAM = this.URAM;
    for (var i = 0, ilen = p.length; i < ilen; ++i) {
      URAM[i] = p[i];
    }
    this.showRAM();
  }

  DCPU16.prototype.parse = function () {
    this.reset();
    var p = Assm.parser.parse(this.prog.val());
    this.load(p.dump);
  }

  DCPU16.prototype.run = function () {
    this.start();
    var speed = this.kHz; // kHz
    var that = this;
    setTimeout(function next_step () {
      if (!that.running) return;
      var startTime = new Date().getTime();
      var cycles = that.step(1024);
      that.cycle += cycles;
      var realTime = new Date().getTime() - startTime
        , pause = Math.round(cycles / speed - realTime)
        , kHz = cycles / (realTime + pause)
      ;
      that.showRAM(kHz);
      if (that.running) setTimeout(next_step, pause);
    }, 0);
  }

  DCPU16.prototype.start = function () {
    for (var i = 0; i < 13; ++i) {
      this.UREG[i] = 0;
    }
    this.cycle = 0;
    this.running = true;
  }

  DCPU16.prototype.intrpt = function (msg) {
    this.intrpt_queue.push(msg);
    if (this.intrpt_queue.length > 256) {
      this.on_fire = true;
    }
  }

  DCPU16.prototype.step = function (count) {
    // start DCPU if needed
    if (!this.running) this.start();
    // create references for speed
    var URAM = this.URAM
      , UREG = this.UREG
      , SRAM = this.SRAM
      , SREG = this.SREG
      , HW = this.HW
      , lastPC = UREG[PC]
      , cycle = 0
      , skip = false
      // cache queue length for speed and keep updated
      // only software interrupts can trigger within step loop
      , intrpt_count = this.intrpt_queue.length
    ;
    // perform count steps
    while(count--) {
      // check for interrupt
      if (intrpt_count > 0 && this.intrpt_on) {
        if (UREG[IA] !== 0) {
          URAM[--UREG[SP]] = UREG[PC];
          URAM[--UREG[SP]] = UREG[A];
          UREG[PC] = UREG[IA];
          UREG[A] = this.intrpt_queue.pop();
          this.intrpt_on = false;
        }
      }
      // get instruction
      var ins = URAM[UREG[PC]++]
        , o = ins & 0x1f
        , b = (ins >> 5) & 0x1f
        , a = ins >> 10
      ;
      if (skip) {
        // look for 2 and 3 word instructions and advance PC past them
        switch (a) {
          case 0x10: case 0x11: case 0x12: case 0x13: case 0x14: case 0x15: case 0x16: case 0x17:
          case 0x1a:
          case 0x1e:
          case 0x1f:
            UREG[PC]++
        }
        switch (b) {
          case 0x10: case 0x11: case 0x12: case 0x13: case 0x14: case 0x15: case 0x16: case 0x17:
          case 0x1a:
          case 0x1e:
          case 0x1f:
            UREG[PC]++
        }
        cycle++;
        // keep skipping until past first non-if instruction
        if (o < 0x10 || o > 0x17) {
          skip = false;
        }
      } else {
        // get a value, advance PC if needed
        var get_addr = function (v, a) {
          var addr;
          switch (v) {
            case 0x00: case 0x01: case 0x02: case 0x03: case 0x04: case 0x05: case 0x06: case 0x07:
              addr = SIZE + v;
              break;
            case 0x08: case 0x09: case 0x0a: case 0x0b: case 0x0c: case 0x0d: case 0x0e: case 0x0f:
              addr = UREG[v - 0x08];
              break;
            case 0x10: case 0x11: case 0x12: case 0x13: case 0x14: case 0x15: case 0x16: case 0x17:
              addr = UREG[v - 0x10] + URAM[UREG[PC]++];
              cycle++;
              break;
            case 0x18: // PUSH / POP
              if (a) {
                addr = UREG[SP]++; // POP
              } else {
                UREG[SP]--
                addr = UREG[SP]; // PUSH
              }
              break;
            case 0x19:
              addr = UREG[SP];
              break;
            case 0x1a:
              addr = UREG[SP] + URAM[UREG[PC]++];
              cycle++;
              break;
            case 0x1b: case 0x1c: case 0x1d:
              addr = SIZE + v - 0x13;
              break;
            case 0x1e:
              addr = URAM[UREG[PC]++];
              cycle++;
              break;
            case 0x1f:
              addr = UREG[PC]++;
              cycle++;
              break;
            default:
              UREG[LIT] = v - 0x21;
              addr = SIZE + LIT;
              break;
          }
          return addr;
        }
        // these will advance the PC if needed
        var a_addr, b_addr;
        a_addr = get_addr(a, true);
        if (o !== 0) {
          b_addr = get_addr(b, false);
        }
        // perform operation
        switch (o) {
          case 0x1: // SET b, a
            URAM[b_addr] = URAM[a_addr];
            cycle += 1;
            break;
          case 0x2: // ADD b, a
            UREG[EX] = (URAM[b_addr] += URAM[a_addr]) >= SIZE ? 0x0001 : 0x0000;
            cycle += 2;
            break;
          case 0x3: // SUB b, a
            UREG[EX] = (URAM[b_addr] -= URAM[a_addr]) < 0x0000 ? 0xffff : 0x0000;
            cycle += 2;
            break;
          case 0x4: // MUL b, a
            UREG[EX] = ((URAM[b_addr] *= URAM[a_addr]) >> 16) & 0xffff;
            cycle += 2;
            break;
          case 0x5: // MLI b, a
            UREG[EX] = ((SRAM[b_addr] *= SRAM[a_addr]) >> 16) & 0xffff;
            cycle += 2;
            break;
          case 0x6: // DIV b, a  signed division
            if (URAM[a_addr] === 0) {
              UREG[EX] = URAM[b_addr] = 0;
            } else {
              UREG[EX] = ((URAM[b_addr] << 16) / URAM[a_addr]) & 0xffff;
              URAM[b_addr] /= URAM[a_addr];
            }
            cycle += 3;            
            break;
          case 0x7: // DVI b, a  signed division
            if (SRAM[a_addr] === 0) {
              SREG[EX] = SRAM[b_addr] = 0;
            } else {
              SREG[EX] = ((SRAM[b_addr] << 16) / SRAM[a_addr]) & 0xffff;
              SRAM[b_addr] /= SRAM[a_addr];
            }
            cycle += 3;
            break;
          case 0x8: // MOD b, a
            if (URAM[a_addr] === 0) {
              URAM[b_addr] = 0
            } else {
              URAM[b_addr] %= URAM[a_addr];
            }
            cycle += 3;
            break;
          case 0x9: // MDI b, a
            if (SRAM[a_addr] === 0) {
              SRAM[b_addr] = 0
            } else {
              SRAM[b_addr] %= SRAM[a_addr];
            }
            cycle += 3;
            break;
          case 0xa: // AND b, a
            URAM[b_addr] &= URAM[a_addr];
            cycle += 1;
            break;
          case 0xb: // BOR b, a
            URAM[b_addr] |= URAM[a_addr];
            cycle += 1;
            break;
          case 0xc: // XOR b, a
            URAM[b_addr] ^= URAM[a_addr];
            cycle += 1;
            break;
          case 0xd: // SHR b, a
            UREG[EX] = ((URAM[b_addr] << 16) >> URAM[a_addr]) & 0xffff;
            URAM[b_addr] >>>= URAM[a_addr];
            cycle += 1;
            break;
          case 0xe: // ASR b, a
            SREG[EX] = ((SRAM[b_addr] << 16) >> SRAM[a_addr]) & 0xffff;
            SRAM[b_addr] >>= SRAM[a_addr];
            cycle += 1;
            break;
          case 0xf: // SHL b, a
            UREG[EX] = ((URAM[b_addr] <<= URAM[a_addr]) >> 16) & 0xffff;
            cycle += 1;
            break;
          case 0x10: // IFB b, a
            skip = !(URAM[b_addr] & URAM[a_addr] !== 0);
            cycle += 2
            break;
          case 0x11: // IFC b, a
            skip = !(URAM[b_addr] & URAM[a_addr] === 0);
            cycle += 2
            break;
          case 0x12: // IFE b, a
            skip = !(URAM[b_addr] === URAM[a_addr]);
            cycle += 2
            break;
          case 0x13: // IFN b, a
            skip = !(URAM[b_addr] !== URAM[a_addr]);
            cycle += 2
            break;
          case 0x14: // IFG b, a
            skip = !(URAM[b_addr] > URAM[a_addr]);
            cycle += 2
            break;
          case 0x15: // IFA b, a
            skip = !(SRAM[b_addr] > SRAM[a_addr]);
            cycle += 2
            break;
          case 0x16: // IFL b, a
            skip = !(URAM[b_addr] < URAM[a_addr]);
            cycle += 2
            break;
          case 0x17: // IFU b, a
            skip = !(SRAM[b_addr] < SRAM[a_addr]);
            cycle += 2
            break;
          case 0x1a: // ADX b, a
            UREG[EX] = (URAM[b_addr] += URAM[a_addr] + UREG[EX]) >= SIZE ? 0x0001 : 0x0000;
            cycle += 3;
            break;
          case 0x1b: // SBX b, a
            UREG[EX] = (URAM[b_addr] -= URAM[a_addr] - UREG[EX]) < 0 ? 0xffff : 0x0000;
            cycle += 3;
            break;
          case 0x1e: // STI b, a
            URAM[b_addr] = URAM[a_addr];
            UREG[I]++;
            UREG[J]++;
            cycle += 2;
            break;
          case 0x1f: // STD b, a
            URAM[b_addr] = URAM[a_addr];
            UREG[I]--;
            UREG[J]--;
            cycle += 2;
            break;
          case 0x0: // special instruction
            switch (b) {
              case 0x01: // JSR a
                UREG[SP]--;
                URAM[UREG[SP]] = UREG[PC];
                UREG[PC] = URAM[a_addr];
                cycle += 3;
                break;
              case 0x08: // INT
                this.intrpt(URAM[a_addr]);
                intrpt_count++;
                cycle += 4;
                break;
              case 0x09: // IAG
                URAM[a_addr] = UREG[IA];
                cycle += 1;
                break;
              case 0x0a: // IAS
                UREG[IA] = URAM[a_addr];
                cycle += 1;
                break;
              case 0x0b: // RFI
                this.intrpt_on = true;
                UREG[A] = URAM[UREG[SP]++];
                UREG[PC] = URAM[UREG[SP]++];
                cycle += 3;
                break;
              case 0x0c: // IAQ
                this.intrpt_on = URAM[a_addr] === 0;
                cycle += 2;
                break;
              case 0x10: // HWN
                URAM[a_addr] = HW.length;
                cycle += 2;
                break;
              case 0x11: // HWQ
                var hw = HW[URAM[a_addr]];
                if (hw) {
                  UREG[A] = HW[URAM[a_addr]].id & 0xffff;
                  UREG[B] = HW[URAM[a_addr]].id >> 16;
                  UREG[C] = HW[URAM[a_addr]].version;
                  UREG[X] = HW[URAM[a_addr]].manufacturer & 0xffff;
                  UREG[Y] = HW[URAM[a_addr]].manufacturer >> 16;
                }
                cycle += 4;
                break;
              case 0x12: // HWI
                try {
                  var hw = HW[URAM[a_addr]];
                  if (hw) {
                    var hw_cycle = hw.intrpt(URAM, SRAM, UREG, SREG);
                  }
                } catch (e) {
                  console.log(e);
                  throw e;
                }
                if (typeof hw_cycle === 'number') {
                  cycle += Math.floor(hw_cycle);
                }
                cycle += 4
                break;
            }
            break;
        }
      };
      // don't leave the PC on a skipped instruction
      if (skip) {
        count++
      }
    }
    return cycle;
  };

  // zeropad hex values helper function
  var hex = function (v) {
    var s = v.toString(16);
    while (s.length < 4) {
      s = '0' + s;
    }
    return s;
  }

  DCPU16.prototype.showRAM = function (kHz) {
    kHz = kHz || this.kHz;
    var URAM = this.URAM;
    var UREG = this.UREG;
    var zeros = 0
      , msg = ''
      , gap = false
    ;
    msg += 'kHz: ' + kHz.toFixed(1) + '\n';
    msg += '        CYCLES: ' + hex(this.cycle)
    msg += '         FIRE?: ' + (this.on_fire ? '0001' : '0000') + '\n\n'
    msg += '  SP: ' + hex(UREG[SP]) + ' '
    msg += ' PC: ' + hex(UREG[PC]) + ' '
    msg += ' EX: ' + hex(UREG[EX]) + ' '
    msg += ' IA: ' + hex(UREG[IA]) + ' '

    msg += ' LIT: ' + hex(UREG[LIT]) + '\n\n'

    msg += '  A : ' + hex(UREG[A]) + ' '
    msg += ' X : ' + hex(UREG[X]) + ' '
    msg += ' I : ' + hex(UREG[I]) + '\n'

    msg += '  B : ' + hex(UREG[B]) + ' '
    msg += ' Y : ' + hex(UREG[Y]) + ' '
    msg += ' J : ' + hex(UREG[J]) + '\n'

    msg += '  C : ' + hex(UREG[C]) + ' '
    msg += ' Z : ' + hex(UREG[Z]) + '\n\n'


    for (var i = 0; i < SIZE; i += 8) {
      if (URAM[i] === 0 &&
          URAM[i+1] === 0 &&
          URAM[i+2] === 0 &&
          URAM[i+3] === 0 &&
          URAM[i+4] === 0 &&
          URAM[i+5] === 0 &&
          URAM[i+6] === 0 &&
          URAM[i+7] === 0) {
        if (!gap) {
          msg += '...\n'
        }
        gap = true;
      } else {
        msg += hex(i) + ':';
        for (var j = 0; j < 8; ++j) {
          msg += ' ' + hex(URAM[i+j]);
        }
        msg += '\n';
        gap = false;
      }
    }
    this.ram.text(msg);
  }

}());

$(function () {
  var cpu = new DCPU16(100);

  var el_hardware_btns = $('#hardware caption');
  var el_hardware = $('#hardware');
  var devices = [];
  var register_device = function (device_type) {
    devices.push(device_type);
    var button = $('<input type="button" value="Add ' + device_type.description + '" />')
      .click(function () {
        attach_device(device_type);
      });
    el_hardware_btns.append(button);
  }
  var attach_device = function (device_type) {
    var device = new device_type();
    var device_id = cpu.attach_hw(device);
    var ui = $('<tr><th>' +
               '<input id="detach_' + device_id + '" type="button" value="detach" />' +
               ' (' + device_id + ') ' + device_type.description +
               '  <a href="' + device_type.specification + '" target="spec">spec</a>' +
               '</th></tr>' +
               '<tr><td id="device_' + device_id + '"></td></tr>');
    if (device.create_ui) {
      ui.find('#device_' + device_id).append(device.create_ui());
    }
    ui.find('#detach_' + device_id).click(function () {
      ui.remove();
      cpu.detach_hw(device);
    });
    el_hardware.append(ui);
  }

  register_device(Clock);
  register_device(LEM1802);
  register_device(Keyboard);
  register_device(LM01);

  attach_device(Clock);
  attach_device(LEM1802);
  attach_device(Keyboard);
  attach_device(LM01);

  cpu.showRAM();
})
