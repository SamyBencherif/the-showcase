
let vx, vy, px, py

function init()
{
 vx = 0
 vy = 0
 px = 0
 py = 0
}

function update()
{
 ctx.clearRect(0, 0, innerWidth, innerHeight);
 
 for (let x=-2; x<innerWidth/30+2; x++)
 {
  for (let y=-2; y<innerHeight/30+2; y++)
  {
   ctx.fillStyle = y % 2 ? "#db8340" : "#f0bc95"
   ctx.fillRect(60*x+px%60, 30*y+py%60, 30, 30);
   ctx.fillStyle = y % 2 ? "#f0bc95" : "#db8340"
   ctx.fillRect(60*(x+.5)+px%60, 30*y+py%60, 30, 30);
  }
 }
 
 px += vx;
 py += vy;
 
 if (md)
 {
  vx = mx-_mx;
  vy = my-_my;
 }
 
 if (k[37]) vx = 3;
 if (k[38]) vy = 3;
 if (k[39]) vx = -3;
 if (k[40]) vy = -3;
 
 if (k[65]) vx = 3;
 if (k[87]) vy = 3;
 if (k[68]) vx = -3;
 if (k[83]) vy = -3;
 
 vx *= .9;
 vy *= .9;
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