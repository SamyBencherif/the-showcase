from scene import *
import sound
import random
import math
A = Action

class MyScene (Scene):
	def setup(self):
		self.colors = [
			(0.68, 0.24, 0.88),
			(0.88, 0.72, 0.15),
			(0.25, 0.88, 0.12),
			(0.88, 0.12, 0.12),
			(0.12, 0.58, 0.88)
		]
		self.tc = 0
	
	def did_change_size(self):
		pass
	
	def update(self):
		background(0.1, 0.1, 0.1)
		fill(*self.colors[self.tc % len(self.colors)])
		
		translate(self.size.w/2, self.size.h/2)
		r = self.size.w * .5/1.618
		ellipse(-r, -r, 2*r, 2*r)
	
	def touch_began(self, touch):
		self.tc += 1
	
	def touch_moved(self, touch):
		pass
	
	def touch_ended(self, touch):
		pass

if __name__ == '__main__':
	run(MyScene(), show_fps=False)
