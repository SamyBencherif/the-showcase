from scene import *
from scene_drawing import *
from random import *

class MyScene (Scene):
	def setup(self):
		seed(int("turkey", 36))
		self.F = []
		
		# far view
		#self.pos = (0,0)
		#self.scale = .006
		
		# near view
		self.pos = (4503.117494908009, 17891.16180606897)
		self.scale = 10
		
		R = 20
		for i in range(60*R**2): #24,000 iterations
			pos = (R*(-1000+2000*random()), R*(-1000+2000*random()))
			radius = 10+200*random()**3
			color = (random(), random(), random())
			self.F.append([pos, radius, color])
	
	def did_change_size(self):
		pass
	
	def update(self):
		background(0.65, 0.82, 0.84)
		push_matrix()
		translate(self.size.w/2, self.size.h/2)
		scale(self.scale, self.scale)
		for e in self.F:
			pos, radius, color = e
			fill(*color)
			ellipse(-self.pos[0]-radius+pos[0], -self.pos[1]-radius+pos[1], 2*radius, 2*radius)
		pop_matrix()
	
	def touch_began(self, touch):
		pass
	
	def touch_moved(self, touch):
		self.pos = (
			self.pos[0]+(touch.prev_location.x-touch.location.x)/self.scale,
			self.pos[1]+(touch.prev_location.y-touch.location.y)/self.scale
		)
		
		if len(self.touches) == 2:
			touches = list(self.touches.values())
			d1 = abs(touches[1].location - touches[0].location)
			d0 = abs(touches[1].prev_location - touches[0].prev_location)
			self.scale *= d1/d0
	
	def touch_ended(self, touch):
		pass

if __name__ == '__main__':
	run(MyScene(), show_fps=False)
