import { createContext, useContext } from 'react';
import type { ISODate, Item, ItemKind, Occurrence } from './domain/types';

export interface AppActions {
  today: ISODate;
  minutes: number;
  /** Открыть редактор существующего дела. */
  open: (item: Item) => void;
  /** Открыть редактор нового дела. */
  create: (date: ISODate | null, kind?: ItemKind) => void;
  toggle: (occ: Occurrence, viaSwipe?: boolean) => void;
  move: (item: Item, from: ISODate | null, to: ISODate) => void;
  openDay: (date: ISODate) => void;
}

export const ActionsContext = createContext<AppActions>(null!);
export const useActions = () => useContext(ActionsContext);
