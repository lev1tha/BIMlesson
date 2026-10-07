#!/usr/bin/env node
/**
 * Проверка квизов в MDX-лекциях: правильный вариант не должен выдавать себя длиной.
 *
 *   node scripts/check-quiz.mjs                    — все лекции
 *   node scripts/check-quiz.mjs content/x/01-y.mdx — только указанные файлы
 *
 * Правила (порядок вариантов перемешивает сам компонент Quiz, answer может быть любым):
 *  1. Правильный вариант длиннее самого длинного неправильного не больше чем на 15%.
 *  2. В лекции правильный вариант — строго самый длинный не больше чем в трети вопросов.
 */
import fs from 'node:fs';
import path from 'node:path';

const MAX_RATIO = 1.15;
const MAX_LONGEST_SHARE = 1 / 3;

function lessonFiles() {
  const files = [];
  for (const subject of fs.readdirSync('content')) {
    const dir = path.join('content', subject);
    if (!fs.statSync(dir).isDirectory()) continue;
    for (const f of fs.readdirSync(dir)) if (f.endsWith('.mdx')) files.push(path.join(dir, f));
  }
  return files;
}

function quizQuestions(src) {
  const questions = [];
  let i = 0;
  while ((i = src.indexOf('<Quiz', i)) !== -1) {
    const start = src.indexOf('{[', i);
    const end = src.indexOf(']}', start);
    questions.push(...Function(`return [${src.slice(start + 2, end)}]`)());
    i = end;
  }
  return questions;
}

const files = process.argv.length > 2 ? process.argv.slice(2) : lessonFiles();
let failedFiles = 0;
let total = 0;
let longestTotal = 0;

for (const file of files) {
  const questions = quizQuestions(fs.readFileSync(file, 'utf8'));
  if (questions.length === 0) continue;
  const problems = [];
  let longest = 0;
  questions.forEach((q, n) => {
    const lengths = q.options.map((o) => o.length);
    const correct = lengths[q.answer];
    const maxWrong = Math.max(...lengths.filter((_, k) => k !== q.answer));
    if (correct > maxWrong) longest++;
    if (correct > maxWrong * MAX_RATIO) {
      problems.push(`  вопрос ${n + 1}: правильный ${correct} симв., самый длинный неправильный ${maxWrong} — «${q.question.slice(0, 60)}»`);
    }
  });
  const limit = Math.floor(questions.length * MAX_LONGEST_SHARE);
  if (longest > limit) problems.push(`  правильный — самый длинный в ${longest} из ${questions.length} вопросов (допустимо до ${limit})`);
  total += questions.length;
  longestTotal += longest;
  if (problems.length) {
    failedFiles++;
    console.log(`✗ ${file}\n${problems.join('\n')}`);
  }
}

console.log(`\nВопросов: ${total}, правильный самый длинный: ${longestTotal} (${total ? Math.round((longestTotal / total) * 100) : 0}%). Файлов с замечаниями: ${failedFiles}.`);
process.exit(failedFiles ? 1 : 0);
