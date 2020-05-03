import * as React from 'react';
import { useRef } from 'react';
import { useStore } from './store';
import { randomBorder } from './util';
import log from '../src/log';

export default function Title() {
   const { store } = useStore('Title');
   
   const el = useRef<HTMLInputElement>(null);

   const onChange = () => store.title = el.current!.value;

   return (
      <div id="title" style={randomBorder()}>
         <label>Title:</label>
         <input ref={el} onChange={onChange} value={store.title} />
      </div>
   );
}