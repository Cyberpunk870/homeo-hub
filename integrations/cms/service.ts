import { WixDataItem } from '.';
import { cloneSeedCollections } from '@/lib/seed-data';

export interface PaginationOptions {
  limit?: number;
  skip?: number;
}

export interface RefFieldMeta {
  totalCount: number;
  returnedCount: number;
  hasMore: boolean;
}

export interface PaginatedResult<T> {
  items: T[];
  totalCount: number;
  hasNext: boolean;
  currentPage: number;
  pageSize: number;
  nextSkip: number | null;
}

type CrudItemBase = {
  _id: string;
  _createdDate?: Date | string;
  _updatedDate?: Date | string;
};

type CollectionRecord = Record<string, WixDataItem[]>;

const DB_STORAGE_KEY = 'homeo-hub:db:v1';
const DATA_BACKEND = (import.meta.env.PUBLIC_DATA_BACKEND ?? 'local').toLowerCase();

function nowIso() {
  return new Date().toISOString();
}

function ensureId<T extends WixDataItem>(item: Partial<T> | Record<string, unknown>) {
  const maybeId = (item as { _id?: string })._id;
  return maybeId && String(maybeId).trim() ? String(maybeId) : crypto.randomUUID();
}

function safeParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function isBrowser() {
  return typeof window !== 'undefined';
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

let memoryDb: CollectionRecord | null = null;

function loadDb(): CollectionRecord {
  const seed = cloneSeedCollections() as unknown as CollectionRecord;

  if (isBrowser()) {
    const existing = safeParse<CollectionRecord | null>(window.localStorage.getItem(DB_STORAGE_KEY), null);
    if (existing && typeof existing === 'object') return existing;
    window.localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(seed));
    return seed;
  }

  if (!memoryDb) memoryDb = seed;
  return memoryDb;
}

function saveDb(db: CollectionRecord) {
  if (isBrowser()) {
    window.localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(db));
    return;
  }
  memoryDb = db;
}

function getCollection(db: CollectionRecord, collectionId: string): WixDataItem[] {
  if (!db[collectionId]) {
    db[collectionId] = [];
  }
  return db[collectionId];
}

function sortStableByCreatedDate(items: WixDataItem[]) {
  return [...items].sort((a, b) => {
    const aTime = new Date(String(a._createdDate ?? 0)).getTime();
    const bTime = new Date(String(b._createdDate ?? 0)).getTime();
    return bTime - aTime;
  });
}

function shouldUsePostgresApi() {
  return DATA_BACKEND === 'postgres' && isBrowser();
}

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/data${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error((body && typeof body.error === 'string' && body.error) || `Request failed: ${response.status}`);
  }

  return body as T;
}

export class BaseCrudService {
  private static async populateMultiRefs<T extends CrudItemBase>(
    _collectionId: string,
    item: T,
    multiRefs: string[]
  ): Promise<T> {
    if (!multiRefs.length) return item;
    const withRefs = { ...(item as Record<string, unknown>) } as Record<string, unknown>;
    (withRefs as { _refMeta?: Record<string, RefFieldMeta> })._refMeta = {};
    for (const field of multiRefs) {
      withRefs[field] = Array.isArray(withRefs[field]) ? withRefs[field] : [];
      (withRefs as { _refMeta: Record<string, RefFieldMeta> })._refMeta[field] = {
        totalCount: Array.isArray(withRefs[field]) ? (withRefs[field] as unknown[]).length : 0,
        returnedCount: Array.isArray(withRefs[field]) ? (withRefs[field] as unknown[]).length : 0,
        hasMore: false,
      };
    }
    return withRefs as T;
  }

  static async create<T extends CrudItemBase>(
    collectionId: string,
    itemData: Partial<T> | Record<string, unknown>,
    _multiReferences?: Record<string, any>
  ): Promise<T> {
    if (shouldUsePostgresApi()) {
      return apiRequest<T>(`/records/${collectionId}`, {
        method: 'POST',
        body: JSON.stringify({ itemData }),
      });
    }

    const db = loadDb();
    const collection = getCollection(db, collectionId);
    const timestamp = nowIso();
    const item = {
      ...(itemData as Record<string, unknown>),
      _id: ensureId(itemData),
      _createdDate: (itemData as { _createdDate?: string })._createdDate ?? timestamp,
      _updatedDate: timestamp,
    } as T;
    collection.push(clone(item));
    saveDb(db);
    return clone(item);
  }

  static async getAll<T extends CrudItemBase>(
    collectionId: string,
    _includeRefs?: { singleRef?: string[]; multiRef?: string[] } | string[],
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<T>> {
    const limit = Math.min(pagination?.limit ?? 50, 1000);
    const skip = pagination?.skip ?? 0;

    if (shouldUsePostgresApi()) {
      const query = new URLSearchParams({ limit: String(limit), skip: String(skip) });
      return apiRequest<PaginatedResult<T>>(`/records/${collectionId}?${query.toString()}`);
    }

    const db = loadDb();
    const collection = sortStableByCreatedDate(getCollection(db, collectionId)) as T[];
    const items = collection.slice(skip, skip + limit).map(clone);
    const totalCount = collection.length;
    const nextSkip = skip + limit < totalCount ? skip + limit : null;

    return {
      items,
      totalCount,
      hasNext: nextSkip != null,
      currentPage: Math.floor(skip / limit),
      pageSize: limit,
      nextSkip,
    };
  }

  static async getAllItems<T extends CrudItemBase>(
    collectionId: string,
    includeRefs?: { singleRef?: string[]; multiRef?: string[] } | string[],
    pagination?: Omit<PaginationOptions, 'skip'>
  ): Promise<T[]> {
    const page = await this.getAll<T>(collectionId, includeRefs, { limit: pagination?.limit ?? 1000, skip: 0 });
    return page.items;
  }

  static async getById<T extends CrudItemBase>(
    collectionId: string,
    itemId: string,
    includeRefs?: { singleRef?: string[]; multiRef?: string[] } | string[]
  ): Promise<T | null> {
    if (shouldUsePostgresApi()) {
      try {
        return await apiRequest<T>(`/records/${collectionId}/${itemId}`);
      } catch {
        return null;
      }
    }

    const db = loadDb();
    const collection = getCollection(db, collectionId) as T[];
    const found = collection.find((item) => item._id === itemId);
    if (!found) return null;

    const isLegacy = Array.isArray(includeRefs);
    const multiRefs = isLegacy ? [] : includeRefs?.multiRef ?? [];
    return this.populateMultiRefs(collectionId, clone(found), multiRefs);
  }

  static async update<T extends CrudItemBase>(
    collectionId: string,
    itemData: Partial<T> & Pick<T, '_id'>
  ): Promise<T> {
    if (shouldUsePostgresApi()) {
      return apiRequest<T>(`/records/${collectionId}/${itemData._id}`, {
        method: 'PATCH',
        body: JSON.stringify(itemData),
      });
    }

    const db = loadDb();
    const collection = getCollection(db, collectionId) as T[];
    const index = collection.findIndex((item) => item._id === itemData._id);
    if (index < 0) {
      throw new Error(`${collectionId} item not found for update: ${itemData._id}`);
    }

    const current = collection[index];
    const next = {
      ...current,
      ...clone(itemData),
      _id: current._id,
      _createdDate: current._createdDate ?? nowIso(),
      _updatedDate: nowIso(),
    } as T;
    collection[index] = next;
    saveDb(db);
    return clone(next);
  }

  static async delete<T extends CrudItemBase>(collectionId: string, itemId: string): Promise<T> {
    if (shouldUsePostgresApi()) {
      return apiRequest<T>(`/records/${collectionId}/${itemId}`, {
        method: 'DELETE',
      });
    }

    const db = loadDb();
    const collection = getCollection(db, collectionId) as T[];
    const index = collection.findIndex((item) => item._id === itemId);
    if (index < 0) {
      throw new Error(`${collectionId} item not found for deletion: ${itemId}`);
    }
    const [removed] = collection.splice(index, 1);
    saveDb(db);
    return clone(removed);
  }

  static async addReferences(
    collectionId: string,
    itemId: string,
    references: Record<string, string[]>
  ): Promise<void> {
    const item = await this.getById<Record<string, unknown> & WixDataItem>(collectionId, itemId);
    if (!item) throw new Error(`${collectionId} item not found for addReferences: ${itemId}`);

    const patch: Record<string, unknown> = {};
    for (const [fieldName, refIds] of Object.entries(references)) {
      const current = Array.isArray(item[fieldName]) ? (item[fieldName] as string[]) : [];
      patch[fieldName] = Array.from(new Set([...current, ...refIds]));
    }
    await this.update(collectionId, { _id: itemId, ...patch } as any);
  }

  static async removeReferences(
    collectionId: string,
    itemId: string,
    references: Record<string, string[]>
  ): Promise<void> {
    const item = await this.getById<Record<string, unknown> & WixDataItem>(collectionId, itemId);
    if (!item) throw new Error(`${collectionId} item not found for removeReferences: ${itemId}`);

    const patch: Record<string, unknown> = {};
    for (const [fieldName, refIds] of Object.entries(references)) {
      const current = Array.isArray(item[fieldName]) ? (item[fieldName] as string[]) : [];
      patch[fieldName] = current.filter((id) => !refIds.includes(id));
    }
    await this.update(collectionId, { _id: itemId, ...patch } as any);
  }
}
