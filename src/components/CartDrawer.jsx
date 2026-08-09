/** @jsxRuntime classic */
/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
import * as React from 'react';
import {
  CART_BOX_LIST_MOTION_EASING,
  CART_BOX_LIST_MOTION_MS,
  CART_DRAWER_WIDTH,
  CART_FOOTER_ARROW_OFFSET_X,
} from '../config/appConfig.js';
import { FRUIT_ITEMS } from '../data/fruitCatalog.js';
import { BoxThumbnail } from './BoxThumbnail.jsx';

export function CartDrawer({
  cartOpen,
  cartLayoutProgress,
  setCartOpen,
  cartBoxes,
  expandedCartBoxIds,
  enteringCartBoxIds,
  removingCartBoxIds,
  editingCartBoxId,
  setEditingCartBoxId,
  cartEditSession,
  cancelCartBoxEdit,
  beginCartBoxEdit,
  updateCartBox,
  toggleCartBoxExpanded,
  setCartBoxQuantity,
  removeCartBox,
  formatYen,
  cartTotal,
}) {
  return (
  <aside
	            onPointerDown={(e) => e.stopPropagation()}
	            aria-hidden={!cartOpen}
	            style={{
	              position: 'absolute',
	              top: 0,
	              right: 0,
	              width: CART_DRAWER_WIDTH,
	              height: '100vh',
	              background: '#ffffff',
	              borderLeft: '1px solid #D9DEE3',
	              boxSizing: 'border-box',
	              zIndex: 80,
		              transform: `translateX(${((1 - cartLayoutProgress) * 100).toFixed(3)}%)`,
		              transition: 'none',
	              color: '#111111',
	              display: 'flex',
	              flexDirection: 'column',
		              pointerEvents: cartLayoutProgress > 0.98 ? 'auto' : 'none',
	            }}
	          >
	            <div
	              style={{
	                padding: '34px 28px 18px',
	                display: 'flex',
	                alignItems: 'center',
	                justifyContent: 'space-between',
	              }}
	            >
	              <div style={{ font: '400 28px/1 -apple-system, BlinkMacSystemFont, sans-serif', letterSpacing: 0 }}>
	                CART
	              </div>
		              <button
		                type="button"
		                onClick={() => setCartOpen(false)}
		                aria-label="カートを閉じる"
		                style={{
			                  width: 36,
			                  height: 36,
		                  border: 0,
		                  borderRadius: '50%',
		                  background: 'transparent',
		                  color: '#111111',
		                  display: 'grid',
		                  placeItems: 'center',
		                  padding: 0,
		                  cursor: 'pointer',
		                }}
		              >
		                <span aria-hidden="true" style={{ position: 'relative', width: 19, height: 19, display: 'block' }}>
		                  <span style={{ position: 'absolute', left: 1, top: 8.5, width: 17, height: 1.4, background: '#111111', transform: 'rotate(45deg)', transformOrigin: 'center' }} />
		                  <span style={{ position: 'absolute', left: 1, top: 8.5, width: 17, height: 1.4, background: '#111111', transform: 'rotate(-45deg)', transformOrigin: 'center' }} />
		                </span>
		              </button>
	            </div>

	            <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '0 28px' }}>
	              {cartBoxes.length === 0 ? (
	                <div
	                  data-cart-empty
	                  style={{
	                    minHeight: 180,
	                    display: 'grid',
	                    placeItems: 'center',
	                    color: '#8B9298',
	                    font: '400 12px/1.4 -apple-system, BlinkMacSystemFont, sans-serif',
	                  }}
	                >
	                  カートは空です
	                </div>
	              ) : cartBoxes.map(box => {
	                const expanded = expandedCartBoxIds.includes(box.id);
	                const entering = enteringCartBoxIds.includes(box.id);
	                const removing = removingCartBoxIds.includes(box.id);
	                const editing = editingCartBoxId === box.id;
	                const activeEditing = cartEditSession?.boxId === box.id;
	                const fruits = box.items.map(item => FRUIT_ITEMS[item.appleId]).filter(Boolean);
	                return (
	                  <section
	                    key={box.id}
	                    data-cart-box={box.id}
	                    style={{
	                      borderBottom: activeEditing ? '1px solid transparent' : '1px solid #D9DEE3',
	                      background: activeEditing ? '#C8FF00' : 'transparent',
	                      // 荧光编辑标记向侧栏两边延伸，内边距抵消后不改变内容位置。
	                      margin: activeEditing ? '-1px -12px 0' : 0,
	                      padding: activeEditing ? '1px 12px 0' : 0,
	                      borderRadius: activeEditing ? 8 : 0,
	                      position: 'relative',
	                      zIndex: activeEditing ? 1 : 'auto',
	                      overflow: 'hidden',
	                      pointerEvents: removing ? 'none' : 'auto',
	                      animation: removing
	                        ? `cartBoxSlideOut ${CART_BOX_LIST_MOTION_MS}ms ${CART_BOX_LIST_MOTION_EASING} forwards`
	                        : entering
	                          ? `cartBoxSlideIn ${CART_BOX_LIST_MOTION_MS}ms ${CART_BOX_LIST_MOTION_EASING} both`
	                          : 'none',
	                      transition: 'background-color 220ms ease, border-radius 220ms ease',
	                    }}
	                  >
	                    <div
	                      role="button"
	                      tabIndex={0}
	                      aria-expanded={expanded}
	                      onClick={() => toggleCartBoxExpanded(box.id)}
	                      onKeyDown={(e) => {
	                        if (e.key === 'Enter' || e.key === ' ') {
	                          e.preventDefault();
	                          toggleCartBoxExpanded(box.id);
	                        }
	                      }}
	                      style={{
	                        minHeight: 54,
	                        display: 'flex',
	                        alignItems: 'center',
	                        gap: 8,
	                        cursor: 'pointer',
	                        outline: 'none',
	                      }}
	                    >
	                      {editing ? (
	                        <input
	                          autoFocus
	                          aria-label="ボックス名"
	                          value={box.name}
	                          maxLength={20}
	                          onClick={(e) => e.stopPropagation()}
	                          onPointerDown={(e) => e.stopPropagation()}
	                          onChange={(e) => updateCartBox(box.id, { name: e.target.value })}
	                          onKeyDown={(e) => {
	                            e.stopPropagation();
	                            if (e.key === 'Enter') e.currentTarget.blur();
	                            if (e.key === 'Escape') {
	                              updateCartBox(box.id, { name: box.name.trim() || `BOX ${box.boxNumber}` });
	                              setEditingCartBoxId(null);
	                            }
	                          }}
	                          onBlur={() => {
	                            if (!box.name.trim()) updateCartBox(box.id, { name: `BOX ${box.boxNumber}` });
	                            setEditingCartBoxId(null);
	                          }}
	                          style={{
	                            width: 92,
	                            height: 24,
	                            padding: '0 4px',
	                            border: '1px solid #AEB5BB',
	                            borderRadius: 3,
	                            boxSizing: 'border-box',
	                            background: '#ffffff',
	                            color: '#111111',
	                            font: '400 13px/1 -apple-system, BlinkMacSystemFont, sans-serif',
	                            letterSpacing: 0,
	                          }}
	                        />
	                      ) : (
	                        <button
	                          type="button"
	                          title={box.name}
	                          onClick={(e) => {
	                            e.stopPropagation();
	                            setEditingCartBoxId(box.id);
	                          }}
	                          onPointerDown={(e) => e.stopPropagation()}
	                          style={{
	                            minWidth: 0,
	                            maxWidth: 96,
	                            padding: 0,
	                            border: 0,
	                            background: 'transparent',
	                            color: '#111111',
	                            cursor: 'text',
	                            overflow: 'hidden',
	                            textOverflow: 'ellipsis',
	                            whiteSpace: 'nowrap',
	                            textAlign: 'left',
	                            font: '400 14px/1 -apple-system, BlinkMacSystemFont, sans-serif',
	                          }}
	                        >
	                          {box.name}
	                        </button>
	                      )}
	                      <span
	                        style={{
	                          flex: '0 0 auto',
	                          minWidth: 22,
	                          height: 20,
	                          padding: '0 6px',
	                          borderRadius: 3,
	                          boxSizing: 'border-box',
	                          background: '#E7EAED',
	                          color: '#5E666D',
	                          display: 'grid',
	                          placeItems: 'center',
	                          font: '500 10px/1 -apple-system, BlinkMacSystemFont, sans-serif',
	                        }}
	                      >
	                        {box.size}
	                      </span>
	                      <button
	                        type="button"
	                        onClick={(e) => {
	                          e.stopPropagation();
	                          if (activeEditing) {
	                            cancelCartBoxEdit();
	                          } else {
	                            beginCartBoxEdit(box);
	                          }
	                        }}
	                        onPointerDown={(e) => e.stopPropagation()}
	                        aria-label={activeEditing ? `${box.name}の編集をキャンセル` : `${box.name}を編集`}
	                        style={{
	                          flex: '0 0 auto',
	                          height: 22,
	                          padding: activeEditing ? '0 7px 0 10px' : '0 10px',
	                          border: activeEditing ? 0 : '1px solid #9AA1A7',
	                          borderRadius: 999,
	                          boxSizing: 'border-box',
	                          background: activeEditing ? 'rgba(255,255,255,0.58)' : '#ffffff',
	                          color: activeEditing ? '#555555' : '#111111',
	                          cursor: 'pointer',
	                          display: 'inline-flex',
	                          alignItems: 'center',
	                          gap: activeEditing ? 5 : 0,
	                          font: '500 10px/1 -apple-system, BlinkMacSystemFont, sans-serif',
	                          letterSpacing: 0,
	                        }}
	                      >
	                        <span>{activeEditing ? '編集中' : '編集'}</span>
	                        {activeEditing ? (
	                          <span aria-hidden="true" style={{ position: 'relative', width: 9, height: 9, display: 'block', flex: '0 0 auto' }}>
	                            <span style={{ position: 'absolute', left: 0.5, top: 4, width: 8, height: 1, background: '#555555', transform: 'rotate(45deg)', transformOrigin: 'center' }} />
	                            <span style={{ position: 'absolute', left: 0.5, top: 4, width: 8, height: 1, background: '#555555', transform: 'rotate(-45deg)', transformOrigin: 'center' }} />
	                          </span>
	                        ) : null}
	                      </button>
	                      <span style={{ flex: '1 1 auto' }} />
	                      <span style={{ flex: '0 0 auto', whiteSpace: 'nowrap', font: '400 11px/1 sans-serif' }}>
	                        {box.price.toLocaleString('ja-JP')}円
	                      </span>
	                      <span
	                        onClick={(e) => e.stopPropagation()}
	                        onPointerDown={(e) => e.stopPropagation()}
	                        style={{
	                          height: 20,
	                          display: 'grid',
	                          gridTemplateColumns: '18px 28px 18px',
	                          border: '1px solid #BFC5CB',
	                          boxSizing: 'border-box',
	                        }}
	                      >
	                        <button
	                          type="button"
	                          aria-label={`${box.name}を1個減らす`}
	                          disabled={box.quantity <= 1}
	                          onClick={() => setCartBoxQuantity(box.id, box.quantity - 1)}
	                          style={{ border: 0, borderRight: '1px solid #BFC5CB', padding: 0, background: 'transparent', cursor: box.quantity > 1 ? 'pointer' : 'default', color: box.quantity > 1 ? '#111111' : '#AEB5BB' }}
	                        >
	                          −
	                        </button>
	                        <input
	                          className="cart-quantity-input"
	                          aria-label={`${box.name}の数量`}
	                          type="number"
	                          min="1"
	                          max="99"
	                          value={box.quantity}
	                          onChange={(e) => setCartBoxQuantity(box.id, e.target.value)}
	                          style={{ width: 28, minWidth: 0, border: 0, padding: 0, textAlign: 'center', background: 'transparent', color: '#111111', font: '400 11px/1 sans-serif', outline: 'none' }}
	                        />
	                        <button
	                          type="button"
	                          aria-label={`${box.name}を1個増やす`}
	                          disabled={box.quantity >= 99}
	                          onClick={() => setCartBoxQuantity(box.id, box.quantity + 1)}
	                          style={{ border: 0, borderLeft: '1px solid #BFC5CB', padding: 0, background: 'transparent', cursor: box.quantity < 99 ? 'pointer' : 'default', color: box.quantity < 99 ? '#111111' : '#AEB5BB' }}
	                        >
	                          ＋
	                        </button>
	                      </span>
	                      <button
	                        type="button"
	                        aria-label={`${box.name}を削除`}
	                        onClick={(e) => {
	                          e.stopPropagation();
	                          removeCartBox(box.id);
	                        }}
	                        style={{ width: 18, height: 22, border: 0, padding: 0, background: 'transparent', cursor: 'pointer', display: 'grid', placeItems: 'center' }}
	                      >
	                        <span style={{ position: 'relative', width: 10, height: 12, display: 'block' }}>
	                          <span style={{ position: 'absolute', left: 2, top: 3, width: 6, height: 7, border: '1px solid #737A80', borderTop: 0, boxSizing: 'border-box' }} />
	                          <span style={{ position: 'absolute', left: 1, top: 2, width: 8, height: 1, background: '#737A80' }} />
	                          <span style={{ position: 'absolute', left: 3.5, top: 0, width: 3, height: 1, background: '#737A80' }} />
	                        </span>
	                      </button>
	                    </div>

	                    <div
	                      aria-hidden={!expanded}
	                      style={{
	                        display: 'grid',
	                        gridTemplateRows: expanded ? '1fr' : '0fr',
	                        transition: 'grid-template-rows 320ms cubic-bezier(.2,.8,.2,1)',
	                      }}
	                    >
	                      <div style={{ minHeight: 0, overflow: 'hidden' }}>
	                      <div
	                        style={{
	                          display: 'grid',
	                          gridTemplateColumns: '108px 1fr',
	                          columnGap: 14,
	                          padding: '4px 0 20px',
	                          opacity: expanded ? 1 : 0,
	                          transform: `translateY(${expanded ? 0 : -6}px)`,
	                          transition: 'opacity 220ms ease, transform 320ms cubic-bezier(.2,.8,.2,1)',
	                          pointerEvents: expanded ? 'auto' : 'none',
	                        }}
	                      >
	                        <BoxThumbnail
	                          fruits={box.items}
	                          width={108}
	                          height={82}
	                          ariaLabel={`${box.name}の内容`}
	                        />
	                        <div style={{ display: 'grid', alignContent: 'start', gap: 5, paddingTop: 2 }}>
	                          {fruits.map((fruit, index) => (
	                            <div key={`${fruit.name}-${index}`} style={{ font: '400 11px/1.25 -apple-system, BlinkMacSystemFont, sans-serif', color: '#111111' }}>
	                              {fruit.name} <span style={{ color: '#777D82' }}>(200g)</span>
	                            </div>
	                          ))}
	                        </div>
	                      </div>
	                      </div>
	                    </div>
	                  </section>
	                );
	              })}
	            </div>

	            <div
	              style={{
	                borderTop: '1px solid #D9DEE3',
	                padding: '16px 28px 22px',
	              }}
	            >
	              <div style={{ display: 'flex', justifyContent: 'space-between', font: '400 15px/1 -apple-system, BlinkMacSystemFont, sans-serif' }}>
	                <span>合計</span>
	                <span data-cart-total>{formatYen(cartTotal)}</span>
	              </div>
		              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 24 }}>
		                <button
		                  type="button"
		                  onClick={() => setCartOpen(false)}
		                  aria-label="カートを閉じる"
		                  style={{
		                    width: 30,
		                    height: 22,
			                    border: 0,
		                    borderRadius: 999,
		                    background: 'transparent',
		                    color: '#111111',
		                    display: 'grid',
		                    placeItems: 'center',
		                    padding: 0,
		                    cursor: 'pointer',
		                    transform: `translateX(${CART_FOOTER_ARROW_OFFSET_X}px)`,
		                  }}
		                >
		                  <svg aria-hidden="true" width="30" height="16" viewBox="0 0 30 16" style={{ display: 'block', overflow: 'visible' }}>
		                    <path d="M0.7 8H24M18 2L24 8L18 14" fill="none" stroke="#111111" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
		                  </svg>
		                </button>
		                <button
		                  type="button"
		                  style={{
		                    border: 0,
		                    borderRadius: 999,
		                    background: '#050505',
		                    color: '#ffffff',
			                    width: 150,
			                    height: 34,
			                    font: '400 14px/1 -apple-system, BlinkMacSystemFont, sans-serif',
		                    cursor: 'pointer',
		                  }}
		                >
		                  レジへ進む
		                </button>
		              </div>
	            </div>
	          </aside>
  );
}
