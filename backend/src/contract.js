import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { load as loadYaml } from 'js-yaml';

/**
 * Схемы валидации берутся из docs/api/openapi.yaml (источник — spec/*.tsp).
 */

const contractPath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../docs/api/openapi.yaml',
);

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
