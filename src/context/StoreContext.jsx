import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { KEYS, load, save } from '../lib/storage.js';
import { cartCount, cartSubtotal, newId, priceCart, reconcileCart } from '../lib/cart.js';

const StoreContext = createContext(null);
export const useStore = () => useContext(StoreContext);

function reducer(state, action) {
  switch (action.type) {
    case 'set': return action.items;
    case 'add': return [...state, action.item];
    case 'replace': return state.map((i) => (i.id === action.item.id ? action.item : i));
    case 'qty': return state.map((i) => (i.id === action.id ? { ...i, quantity: Math.min(99, Math.max(1, action.quantity)) } : i));
    case 'remove': return state.filter((i) => i.id !== action.id);
    case 'clear': return [];
    default: return state;
  }
}

export function StoreProvider({ slug, menu, reload, children }) {
  const [items, dispatch] = useReducer(reducer, slug, (s) => load(KEYS.cart(s), []));
  const [toast, setToast] = useState(null);
  const toastTimer = useRef();

  const notify = useCallback((message) => {
    setToast({ message, id: newId() });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3200);
  }, []);

  // ao carregar o cardápio, tira do carrinho o que não existe mais
  useEffect(() => {
    const { items: valid, removed } = reconcileCart(menu, items);
    if (removed > 0) {
      dispatch({ type: 'set', items: valid });
      notify(removed === 1 ? 'Um item da sua sacola saiu do cardápio e foi removido.' : `${removed} itens da sua sacola saíram do cardápio e foram removidos.`);
    }
    // só quando o cardápio muda
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menu]);

  useEffect(() => save(KEYS.cart(slug), items), [slug, items]);

  const value = useMemo(() => {
    const lines = priceCart(menu, items);
    return {
      slug, menu, store: menu.store,
      items, lines,
      count: cartCount(items),
      subtotalCents: cartSubtotal(lines),
      add: (item) => dispatch({ type: 'add', item: { ...item, id: newId() } }),
      replace: (item) => dispatch({ type: 'replace', item }),
      setQuantity: (id, quantity) => dispatch({ type: 'qty', id, quantity }),
      remove: (id) => dispatch({ type: 'remove', id }),
      clear: () => dispatch({ type: 'clear' }),
      notify, toast, reload,
    };
  }, [slug, menu, items, notify, toast, reload]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}
