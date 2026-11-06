from scene import *
from scene_drawing import *
from random import *

class MyScene (Scene):
	
	def setup(self):
		self.g = None
		self.p = []
		for i in range(10000):
			x,y = random()*self.size.w, random()*self.size.h
			cd = ((x - self.size.w/2)**2 + (y - self.size.h/2)**2)
			if 100**2 < cd < 200**2:
				self.p.append([x, y, 0, 0])
	
	def did_change_size(self):
		pass
	
	def update(self):
		for p in self.p:
			ellipse(p[0]-1, p[1]-1, 2, 2)
			
			p[0] += random()-.5
			p[1] += random()-.5
			
			p[0] += p[2] * self.dt
			p[1] += p[3] * self.dt
			
			if p[0] < 0: p[2] = abs(p[2])
			if p[1] < 0: p[3] = abs(p[3])
			if p[0] > self.size.w: p[2] = -abs(p[2])
			if p[1] > self.size.h: p[3] = -abs(p[3])
			
			if self.g:
				f = 300 / ( 1+ ((self.g.x - p[0])**2 + (self.g.y - p[1])**2)**.5 )
				p[2] = (self.g.x - p[0]) * f
				p[3] = (self.g.y - p[1]) * f
	
	def touch_began(self, touch):
		self.g = touch.location
	
	def touch_moved(self, touch):
		self.g = touch.location
	
	def touch_ended(self, touch):
		self.g = None

if __name__ == '__main__':
	run(MyScene(), show_fps=False)
