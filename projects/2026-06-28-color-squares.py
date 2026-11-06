from scene import *
from scene_drawing import *
from random import random

PADDING = 10
BEZEL = 50

DATA = [(0.97, 0.51, 0.35)]*3*6

class MyScene (Scene):
	def setup(self):
		pass
	
	def did_change_size(self):
		pass
	
	def update(self):
		background(0.97, 0.97, 0.97)
		
		W = (self.size.w - PADDING) / 3 - PADDING
		
		for u in range(3):
			for v in range(6):
				fill(*DATA[u+3*v])
				rect(PADDING+(W+PADDING)*u, self.size.h-BEZEL-(W+PADDING)*(v+1), W, W)
	
	def touch_began(self, touch):
		W = (self.size.w - PADDING) / 3 - PADDING
		
		for u in range(3):
			for v in range(6):
				if touch.location.x > PADDING+(W+PADDING)*u and touch.location.y > self.size.h-BEZEL-(W+PADDING)*(v+1) and touch.location.x < PADDING+(W+PADDING)*u+W and touch.location.y < self.size.h-BEZEL-(W+PADDING)*(v+1)+W:
					DATA[u+3*v] = (random(), random(), random())
	
	def touch_moved(self, touch):
		pass
	
	def touch_ended(self, touch):
		pass

if __name__ == '__main__':
	run(MyScene(), show_fps=False)
