
const dt = 1/60;

function zfill(value)
{
 const zplus = "0"+value;
 return zplus.slice(zplus.length-2);
}

function random_color()
{
 const r = zfill((~~(Math.random()*255)).toString(16));
 const g = zfill((~~(Math.random()*255)).toString(16));
 const b = zfill((~~(Math.random()*255)).toString(16));
 
 return "#" + r + g + b;
}

class Foo
{
 constructor(x, y)
 {
  this.x = x;
  this.y = y;
  this.vx = 0;
  this.vy = 0;
  this.ax = 0;
  this.ay = 0;
  this.color = random_color() + 'ff';
 }
 
 draw()
 {
  ctx.fillStyle = this.color;
  ctx.beginPath();
  ctx.arc(this.x, this.y, 5, 0, 7);
  ctx.fill();
  
  this.ax = (innerWidth/2 - this.x);
  this.ay = (innerHeight/2 - this.y);
  
  this.x += this.vx * dt;
  this.vx += this.ax * dt;
  this.y += this.vy * dt;
  this.vy += this.ay * dt;
  
  this.vx += -5+10*Math.random();
  this.vy += -5+10*Math.random();
  
  if (md)
  {
   this.x = mx;
   this.y = my;
   this.vx = 0;
   this.vy = 0;
   this.ax = 0;
   this.ay = 0;
  }
  
 }
}

let foos = [];

function init()
{
 for (let i=0; i<100; i++)
  foos.push(new Foo(innerWidth/2, innerHeight/2));
}

function update()
{
 ctx.clearRect(0, 0, innerWidth, innerHeight);
 for (let foo of foos)
 {
  foo.draw();
 }
}

/******************* BOILERPLATE *************************/

let canvas = document.createElement("canvas");
let ctx = canvas.getContext("2d");

let mx, my, md;
let _mx, _my, _md;

let k = {};
let _k = {};

let start = Date.now();

function time()
{
 // return duration in seconds since start of sketch
 
 return (Date.now() - start) / 1000;
}

document.body.appendChild(canvas);

function init_canvas()
{
 canvas.width = innerWidth * devicePixelRatio;
 canvas.height = innerHeight * devicePixelRatio;
 canvas.style.width = "100vw";
 canvas.style.height = "100vh";
 ctx.scale(devicePixelRatio, devicePixelRatio);
}

window.addEventListener("resize", init_canvas);
window.addEventListener("load", ()=>{
 init_canvas();
 init();
 animate();
});

function animate()
{
 update();
 _mx = mx;
 _my = my;
 _md = md;
 for (var key in k)
 {
  _k[key] = k[key];
 }
 requestAnimationFrame(animate);
}

document.body.addEventListener("keydown", (ev)=>{
 console.log(ev.keyCode);
 k[ev.keyCode] = 1;
});

document.body.addEventListener("keyup", (ev)=>{
 k[ev.keyCode] = 0;
});

document.body.addEventListener("mousemove", (ev)=>{
 mx = ev.clientX;
 my = ev.clientY;
})

document.body.addEventListener("mousedown", (ev)=>{
 md = true;
})

document.body.addEventListener("mouseup", (ev)=>{
 md = false;
})