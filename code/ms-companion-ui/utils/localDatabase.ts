import * as SQLite from 'expo-sqlite';

import { newId } from '@/utils/id';

export type RecordType =
  | 'checkIn'
  | 'medication'
  | 'doseLog'
  | 'sideEffect'
  | 'symptomEntry'
  | 'appointment'
  | 'question'
  | 'bloodTest';

export type SyncState = 'pending' | 'synced';

const SCHEMA_VERSION = 1;
const DEVICE_DATABASE_NAME = 'ms-companion-device.db';

const USER_SCHEMA = `
PRAGMA journal_mode = WAL;
CREATE TABLE IF NOT EXISTS records (
  type TEXT NOT NULL,
  record_key TEXT NOT NULL,
  id TEXT NOT NULL,
  data TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  sync_state TEXT NOT NULL DEFAULT 'pending',
  PRIMARY KEY (type, record_key)
);
CREATE INDEX IF NOT EXISTS records_by_id ON records (id);
CREATE INDEX IF NOT EXISTS records_by_sync_state ON records (sync_state);
CREATE TABLE IF NOT EXISTS kv (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL
);
`;

const DEVICE_SCHEMA = `
PRAGMA journal_mode = WAL;
CREATE TABLE IF NOT EXISTS kv (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL
);
`;

type OpenUserDatabase = { userId: string; ready: Promise<SQLite.SQLiteDatabase> };

let userDatabase: OpenUserDatabase | null = null;
let deviceDatabase: Promise<SQLite.SQLiteDatabase> | null = null;

function userDatabaseName(userId: string): string {
  return `ms-companion-user-${userId.replace(/[^A-Za-z0-9-]/g, '_')}.db`;
}

async function migrate(db: SQLite.SQLiteDatabase, schema: string): Promise<void> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const version = row?.user_version ?? 0;
  if (version >= SCHEMA_VERSION) return;
  if (version === 0) {
    await db.execAsync(schema);
  }
  await db.execAsync(`PRAGMA user_version = ${SCHEMA_VERSION}`);
}

async function openAndMigrate(name: string, schema: string): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync(name);
  await migrate(db, schema);
  return db;
}

async function closeQuietly(ready: Promise<SQLite.SQLiteDatabase>): Promise<void> {
  try {
    const db = await ready;
    await db.closeAsync();
  } catch (e) {
    console.warn('Could not close the local database', e);
  }
}

export function openUserDatabase(userId: string): void {
  if (userDatabase?.userId === userId) return;
  const previous = userDatabase;
  const ready = (async () => {
    if (previous) await closeQuietly(previous.ready);
    return openAndMigrate(userDatabaseName(userId), USER_SCHEMA);
  })();
  ready.catch((e) => console.warn('Could not open the local database', e));
  userDatabase = { userId, ready };
}

export async function closeUserDatabase(): Promise<void> {
  const open = userDatabase;
  userDatabase = null;
  if (open) await closeQuietly(open.ready);
}

export async function deleteUserDatabase(): Promise<void> {
  const open = userDatabase;
  userDatabase = null;
  if (!open) return;
  await closeQuietly(open.ready);
  await SQLite.deleteDatabaseAsync(userDatabaseName(open.userId));
}

export function isUserDatabaseOpen(): boolean {
  return userDatabase !== null;
}

async function userDb(): Promise<SQLite.SQLiteDatabase> {
  if (!userDatabase) {
    throw new Error('No user is signed in, so there is no local health data to use.');
  }
  return userDatabase.ready;
}

function deviceDb(): Promise<SQLite.SQLiteDatabase> {
  if (!deviceDatabase) {
    deviceDatabase = openAndMigrate(DEVICE_DATABASE_NAME, DEVICE_SCHEMA).catch((e) => {
      deviceDatabase = null;
      throw e;
    });
  }
  return deviceDatabase;
}

export async function listRecords<T>(type: RecordType): Promise<T[]> {
  const db = await userDb();
  const rows = await db.getAllAsync<{ data: string }>(
    'SELECT data FROM records WHERE type = ? AND deleted_at IS NULL ORDER BY created_at, record_key',
    type,
  );
  return rows.map((row) => JSON.parse(row.data) as T);
}

export async function findRecord<T>(type: RecordType, key: string): Promise<T | null> {
  const db = await userDb();
  const row = await db.getFirstAsync<{ data: string }>(
    'SELECT data FROM records WHERE type = ? AND record_key = ? AND deleted_at IS NULL',
    type,
    key,
  );
  return row ? (JSON.parse(row.data) as T) : null;
}

export async function putRecord(
  type: RecordType,
  key: string,
  value: unknown,
  id: string = newId(),
): Promise<void> {
  const db = await userDb();
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO records (type, record_key, id, data, created_at, updated_at, deleted_at, sync_state)
     VALUES (?, ?, ?, ?, ?, ?, NULL, 'pending')
     ON CONFLICT (type, record_key) DO UPDATE SET
       data = excluded.data,
       updated_at = excluded.updated_at,
       deleted_at = NULL,
       sync_state = 'pending'`,
    type,
    key,
    id,
    JSON.stringify(value),
    now,
    now,
  );
}

export async function removeRecord(type: RecordType, key: string): Promise<void> {
  const db = await userDb();
  const now = new Date().toISOString();
  await db.runAsync(
    `UPDATE records SET deleted_at = ?, updated_at = ?, sync_state = 'pending'
     WHERE type = ? AND record_key = ? AND deleted_at IS NULL`,
    now,
    now,
    type,
    key,
  );
}

async function readValue<T>(db: SQLite.SQLiteDatabase, key: string): Promise<T | null> {
  const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM kv WHERE key = ?', key);
  return row ? (JSON.parse(row.value) as T) : null;
}

async function writeValue(db: SQLite.SQLiteDatabase, key: string, value: unknown): Promise<void> {
  await db.runAsync(
    'INSERT INTO kv (key, value) VALUES (?, ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value',
    key,
    JSON.stringify(value),
  );
}

export async function getUserValue<T>(key: string): Promise<T | null> {
  return readValue<T>(await userDb(), key);
}

export async function setUserValue(key: string, value: unknown): Promise<void> {
  await writeValue(await userDb(), key, value);
}

export async function getDeviceValue<T>(key: string): Promise<T | null> {
  return readValue<T>(await deviceDb(), key);
}

export async function setDeviceValue(key: string, value: unknown): Promise<void> {
  await writeValue(await deviceDb(), key, value);
}

export async function removeDeviceValue(key: string): Promise<void> {
  const db = await deviceDb();
  await db.runAsync('DELETE FROM kv WHERE key = ?', key);
}
