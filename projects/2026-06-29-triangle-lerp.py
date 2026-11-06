from scene import *
from scene_drawing import *
from math import *

class MyScene (Scene):
	def setup(self):
		self.a = 0
		self.b = 0
	
	def did_change_size(self):
		pass
	
	def update(self):
		background(0.23, 0.23, 0.23)
		
		push_matrix()
		translate(self.size.w/2, self.size.h/2)
		stroke(0.51, 0.51, 0.51)
		stroke_weight(3)
		R = self.size.w/2 * 1/1.618
		I = 256
		for i in range(I):
			line(
				R*cos(i/I * 2*pi),
				R*sin(i/I * 2*pi),
				R*cos((i+1)/I * 2*pi),
				R*sin((i+1)/I * 2*pi)
			)
		
		fill(0.92, 0.49, 0.03)
		A = []
		R = self.size.w/2 * 1/1.618**2
		I = 3
		o = self.a
		for i in range(I):
			A.append((
				R*cos(o + i/I * 2*pi),
				R*sin(o + i/I * 2*pi),
			))
		
		self.a = .9*self.a + .1*self.b
	
		triangle_strip(A)
		pop_matrix()
	
	def touch(self, touch):
		self.b = atan2(touch.location.y - self.size.h/2, touch.location.x - self.size.w/2)
	
	def touch_began(self, touch):
		self.touch(touch)
	
	def touch_moved(self, touch):
		self.touch(touch)
	
	def touch_ended(self, touch):
		pass

if __name__ == '__main__':
	run(MyScene(), show_fps=False)
