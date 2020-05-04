import * as React from 'react';
import { useRouteStore } from './routesStore';

export default function Welcome() {
   const { store } = useRouteStore('Welcome');
   
   return (
      <div id="welcome">
         <h1>Welcome!</h1>
         <h3>
         ✨ React Lucid Store is magic! ✨
         </h3>
         <p>
            You <span className="tilt">get</span>, you <span className="tilt">set</span>, you <span className="tilt">forget</span>...
         </p>
         <a href="#" onClick={() => store.route = 'example'}>Check out the example...</a>
      </div>
   );
}