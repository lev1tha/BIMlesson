#!/usr/bin/env node
/**
 * Проверка задач <CodeTask> в MDX-лекциях: эталонное решение из лекции
 * должно проходить все свои тест-кейсы, иначе студент не сможет сдать задачу.
 *
 *   node scripts/check-codetask.mjs                    — все лекции
 *   node scripts/check-codetask.mjs content/x/01-y.mdx — только указанные файлы
 *
 * Эталон — первый блок ```js после <CodeTask>, где объявлена функция functionName.
 * Нет эталона — задача помечается «?», но не считается ошибкой.
 */
import fs from 'node:fs';
import path from 'node:path';

function lessonFiles() {
  const files = [];
  for (const subject of fs.readdirSync('content')) {
    const dir = path.join('content', subject);
    if (!fs.statSync(dir).isDirectory()) continue;
    for (const f of fs.readdirSync(dir)) if (f.endsWith('.mdx')) files.push(path.join(dir, f));
  }
  return files;
}

/** Содержимое сбалансированных скобок, начиная с открывающей в позиции start. */
function balanced(src, start) {
  const open = src[start];
  const close = { '[': ']', '{': '}', '(': ')' }[open];
  let depth = 0;
  let quote = null;
  for (let i = start; i < src.length; i++) {
    const c = src[i];
    if (quote) {
      if (c === '\\') i++;
      else if (c === quote) quote = null;
      continue;
    }
    if (c === "'" || c === '"' || c === '`') quote = c;
    else if (c === open) depth++;
    else if (c === close && --depth === 0) return src.slice(start, i + 1);
  }
  throw new Error('несбалансированные скобки');
}

function deepEqual(a, b) {
  if (Object.is(a, b)) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const ka = Object.keys(a);
  const kb = Object.keys(b);
  return ka.length === kb.length && ka.every((k) => deepEqual(a[k], b[k]));
}

const files = process.argv.length > 2 ? process.argv.slice(2) : lessonFiles();
let failed = 0;
let checked = 0;
let missing = 0;

for (const file of files) {
  const src = fs.readFileSync(file, 'utf8');
  let i = 0;
  while ((i = src.indexOf('<CodeTask', i)) !== -1) {
    const end = src.indexOf('/>', src.indexOf('cases={', i));
    const block = src.slice(i, end);
    const name = /functionName="([^"]+)"/.exec(block)?.[1];
    const casesAt = src.indexOf('cases={', i) + 'cases='.length;
    let cases;
    try {
      cases = Function(`return ${balanced(src, casesAt).slice(1, -1)}`)();
    } catch (err) {
      console.log(`✗ ${file}: ${name} — не разобрать cases (${err.message})`);
      failed++;
      i = end;
      continue;
    }
    const fence = new RegExp('```(?:js|javascript)\\n([\\s\\S]*?function\\s+' + name + '\\b[\\s\\S]*?)```');
    const solution = fence.exec(src.slice(end))?.[1];
    if (!solution) {
      console.log(`? ${file}: ${name} — эталонное решение не найдено`);
      missing++;
      i = end;
      continue;
    }
    checked++;
    let fn;
    try {
      fn = Function(`${solution}\nreturn ${name};`)();
    } catch (err) {
      console.log(`✗ ${file}: ${name} — эталон не компилируется: ${err.message}`);
      failed++;
      i = end;
      continue;
    }
    const bad = [];
    cases.forEach((c, n) => {
      let got;
      try {
        got = fn(...structuredClone(c.args));
      } catch (err) {
        got = `исключение: ${err.message}`;
      }
      if (!deepEqual(got, c.expected)) {
        bad.push(`  кейс ${n + 1}: ${JSON.stringify(c.args)} → ожидалось ${JSON.stringify(c.expected)}, эталон дал ${JSON.stringify(got)}`);
      }
    });
    if (bad.length) {
      failed++;
      console.log(`✗ ${file}: ${name}\n${bad.join('\n')}`);
    }
    i = end;
  }
}

console.log(`\nЗадач проверено: ${checked}, без эталона: ${missing}, с ошибками: ${failed}.`);
process.exit(failed ? 1 : 0);
