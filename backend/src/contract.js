import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { load as loadYaml } from 'js-yaml';
import { repoPath } from './files.js';

/**
 * Схемы валидации берутся из docs/api/openapi.yaml (источник — spec/*.tsp).
 * Сборка сервиса backend на Vercel копирует его в backend/openapi.yaml:
 * корень сервиса — backend/, файла docs/ рядом с функцией может не быть.
 */

const here = path.dirname(fileURLToPath(import.meta.url));
const contractPath = [
  repoPath('docs', 'api', 'openapi.yaml'),
  path.resolve(here, '../openapi.yaml'),
].find((candidate) => fs.existsSync(candidate));

if (!contractPath) {
  throw new Error('Не найден docs/api/openapi.yaml. Сборка сервиса копирует его в backend/openapi.yaml.');
}

const contract = loadYaml(fs.readFileSync(contractPath, 'utf8'));

function rewriteRefs(node) {
  if (Array.isArray(node)) return node.map(rewriteRefs);
  if (node && typeof node === 'object') {
    const result = {};
    for (const [key, value] of Object.entries(node)) {
      if (key === 'example' || key === 'description') continue;
      if (key === '$ref' && typeof value === 'string') {
        result.$ref = `${value.replace('#/components/schemas/', '')}#`;
      } else {
        result[key] = rewriteRefs(value);
      }
    }
    // У логина pattern стоит рядом с allOf, без собственного type.
    // Ajv в strictTypes иначе пишет предупреждение на каждый запуск.
    if (result.pattern && result.type === undefined) result.type = 'string';
    return result;
  }
  return node;
}

export function componentSchemas() {
  return Object.entries(contract.components.schemas).map(([name, schema]) => ({
    $id: name,
    ...rewriteRefs(schema),
  }));
}

export const ref = (name) => ({ $ref: `${name}#` });
