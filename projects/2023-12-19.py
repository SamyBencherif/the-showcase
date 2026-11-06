from scene import *
from scene_drawing import *
import sound
import random
import math
A = Action

def nearest_point(line, ball):
	"""
	return the nearest point on line to ball
	"""
	
	"""
	d = (ball.x-(line.x0+dx*i))**2 + (ball.y-(line.y0+dy*i))**2
	
	d = ball.x**2 - 2*ball.x*(lx+dx*i) + (lx+dx*i)**2 + ball.y**2 - 2*ball.y*(ly+dy*i) + (ly+dy*i)**2
	
	d' = -2*ball.x*dx -2*ball.y*dy + [(lx+dx*i)**2 + (ly+dy*i)**2]'

	lx**2 + 2*lx*dx*i + dx**2*i**2
	
	d' = -2*ball.x*dx -2*ball.y*dy + 2*lx*dx + 2*dx**2*i + 2*ly*dy + 2*dy**2*i
	"""
	
	lx = line.x0
	ly = line.y0
	dx = line.x1-line.x0
	dy = line.y1-line.y0
	
	i = 0
	
	if dx and dy:
		i = -(-2*ball.x*dx -2*ball.y*dy + 2*lx*dx + 2*ly*dy) / (2*dx**2 + 2*dy**2)
	
	if i < 0: i = 0
	if i > 1: i = 1
	
	return [lx + dx*i, ly + dy*i]
	
	
class Ball:
	def __init__(self, x, y, r, c):
		self.x = x
		self.y = y
		self.r = r
		self.c = c
		self.vx = 0
		self.vy = 0
		
	def step(self, dt, lines):
		self.x += self.vx * dt
		self.y += self.vy * dt
		
		self.vy -= 100 * dt
		
		for line in lines:
			nx, ny = nearest_point(line, self)
			distSq = (nx - self.x)**2 + (ny - self.y)**2
			if distSq <= self.r**2:
				# collision btwn ball & line
				nrm_x = (self.x - nx) / self.r
				nrm_y = (self.y - ny) / self.r
				
				vnx = -nrm_y * self.vx + nrm_x * self.vy
				vny = nrm_x * self.vx + nrm_y * self.vy
				
				self.vx = vnx * (-nrm_y) - vny * nrm_x
				self.vy = vnx * nrm_x - vny * nrm_y
				
				# get out of collision
				self.x += self.vx * dt
				self.y += self.vy * dt

class Line:
	def __init__(self, x0, y0, x1, y1):
		self.x0 = x0
		self.y0 = y0
		self.x1 = x1
		self.y1 = y1

class MyScene (Scene):
	def setup(self):
		self.balls = []
		self.balls.append(Ball(0, self.size.h/2+20 ,20,'#39b1ff'))
		
		self.lines = []
		#self.lines.append(Line(-20, -40, 20, -80))
	
	def did_change_size(self):
		pass
	
	def update(self):
		background('#f7f7f7')
		
		# render balls
		push_matrix()
		translate(self.size.w/2, self.size.h/2)
		for ball in self.balls:
			fill(ball.c)
			ellipse(ball.x-ball.r, ball.y-ball.r, 2*ball.r, 2*ball.r)
			ball.step(self.dt, self.lines)
			
			if ball.y+ball.r < -self.size.h/2:
				ball.x = 0
				ball.y = self.size.h/2+20
				ball.vx = 0
				ball.vy = 0
		
		# render lines
		stroke_weight(3)
		for ln in self.lines:
			line(ln.x0, ln.y0, ln.x1, ln.y1)
		
		pop_matrix()
		
		
	
	def touch_began(self, touch):
		self.lines.append(Line(touch.location.x - self.size.w/2, touch.location.y - self.size.h/2, touch.location.x - self.size.w/2, touch.location.y - self.size.h/2))
	
	def touch_moved(self, touch):
		self.lines[-1].x1 = touch.location.x - self.size.w/2
		self.lines[-1].y1 = touch.location.y - self.size.h/2
	
	def touch_ended(self, touch):
		pass

if __name__ == '__main__':
	run(MyScene(), show_fps=False)
