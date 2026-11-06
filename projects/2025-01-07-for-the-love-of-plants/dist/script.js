let clicks = []

const srand = [.43, .49, .06, 1, .53, .02, .53, .0, .5, 0, .5, 0]
let randi = 0;
function rand()
{
 const res = srand[randi++];
 randi = randi%srand.length;
 return res;
}
function r_drift()
{
 for (let i=0; i<srand.length; i++)
  srand[i] += (Math.random()-.5)/10.;
}

const rrand = []
for (var i=0; i<1000; i++) rrand.push(Math.random())

function leaf()
{
 
 const s = 20;
 ctx.beginPath();
 for (var i=0; i<=100; i++)
   ctx.lineTo(s*Math.cos(i/100 * Math.PI*2), i/100 * (1-i/100) * s*Math.sin(i/100 * Math.PI*2));
 ctx.stroke();
}

function branch()
{
 ctx.beginPath();
 ctx.rotate((rand()-.5)/10)
 ctx.lineTo(0, 0);
 ctx.lineTo(0, 160);
 ctx.stroke();
 for (let i=0; i<20; i++)
 {
  ctx.save();
  let h = 20 + 7*i;
  ctx.translate(0, h);
  ctx.rotate([0, .5][i%2] * Math.PI*2 + rand()/10);
  ctx.translate(-20, 0);
  leaf();
  ctx.restore();
 }
}

function init()
{
}

function update()
{
 ctx.clearRect(0, 0, innerWidth, innerHeight);
 
 // reset randomness per frame
 randi = 0;
 r_drift();
 
 let j=0;
 for (var c of clicks)
 {
  for (var i=0; i<4; i++)
  {
   ctx.save();
   ctx.translate(c[0], c[1]);
   ctx.rotate(2*Math.PI * rrand[j]);
   ctx.strokeStyle = "black";
   ctx.strokeWeight = 1;
   branch();
   ctx.restore();
   j++;
  }
 }
 
 if (md && !_md)
 {
  clicks.push([mx, my]);
 }
 
 if (k[32] && !_k[32]) clicks = [];
 
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