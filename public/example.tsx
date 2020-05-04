import * as React from 'react';
import Title from './title';
import Items from './items';
import Inspector from './inspector';
import Undo from './undo';
import Redo from './redo';
import './example.less';

export default function Example() {;
   return (
      <div id="example">
         <h1>React Lucid Store Example</h1>
         <section>
            <Undo />
            <Redo />
         </section>
         <div>
            <section id="list">
               <section>
                  <Title />
               </section>
               <Items />
            </section>
            <Inspector />
         </div>
      </div>
   );
}