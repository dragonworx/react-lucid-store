import * as React from 'react';
import Navigation from './navigation';
import Welcome from './welcome';
import Example from './example';
import { useRouteStore } from './routesStore';
import './app.less';

export function App() {
   const { store: { route } } = useRouteStore('App');

   return (
      <div id="app">
         <Navigation />
         <div id="content">
            <Welcome className={route === 'welcome' ? 'show' : 'hide'} />
            <Example className={route === 'example' ? 'show' : 'hide'} />
         </div>
      </div>
   );
}