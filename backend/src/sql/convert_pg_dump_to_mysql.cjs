#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function qt(name) {
  return `\`${name}\``;
}

function normalizeType(line) {
  let out = line;
  out = out.replace(/character varying\((\d+)\)/gi, 'VARCHAR($1)');
  out = out.replace(/timestamp without time zone/gi, 'DATETIME');
  out = out.replace(/numeric\((\d+)\s*,\s*(\d+)\)/gi, 'DECIMAL($1,$2)');
  out = out.replace(/\bboolean\b/gi, 'TINYINT(1)');
  out = out.replace(/\btext\b/gi, 'TEXT');
  out = out.replace(/\bbigint\b/gi, 'BIGINT');
  out = out.replace(/::character varying/gi, '');
  out = out.replace(/DEFAULT\s+now\(\)/gi, 'DEFAULT CURRENT_TIMESTAMP');
  out = out.replace(/DEFAULT\s+true\b/gi, 'DEFAULT 1');
  out = out.replace(/DEFAULT\s+false\b/gi, 'DEFAULT 0');
  return out;
}

function wrapIdentifiersInColumnDef(line) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith(')')) return line;
  if (trimmed.startsWith('CONSTRAINT')) return line;

  const firstSpace = line.indexOf(' ');
  if (firstSpace <= 0) return line;
  const name = line.slice(0, firstSpace).trim().replace(/"/g, '');
  const rest = line.slice(firstSpace);

  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) return line;
  return `${qt(name)}${rest}`;
}

function sqlValue(v) {
  if (v === '\\N') return 'NULL';
  if (v === 't') return '1';
  if (v === 'f') return '0';
  if (/^-?\d+(\.\d+)?$/.test(v)) return v;
  const escaped = v.replace(/\\/g, '\\\\').replace(/'/g, "''");
  return `'${escaped}'`;
}

function convertCopyHeader(line) {
  const m = line.match(/^COPY\s+public\.([a-zA-Z0-9_]+)\s*\(([^)]+)\)\s+FROM\s+stdin;\s*$/);
  if (!m) return null;
  const table = m[1];
  const cols = m[2].split(',').map((x) => x.trim()).map((x) => qt(x));
  return { table, cols };
}

function convertConstraint(line) {
  const pk = line.match(/^\s*ADD CONSTRAINT\s+([a-zA-Z0-9_]+)\s+PRIMARY KEY\s*\(([^)]+)\);\s*$/i);
  if (pk) {
    const name = pk[1];
    const cols = pk[2].split(',').map((x) => qt(x.trim())).join(', ');
    return `  ADD CONSTRAINT ${qt(name)} PRIMARY KEY (${cols});`;
  }

  const uq = line.match(/^\s*ADD CONSTRAINT\s+([a-zA-Z0-9_]+)\s+UNIQUE\s*\(([^)]+)\);\s*$/i);
  if (uq) {
    const name = uq[1];
    const cols = uq[2].split(',').map((x) => qt(x.trim())).join(', ');
    return `  ADD CONSTRAINT ${qt(name)} UNIQUE (${cols});`;
  }

  const fk = line.match(/^\s*ADD CONSTRAINT\s+([a-zA-Z0-9_]+)\s+FOREIGN KEY\s*\(([^)]+)\)\s+REFERENCES\s+public\.([a-zA-Z0-9_]+)\s*\(([^)]+)\)(\s+ON DELETE CASCADE)?;\s*$/i);
  if (fk) {
    const name = fk[1];
    const cols = fk[2].split(',').map((x) => qt(x.trim())).join(', ');
    const refTable = fk[3];
    const refCols = fk[4].split(',').map((x) => qt(x.trim())).join(', ');
    const onDelete = fk[5] ? ' ON DELETE CASCADE' : '';
    return `  ADD CONSTRAINT ${qt(name)} FOREIGN KEY (${cols}) REFERENCES ${qt(refTable)} (${refCols})${onDelete};`;
  }

  return line;
}

function convertIndex(line) {
  const m = line.match(/^CREATE INDEX\s+([a-zA-Z0-9_]+)\s+ON\s+public\.([a-zA-Z0-9_]+)\s+USING\s+btree\s*\(([^)]+)\);\s*$/i);
  if (!m) return null;
  const idx = m[1];
  const table = m[2];
  const cols = m[3].split(',').map((x) => x.trim()).map((x) => qt(x)).join(', ');
  return `CREATE INDEX ${qt(idx)} ON ${qt(table)} (${cols});`;
}

function main() {
  const inputPath = process.argv[2];
  const outputPath = process.argv[3];

  if (!inputPath || !outputPath) {
    console.error('Usage: node convert_pg_dump_to_mysql.cjs <input.sql> <output.sql>');
    process.exit(1);
  }

  const src = fs.readFileSync(inputPath, 'utf8').split(/\r?\n/);
  const out = [];
  const autoIncTables = new Set();

  for (const line of src) {
    const m1 = line.match(/^ALTER TABLE ONLY public\.([a-zA-Z0-9_]+) ALTER COLUMN id SET DEFAULT nextval\(/);
    if (m1) autoIncTables.add(m1[1]);
    const m2 = line.match(/^ALTER TABLE public\.([a-zA-Z0-9_]+) ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY/);
    if (m2) autoIncTables.add(m2[1]);
  }

  out.push('SET NAMES utf8mb4;');
  out.push('SET FOREIGN_KEY_CHECKS = 0;');
  out.push('');

  let i = 0;
  while (i < src.length) {
    const line = src[i];

    if (!line || /^\s*$/.test(line) || /^--/.test(line) || /^\\(restrict|unrestrict)/.test(line)) {
      i += 1;
      continue;
    }

    if (/^(SET|SELECT pg_catalog|ALTER SEQUENCE|CREATE SEQUENCE|COMMENT ON TABLE|ALTER TABLE\s+public\.[a-zA-Z0-9_]+\s+OWNER TO|SELECT pg_catalog\.setval)/.test(line)) {
      i += 1;
      continue;
    }

    const copy = convertCopyHeader(line);
    if (copy) {
      i += 1;
      while (i < src.length && src[i] !== '\\.') {
        const row = src[i].split('\t').map(sqlValue).join(', ');
        out.push(`INSERT INTO ${qt(copy.table)} (${copy.cols.join(', ')}) VALUES (${row});`);
        i += 1;
      }
      i += 1;
      out.push('');
      continue;
    }

    const createTable = line.match(/^CREATE TABLE public\.([a-zA-Z0-9_]+)\s*\($/);
    if (createTable) {
      const table = createTable[1];
      out.push(`CREATE TABLE ${qt(table)} (`);
      i += 1;
      while (i < src.length) {
        let colLine = src[i];
        if (colLine.trim() === ');') {
          out.push(') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;');
          out.push('');
          i += 1;
          break;
        }

        let conv = normalizeType(colLine);
        conv = conv.replace(/\bdate\b/gi, 'DATE');

        if (autoIncTables.has(table) && /^\s*id\s+BIGINT\s+NOT NULL,?\s*$/i.test(conv)) {
          const hasComma = /,\s*$/.test(conv);
          const suffix = hasComma ? ',' : '';
          conv = `    ${qt('id')} BIGINT NOT NULL AUTO_INCREMENT${suffix}`;
        } else {
          conv = wrapIdentifiersInColumnDef(conv);
        }

        out.push(conv);
        i += 1;
      }
      continue;
    }

    const alterStart = line.match(/^ALTER TABLE ONLY public\.([a-zA-Z0-9_]+)\s*$/);
    if (alterStart) {
      const table = alterStart[1];
      const nextLine = src[i + 1] || '';
      if (/^\s*ADD CONSTRAINT/.test(nextLine)) {
        out.push(`ALTER TABLE ${qt(table)}`);
        out.push(convertConstraint(nextLine));
        out.push('');
      }
      i += 2;
      continue;
    }

    const idx = convertIndex(line);
    if (idx) {
      out.push(idx);
      out.push('');
      i += 1;
      continue;
    }

    i += 1;
  }

  out.push('SET FOREIGN_KEY_CHECKS = 1;');
  out.push('');

  fs.writeFileSync(outputPath, out.join('\n'), 'utf8');
  console.log(`Converted: ${path.resolve(outputPath)}`);
}

main();
