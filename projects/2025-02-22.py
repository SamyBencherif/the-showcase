from scene import *
from random import *

class MyScene (Scene):
	def setup(self):
		self.points = []
	
	def did_change_size(self):
		pass
	
	def update(self):
		
		seed(0)
		
		background(1.0, 1.0, 1.0)
		stroke(0.07, 0.07, 0.07)
		stroke_weight(1)
		
		for pointA in self.points:
			for pointB in self.points:
				if pointA != pointB:
					line(*pointA, *pointB)
			
		for point in self.points:
			r = 50*random()
			ellipse(point[0]-r, point[1]-r, 2*r, 2*r)
	
	def touch_began(self, touch):
		self.points.append((touch.location.x, touch.location.y))
	
	def touch_moved(self, touch):
		pass
	
	def touch_ended(self, touch):
		pass

if __name__ == '__main__':
	run(MyScene(), show_fps=False)
