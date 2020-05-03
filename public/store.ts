import createStore from '~src';

export interface Item {
   title: string;
   count: number;
};

const ITEM_COUNT = 3;

export const initialState = () => ({
   title: 'My List',
   test: [3,1,2],
   user: {
      name: 'Bob',
   },
   items: Array(ITEM_COUNT).fill(0).map((i, j) => ({
      title: `Item ${j}`,
      count: 0,
   })) as Item[],
});

export type State = ReturnType<typeof initialState>;

export const useStore = createStore('Example', initialState(), {
   log: true
});