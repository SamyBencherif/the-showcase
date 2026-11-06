from scene import *
from scene_drawing import *
from math import *

def dotted_line(x1,y1,x2,y2,perc=.5,len=20):
	
	L = ((x2-x1)**2 + (y2-y1)**2)**.5
	D = (x2-x1)/L, (y2-y1)/L
	
	x = x1
	y = y1
	
	for i in range(1000):
		if not (min(x1, x2) <= x <= max(x1, x2) and min(y1, y2) <= y <= max(y1, y2)):
			break
		line(x, y, x+D[0]*len*perc, y+D[1]*len*perc)
		x += D[0]*len
		y += D[1]*len

class MyScene (Scene):
	def setup(self):
		self.circle = Vector2(0,0)
		self.cv = Vector2(0,0)
	
	def did_change_size(self):
		pass
	
	def update(self):
		background(0.94, 0.94, 0.94)
		stroke(0.12, 0.12, 0.12)
		stroke_weight(1)
		
		I = 1-1/(1+(abs(self.circle)/10.)**4)
		np = pi/2
		if abs(atan2(self.circle.y, self.circle.x) - pi/2) > abs(atan2(self.circle.y, self.circle.x) + pi/2):
			np = -pi/2
		a = atan2(self.circle.y, self.circle.x) * I + np * (1-I)
		
		l = self.size.h/4
		dotted_line(self.size.w/2 - cos(a)*l, self.size.h/2 - sin(a)*l, self.size.w/2 + cos(a)*l, self.size.h/2 + sin(a)*l)
		
		push_matrix()
		translate(self.size.w/2, self.size.h/2)
		translate(self.circle.x, self.circle.y)
		fill(0.97, 0.78, 0.11)
		no_stroke()
		ellipse(-50, -50, 100, 100)
		pop_matrix()
		
		self.circle += self.cv * self.dt
		self.cv -= self.circle * self.dt
		self.cv *= .99
	
	def touch_began(self, touch):
		pass
	
	def touch_moved(self, touch):
		if abs(touch.location - self.circle - self.size/2) <= 50:
			self.circle += touch.location - touch.prev_location
			self.cv += touch.location - touch.prev_location
	
	def touch_ended(self, touch):
		pass

if __name__ == '__main__':
	run(MyScene(), show_fps=False)
