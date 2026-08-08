import React from 'react';
import {
  CART_COUNT_MOTION_MS,
  CART_TRANSFER_DURATION_MS,
  PAGE_CART_COUNT_STYLE,
  PAGE_CART_ICON_SIZE,
  PAGE_CART_LAYOUT,
  PAGE_CART_POSITION,
  PAGE_CART_TEXT_STYLE,
  SIZE_SELECTOR_CARD_SIZE,
  SIZE_SELECTOR_POSITION,
  SIZE_SELECTOR_TEXT_STYLE,
} from '../config/appConfig.js';
import { CATALOG_SWITCH_STYLE, FRUIT_ITEMS } from '../data/fruitCatalog.js';

export function PageOverlayControls({
  activeCartEditBox,
  addBoxToCart,
  cancelCartBoxEdit,
  cartBoxQuantityTotal,
  cartContentOffset,
  cartCountMotion,
  cartTransfer,
  dragClone,
  openCartDrawer,
  pageCartRef,
  requestedSize,
  startSizeChange,
}) {
  return (
    <>
      {activeCartEditBox ? (
        <div
          data-cart-edit-banner
          onPointerDown={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            left: `calc(50% - ${cartContentOffset}px)`,
            // 编辑提示放在分类按钮与 3D 盒子之间，避免遮住顶部水果名称。
            top: CATALOG_SWITCH_STYLE.top + 155,
            transform: 'translateX(-50%)',
            minWidth: 300,
            height: 36,
            padding: '0 5px 0 13px',
            borderRadius: 6,
            background: '#C8FF00',
            color: '#0A0A0A',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 14,
            boxSizing: 'border-box',
            zIndex: 70,
            font: '600 12px/1 -apple-system, BlinkMacSystemFont, sans-serif',
            letterSpacing: 0,
          }}
        >
          <span>編集中：{activeCartEditBox.name}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <button
              type="button"
              onClick={cancelCartBoxEdit}
              style={{
                height: 25,
                padding: '0 11px',
                border: '1px solid #111111',
                borderRadius: 999,
                background: '#ffffff',
                color: '#111111',
                cursor: 'pointer',
                font: '500 10.5px/1 -apple-system, BlinkMacSystemFont, sans-serif',
              }}
            >
              キャンセル
            </button>
            <button
              type="button"
              onClick={addBoxToCart}
              style={{
                height: 25,
                padding: '0 13px',
                border: 0,
                borderRadius: 999,
                background: '#111111',
                color: '#ffffff',
                cursor: 'pointer',
                font: '500 10.5px/1 -apple-system, BlinkMacSystemFont, sans-serif',
              }}
            >
              完了
            </button>
          </span>
        </div>
      ) : null}

      {cartTransfer ? (
        <div
          data-cart-transfer
          aria-hidden="true"
          style={{
            position: 'fixed',
            left: cartTransfer.startX,
            top: cartTransfer.startY,
            width: 0,
            height: 0,
            pointerEvents: 'none',
            zIndex: 120,
            '--cart-flight-x': `${cartTransfer.deltaX}px`,
            animation: `cartTransferX ${CART_TRANSFER_DURATION_MS}ms cubic-bezier(.34,.02,.28,1) both`,
            willChange: 'transform',
          }}
        >
          <div
            style={{
              width: 0,
              height: 0,
              '--cart-flight-y': `${cartTransfer.deltaY}px`,
              '--cart-flight-arc-y': `${cartTransfer.arcY}px`,
              animation: `cartTransferY ${CART_TRANSFER_DURATION_MS}ms cubic-bezier(.34,.02,.28,1) both`,
              willChange: 'transform',
            }}
          >
            <div
              style={{
                position: 'relative',
                width: 144,
                height: 102,
                padding: 7,
                boxSizing: 'border-box',
                border: '4px solid rgba(235,244,249,.96)',
                borderRadius: 12,
                background: 'rgba(239,246,250,.92)',
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gridTemplateRows: 'repeat(2, 1fr)',
                boxShadow: '0 7px 20px rgba(40,55,65,.12)',
                overflow: 'hidden',
                animation: `cartTransferPack ${CART_TRANSFER_DURATION_MS}ms cubic-bezier(.2,.8,.2,1) both`,
                willChange: 'transform, opacity',
              }}
            >
              {[0, 1, 2, 3].map(index => {
                const fruit = cartTransfer.fruits[index];
                return (
                  <div
                    key={index}
                    style={{
                      display: 'grid',
                      placeItems: 'center',
                      borderRight: index % 2 === 0 ? '2px solid rgba(255,255,255,.92)' : 0,
                      borderBottom: index < 2 ? '2px solid rgba(255,255,255,.92)' : 0,
                    }}
                  >
                    {fruit ? (
                      <img
                        src={fruit.wholeSrc}
                        alt=""
                        draggable={false}
                        style={{ width: 43, height: 43, objectFit: 'contain', WebkitUserDrag: 'none' }}
                      />
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}

      {dragClone && (
            <img
              src={FRUIT_ITEMS[dragClone.appleId].wholeSrc}
              draggable={false}
              style={{
                position: 'absolute',
                left: dragClone.x,
                top: dragClone.y,
                width: 68,
                height: 68,
                objectFit: 'contain',
                pointerEvents: 'none',
                userSelect: 'none',
                WebkitUserDrag: 'none',
                zIndex: 50,
              }}
              alt=""
            />
          )}

          <button
            type="button"
            aria-label={`サイズ ${requestedSize.size} ${requestedSize.weight}`}
            onClick={startSizeChange}
            style={{
              position: 'absolute',
              left: SIZE_SELECTOR_POSITION.left,
              bottom: SIZE_SELECTOR_POSITION.bottom,
              padding: 0,
              border: 0,
              background: 'transparent',
              color: '#000000',
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: SIZE_SELECTOR_TEXT_STYLE.gap,
              cursor: 'pointer',
              zIndex: 40,
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <span
              style={{
                font: `400 ${SIZE_SELECTOR_TEXT_STYLE.labelFont}px/1 -apple-system, BlinkMacSystemFont, sans-serif`,
                letterSpacing: 0,
                transform: `translateY(${PAGE_CART_TEXT_STYLE.textOffsetY}px)`,
              }}
            >
              (size)
            </span>
            <span
              style={{
                width: SIZE_SELECTOR_CARD_SIZE.width,
                height: SIZE_SELECTOR_CARD_SIZE.height,
                border: '1.4px solid #000000',
                borderRadius: 16,
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'transparent',
              }}
            >
              <span
                style={{
                  font: `600 ${SIZE_SELECTOR_TEXT_STYLE.sizeFont}px/0.82 -apple-system, BlinkMacSystemFont, sans-serif`,
                  letterSpacing: 0,
                }}
              >
                {requestedSize.size}
              </span>
              <span
                style={{
                  marginTop: SIZE_SELECTOR_TEXT_STYLE.weightGap,
                  font: `400 ${SIZE_SELECTOR_TEXT_STYLE.weightFont}px/1 -apple-system, BlinkMacSystemFont, sans-serif`,
                  letterSpacing: 0,
                }}
              >
                {requestedSize.weight}
              </span>
            </span>
          </button>

      <button
        ref={pageCartRef}
        type="button"
        aria-label="カート"
        onClick={openCartDrawer}
            style={{
              position: 'absolute',
              right: PAGE_CART_POSITION.right,
              bottom: PAGE_CART_POSITION.bottom,
              padding: 0,
              border: 0,
              background: 'transparent',
              display: 'flex',
              alignItems: 'center',
              gap: PAGE_CART_LAYOUT.iconTextGap,
              cursor: 'pointer',
              zIndex: 40,
              boxShadow: 'none',
              color: '#000000',
              font: `400 ${PAGE_CART_TEXT_STYLE.fontSize}px/1 -apple-system, BlinkMacSystemFont, sans-serif`,
              letterSpacing: 0,
              WebkitTapHighlightColor: 'transparent',
          animation: cartCountMotion
            ? `cartArrivalPulse ${CART_COUNT_MOTION_MS}ms cubic-bezier(.2,.8,.2,1)`
            : 'none',
            }}
          >
            <img
              src="img/icon/cart.svg"
              draggable={false}
              alt=""
              style={{
                width: PAGE_CART_ICON_SIZE.width,
                height: PAGE_CART_ICON_SIZE.height,
                display: 'block',
                flex: `0 0 ${PAGE_CART_ICON_SIZE.width}px`,
                pointerEvents: 'none',
                WebkitUserDrag: 'none',
              }}
            />
            <span
              style={{
                display: 'block',
                position: 'relative',
                transform: `translateY(${PAGE_CART_TEXT_STYLE.textOffsetY}px)`,
              }}
            >
              (cart)
              <span
            data-page-cart-count
            aria-label={`カート内のボックス数 ${cartBoxQuantityTotal}`}
                style={{
                  position: 'absolute',
                  right: PAGE_CART_COUNT_STYLE.right,
                  top: PAGE_CART_COUNT_STYLE.top,
              width: 30,
              height: PAGE_CART_COUNT_STYLE.fontSize,
              overflow: 'hidden',
                  font: `400 ${PAGE_CART_COUNT_STYLE.fontSize}px/1 -apple-system, BlinkMacSystemFont, sans-serif`,
                  color: '#000000',
                  pointerEvents: 'none',
                }}
              >
            {cartCountMotion ? (
              <>
                <span
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    animation: `cartCountOldUp ${CART_COUNT_MOTION_MS}ms cubic-bezier(.2,.8,.2,1) both`,
                  }}
                >
                  {cartCountMotion.from}
                </span>
                <span
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    animation: `cartCountNewUp ${CART_COUNT_MOTION_MS}ms cubic-bezier(.2,.8,.2,1) both`,
                  }}
                >
                  {cartCountMotion.to}
                </span>
              </>
            ) : cartBoxQuantityTotal}
          </span>
        </span>
      </button>
    </>
  );
}
