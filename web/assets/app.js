/* MCHOSE Ace 68 / Ace 68 Air — Native Go Offline Driver Frontend */

// Exact official Cizhou GLW lighting effect IDs (verified from 3050 chunk + en/common.json)
const MAIN_EFFECTS = [
  [0, 'Custom (Per-Key)'],
  [1, 'Rainbow Cycle'],
  [2, 'Linear Grad'],
  [3, 'Constant On'],
  [4, 'Breath'],
  [5, 'Disco'],
  [6, 'Horiz Wave'],
  [7, 'Vert Wave'],
  [8, 'Center Spread'],
  [9, 'Star Twinkle'],
  [10, 'Center Spin'],
  [11, 'Bottom Up'],
  [12, 'Recip Rebound'],
  [13, 'Key Ripple'],
  [14, 'Solid Ripple'],
  [15, 'Key Trail'],
  [16, 'Key Firework'],
  [17, 'Key Beam'],
  [18, 'Diag Flow'],
  [19, 'Laser Rain'],
  [20, 'Dot Twinkle'],
  [21, 'Fireworks'],
  [22, 'Triangle Bounce'],
  [255, 'Light Off'],
];

const SIDE_EFFECTS = [
  [0, 'Flowing'],
  [1, 'Neon'],
  [2, 'Breathing'],
  [3, 'Constant On'],
  [4, 'Side Off'],
];

// Official English switch names from cizhou/locales/en/common.json
const SWITCH_LABELS = {
  ztDefault: 'Default Option',
  ztBx: 'Ice Rhino Magnetic Switch',
  ztXm: 'Starburst Magnetic Switch',
  ztKtekMax: 'KTEK Magnetic Switch Max',
  ztTtcTwRgbDj: 'TTC Uranus Magnetic Switch-RGB eSports',
  ztTtcWcwJr: 'TTC Magneto Switch',
  ztHy: 'Naruto Magnetic Switch',
  ztKailh: 'Kailh Magnetic God Switch',
  ztTsGt: 'Taishan Magnetic Switch GT',
  ztLb: 'Ice Blue Magnetic Switch',
  ztKtek: 'KTEK Magnetic Switch',
  ztTtcTwSe: 'TTC Uranus Magnetic Switch-SE',
  ztTtcTwBz: 'TTC Uranus Magnetic Switch-Standard',
  ztTtcTwDj: 'TTC Uranus Magnetic Switch eSports',
  ztXl: 'Star Hunt Magnetic Switch',
  ztSd: 'Flash Magnetic Switch',
  ztXh: 'Star Ring Magnetic Switch',
  ztTtcLs: 'TTC Dragon King Switch',
  ztSdV2: 'Flash Magnetic Switch',
  ztLs: 'Dragon God Magnetic Switch',
  ztQyc: 'Jade Magnetic Switch',
  ztBm: 'Baoma Magnetic Switch',
  ztKb: 'Rage Magnetic Switch',
  ztPolarMag: 'Polar Magnetic Switch',
};

// Exact Cizhou GLW Key Matrix codes (modifiers use code1 bitmask with code2=0!)
const KEY_PICKER_GROUPS = [
  {
    title: 'Letters',
    items: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((c, i) => ({ name: c, type: 16, c1: 0, c2: 4 + i })),
  },
  {
    title: 'Numbers & Punctuation',
    items: [
      ...['1','2','3','4','5','6','7','8','9','0'].map((n, i) => ({ name: n, type: 16, c1: 0, c2: 30 + i })),
      { name: '- _', type: 16, c1: 0, c2: 45 }, { name: '= +', type: 16, c1: 0, c2: 46 },
      { name: '[ {', type: 16, c1: 0, c2: 47 }, { name: '] }', type: 16, c1: 0, c2: 48 },
      { name: '\\ |', type: 16, c1: 0, c2: 49 }, { name: '; :', type: 16, c1: 0, c2: 51 },
      { name: "' \"", type: 16, c1: 0, c2: 52 }, { name: '` ~', type: 16, c1: 0, c2: 53 },
      { name: ', <', type: 16, c1: 0, c2: 54 }, { name: '. >', type: 16, c1: 0, c2: 55 },
      { name: '/ ?', type: 16, c1: 0, c2: 56 },
    ],
  },
  {
    title: 'Function & Navigation',
    items: [
      ...Array.from({ length: 12 }, (_, i) => ({ name: 'F' + (i + 1), type: 16, c1: 0, c2: 58 + i })),
      { name: 'Esc', type: 16, c1: 0, c2: 41 }, { name: 'Tab', type: 16, c1: 0, c2: 43 },
      { name: 'Caps', type: 16, c1: 0, c2: 57 }, { name: 'Backspace', type: 16, c1: 0, c2: 42 },
      { name: 'Enter', type: 16, c1: 0, c2: 40 }, { name: 'Space', type: 16, c1: 0, c2: 44 },
      { name: 'PrtSc', type: 16, c1: 0, c2: 70 },
      { name: 'Insert', type: 16, c1: 0, c2: 73 }, { name: 'Delete', type: 16, c1: 0, c2: 76 },
      { name: 'Home', type: 16, c1: 0, c2: 74 }, { name: 'End', type: 16, c1: 0, c2: 77 },
      { name: 'PgUp', type: 16, c1: 0, c2: 75 }, { name: 'PgDn', type: 16, c1: 0, c2: 78 },
      { name: 'Up', type: 16, c1: 0, c2: 82 }, { name: 'Down', type: 16, c1: 0, c2: 81 },
      { name: 'Left', type: 16, c1: 0, c2: 80 }, { name: 'Right', type: 16, c1: 0, c2: 79 },
    ],
  },
  {
    title: 'Modifiers & Layers',
    items: [
      { name: 'L-Ctrl', type: 16, c1: 1, c2: 0 },
      { name: 'L-Shift', type: 16, c1: 2, c2: 0 },
      { name: 'L-Alt', type: 16, c1: 4, c2: 0 },
      { name: 'L-Win', type: 16, c1: 8, c2: 0 },
      { name: 'R-Ctrl', type: 16, c1: 16, c2: 0 },
      { name: 'R-Shift', type: 16, c1: 32, c2: 0 },
      { name: 'R-Alt', type: 16, c1: 64, c2: 0 },
      { name: 'R-Win', type: 16, c1: 128, c2: 0 },
      { name: 'FN1', type: 240, c1: 255, c2: 1 },
      { name: 'Disabled', type: 0, c1: 0, c2: 0 },
    ],
  },
];

const ALL_PICKER_ITEMS = KEY_PICKER_GROUPS.flatMap((g) => g.items);
const CODE_NAMES = {};
const MOD_NAMES = { 1: 'LCtrl', 2: 'LShift', 4: 'LAlt', 8: 'Win', 16: 'RCtrl', 32: 'RShift', 64: 'RAlt', 128: 'RWin' };
for (const it of ALL_PICKER_ITEMS) {
  if (it.type === 16 && it.c2 > 0) CODE_NAMES[it.c2] = it.name;
}

const S = {
  models: {},
  modelTag: 'ace68_air_ii',
  connected: false,
  connectedPath: '',
  activeTab: 'trigger',
  lastMainBright: 4,
  lastSideBright: 4,
  lastMainEffect: 6,
  lastSideEffect: 0,
  profile: 0,
  profileCount: 3,
  profileNames: ['Profile 1', 'Profile 2', 'Profile 3'],
  layer: 0,
  previewMode: 'ap',
  lightScope: 'main',
  keys: [],          // [{ name, code, x, y, w, h, hwIndex, defTuple }]
  defaultKeys: [],   // raw 128 defaultKeys from model json
  switches: [],      // switch list with maxTravel
  maxTravel: 340,
  triggers: [],      // 128 entries
  keyMatrix: [],     // 128 entries
  customColors: [],  // 128 hex strings
  advancedKeys: { dks: [], mt: [], tgl: [] },
  aksDrawer: null,      // null | 'rs' | 'socd' | 'dks' | 'mt' | 'tgl'
  aksActiveSlot: null,  // 'rs1'|'rs2'|'socd1'|'socd2'|'dksKey'|'dksRow0..3'|'mtKey'|'mtHold'|'mtTap'|'tglKey'|'tglOut'
  aksFocusKey: null,
  aksDraft: {
    rs1: 10, rs2: 11,
    socd1: 10, socd2: 11, socdPrio: 0,
    mtIdx: null, mtHold: null, mtTap: null, mtTime: 150,
    tglIdx: null, tglOut: null,
    dksIdx: null, dksP1: 10, dksP2: 30,
    dksRows: [
      { key: null, stages: [false, false, false, false] },
      { key: null, stages: [false, false, false, false] },
      { key: null, stages: [false, false, false, false] },
      { key: null, stages: [false, false, false, false] },
    ],
  },
  livePeakTravel: 0,
  keyTravels: new Array(128).fill(0),
  lastActiveKeyIdx: -1,
  travelResetTimers: {},
  lighting: {
    effect: 6, brightness: 4, speed: 3, direct: 0,
    customColorDisabled: 1, colorIndex: 0, hexColor: '#00d4ff',
    side_effect: 0, side_brightness: 4, side_speed: 3,
    sideCustomColorDisabled: 1, side_hexColor: '#00d4ff',
  },
  performance: {
    reporteRate: 4, tachyonMode: 0, bottomrapidtriggerMode: 0,
    debounceLevel: 0, travelCheck: 0, rtsmart: 0,
    lockWin: 0, lockAltTap: 0, lockAltF4: 0, macMode: 0,
  },
  selected: new Set(),
  calibrating: false,
  calibratedSet: new Set(),
  liveTravelOn: false,
  sse: null,
  isDraggingKeys: false,
  dragSelectAdd: true,
};

const $ = (id) => document.getElementById(id);

function toast(msg, isErr = false) {
  const d = document.createElement('div');
  d.className = 'toast' + (isErr ? ' err' : '');
  d.textContent = msg;
  $('toast-box').appendChild(d);
  setTimeout(() => d.remove(), 2500);
}

async function api(path, body) {
  const opts = body !== undefined
    ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
    : { method: 'GET' };
  const res = await fetch(path, opts);
  return res.json();
}

function keyTupleName(t) {
  if (!t || (t.type === 0 && t.code1 === 0 && t.code2 === 0)) return 'Off';
  if (t.type === 240) return 'FN';
  if (t.type === 16) {
    if (t.code2 > 0 && CODE_NAMES[t.code2]) return CODE_NAMES[t.code2];
    if (t.code1 > 0 && MOD_NAMES[t.code1]) return MOD_NAMES[t.code1];
  }
  return `#${t.type}:${t.code1}:${t.code2}`;
}

function buildLayoutForModel(tag) {
  const m = S.models[tag] || S.models.ace68_air_ii;
  if (!m) return;
  const rawKeys = (m.keys || []).filter((k) => !k.hidden);
  const defKeys = m.defaultKeys || [];
  S.defaultKeys = defKeys;
  const used = new Set();

  let mapped = rawKeys.map((rk, idx) => {
    let dk = defKeys.find((d) => d && d.code === rk.code && !used.has(d.index));
    if (!dk) {
      dk = defKeys.find((d) => d && d.name && rk.name && d.name.toLowerCase() === rk.name.toLowerCase() && !used.has(d.index));
    }
    const hwIndex = dk ? dk.index : idx;
    used.add(hwIndex);
    return {
      name: rk.name || (dk && dk.name) || '',
      code: rk.code,
      x: rk.x,
      y: rk.y,
      w: rk.w || 1,
      h: rk.h || 1,
      hwIndex,
      defTuple: dk ? { type: dk.type, code1: dk.code1, code2: dk.code2 } : { type: 16, code1: 0, code2: rk.code || 0 },
    };
  });

  const row0 = mapped.filter((k) => Math.abs(k.y - mapped[0].y) < 0.25).map((k) => k.x).sort((a, b) => a - b);
  if (row0.length >= 2) {
    const pitch = row0[1] - row0[0];
    if (pitch > 1.02 && pitch < 1.25) {
      mapped = mapped.map((k) => ({ ...k, x: k.x / pitch, y: k.y / pitch }));
    }
  }
  S.keys = mapped;

  const opts = m.switches && m.switches.length ? m.switches : [{ key: 'ztDefault', value: 0, maxTravel: 3.4 }];
  S.switches = opts;
  $('switch-select').innerHTML = opts.map((o) => {
    const label = SWITCH_LABELS[o.key] || o.name || o.key || 'Switch ' + o.value;
    return `<option value="${o.value}" data-max="${Math.round((o.maxTravel || 3.4) * 100)}">${label}</option>`;
  }).join('');

  populateAdvancedSelects();
}

function updateSwitchMaxTravel() {
  const sel = $('switch-select');
  const opt = sel.options[sel.selectedIndex];
  const mx = Number((opt && opt.dataset.max) || 340);
  S.maxTravel = mx;
  $('rng-ap').max = mx;
  $('ruler-max').textContent = (mx / 100).toFixed(2);
  $('live-meter-max').textContent = (mx / 100).toFixed(1);
  $('hint-max-ap').textContent = `Deep (${(mx / 100).toFixed(2)}mm)`;
}

function initDemoState() {
  S.triggers = Array.from({ length: 128 }, () => ({
    switchType: 0, keyMode: 0, priority: 0,
    keyActuation: 105, pressPrecision: 0, releasePrecision: 0,
    rtPress: 15, rtRelease: 15, pressDeadzone: 15, releaseDeadzone: 15,
  }));
  S.customColors = Array.from({ length: 128 }, () => '#00d4ff');
  S.advancedKeys = {
    dks: Array.from({ length: 32 }, () => ({
      points: [10, 30, 30, 10],
      actions: Array.from({ length: 4 }, () => ({ type: 0, code1: 0, code2: 0 })),
      flags: [0, 0, 0, 0],
    })),
    mt: Array.from({ length: 32 }, () => ({ click: { type: 0, code1: 0, code2: 0 }, down: { type: 0, code1: 0, code2: 0 } })),
    tgl: Array.from({ length: 32 }, () => ({ type: 0, code1: 0, code2: 0 })),
  };
}

function keyDisplayLabel(k) {
  const km = S.keyMatrix[k.hwIndex];
  if (!km || (km.type === 0 && km.code1 === 0 && km.code2 === 0)) {
    return km ? 'Off' : k.name;
  }
  if (km.type >= 144 && km.type <= 149) return k.name;
  if (km.type === 240) return 'FN';
  if (km.type === 16) {
    if (km.code2 > 0 && CODE_NAMES[km.code2]) return CODE_NAMES[km.code2];
    if (km.code1 > 0 && MOD_NAMES[km.code1]) return MOD_NAMES[km.code1];
  }
  return k.name;
}

function keyAdvBadge(hwIndex) {
  const km = S.keyMatrix[hwIndex];
  if (!km) return '';
  if (km.type === 148) return 'SOCD';
  if (km.type === 147) return 'RS';
  if (km.type === 146) return 'MT';
  if (km.type === 145) return 'TGL';
  if (km.type === 144) return 'DKS';
  return '';
}

function getAksHighlightedHwIndices() {
  const set = new Set();
  if (S.activeTab !== 'advanced') return set;
  if (S.aksDrawer === 'rs') {
    if (S.aksDraft.rs1 != null) set.add(S.aksDraft.rs1);
    if (S.aksDraft.rs2 != null) set.add(S.aksDraft.rs2);
  } else if (S.aksDrawer === 'socd') {
    if (S.aksDraft.socd1 != null) set.add(S.aksDraft.socd1);
    if (S.aksDraft.socd2 != null) set.add(S.aksDraft.socd2);
  } else if (S.aksDrawer === 'dks' && S.aksDraft.dksIdx != null) {
    set.add(S.aksDraft.dksIdx);
  } else if (S.aksDrawer === 'mt' && S.aksDraft.mtIdx != null) {
    set.add(S.aksDraft.mtIdx);
  } else if (S.aksDrawer === 'tgl' && S.aksDraft.tglIdx != null) {
    set.add(S.aksDraft.tglIdx);
  } else if (!S.aksDrawer && S.aksFocusKey != null) {
    set.add(S.aksFocusKey);
  }
  return set;
}

function renderChassis() {
  const box = $('keyboard-chassis');
  if (!S.keys.length) return;
  const U = 44;
  const GAP = 3;
  const PAD = 10;

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const k of S.keys) {
    minX = Math.min(minX, k.x);
    minY = Math.min(minY, k.y);
    maxX = Math.max(maxX, k.x + k.w);
    maxY = Math.max(maxY, k.y + k.h);
  }

  box.style.width = Math.ceil((maxX - minX) * U + PAD * 2) + 'px';
  box.style.height = Math.ceil((maxY - minY) * U + PAD * 2) + 'px';
  box.innerHTML = '';

  const isTriggerTab = S.activeTab === 'trigger';
  const isAdvTab = S.activeTab === 'advanced';
  const showCustomRgb = S.activeTab === 'lighting' && S.lightScope === 'main' && S.lighting.effect === 0;
  const aksFocusSet = getAksHighlightedHwIndices();

  for (const k of S.keys) {
    const t = S.triggers[k.hwIndex] || { keyActuation: 100, keyMode: 0, rtPress: 15, rtRelease: 15, pressDeadzone: 15 };
    const label = keyDisplayLabel(k);
    const advTag = keyAdvBadge(k.hwIndex);

    let sub = (t.keyActuation / 100).toFixed(2);
    if (S.previewMode === 'rt') {
      sub = t.keyMode === 1 ? `${(t.rtPress / 100).toFixed(2)}` : 'OFF';
    } else if (S.previewMode === 'dz') {
      sub = (t.pressDeadzone / 100).toFixed(2);
    }

    const div = document.createElement('div');
    div.className = 'kcap';
    if (!isTriggerTab) div.classList.add('centered');
    if (!isAdvTab && S.selected.has(k.hwIndex)) div.classList.add('selected');
    if (isAdvTab && aksFocusSet.has(k.hwIndex)) div.classList.add('aks-focus');
    if (isTriggerTab && t.keyMode === 1) div.classList.add('rt-active');
    if (advTag) div.classList.add('adv-key');
    if (S.calibrating && S.calibratedSet.has(k.hwIndex)) div.classList.add('calibrated');
    div.dataset.idx = k.hwIndex;

    div.style.left = Math.round((k.x - minX) * U + PAD) + 'px';
    div.style.top = Math.round((k.y - minY) * U + PAD) + 'px';
    div.style.width = Math.max(24, Math.round(k.w * U - GAP)) + 'px';
    div.style.height = Math.max(24, Math.round(k.h * U - GAP)) + 'px';

    const keyColor = S.customColors[k.hwIndex] || '#00d4ff';

    div.innerHTML = `
      <div class="k-travel-fill" id="kfill-${k.hwIndex}"></div>
      ${advTag ? `<span class="k-adv-tag">${advTag}</span>` : (isTriggerTab && t.keyMode === 1 ? '<span class="k-rt-dot"></span>' : '')}
      <span class="k-top">${label}</span>
      ${isTriggerTab ? `<span class="k-val" id="kval-${k.hwIndex}" data-def="${sub}">${sub}</span>` : ''}
      ${showCustomRgb ? `<div class="k-rgb-bar" style="background:${keyColor}"></div>` : ''}
    `;

    div.addEventListener('mousedown', (e) => {
      e.preventDefault();
      if (S.activeTab === 'advanced') {
        if (S.aksDrawer) {
          assignPhysicalKeyToAks(k.hwIndex);
        } else {
          const km = S.keyMatrix[k.hwIndex];
          if (km && km.type === 148) openAksDrawer('socd', { i1: k.hwIndex, i2: km.code2 });
          else if (km && km.type === 147) openAksDrawer('rs', { i1: k.hwIndex, i2: km.code2 });
          else if (km && km.type === 146) openAksDrawer('mt', { i1: k.hwIndex });
          else if (km && km.type === 145) openAksDrawer('tgl', { i1: k.hwIndex });
          else if (km && km.type === 144) openAksDrawer('dks', { i1: k.hwIndex });
          else {
            S.aksFocusKey = S.aksFocusKey === k.hwIndex ? null : k.hwIndex;
            renderChassis();
          }
        }
        return;
      }
      if (showCustomRgb && !e.ctrlKey && !e.shiftKey) {
        const col = $('inp-l-color').value;
        S.customColors[k.hwIndex] = col;
        const bar = div.querySelector('.k-rgb-bar');
        if (bar) bar.style.background = col;
        if (S.connected) api('/api/custom-colors', { profile: S.profile, updates: { [k.hwIndex]: col } });
        S.selected.clear();
        S.selected.add(k.hwIndex);
        syncSelectionControls();
        return;
      }
      if (S.activeTab === 'keymap') {
        S.selected = new Set([k.hwIndex]);
        syncSelectionControls();
        return;
      }
      S.isDraggingKeys = true;
      if (e.ctrlKey || e.shiftKey || e.metaKey) {
        S.dragSelectAdd = !S.selected.has(k.hwIndex);
        if (S.dragSelectAdd) S.selected.add(k.hwIndex);
        else S.selected.delete(k.hwIndex);
      } else {
        S.selected.clear();
        S.selected.add(k.hwIndex);
        S.dragSelectAdd = true;
      }
      syncSelectionControls();
    });

    div.addEventListener('mouseenter', () => {
      if (!S.isDraggingKeys || S.activeTab === 'advanced' || S.activeTab === 'keymap') return;
      if (S.dragSelectAdd) S.selected.add(k.hwIndex);
      else S.selected.delete(k.hwIndex);
      syncSelectionControls();
    });

    box.appendChild(div);
  }
  syncSelectionControls();
}

window.addEventListener('mouseup', () => {
  S.isDraggingKeys = false;
});

function syncSelectionControls() {
  $('sel-count-label').textContent = S.selected.size;
  if (S.activeTab !== 'advanced') {
    document.querySelectorAll('.kcap').forEach((el) => {
      el.classList.toggle('selected', S.selected.has(Number(el.dataset.idx)));
    });
  }

  if (S.selected.size > 0) {
    const first = [...S.selected][0];
    const kObj = S.keys.find((x) => x.hwIndex === first);
    const kName = kObj ? kObj.name : '#' + first;
    $('remap-sel-name').textContent = kName;
    const t = S.triggers[first];
    if (t) {
      $('switch-select').value = String(t.switchType || 0);
      updateSwitchMaxTravel();
      $('rng-ap').value = Math.min(S.maxTravel, t.keyActuation);
      $('chk-rt').checked = t.keyMode === 1;
      $('rng-rt-p').value = t.rtPress;
      $('rng-rt-r').value = t.rtRelease;
      $('rng-dz-t').value = t.pressDeadzone;
      $('rng-dz-b').value = t.releaseDeadzone;
      syncTriggerSlidersUI();
    }
  } else {
    $('remap-sel-name').textContent = 'None';
  }
}

function syncTriggerSlidersUI() {
  const ap = Number($('rng-ap').value);
  const rt = $('chk-rt').checked;
  const sep = $('chk-rt-sep').checked;
  const rtp = Number($('rng-rt-p').value);
  if (!sep) $('rng-rt-r').value = rtp;
  const rtr = Number($('rng-rt-r').value);
  const dzt = Number($('rng-dz-t').value);
  const dzb = Number($('rng-dz-b').value);

  $('lbl-ap').textContent = (ap / 100).toFixed(2);
  $('v-ap-fill').style.height = Math.min(100, Math.round((ap / S.maxTravel) * 100)) + '%';
  $('rt-body').classList.toggle('disabled', !rt);
  $('rt-rel-group').style.display = sep ? 'block' : 'none';
  $('lbl-rt-p').textContent = (rtp / 100).toFixed(2);
  $('lbl-rt-r').textContent = (rtr / 100).toFixed(2);
  $('lbl-dz-t').textContent = (dzt / 100).toFixed(2);
  $('lbl-dz-b').textContent = (dzb / 100).toFixed(2);
}

function renderLightingEffects() {
  const list = S.lightScope === 'main' ? MAIN_EFFECTS : SIDE_EFFECTS;
  const cur = S.lightScope === 'main' ? S.lighting.effect : S.lighting.side_effect;
  $('effects-grid').innerHTML = list
    .map(([id, name]) => `<button class="eff-btn ${cur === id ? 'active' : ''}" data-eff="${id}">${name}</button>`)
    .join('');

  if (S.lighting.brightness > 0) S.lastMainBright = S.lighting.brightness;
  if (S.lighting.side_brightness > 0) S.lastSideBright = S.lighting.side_brightness;
  if (S.lighting.effect !== 255) S.lastMainEffect = S.lighting.effect;
  if (S.lighting.side_effect !== 4) S.lastSideEffect = S.lighting.side_effect;

  let isLightOn = false;
  if (S.lightScope === 'main') {
    isLightOn = S.lighting.brightness > 0 && S.lighting.effect !== 255;
    $('rng-l-speed').value = S.lighting.speed;
    $('lbl-l-speed').textContent = S.lighting.speed;
    $('rng-l-bright').value = S.lighting.brightness;
    $('lbl-l-bright').textContent = S.lighting.brightness;
    $('chk-l-rainbow').checked = Boolean(S.lighting.customColorDisabled);
    $('inp-l-color').value = S.lighting.hexColor || '#00d4ff';
    $('lbl-l-hex').textContent = (S.lighting.hexColor || '#00d4ff').toUpperCase();
  } else {
    isLightOn = S.lighting.side_brightness > 0 && S.lighting.side_effect !== 4;
    $('rng-l-speed').value = S.lighting.side_speed;
    $('lbl-l-speed').textContent = S.lighting.side_speed;
    $('rng-l-bright').value = S.lighting.side_brightness;
    $('lbl-l-bright').textContent = S.lighting.side_brightness;
    $('chk-l-rainbow').checked = Boolean(S.lighting.sideCustomColorDisabled);
    $('inp-l-color').value = S.lighting.side_hexColor || '#00d4ff';
    $('lbl-l-hex').textContent = (S.lighting.side_hexColor || '#00d4ff').toUpperCase();
  }
  $('chk-light-enable').checked = isLightOn;
  $('lbl-light-state').textContent = isLightOn ? 'ON' : 'OFF';
  $('lbl-light-state').classList.toggle('on', isLightOn);
  $('effects-grid').classList.toggle('light-off', !isLightOn);
  $('chk-l-dir').checked = Boolean(S.lighting.direct);
  $('perkey-tools').style.display = (S.lightScope === 'main' && S.lighting.effect === 0) ? 'block' : 'none';
}

function syncPerfUI() {
  const p = S.performance;
  document.querySelectorAll('.rate-pill').forEach((b) => {
    b.classList.toggle('active', Number(b.dataset.rate) === Number(p.reporteRate));
  });
  $('chk-berserk-trig').checked = Boolean(p.tachyonMode);
  $('perf-stability').checked = Boolean(p.bottomrapidtriggerMode);
  $('perf-debounce').checked = Number(p.debounceLevel) >= 1;
  $('perf-autocal').checked = Boolean(p.travelCheck);
  const rtOn = Number(p.rtsmart) > 0;
  $('perf-rtsmart').checked = rtOn;
  $('rng-rtsmart').value = rtOn ? p.rtsmart : 1;
  $('lbl-rtsmart').textContent = rtOn ? `Level ${p.rtsmart}` : 'Off';
  $('rtsmart-slider-wrap').style.opacity = rtOn ? '1' : '0.45';
  $('rng-rtsmart').disabled = !rtOn;

  $('perf-lockwin').checked = Boolean(p.lockWin);
  $('perf-lockalttab').checked = Boolean(p.lockAltTap);
  $('perf-lockaltf4').checked = Boolean(p.lockAltF4);
  // Cizhou encodes macMode as (profile * 4 + baseLayer): layer 0/1 = Windows, layer 2/3 = macOS
  $('perf-mac').checked = (Number(p.macMode) % 4) >= 2;
}

function renderProfileList() {
  $('profile-counter').textContent = `${S.profileCount}/${S.profileCount}`;
  document.querySelectorAll('.prof-row').forEach((row, i) => {
    const pIdx = Number(row.dataset.prof);
    row.style.display = i < S.profileCount ? 'flex' : 'none';
    const btn = row.querySelector('.prof-item');
    btn.classList.toggle('active', pIdx === S.profile);
    const raw = S.profileNames[i] || `Profile ${i + 1}`;
    const display = raw.replace(/^.*?:/, '') || raw;
    btn.querySelector('.prof-name').textContent = display;
  });
}

// Encode/Decode Cizhou 16-bit DKS stage flags (matches official GLW W() / Z() in 1266)
function encodeDksStageFlags(stages) {
  const s = stages.map((x) => !!x);
  // Span encoding: consecutive active stages merge into hold spans, single active = tap
  let ds = 0, de = 0, us = 0, ue = 0;
  if (s[0]) {
    if (s[1] && s[2] && s[3]) ds = 4;
    else if (s[1] && s[2]) ds = 3;
    else if (s[1]) ds = 2;
    else ds = 1;
  }
  if (s[1] && ds < 2) {
    if (s[2] && s[3]) de = 3;
    else if (s[2]) de = 2;
    else de = 1;
  }
  if (s[2] && ds < 3 && de < 2) {
    us = s[3] ? 2 : 1;
  }
  if (s[3] && ds < 4 && de < 3 && us < 2) {
    ue = 1;
  }
  const j = (v) => (v > 0 ? 1 : 0) | ((v > 1 ? 1 : 0) << 1) | ((v > 2 ? 1 : 0) << 2);
  let a = ds, r = de, o = us, u = ue;
  if (ds === 4) { a = 3; r = 3; o = 2; }
  else if (ds === 3) { a = 3; r = 2; }
  if (de === 3) { o = 2; }
  return (j(a) & 7) | ((j(r) << 3) & 56) | ((j(o) << 6) & 448) | ((j(u) << 9) & 512);
}

function decodeDksStageFlags(flag) {
  const f = Number(flag || 0);
  const l = f & 7;
  const c = (f >> 3) & 7;
  const d = (f >> 6) & 7;
  const u = (f >> 9) & 1;
  return [
    l > 0,
    c > 0 || (l & 2) !== 0,
    d > 0 || (l & 4) !== 0 || (c & 2) !== 0,
    u > 0 || (d & 2) !== 0,
  ];
}

function populateAdvancedSelects() {
  const kA = S.keys.find((k) => k.name.toUpperCase() === 'A');
  const kD = S.keys.find((k) => k.name.toUpperCase() === 'D');
  const def1 = kA ? kA.hwIndex : (S.keys[0] ? S.keys[0].hwIndex : 10);
  const def2 = kD ? kD.hwIndex : (S.keys[1] ? S.keys[1].hwIndex : 11);
  S.aksDraft.rs1 = def1;
  S.aksDraft.rs2 = def2;
  S.aksDraft.socd1 = def1;
  S.aksDraft.socd2 = def2;
  renderAksRemapList('');
}

function renderAksRemapList(query = '') {
  const q = query.trim().toLowerCase();
  const listEl = $('aks-remap-list');
  if (!listEl) return;
  listEl.innerHTML = KEY_PICKER_GROUPS.map((g) => {
    const items = g.items.filter((it) => it.type !== 0 && (!q || it.name.toLowerCase().includes(q)));
    if (!items.length) return '';
    return `
      <div>
        <div class="aks-remap-group-title">${g.title}</div>
        <div class="aks-remap-keys">
          ${items.map((it) => `<button type="button" class="aks-remap-key" data-rt="${it.type}" data-rc1="${it.c1}" data-rc2="${it.c2}" title="${it.name}">${it.name}</button>`).join('')}
        </div>
      </div>`;
  }).join('');
}

function keyNameByHwIndex(idx) {
  if (idx === null || idx === undefined) return '+';
  const k = S.keys.find((x) => x.hwIndex === idx);
  return k ? k.name : '#' + idx;
}

function tupleSlotLabel(t) {
  if (!t || (t.type === 0 && t.code1 === 0 && t.code2 === 0)) return '+';
  return keyTupleName(t);
}

function renderDksMatrix() {
  const wrap = $('dks-matrix-rows');
  if (!wrap) return;
  const p1 = Number($('dks-p1').value) || 1.0;
  const p2 = Number($('dks-p2').value) || 3.0;
  $('lbl-dks-r1').textContent = p2.toFixed(2);
  $('lbl-dks-r2').textContent = p1.toFixed(2);

  wrap.innerHTML = S.aksDraft.dksRows.map((row, rIdx) => {
    const filled = row.key && !(row.key.type === 0 && row.key.code1 === 0 && row.key.code2 === 0);
    const sel = S.aksActiveSlot === `dksRow${rIdx}`;
    const bars = [];
    let start = -1;
    for (let s = 0; s <= 4; s++) {
      if (s < 4 && row.stages[s]) {
        if (start < 0) start = s;
      } else if (start >= 0) {
        if (s - 1 > start) {
          const leftPct = 12.5 + start * 25;
          const widthPct = (s - 1 - start) * 25;
          bars.push(`<div class="aks-dks-bar" style="left:${leftPct}%;width:${widthPct}%"></div>`);
        }
        start = -1;
      }
    }
    return `
      <div class="aks-dks-row">
        <div class="aks-dks-bound-key ${filled ? 'filled' : ''} ${sel ? 'selected' : ''}" data-slot="dksRow${rIdx}">
          <span>${filled ? tupleSlotLabel(row.key) : '+'}</span>
          ${filled ? `<button type="button" class="aks-key-slot__clear" data-clear-dks="${rIdx}" title="Clear">&times;</button>` : ''}
        </div>
        <div class="aks-dks-stages">
          ${bars.join('')}
          ${[0, 1, 2, 3].map((st) => `
            <button type="button" class="aks-dks-node ${row.stages[st] ? 'on' : ''}" data-dks-row="${rIdx}" data-dks-stage="${st}">
              ${row.stages[st] ? '&#10003;' : '+'}
            </button>`).join('')}
        </div>
      </div>`;
  }).join('');
}

function syncAksSlotBoxesUI() {
  const map = [
    ['slot-rs-1', 'slot-rs-1-val', S.aksDraft.rs1 != null, keyNameByHwIndex(S.aksDraft.rs1), 'rs1'],
    ['slot-rs-2', 'slot-rs-2-val', S.aksDraft.rs2 != null, keyNameByHwIndex(S.aksDraft.rs2), 'rs2'],
    ['slot-socd-1', 'slot-socd-1-val', S.aksDraft.socd1 != null, keyNameByHwIndex(S.aksDraft.socd1), 'socd1'],
    ['slot-socd-2', 'slot-socd-2-val', S.aksDraft.socd2 != null, keyNameByHwIndex(S.aksDraft.socd2), 'socd2'],
    ['slot-dks-key', 'slot-dks-key-val', S.aksDraft.dksIdx != null, keyNameByHwIndex(S.aksDraft.dksIdx), 'dksKey'],
    ['slot-mt-key', 'slot-mt-key-val', S.aksDraft.mtIdx != null, keyNameByHwIndex(S.aksDraft.mtIdx), 'mtKey'],
    ['slot-mt-hold', 'slot-mt-hold-val', !!S.aksDraft.mtHold, tupleSlotLabel(S.aksDraft.mtHold), 'mtHold'],
    ['slot-mt-tap', 'slot-mt-tap-val', !!S.aksDraft.mtTap, tupleSlotLabel(S.aksDraft.mtTap), 'mtTap'],
    ['slot-tgl-key', 'slot-tgl-key-val', S.aksDraft.tglIdx != null, keyNameByHwIndex(S.aksDraft.tglIdx), 'tglKey'],
    ['slot-tgl-out', 'slot-tgl-out-val', !!S.aksDraft.tglOut, tupleSlotLabel(S.aksDraft.tglOut), 'tglOut'],
  ];
  for (const [boxId, valId, isFilled, text, slotName] of map) {
    const box = $(boxId);
    const val = $(valId);
    if (!box || !val) continue;
    val.textContent = text;
    box.classList.toggle('filled', isFilled);
    box.classList.toggle('selected', S.aksActiveSlot === slotName);
  }
  if (S.aksDrawer === 'dks') renderDksMatrix();
}

function setActiveAksSlot(slotName) {
  S.aksActiveSlot = slotName;
  syncAksSlotBoxesUI();
}

function assignPhysicalKeyToAks(hwIndex) {
  if (S.aksDrawer === 'rs') {
    if (S.aksActiveSlot === 'rs2') {
      S.aksDraft.rs2 = hwIndex;
    } else {
      S.aksDraft.rs1 = hwIndex;
      S.aksActiveSlot = 'rs2';
    }
  } else if (S.aksDrawer === 'socd') {
    if (S.aksActiveSlot === 'socd2') {
      S.aksDraft.socd2 = hwIndex;
    } else {
      S.aksDraft.socd1 = hwIndex;
      S.aksActiveSlot = 'socd2';
    }
  } else if (S.aksDrawer === 'dks') {
    S.aksDraft.dksIdx = hwIndex;
    if (S.aksActiveSlot === 'dksKey') S.aksActiveSlot = 'dksRow0';
  } else if (S.aksDrawer === 'mt') {
    S.aksDraft.mtIdx = hwIndex;
    if (S.aksActiveSlot === 'mtKey') S.aksActiveSlot = 'mtHold';
  } else if (S.aksDrawer === 'tgl') {
    S.aksDraft.tglIdx = hwIndex;
    if (S.aksActiveSlot === 'tglKey') S.aksActiveSlot = 'tglOut';
  }
  syncAksSlotBoxesUI();
  renderChassis();
}

function assignRemapTupleToAks(tuple) {
  if (S.aksDrawer === 'mt') {
    if (S.aksActiveSlot === 'mtTap') {
      S.aksDraft.mtTap = tuple;
    } else {
      S.aksDraft.mtHold = tuple;
      S.aksActiveSlot = 'mtTap';
    }
  } else if (S.aksDrawer === 'tgl') {
    S.aksDraft.tglOut = tuple;
  } else if (S.aksDrawer === 'dks') {
    let rowIdx = 0;
    if (S.aksActiveSlot && S.aksActiveSlot.startsWith('dksRow')) {
      rowIdx = Number(S.aksActiveSlot.slice(6)) || 0;
    }
    S.aksDraft.dksRows[rowIdx].key = tuple;
    if (!S.aksDraft.dksRows[rowIdx].stages.some(Boolean)) {
      S.aksDraft.dksRows[rowIdx].stages[rowIdx] = true;
    }
    if (rowIdx < 3) S.aksActiveSlot = `dksRow${rowIdx + 1}`;
  }
  syncAksSlotBoxesUI();
}

function openAksDrawer(type, editMeta = null) {
  S.aksDrawer = type;
  const titles = {
    rs: ['Rappy Snappy (RS)', 'Monitors 2 keys; whichever key is pressed deeper dynamically activates'],
    socd: ['SOCD (Snap Tap)', 'When two keys are pressed simultaneously, trigger input according to priority rule'],
    dks: ['Dynamic Keystroke (DKS)', 'Bind 1–4 actions across press & release travel stages'],
    mt: ['Hold / Tap (MT)', 'Single key dual action: Hold for one key, Tap for another'],
    tgl: ['Toggle Key (TGL)', 'Tap once for continuous hold, tap again to release'],
  };
  $('aks-drawer-title').textContent = titles[type][0];
  $('aks-drawer-desc').textContent = titles[type][1];
  for (const t of ['rs', 'socd', 'dks', 'mt', 'tgl']) {
    $('aks-body-' + t).style.display = t === type ? 'flex' : 'none';
  }
  $('aks-remap-col').style.display = ['dks', 'mt', 'tgl'].includes(type) ? 'flex' : 'none';

  const preKey = editMeta ? editMeta.i1 : S.aksFocusKey;

  if (type === 'rs') {
    if (editMeta) {
      S.aksDraft.rs1 = editMeta.i1;
      S.aksDraft.rs2 = editMeta.i2;
    }
    S.aksActiveSlot = 'rs1';
  } else if (type === 'socd') {
    if (editMeta) {
      S.aksDraft.socd1 = editMeta.i1;
      S.aksDraft.socd2 = editMeta.i2;
      const prio = (S.triggers[editMeta.i1] || {}).priority || 0;
      document.querySelectorAll('input[name="socd-prio"]').forEach((r) => {
        r.checked = Number(r.value) === prio;
        r.closest('.aks-trigger__item').classList.toggle('active', r.checked);
      });
    }
    S.aksActiveSlot = 'socd1';
  } else if (type === 'mt') {
    S.aksDraft.mtIdx = preKey;
    if (editMeta && S.keyMatrix[editMeta.i1]?.type === 146) {
      const km = S.keyMatrix[editMeta.i1];
      const slot = (S.advancedKeys.mt || [])[km.code1];
      S.aksDraft.mtTap = slot ? { ...slot.click } : null;
      S.aksDraft.mtHold = slot ? { ...slot.down } : null;
      S.aksDraft.mtTime = (km.code2 || 15) * 10;
    } else {
      const defK = preKey != null ? S.keys.find((x) => x.hwIndex === preKey)?.defTuple : null;
      S.aksDraft.mtTap = defK ? { ...defK } : null;
      S.aksDraft.mtHold = null;
      S.aksDraft.mtTime = 150;
    }
    $('mt-time').value = S.aksDraft.mtTime;
    $('lbl-mt-time').textContent = S.aksDraft.mtTime;
    S.aksActiveSlot = preKey != null ? 'mtHold' : 'mtKey';
  } else if (type === 'tgl') {
    S.aksDraft.tglIdx = preKey;
    if (editMeta && S.keyMatrix[editMeta.i1]?.type === 145) {
      const slot = (S.advancedKeys.tgl || [])[S.keyMatrix[editMeta.i1].code1];
      S.aksDraft.tglOut = slot ? { ...slot } : null;
    } else {
      const defK = preKey != null ? S.keys.find((x) => x.hwIndex === preKey)?.defTuple : null;
      S.aksDraft.tglOut = defK ? { ...defK } : null;
    }
    S.aksActiveSlot = preKey != null ? 'tglOut' : 'tglKey';
  } else if (type === 'dks') {
    S.aksDraft.dksIdx = preKey;
    if (editMeta && S.keyMatrix[editMeta.i1]?.type === 144) {
      const slot = (S.advancedKeys.dks || [])[S.keyMatrix[editMeta.i1].code1];
      const p1 = ((slot?.points?.[0] || 10) / 10).toFixed(1);
      const p2 = ((slot?.points?.[1] || 30) / 10).toFixed(1);
      $('dks-p1').value = p1;
      $('dks-p2').value = p2;
      S.aksDraft.dksRows = [0, 1, 2, 3].map((i) => ({
        key: slot?.actions?.[i] && slot.actions[i].type !== 0 ? { ...slot.actions[i] } : null,
        stages: decodeDksStageFlags(slot?.flags?.[i] || 0),
      }));
    } else {
      $('dks-p1').value = '1.0';
      $('dks-p2').value = '3.0';
      S.aksDraft.dksRows = [0, 1, 2, 3].map(() => ({ key: null, stages: [false, false, false, false] }));
    }
    S.aksActiveSlot = preKey != null ? 'dksRow0' : 'dksKey';
  }

  syncAksSlotBoxesUI();
  $('aks-drawer').style.display = 'flex';
  renderChassis();
}

function closeAksDrawer() {
  S.aksDrawer = null;
  S.aksActiveSlot = null;
  $('aks-drawer').style.display = 'none';
  renderChassis();
}

function renderActiveAdvancedBindings() {
  const box = $('adv-bindings-list');
  const rows = [];
  const seenPairs = new Set();

  for (const k of S.keys) {
    const km = S.keyMatrix[k.hwIndex];
    if (!km) continue;
    if (km.type === 148 || km.type === 147) {
      const isRs = km.type === 147;
      const pairKey = `${km.type}:` + [k.hwIndex, km.code2].sort((a, b) => a - b).join('-');
      if (seenPairs.has(pairKey)) continue;
      seenPairs.add(pairKey);
      const other = S.keys.find((x) => x.hwIndex === km.code2);
      const prio = (S.triggers[k.hwIndex] || {}).priority || 0;
      const pName = isRs ? 'Deeper Press Wins' : (['Last Input', 'Key 1 Prio', 'Key 2 Prio', 'Neutral'][prio] || 'Last Input');
      rows.push(`
        <div class="aks-bind-row" data-edit-adv="${isRs ? 'rs' : 'socd'}" data-i1="${k.hwIndex}" data-i2="${km.code2}">
          <div class="aks-bind-content">
            <div class="aks-bind-keys">
              <span class="aks-keycap-tile">${k.name}</span>
              <span class="aks-keycap-tile">${other ? other.name : '#' + km.code2}</span>
            </div>
            <div class="aks-bind-vdiv"></div>
            <div>
              <span class="aks-icon ${isRs ? 'aks-icon--rs' : 'aks-icon--socd'}" style="width:auto;height:22px;padding:0 7px;font-size:10px;border-radius:6px">${isRs ? 'RS' : 'SOCD'}</span>
              <div class="tiny-muted" style="margin-top:2px">${pName}</div>
            </div>
          </div>
          <button class="aks-bind-del" data-del-adv="pair" data-i1="${k.hwIndex}" data-i2="${km.code2}" title="Delete binding">&#128465;</button>
        </div>
      `);
    } else if (km.type === 146) {
      const slot = (S.advancedKeys.mt || [])[km.code1];
      const tapN = slot ? keyTupleName(slot.click) : '?';
      const holdN = slot ? keyTupleName(slot.down) : '?';
      rows.push(`
        <div class="aks-bind-row" data-edit-adv="mt" data-i1="${k.hwIndex}">
          <div class="aks-bind-content">
            <div class="aks-bind-keys"><span class="aks-keycap-tile">${k.name}</span></div>
            <div class="aks-bind-vdiv"></div>
            <div>
              <span class="aks-icon aks-icon--mt" style="width:auto;height:22px;padding:0 7px;font-size:10px;border-radius:6px">MT</span>
              <div class="tiny-muted" style="margin-top:2px">Hold ${holdN} / Tap ${tapN} (${km.code2 * 10}ms)</div>
            </div>
          </div>
          <button class="aks-bind-del" data-del-adv="single" data-i1="${k.hwIndex}" title="Delete binding">&#128465;</button>
        </div>
      `);
    } else if (km.type === 145) {
      const slot = (S.advancedKeys.tgl || [])[km.code1];
      const tgt = slot ? keyTupleName(slot) : '?';
      rows.push(`
        <div class="aks-bind-row" data-edit-adv="tgl" data-i1="${k.hwIndex}">
          <div class="aks-bind-content">
            <div class="aks-bind-keys"><span class="aks-keycap-tile">${k.name}</span></div>
            <div class="aks-bind-vdiv"></div>
            <div>
              <span class="aks-icon aks-icon--tgl" style="width:auto;height:22px;padding:0 7px;font-size:10px;border-radius:6px">TGL</span>
              <div class="tiny-muted" style="margin-top:2px">&rarr; ${tgt}</div>
            </div>
          </div>
          <button class="aks-bind-del" data-del-adv="single" data-i1="${k.hwIndex}" title="Delete binding">&#128465;</button>
        </div>
      `);
    } else if (km.type === 144) {
      const slot = (S.advancedKeys.dks || [])[km.code1];
      const acts = slot ? slot.actions.filter((a) => a && a.type !== 0).map(keyTupleName).join(', ') : '';
      rows.push(`
        <div class="aks-bind-row" data-edit-adv="dks" data-i1="${k.hwIndex}">
          <div class="aks-bind-content">
            <div class="aks-bind-keys"><span class="aks-keycap-tile">${k.name}</span></div>
            <div class="aks-bind-vdiv"></div>
            <div>
              <span class="aks-icon aks-icon--dks" style="width:auto;height:22px;padding:0 7px;font-size:10px;border-radius:6px">DKS</span>
              <div class="tiny-muted" style="margin-top:2px">${acts || '4-stage'}</div>
            </div>
          </div>
          <button class="aks-bind-del" data-del-adv="single" data-i1="${k.hwIndex}" title="Delete binding">&#128465;</button>
        </div>
      `);
    }
  }

  $('aks-bind-count').textContent = `${rows.length}/40`;
  box.innerHTML = rows.length ? rows.join('') : '<div class="tiny-muted">No advanced keys bound on this layer.</div>';
}

function applyHardwareState(st) {
  S.connected = true;
  S.connectedPath = (st.device && st.device.path) || '';
  S.profile = st.profile || 0;
  S.profileCount = st.profileCount || 3;
  if (Array.isArray(st.profileNames) && st.profileNames.length) {
    S.profileNames = st.profileNames;
  }
  if (st.device && st.device.modelTag && S.models[st.device.modelTag]) {
    if (S.modelTag !== st.device.modelTag) {
      S.modelTag = st.device.modelTag;
      buildLayoutForModel(S.modelTag);
    }
  }
  const mName = (st.device && st.device.modelName) || 'Ace 68';
  $('device-title').textContent = mName;
  $('model-chip').textContent = `${mName} · FW v${st.firmwareVer}`;
  $('lbl-fw-ver').textContent = st.firmwareVer || '--';
  $('conn-badge').className = 'conn-badge live';
  $('conn-label').textContent = 'Wired';

  S.triggers = st.triggers || S.triggers;
  S.keyMatrix = st.keyMatrix || [];
  S.lighting = st.lighting || S.lighting;
  S.performance = st.performance || S.performance;
  if (Array.isArray(st.customColors) && st.customColors.length) {
    S.customColors = st.customColors;
  }
  if (st.advancedKeys) {
    S.advancedKeys = {
      dks: st.advancedKeys.dks || S.advancedKeys.dks,
      mt: st.advancedKeys.mt || S.advancedKeys.mt,
      tgl: st.advancedKeys.tgl || S.advancedKeys.tgl,
    };
  }

  renderProfileList();
  renderLightingEffects();
  syncPerfUI();
  renderActiveAdvancedBindings();
  renderChassis();
}

function startEventStream() {
  if (S.sse) {
    S.sse.close();
    S.sse = null;
  }
  if (!S.connected) return;
  const es = new EventSource('/api/events');
  es.onmessage = (e) => {
    try {
      const ev = JSON.parse(e.data);
      if (ev.kind === 'travel') {
        handleLiveTravelEvent(ev);
      } else if (ev.kind === 'funcUpdate' || ev.kind === 'profile') {
        api(`/api/state?profile=${ev.kind === 'profile' ? ev.profile : S.profile}&layer=${S.layer}`).then((r) => {
          if (r.ok && r.state) applyHardwareState(r.state);
        });
      }
    } catch {}
  };
  S.sse = es;
}

function findKeyIndexByTuple(type, code1, code2) {
  const t = Number(type || 0);
  const c1 = Number(code1 || 0);
  const c2 = Number(code2 || 0);
  const dk = S.defaultKeys.find((d) => d && d.type === t && d.code1 === c1 && d.code2 === c2);
  if (dk) return dk.index;
  const k = S.keys.find((x) => x.defTuple && x.defTuple.type === t && x.defTuple.code1 === c1 && x.defTuple.code2 === c2);
  return k ? k.hwIndex : -1;
}

function updateLiveHidVisualizer(idx, travel) {
  const active = travel > 10;
  const pct = active ? Math.min(100, Math.max(4, Math.round((travel / S.maxTravel) * 100))) : 0;
  const trig = idx >= 0 ? (S.triggers[idx] || { keyActuation: 100 }) : { keyActuation: 100 };
  const ap = trig.keyActuation || 100;
  const apPct = Math.min(96, Math.max(4, Math.round((ap / S.maxTravel) * 100)));
  const isTriggered = active && travel >= ap;

  if (travel > S.livePeakTravel) S.livePeakTravel = travel;

  if (idx >= 0) {
    $('live-hid-key').textContent = keyNameByHwIndex(idx);
  }
  $('live-hid-mm').textContent = `${(travel / 100).toFixed(2)} mm`;
  $('live-hid-peak').textContent = `${(S.livePeakTravel / 100).toFixed(2)} mm`;
  $('live-meter-fill').style.height = pct + '%';
  $('live-meter-ap').style.top = apPct + '%';
  $('live-mech-ap').style.top = apPct + '%';

  const shiftPx = active ? Math.round((travel / S.maxTravel) * 22) : 0;
  $('live-mech-cap').style.transform = `translateY(${shiftPx}px)`;
  $('live-mech-stem').style.transform = `translateY(${shiftPx}px)`;
  $('live-mech-cap').classList.toggle('active', isTriggered);

  const stPill = $('live-hid-state');
  stPill.textContent = isTriggered ? 'TRIGGERED' : (active ? 'PRESSING' : 'IDLE');
  stPill.classList.toggle('on', isTriggered);
}

function handleLiveTravelEvent(ev) {
  const idx = findKeyIndexByTuple(ev.keyType, ev.code1, ev.code2);
  if (idx < 0) return;

  if (S.calibrating && ev.calibrated) {
    if (!S.calibratedSet.has(idx)) {
      S.calibratedSet.add(idx);
      $('cal-count').textContent = S.calibratedSet.size;
      const cCap = document.querySelector(`.kcap[data-idx="${idx}"]`);
      if (cCap) cCap.classList.add('calibrated');
    }
  }

  const rawTravel = Math.max(0, Math.min(S.maxTravel, Number(ev.travel || 0)));
  const active = rawTravel > 10;
  const effTravel = active ? rawTravel : 0;

  // Ignore unchanged idle scan packets (e.g. firmware scanning index 0 at 0.00mm)
  // so they never overwrite an actively pressed key in the HID Travel Monitor.
  if (S.keyTravels[idx] === effTravel) return;
  S.keyTravels[idx] = effTravel;

  const pct = active ? Math.min(100, Math.max(4, Math.round((effTravel / S.maxTravel) * 100))) : 0;
  const trig = S.triggers[idx] || { keyActuation: 100 };
  const isTriggered = active && effTravel >= (trig.keyActuation || 100);

  const fillEl = document.getElementById('kfill-' + idx);
  if (fillEl) fillEl.style.height = pct + '%';
  const capEl = document.querySelector(`.kcap[data-idx="${idx}"]`);
  if (capEl) {
    capEl.classList.toggle('live-pressed', active && !isTriggered);
    capEl.classList.toggle('live-triggered', isTriggered);
  }
  const valEl = document.getElementById('kval-' + idx);
  if (valEl) {
    valEl.textContent = active ? (effTravel / 100).toFixed(2) : (valEl.dataset.def || valEl.textContent);
  }

  if (S.liveTravelOn || S.calibrating) {
    // Show the deepest currently pressed key across the whole keyboard
    let bestIdx = -1;
    let bestTravel = 0;
    for (let i = 0; i < S.keyTravels.length; i++) {
      if (S.keyTravels[i] > bestTravel) {
        bestTravel = S.keyTravels[i];
        bestIdx = i;
      }
    }
    if (bestIdx >= 0) {
      S.lastActiveKeyIdx = bestIdx;
      updateLiveHidVisualizer(bestIdx, bestTravel);
    } else {
      updateLiveHidVisualizer(S.lastActiveKeyIdx >= 0 ? S.lastActiveKeyIdx : idx, 0);
    }

    if (S.liveTravelOn) {
      if (bestIdx >= 0) {
        const bPct = Math.min(100, Math.max(4, Math.round((bestTravel / S.maxTravel) * 100)));
        $('live-travel-badge').textContent = `Live: ${keyNameByHwIndex(bestIdx)} · ${(bestTravel / 100).toFixed(2)} mm`;
        $('v-live-line').style.display = 'block';
        $('v-live-line').style.top = bPct + '%';
      } else {
        $('live-travel-badge').textContent = 'Live: 0.00 mm';
        $('v-live-line').style.display = 'none';
      }
    }
  }
}

async function connectHardware(silent = false, targetPath = '') {
  const t0 = performance.now();
  const res = targetPath ? await api('/api/connect', { path: targetPath }) : await api('/api/connect');
  if (res.ok && res.state) {
    const ms = Math.round(performance.now() - t0);
    $('latency-pill').textContent = `${ms}ms Sync`;
    applyHardwareState(res.state);
    startEventStream();
    if (!silent) toast(`Connected to ${res.state.device.modelName} (${ms}ms)`);
    return true;
  } else {
    S.connected = false;
    S.connectedPath = '';
    $('conn-badge').className = 'conn-badge demo';
    $('conn-label').textContent = 'Offline Preview';
    $('latency-pill').textContent = 'USB Unplugged';
    if (!silent) toast(res.error || 'Keyboard not detected on USB', true);
    renderChassis();
    return false;
  }
}

async function disconnectHardware() {
  if (S.sse) { S.sse.close(); S.sse = null; }
  await api('/api/disconnect', {});
  S.connected = false;
  S.connectedPath = '';
  $('conn-badge').className = 'conn-badge demo';
  $('conn-label').textContent = 'Disconnected';
  $('latency-pill').textContent = 'Not Connected';
  toast('Disconnected from keyboard');
}

async function refreshDeviceModal() {
  const listEl = $('device-list');
  listEl.innerHTML = '<div class="tiny-muted">Scanning USB HID interfaces...</div>';
  const res = await api('/api/status');
  const devs = (res && res.devices) || [];
  const activePath = (res && res.connectedPath) || S.connectedPath;
  $('btn-disconnect-dev').style.display = activePath ? 'inline-flex' : 'none';

  if (!devs.length) {
    listEl.innerHTML = `
      <div class="dev-item">
        <div class="dev-meta">
          <div class="dev-name">No MCHOSE keyboard detected</div>
          <div class="dev-sub">Plug in your MCHOSE keyboard via USB cable (or 2.4G dongle) and click Scan USB Devices.</div>
        </div>
      </div>`;
    return;
  }

  listEl.innerHTML = devs.map((d, i) => {
    const vid = d.vendorId.toString(16).toUpperCase().padStart(4, '0');
    const pid = d.productId.toString(16).toUpperCase().padStart(4, '0');
    const isAct = activePath && activePath.toLowerCase() === d.path.toLowerCase();
    return `
      <div class="dev-item ${isAct ? 'active' : ''}">
        <div class="dev-meta">
          <div class="dev-name">${d.modelName || d.productName || 'MCHOSE Keyboard'} ${isAct ? '· Connected' : ''}</div>
          <div class="dev-sub">VID:PID ${vid}:${pid} · USB "${d.productName || 'HID'}" · Usage 0x${d.usagePage.toString(16).toUpperCase()}:0x${d.usage.toString(16).toUpperCase()}</div>
        </div>
        <button class="${isAct ? 'pill-outline' : 'pill-dark'}" data-connect-idx="${i}">${isAct ? 'Reconnect' : 'Connect'}</button>
      </div>`;
  }).join('');

  listEl.querySelectorAll('[data-connect-idx]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const dev = devs[Number(btn.dataset.connectIdx)];
      btn.disabled = true;
      btn.textContent = 'Connecting...';
      const ok = await connectHardware(false, dev.path);
      if (ok) $('device-modal').style.display = 'none';
      else await refreshDeviceModal();
    });
  });
}

function openDeviceModal() {
  $('device-modal').style.display = 'flex';
  refreshDeviceModal();
}

async function pushSelectedTriggers(indices) {
  const targets = indices || [...S.selected];
  if (!targets.length) {
    toast('Select keys on the keyboard first (e.g. Select WASD or Full Selection)', true);
    return;
  }
  const ap = Number($('rng-ap').value);
  const rt = $('chk-rt').checked ? 1 : 0;
  const rtp = Number($('rng-rt-p').value);
  const rtr = Number($('rng-rt-r').value);
  const dzt = Number($('rng-dz-t').value);
  const dzb = Number($('rng-dz-b').value);
  const sw = Number($('switch-select').value);

  const updates = {};
  for (const idx of targets) {
    const cur = S.triggers[idx] || {};
    const next = {
      ...cur,
      switchType: sw,
      keyMode: rt,
      keyActuation: ap,
      rtPress: rtp,
      rtRelease: rtr,
      pressDeadzone: dzt,
      releaseDeadzone: dzb,
    };
    S.triggers[idx] = next;
    updates[idx] = next;
  }
  renderChassis();

  if (S.connected) {
    const res = await api('/api/triggers', { profile: S.profile, updates });
    if (res.ok) {
      $('latency-pill').textContent = `${res.ms}ms Write`;
      toast(`Saved ${targets.length} key(s) in ${res.ms}ms`);
    } else {
      toast('Write error: ' + res.error, true);
    }
  } else {
    toast(`Preview updated (${targets.length} keys)`);
  }
}

async function pushLighting() {
  if (S.lightScope === 'main') {
    S.lighting.speed = Number($('rng-l-speed').value);
    S.lighting.brightness = Number($('rng-l-bright').value);
    S.lighting.customColorDisabled = $('chk-l-rainbow').checked ? 1 : 0;
    S.lighting.hexColor = $('inp-l-color').value;
  } else {
    S.lighting.side_speed = Number($('rng-l-speed').value);
    S.lighting.side_brightness = Number($('rng-l-bright').value);
    S.lighting.sideCustomColorDisabled = $('chk-l-rainbow').checked ? 1 : 0;
    S.lighting.side_hexColor = $('inp-l-color').value;
  }
  S.lighting.direct = $('chk-l-dir').checked ? 1 : 0;
  renderLightingEffects();
  renderChassis();

  if (S.connected) {
    const res = await api('/api/lighting', { profile: S.profile, lighting: S.lighting });
    if (!res.ok) toast('Lighting error: ' + res.error, true);
  }
}

async function pushPerf(updateRate = false) {
  if (S.connected) {
    const res = await api('/api/performance', {
      profile: S.profile,
      updateRate,
      performance: S.performance,
    });
    if (res.ok) toast('Performance updated');
    else toast('Error: ' + res.error, true);
  }
}

function findFreeMtSlots(count) {
  const used = new Set();
  for (const km of S.keyMatrix) {
    if (km && (km.type === 146 || km.type === 147 || km.type === 148 || km.type === 149)) {
      used.add(km.code1);
    }
  }
  const free = [];
  for (let i = 0; i < 32 && free.length < count; i++) {
    if (!used.has(i)) free.push(i);
  }
  return free;
}

function findFreeTglSlot() {
  const used = new Set();
  for (const km of S.keyMatrix) {
    if (km && km.type === 145) used.add(km.code1);
  }
  for (let i = 0; i < 32; i++) {
    if (!used.has(i)) return i;
  }
  return -1;
}

async function bindPairMode(modeType, idx1, idx2, priority = 0) {
  if (idx1 == null || idx2 == null || idx1 === idx2) {
    toast('Key 1 and Key 2 must be two different keys', true);
    return false;
  }
  const k1 = S.keys.find((k) => k.hwIndex === idx1);
  const k2 = S.keys.find((k) => k.hwIndex === idx2);
  if (!k1 || !k2) return false;

  // Reuse existing slots if re-editing the same pair
  let slots = [];
  const ex1 = S.keyMatrix[idx1];
  const ex2 = S.keyMatrix[idx2];
  if (ex1 && ex2 && ex1.type === modeType && ex2.type === modeType && ex1.code2 === idx2) {
    slots = [ex1.code1, ex2.code1];
  } else {
    slots = findFreeMtSlots(2);
  }
  if (slots.length < 2) {
    toast('No free advanced key slots available (max 32)', true);
    return false;
  }
  const [s0, s1] = slots;
  const mt = [...(S.advancedKeys.mt || [])];
  while (mt.length < 32) mt.push({ click: { type: 0, code1: 0, code2: 0 }, down: { type: 0, code1: 0, code2: 0 } });
  mt[s0] = { click: k1.defTuple, down: k2.defTuple };
  mt[s1] = { click: k2.defTuple, down: k1.defTuple };

  const km1 = { index: idx1, layer: S.layer, type: modeType, code1: s0, code2: idx2 };
  const km2 = { index: idx2, layer: S.layer, type: modeType, code1: s1, code2: idx1 };
  S.keyMatrix[idx1] = km1;
  S.keyMatrix[idx2] = km2;
  S.advancedKeys.mt = mt;

  const p1 = modeType === 148 ? priority : 0;
  const p2 = modeType === 148 ? (priority === 1 ? 2 : priority === 2 ? 1 : priority) : 0;
  const t1 = { ...(S.triggers[idx1] || {}), priority: p1 };
  const t2 = { ...(S.triggers[idx2] || {}), priority: p2 };
  S.triggers[idx1] = t1;
  S.triggers[idx2] = t2;

  renderActiveAdvancedBindings();
  renderChassis();

  const label = modeType === 147 ? 'RS' : 'SOCD';
  if (S.connected) {
    const res = await api('/api/advanced', {
      profile: S.profile,
      layer: S.layer,
      mt,
      keyMaps: [km1, km2],
      triggers: { [idx1]: t1, [idx2]: t2 },
    });
    if (res.ok) toast(`Bound ${label}: ${k1.name} + ${k2.name}`);
    else toast(`${label} failed: ` + res.error, true);
  } else {
    toast(`[Preview] Bound ${label}: ${k1.name} + ${k2.name}`);
  }
  return true;
}

async function restoreDefaultKeys(indices) {
  const keyMaps = [];
  const triggers = {};
  for (const idx of indices) {
    const k = S.keys.find((x) => x.hwIndex === idx);
    if (!k) continue;
    const km = { index: idx, layer: S.layer, type: k.defTuple.type, code1: k.defTuple.code1, code2: k.defTuple.code2 };
    S.keyMatrix[idx] = km;
    keyMaps.push(km);
    if (S.triggers[idx] && S.triggers[idx].priority !== 0) {
      S.triggers[idx] = { ...S.triggers[idx], priority: 0 };
      triggers[idx] = S.triggers[idx];
    }
  }
  renderActiveAdvancedBindings();
  renderChassis();
  if (S.connected && keyMaps.length) {
    const res = await api('/api/advanced', { profile: S.profile, layer: S.layer, keyMaps, triggers });
    if (res.ok) toast('Restored default key binding');
    else toast('Error: ' + res.error, true);
  }
}

function populateKeyPicker() {
  $('keypicker-container').innerHTML = KEY_PICKER_GROUPS.map(
    (g) => `
      <div>
        <div class="kp-group-title">${g.title}</div>
        <div class="kp-list">
          ${g.items.map((it) => `<button class="kp-btn" data-t="${it.type}" data-c1="${it.c1}" data-c2="${it.c2}" data-n="${it.name}">${it.name}</button>`).join('')}
        </div>
      </div>`
  ).join('');

  $('keypicker-container').addEventListener('click', async (e) => {
    const b = e.target.closest('.kp-btn');
    if (!b) return;
    if (!S.selected.size) {
      toast('Click a key on the keyboard first', true);
      return;
    }
    const keyIndex = [...S.selected][0];
    const type = Number(b.dataset.t);
    const code1 = Number(b.dataset.c1);
    const code2 = Number(b.dataset.c2);
    S.keyMatrix[keyIndex] = { index: keyIndex, layer: S.layer, type, code1, code2 };
    renderChassis();
    if (S.connected) {
      const res = await api('/api/remap', { profile: S.profile, layer: S.layer, keyIndex, type, code1, code2 });
      if (res.ok) toast(`Remapped to ${b.dataset.n}`);
      else toast('Remap failed: ' + res.error, true);
    } else {
      toast(`[Preview] Remapped to ${b.dataset.n}`);
    }
  });
}

function syncStageForTab() {
  const name = S.activeTab;
  $('keyboard-stage-wrap').style.display = (name === 'other' || name === 'performance') && !S.calibrating ? 'none' : 'flex';
  $('preview-mode-box').style.display = name === 'trigger' ? 'flex' : 'none';
  const showLiveViz = (S.liveTravelOn && name === 'trigger') || S.calibrating;
  $('live-hid-card').style.display = showLiveViz ? 'flex' : 'none';
  $('stage-select-actions').style.display = name === 'trigger' && !showLiveViz ? 'flex' : 'none';
}

async function setLiveTravel(enabled) {
  S.liveTravelOn = enabled;
  S.livePeakTravel = 0;
  S.keyTravels.fill(0);
  S.lastActiveKeyIdx = -1;
  $('chk-live-travel').checked = enabled;
  $('live-travel-badge').style.display = enabled ? 'inline-block' : 'none';
  syncStageForTab();
  if (enabled) {
    $('live-travel-badge').textContent = 'Live: Press any key...';
    $('live-hid-key').textContent = '--';
    updateLiveHidVisualizer(-1, 0);
    if (S.connected && (!S.sse || S.sse.readyState === EventSource.CLOSED)) {
      startEventStream();
    }
  } else {
    $('v-live-line').style.display = 'none';
    document.querySelectorAll('.k-travel-fill').forEach((el) => (el.style.height = '0%'));
    document.querySelectorAll('.kcap').forEach((el) => el.classList.remove('live-pressed', 'live-triggered'));
    document.querySelectorAll('.k-val').forEach((el) => { if (el.dataset.def) el.textContent = el.dataset.def; });
  }
  if (S.connected) {
    const res = await api('/api/debug-mode', { profile: S.profile, enabled });
    if (!res.ok) toast('Live travel error: ' + res.error, true);
  }
}

async function startCalibrationFlow() {
  if (!S.connected) {
    toast('Connect keyboard first', true);
    return;
  }
  if (!S.sse || S.sse.readyState === EventSource.CLOSED) startEventStream();
  const res = await api('/api/calibrate', { profile: S.profile, action: 'start' });
  if (res.ok) {
    S.calibrating = true;
    S.livePeakTravel = 0;
    S.calibratedSet.clear();
    $('cal-count').textContent = '0';
    $('cal-banner').style.display = 'flex';
    $('btn-cal-start').disabled = true;
    $('btn-cal-end').disabled = false;
    updateLiveHidVisualizer(-1, 0);
    syncStageForTab();
    renderChassis();
    toast('Calibration started! Press every key firmly to bottom-out.');
  } else {
    toast(res.error || 'Calibration start failed', true);
  }
}

async function finishCalibrationFlow() {
  const res = await api('/api/calibrate', { profile: S.profile, action: 'end' });
  S.calibrating = false;
  S.calibratedSet.clear();
  $('cal-banner').style.display = 'none';
  $('btn-cal-start').disabled = false;
  $('btn-cal-end').disabled = true;
  syncStageForTab();
  renderChassis();
  if (res.ok) toast('Calibration saved to keyboard!');
}

function bindEvents() {
  $('btn-reconnect').addEventListener('click', () => connectHardware(false, S.connectedPath));
  $('btn-connect-device').addEventListener('click', openDeviceModal);
  $('conn-badge').addEventListener('click', openDeviceModal);
  $('btn-close-modal').addEventListener('click', () => { $('device-modal').style.display = 'none'; });
  $('btn-done-modal').addEventListener('click', () => { $('device-modal').style.display = 'none'; });
  $('device-modal').addEventListener('click', (e) => {
    if (e.target === $('device-modal')) $('device-modal').style.display = 'none';
  });
  $('btn-scan-devices').addEventListener('click', refreshDeviceModal);
  $('btn-disconnect-dev').addEventListener('click', async () => {
    await disconnectHardware();
    await refreshDeviceModal();
  });
  $('btn-apply-now').addEventListener('click', () => pushSelectedTriggers());

  // Top navigation tabs
  document.querySelectorAll('.nav-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.nav-tab').forEach((t) => t.classList.remove('active'));
      document.querySelectorAll('.tab-view').forEach((v) => v.classList.remove('active'));
      tab.classList.add('active');
      const name = tab.dataset.tab;
      S.activeTab = name;
      $('view-' + name).classList.add('active');
      if (name !== 'advanced' && S.aksDrawer) closeAksDrawer();
      if (name === 'keymap' && S.selected.size > 1) {
        S.selected = new Set([[...S.selected][0]]);
      }
      if (name !== 'trigger' && S.liveTravelOn) setLiveTravel(false);
      syncStageForTab();
      renderChassis();
    });
  });

  // Preview mode toggle
  document.querySelectorAll('.preview-opt').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.preview-opt').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      S.previewMode = btn.dataset.pview;
      renderChassis();
    });
  });

  // Live travel test toggle
  $('chk-live-travel').addEventListener('change', () => {
    setLiveTravel($('chk-live-travel').checked);
  });

  // Selection buttons
  $('sel-wasd').addEventListener('click', () => {
    S.selected = new Set(S.keys.filter((k) => ['W','A','S','D'].includes(k.name.toUpperCase())).map((k) => k.hwIndex));
    syncSelectionControls();
  });
  $('sel-all').addEventListener('click', () => {
    S.selected = new Set(S.keys.map((k) => k.hwIndex));
    syncSelectionControls();
  });
  $('sel-inv').addEventListener('click', () => {
    const next = new Set();
    for (const k of S.keys) if (!S.selected.has(k.hwIndex)) next.add(k.hwIndex);
    S.selected = next;
    syncSelectionControls();
  });
  $('sel-none').addEventListener('click', () => {
    S.selected.clear();
    syncSelectionControls();
  });
  $('sel-reset-trig').addEventListener('click', () => {
    $('rng-ap').value = 150;
    $('chk-rt').checked = false;
    $('rng-dz-t').value = 15;
    $('rng-dz-b').value = 15;
    syncTriggerSlidersUI();
    pushSelectedTriggers(S.keys.map((k) => k.hwIndex));
  });

  // Trigger sliders
  $('switch-select').addEventListener('change', () => {
    updateSwitchMaxTravel();
    if (S.selected.size > 0) pushSelectedTriggers();
  });
  for (const id of ['rng-ap', 'chk-rt', 'chk-rt-sep', 'rng-rt-p', 'rng-rt-r', 'rng-dz-t', 'rng-dz-b']) {
    $(id).addEventListener('input', syncTriggerSlidersUI);
    $(id).addEventListener('change', () => {
      if (S.selected.size > 0) pushSelectedTriggers();
    });
  }

  // Onboard profiles & rename
  document.querySelectorAll('.prof-item').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const prof = Number(btn.dataset.prof);
      S.profile = prof;
      renderProfileList();
      if (S.connected) {
        const res = await api('/api/profile', { profile: prof });
        if (res.ok && res.state) {
          applyHardwareState(res.state);
          toast(`Switched to Onboard Profile ${prof + 1}`);
        }
      }
    });
  });

  document.querySelectorAll('.prof-edit').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const idx = Number(btn.dataset.editProf);
      const current = (S.profileNames[idx] || `Profile ${idx + 1}`).replace(/^.*?:/, '');
      const next = prompt(`Rename Onboard Profile ${idx + 1}:`, current);
      if (!next || !next.trim()) return;
      const names = [...S.profileNames];
      while (names.length < S.profileCount) names.push(`Profile ${names.length + 1}`);
      names[idx] = next.trim().slice(0, 32);
      S.profileNames = names;
      renderProfileList();
      if (S.connected) {
        const res = await api('/api/profile-names', { names });
        if (res.ok) toast('Profile name saved to keyboard');
        else toast('Rename error: ' + res.error, true);
      }
    });
  });

  // Presets (matches official M HUB presets)
  document.querySelectorAll('.preset-item').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const p = btn.dataset.preset;
      const wasdSet = new Set(S.keys.filter((k) => ['W','A','S','D'].includes(k.name.toUpperCase())).map((k) => k.hwIndex));
      if (p === 'cs2') {
        const updates = {};
        for (const k of S.keys) {
          const isWasd = wasdSet.has(k.hwIndex);
          const next = {
            ...(S.triggers[k.hwIndex] || {}),
            keyMode: isWasd ? 1 : 0,
            keyActuation: isWasd ? 10 : 150,
            rtPress: isWasd ? 4 : 15,
            rtRelease: isWasd ? 4 : 15,
            pressDeadzone: isWasd ? 0 : 15,
            releaseDeadzone: isWasd ? 0 : 15,
          };
          S.triggers[k.hwIndex] = next;
          updates[k.hwIndex] = next;
        }
        S.selected = wasdSet;
        renderChassis();
        if (S.connected) {
          const res = await api('/api/triggers', { profile: S.profile, updates });
          if (res.ok) toast(`Applied CS2/Valorant Pro preset (${res.ms}ms)`);
        } else toast('[Preview] Applied CS2/Valorant Pro preset');
      } else if (p === 'balanced') {
        $('rng-ap').value = 80; $('chk-rt').checked = true;
        $('rng-rt-p').value = 15; $('rng-rt-r').value = 15;
        $('rng-dz-t').value = 10; $('rng-dz-b').value = 10;
        syncTriggerSlidersUI();
        pushSelectedTriggers(S.keys.map((k) => k.hwIndex));
      } else {
        $('rng-ap').value = 150; $('chk-rt').checked = false;
        $('rng-dz-t').value = 15; $('rng-dz-b').value = 15;
        syncTriggerSlidersUI();
        pushSelectedTriggers(S.keys.map((k) => k.hwIndex));
      }
    });
  });

  // Lighting events
  $('chk-light-enable').addEventListener('change', () => {
    const enable = $('chk-light-enable').checked;
    if (S.lightScope === 'main') {
      if (enable) {
        if (S.lighting.effect === 255) S.lighting.effect = S.lastMainEffect ?? 6;
        S.lighting.brightness = Math.max(1, S.lastMainBright || 4);
      } else {
        if (S.lighting.brightness > 0) S.lastMainBright = S.lighting.brightness;
        S.lighting.brightness = 0;
      }
      $('rng-l-bright').value = S.lighting.brightness;
    } else {
      if (enable) {
        if (S.lighting.side_effect === 4) S.lighting.side_effect = S.lastSideEffect ?? 0;
        S.lighting.side_brightness = Math.max(1, S.lastSideBright || 4);
      } else {
        if (S.lighting.side_brightness > 0) S.lastSideBright = S.lighting.side_brightness;
        S.lighting.side_brightness = 0;
      }
      $('rng-l-bright').value = S.lighting.side_brightness;
    }
    pushLighting();
    toast(`${S.lightScope === 'main' ? 'Main RGB' : 'Side Lightbox'} ${enable ? 'enabled' : 'turned off'}`);
  });

  document.querySelectorAll('[data-lscope]').forEach((b) => {
    b.addEventListener('click', () => {
      document.querySelectorAll('[data-lscope]').forEach((x) => x.classList.remove('active'));
      b.classList.add('active');
      S.lightScope = b.dataset.lscope;
      renderLightingEffects();
      renderChassis();
    });
  });
  $('effects-grid').addEventListener('click', (e) => {
    const b = e.target.closest('.eff-btn');
    if (!b) return;
    const eff = Number(b.dataset.eff);
    if (S.lightScope === 'main') {
      S.lighting.effect = eff;
      // Automatically turn brightness on when selecting a non-off effect while brightness is 0
      if (eff !== 255 && S.lighting.brightness === 0) {
        S.lighting.brightness = Math.max(1, S.lastMainBright || 4);
        $('rng-l-bright').value = S.lighting.brightness;
      }
    } else {
      S.lighting.side_effect = eff;
      if (eff !== 4 && S.lighting.side_brightness === 0) {
        S.lighting.side_brightness = Math.max(1, S.lastSideBright || 4);
        $('rng-l-bright').value = S.lighting.side_brightness;
      }
    }
    pushLighting();
  });
  $('rng-l-speed').addEventListener('input', () => { $('lbl-l-speed').textContent = $('rng-l-speed').value; });
  $('rng-l-bright').addEventListener('input', () => { $('lbl-l-bright').textContent = $('rng-l-bright').value; });
  for (const id of ['rng-l-speed', 'rng-l-bright', 'chk-l-dir', 'chk-l-rainbow', 'inp-l-color']) {
    $(id).addEventListener('change', () => {
      if (id === 'inp-l-color') $('chk-l-rainbow').checked = false;
      pushLighting();
    });
  }
  $('swatch-dots').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    $('inp-l-color').value = b.dataset.c;
    $('chk-l-rainbow').checked = false;
    pushLighting();
  });

  // Per-key Custom RGB painter buttons
  const paintIndices = async (indices, col) => {
    const updates = {};
    for (const i of indices) {
      S.customColors[i] = col;
      updates[i] = col;
    }
    renderChassis();
    if (S.connected) {
      const res = await api('/api/custom-colors', { profile: S.profile, updates });
      if (res.ok) toast(`Updated ${indices.length} key color(s)`);
    }
  };
  $('btn-paint-sel').addEventListener('click', () => {
    if (!S.selected.size) return toast('Select keys first', true);
    paintIndices([...S.selected], $('inp-l-color').value);
  });
  $('btn-paint-all').addEventListener('click', () => paintIndices(S.keys.map((k) => k.hwIndex), $('inp-l-color').value));
  $('btn-paint-clear').addEventListener('click', () => paintIndices(S.keys.map((k) => k.hwIndex), '#000000'));

  // Layer tabs & Restore Key Default
  document.querySelectorAll('#layer-tabs .seg-btn').forEach((b) => {
    b.addEventListener('click', async () => {
      S.layer = Number(b.dataset.layer);
      document.querySelectorAll('#layer-tabs .seg-btn').forEach((x) => x.classList.toggle('active', Number(x.dataset.layer) === S.layer));
      if (S.connected) {
        const res = await api(`/api/state?profile=${S.profile}&layer=${S.layer}`);
        if (res.ok && res.state) applyHardwareState(res.state);
      }
    });
  });
  $('btn-remap-restore').addEventListener('click', () => {
    if (!S.selected.size) return toast('Select a key first', true);
    restoreDefaultKeys([...S.selected]);
  });

  // Advanced Keys: Official 3-Column aks-panel + 88x88 Slot Drawers + 4x4 DKS Matrix + 42x42 Remap Picker
  document.querySelectorAll('[data-aks-open]').forEach((btn) => {
    btn.addEventListener('click', () => openAksDrawer(btn.dataset.aksOpen));
  });
  $('aks-drawer').addEventListener('click', (e) => {
    const clearBtn = e.target.closest('[data-clear-slot]');
    if (clearBtn) {
      e.stopPropagation();
      const s = clearBtn.dataset.clearSlot;
      if (s === 'rs1') S.aksDraft.rs1 = null;
      else if (s === 'rs2') S.aksDraft.rs2 = null;
      else if (s === 'socd1') S.aksDraft.socd1 = null;
      else if (s === 'socd2') S.aksDraft.socd2 = null;
      else if (s === 'dksKey') S.aksDraft.dksIdx = null;
      else if (s === 'mtKey') S.aksDraft.mtIdx = null;
      else if (s === 'mtHold') S.aksDraft.mtHold = null;
      else if (s === 'mtTap') S.aksDraft.mtTap = null;
      else if (s === 'tglKey') S.aksDraft.tglIdx = null;
      else if (s === 'tglOut') S.aksDraft.tglOut = null;
      setActiveAksSlot(s);
      renderChassis();
      return;
    }
    const clearDks = e.target.closest('[data-clear-dks]');
    if (clearDks) {
      e.stopPropagation();
      const r = Number(clearDks.dataset.clearDks);
      S.aksDraft.dksRows[r] = { key: null, stages: [false, false, false, false] };
      setActiveAksSlot(`dksRow${r}`);
      return;
    }
    const stageBtn = e.target.closest('[data-dks-stage]');
    if (stageBtn) {
      const r = Number(stageBtn.dataset.dksRow);
      const st = Number(stageBtn.dataset.dksStage);
      S.aksDraft.dksRows[r].stages[st] = !S.aksDraft.dksRows[r].stages[st];
      renderDksMatrix();
      return;
    }
    const slotEl = e.target.closest('[data-slot]');
    if (slotEl) {
      setActiveAksSlot(slotEl.dataset.slot);
      return;
    }
    const remapBtn = e.target.closest('.aks-remap-key');
    if (remapBtn) {
      assignRemapTupleToAks({
        type: Number(remapBtn.dataset.rt),
        code1: Number(remapBtn.dataset.rc1),
        code2: Number(remapBtn.dataset.rc2),
      });
    }
  });
  $('aks-remap-search').addEventListener('input', (e) => renderAksRemapList(e.target.value));
  $('dks-p1').addEventListener('input', renderDksMatrix);
  $('dks-p2').addEventListener('input', renderDksMatrix);

  document.querySelectorAll('input[name="socd-prio"]').forEach((r) => {
    r.addEventListener('change', () => {
      document.querySelectorAll('#socd-prio-list .aks-trigger__item').forEach((el) => {
        el.classList.toggle('active', el.querySelector('input').checked);
      });
    });
  });
  $('mt-time').addEventListener('input', () => { $('lbl-mt-time').textContent = $('mt-time').value; });
  $('btn-aks-cancel').addEventListener('click', closeAksDrawer);

  const quickPair = (target, n1, n2) => {
    const k1 = S.keys.find((k) => k.name.toUpperCase() === n1);
    const k2 = S.keys.find((k) => k.name.toUpperCase() === n2);
    if (!k1 || !k2) return;
    if (target === 'rs') { S.aksDraft.rs1 = k1.hwIndex; S.aksDraft.rs2 = k2.hwIndex; }
    else { S.aksDraft.socd1 = k1.hwIndex; S.aksDraft.socd2 = k2.hwIndex; }
    syncAksSlotBoxesUI();
    renderChassis();
  };
  $('btn-rs-ad').addEventListener('click', () => quickPair('rs', 'A', 'D'));
  $('btn-rs-ws').addEventListener('click', () => quickPair('rs', 'W', 'S'));
  $('btn-socd-ad').addEventListener('click', () => quickPair('socd', 'A', 'D'));
  $('btn-socd-ws').addEventListener('click', () => quickPair('socd', 'W', 'S'));

  const findFreeDksSlot = (existingIdx) => {
    const ex = S.keyMatrix[existingIdx];
    if (ex && ex.type === 144) return ex.code1;
    const used = new Set();
    for (const km of S.keyMatrix) if (km && km.type === 144) used.add(km.code1);
    for (let i = 0; i < 32; i++) if (!used.has(i)) return i;
    return -1;
  };

  $('btn-aks-save').addEventListener('click', async () => {
    if (S.aksDrawer === 'rs') {
      if (await bindPairMode(147, S.aksDraft.rs1, S.aksDraft.rs2, 0)) closeAksDrawer();
    } else if (S.aksDrawer === 'socd') {
      const prioEl = document.querySelector('input[name="socd-prio"]:checked');
      if (await bindPairMode(148, S.aksDraft.socd1, S.aksDraft.socd2, prioEl ? Number(prioEl.value) : 0)) closeAksDrawer();
    } else if (S.aksDrawer === 'mt') {
      const idx = S.aksDraft.mtIdx;
      if (idx == null) return toast('Click a key on the keyboard above to bind', true);
      if (!S.aksDraft.mtHold || !S.aksDraft.mtTap) return toast('Pick both Hold and Tap output keys on the right', true);
      const ex = S.keyMatrix[idx];
      const slot = (ex && ex.type === 146) ? ex.code1 : findFreeMtSlots(1)[0];
      if (slot === undefined) return toast('No free MT slots', true);
      const ms = Math.max(10, Math.min(1000, Number($('mt-time').value) || 150));
      const mt = [...(S.advancedKeys.mt || [])];
      while (mt.length < 32) mt.push({ click: { type: 0, code1: 0, code2: 0 }, down: { type: 0, code1: 0, code2: 0 } });
      mt[slot] = { click: { ...S.aksDraft.mtTap }, down: { ...S.aksDraft.mtHold } };
      const km = { index: idx, layer: S.layer, type: 146, code1: slot, code2: Math.floor(ms / 10) };
      S.advancedKeys.mt = mt;
      S.keyMatrix[idx] = km;
      renderActiveAdvancedBindings();
      renderChassis();
      if (S.connected) {
        const res = await api('/api/advanced', { profile: S.profile, layer: S.layer, mt, keyMaps: [km] });
        if (res.ok) toast(`Bound MT (${tupleSlotLabel(S.aksDraft.mtHold)} / ${tupleSlotLabel(S.aksDraft.mtTap)})`);
        else toast('MT error: ' + res.error, true);
      }
      closeAksDrawer();
    } else if (S.aksDrawer === 'tgl') {
      const idx = S.aksDraft.tglIdx;
      if (idx == null) return toast('Click a key on the keyboard above to bind', true);
      if (!S.aksDraft.tglOut) return toast('Pick a TGL output key on the right', true);
      const ex = S.keyMatrix[idx];
      const slot = (ex && ex.type === 145) ? ex.code1 : findFreeTglSlot();
      if (slot < 0) return toast('No free TGL slots', true);
      const tgl = [...(S.advancedKeys.tgl || [])];
      while (tgl.length < 32) tgl.push({ type: 0, code1: 0, code2: 0 });
      tgl[slot] = { ...S.aksDraft.tglOut };
      const km = { index: idx, layer: S.layer, type: 145, code1: slot, code2: 0 };
      S.advancedKeys.tgl = tgl;
      S.keyMatrix[idx] = km;
      renderActiveAdvancedBindings();
      renderChassis();
      if (S.connected) {
        const res = await api('/api/advanced', { profile: S.profile, layer: S.layer, tgl, keyMaps: [km] });
        if (res.ok) toast(`Bound TGL (${tupleSlotLabel(S.aksDraft.tglOut)})`);
        else toast('TGL error: ' + res.error, true);
      }
      closeAksDrawer();
    } else if (S.aksDrawer === 'dks') {
      const idx = S.aksDraft.dksIdx;
      if (idx == null) return toast('Click a key on the keyboard above to bind', true);
      if (!S.aksDraft.dksRows.some((r) => r.key && r.key.type !== 0)) {
        return toast('Assign at least one action key in the DKS matrix', true);
      }
      const slot = findFreeDksSlot(idx);
      if (slot < 0) return toast('No free DKS slots', true);
      const p1 = Math.max(1, Math.min(32, Math.round((Number($('dks-p1').value) || 1.0) * 10)));
      const p2 = Math.max(p1 + 1, Math.min(33, Math.round((Number($('dks-p2').value) || 3.0) * 10)));
      const actions = S.aksDraft.dksRows.map((r) => (r.key ? { ...r.key } : { type: 0, code1: 0, code2: 0 }));
      const flags = S.aksDraft.dksRows.map((r) => (r.key ? encodeDksStageFlags(r.stages) : 0));
      const dks = [...(S.advancedKeys.dks || [])];
      while (dks.length < 32) dks.push({ points: [10, 30, 30, 10], actions: [{},{},{},{}], flags: [0, 0, 0, 0] });
      dks[slot] = { points: [p1, p2, p2, p1], actions, flags };
      const km = { index: idx, layer: S.layer, type: 144, code1: slot, code2: 0 };
      S.advancedKeys.dks = dks;
      S.keyMatrix[idx] = km;
      renderActiveAdvancedBindings();
      renderChassis();
      if (S.connected) {
        const res = await api('/api/advanced', { profile: S.profile, layer: S.layer, dks, keyMaps: [km] });
        if (res.ok) toast('Bound DKS key');
        else toast('DKS error: ' + res.error, true);
      }
      closeAksDrawer();
    }
  });

  $('adv-bindings-list').addEventListener('click', (e) => {
    const del = e.target.closest('[data-del-adv]');
    if (del) {
      e.stopPropagation();
      if (del.dataset.delAdv === 'pair') {
        restoreDefaultKeys([Number(del.dataset.i1), Number(del.dataset.i2)]);
      } else {
        restoreDefaultKeys([Number(del.dataset.i1)]);
      }
      return;
    }
    const row = e.target.closest('[data-edit-adv]');
    if (row) {
      openAksDrawer(row.dataset.editAdv, {
        i1: Number(row.dataset.i1),
        i2: row.dataset.i2 !== undefined ? Number(row.dataset.i2) : undefined,
      });
    }
  });
  $('btn-adv-clear-all').addEventListener('click', () => {
    const advIdxs = S.keys.filter((k) => {
      const km = S.keyMatrix[k.hwIndex];
      return km && km.type >= 144 && km.type <= 149;
    }).map((k) => k.hwIndex);
    if (!advIdxs.length) return toast('No advanced bindings to clear');
    restoreDefaultKeys(advIdxs);
  });

  // Official "Test Your Binding" live keydown/keyup tester
  const pushTestChip = (boxId, label) => {
    const box = $(boxId);
    const hint = box.querySelector('.aks-test-hint');
    if (hint) hint.remove();
    const chip = document.createElement('span');
    chip.className = 'aks-keycap-tile';
    chip.textContent = label;
    box.prepend(chip);
    while (box.children.length > 24) box.lastChild.remove();
    setTimeout(() => {
      chip.remove();
      if (!box.children.length) {
        box.innerHTML = `<span class="tiny-muted aks-test-hint">${boxId === 'aks-test-press' ? 'Press' : 'Release'} keys to test output...</span>`;
      }
    }, 4000);
  };
  document.addEventListener('keydown', (e) => {
    if (S.activeTab !== 'advanced' || e.repeat) return;
    if (['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;
    pushTestChip('aks-test-press', e.key.length === 1 ? e.key.toUpperCase() : e.code.replace(/^Key|^Digit/, ''));
  });
  document.addEventListener('keyup', (e) => {
    if (S.activeTab !== 'advanced') return;
    if (['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;
    pushTestChip('aks-test-release', e.key.length === 1 ? e.key.toUpperCase() : e.code.replace(/^Key|^Digit/, ''));
  });
  $('btn-aks-test-clear').addEventListener('click', () => {
    $('aks-test-press').innerHTML = '<span class="tiny-muted aks-test-hint">Press keys to test output...</span>';
    $('aks-test-release').innerHTML = '<span class="tiny-muted aks-test-hint">Release keys to test output...</span>';
  });

  // Performance
  document.querySelectorAll('.rate-pill').forEach((b) => {
    b.addEventListener('click', () => {
      S.performance.reporteRate = Number(b.dataset.rate);
      syncPerfUI();
      pushPerf(true);
    });
  });
  $('chk-berserk-trig').addEventListener('change', () => {
    S.performance.tachyonMode = $('chk-berserk-trig').checked ? 1 : 0;
    pushPerf(false);
  });
  $('perf-rtsmart').addEventListener('change', () => {
    S.performance.rtsmart = $('perf-rtsmart').checked ? Math.max(1, Number($('rng-rtsmart').value) || 1) : 0;
    syncPerfUI();
    pushPerf(false);
  });
  $('rng-rtsmart').addEventListener('input', () => {
    $('lbl-rtsmart').textContent = `Level ${$('rng-rtsmart').value}`;
  });
  $('rng-rtsmart').addEventListener('change', () => {
    S.performance.rtsmart = Number($('rng-rtsmart').value);
    pushPerf(false);
  });
  for (const [id, field] of [
    ['perf-stability', 'bottomrapidtriggerMode'],
    ['perf-debounce', 'debounceLevel'],
    ['perf-autocal', 'travelCheck'],
    ['perf-lockwin', 'lockWin'],
    ['perf-lockalttab', 'lockAltTap'],
    ['perf-lockaltf4', 'lockAltF4'],
  ]) {
    $(id).addEventListener('change', () => {
      S.performance[field] = $(id).checked ? 1 : 0;
      pushPerf(false);
    });
  }
  $('perf-mac').addEventListener('change', () => {
    // Cizhou GLW encodes macMode as (profile * 4 + layerOffset): 0 = Win, 2 = Mac
    S.performance.macMode = S.profile * 4 + ($('perf-mac').checked ? 2 : 0);
    pushPerf(false);
  });

  // Calibration & Reset
  $('btn-cal-modal').addEventListener('click', startCalibrationFlow);
  $('btn-cal-start').addEventListener('click', startCalibrationFlow);
  $('btn-cal-end').addEventListener('click', finishCalibrationFlow);
  $('btn-cal-finish').addEventListener('click', finishCalibrationFlow);
  $('btn-cal-restart').addEventListener('click', async () => {
    S.calibratedSet.clear();
    $('cal-count').textContent = '0';
    renderChassis();
    await api('/api/calibrate', { action: 'restart' });
    toast('Calibration reset — press keys down again');
  });
  $('btn-factory-reset').addEventListener('click', async () => {
    if (!confirm('Restore factory settings? All onboard profiles will be reset.')) return;
    const res = await api('/api/reset', {});
    if (res.ok) {
      toast('Factory reset complete!');
      setTimeout(() => connectHardware(true), 1200);
    } else toast(res.error || 'Reset failed', true);
  });

  // Export / Import JSON
  $('btn-export').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify({
      model: S.modelTag,
      profile: S.profile,
      profileNames: S.profileNames,
      triggers: S.triggers,
      lighting: S.lighting,
      customColors: S.customColors,
      performance: S.performance,
    }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `Ace68-Profile-${S.profile + 1}.json`;
    a.click();
  });
  $('input-import').addEventListener('change', async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const data = JSON.parse(await f.text());
    if (Array.isArray(data.triggers)) {
      S.triggers = data.triggers;
      const updates = {};
      data.triggers.forEach((t, i) => { updates[i] = t; });
      if (S.connected) await api('/api/triggers', { profile: S.profile, updates });
    }
    if (data.lighting) {
      S.lighting = data.lighting;
      if (S.connected) await api('/api/lighting', { profile: S.profile, lighting: S.lighting });
    }
    if (Array.isArray(data.customColors)) {
      S.customColors = data.customColors;
      const updates = {};
      data.customColors.forEach((c, i) => { updates[i] = c; });
      if (S.connected) await api('/api/custom-colors', { profile: S.profile, updates });
    }
    renderLightingEffects();
    renderChassis();
    toast('Imported profile!');
    e.target.value = '';
  });
}

window.addEventListener('DOMContentLoaded', async () => {
  initDemoState();
  populateKeyPicker();
  bindEvents();

  S.models = await fetch('/ace68_models.json').then((r) => r.json());
  buildLayoutForModel('ace68_air_ii');
  S.selected = new Set(S.keys.filter((k) => ['W','A','S','D'].includes(k.name.toUpperCase())).map((k) => k.hwIndex));
  renderProfileList();
  renderLightingEffects();
  syncTriggerSlidersUI();
  syncStageForTab();
  renderChassis();

  await connectHardware(true);
  setInterval(() => fetch('/api/ping').catch(() => {}), 1500);
  window.addEventListener('pagehide', () => {
    if (S.liveTravelOn && S.connected) {
      navigator.sendBeacon('/api/debug-mode', new Blob([JSON.stringify({ profile: S.profile, enabled: false })], { type: 'application/json' }));
    }
    navigator.sendBeacon('/api/quit');
  });
});
