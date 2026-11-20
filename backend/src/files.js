import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

/**
 * Файл из корня репозитория. Локально процесс запускают из backend/,
 * на Vercel корень проекта — каталог функции.
 */
export function repoPath(...parts) {
  const candidates = [
    path.resolve(here, '..', '..', ...parts),
    path.resolve(process.cwd(), ...parts),
    path.resolve(process.cwd(), '..', ...parts),
  ];
  return candidates.find((candidate) => fs.existsSync(candidate)) ?? candidates[0];
}
