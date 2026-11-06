from scene import *
import sound
import random
import math
A = Action

class MyScene (Scene):
	def setup(self):
		self.cs = [
			'#ffd12d',
			'#ff2323',
			'#15e1ff',
			'#152aff'
		]
		
		self.ci = 0
		
		self.x = 0
		self.y = 0
		self.vx = 0
		self.vy = 0
	
	def did_change_size(self):
		pass
	
	def update(self):
		fill(self.cs[self.ci])
		
		ellipse(self.size.w/2 + self.x - 25, self.size.h/2 + self.y - 25, 50, 50)
		
		self.x += self.vx * self.dt
		self.y += self.vy * self.dt
		
		if self.x > self.size.w/2 - 25:
			self.vx = -abs(self.vx)
		if self.x < -self.size.w/2 + 25:
			self.vx = abs(self.vx)
		if self.y > self.size.h/2 - 25:
			self.vy = -abs(self.vy)
		if self.y < -self.size.h/2 + 25:
			self.vy = abs(self.vy)
	
	def touch_began(self, touch):
		self.touch_start = touch
	
	def touch_moved(self, touch):
		pass
	
	def touch_ended(self, touch):
		self.vx = touch.location.x - self.touch_start.location.x
		self.vy = touch.location.y - self.touch_start.location.y
		
		self.ci += 1
		self.ci %= len(self.cs)

if __name__ == '__main__':
	run(MyScene(), show_fps=False)
