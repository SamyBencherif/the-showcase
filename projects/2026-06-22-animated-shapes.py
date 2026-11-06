from scene import *
from scene_drawing import *
import math
import random

vibe = True
imprint = False

istack = []

def draw_poly(x, y, r, c, col, pos, rot, atomic=False):
	global istack
	if imprint and not atomic:
		for elem in istack:
			elem2 = list(elem)
			m = 2
			elem2[4] = list(elem2[4])
			elem2[4][0] *= m
			elem2[4][1] *= m
			elem2[4][2] *= m
			elem2[5] = list(elem2[5])
			if vibe:
				elem2[5][0] += random.random()*2-1
				elem2[5][1] += random.random()*2-1
			draw_poly(*elem2, True)
		istack.append((x, y, r, c, col, pos, rot))
	elif not imprint:
		istack = []
	
	push_matrix()
	fill(*col)
	translate(*pos)
	rotate(rot)
	for i in range(c):
		triangle_strip([
			(x,y),
			(x+r*math.cos(i/c*2*math.pi), y+r*math.sin(i/c*2*math.pi)),
			(x+r*math.cos((i+1)/c*2*math.pi), y+r*math.sin((i+1)/c*2*math.pi)),
		])
	pop_matrix()

class MyScene (Scene):
	def setup(self):
		pass
	
	def did_change_size(self):
		pass
	
	def update(self):
		
		# Red triangle in center of screen
		draw_poly(0, 0, 70, 3, (1, .15, 0), (self.bounds.w/2, self.bounds.h/2), -200*self.t)
		
		# Yellow circle
		draw_poly(self.bounds.w/2, self.bounds.h/2, 20, 100, (1, .8, 0), (0,0), 0)
		
		# Blue square
		r = 100 + 30*math.sin(10*self.t)
		draw_poly(
			r*math.cos(self.t),
			r*math.sin(self.t),
		10, 4, (0.18, 0.25, 1.0), (self.bounds.w/2, self.bounds.h/2), -200*self.t)
	
	def touch_began(self, touch):
		global imprint
		imprint = True
	
	def touch_moved(self, touch):
		pass
	
	def touch_ended(self, touch):
		global imprint
		imprint = False

if __name__ == '__main__':
	run(MyScene(), show_fps=False)
