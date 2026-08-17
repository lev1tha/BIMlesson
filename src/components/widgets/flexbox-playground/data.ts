import type { FlexState, FlexTask } from './logic';

export const DEFAULT_STATE: FlexState = {
  direction: 'row',
  justify: 'flex-start',
  align: 'flex-start',
};

export const DEFAULT_TASKS: FlexTask[] = [
  { id: 'center', title: 'Всё по центру', target: { direction: 'row', justify: 'center', align: 'center' } },
  {
    id: 'spread',
    title: 'Прижать к краям, по центру вертикали',
    target: { direction: 'row', justify: 'space-between', align: 'center' },
  },
  {
    id: 'column-end',
    title: 'В колонку, к нижнему правому углу',
    target: { direction: 'column', justify: 'flex-end', align: 'flex-end' },
  },
];
