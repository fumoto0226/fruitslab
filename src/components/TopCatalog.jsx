/** @jsxRuntime classic */
/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
import * as React from 'react';
import { TOP_CATALOG_SIDE_GAP } from '../config/appConfig.js';
import {
  FRUIT_ITEMS,
  CATALOG_TABS,
  TEST_BOX_ITEMS,
  CATALOG_SWITCH_STYLE,
} from '../data/fruitCatalog.js';

export function TopCatalog({
  activeCatalogCount,
  activeCatalogIndex,
  activeCatalogItems,
  activeCatalogTab,
  arrowFruitViewportWidth,
  canScrollNext,
  canScrollPrev,
  catalogMaskLeft,
  catalogSwitchOffset,
  comboHoverPanelLeft,
  comboHoverPanelWidth,
  comboReplacePrompt,
  fruitEdgePull,
  fruitSnapDuration,
  fruitStripDragging,
  fruitStripTranslate,
  fruitViewportWidth,
  isFruitCatalog,
  nextCatalogArrowLeft,
  onAppleClick,
  onApplePointerDown,
  onComboCardClick,
  onComboPointerDown,
  onFruitStripPointerDown,
  openComboIndex,
  placeComboInBox,
  prevCatalogArrowLeft,
  requestPlaceCombo,
  scrollbarThumbWidth,
  scrollbarThumbX,
  setActiveCatalogTab,
  setComboReplacePrompt,
  setFruitDragDelta,
  setFruitEdgePull,
  setFruitOffset,
  setFruitSnapDuration,
  setOpenComboIndex,
  setReplacementFruitId,
  topCatalogDrawerViewportOffset,
  turnFruitPage,
}) {
  return (
    <>
  <header
    style={{
      position: 'absolute',
      left: 0,
      top: 0,
      width: '100%',
      height: 76,
      background: '#F7F8FA',
      zIndex: 20,
      display: 'flex',
      alignItems: 'center',
      paddingLeft: 36,
      boxSizing: 'border-box',
    }}
  >
    <img
      src="img/icon/logo-yoko.svg"
      alt="果実 LABO"
      draggable={false}
      style={{ width: 178, height: 'auto', display: 'block', userSelect: 'none', WebkitUserDrag: 'none' }}
    />
  </header>

  <div
    onContextMenu={(e) => e.preventDefault()}
    style={{
      position: 'absolute',
		              left: TOP_CATALOG_SIDE_GAP,
		              top: 104,
		              transform: 'none',
	              display: 'flex',
	              alignItems: 'flex-start',
	              gap: 24,
	              zIndex: 35,
	              width: `calc(100vw - ${(topCatalogDrawerViewportOffset + TOP_CATALOG_SIDE_GAP * 2).toFixed(2)}px)`,
			              transition: 'none',
		              justifyContent: 'center',
		              userSelect: 'none',
		            }}
		          >
		            {canScrollPrev ? (
      <button
        type="button"
        onClick={() => turnFruitPage(-1)}
        onContextMenu={(e) => e.preventDefault()}
	                style={{
	                  position: 'absolute',
	                  left: prevCatalogArrowLeft,
	                  top: 22,
	                  zIndex: 2,
			                  width: 36,
			                  height: 36,
	                  padding: 0,
          border: 0,
          borderRadius: '50%',
          background: 'transparent',
          display: 'grid',
          placeItems: 'center',
          cursor: 'pointer',
          userSelect: 'none',
        }}
        aria-label="前の果物"
      >
        <img
          src="img/icon/jiantou.svg"
          draggable={false}
          alt=""
          style={{ width: 25, height: 25, display: 'block', pointerEvents: 'none', WebkitUserDrag: 'none' }}
        />
	              </button>
	            ) : (
	              null
	            )}

	            <div
	              onPointerDown={onFruitStripPointerDown}
	              style={{
	                width: fruitViewportWidth,
	                overflow: 'visible',
	                position: 'relative',
	                paddingBottom: 10, // 给水果名称和下方滚动条留出间距，避免文字压住滚动条。
	                cursor: fruitStripDragging ? 'grabbing' : 'grab',
	                touchAction: 'pan-y',
	              }}
	            >
	              <div
	                data-catalog-mask="true"
	                style={{
	                  width: arrowFruitViewportWidth,
	                  height: 94,
	                  overflow: 'hidden',
	                  position: 'relative',
	                  left: catalogMaskLeft,
	                }}
	              >
	              <div
        style={{
	                  display: 'grid',
	                  gridTemplateColumns: `repeat(${activeCatalogCount}, 92px)`,
          gap: 34,
          position: 'relative',
          left: -catalogMaskLeft,
          transform: `translateX(${fruitStripTranslate}px)`,
          transition: fruitStripDragging ? 'none' : `transform ${fruitSnapDuration}ms cubic-bezier(0.16, 1, 0.3, 1)`,
          willChange: 'transform',
          overflow: 'visible',
        }}
      >
        {isFruitCatalog ? (
          FRUIT_ITEMS.map((fruit, id) => (
	              <button
              key={fruit.name}
              type="button"
              onPointerDown={(e) => onApplePointerDown(e, id)}
              onClick={() => onAppleClick(id)}
              onContextMenu={(e) => e.preventDefault()}
              style={{
                width: 92,
                padding: 0,
                border: 0,
                background: 'transparent',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                cursor: 'grab',
                userSelect: 'none',
                touchAction: 'none',
                font: '12px/1.2 -apple-system, BlinkMacSystemFont, sans-serif',
                color: '#111',
              }}
              aria-label={fruit.name}
            >
              <img
                src={fruit.wholeSrc}
                draggable={false}
                onContextMenu={(e) => e.preventDefault()}
                style={{
                  width: 68,
                  height: 68,
                  objectFit: 'contain',
                  pointerEvents: 'none',
                  WebkitUserDrag: 'none',
                }}
                alt=""
              />
              <span style={{ marginTop: 8, whiteSpace: 'nowrap' }}>{fruit.name}</span>
            </button>
          ))
	                ) : (
	                  activeCatalogItems.map((item, index) => {
	                    const activeCombo = openComboIndex === index;
	                    return (
		                    <div
		                      key={`${activeCatalogTab}-${index}`}
		                      data-combo-ui="true"
		                      onPointerDown={(e) => onComboPointerDown(e, index)}
		                      onClick={(e) => onComboCardClick(e, index)}
		                      style={{
		                        width: 92,
		                        height: 94,
		                        position: 'relative',
	                        display: 'flex',
	                        flexDirection: 'column',
	                        alignItems: 'center',
		                        userSelect: 'none',
		                        font: '12px/1.2 -apple-system, BlinkMacSystemFont, sans-serif',
		                        color: '#111',
		                        cursor: 'pointer',
		                        zIndex: activeCombo ? 80 : 1,
		                      }}
		                    >
	                      <img
	                        src={item.imageSrc}
	                        draggable={false}
	                        onContextMenu={(e) => e.preventDefault()}
	                        style={{
	                          width: 76,
	                          height: 68,
	                          objectFit: 'contain',
	                          pointerEvents: 'none',
	                          WebkitUserDrag: 'none',
	                          position: 'relative',
	                          zIndex: 1,
	                        }}
	                        alt=""
	                      />
	                      <span
	                        style={{
	                          marginTop: 8,
	                          whiteSpace: 'nowrap',
	                          font: '12px/1.2 -apple-system, BlinkMacSystemFont, sans-serif',
	                          position: 'relative',
	                          zIndex: 1,
	                        }}
	                      >
	                        {item.name}
	                      </span>
	                    </div>
	                  );
	                  })
		                )}
		          </div>
		          </div>
		              {!isFruitCatalog && openComboIndex != null && activeCatalogItems[openComboIndex] ? (
		                <div
		                  data-combo-ui="true"
		                  onPointerDown={(e) => e.stopPropagation()}
		                  style={{
	                    position: 'absolute',
	                    left: comboHoverPanelLeft,
	                    top: -18,
	                    width: comboHoverPanelWidth,
	                    minHeight: 266,
	                    padding: '0 16px 8px',
	                    borderRadius: 22,
	                    background: '#ffffff',
	                    boxSizing: 'border-box',
	                    transform: 'translateX(-50%)',
	                    zIndex: 90,
	                    cursor: 'pointer',
	                  }}
	                >
	                  <img
		                    src={activeCatalogItems[openComboIndex].imageSrc}
		                    draggable={false}
		                    alt=""
		                    style={{
		                      width: 76,
		                      height: 68,
		                      objectFit: 'contain',
		                      display: 'block',
		                      margin: '18px auto 0',
		                      pointerEvents: 'none',
		                      WebkitUserDrag: 'none',
		                    }}
		                  />
		                  <div
		                    style={{
		                      marginTop: 8,
		                      textAlign: 'center',
		                      whiteSpace: 'nowrap',
		                      font: '12px/1.2 -apple-system, BlinkMacSystemFont, sans-serif',
	                      color: '#111111',
	                    }}
	                  >
		                    {activeCatalogItems[openComboIndex].name}
		            </div>
		                  <div
		                    style={{
		                      width: '100%',
		                      marginTop: 14,
		                      display: 'grid',
		                      gap: 6,
	                    }}
	                  >
	                    {activeCatalogItems[openComboIndex].fruits.map((fruit, fruitIndex) => (
	                      <div
	                        key={`${activeCatalogItems[openComboIndex].name}-${fruitIndex}`}
	                        style={{
	                          display: 'grid',
	                          gridTemplateColumns: '22px minmax(0, 1fr)',
	                          alignItems: 'center',
	                          columnGap: 8,
	                          minWidth: 0,
	                        }}
	                      >
	                        <img
	                          src={fruit.iconSrc}
	                          draggable={false}
	                          alt=""
	                          style={{
	                            width: 22,
	                            height: 22,
	                            objectFit: 'contain',
	                            pointerEvents: 'none',
	                            WebkitUserDrag: 'none',
	                          }}
	                        />
	                        <span
	                          style={{
	                            minWidth: 0,
	                            overflow: 'hidden',
	                            textOverflow: 'ellipsis',
	                            whiteSpace: 'nowrap',
	                            font: '12px/1.2 -apple-system, BlinkMacSystemFont, sans-serif',
	                            color: '#111111',
	                          }}
	                        >
	                          {fruit.name}
	                        </span>
	                      </div>
	                    ))}
	                  </div>
	                  <button
	                    type="button"
	                    onPointerDown={(e) => e.stopPropagation()}
	                    onClick={(e) => {
	                      e.stopPropagation();
	                      requestPlaceCombo(openComboIndex);
	                    }}
	                    style={{
	                      display: 'block',
	                      margin: '10px auto 2px',
	                      padding: '9px 16px',
	                      border: 0,
	                      borderRadius: 999,
	                      background: '#050505',
	                      color: '#ffffff',
	                      font: '600 12px/1 -apple-system, BlinkMacSystemFont, sans-serif',
	                      cursor: 'pointer',
	                      whiteSpace: 'nowrap',
	                    }}
	                  >
	                    ボックスに追加
	                  </button>
	                </div>
	              ) : null}
	              <div
        style={{
          position: 'absolute',
          left: 0,
          top: 16,
          bottom: 40,
          width: 3,
          borderRadius: 999,
          background: `rgba(0, 0, 0, ${Math.min(0.5, fruitEdgePull.left / 92)})`,
          transform: `scaleY(${0.35 + Math.min(0.5, fruitEdgePull.left / 130)})`,
          transformOrigin: 'center',
          transition: fruitStripDragging ? 'none' : 'background 240ms ease, transform 240ms ease',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          right: 0,
          top: 16,
          bottom: 40,
          width: 3,
          borderRadius: 999,
          background: `rgba(0, 0, 0, ${Math.min(0.5, fruitEdgePull.right / 92)})`,
          transform: `scaleY(${0.35 + Math.min(0.5, fruitEdgePull.right / 130)})`,
          transformOrigin: 'center',
          transition: fruitStripDragging ? 'none' : 'background 240ms ease, transform 240ms ease',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: 2,
          opacity: fruitStripDragging ? 1 : 0,
          transition: 'opacity 220ms ease',
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            width: scrollbarThumbWidth,
            height: '100%',
            borderRadius: 999,
            background: '#D2DBE4',
            transform: `translateX(${scrollbarThumbX}px)`,
            transition: fruitStripDragging ? 'none' : 'transform 220ms ease',
          }}
        />
      </div>
    </div>

    {canScrollNext ? (
      <button
        type="button"
        onClick={() => turnFruitPage(1)}
        onContextMenu={(e) => e.preventDefault()}
	                style={{
	                  position: 'absolute',
	                  left: nextCatalogArrowLeft,
	                  top: 22,
	                  zIndex: 2,
			                  width: 36,
			                  height: 36,
	                  padding: 0,
          border: 0,
          borderRadius: '50%',
          background: 'transparent',
          display: 'grid',
          placeItems: 'center',
          cursor: 'pointer',
          userSelect: 'none',
        }}
        aria-label="次の果物"
      >
        <img
          src="img/icon/jiantou.svg"
          draggable={false}
          alt=""
          style={{
            width: 25,
            height: 25,
            display: 'block',
            pointerEvents: 'none',
            WebkitUserDrag: 'none',
            transform: 'scaleX(-1)',
          }}
        />
	              </button>
	            ) : (
	              null
	            )}

	          <div
    role="tablist"
    aria-label="商品カテゴリ"
    style={{
      position: 'absolute',
      left: '50%',
      top: CATALOG_SWITCH_STYLE.top,
      width: CATALOG_SWITCH_STYLE.width,
      height: CATALOG_SWITCH_STYLE.height,
      transform: `translateX(calc(-50% + ${catalogSwitchOffset}px))`,
      transition: 'none',
      border: 0,
      borderRadius: 999,
      overflow: 'hidden',
      background: '#F7F8FA',
      zIndex: 26,
      userSelect: 'none',
    }}
  >
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        pointerEvents: 'none',
      }}
    >
      {CATALOG_TABS.map((tab, index) => (
        <div
          key={`base-${tab.id}`}
          style={{
            display: 'grid',
            placeItems: 'center',
            borderLeft: 0,
            color: '#111111',
            font: `500 ${CATALOG_SWITCH_STYLE.fontSize}px/1 -apple-system, BlinkMacSystemFont, sans-serif`,
            letterSpacing: 0,
          }}
        >
          {tab.label}
        </div>
      ))}
    </div>
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: `${100 / CATALOG_TABS.length}%`,
        background: '#111111',
        overflow: 'hidden',
        borderRadius: 999,
        transform: `translateX(${activeCatalogIndex * 100}%)`,
        transition: 'transform 320ms cubic-bezier(.2,.8,.2,1)',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          width: CATALOG_SWITCH_STYLE.width,
          height: '100%',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          transform: `translateX(${-activeCatalogIndex * (CATALOG_SWITCH_STYLE.width / CATALOG_TABS.length)}px)`,
          transition: 'transform 320ms cubic-bezier(.2,.8,.2,1)',
        }}
      >
        {CATALOG_TABS.map(tab => (
          <div
            key={`mask-${tab.id}`}
            style={{
              display: 'grid',
              placeItems: 'center',
              color: '#ffffff',
              font: `500 ${CATALOG_SWITCH_STYLE.fontSize}px/1 -apple-system, BlinkMacSystemFont, sans-serif`,
              letterSpacing: 0,
            }}
          >
            {tab.label}
          </div>
        ))}
      </div>
    </div>
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
      }}
    >
    {CATALOG_TABS.map((tab, index) => {
      const active = activeCatalogTab === tab.id;
      return (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={active}
          onClick={() => {
            if (activeCatalogTab === tab.id) return;
            setActiveCatalogTab(tab.id);
	                    setFruitSnapDuration(260);
	                    setFruitOffset(0);
	                    setFruitDragDelta(0);
	                    setFruitEdgePull({ left: 0, right: 0 });
	                    setOpenComboIndex(null);
	                    setComboReplacePrompt(null);
	                    setReplacementFruitId(null);
	                  }}
          style={{
            border: 0,
            background: 'transparent',
            color: 'transparent',
            font: `500 ${CATALOG_SWITCH_STYLE.fontSize}px/1 -apple-system, BlinkMacSystemFont, sans-serif`,
            letterSpacing: 0,
            cursor: 'pointer',
            padding: 0,
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          {tab.label}
        </button>
      );
    })}
	            </div>
	            </div>
	          </div>

	          {comboReplacePrompt ? (
	            <div
	              onPointerDown={(e) => e.stopPropagation()}
	              style={{
	                position: 'absolute',
	                left: '50%',
	                top: CATALOG_SWITCH_STYLE.top + CATALOG_SWITCH_STYLE.height + 18,
	                transform: 'translateX(-50%)',
	                width: 248,
	                padding: '18px 18px 16px',
	                borderRadius: 18,
	                background: '#ffffff',
	                boxSizing: 'border-box',
	                zIndex: 120,
	                color: '#111111',
	                font: '500 13px/1.55 -apple-system, BlinkMacSystemFont, sans-serif',
	                textAlign: 'center',
	              }}
	            >
	              <div>
	                現在のボックスの中身を
	                <br />
	                このセットに入れ替えますか？
	              </div>
	              <div
	                style={{
	                  display: 'flex',
	                  justifyContent: 'center',
	                  gap: 8,
	                  marginTop: 14,
	                }}
	              >
	                <button
	                  type="button"
	                  onClick={() => placeComboInBox(TEST_BOX_ITEMS[comboReplacePrompt.comboIndex])}
	                  style={{
	                    border: 0,
	                    borderRadius: 999,
	                    background: '#111111',
	                    color: '#ffffff',
	                    padding: '7px 14px',
	                    font: '500 12px/1 -apple-system, BlinkMacSystemFont, sans-serif',
	                    cursor: 'pointer',
	                  }}
	                >
	                  入れ替える
	                </button>
	                <button
	                  type="button"
	                  onClick={() => setComboReplacePrompt(null)}
	                  style={{
	                    border: 0,
	                    borderRadius: 999,
	                    background: '#F7F8FA',
	                    color: '#111111',
	                    padding: '7px 14px',
	                    font: '500 12px/1 -apple-system, BlinkMacSystemFont, sans-serif',
	                    cursor: 'pointer',
	                  }}
	                >
	                  キャンセル
	                </button>
	              </div>
	            </div>
	          ) : null}
    </>
  );
}
