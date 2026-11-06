
var waves = [];

function init()
{
}

function update()
{
 ctx.clearRect(0, 0, canvas.width, canvas.height);
 
 if (md && !_md)
 {
  if (waves.length % 2 == 0)
  {
   waves.push(my);
  }
  else
  {
   waves.push(mx);
  }
 }
 
 ctx.lineWidth = 3;
 
 // show history of clicks
 for (var i=0; i<waves.length; i++)
 {
  ctx.beginPath();
  if (i % 2 == 0)
   for (var x=0; x<canvas.width; x++)
   {
    ctx.lineTo(x, waves[i]+6*Math.sin(x/8));
   }
  else
   for (var y=0; y<canvas.height; y++)
   {
    ctx.lineTo(waves[i]+6*Math.sin(y/8), y);
   }
  ctx.stroke();
 }
 
 // show current mouse pos
 ctx.beginPath();
 if (waves.length % 2 == 0)
  for (var x=0; x<canvas.width; x++)
  {
   ctx.lineTo(x, my+6*Math.sin(x/8));
  }
 else
  for (var y=0; y<canvas.height; y++)
  {
   ctx.lineTo(mx+6*Math.sin(y/8), y);
  }
 ctx.stroke();
 
 // tap space
 if (k[32] && !_k[32])
  waves = [];
}

/******************* BOILERPLATE *************************/

var canvas = document.createElement("canvas");
var ctx = canvas.getContext("2d");

var mx, my, md;
var _mx, _my, _md;

var k = {}
var _k = {};

document.body.appendChild(canvas);

function init_canvas()
{
 canvas.width = innerWidth
 canvas.height = innerHeight
 canvas.style.width = "100vw"
 canvas.style.height = "100vh"
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