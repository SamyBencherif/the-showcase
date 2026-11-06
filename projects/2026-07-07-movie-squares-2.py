from scene import *
from scene_drawing import *
from random import random as r
from random import seed as s
from math import pi

bs = 100
sb = True

class Square:
	def __init__(self):
		self.f = 0.94, 0.94, 0.94, 1
		self.tf = self.f
		
		self.r = 0
		self.tr = 0
		
		self.s = 100
		self.ts = 100
		
		self.x = 0
		self.y = 0
		self.tx = 0
		self.ty = 0
		
	def update(self):
		push_matrix()
		translate(self.x, self.y)
		rotate(self.r)
		
		fill(*self.f)
		rect(-self.s/2, -self.s/2, self.s, self.s)
		
		self.f = .9*self.f[0] + .1*self.tf[0], .9*self.f[1] + .1*self.tf[1], .9*self.f[2] + .1*self.tf[2], .9*self.f[3] + .1*self.tf[3]
		
		self.r = .9*self.r + .1*self.tr
		
		self.s = .9*self.s + .1*self.ts
		
		self.x = .9*self.x + .1*self.tx
		self.y = .9*self.y + .1*self.ty
		
		pop_matrix()


class MyScene (Scene):
	def setup(self):
		
		self.tc = 0
		self.sb = None
		
		self.squares = []
		for i in range(10):
			self.squares.append(Square())
	
	def did_change_size(self):
		pass
	
	def update(self):
		
		background(0.11, 0.11, 0.11)
		push_matrix()
		translate(self.size.w/2, self.size.h/2)
		
		for square in self.squares:
			square.update()
		
		pop_matrix()
		
		if sb:
			fill(1.0, 1.0, 1.0, .1)
			for x in range(int(self.size.w/bs)+1):
				for y in range(int(self.size.h/bs)+1):
					
					if self.sb == (y, x):
						fill(1,1,1,.4)
					else:
						fill(1,1,1,.1)
					
					rect(1+x*bs, 1+y*bs, bs-2, bs-2)
	
	def touch_began(self, touch):
		self.tc += 1
		
		self.sb = touch.location.y//bs, touch.location.x//bs
		s(f"{touch.location.y//bs} {touch.location.x//bs}")
		
		if not self.tc % 2:
			self.sb = None
		
		for square in self.squares:
			if self.tc % 2:
				square.tf = (r(), r(), r(), r())
				square.tr = r()*360
				square.ts = r()*400
				square.tx = r()*self.size.w - self.size.w/2
				square.ty = r()*self.size.h - self.size.h/2
			else:
				square.tf = (1,1,1,1)
				square.tr = 0
				square.ts = 100
				square.tx = 0
				square.ty = 0
	
	def touch_moved(self, touch):
		pass
	
	def touch_ended(self, touch):
		pass

if __name__ == '__main__':
	run(MyScene(), show_fps=False)
