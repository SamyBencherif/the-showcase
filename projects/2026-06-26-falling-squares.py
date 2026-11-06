from scene import *
from scene_drawing import *

class Square:
	def __init__(self, x, y):
		self.x = x
		self.y = y
		self.vx = 150
		self.vy = 0
		
		self.trail = []
		
	def draw(self, dt):
		
		for t in self.trail:
			x,y = t
			stroke_weight(3)
			stroke(0.1, 0.28, 0.62)
			rect(0,0,0,0)
			b = 1.5
			line(x-b, y, x+30+b, y)
			line(x, y, x, y+30)
			line(x+30, y, x+30, y+30)
			line(x-b, y+30, x+30+b, y+30)
		
		stroke_weight(3)
		stroke(0.1, 0.28, 0.62)
		rect(0,0,0,0)
		b = 1.5
		line(self.x-b, self.y, self.x+30+b, self.y)
		line(self.x, self.y, self.x, self.y+30)
		line(self.x+30, self.y, self.x+30, self.y+30)
		line(self.x-b, self.y+30, self.x+30+b, self.y+30)
		
		self.x += self.vx * dt
		self.y += self.vy * dt
		
		self.vy += -300*dt
		
		self.trail.append((self.x, self.y))
		self.trail = self.trail[-100:]

class MyScene (Scene):
	def setup(self):
		self.squares = []
	
	def did_change_size(self):
		pass
	
	def update(self):
		background(0.96, 0.75, 0.75)
		for square in self.squares:
			square.draw(self.dt)
	
	def touch_began(self, touch):
		self.squares.append(Square(touch.location.x-15, touch.location.y-15))
	
	def touch_moved(self, touch):
		pass
	
	def touch_ended(self, touch):
		pass

if __name__ == '__main__':
	run(MyScene(), show_fps=False)
