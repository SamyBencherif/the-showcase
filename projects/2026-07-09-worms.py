from scene import *
from scene_drawing import *
from random import random as r

class MyScene (Scene):
	def setup(self):
		self.p = []
	
	def did_change_size(self):
		pass
	
	def update(self):
		background(1.0, 1.0, 1.0)
		stroke_weight(1)
		
		for i in range(len(self.p)-1,-1,-1):
			if self.p[i][0] > 8:
				del self.p[i]
		
		for S in self.p:
			S[0] += self.dt
			
			stroke(S[0]/7.)
			s = S[1:]
			for i in range(len(s)-1):
				line(s[i][0].x, s[i][0].y, s[i+1][0].x, s[i+1][0].y)
		
		for i in range(len(self.p)):
			self.p[i] = [self.p[i][0]] + self.p[i][-200:][1:]
								
		for S in self.p:
			s = S[1:]
			for i in range(len(s)):
				s[i][0].x += s[i][1] * self.dt
				s[i][0].y += s[i][2] * self.dt
	
	def touch_began(self, touch):
		self.p.append([0])
	
	def touch_moved(self, touch):
		if len(self.touches) > 1:
			return
		
		for i in range(20):
			self.p[-1].append((touch.location + Vector2(-5+10*r(), -5+10*r()), -5+10*r(), -5+10*r()))
	
	def touch_ended(self, touch):
		pass

if __name__ == '__main__':
	run(MyScene(), show_fps=False)
