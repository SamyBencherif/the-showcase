from scene import *
from scene_drawing import *
from random import random as r
from math import sin

M = 1500
ss = 20

class Square:
	def __init__(self, x, y):
		self.sx = x
		self.sy = y
		self.x = x
		self.y = y
		self.color = (r(), .1*r(), .1*r())
		self.tx = x+r()*M-M/2
		self.ty = y+r()*M-M/2

class MyScene (Scene):
	
	def vrect(self, x, y, w, h):
		
		c=0
		for T in self.T:
			if x < T.location.x < x+w and y < T.location.y < y+h:
				c+=1
				
		if c%2 and not self.m:
			fill(1,1,1,.8)
		elif c>0 and self.m:
			fill(0.92, 0.73, 0.08,.5)
		
		rect(x, y, w, h)
	
	def setup(self):
		self.m = False
		self.T = []
		self.i = 0
		self.ti = 0
		self.s = []
		for x in range(int(self.size.w/ss)+1):
			for y in range(int(self.size.h/ss)+1):
				self.s.append(Square(x*ss, y*ss))
	
	def did_change_size(self):
		pass
	
	def update(self):
		
		self.ti = sin(10*self.t)*.01
		
		background(0.69, 0.0, 0.0)
		for s in self.s:
			fill(*s.color)
			self.vrect(s.x, s.y, ss, ss)
		
			s.x = s.sx + (s.tx-s.sx)*self.i
			s.y = s.sy + (s.ty-s.sy)*self.i
			
		self.i = self.i*.9 + self.ti*.1
	
	def touch_began(self, touch):
		self.touch_moved(touch)
		self.m = True
	
	def touch_moved(self, touch):
		self.T.append(touch)
	
	def touch_ended(self, touch):
		self.m = False

if __name__ == '__main__':
	run(MyScene(), show_fps=False)
