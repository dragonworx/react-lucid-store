import * as React from 'react';
import { HTMLAttributes } from 'react';
import { useRouteStore } from './routesStore';

export default function Welcome(props?: HTMLAttributes<HTMLDivElement>) {
   const { store } = useRouteStore('Welcome');
   
   return (
      <div id="welcome" {...props}>
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