from scene import *
import sound
import random
import math
A = Action

def pingpong(t):
	t = t % 10
	if t > 5:
		t = 10-t
	return t

class MyScene (Scene):
	def setup(self):
		pass
	
	def did_change_size(self):
		pass
	
	def update(self):
		stroke_weight(1)
		stroke(0,0,0)
		for y in range(int(self.size.h)):
			line(0, (1+pingpong(self.t))*y, self.size.w, 1.8*y)
	
	def touch_began(self, touch):
		pass
	
	def touch_moved(self, touch):
		pass
	
	def touch_ended(self, touch):
		pass

if __name__ == '__main__':
	run(MyScene(), show_fps=False)
