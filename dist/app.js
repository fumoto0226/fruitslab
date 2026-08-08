// src/main.jsx
import * as React8 from "react";
import { createRoot } from "react-dom/client";
import * as THREE3 from "three";

// src/config/appConfig.js
var SCENE_SETTINGS = {
  rotationX: 0.7,
  // 盒子默认前倾角度；越大俯视越明显。
  transmission: 0.85,
  // 玻璃透明感：0 不透明，1 最通透。
  roughness: 0.22,
  // 玻璃磨砂程度：0 光滑清晰，1 模糊磨砂。
  ior: 1,
  // 折射率：越大折射变形越明显。
  glassColor: "#ffffff",
  attenuationColor: "#e0f3ff",
  envMapIntensity: 4,
  lightIntensity: 5.5,
  rotateLeftRightLimit: Math.PI / 5,
  rotateUpLimit: Math.PI / 9.5,
  rotateDownLimit: Math.PI / 5,
  defaultPolarAngle: Math.atan2(8, 3)
};
var BOX_W = 2.8;
var BOX_H = 1;
var BOX_D = 1.8;
var WALL = 0.04;
var CELL_Y = 0.45;
var createBoxLayout = (boxW = BOX_W, boxD = BOX_D) => {
  const holeW = (boxW - 3 * WALL) / 2;
  const holeD = (boxD - 3 * WALL) / 2;
  const leftX = -boxW / 2 + WALL + holeW / 2;
  const rightX = -leftX;
  const frontZ = boxD / 2 - WALL - holeD / 2;
  const backZ = -frontZ;
  return {
    boxW,
    boxH: BOX_H,
    boxD,
    wall: WALL,
    holeW,
    holeD,
    leftX,
    rightX,
    frontZ,
    backZ,
    cellY: CELL_Y,
    // 4 cells in local coords (parent group transforms them)
    cells: [
      { x: leftX, y: CELL_Y, z: backZ },
      // 0: back-left
      { x: rightX, y: CELL_Y, z: backZ },
      // 1: back-right
      { x: leftX, y: CELL_Y, z: frontZ },
      // 2: front-left
      { x: rightX, y: CELL_Y, z: frontZ }
      // 3: front-right
    ]
  };
};
var DEFAULT_BOX_LAYOUT = createBoxLayout();
var CELLS = DEFAULT_BOX_LAYOUT.cells;
var CELL_CONTENT_CENTER_SHIFT = 0.02;
var getCellContentCenterShift = (cellIndex, layout = DEFAULT_BOX_LAYOUT, shift = CELL_CONTENT_CENTER_SHIFT) => layout.cells[cellIndex].x < 0 ? -shift : shift;
var PRESS_HIDE_START_DELAY = 320;
var PRESS_UI_DISMISS_TRANSITION_MS = 560;
var PRESS_ROUND_BUTTON_DISMISS_DAMP = 6.2;
var CELL_INFO_PRESS_HIDE_DELAY = PRESS_HIDE_START_DELAY;
var CELL_INFO_PRESS_TRANSITION_MS = PRESS_UI_DISMISS_TRANSITION_MS;
var CELL_INFO_HOVER_HIDE_DELAY = 320;
var CELL_INFO_HOVER_TRANSITION_MS = 460;
var CELL_CLOSE_HOVER_HIDE_DELAY = 320;
var CELL_CLOSE_HOVER_DISMISS_DAMP = 6.2;
var BOX_ACTION_HIDE_START_DELAY = PRESS_HIDE_START_DELAY;
var BOX_ACTION_HOVER_OPEN_DELAY = 0;
var BOX_ACTION_HOVER_CLOSE_DELAY = 320;
var BOX_ACTION_WIDTH_TRANSITION_MS = 640;
var BOX_ACTION_SCALE_TRANSITION_MS = PRESS_UI_DISMISS_TRANSITION_MS;
var BOX_ACTION_EASING = "cubic-bezier(.2,.8,.2,1)";
var BOX_ACTION_CLICK_SPIN_MS = 520;
var CELL_UI_OFFSETS_BY_SIZE = {
  M: {
    info: { x: -0.62, y: 0.08, z: -0.34 },
    close: { x: 0.56, y: 0.08, z: -0.32 }
  },
  L: {
    info: { x: -0.7, y: 0.09, z: -0.4 },
    close: { x: 0.64, y: 0.09, z: -0.38 }
  },
  S: {
    info: { x: -0.52, y: 0.07, z: -0.28 },
    close: { x: 0.48, y: 0.07, z: -0.26 }
  }
};
var BOX_NOTICE_LABEL_DEFAULT = { x: -0.77, y: 0.08, zOffset: 0.035, width: 0.96, height: 0.31 };
var BOX_NOTICE_TEXT_COLOR = "#A7B6C1";
var BOX_NOTICE_TEXT_OPACITY = 0.92;
var PAGE_CART_POSITION = { right: 64, bottom: 32 };
var PAGE_CART_LAYOUT = { iconTextGap: 10 };
var PAGE_CART_ICON_SIZE = { width: 58, height: 46 };
var PAGE_CART_TEXT_STYLE = { fontSize: 32, textOffsetY: 2 };
var PAGE_CART_COUNT_STYLE = { fontSize: 26, right: -21, top: -15 };
var CART_TRANSFER_DURATION_MS = 760;
var CART_TRANSFER_CLEAR_DELAY_MS = 190;
var CART_COUNT_MOTION_MS = 360;
var CART_DRAWER_WIDTH = 360;
var CART_LAYOUT_DURATION_MS = 420;
var CART_BOX_LIST_MOTION_MS = 300;
var CART_BOX_LIST_MOTION_EASING = "linear";
var CART_FOOTER_ARROW_OFFSET_X = 2.5;
var TOP_CATALOG_OPEN_DURATION_MS = 550;
var TOP_CATALOG_CLOSE_DURATION_MS = 420;
var TOP_CATALOG_SIDE_GAP = 28;
var TOP_CATALOG_ARROW_GAP = 12;
var SIZE_OPTIONS = [
  // boxWidth / boxDepth 是真实改盒子的长宽；盒子高度、壁厚、圆角、十字分隔厚度不跟着缩放。
  // noticeLabel 是盒子正面说明文字的位置和大小：不同尺寸可以单独调。
  // screenShift 是盒子静止后的屏幕上下位置：数值越大，盒子越往屏幕下方；不会改变 3D 模型远近和旋转中心。
  // switchScreenShift 是切换成该尺寸那一瞬间的起始构图位置；主要给 S 用，避免从 L 切过来时底部露缝。
  // shakeMotion 是每个尺寸自己的下沉/回弹微调：先以 S 不露底为基准，M/L 再逐级加大。
  { size: "M", weight: "800g", boxWidth: 2.8, boxDepth: 1.8, screenShift: 0.17, shakeMotion: { downDistance: 0.052, reboundDistance: 15e-4, settleDistance: 1e-3 }, noticeLabel: { x: -0.77, y: 0.08, zOffset: 0.035, width: 0.96, height: 0.31 } },
  { size: "L", weight: "1KG", boxWidth: 3.12, boxDepth: 2.02, screenShift: 0.15, shakeMotion: { downDistance: 0.064, reboundDistance: 2e-3, settleDistance: 12e-4 }, noticeLabel: { x: -0.88, y: 0.08, zOffset: 0.055, width: 0.96, height: 0.31 } },
  { size: "S", weight: "600g", boxWidth: 2.48, boxDepth: 1.6, screenShift: 0.19, switchScreenShift: 0.215, shakeMotion: { downDistance: 0.028, reboundDistance: 0, settleDistance: 0 }, noticeLabel: { x: -0.63, y: 0.08, zOffset: 0.035, width: 0.92, height: 0.3 } }
];
var SIZE_SELECTOR_POSITION = { left: 38, bottom: 26 };
var SIZE_SELECTOR_CARD_SIZE = { width: 60, height: 60 };
var SIZE_SELECTOR_TEXT_STYLE = { sizeFont: 30, weightFont: 10, labelFont: PAGE_CART_TEXT_STYLE.fontSize, gap: 10, weightGap: 5 };
var SIZE_CHANGE_SPIN = {
  duration: 780,
  switchAt: 0.5,
  turns: 1,
  direction: -1,
  cruiseMsPerTurn: 640,
  accelMs: 180,
  decelMs: 240,
  continueDecelTurns: 0.34,
  screenShiftFollowMs: 240
};
var SIZE_CHANGE_SHAKE = {
  duration: 420,
  // 单次下沉回弹总时长，单位毫秒。越小越利落。
  switchAt: 0.18,
  // 到达最低点并切换盒子尺寸的时间点。
  downDistance: 0.052,
  // 默认下沉距离；不同尺寸可在 shakeMotion 里覆盖。
  reboundDistance: 15e-4,
  // 默认第一次回弹超过原位的距离。
  settleDistance: 1e-3
  // 默认回弹后的轻微二次下沉距离。
};
var SIZE_SHAKE_FRUIT_DROP = {
  height: 0.22,
  duration: 0.42,
  stagger: 8e-3,
  rotation: 0.07
};

// src/data/fruitCatalog.js
var CUT_FRUIT_BASE_PATH = "img/fruits/Cut Fruit/";
var USE_EMBEDDED_CUT_TEXTURES = false;
var CUT_FRUIT_TEXTURE_SRCS = window.CUT_FRUIT_TEXTURE_SRCS || {};
var cutFruit = (src) => USE_EMBEDDED_CUT_TEXTURES && CUT_FRUIT_TEXTURE_SRCS[src] ? CUT_FRUIT_TEXTURE_SRCS[src] : `${CUT_FRUIT_BASE_PATH}${src}`;
var FRUIT_ITEMS = [
  { name: "\u3075\u3058\u308A\u3093\u3054", wholeSrc: "img/fruits/Whole Fruit/Apple/Red.png", cutSrc: cutFruit("Apple/Red.png") },
  { name: "\u738B\u6797\u308A\u3093\u3054", wholeSrc: "img/fruits/Whole Fruit/Apple/Green.png", cutSrc: cutFruit("Apple/Green.png") },
  { name: "\u30B7\u30CA\u30CE\u30B4\u30FC\u30EB\u30C9", wholeSrc: "img/fruits/Whole Fruit/Apple/Yellow.png", cutSrc: cutFruit("Apple/Yellow.png") },
  { name: "\u767D\u6843", wholeSrc: "img/fruits/Whole Fruit/Peach/Light.png", cutSrc: cutFruit("Peach/Light.png"), boxStyle: "peach" },
  { name: "\u3042\u304B\u3064\u304D\u6843", wholeSrc: "img/fruits/Whole Fruit/Peach/Pink.png", cutSrc: cutFruit("Peach/Pink.png"), boxStyle: "peach" },
  { name: "\u9EC4\u91D1\u6843", wholeSrc: "img/fruits/Whole Fruit/Peach/Yellow.png", cutSrc: cutFruit("Peach/Yellow.png"), boxStyle: "peach" },
  { name: "\u6DE1\u96EA", wholeSrc: "img/fruits/Whole Fruit/Strawberry/White.png", cutSrc: cutFruit("Strawberry/White.png") },
  { name: "\u3068\u3061\u304A\u3068\u3081", wholeSrc: "img/fruits/Whole Fruit/Strawberry/Red.png", cutSrc: cutFruit("Strawberry/Red.png") },
  { name: "\u3042\u307E\u304A\u3046", wholeSrc: "img/fruits/Whole Fruit/Strawberry/Dark.png", cutSrc: cutFruit("Strawberry/Dark.png") },
  { name: "\u30E9\u30FB\u30D5\u30E9\u30F3\u30B9", wholeSrc: "img/fruits/Whole Fruit/Pear/LaFrance.png", cutSrc: cutFruit("Pear/La France.png") },
  { name: "\u5E78\u6C34\u68A8", wholeSrc: "img/fruits/Whole Fruit/Pear/Kousui.png", cutSrc: cutFruit("Pear/Kousui.png") },
  { name: "\u305B\u3068\u304B", wholeSrc: "img/fruits/Whole Fruit/Orange/Setoka.png", cutSrc: cutFruit("Orange/Setoka.png") },
  { name: "\u5DE8\u5CF0", wholeSrc: "img/fruits/Whole Fruit/Grape/Kyoho.png", cutSrc: cutFruit("Grape/Kyoho.png"), boxStyle: "cherryGrape" },
  { name: "\u30DE\u30B9\u30AB\u30C3\u30C8", wholeSrc: "img/fruits/Whole Fruit/Grape/Muscat.png", cutSrc: cutFruit("Grape/Muscat.png"), boxStyle: "cherryGrape" },
  { name: "\u30B0\u30EA\u30FC\u30F3\u30AD\u30A6\u30A4", wholeSrc: "img/fruits/Whole Fruit/Kiwi/Green.png", cutSrc: cutFruit("Kiwi/Green.png") },
  { name: "\u30EC\u30C3\u30C9\u30AD\u30A6\u30A4", wholeSrc: "img/fruits/Whole Fruit/Kiwi/Red.png", cutSrc: cutFruit("Kiwi/Red.png") },
  { name: "\u30B4\u30FC\u30EB\u30C9\u30AD\u30A6\u30A4", wholeSrc: "img/fruits/Whole Fruit/Kiwi/Yellow.png", cutSrc: cutFruit("Kiwi/Yellow.png") },
  { name: "\u30A4\u30F3\u30C9\u30DE\u30F3\u30B4\u30FC", wholeSrc: "img/fruits/Whole Fruit/Mango/Indo.png", cutSrc: cutFruit("Mango/Indo.png"), boxStyle: "mango" },
  { name: "\u30A2\u30FC\u30A6\u30A3\u30F3\u30DE\u30F3\u30B4\u30FC", wholeSrc: "img/fruits/Whole Fruit/Mango/Irwin.png", cutSrc: cutFruit("Mango/Irwin.png"), boxStyle: "mango" },
  { name: "\u7D05\u79C0\u5CF0", wholeSrc: "img/fruits/Whole Fruit/Cherry/Beni.png", cutSrc: cutFruit("Cherry/Beni.png"), boxStyle: "cherryGrape" },
  { name: "\u30A2\u30E1\u30EA\u30AB\u30F3\u30C1\u30A7\u30EA\u30FC", wholeSrc: "img/fruits/Whole Fruit/Cherry/American.png", cutSrc: cutFruit("Cherry/American.png"), boxStyle: "cherryGrape" },
  { name: "\u30B9\u30A4\u30AB", wholeSrc: "img/fruits/Whole Fruit/Watermelon/Red.png", cutSrc: cutFruit("Watermelon/Red.png") },
  { name: "\u9EC4\u30B9\u30A4\u30AB", wholeSrc: "img/fruits/Whole Fruit/Watermelon/Yellow.png", cutSrc: cutFruit("Watermelon/Yellow.png") }
];
var FRUITS_PER_PAGE = 10;
var CATALOG_TABS = [
  { id: "fruit", label: "\u5358\u54C1" },
  { id: "recommend", label: "\u4EBA\u6C17\u30BB\u30C3\u30C8" },
  { id: "history", label: "\u5C65\u6B74" }
];
var TEST_BOX_IMAGES = [
  "img/test/Fruit Box 1.png",
  "img/test/Fruit Box 2.png",
  "img/test/Fruit Box 3.png"
];
var TEST_BOX_ITEMS = Array.from({ length: 12 }, (_, index) => ({
  name: `\u30BB\u30C3\u30C8 ${index + 1}`,
  imageSrc: TEST_BOX_IMAGES[index % TEST_BOX_IMAGES.length],
  fruits: [0, 3, 2, 4].map((fruitOffset) => {
    const appleId = (index + fruitOffset) % FRUIT_ITEMS.length;
    const fruit = FRUIT_ITEMS[appleId];
    return { appleId, name: fruit.name, iconSrc: fruit.wholeSrc };
  })
}));
var CATALOG_SWITCH_STYLE = { top: 140, width: 300, height: 26, fontSize: 11 };

// src/utils/fruitAnimation.js
var FRUIT_DROP_ANIMATION = {
  dropHeight: 0.48,
  duration: 0.82,
  stagger: 0.035,
  appearDuration: 0.1,
  // 入场淡入时长：在正式下落前快速变为完全不透明。
  exitDuration: 0.18
  // 替换旧水果时的淡出时长。
};
var SIZE_SPIN_FRUIT_ANIMATION = {
  hideDelayMs: 120,
  // 开始旋转后等待多久才开始淡出，避免一点击就立刻消失。
  fadeDuration: 0.18
  // 淡出速度，单位秒。
};
var seededUnit = (seed) => {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
};
var easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
var easeOutBounce = (t) => {
  const n1 = 7.5625;
  const d1 = 2.75;
  if (t < 1 / d1) return n1 * t * t;
  if (t < 2 / d1) {
    const shifted2 = t - 1.5 / d1;
    return n1 * shifted2 * shifted2 + 0.75;
  }
  if (t < 2.5 / d1) {
    const shifted2 = t - 2.25 / d1;
    return n1 * shifted2 * shifted2 + 0.9375;
  }
  const shifted = t - 2.625 / d1;
  return n1 * shifted * shifted + 0.984375;
};

// src/components/BoxScene.jsx
import * as React4 from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, OrbitControls } from "@react-three/drei";

// src/three/FruitPieces.jsx
import * as React from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
var { useMemo, useState, useEffect, useRef } = React;
var FRUIT_TEXTURE_CACHE = /* @__PURE__ */ new Map();
function useAppleTexture(src) {
  return useMemo(() => {
    if (FRUIT_TEXTURE_CACHE.has(src)) return FRUIT_TEXTURE_CACHE.get(src);
    const loaded = new THREE.TextureLoader().load(src);
    loaded.colorSpace = THREE.SRGBColorSpace;
    loaded.minFilter = THREE.LinearFilter;
    loaded.magFilter = THREE.LinearFilter;
    loaded.generateMipmaps = false;
    FRUIT_TEXTURE_CACHE.set(src, loaded);
    return loaded;
  }, [src]);
}
function AnimatedFruitPiece({
  targetPosition,
  targetRotation,
  planeSize,
  texture,
  layer,
  pieceIndex,
  cellIndex,
  animationKey,
  settleKey = 0,
  exiting = false,
  exitDuration = FRUIT_DROP_ANIMATION.exitDuration
}) {
  const meshRef = useRef(null);
  const materialRef = useRef(null);
  const elapsedRef = useRef(0);
  const exitElapsedRef = useRef(0);
  const exitStartOpacityRef = useRef(1);
  const finishedRef = useRef(false);
  const settleElapsedRef = useRef(0);
  const settleActiveRef = useRef(false);
  const settleStartRef = useRef({ x: 0, y: 0, rotation: 0 });
  const previousSettleKeyRef = useRef(settleKey);
  const motion = useMemo(() => {
    const seed = (animationKey + 1) * 131 + (cellIndex + 1) * 47 + (pieceIndex + 1) * 19;
    const side = pieceIndex % 2 === 0 ? -1 : 1;
    return {
      delay: FRUIT_DROP_ANIMATION.appearDuration + Math.floor(pieceIndex / 2) * FRUIT_DROP_ANIMATION.stagger + pieceIndex % 2 * 0.016,
      duration: FRUIT_DROP_ANIMATION.duration + seededUnit(seed + 1) * 0.12,
      startOffset: [
        (seededUnit(seed + 2) - 0.5) * 0.13,
        FRUIT_DROP_ANIMATION.dropHeight + seededUnit(seed + 3) * 0.14,
        0
      ],
      startRotation: [
        0,
        0,
        side * (0.14 + seededUnit(seed + 7) * 0.18)
      ]
    };
  }, [animationKey, cellIndex, pieceIndex]);
  useEffect(() => {
    elapsedRef.current = 0;
    finishedRef.current = false;
    if (!meshRef.current) return;
    if (materialRef.current) {
      materialRef.current.transparent = true;
      materialRef.current.opacity = 0;
      materialRef.current.alphaTest = 0.02;
      materialRef.current.needsUpdate = true;
    }
    meshRef.current.visible = false;
    meshRef.current.position.set(...motion.startOffset);
    meshRef.current.rotation.set(...motion.startRotation);
  }, [animationKey, motion]);
  useEffect(() => {
    if (!exiting) return;
    exitElapsedRef.current = 0;
    exitStartOpacityRef.current = materialRef.current?.opacity ?? 1;
  }, [exiting]);
  useEffect(() => {
    if (settleKey <= 0 || settleKey === previousSettleKeyRef.current || !meshRef.current) return;
    previousSettleKeyRef.current = settleKey;
    const seed = settleKey * 149 + (cellIndex + 1) * 43 + (pieceIndex + 1) * 23;
    const side = pieceIndex % 2 === 0 ? -1 : 1;
    settleStartRef.current = {
      x: (seededUnit(seed + 1) - 0.5) * 0.045,
      y: SIZE_SHAKE_FRUIT_DROP.height + seededUnit(seed + 2) * 0.045,
      rotation: side * (SIZE_SHAKE_FRUIT_DROP.rotation + seededUnit(seed + 3) * 0.045)
    };
    settleElapsedRef.current = -Math.floor(pieceIndex / 2) * SIZE_SHAKE_FRUIT_DROP.stagger;
    settleActiveRef.current = true;
    finishedRef.current = true;
    meshRef.current.visible = true;
    meshRef.current.position.set(settleStartRef.current.x, settleStartRef.current.y, 0);
    meshRef.current.rotation.set(0, 0, settleStartRef.current.rotation);
    if (materialRef.current) {
      materialRef.current.opacity = 1;
      materialRef.current.alphaTest = 0.5;
      materialRef.current.transparent = false;
      materialRef.current.needsUpdate = true;
    }
  }, [settleKey, cellIndex, pieceIndex]);
  useFrame((_, delta) => {
    const mesh = meshRef.current;
    const material = materialRef.current;
    if (!mesh || !material) return;
    if (exiting) {
      exitElapsedRef.current += Math.min(delta, 0.05);
      const exitProgress = THREE.MathUtils.clamp(
        exitElapsedRef.current / exitDuration,
        0,
        1
      );
      if (!material.transparent) {
        material.transparent = true;
        material.needsUpdate = true;
      }
      if (material.alphaTest !== 0.02) {
        material.alphaTest = 0.02;
        material.needsUpdate = true;
      }
      material.opacity = exitStartOpacityRef.current * (1 - easeOutCubic(exitProgress));
      mesh.visible = exitProgress < 1;
      return;
    }
    if (settleActiveRef.current) {
      settleElapsedRef.current += Math.min(delta, 0.05);
      if (settleElapsedRef.current < 0) return;
      const t2 = THREE.MathUtils.clamp(
        settleElapsedRef.current / SIZE_SHAKE_FRUIT_DROP.duration,
        0,
        1
      );
      const settle2 = easeOutCubic(t2);
      const bounce2 = easeOutBounce(t2);
      mesh.position.set(
        THREE.MathUtils.lerp(settleStartRef.current.x, 0, settle2),
        THREE.MathUtils.lerp(settleStartRef.current.y, 0, bounce2),
        0
      );
      mesh.rotation.set(
        0,
        0,
        THREE.MathUtils.lerp(settleStartRef.current.rotation, 0, settle2)
      );
      if (t2 >= 1) {
        mesh.position.set(0, 0, 0);
        mesh.rotation.set(0, 0, 0);
        settleActiveRef.current = false;
      }
      return;
    }
    if (finishedRef.current) return;
    elapsedRef.current += Math.min(delta, 0.05);
    const fadeStart = motion.delay;
    if (elapsedRef.current < fadeStart) {
      mesh.visible = false;
      return;
    }
    mesh.visible = true;
    const appearProgress = THREE.MathUtils.clamp(
      (elapsedRef.current - fadeStart) / FRUIT_DROP_ANIMATION.appearDuration,
      0,
      1
    );
    material.opacity = easeOutCubic(appearProgress);
    if (material.alphaTest !== 0.02) {
      material.alphaTest = 0.02;
      material.needsUpdate = true;
    }
    if (!material.transparent) {
      material.transparent = true;
      material.needsUpdate = true;
    }
    if (elapsedRef.current < motion.delay) return;
    const t = THREE.MathUtils.clamp((elapsedRef.current - motion.delay) / motion.duration, 0, 1);
    const settle = easeOutCubic(t);
    const bounce = easeOutBounce(t);
    mesh.position.set(
      THREE.MathUtils.lerp(motion.startOffset[0], 0, settle),
      THREE.MathUtils.lerp(motion.startOffset[1], 0, bounce),
      0
    );
    mesh.rotation.set(
      0,
      0,
      THREE.MathUtils.lerp(motion.startRotation[2], 0, settle)
    );
    if (t >= 1) {
      mesh.position.set(0, 0, 0);
      mesh.rotation.set(0, 0, 0);
      material.opacity = 1;
      material.alphaTest = 0.5;
      material.transparent = false;
      material.needsUpdate = true;
      finishedRef.current = true;
    }
  });
  return /* @__PURE__ */ React.createElement("group", { position: targetPosition, rotation: targetRotation }, /* @__PURE__ */ React.createElement(
    "mesh",
    {
      ref: meshRef,
      position: motion.startOffset,
      rotation: motion.startRotation,
      visible: false,
      renderOrder: 20 + layer
    },
    /* @__PURE__ */ React.createElement("planeGeometry", { args: [planeSize, planeSize] }),
    /* @__PURE__ */ React.createElement(
      "meshBasicMaterial",
      {
        ref: materialRef,
        map: texture,
        transparent: true,
        opacity: 0,
        alphaTest: 0.02,
        depthTest: true,
        depthWrite: true,
        side: THREE.DoubleSide,
        toneMapped: false
      }
    )
  ));
}
function Apple3D({
  appleId,
  cellIndex,
  layout = DEFAULT_BOX_LAYOUT,
  boxSize = "M",
  animationKey = 0,
  settleKey = 0,
  exiting = false,
  exitDuration = FRUIT_DROP_ANIMATION.exitDuration
}) {
  const cell = layout.cells[cellIndex];
  const fruit = FRUIT_ITEMS[appleId];
  const texture = useAppleTexture(fruit.cutSrc);
  const defaultStylesBySize = {
    M: {
      planeTilt: -1.05,
      planeSize: 0.6,
      columnDepthStep: 8e-3,
      columns: [-0.32, -0.19, 0.1, 0.23],
      rotations: [-0.045, -0.018, 0.018, 0.045, -0.04, -0.012, 0.02, 0.05],
      rows: [
        // 屏幕上排：xShift 越小越靠左；z 越小越靠盒子深处。
        { y: 0.02, z: -0.12, xShift: -0.04 },
        // 屏幕下排：xShift 越大越靠右；z 越大越靠盒子开口，并遮住上排。
        { y: 0.07, z: 0.13, xShift: 0.1 }
      ]
    },
    L: {
      planeTilt: -1.05,
      planeSize: 0.6,
      columnDepthStep: 8e-3,
      columns: [-0.45, -0.32, -0.19, 0.1, 0.23, 0.36],
      rotations: [
        -0.055,
        -0.038,
        -0.018,
        0.018,
        0.038,
        0.055,
        -0.052,
        -0.035,
        -0.012,
        0.02,
        0.04,
        0.06
      ],
      rows: [
        { y: 0.02, z: -0.12, xShift: -0.02 },
        { y: 0.07, z: 0.13, xShift: 0.08 }
      ]
    },
    S: {
      planeTilt: -1.05,
      planeSize: 0.6,
      columnDepthStep: 8e-3,
      columns: [-0.13, 0, 0.13],
      rotations: [-0.035, 0, 0.035, -0.03, 6e-3, 0.04],
      rows: [
        { y: 0.02, z: -0.12, xShift: -0.02 },
        { y: 0.07, z: 0.13, xShift: 0.04 }
      ]
    }
  };
  const defaultStyle = defaultStylesBySize[boxSize] ?? defaultStylesBySize.M;
  const peachStylesBySize = {
    M: {
      planeTilt: -1.05,
      planeSize: 0.72,
      columnDepthStep: 8e-3,
      columns: [-0.34, -0.18, 0.08, 0.24],
      rotations: [-0.045, -0.018, 0.018, 0.045, -0.04, -0.012, 0.02, 0.05],
      rows: [
        { y: -0.02, z: -0.14, xShift: 0 },
        { y: 0.1, z: 0.18, xShift: 0.09 }
      ]
    },
    L: {
      planeTilt: -1.05,
      planeSize: 0.72,
      columnDepthStep: 8e-3,
      columns: [-0.44, -0.31, -0.18, 0.06, 0.19, 0.32],
      rotations: [
        -0.055,
        -0.04,
        -0.02,
        0.018,
        0.04,
        0.058,
        -0.052,
        -0.035,
        -0.014,
        0.02,
        0.042,
        0.06
      ],
      rows: [
        { y: -0.02, z: -0.14, xShift: 0.02 },
        { y: 0.1, z: 0.18, xShift: 0.07 }
      ]
    },
    S: {
      planeTilt: -1.05,
      planeSize: 0.72,
      columnDepthStep: 8e-3,
      columns: [-0.16, 0, 0.16],
      rotations: [-0.04, 0, 0.04, -0.035, 6e-3, 0.045],
      rows: [
        { y: -0.05, z: -0.06, xShift: -0.02 },
        { y: 0.08, z: 0.14, xShift: 0.04 }
      ]
    }
  };
  const peachStyle = peachStylesBySize[boxSize] ?? peachStylesBySize.M;
  const cherryGrapeStylesBySize = {
    M: {
      planeTilt: -1.05,
      planeSize: 0.34,
      cellContentCenterShift: 0.035,
      // 葡萄/樱桃组左右格子居中修正：数值越大，左格越往左、右格越往右。
      layoutPitchRotation: Math.PI / 12,
      // 樱桃/葡萄整组往前转角度：Math.PI / 9 约等于 20 度
      columnDepthStep: 6e-3,
      columns: [-0.46, -0.31, -0.1, 0.05, 0.26, 0.41],
      rotations: [
        -0.05,
        -0.025,
        -0.012,
        0.012,
        0.025,
        0.05,
        -0.045,
        -0.02,
        -8e-3,
        0.014,
        0.03,
        0.055,
        -0.04,
        -0.018,
        0,
        0.018,
        0.036,
        0.06
      ],
      rows: [
        { y: -0.08, z: -0.22, xShift: -0.01 },
        { y: 0, z: 0, xShift: 0.02 },
        { y: 0.08, z: 0.22, xShift: 0.05 }
      ]
    },
    L: {
      planeTilt: -1.05,
      planeSize: 0.34,
      cellContentCenterShift: 0.035,
      // 葡萄/樱桃组左右格子居中修正：数值越大，左格越往左、右格越往右。
      groupXShift: -0.035,
      // L 尺寸葡萄/樱桃整体左右位置：负数往左，正数往右。
      layoutPitchRotation: Math.PI / 12,
      columnDepthStep: 6e-3,
      columns: [-0.5, -0.39, -0.18, -0.07, 0.14, 0.25, 0.46, 0.57],
      rotations: [
        -0.06,
        -0.04,
        -0.026,
        -0.01,
        0.01,
        0.026,
        0.04,
        0.06,
        -0.055,
        -0.035,
        -0.022,
        -6e-3,
        0.012,
        0.03,
        0.046,
        0.064,
        -0.05,
        -0.03,
        -0.016,
        0,
        0.018,
        0.036,
        0.052,
        0.07
      ],
      rows: [
        { y: -0.08, z: -0.22, xShift: -0.02 },
        { y: 0, z: 0, xShift: 0.01 },
        { y: 0.08, z: 0.22, xShift: 0.04 }
      ]
    },
    S: {
      planeTilt: -1.05,
      planeSize: 0.34,
      cellContentCenterShift: 0.035,
      // 葡萄/樱桃组左右格子居中修正：数值越大，左格越往左、右格越往右。
      layoutPitchRotation: Math.PI / 12,
      columnDepthStep: 6e-3,
      columns: [-0.28, -0.13, 0.13, 0.28],
      rotations: [
        -0.04,
        -0.018,
        0.018,
        0.04,
        -0.036,
        -0.014,
        0.02,
        0.044,
        -0.032,
        -0.01,
        0.024,
        0.048
      ],
      rows: [
        { y: -0.06, z: -0.22, xShift: -0.01 },
        { y: 0, z: 0, xShift: 0.02 },
        { y: 0.06, z: 0.22, xShift: 0.05 }
      ]
    }
  };
  const cherryGrapeStyle = cherryGrapeStylesBySize[boxSize] ?? cherryGrapeStylesBySize.M;
  const mangoStylesBySize = {
    M: {
      planeTilt: -1.05,
      planeSize: 0.58,
      columnDepthStep: 0.01,
      columns: [-0.3, 0, 0.3],
      rotations: [-0.04, 0, 0.04, -0.03, 0.01, 0.05],
      rows: [
        { y: -0.07, z: -0.07, xShift: -0.02 },
        { y: 0.05, z: 0.12, xShift: 0.04 }
      ]
    },
    L: {
      planeTilt: -1.05,
      planeSize: 0.58,
      columnDepthStep: 0.01,
      columns: [-0.39, -0.13, 0.13, 0.39],
      rotations: [-0.05, -0.018, 0.018, 0.05, -0.04, -0.01, 0.024, 0.058],
      rows: [
        { y: -0.07, z: -0.07, xShift: -0.02 },
        { y: 0.05, z: 0.12, xShift: 0.04 }
      ]
    },
    S: {
      planeTilt: -1.05,
      planeSize: 0.58,
      columnDepthStep: 0.01,
      columns: [-0.16, 0.16],
      rotations: [-0.035, 0.035, -0.025, 0.045],
      rows: [
        { y: -0.04, z: -0.07, xShift: -0.02 },
        { y: 0.05, z: 0.12, xShift: 0.04 }
      ]
    }
  };
  const mangoStyle = mangoStylesBySize[boxSize] ?? mangoStylesBySize.M;
  const style = fruit.boxStyle === "peach" ? peachStyle : fruit.boxStyle === "cherryGrape" ? cherryGrapeStyle : fruit.boxStyle === "mango" ? mangoStyle : defaultStyle;
  const cellCenterShift = getCellContentCenterShift(
    cellIndex,
    layout,
    style.cellContentCenterShift ?? CELL_CONTENT_CENTER_SHIFT
  );
  const columnCount = style.columns.length;
  const rawPieces = style.rows.flatMap(
    (row, rowIndex) => style.columns.map((x, columnIndex) => ({
      x: x + row.xShift + (style.groupXShift ?? 0),
      y: row.y,
      // 每片增加少量真实前后间距来产生视差，renderOrder 固定重叠顺序。
      z: row.z + (columnCount - 1 - columnIndex) * style.columnDepthStep,
      rotation: style.rotations[rowIndex * columnCount + columnIndex] ?? 0,
      layer: rowIndex * columnCount + (columnCount - 1 - columnIndex)
    }))
  );
  const layoutPitchRotation = style.layoutPitchRotation ?? 0;
  const pitchCos = Math.cos(layoutPitchRotation);
  const pitchSin = Math.sin(layoutPitchRotation);
  const centerY = rawPieces.reduce((sum, piece) => sum + piece.y, 0) / rawPieces.length;
  const centerZ = rawPieces.reduce((sum, piece) => sum + piece.z, 0) / rawPieces.length;
  const pieces = rawPieces.map((piece) => {
    const dy = piece.y - centerY;
    const dz = piece.z - centerZ;
    return {
      ...piece,
      y: centerY + dy * pitchCos - dz * pitchSin,
      z: centerZ + dy * pitchSin + dz * pitchCos,
      planeTilt: style.planeTilt + layoutPitchRotation
    };
  });
  return /* @__PURE__ */ React.createElement("group", null, pieces.map((piece, index) => /* @__PURE__ */ React.createElement(
    AnimatedFruitPiece,
    {
      key: `${boxSize}-${index}`,
      targetPosition: [
        cell.x + cellCenterShift + piece.x,
        cell.y - 0.08 + piece.y,
        cell.z + piece.z
      ],
      targetRotation: [piece.planeTilt ?? style.planeTilt, 0, piece.rotation],
      planeSize: style.planeSize,
      texture,
      layer: piece.layer,
      pieceIndex: index,
      cellIndex,
      animationKey,
      settleKey,
      exiting,
      exitDuration
    }
  )));
}
function FruitSlot3D({
  appleId,
  cellIndex,
  layout = DEFAULT_BOX_LAYOUT,
  boxSize = "M",
  animationKey,
  settleKey = 0,
  forceExiting = false,
  forceExitDuration = FRUIT_DROP_ANIMATION.exitDuration
}) {
  const [displayedFruit, setDisplayedFruit] = useState({ appleId, animationKey });
  const [exiting, setExiting] = useState(false);
  useEffect(() => {
    if (displayedFruit.appleId === appleId && displayedFruit.animationKey === animationKey) {
      setExiting(false);
      return void 0;
    }
    setExiting(true);
    const timer = setTimeout(() => {
      setDisplayedFruit({ appleId, animationKey });
      setExiting(false);
    }, FRUIT_DROP_ANIMATION.exitDuration * 1e3);
    return () => clearTimeout(timer);
  }, [appleId, animationKey, displayedFruit.appleId, displayedFruit.animationKey]);
  return /* @__PURE__ */ React.createElement(
    Apple3D,
    {
      appleId: displayedFruit.appleId,
      cellIndex,
      layout,
      boxSize,
      animationKey: displayedFruit.animationKey,
      settleKey,
      exiting: exiting || forceExiting,
      exitDuration: forceExiting ? forceExitDuration : FRUIT_DROP_ANIMATION.exitDuration
    }
  );
}

// src/three/BoxOverlays.jsx
import * as React2 from "react";
import { useFrame as useFrame2, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE2 from "three";
var { useMemo: useMemo2, useEffect: useEffect2, useRef: useRef2, useState: useState2 } = React2;
function RoundButton3D({
  position,
  onClick,
  background = "#ffffff",
  color = "#111111",
  scale = 0.14,
  visible = true,
  hideDelay = CELL_CLOSE_HOVER_HIDE_DELAY,
  dismissDamp = CELL_CLOSE_HOVER_DISMISS_DAMP
}) {
  const spriteRef = useRef2(null);
  const progressRef = useRef2(0);
  const hideTimerRef = useRef2(null);
  const [delayedVisible, setDelayedVisible] = useState2(false);
  const texture = useMemo2(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, 256, 256);
    ctx.beginPath();
    ctx.arc(128, 128, 80, 0, Math.PI * 2);
    ctx.fillStyle = background;
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 10;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(106, 106);
    ctx.lineTo(150, 150);
    ctx.moveTo(150, 106);
    ctx.lineTo(106, 150);
    ctx.stroke();
    const map = new THREE2.CanvasTexture(canvas);
    map.colorSpace = THREE2.SRGBColorSpace;
    map.premultiplyAlpha = true;
    map.minFilter = THREE2.LinearFilter;
    map.magFilter = THREE2.LinearFilter;
    map.generateMipmaps = false;
    map.needsUpdate = true;
    return map;
  }, [background, color]);
  useEffect2(() => () => texture.dispose(), [texture]);
  useEffect2(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    if (visible) {
      setDelayedVisible(true);
      return void 0;
    }
    hideTimerRef.current = setTimeout(() => {
      setDelayedVisible(false);
      hideTimerRef.current = null;
    }, hideDelay);
    return () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
    };
  }, [visible, hideDelay]);
  useFrame2((_, delta) => {
    const target = delayedVisible ? 1 : 0;
    const next = THREE2.MathUtils.damp(progressRef.current, target, dismissDamp, delta);
    progressRef.current = Math.abs(next - target) < 3e-3 ? target : next;
    const progress = progressRef.current;
    if (spriteRef.current) {
      spriteRef.current.visible = delayedVisible || progress > 0.01;
      const currentScale = Math.max(1e-3, scale * progress);
      spriteRef.current.scale.set(currentScale, currentScale, 1);
    }
  });
  return /* @__PURE__ */ React2.createElement(
    "sprite",
    {
      ref: spriteRef,
      position,
      scale: [1e-3, 1e-3, 1],
      onClick: (e) => {
        e.stopPropagation();
        if (delayedVisible) onClick();
      },
      onPointerOver: (e) => {
        e.stopPropagation();
        if (!delayedVisible) return;
        document.body.style.cursor = "pointer";
      },
      onPointerOut: () => {
        document.body.style.cursor = "default";
      }
    },
    /* @__PURE__ */ React2.createElement(
      "spriteMaterial",
      {
        map: texture,
        transparent: true,
        premultipliedAlpha: true,
        alphaTest: 0.35,
        depthTest: true,
        depthWrite: true,
        toneMapped: false
      }
    )
  );
}
function CloseButton3D({ position, onRemove, visible, hideDelay, dismissDamp }) {
  return /* @__PURE__ */ React2.createElement(
    RoundButton3D,
    {
      position,
      onClick: onRemove,
      scale: 0.15,
      visible,
      hideDelay,
      dismissDamp
    }
  );
}
function ModelAlignedHtml({
  position,
  center = false,
  transformOrigin = "center center",
  axis = "x",
  maxTilt = null,
  style,
  children
}) {
  const anchorRef = useRef2(null);
  const contentRef = useRef2(null);
  const origin = useMemo2(() => new THREE2.Vector3(), []);
  const axisPoint = useMemo2(() => new THREE2.Vector3(), []);
  const lastAngleRef = useRef2(null);
  useFrame2(({ camera, size }) => {
    if (!anchorRef.current || !contentRef.current) return;
    anchorRef.current.updateWorldMatrix(true, false);
    origin.set(0, 0, 0).applyMatrix4(anchorRef.current.matrixWorld).project(camera);
    if (axis === "z") {
      axisPoint.set(0, 0, 1);
    } else if (axis === "y") {
      axisPoint.set(0, 1, 0);
    } else {
      axisPoint.set(1, 0, 0);
    }
    axisPoint.applyMatrix4(anchorRef.current.matrixWorld).project(camera);
    const dx = (axisPoint.x - origin.x) * size.width * 0.5;
    const dy = -(axisPoint.y - origin.y) * size.height * 0.5;
    const rawAngle = Math.atan2(dy, dx) * 180 / Math.PI;
    const angle = maxTilt == null ? rawAngle : THREE2.MathUtils.clamp(rawAngle, -maxTilt, maxTilt);
    if (lastAngleRef.current == null || Math.abs(angle - lastAngleRef.current) > 1e-3) {
      contentRef.current.style.transform = `rotate(${angle}deg)`;
      lastAngleRef.current = angle;
    }
  });
  return /* @__PURE__ */ React2.createElement("group", { ref: anchorRef, position }, /* @__PURE__ */ React2.createElement(Html, { center, style }, /* @__PURE__ */ React2.createElement("div", { ref: contentRef, style: { transformOrigin } }, children)));
}
function CellInfoLabel3D({
  position,
  appleId,
  visible,
  hideDelay = CELL_INFO_HOVER_HIDE_DELAY,
  transitionMs = CELL_INFO_HOVER_TRANSITION_MS
}) {
  const fruit = FRUIT_ITEMS[appleId];
  const hideTimerRef = useRef2(null);
  const [delayedVisible, setDelayedVisible] = useState2(false);
  useEffect2(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    if (visible) {
      setDelayedVisible(true);
      return void 0;
    }
    hideTimerRef.current = setTimeout(() => {
      setDelayedVisible(false);
      hideTimerRef.current = null;
    }, hideDelay);
    return () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
    };
  }, [visible, hideDelay]);
  return /* @__PURE__ */ React2.createElement(
    ModelAlignedHtml,
    {
      position,
      transformOrigin: "left center",
      style: { pointerEvents: "none" }
    },
    /* @__PURE__ */ React2.createElement(
      "div",
      {
        style: {
          opacity: delayedVisible ? 1 : 0,
          transition: `opacity ${transitionMs}ms cubic-bezier(.16,1,.3,1)`,
          color: "#111111",
          font: "12px/1.2 -apple-system, BlinkMacSystemFont, sans-serif",
          letterSpacing: 0,
          whiteSpace: "nowrap",
          textAlign: "left"
        }
      },
      fruit.name,
      " 200g"
    )
  );
}
function BoxNoticeLabel3D({ layout = DEFAULT_BOX_LAYOUT, noticeLabel = BOX_NOTICE_LABEL_DEFAULT }) {
  const gl = useThree((state) => state.gl);
  const texture = useMemo2(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 2048;
    canvas.height = 672;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#ffffff";
    ctx.font = "400 110px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.textBaseline = "top";
    ["\u203B\u753B\u50CF\u306F\u30A4\u30E1\u30FC\u30B8\u3067\u3059\u3002", "\u30D5\u30EB\u30FC\u30C4\u306E\u30AB\u30C3\u30C8\u6570\u306F", "\u91CD\u91CF\u306B\u5FDC\u3058\u3066\u7570\u306A\u308A\u307E\u3059\u3002"].forEach((line, index) => ctx.fillText(line, 44, 40 + index * 176));
    const map = new THREE2.CanvasTexture(canvas);
    map.minFilter = THREE2.LinearMipmapLinearFilter;
    map.magFilter = THREE2.LinearFilter;
    map.generateMipmaps = true;
    map.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy());
    map.needsUpdate = true;
    return map;
  }, [gl]);
  useEffect2(() => () => texture.dispose(), [texture]);
  return /* @__PURE__ */ React2.createElement(
    "mesh",
    {
      position: [
        noticeLabel.x,
        noticeLabel.y,
        layout.boxD / 2 + noticeLabel.zOffset
      ],
      renderOrder: 20
    },
    /* @__PURE__ */ React2.createElement("planeGeometry", { args: [noticeLabel.width, noticeLabel.height] }),
    /* @__PURE__ */ React2.createElement(
      "meshBasicMaterial",
      {
        alphaMap: texture,
        color: BOX_NOTICE_TEXT_COLOR,
        opacity: BOX_NOTICE_TEXT_OPACITY,
        transparent: true,
        alphaTest: 0.012,
        depthWrite: false,
        toneMapped: false,
        side: THREE2.DoubleSide
      }
    )
  );
}
function ReplaceButton3D({ position, onReplace, visible, animationKey }) {
  const [shown, setShown] = useState2(false);
  const [exiting, setExiting] = useState2(false);
  const frameRef = useRef2(null);
  const timerRef = useRef2(null);
  useEffect2(() => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    if (timerRef.current) clearTimeout(timerRef.current);
    setExiting(false);
    if (!visible) {
      setShown(false);
      return void 0;
    }
    setShown(false);
    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = requestAnimationFrame(() => setShown(true));
    });
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [visible, animationKey]);
  const active = visible && shown && !exiting;
  return /* @__PURE__ */ React2.createElement(
    ModelAlignedHtml,
    {
      position,
      center: true,
      style: { pointerEvents: "none" }
    },
    /* @__PURE__ */ React2.createElement(
      "div",
      {
        style: {
          transform: active ? "scale(1)" : "scale(0.001)",
          transition: "transform 180ms cubic-bezier(.2,.85,.2,1.08)",
          transformOrigin: "center center",
          pointerEvents: active ? "auto" : "none"
        }
      },
      /* @__PURE__ */ React2.createElement(
        "button",
        {
          type: "button",
          "aria-label": "\u3053\u306E\u679C\u7269\u3068\u5165\u308C\u66FF\u3048",
          onPointerDown: (e) => e.stopPropagation(),
          onClick: (e) => {
            e.stopPropagation();
            if (!active) return;
            setExiting(true);
            timerRef.current = setTimeout(onReplace, 130);
          },
          style: {
            width: 78,
            height: 28,
            padding: 0,
            border: 0,
            borderRadius: 999,
            background: "#111111",
            color: "#ffffff",
            boxShadow: "none",
            display: "grid",
            placeItems: "center",
            font: "500 12px/1 -apple-system, BlinkMacSystemFont, sans-serif",
            letterSpacing: 0,
            whiteSpace: "nowrap",
            cursor: "pointer",
            pointerEvents: "auto"
          }
        },
        "\u5165\u308C\u66FF\u3048"
      )
    )
  );
}
function CancelReplacementButton3D({ position, onCancel, visible }) {
  return /* @__PURE__ */ React2.createElement(Html, { position, center: true, style: { pointerEvents: "none" } }, /* @__PURE__ */ React2.createElement(
    "div",
    {
      style: {
        transform: visible ? "scale(1)" : "scale(0.001)",
        transition: "transform 220ms cubic-bezier(.2,.85,.2,1.12)",
        transformOrigin: "center center",
        pointerEvents: visible ? "auto" : "none"
      }
    },
    /* @__PURE__ */ React2.createElement(
      "button",
      {
        type: "button",
        "aria-label": "\u5165\u308C\u66FF\u3048\u3092\u30AD\u30E3\u30F3\u30BB\u30EB",
        onPointerDown: (e) => e.stopPropagation(),
        onClick: (e) => {
          e.stopPropagation();
          if (visible) onCancel();
        },
        style: {
          width: 20,
          height: 20,
          padding: 0,
          border: 0,
          borderRadius: "50%",
          background: "#111111",
          color: "#ffffff",
          boxShadow: "none",
          display: "grid",
          placeItems: "center",
          letterSpacing: 0,
          cursor: "pointer",
          pointerEvents: "auto"
        }
      },
      /* @__PURE__ */ React2.createElement("span", { style: { position: "relative", width: 9, height: 9, display: "block" } }, /* @__PURE__ */ React2.createElement(
        "span",
        {
          style: {
            position: "absolute",
            left: 3.8,
            top: 0,
            width: 1.4,
            height: 9,
            borderRadius: 999,
            background: "#ffffff",
            transform: "rotate(45deg)"
          }
        }
      ), /* @__PURE__ */ React2.createElement(
        "span",
        {
          style: {
            position: "absolute",
            left: 3.8,
            top: 0,
            width: 1.4,
            height: 9,
            borderRadius: 999,
            background: "#ffffff",
            transform: "rotate(-45deg)"
          }
        }
      ))
    )
  ));
}
function BoxActionPill({ variant, label, icon, onClick, visible }) {
  const hideTimerRef = useRef2(null);
  const expandTimerRef = useRef2(null);
  const collapseTimerRef = useRef2(null);
  const clickTimerRef = useRef2(null);
  const [delayedVisible, setDelayedVisible] = useState2(false);
  const [expanded, setExpanded] = useState2(false);
  const [clickMotionKey, setClickMotionKey] = useState2(0);
  const clearHoverTimers = () => {
    if (expandTimerRef.current) {
      clearTimeout(expandTimerRef.current);
      expandTimerRef.current = null;
    }
    if (collapseTimerRef.current) {
      clearTimeout(collapseTimerRef.current);
      collapseTimerRef.current = null;
    }
  };
  useEffect2(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    if (visible) {
      setDelayedVisible(true);
      return void 0;
    }
    clearHoverTimers();
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
    }
    hideTimerRef.current = setTimeout(() => {
      setExpanded(false);
      setDelayedVisible(false);
      hideTimerRef.current = null;
    }, BOX_ACTION_HIDE_START_DELAY);
    return () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
    };
  }, [visible]);
  useEffect2(() => () => {
    clearHoverTimers();
    if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
  }, []);
  const isDark = variant === "dark";
  return /* @__PURE__ */ React2.createElement(
    "button",
    {
      type: "button",
      "aria-label": label,
      onPointerDown: (e) => e.stopPropagation(),
      onClick: (e) => {
        e.stopPropagation();
        if (!visible || !delayedVisible) return;
        clearHoverTimers();
        if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
        setExpanded(false);
        setClickMotionKey((key) => key + 1);
        onClick();
        clickTimerRef.current = setTimeout(() => {
          clickTimerRef.current = null;
        }, BOX_ACTION_CLICK_SPIN_MS);
      },
      style: {
        "--closed-width": "24px",
        "--open-width": isDark ? "116px" : "74px",
        width: expanded ? "var(--open-width)" : "var(--closed-width)",
        height: 24,
        padding: 0,
        border: isDark ? "0 solid #111111" : "1.25px solid #111111",
        borderRadius: 999,
        background: isDark ? "#111111" : "transparent",
        color: isDark ? "#ffffff" : "#111111",
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        gap: 5,
        overflow: "hidden",
        cursor: visible && delayedVisible ? "pointer" : "default",
        pointerEvents: visible && delayedVisible ? "auto" : "none",
        transform: delayedVisible ? "scale(1)" : "scale(0.001)",
        // 圆形图标宽 24px：以 x=12px 的圆心缩放；宽度展开仍然从左边向右。
        transformOrigin: "12px center",
        transition: `width ${BOX_ACTION_WIDTH_TRANSITION_MS}ms ${BOX_ACTION_EASING}, transform ${BOX_ACTION_SCALE_TRANSITION_MS}ms ${BOX_ACTION_EASING}`,
        boxShadow: "none",
        letterSpacing: 0,
        WebkitTapHighlightColor: "transparent"
      },
      onPointerEnter: () => {
        if (!visible || !delayedVisible) return;
        clearHoverTimers();
        expandTimerRef.current = setTimeout(() => {
          setExpanded(true);
          expandTimerRef.current = null;
        }, BOX_ACTION_HOVER_OPEN_DELAY);
      },
      onPointerLeave: () => {
        if (expandTimerRef.current) {
          clearTimeout(expandTimerRef.current);
          expandTimerRef.current = null;
        }
        if (collapseTimerRef.current) clearTimeout(collapseTimerRef.current);
        collapseTimerRef.current = setTimeout(() => {
          setExpanded(false);
          collapseTimerRef.current = null;
        }, BOX_ACTION_HOVER_CLOSE_DELAY);
      }
    },
    /* @__PURE__ */ React2.createElement(
      "span",
      {
        key: clickMotionKey,
        "aria-hidden": "true",
        style: {
          width: isDark ? 24 : 22,
          height: isDark ? 24 : 22,
          flex: `0 0 ${isDark ? 24 : 22}px`,
          display: "grid",
          placeItems: "center",
          position: "relative",
          animation: clickMotionKey === 0 ? "none" : `boxActionIconSpin ${BOX_ACTION_CLICK_SPIN_MS}ms cubic-bezier(.18,.88,.18,1)`
        }
      },
      icon === "plus" ? /* @__PURE__ */ React2.createElement(React2.Fragment, null, /* @__PURE__ */ React2.createElement("span", { style: { position: "absolute", width: 9, height: 1.45, borderRadius: 999, background: "#ffffff" } }), /* @__PURE__ */ React2.createElement("span", { style: { position: "absolute", width: 1.45, height: 9, borderRadius: 999, background: "#ffffff" } })) : /* @__PURE__ */ React2.createElement(React2.Fragment, null, /* @__PURE__ */ React2.createElement("span", { style: { position: "absolute", width: 10, height: 1.45, borderRadius: 999, background: "#111111", transform: "rotate(45deg)" } }), /* @__PURE__ */ React2.createElement("span", { style: { position: "absolute", width: 10, height: 1.45, borderRadius: 999, background: "#111111", transform: "rotate(-45deg)" } }))
    ),
    /* @__PURE__ */ React2.createElement(
      "span",
      {
        style: {
          flex: "0 0 auto",
          font: "450 10.5px/1 -apple-system, BlinkMacSystemFont, sans-serif",
          whiteSpace: "nowrap",
          transform: "translateX(-1px)",
          paddingRight: isDark ? 9 : 7
        }
      },
      label
    )
  );
}
function BoxActionButtonAnchor({ position, variant, icon, label, visible, onClick }) {
  return /* @__PURE__ */ React2.createElement(Html, { position, style: { pointerEvents: "none" } }, /* @__PURE__ */ React2.createElement("div", { style: { transform: "translate(-12px, -12px)", pointerEvents: "none" } }, /* @__PURE__ */ React2.createElement(
    BoxActionPill,
    {
      variant,
      icon,
      label,
      visible,
      onClick
    }
  )));
}
function BoxActionButtons3D({
  layout = DEFAULT_BOX_LAYOUT,
  visible,
  onClear,
  onAddToCart,
  cartLabel = "\u30AB\u30FC\u30C8\u306B\u5165\u308C\u308B"
}) {
  const actionX = layout.boxW / 2 + 0.28;
  const actionY = layout.cellY + 0.08;
  const firstZ = layout.backZ - 0.45;
  const buttonGapZ = 0.19;
  return /* @__PURE__ */ React2.createElement(React2.Fragment, null, /* @__PURE__ */ React2.createElement(
    BoxActionButtonAnchor,
    {
      position: [actionX, actionY, firstZ],
      variant: "outline",
      icon: "x",
      label: "\u30AF\u30EA\u30A2",
      visible,
      onClick: onClear
    }
  ), /* @__PURE__ */ React2.createElement(
    BoxActionButtonAnchor,
    {
      position: [actionX, actionY, firstZ + buttonGapZ],
      variant: "dark",
      icon: "plus",
      label: cartLabel,
      visible,
      onClick: onAddToCart
    }
  ));
}
function CellHoverTargets({ layout = DEFAULT_BOX_LAYOUT, onHoverCell }) {
  return layout.cells.map((cell, cellIndex) => /* @__PURE__ */ React2.createElement(
    "mesh",
    {
      key: cellIndex,
      position: [cell.x, layout.boxH / 2 + 0.08, cell.z],
      rotation: [-Math.PI / 2, 0, 0],
      onPointerMove: () => onHoverCell(cellIndex),
      onPointerOut: () => onHoverCell(null)
    },
    /* @__PURE__ */ React2.createElement("planeGeometry", { args: [layout.holeW * 0.94, layout.holeD * 0.94] }),
    /* @__PURE__ */ React2.createElement(
      "meshBasicMaterial",
      {
        transparent: true,
        opacity: 0,
        colorWrite: false,
        depthWrite: false,
        side: THREE2.DoubleSide
      }
    )
  ));
}
function BoxScreenTracker({ groupRef, screenRef, layout = DEFAULT_BOX_LAYOUT }) {
  useFrame2(({ camera, size }) => {
    if (!groupRef.current) return;
    const toScreen = (worldPos) => {
      const clip = worldPos.clone().project(camera);
      return {
        x: (clip.x + 1) / 2 * size.width,
        y: (-clip.y + 1) / 2 * size.height
      };
    };
    groupRef.current.updateWorldMatrix(true, false);
    const projectedCells = layout.cells.map((cell) => {
      const cellWorld = new THREE2.Vector3(cell.x, cell.y, cell.z);
      groupRef.current.localToWorld(cellWorld);
      return toScreen(cellWorld);
    });
    const outerCorners = [];
    for (const x of [-layout.boxW / 2 - 0.08, layout.boxW / 2 + 0.08]) {
      for (const y of [-layout.boxH / 2, layout.boxH / 2 + 0.08]) {
        for (const z of [-layout.boxD / 2 - 0.08, layout.boxD / 2 + 0.08]) {
          const corner = new THREE2.Vector3(x, y, z);
          groupRef.current.localToWorld(corner);
          outerCorners.push(toScreen(corner));
        }
      }
    }
    const xs = outerCorners.map((point) => point.x);
    const ys = outerCorners.map((point) => point.y);
    const bounds = {
      centerX: projectedCells.reduce((sum, cell) => sum + cell.x, 0) / 4,
      centerY: projectedCells.reduce((sum, cell) => sum + cell.y, 0) / 4,
      minX: Math.min(...xs),
      maxX: Math.max(...xs),
      minY: Math.min(...ys),
      maxY: Math.max(...ys)
    };
    screenRef.current = bounds;
  });
  return null;
}

// src/three/GlassBox.jsx
import * as React3 from "react";
import { useFrame as useFrame3, useThree as useThree2 } from "@react-three/fiber";
import { MeshTransmissionMaterial } from "@react-three/drei";
import { Geometry, Base, Subtraction, Addition } from "@react-three/csg";
import { RoundedBoxGeometry } from "three-stdlib";
var { useMemo: useMemo3, useEffect: useEffect3, useRef: useRef3 } = React3;
function useTaperedBox(width, height, depth, radius, topScale, yOffset, xOffset, zOffset) {
  return useMemo3(() => {
    const g = new RoundedBoxGeometry(width, height, depth, 4, radius);
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const localY = pos.getY(i);
      const absoluteY = localY + yOffset;
      const normalizedY = absoluteY + 0.5;
      const scale = 1 + normalizedY * (topScale - 1);
      const localX = pos.getX(i);
      const absoluteX = localX + xOffset;
      pos.setX(i, absoluteX * scale - xOffset);
      const localZ = pos.getZ(i);
      const absoluteZ = localZ + zOffset;
      pos.setZ(i, absoluteZ * scale - zOffset);
    }
    g.computeVertexNormals();
    return g;
  }, [width, height, depth, radius, topScale, yOffset, xOffset, zOffset]);
}
function GlassCube({ layout = DEFAULT_BOX_LAYOUT, transmission, roughness, ior, rotationX, glassColor, attenuationColor, envMapIntensity, children }) {
  const taperScale = 1.05;
  const boxW = layout.boxW, boxH = layout.boxH, boxD = layout.boxD;
  const rad = 0.15, wall = layout.wall;
  const holeW = (boxW - 3 * wall) / 2;
  const holeD = (boxD - 3 * wall) / 2;
  const holeH = 1;
  const innerRad = 0.1;
  const leftX = -boxW / 2 + wall + holeW / 2;
  const rightX = -leftX;
  const frontZ = boxD / 2 - wall - holeD / 2;
  const backZ = -frontZ;
  const baseGeom = useTaperedBox(boxW, boxH, boxD, rad, taperScale, 0, 0, 0);
  const rimGeom = useTaperedBox(boxW + 0.15, 0.08, boxD + 0.15, rad, taperScale, 0.46, 0, 0);
  const holeGeom1 = useTaperedBox(holeW, holeH, holeD, innerRad, taperScale, 0.15, leftX, backZ);
  const holeGeom2 = useTaperedBox(holeW, holeH, holeD, innerRad, taperScale, 0.15, rightX, backZ);
  const holeGeom3 = useTaperedBox(holeW, holeH, holeD, innerRad, taperScale, 0.15, leftX, frontZ);
  const holeGeom4 = useTaperedBox(holeW, holeH, holeD, innerRad, taperScale, 0.15, rightX, frontZ);
  return /* @__PURE__ */ React3.createElement("mesh", { position: [0, 0, 0] }, /* @__PURE__ */ React3.createElement(Geometry, { computeVertexNormals: true }, /* @__PURE__ */ React3.createElement(Base, null, /* @__PURE__ */ React3.createElement("primitive", { object: baseGeom, attach: "geometry" })), /* @__PURE__ */ React3.createElement(Addition, { position: [0, 0.46, 0] }, /* @__PURE__ */ React3.createElement("primitive", { object: rimGeom, attach: "geometry" })), /* @__PURE__ */ React3.createElement(Subtraction, { position: [leftX, 0.15, backZ] }, /* @__PURE__ */ React3.createElement("primitive", { object: holeGeom1, attach: "geometry" })), /* @__PURE__ */ React3.createElement(Subtraction, { position: [rightX, 0.15, backZ] }, /* @__PURE__ */ React3.createElement("primitive", { object: holeGeom2, attach: "geometry" })), /* @__PURE__ */ React3.createElement(Subtraction, { position: [leftX, 0.15, frontZ] }, /* @__PURE__ */ React3.createElement("primitive", { object: holeGeom3, attach: "geometry" })), /* @__PURE__ */ React3.createElement(Subtraction, { position: [rightX, 0.15, frontZ] }, /* @__PURE__ */ React3.createElement("primitive", { object: holeGeom4, attach: "geometry" }))), /* @__PURE__ */ React3.createElement(
    MeshTransmissionMaterial,
    {
      backside: true,
      backsideThickness: 3,
      thickness: 2.1,
      chromaticAberration: 0.02,
      anisotropicBlur: 0.2,
      roughness,
      ior,
      clearcoat: 1,
      clearcoatRoughness: 0.1,
      color: glassColor,
      attenuationColor,
      attenuationDistance: 3.8,
      transmission: transmission * 0.9,
      transparent: true,
      opacity: 1,
      distortion: 0.3,
      distortionScale: 0.4,
      resolution: 1024,
      envMapIntensity
    }
  ), children);
}
function AutoReturn({ initialAzimuth = 0, initialPolar = Math.atan2(8, 3), easeSpeed = 0.06 }) {
  const controls = useThree2((state) => state.controls);
  const draggingRef = useRef3(false);
  useEffect3(() => {
    if (!controls) return;
    const onStart = () => {
      draggingRef.current = true;
    };
    const onEnd = () => {
      draggingRef.current = false;
    };
    controls.addEventListener("start", onStart);
    controls.addEventListener("end", onEnd);
    return () => {
      controls.removeEventListener("start", onStart);
      controls.removeEventListener("end", onEnd);
    };
  }, [controls]);
  useFrame3(() => {
    if (!controls || draggingRef.current) return;
    const curAz = controls.getAzimuthalAngle();
    const curPo = controls.getPolarAngle();
    const dAz = initialAzimuth - curAz;
    const dPo = initialPolar - curPo;
    if (Math.abs(dAz) < 1e-3 && Math.abs(dPo) < 1e-3) return;
    controls.setAzimuthalAngle(curAz + dAz * easeSpeed);
    controls.setPolarAngle(curPo + dPo * easeSpeed);
    controls.update();
  });
  return null;
}
function ViewOffset({ shift = 0.2, shiftX = 0 }) {
  const { camera, size } = useThree2();
  useEffect3(() => {
    if (typeof camera.setViewOffset !== "function") return;
    camera.setViewOffset(
      size.width,
      size.height * (1 + shift),
      shiftX,
      -size.height * shift,
      size.width,
      size.height
    );
    return () => camera.clearViewOffset();
  }, [camera, size.width, size.height, shift, shiftX]);
  return null;
}

// src/components/BoxScene.jsx
var { Suspense } = React4;
function BoxScene({
  displayedScreenShift,
  cartContentOffset,
  lightIntensity,
  sizeShakeOffsetY,
  groupRef,
  rotationX,
  sizeSpinAngle,
  selectedBoxLayout,
  transmission,
  roughness,
  ior,
  glassColor,
  attenuationColor,
  envMapIntensity,
  selectedNoticeLabel,
  setHoveredCell,
  placedFruits,
  sizeSpinFruitPhase,
  selectedSize,
  sizeShakeFruitKey,
  cartTransfer,
  selectedCellUiOffsets,
  replacementFruitId,
  modelDragging,
  sizeTransitionActive,
  hoveredCell,
  replacementMotionKey,
  unsnapApple,
  replaceFruitInCell,
  cancelReplacement,
  clearAllFruits,
  addBoxToCart,
  cartEditSession,
  boxScreenRef,
  setModelDragging,
  rotateLeftRightLimit,
  defaultPolarAngle,
  rotateUpLimit,
  rotateDownLimit
}) {
  return /* @__PURE__ */ React4.createElement(Canvas, { camera: { position: [0, 3, 8], fov: 45 } }, /* @__PURE__ */ React4.createElement(ViewOffset, { shift: displayedScreenShift, shiftX: cartContentOffset }), /* @__PURE__ */ React4.createElement("color", { attach: "background", args: ["#F7F8FA"] }), /* @__PURE__ */ React4.createElement("ambientLight", { intensity: lightIntensity * 0.25 }), /* @__PURE__ */ React4.createElement("directionalLight", { position: [10, 10, 5], intensity: lightIntensity, castShadow: true }), /* @__PURE__ */ React4.createElement("spotLight", { position: [-10, 10, -10], angle: 0.3, penumbra: 1, intensity: lightIntensity * 0.6, color: "#e0eaff" }), /* @__PURE__ */ React4.createElement(Suspense, { fallback: null }, /* @__PURE__ */ React4.createElement("group", { position: [0, sizeShakeOffsetY, 0] }, /* @__PURE__ */ React4.createElement(
    "group",
    {
      ref: groupRef,
      rotation: [rotationX + sizeSpinAngle, 0, 0],
      scale: 1.55
    },
    /* @__PURE__ */ React4.createElement(
      GlassCube,
      {
        key: `glass-${selectedSize.size}`,
        layout: selectedBoxLayout,
        transmission,
        roughness,
        ior,
        glassColor,
        attenuationColor,
        envMapIntensity
      },
      /* @__PURE__ */ React4.createElement(BoxNoticeLabel3D, { layout: selectedBoxLayout, noticeLabel: selectedNoticeLabel })
    ),
    /* @__PURE__ */ React4.createElement(CellHoverTargets, { layout: selectedBoxLayout, onHoverCell: setHoveredCell }),
    placedFruits.map((a) => /* @__PURE__ */ React4.createElement("group", { key: a.id }, sizeSpinFruitPhase !== "hidden" ? /* @__PURE__ */ React4.createElement(
      FruitSlot3D,
      {
        appleId: a.appleId,
        cellIndex: a.cell,
        layout: selectedBoxLayout,
        boxSize: selectedSize.size,
        animationKey: a.motionKey,
        settleKey: sizeShakeFruitKey,
        forceExiting: sizeSpinFruitPhase === "fading" || cartTransfer != null,
        forceExitDuration: cartTransfer ? CART_TRANSFER_CLEAR_DELAY_MS / 1e3 : SIZE_SPIN_FRUIT_ANIMATION.fadeDuration
      }
    ) : null, /* @__PURE__ */ React4.createElement(
      CellInfoLabel3D,
      {
        position: [
          selectedBoxLayout.cells[a.cell].x + getCellContentCenterShift(a.cell, selectedBoxLayout) + selectedCellUiOffsets.info.x,
          selectedBoxLayout.cells[a.cell].y + selectedCellUiOffsets.info.y,
          selectedBoxLayout.cells[a.cell].z + selectedCellUiOffsets.info.z
        ],
        appleId: a.appleId,
        visible: replacementFruitId == null && !modelDragging && !sizeTransitionActive && hoveredCell === a.cell,
        hideDelay: modelDragging ? CELL_INFO_PRESS_HIDE_DELAY : CELL_INFO_HOVER_HIDE_DELAY,
        transitionMs: modelDragging ? CELL_INFO_PRESS_TRANSITION_MS : CELL_INFO_HOVER_TRANSITION_MS
      }
    ), /* @__PURE__ */ React4.createElement(
      CloseButton3D,
      {
        position: [
          selectedBoxLayout.cells[a.cell].x + selectedCellUiOffsets.close.x,
          selectedBoxLayout.cells[a.cell].y + selectedCellUiOffsets.close.y,
          selectedBoxLayout.cells[a.cell].z + selectedCellUiOffsets.close.z
        ],
        visible: replacementFruitId == null && !modelDragging && !sizeTransitionActive && hoveredCell === a.cell,
        hideDelay: modelDragging ? PRESS_HIDE_START_DELAY : CELL_CLOSE_HOVER_HIDE_DELAY,
        dismissDamp: modelDragging ? PRESS_ROUND_BUTTON_DISMISS_DAMP : CELL_CLOSE_HOVER_DISMISS_DAMP,
        onRemove: () => unsnapApple(a.id)
      }
    ), /* @__PURE__ */ React4.createElement(
      ReplaceButton3D,
      {
        position: [
          selectedBoxLayout.cells[a.cell].x + getCellContentCenterShift(a.cell, selectedBoxLayout),
          selectedBoxLayout.cells[a.cell].y + 0.1,
          selectedBoxLayout.cells[a.cell].z - 0.02
        ],
        visible: replacementFruitId != null,
        animationKey: replacementMotionKey,
        onReplace: () => replaceFruitInCell(a.cell)
      }
    ))),
    /* @__PURE__ */ React4.createElement(
      CancelReplacementButton3D,
      {
        position: [selectedBoxLayout.rightX + 0.56, selectedBoxLayout.cellY + 0.08, selectedBoxLayout.backZ - 0.32],
        visible: replacementFruitId != null,
        onCancel: cancelReplacement
      }
    ),
    /* @__PURE__ */ React4.createElement(
      BoxActionButtons3D,
      {
        layout: selectedBoxLayout,
        visible: !modelDragging,
        onClear: clearAllFruits,
        onAddToCart: addBoxToCart,
        cartLabel: cartEditSession ? "\u5909\u66F4\u3092\u4FDD\u5B58" : "\u30AB\u30FC\u30C8\u306B\u5165\u308C\u308B"
      }
    )
  )), /* @__PURE__ */ React4.createElement(BoxScreenTracker, { groupRef, screenRef: boxScreenRef, layout: selectedBoxLayout }), /* @__PURE__ */ React4.createElement(AutoReturn, { easeSpeed: 0.15 }), /* @__PURE__ */ React4.createElement(Environment, { preset: "warehouse" })), /* @__PURE__ */ React4.createElement(
    OrbitControls,
    {
      enablePan: false,
      enableZoom: false,
      onStart: () => setModelDragging(true),
      onEnd: () => {
        setModelDragging(false);
        setHoveredCell(null);
      },
      minAzimuthAngle: -rotateLeftRightLimit,
      maxAzimuthAngle: rotateLeftRightLimit,
      minPolarAngle: defaultPolarAngle - rotateUpLimit,
      maxPolarAngle: defaultPolarAngle + rotateDownLimit,
      target: [0, 0, 0],
      makeDefault: true
    }
  ));
}

// src/components/CartDrawer.jsx
import * as React5 from "react";
function CartDrawer({
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
  cartTotal
}) {
  return /* @__PURE__ */ React5.createElement(
    "aside",
    {
      onPointerDown: (e) => e.stopPropagation(),
      "aria-hidden": !cartOpen,
      style: {
        position: "absolute",
        top: 0,
        right: 0,
        width: CART_DRAWER_WIDTH,
        height: "100vh",
        background: "#ffffff",
        borderLeft: "1px solid #D9DEE3",
        boxSizing: "border-box",
        zIndex: 80,
        transform: `translateX(${((1 - cartLayoutProgress) * 100).toFixed(3)}%)`,
        transition: "none",
        color: "#111111",
        display: "flex",
        flexDirection: "column",
        pointerEvents: cartLayoutProgress > 0.98 ? "auto" : "none"
      }
    },
    /* @__PURE__ */ React5.createElement(
      "div",
      {
        style: {
          padding: "34px 28px 18px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }
      },
      /* @__PURE__ */ React5.createElement("div", { style: { font: "400 28px/1 -apple-system, BlinkMacSystemFont, sans-serif", letterSpacing: 0 } }, "CART"),
      /* @__PURE__ */ React5.createElement(
        "button",
        {
          type: "button",
          onClick: () => setCartOpen(false),
          "aria-label": "\u30AB\u30FC\u30C8\u3092\u9589\u3058\u308B",
          style: {
            width: 36,
            height: 36,
            border: 0,
            borderRadius: "50%",
            background: "transparent",
            color: "#111111",
            display: "grid",
            placeItems: "center",
            padding: 0,
            cursor: "pointer"
          }
        },
        /* @__PURE__ */ React5.createElement("span", { "aria-hidden": "true", style: { position: "relative", width: 19, height: 19, display: "block" } }, /* @__PURE__ */ React5.createElement("span", { style: { position: "absolute", left: 1, top: 8.5, width: 17, height: 1.4, background: "#111111", transform: "rotate(45deg)", transformOrigin: "center" } }), /* @__PURE__ */ React5.createElement("span", { style: { position: "absolute", left: 1, top: 8.5, width: 17, height: 1.4, background: "#111111", transform: "rotate(-45deg)", transformOrigin: "center" } }))
      )
    ),
    /* @__PURE__ */ React5.createElement("div", { style: { flex: 1, overflowY: "auto", overflowX: "hidden", padding: "0 28px" } }, cartBoxes.length === 0 ? /* @__PURE__ */ React5.createElement(
      "div",
      {
        "data-cart-empty": true,
        style: {
          minHeight: 180,
          display: "grid",
          placeItems: "center",
          color: "#8B9298",
          font: "400 12px/1.4 -apple-system, BlinkMacSystemFont, sans-serif"
        }
      },
      "\u30AB\u30FC\u30C8\u306F\u7A7A\u3067\u3059"
    ) : cartBoxes.map((box) => {
      const expanded = expandedCartBoxIds.includes(box.id);
      const entering = enteringCartBoxIds.includes(box.id);
      const removing = removingCartBoxIds.includes(box.id);
      const editing = editingCartBoxId === box.id;
      const activeEditing = cartEditSession?.boxId === box.id;
      const fruits = box.items.map((item) => FRUIT_ITEMS[item.appleId]).filter(Boolean);
      return /* @__PURE__ */ React5.createElement(
        "section",
        {
          key: box.id,
          "data-cart-box": box.id,
          style: {
            borderBottom: activeEditing ? "1px solid transparent" : "1px solid #D9DEE3",
            background: activeEditing ? "#C8FF00" : "transparent",
            // 荧光编辑标记向侧栏两边延伸，内边距抵消后不改变内容位置。
            margin: activeEditing ? "-1px -12px 0" : 0,
            padding: activeEditing ? "1px 12px 0" : 0,
            borderRadius: activeEditing ? 8 : 0,
            position: "relative",
            zIndex: activeEditing ? 1 : "auto",
            overflow: "hidden",
            pointerEvents: removing ? "none" : "auto",
            animation: removing ? `cartBoxSlideOut ${CART_BOX_LIST_MOTION_MS}ms ${CART_BOX_LIST_MOTION_EASING} forwards` : entering ? `cartBoxSlideIn ${CART_BOX_LIST_MOTION_MS}ms ${CART_BOX_LIST_MOTION_EASING} both` : "none",
            transition: "background-color 220ms ease, border-radius 220ms ease"
          }
        },
        /* @__PURE__ */ React5.createElement(
          "div",
          {
            role: "button",
            tabIndex: 0,
            "aria-expanded": expanded,
            onClick: () => toggleCartBoxExpanded(box.id),
            onKeyDown: (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                toggleCartBoxExpanded(box.id);
              }
            },
            style: {
              minHeight: 54,
              display: "flex",
              alignItems: "center",
              gap: 8,
              cursor: "pointer",
              outline: "none"
            }
          },
          editing ? /* @__PURE__ */ React5.createElement(
            "input",
            {
              autoFocus: true,
              "aria-label": "\u30DC\u30C3\u30AF\u30B9\u540D",
              value: box.name,
              maxLength: 20,
              onClick: (e) => e.stopPropagation(),
              onPointerDown: (e) => e.stopPropagation(),
              onChange: (e) => updateCartBox(box.id, { name: e.target.value }),
              onKeyDown: (e) => {
                e.stopPropagation();
                if (e.key === "Enter") e.currentTarget.blur();
                if (e.key === "Escape") {
                  updateCartBox(box.id, { name: box.name.trim() || `BOX ${box.boxNumber}` });
                  setEditingCartBoxId(null);
                }
              },
              onBlur: () => {
                if (!box.name.trim()) updateCartBox(box.id, { name: `BOX ${box.boxNumber}` });
                setEditingCartBoxId(null);
              },
              style: {
                width: 92,
                height: 24,
                padding: "0 4px",
                border: "1px solid #AEB5BB",
                borderRadius: 3,
                boxSizing: "border-box",
                background: "#ffffff",
                color: "#111111",
                font: "400 13px/1 -apple-system, BlinkMacSystemFont, sans-serif",
                letterSpacing: 0
              }
            }
          ) : /* @__PURE__ */ React5.createElement(
            "button",
            {
              type: "button",
              title: box.name,
              onClick: (e) => {
                e.stopPropagation();
                setEditingCartBoxId(box.id);
              },
              onPointerDown: (e) => e.stopPropagation(),
              style: {
                minWidth: 0,
                maxWidth: 96,
                padding: 0,
                border: 0,
                background: "transparent",
                color: "#111111",
                cursor: "text",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                textAlign: "left",
                font: "400 14px/1 -apple-system, BlinkMacSystemFont, sans-serif"
              }
            },
            box.name
          ),
          /* @__PURE__ */ React5.createElement(
            "span",
            {
              style: {
                flex: "0 0 auto",
                minWidth: 22,
                height: 20,
                padding: "0 6px",
                borderRadius: 3,
                boxSizing: "border-box",
                background: "#E7EAED",
                color: "#5E666D",
                display: "grid",
                placeItems: "center",
                font: "500 10px/1 -apple-system, BlinkMacSystemFont, sans-serif"
              }
            },
            box.size
          ),
          /* @__PURE__ */ React5.createElement(
            "button",
            {
              type: "button",
              onClick: (e) => {
                e.stopPropagation();
                if (activeEditing) {
                  cancelCartBoxEdit();
                } else {
                  beginCartBoxEdit(box);
                }
              },
              onPointerDown: (e) => e.stopPropagation(),
              "aria-label": activeEditing ? `${box.name}\u306E\u7DE8\u96C6\u3092\u30AD\u30E3\u30F3\u30BB\u30EB` : `${box.name}\u3092\u7DE8\u96C6`,
              style: {
                flex: "0 0 auto",
                height: 22,
                padding: activeEditing ? "0 7px 0 10px" : "0 10px",
                border: activeEditing ? 0 : "1px solid #9AA1A7",
                borderRadius: 999,
                boxSizing: "border-box",
                background: activeEditing ? "rgba(255,255,255,0.58)" : "#ffffff",
                color: activeEditing ? "#555555" : "#111111",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: activeEditing ? 5 : 0,
                font: "500 10px/1 -apple-system, BlinkMacSystemFont, sans-serif",
                letterSpacing: 0
              }
            },
            /* @__PURE__ */ React5.createElement("span", null, activeEditing ? "\u7DE8\u96C6\u4E2D" : "\u7DE8\u96C6"),
            activeEditing ? /* @__PURE__ */ React5.createElement("span", { "aria-hidden": "true", style: { position: "relative", width: 9, height: 9, display: "block", flex: "0 0 auto" } }, /* @__PURE__ */ React5.createElement("span", { style: { position: "absolute", left: 0.5, top: 4, width: 8, height: 1, background: "#555555", transform: "rotate(45deg)", transformOrigin: "center" } }), /* @__PURE__ */ React5.createElement("span", { style: { position: "absolute", left: 0.5, top: 4, width: 8, height: 1, background: "#555555", transform: "rotate(-45deg)", transformOrigin: "center" } })) : null
          ),
          /* @__PURE__ */ React5.createElement("span", { style: { flex: "1 1 auto" } }),
          /* @__PURE__ */ React5.createElement("span", { style: { flex: "0 0 auto", whiteSpace: "nowrap", font: "400 11px/1 sans-serif" } }, box.price.toLocaleString("ja-JP"), "\u5186"),
          /* @__PURE__ */ React5.createElement(
            "span",
            {
              onClick: (e) => e.stopPropagation(),
              onPointerDown: (e) => e.stopPropagation(),
              style: {
                height: 20,
                display: "grid",
                gridTemplateColumns: "18px 28px 18px",
                border: "1px solid #BFC5CB",
                boxSizing: "border-box"
              }
            },
            /* @__PURE__ */ React5.createElement(
              "button",
              {
                type: "button",
                "aria-label": `${box.name}\u30921\u500B\u6E1B\u3089\u3059`,
                disabled: box.quantity <= 1,
                onClick: () => setCartBoxQuantity(box.id, box.quantity - 1),
                style: { border: 0, borderRight: "1px solid #BFC5CB", padding: 0, background: "transparent", cursor: box.quantity > 1 ? "pointer" : "default", color: box.quantity > 1 ? "#111111" : "#AEB5BB" }
              },
              "\u2212"
            ),
            /* @__PURE__ */ React5.createElement(
              "input",
              {
                className: "cart-quantity-input",
                "aria-label": `${box.name}\u306E\u6570\u91CF`,
                type: "number",
                min: "1",
                max: "99",
                value: box.quantity,
                onChange: (e) => setCartBoxQuantity(box.id, e.target.value),
                style: { width: 28, minWidth: 0, border: 0, padding: 0, textAlign: "center", background: "transparent", color: "#111111", font: "400 11px/1 sans-serif", outline: "none" }
              }
            ),
            /* @__PURE__ */ React5.createElement(
              "button",
              {
                type: "button",
                "aria-label": `${box.name}\u30921\u500B\u5897\u3084\u3059`,
                disabled: box.quantity >= 99,
                onClick: () => setCartBoxQuantity(box.id, box.quantity + 1),
                style: { border: 0, borderLeft: "1px solid #BFC5CB", padding: 0, background: "transparent", cursor: box.quantity < 99 ? "pointer" : "default", color: box.quantity < 99 ? "#111111" : "#AEB5BB" }
              },
              "\uFF0B"
            )
          ),
          /* @__PURE__ */ React5.createElement(
            "button",
            {
              type: "button",
              "aria-label": `${box.name}\u3092\u524A\u9664`,
              onClick: (e) => {
                e.stopPropagation();
                removeCartBox(box.id);
              },
              style: { width: 18, height: 22, border: 0, padding: 0, background: "transparent", cursor: "pointer", display: "grid", placeItems: "center" }
            },
            /* @__PURE__ */ React5.createElement("span", { style: { position: "relative", width: 10, height: 12, display: "block" } }, /* @__PURE__ */ React5.createElement("span", { style: { position: "absolute", left: 2, top: 3, width: 6, height: 7, border: "1px solid #737A80", borderTop: 0, boxSizing: "border-box" } }), /* @__PURE__ */ React5.createElement("span", { style: { position: "absolute", left: 1, top: 2, width: 8, height: 1, background: "#737A80" } }), /* @__PURE__ */ React5.createElement("span", { style: { position: "absolute", left: 3.5, top: 0, width: 3, height: 1, background: "#737A80" } }))
          )
        ),
        /* @__PURE__ */ React5.createElement(
          "div",
          {
            "aria-hidden": !expanded,
            style: {
              display: "grid",
              gridTemplateRows: expanded ? "1fr" : "0fr",
              transition: "grid-template-rows 320ms cubic-bezier(.2,.8,.2,1)"
            }
          },
          /* @__PURE__ */ React5.createElement("div", { style: { minHeight: 0, overflow: "hidden" } }, /* @__PURE__ */ React5.createElement(
            "div",
            {
              style: {
                display: "grid",
                gridTemplateColumns: "108px 1fr",
                columnGap: 14,
                padding: "4px 0 20px",
                opacity: expanded ? 1 : 0,
                transform: `translateY(${expanded ? 0 : -6}px)`,
                transition: "opacity 220ms ease, transform 320ms cubic-bezier(.2,.8,.2,1)",
                pointerEvents: expanded ? "auto" : "none"
              }
            },
            /* @__PURE__ */ React5.createElement(
              "div",
              {
                style: {
                  width: 108,
                  height: 82,
                  borderRadius: 8,
                  background: "#F7F8FA",
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gridTemplateRows: "repeat(2, 1fr)",
                  overflow: "hidden"
                }
              },
              [0, 1, 2, 3].map((index) => {
                const fruit = fruits[index];
                return /* @__PURE__ */ React5.createElement(
                  "div",
                  {
                    key: index,
                    style: {
                      display: "grid",
                      placeItems: "center",
                      borderRight: index % 2 === 0 ? "1px solid rgba(210,219,228,0.85)" : 0,
                      borderBottom: index < 2 ? "1px solid rgba(210,219,228,0.85)" : 0
                    }
                  },
                  fruit ? /* @__PURE__ */ React5.createElement("img", { src: fruit.wholeSrc, alt: "", draggable: false, style: { width: 36, height: 36, objectFit: "contain", WebkitUserDrag: "none" } }) : null
                );
              })
            ),
            /* @__PURE__ */ React5.createElement("div", { style: { display: "grid", alignContent: "start", gap: 5, paddingTop: 2 } }, fruits.map((fruit, index) => /* @__PURE__ */ React5.createElement("div", { key: `${fruit.name}-${index}`, style: { font: "400 11px/1.25 -apple-system, BlinkMacSystemFont, sans-serif", color: "#111111" } }, fruit.name, " ", /* @__PURE__ */ React5.createElement("span", { style: { color: "#777D82" } }, "(200g)"))))
          ))
        )
      );
    })),
    /* @__PURE__ */ React5.createElement(
      "div",
      {
        style: {
          borderTop: "1px solid #D9DEE3",
          padding: "16px 28px 22px"
        }
      },
      /* @__PURE__ */ React5.createElement("div", { style: { display: "flex", justifyContent: "space-between", font: "400 15px/1 -apple-system, BlinkMacSystemFont, sans-serif" } }, /* @__PURE__ */ React5.createElement("span", null, "\u5408\u8A08"), /* @__PURE__ */ React5.createElement("span", { "data-cart-total": true }, formatYen(cartTotal))),
      /* @__PURE__ */ React5.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 24 } }, /* @__PURE__ */ React5.createElement(
        "button",
        {
          type: "button",
          onClick: () => setCartOpen(false),
          "aria-label": "\u30AB\u30FC\u30C8\u3092\u9589\u3058\u308B",
          style: {
            width: 30,
            height: 22,
            border: 0,
            borderRadius: 999,
            background: "transparent",
            color: "#111111",
            display: "grid",
            placeItems: "center",
            padding: 0,
            cursor: "pointer",
            transform: `translateX(${CART_FOOTER_ARROW_OFFSET_X}px)`
          }
        },
        /* @__PURE__ */ React5.createElement("svg", { "aria-hidden": "true", width: "30", height: "16", viewBox: "0 0 30 16", style: { display: "block", overflow: "visible" } }, /* @__PURE__ */ React5.createElement("path", { d: "M0.7 8H24M18 2L24 8L18 14", fill: "none", stroke: "#111111", strokeWidth: "1.3", strokeLinecap: "round", strokeLinejoin: "round" }))
      ), /* @__PURE__ */ React5.createElement(
        "button",
        {
          type: "button",
          style: {
            border: 0,
            borderRadius: 999,
            background: "#050505",
            color: "#ffffff",
            width: 150,
            height: 34,
            font: "400 14px/1 -apple-system, BlinkMacSystemFont, sans-serif",
            cursor: "pointer"
          }
        },
        "\u30EC\u30B8\u3078\u9032\u3080"
      ))
    )
  );
}

// src/components/TopCatalog.jsx
import * as React6 from "react";
function TopCatalog({
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
  turnFruitPage
}) {
  return /* @__PURE__ */ React6.createElement(React6.Fragment, null, /* @__PURE__ */ React6.createElement(
    "header",
    {
      style: {
        position: "absolute",
        left: 0,
        top: 0,
        width: "100%",
        height: 76,
        background: "#F7F8FA",
        zIndex: 20,
        display: "flex",
        alignItems: "center",
        paddingLeft: 36,
        boxSizing: "border-box"
      }
    },
    /* @__PURE__ */ React6.createElement(
      "img",
      {
        src: "img/icon/logo-yoko.svg",
        alt: "\u679C\u5B9F LABO",
        draggable: false,
        style: { width: 178, height: "auto", display: "block", userSelect: "none", WebkitUserDrag: "none" }
      }
    )
  ), /* @__PURE__ */ React6.createElement(
    "div",
    {
      onContextMenu: (e) => e.preventDefault(),
      style: {
        position: "absolute",
        left: TOP_CATALOG_SIDE_GAP,
        top: 104,
        transform: "none",
        display: "flex",
        alignItems: "flex-start",
        gap: 24,
        zIndex: 35,
        width: `calc(100vw - ${(topCatalogDrawerViewportOffset + TOP_CATALOG_SIDE_GAP * 2).toFixed(2)}px)`,
        transition: "none",
        justifyContent: "center",
        userSelect: "none"
      }
    },
    canScrollPrev ? /* @__PURE__ */ React6.createElement(
      "button",
      {
        type: "button",
        onClick: () => turnFruitPage(-1),
        onContextMenu: (e) => e.preventDefault(),
        style: {
          position: "absolute",
          left: prevCatalogArrowLeft,
          top: 22,
          zIndex: 2,
          width: 36,
          height: 36,
          padding: 0,
          border: 0,
          borderRadius: "50%",
          background: "transparent",
          display: "grid",
          placeItems: "center",
          cursor: "pointer",
          userSelect: "none"
        },
        "aria-label": "\u524D\u306E\u679C\u7269"
      },
      /* @__PURE__ */ React6.createElement(
        "img",
        {
          src: "img/icon/jiantou.svg",
          draggable: false,
          alt: "",
          style: { width: 25, height: 25, display: "block", pointerEvents: "none", WebkitUserDrag: "none" }
        }
      )
    ) : null,
    /* @__PURE__ */ React6.createElement(
      "div",
      {
        onPointerDown: onFruitStripPointerDown,
        style: {
          width: fruitViewportWidth,
          overflow: "visible",
          position: "relative",
          paddingBottom: 10,
          // 给水果名称和下方滚动条留出间距，避免文字压住滚动条。
          cursor: fruitStripDragging ? "grabbing" : "grab",
          touchAction: "pan-y"
        }
      },
      /* @__PURE__ */ React6.createElement(
        "div",
        {
          "data-catalog-mask": "true",
          style: {
            width: arrowFruitViewportWidth,
            height: 94,
            overflow: "hidden",
            position: "relative",
            left: catalogMaskLeft
          }
        },
        /* @__PURE__ */ React6.createElement(
          "div",
          {
            style: {
              display: "grid",
              gridTemplateColumns: `repeat(${activeCatalogCount}, 92px)`,
              gap: 34,
              position: "relative",
              left: -catalogMaskLeft,
              transform: `translateX(${fruitStripTranslate}px)`,
              transition: fruitStripDragging ? "none" : `transform ${fruitSnapDuration}ms cubic-bezier(0.16, 1, 0.3, 1)`,
              willChange: "transform",
              overflow: "visible"
            }
          },
          isFruitCatalog ? FRUIT_ITEMS.map((fruit, id) => /* @__PURE__ */ React6.createElement(
            "button",
            {
              key: fruit.name,
              type: "button",
              onPointerDown: (e) => onApplePointerDown(e, id),
              onClick: () => onAppleClick(id),
              onContextMenu: (e) => e.preventDefault(),
              style: {
                width: 92,
                padding: 0,
                border: 0,
                background: "transparent",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                cursor: "grab",
                userSelect: "none",
                touchAction: "none",
                font: "12px/1.2 -apple-system, BlinkMacSystemFont, sans-serif",
                color: "#111"
              },
              "aria-label": fruit.name
            },
            /* @__PURE__ */ React6.createElement(
              "img",
              {
                src: fruit.wholeSrc,
                draggable: false,
                onContextMenu: (e) => e.preventDefault(),
                style: {
                  width: 68,
                  height: 68,
                  objectFit: "contain",
                  pointerEvents: "none",
                  WebkitUserDrag: "none"
                },
                alt: ""
              }
            ),
            /* @__PURE__ */ React6.createElement("span", { style: { marginTop: 8, whiteSpace: "nowrap" } }, fruit.name)
          )) : activeCatalogItems.map((item, index) => {
            const activeCombo = openComboIndex === index;
            return /* @__PURE__ */ React6.createElement(
              "div",
              {
                key: `${activeCatalogTab}-${index}`,
                "data-combo-ui": "true",
                onPointerDown: (e) => onComboPointerDown(e, index),
                onClick: (e) => onComboCardClick(e, index),
                style: {
                  width: 92,
                  height: 94,
                  position: "relative",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  userSelect: "none",
                  font: "12px/1.2 -apple-system, BlinkMacSystemFont, sans-serif",
                  color: "#111",
                  cursor: "pointer",
                  zIndex: activeCombo ? 80 : 1
                }
              },
              /* @__PURE__ */ React6.createElement(
                "img",
                {
                  src: item.imageSrc,
                  draggable: false,
                  onContextMenu: (e) => e.preventDefault(),
                  style: {
                    width: 76,
                    height: 68,
                    objectFit: "contain",
                    pointerEvents: "none",
                    WebkitUserDrag: "none",
                    position: "relative",
                    zIndex: 1
                  },
                  alt: ""
                }
              ),
              /* @__PURE__ */ React6.createElement(
                "span",
                {
                  style: {
                    marginTop: 8,
                    whiteSpace: "nowrap",
                    font: "12px/1.2 -apple-system, BlinkMacSystemFont, sans-serif",
                    position: "relative",
                    zIndex: 1
                  }
                },
                item.name
              )
            );
          })
        )
      ),
      !isFruitCatalog && openComboIndex != null && activeCatalogItems[openComboIndex] ? /* @__PURE__ */ React6.createElement(
        "div",
        {
          "data-combo-ui": "true",
          onPointerDown: (e) => e.stopPropagation(),
          style: {
            position: "absolute",
            left: comboHoverPanelLeft,
            top: -18,
            width: comboHoverPanelWidth,
            minHeight: 266,
            padding: "0 16px 8px",
            borderRadius: 22,
            background: "#ffffff",
            boxSizing: "border-box",
            transform: "translateX(-50%)",
            zIndex: 90,
            cursor: "pointer"
          }
        },
        /* @__PURE__ */ React6.createElement(
          "img",
          {
            src: activeCatalogItems[openComboIndex].imageSrc,
            draggable: false,
            alt: "",
            style: {
              width: 76,
              height: 68,
              objectFit: "contain",
              display: "block",
              margin: "18px auto 0",
              pointerEvents: "none",
              WebkitUserDrag: "none"
            }
          }
        ),
        /* @__PURE__ */ React6.createElement(
          "div",
          {
            style: {
              marginTop: 8,
              textAlign: "center",
              whiteSpace: "nowrap",
              font: "12px/1.2 -apple-system, BlinkMacSystemFont, sans-serif",
              color: "#111111"
            }
          },
          activeCatalogItems[openComboIndex].name
        ),
        /* @__PURE__ */ React6.createElement(
          "div",
          {
            style: {
              width: "100%",
              marginTop: 14,
              display: "grid",
              gap: 6
            }
          },
          activeCatalogItems[openComboIndex].fruits.map((fruit, fruitIndex) => /* @__PURE__ */ React6.createElement(
            "div",
            {
              key: `${activeCatalogItems[openComboIndex].name}-${fruitIndex}`,
              style: {
                display: "grid",
                gridTemplateColumns: "22px minmax(0, 1fr)",
                alignItems: "center",
                columnGap: 8,
                minWidth: 0
              }
            },
            /* @__PURE__ */ React6.createElement(
              "img",
              {
                src: fruit.iconSrc,
                draggable: false,
                alt: "",
                style: {
                  width: 22,
                  height: 22,
                  objectFit: "contain",
                  pointerEvents: "none",
                  WebkitUserDrag: "none"
                }
              }
            ),
            /* @__PURE__ */ React6.createElement(
              "span",
              {
                style: {
                  minWidth: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  font: "12px/1.2 -apple-system, BlinkMacSystemFont, sans-serif",
                  color: "#111111"
                }
              },
              fruit.name
            )
          ))
        ),
        /* @__PURE__ */ React6.createElement(
          "button",
          {
            type: "button",
            onPointerDown: (e) => e.stopPropagation(),
            onClick: (e) => {
              e.stopPropagation();
              requestPlaceCombo(openComboIndex);
            },
            style: {
              display: "block",
              margin: "10px auto 2px",
              padding: "9px 16px",
              border: 0,
              borderRadius: 999,
              background: "#050505",
              color: "#ffffff",
              font: "600 12px/1 -apple-system, BlinkMacSystemFont, sans-serif",
              cursor: "pointer",
              whiteSpace: "nowrap"
            }
          },
          "\u30DC\u30C3\u30AF\u30B9\u306B\u8FFD\u52A0"
        )
      ) : null,
      /* @__PURE__ */ React6.createElement(
        "div",
        {
          style: {
            position: "absolute",
            left: 0,
            top: 16,
            bottom: 40,
            width: 3,
            borderRadius: 999,
            background: `rgba(0, 0, 0, ${Math.min(0.5, fruitEdgePull.left / 92)})`,
            transform: `scaleY(${0.35 + Math.min(0.5, fruitEdgePull.left / 130)})`,
            transformOrigin: "center",
            transition: fruitStripDragging ? "none" : "background 240ms ease, transform 240ms ease",
            pointerEvents: "none"
          }
        }
      ),
      /* @__PURE__ */ React6.createElement(
        "div",
        {
          style: {
            position: "absolute",
            right: 0,
            top: 16,
            bottom: 40,
            width: 3,
            borderRadius: 999,
            background: `rgba(0, 0, 0, ${Math.min(0.5, fruitEdgePull.right / 92)})`,
            transform: `scaleY(${0.35 + Math.min(0.5, fruitEdgePull.right / 130)})`,
            transformOrigin: "center",
            transition: fruitStripDragging ? "none" : "background 240ms ease, transform 240ms ease",
            pointerEvents: "none"
          }
        }
      ),
      /* @__PURE__ */ React6.createElement(
        "div",
        {
          style: {
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: 2,
            opacity: fruitStripDragging ? 1 : 0,
            transition: "opacity 220ms ease",
            pointerEvents: "none"
          }
        },
        /* @__PURE__ */ React6.createElement(
          "div",
          {
            style: {
              width: scrollbarThumbWidth,
              height: "100%",
              borderRadius: 999,
              background: "#D2DBE4",
              transform: `translateX(${scrollbarThumbX}px)`,
              transition: fruitStripDragging ? "none" : "transform 220ms ease"
            }
          }
        )
      )
    ),
    canScrollNext ? /* @__PURE__ */ React6.createElement(
      "button",
      {
        type: "button",
        onClick: () => turnFruitPage(1),
        onContextMenu: (e) => e.preventDefault(),
        style: {
          position: "absolute",
          left: nextCatalogArrowLeft,
          top: 22,
          zIndex: 2,
          width: 36,
          height: 36,
          padding: 0,
          border: 0,
          borderRadius: "50%",
          background: "transparent",
          display: "grid",
          placeItems: "center",
          cursor: "pointer",
          userSelect: "none"
        },
        "aria-label": "\u6B21\u306E\u679C\u7269"
      },
      /* @__PURE__ */ React6.createElement(
        "img",
        {
          src: "img/icon/jiantou.svg",
          draggable: false,
          alt: "",
          style: {
            width: 25,
            height: 25,
            display: "block",
            pointerEvents: "none",
            WebkitUserDrag: "none",
            transform: "scaleX(-1)"
          }
        }
      )
    ) : null,
    /* @__PURE__ */ React6.createElement(
      "div",
      {
        role: "tablist",
        "aria-label": "\u5546\u54C1\u30AB\u30C6\u30B4\u30EA",
        style: {
          position: "absolute",
          left: "50%",
          top: CATALOG_SWITCH_STYLE.top,
          width: CATALOG_SWITCH_STYLE.width,
          height: CATALOG_SWITCH_STYLE.height,
          transform: `translateX(calc(-50% + ${catalogSwitchOffset}px))`,
          transition: "none",
          border: 0,
          borderRadius: 999,
          overflow: "hidden",
          background: "#F7F8FA",
          zIndex: 26,
          userSelect: "none"
        }
      },
      /* @__PURE__ */ React6.createElement(
        "div",
        {
          "aria-hidden": "true",
          style: {
            position: "absolute",
            inset: 0,
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            pointerEvents: "none"
          }
        },
        CATALOG_TABS.map((tab, index) => /* @__PURE__ */ React6.createElement(
          "div",
          {
            key: `base-${tab.id}`,
            style: {
              display: "grid",
              placeItems: "center",
              borderLeft: 0,
              color: "#111111",
              font: `500 ${CATALOG_SWITCH_STYLE.fontSize}px/1 -apple-system, BlinkMacSystemFont, sans-serif`,
              letterSpacing: 0
            }
          },
          tab.label
        ))
      ),
      /* @__PURE__ */ React6.createElement(
        "div",
        {
          "aria-hidden": "true",
          style: {
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: `${100 / CATALOG_TABS.length}%`,
            background: "#111111",
            overflow: "hidden",
            borderRadius: 999,
            transform: `translateX(${activeCatalogIndex * 100}%)`,
            transition: "transform 320ms cubic-bezier(.2,.8,.2,1)",
            pointerEvents: "none"
          }
        },
        /* @__PURE__ */ React6.createElement(
          "div",
          {
            style: {
              width: CATALOG_SWITCH_STYLE.width,
              height: "100%",
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              transform: `translateX(${-activeCatalogIndex * (CATALOG_SWITCH_STYLE.width / CATALOG_TABS.length)}px)`,
              transition: "transform 320ms cubic-bezier(.2,.8,.2,1)"
            }
          },
          CATALOG_TABS.map((tab) => /* @__PURE__ */ React6.createElement(
            "div",
            {
              key: `mask-${tab.id}`,
              style: {
                display: "grid",
                placeItems: "center",
                color: "#ffffff",
                font: `500 ${CATALOG_SWITCH_STYLE.fontSize}px/1 -apple-system, BlinkMacSystemFont, sans-serif`,
                letterSpacing: 0
              }
            },
            tab.label
          ))
        )
      ),
      /* @__PURE__ */ React6.createElement(
        "div",
        {
          style: {
            position: "absolute",
            inset: 0,
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)"
          }
        },
        CATALOG_TABS.map((tab, index) => {
          const active = activeCatalogTab === tab.id;
          return /* @__PURE__ */ React6.createElement(
            "button",
            {
              key: tab.id,
              type: "button",
              role: "tab",
              "aria-selected": active,
              onClick: () => {
                if (activeCatalogTab === tab.id) return;
                setActiveCatalogTab(tab.id);
                setFruitSnapDuration(260);
                setFruitOffset(0);
                setFruitDragDelta(0);
                setFruitEdgePull({ left: 0, right: 0 });
                setOpenComboIndex(null);
                setComboReplacePrompt(null);
                setReplacementFruitId(null);
              },
              style: {
                border: 0,
                background: "transparent",
                color: "transparent",
                font: `500 ${CATALOG_SWITCH_STYLE.fontSize}px/1 -apple-system, BlinkMacSystemFont, sans-serif`,
                letterSpacing: 0,
                cursor: "pointer",
                padding: 0,
                WebkitTapHighlightColor: "transparent"
              }
            },
            tab.label
          );
        })
      )
    )
  ), comboReplacePrompt ? /* @__PURE__ */ React6.createElement(
    "div",
    {
      onPointerDown: (e) => e.stopPropagation(),
      style: {
        position: "absolute",
        left: "50%",
        top: CATALOG_SWITCH_STYLE.top + CATALOG_SWITCH_STYLE.height + 18,
        transform: "translateX(-50%)",
        width: 248,
        padding: "18px 18px 16px",
        borderRadius: 18,
        background: "#ffffff",
        boxSizing: "border-box",
        zIndex: 120,
        color: "#111111",
        font: "500 13px/1.55 -apple-system, BlinkMacSystemFont, sans-serif",
        textAlign: "center"
      }
    },
    /* @__PURE__ */ React6.createElement("div", null, "\u73FE\u5728\u306E\u30DC\u30C3\u30AF\u30B9\u306E\u4E2D\u8EAB\u3092", /* @__PURE__ */ React6.createElement("br", null), "\u3053\u306E\u30BB\u30C3\u30C8\u306B\u5165\u308C\u66FF\u3048\u307E\u3059\u304B\uFF1F"),
    /* @__PURE__ */ React6.createElement(
      "div",
      {
        style: {
          display: "flex",
          justifyContent: "center",
          gap: 8,
          marginTop: 14
        }
      },
      /* @__PURE__ */ React6.createElement(
        "button",
        {
          type: "button",
          onClick: () => placeComboInBox(TEST_BOX_ITEMS[comboReplacePrompt.comboIndex]),
          style: {
            border: 0,
            borderRadius: 999,
            background: "#111111",
            color: "#ffffff",
            padding: "7px 14px",
            font: "500 12px/1 -apple-system, BlinkMacSystemFont, sans-serif",
            cursor: "pointer"
          }
        },
        "\u5165\u308C\u66FF\u3048\u308B"
      ),
      /* @__PURE__ */ React6.createElement(
        "button",
        {
          type: "button",
          onClick: () => setComboReplacePrompt(null),
          style: {
            border: 0,
            borderRadius: 999,
            background: "#F7F8FA",
            color: "#111111",
            padding: "7px 14px",
            font: "500 12px/1 -apple-system, BlinkMacSystemFont, sans-serif",
            cursor: "pointer"
          }
        },
        "\u30AD\u30E3\u30F3\u30BB\u30EB"
      )
    )
  ) : null);
}

// src/components/PageOverlayControls.jsx
import React7 from "react";
function PageOverlayControls({
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
  startSizeChange
}) {
  return /* @__PURE__ */ React7.createElement(React7.Fragment, null, activeCartEditBox ? /* @__PURE__ */ React7.createElement(
    "div",
    {
      "data-cart-edit-banner": true,
      onPointerDown: (e) => e.stopPropagation(),
      style: {
        position: "absolute",
        left: `calc(50% - ${cartContentOffset}px)`,
        // 编辑提示放在分类按钮与 3D 盒子之间，避免遮住顶部水果名称。
        top: CATALOG_SWITCH_STYLE.top + 155,
        transform: "translateX(-50%)",
        minWidth: 300,
        height: 36,
        padding: "0 5px 0 13px",
        borderRadius: 6,
        background: "#C8FF00",
        color: "#0A0A0A",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 14,
        boxSizing: "border-box",
        zIndex: 70,
        font: "600 12px/1 -apple-system, BlinkMacSystemFont, sans-serif",
        letterSpacing: 0
      }
    },
    /* @__PURE__ */ React7.createElement("span", null, "\u7DE8\u96C6\u4E2D\uFF1A", activeCartEditBox.name),
    /* @__PURE__ */ React7.createElement("span", { style: { display: "flex", alignItems: "center", gap: 5 } }, /* @__PURE__ */ React7.createElement(
      "button",
      {
        type: "button",
        onClick: cancelCartBoxEdit,
        style: {
          height: 25,
          padding: "0 11px",
          border: "1px solid #111111",
          borderRadius: 999,
          background: "#ffffff",
          color: "#111111",
          cursor: "pointer",
          font: "500 10.5px/1 -apple-system, BlinkMacSystemFont, sans-serif"
        }
      },
      "\u30AD\u30E3\u30F3\u30BB\u30EB"
    ), /* @__PURE__ */ React7.createElement(
      "button",
      {
        type: "button",
        onClick: addBoxToCart,
        style: {
          height: 25,
          padding: "0 13px",
          border: 0,
          borderRadius: 999,
          background: "#111111",
          color: "#ffffff",
          cursor: "pointer",
          font: "500 10.5px/1 -apple-system, BlinkMacSystemFont, sans-serif"
        }
      },
      "\u5B8C\u4E86"
    ))
  ) : null, cartTransfer ? /* @__PURE__ */ React7.createElement(
    "div",
    {
      "data-cart-transfer": true,
      "aria-hidden": "true",
      style: {
        position: "fixed",
        left: cartTransfer.startX,
        top: cartTransfer.startY,
        width: 0,
        height: 0,
        pointerEvents: "none",
        zIndex: 120,
        "--cart-flight-x": `${cartTransfer.deltaX}px`,
        animation: `cartTransferX ${CART_TRANSFER_DURATION_MS}ms cubic-bezier(.34,.02,.28,1) both`,
        willChange: "transform"
      }
    },
    /* @__PURE__ */ React7.createElement(
      "div",
      {
        style: {
          width: 0,
          height: 0,
          "--cart-flight-y": `${cartTransfer.deltaY}px`,
          "--cart-flight-arc-y": `${cartTransfer.arcY}px`,
          animation: `cartTransferY ${CART_TRANSFER_DURATION_MS}ms cubic-bezier(.34,.02,.28,1) both`,
          willChange: "transform"
        }
      },
      /* @__PURE__ */ React7.createElement(
        "div",
        {
          style: {
            position: "relative",
            width: 144,
            height: 102,
            padding: 7,
            boxSizing: "border-box",
            border: "4px solid rgba(235,244,249,.96)",
            borderRadius: 12,
            background: "rgba(239,246,250,.92)",
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gridTemplateRows: "repeat(2, 1fr)",
            boxShadow: "0 7px 20px rgba(40,55,65,.12)",
            overflow: "hidden",
            animation: `cartTransferPack ${CART_TRANSFER_DURATION_MS}ms cubic-bezier(.2,.8,.2,1) both`,
            willChange: "transform, opacity"
          }
        },
        [0, 1, 2, 3].map((index) => {
          const fruit = cartTransfer.fruits[index];
          return /* @__PURE__ */ React7.createElement(
            "div",
            {
              key: index,
              style: {
                display: "grid",
                placeItems: "center",
                borderRight: index % 2 === 0 ? "2px solid rgba(255,255,255,.92)" : 0,
                borderBottom: index < 2 ? "2px solid rgba(255,255,255,.92)" : 0
              }
            },
            fruit ? /* @__PURE__ */ React7.createElement(
              "img",
              {
                src: fruit.wholeSrc,
                alt: "",
                draggable: false,
                style: { width: 43, height: 43, objectFit: "contain", WebkitUserDrag: "none" }
              }
            ) : null
          );
        })
      )
    )
  ) : null, dragClone && /* @__PURE__ */ React7.createElement(
    "img",
    {
      src: FRUIT_ITEMS[dragClone.appleId].wholeSrc,
      draggable: false,
      style: {
        position: "absolute",
        left: dragClone.x,
        top: dragClone.y,
        width: 68,
        height: 68,
        objectFit: "contain",
        pointerEvents: "none",
        userSelect: "none",
        WebkitUserDrag: "none",
        zIndex: 50
      },
      alt: ""
    }
  ), /* @__PURE__ */ React7.createElement(
    "button",
    {
      type: "button",
      "aria-label": `\u30B5\u30A4\u30BA ${requestedSize.size} ${requestedSize.weight}`,
      onClick: startSizeChange,
      style: {
        position: "absolute",
        left: SIZE_SELECTOR_POSITION.left,
        bottom: SIZE_SELECTOR_POSITION.bottom,
        padding: 0,
        border: 0,
        background: "transparent",
        color: "#000000",
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: SIZE_SELECTOR_TEXT_STYLE.gap,
        cursor: "pointer",
        zIndex: 40,
        WebkitTapHighlightColor: "transparent"
      }
    },
    /* @__PURE__ */ React7.createElement(
      "span",
      {
        style: {
          font: `400 ${SIZE_SELECTOR_TEXT_STYLE.labelFont}px/1 -apple-system, BlinkMacSystemFont, sans-serif`,
          letterSpacing: 0,
          transform: `translateY(${PAGE_CART_TEXT_STYLE.textOffsetY}px)`
        }
      },
      "(size)"
    ),
    /* @__PURE__ */ React7.createElement(
      "span",
      {
        style: {
          width: SIZE_SELECTOR_CARD_SIZE.width,
          height: SIZE_SELECTOR_CARD_SIZE.height,
          border: "1.4px solid #000000",
          borderRadius: 16,
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "transparent"
        }
      },
      /* @__PURE__ */ React7.createElement(
        "span",
        {
          style: {
            font: `600 ${SIZE_SELECTOR_TEXT_STYLE.sizeFont}px/0.82 -apple-system, BlinkMacSystemFont, sans-serif`,
            letterSpacing: 0
          }
        },
        requestedSize.size
      ),
      /* @__PURE__ */ React7.createElement(
        "span",
        {
          style: {
            marginTop: SIZE_SELECTOR_TEXT_STYLE.weightGap,
            font: `400 ${SIZE_SELECTOR_TEXT_STYLE.weightFont}px/1 -apple-system, BlinkMacSystemFont, sans-serif`,
            letterSpacing: 0
          }
        },
        requestedSize.weight
      )
    )
  ), /* @__PURE__ */ React7.createElement(
    "button",
    {
      ref: pageCartRef,
      type: "button",
      "aria-label": "\u30AB\u30FC\u30C8",
      onClick: openCartDrawer,
      style: {
        position: "absolute",
        right: PAGE_CART_POSITION.right,
        bottom: PAGE_CART_POSITION.bottom,
        padding: 0,
        border: 0,
        background: "transparent",
        display: "flex",
        alignItems: "center",
        gap: PAGE_CART_LAYOUT.iconTextGap,
        cursor: "pointer",
        zIndex: 40,
        boxShadow: "none",
        color: "#000000",
        font: `400 ${PAGE_CART_TEXT_STYLE.fontSize}px/1 -apple-system, BlinkMacSystemFont, sans-serif`,
        letterSpacing: 0,
        WebkitTapHighlightColor: "transparent",
        animation: cartCountMotion ? `cartArrivalPulse ${CART_COUNT_MOTION_MS}ms cubic-bezier(.2,.8,.2,1)` : "none"
      }
    },
    /* @__PURE__ */ React7.createElement(
      "img",
      {
        src: "img/icon/cart.svg",
        draggable: false,
        alt: "",
        style: {
          width: PAGE_CART_ICON_SIZE.width,
          height: PAGE_CART_ICON_SIZE.height,
          display: "block",
          flex: `0 0 ${PAGE_CART_ICON_SIZE.width}px`,
          pointerEvents: "none",
          WebkitUserDrag: "none"
        }
      }
    ),
    /* @__PURE__ */ React7.createElement(
      "span",
      {
        style: {
          display: "block",
          position: "relative",
          transform: `translateY(${PAGE_CART_TEXT_STYLE.textOffsetY}px)`
        }
      },
      "(cart)",
      /* @__PURE__ */ React7.createElement(
        "span",
        {
          "data-page-cart-count": true,
          "aria-label": `\u30AB\u30FC\u30C8\u5185\u306E\u30DC\u30C3\u30AF\u30B9\u6570 ${cartBoxQuantityTotal}`,
          style: {
            position: "absolute",
            right: PAGE_CART_COUNT_STYLE.right,
            top: PAGE_CART_COUNT_STYLE.top,
            width: 30,
            height: PAGE_CART_COUNT_STYLE.fontSize,
            overflow: "hidden",
            font: `400 ${PAGE_CART_COUNT_STYLE.fontSize}px/1 -apple-system, BlinkMacSystemFont, sans-serif`,
            color: "#000000",
            pointerEvents: "none"
          }
        },
        cartCountMotion ? /* @__PURE__ */ React7.createElement(React7.Fragment, null, /* @__PURE__ */ React7.createElement(
          "span",
          {
            "aria-hidden": "true",
            style: {
              position: "absolute",
              inset: 0,
              animation: `cartCountOldUp ${CART_COUNT_MOTION_MS}ms cubic-bezier(.2,.8,.2,1) both`
            }
          },
          cartCountMotion.from
        ), /* @__PURE__ */ React7.createElement(
          "span",
          {
            "aria-hidden": "true",
            style: {
              position: "absolute",
              inset: 0,
              animation: `cartCountNewUp ${CART_COUNT_MOTION_MS}ms cubic-bezier(.2,.8,.2,1) both`
            }
          },
          cartCountMotion.to
        )) : cartBoxQuantityTotal
      )
    )
  ));
}

// src/main.jsx
var { useMemo: useMemo4, useState: useState3, useEffect: useEffect4, useRef: useRef4 } = React8;
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
    defaultPolarAngle
  } = SCENE_SETTINGS;
  const [placedFruits, setPlacedFruits] = useState3([]);
  const [dragClone, setDragClone] = useState3(null);
  const [hoveredCell, setHoveredCell] = useState3(null);
  const [modelDragging, setModelDragging] = useState3(false);
  const [replacementFruitId, setReplacementFruitId] = useState3(null);
  const [replacementMotionKey, setReplacementMotionKey] = useState3(0);
  const [selectedSizeIndex, setSelectedSizeIndex] = useState3(0);
  const [requestedSizeIndex, setRequestedSizeIndex] = useState3(0);
  const [sizeSpinAngle, setSizeSpinAngle] = useState3(0);
  const [displayedScreenShift, setDisplayedScreenShift] = useState3(SIZE_OPTIONS[0].screenShift);
  const [isSizeSpinning, setIsSizeSpinning] = useState3(false);
  const [isSizeShaking, setIsSizeShaking] = useState3(false);
  const [sizeShakeOffsetY, setSizeShakeOffsetY] = useState3(0);
  const [sizeShakeFruitKey, setSizeShakeFruitKey] = useState3(0);
  const [sizeSpinFruitPhase, setSizeSpinFruitPhase] = useState3("visible");
  const [activeCatalogTab, setActiveCatalogTab] = useState3("fruit");
  const [openComboIndex, setOpenComboIndex] = useState3(null);
  const [comboReplacePrompt, setComboReplacePrompt] = useState3(null);
  const [comboReplacePromptSeen, setComboReplacePromptSeen] = useState3(false);
  const [cartOpen, setCartOpen] = useState3(false);
  const [cartBoxes, setCartBoxes] = useState3([]);
  const [cartTransfer, setCartTransfer] = useState3(null);
  const [cartCountMotion, setCartCountMotion] = useState3(null);
  const [expandedCartBoxIds, setExpandedCartBoxIds] = useState3([]);
  const [enteringCartBoxIds, setEnteringCartBoxIds] = useState3([]);
  const [removingCartBoxIds, setRemovingCartBoxIds] = useState3([]);
  const [editingCartBoxId, setEditingCartBoxId] = useState3(null);
  const [cartEditSession, setCartEditSession] = useState3(null);
  const [cartLayoutProgress, setCartLayoutProgress] = useState3(0);
  const [topCatalogLayoutProgress, setTopCatalogLayoutProgress] = useState3(0);
  const selectedSize = SIZE_OPTIONS[selectedSizeIndex];
  const requestedSize = SIZE_OPTIONS[requestedSizeIndex];
  const sizeTransitionActive = isSizeSpinning || isSizeShaking;
  const cartContentOffset = CART_DRAWER_WIDTH * 0.28 * cartLayoutProgress;
  const topCatalogDrawerViewportOffset = CART_DRAWER_WIDTH * topCatalogLayoutProgress;
  const catalogSwitchOffset = topCatalogDrawerViewportOffset / 2 - cartContentOffset;
  const selectedBoxLayout = useMemo4(
    () => createBoxLayout(selectedSize.boxWidth, selectedSize.boxDepth),
    [selectedSize.boxWidth, selectedSize.boxDepth]
  );
  const selectedNoticeLabel = selectedSize.noticeLabel ?? BOX_NOTICE_LABEL_DEFAULT;
  const selectedCellUiOffsets = CELL_UI_OFFSETS_BY_SIZE[selectedSize.size] ?? CELL_UI_OFFSETS_BY_SIZE.M;
  const activeCatalogIndex = Math.max(0, CATALOG_TABS.findIndex((tab) => tab.id === activeCatalogTab));
  const isFruitCatalog = activeCatalogTab === "fruit";
  const activeCatalogItems = isFruitCatalog ? FRUIT_ITEMS : TEST_BOX_ITEMS;
  const activeCatalogCount = activeCatalogItems.length;
  const fruitSlotWidth = 126;
  const getFruitSlots = () => {
    const targetDrawerWidth = cartOpen ? CART_DRAWER_WIDTH : 0;
    const visibleCatalogWidth = Math.min(1580, window.innerWidth - targetDrawerWidth - TOP_CATALOG_SIDE_GAP * 2);
    const availableFruitWidth = Math.max(0, visibleCatalogWidth - 108);
    return Math.max(3, Math.min(FRUITS_PER_PAGE, Math.floor((availableFruitWidth + 34) / fruitSlotWidth)));
  };
  const [fruitSlots, setFruitSlots] = useState3(getFruitSlots);
  const [fruitOffset, setFruitOffset] = useState3(0);
  const [fruitDragDelta, setFruitDragDelta] = useState3(0);
  const [fruitStripDragging, setFruitStripDragging] = useState3(false);
  const [fruitSnapDuration, setFruitSnapDuration] = useState3(420);
  const [fruitEdgePull, setFruitEdgePull] = useState3({ left: 0, right: 0 });
  const maxFruitOffset = Math.max(0, activeCatalogCount - fruitSlots);
  const animatedCatalogWidth = Math.min(1580, window.innerWidth - topCatalogDrawerViewportOffset - TOP_CATALOG_SIDE_GAP * 2);
  const fruitViewportWidth = Math.max(
    3 * fruitSlotWidth - 34,
    Math.min(FRUITS_PER_PAGE * fruitSlotWidth - 34, animatedCatalogWidth - 108)
  );
  const arrowCatalogContainerWidth = window.innerWidth - CART_DRAWER_WIDTH * cartLayoutProgress - TOP_CATALOG_SIDE_GAP * 2;
  const arrowAnimatedCatalogWidth = Math.min(1580, arrowCatalogContainerWidth);
  const arrowFruitViewportWidth = Math.max(
    3 * fruitSlotWidth - 34,
    Math.min(FRUITS_PER_PAGE * fruitSlotWidth - 34, arrowAnimatedCatalogWidth - 108)
  );
  const prevCatalogArrowLeft = arrowCatalogContainerWidth / 2 - arrowFruitViewportWidth / 2 - 36 - TOP_CATALOG_ARROW_GAP;
  const nextCatalogArrowLeft = arrowCatalogContainerWidth / 2 + arrowFruitViewportWidth / 2 + TOP_CATALOG_ARROW_GAP;
  const topCatalogContainerWidth = window.innerWidth - topCatalogDrawerViewportOffset - TOP_CATALOG_SIDE_GAP * 2;
  const catalogMaskLeft = arrowCatalogContainerWidth / 2 - arrowFruitViewportWidth / 2 - (topCatalogContainerWidth / 2 - fruitViewportWidth / 2);
  const fruitStripTranslate = -fruitOffset * fruitSlotWidth + fruitDragDelta;
  const comboHoverPanelWidth = 154;
  const comboHoverPanelLeft = openComboIndex == null ? 0 : openComboIndex * fruitSlotWidth + fruitStripTranslate + 46;
  const liveFruitOffset = Math.max(0, Math.min(maxFruitOffset, -fruitStripTranslate / fruitSlotWidth));
  const canScrollPrev = liveFruitOffset > 0.03;
  const canScrollNext = liveFruitOffset < maxFruitOffset - 0.03;
  const scrollbarReferenceCount = FRUIT_ITEMS.length;
  const scrollbarReferenceMaxOffset = Math.max(0, scrollbarReferenceCount - fruitSlots);
  const fruitContentWidth = scrollbarReferenceCount * fruitSlotWidth - 34;
  const scrollbarTrackWidth = fruitViewportWidth;
  const scrollbarThumbWidth = scrollbarReferenceMaxOffset > 0 ? Math.max(38, scrollbarTrackWidth * fruitViewportWidth / fruitContentWidth) : scrollbarTrackWidth;
  const scrollbarThumbX = scrollbarReferenceMaxOffset > 0 ? (scrollbarTrackWidth - scrollbarThumbWidth) * (liveFruitOffset / scrollbarReferenceMaxOffset) : 0;
  const boxScreenRef = useRef4(null);
  const groupRef = useRef4(null);
  const pageCartRef = useRef4(null);
  const cartTransferTimersRef = useRef4([]);
  const nextPlacedIdRef = useRef4(0);
  const nextPlacementMotionRef = useRef4(0);
  const draggingAppleIdRef = useRef4(null);
  const dragOffsetRef = useRef4({ x: 0, y: 0 });
  const dragStartRef = useRef4({ x: 0, y: 0 });
  const didDragRef = useRef4(false);
  const fruitStripDragRef = useRef4({ active: false, startX: 0, startOffset: 0 });
  const fruitDragDeltaRef = useRef4(0);
  const fruitVelocityRef = useRef4({ x: 0, lastDelta: 0, lastTime: 0 });
  const fruitOffsetRef = useRef4(fruitOffset);
  const maxFruitOffsetRef = useRef4(maxFruitOffset);
  const pendingAppleGestureRef = useRef4(null);
  const pendingComboGestureRef = useRef4(null);
  const requestedSizeIndexRef = useRef4(requestedSizeIndex);
  const selectedSizeIndexRef = useRef4(selectedSizeIndex);
  const displayedScreenShiftRef = useRef4(displayedScreenShift);
  const sizeSpinRunRef = useRef4({ running: false, rafId: 0 });
  const sizeShakeRunRef = useRef4({ running: false, rafId: 0 });
  const sizeSpinFruitTimersRef = useRef4([]);
  const cartLayoutRafRef = useRef4(0);
  const cartLayoutProgressRef = useRef4(cartLayoutProgress);
  const topCatalogLayoutRafRef = useRef4(0);
  const topCatalogLayoutProgressRef = useRef4(topCatalogLayoutProgress);
  fruitOffsetRef.current = fruitOffset;
  maxFruitOffsetRef.current = maxFruitOffset;
  requestedSizeIndexRef.current = requestedSizeIndex;
  selectedSizeIndexRef.current = selectedSizeIndex;
  displayedScreenShiftRef.current = displayedScreenShift;
  cartLayoutProgressRef.current = cartLayoutProgress;
  topCatalogLayoutProgressRef.current = topCatalogLayoutProgress;
  const placeAppleInCell = (prev, appleId, cell) => {
    const motionKey = nextPlacementMotionRef.current++;
    const existingIndex = prev.findIndex((a) => a.cell === cell);
    if (existingIndex >= 0) {
      return prev.map((a) => a.cell === cell ? { ...a, appleId, motionKey } : a);
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
    const edgePullLimit = 46;
    const edgeResistance = 0.24;
    let resistedTranslate = rawTranslate;
    if (rawTranslate > 0) {
      resistedTranslate = Math.min(edgePullLimit, rawTranslate * edgeResistance);
    } else if (rawTranslate < minTranslate) {
      resistedTranslate = minTranslate - Math.min(edgePullLimit, (minTranslate - rawTranslate) * edgeResistance);
    }
    const nextDelta = resistedTranslate + drag.startOffset * fruitSlotWidth;
    setFruitEdgePull({
      left: Math.max(0, resistedTranslate),
      right: Math.max(0, minTranslate - resistedTranslate)
    });
    const now = e.timeStamp || performance.now();
    const velocity = fruitVelocityRef.current;
    const dt = Math.max(1, now - velocity.lastTime);
    const instantVelocity = (nextDelta - velocity.lastDelta) / dt;
    fruitVelocityRef.current = {
      x: velocity.x * 0.35 + instantVelocity * 0.65,
      lastDelta: nextDelta,
      lastTime: now
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
    const momentumDelta = releaseVelocity * 240;
    const maxMomentumSlots = 3;
    const momentumSlots = Math.max(
      -maxMomentumSlots,
      Math.min(maxMomentumSlots, -momentumDelta / fruitSlotWidth)
    );
    const freeOffset = Math.max(
      0,
      Math.min(maxFruitOffsetRef.current, currentOffset + momentumSlots)
    );
    const nearestSlot = Math.round(freeOffset);
    const weakSnapPx = 4;
    const shouldWeakSnap = Math.abs(nearestSlot - freeOffset) * fruitSlotWidth <= weakSnapPx;
    const finalOffset = shouldWeakSnap ? Math.max(0, Math.min(maxFruitOffsetRef.current, nearestSlot)) : freeOffset;
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
  const onApplePointerDown = (e, appleId) => {
    const rect = e.currentTarget.getBoundingClientRect();
    pendingAppleGestureRef.current = {
      active: true,
      appleId,
      rect,
      startX: e.clientX,
      startY: e.clientY,
      startOffset: fruitOffsetRef.current,
      startTime: e.timeStamp || performance.now()
    };
    didDragRef.current = false;
    e.currentTarget.setPointerCapture(e.pointerId);
    e.stopPropagation();
  };
  const onComboPointerDown = (e, comboIndex) => {
    pendingComboGestureRef.current = {
      active: true,
      comboIndex,
      startX: e.clientX,
      startY: e.clientY,
      startOffset: fruitOffsetRef.current,
      startTime: e.timeStamp || performance.now()
    };
    didDragRef.current = false;
    e.currentTarget.setPointerCapture(e.pointerId);
    e.stopPropagation();
  };
  const onWindowMove = (e) => {
    const pendingComboGesture = pendingComboGestureRef.current;
    if (pendingComboGesture?.active) {
      const dx2 = e.clientX - pendingComboGesture.startX;
      const dy2 = e.clientY - pendingComboGesture.startY;
      if (Math.hypot(dx2, dy2) < 6) return;
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
      const dx2 = e.clientX - pendingGesture.startX;
      const dy2 = e.clientY - pendingGesture.startY;
      if (Math.hypot(dx2, dy2) < 6) return;
      didDragRef.current = true;
      pendingAppleGestureRef.current = null;
      if (Math.abs(dx2) > Math.abs(dy2) * 2.75) {
        beginFruitStripDrag(pendingGesture.startX, pendingGesture.startOffset, pendingGesture.startTime);
        updateFruitStripDrag(e);
        return;
      }
      draggingAppleIdRef.current = pendingGesture.appleId;
      setReplacementFruitId(null);
      dragOffsetRef.current = {
        x: pendingGesture.startX - pendingGesture.rect.left,
        y: pendingGesture.startY - pendingGesture.rect.top
      };
      dragStartRef.current = { x: pendingGesture.startX, y: pendingGesture.startY };
      setDragClone({
        appleId: pendingGesture.appleId,
        x: pendingGesture.rect.left,
        y: pendingGesture.rect.top
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
    setDragClone((prev) => prev ? { ...prev, x: nx, y: ny } : prev);
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
    setPlacedFruits((prev) => {
      const box = boxScreenRef.current;
      if (!box) return prev;
      const dropX = e.clientX;
      const dropY = e.clientY;
      const padding = 36;
      if (dropX < box.minX - padding || dropX > box.maxX + padding || dropY < box.minY - padding || dropY > box.maxY + padding) return prev;
      const isRight = dropX > box.centerX;
      const isBottom = dropY > box.centerY;
      let compIdx = 0;
      if (isRight && !isBottom) compIdx = 1;
      if (!isRight && isBottom) compIdx = 2;
      if (isRight && isBottom) compIdx = 3;
      return placeAppleInCell(prev, appleId, compIdx);
    });
  };
  const onAppleClick = (appleId) => {
    if (didDragRef.current) {
      didDragRef.current = false;
      return;
    }
    const firstEmptyCell = [0, 1, 2, 3].find((cell) => !placedFruits.some((a) => a.cell === cell));
    if (firstEmptyCell == null) {
      setReplacementFruitId(appleId);
      setReplacementMotionKey((key) => key + 1);
      setHoveredCell(null);
      return;
    }
    setPlacedFruits((prev) => {
      const nextEmptyCell = [0, 1, 2, 3].find((cell) => !prev.some((a) => a.cell === cell));
      return nextEmptyCell == null ? prev : placeAppleInCell(prev, appleId, nextEmptyCell);
    });
  };
  const placeComboInBox = (comboItem) => {
    const comboCells = comboItem.fruits.slice(0, 4).map((fruit, cell) => ({
      id: nextPlacedIdRef.current++,
      appleId: fruit.appleId,
      cell,
      motionKey: nextPlacementMotionRef.current++
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
  useEffect4(() => {
    window.addEventListener("pointermove", onWindowMove);
    window.addEventListener("pointerup", onWindowUp);
    window.addEventListener("pointercancel", onWindowUp);
    return () => {
      window.removeEventListener("pointermove", onWindowMove);
      window.removeEventListener("pointerup", onWindowUp);
      window.removeEventListener("pointercancel", onWindowUp);
    };
  }, []);
  useEffect4(() => () => {
    cartTransferTimersRef.current.forEach(clearTimeout);
    cartTransferTimersRef.current = [];
  }, []);
  useEffect4(() => {
    const onResize = () => setFruitSlots(getFruitSlots());
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [cartOpen]);
  useEffect4(() => {
    cancelAnimationFrame(cartLayoutRafRef.current);
    const from = cartLayoutProgressRef.current;
    const to = cartOpen ? 1 : 0;
    if (Math.abs(from - to) < 1e-3) {
      setCartLayoutProgress(to);
      return void 0;
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
  useEffect4(() => {
    cancelAnimationFrame(topCatalogLayoutRafRef.current);
    const from = topCatalogLayoutProgressRef.current;
    const to = cartOpen ? 1 : 0;
    if (Math.abs(from - to) < 1e-3) {
      setTopCatalogLayoutProgress(to);
      return void 0;
    }
    const startedAt = performance.now();
    const opening = to > from;
    const duration = opening ? TOP_CATALOG_OPEN_DURATION_MS : TOP_CATALOG_CLOSE_DURATION_MS;
    const easeLayout = opening ? (t) => t * t * (3 - 2 * t) : (t) => 1 - Math.pow(1 - t, 3);
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
  useEffect4(() => {
    setFruitOffset((offset) => Math.min(offset, maxFruitOffset));
  }, [maxFruitOffset]);
  useEffect4(() => {
    sizeSpinFruitTimersRef.current.forEach(clearTimeout);
    sizeSpinFruitTimersRef.current = [];
    if (!isSizeSpinning) {
      setSizeSpinFruitPhase("visible");
      return void 0;
    }
    if (placedFruits.length === 0) return void 0;
    setSizeSpinFruitPhase("visible");
    const fadeTimer = setTimeout(() => {
      setSizeSpinFruitPhase("fading");
    }, SIZE_SPIN_FRUIT_ANIMATION.hideDelayMs);
    const hideTimer = setTimeout(() => {
      setSizeSpinFruitPhase("hidden");
    }, SIZE_SPIN_FRUIT_ANIMATION.hideDelayMs + SIZE_SPIN_FRUIT_ANIMATION.fadeDuration * 1e3);
    sizeSpinFruitTimersRef.current = [fadeTimer, hideTimer];
    return () => {
      sizeSpinFruitTimersRef.current.forEach(clearTimeout);
      sizeSpinFruitTimersRef.current = [];
    };
  }, [isSizeSpinning]);
  useEffect4(() => {
    if (!isSizeShaking || sizeShakeRunRef.current.running) return void 0;
    const run = sizeShakeRunRef.current;
    Object.assign(run, {
      running: true,
      cycleStart: performance.now(),
      startScreenShift: displayedScreenShiftRef.current,
      switched: false
    });
    const tick = (now) => {
      const elapsed = now - run.cycleStart;
      const t = THREE3.MathUtils.clamp(elapsed / SIZE_CHANGE_SHAKE.duration, 0, 1);
      const smooth = (value) => value * value * (3 - 2 * value);
      const latestTargetIndex = requestedSizeIndexRef.current;
      const targetOption = SIZE_OPTIONS[latestTargetIndex];
      const shakeMotion = {
        downDistance: SIZE_CHANGE_SHAKE.downDistance,
        reboundDistance: SIZE_CHANGE_SHAKE.reboundDistance,
        settleDistance: SIZE_CHANGE_SHAKE.settleDistance,
        ...targetOption.shakeMotion ?? {}
      };
      let offsetY = 0;
      if (t < SIZE_CHANGE_SHAKE.switchAt) {
        const rawPhase = t / SIZE_CHANGE_SHAKE.switchAt;
        const phase = 1 - Math.pow(1 - rawPhase, 2);
        offsetY = THREE3.MathUtils.lerp(0, -shakeMotion.downDistance, phase);
      } else if (t < 0.54) {
        const phase = smooth((t - SIZE_CHANGE_SHAKE.switchAt) / (0.54 - SIZE_CHANGE_SHAKE.switchAt));
        offsetY = THREE3.MathUtils.lerp(-shakeMotion.downDistance, shakeMotion.reboundDistance, phase);
      } else if (t < 0.76) {
        const phase = smooth((t - 0.54) / (0.76 - 0.54));
        offsetY = THREE3.MathUtils.lerp(shakeMotion.reboundDistance, -shakeMotion.settleDistance, phase);
      } else {
        const phase = smooth((t - 0.76) / (1 - 0.76));
        offsetY = THREE3.MathUtils.lerp(-shakeMotion.settleDistance, 0, phase);
      }
      setSizeShakeOffsetY(offsetY);
      const finalScreenShiftForTarget = targetOption.screenShift ?? 0.17;
      const switchScreenShiftForTarget = targetOption.switchScreenShift;
      let currentScreenShift;
      if (switchScreenShiftForTarget != null && t >= SIZE_CHANGE_SHAKE.switchAt) {
        const shiftEase = (t - SIZE_CHANGE_SHAKE.switchAt) / (1 - SIZE_CHANGE_SHAKE.switchAt);
        currentScreenShift = THREE3.MathUtils.lerp(
          switchScreenShiftForTarget,
          finalScreenShiftForTarget,
          shiftEase
        );
      } else {
        const shiftEase = t;
        currentScreenShift = THREE3.MathUtils.lerp(
          run.startScreenShift,
          finalScreenShiftForTarget,
          shiftEase
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
        setSizeShakeFruitKey((key) => key + 1);
      }
      if (t < 1) {
        run.rafId = requestAnimationFrame(tick);
        return;
      }
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
  useEffect4(() => {
    if (!isSizeSpinning || sizeSpinRunRef.current.running) return void 0;
    const run = sizeSpinRunRef.current;
    Object.assign(run, {
      running: true,
      progressTurns: 0,
      totalTurns: SIZE_CHANGE_SPIN.turns,
      velocityTurnsPerMs: 0,
      lastTime: performance.now(),
      nextSwitchTurn: SIZE_CHANGE_SPIN.switchAt,
      switchedThisTurn: false
    });
    const tick = (now) => {
      const dt = Math.min(48, Math.max(1, now - run.lastTime));
      run.lastTime = now;
      const remainingTurns = Math.max(0, run.totalTurns - run.progressTurns);
      const cruiseSpeed = 1 / SIZE_CHANGE_SPIN.cruiseMsPerTurn;
      const decelRatio = Math.min(1, remainingTurns / SIZE_CHANGE_SPIN.continueDecelTurns);
      const desiredSpeed = remainingTurns <= SIZE_CHANGE_SPIN.continueDecelTurns ? cruiseSpeed * Math.sqrt(decelRatio) : cruiseSpeed;
      const responseMs = desiredSpeed > run.velocityTurnsPerMs ? SIZE_CHANGE_SPIN.accelMs : SIZE_CHANGE_SPIN.decelMs;
      const velocityMix = Math.min(1, dt / responseMs);
      run.velocityTurnsPerMs += (desiredSpeed - run.velocityTurnsPerMs) * velocityMix;
      if (remainingTurns <= SIZE_CHANGE_SPIN.continueDecelTurns) {
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
      const targetScreenShift = SIZE_OPTIONS[requestedSizeIndexRef.current].screenShift ?? 0.17;
      const shiftMix = Math.min(1, dt / SIZE_CHANGE_SPIN.screenShiftFollowMs);
      const currentScreenShift = displayedScreenShiftRef.current + (targetScreenShift - displayedScreenShiftRef.current) * shiftMix;
      displayedScreenShiftRef.current = currentScreenShift;
      setDisplayedScreenShift(currentScreenShift);
      const currentTurn = Math.floor(run.progressTurns);
      run.switchedThisTurn = run.progressTurns >= currentTurn + SIZE_CHANGE_SPIN.switchAt;
      setSizeSpinAngle(
        SIZE_CHANGE_SPIN.direction * Math.PI * 2 * run.progressTurns
      );
      const remainingAfterFrame = run.totalTurns - run.progressTurns;
      const reachedFinalStop = remainingAfterFrame <= 1e-4;
      if (!reachedFinalStop) {
        run.rafId = requestAnimationFrame(tick);
        return;
      }
      if (selectedSizeIndexRef.current !== requestedSizeIndexRef.current) {
        run.totalTurns += SIZE_CHANGE_SPIN.turns;
        run.rafId = requestAnimationFrame(tick);
        return;
      }
      const finalScreenShift = SIZE_OPTIONS[requestedSizeIndexRef.current].screenShift ?? 0.17;
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
    setPlacedFruits((prev) => prev.filter((a) => a.id !== id));
    setReplacementFruitId(null);
    setHoveredCell(null);
  };
  const startSizeChange = () => {
    setHoveredCell(null);
    setReplacementFruitId(null);
    setRequestedSizeIndex((index) => {
      const nextIndex = (index + 1) % SIZE_OPTIONS.length;
      requestedSizeIndexRef.current = nextIndex;
      return nextIndex;
    });
    setIsSizeShaking(true);
  };
  const replaceFruitInCell = (cell) => {
    if (replacementFruitId == null) return;
    setPlacedFruits((prev) => placeAppleInCell(prev, replacementFruitId, cell));
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
    motionKey: nextPlacementMotionRef.current++
  }));
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
      items: placedFruits.map(({ appleId, cell }) => ({ appleId, cell }))
    };
    const targetSizeIndex = Math.max(0, SIZE_OPTIONS.findIndex((option) => option.size === box.size));
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
    if (!cartEditSession && placedFruits.length === 0 || cartTransfer) return;
    const sortedItems = [...placedFruits].sort((a, b) => a.cell - b.cell).map(({ appleId, cell }) => ({ appleId, cell }));
    if (cartEditSession) {
      const { boxId, originalDraft } = cartEditSession;
      setCartBoxes((prev) => prev.map((box) => box.id === boxId ? {
        ...box,
        size: selectedSize.size,
        weight: selectedSize.weight,
        items: sortedItems
      } : box));
      setCartEditSession(null);
      applyMainBoxSnapshot(originalDraft);
      return;
    }
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
      items: sortedItems
    };
    const shouldExpandNewBox = cartBoxes.length === 0;
    const previousCartCount = cartBoxes.reduce((sum, box) => sum + box.quantity, 0);
    const boxBounds = boxScreenRef.current;
    const cartBounds = pageCartRef.current?.getBoundingClientRect();
    const startX = boxBounds?.centerX ?? window.innerWidth * 0.5;
    const startY = boxBounds?.centerY ?? window.innerHeight * 0.65;
    const endX = cartBounds ? cartBounds.left + PAGE_CART_ICON_SIZE.width * 0.5 : window.innerWidth - PAGE_CART_POSITION.right - PAGE_CART_ICON_SIZE.width * 0.5;
    const endY = cartBounds ? cartBounds.top + cartBounds.height * 0.5 : window.innerHeight - PAGE_CART_POSITION.bottom - PAGE_CART_ICON_SIZE.height * 0.5;
    cartTransferTimersRef.current.forEach(clearTimeout);
    cartTransferTimersRef.current = [];
    setReplacementFruitId(null);
    setHoveredCell(null);
    setCartTransfer({
      snapshot,
      fruits: sortedItems.map((item) => FRUIT_ITEMS[item.appleId]).filter(Boolean),
      startX,
      startY,
      deltaX: endX - startX,
      deltaY: endY - startY,
      arcY: -Math.max(76, Math.min(150, Math.abs(endX - startX) * 0.12))
    });
    setCartBoxes((prev) => [...prev, snapshot]);
    setEnteringCartBoxIds((current) => [...current, snapshot.id]);
    if (shouldExpandNewBox) {
      setExpandedCartBoxIds((current) => current.includes(snapshot.id) ? current : [...current, snapshot.id]);
    }
    setEditingCartBoxId(null);
    const clearTimer = setTimeout(() => {
      setPlacedFruits([]);
      setOpenComboIndex(null);
      setComboReplacePrompt(null);
    }, CART_TRANSFER_CLEAR_DELAY_MS);
    const finishTimer = setTimeout(() => {
      setEnteringCartBoxIds((current) => current.filter((id) => id !== snapshot.id));
      setCartCountMotion({ key: Date.now(), from: previousCartCount, to: previousCartCount + 1 });
      setCartTransfer(null);
      const countTimer = setTimeout(() => setCartCountMotion(null), CART_COUNT_MOTION_MS);
      cartTransferTimersRef.current = [countTimer];
    }, CART_TRANSFER_DURATION_MS);
    cartTransferTimersRef.current = [clearTimer, finishTimer];
  };
  const turnFruitPage = (direction) => {
    setFruitSnapDuration(460);
    setFruitOffset((offset) => Math.max(0, Math.min(maxFruitOffset, offset + direction * fruitSlots)));
  };
  const onFruitStripPointerDown = (e) => {
    if (e.target.closest("button")) return;
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
    setCartBoxes((prev) => prev.map((box) => box.id === boxId ? { ...box, ...patch } : box));
  };
  const toggleCartBoxExpanded = (boxId) => {
    setExpandedCartBoxIds((current) => current.includes(boxId) ? current.filter((id) => id !== boxId) : [...current, boxId]);
  };
  const removeCartBox = (boxId) => {
    if (removingCartBoxIds.includes(boxId)) return;
    if (cartEditSession?.boxId === boxId) cancelCartBoxEdit();
    setRemovingCartBoxIds((current) => [...current, boxId]);
    setTimeout(() => {
      setCartBoxes((prev) => prev.filter((box) => box.id !== boxId));
      setExpandedCartBoxIds((current) => current.filter((id) => id !== boxId));
      setEditingCartBoxId((current) => current === boxId ? null : current);
      setEnteringCartBoxIds((current) => current.filter((id) => id !== boxId));
      setRemovingCartBoxIds((current) => current.filter((id) => id !== boxId));
    }, CART_BOX_LIST_MOTION_MS);
  };
  const setCartBoxQuantity = (boxId, value) => {
    const quantity = Math.max(1, Math.min(99, Number.parseInt(value, 10) || 1));
    updateCartBox(boxId, { quantity });
  };
  const cartBoxQuantityTotal = cartBoxes.reduce(
    (sum, box) => enteringCartBoxIds.includes(box.id) ? sum : sum + box.quantity,
    0
  );
  const cartTotal = cartBoxes.reduce((sum, box) => sum + box.price * box.quantity, 0);
  const activeCartEditBox = cartEditSession ? cartBoxes.find((box) => box.id === cartEditSession.boxId) ?? null : null;
  const formatYen = (value) => `${value.toLocaleString("ja-JP")}\u5186\uFF08\u7A0E\u8FBC\uFF09`;
  return /* @__PURE__ */ React8.createElement(
    "div",
    {
      onPointerDown: () => {
        setOpenComboIndex(null);
        setComboReplacePrompt(null);
      },
      style: { width: "100vw", height: "100vh", overflow: "hidden", background: "#F7F8FA", position: "relative" }
    },
    /* @__PURE__ */ React8.createElement(
      BoxScene,
      {
        displayedScreenShift,
        cartContentOffset,
        lightIntensity,
        sizeShakeOffsetY,
        groupRef,
        rotationX,
        sizeSpinAngle,
        selectedBoxLayout,
        transmission,
        roughness,
        ior,
        glassColor,
        attenuationColor,
        envMapIntensity,
        selectedNoticeLabel,
        setHoveredCell,
        placedFruits,
        sizeSpinFruitPhase,
        selectedSize,
        sizeShakeFruitKey,
        cartTransfer,
        selectedCellUiOffsets,
        replacementFruitId,
        modelDragging,
        sizeTransitionActive,
        hoveredCell,
        replacementMotionKey,
        unsnapApple,
        replaceFruitInCell,
        cancelReplacement,
        clearAllFruits,
        addBoxToCart,
        cartEditSession,
        boxScreenRef,
        setModelDragging,
        rotateLeftRightLimit,
        defaultPolarAngle,
        rotateUpLimit,
        rotateDownLimit
      }
    ),
    /* @__PURE__ */ React8.createElement(
      TopCatalog,
      {
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
        turnFruitPage
      }
    ),
    /* @__PURE__ */ React8.createElement(
      PageOverlayControls,
      {
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
        startSizeChange
      }
    ),
    /* @__PURE__ */ React8.createElement(
      CartDrawer,
      {
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
        cartTotal
      }
    )
  );
}
var root = createRoot(document.getElementById("root"));
root.render(/* @__PURE__ */ React8.createElement(App, null));
//# sourceMappingURL=app.js.map
