(function () {
  var A = 0, B = 1, C = 2
    , X = 3, Y = 4, Z = 5
    , I = 6, J = 7
    , SP = 8, PC = 9, EX = 10, IA = 11
  ;

  // no var so that LM01 is global
  LM01 = function (pre_status, btn_start, btn_reset) {
    this.id = 0x4c4d3031;
    this.version = 0x1;
    this.manufacturer = 0x4e414e41;
    this.pre_status = pre_status;
    this.btn_start = btn_start;
    this.btn_reset = btn_reset;
    var that = this;
    this.btn_start.click(function () {
      that.start();
    });
    this.btn_reset.click(function () {
      that.reset();
    })
    this.reset();
  };

  var updates_per_second = 10;
  LM01.prototype.start = function () {
    var that = this;
    this.status = 'decent';
    this.interval = setInterval(function () {
      that.vertical_speed -= that.moon_gravity / updates_per_second;
      that.altitude += that.vertical_speed / updates_per_second;
      if (that.altitude < 0) {
        if (that.vertical_speed > -3.0) {
          that.status = 'landed';
        } else {
          that.status = 'crashed';
        }
        clearInterval(that.interval);
      }
      that.show_status();
    }, Math.floor(1000 / updates_per_second));
  }

  LM01.prototype.show_status = function () {
    var msg = '        status: ' + this.status + '\n';
    msg += '      altitude: ' + this.altitude.toFixed(2) + ' m\n';
    msg += 'vertical speed: ' + this.vertical_speed.toFixed(2) + ' m/s\n';
    msg += '         pitch: ' + this.pitch + '?\n';
    msg += '          roll: ' + this.roll + '?\n\n';
    msg += '      DPS fuel: ' + this.DPS_fuel + 'kg\n';
    msg += '      DPS burn: ' + this.DPS_burn + '%\n\n';
    msg += '      RCS fuel: ' + this.RCS_fuel + 'kg\n';
    msg += 'RCS pitch burn: ' + this.RCS_pitch_burn + '\n';
    msg += ' PCS roll burn: ' + this.RCS_roll_burn + '\n';

    this.pre_status.text(msg);
  }

  LM01.prototype.reset = function () {
    this.DPS_fuel = 8200.0; // kg
    this.DPS_force = 45040.0; // N
    this.DPS_max_burn_rate = 15.0; // kg/s

    this.RCS_fuel = 287.0; // kg
    this.RCS_force = 440.0; // N
    this.RCS_max_burn_rate = 1.0; // kg/s

    this.APS_fuel = 2353.0;
    this.APS_force = 16000.0;
    this.APS_max_burn_rate = 5.0; // kg/s

    this.DM_weight = 2134.0; // kg
    this.AM_weight = 2347.0; // kg

    this.altitude = 2400.0; // m
    this.vertical_speed = 0.0; // m/s
    this.start_time = new Date().getTime();

    this.roll = 0;
    this.pitch = 0;

    this.RCS_pitch_burn = 0;
    this.RCS_roll_burn = 0;
    this.DPS_burn = 0;       // 0%, 10%-60%, 100%

    this.moon_gravity = 1.624 // m/s^2;

    if (this.interval) {
      clearInterval(this.interval);
    }
    this.interval = null;
    this.status = 'docked';
    this.show_status();
  }

  LM01.prototype.connect = function (fn) {
    this.intrpt_fn = fn;
  }

  LM01.prototype.intrpt = function (URAM, SRAM, UREG, SREG) {
    if (this.status == 'crashed') return;
    var that = this;
    switch (UREG[A]) {
      case 0x00: // dock status
        UREG[C] = (this.status === 'docked') ? 0x0001 : 0x0000;
        break;
      case 0x01: // DPS fuel status
        UREG[C] = Math.floor(this.DPS_fuel);
        break;
      case 0x02: // DPS burn status
        UREG[C] = Math.floor(this.DPS_burn);
        break;
      case 0x03: // RCS_fuel status
        UREG[C] = Math.floor(this.RCS_fuel);
        break;
      case 0x04: // RCS_pitch_burn status
        UREG[C] = Math.floor(this.RCS_pitch_burn);
        break;
      case 0x05: // RCS_roll_burn status
        UREG[C] = Math.floor(this.RCS_roll_burn);
        break;
      case 0x08: // altitude
        UREG[C] = Math.floor(this.altitude);
        break;
      case 0x09: // roll
        UREG[C] = Math.floor(this.roll);  // unit TBD
        break;
      case 0x0a: // pitch
        UREG[C] = Math.floor(this.pitch); // unit TBD
        break;
      case 0x10: // detach
        if (this.status === 'docked') {
          this.start();
        }
        break;
      case 0x11: // RCS pitch burn
        var burn = SREG[B];
        if (burn >= -1 && burn <= 1) {
          this.RCS_pitch_burn
        }
        break;
      case 0x12: // RCS roll burn
        var burn = SREG[B];
        if (burn >= -1 && burn <= 1) {
          this.RCS_roll_burn
        }
        break;
      case 0x13: // DPS burn
        var burn = UREG[B] & 0x3f;
        if (burn === 0 || burn >= 10 && burn <= 60 || burn === 0x3f) {
          this.DPS_burn = burn === 0x3f ? 100 : burn;
        }
        break;
    }
  };

}());
