let grd;

let scene, renderer;
let mesh;

let vibTimer = 0;
let direction = -1;

let spinTimer = 0;

// pre-canvas THREE init
let camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 1, 1000 );
renderer = new THREE.WebGLRenderer({ alpha: true });

function init()
{
 grd = ctx.createRadialGradient(innerWidth/2, innerHeight/2, 40, innerWidth/2, innerHeight/2, innerWidth/2);
 grd.addColorStop(0, "#064cf0");
 grd.addColorStop(1, "#010cb0");
 
 // init THREE
 camera.position.z = 400;
 scene = new THREE.Scene();
 let size = 150;
 let geometry = new THREE.BoxGeometry(size, size, size);
 let material = new THREE.MeshStandardMaterial({
  color: 0x33ed9d,
  emissive: 0x011cd0,
 });
 mesh = new THREE.Mesh( geometry, material );
 scene.add( mesh );
 
 // lighting
 const light1 = new THREE.AmbientLight( 0xbbbbbb ); // soft white light
scene.add( light1 );
 const directionalLight = new THREE.DirectionalLight( 0xffffff, 0.5 );
 directionalLight.position.set(-1,1,1);
scene.add( directionalLight );
 
 renderer.setPixelRatio( window.devicePixelRatio );
 renderer.setSize( window.innerWidth, window.innerHeight );
 renderer.domElement.style.margin = "0px";
 document.body.appendChild( renderer.domElement );
}

let tr_x, tr_y;

function update()
{
 ctx.fillStyle = grd;
 ctx.fillRect(0, 0, innerWidth, innerHeight);
 
 tr_x = (my-innerHeight/2)/100;
 tr_y = (mx-innerWidth/2)/100;
 
 if (spinTimer > 0)
 {
  if (direction == 0)
    tr_y = 6*Math.PI*(1+Math.sin((3-spinTimer)/3*Math.PI))/2;
  else
     tr_x = 6*Math.PI*(1+Math.sin((3-spinTimer)/3*Math.PI))/2;
  
  spinTimer -= deltaTime();
 }
 if (k[32] && !_k[32]) // space just pressed
 {
  spinTimer = 3;
  direction += 1; direction = direction % 2;
 }
 
 if (vibTimer > 0)
 {
  if (direction == 0)
   mesh.position.set(20*Math.sin(100*time()), 0, 0);
  else
   mesh.position.set(0, 20*Math.sin(100*time()), 0);
   
  vibTimer -= deltaTime();
 }
 if (md && !_md) // mouse just down
 {
  vibTimer = .3;
  direction += 1; direction = direction % 2;
 }
 
 if (!tr_x) tr_x = 0;
 if (!tr_y) tr_y = 0;
  
 const lerp_rate = .01;
 
 mesh.rotation.x = mesh.rotation.x*(1-lerp_rate) + tr_x*lerp_rate;
 mesh.rotation.y = mesh.rotation.y*(1-lerp_rate) + tr_y*lerp_rate;

 renderer.render( scene, camera );
}

/******************* BOILERPLATE *************************/

let canvas = document.createElement("canvas");
let ctx = canvas.getContext("2d");

let mx, my, md;
let _mx, _my, _md;

let k = {};
let _k = {};

let start = Date.now();
let last = Date.now();

function time()
{
 // return duration in seconds since start of sketch
 
 return (Date.now() - start) / 1000;
}

function deltaTime()
{
 // return time in seconds since last frame
 return (Date.now() - last) / 1000;
}

document.body.appendChild(canvas);

function init_canvas()
{
 canvas.width = innerWidth * devicePixelRatio;
 canvas.height = innerHeight * devicePixelRatio;
 canvas.style.width = "100vw";
 canvas.style.height = "100vh";
 ctx.scale(devicePixelRatio, devicePixelRatio);
 
 // THREE resize
 camera.aspect = window.innerWidth / window.innerHeight;
 camera.updateProjectionMatrix();
 renderer.setSize( window.innerWidth, window.innerHeight );
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
 last = Date.now();
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