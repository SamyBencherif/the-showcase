
from scene import *
from random import *
from math import *

shared_data = {}

def randomColor():
	rhex = lambda: hex(randint(0, 255))[2:].zfill(2)
	#return '#' + rhex() + rhex() + rhex() + '30'
	return (random(), random(), random(), .3)

class Bubble:
	
	def __init__(self):
	
		w, h = shared_data["screen size"]
		self.position = Vector2(random()*w, random()*h)
		self.radius = randint(20,50)
		self.color = randomColor()
		
		magnitude = random() * 40
		angle = random() * 2*pi
		self.velocity = magnitude * Vector2(cos(angle), sin(angle))
	
	def update(self, dt):
		fill(self.color)
		pos, r = self.position, self.radius
		ellipse(pos.x-r, pos.y-r, 2*r, 2*r)
		
		self.position += self.velocity * dt
		
		w,h = shared_data["screen size"]
		
		if self.position.x > w-r:
			self.velocity.x = -abs(self.velocity.x)
		if self.position.x < r:
			self.velocity.x = abs(self.velocity.x)
			
		if self.position.y > h-r:
			self.velocity.y = -abs(self.velocity.y)
		if self.position.y < r:
			self.velocity.y = abs(self.velocity.y)

class Bubbles(Scene):
	
	def setup(self):
		shared_data["screen size"] = self.size
		
		self.repopulate = False
		self.clock = 0
		
		self.bubbles = []
		for i in range(30):
			self.bubbles.append(Bubble())
		
	def draw(self):
		background('#f8fbff')
		shared_data["screen size"] = self.size
		
		if len(self.bubbles) == 0:
			self.repopulate = True
			
		if self.repopulate:
			self.clock += self.dt
			
			if self.clock > .1:
				self.bubbles.append(Bubble())
				self.clock = 0
				
			if len(self.bubbles) == 50:
				self.repopulate = False
				self.clock = 0
		
		for bubble in self.bubbles:
			bubble.update(self.dt)
			
			for other in self.bubbles:
				
				if bubble != other and abs(bubble.position-other.position) < bubble.radius + other.radius:
					
					# "bounce" velocities
					V = bubble.velocity
					bubble.velocity = other.velocity
					other.velocity = V
					
					# physically seperate bubbles
					resolution = .02
					bubble.position += (bubble.position - other.position) * resolution
					other.position += (other.position - bubble.position) * resolution
	
	def touch_began(self, touch):
		
		for i in range(len(self.bubbles)-1, -1, -1):
			if abs(touch.location-self.bubbles[i].position) < self.bubbles[i].radius:
				del self.bubbles[i]
		
run(Bubbles())
