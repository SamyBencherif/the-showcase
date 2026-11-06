from scene import *
from scene_drawing import *
from random import random

r = lambda: random()*2-1

class MyScene (Scene):
	def setup(self):
		self.d = 0
		self.td = 0
	
	def did_change_size(self):
		pass
	
	def update(self):
		background(0.07, 0.07, 0.07)
		
		fill(0.96, 0.13, 0.35)
		rect(self.size.w/2-30+r(), self.size.h/2-30+r(), 60, 60)
		
		push_matrix()
		translate(self.size.w/2, self.size.h/2)
		rotate(self.d)
		fill(0.96, 0.96, 0.96)
		rect(-50-self.d, -50-self.d, 100, 100)
		rect(-50+self.d, -50-self.d, 100, 100)
		rect(-50-self.d, -50+self.d, 100, 100)
		rect(-50+self.d, -50+self.d, 100, 100)
		pop_matrix()
		
		self.d = .1*self.td + .9*self.d
	
	def touch_began(self, touch):
		self.td = max((1.6*touch.location.x + 1.6*touch.location.y-200)/10., 0)
	
	def touch_moved(self, touch):
		self.td = max((1.6*touch.location.x + 1.6*touch.location.y-200)/10., 0)
	
	def touch_ended(self, touch):
		pass

if __name__ == '__main__':
	run(MyScene(), show_fps=False)
