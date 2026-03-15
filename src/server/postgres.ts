import { cloneSeedCollections } from '@/lib/seed-data';

const DATABASE_URL = process.env.DATABASE_URL;

type Primitive = string | number | boolean | null;

type PostgresPool = {
  query: <T = any>(text: string, params?: unknown[]) => Promise<{ rows: T[] }>;
};

type ColumnConfig = {
  key: string;
  column: string;
  definition: string;
  serialize?: (value: unknown) => Primitive;
  parse?: (value: unknown) => unknown;
};

type CollectionConfig = {
  collectionId: string;
  tableName: string;
  defaultOrderColumn: string;
  columns: ColumnConfig[];
  uniqueIndexes?: string[];
  indexes?: string[];
};

type DbRow = {
  id: string;
  data: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
  created_by: string | null;
  updated_by: string | null;
} & Record<string, unknown>;

export interface PaginationOptions {
  limit: number;
  skip: number;
}

const collectionConfigs: CollectionConfig[] = [
  {
    collectionId: 'cliniclocations',
    tableName: 'clinic_locations',
    defaultOrderColumn: 'location_name',
    columns: [
      { key: 'locationName', column: 'location_name', definition: 'TEXT NOT NULL' },
      { key: 'address', column: 'address', definition: 'TEXT' },
      { key: 'contactNumber', column: 'contact_number', definition: 'TEXT' },
      { key: 'operatingHours', column: 'operating_hours', definition: 'TEXT' },
      { key: 'email', column: 'email', definition: 'TEXT' },
    ],
    uniqueIndexes: ['location_name'],
  },
  {
    collectionId: 'doctors',
    tableName: 'doctors',
    defaultOrderColumn: 'doctor_name',
    columns: [
      { key: 'doctorName', column: 'doctor_name', definition: 'TEXT NOT NULL' },
      { key: 'specialization', column: 'specialization', definition: 'TEXT' },
      { key: 'bio', column: 'bio', definition: 'TEXT' },
      { key: 'contactNumber', column: 'contact_number', definition: 'TEXT' },
      { key: 'email', column: 'email', definition: 'TEXT' },
      { key: 'qualifications', column: 'qualifications', definition: 'TEXT' },
      { key: 'yearsOfExperience', column: 'years_of_experience', definition: 'INTEGER' },
      { key: 'clinicLocation', column: 'clinic_location', definition: 'TEXT' },
    ],
    indexes: ['clinic_location'],
  },
  {
    collectionId: 'treatments',
    tableName: 'treatments',
    defaultOrderColumn: 'treatment_name',
    columns: [
      { key: 'treatmentName', column: 'treatment_name', definition: 'TEXT NOT NULL' },
      { key: 'description', column: 'description', definition: 'TEXT' },
      { key: 'relatedConditions', column: 'related_conditions', definition: 'TEXT' },
      { key: 'averageDuration', column: 'average_duration', definition: 'TEXT' },
      { key: 'benefits', column: 'benefits', definition: 'TEXT' },
    ],
  },
  {
    collectionId: 'suppliers',
    tableName: 'suppliers',
    defaultOrderColumn: 'supplier_name',
    columns: [
      { key: 'supplierName', column: 'supplier_name', definition: 'TEXT NOT NULL' },
      { key: 'contactPerson', column: 'contact_person', definition: 'TEXT' },
      { key: 'phoneNumber', column: 'phone_number', definition: 'TEXT' },
      { key: 'email', column: 'email', definition: 'TEXT' },
      { key: 'address', column: 'address', definition: 'TEXT' },
      { key: 'gstTaxId', column: 'gst_tax_id', definition: 'TEXT' },
      { key: 'paymentTerms', column: 'payment_terms', definition: 'TEXT' },
    ],
  },
  {
    collectionId: 'homeopathicmedicines',
    tableName: 'homeopathic_medicines',
    defaultOrderColumn: 'medicine_name',
    columns: [
      { key: 'medicineName', column: 'medicine_name', definition: 'TEXT NOT NULL' },
      { key: 'formType', column: 'form_type', definition: 'TEXT' },
      { key: 'potency', column: 'potency', definition: 'TEXT' },
      { key: 'manufacturer', column: 'manufacturer', definition: 'TEXT' },
      { key: 'packSize', column: 'pack_size', definition: 'TEXT' },
      { key: 'reorderLevel', column: 'reorder_level', definition: 'INTEGER' },
      { key: 'storageRequirements', column: 'storage_requirements', definition: 'TEXT' },
    ],
    uniqueIndexes: ['medicine_name', 'potency', 'form_type'],
  },
  {
    collectionId: 'inventorybatches',
    tableName: 'inventory_batches',
    defaultOrderColumn: 'updated_at',
    columns: [
      { key: 'clinicLocation', column: 'clinic_location', definition: 'TEXT NOT NULL' },
      { key: 'medicineSKU', column: 'medicine_sku', definition: 'TEXT NOT NULL' },
      { key: 'batchNumber', column: 'batch_number', definition: 'TEXT NOT NULL' },
      {
        key: 'expiryDate',
        column: 'expiry_date',
        definition: 'DATE',
        serialize: (value) => (value ? String(value).slice(0, 10) : null),
      },
      {
        key: 'quantityAvailable',
        column: 'quantity_available',
        definition: 'INTEGER NOT NULL DEFAULT 0 CHECK (quantity_available >= 0)',
        serialize: (value) => (typeof value === 'number' ? value : Number(value ?? 0)),
      },
      { key: 'supplierName', column: 'supplier_name', definition: 'TEXT' },
    ],
    uniqueIndexes: ['clinic_location', 'medicine_sku', 'batch_number'],
    indexes: ['clinic_location', 'medicine_sku', 'expiry_date'],
  },
  {
    collectionId: 'patients',
    tableName: 'patients',
    defaultOrderColumn: 'updated_at',
    columns: [
      { key: 'clinicLocation', column: 'clinic_location', definition: 'TEXT NOT NULL' },
      { key: 'patientName', column: 'patient_name', definition: 'TEXT NOT NULL' },
      { key: 'phoneNumber', column: 'phone_number', definition: 'TEXT NOT NULL' },
      { key: 'email', column: 'email', definition: 'TEXT' },
      { key: 'address', column: 'address', definition: 'TEXT' },
      {
        key: 'dateOfBirth',
        column: 'date_of_birth',
        definition: 'DATE',
        serialize: (value) => (value ? String(value).slice(0, 10) : null),
      },
      { key: 'gender', column: 'gender', definition: 'TEXT' },
      { key: 'medicalHistorySummary', column: 'medical_history_summary', definition: 'TEXT' },
    ],
    uniqueIndexes: ['clinic_location', 'phone_number'],
    indexes: ['clinic_location', 'patient_name'],
  },
  {
    collectionId: 'prescriptions',
    tableName: 'prescriptions',
    defaultOrderColumn: 'prescription_date',
    columns: [
      { key: 'clinicLocation', column: 'clinic_location', definition: 'TEXT NOT NULL' },
      { key: 'prescriptionId', column: 'prescription_id', definition: 'TEXT NOT NULL' },
      { key: 'patientName', column: 'patient_name', definition: 'TEXT NOT NULL' },
      { key: 'doctorName', column: 'doctor_name', definition: 'TEXT NOT NULL' },
      {
        key: 'prescriptionDate',
        column: 'prescription_date',
        definition: 'DATE',
        serialize: (value) => (value ? String(value).slice(0, 10) : null),
      },
      { key: 'medicinesAndDosages', column: 'medicines_and_dosages', definition: 'TEXT NOT NULL' },
      { key: 'notes', column: 'notes', definition: 'TEXT' },
    ],
    uniqueIndexes: ['prescription_id'],
    indexes: ['clinic_location', 'patient_name', 'prescription_date'],
  },
  {
    collectionId: 'stocktransactionledger',
    tableName: 'stock_transactions',
    defaultOrderColumn: 'transaction_datetime',
    columns: [
      { key: 'clinicLocation', column: 'clinic_location', definition: 'TEXT NOT NULL' },
      { key: 'transactionType', column: 'transaction_type', definition: 'TEXT NOT NULL' },
      { key: 'medicineSku', column: 'medicine_sku', definition: 'TEXT NOT NULL' },
      {
        key: 'quantityChange',
        column: 'quantity_change',
        definition: 'INTEGER NOT NULL',
        serialize: (value) => (typeof value === 'number' ? value : Number(value ?? 0)),
      },
      {
        key: 'transactionDateTime',
        column: 'transaction_datetime',
        definition: 'TIMESTAMPTZ NOT NULL',
        serialize: (value) => (value ? String(value) : new Date().toISOString()),
      },
      { key: 'referenceIdentifier', column: 'reference_identifier', definition: 'TEXT' },
      { key: 'auditReason', column: 'audit_reason', definition: 'TEXT' },
    ],
    indexes: ['clinic_location', 'medicine_sku', 'transaction_datetime'],
  },
  {
    collectionId: 'homesplashimages',
    tableName: 'home_splash_images',
    defaultOrderColumn: 'display_order',
    columns: [
      { key: 'title', column: 'title', definition: 'TEXT' },
      { key: 'caption', column: 'caption', definition: 'TEXT' },
      { key: 'displayOrder', column: 'display_order', definition: 'INTEGER' },
      { key: 'isActive', column: 'is_active', definition: 'BOOLEAN' },
    ],
  },
];

const configByCollection = new Map(collectionConfigs.map((config) => [config.collectionId, config]));

let pool: PostgresPool | null = null;
let initialized = false;

function getCollectionConfig(collectionId: string) {
  const config = configByCollection.get(collectionId);
  if (!config) {
    throw new Error(`Unsupported collection: ${collectionId}`);
  }
  return config;
}

function nowIso() {
  return new Date().toISOString();
}

function pickDataPayload(config: CollectionConfig, record: Record<string, unknown>) {
  const data = { ...record };
  delete data._id;
  delete data._createdDate;
  delete data._updatedDate;
  delete data._createdBy;
  delete data._updatedBy;

  for (const column of config.columns) {
    delete data[column.key];
  }

  return data;
}

function serializeRecordValue(column: ColumnConfig, record: Record<string, unknown>) {
  const rawValue = record[column.key];
  if (column.serialize) return column.serialize(rawValue);
  return rawValue == null ? null : (rawValue as Primitive);
}

function hydrateRecord(config: CollectionConfig, row: DbRow) {
  const hydrated: Record<string, unknown> = {
    _id: row.id,
    _createdDate: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
    _updatedDate: row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at),
    _createdBy: row.created_by,
    _updatedBy: row.updated_by,
    ...(row.data || {}),
  };

  for (const column of config.columns) {
    const rawValue = row[column.column];
    hydrated[column.key] = column.parse ? column.parse(rawValue) : rawValue;
  }

  return hydrated;
}

function buildTableSql(config: CollectionConfig) {
  const dynamicColumns = config.columns.map((column) => `${column.column} ${column.definition}`).join(',\n      ');
  return `
    CREATE TABLE IF NOT EXISTS ${config.tableName} (
      id TEXT PRIMARY KEY,
      data JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_by TEXT,
      updated_by TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      ${dynamicColumns}
    );
  `;
}

async function getPool() {
  if (!DATABASE_URL) {
    throw new Error('DATABASE_URL is not configured');
  }

  if (!pool) {
    const pg = await import('pg');
    const PoolCtor = pg.Pool as new (args: { connectionString: string }) => PostgresPool;
    pool = new PoolCtor({ connectionString: DATABASE_URL });
  }

  return pool;
}

async function ensureSchema() {
  const db = await getPool();

  for (const config of collectionConfigs) {
    await db.query(buildTableSql(config));

    for (const uniqueIndex of config.uniqueIndexes ?? []) {
      await db.query(
        `CREATE UNIQUE INDEX IF NOT EXISTS idx_${config.tableName}_${uniqueIndex.replaceAll(', ', '_').replaceAll(',', '_')}
         ON ${config.tableName} (${uniqueIndex})`
      );
    }

    for (const index of config.indexes ?? []) {
      await db.query(
        `CREATE INDEX IF NOT EXISTS idx_${config.tableName}_${index.replaceAll(', ', '_').replaceAll(',', '_')}
         ON ${config.tableName} (${index})`
      );
    }
  }
}

async function ensureSeeded() {
  const db = await getPool();
  const baseConfig = getCollectionConfig('cliniclocations');
  const { rows } = await db.query<{ count: string }>(`SELECT COUNT(*)::text AS count FROM ${baseConfig.tableName}`);
  if (Number(rows[0]?.count ?? 0) > 0) return;

  const seed = cloneSeedCollections();

  for (const [collectionId, records] of Object.entries(seed)) {
    const config = getCollectionConfig(collectionId);

    for (const record of records) {
      await createRecord(config.collectionId, record, 'system-seed');
    }
  }
}

export async function initPostgres() {
  if (initialized) return;
  await ensureSchema();
  await ensureSeeded();
  initialized = true;
}

export function getDataBackendMode() {
  return process.env.PUBLIC_DATA_BACKEND?.toLowerCase() ?? 'local';
}

export function isPostgresBackend() {
  return getDataBackendMode() === 'postgres';
}

export async function getPostgresPool() {
  return getPool();
}

export function jsonResponse(body: unknown, status = 200, extraHeaders?: HeadersInit): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...(extraHeaders ?? {}),
    },
  });
}

export function parsePagination(url: URL): PaginationOptions {
  const limit = Math.min(Math.max(Number(url.searchParams.get('limit') ?? 50), 1), 1000);
  const skip = Math.max(Number(url.searchParams.get('skip') ?? 0), 0);
  return { limit, skip };
}

export function getCollectionId(params: Record<string, string | undefined>) {
  const collectionId = params.collectionId;
  if (!collectionId) {
    throw new Error('collectionId is required');
  }
  return collectionId;
}

export async function listRecords(collectionId: string, pagination: PaginationOptions) {
  const config = getCollectionConfig(collectionId);
  const db = await getPool();

  const [itemsRes, countRes] = await Promise.all([
    db.query<DbRow>(
      `SELECT id, data, created_by, updated_by, created_at, updated_at, ${config.columns
        .map((column) => column.column)
        .join(', ')}
       FROM ${config.tableName}
       ORDER BY ${config.defaultOrderColumn} DESC NULLS LAST, updated_at DESC
       OFFSET $1 LIMIT $2`,
      [pagination.skip, pagination.limit]
    ),
    db.query<{ count: string }>(`SELECT COUNT(*)::text AS count FROM ${config.tableName}`),
  ]);

  const totalCount = Number(countRes.rows[0]?.count ?? 0);
  const hasNext = pagination.skip + pagination.limit < totalCount;

  return {
    items: itemsRes.rows.map((row) => hydrateRecord(config, row)),
    totalCount,
    hasNext,
    currentPage: Math.floor(pagination.skip / pagination.limit),
    pageSize: pagination.limit,
    nextSkip: hasNext ? pagination.skip + pagination.limit : null,
  };
}

export async function getRecordById(collectionId: string, id: string) {
  const config = getCollectionConfig(collectionId);
  const db = await getPool();
  const { rows } = await db.query<DbRow>(
    `SELECT id, data, created_by, updated_by, created_at, updated_at, ${config.columns
      .map((column) => column.column)
      .join(', ')}
     FROM ${config.tableName}
     WHERE id = $1
     LIMIT 1`,
    [id]
  );

  if (!rows[0]) return null;
  return hydrateRecord(config, rows[0]);
}

export async function createRecord(collectionId: string, record: Record<string, unknown>, actorEmail: string) {
  const config = getCollectionConfig(collectionId);
  const db = await getPool();
  const id = String(record._id ?? crypto.randomUUID());
  const createdAt = record._createdDate ? new Date(String(record._createdDate)) : new Date();
  const updatedAt = record._updatedDate ? new Date(String(record._updatedDate)) : createdAt;
  const payload = pickDataPayload(config, record);

  const columnNames = ['id', 'data', 'created_by', 'updated_by', 'created_at', 'updated_at', ...config.columns.map((c) => c.column)];
  const placeholders = columnNames.map((_, index) => `$${index + 1}`);
  const values = [
    id,
    JSON.stringify(payload),
    actorEmail,
    actorEmail,
    createdAt,
    updatedAt,
    ...config.columns.map((column) => serializeRecordValue(column, record)),
  ];

  await db.query(
    `INSERT INTO ${config.tableName} (${columnNames.join(', ')})
     VALUES (${placeholders.join(', ')})`,
    values
  );

  const created = await getRecordById(collectionId, id);
  if (!created) {
    throw new Error(`Failed to create ${collectionId} record`);
  }
  return created;
}

export async function updateRecord(collectionId: string, id: string, patch: Record<string, unknown>, actorEmail: string) {
  const config = getCollectionConfig(collectionId);
  const current = await getRecordById(collectionId, id);
  if (!current) {
    throw new Error('Record not found');
  }

  const db = await getPool();
  const next = {
    ...(current as Record<string, unknown>),
    ...(patch ?? {}),
    _id: id,
    _createdDate: current._createdDate,
    _updatedDate: nowIso(),
    _createdBy: current._createdBy ?? actorEmail,
    _updatedBy: actorEmail,
  };
  const payload = pickDataPayload(config, next);
  const assignments = ['data = $1::jsonb', 'updated_by = $2', 'updated_at = $3', ...config.columns.map((column, index) => `${column.column} = $${index + 4}`)];
  const values = [
    JSON.stringify(payload),
    actorEmail,
    new Date(String(next._updatedDate)),
    ...config.columns.map((column) => serializeRecordValue(column, next)),
    id,
  ];

  await db.query(
    `UPDATE ${config.tableName}
     SET ${assignments.join(', ')}
     WHERE id = $${values.length}`,
    values
  );

  const updated = await getRecordById(collectionId, id);
  if (!updated) {
    throw new Error(`Failed to update ${collectionId} record`);
  }
  return updated;
}

export async function deleteRecord(collectionId: string, id: string) {
  const config = getCollectionConfig(collectionId);
  const existing = await getRecordById(collectionId, id);
  if (!existing) {
    throw new Error('Record not found');
  }

  const db = await getPool();
  await db.query(`DELETE FROM ${config.tableName} WHERE id = $1`, [id]);
  return existing;
}

export async function exportCollections() {
  const exportedAt = nowIso();
  const collections: Record<string, Record<string, unknown>[]> = {};

  for (const config of collectionConfigs) {
    const result = await listRecords(config.collectionId, { limit: 10000, skip: 0 });
    collections[config.collectionId] = result.items;
  }

  return { exportedAt, collections };
}

export async function importCollections(collections: Record<string, Record<string, unknown>[]>, actorEmail: string) {
  const db = await getPool();

  for (const config of collectionConfigs) {
    await db.query(`TRUNCATE TABLE ${config.tableName} RESTART IDENTITY`);
  }

  for (const [collectionId, records] of Object.entries(collections)) {
    for (const record of records) {
      await createRecord(collectionId, record, actorEmail);
    }
  }
}
