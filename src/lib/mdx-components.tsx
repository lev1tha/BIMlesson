import type { MDXComponents } from 'mdx/types';
import { SubnetCalculator } from '@/components/widgets/subnet-calculator';
import { OsiPuzzle } from '@/components/widgets/osi-puzzle';
import { CpuPipeline } from '@/components/widgets/cpu-pipeline';
import { BaseConverter } from '@/components/widgets/base-converter';
import { RoutingGame } from '@/components/widgets/routing-game';
import { CodeTask } from '@/components/widgets/code-task';
import { SortVisualizer } from '@/components/widgets/sort-visualizer';
import { RegexTester } from '@/components/widgets/regex-tester';
import { ChartPicker } from '@/components/widgets/chart-picker';
import { CaesarCipher } from '@/components/widgets/caesar-cipher';
import { LogicGates } from '@/components/widgets/logic-gates';
import { UptimeCalculator } from '@/components/widgets/uptime-calculator';
import { RaidLab } from '@/components/widgets/raid-lab';
import { UnitEconomics } from '@/components/widgets/unit-economics';
import { PhishingHunt } from '@/components/widgets/phishing-hunt';
import { Sandbox } from '@/components/widgets/sandbox';
import { FlexboxPlayground } from '@/components/widgets/flexbox-playground';
import { HotkeyTrainer } from '@/components/widgets/hotkey-trainer';
import { FormulaTrainer } from '@/components/widgets/formula-trainer';
import { PromptReviewWidget } from '@/components/widgets/prompt-review';
import { Quiz } from '@/components/widgets/quiz';
import { BusinessNote } from '@/components/ui/business-note';
import { Mermaid } from '@/components/ui/mermaid';

/**
 * Реестр интерактивных компонентов, доступных во всех MDX-лекциях.
 * Новый виджет становится доступен в MDX только после регистрации здесь
 * (CLAUDE.md → «Контракт»). Подмешивается в getMDXComponents (components/mdx.tsx).
 */
export const widgetComponents = {
  SubnetCalculator,
  OsiPuzzle,
  CpuPipeline,
  BaseConverter,
  RoutingGame,
  CodeTask,
  SortVisualizer,
  RegexTester,
  ChartPicker,
  CaesarCipher,
  LogicGates,
  UptimeCalculator,
  RaidLab,
  UnitEconomics,
  PhishingHunt,
  Sandbox,
  FlexboxPlayground,
  HotkeyTrainer,
  FormulaTrainer,
  PromptReview: PromptReviewWidget,
  Quiz,
  BusinessNote,
  Mermaid,
} satisfies MDXComponents;
