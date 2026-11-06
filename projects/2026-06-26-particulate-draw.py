from scene import *
from scene_drawing import *
from random import random

class P:
	def __init__(self, l):
		self.l = l
		self.c = (random(), random(), random())

class MyScene (Scene):
	def setup(self):
		self.p = []
	
	def did_change_size(self):
		pass
	
	def update(self):
		background(0.05, 0.05, 0.05)
		
		for p in self.p:
			stroke(0)
			stroke_weight(1)
			fill(*p.c)
			ellipse(p.l.x-10, p.l.y-10, 20, 20)
			p.l.x += random()*2-1
			p.l.y += random()*2-1
	
	def touch_began(self, touch):
		pass
	
	def touch_moved(self, touch):
		self.p.append(P(touch.location))
	
	def touch_ended(self, touch):
		pass

if __name__ == '__main__':
	run(MyScene(), show_fps=False)
