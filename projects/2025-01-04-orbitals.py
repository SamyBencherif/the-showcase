from scene import *
import sound
import random
import math
A = Action

class Particle:
	def __init__(self, pos):
		self.pos = pos
		self.vel = Vector2(0, 0)
		self.acc = Vector2(0, 0)
		self.color = (random.random(), random.random(), random.random())
		
	def draw(self, dt, particles):
		fill(*(self.color + (0.5,)))
		ellipse(self.pos.x-6, self.pos.y-6, 12, 12)
		fill(*(self.color + (1,)))
		ellipse(self.pos.x-3, self.pos.y-3, 6, 6)
		
		self.pos += self.vel * dt
		self.vel += self.acc * dt
		
		for particle in particles:
			if particle == self:
				continue
			if abs(particle.pos - self.pos) < 6:
				particle.vel = particle.pos - self.pos

class MyScene (Scene):
	def setup(self):
		self.gravity_center = self.size/2
		
		self.particles = [
			Particle(self.size/2 + Vector2(10, 0)),
			Particle(self.size/2 + Vector2(30, 0)),
			Particle(self.size/2 + Vector2(60, 20)),
		]
		
		for i in range(100):
			self.particles.append(Particle(Vector2(random.random()*self.size.w, random.random()*self.size.h)))
	
	def did_change_size(self):
		pass
	
	def update(self):
		background(0.1, 0.1, 0.11)
		for particle in self.particles:
			particle.draw(self.dt, self.particles)
			particle.acc = (self.gravity_center - particle.pos)
	
	def touch_began(self, touch):
		pass
	
	def touch_moved(self, touch):
		self.gravity_center = touch.location
	
	def touch_ended(self, touch):
		pass

if __name__ == '__main__':
	run(MyScene(), show_fps=False)
