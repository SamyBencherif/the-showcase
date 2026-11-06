from scene import *
#import sound
from random import random as r
import random
from math import cos, sin, pi
import time
A = Action
import motion

COLORS = [
	(0.84, 0.22, 0.22),
	(0.92, 0.95, 0.23),
	(0.21, 0.27, 0.95),
	(0.22, 0.91, 0.28)
]

def rot(point, angle):
	return Vector2(
		point.x*cos(angle) - point.y*sin(angle), 
		point.y*cos(angle) + point.x*sin(angle)
	)

def rPolyMesh(n, r=10):
	M = []
	for i in range(n):
		M.append(r*Vector2(cos(i*2*pi/n), sin(i*2*pi/n)))
	return M

class Particle:
	def __init__(self, pos, vel, rotspeed, mesh, color):
		self.pos = pos
		self.vel = vel
		self.angle = 0
		self.rotspeed = rotspeed
		self.mesh = mesh
		self.color = color
		self.age = 0
		
	def update(self, dt):
		stroke_weight(1)
		stroke(0,0,0)
		for i in range(len(self.mesh)):
			A = rot(self.mesh[i], self.angle)
			A += self.pos
			B = rot(self.mesh[(i+1)%len(self.mesh)], self.angle)
			B += self.pos
			
			fill(*self.color)
			triangle_strip([A,B,self.pos])
			
			line(A.x, A.y, B.x, B.y)
			
		#self.vel += Vector2(0,-100)*dt
		g = motion.get_gravity()
		self.vel += 500 * Vector2(g[0], g[1]) * dt
		
		self.pos += self.vel*dt
		self.angle += self.rotspeed*dt
		self.age += dt
		
		if self.age < 4:
			return True

class ParticleEmitter:
	def __init__(self, pos, interval, gameobjs):
		self.pos = pos
		self.gameobjs = gameobjs
		self.interval = interval
		self.clock = 0
	
	def update(self, dt):
		
		# draw crosshair
		stroke_weight(1)
		stroke(0,0,0)
		line(self.pos.x-10, self.pos.y, self.pos.x+10, self.pos.y)
		line(self.pos.x, self.pos.y-10, self.pos.x, self.pos.y+10)
		
		self.clock += dt
		if self.clock > self.interval:
			self.clock = 0
			self.gameobjs.append(
			Particle(
				self.pos,
				2*Vector2(-100+200*r(),-100+200*r()),
				5*(-1 + 2*r()),
				rPolyMesh(3 + int(10 * r()), 5 + 10*r()),
				random.choice(COLORS)
				)
			)
			
		return True
	
class MyScene (Scene):
	def setup(self):
		motion.start_updates()
		
		self.gameObjects = []
		
		self.pe = ParticleEmitter(
				self.size/2, .05, self.gameObjects
			) 
		
		self.gameObjects += [
			self.pe
		]
		
		self.lastFrame = time.time()
	
	def did_change_size(self):
		pass
	
	def update(self):
		background(1,1,1)
		i = 0
		while i < len(self.gameObjects):
			g = self.gameObjects[i]
			if not g.update(dt = time.time()-self.lastFrame):
				del self.gameObjects[i]
				i -= 1
			i += 1
			
		self.lastFrame = time.time()
	
	def touch_ev(self, touch, kind):
		self.pe.pos = touch.location
	
	def touch_began(self, touch):
		self.touch_ev(touch, "begin")
	
	def touch_moved(self, touch):
		self.touch_ev(touch, "moved")
	
	def touch_ended(self, touch):
		self.touch_ev(touch, "ended")

if __name__ == '__main__':
	run(MyScene(), show_fps=False, orientation=PORTRAIT)
