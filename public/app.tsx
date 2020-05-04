import * as React from 'react';
import Navigation from './navigation';
import Welcome from './welcome';
import Example from './example';
import { useRouteStore } from './routesStore';
import './app.less';

export function App() {
   const { store: { route } } = useRouteStore('App');
   
   let content;

   switch (route) {
      case 'example':
         content = <Example />;
         break;
      case 'welcome':
         content = <Welcome />;
         break;
   }

   return (
      <div id="app">
         <Navigation />
         <div id="content">
            {content}
         </div>
      </div>
   );
}