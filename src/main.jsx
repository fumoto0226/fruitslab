    /** @jsxRuntime classic */
    /** @jsx React.createElement */
    /** @jsxFrag React.Fragment */
    import * as React from 'react';
    const { useMemo, useState, useEffect, useRef } = React;
    import { createRoot } from 'react-dom/client';
    import * as THREE from 'three';
    import {
      BOX_NOTICE_LABEL_DEFAULT,
      CART_BOX_LIST_MOTION_MS,
      CART_COUNT_MOTION_MS,
      CART_DRAWER_WIDTH,
      CART_LAYOUT_DURATION_MS,
      CART_TRANSFER_CLEAR_DELAY_MS,
      CART_TRANSFER_DURATION_MS,
      CELL_UI_OFFSETS_BY_SIZE,
      PAGE_CART_ICON_SIZE,
      PAGE_CART_POSITION,
      SCENE_SETTINGS,
      SIZE_CHANGE_SHAKE,
      SIZE_CHANGE_SPIN,
      SIZE_OPTIONS,
      TOP_CATALOG_ARROW_GAP,
      TOP_CATALOG_CLOSE_DURATION_MS,
      TOP_CATALOG_OPEN_DURATION_MS,
      TOP_CATALOG_SIDE_GAP,
      createBoxLayout,
    } from './config/appConfig.js';
    import {
      CATALOG_TABS,
      FRUIT_ITEMS,
      FRUITS_PER_PAGE,
      TEST_BOX_ITEMS,
    } from './data/fruitCatalog.js';
    import { SIZE_SPIN_FRUIT_ANIMATION } from './utils/fruitAnimation.js';
    import { BoxScene } from './components/BoxScene.jsx';
    import { CartDrawer } from './components/CartDrawer.jsx';
    import { TopCatalog } from './components/TopCatalog.jsx';
    import { PageOverlayControls } from './components/PageOverlayControls.jsx';

    /* ══════════════════════════════════════════════
       App：页面和 3D 盒子的主要设置
       ══════════════════════════════════════════════ */

    function App() {
      const {
        rotationX,
        transmission,
        roughness,
        ior,
        glassColor,
        attenuationColor,
        envMapIntensity,
        lightIntensity,
        rotateLeftRightLimit,
        rotateUpLimit,
        rotateDownLimit,
        defaultPolarAngle,
      } = SCENE_SETTINGS;

      const [placedFruits, setPlacedFruits] = useState([]);
      const [dragClone, setDragClone] = useState(null);
      const [hoveredCell, setHoveredCell] = useState(null);
      const [modelDragging, setModelDragging] = useState(false);
      const [replacementFruitId, setReplacementFruitId] = useState(null);
	      const [replacementMotionKey, setReplacementMotionKey] = useState(0);
	      const [selectedSizeIndex, setSelectedSizeIndex] = useState(0);
	      const [requestedSizeIndex, setRequestedSizeIndex] = useState(0);
	      const [sizeSpinAngle, setSizeSpinAngle] = useState(0);
	      const [displayedScreenShift, setDisplayedScreenShift] = useState(SIZE_OPTIONS[0].screenShift);
	      const [isSizeSpinning, setIsSizeSpinning] = useState(false);
	      const [isSizeShaking, setIsSizeShaking] = useState(false);
	      const [sizeShakeOffsetY, setSizeShakeOffsetY] = useState(0);
	      const [sizeShakeFruitKey, setSizeShakeFruitKey] = useState(0);
	      const [sizeSpinFruitPhase, setSizeSpinFruitPhase] = useState('visible');
	      const [activeCatalogTab, setActiveCatalogTab] = useState('fruit');
	      const [openComboIndex, setOpenComboIndex] = useState(null);
	      const [comboReplacePrompt, setComboReplacePrompt] = useState(null);
	      const [comboReplacePromptSeen, setComboReplacePromptSeen] = useState(false);
	      const [cartOpen, setCartOpen] = useState(false);
	      const [cartBoxes, setCartBoxes] = useState([]);
	      const [cartTransfer, setCartTransfer] = useState(null);
	      const [cartCountMotion, setCartCountMotion] = useState(null);
	      const [expandedCartBoxIds, setExpandedCartBoxIds] = useState([]);
	      const [enteringCartBoxIds, setEnteringCartBoxIds] = useState([]);
	      const [removingCartBoxIds, setRemovingCartBoxIds] = useState([]);
	      const [editingCartBoxId, setEditingCartBoxId] = useState(null);
	      const [cartEditSession, setCartEditSession] = useState(null);
	      const [cartLayoutProgress, setCartLayoutProgress] = useState(0);
	      const [topCatalogLayoutProgress, setTopCatalogLayoutProgress] = useState(0);
      const selectedSize = SIZE_OPTIONS[selectedSizeIndex];
      const requestedSize = SIZE_OPTIONS[requestedSizeIndex];
      const sizeTransitionActive = isSizeSpinning || isSizeShaking;
      // 购物车侧栏打开时：盒子和“单品/人气セット/履歴”整体往左让位。数值越小，盒子越靠右。
      const cartContentOffset = CART_DRAWER_WIDTH * 0.28 * cartLayoutProgress;
      const topCatalogDrawerViewportOffset = CART_DRAWER_WIDTH * topCatalogLayoutProgress;
      // 分类按钮位于动画较慢的顶部列表容器内：补回父容器位移后，仍按盒子的 420ms 进度移动。
      const catalogSwitchOffset = topCatalogDrawerViewportOffset / 2 - cartContentOffset;
      const selectedBoxLayout = useMemo(
        () => createBoxLayout(selectedSize.boxWidth, selectedSize.boxDepth),
        [selectedSize.boxWidth, selectedSize.boxDepth]
      );
      const selectedNoticeLabel = selectedSize.noticeLabel ?? BOX_NOTICE_LABEL_DEFAULT;
      const selectedCellUiOffsets = CELL_UI_OFFSETS_BY_SIZE[selectedSize.size] ?? CELL_UI_OFFSETS_BY_SIZE.M;
      const activeCatalogIndex = Math.max(0, CATALOG_TABS.findIndex(tab => tab.id === activeCatalogTab));
      const isFruitCatalog = activeCatalogTab === 'fruit';
      const activeCatalogItems = isFruitCatalog ? FRUIT_ITEMS : TEST_BOX_ITEMS;
      const activeCatalogCount = activeCatalogItems.length;
      const fruitSlotWidth = 126; // 顶部水果栏单格间距：水果宽 92 + 空隙 34；也用于计算滚动位置。
      const getFruitSlots = () => {
        const targetDrawerWidth = cartOpen ? CART_DRAWER_WIDTH : 0;
        // 顶部列表可显示数量：按当前真正可见区域计算。108 = 左右箭头 30*2 + 两侧 gap 24*2。
        const visibleCatalogWidth = Math.min(1580, window.innerWidth - targetDrawerWidth - TOP_CATALOG_SIDE_GAP * 2);
        const availableFruitWidth = Math.max(0, visibleCatalogWidth - 108);
        return Math.max(3, Math.min(FRUITS_PER_PAGE, Math.floor((availableFruitWidth + 34) / fruitSlotWidth)));
      };
      const [fruitSlots, setFruitSlots] = useState(getFruitSlots);
      const [fruitOffset, setFruitOffset] = useState(0);
      const [fruitDragDelta, setFruitDragDelta] = useState(0);
      const [fruitStripDragging, setFruitStripDragging] = useState(false);
      const [fruitSnapDuration, setFruitSnapDuration] = useState(420);
      const [fruitEdgePull, setFruitEdgePull] = useState({ left: 0, right: 0 });
      const maxFruitOffset = Math.max(0, activeCatalogCount - fruitSlots);
      // 顶部列表视觉宽度：跟购物车侧栏动画进度连续变化，避免 fruitSlots 变更时先闪一下。
      const animatedCatalogWidth = Math.min(1580, window.innerWidth - topCatalogDrawerViewportOffset - TOP_CATALOG_SIDE_GAP * 2);
      const fruitViewportWidth = Math.max(
        3 * fruitSlotWidth - 34,
        Math.min(FRUITS_PER_PAGE * fruitSlotWidth - 34, animatedCatalogWidth - 108)
      );
      // 翻页箭头使用购物车的 420ms 进度，不跟随顶部列表较慢的宽度动画。
      const arrowCatalogContainerWidth = window.innerWidth
        - CART_DRAWER_WIDTH * cartLayoutProgress
        - TOP_CATALOG_SIDE_GAP * 2;
      const arrowAnimatedCatalogWidth = Math.min(1580, arrowCatalogContainerWidth);
      const arrowFruitViewportWidth = Math.max(
        3 * fruitSlotWidth - 34,
        Math.min(FRUITS_PER_PAGE * fruitSlotWidth - 34, arrowAnimatedCatalogWidth - 108)
      );
      const prevCatalogArrowLeft = arrowCatalogContainerWidth / 2
        - arrowFruitViewportWidth / 2
        - 36
        - TOP_CATALOG_ARROW_GAP;
      const nextCatalogArrowLeft = arrowCatalogContainerWidth / 2
        + arrowFruitViewportWidth / 2
        + TOP_CATALOG_ARROW_GAP;
	      const topCatalogContainerWidth = window.innerWidth
	        - topCatalogDrawerViewportOffset
	        - TOP_CATALOG_SIDE_GAP * 2;
	      // 遮罩跟随购物车进度，但内部水果仍保持顶部列表自己的移动轨迹。
	      const catalogMaskLeft = arrowCatalogContainerWidth / 2
	        - arrowFruitViewportWidth / 2
	        - (topCatalogContainerWidth / 2 - fruitViewportWidth / 2);
	      const fruitStripTranslate = -fruitOffset * fruitSlotWidth + fruitDragDelta;
	      const comboHoverPanelWidth = 154;
	      const comboHoverPanelLeft = openComboIndex == null
	        ? 0
	        : openComboIndex * fruitSlotWidth + fruitStripTranslate + 46;
	      const liveFruitOffset = Math.max(0, Math.min(maxFruitOffset, -fruitStripTranslate / fruitSlotWidth));
	      const canScrollPrev = liveFruitOffset > 0.03;
	      const canScrollNext = liveFruitOffset < maxFruitOffset - 0.03;
      const scrollbarReferenceCount = FRUIT_ITEMS.length; // 顶部滚动条固定按“单品”数量计算，组合/履历页也保持同样的长度手感。
      const scrollbarReferenceMaxOffset = Math.max(0, scrollbarReferenceCount - fruitSlots);
      const fruitContentWidth = scrollbarReferenceCount * fruitSlotWidth - 34;
      const scrollbarTrackWidth = fruitViewportWidth;
      const scrollbarThumbWidth = scrollbarReferenceMaxOffset > 0
        ? Math.max(38, scrollbarTrackWidth * fruitViewportWidth / fruitContentWidth)
        : scrollbarTrackWidth;
      const scrollbarThumbX = scrollbarReferenceMaxOffset > 0
        ? (scrollbarTrackWidth - scrollbarThumbWidth) * (liveFruitOffset / scrollbarReferenceMaxOffset)
        : 0;

      // Reference-style screen bounds and quadrant center for the current box transform
      const boxScreenRef = useRef(null);
      const groupRef     = useRef(null);
      const pageCartRef  = useRef(null);
      const cartTransferTimersRef = useRef([]);
      const nextPlacedIdRef = useRef(0);
      const nextPlacementMotionRef = useRef(0);
      const draggingAppleIdRef = useRef(null);
      const dragOffsetRef = useRef({ x: 0, y: 0 });
      const dragStartRef = useRef({ x: 0, y: 0 });
      const didDragRef = useRef(false);
      const fruitStripDragRef = useRef({ active: false, startX: 0, startOffset: 0 });
      const fruitDragDeltaRef = useRef(0);
      const fruitVelocityRef = useRef({ x: 0, lastDelta: 0, lastTime: 0 });
      const fruitOffsetRef = useRef(fruitOffset);
      const maxFruitOffsetRef = useRef(maxFruitOffset);
      const pendingAppleGestureRef = useRef(null);
      const pendingComboGestureRef = useRef(null);
      const requestedSizeIndexRef = useRef(requestedSizeIndex);
      const selectedSizeIndexRef = useRef(selectedSizeIndex);
      const displayedScreenShiftRef = useRef(displayedScreenShift);
      const sizeSpinRunRef = useRef({ running: false, rafId: 0 });
      const sizeShakeRunRef = useRef({ running: false, rafId: 0 });
      const sizeSpinFruitTimersRef = useRef([]);
      const cartLayoutRafRef = useRef(0);
      const cartLayoutProgressRef = useRef(cartLayoutProgress);
      const topCatalogLayoutRafRef = useRef(0);
      const topCatalogLayoutProgressRef = useRef(topCatalogLayoutProgress);
      fruitOffsetRef.current = fruitOffset;
      maxFruitOffsetRef.current = maxFruitOffset;
      requestedSizeIndexRef.current = requestedSizeIndex;
      selectedSizeIndexRef.current = selectedSizeIndex;
      displayedScreenShiftRef.current = displayedScreenShift;
      cartLayoutProgressRef.current = cartLayoutProgress;
      topCatalogLayoutProgressRef.current = topCatalogLayoutProgress;

      const placeAppleInCell = (prev, appleId, cell) => {
        const motionKey = nextPlacementMotionRef.current++;
        const existingIndex = prev.findIndex(a => a.cell === cell);
        if (existingIndex >= 0) {
          return prev.map(a => a.cell === cell ? { ...a, appleId, motionKey } : a);
        }
        return [...prev, { id: nextPlacedIdRef.current++, appleId, cell, motionKey }];
      };

      const beginFruitStripDrag = (startX, startOffset, timeStamp) => {
        fruitStripDragRef.current = { active: true, startX, startOffset };
        fruitDragDeltaRef.current = 0;
        fruitVelocityRef.current = { x: 0, lastDelta: 0, lastTime: timeStamp || performance.now() };
        setFruitStripDragging(true);
        setFruitSnapDuration(0);
        setFruitDragDelta(0);
        setFruitEdgePull({ left: 0, right: 0 });
      };

      const updateFruitStripDrag = (e) => {
        const drag = fruitStripDragRef.current;
        if (!drag.active) return;

        const rawTranslate = -drag.startOffset * fruitSlotWidth + (e.clientX - drag.startX);
        const minTranslate = -maxFruitOffsetRef.current * fruitSlotWidth;
        const edgePullLimit = 46; // 到头后还能被拉出的最大距离；数值越大，边界弹性越明显。
        const edgeResistance = 0.24; // 到头后的阻尼：数值越小，越难继续拉动。
        let resistedTranslate = rawTranslate;
        if (rawTranslate > 0) {
          resistedTranslate = Math.min(edgePullLimit, rawTranslate * edgeResistance);
        } else if (rawTranslate < minTranslate) {
          resistedTranslate = minTranslate - Math.min(edgePullLimit, (minTranslate - rawTranslate) * edgeResistance);
        }
        const nextDelta = resistedTranslate + drag.startOffset * fruitSlotWidth;
        setFruitEdgePull({
          left: Math.max(0, resistedTranslate),
          right: Math.max(0, minTranslate - resistedTranslate),
        });
        const now = e.timeStamp || performance.now();
        const velocity = fruitVelocityRef.current;
        const dt = Math.max(1, now - velocity.lastTime);
        const instantVelocity = (nextDelta - velocity.lastDelta) / dt;
        fruitVelocityRef.current = {
          x: velocity.x * 0.35 + instantVelocity * 0.65,
          lastDelta: nextDelta,
          lastTime: now,
        };
        fruitDragDeltaRef.current = nextDelta;
        setFruitDragDelta(nextDelta);
      };

      const finishFruitStripDrag = (e) => {
        const drag = fruitStripDragRef.current;
        if (!drag.active) return;

        const velocity = fruitVelocityRef.current;
        const releaseTime = e?.timeStamp || performance.now();
        const releaseVelocity = releaseTime - velocity.lastTime < 140 ? velocity.x : 0;
        const currentDelta = fruitDragDeltaRef.current;
        const currentOffset = Math.max(
          0,
          Math.min(maxFruitOffsetRef.current, drag.startOffset - currentDelta / fruitSlotWidth)
        );
        const momentumDelta = releaseVelocity * 240; // 惯性距离：数值越大，快速松手后继续滑动越远。
        const maxMomentumSlots = 3; // 只限制松手后额外滑行的格数，不限制用户已经手动拖过的距离。
        const momentumSlots = Math.max(
          -maxMomentumSlots,
          Math.min(maxMomentumSlots, -momentumDelta / fruitSlotWidth)
        );
        const freeOffset = Math.max(
          0,
          Math.min(maxFruitOffsetRef.current, currentOffset + momentumSlots)
        );
        const nearestSlot = Math.round(freeOffset);
        const weakSnapPx = 4; // 极弱吸附：只有已经很接近格子中心时才对齐；设为 0 可完全关闭。
        const shouldWeakSnap = Math.abs(nearestSlot - freeOffset) * fruitSlotWidth <= weakSnapPx;
        const finalOffset = shouldWeakSnap
          ? Math.max(0, Math.min(maxFruitOffsetRef.current, nearestSlot))
          : freeOffset;
        const movedSlots = Math.abs(finalOffset - currentOffset);
        setFruitSnapDuration(Math.min(520, 260 + movedSlots * 42));
        fruitStripDragRef.current = { active: false, startX: 0, startOffset: finalOffset };
        fruitDragDeltaRef.current = 0;
        fruitVelocityRef.current = { x: 0, lastDelta: 0, lastTime: 0 };
        setFruitOffset(finalOffset);
        setFruitDragDelta(0);
        setFruitStripDragging(false);
        setFruitEdgePull({ left: 0, right: 0 });
      };

      // 顶部水果先判断拖拽方向：横向拖动滚动列表，纵向拖动才生成水果分身。
      const onApplePointerDown = (e, appleId) => {
        const rect = e.currentTarget.getBoundingClientRect();
        pendingAppleGestureRef.current = {
          active: true,
          appleId,
          rect,
          startX: e.clientX,
          startY: e.clientY,
          startOffset: fruitOffsetRef.current,
          startTime: e.timeStamp || performance.now(),
        };
        didDragRef.current = false;
        e.currentTarget.setPointerCapture(e.pointerId);
        e.stopPropagation();
      };

      // 组合盒图片只负责横向滚动：短按仍然打开详情，移动后复用水果栏的惯性拖动。
      const onComboPointerDown = (e, comboIndex) => {
        pendingComboGestureRef.current = {
          active: true,
          comboIndex,
          startX: e.clientX,
          startY: e.clientY,
          startOffset: fruitOffsetRef.current,
          startTime: e.timeStamp || performance.now(),
        };
        didDragRef.current = false;
        e.currentTarget.setPointerCapture(e.pointerId);
        e.stopPropagation();
      };

      const onWindowMove = (e) => {
        const pendingComboGesture = pendingComboGestureRef.current;
        if (pendingComboGesture?.active) {
          const dx = e.clientX - pendingComboGesture.startX;
          const dy = e.clientY - pendingComboGesture.startY;
          if (Math.hypot(dx, dy) < 6) return;

          didDragRef.current = true;
          pendingComboGestureRef.current = null;
          setOpenComboIndex(null);
          setComboReplacePrompt(null);
          beginFruitStripDrag(
            pendingComboGesture.startX,
            pendingComboGesture.startOffset,
            pendingComboGesture.startTime
          );
          updateFruitStripDrag(e);
          return;
        }

        const pendingGesture = pendingAppleGestureRef.current;
        if (pendingGesture?.active) {
          const dx = e.clientX - pendingGesture.startX;
          const dy = e.clientY - pendingGesture.startY;
          if (Math.hypot(dx, dy) < 6) return;

          didDragRef.current = true;
          pendingAppleGestureRef.current = null;
          // 方向判定：只有接近水平的约 20 度范围算滚动列表，其余斜向下更容易按拖水果处理。
          if (Math.abs(dx) > Math.abs(dy) * 2.75) {
            beginFruitStripDrag(pendingGesture.startX, pendingGesture.startOffset, pendingGesture.startTime);
            updateFruitStripDrag(e);
            return;
          }

          draggingAppleIdRef.current = pendingGesture.appleId;
          setReplacementFruitId(null);
          dragOffsetRef.current = {
            x: pendingGesture.startX - pendingGesture.rect.left,
            y: pendingGesture.startY - pendingGesture.rect.top,
          };
          dragStartRef.current = { x: pendingGesture.startX, y: pendingGesture.startY };
          setDragClone({
            appleId: pendingGesture.appleId,
            x: pendingGesture.rect.left,
            y: pendingGesture.rect.top,
          });
        }

        if (fruitStripDragRef.current.active) {
          updateFruitStripDrag(e);
          return;
        }

        const appleId = draggingAppleIdRef.current;
        if (appleId == null) return;
        const nx = e.clientX - dragOffsetRef.current.x;
        const ny = e.clientY - dragOffsetRef.current.y;
        const dx = e.clientX - dragStartRef.current.x;
        const dy = e.clientY - dragStartRef.current.y;
        if (Math.hypot(dx, dy) > 6) didDragRef.current = true;
        setDragClone(prev => prev ? { ...prev, x: nx, y: ny } : prev);
      };
      const onWindowUp = (e) => {
        if (pendingComboGestureRef.current?.active) {
          pendingComboGestureRef.current = null;
        }

        if (pendingAppleGestureRef.current?.active) {
          pendingAppleGestureRef.current = null;
        }

        if (fruitStripDragRef.current.active) {
          finishFruitStripDrag(e);
          return;
        }

        const appleId = draggingAppleIdRef.current;
        draggingAppleIdRef.current = null;
        setDragClone(null);
        if (appleId == null) return;
        setPlacedFruits(prev => {
          const box = boxScreenRef.current;
          if (!box) return prev;

          // motion/react's PanInfo uses the release pointer, not the dragged
          // element center. Matching that detail makes edge drops feel precise.
          const dropX = e.clientX;
          const dropY = e.clientY;
          const padding = 36;
          if (
            dropX < box.minX - padding || dropX > box.maxX + padding ||
            dropY < box.minY - padding || dropY > box.maxY + padding
          ) return prev;

          const isRight = dropX > box.centerX;
          const isBottom = dropY > box.centerY;
          let compIdx = 0;
          if (isRight && !isBottom) compIdx = 1;
          if (!isRight && isBottom) compIdx = 2;
          if (isRight && isBottom) compIdx = 3;
          return placeAppleInCell(prev, appleId, compIdx);
        });
      };

      // 单击水果时，按 左上 -> 右上 -> 左下 -> 右下 的顺序放进第一个空格。
	      const onAppleClick = (appleId) => {
	        if (didDragRef.current) {
	          didDragRef.current = false;
	          return;
        }
        const firstEmptyCell = [0, 1, 2, 3].find(cell => !placedFruits.some(a => a.cell === cell));
        if (firstEmptyCell == null) {
          setReplacementFruitId(appleId);
          setReplacementMotionKey(key => key + 1);
          setHoveredCell(null);
          return;
        }
        setPlacedFruits(prev => {
          const nextEmptyCell = [0, 1, 2, 3].find(cell => !prev.some(a => a.cell === cell));
          return nextEmptyCell == null ? prev : placeAppleInCell(prev, appleId, nextEmptyCell);
	        });
	      };

	      const placeComboInBox = (comboItem) => {
	        const comboCells = comboItem.fruits.slice(0, 4).map((fruit, cell) => ({
	          id: nextPlacedIdRef.current++,
	          appleId: fruit.appleId,
	          cell,
	          motionKey: nextPlacementMotionRef.current++,
	        }));
	        setPlacedFruits(comboCells);
	        setReplacementFruitId(null);
	        setHoveredCell(null);
	        setComboReplacePrompt(null);
	        setOpenComboIndex(null);
	      };

	      const requestPlaceCombo = (comboIndex) => {
	        const comboItem = TEST_BOX_ITEMS[comboIndex];
	        if (!comboItem) return;
	        if (!comboReplacePromptSeen && placedFruits.length > 0) {
	          setComboReplacePrompt({ comboIndex });
	          setComboReplacePromptSeen(true);
	          return;
	        }
	        placeComboInBox(comboItem);
	      };

	      const onComboCardClick = (e, comboIndex) => {
	        e.stopPropagation();
	        if (fruitStripDragging || didDragRef.current) {
	          didDragRef.current = false;
	          return;
	        }
	        if (openComboIndex === comboIndex) {
	          setOpenComboIndex(null);
	          setComboReplacePrompt(null);
	          return;
	        }
	        setOpenComboIndex(comboIndex);
	        setReplacementFruitId(null);
	      };

      useEffect(() => {
        window.addEventListener('pointermove', onWindowMove);
        window.addEventListener('pointerup', onWindowUp);
        window.addEventListener('pointercancel', onWindowUp);
        return () => {
          window.removeEventListener('pointermove', onWindowMove);
          window.removeEventListener('pointerup', onWindowUp);
          window.removeEventListener('pointercancel', onWindowUp);
        };
      }, []);

	      useEffect(() => () => {
	        cartTransferTimersRef.current.forEach(clearTimeout);
	        cartTransferTimersRef.current = [];
	      }, []);

      useEffect(() => {
        const onResize = () => setFruitSlots(getFruitSlots());
        onResize();
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
      }, [cartOpen]);

      useEffect(() => {
        cancelAnimationFrame(cartLayoutRafRef.current);

        const from = cartLayoutProgressRef.current;
        const to = cartOpen ? 1 : 0;
        if (Math.abs(from - to) < 0.001) {
          setCartLayoutProgress(to);
          return undefined;
        }

        const startedAt = performance.now();
        const easeLayout = (t) => 1 - Math.pow(1 - t, 3);
        const tick = (now) => {
          const t = Math.min(1, (now - startedAt) / CART_LAYOUT_DURATION_MS);
          const eased = easeLayout(t);
          const next = from + (to - from) * eased;
          setCartLayoutProgress(next);
          if (t < 1) {
            cartLayoutRafRef.current = requestAnimationFrame(tick);
          } else {
            setCartLayoutProgress(to);
          }
        };

        cartLayoutRafRef.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(cartLayoutRafRef.current);
      }, [cartOpen]);

      useEffect(() => {
        cancelAnimationFrame(topCatalogLayoutRafRef.current);

        const from = topCatalogLayoutProgressRef.current;
        const to = cartOpen ? 1 : 0;
        if (Math.abs(from - to) < 0.001) {
          setTopCatalogLayoutProgress(to);
          return undefined;
        }

        const startedAt = performance.now();
        const opening = to > from;
        const duration = opening
          ? TOP_CATALOG_OPEN_DURATION_MS
          : TOP_CATALOG_CLOSE_DURATION_MS;
        // 打开时减少起步阶段的突然加速；关闭时保持原先较利落的速度。
        const easeLayout = opening
          ? (t) => t * t * (3 - 2 * t)
          : (t) => 1 - Math.pow(1 - t, 3);
        const tick = (now) => {
          const t = Math.min(1, (now - startedAt) / duration);
          const next = from + (to - from) * easeLayout(t);
          setTopCatalogLayoutProgress(next);
          if (t < 1) {
            topCatalogLayoutRafRef.current = requestAnimationFrame(tick);
          } else {
            setTopCatalogLayoutProgress(to);
          }
        };

        topCatalogLayoutRafRef.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(topCatalogLayoutRafRef.current);
      }, [cartOpen]);

      useEffect(() => {
        setFruitOffset(offset => Math.min(offset, maxFruitOffset));
      }, [maxFruitOffset]);

      useEffect(() => {
        sizeSpinFruitTimersRef.current.forEach(clearTimeout);
        sizeSpinFruitTimersRef.current = [];

        if (!isSizeSpinning) {
          // hidden -> visible 会重新挂载切片，从而重播各自的掉落和反弹动画。
          setSizeSpinFruitPhase('visible');
          return undefined;
        }

        if (placedFruits.length === 0) return undefined;

        setSizeSpinFruitPhase('visible');
        const fadeTimer = setTimeout(() => {
          setSizeSpinFruitPhase('fading');
        }, SIZE_SPIN_FRUIT_ANIMATION.hideDelayMs);
        const hideTimer = setTimeout(() => {
          setSizeSpinFruitPhase('hidden');
        }, SIZE_SPIN_FRUIT_ANIMATION.hideDelayMs + SIZE_SPIN_FRUIT_ANIMATION.fadeDuration * 1000);
        sizeSpinFruitTimersRef.current = [fadeTimer, hideTimer];

        return () => {
          sizeSpinFruitTimersRef.current.forEach(clearTimeout);
          sizeSpinFruitTimersRef.current = [];
        };
      }, [isSizeSpinning]);

      useEffect(() => {
        if (!isSizeShaking || sizeShakeRunRef.current.running) return undefined;
        const run = sizeShakeRunRef.current;
        Object.assign(run, {
          running: true,
          cycleStart: performance.now(),
          startScreenShift: displayedScreenShiftRef.current,
          switched: false,
        });

        const tick = (now) => {
          const elapsed = now - run.cycleStart;
          const t = THREE.MathUtils.clamp(elapsed / SIZE_CHANGE_SHAKE.duration, 0, 1);
          const smooth = (value) => value * value * (3 - 2 * value);
          const latestTargetIndex = requestedSizeIndexRef.current;
          const targetOption = SIZE_OPTIONS[latestTargetIndex];
          const shakeMotion = {
            downDistance: SIZE_CHANGE_SHAKE.downDistance,
            reboundDistance: SIZE_CHANGE_SHAKE.reboundDistance,
            settleDistance: SIZE_CHANGE_SHAKE.settleDistance,
            ...(targetOption.shakeMotion ?? {}),
          };
          let offsetY = 0;
          if (t < SIZE_CHANGE_SHAKE.switchAt) {
            const rawPhase = t / SIZE_CHANGE_SHAKE.switchAt;
            const phase = 1 - Math.pow(1 - rawPhase, 2);
            offsetY = THREE.MathUtils.lerp(0, -shakeMotion.downDistance, phase);
          } else if (t < 0.54) {
            const phase = smooth((t - SIZE_CHANGE_SHAKE.switchAt) / (0.54 - SIZE_CHANGE_SHAKE.switchAt));
            offsetY = THREE.MathUtils.lerp(-shakeMotion.downDistance, shakeMotion.reboundDistance, phase);
          } else if (t < 0.76) {
            const phase = smooth((t - 0.54) / (0.76 - 0.54));
            offsetY = THREE.MathUtils.lerp(shakeMotion.reboundDistance, -shakeMotion.settleDistance, phase);
          } else {
            const phase = smooth((t - 0.76) / (1 - 0.76));
            offsetY = THREE.MathUtils.lerp(-shakeMotion.settleDistance, 0, phase);
          }
          setSizeShakeOffsetY(offsetY);

          const finalScreenShiftForTarget = targetOption.screenShift ?? 0.17;
          const switchScreenShiftForTarget = targetOption.switchScreenShift;
          let currentScreenShift;
          if (switchScreenShiftForTarget != null && t >= SIZE_CHANGE_SHAKE.switchAt) {
            // 切成 S 的一瞬间先给一个更低的起始位置，再回到 S 的最终位置；
            // 这样从 L 切到 S 时不会继承 L 的高位置，也不会在结束时闪回。
            const shiftEase = (t - SIZE_CHANGE_SHAKE.switchAt) / (1 - SIZE_CHANGE_SHAKE.switchAt);
            currentScreenShift = THREE.MathUtils.lerp(
              switchScreenShiftForTarget,
              finalScreenShiftForTarget,
              shiftEase,
            );
          } else {
            const shiftEase = t;
            currentScreenShift = THREE.MathUtils.lerp(
              run.startScreenShift,
              finalScreenShiftForTarget,
              shiftEase,
            );
          }
          displayedScreenShiftRef.current = currentScreenShift;
          setDisplayedScreenShift(currentScreenShift);

          if (!run.switched && t >= SIZE_CHANGE_SHAKE.switchAt) {
            run.switched = true;
            if (selectedSizeIndexRef.current !== latestTargetIndex) {
              selectedSizeIndexRef.current = latestTargetIndex;
              setSelectedSizeIndex(latestTargetIndex);
            }
            // 水果保持可见，从最低点开始被盒子回弹托起，再各自落回格子。
            setSizeShakeFruitKey(key => key + 1);
          }

          if (t < 1) {
            run.rafId = requestAnimationFrame(tick);
            return;
          }

          // 用户在本轮切换点之后又选了新尺寸，就再做一次下沉回弹。
          if (selectedSizeIndexRef.current !== requestedSizeIndexRef.current) {
            run.cycleStart = now;
            run.startScreenShift = displayedScreenShiftRef.current;
            run.switched = false;
            run.rafId = requestAnimationFrame(tick);
            return;
          }

          const finalScreenShift = SIZE_OPTIONS[requestedSizeIndexRef.current].screenShift ?? 0.17;
          displayedScreenShiftRef.current = finalScreenShift;
          setDisplayedScreenShift(finalScreenShift);
          setSizeShakeOffsetY(0);
          run.running = false;
          setIsSizeShaking(false);
        };

        run.rafId = requestAnimationFrame(tick);
        return () => {
          cancelAnimationFrame(sizeShakeRunRef.current.rafId);
          sizeShakeRunRef.current.running = false;
        };
      }, [isSizeShaking]);

      useEffect(() => {
        if (!isSizeSpinning || sizeSpinRunRef.current.running) return undefined;
        const run = sizeSpinRunRef.current;
        Object.assign(run, {
          running: true,
          progressTurns: 0,
          totalTurns: SIZE_CHANGE_SPIN.turns,
          velocityTurnsPerMs: 0,
          lastTime: performance.now(),
          nextSwitchTurn: SIZE_CHANGE_SPIN.switchAt,
          switchedThisTurn: false,
        });

        const tick = (now) => {
          const dt = Math.min(48, Math.max(1, now - run.lastTime));
          run.lastTime = now;

          const remainingTurns = Math.max(0, run.totalTurns - run.progressTurns);
          const cruiseSpeed = 1 / SIZE_CHANGE_SPIN.cruiseMsPerTurn;
          const decelRatio = Math.min(1, remainingTurns / SIZE_CHANGE_SPIN.continueDecelTurns);
          const desiredSpeed = remainingTurns <= SIZE_CHANGE_SPIN.continueDecelTurns
            // 平方根减速曲线接近真实制动：开始减速自然，最终停下也不会突然截断。
            ? cruiseSpeed * Math.sqrt(decelRatio)
            : cruiseSpeed;
          const responseMs = desiredSpeed > run.velocityTurnsPerMs
            ? SIZE_CHANGE_SPIN.accelMs
            : SIZE_CHANGE_SPIN.decelMs;
          const velocityMix = Math.min(1, dt / responseMs);
          run.velocityTurnsPerMs += (desiredSpeed - run.velocityTurnsPerMs) * velocityMix;
          if (remainingTurns <= SIZE_CHANGE_SPIN.continueDecelTurns) {
            // 不允许惯性速度超过当前剩余距离可承受的制动速度，避免最后一帧硬停。
            run.velocityTurnsPerMs = Math.min(run.velocityTurnsPerMs, desiredSpeed);
          }
          run.progressTurns = Math.min(
            run.totalTurns,
            run.progressTurns + run.velocityTurnsPerMs * dt
          );

          while (run.progressTurns >= run.nextSwitchTurn) {
            const latestTargetIndex = requestedSizeIndexRef.current;
            const latestScreenShift = SIZE_OPTIONS[latestTargetIndex].screenShift ?? 0.17;

            if (selectedSizeIndexRef.current !== latestTargetIndex) {
              selectedSizeIndexRef.current = latestTargetIndex;
              setSelectedSizeIndex(latestTargetIndex);
            }
            displayedScreenShiftRef.current = latestScreenShift;
            setDisplayedScreenShift(latestScreenShift);
            run.nextSwitchTurn = Math.floor(run.nextSwitchTurn) + 1 + SIZE_CHANGE_SPIN.switchAt;
          }

          const targetScreenShift =
            SIZE_OPTIONS[requestedSizeIndexRef.current].screenShift ?? 0.17;
          const shiftMix = Math.min(1, dt / SIZE_CHANGE_SPIN.screenShiftFollowMs);
          const currentScreenShift =
            displayedScreenShiftRef.current +
            (targetScreenShift - displayedScreenShiftRef.current) * shiftMix;
          displayedScreenShiftRef.current = currentScreenShift;
          setDisplayedScreenShift(currentScreenShift);
          const currentTurn = Math.floor(run.progressTurns);
          run.switchedThisTurn = run.progressTurns >= currentTurn + SIZE_CHANGE_SPIN.switchAt;
          setSizeSpinAngle(
            SIZE_CHANGE_SPIN.direction *
            Math.PI * 2 *
            run.progressTurns
          );

          const remainingAfterFrame = run.totalTurns - run.progressTurns;
          const reachedFinalStop = remainingAfterFrame <= 0.0001;

          if (!reachedFinalStop) {
            run.rafId = requestAnimationFrame(tick);
            return;
          }

          // 极少数情况下，点击可能刚好发生在最后一帧；只在终点仍有新目标时补一圈。
          // 不能在前半圈按“尺寸尚未切换”来补圈，否则普通单击也会被误判成两圈。
          if (selectedSizeIndexRef.current !== requestedSizeIndexRef.current) {
            run.totalTurns += SIZE_CHANGE_SPIN.turns;
            run.rafId = requestAnimationFrame(tick);
            return;
          }

          const finalScreenShift =
            SIZE_OPTIONS[requestedSizeIndexRef.current].screenShift ?? 0.17;
          displayedScreenShiftRef.current = finalScreenShift;
          setDisplayedScreenShift(finalScreenShift);
          setSizeSpinAngle(0);
          run.running = false;
          setIsSizeSpinning(false);
        };

        run.rafId = requestAnimationFrame(tick);
        return () => {
          cancelAnimationFrame(sizeSpinRunRef.current.rafId);
          sizeSpinRunRef.current.running = false;
        };
      }, [isSizeSpinning]);

      const unsnapApple = (id) => {
        setPlacedFruits(prev => prev.filter(a => a.id !== id));
        setReplacementFruitId(null);
        setHoveredCell(null);
      };

      const startSizeChange = () => {
        setHoveredCell(null);
        setReplacementFruitId(null);
        setRequestedSizeIndex((index) => {
          const nextIndex = (index + 1) % SIZE_OPTIONS.length;
          requestedSizeIndexRef.current = nextIndex;
          /*
            备用旧方案：整圈旋转切换尺寸。
            现在空盒和有水果都统一走下面的“下沉 -> 回弹”动画，所以这里暂时不调用。
            if (sizeSpinRunRef.current.running) {
              const run = sizeSpinRunRef.current;
              const currentTurn = Math.floor(run.progressTurns ?? 0);
              const alreadySwitchedThisTurn =
                (run.progressTurns ?? 0) >= currentTurn + SIZE_CHANGE_SPIN.switchAt;
              const requiredTurns = alreadySwitchedThisTurn
                ? currentTurn + 1 + SIZE_CHANGE_SPIN.turns
                : currentTurn + SIZE_CHANGE_SPIN.turns;
              run.totalTurns = Math.max(run.totalTurns ?? SIZE_CHANGE_SPIN.turns, requiredTurns);
            }
          */
          return nextIndex;
        });
        // 统一尺寸切换动画：空盒也不再转一圈，只做一次利落的下沉回弹。
        setIsSizeShaking(true);
      };

      const replaceFruitInCell = (cell) => {
        if (replacementFruitId == null) return;
        setPlacedFruits(prev => placeAppleInCell(prev, replacementFruitId, cell));
        setReplacementFruitId(null);
        setHoveredCell(null);
      };

      const cancelReplacement = () => {
        setReplacementFruitId(null);
        setHoveredCell(null);
      };

	      const clearAllFruits = () => {
	        setPlacedFruits([]);
	        setReplacementFruitId(null);
	        setHoveredCell(null);
	        setOpenComboIndex(null);
	        setComboReplacePrompt(null);
	      };

	      const openCartDrawer = () => {
	        setCartOpen(true);
	      };

	      const createPlacedFruitsFromSnapshot = (items) => items.map(({ appleId, cell }) => ({
	        id: nextPlacedIdRef.current++,
	        appleId,
	        cell,
	        motionKey: nextPlacementMotionRef.current++,
	      }));

	      // 购物车编辑使用直接切换，避免尺寸切换动画与侧栏关闭动画互相干扰。
	      const applyMainBoxSnapshot = ({ sizeIndex, items }) => {
	        const safeSizeIndex = Math.max(0, Math.min(SIZE_OPTIONS.length - 1, sizeIndex));
	        const sizeOption = SIZE_OPTIONS[safeSizeIndex];
	        cancelAnimationFrame(sizeShakeRunRef.current.rafId);
	        cancelAnimationFrame(sizeSpinRunRef.current.rafId);
	        sizeShakeRunRef.current.running = false;
	        sizeSpinRunRef.current.running = false;
	        selectedSizeIndexRef.current = safeSizeIndex;
	        requestedSizeIndexRef.current = safeSizeIndex;
	        displayedScreenShiftRef.current = sizeOption.screenShift ?? 0.17;
	        setSelectedSizeIndex(safeSizeIndex);
	        setRequestedSizeIndex(safeSizeIndex);
	        setDisplayedScreenShift(sizeOption.screenShift ?? 0.17);
	        setSizeShakeOffsetY(0);
	        setSizeSpinAngle(0);
	        setIsSizeShaking(false);
	        setIsSizeSpinning(false);
	        setPlacedFruits(createPlacedFruitsFromSnapshot(items));
	        setReplacementFruitId(null);
	        setHoveredCell(null);
	        setOpenComboIndex(null);
	        setComboReplacePrompt(null);
	      };

	      const beginCartBoxEdit = (box) => {
	        if (cartTransfer) return;
	        const originalDraft = cartEditSession?.originalDraft ?? {
	          sizeIndex: selectedSizeIndexRef.current,
	          items: placedFruits.map(({ appleId, cell }) => ({ appleId, cell })),
	        };
	        const targetSizeIndex = Math.max(0, SIZE_OPTIONS.findIndex(option => option.size === box.size));
	        setCartEditSession({ boxId: box.id, originalDraft });
	        applyMainBoxSnapshot({ sizeIndex: targetSizeIndex, items: box.items });
	      };

	      const cancelCartBoxEdit = () => {
	        if (!cartEditSession) return;
	        const { originalDraft } = cartEditSession;
	        setCartEditSession(null);
	        applyMainBoxSnapshot(originalDraft);
	      };

	      const addBoxToCart = () => {
	        if ((!cartEditSession && placedFruits.length === 0) || cartTransfer) return;

	        const sortedItems = [...placedFruits]
	          .sort((a, b) => a.cell - b.cell)
	          .map(({ appleId, cell }) => ({ appleId, cell }));

	        // 编辑购物车内的盒子时，黑色按钮用于保存到原条目，不新增盒子或数量。
	        if (cartEditSession) {
	          const { boxId, originalDraft } = cartEditSession;
	          setCartBoxes(prev => prev.map(box => box.id === boxId ? {
	            ...box,
	            size: selectedSize.size,
	            weight: selectedSize.weight,
	            items: sortedItems,
	          } : box));
	          setCartEditSession(null);
	          applyMainBoxSnapshot(originalDraft);
	          return;
	        }

	        // 每次根据购物车内现有的标准名称重新编号，删除最大编号后可以自然复用。
	        // 用户手动输入的“BOX 数字”也会参与计算，例如 BOX 153 后新增 BOX 154。
	        const boxNumber = cartBoxes.reduce((maxNumber, box) => {
	          const match = /^BOX ([1-9]\d*)$/.exec(box.name.trim());
	          return match ? Math.max(maxNumber, Number.parseInt(match[1], 10)) : maxNumber;
	        }, 0) + 1;
	        const snapshot = {
	          id: Date.now(),
	          boxNumber,
	          name: `BOX ${boxNumber}`,
	          size: selectedSize.size,
	          weight: selectedSize.weight,
	          quantity: 1,
	          price: 2980,
	          items: sortedItems,
	        };
	        // 购物车原本为空时，首个加入的盒子默认展开；之后新增的盒子保持收起。
	        const shouldExpandNewBox = cartBoxes.length === 0;
	        const previousCartCount = cartBoxes.reduce((sum, box) => sum + box.quantity, 0);
	        const boxBounds = boxScreenRef.current;
	        const cartBounds = pageCartRef.current?.getBoundingClientRect();
	        const startX = boxBounds?.centerX ?? window.innerWidth * 0.5;
	        const startY = boxBounds?.centerY ?? window.innerHeight * 0.65;
	        const endX = cartBounds
	          ? cartBounds.left + PAGE_CART_ICON_SIZE.width * 0.5
	          : window.innerWidth - PAGE_CART_POSITION.right - PAGE_CART_ICON_SIZE.width * 0.5;
	        const endY = cartBounds
	          ? cartBounds.top + cartBounds.height * 0.5
	          : window.innerHeight - PAGE_CART_POSITION.bottom - PAGE_CART_ICON_SIZE.height * 0.5;

	        cartTransferTimersRef.current.forEach(clearTimeout);
	        cartTransferTimersRef.current = [];
	        setReplacementFruitId(null);
	        setHoveredCell(null);
	        setCartTransfer({
	          snapshot,
	          fruits: sortedItems.map(item => FRUIT_ITEMS[item.appleId]).filter(Boolean),
	          startX,
	          startY,
	          deltaX: endX - startX,
	          deltaY: endY - startY,
	          arcY: -Math.max(76, Math.min(150, Math.abs(endX - startX) * 0.12)),
	        });

	        // 列表条目和飞向购物车的盒子同时开始运动，不再等待飞行动画结束。
	        // entering 标记保留到飞行结束，让右下角数量仍在盒子抵达后才更新。
	        setCartBoxes(prev => [...prev, snapshot]);
	        setEnteringCartBoxIds(current => [...current, snapshot.id]);
	        if (shouldExpandNewBox) {
	          setExpandedCartBoxIds(current => current.includes(snapshot.id)
	            ? current
	            : [...current, snapshot.id]);
	        }
	        setEditingCartBoxId(null);

	        const clearTimer = setTimeout(() => {
	          setPlacedFruits([]);
	          setOpenComboIndex(null);
	          setComboReplacePrompt(null);
	        }, CART_TRANSFER_CLEAR_DELAY_MS);
	        const finishTimer = setTimeout(() => {
	          setEnteringCartBoxIds(current => current.filter(id => id !== snapshot.id));
	          setCartCountMotion({ key: Date.now(), from: previousCartCount, to: previousCartCount + 1 });
	          setCartTransfer(null);
	          const countTimer = setTimeout(() => setCartCountMotion(null), CART_COUNT_MOTION_MS);
	          cartTransferTimersRef.current = [countTimer];
	        }, CART_TRANSFER_DURATION_MS);
	        cartTransferTimersRef.current = [clearTimer, finishTimer];
      };

      const turnFruitPage = (direction) => {
        setFruitSnapDuration(460);
        setFruitOffset(offset => Math.max(0, Math.min(maxFruitOffset, offset + direction * fruitSlots)));
      };

      // 顶部水果栏拖动：松手后按速度继续滑动；只有离格子中心 4px 内才做极弱对齐。
      const onFruitStripPointerDown = (e) => {
        if (e.target.closest('button')) return;
        beginFruitStripDrag(e.clientX, fruitOffsetRef.current, e.timeStamp);
        e.currentTarget.setPointerCapture(e.pointerId);
        e.preventDefault();
      };

      const onFruitStripPointerMove = (e) => {
        updateFruitStripDrag(e);
      };

	      const onFruitStripPointerUp = (e) => {
	        finishFruitStripDrag(e);
	      };

	      const updateCartBox = (boxId, patch) => {
	        setCartBoxes(prev => prev.map(box => box.id === boxId ? { ...box, ...patch } : box));
	      };
	      const toggleCartBoxExpanded = (boxId) => {
	        setExpandedCartBoxIds(current => current.includes(boxId)
	          ? current.filter(id => id !== boxId)
	          : [...current, boxId]);
	      };
	      const removeCartBox = (boxId) => {
	        if (removingCartBoxIds.includes(boxId)) return;
	        if (cartEditSession?.boxId === boxId) cancelCartBoxEdit();
	        // 先保留条目播放向右退场动画，动画结束后再真正删除。
	        setRemovingCartBoxIds(current => [...current, boxId]);
	        setTimeout(() => {
	          setCartBoxes(prev => prev.filter(box => box.id !== boxId));
	          setExpandedCartBoxIds(current => current.filter(id => id !== boxId));
	          setEditingCartBoxId(current => current === boxId ? null : current);
	          setEnteringCartBoxIds(current => current.filter(id => id !== boxId));
	          setRemovingCartBoxIds(current => current.filter(id => id !== boxId));
	        }, CART_BOX_LIST_MOTION_MS);
	      };
	      const setCartBoxQuantity = (boxId, value) => {
	        const quantity = Math.max(1, Math.min(99, Number.parseInt(value, 10) || 1));
	        updateCartBox(boxId, { quantity });
	      };
	      // 正在飞向购物车的盒子已经显示在列表中，但抵达前不计入右下角数量。
	      const cartBoxQuantityTotal = cartBoxes.reduce(
	        (sum, box) => enteringCartBoxIds.includes(box.id) ? sum : sum + box.quantity,
	        0,
	      );
	      const cartTotal = cartBoxes.reduce((sum, box) => sum + box.price * box.quantity, 0);
	      const activeCartEditBox = cartEditSession
	        ? cartBoxes.find(box => box.id === cartEditSession.boxId) ?? null
	        : null;
	      const formatYen = (value) => `${value.toLocaleString('ja-JP')}円（税込）`;

		      return (
	        <div
	          onPointerDown={() => {
	            setOpenComboIndex(null);
	            setComboReplacePrompt(null);
	          }}
	          style={{ width: '100vw', height: '100vh', overflow: 'hidden', background: '#F7F8FA', position: 'relative' }}
	        >
          <BoxScene
            displayedScreenShift={displayedScreenShift}
            cartContentOffset={cartContentOffset}
            lightIntensity={lightIntensity}
            sizeShakeOffsetY={sizeShakeOffsetY}
            groupRef={groupRef}
            rotationX={rotationX}
            sizeSpinAngle={sizeSpinAngle}
            selectedBoxLayout={selectedBoxLayout}
            transmission={transmission}
            roughness={roughness}
            ior={ior}
            glassColor={glassColor}
            attenuationColor={attenuationColor}
            envMapIntensity={envMapIntensity}
            selectedNoticeLabel={selectedNoticeLabel}
            setHoveredCell={setHoveredCell}
            placedFruits={placedFruits}
            sizeSpinFruitPhase={sizeSpinFruitPhase}
            selectedSize={selectedSize}
            sizeShakeFruitKey={sizeShakeFruitKey}
            cartTransfer={cartTransfer}
            selectedCellUiOffsets={selectedCellUiOffsets}
            replacementFruitId={replacementFruitId}
            modelDragging={modelDragging}
            sizeTransitionActive={sizeTransitionActive}
            hoveredCell={hoveredCell}
            replacementMotionKey={replacementMotionKey}
            unsnapApple={unsnapApple}
            replaceFruitInCell={replaceFruitInCell}
            cancelReplacement={cancelReplacement}
            clearAllFruits={clearAllFruits}
            addBoxToCart={addBoxToCart}
            cartEditSession={cartEditSession}
            boxScreenRef={boxScreenRef}
            setModelDragging={setModelDragging}
            rotateLeftRightLimit={rotateLeftRightLimit}
            defaultPolarAngle={defaultPolarAngle}
            rotateUpLimit={rotateUpLimit}
            rotateDownLimit={rotateDownLimit}
          />

          <TopCatalog
            activeCatalogCount={activeCatalogCount}
            activeCatalogIndex={activeCatalogIndex}
            activeCatalogItems={activeCatalogItems}
            activeCatalogTab={activeCatalogTab}
            arrowFruitViewportWidth={arrowFruitViewportWidth}
            canScrollNext={canScrollNext}
            canScrollPrev={canScrollPrev}
            catalogMaskLeft={catalogMaskLeft}
            catalogSwitchOffset={catalogSwitchOffset}
            comboHoverPanelLeft={comboHoverPanelLeft}
            comboHoverPanelWidth={comboHoverPanelWidth}
            comboReplacePrompt={comboReplacePrompt}
            fruitEdgePull={fruitEdgePull}
            fruitSnapDuration={fruitSnapDuration}
            fruitStripDragging={fruitStripDragging}
            fruitStripTranslate={fruitStripTranslate}
            fruitViewportWidth={fruitViewportWidth}
            isFruitCatalog={isFruitCatalog}
            nextCatalogArrowLeft={nextCatalogArrowLeft}
            onAppleClick={onAppleClick}
            onApplePointerDown={onApplePointerDown}
            onComboCardClick={onComboCardClick}
            onComboPointerDown={onComboPointerDown}
            onFruitStripPointerDown={onFruitStripPointerDown}
            openComboIndex={openComboIndex}
            placeComboInBox={placeComboInBox}
            prevCatalogArrowLeft={prevCatalogArrowLeft}
            requestPlaceCombo={requestPlaceCombo}
            scrollbarThumbWidth={scrollbarThumbWidth}
            scrollbarThumbX={scrollbarThumbX}
            setActiveCatalogTab={setActiveCatalogTab}
            setComboReplacePrompt={setComboReplacePrompt}
            setFruitDragDelta={setFruitDragDelta}
            setFruitEdgePull={setFruitEdgePull}
            setFruitOffset={setFruitOffset}
            setFruitSnapDuration={setFruitSnapDuration}
            setOpenComboIndex={setOpenComboIndex}
            setReplacementFruitId={setReplacementFruitId}
            topCatalogDrawerViewportOffset={topCatalogDrawerViewportOffset}
            turnFruitPage={turnFruitPage}
          />

	          <PageOverlayControls
	            activeCartEditBox={activeCartEditBox}
	            addBoxToCart={addBoxToCart}
	            cancelCartBoxEdit={cancelCartBoxEdit}
	            cartBoxQuantityTotal={cartBoxQuantityTotal}
	            cartContentOffset={cartContentOffset}
	            cartCountMotion={cartCountMotion}
	            cartTransfer={cartTransfer}
	            dragClone={dragClone}
	            openCartDrawer={openCartDrawer}
	            pageCartRef={pageCartRef}
	            requestedSize={requestedSize}
	            startSizeChange={startSizeChange}
	          />

	          <CartDrawer
            cartOpen={cartOpen}
            cartLayoutProgress={cartLayoutProgress}
            setCartOpen={setCartOpen}
            cartBoxes={cartBoxes}
            expandedCartBoxIds={expandedCartBoxIds}
            enteringCartBoxIds={enteringCartBoxIds}
            removingCartBoxIds={removingCartBoxIds}
            editingCartBoxId={editingCartBoxId}
            setEditingCartBoxId={setEditingCartBoxId}
            cartEditSession={cartEditSession}
            cancelCartBoxEdit={cancelCartBoxEdit}
            beginCartBoxEdit={beginCartBoxEdit}
            updateCartBox={updateCartBox}
            toggleCartBoxExpanded={toggleCartBoxExpanded}
            setCartBoxQuantity={setCartBoxQuantity}
            removeCartBox={removeCartBox}
            formatYen={formatYen}
            cartTotal={cartTotal}
          />
	        </div>
      );
    }

    const root = createRoot(document.getElementById('root'));
    root.render(<App />);
