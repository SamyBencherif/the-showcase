from scene import *
from random import random as r
from math import *

class Sparkle:
	def __init__(self, x, y):
		self.x = x
		self.y = y
		R = 50*r()
		A = r()*6.29
		self.vx = R*cos(A)
		self.vy = R*sin(A)
		self.r = 3*r()
		self.a = r()
		self.lifespan = .6*r()
			
	def update(self, dt):
		self.x += self.vx*dt
		self.y += self.vy*dt
		self.vy -= 300*dt
		self.lifespan -= dt
		
		if self.lifespan > 0:
			fill(1.0, 0.95, 0.76, self.a)
			ellipse(self.x-self.r, self.y-self.r, 2*self.r, 2*self.r)

class Emitter:
	def __init__(self, x, y, s):
		self.x = x
		self.y = y
		self.s = s
		
	def update(self, dt):
		self.s.append(Sparkle(self.x, self.y))

class MyScene (Scene):
	def setup(self):
		self.s = []
	
	def did_change_size(self):
		pass
	
	def update(self):
		background(0.07, 0.07, 0.12)
		
		for i in range(len(self.s)-1,-1,-1):
			if self.s[i].y < 0:
				del self.s[i]
		
		for tid in self.touches:
			t = self.touches[tid]
			for i in range(5):
				self.s.append(Emitter(t.location.x, t.location.y, self.s))
		
		for s in self.s:
			s.update(self.dt)
	
	def touch_began(self, touch):
		pass
	
	def touch_moved(self, touch):
		pass
	
	def touch_ended(self, touch):
		pass

if __name__ == '__main__':
	run(MyScene(), show_fps=False)
