/** @jsxRuntime classic */
/** @jsx React.createElement */
import * as React from 'react';

const { useMemo, useState } = React;

const PRODUCT_BASE = 'img/fruits/All Products/';
const REAL_BASE = 'img/fruits/Real Fruit/';

const PRODUCTS = [
  { name: 'ふじりんご', type: 'Apple', art: 'Apple/Red.jpg', real: 'box-Apple-Red.jpg', tags: ['popular', 'sweet'] },
  { name: '王林りんご', type: 'Apple', art: 'Apple/Green.jpg', real: 'box-Apple-Green.jpg', tags: ['seasonal', 'fresh'] },
  { name: 'シナノゴールド', type: 'Apple', art: 'Apple/Yellow.jpg', real: 'box-Apple-Yellow.jpg', tags: ['seasonal', 'fresh'] },
  { name: '白桃', type: 'Peach', art: 'Peach/Light.jpg', real: 'box-Peach-Light.jpg', tags: ['popular', 'sweet', 'juicy'] },
  { name: 'あかつき桃', type: 'Peach', art: 'Peach/Pink.jpg', real: 'box-Peach-Pink.jpg', tags: ['popular', 'sweet', 'juicy'] },
  { name: '黄金桃', type: 'Peach', art: 'Peach/Yellow.jpg', real: 'box-Peach-Yellow.jpg', tags: ['seasonal', 'sweet', 'juicy'] },
  { name: '淡雪', type: 'Strawberry', art: 'Strawberry/White.jpg', real: 'real-Strawberry-White.jpg', tags: ['seasonal', 'sweet'] },
  { name: 'とちおとめ', type: 'Strawberry', art: 'Strawberry/Red.jpg', real: 'real-Strawberry-Red.jpg', tags: ['popular', 'sweet'] },
  { name: 'あまおう', type: 'Strawberry', art: 'Strawberry/Dark.jpg', real: 'real-Strawberry-Dark.jpg', tags: ['popular', 'sweet', 'juicy'] },
  { name: 'ラ・フランス', type: 'Pear', art: 'Pear/La France.jpg', real: 'real-Pear-La France.jpg', tags: ['seasonal', 'juicy'] },
  { name: '幸水梨', type: 'Pear', art: 'Pear/Kousui.jpg', real: 'real-Pear-Kousui.jpg', tags: ['fresh', 'juicy'] },
  { name: 'せとかみかん', type: 'Orange', art: 'Orange.jpg', real: 'real-Orange-Setoka.jpg', tags: ['popular', 'sweet', 'juicy'] },
  { name: '巨峰', type: 'Grape', art: 'Grape/Kyoho.jpg', real: 'real-Grape-Kyoho.jpg', tags: ['seasonal', 'sweet', 'juicy'] },
  { name: 'マスカット', type: 'Grape', art: 'Grape/Muscat.jpg', real: 'real-Grape-Muscat.jpg', tags: ['popular', 'fresh', 'juicy'] },
  { name: 'グリーンキウイ', type: 'Kiwi', art: 'Kiwi/Green.jpg', real: 'real-Kiwi-Green.jpg', tags: ['fresh'] },
  { name: 'レッドキウイ', type: 'Kiwi', art: 'Kiwi/Red.jpg', real: 'real-Kiwi-Red.jpg', tags: ['seasonal', 'sweet'] },
  { name: 'ゴールドキウイ', type: 'Kiwi', art: 'Kiwi/Yellow.jpg', real: 'real-Kiwi-Yellow.jpg', tags: ['popular', 'sweet'] },
  { name: 'インドマンゴー', type: 'Mango', art: 'Mango/Indo.jpg', real: 'real-Mango-Indo.jpg', tags: ['tropical', 'sweet'] },
  { name: 'アーウィンマンゴー', type: 'Mango', art: 'Mango/Irwin.jpg', real: 'real-Mango-Irwin.jpg', tags: ['tropical', 'juicy'] },
  { name: '紅秀峰', type: 'Cherry', art: 'Cherry/Beni.jpg', real: 'real-Cherry-Beni.jpg', tags: ['seasonal', 'sweet'] },
  { name: 'アメリカンチェリー', type: 'Cherry', art: 'Cherry/American.jpg', real: 'real-Cherry-American.jpg', tags: ['popular', 'sweet'] },
  { name: 'スイカ', type: 'Watermelon', art: 'Watermelon/Red.jpg', real: 'real-Watermelon-Red.jpg', tags: ['seasonal', 'fresh', 'juicy'] },
  { name: '黄スイカ', type: 'Watermelon', art: 'Watermelon/Red-1.jpg', real: 'real-Watermelon-Yellow.jpg', tags: ['seasonal', 'sweet', 'juicy'] },
].map((product, fruitId) => ({ ...product, fruitId }));

const FILTERS = [
  ['all', 'すべて'], ['seasonal', '季節のフルーツ'], ['popular', '人気ランキング'],
  ['sweet', '甘め'], ['fresh', 'さっぱり'], ['juicy', 'ジューシー'], ['tropical', 'トロピカル'],
];
const PAGE_SIZE = 15;

const DISPLAY_PRODUCTS = [...PRODUCTS].sort((left, right) => {
  const moveToEnd = (product) => {
    if (product.type === 'Pear') return 1;
    if (product.type === 'Peach' || product.type === 'Strawberry') return 2;
    return 0;
  };
  return moveToEnd(left) - moveToEnd(right);
});

export function ProductCatalog({ favoriteFruitIds, toggleFavoriteFruit }) {
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [bagCount, setBagCount] = useState(0);
  const [notice, setNotice] = useState('');
  const filtered = useMemo(() => DISPLAY_PRODUCTS.filter(item => filter === 'all' || item.tags.includes(filter)), [filter]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visible = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const chooseFilter = (id) => { setFilter(id); setPage(0); };
  const addProduct = (name) => {
    setBagCount(count => count + 1);
    setNotice(`${name}をカートに追加しました`);
    window.clearTimeout(addProduct.timer);
    addProduct.timer = window.setTimeout(() => setNotice(''), 1800);
  };

  return (
    <section className="products-section" aria-labelledby="products-title">
      <div className="products-title-row">
        <div className="products-heading">
          <h2 id="products-title">FRUITS</h2><span>（商品一覧）</span>
        </div>
        <div className="products-toolbar">
          <div className="products-pagination" aria-label="商品ページ">
            <button type="button" onClick={() => setPage(value => Math.max(0, value - 1))} disabled={page === 0} aria-label="前の商品">
              <img src="img/icon/jiantou.svg" alt="" />
            </button>
            <span>{String(page + 1).padStart(2, '0')} / {String(pageCount).padStart(2, '0')}</span>
            <button type="button" onClick={() => setPage(value => Math.min(pageCount - 1, value + 1))} disabled={page >= pageCount - 1} aria-label="次の商品">
              <img src="img/icon/jiantou.svg" alt="" />
            </button>
          </div>
          <div className="products-bag" aria-label={`カート ${bagCount}点`}><span className="products-bag-grid" /><b>{bagCount}</b></div>
        </div>
      </div>

      <nav className="products-filters" aria-label="商品を絞り込む">
        {FILTERS.map(([id, label]) => <button type="button" key={id} className={filter === id ? 'is-active' : ''} onClick={() => chooseFilter(id)}>{label}</button>)}
      </nav>

      <div className="products-grid" aria-live="polite">
        {visible.map((product, index) => (
          <article className="product-card" key={product.name} style={{ '--card-delay': `${index * 24}ms` }}>
            <div className="product-image-wrap">
              <img className="product-image product-image-art" src={`${PRODUCT_BASE}${product.art}`} alt={product.name} />
              <img className="product-image product-image-real" src={`${REAL_BASE}${product.real}`} alt={`${product.name}の実物写真`} loading="lazy" />
              <button type="button" className={`product-favorite ${favoriteFruitIds.has(product.fruitId) ? 'is-favorite' : ''}`} onClick={() => toggleFavoriteFruit(product.fruitId)} aria-label={`${product.name}をお気に入りに追加`} aria-pressed={favoriteFruitIds.has(product.fruitId)}>
                <img src={favoriteFruitIds.has(product.fruitId) ? 'img/icon/HeartUsed.svg' : 'img/icon/HeartUnused.svg'} alt="" />
              </button>
            </div>
            <div className="product-card-footer">
              <p>
                <span>{product.name}</span>
                {favoriteFruitIds.has(product.fruitId) ? <img className="product-name-heart" src="img/icon/HeartUsed.svg" alt="お気に入り" /> : null}
              </p>
              <button type="button" className="product-add" onClick={() => addProduct(product.name)} aria-label={`${product.name}をカートに追加`}>＋</button>
            </div>
          </article>
        ))}
      </div>
      {notice ? <div className="product-toast" role="status">{notice}</div> : null}
    </section>
  );
}
