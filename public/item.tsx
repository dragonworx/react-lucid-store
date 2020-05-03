import * as React from 'react';
import { useRef } from 'react';
import { useStore, Item } from './store';
import { randomBorder } from './util';

export interface Props {
   item: Item;
}

export default function Item({ item }: Props) {
   const { store: { items } } = useStore('Item');
   const titleEl = useRef<HTMLInputElement>(null);
   const countEl = useRef<HTMLInputElement>(null);

   const onTitleChange = () => item.title = titleEl.current!.value;
   const onCountChange = () => item.count = parseInt(countEl.current!.value);
   const onDeleteClick = () => {
      const index = items.indexOf(item);
      items.splice(index, 1);
   }

   return (
      <li>
         <div className="item" style={randomBorder()}>
            <input ref={titleEl} onChange={onTitleChange} value={item.title} style={randomBorder()} />
            <input ref={countEl} type="number" onChange={onCountChange} value={item.count} style={randomBorder()} />
            <button className="delete" onClick={onDeleteClick} style={randomBorder()}>X</button>
         </div>
      </li>
   )
}