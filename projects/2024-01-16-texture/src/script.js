
function init()
{
}

function pulsar(x, y, s) {
 const t = time();
 
 for (var i=0; i<8; i++)
 {
  ctx.beginPath();
  ctx.arc(x, y, 20+10*i, 1+(-1)**i*t*(s)+i+20*s, 4+(-1)**i*t)+i+20*s;
  ctx.stroke();
 }
}

function update()
{
 let grd = ctx.createLinearGradient(0, 0, innerWidth, innerHeight);
 grd.addColorStop(1, "#ddd");
 grd.addColorStop(0, "#eee");
 ctx.fillStyle = grd;
 ctx.fillRect(0, 0, innerWidth, innerHeight);
  
 let i = 0;
 for (let x = 110; x < innerWidth+220; x += 220)
 for (let y = 110; y < innerWidth+220; y += 220) // This was supposed to be innerHeight, but I like how it looks more with the typo
 {
   const colors = ["gray", "purple", "gray", "black"];
  
   grd = ctx.createLinearGradient(x-100, y-100, x+100, y+100);
   grd.addColorStop(0, colors[i%colors.length]);
   grd.addColorStop(1, "white");
  
  let px = x+10*Math.sin(time()+100*i);
  let py = y+10*Math.sin(time()+200*i);
  
  ctx.beginPath();
  ctx.fillStyle = grd;
  ctx.arc(px, py, 45, 0, 7);
  ctx.fill();
  
  ctx.lineWidth = 1+1*(.5+Math.sin(time()+x*y)/2);
  pulsar(px, py, (1700*x*y)%200);
  i++;
 }
}

/******************* BOILERPLATE *************************/

var canvas = document.createElement("canvas");
var ctx = canvas.getContext("2d");

var mx, my, md;
var _mx, _my, _md;

var k = {}
var _k = {};

var s = Date.now();

function time()
{
 // return time since start in seconds
 return (Date.now()-s)/1000;
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