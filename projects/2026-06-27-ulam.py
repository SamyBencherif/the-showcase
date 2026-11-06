from scene import *
from scene_drawing import *

def isPrime(x):
	if x==1: return False
	for i in range(2,x//2+1):
		if x%i==0:
			return False
	return True

class MyScene (Scene):
	def setup(self):
		self.p = (self.size.w/2, self.size.h/2)
		self.z = 1
	
	def did_change_size(self):
		pass
	
	def update(self):
		background(1.0, 1.0, 1.0)
		
		push_matrix()
		tint(0)
		translate(*self.p)
		d = (1,0)
		u = 30*self.z
		c = 1
		k = 1
		o = 1
		# turning numbers 1 2 3 5 7 10 13 17 21
		# deltas 1 1 2 2 3 3 4 4
		for i in range(1, 1001):
			
			if isPrime(i):
				tint(1,0,0)
			else:
				tint(0)
				
			text(str(i), x=0, y=0, font_size=int(16*self.z))
			translate(d[0]*u, d[1]*u)
			c -= 1
			if c == 0:
				c = k
				k += o%2
				o += 1
				if d == (1,0): d = (0,1)
				elif d == (0,1): d = (-1,0)
				elif d == (-1,0): d = (0,-1)
				elif d == (0,-1): d = (1,0)
			
		pop_matrix()
		
		if len(self.touches.values()) == 2:
			l = []
			pl = []
			for (k, v) in self.touches.items():
				l.append(v.location)
				pl.append(v.prev_location)
			self.z *= abs(l[0]-l[1])/abs(pl[0]-pl[1])
	
	def touch_began(self, touch):
		pass
	
	def touch_moved(self, touch):
		self.p = (self.p[0] + touch.location.x - touch.prev_location.x, self.p[1] + touch.location.y - touch.prev_location.y)
	
	def touch_ended(self, touch):
		pass

if __name__ == '__main__':
	run(MyScene(), show_fps=False)
