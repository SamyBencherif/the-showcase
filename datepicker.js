'use strict';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const YEAR_MIN = 1900;
const YEAR_MAX = 2100;

const FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", ' +
  '"Helvetica Neue", "Segoe UI", Roboto, Inter, system-ui, sans-serif';

// Wheel geometry: rows sit on a cylinder, ROW_STEP radians apart.
const ROW_H = 40;
const ROW_STEP = 20 * Math.PI / 180;
const RADIUS = ROW_H / ROW_STEP;
const PICKER_H = Math.ceil(RADIUS * 2) + 2;

// Physics (units are rows and seconds).
const FRICTION = 3;        // exponential velocity decay rate during a flick
const SNAP_SPEED = 2;      // below this speed a flick hands over to the snap spring
const SPRING_W = 16;       // natural frequency of the critically damped snap spring
const MAX_SPEED = 45;
const RUBBER_LIMIT = 1.5;  // max rows you can pull past either end

// Layout in design units; the whole scene is scaled to fit the viewport.
const CW = 360;
const READOUT_H = 108;
const PICKER_TOP = READOUT_H + 20;
const BUTTONS_TOP = PICKER_TOP + PICKER_H + 24;
const BUTTON_H = 44;
const TOTAL_H = BUTTONS_TOP + BUTTON_H;
const BAND_INSET = 8;

const THEMES = {
  light: {
    bg: '#f2f2f7',
    card: '#ffffff',
    text: '#000000',
    secondary: 'rgba(60, 60, 67, 0.6)',
    band: 'rgba(118, 118, 128, 0.12)',
    accent: '#007aff',
    buttonBg: 'rgba(0, 122, 255, 0.10)',
    buttonBgActive: 'rgba(0, 122, 255, 0.22)',
    shadow: 'rgba(0, 0, 0, 0.08)',
  },
  dark: {
    bg: '#000000',
    card: '#1c1c1e',
    text: '#ffffff',
    secondary: 'rgba(235, 235, 245, 0.6)',
    band: 'rgba(118, 118, 128, 0.24)',
    accent: '#0a84ff',
    buttonBg: 'rgba(10, 132, 255, 0.18)',
    buttonBgActive: 'rgba(10, 132, 255, 0.32)',
    shadow: 'rgba(0, 0, 0, 0)',
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const pad2 = (n) => String(n).padStart(2, '0');
const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();

function formatDate({ year, month, day }) {
  return `${year}-${MONTHS[month]}-${pad2(day)}`;
}

function parseDate(text) {
  const m = /^(\d{4})-([A-Za-z]{3})-(\d{1,2})$/.exec(text.trim());
  if (!m) return null;
  const year = Number(m[1]);
  const month = MONTHS.indexOf(m[2].toUpperCase());
  const day = Number(m[3]);
  if (year < YEAR_MIN || year > YEAR_MAX || month < 0) return null;
  if (day < 1 || day > daysInMonth(year, month)) return null;
  return { year, month, day };
}

// Resistance past the ends: approaches RUBBER_LIMIT asymptotically.
function rubber(raw, max) {
  if (raw < 0) {
    const o = -raw;
    return -(o * RUBBER_LIMIT) / (o + RUBBER_LIMIT);
  }
  if (raw > max) {
    const o = raw - max;
    return max + (o * RUBBER_LIMIT) / (o + RUBBER_LIMIT);
  }
  return raw;
}

function roundRect(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// ---------------------------------------------------------------------------
// Wheel: one spinning column with drag, flick momentum and snap-to-row
// ---------------------------------------------------------------------------

class Wheel {
  constructor({ name, count, label, maxValid, x0, x1, cx, initial, onTick }) {
    this.name = name;
    this.count = count;
    this.label = label;
    this.maxValid = maxValid || (() => count - 1);
    this.x0 = x0;
    this.x1 = x1;
    this.cx = cx;
    this.onTick = onTick;

    this.pos = initial;
    this.target = initial;
    this.v = 0;
    this.mode = 'idle'; // idle | drag | decay | spring
    this.lastTick = initial;
    this.samples = [];
    this.wheelAccum = 0;
    this.wheelTime = 0;
  }

  get max() { return this.count - 1; }
  get index() { return clamp(Math.round(this.pos), 0, this.max); }
  get moving() { return this.mode !== 'idle'; }
  isValid(i) { return i <= this.maxValid(); }

  springTo(i) {
    this.target = clamp(Math.round(i), 0, this.max);
    this.mode = 'spring';
  }

  beginDrag(y, t) {
    this.wasMoving = this.mode !== 'idle' && Math.abs(this.v) > 1;
    this.mode = 'drag';
    this.v = 0;
    this.dragY = y;
    this.dragStart = this.pos;
    this.samples = [{ t, raw: this.pos }];
  }

  moveDrag(y, t) {
    const raw = this.dragStart - (y - this.dragY) / ROW_H;
    this.pos = rubber(raw, this.max);
    this.samples.push({ t, raw });
    while (this.samples.length > 2 && t - this.samples[0].t > 100) this.samples.shift();
    this.checkTick();
  }

  endDrag(t) {
    const first = this.samples[0];
    const last = this.samples[this.samples.length - 1];
    let v = 0;
    // A finger that came to rest before lifting shouldn't fling the wheel.
    if (last.t - first.t > 0 && t - last.t < 60) {
      v = (last.raw - first.raw) / ((last.t - first.t) / 1000);
    }
    this.v = clamp(v, -MAX_SPEED, MAX_SPEED);
    if (this.pos < 0 || this.pos > this.max) this.springTo(this.pos);
    else this.mode = 'decay';
  }

  // Mouse wheel / trackpad scrolling, measured in pixels.
  scrollBy(dy, now) {
    if (now - this.wheelTime > 200) this.wheelAccum = 0;
    this.wheelTime = now;
    this.wheelAccum += dy;
    // Discrete mouse notches arrive as large deltas: one notch = one row.
    const unit = Math.abs(dy) >= 50 ? Math.abs(dy) : ROW_H;
    const steps = Math.trunc(this.wheelAccum / unit);
    if (!steps) return;
    this.wheelAccum -= steps * unit;
    const base = this.mode === 'spring' ? this.target : Math.round(this.pos);
    this.springTo(base + steps);
  }

  // Advances the simulation; returns true while the wheel needs redrawing.
  step(dt) {
    if (this.mode === 'idle') return false;
    if (this.mode === 'drag') return true;

    let remaining = dt;
    while (remaining > 0 && this.mode !== 'idle') {
      const h = Math.min(remaining, 1 / 240);
      remaining -= h;

      if (this.mode === 'decay') {
        this.v *= Math.exp(-FRICTION * h);
        this.pos += this.v * h;
        if (this.pos < 0 || this.pos > this.max) {
          this.springTo(this.pos);
        } else if (Math.abs(this.v) < SNAP_SPEED) {
          this.springTo(this.pos + this.v * 0.1);
        }
      } else {
        const x = this.pos - this.target;
        const a = -SPRING_W * SPRING_W * x - 2 * SPRING_W * this.v;
        this.v += a * h;
        this.pos += this.v * h;
        if (Math.abs(this.pos - this.target) < 5e-4 && Math.abs(this.v) < 5e-3) {
          this.pos = this.target;
          this.v = 0;
          this.mode = 'idle';
        }
      }
    }
    this.checkTick();
    return true;
  }

  checkTick() {
    const i = Math.round(this.pos);
    if (i !== this.lastTick && i >= 0 && i <= this.max) {
      this.lastTick = i;
      this.onTick();
    }
  }
}

// ---------------------------------------------------------------------------
// Sound: a soft "tick" like the iOS picker detent
// ---------------------------------------------------------------------------

const sound = {
  enabled: true,
  ctx: null,
  buffer: null,
  lastAt: 0,

  unlock() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    const len = Math.floor(this.ctx.sampleRate * 0.012);
    this.buffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = this.buffer.getChannelData(0);
    for (let i = 0; i < len; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 4);
    }
  },

  tick() {
    if (!this.enabled || !this.ctx || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;
    if (now - this.lastAt < 0.03) return;
    this.lastAt = now;
    const src = this.ctx.createBufferSource();
    src.buffer = this.buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 3200;
    filter.Q.value = 1.2;
    const gain = this.ctx.createGain();
    gain.gain.value = 0.35;
    src.connect(filter).connect(gain).connect(this.ctx.destination);
    src.start(now);
  },
};

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

const canvas = document.getElementById('picker');
const live = document.getElementById('live');
const ctx = canvas.getContext('2d');

const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
let theme = darkQuery.matches ? THEMES.dark : THEMES.light;
darkQuery.addEventListener('change', (e) => {
  theme = e.matches ? THEMES.dark : THEMES.light;
  dirty = true;
});

const now = new Date();
const initial = parseDate(decodeURIComponent(location.hash.slice(1))) ||
  { year: clamp(now.getFullYear(), YEAR_MIN, YEAR_MAX), month: now.getMonth(), day: now.getDate() };

const onTick = () => sound.tick();

// Column layout inside the card: [year] - [month] - [day]
const yearWheel = new Wheel({
  name: 'year',
  count: YEAR_MAX - YEAR_MIN + 1,
  label: (i) => String(YEAR_MIN + i),
  x0: 0, x1: 140, cx: 68,
  initial: initial.year - YEAR_MIN,
  onTick,
});
const monthWheel = new Wheel({
  name: 'month',
  count: 12,
  label: (i) => MONTHS[i],
  x0: 140, x1: 264, cx: 202,
  initial: initial.month,
  onTick,
});
const dayWheel = new Wheel({
  name: 'day',
  count: 31,
  label: (i) => pad2(i + 1),
  maxValid: () => daysInMonth(YEAR_MIN + yearWheel.index, monthWheel.index) - 1,
  x0: 264, x1: CW, cx: 314,
  initial: initial.day - 1,
  onTick,
});
const wheels = [yearWheel, monthWheel, dayWheel];
const SEPARATORS_X = [140, 264];

function currentValue() {
  const year = YEAR_MIN + yearWheel.index;
  const month = monthWheel.index;
  const day = Math.min(dayWheel.index + 1, daysInMonth(year, month));
  return { year, month, day };
}

function setValue({ year, month, day }) {
  yearWheel.springTo(year - YEAR_MIN);
  monthWheel.springTo(month);
  dayWheel.springTo(day - 1);
}

const buttons = [
  {
    label: () => 'Today',
    x: 0, y: BUTTONS_TOP, w: 170, h: BUTTON_H,
    action: () => {
      const d = new Date();
      setValue({ year: clamp(d.getFullYear(), YEAR_MIN, YEAR_MAX), month: d.getMonth(), day: d.getDate() });
    },
  },
  {
    label: () => (sound.enabled ? 'Sound: On' : 'Sound: Off'),
    x: CW - 170, y: BUTTONS_TOP, w: 170, h: BUTTON_H,
    action: () => {
      sound.enabled = !sound.enabled;
      if (sound.enabled) sound.tick();
    },
  },
];

// View transform from design units to CSS pixels.
const view = { w: 0, h: 0, dpr: 1, scale: 1, ox: 0, oy: 0 };
let dirty = true;
let focusCol = 0;
let keyboardFocus = false;
let hoverButton = null;
let pressedButton = null;
let drag = null;
let committed = '';

function resize() {
  view.dpr = window.devicePixelRatio || 1;
  view.w = canvas.clientWidth;
  view.h = canvas.clientHeight;
  canvas.width = Math.round(view.w * view.dpr);
  canvas.height = Math.round(view.h * view.dpr);
  view.scale = Math.min(1.3, (view.w - 32) / CW, (view.h - 32) / TOTAL_H);
  view.ox = (view.w - CW * view.scale) / 2;
  view.oy = (view.h - TOTAL_H * view.scale) / 2;
  dirty = true;
}

function toLocal(e) {
  const r = canvas.getBoundingClientRect();
  return {
    x: (e.clientX - r.left - view.ox) / view.scale,
    y: (e.clientY - r.top - view.oy) / view.scale,
  };
}

const inPicker = (p) => p.x >= 0 && p.x <= CW && p.y >= PICKER_TOP && p.y <= PICKER_TOP + PICKER_H;
const wheelAt = (p) => (inPicker(p) ? wheels.find((w) => p.x >= w.x0 && p.x <= w.x1) : null);
const buttonAt = (p) => buttons.find((b) => p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h);

// ---------------------------------------------------------------------------
// Drawing
// ---------------------------------------------------------------------------

function draw() {
  ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
  ctx.fillStyle = theme.bg;
  ctx.fillRect(0, 0, view.w, view.h);
  ctx.translate(view.ox, view.oy);
  ctx.scale(view.scale, view.scale);

  drawReadout();
  drawPicker();
  drawButtons();
}

function drawReadout() {
  const value = currentValue();
  const weekday = WEEKDAYS[new Date(value.year, value.month, value.day).getDay()];

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.fillStyle = theme.secondary;
  ctx.font = `600 13px ${FONT}`;
  ctx.fillText('SELECTED DATE', CW / 2, 14);

  ctx.fillStyle = theme.text;
  ctx.font = `700 44px ${FONT}`;
  ctx.fillText(formatDate(value), CW / 2, 56);

  ctx.fillStyle = theme.secondary;
  ctx.font = `400 17px ${FONT}`;
  ctx.fillText(weekday, CW / 2, 94);
}

function drawPicker() {
  const top = PICKER_TOP;
  const cy = top + PICKER_H / 2;
  const band = { x: BAND_INSET, y: cy - ROW_H / 2, w: CW - BAND_INSET * 2, h: ROW_H };

  // Card
  ctx.save();
  ctx.shadowColor = theme.shadow;
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 6;
  ctx.fillStyle = theme.card;
  roundRect(ctx, 0, top, CW, PICKER_H, 16);
  ctx.fill();
  ctx.restore();

  // Selection band
  ctx.fillStyle = theme.band;
  roundRect(ctx, band.x, band.y, band.w, band.h, 9);
  ctx.fill();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `400 23px ${FONT}`;

  // Pass 1: rows outside the band, faded with their tilt on the cylinder.
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, top, CW, PICKER_H);
  ctx.rect(band.x, band.y, band.w, band.h);
  ctx.clip('evenodd');
  ctx.fillStyle = theme.text;
  for (const w of wheels) drawWheelRows(w, cy, (c) => 0.7 * Math.pow(c, 1.5));
  ctx.restore();

  // Pass 2: rows inside the band, at full strength.
  ctx.save();
  ctx.beginPath();
  ctx.rect(band.x, band.y, band.w, band.h);
  ctx.clip();
  ctx.fillStyle = theme.text;
  for (const w of wheels) drawWheelRows(w, cy, () => 1);
  ctx.globalAlpha = 1;
  ctx.font = `500 23px ${FONT}`;
  for (const x of SEPARATORS_X) ctx.fillText('-', x, cy - 1);
  ctx.restore();

  if (keyboardFocus) {
    const w = wheels[focusCol];
    ctx.strokeStyle = theme.accent;
    ctx.lineWidth = 2;
    const x0 = Math.max(w.x0, band.x) + 4;
    const x1 = Math.min(w.x1, band.x + band.w) - 4;
    roundRect(ctx, x0, band.y + 1, x1 - x0, band.h - 2, 8);
    ctx.stroke();
  }
}

function drawWheelRows(w, cy, alphaFor) {
  const from = Math.max(0, Math.floor(w.pos - 5));
  const to = Math.min(w.max, Math.ceil(w.pos + 5));
  for (let i = from; i <= to; i++) {
    const angle = (i - w.pos) * ROW_STEP;
    if (Math.abs(angle) >= Math.PI / 2) continue;
    const c = Math.cos(angle);
    ctx.globalAlpha = alphaFor(c) * (w.isValid(i) ? 1 : 0.3);
    ctx.save();
    ctx.translate(w.cx, cy + RADIUS * Math.sin(angle));
    ctx.scale(1, c);
    ctx.fillText(w.label(i), 0, 0);
    ctx.restore();
  }
  ctx.globalAlpha = 1;
}

function drawButtons() {
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `600 17px ${FONT}`;
  for (const b of buttons) {
    const active = b === pressedButton && b === hoverButton;
    ctx.fillStyle = active ? theme.buttonBgActive : theme.buttonBg;
    roundRect(ctx, b.x, b.y, b.w, b.h, b.h / 2);
    ctx.fill();
    ctx.fillStyle = theme.accent;
    ctx.fillText(b.label(), b.x + b.w / 2, b.y + b.h / 2 + 1);
  }
}

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------

function updateCursor(p) {
  if (drag) canvas.style.cursor = 'grabbing';
  else if (buttonAt(p)) canvas.style.cursor = 'pointer';
  else if (wheelAt(p)) canvas.style.cursor = 'grab';
  else canvas.style.cursor = 'default';
}

canvas.addEventListener('pointerdown', (e) => {
  if (e.button !== 0) return;
  sound.unlock();
  keyboardFocus = false;
  canvas.focus({ preventScroll: true });
  const p = toLocal(e);

  const b = buttonAt(p);
  if (b) {
    pressedButton = hoverButton = b;
    canvas.setPointerCapture(e.pointerId);
    dirty = true;
    return;
  }

  const w = wheelAt(p);
  if (!w) return;
  focusCol = wheels.indexOf(w);
  w.beginDrag(p.y, e.timeStamp);
  drag = { wheel: w, id: e.pointerId, x: p.x, y: p.y, t: e.timeStamp, moved: 0 };
  canvas.setPointerCapture(e.pointerId);
  updateCursor(p);
  dirty = true;
});

canvas.addEventListener('pointermove', (e) => {
  const p = toLocal(e);
  if (drag && e.pointerId === drag.id) {
    drag.moved = Math.max(drag.moved, Math.hypot(p.x - drag.x, p.y - drag.y));
    drag.wheel.moveDrag(p.y, e.timeStamp);
    dirty = true;
    return;
  }
  const hb = buttonAt(p) || null;
  if (hb !== hoverButton) {
    hoverButton = hb;
    dirty = true;
  }
  updateCursor(p);
});

function endPointer(e, cancelled) {
  const p = toLocal(e);
  if (pressedButton) {
    if (!cancelled && buttonAt(p) === pressedButton) pressedButton.action();
    pressedButton = null;
    hoverButton = cancelled ? null : buttonAt(p) || null;
    dirty = true;
    return;
  }
  if (!drag || e.pointerId !== drag.id) return;
  const w = drag.wheel;
  w.endDrag(e.timeStamp);
  const isTap = !cancelled && drag.moved < 6 && e.timeStamp - drag.t < 350;
  if (isTap) {
    if (w.wasMoving) {
      // Touching a spinning wheel just stops it.
      w.springTo(w.pos);
    } else {
      const cy = PICKER_TOP + PICKER_H / 2;
      const s = clamp((p.y - cy) / RADIUS, -0.99, 0.99);
      w.springTo(w.pos + Math.asin(s) / ROW_STEP);
    }
  }
  drag = null;
  updateCursor(p);
  dirty = true;
}

canvas.addEventListener('pointerup', (e) => endPointer(e, false));
canvas.addEventListener('pointercancel', (e) => endPointer(e, true));
canvas.addEventListener('pointerleave', () => {
  if (hoverButton && !pressedButton) {
    hoverButton = null;
    dirty = true;
  }
});

canvas.addEventListener('wheel', (e) => {
  const p = toLocal(e);
  const w = wheelAt(p);
  if (!w || (drag && drag.wheel === w)) return;
  e.preventDefault();
  let dy = e.deltaY;
  if (e.deltaMode === 1) dy *= 16;
  else if (e.deltaMode === 2) dy *= PICKER_H;
  focusCol = wheels.indexOf(w);
  w.scrollBy(dy, e.timeStamp);
  dirty = true;
}, { passive: false });

canvas.addEventListener('keydown', (e) => {
  sound.unlock();
  const w = wheels[focusCol];
  const base = w.mode === 'spring' ? w.target : w.index;
  let handled = true;
  switch (e.key) {
    case 'ArrowUp': w.springTo(base - 1); break;
    case 'ArrowDown': w.springTo(base + 1); break;
    case 'PageUp': w.springTo(base - 5); break;
    case 'PageDown': w.springTo(base + 5); break;
    case 'Home': w.springTo(0); break;
    case 'End': w.springTo(w === dayWheel ? w.maxValid() : w.max); break;
    case 'ArrowLeft': focusCol = (focusCol + 2) % 3; break;
    case 'ArrowRight': focusCol = (focusCol + 1) % 3; break;
    case 't': case 'T': buttons[0].action(); break;
    case 'm': case 'M': buttons[1].action(); break;
    default: handled = false;
  }
  if (handled) {
    e.preventDefault();
    keyboardFocus = true;
    dirty = true;
  }
});

canvas.addEventListener('blur', () => {
  keyboardFocus = false;
  dirty = true;
});

window.addEventListener('resize', resize);

// ---------------------------------------------------------------------------
// Main loop
// ---------------------------------------------------------------------------

function commit() {
  const value = currentValue();
  const text = formatDate(value);
  if (text === committed) return;
  committed = text;
  history.replaceState(null, '', `#${text}`);
  document.title = `${text} · Date Selector`;
  live.textContent = `${text}, ${WEEKDAYS[new Date(value.year, value.month, value.day).getDay()]}`;
  canvas.dispatchEvent(new CustomEvent('datechange', { detail: { ...value, text } }));
}

let lastFrame = performance.now();
function frame(t) {
  const dt = Math.min((t - lastFrame) / 1000, 1 / 30);
  lastFrame = t;

  for (const w of wheels) {
    if (w.step(dt)) dirty = true;
  }

  // Like iOS: once year and month settle, roll an impossible day (e.g. FEB-31) back.
  if (!yearWheel.moving && !monthWheel.moving && !dayWheel.moving &&
      dayWheel.index > dayWheel.maxValid()) {
    dayWheel.springTo(dayWheel.maxValid());
  }

  if (wheels.every((w) => !w.moving)) commit();

  if (dirty) {
    draw();
    dirty = false;
  }
  requestAnimationFrame(frame);
}

resize();
draw();
requestAnimationFrame(frame);
canvas.focus({ preventScroll: true });
