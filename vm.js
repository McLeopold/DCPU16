(function () {
  var hex = function (v) {
    var s = v.toString(16);
    while (s.length < 4) {
      s = '0' + s;
    }
    return s;
  }
  var SIZE = 0x10000;

  var HW = []
  ;
  var A = 0
    , B = 1
    , C = 2
    , X = 3
    , Y = 4
    , Z = 5
    , I = 6
    , J = 7
    , SP = 8
    , PC = 9
    , EX = 10
    , IA = 11
    , LIT = 12
  ;

  // no var so that DCPU16 is global
  DCPU16 = function (HW) {
    var that = this;

    // TODO: move ui stuff out of CPU class
    // Hookup registers, ram and program text to html form inputs
    this.reg = [$('#regA'),
                $('#regB'),
                $('#regC'),
                $('#regX'),
                $('#regY'),
                $('#regZ'),
                $('#regI'),
                $('#regJ'),
                $('#regSP'),
                $('#regPC'),
                $('#regEX'),
                $('#regIA'),
                $('#regLIT')
                ];
    this.ram = $('#RAM');
    this.prog = $('#prog');

    // Hookup html buttons to cpu functions
    btnRun = $('#run').click(function () {
      that.run();
      that.showRAM();
    });
    btnStep = $('#step').click(function () {
      that.step();
      that.showRAM();
    });
    btnParse = $('#parse').click(function () {
      that.parse();
    });

    // Hookup hardware to interrupt handler
    // use `that = this` convention to preserve `this` value
    this.HW = [];
    /* HW.slice(0);
    for (var i = 0; i < this.HW.length; ++i) {
      this.HW[i].connect_intrpt(function (msg) {
        that.intrpt(msg);
      });
    }
    */
    this.intrpt_queue = [];
    this.intrpt_on = true;
    this.intrpt_last = false; // flag if the last cpu step was an interrupt
                              // used to make sure an interrupt is only performed
                              // once *between* each instructions
    this.on_fire = false;

    // reset cpu RAM and registers
    this.reset();
  }

  DCPU16.prototype.attach_hw = function (hw) {
    this.HW.push(hw);
    var that = this;
    hw.connect(function (msg) {
      that.intrpt(msg);
    });
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

  DCPU16.prototype.set_reg = function (r, v) {
    var UREG = this.UREG;
    if (v !== undefined) {
      UREG[r] = v;
    }
    this.reg[r].val(UREG[r]);
  }
  DCPU16.prototype.showRAM = function (kHz) {
    var URAM = this.URAM;
    var UREG = this.UREG;
    var zeros = 0
      , msg = ''
      , gap = false
    ;
    msg += 'kHz: ' + kHz + '\n';
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

  var skip = false;
  DCPU16.prototype.run = function () {
    this.running = true;
    var speed = 100000;
    var that = this;
    setTimeout(function next_step () {
      if (!that.running) return;
      var startTime = new Date().getTime();
      var startCycle = that.cycle;
      for (var i = 0; i < 1024; ++i) {
        that.step();
      }
      var cycles = (that.cycle - startCycle)
        , throttledTime = cycles / (speed / 1000)
        , realTime = new Date().getTime() - startTime
        , pause = Math.round(throttledTime - realTime)
        , kHz = realTime + ' : ' + cycles + ' : ' + cycles / (realTime + pause)
      ;
      that.showRAM(kHz);
      if (that.running) {
        //console.log('pause: ' + pause);
        setTimeout(next_step, pause);
      }
    }, 0);
  }
  DCPU16.prototype.start = function () {
    for (var i = 0; i < 13; ++i) {
      this.set_reg(i, 0);
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
  DCPU16.prototype.step = function () {
    var URAM = this.URAM;
    var UREG = this.UREG;
    var SRAM = this.SRAM;
    var SREG = this.SREG;
    var HW = this.HW;
    if (!this.running) {
      this.start();
    }
    var lastPC = UREG[PC]
    ;

    // check for interrupt
    if (this.intrpt_on && this.intrpt_queue.length > 0) {
      var msg = this.intrpt_queue.pop();
      if (UREG[IA] !== 0) {
        URAM[--UREG[SP]] = UREG[PC];
        URAM[--UREG[SP]] = UREG[A];
        UREG[PC] = UREG[IA];
        UREG[A] = msg;
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
      this.cycle++;
      // keep skipping until past first non-if instruction
      if (o < 0x10 || o > 0x17) {
        skip = false;
      }
    } else {
      //this.set_reg(PC);
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
            this.cycle++;
            //this.set_reg(PC);
            break;
          case 0x18: // PUSH / POP
            if (a) {
              addr = UREG[SP]++; // POP
            } else {
              UREG[SP]--
              addr = UREG[SP]; // PUSH
            }
            //this.set_reg(SP);              
            break;
          case 0x19:
            addr = UREG[SP];
            break;
          case 0x1a:
            addr = UREG[SP] + URAM[UREG[PC]++];
            this.cycle++;
            //this.set_reg(PC);
            break;
          case 0x1b: case 0x1c: case 0x1d:
            addr = SIZE + v - 0x13;
            break;
          case 0x1e:
            addr = URAM[UREG[PC]++];
            this.cycle++;
            //this.set_reg(PC);
            break;
          case 0x1f:
            addr = UREG[PC]++;
            this.cycle++;
            //this.set_reg(PC);
            break;
          default:
            UREG[LIT] = v - 0x21;
            addr = SIZE + LIT;
            //this.set_reg(LIT);
            break;
        }
        return addr;
      }
      // these will advance the PC if needed
      var a_addr, b_addr;
      a_addr = get_addr.call(this, a, true);
      if (o !== 0) {
        b_addr = get_addr.call(this, b, false);
      }
      // perform operation
      switch (o) {
        case 0x1: // SET b, a
          URAM[b_addr] = URAM[a_addr];
          this.cycle += 1;
          break;
        case 0x2: // ADD b, a
          UREG[EX] = (URAM[b_addr] += URAM[a_addr]) >= SIZE ? 0x0001 : 0x0000;
          this.cycle += 2;
          break;
        case 0x3: // SUB b, a
          UREG[EX] = (URAM[b_addr] -= URAM[a_addr]) < 0x0000 ? 0xffff : 0x0000;
          this.cycle += 2;
          break;
        case 0x4: // MUL b, a
          UREG[EX] = ((URAM[b_addr] *= URAM[a_addr]) >> 16) & 0xffff;
          this.cycle += 2;
          break;
        case 0x5: // MLI b, a
          UREG[EX] = ((SRAM[b_addr] *= SRAM[a_addr]) >> 16) & 0xffff;
          this.cycle += 2;
          break;
        case 0x6: // DIV b, a  signed division
          if (URAM[a_addr] === 0) {
            UREG[EX] = URAM[b_addr] = 0;
          } else {
            UREG[EX] = ((URAM[b_addr] << 16) / URAM[a_addr]) & 0xffff;
            URAM[b_addr] /= URAM[a_addr];
          }
          this.cycle += 3;            
          break;
        case 0x7: // DVI b, a  signed division
          if (SRAM[a_addr] === 0) {
            SREG[EX] = SRAM[b_addr] = 0;
          } else {
            SREG[EX] = ((SRAM[b_addr] << 16) / SRAM[a_addr]) & 0xffff;
            SRAM[b_addr] /= SRAM[a_addr];
          }
          this.cycle += 3;
          break;
        case 0x8: // MOD b, a
          if (URAM[a_addr] === 0) {
            URAM[b_addr] = 0
          } else {
            URAM[b_addr] %= URAM[a_addr];
          }
          this.cycle += 3;
          break;
        case 0x9: // MDI b, a
          if (SRAM[a_addr] === 0) {
            SRAM[b_addr] = 0
          } else {
            SRAM[b_addr] %= SRAM[a_addr];
          }
          this.cycle += 3;
          break;
        case 0xa: // AND b, a
          URAM[b_addr] &= URAM[a_addr];
          this.cycle += 1;
          break;
        case 0xb: // BOR b, a
          URAM[b_addr] |= URAM[a_addr];
          this.cycle += 1;
          break;
        case 0xc: // XOR b, a
          URAM[b_addr] ^= URAM[a_addr];
          this.cycle += 1;
          break;
        case 0xd: // SHR b, a
          UREG[EX] = ((URAM[b_addr] << 16) >> URAM[a_addr]) & 0xffff;
          URAM[b_addr] >>>= URAM[a_addr];
          this.cycle += 1;
          break;
        case 0xe: // ASR b, a
          SREG[EX] = ((SRAM[b_addr] << 16) >> SRAM[a_addr]) & 0xffff;
          SRAM[b_addr] >>= SRAM[a_addr];
          this.cycle += 1;
          break;
        case 0xf: // SHL b, a
          UREG[EX] = ((URAM[b_addr] <<= URAM[a_addr]) >> 16) & 0xffff;
          this.cycle += 1;
          break;
        case 0x10: // IFB b, a
          skip = !(URAM[b_addr] & URAM[a_addr] !== 0);
          this.cycle += 2
          break;
        case 0x11: // IFC b, a
          skip = !(URAM[b_addr] & URAM[a_addr] === 0);
          this.cycle += 2
          break;
        case 0x12: // IFE b, a
          skip = !(URAM[b_addr] === URAM[a_addr]);
          this.cycle += 2
          break;
        case 0x13: // IFN b, a
          skip = !(URAM[b_addr] !== URAM[a_addr]);
          this.cycle += 2
          break;
        case 0x14: // IFG b, a
          skip = !(URAM[b_addr] > URAM[a_addr]);
          this.cycle += 2
          break;
        case 0x15: // IFA b, a
          skip = !(SRAM[b_addr] > SRAM[a_addr]);
          this.cycle += 2
          break;
        case 0x16: // IFL b, a
          skip = !(URAM[b_addr] < URAM[a_addr]);
          this.cycle += 2
          break;
        case 0x17: // IFU b, a
          skip = !(SRAM[b_addr] < SRAM[a_addr]);
          this.cycle += 2
          break;
        case 0x1a: // ADX b, a
          UREG[EX] = (URAM[b_addr] += URAM[a_addr] + UREG[EX]) >= SIZE ? 0x0001 : 0x0000;
          this.cycle += 3;
          break;
        case 0x1b: // SBX b, a
          UREG[EX] = (URAM[b_addr] -= URAM[a_addr] - UREG[EX]) < 0 ? 0xffff : 0x0000;
          this.cycle += 3;
          break;
        case 0x1e: // STI b, a
          URAM[b_addr] = URAM[a_addr];
          UREG[I]++;
          UREG[J]++;
          this.cycle += 2;
          break;
        case 0x1f: // STD b, a
          URAM[b_addr] = URAM[a_addr];
          UREG[I]--;
          UREG[J]--;
          this.cycle += 2;
          break;
        case 0x0: // special instruction
          switch (b) {
            case 0x01: // JSR a
              UREG[SP]--;
              URAM[UREG[SP]] = UREG[PC];
              UREG[PC] = URAM[a_addr];
              this.cycle += 3;
              break;
            case 0x08: // INT
              this.intrpt(URAM[a_addr]);
              this.cycle += 4;
              break;
            case 0x09: // IAG
              URAM[a_addr] = UREG[IA];
              this.cycle += 1;
              break;
            case 0x0a: // IAS
              UREG[IA] = URAM[a_addr];
              this.cycle += 1;
              break;
            case 0x0b: // RFI
              this.intrpt_on = true;
              UREG[A] = URAM[UREG[SP]++];
              UREG[PC] = URAM[UREG[SP]++];
              this.cycle += 3;
              break;
            case 0x0c: // IAQ
              this.intrpt_on = URAM[a_addr] === 0;
              this.cycle += 2;
              break;
            case 0x10: // HWN
              URAM[a_addr] = HW.length;
              this.cycle += 2;
              break;
            case 0x11: // HWQ
              UREG[A] = HW[URAM[a_addr]].id & 0xffff;
              UREG[B] = HW[URAM[a_addr]].id >> 16;
              UREG[C] = HW[URAM[a_addr]].version;
              UREG[X] = HW[URAM[a_addr]].manufacturer & 0xffff;
              UREG[Y] = HW[URAM[a_addr]].manufacturer >> 16;
              this.cycle += 4;
              break;
            case 0x12: // HWI
              try {
                var hw_cycle = HW[URAM[a_addr]].intrpt(URAM, SRAM, UREG, SREG);
              } catch (e) {
                console.log(e);
              }
              if (typeof hw_cycle === 'number') {
                this.cycle += Math.floor(hw_cycle);
              }
              this.cycle += 4
              break;
          }
          break;
      }
      // update UI with register change
      // skipping ram UI update for now
      //if (b_addr >= SIZE) this.set_reg(b_addr - SIZE);
    };
    if (skip) {
      this.step();
    }
  };

}());

$(function () {
  var display = new LEM1802($('#console')[0], 2, 3, 60);
  var clock = new Clock();
  var keyboard = new Keyboard(document);
  var cpu = new DCPU16();
  cpu.attach_hw(clock);
  cpu.attach_hw(display);
  cpu.attach_hw(keyboard);
  cpu.attach_hw(new LM01($('#LM_status'), $('#LM_start'), $('#LM_reset')));
})
