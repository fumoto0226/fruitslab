/** @jsxRuntime classic */
/** @jsx React.createElement */
import * as React from 'react';
import { BOX_FRUIT_BASE_PATH, FRUIT_ITEMS } from '../data/fruitCatalog.js';

const BOX_LAYER_SRCS = {
  front: `${BOX_FRUIT_BASE_PATH}box-front.png`,
  middle: `${BOX_FRUIT_BASE_PATH}box-middle.png`,
  top: `${BOX_FRUIT_BASE_PATH}box-top.png`,
};

// 位置均以素材原始的 1400x920 画布为基准。水果向下压入盒中，约三分之一由盒子横边遮挡。
// 调整位置：left 控制左右，top 控制上下。
const FRUIT_SLOT_LAYOUT = [
  { left: '7.57%', top: '0.26%' },
  { left: '47.43%', top: '0.26%' },
  { left: '7.57%', top: '33.52%' },
  { left: '47.43%', top: '33.52%' },
];

// 水果整体大小只改这里：1 是素材原始大小，1.22 表示放大到 122%，宽高会同步缩放。
const FRUIT_LAYER_SCALE = 1.4;

const FRUIT_LAYER_SIZE = {
  width: `${32.86 * FRUIT_LAYER_SCALE}%`,
  height: `${50 * FRUIT_LAYER_SCALE}%`,
};

function resolveFruit(item) {
  if (item == null) return null;
  if (typeof item === 'number') return FRUIT_ITEMS[item] ?? null;
  if (Number.isInteger(item.appleId)) return FRUIT_ITEMS[item.appleId] ?? null;
  return item.boxSrc ? item : null;
}

function BoxLayer({ src, zIndex }) {
  return (
    <img
      src={src}
      alt=""
      draggable={false}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        objectFit: 'contain',
        pointerEvents: 'none',
        userSelect: 'none',
        WebkitUserDrag: 'none',
        zIndex,
      }}
    />
  );
}

function FruitLayer({ fruit, slotIndex, zIndex }) {
  if (!fruit?.boxSrc) return null;
  const position = FRUIT_SLOT_LAYOUT[slotIndex];
  return (
    <img
      src={fruit.boxSrc}
      alt=""
      draggable={false}
      style={{
        position: 'absolute',
        left: position.left,
        top: position.top,
        width: FRUIT_LAYER_SIZE.width,
        height: FRUIT_LAYER_SIZE.height,
        objectFit: 'contain',
        pointerEvents: 'none',
        userSelect: 'none',
        WebkitUserDrag: 'none',
        zIndex,
      }}
    />
  );
}

export function BoxThumbnail({ fruits = [], width = '100%', height = '100%', style, ariaLabel }) {
  const slots = [null, null, null, null];
  fruits.forEach((item, index) => {
    const slotIndex = Number.isInteger(item?.cell) ? item.cell : index;
    if (slotIndex >= 0 && slotIndex < slots.length) slots[slotIndex] = resolveFruit(item);
  });

  return (
    <div
      role={ariaLabel ? 'img' : undefined}
      aria-label={ariaLabel}
      aria-hidden={ariaLabel ? undefined : true}
      style={{ position: 'relative', width, height, overflow: 'visible', pointerEvents: 'none', ...style }}
    >
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: '50%',
          width: '100%',
          aspectRatio: '1400 / 920',
          transform: 'translateY(-50%)',
        }}
      >
        {/* 从下到上：box-top、1/2 格水果、box-middle、3/4 格水果、box-front。 */}
        <BoxLayer src={BOX_LAYER_SRCS.top} zIndex={1} />
        <FruitLayer fruit={slots[0]} slotIndex={0} zIndex={2} />
        <FruitLayer fruit={slots[1]} slotIndex={1} zIndex={2} />
        <BoxLayer src={BOX_LAYER_SRCS.middle} zIndex={3} />
        <FruitLayer fruit={slots[2]} slotIndex={2} zIndex={4} />
        <FruitLayer fruit={slots[3]} slotIndex={3} zIndex={4} />
        <BoxLayer src={BOX_LAYER_SRCS.front} zIndex={5} />
      </div>
    </div>
  );
}
