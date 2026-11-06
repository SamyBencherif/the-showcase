"""
2024-03-16 Samie Bee
Dots and Connections
"""

from scene import *

class MyScene (Scene):
	def setup(self):
		self.a = []
	
	def did_change_size(self):
		pass
	
	def update(self):
		background('#06525e')
		fill('#2a8a7e')
		r = 10
		
		stroke('#2a8a7e')
		stroke_weight(1)
		for a in self.a:
			for b in self.a:
				line(a.x, a.y, b.x, b.y)
		
		for i in self.a:
			ellipse(i.x-r, i.y-r, 2*r, 2*r)
	
	def touch_began(self, touch):
		self.a.append(touch.location)

if __name__ == '__main__':
	run(MyScene(), show_fps=False)
