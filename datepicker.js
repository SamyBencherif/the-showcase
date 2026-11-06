'use strict';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Project pages are named yyyy-mm-dd[-suffix].html and listed in projects.js,
// which build-projects.js generates from the projects/ folder. Other files
// there (such as original sources) are ignored. When the exact date isn't
// known, the day, or the month and day, can be left out: yyyy-mm[-suffix].html
// or yyyy[-suffix].html.
const PROJECT_DIR = 'projects/';
const FILE_RE = /^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?(?:-(.+?))?\.html?$/i;

// Shown in place of an unknown month or day.
const UNKNOWN_MONTH = '???';
const UNKNOWN_DAY = '??';

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
const REVEAL_RATE = 12;    // how fast the suffix column slides in and out

// Layout in design units; the whole scene is scaled to fit the viewport.
const CW = 360;
const READOUT_H = 108;
const PICKER_TOP = READOUT_H + 20;
const BUTTONS_TOP = PICKER_TOP + PICKER_H + 24;
const BUTTON_H = 44;
const TOTAL_H = BUTTONS_TOP + BUTTON_H;
const BAND_INSET = 8;

// Column [x0, x1, cx] and separator positions, without and with the suffix column.
// The suffix column is left-aligned, so its cx is where its text starts.
const LAYOUT_3 = {
  cols: [[0, 140, 68], [140, 264, 202], [264, 360, 314], [360, 360, 400]],
  seps: [140, 264, 360],
};
const LAYOUT_4 = {
  cols: [[0, 88, 46], [88, 160, 124], [160, 216, 190], [216, 360, 228]],
  seps: [88, 160, 216],
};
const SUFFIX_FONT_SIZE = 19;
const SUFFIX_MAX_W = 124;

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
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const lerp = (a, b, t) => a + (b - a) * t;
const pad2 = (n) => String(n).padStart(2, '0');
const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
const unique = (values) => [...new Set(values)];

const formatMonth = (month) => (month === null ? UNKNOWN_MONTH : MONTHS[month]);
const formatDay = (day) => (day === null ? UNKNOWN_DAY : pad2(day));

function formatEntry({ year, month, day, suffix }) {
  return `${year}-${formatMonth(month)}-${formatDay(day)}${suffix ? `-${suffix}` : ''}`;
}

const weekdayOf = ({ year, month, day }) => (day === null ? '' : WEEKDAYS[new Date(year, month, day).getDay()]);

// Unknown months and days (null) sort before known ones.
const dateKey = (v) => v ?? -1;

function loadEntries(files) {
  const entries = [];
  for (const file of files) {
    const m = FILE_RE.exec(file);
    if (!m) continue;
    const year = Number(m[1]);
    const month = m[2] ? Number(m[2]) - 1 : null;
    const day = m[3] ? Number(m[3]) : null;
    if (month !== null && (month < 0 || month > 11)) continue;
    if (day !== null && (day < 1 || day > daysInMonth(year, month))) continue;
    entries.push({ year, month, day, suffix: m[4] || '', file });
  }
  const byDate = (a, b) => dateKey(a) - dateKey(b);
  const byName = (a, b) => a.localeCompare(b, undefined, { numeric: true });
  entries.sort((a, b) => a.year - b.year || byDate(a.month, b.month) || byDate(a.day, b.day) ||
    byName(a.suffix, b.suffix));
  return entries;
}

// Values of one column, given the values selected in the columns to its left.
function columnValues(level, parents) {
  const keys = ['year', 'month', 'day', 'suffix'];
  return unique(entries
    .filter((e) => parents.every((v, k) => e[keys[k]] === v))
    .map((e) => e[keys[level]]));
}

// Closest item to a value: numerically for dates, exact match for suffixes.
function nearestIndex(items, value) {
  if (typeof value === 'string') return Math.max(0, items.indexOf(value));
  const distance = (item) => Math.abs(dateKey(item) - dateKey(value));
  let best = 0;
  for (let i = 1; i < items.length; i++) {
    if (distance(items[i]) < distance(items[best])) best = i;
  }
  return best;
}

function entryNearestToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let best = null;
  let bestDiff = Infinity;
  for (const e of entries) {
    // Ties go to the later project because entries are sorted ascending.
    const diff = Math.abs(new Date(e.year, e.month ?? 0, e.day ?? 1) - today);
    if (diff <= bestDiff) {
      best = e;
      bestDiff = diff;
    }
  }
  return best;
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
  constructor({ name, format, onTick }) {
    this.name = name;
    this.format = format;
    this.onTick = onTick;
    this.items = [];
    this.itemsKey = null;
    this.x0 = 0;
    this.x1 = 0;
    this.cx = 0;
    this.alpha = 1;

    this.pos = 0;
    this.target = 0;
    this.v = 0;
    this.mode = 'idle'; // idle | drag | decay | spring
    this.lastTick = 0;
    this.samples = [];
    this.dragStart = 0;
    this.wheelAccum = 0;
    this.wheelTime = 0;
  }

  get count() { return this.items.length; }
  get max() { return Math.max(0, this.count - 1); }
  get index() { return clamp(Math.round(this.pos), 0, this.max); }
  get value() { return this.items[this.index]; }
  get moving() { return this.mode !== 'idle'; }
  label(i) { return this.format(this.items[i]); }

  // Swaps in a new item list, keeping the wheel on the same (or nearest) value.
  setItems(items) {
    const key = JSON.stringify(items);
    if (key === this.itemsKey) return;
    this.itemsKey = key;
    const old = this.items;
    this.items = items;

    const index = old.length ? nearestIndex(items, old[clamp(Math.round(this.pos), 0, old.length - 1)]) : 0;
    const shift = index - Math.round(this.pos);
    this.pos += shift;
    this.dragStart += shift;
    for (const s of this.samples) s.raw += shift;
    if (this.mode === 'spring') this.target = nearestIndex(items, old[this.target]);
    if (this.mode === 'idle') this.pos = this.target = index;
    this.lastTick = Math.round(this.pos);
  }

  jumpTo(i) {
    this.pos = this.target = this.lastTick = clamp(i, 0, this.max);
    this.v = 0;
    this.mode = 'idle';
  }

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
    if (!this.ctx || this.ctx.state !== 'running') return;
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

const entries = loadEntries(window.PROJECT_FILES || []);

const onTick = () => sound.tick();

// Columns: [year] - [month] - [day] - [suffix]; each lists only values that
// have a project, given the columns to its left.
const yearWheel = new Wheel({ name: 'year', format: String, onTick });
const monthWheel = new Wheel({ name: 'month', format: formatMonth, onTick });
const dayWheel = new Wheel({ name: 'day', format: formatDay, onTick });
const suffixWheel = new Wheel({ name: 'suffix', format: (s) => s || '—', onTick });
const wheels = [yearWheel, monthWheel, dayWheel, suffixWheel];
let separators = LAYOUT_3.seps.map((x) => ({ x, alpha: 1 }));

// 0 = three columns, 1 = suffix column fully shown.
let reveal = 0;
let revealTarget = 0;

function refreshItems() {
  for (let level = 0; level < wheels.length; level++) {
    const parents = wheels.slice(0, level).map((w) => w.value);
    wheels[level].setItems(columnValues(level, parents));
  }
}

function currentEntry() {
  const [year, month, day, suffix] = wheels.map((w) => w.value);
  return entries.find((e) => e.year === year && e.month === month && e.day === day && e.suffix === suffix);
}

function jumpToEntry(entry) {
  const values = [entry.year, entry.month, entry.day, entry.suffix];
  wheels.forEach((w, level) => {
    refreshItems();
    w.jumpTo(w.items.indexOf(values[level]));
  });
  refreshItems();
}

function openEntry() {
  const entry = currentEntry();
  if (entry) window.location.href = PROJECT_DIR + encodeURIComponent(entry.file);
}

function applyLayout(r) {
  wheels.forEach((w, i) => {
    const a = LAYOUT_3.cols[i];
    const b = LAYOUT_4.cols[i];
    w.x0 = lerp(a[0], b[0], r);
    w.x1 = lerp(a[1], b[1], r);
    w.cx = lerp(a[2], b[2], r);
  });
  suffixWheel.alpha = r;
  separators = LAYOUT_3.seps.map((x, i) => ({ x: lerp(x, LAYOUT_4.seps[i], r), alpha: i === 2 ? r : 1 }));
}

const visibleWheels = () => (revealTarget ? wheels : wheels.slice(0, 3));

const BUTTON_W = 170;
const buttons = [
  {
    label: () => 'Open',
    x: (CW - BUTTON_W) / 2, y: BUTTONS_TOP, w: BUTTON_W, h: BUTTON_H,
    action: openEntry,
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
const wheelAt = (p) => (entries.length && inPicker(p)
  ? visibleWheels().find((w) => p.x >= w.x0 && p.x <= w.x1)
  : null);
const buttonAt = (p) => (entries.length
  ? buttons.find((b) => p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h)
  : null);

// ---------------------------------------------------------------------------
// Drawing
// ---------------------------------------------------------------------------

function draw() {
  ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
  ctx.fillStyle = theme.bg;
  ctx.fillRect(0, 0, view.w, view.h);
  ctx.translate(view.ox, view.oy);
  ctx.scale(view.scale, view.scale);

  if (!entries.length) {
    drawEmpty();
    return;
  }
  drawReadout();
  drawPicker();
  drawButtons();
}

function drawEmpty() {
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = theme.text;
  ctx.font = `700 32px ${FONT}`;
  ctx.fillText('No projects', CW / 2, TOTAL_H / 2 - 40);
  ctx.fillStyle = theme.secondary;
  ctx.font = `400 16px ${FONT}`;
  ctx.fillText('Add files named yyyy-mm-dd[-suffix].html', CW / 2, TOTAL_H / 2 + 4);
  ctx.fillText('to projects/, then run', CW / 2, TOTAL_H / 2 + 28);
  ctx.font = `500 16px ui-monospace, Menlo, Consolas, monospace`;
  ctx.fillText('node build-projects.js', CW / 2, TOTAL_H / 2 + 56);
}

function drawReadout() {
  const entry = currentEntry();
  if (!entry) return;

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.fillStyle = theme.secondary;
  ctx.font = `600 13px ${FONT}`;
  ctx.fillText('SELECTED PROJECT', CW / 2, 14);

  ctx.fillStyle = theme.text;
  ctx.font = `700 44px ${FONT}`;
  ctx.fillText(formatEntry({ ...entry, suffix: '' }), CW / 2, 56);

  ctx.fillStyle = theme.secondary;
  ctx.font = `400 17px ${FONT}`;
  const detail = [weekdayOf(entry), entry.suffix].filter(Boolean).join(' · ');
  ctx.fillText(fitText(detail, CW), CW / 2, 94);
}

// Shortens text with an ellipsis to fit maxW at the current font.
function fitText(text, maxW) {
  if (ctx.measureText(text).width <= maxW) return text;
  let lo = 0;
  let hi = text.length;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (ctx.measureText(`${text.slice(0, mid)}…`).width <= maxW) lo = mid;
    else hi = mid - 1;
  }
  return `${text.slice(0, lo)}…`;
}

function drawPicker() {
  const top = PICKER_TOP;
  const cy = top + PICKER_H / 2;
  const band = { x: BAND_INSET, y: cy - ROW_H / 2, w: CW - BAND_INSET * 2, h: ROW_H };

  // Card
  ctx.fillStyle = theme.card;
  roundRect(ctx, 0, top, CW, PICKER_H, 16);
  ctx.fill();

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
  ctx.font = `500 23px ${FONT}`;
  for (const s of separators) {
    ctx.globalAlpha = s.alpha;
    ctx.fillText('-', s.x, cy - 1);
  }
  ctx.globalAlpha = 1;
  ctx.restore();

  if (keyboardFocus) {
    const w = visibleWheels()[focusCol];
    ctx.strokeStyle = theme.accent;
    ctx.lineWidth = 2;
    const x0 = Math.max(w.x0, band.x) + 4;
    const x1 = Math.min(w.x1, band.x + band.w) - 4;
    roundRect(ctx, x0, band.y + 1, x1 - x0, band.h - 2, 8);
    ctx.stroke();
  }
}

function drawWheelRows(w, cy, alphaFor) {
  if (w.alpha <= 0.01) return;
  const isSuffix = w === suffixWheel;
  ctx.save();
  if (isSuffix) {
    ctx.font = `400 ${SUFFIX_FONT_SIZE}px ${FONT}`;
    ctx.textAlign = 'left';
  }
  const from = Math.max(0, Math.floor(w.pos - 5));
  const to = Math.min(w.max, Math.ceil(w.pos + 5));
  for (let i = from; i <= to; i++) {
    const angle = (i - w.pos) * ROW_STEP;
    if (Math.abs(angle) >= Math.PI / 2) continue;
    const c = Math.cos(angle);
    ctx.globalAlpha = alphaFor(c) * w.alpha;
    ctx.save();
    ctx.translate(w.cx, cy + RADIUS * Math.sin(angle));
    ctx.scale(1, c);
    const text = isSuffix ? fitText(w.label(i), SUFFIX_MAX_W) : w.label(i);
    ctx.fillText(text, 0, 0);
    ctx.restore();
  }
  ctx.restore();
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
  focusCol = visibleWheels().indexOf(w);
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
  focusCol = visibleWheels().indexOf(w);
  w.scrollBy(dy, e.timeStamp);
  dirty = true;
}, { passive: false });

canvas.addEventListener('keydown', (e) => {
  if (!entries.length) return;
  sound.unlock();
  const cols = visibleWheels();
  focusCol = Math.min(focusCol, cols.length - 1);
  const w = cols[focusCol];
  const base = w.mode === 'spring' ? w.target : w.index;
  const spin = (i) => w.springTo(i);
  let handled = true;
  switch (e.key) {
    case 'ArrowUp': spin(base - 1); break;
    case 'ArrowDown': spin(base + 1); break;
    case 'PageUp': spin(base - 5); break;
    case 'PageDown': spin(base + 5); break;
    case 'Home': spin(0); break;
    case 'End': spin(w.max); break;
    case 'ArrowLeft': focusCol = (focusCol + cols.length - 1) % cols.length; break;
    case 'ArrowRight': focusCol = (focusCol + 1) % cols.length; break;
    case 'Enter': openEntry(); break;
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
  const entry = currentEntry();
  if (!entry) return;
  const text = formatEntry(entry);
  if (text === committed) return;
  committed = text;
  history.replaceState(null, '', `#${text}`);
  document.title = `${text} · Projects`;
  live.textContent = [text, weekdayOf(entry)].filter(Boolean).join(', ');
  canvas.dispatchEvent(new CustomEvent('datechange', { detail: { ...entry, text } }));
}

let lastFrame = performance.now();
function frame(t) {
  const dt = Math.min((t - lastFrame) / 1000, 1 / 30);
  lastFrame = t;

  for (const w of wheels) {
    if (w.step(dt)) dirty = true;
  }
  refreshItems();

  // Only show or hide the suffix column once the date has settled, so it
  // doesn't flicker in and out while flicking past dates.
  const dateSettled = !yearWheel.moving && !monthWheel.moving && !dayWheel.moving;
  if (dateSettled) revealTarget = suffixWheel.count > 1 ? 1 : 0;
  if (Math.abs(reveal - revealTarget) > 0.001) {
    reveal += (revealTarget - reveal) * (1 - Math.exp(-REVEAL_RATE * dt));
    if (Math.abs(reveal - revealTarget) <= 0.001) reveal = revealTarget;
    applyLayout(reveal);
    dirty = true;
  }

  if (wheels.every((w) => !w.moving)) commit();

  if (dirty) {
    draw();
    dirty = false;
  }
  requestAnimationFrame(frame);
}

if (entries.length) {
  const hash = decodeURIComponent(location.hash.slice(1)).toUpperCase();
  const start = entries.find((e) => formatEntry(e).toUpperCase() === hash) || entryNearestToday();
  jumpToEntry(start);
  revealTarget = reveal = suffixWheel.count > 1 ? 1 : 0;
}
applyLayout(reveal);
resize();
draw();
requestAnimationFrame(frame);
canvas.focus({ preventScroll: true });
