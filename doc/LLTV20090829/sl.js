

function SL(){ this.init.apply(this, arguments); }
SL.prototype = { // {{{
  init: function(elm, width, height, fontSize, frameRate, speed){
    this.canvas = elm;
    this.width = width + 10;
    this.height = height;
    this.fontSize = fontSize || 20;
    this.frameRate = frameRate || 60;
    this.speed = speed || 20;
    this.interval = null;
    this.slWidth = null;
    this.slPositionY = 0;
    this.count = 0;
    this.rotateRadian = 0;
    this.ctx = this.canvas.getContext("2d");
    this.ctx.clearRect(0,0, this.width, this.height);
    elm.setAttribute("width", this.width);
    elm.setAttribute("height", this.height);
  },
  start: function(isLogo, isAccident, isFly){
    this.isFly = isFly || false;
    this.ctx.clearRect(0,0, this.width, this.height);
    this.ctx.font = this.fontSize + 'px monospace';
    if (isFly){
      let len = Math.sqrt(Math.pow(this.width, 2) + Math.pow(this.height, 2));
      this.rotateRadian = Math.acos(this.width / len);
      this.width = len;
    }
    this.slWidth = isLogo ? this.ctx.measureText(this.slData.logo[0] + this.slData.lcoal[0] + this.slData.lcar[0]).width :
                            this.ctx.measureText(this.slData.body[0] + this.slData.coal[0]).width;
    this.slPositionY = this.getSLPositionY();
    let sl = this.slGenerator(isLogo);
    let self = this;
    this.interval = window.setInterval(function(){
      self.draw(sl);
    }, this.frameRate);
  },
  stop: function(){
    window.clearInterval(this.interval);
  },
  getSLPositionY: function(){
    return (this.height - (this.slData.steam[0].length + this.slData.body.length + this.slData.wheel[0].length) * this.fontSize) / 2;
  },
  draw: function(gene){
    this.count++;
    this.ctx.clearRect(0,0, this.width, this.height);
    this.ctx.save();
    if (this.isFly){
      this.ctx.rotate(this.rotateRadian);
      this.ctx.translate(0, - this.height/2);
    }
    this.ctx.fillStyle = "rgb(255,255,255)";
    //this.ctx.fillStyle = "black";
    let data = gene.next();
    let x = this.width - this.count * this.speed,
        fontSize = this.fontSize,
        baseHeight = this.slPositionY;
    data.forEach(function(str, i){
      this.ctx.fillText(str, x, baseHeight + (i+1)*fontSize);
    }, this);
    this.ctx.restore();

    if (this.count * this.speed > this.width + this.slWidth){
			this.count = 0;
			window.clearInterval(this.interval);
			setup();
			this.start(doLogo, false, doFly);
    }
  },
  merge: function(){
    let data = [];
    Array.slice(arguments).forEach(function($_){
      $_.forEach(function(str, i){
        if (!data[i]) data[i] = [];
        data[i].push(str);
      });
    });
    return data.map(function($_) $_.join(""));
  },
  slGenerator: function(isLogo){
    let steam = this.createGenerator(this.slData.steam);
    if (isLogo){
      let sl = this.slData.logo;
      let wheel = this.createGenerator(this.slData.logoWheel);
      let coal = this.slData.lcoal;
      let car = this.slData.lcar;
      while(true){
        yield [].concat(steam.next(), this.merge(sl.concat(wheel.next()), coal, car, car));
      }
    } else {
      let sl = this.slData.body;
      let wheel = this.createGenerator(this.slData.wheel);
      let coal = this.slData.coal;
      while(true){
        yield [].concat(steam.next(), this.merge(sl.concat(wheel.next()), coal));
      }
    }
  },
  createGenerator: function(array){
    var i = 0, len = array.length;
    while(true){
      yield array[i];
      yield array[i];
      i++;
      if (i == len){
        i = 0;
      }
    }
  },
  slData: { /// {{{
    steam: [
      [
        "                    (@@) (  ) (@)  ( )  @@    ()    @     O     @     O      @",
        "               (   )",
        "           (@@@@)",
        "        (    )",
        "",
        "      (@@@)",
      ],[
        "                    (  ) (@@) ( )  (@)  ()    @@    O     @     O     @      O",
        "               (@@@)",
        "           (    )",
        "        (@@@@)",
        "",
        "      (   )"
      ]
    ],
    body: [
      "      ====        ________                ___________ ",
      "  _D _|  |_______/        \\__I_I_____===__|_________| ",
      "   |(_)---  |   H\\________/ |   |        =|___ ___|   ",
      "   /     |  |   H  |  |     |   |         ||_| |_||   ",
      "  |      |  |   H  |__--------------------| [___] |   ",
      "  | ________|___H__/__|_____/[][]~\\_______|       |   ",
      "  |/ |   |-----------I_____I [][] []  D   |=======|__ "
    ],
    wheel: [
      [
        "__/ =| o |=-~~\\  /~~\\  /~~\\  /~~\\ ____Y___________|__ ",
        " |/-=|___|=    ||    ||    ||    |_____/~\\___/        ",
        "  \\_/      \\O=====O=====O=====O_/      \\_/            "
      ],[
        "__/ =| o |=-~~\\  /~~\\  /~~\\  /~~\\ ____Y___________|__ ",
        " |/-=|___|=    ||    ||    ||    |_____/~\\___/        ",
        "  \\_/      \\_O=====O=====O=====O/      \\_/            "
      ],[
        "__/ =| o |=-~~\\  /~~\\  /~~\\  /~~\\ ____Y___________|__ ",
        " |/-=|___|=   O=====O=====O=====O|_____/~\\___/        ",
        "  \\_/      \\__/  \\__/  \\__/  \\__/      \\_/            "
      ],[
        "__/ =| o |=-~O=====O=====O=====O\\ ____Y___________|__ ",
        " |/-=|___|=    ||    ||    ||    |_____/~\\___/        ",
        "  \\_/      \\__/  \\__/  \\__/  \\__/      \\_/            "
      ],[
        "__/ =| o |=-O=====O=====O=====O \\ ____Y___________|__ ",
        " |/-=|___|=    ||    ||    ||    |_____/~\\___/        ",
        "  \\_/      \\__/  \\__/  \\__/  \\__/      \\_/            "
      ],[
        "__/ =| o |=-~~\\  /~~\\  /~~\\  /~~\\ ____Y___________|__ ",
        " |/-=|___|=O=====O=====O=====O   |_____/~\\___/        ",
        "  \\_/      \\__/  \\__/  \\__/  \\__/      \\_/            "
      ]
    ],
    coal: [
      "                              ",
      "                              ",
      "    _________________         ",
      "   _|                \\_____A  ",
      " =|                        |  ",
      " -|                        |  ",
      "__|________________________|_ ",
      "|__________________________|_ ",
      "   |_D__D__D_|  |_D__D__D_|   ",
      "    \\_/   \\_/    \\_/   \\_/    "
    ],
    logo: [
      "       ++      +------ ",
      "       ||      |+-+ |  ",
      "     /---------|| | |  ",
      "    + ========  +-+ |  "
    ],
    logoWheel: [
      [
        "   _|--/~O========O-+  ",
        "  //// \\_/      \\_/    "
      ],[
        "   _|--/O========O\\-+  ",
        "  //// \\_/      \\_/   "
      ],[
        "   _|--O========O~\\-+  ",
        "  //// \\_/      \\_/    "
      ],[
        "   _|--/~\\------/~\\-+  ",
        "  //// O========O_/    "
      ],[
        "   _|--/~\\------/~\\-+  ",
        "  //// \\O========O/    "
      ],[
        "   _|--/~\\------/~\\-+  ",
        "  //// \\_O========O    "
      ]
    ],
    lcoal: [
      "____                 ",
      "|   \\@@@@@@@@@@@     ",
      "|    \\@@@@@@@@@@@@@_ ",
      "|                  | ",
      "|__________________| ",
      "   (O)       (O)     "
    ],
    lcar: [
      "____________________",
      "|  ___ ___ ___ ___ | ",
      "|  |_| |_| |_| |_| | ",
      "|__________________| ",
      "|__________________| ",
      "   (O)        (O)    "
    ]
  }, /// }}}
};
// }}}

var sl, canvas;
var doFly = false;
var doLogo = false
function setup(){
	doFly = document.getElementById("SL_doFly").checked || false;
	doLogo = document.getElementById("SL_doLogo").checked || false;
}
function SL_start(){
setup();
canvas = document.getElementById("sl");
sl = new SL(canvas, document.width * 0.9, document.height / 2);
sl.start(doLogo, false, doFly);
}
function SL_stop(){
  if (sl){
    sl.stop();
  }
}

// vim: sw=2 ts=2 fdm=marker:
