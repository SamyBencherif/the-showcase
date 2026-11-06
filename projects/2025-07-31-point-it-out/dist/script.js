/*
Inspired by Dan Shiffman's Nature of Code
*/

// hack for thumbnail
let mx = innerWidth/2;
let my = innerHeight/2;

function draw_vector(x, y, dx, dy)
{
 
 const mag = Math.sqrt((dx*dx)+(dy*dy))
 dx /= mag;
 dy /= mag;
 
 const base_size = 30;
 const fin_size = 7;
 
 ctx.beginPath();
 
 // base
 ctx.moveTo(x-base_size/2*dx, y-base_size/2*dy);
 ctx.lineTo(x+base_size/2*dx, y+base_size/2*dy);
 
 // left fin
 ctx.lineTo(x+base_size/2*dx - fin_size*dy - fin_size*dx, y+base_size/2*dy + fin_size*dx - fin_size*dy);
 
  ctx.moveTo(x+base_size/2*dx, y+base_size/2*dy);
 
  // right fin
 ctx.lineTo(x+base_size/2*dx + fin_size*dy - fin_size*dx, y+base_size/2*dy - fin_size*dx - fin_size*dy);
 
 
 ctx.stroke();
}

function init()
{
}

function update()
{
 ctx.clearRect(0, 0, innerWidth, innerHeight);
 
 const spacing = 40;
 
 for (let x=0; x<innerWidth; x+=spacing)
  for (let y=0; y<innerHeight; y+=spacing)
   draw_vector(
    10+x, 
    10+y, 
    mx-(10+x),
    my-(10+y)
   );
}

/******************* BOILERPLATE *************************/

let canvas = document.createElement("canvas");
let ctx = canvas.getContext("2d");

let md;
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