'use strict';

// A small stand-in for Pythonista's scene module, shared by the ported projects.
//
//   runScene({ setup, update, touchBegan, touchMoved, touchEnded })
//
// The page gets a full-window canvas whose coordinates match Pythonista:
// origin at the bottom left, y pointing up, units in CSS pixels. Inside the
// callbacks, `this` is the scene object, with:
//   ctx       2D context, already in y-up coordinates (restored after update)
//   size      { w, h } of the canvas
//   t, dt     seconds since start, and since the previous update
//   touches   Map of active touches by pointer id
// Touch callbacks get a fresh { id, location, prevLocation } for every event,
// like Pythonista's Touch objects, so they are safe to keep.
//
// update() runs at most 60 times a second, as in Pythonista, so per-frame
// easing and jitter look the same on high refresh rate screens. Each frame is
// cleared to DEFAULT_BACKGROUND first, like a Pythonista scene that never
// calls background().

// Pythonista colours are 0..1 floats; values outside that range are clamped.
const rgb = (r, g, b, a = 1) => `rgba(${r * 255}, ${g * 255}, ${b * 255}, ${a})`;

// Pythonista's own default scene background isn't known exactly; dark grey
// is a guess.
const DEFAULT_BACKGROUND = '#333';

function runScene(scene) {
  for (const el of [document.documentElement, document.body]) {
    el.style.margin = '0';
    el.style.height = '100%';
    el.style.overflow = 'hidden';
  }
  const canvas = document.createElement('canvas');
  Object.assign(canvas.style, {
    display: 'block',
    width: '100vw',
    height: '100dvh',
    touchAction: 'none',
  });
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  let dpr = 1;

  scene.ctx = ctx;
  scene.size = { w: 0, h: 0 };
  scene.t = 0;
  scene.dt = 0;
  scene.touches = new Map();

  function resize() {
    dpr = window.devicePixelRatio || 1;
    scene.size = { w: canvas.clientWidth, h: canvas.clientHeight };
    canvas.width = Math.round(scene.size.w * dpr);
    canvas.height = Math.round(scene.size.h * dpr);
  }
  window.addEventListener('resize', resize);
  resize();

  if (scene.setup) scene.setup();

  const start = performance.now();
  let last = start;
  function frame(now) {
    requestAnimationFrame(frame);
    if (now - last < 1000 / 60 - 1) return;
    // Cap dt so a backgrounded tab doesn't make things jump.
    scene.dt = Math.min((now - last) / 1000, 1 / 20);
    scene.t = (now - start) / 1000;
    last = now;

    ctx.setTransform(dpr, 0, 0, -dpr, 0, scene.size.h * dpr);
    ctx.fillStyle = DEFAULT_BACKGROUND;
    ctx.fillRect(0, 0, scene.size.w, scene.size.h);
    ctx.save();
    scene.update();
    ctx.restore();
  }
  requestAnimationFrame(frame);

  const locationOf = (e) => {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: scene.size.h - (e.clientY - r.top) };
  };

  canvas.addEventListener('pointerdown', (e) => {
    canvas.setPointerCapture(e.pointerId);
    const location = locationOf(e);
    const touch = { id: e.pointerId, location, prevLocation: location };
    scene.touches.set(e.pointerId, touch);
    if (scene.touchBegan) scene.touchBegan(touch);
  });

  canvas.addEventListener('pointermove', (e) => {
    const prev = scene.touches.get(e.pointerId);
    if (!prev) return;
    const touch = { id: e.pointerId, location: locationOf(e), prevLocation: prev.location };
    scene.touches.set(e.pointerId, touch);
    if (scene.touchMoved) scene.touchMoved(touch);
  });

  const end = (e) => {
    const prev = scene.touches.get(e.pointerId);
    if (!prev) return;
    scene.touches.delete(e.pointerId);
    const touch = { id: e.pointerId, location: locationOf(e), prevLocation: prev.location };
    if (scene.touchEnded) scene.touchEnded(touch);
  };
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', end);
}
