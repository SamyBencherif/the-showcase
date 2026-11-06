
var ctx
window.addEventListener("load", () => {
 var canvas = document.createElement("canvas")
 ctx = canvas.getContext("2d")

 canvas.width = innerWidth
 canvas.height = innerHeight
 canvas.style.width = "100vw"
 canvas.style.height = "100vh"
 document.body.appendChild(canvas)

 ctx.fillStyle = "#f02"
 ctx.fillRect(0, 0, innerWidth, innerHeight)
})

setInterval(() => {
 ctx.fillStyle = "#f025"
 ctx.fillRect(0, 0, innerWidth, innerHeight)
}, 1000/10)

var intx = 0
var inty = 0
var intc = 0

var tx = 0
var ty = 0

document.addEventListener("mousemove", (ev) => {
 ctx.fillStyle = "#fff"
 ctx.beginPath()
 intx += ev.clientX
 inty += ev.clientY
 intc += 1
 ctx.arc(intx/intc, inty/intc, 10, 0, 7)
 
 if (intc >= 100)
 {
  intx = 0
  inty = 0
  intc = 0
 }
 
 ctx.fill()
})