const fs = require('fs');
const path = require('path');

const root = __dirname;
const source = path.join(root, 'springer', 'src', 'main', 'resources', 'db', 'migration', 'V1__Initial_Schema.sql');
const target = path.join(root, 'springer', 'src', 'main', 'resources', 'db', 'postgresql', 'migration', 'V1__Initial_Schema.sql');

function splitTopLevel(value, delimiter) {
  const result = [];
  let start = 0;
  let depth = 0;
  let quoted = false;

  for (let index = 0; index < value.length; index += 1) {
    const character = value[index];
    if (character === "'") {
      if (quoted && value[index + 1] === "'") {
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (!quoted) {
      if (character === '(') depth += 1;
      if (character === ')') depth -= 1;
      if (character === delimiter && depth === 0) {
        result.push(value.slice(start, index).trim());
        start = index + 1;
      }
    }
  }

  result.push(value.slice(start).trim());
  return result.filter(Boolean);
}

function findClosingParenthesis(value, openingIndex) {
  let depth = 0;
  let quoted = false;
  for (let index = openingIndex; index < value.length; index += 1) {
    const character = value[index];
    if (character === "'") {
      if (quoted && value[index + 1] === "'") {
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (!quoted) {
      if (character === '(') depth += 1;
      if (character === ')') {
        depth -= 1;
        if (depth === 0) return index;
      }
    }
  }
  throw new Error('Unclosed CREATE TABLE definition');
}

function splitStatements(value) {
  return splitTopLevel(value, ';');
}

function convertInsertIgnore(statement) {
  if (!/^INSERT\s+IGNORE\s+INTO\b/i.test(statement)) return statement;
  return statement.replace(/^INSERT\s+IGNORE\s+INTO\b/i, 'INSERT INTO') + ' ON CONFLICT DO NOTHING';
}

function castJsonArrayLiterals(statement) {
  return statement.replace(/'(\[\{[^']*?\}\])'/g, "'$1'::jsonb");
}

function writeSeedV2() {
  const v2Source = path.join(root, 'springer', 'src', 'main', 'resources', 'db', 'migration', 'V2__Seed_Data.sql');
  const v2Target = path.join(root, 'springer', 'src', 'main', 'resources', 'db', 'postgresql', 'migration', 'V2__Seed_Data.sql');
  const statements = splitStatements(fs.readFileSync(v2Source, 'utf8').replace(/^\s*--.*$/gm, ''));
  const output = statements.map((statement) => castJsonArrayLiterals(convertInsertIgnore(statement))).join(';\n\n') + ';\n';
  fs.writeFileSync(v2Target, output, 'utf8');
}

function writeSeedV3() {
  const v3Source = path.join(root, 'springer', 'src', 'main', 'resources', 'db', 'migration', 'V3__Seed_Our_Part_Data.sql');
  const v3Target = path.join(root, 'springer', 'src', 'main', 'resources', 'db', 'postgresql', 'migration', 'V3__Seed_Our_Part_Data.sql');
  const statements = splitStatements(fs.readFileSync(v3Source, 'utf8').replace(/^\s*--.*$/gm, ''));
  const cleanup = [];
  const body = [];
  const variables = statements
    .map((statement) => statement.trim().match(/^SET\s+@(\w+)\s*=\s*\(([^]*?)\)$/i)?.[1])
    .filter(Boolean);

  for (const statement of statements) {
    const trimmed = statement.trim();
    const variable = trimmed.match(/^SET\s+@(\w+)\s*=\s*\(([^]*?)\)$/i);
    if (variable) {
      const name = variable[1];
      const expression = variable[2].replace(/@(\w+)/g, (match, reference) => variables.includes(reference) ? `v_${reference}` : match);
      body.push(`${expression} INTO v_${name}`);
      continue;
    }

    let converted = castJsonArrayLiterals(convertInsertIgnore(trimmed))
      .replace(/'OFFER_ACCEPTED'/g, "'ACCEPTED'")
      .replace(/@(\w+)/g, (match, name) => variables.includes(name) ? `v_${name}` : match);
    if (/^INSERT\s+INTO\s+training_courses\b/i.test(converted)) {
      converted = converted
        .replace(/, 0, (?=(?:NULL|'\[\{))/g, ', FALSE, ')
        .replace(/, 1, (?=(?:NULL|'\[\{))/g, ', TRUE, ');
    }
    if (body.length === 0 && /^DELETE\s+FROM\b/i.test(converted)) {
      cleanup.push(converted);
    } else {
      body.push(converted);
    }
  }

  const declarations = [...new Set(variables)].map((name) => `  v_${name} bigint;`).join('\n');
  const output = [
    '-- PostgreSQL seed lineage. Invalid offer status values are normalized to the schema check value.',
    ...cleanup.map((statement) => `${statement};`),
    'DO $migration$',
    'DECLARE',
    declarations,
    'BEGIN',
    ...body.map((statement) => `  ${statement};`),
    'END',
    '$migration$;',
    '',
  ].join('\n\n');
  fs.writeFileSync(v3Target, output, 'utf8');
}

function convertColumn(item, table, checks) {
  const column = item.match(/^([A-Za-z0-9_$]+)\s+/)?.[1];
  if (!column) return item;

  let enumIndex = 0;
  const converted = item.replace(/\benum\s*\(([^)]*)\)/gi, (_, values) => {
    enumIndex += 1;
    const name = `${table}_${column}_enum_chk${enumIndex}`.replace(/[^A-Za-z0-9_$]/g, '_');
    const allowed = values.match(/'(?:''|[^'])*'/g) ?? [];
    checks.push(`CONSTRAINT ${name} CHECK (${column} IN (${allowed.join(',')}))`);
    return 'varchar(255)';
  });

  return converted
    .replace(/\bdatetime\s*\(\s*6\s*\)/gi, 'timestamp(6)')
    .replace(/\blongblob\b/gi, 'bytea')
    .replace(/\bjson\b/gi, 'jsonb')
    .replace(/\bbit\s*\(\s*1\s*\)/gi, 'boolean')
    .replace(/\btinyint\s*\(\s*1\s*\)/gi, 'boolean')
    .replace(/\bAUTO_INCREMENT\b/gi, 'GENERATED BY DEFAULT AS IDENTITY');
}

const sourceSql = fs.readFileSync(source, 'utf8')
  .replace(/\/\*!.*?\*\/;?\s*/gs, '')
  .replaceAll('`', '');

const tables = [];
const indexes = [];
const foreignKeys = [];
const tablePattern = /CREATE TABLE IF NOT EXISTS ([A-Za-z0-9_$]+) \(/gi;
let match;

while ((match = tablePattern.exec(sourceSql)) !== null) {
  const table = match[1];
  const openingIndex = tablePattern.lastIndex - 1;
  const closingIndex = findClosingParenthesis(sourceSql, openingIndex);
  const items = splitTopLevel(sourceSql.slice(openingIndex + 1, closingIndex), ',');
  const definitions = [];
  const checks = [];

  for (const item of items) {
    const foreignKey = item.match(/^CONSTRAINT ([A-Za-z0-9_$]+) FOREIGN KEY \(([^)]*)\) REFERENCES ([A-Za-z0-9_$]+) \(([^)]*)\)$/is);
    if (foreignKey) {
      foreignKeys.push(`ALTER TABLE ${table} ADD CONSTRAINT ${foreignKey[1]} FOREIGN KEY (${foreignKey[2]}) REFERENCES ${foreignKey[3]} (${foreignKey[4]});`);
      continue;
    }

    const uniqueKey = item.match(/^UNIQUE KEY ([A-Za-z0-9_$]+) \((.*)\)$/is);
    if (uniqueKey) {
      definitions.push(`CONSTRAINT ${uniqueKey[1]} UNIQUE (${uniqueKey[2]})`);
      continue;
    }

    const index = item.match(/^KEY ([A-Za-z0-9_$]+) \((.*)\)$/is);
    if (index) {
      indexes.push(`CREATE INDEX IF NOT EXISTS ${index[1]} ON ${table} (${index[2]});`);
      continue;
    }

    definitions.push(convertColumn(item, table, checks));
  }

  tables.push(`CREATE TABLE ${table} (\n  ${[...definitions, ...checks].join(',\n  ')}\n);`);
  tablePattern.lastIndex = closingIndex + 1;
}

const output = [
  '-- PostgreSQL Flyway lineage. Generated from the immutable MySQL V1 schema.',
  '-- Foreign keys are added after all tables to support forward references.',
  ...tables,
  ...indexes,
  ...foreignKeys,
].join('\n\n') + '\n';

fs.writeFileSync(target, output, 'utf8');
writeSeedV2();
writeSeedV3();
console.log(`tables=${tables.length} indexes=${indexes.length} foreignKeys=${foreignKeys.length}`);