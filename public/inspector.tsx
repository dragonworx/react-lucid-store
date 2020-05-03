import * as React from 'react';
import { useStore } from './store';
import { randomBorder } from './util';

export default function Inspector() {
   const { store, undoCount, redoCount, watch } = useStore('Inspector');
   watch('*');
   return (
      <section id="summary" style={randomBorder()}>
         <h2>Store</h2>
         <h4>undos: <i>{undoCount}</i> redos: <i>{redoCount}</i></h4>
         <pre>
            {JSON.stringify(store, null, 4)}
         </pre>
      </section>
   );
}