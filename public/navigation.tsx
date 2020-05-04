import * as React from 'react';
import { useRouteStore } from './routesStore';

export default function Navigation() {
   const { store } = useRouteStore('Navigation');
   const { route } = store;
   
   return (
      <div id="navigation">
         <div className="tab"><a href="#" onClick={() => store.route = 'welcome'}>{route === 'welcome' ? <b>Welcome</b> : 'Welcome'}</a></div>
         <div className="tab"><a href="#" onClick={() => store.route = 'example'}>{route === 'example' ? <b>Example</b> : 'Example'}</a></div>
      </div>
   );
}