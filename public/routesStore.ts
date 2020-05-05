import createStore from '~src';

export interface RouteStore {
   route: 'welcome' | 'example';
};

export const initialState: RouteStore = {
   route: 'welcome'
};

export const useRouteStore = createStore('Routes', initialState, {
   log: true,
});