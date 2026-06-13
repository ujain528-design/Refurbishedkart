// Isomorphic bulk-upload schema (no server-only imports — safe in the admin
// client AND the import route). Drives the .xlsx template (grouped headers,
// dropdowns, ports columns), client parsing, and server-side validation.
//
// Each column: { key, field, group, kind, dd, list, table }
//   key   — field-name shown in template ROW 2 and used as the record key
//   field — where it lands in the product (attrs key, or a top-level field)
//   group — template ROW 1 merged group header
//   kind  — validation behaviour (see lib/server/bulkImport.js):
//           category|brand|model|numpos|num|condition|ram|ssd|master|bool|free
//   dd    — dropdown source id ("brand"|"ram"|"ssd"|"os"|"warranty"|"processor"|
//           "condition"|"category"|"ramType"|"panel"|"ramExp"|"list"|null)
//   list  — static suggestion values when dd === "list"
//   table — MasterData table name for kind "master" (growable)

import {
  DISPLAY_SIZES, RESOLUTIONS, REFRESH_RATES, GENERATIONS, WORKSTATION_CHASSIS,
} from "@/lib/admin-data";
import { PORT_TYPES } from "@/lib/ports";

export const CONDITIONS = ["Excellent", "Good", "Fair"];
export const DESKTOP_CHASSIS = ["Tower", "SFF", "Tiny", "All-in-One", "Mini PC"];
const YESNO = ["Yes", "No"];

export const GROUP_ORDER = ["BASIC INFO", "SPECIFICATIONS", "PRICING & STOCK", "TAX & WARRANTY", "PORTS", "CONTENT"];

// Master tables a typed override is ADDED to on import (the "NEW VALUE" path).
export const GROWABLE_TABLES = {
  brand: "Brands",
  os: "Operating System",
  warranty: "Warranty Period",
  processor: "Processor Family",
  ramType: "RAM Type",
  panel: "Panel Type",
  ramExp: "RAM Expandability",
  aspectRatio: "Aspect Ratio",
  serverFF: "Server Form Factor",
};

const c = (key, field, group, kind, extra = {}) => ({ key, field, group, kind, dd: null, list: null, table: null, ...extra });

// ── Shared column blocks ──
const BASIC = [
  c("category", "category", "BASIC INFO", "category", { dd: "category" }),
  c("brand", "brand", "BASIC INFO", "brand", { dd: "brand", table: "Brands" }),
  c("model", "model", "BASIC INFO", "model"),
];
const WSTAG = c("workstationTag", "workstationTag", "BASIC INFO", "bool", { dd: "list", list: YESNO });
const PRICING = [
  c("deviceCost", "deviceCost", "PRICING & STOCK", "numpos"),
  c("mrp", "mrp", "PRICING & STOCK", "num"),            // original/MRP for strikethrough + % off
  c("chassisStock", "chassisStock", "PRICING & STOCK", "num"),
];
const TAXWARR = [
  c("condition", "condition", "TAX & WARRANTY", "condition", { dd: "condition" }),
  c("warrantyPeriod", "warrantyPeriod", "TAX & WARRANTY", "master", { dd: "warranty", table: "Warranty Period" }),
  c("hsnCode", "hsnCode", "TAX & WARRANTY", "free"),
];
const CONTENT = [
  c("description", "description", "CONTENT", "free"),
  c("seoTitle", "seoTitle", "CONTENT", "free"),
];
const PORTS = PORT_TYPES.map((t) => c(t, t, "PORTS", "num"));

// ── Spec presets ──
const PROC = c("processor", "processor", "SPECIFICATIONS", "master", { dd: "processor", table: "Processor Family" });
const GEN = c("generation", "gen", "SPECIFICATIONS", "free", { dd: "list", list: GENERATIONS });
const RAM = c("defaultRam", "ram", "SPECIFICATIONS", "ram", { dd: "ram" });
const SSD = c("defaultSsd", "ssd", "SPECIFICATIONS", "ssd", { dd: "ssd" });
const STORAGE = c("storage", "ssd", "SPECIFICATIONS", "ssd", { dd: "ssd" });
const OS = c("os", "os", "SPECIFICATIONS", "master", { dd: "os", table: "Operating System" });
const SERVER_OS_COL = c("serverOs", "os", "SPECIFICATIONS", "master", { dd: "os", table: "Operating System" });
const SCREEN = c("screenSize", "screen", "SPECIFICATIONS", "free", { dd: "list", list: DISPLAY_SIZES });
const RES = c("resolution", "resolution", "SPECIFICATIONS", "free", { dd: "list", list: RESOLUTIONS });
const REFRESH = c("refreshRate", "refreshRate", "SPECIFICATIONS", "free", { dd: "list", list: REFRESH_RATES });
const GPU = c("gpu", "gpu", "SPECIFICATIONS", "free");
const RAMTYPE = c("ramType", "ramType", "SPECIFICATIONS", "master", { dd: "ramType", table: "RAM Type" });
const RAMEXP = c("ramExpandability", "ramExpandability", "SPECIFICATIONS", "master", { dd: "ramExp", table: "RAM Expandability" });
const PANEL = c("panel", "panel", "SPECIFICATIONS", "master", { dd: "panel", table: "Panel Type" });
const TOUCH = c("touchscreen", "touchscreen", "SPECIFICATIONS", "bool", { dd: "list", list: YESNO });
const BATTH = c("batteryHealth", "batteryHealth", "SPECIFICATIONS", "free");
const BACKLIT = c("backlitKeyboard", "backlitKeyboard", "SPECIFICATIONS", "bool", { dd: "list", list: YESNO });
const WEBCAM = c("webcam", "webcam", "SPECIFICATIONS", "bool", { dd: "list", list: YESNO });
const PSU = c("psu", "psu", "SPECIFICATIONS", "free");
const WS_CHASSIS = c("chassisType", "formFactor", "SPECIFICATIONS", "free", { dd: "list", list: WORKSTATION_CHASSIS });
const DT_CHASSIS = c("chassisType", "formFactor", "SPECIFICATIONS", "free", { dd: "list", list: DESKTOP_CHASSIS });
const BRIGHT = c("brightness", "brightness", "SPECIFICATIONS", "num");
const RESP = c("responseTime", "responseTime", "SPECIFICATIONS", "num");
const HDR = c("hdrSupport", "hdr", "SPECIFICATIONS", "bool", { dd: "list", list: YESNO });
const RAID = c("raidSupport", "raid", "SPECIFICATIONS", "free");
const REDUN = c("redundantPower", "redundantPower", "SPECIFICATIONS", "bool", { dd: "list", list: YESNO });
// Server form factor — consolidates the old free-text "chassis" (managed master).
const SRV_FF = c("formFactor", "formFactor", "SPECIFICATIONS", "master", { dd: "serverFF", table: "Server Form Factor" });
const DRIVEBAYS = c("driveBays", "driveBays", "SPECIFICATIONS", "num");
// Weight — laptops + monitors (free text, e.g. "1.4 kg"). NOT workstations (desktop).
const WEIGHT = c("weight", "weight", "SPECIFICATIONS", "free");
const ASPECT = c("aspectRatio", "aspectRatio", "SPECIFICATIONS", "master", { dd: "aspectRatio", table: "Aspect Ratio" });
const VESA = c("vesaMount", "vesaMount", "SPECIFICATIONS", "bool", { dd: "list", list: YESNO });
const SPEAKERS = c("builtInSpeakers", "builtInSpeakers", "SPECIFICATIONS", "bool", { dd: "list", list: YESNO });

const SPECS = {
  Laptops: [PROC, GEN, GPU, RAMTYPE, RAMEXP, RAM, SSD, SCREEN, RES, PANEL, TOUCH, BATTH, BACKLIT, WEBCAM, WEIGHT, OS],
  Desktops: [DT_CHASSIS, PROC, GEN, RAMTYPE, RAMEXP, RAM, SSD, GPU, PSU, OS],
  Monitors: [SCREEN, RES, PANEL, REFRESH, ASPECT, BRIGHT, RESP, HDR, VESA, SPEAKERS, WEIGHT],
  // Desktop workstation: NO screen, NO battery. Chassis + Xeon/Core + ECC RAM + GPU + PSU + storage.
  Workstations: [WS_CHASSIS, PROC, GEN, RAMTYPE, RAMEXP, RAM, SSD, GPU, PSU, OS],
  Servers: [SRV_FF, PROC, GEN, RAMTYPE, RAM, STORAGE, DRIVEBAYS, RAID, REDUN, SERVER_OS_COL],
};

const REQUIRED = {
  Laptops: new Set(["category", "brand", "model", "deviceCost", "processor", "defaultRam", "defaultSsd"]),
  Desktops: new Set(["category", "brand", "model", "deviceCost", "processor", "defaultRam", "defaultSsd"]),
  Monitors: new Set(["category", "brand", "model", "deviceCost", "screenSize"]),
  Workstations: new Set(["category", "brand", "model", "deviceCost", "processor", "defaultRam", "defaultSsd"]),
  Servers: new Set(["category", "brand", "model", "deviceCost", "processor", "defaultRam", "storage"]),
};

// Laptops get the workstationTag column (mobile workstation = a tagged laptop).
const buildCols = (cat) => {
  const basic = cat === "Laptops" ? [...BASIC, WSTAG] : [...BASIC];
  return [...basic, ...SPECS[cat], ...PRICING, ...TAXWARR, ...PORTS, ...CONTENT];
};

export const CATEGORY_COLUMNS = Object.fromEntries(Object.keys(SPECS).map((cat) => [cat, buildCols(cat)]));
export const CATEGORIES = Object.keys(CATEGORY_COLUMNS);
export const getColumns = (category) => CATEGORY_COLUMNS[category] || CATEGORY_COLUMNS.Laptops;
export const columnKeys = (category) => getColumns(category).map((col) => col.key);
export const isRequired = (category, key) => (REQUIRED[category] || REQUIRED.Laptops).has(key);

// 1 example row per category (keyed by column key) — valid against master data /
// pricing so a freshly downloaded template imports cleanly.
export const CATEGORY_EXAMPLES = {
  Laptops: [{ category: "Laptops", brand: "Lenovo", model: "ThinkPad T14", workstationTag: "No", processor: "i5-10310U", generation: "10th Gen", gpu: "Intel UHD", ramType: "DDR4", ramExpandability: "Expandable", defaultRam: "8GB", defaultSsd: "256GB", screenSize: '14"', resolution: "1920×1080 FHD", panel: "IPS", touchscreen: "No", batteryHealth: "90%", backlitKeyboard: "Yes", webcam: "Yes", weight: "1.4 kg", os: "Windows 11 Pro", deviceCost: 24000, mrp: 38000, chassisStock: 5, condition: "Excellent", warrantyPeriod: "1 year", hsnCode: "8471", "USB-A": 2, "USB-C": 1, HDMI: 1, "Ethernet (RJ45)": 1, description: "", seoTitle: "" }],
  Desktops: [{ category: "Desktops", brand: "Dell", model: "OptiPlex 7080", chassisType: "SFF", processor: "i5-10500", generation: "10th Gen", ramType: "DDR4", ramExpandability: "Expandable", defaultRam: "8GB", defaultSsd: "256GB", gpu: "Intel UHD", psu: "300W", os: "Windows 11 Pro", deviceCost: 18000, mrp: 32000, chassisStock: 10, condition: "Excellent", warrantyPeriod: "1 year", hsnCode: "8471", "USB-A": 4, "USB-C": 1, DisplayPort: 1, "Ethernet (RJ45)": 1, description: "", seoTitle: "" }],
  Monitors: [{ category: "Monitors", brand: "LG", model: "27UL500", screenSize: '27"', resolution: "3840×2160 4K", panel: "IPS", refreshRate: "60Hz", aspectRatio: "16:9", brightness: 350, responseTime: 5, hdrSupport: "No", vesaMount: "Yes", builtInSpeakers: "No", weight: "5.2 kg", deviceCost: 11000, mrp: 22000, chassisStock: 8, condition: "Excellent", warrantyPeriod: "6 months", hsnCode: "8528", HDMI: 2, DisplayPort: 1, description: "", seoTitle: "" }],
  Workstations: [{ category: "Workstations", brand: "HP", model: "Z440", chassisType: "Tower", processor: "Xeon E5-1620", generation: "", ramType: "DDR4 ECC", ramExpandability: "Expandable", defaultRam: "32GB", defaultSsd: "512GB", gpu: "NVIDIA Quadro K2200", psu: "700W", os: "Windows 11 Pro", deviceCost: 45000, mrp: 120000, chassisStock: 3, condition: "Good", warrantyPeriod: "1 year", hsnCode: "8471", "USB-A": 4, DisplayPort: 2, "Ethernet (RJ45)": 1, description: "", seoTitle: "" }],
  Servers: [{ category: "Servers", brand: "HPE", model: "ProLiant DL380 G10", formFactor: "2U", processor: "Xeon Silver 4210", generation: "", ramType: "DDR4 ECC", defaultRam: "32GB", storage: "1TB", driveBays: 8, raidSupport: "RAID 1", redundantPower: "Yes", serverOs: "No OS", deviceCost: 85000, mrp: 210000, chassisStock: 2, condition: "Good", warrantyPeriod: "1 year", hsnCode: "8471", "USB-A": 4, "Ethernet (RJ45)": 1, VGA: 1, description: "", seoTitle: "" }],
};
