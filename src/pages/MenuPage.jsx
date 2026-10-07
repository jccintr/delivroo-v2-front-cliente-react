import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext.jsx';
import StoreHeader from '../components/StoreHeader.jsx';
import CategoryNav from '../components/CategoryNav.jsx';
import ProductCard from '../components/ProductCard.jsx';
import ProductSheet from '../components/ProductSheet.jsx';
import CartBar from '../components/CartBar.jsx';
import CartPanel from '../components/CartPanel.jsx';
import Sheet from '../components/Sheet.jsx';
import Icon from '../components/Icon.jsx';
import { formatBRL } from '../lib/money.js';
import { indexProducts } from '../lib/cart.js';

const normalize = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export default function MenuPage() {
  const cart = useStore();
  const { menu, store, slug } = cart;
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState(menu.categories[0]?.id);
  const [selected, setSelected] = useState(null); // { product, item? }
  const [cartOpen, setCartOpen] = useState(false);
  const sections = useRef({});
  const canOrder = store.isOpen;

  const products = useMemo(() => indexProducts(menu), [menu]);
  const inCart = useMemo(() => {
    const map = new Map();
    for (const i of cart.items) map.set(i.productId, (map.get(i.productId) ?? 0) + i.quantity);
    return map;
  }, [cart.items]);

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return menu.categories;
    return menu.categories
      .map((c) => ({ ...c, products: c.products.filter((p) => normalize(`${p.name} ${p.description}`).includes(q)) }))
      .filter((c) => c.products.length > 0);
  }, [menu, query]);

  // aba da categoria acompanha a rolagem
  useEffect(() => {
    if (query) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActiveCategory(Number(visible.target.dataset.category));
      },
      { rootMargin: '-150px 0px -65% 0px' },
    );
    Object.values(sections.current).forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [filtered, query]);

  const goToCategory = (id) => {
    setActiveCategory(id);
    sections.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const confirm = (data) => {
    if (selected.item) cart.replace({ ...data, id: selected.item.id });
    else { cart.add(data); cart.notify('Adicionado à sacola'); }
    setSelected(null);
  };

  const editItem = (item) => {
    setCartOpen(false);
    setSelected({ product: products.get(item.productId), item });
  };

  const goCheckout = () => { setCartOpen(false); navigate(`/${slug}/checkout`); };

  const sidebar = (
    <aside className="hidden lg:block">
      <div className="sticky top-4 overflow-hidden rounded-3xl border border-line bg-white shadow-sm">
        <h2 className="flex items-center gap-2 border-b border-line px-5 py-4 text-lg font-extrabold"><Icon name="bag" className="size-5" />Sua sacola</h2>
        <div className="max-h-[60dvh] overflow-y-auto px-5">
          <CartPanel compact lines={cart.lines} onQuantity={cart.setQuantity} onRemove={cart.remove} onEdit={editItem} />
        </div>
        {cart.count > 0 && (
          <div className="space-y-3 border-t border-line px-5 py-4">
            <div className="flex justify-between font-bold"><span>Subtotal</span><span className="tabular-nums">{formatBRL(cart.subtotalCents)}</span></div>
            <button type="button" onClick={goCheckout} disabled={!canOrder} className="h-12 w-full rounded-full bg-brand font-bold text-on-brand transition enabled:hover:brightness-95 disabled:bg-stone-300 disabled:text-stone-600">
              {canOrder ? 'Continuar' : 'Loja fechada'}
            </button>
          </div>
        )}
      </div>
    </aside>
  );

  return (
    <div className="pb-28 lg:pb-12">
      <StoreHeader menu={menu} />
      {!canOrder && (
        <div role="status" className="border-y border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm font-medium text-amber-900">
          A loja está fechada no momento. Você pode ver o cardápio, mas não é possível fazer pedidos agora.
        </div>
      )}

      <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)] lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-8 lg:px-4">
        <main>
          <CategoryNav categories={menu.categories} active={activeCategory} onSelect={goToCategory} query={query} onQuery={setQuery} />
          <div className="space-y-9 px-4 pt-6 lg:px-0">
            {filtered.length === 0 && (
              <div className="py-16 text-center">
                <p className="font-bold">Nada encontrado para “{query}”</p>
                <p className="mt-1 text-sm text-muted">Tente outro nome ou limpe a busca.</p>
              </div>
            )}
            {filtered.map((category) => (
              <section key={category.id} data-category={category.id} ref={(el) => { sections.current[category.id] = el; }} className="scroll-mt-36" aria-labelledby={`cat-${category.id}`}>
                <h2 id={`cat-${category.id}`} className="mb-3 text-xl font-extrabold">{category.name}</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {category.products.map((product) => (
                    <ProductCard key={product.id} product={product} inCart={inCart.get(product.id) ?? 0} onOpen={(p) => setSelected({ product: p })} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </main>
        {sidebar}
      </div>

      <CartBar count={cart.count} totalCents={cart.subtotalCents} onOpen={() => setCartOpen(true)} />

      <Sheet
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        title="Sua sacola"
        footer={cart.count > 0 && (
          <button type="button" onClick={goCheckout} disabled={!canOrder} className="flex h-14 w-full items-center justify-between rounded-full bg-brand px-5 font-bold text-on-brand disabled:bg-stone-300 disabled:text-stone-600">
            <span>{canOrder ? 'Continuar' : 'Loja fechada'}</span>
            {canOrder && <span className="tabular-nums">{formatBRL(cart.subtotalCents)}</span>}
          </button>
        )}
      >
        <CartPanel lines={cart.lines} onQuantity={cart.setQuantity} onRemove={cart.remove} onEdit={editItem} />
      </Sheet>

      {selected && (
        <ProductSheet key={selected.item?.id ?? selected.product.id} product={selected.product} initial={selected.item} canOrder={canOrder} onClose={() => setSelected(null)} onConfirm={confirm} />
      )}
    </div>
  );
}
