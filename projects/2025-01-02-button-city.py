from scene import *

class Button:
	def __init__(self, x, y, w, h, txt, fg, bg, target=None, scene=None):
		self.x = x
		self.y = y
		self.w = w
		self.h = h
		self.txt = txt
		self.fg = fg
		self.bg = bg
		self.target = target
		self.scene = scene
		
	def draw(self):
		fill(*self.bg)
		stroke(*self.fg)
		stroke_weight(3)
		rect(self.x, self.y, self.w, self.h)
		tint(*self.fg)
		text(self.txt, x=self.x+self.w/2, y=self.y+self.h/2)
		
	def touch_began(self, touch):
		pass

	def touch_moved(self, touch):
		pass
		
	def touch_ended(self, touch):
		if touch.location in Rect(self.x, self.y, self.w, self.h):
			if self.target and self.scene:
				self.scene.buttons = self.target

class MyScene (Scene):
	def setup(self):
		
		self.buttonCityF = [
			Button(
				10,300,300,100,
				"woohoo",
				(0.27, 0.68, 0.74),
				(0.35, 0.35, 0.35),
				None,
				self
			),
			Button(
				10,180,300,100,
				"woohoo",
				(0.27, 0.68, 0.74),
				(0.35, 0.35, 0.35),
				None,
				self
			),
			Button(
				10,420,300,100,
				"woohoo",
				(0.27, 0.68, 0.74),
				(0.35, 0.35, 0.35),
				None,
				self
			)
		]
		
		self.buttonCityE = [
			Button(
				10,300,300,100,
				"city!!!",
				(0.27, 0.68, 0.74),
				(0.35, 0.35, 0.35),
				self.buttonCityF,
				self
			)
		]
		
		self.buttonCityD = [
			Button(
				10,300,300,100,
				"button",
				(0.61, 0.74, 0.33),
				(0.35, 0.35, 0.35),
				self.buttonCityE,
				self
			)
		]
		
		self.buttonCityC = [
			Button(
				10,300,300,100,
				"is",
				(0.27, 0.68, 0.74),
				(0.35, 0.35, 0.35),
				self.buttonCityD,
				self
			)
		]
		
		self.buttonCityB = [
			Button(
				100,200,300,100,
				"this",
				(0.31, 0.88, 0.2),
				(0.35, 0.35, 0.35),
				self.buttonCityC,
				self
			)
		]
		
		self.buttonCityA = [
			Button(
				10,10,300,100,
				"world",
				(0.52, 0.22, 0.53),
				(0.86, 0.88, 0.46),
				self.buttonCityB,
				self
			)
		]
		
		self.buttons = [
			Button(
				10,10,100,100,
				"hello",
				(0.14, 0.14, 0.21),
				(0.74, 0.88, 0.75),
				target=self.buttonCityA,
				scene=self
			)
		]
	
	def did_change_size(self):
		pass
	
	def update(self):
		for btn in self.buttons:
			btn.draw()
	
	def touch_began(self, touch):
		for btn in self.buttons:
			btn.touch_began(touch)
	
	def touch_moved(self, touch):
		for btn in self.buttons:
			btn.touch_moved(touch)
	
	def touch_ended(self, touch):
		for btn in self.buttons:
			btn.touch_ended(touch)

if __name__ == '__main__':
	run(MyScene(), show_fps=False)
