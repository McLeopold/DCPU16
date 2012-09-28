(function () {
  var A = 0, B = 1, C = 2
    , X = 3, Y = 4, Z = 5
    , I = 6, J = 7
    , SP = 8, PC = 9, EX = 10, IA = 11
  ;

  var FULL_STROKE = 200 // ms
    , XFER_SPEED = 48   // words / ms
  ;

  // no var so that HMD is global
  HMD = function () {
    this.id = 0x74fa4cae;
    this.version = 0x07c2;
    this.manufacturer = 0x21544948;
    this.reset();
  };

  HMD.description = "HMD";
  HMD.specification = 'HTM.txt';

  HMD.prototype.reset = function () {
    this.disk_label = null;
    this.disk = null;
    this.blocking = true;
    this.use_intrpt = false;
    this.intrpt_msg = 0xffff;
    this.last_intrpt = 0;
    this.head_pos = 0;
    this.show_status();
    if (this.ui) {
      this.ui.find('.message').text('...');
    }
  }

  // Disks are independant of individual drives
  HMD.disks = JSON.parse(localStorage.getItem('HMD') || '{}');
  HMD.devices = [];
  HMD.disk_add = function (label) {
    // add authentic HIT media
    HMD.disks[label] = {hit: true,
                        tracks: 80,
                        sectors: 1440,
                        sector_size: 512,
                        locked: false,
                        words: []};
    localStorage.setItem('HMD', JSON.stringify(HMD.disks));
    for (var i = 0, ilen = HMD.devices.length; i < ilen; ++i) {
      var hmd = HMD.devices[i]
        , disks = hmd.ui.find('select')
      ;
      if (hmd.disk === null) {
        disks.append('<option value="' + label + '" selected>' + label + '</option>');
      } else {
        disks.append('<option value="' + label + '">' + label + '</option>');
      }
      hmd.ui.find('.message').text('A disk with label "' + label + '" has been created.');
    }
  }
  HMD.disk_delete = function (label) {
    delete HMD.disks[label];
    localStorage.setItem('HMD', JSON.stringify(HMD.disks));
    for (var i = 0, ilen = HMD.devices.length; i < ilen; ++i) {
      var hmd = HMD.devices[i]
        , disks = hmd.ui.find('select')
      ;
      disks.find('option[value="' + label + '"]').remove();
      hmd.ui.find('.message').text('A disk with label "' + label + '" has been shredded.');
    }
  }

  HMD.prototype.create_ui = function () {
    // add to master list of devices so list of disks stays in sync
    HMD.devices.push(this);
    // refresh ui once after DOM is updated
    var that = this;
    setTimeout(function () {
      that.show_status();
    },0);

    this.ui = $('<div>' + 
                '<table><tr><td>' +
                '<input id="HMD_create" type="button" value="New Disk" />' +
                '</td><td>' +
                '<input id="HMD_disk_label" type="text" value="" />' +
                '</td></tr><tr><td colspan="2">' +
                '<div class="message">...</div>' +
                '</td></tr><tr><td>' +
                '<input id="HMD_load" type="button" value="Load" />' +
                '<br />' +
                '<input id="HMD_eject" type="button" value="Eject" />' +
                '<br />' +
                '<br />' +
                '<br />' +
                '<input id="HMD_shred" type="button" value="Shred" />' +
                '</td><td>' +
                '<select size="7"></select>' +
                '</td></tr></table>' +
                '<pre></pre>' +
                '</div>');
    var disk_label = this.ui.find('#HMD_disk_label');
    var disks = this.ui.find('select');
    // load disks labels
    for (var label in HMD.disks) {
      disks.append('<option value="' + label + '">' + label + '</option>');
    }
    var message = this.ui.find('.message');
    this.ui.find('#HMD_create').click(function () {
      message.text('...');
      var label = disk_label.val(); // should sanitize input
      if (label === '') {
        message.text('Enter a label for the new disk!');
      } else if (label in HMD.disks) {
        message.text('A disk with that label already exists!  Enter a different label!');
      } else {
        HMD.disk_add(label);
      }
    })
    this.ui.find('#HMD_load').click(function () {
      message.text('...');
      if (that.disk_label !== null) {
        message.text('A disk is already in the drive!  Eject it first!');
      } else {
        var label = disks.find(':selected').text();
        if (label === '') {
          message.text('A disk has not been selected!  Select one first!');
        } else {
          that.disk_label = label;
          that.disk = HMD.disks[label];
          message.text('Disk "' + label + '" loaded.');
          that.last_intrpt = 1;
          that.intrpt_fn(that.intrpt_msg);
          that.head_pos = 0;
        }
      }
      that.show_status();
    });
    this.ui.find('#HMD_eject').click(function () {
      message.text('...');
      if (that.disk_label === null) {
        message.text('A disk is not in the drive!  Load one first!');
      } else {
        message.text('Disk "' + that.disk_label + '" ejected.');
        that.disk_label = null;
        that.disk = null;
        that.last_intrpt = 1;
        that.intrpt_fn(that.intrpt_msg);
      }
      that.show_status();
    });
    this.ui.find('#HMD_shred').click(function () {
      message.text('...');
      if (that.disk_label === null) {
        message.text('A disk is not in the drive!  Load one first!');
      } else {
        var label = disks.find(':selected').text();
        if (label === '') {
          message.text('A disk has not been selected!  Select one first!');
        } else {
          HMD.disk_delete(label);
          that.disk_label = null;
          that.disk = null;
          message.text('Disk "' + label + '" shredded.');
          that.last_intrpt = 1;
          that.intrpt_fn(that.intrpt_msg);
        }
      }
      that.show_status();
    });
    return this.ui;
  }

  HMD.prototype.connect = function (fn) {
    this.intrpt_fn = fn;
  }

  HMD.prototype.show_status = function () {
    if (this.ui) {
      this.ui.find('pre').text(
        'Disk in Drive: ' + this.disk_label + '\n'
      );
    }
  }

  HMD.prototype.intrpt = function (URAM, SRAM, UREG, SREG) {
    switch (UREG[A]) {
      case 0x0: // QUERY_MEDIA_PRESENT
        UREG[B] = this.disk_label === null ? 0 : 1;
        break;
      case 0x1: // QUERY_MEDIA_PARAMETERS
        if (this.disk) {
          UREG[B] = this.disk.sector_size
          UREG[C] = this.disk.sectors
          UREG[X] = this.disk.locked ? 1 : 0
        }
        break;
      case 0x2: // QUERY_DEVICE_FLAGS
        UREB[B] = (this.blocking   ? 0 : 1) +
                  (this.use_intrpt ? 0 : 2)
        break;
      case 0x3: // UPDATE_DEVICE_FLAGS
        this.blocking = !(UREG[B] && 1);
        this.use_intrpt = !!(UREG[B] && 2);
        break;
      case 0x4: // QUERY_INTERRUPT_TYPE
        UREG[B] = this.last_intrpt;
        break;
      case 0x5: // SET_INTERRUPT_MESSAGE
        this.intrpt_msg = UREG[B]
        break;
      case 0x10: // READ_SECTORS
      case 0x11: // WRITE_SECTORS
        if (this.disk) {
          if (UREG[A] === 0x11 && this.disk.locked) {
            // attempt to write to locked disk
            break;
          }
          var disk_idx = UREG[B] * this.disk.sector_size
            , len = UREG[C] * this.disk.sector_size
            , mem_idx = UREG[X]
            , seek_time = UREG[B]
          ;
          if (disk_idx + len > this.disk.sectors * this.disk.sector_size) {
            // attempted to read past end of disk
            break;
          }
          if (UREG[A] === 0x10) { // READ
            for (var i = 0; i < len; ++i) {
              URAM[mem_idx + i] = this.disk.words[disk_idx + i];
            }
            if (this.use_intrpt) {
              this.last_intrpt = 2;
              this.intrpt_fn(this.intrpt_msg);
            }
          } else { // WRITE
            for (var i = 0; i < len; ++i) {
              this.disk.words[disk_idx + i] = URAM[mem_idx + i];
            }
            if (this.use_intrpt) {
              this.last_intrpt = 3;
              this.intrpt_fn(this.intrpt_msg);
            }
            localStorage.setItem('HMD', JSON.stringify(HMD.disks));
          }
        }
        break;
      case 0xffff: // QUERY_MEDIA_QUALITY
        UREG[B] = (this.disk.hit ? 0x7fff : 0xffff)
        break;
    }
  };

}());
