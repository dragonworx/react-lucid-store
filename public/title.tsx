import * as React from 'react';
import { useRef } from 'react';
import { useStore } from './store';
import { randomBorder } from './util';

export default function Title() {
   const { store, useThrottledBatch } = useStore('Title');
   const enableBatching = useThrottledBatch('title');

   const el = useRef<HTMLInputElement>(null);

   const onChange = () => {
      enableBatching(1000);
      store.title = el.current!.value;
   };

   return (
      <div id="title" style={randomBorder()}>
         <label>Title:</label>
         <input ref={el} onChange={onChange} value={store.title} />
      </div>
   );
}