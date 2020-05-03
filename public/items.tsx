import * as React from 'react';
import { useStore } from './store';
import Item from './item';
import AddButton from './addButton';
import { randomBorder } from './util';

export default function Items() {
   const { store: { items } } = useStore('Items');

   return (
      <div id="items" style={randomBorder()}>
         <p>{items.length} Items: <AddButton /></p>
         <ol>{items.map((item, i) => <Item key={i} item={item} />)}</ol>
      </div>
   );
}