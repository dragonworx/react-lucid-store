import createStore from '~src';

export interface Item {
   title: string;
   count: number;
};

const ITEM_COUNT = 3;

export const initialState = () => ({
   title: 'My List',
   items: Array(ITEM_COUNT).fill(0).map((i, j) => ({
      title: `Item ${j}`,
      count: 0,
   })) as Item[],
});

// quick way to export store interface
export type Store = ReturnType<typeof initialState>;

export const useStore = createStore('Example', initialState(), {
   log: true
});