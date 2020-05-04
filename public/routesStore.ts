import createStore from '~src';

export type Route = 'welcome' | 'example';

export interface RouteStore {
   route: Route;
};

export const initialState: RouteStore = {
   route: 'example'
};

export const useRouteStore = createStore('Routes', initialState, {
   log: true
});