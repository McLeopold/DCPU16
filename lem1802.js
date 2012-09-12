(function () {
  var A = 0, B = 1, C = 2
    , X = 3, Y = 4, Z = 5
    , I = 6, J = 7
    , SP = 8, PC = 9, EX = 10, IA = 11
  ;

  var default_palette = [
    0x000, 0x00a, 0x0a0, 0x0aa, // black , dkblue   , dkgreen, dkcyan
    0xa00, 0xa0a, 0xa50, 0xaaa, // dkred , dkmagenta, brown  , dkgrey
    0x555, 0x55f, 0x5f5, 0x5ff, // dkgrey, ltblue   , ltgreen, ltcyan
    0xf55, 0xf5f, 0xff5, 0xfff  // ltred , ltmagenta, yellow , white
  ];

  var solarized_palette = [
    0x0033, 0x0034, 0x0567, 0x0678, // base03, base02, base01, base00
    0x0899, 0x0999, 0x0EED, 0x0FED, // base0 , base1 , base2 , base3
    0x0B80, 0x0C41, 0x0D33, 0x0C38, // yellow, orage , red   , magenta
    0x067C, 0x028C, 0x0299, 0x0890  // violet, blue  , cyan  , green
  ];

  var default_font = [0xb79e, 0x388e, 0x722c, 0x75f4, 0x19bb, 0x7f8f, 0x85f9, 0xb158,
                      0x242e, 0x2400, 0x082a, 0x0800, 0x0008, 0x0000, 0x0808, 0x0808,
                      0x00ff, 0x0000, 0x00f8, 0x0808, 0x08f8, 0x0000, 0x080f, 0x0000,
                      0x000f, 0x0808, 0x00ff, 0x0808, 0x08f8, 0x0808, 0x08ff, 0x0000,
                      0x080f, 0x0808, 0x08ff, 0x0808, 0x6633, 0x99cc, 0x9933, 0x66cc,
                      0xfef8, 0xe080, 0x7f1f, 0x0701, 0x0107, 0x1f7f, 0x80e0, 0xf8fe,
                      0x5500, 0xaa00, 0x55aa, 0x55aa, 0xffaa, 0xff55, 0x0f0f, 0x0f0f,
                      0xf0f0, 0xf0f0, 0x0000, 0xffff, 0xffff, 0x0000, 0xffff, 0xffff,
                      0x0000, 0x0000, 0x005f, 0x0000, 0x0300, 0x0300, 0x3e14, 0x3e00, // !"#
                      0x266b, 0x3200, 0x611c, 0x4300, 0x3629, 0x7650, 0x0002, 0x0100, //$%&'
                      0x1c22, 0x4100, 0x4122, 0x1c00, 0x1408, 0x1400, 0x081c, 0x0800, //()*+
                      0x4020, 0x0000, 0x0808, 0x0800, 0x0040, 0x0000, 0x601c, 0x0300, //,-./
                      0x3e49, 0x3e00, 0x427f, 0x4000, 0x6259, 0x4600, 0x2249, 0x3600, //0123
                      0x0f08, 0x7f00, 0x2745, 0x3900, 0x3e49, 0x3200, 0x6119, 0x0700, //4567
                      0x3649, 0x3600, 0x2649, 0x3e00, 0x0024, 0x0000, 0x4024, 0x0000, //89:;
                      0x0814, 0x2200, 0x1414, 0x1400, 0x2214, 0x0800, 0x0259, 0x0600, //<=>?
                      0x3e59, 0x5e00, 0x7e09, 0x7e00, 0x7f49, 0x3600, 0x3e41, 0x2200, //@ABC
                      0x7f41, 0x3e00, 0x7f49, 0x4100, 0x7f09, 0x0100, 0x3e41, 0x7a00, //DEFG
                      0x7f08, 0x7f00, 0x417f, 0x4100, 0x2040, 0x3f00, 0x7f08, 0x7700, //HIJK
                      0x7f40, 0x4000, 0x7f06, 0x7f00, 0x7f01, 0x7e00, 0x3e41, 0x3e00, //LMNO
                      0x7f09, 0x0600, 0x3e61, 0x7e00, 0x7f09, 0x7600, 0x2649, 0x3200, //PQRS
                      0x017f, 0x0100, 0x3f40, 0x7f00, 0x1f60, 0x1f00, 0x7f30, 0x7f00, //TUVW
                      0x7708, 0x7700, 0x0778, 0x0700, 0x7149, 0x4700, 0x007f, 0x4100, //XYZ[
                      0x031c, 0x6000, 0x417f, 0x0000, 0x0201, 0x0200, 0x8080, 0x8000, //\]^_
                      0x0001, 0x0200, 0x2454, 0x7800, 0x7f44, 0x3800, 0x3844, 0x2800, //`abc
                      0x3844, 0x7f00, 0x3854, 0x5800, 0x087e, 0x0900, 0x4854, 0x3c00, //defg
                      0x7f04, 0x7800, 0x047d, 0x0000, 0x2040, 0x3d00, 0x7f10, 0x6c00, //hijk
                      0x017f, 0x0000, 0x7c18, 0x7c00, 0x7c04, 0x7800, 0x3844, 0x3800, //lmno
                      0x7c14, 0x0800, 0x0814, 0x7c00, 0x7c04, 0x0800, 0x4854, 0x2400, //pqrs
                      0x043e, 0x4400, 0x3c40, 0x7c00, 0x1c60, 0x1c00, 0x7c30, 0x7c00, //tuvw
                      0x6c10, 0x6c00, 0x4c50, 0x3c00, 0x6454, 0x4c00, 0x0836, 0x4100, //xyz{
                      0x0077, 0x0000, 0x4136, 0x0800, 0x0201, 0x0201, 0x0205, 0x0200] //|}~

  var pico_font =    [0xb79e, 0x388e, 0x722c, 0x75f4, 0x19bb, 0x7f8f, 0x85f9, 0xb158,
                      0x242e, 0x2400, 0x082a, 0x0800, 0x0008, 0x0000, 0x0808, 0x0808,
                      0x00ff, 0x0000, 0x00f8, 0x0808, 0x08f8, 0x0000, 0x080f, 0x0000,
                      0x000f, 0x0808, 0x00ff, 0x0808, 0x08f8, 0x0808, 0x08ff, 0x0000,
                      0x080f, 0x0808, 0x08ff, 0x0808, 0x6633, 0x99cc, 0x9933, 0x66cc,
                      0xfef8, 0xe080, 0x7f1f, 0x0701, 0x0107, 0x1f7f, 0x80e0, 0xf8fe,
                      0x5500, 0xaa00, 0x55aa, 0x55aa, 0xffaa, 0xff55, 0x0f0f, 0x0f0f,
                      0xf0f0, 0xf0f0, 0x0000, 0xffff, 0xffff, 0x0000, 0xffff, 0xffff,
                      0x0000, 0x0000, 0x0017, 0x0000, 0x0300, 0x0300, 0x1f0a, 0x1f00,
                      0x1f15, 0x0800, 0x1904, 0x1300, 0x0a15, 0x1a08, 0x0002, 0x0100,
                      0x000e, 0x1100, 0x0011, 0x0e00, 0x0a04, 0x0a00, 0x040e, 0x0400,
                      0x1008, 0x0000, 0x0404, 0x0400, 0x0010, 0x0000, 0x100c, 0x0300,
                      0x0e15, 0x0e00, 0x121f, 0x1000, 0x1915, 0x1200, 0x1115, 0x0a00,
                      0x0704, 0x1f00, 0x1715, 0x0d00, 0x0e15, 0x0900, 0x011d, 0x0300,
                      0x0a15, 0x0a00, 0x1215, 0x0e00, 0x000a, 0x0000, 0x100a, 0x0000,
                      0x040a, 0x1100, 0x0a0a, 0x0a00, 0x110a, 0x0400, 0x0115, 0x0200,
                      0x0000, 0x0000, 0x1e05, 0x1e00, 0x1f15, 0x0a00, 0x0e11, 0x0a00,
                      0x1f11, 0x0e00, 0x0e15, 0x1100, 0x1e05, 0x0100, 0x0e11, 0x1900,
                      0x1f04, 0x1f00, 0x001f, 0x0000, 0x0810, 0x0f00, 0x1f04, 0x1b00,
                      0x1f10, 0x1000, 0x1f02, 0x1f00, 0x1e01, 0x1e00, 0x0e11, 0x0e00,
                      0x1f05, 0x0200, 0x0e19, 0x1e00, 0x1f05, 0x1a00, 0x1615, 0x0900,
                      0x011f, 0x0100, 0x1f10, 0x1f00, 0x0f10, 0x0f00, 0x1f08, 0x1f00,
                      0x1b04, 0x1b00, 0x031c, 0x0300, 0x1915, 0x1300, 0x001f, 0x1100,
                      0x030c, 0x1000, 0x111f, 0x0000, 0x0201, 0x0200, 0x1010, 0x1000,
                      0x0001, 0x0200, 0x1e05, 0x1e00, 0x1f15, 0x0a00, 0x0e11, 0x0a00,
                      0x1f11, 0x0e00, 0x0e15, 0x1100, 0x1e05, 0x0100, 0x0e11, 0x1900,
                      0x1f04, 0x1f00, 0x001f, 0x0000, 0x0810, 0x0f00, 0x1f04, 0x1b00,
                      0x1f10, 0x1000, 0x1f02, 0x1f00, 0x1e01, 0x1e00, 0x0e11, 0x0e00,
                      0x1f05, 0x0200, 0x0e19, 0x1e00, 0x1f05, 0x1a00, 0x1615, 0x0900,
                      0x011f, 0x0100, 0x1f10, 0x1f00, 0x0f10, 0x0f00, 0x1f08, 0x1f00,
                      0x1b04, 0x1b00, 0x031c, 0x0300, 0x1915, 0x1300, 0x041b, 0x1100,
                      0x001b, 0x0000, 0x111b, 0x0400, 0x0201, 0x0201, 0x0205, 0x0200];

  // no var so that LEM1802 is global
  LEM1802 = function () {
    this.id = 0x7349f615;
    this.version = 0x1802;
    this.manufacturer = 0x1c6c8b36;
    this.palette32 = Array(16);
  };

  LEM1802.description = 'LEM1802';
  LEM1802.specification = 'lem1802.txt';

  LEM1802.prototype.create_ui = function () {
    this.ui = $('<div><input type="button" value="+" /><input type="button" value="-" />' +
                '<input type="button" value="<|>" /><input type="button" value=">|<" />' +
                '<input type="number" value="60" min="1" max="240" />' +
                '<br><canvas width="128" height="96"></canvas></div>');
    this.el = this.ui.find('canvas')[0];

    this.el.width = 128;
    this.el.height = 96;
    this.width = 3;
    this.scale = 2;
    this.Hz = 60;
    this.refresh_id = 0;
    this.canvas = this.el.getContext('2d');
    this.el.style.borderStyle = 'solid';
    this.reset();
    this.blink_rate = 1000;
    this.blink = true;
    this.blink_timer = null;
    this.start_refresh();

    var that = this;
    var btns = this.ui.find('input');
    $(btns[0]).click(function () {
      that.scale++;
      that.set_scale();
    });
    $(btns[1]).click(function () {
      if (that.scale > 1) {
        that.scale--;
        that.set_scale();
      }
    });
    $(btns[2]).click(function () {
      that.width++;
      that.set_scale();
    });
    $(btns[3]).click(function () {
      if (that.width > 0) {
        that.width--;
        that.set_scale();
      }
    });
    $(btns[4]).change(function () {
      that.Hz = parseInt($(btns[4]).val());
      that.refresh_rate = Math.floor(1000 / that.Hz);
    });
    this.set_scale();
    return this.ui;
  }

  LEM1802.prototype.reset = function () {
    this.border = 0;
    this.palette = default_palette.slice(0);
    this.el.style.borderColor = this.css_color(this.border);
    this.canvas.fillStyle = this.css_color(this.border);
    this.canvas.fillRect(0, 0, this.el.width, this.el.height);
    this.set_palette32();
    this.font = default_font.slice(0);
    this.screen = null;
  }

  LEM1802.prototype.start_refresh = function () {
    var that = this;
    that.refresh_id++;
    var id = that.refresh_id;
    that.refresh_rate = Math.floor(1000 / this.Hz);
    that.refresh_fn = function () {
      that.refresh();
      if (id === that.refresh_id && that.refresh_rate) {
        setTimeout(that.refresh_fn, that.refresh_rate);
      }
    }
    setTimeout(that.refresh_fn, that.refresh_rate);
    that.blink_timer = setInterval(function () {
      that.blink = !that.blink;
    }, that.blink_rate);
  }

  LEM1802.prototype.stop_refresh = function () {
    this.refresh_rate = null;
    if (this.blink_timer) {
      clearInterval(this.blink_timer);
      this.blink_timer = null;
    }
  }

  LEM1802.prototype.css_color = function (c) {
    return '#' +
           ((this.palette[c] & 0xf00) >> 8).toString(16) + 
           ((this.palette[c] & 0xf0) >> 4).toString(16) + 
           (this.palette[c] & 0xf).toString(16);           
  }

  LEM1802.prototype.set_scale = function () {
    this.el.style.height = Math.floor(this.el.height * this.scale) + 'px';
    this.el.style.width = Math.floor(this.el.width * this.scale) + 'px';
    this.el.style.borderWidth = Math.floor(this.width * this.scale) + 'px';
    this.el.style.borderRadius = Math.floor(this.width * this.scale) + 'px';
  }

  LEM1802.prototype.set_palette32 = function () {
    for (var i = 0; i < 16; ++i) {
      this.palette32[i] =
        0xff000000 +                       // alpha
        ((this.palette[i] & 0xf) << 20) +  // blue
        ((this.palette[i] & 0xf) << 16) +  // blue
        ((this.palette[i] & 0xf0) << 8) +  // green
        ((this.palette[i] & 0xf0) << 4) +  // green
        ((this.palette[i] & 0xf00) >> 4) + // red
        ((this.palette[i] & 0xf00) >> 8);  // red
    }
  }

  LEM1802.prototype.connect = function (fn) {
    this.intrpt_fn = fn;
  }

  LEM1802.prototype.intrpt = function (URAM, SRAM, UREG, SREG) {
    switch (UREG[A]) {
      case 0: // mem_map_screen
        if (UREG[B] === 0) {
          this.screen = null;
        } else {
          this.screen = new Uint16Array(URAM.buffer, UREG[B] * 2, 386);
        }
        break;
      case 1: // mem_map_font
        if (UREG[B] === 0) {
          this.font = default_font.slice(0);
        } else {
          this.font = new Uint16Array(URAM.buffer, UREG[B] * 2, 256);
        }
        break;
      case 2: // mem_map_palette
        if (UREG[B] === 0) {
          this.palette = default_palette.slice(0);
        } else {
          this.palette = new Uint16Array(URAM.buffer, UREG[B] * 2, 256);
        }
        this.set_palette32();
        break;
      case 3: // set_border_color
        this.border = UREG[B] & 0xf;
        this.el.style.borderColor = this.css_color(this.border);
        break;
      case 4: // mem_dump_font
        var loc = UREG[B];
        for (var i = 0; i < 256; ++i) {
          URAM[i+loc] = this.font[i];
        }
        return 256;
        break;
      case 5: // mem_dump_palette
        var loc = UREG[B];
        for (var i = 0; i < 16; ++i) {
          URAM[i+loc] = this.palette[i];
        }
        return 16;
        break;
    }
  }

  LEM1802.prototype.refresh = function () {
    if (this.screen) {
      var image_data = this.canvas.getImageData(0, 0, 128, 96);
      var buf = new ArrayBuffer(image_data.data.length);
      var buf8 = new Uint8ClampedArray(buf);
      var data = new Uint32Array(buf);
      //var chridx = 0;
      var palette32 = this.palette32;
      var font = this.font;
      var idx = 0;
      var blink_off = !this.blink;
      for (var chridx = 0; chridx < 386; ++chridx) {
        var chrdata = this.screen[chridx]
          , fore = palette32[chrdata >> 12]
          , back = palette32[chrdata >> 8 & 0xf]
          , blink = !!(chrdata & 0x80)
          , chr = chrdata & 0x7f
        ;
        if (blink && blink_off) {
          chr = 0xff;
        }
        var font0 = font[chr * 2]
          , font1 = font[chr * 2 + 1]
          , bit0 = 0x0100
          , bit1 = 0x0001
        ;
        for (var i = 0; i < 8; ++i) {
          data[idx++] = (font0 & bit0) ? fore : back;
          data[idx++] = (font0 & bit1) ? fore : back;
          data[idx++] = (font1 & bit0) ? fore : back;
          data[idx++] = (font1 & bit1) ? fore : back;
          idx += 124;
          bit0 <<= 1;
          bit1 <<= 1;
        }
        if ((chridx & 0x1f) !== 0x1f) {
          idx -= 128 * 8 - 4;
        } else {
          idx -= 124;
        }
      }
      image_data.data.set(buf8);
      this.canvas.putImageData(image_data, 0, 0);
    }
  };

}());

/*

NE_LEM1802 v1.0
    
                                     \ |  ___ 
                                   |\ \|  ___  
                                   | \

                                 NYA ELEKTRISKA
                             innovation information




DCPU-16 Hardware Info:
    Name: LEM1802 - Low Energy Monitor
    ID: 0x7349f615, version: 0x1802
    Manufacturer: 0x1c6c8b36 (NYA_ELEKTRISKA)


Description:
    The LEM1802 is a 128x96 pixel color display compatible with the DCPU-16.
    The display is made up of 32x12 16 bit cells. Each cell displays one
    monochrome 4x8 pixel character out of 128 available. Each cell has its own
    foreground and background color out of a palette of 16 colors.
    
    The LEM1802 is fully backwards compatible with LEM1801 (0x7349f615/0x1801),
    and adds support for custom palettes and fixes the double buffer color
    bleed bug. 
    

Interrupt behavior:
    When a HWI is received by the LEM1802, it reads the A register and does one
    of the following actions:
    
    0: MEM_MAP_SCREEN
       Reads the B register, and maps the video ram to DCPU-16 ram starting
       at address B. See below for a description of video ram.
       If B is 0, the screen is disconnected.
       When the screen goes from 0 to any other value, the the LEM1802 takes
       about one second to start up. Other interrupts sent during this time
       are still processed.
    1: MEM_MAP_FONT
       Reads the B register, and maps the font ram to DCPU-16 ram starting
       at address B. See below for a description of font ram.
       If B is 0, the default font is used instead.
    2: MEM_MAP_PALETTE
       Reads the B register, and maps the palette ram to DCPU-16 ram starting
       at address B. See below for a description of palette ram.
       If B is 0, the default palette is used instead.
    3: SET_BORDER_COLOR
       Reads the B register, and sets the border color to palette index B&0xF
    4: MEM_DUMP_FONT
       Reads the B register, and writes the default font data to DCPU-16 ram
       starting at address B.
       Halts the DCPU-16 for 256 cycles
    5: MEM_DUMP_PALETTE
       Reads the B register, and writes the default palette data to DCPU-16
       ram starting at address B.       
       Halts the DCPU-16 for 16 cycles


Video ram:
    The LEM1802 has no internal video ram, but rather relies on being assigned
    an area of the DCPU-16 ram. The size of this area is 386 words, and is
    made up of 32x12 cells of the following bit format (in LSB-0):
        ffffbbbbBccccccc
    The lowest 7 bits (ccccccc) select define character to display.
    ffff and bbbb select which foreground and background color to use.
    If B (bit 7) is set the character color will blink slowly.
    

Font ram:
    The LEM1802 has a default built in font. If the user chooses, they may
    supply their own font by mapping a 256 word memory region with two words
    per character in the 128 character font.
    By setting bits in these words, different characters and graphics can be
    achieved. For example, the character F looks like this:
       word0 = 1111111100001001
       word1 = 0000100100000000
    Or, split into octets:
       word0 = 11111111 /
               00001001
       word1 = 00001001 /
               00000000
    

Palette ram:
   The LEM1802 has a default built in palette. If the user chooses, they may
   supply their own palette by mapping a 16 word memory region with one word
   per palette entry in the 16 color palette.
   Each color entry has the following bit format (in LSB-0):
       0000rrrrggggbbbb
   Where r, g, b are the red, green and blue channels. A higher value means a
   lighter color.
   

A message from Ola:
   Hello!
   
   It is fun to see that so many people use our products. When I was a small
   boy, my dad used to tell me "Ola, take care of those who understand less
   than you. Lack of knowledge is dangerous, but too much is worse". 
   Here at Nya Elektriska have we always tried to improve mankind by showing
   them the tools required to improve and reach their true potential.
   Together, you will wake up in time.
   
   - Ola Kristian Carlsson

*/