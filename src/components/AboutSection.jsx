/** @jsxRuntime classic */
/** @jsx React.createElement */
import * as React from 'react';
import { POPULAR_BOX_ITEMS } from '../data/fruitCatalog.js';
import { BoxThumbnail } from './BoxThumbnail.jsx';

const RANKED_SETS = [
  { rank: 3, item: POPULAR_BOX_ITEMS[2], tone: '#F3F4F5' },
  { rank: 1, item: POPULAR_BOX_ITEMS[0], tone: '#FFF3B8' },
  { rank: 2, item: POPULAR_BOX_ITEMS[1], tone: '#FFD4D4' },
];

const STEPS = [
  { title: '① サイズを選ぶ', text: 'S（400g）・M（700g）・L（1kg）の3サイズをご用意しています。' },
  { title: '② 果実を選ぶ', text: '最大4種類まで選択可能。2〜3種類でも内容量はBOXサイズに合わせます。' },
  { title: '③ 注文する', text: 'カートで内容を確認し、ご注文手続きへお進みください。' },
];

const FEATURES = [
  { icon: '▣', label: '当日配送対応' },
  { icon: '▤', label: '事前予約OK' },
  { icon: '♥', label: 'お気に入り登録' },
  { icon: '◷', label: '履歴から簡単再注文' },
];

export function AboutSection() {
  return (
    <section className="about-section" aria-labelledby="about-title">
      <div className="about-heading-row">
        <h2 id="about-title">ABOUT</h2>
        <span>（果実ラボについて）</span>
      </div>

      <p className="about-lead">
        旬のカットフルーツを、東京エリアへお届け。<br />
        好きな果実を自由に組み合わせて、あなただけのBOXをつくれます。
      </p>

      <div className="about-ranking" aria-label="人気セット トップ3">
        {RANKED_SETS.map(({ rank, item, tone }) => (
          <article className={`about-ranked-box about-rank-${rank}`} key={rank}>
            <span className="about-rank-badge" style={{ '--badge-tone': tone }}>{rank}</span>
            <BoxThumbnail fruits={item.fruits} width="100%" height="100%" ariaLabel={item.name} />
            <p>{item.name}</p>
          </article>
        ))}
      </div>

      <div className="about-steps">
        {STEPS.map(step => (
          <article className="about-step-card" key={step.title}>
            <h3>{step.title}</h3>
            <p>{step.text}</p>
          </article>
        ))}
      </div>

      <div className="about-features" aria-label="サービスの特徴">
        {FEATURES.map(feature => (
          <div key={feature.label}>
            <span aria-hidden="true">{feature.icon}</span>
            <p>{feature.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
