from scene import *
import sound
import random
import math
A = Action

class MyScene (Scene):
	def setup(self):
		self.lines = []
	
	def did_change_size(self):
		pass
	
	def update(self):
		stroke_weight(1)
		stroke(0)
		background(0.74, 0.83, 1.0)
		
		for l in self.lines:
			line(l.prev_location.x+random.random()*2-1, l.prev_location.y+random.random()*2-1, l.location.x+random.random()*2-1, l.location.y+random.random()*2-1)
	
	def touch_began(self, touch):
		pass
	
	def touch_moved(self, touch):
		self.lines.append(touch)
	
	def touch_ended(self, touch):
		pass

if __name__ == '__main__':
	run(MyScene(), show_fps=False)
