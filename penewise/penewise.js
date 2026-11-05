/* penEwise live dashboard: Web Bluetooth, no dependencies. */
"use strict";

const UUID = (n) => `8ec9${n.toString(16).padStart(4, "0")}-f315-4f60-9fb8-838830daea50`;
const DEVICE_NAME = "penEwise";
const SERVICE_UUID = UUID(0x0001), DATA_UUID = UUID(0x0002), RATE_UUID = UUID(0x0003),
      TOUCH_UUID = UUID(0x0004), BATTERY_SERVICE_UUID = UUID(0x0010), BATTERY_UUID = UUID(0x0011),
      DEBUG_SERVICE_UUID = UUID(0x0020), SLEEP_UUID = UUID(0x0021);
const PACKET_SIZE = 20, BATTERY_PACKET_SIZE = 5;
const MAX_LOG = 600000;          // ~2.7 h at 50 Hz
const COLORS = ["#41a5ff", "#43d17b", "#ff657a"];
const BF = { PRESENT: 1, ABSENT: 2, AMBIGUOUS: 4, CHARGING: 8, COMPLETE: 16, FAULT: 32 };

const $ = (id) => document.getElementById(id);

/* ---------- state ---------- */
const st = {
  device: null, server: null, chars: {},
  paused: false, windowSec: 10, touch: 0, calibrating: false,
  log: [], count: 0, lost: 0, lastSeq: null, rateTimes: [],
  show: { accel: [true, true, true], gyro: [true, true, true] },
};

/* ---------- plots ---------- */
class Plot {
  constructor(canvas, kind) {
    this.canvas = canvas; this.ctx = canvas.getContext("2d");
    this.kind = kind; this.pts = []; this.hover = null;
    canvas.addEventListener("mousemove", (e) => { this.hover = e.offsetX; });
    canvas.addEventListener("mouseleave", () => { this.hover = null; });
  }
  add(t, a, b, c) {
    this.pts.push([t, a, b, c]);
    const cutoff = t - 61000;
    let drop = 0;
    while (drop < this.pts.length && this.pts[drop][0] < cutoff) drop++;
    if (drop) this.pts.splice(0, drop);
  }
  clear() { this.pts = []; }
  static niceStep(range, n) {
    const raw = range / n, mag = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / mag;
    return (f < 1.5 ? 1 : f < 3.5 ? 2 : f < 7.5 ? 5 : 10) * mag;
  }
  draw(now) {
    const c = this.canvas, dpr = window.devicePixelRatio || 1;
    const w = c.clientWidth, h = c.clientHeight;
    if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) {
      c.width = Math.round(w * dpr); c.height = Math.round(h * dpr);
    }
    const g = this.ctx; g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, w, h);
    const L = 62, T = 10, R = 12, B = 22, pw = w - L - R, ph = h - T - B;
    const win = st.windowSec * 1000, t0 = now - win;
    const vis = this.pts.filter((p) => p[0] >= t0);
    const axes = [0, 1, 2].filter((i) => st.show[this.kind][i]);

    let lo = Infinity, hi = -Infinity;
    for (const p of vis) for (const a of axes) { lo = Math.min(lo, p[a + 1]); hi = Math.max(hi, p[a + 1]); }
    if (!isFinite(lo)) { lo = -1; hi = 1; }
    if (hi - lo < 10) { const m = (hi + lo) / 2; lo = m - 5; hi = m + 5; }
    const pad = (hi - lo) * 0.08; lo -= pad; hi += pad;
    const step = Plot.niceStep(hi - lo, 4);
    const yOf = (v) => T + ph - ((v - lo) / (hi - lo)) * ph;
    const xOf = (t) => L + ((t - t0) / win) * pw;

    g.font = "11px ui-monospace, Consolas, monospace";
    g.textBaseline = "middle"; g.textAlign = "right";
    g.lineWidth = 1;
    for (let v = Math.ceil(lo / step) * step; v <= hi; v += step) {
      const y = Math.round(yOf(v)) + 0.5;
      g.strokeStyle = Math.abs(v) < step / 1e3 ? "#3b4a62" : "#1c2535";
      g.beginPath(); g.moveTo(L, y); g.lineTo(L + pw, y); g.stroke();
      g.fillStyle = "#8493a7"; g.fillText(String(Math.round(v * 100) / 100), L - 6, y);
    }
    g.textAlign = "center"; g.textBaseline = "top";
    const tstep = st.windowSec <= 10 ? 1 : st.windowSec <= 30 ? 5 : 10;
    for (let s = 0; s <= st.windowSec; s += tstep) {
      const x = L + pw - (s / st.windowSec) * pw;
      g.fillStyle = "#8493a7"; g.fillText(s === 0 ? "now" : `-${s}s`, x, T + ph + 5);
    }

    if (!vis.length) {
      g.fillStyle = "#78879a"; g.textBaseline = "middle";
      g.fillText("Waiting for samples", L + pw / 2, T + ph / 2);
      return;
    }
    g.save(); g.beginPath(); g.rect(L, T, pw, ph); g.clip();
    g.lineWidth = 1.6; g.lineJoin = "round";
    for (const a of axes) {
      g.strokeStyle = COLORS[a]; g.beginPath();
      vis.forEach((p, i) => { const x = xOf(p[0]), y = yOf(p[a + 1]); i ? g.lineTo(x, y) : g.moveTo(x, y); });
      g.stroke();
    }
    g.restore();

    if (this.hover !== null && this.hover >= L && this.hover <= L + pw) {
      const t = t0 + ((this.hover - L) / pw) * win;
      let best = vis[0];
      for (const p of vis) if (Math.abs(p[0] - t) < Math.abs(best[0] - t)) best = p;
      const x = Math.round(xOf(best[0])) + 0.5;
      g.strokeStyle = "#8493a7"; g.setLineDash([3, 3]);
      g.beginPath(); g.moveTo(x, T); g.lineTo(x, T + ph); g.stroke(); g.setLineDash([]);
      const text = axes.map((a) => `${"XYZ"[a]} ${best[a + 1]}`).join("   ");
      g.font = "12px ui-monospace, Consolas, monospace";
      const tw = g.measureText(text).width + 12, bx = Math.min(x + 8, L + pw - tw);
      g.fillStyle = "rgba(10,15,22,.92)"; g.fillRect(bx, T + 4, tw, 20);
      g.fillStyle = "#dce6f2"; g.textAlign = "left"; g.textBaseline = "middle";
      g.fillText(text, bx + 6, T + 14);
    }
  }
}

const plots = {
  accel: new Plot($("accelCanvas"), "accel"),
  gyro: new Plot($("gyroCanvas"), "gyro"),
};

/* ---------- UI helpers ---------- */
function setStatus(text, connected) {
  const s = $("status"); s.textContent = text; s.classList.toggle("ok", !!connected);
  const b = $("connect"); b.textContent = connected ? "Disconnect" : "Connect";
  b.classList.toggle("on", !!connected); b.disabled = false;
  $("applyRate").disabled = !connected;
}
function pill(el, text, cls) { el.textContent = text; el.className = "pill" + (cls ? " " + cls : ""); }

const rateSel = $("rate");
[1, 5, 10, 20, 25, 50, 100].forEach((r) => rateSel.add(new Option(r, r)));
rateSel.value = "50";

const keysBox = $("keys");
const keyEls = {};
for (let k = 2; k <= 5; k++) {
  const e = document.createElement("span"); e.className = "pill"; e.textContent = `Key ${k}`;
  keysBox.appendChild(e); keyEls[k] = e;
}

function onTouch(state) {
  st.calibrating = !!(state & 1); st.touch = state & 0x3c;
  pill($("calib"), st.calibrating ? "Calibrating · data paused" : "Calibrated · streaming",
       st.calibrating ? "warn" : "on");
  for (const k in keyEls) keyEls[k].className = "pill" + (st.touch & (1 << k) ? " on" : "");
}

function clearBattery() {
  $("batV").textContent = "—"; $("batPct").textContent = ""; $("batBar").style.width = "0";
  pill($("batState"), "unknown"); pill($("batS1"), "STAT1 —"); pill($("batS2"), "STAT2 —");
  $("batRaw").textContent = "—";
}

function onBattery(dv) {
  if (dv.byteLength !== BATTERY_PACKET_SIZE) return;
  const mv = dv.getUint16(0, true), level = dv.getUint8(2), flags = dv.getUint8(3), stat = dv.getUint8(4);
  $("batV").textContent = (mv / 1000).toFixed(3) + " V";
  const hasLevel = level !== 0xff;
  $("batPct").textContent = hasLevel ? level + " %" : "";
  const bar = $("batBar");
  bar.style.width = (hasLevel ? level : 0) + "%";
  bar.style.background = level < 15 ? "var(--bad)" : level < 35 ? "var(--warn)" : "var(--good)";
  let text, cls = "";
  if (flags & BF.ABSENT) { text = "No battery detected"; cls = "bad"; }
  else if (flags & BF.FAULT) { text = "Charger fault"; cls = "bad"; }
  else if (flags & BF.CHARGING) { text = "Charging"; cls = "on"; }
  else if (flags & BF.COMPLETE) { text = "Charge complete"; cls = "on"; }
  else if (flags & BF.AMBIGUOUS) { text = "On battery (not charging)"; cls = "warn"; }
  else if (flags & BF.PRESENT) { text = "Battery present"; cls = "on"; }
  else text = "unknown";
  pill($("batState"), text, cls);
  pill($("batS1"), "STAT1 " + (stat & 1)); pill($("batS2"), "STAT2 " + ((stat >> 1) & 1));
  $("batRaw").textContent = [...new Uint8Array(dv.buffer, dv.byteOffset, dv.byteLength)]
    .map((b) => b.toString(16).padStart(2, "0")).join(" ") + `  flags=0x${flags.toString(16)}`;
}

function onSleep(seconds) {
  const el = $("sleep");
  if (seconds < 0) return pill(el, "Sleep timer: unavailable (release firmware)");
  if (seconds === 0xffff) return pill(el, "Sleep timer: paused during boot calibration", "warn");
  const m = Math.floor(seconds / 60), s = seconds % 60;
  pill(el, `Sleep in ${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`,
       seconds <= 10 ? "bad" : seconds <= 30 ? "warn" : "");
}

function setVals(prefix, a, b, c, unit) {
  $(prefix + "X").textContent = `X ${a >= 0 ? "+" : ""}${a}`;
  $(prefix + "Y").textContent = `Y ${b >= 0 ? "+" : ""}${b}`;
  $(prefix + "Z").textContent = `Z ${c >= 0 ? "+" : ""}${c}`;
}

/* ---------- data handlers ---------- */
function onSample(ev) {
  const dv = ev.target.value;
  if (dv.byteLength !== PACKET_SIZE) return;
  const wall = Date.now(), t = performance.now();
  const seq = dv.getUint16(0, true);
  const ax = dv.getInt16(2, true), ay = dv.getInt16(4, true), az = dv.getInt16(6, true);
  const gx = dv.getInt32(8, true), gy = dv.getInt32(12, true), gz = dv.getInt32(16, true);

  if (st.lastSeq !== null) st.lost += (seq - st.lastSeq - 1) & 0xffff;
  st.lastSeq = seq; st.count++;
  st.rateTimes.push(t);

  if (st.log.length < MAX_LOG) {
    st.log.push([wall, seq, ax, ay, az, gx, gy, gz, st.touch,
      [...new Uint8Array(dv.buffer, dv.byteOffset, dv.byteLength)]
        .map((b) => b.toString(16).padStart(2, "0")).join("")]);
  }
  if (!st.paused) {
    plots.accel.add(t, ax, ay, az); plots.gyro.add(t, gx, gy, gz);
    setVals("a", ax, ay, az); setVals("g", gx, gy, gz);
  }
}

/* ---------- connection ---------- */
async function connect() {
  $("connect").disabled = true;
  try {
    setStatus("Choose a device…", false); $("connect").disabled = true;
    st.device = await navigator.bluetooth.requestDevice({
      filters: [{ name: DEVICE_NAME }, { services: [SERVICE_UUID] }],
      optionalServices: [SERVICE_UUID, BATTERY_SERVICE_UUID, DEBUG_SERVICE_UUID],
    });
    st.device.addEventListener("gattserverdisconnected", onDisconnected);
    setStatus("Connecting…", false); $("connect").disabled = true;
    st.server = await st.device.gatt.connect();

    const motion = await st.server.getPrimaryService(SERVICE_UUID);
    const battery = await st.server.getPrimaryService(BATTERY_SERVICE_UUID);
    let debug = null;
    try { debug = await st.server.getPrimaryService(DEBUG_SERVICE_UUID); } catch (_) { /* release firmware */ }

    const data = await motion.getCharacteristic(DATA_UUID);
    const rate = await motion.getCharacteristic(RATE_UUID);
    const touch = await motion.getCharacteristic(TOUCH_UUID);
    const bat = await battery.getCharacteristic(BATTERY_UUID);
    st.chars = { rate };

    // Subscribe one at a time: Web Bluetooth serialises GATT operations anyway.
    touch.addEventListener("characteristicvaluechanged", (e) => onTouch(e.target.value.getUint8(0)));
    bat.addEventListener("characteristicvaluechanged", (e) => onBattery(e.target.value));
    data.addEventListener("characteristicvaluechanged", onSample);
    await touch.startNotifications();
    await bat.startNotifications();
    if (debug) {
      const sl = await debug.getCharacteristic(SLEEP_UUID);
      sl.addEventListener("characteristicvaluechanged", (e) => onSleep(e.target.value.getUint16(0, true)));
      await sl.startNotifications();
      onSleep((await sl.readValue()).getUint16(0, true));
    } else onSleep(-1);
    onTouch((await touch.readValue()).getUint8(0));
    onBattery(await bat.readValue());
    const r = (await rate.readValue()).getUint16(0, true);
    rateSel.value = String(r);
    st.lastSeq = null;
    await data.startNotifications();
    setStatus(`Connected · ${st.device.name || DEVICE_NAME}`, true);
  } catch (err) {
    if (st.device && st.device.gatt.connected) st.device.gatt.disconnect();
    setStatus("Disconnected", false);
    if (err.name !== "NotFoundError") alert(`Bluetooth error: ${err.name}: ${err.message}`);
  }
}

function onDisconnected() {
  setStatus("Disconnected", false);
  onTouch(0); pill($("calib"), "Calibration unknown");
  clearBattery(); onSleep(-1); st.lastSeq = null;
}

async function applyRate() {
  const r = Number(rateSel.value);
  try {
    $("applyRate").disabled = true;
    await st.chars.rate.writeValueWithResponse(new Uint16Array([r]));
    const applied = (await st.chars.rate.readValue()).getUint16(0, true);
    rateSel.value = String(applied);
    setStatus(`Connected · sampling at ${applied} Hz`, true);
  } catch (err) {
    alert(`Could not set rate: ${err.message}`);
  } finally { $("applyRate").disabled = !(st.device && st.device.gatt.connected); }
}

/* ---------- controls ---------- */
$("connect").addEventListener("click", () => {
  if (st.device && st.device.gatt.connected) { $("connect").disabled = true; st.device.gatt.disconnect(); }
  else connect();
});
$("applyRate").addEventListener("click", applyRate);
$("window").addEventListener("change", (e) => { st.windowSec = Number(e.target.value); });
$("pause").addEventListener("click", (e) => {
  st.paused = !st.paused; e.target.textContent = st.paused ? "Resume" : "Pause";
});
$("clear").addEventListener("click", () => {
  st.log = []; st.count = 0; st.lost = 0; st.lastSeq = null;
  plots.accel.clear(); plots.gyro.clear();
  for (const p of ["a", "g"]) for (const a of ["X", "Y", "Z"]) $(p + a).textContent = a + " —";
});
document.querySelectorAll("input[data-plot]").forEach((cb) =>
  cb.addEventListener("change", () => { st.show[cb.dataset.plot][Number(cb.dataset.axis)] = cb.checked; }));

$("export").addEventListener("click", () => {
  const header = "unix_time_s,iso_time,sequence,accel_x_mg,accel_y_mg,accel_z_mg," +
    "gyro_x_mdps,gyro_y_mdps,gyro_z_mdps,raw_hex,touch_key_mask,key_2,key_3,key_4,key_5";
  const lines = [header];
  for (const r of st.log) {
    const touch = r[8];
    lines.push([(r[0] / 1000).toFixed(3), new Date(r[0]).toISOString(), ...r.slice(1, 8), r[9], touch,
      ...[2, 3, 4, 5].map((k) => (touch & (1 << k) ? 1 : 0))].join(","));
  }
  const url = URL.createObjectURL(new Blob([lines.join("\n") + "\n"], { type: "text/csv" }));
  const a = document.createElement("a");
  const d = new Date(), p = (n) => String(n).padStart(2, "0");
  a.href = url;
  a.download = `penewise-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}.csv`;
  a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
});

/* ---------- render loop ---------- */
function frame() {
  const now = performance.now();
  if (!st.paused) { plots.accel.draw(now); plots.gyro.draw(now); }
  else { plots.accel.draw(plots.accel.pts.length ? plots.accel.pts[plots.accel.pts.length - 1][0] : now);
         plots.gyro.draw(plots.gyro.pts.length ? plots.gyro.pts[plots.gyro.pts.length - 1][0] : now); }
  while (st.rateTimes.length && st.rateTimes[0] < now - 2000) st.rateTimes.shift();
  const connected = st.device && st.device.gatt.connected;
  $("sRate").textContent = connected && st.rateTimes.length > 1 ? (st.rateTimes.length / 2).toFixed(0) : "—";
  $("sCount").textContent = st.count; $("sLost").textContent = st.lost; $("sLog").textContent = st.log.length;
  $("export").disabled = st.log.length === 0;
  requestAnimationFrame(frame);
}

if (!navigator.bluetooth) {
  $("unsupported").style.display = "block"; $("connect").disabled = true;
}
requestAnimationFrame(frame);
