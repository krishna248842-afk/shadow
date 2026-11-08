// ─────────────────────────────────────────────────────────────────────────────
// Shadow DB layer — real SQLite (via sql.js/wasm) persisted to disk.
// Zero native builds, works on every host with a Node runtime + a writable dir.
// DATABASE_PATH env var controls where the file lives (mount a disk in cloud).
// ─────────────────────────────────────────────────────────────────────────────
import path from 'path';
import fs from 'fs';

export type SqlValue = string | number | null | Uint8Array;

interface ShadowDB {
  db: any;
  path: string;
  dirtySince: number;
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category TEXT DEFAULT 'General',
  meesho_url TEXT DEFAULT '',
  image_url TEXT DEFAULT '',
  description TEXT DEFAULT '',
  tags TEXT DEFAULT '',
  cost_price REAL NOT NULL DEFAULT 0,
  sell_price REAL NOT NULL DEFAULT 0,
  mrp REAL DEFAULT 0,
  commission_pct REAL DEFAULT 0,
  stock INTEGER DEFAULT 100,
  is_sample INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  address TEXT DEFAULT '',
  product_id INTEGER,
  quantity INTEGER DEFAULT 1,
  product_name TEXT DEFAULT '',
  total REAL NOT NULL DEFAULT 0,
  cost REAL DEFAULT 0,
  channel TEXT DEFAULT 'instagram',
  payment_mode TEXT DEFAULT 'cod',
  payment_status TEXT DEFAULT 'pending',
  status TEXT DEFAULT 'new',
  razorpay_link_id TEXT DEFAULT '',
  razorpay_link_url TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  profit_credited INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER,
  platform TEXT NOT NULL,
  content TEXT NOT NULL,
  media_url TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft',
  scheduled_at TEXT,
  published_at TEXT,
  external_id TEXT,
  error TEXT,
  ai_generated INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS campaigns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER,
  name TEXT NOT NULL,
  objective TEXT DEFAULT 'traffic',
  platform TEXT DEFAULT 'meta',
  daily_budget REAL DEFAULT 100,
  destination_url TEXT DEFAULT '',
  status TEXT DEFAULT 'paused',
  meta_campaign_id TEXT DEFAULT '',
  meta_adset_id TEXT DEFAULT '',
  meta_ad_id TEXT DEFAULT '',
  spend REAL DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  meta_error TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS interactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  channel TEXT NOT NULL,
  handle TEXT NOT NULL DEFAULT '',
  direction TEXT NOT NULL DEFAULT 'in',
  text TEXT NOT NULL DEFAULT '',
  ai_replied INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS wallet_txns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  amount REAL NOT NULL,
  note TEXT DEFAULT '',
  ref_id INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS withdrawals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  amount REAL NOT NULL,
  method TEXT DEFAULT 'upi',
  destination TEXT DEFAULT '',
  status TEXT DEFAULT 'paid',
  note TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_interactions_created ON interactions(created_at);
CREATE INDEX IF NOT EXISTS idx_txn_created ON wallet_txns(created_at);
`;

const g = globalThis as unknown as { __shadowDb?: Promise<ShadowDB> };

function dbFilePath(): string {
  const p = process.env.DATABASE_PATH || './data/shadow.db';
  return path.isAbsolute(p) ? p : path.join(process.cwd(), p);
}

async function init(): Promise<ShadowDB> {
  const SQL = await import('sql.js');
  const wasmPath = path.join(process.cwd(), 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm');
  const buf = fs.readFileSync(wasmPath);
  const wasmBinary = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
  const SQLLib = await SQL.default({ wasmBinary });
  const file = dbFilePath();
  let db: any;
  if (fs.existsSync(file)) {
    db = new SQLLib.Database(fs.readFileSync(file));
  } else {
    db = new SQLLib.Database();
  }
  db.run(SCHEMA);
  const handle: ShadowDB = { db, path: file, dirtySince: 0 };
  flush(handle);
  await seedIfEmpty(handle);
  return handle;
}

export async function getDB(): Promise<ShadowDB> {
  if (!g.__shadowDb) g.__shadowDb = init();
  return g.__shadowDb;
}

/** Persist the in-memory SQLite to disk atomically (tmp + rename). */
export function flush(h: ShadowDB) {
  const file = h.path;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const bytes = h.db.export();
  const tmp = file + '.tmp-' + process.pid;
  fs.writeFileSync(tmp, Buffer.from(bytes));
  fs.renameSync(tmp, file);
}

/** Run a mutation and persist. */
export async function run(sql: string, params: SqlValue[] = []) {
  const h = await getDB();
  h.db.run(sql, params as any);
  flush(h);
  return h.db;
}

export async function all<T = any>(sql: string, params: SqlValue[] = []): Promise<T[]> {
  const h = await getDB();
  const stmt = h.db.prepare(sql);
  stmt.bind(params as any);
  const rows: T[] = [];
  while (stmt.step()) rows.push(stmt.getAsObject() as T);
  stmt.free();
  return rows;
}

export async function get<T = any>(sql: string, params: SqlValue[] = []): Promise<T | null> {
  const rows = await all<T>(sql, params);
  return rows[0] ?? null;
}

export async function lastId(): Promise<number> {
  const row = await get<{ id: number }>('SELECT last_insert_rowid() AS id');
  return row?.id ?? 0;
}

// ── Starter catalog (clearly marked samples the owner can edit/delete) ─────
async function seedIfEmpty(h: ShadowDB) {
  const stmt = h.db.prepare('SELECT COUNT(*) AS c FROM products');
  stmt.step();
  const count = (stmt.getAsObject() as any).c as number;
  stmt.free();
  if (count > 0) return;

  const samples: Array<[string, string, number, number, number, string]> = [
    // name, category, cost (Meesho supplier price), your sell price, MRP, tags
    ['Women Embroidered Kurti With Palazzo — Designer Ethnic Wear', 'Women Kurti', 285, 449, 1299, 'kurti,palazzo,ethnic,women,fashion'],
    ['Men Solid Casual Cotton Shirt — Regular Fit', 'Men Shirts', 240, 399, 1099, 'shirt,men,cotton,casual,office'],
    ['Stainless Steel Insulated Water Bottle 1L — Keeps Hot/Cold 24h', 'Home & Kitchen', 190, 349, 999, 'bottle,steel,kitchen,gift'],
    ['Smart LED Watch with Bluetooth Calling & SpO2', 'Electronics', 420, 699, 2999, 'smartwatch,electronics,gadget,fitness'],
    ['Cotton Bedsheet with 2 Pillow Covers — King Size Printed', 'Home & Kitchen', 310, 499, 1499, 'bedsheet,home,bedroom,cotton'],
    ['Kids Printed T-Shirt Pack of 3 — Cotton Blend', 'Kids Wear', 260, 429, 1199, 'kids,tshirt,pack,summer'],
  ];
  for (const [name, category, cost, sell, mrp, tags] of samples) {
    h.db.run(
      `INSERT INTO products (name, category, cost_price, sell_price, mrp, commission_pct, stock, tags, is_sample, description)
       VALUES (?,?,?,?,?,0,100,?,1,?)`,
      [name, category, cost, sell, mrp, tags,
       `${name}. Premium quality, free shipping across India, COD available. Order karo aur aaj hi delivery pao!`]
    );
  }
  flush(h);
}
