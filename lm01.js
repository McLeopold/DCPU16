(function () {
  var A = 0, B = 1, C = 2
    , X = 3, Y = 4, Z = 5
    , I = 6, J = 7
    , SP = 8, PC = 9, EX = 10, IA = 11
  ;

  var DOCKED = 0
    , DECENT = 1
    , LANDED = 2
    , CRASHED = 3
    , STATUS = ['Docked', 'Decent', 'Landed', 'Crashed']
    , EASY = 0
    , NORMAL = 1
    , HARD = 2
  ;

  // no var so that LM01 is global
  LM01 = function (pre_status) {
    this.id = 0x4c4d3031;
    this.version = 0x1;
    this.manufacturer = 0x4e414e41;
    this.pre_status = pre_status;
    this.status = DOCKED;
    this.reset();
  };

  LM01.prototype.show_status = function () {
    var msg = '        status: ' + STATUS[this.status] + '\n';
    msg += '  milliseconds:' + (this.start_time ? (new Date().getTime() - this.start_time) : 0) + '\n\n';
    msg += '      altitude: ' + this.altitude.toFixed(2) + ' m\n';
    msg += '         speed: ' + this.speed.toFixed(2) + ' m/s\n';
    msg += '         pitch: ' + this.pitch + '?\n';
    msg += '          roll: ' + this.roll + '?\n\n';
    msg += '      DPS fuel: ' + this.DPS_fuel.toFixed(0) + 'kg\n';
    msg += '      DPS burn: ' + this.DPS_burn + '%\n\n';
    msg += '      RCS fuel: ' + this.RCS_fuel.toFixed(0) + 'kg\n';
    msg += 'RCS pitch burn: ' + this.RCS_pitch_burn + '\n';
    msg += ' PCS roll burn: ' + this.RCS_roll_burn + '\n';

    this.pre_status.text(msg);
  }

  var time_delta = 0.1;
  var G = 6.674e-11
    , moon_mass = 7.3477e22
    , moon_radius = 1.738e6
  ;
  LM01.prototype.start = function () {
    var that = this;
    this.status = DECENT;
    this.start_time = new Date().getTime();
    var lm_pos = this.lm_pos
      , lm_vel = this.lm_vel
      , lm_nor = this.lm_nor
    ;
    this.interval = setInterval(function () {

      var g_len = Math.sqrt(lm_pos[0] * lm_pos[0] + lm_pos[1] * lm_pos[1] + lm_pos[2] * lm_pos[2]);
      var g_nor = [-lm_pos[0] / g_len, -lm_pos[1] / g_len, -lm_pos[2] / g_len];
      var g = G * moon_mass / Math.pow(g_len, 2) * time_delta;
      var f_vec = [g_nor[0] * g, g_nor[1] * g, g_nor[2] * g];

      if (that.DPS_burn > 0 && that.DPS_fuel > 0) {
        var spent_fuel = that.DPS_burn_rate * time_delta * that.DPS_burn / 100.0;
        if (spent_fuel > that.DPS_fuel) {
          spent_fuel = that.DPS_fuel;
        }
        var weight = that.weight();
        var delta_v = that.DPS_specific_impulse * Math.log(weight / (weight - spent_fuel));
        var delta_v_vec = [lm_nor[0] * delta_v, lm_nor[1] * delta_v, lm_nor[2] * delta_v];
        that.DPS_fuel -= spent_fuel;
      } else {
        var delta_v_vec = [0,0,0];
      }

      f_vec[0] += delta_v_vec[0];
      f_vec[1] += delta_v_vec[1];
      f_vec[2] += delta_v_vec[2];

      lm_pos[0] += (lm_vel[0] + 0.5 * f_vec[0]) * time_delta;
      lm_pos[1] += (lm_vel[1] + 0.5 * f_vec[1]) * time_delta;
      lm_pos[2] += (lm_vel[2] + 0.5 * f_vec[2]) * time_delta;

      lm_vel[0] += f_vec[0];
      lm_vel[1] += f_vec[1];
      lm_vel[2] += f_vec[2];      

      g_len = Math.sqrt(lm_pos[0] * lm_pos[0] + lm_pos[1] * lm_pos[1] + lm_pos[2] * lm_pos[2]);
      that.altitude = g_len - moon_radius;
      that.speed = Math.sqrt(lm_vel[0] * lm_vel[0] + lm_vel[1] * lm_vel[1] + lm_vel[2] * lm_vel[2]);

      // surface probes shut off DPS engine
      if (that.altitude <= 1) {
        that.DPS_burn = 0;
      }

      if (that.altitude <= 0) {
        if (that.speed < 3.0) {
          that.status = LANDED;
        } else {
          that.status = CRASHED;
        }
        clearInterval(that.interval);
      }
      that.show_status();
    }, Math.floor(1000 * time_delta));
  }

  LM01.prototype.weight = function () {
    return this.DPS_fuel + this.DS_weight + this.APS_fuel + this.AS_weight + this.RCS_fuel;
  }

  LM01.prototype.reset = function () {
    this.DPS_fuel = 8200.0; // kg
    this.DPS_specific_impulse = 3050.0; // N*s/kg or m/s
    this.DPS_thrust = 45040.0; // N
    this.DPS_burn_rate = this.DPS_thrust / this.DPS_specific_impulse; // kg/s

    this.RCS_fuel = 287.0; // kg
    this.RCS_specific_impulse = 2840.0; // N*s/kg
    this.RCS_thrust = 440.0; // N
    this.RCS_max_burn_rate = this.RCS_thrust / this.RCS_specific_impulse; // kg/s

    this.APS_fuel = 2353.0; // kg
    this.APS_specific_impulse = 3050.0; // N
    this.APS_thrust = 16000.0; // N*s/kg
    this.APS_max_burn_rate = this.APS_thrust / this.APS_specific_impulse; // kg/s

    this.DS_weight = 2134.0; // kg
    this.AS_weight = 2347.0; // kg

    this.lm_pos = [0, moon_radius+8000, 0];
    this.lm_vel = [0,0,0];
    this.lm_nor = [0,1,0];
    this.altitude = 8000.0; // m
    this.speed = 0.0; // m/s
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
    this.status = DOCKED;
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
        UREG[C] = (this.status === DOCKED) ? 0x0001 : 0x0000;
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
        if (this.status === DOCKED) {
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

/*

Name: Lunar Module
ID: 0x4c4d3031
Version: 1

DPS - Decent Procedure Stage Engine
      * Can be throttled between 10% and 60% of full.
      * Has a max fuel burn rate of ~15kg per second.
RCS - Reaction Control System
      * Can perform pitch and roll maneuvers. (no yaw during training)
      * Engines are off or on full
      * Fuel burn rate of ~15g per second
ACS - Ascent Procedure State Engine
      * Current disabled for training exercises

Interrupts do different things depending on contents of the A register:

 A | BEHAVIOR
---+----------------------------------------------------------------------------
 0 | Set the C register to the status of the LM, 0x0001 for docked, 0x0000 for
   |   undocked.
 1 | Set the C register to the current amount of DPS fuel remaining in kg.
 2 | Set the C register to the current DPS burn rate.
   |   Will be 0, 10-60, or 100 (percent).
 3 | Set the C register to the current amount of RCS fuel remaining in kg.
 4 | Set the C register to the current RCS pitch burn rate.
   |   Will be 0 or 1 (full).
 5 | Set the C register to the current RCS roll burn rate.
   |   Will be 0 or 1 (full).
 8 | Set the C register to the current altitude in meters.
 9 | Set the C register to the current angle of pitch in degrees.
 a | Set the C register to the current angle of roll in degrees.
---+----------------------------------------------------------------------------
10 | Detach from the CM and start the decent procedure.
11 | Read the value of the B register and set the DPS burn rate.  The value will
   |   be interpreted as a percentage of full.  The value must be 0, 10-60 or 100.
12 | Read the value of the B register and set the RCS pitch engine on or off.
13 | Read the value of the B register and set the RCS roll engine on or off.
---+----------------------------------------------------------------------------

*/