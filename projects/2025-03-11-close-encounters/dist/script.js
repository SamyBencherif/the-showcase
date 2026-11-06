const smobs = [];

function init()
{
  for (let i=0; i<100; i++)
  {
   
   const randAngle = Math.random()*2*Math.PI;
   
   smobs.push({
    x: Math.random()*innerWidth, 
    y: Math.random()*innerHeight,
    direction: {x: Math.cos(randAngle), y: Math.sin(randAngle)}
   })
  }
}

function update()
{
 ctx.fillStyle = "#222";
 ctx.fillRect(0, 0, innerWidth, innerHeight);
 
 for (let smob of smobs)
 {
   ctx.strokeStyle = "#eee"
   ctx.beginPath();
   ctx.arc(smob.x, smob.y, 10, 0, 7);
   ctx.moveTo(smob.x, smob.y);
   ctx.lineTo(smob.x+12*smob.direction.x, smob.y+12*smob.direction.y)
   ctx.stroke();
  
   smob.x += smob.direction.x;
   smob.y += smob.direction.y;
  
   if (smob.x < 10) smob.direction.x = Math.abs(smob.direction.x);
   if (smob.x > innerWidth-10) smob.direction.x = -Math.abs(smob.direction.x);
   if (smob.y < 10) smob.direction.y = Math.abs(smob.direction.y);
   if (smob.y > innerHeight-10) smob.direction.y = -Math.abs(smob.direction.y);
  
  for (let colSmob of smobs)
  {
   if (colSmob != smob)
   {
    if ((smob.x - colSmob.x)**2 + (smob.y - colSmob.y)**2 < 400)
    {
     smob.direction.x = smob.x - colSmob.x;
     smob.direction.y = smob.y - colSmob.y;
     
     const mag = Math.sqrt(smob.direction.x**2 + smob.direction.y**2);
     
     smob.direction.x /= mag;
     smob.direction.y /= mag;
    }
   }
  }
  
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