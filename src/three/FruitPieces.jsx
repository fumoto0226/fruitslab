/** @jsxRuntime classic */
/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
import * as React from 'react';
const { useMemo, useState, useEffect, useRef } = React;
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  DEFAULT_BOX_LAYOUT,
  CELL_CONTENT_CENTER_SHIFT,
  getCellContentCenterShift,
  SIZE_SHAKE_FRUIT_DROP,
} from '../config/appConfig.js';
import { FRUIT_ITEMS } from '../data/fruitCatalog.js';
import {
  FRUIT_DROP_ANIMATION,
  SIZE_SPIN_FRUIT_ANIMATION,
  seededUnit,
  easeOutCubic,
  easeOutBounce,
} from '../utils/fruitAnimation.js';

// 水果旋转隐藏后还会再次出现，因此保留已解码纹理，避免重新挂载时异步解码造成单帧闪烁。
    const FRUIT_TEXTURE_CACHE = new Map();
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
      exitDuration = FRUIT_DROP_ANIMATION.exitDuration,
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
          delay: FRUIT_DROP_ANIMATION.appearDuration + Math.floor(pieceIndex / 2) * FRUIT_DROP_ANIMATION.stagger + (pieceIndex % 2) * 0.016,
          duration: FRUIT_DROP_ANIMATION.duration + seededUnit(seed + 1) * 0.12,
          startOffset: [
            (seededUnit(seed + 2) - 0.5) * 0.13,
            FRUIT_DROP_ANIMATION.dropHeight + seededUnit(seed + 3) * 0.14,
            0,
          ],
          startRotation: [
            0,
            0,
            side * (0.14 + seededUnit(seed + 7) * 0.18),
          ],
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
          rotation: side * (SIZE_SHAKE_FRUIT_DROP.rotation + seededUnit(seed + 3) * 0.045),
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
            1,
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
          const t = THREE.MathUtils.clamp(
            settleElapsedRef.current / SIZE_SHAKE_FRUIT_DROP.duration,
            0,
            1,
          );
          const settle = easeOutCubic(t);
          const bounce = easeOutBounce(t);
          mesh.position.set(
            THREE.MathUtils.lerp(settleStartRef.current.x, 0, settle),
            THREE.MathUtils.lerp(settleStartRef.current.y, 0, bounce),
            0,
          );
          mesh.rotation.set(
            0,
            0,
            THREE.MathUtils.lerp(settleStartRef.current.rotation, 0, settle),
          );
          if (t >= 1) {
            mesh.position.set(0, 0, 0);
            mesh.rotation.set(0, 0, 0);
            settleActiveRef.current = false;
          }
          return;
        }

        if (finishedRef.current) return;
        elapsedRef.current += Math.min(delta, 0.05);
        // 淡入和下落必须同一时刻开始，避免切片先在空中静止闪现再下落。
        const fadeStart = motion.delay;
        if (elapsedRef.current < fadeStart) {
          mesh.visible = false;
          return;
        }

        mesh.visible = true;
        const appearProgress = THREE.MathUtils.clamp(
          (elapsedRef.current - fadeStart) / FRUIT_DROP_ANIMATION.appearDuration,
          0,
          1,
        );
        material.opacity = easeOutCubic(appearProgress);
        // 整个下落过程保持同一种透明材质模式，避免在空中切换 shader 导致单帧跳变。
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
          0,
        );
        mesh.rotation.set(
          0,
          0,
          THREE.MathUtils.lerp(motion.startRotation[2], 0, settle),
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

      return (
        <group position={targetPosition} rotation={targetRotation}>
          <mesh
            ref={meshRef}
            position={motion.startOffset}
            rotation={motion.startRotation}
            visible={false}
            renderOrder={20 + layer}
          >
            <planeGeometry args={[planeSize, planeSize]} />
            {/* 父组固定最终层级，切片只在自身平面内运动；真实深度负责横杆和玻璃遮挡。 */}
            <meshBasicMaterial
              ref={materialRef}
              map={texture}
              transparent
              opacity={0}
              alphaTest={0.02}
              depthTest
              depthWrite
              side={THREE.DoubleSide}
              toneMapped={false}
            />
          </mesh>
        </group>
      );
    }

    /* 每片水果都是独立的无光照平面，并继承盒子的旋转。
       固定绘制顺序只控制水果之间的遮挡，不影响盒子对水果的遮挡。 */
    function Apple3D({
      appleId,
      cellIndex,
      layout = DEFAULT_BOX_LAYOUT,
      boxSize = 'M',
      animationKey = 0,
      settleKey = 0,
      exiting = false,
      exitDuration = FRUIT_DROP_ANIMATION.exitDuration,
    }) {
      const cell = layout.cells[cellIndex];
      const fruit = FRUIT_ITEMS[appleId];
      const texture = useAppleTexture(fruit.cutSrc);
      /* ===== 默认水果组放进盒子后的样式：按 S / M / L 分开调 =====
         这个组包含：苹果、草莓、梨、橘子、猕猴桃、西瓜等没有 boxStyle 的水果。
         M：每排两组，每组 2 片，一共 2x2 组。
         L：每排两组，每组 3 片，保持片间距不压缩。
         S：每排一组，每组 3 片，一共两排。
      */
      const defaultStylesBySize = {
        M: {
          planeTilt: -1.05,
          planeSize: 0.6,
          columnDepthStep: 0.008,
          columns: [-0.32, -0.19, 0.1, 0.23],
          rotations: [-0.045, -0.018, 0.018, 0.045, -0.04, -0.012, 0.02, 0.05],
          rows: [
            // 屏幕上排：xShift 越小越靠左；z 越小越靠盒子深处。
            { y: 0.02, z: -0.12, xShift: -0.04 },
            // 屏幕下排：xShift 越大越靠右；z 越大越靠盒子开口，并遮住上排。
            { y: 0.07, z: 0.13, xShift: 0.10 },
          ],
        },
        L: {
          planeTilt: -1.05,
          planeSize: 0.6,
          columnDepthStep: 0.008,
          columns: [-0.45, -0.32, -0.19, 0.10, 0.23, 0.36],
          rotations: [
            -0.055, -0.038, -0.018, 0.018, 0.038, 0.055,
            -0.052, -0.035, -0.012, 0.020, 0.040, 0.060,
          ],
          rows: [
            { y: 0.02, z: -0.12, xShift: -0.02 },
            { y: 0.07, z: 0.13, xShift: 0.08 },
          ],
        },
        S: {
          planeTilt: -1.05,
          planeSize: 0.6,
          columnDepthStep: 0.008,
          columns: [-0.13, 0.00, 0.13],
          rotations: [-0.035, 0.000, 0.035, -0.030, 0.006, 0.040],
          rows: [
            { y: 0.02, z: -0.12, xShift: -0.02 },
            { y: 0.07, z: 0.13, xShift: 0.04 },
          ],
        },
      };
      const defaultStyle = defaultStylesBySize[boxSize] ?? defaultStylesBySize.M;

      /*
      const oldDefaultStyle = {
        planeTilt: -1.05,
        planeSize: 0.6,
        columnDepthStep: 0.008,
        columns: [-0.32, -0.19, 0.1, 0.23],
        rotations: [-0.045, -0.018, 0.018, 0.045, -0.04, -0.012, 0.02, 0.05],
        rows: [
          // 屏幕上排：xShift 越小越靠左；z 越小越靠盒子深处。
          { y: 0.02, z: -0.12, xShift: -0.04 },
          // 屏幕下排：xShift 越大越靠右；z 越大越靠盒子开口，并遮住上排。
          { y: 0.07, z: 0.13, xShift: 0.10 },
        ],
      };
      */

      /* ===== 桃子放进盒子后的样式：按 S / M / L 分开调 =====
         planeSize：桃子切片整体大小，数值越大整体越大。
         columns：每排的切片左右位置；L 是两组各 3 片，M 是原来的两组各 2 片，S 是一组 3 片。
         rows[0].y / rows[1].y：两排的上下位置；两个数差距越大，上下两排间距越宽。
         rows[0].z / rows[1].z：两排在盒子里的前后深度；差距越大，遮挡层次和透视分离越明显。
         rows[*].xShift：单独调整某一排左右位置，避免碰到小格子边缘。
      */
      // S 尺寸桃子上排的屏幕上下位置：数值越小越往屏幕下方移动，可在这里单独微调。
      const peachStylesBySize = {
        M: {
          planeTilt: -1.05,
          planeSize: 0.72,
          columnDepthStep: 0.008,
          columns: [-0.34, -0.18, 0.08, 0.24],
          rotations: [-0.045, -0.018, 0.018, 0.045, -0.04, -0.012, 0.02, 0.05],
          rows: [
            { y: -0.02, z: -0.14, xShift: 0.00 },
            { y: 0.10, z: 0.18, xShift: 0.09 },
          ],
        },
        L: {
          planeTilt: -1.05,
          planeSize: 0.72,
          columnDepthStep: 0.008,
          columns: [-0.44, -0.31, -0.18, 0.06, 0.19, 0.32],
          rotations: [
            -0.055, -0.040, -0.020, 0.018, 0.040, 0.058,
            -0.052, -0.035, -0.014, 0.020, 0.042, 0.060,
          ],
          rows: [
            { y: -0.02, z: -0.14, xShift: 0.02 },
            { y: 0.10, z: 0.18, xShift: 0.07 },
          ],
        },
        S: {
          planeTilt: -1.05,
          planeSize: 0.72,
          columnDepthStep: 0.008,
          columns: [-0.16, 0.00, 0.16],
          rotations: [-0.040, 0.000, 0.040, -0.035, 0.006, 0.045],
          rows: [
            { y: -0.05, z: -0.06, xShift: -0.02 },
            { y: 0.08, z: 0.14, xShift: 0.04 },
          ],
        },
      };
      const peachStyle = peachStylesBySize[boxSize] ?? peachStylesBySize.M;

      /* ===== 樱桃和葡萄放进盒子后的样式：按 S / M / L 分开调 =====
         planeSize：每个切片的大小，数值越大每片越大。
         columns：每排切片位置；每两个数字靠近就是一组，两组之间拉开就是组间距。
         rows：一共三排。y 调上下位置，z 调盒子前后深度，xShift 调整整排左右位置。
      */
      const cherryGrapeStylesBySize = {
        M: {
          planeTilt: -1.05,
          planeSize: 0.34,
          cellContentCenterShift: 0.035, // 葡萄/樱桃组左右格子居中修正：数值越大，左格越往左、右格越往右。
          layoutPitchRotation: Math.PI / 12, // 樱桃/葡萄整组往前转角度：Math.PI / 9 约等于 20 度
          columnDepthStep: 0.006,
          columns: [-0.46, -0.31, -0.10, 0.05, 0.26, 0.41],
          rotations: [
            -0.05, -0.025, -0.012, 0.012, 0.025, 0.05,
            -0.045, -0.02, -0.008, 0.014, 0.03, 0.055,
            -0.04, -0.018, 0.0, 0.018, 0.036, 0.06,
          ],
          rows: [
            { y: -0.08, z: -0.22, xShift: -0.01 },
            { y: 0.00, z: 0.00, xShift: 0.02 },
            { y: 0.08, z: 0.22, xShift: 0.05 },
          ],
        },
        L: {
          planeTilt: -1.05,
          planeSize: 0.34,
          cellContentCenterShift: 0.035, // 葡萄/樱桃组左右格子居中修正：数值越大，左格越往左、右格越往右。
          groupXShift: -0.035, // L 尺寸葡萄/樱桃整体左右位置：负数往左，正数往右。
          layoutPitchRotation: Math.PI / 12,
          columnDepthStep: 0.006,
          columns: [-0.50, -0.39, -0.18, -0.07, 0.14, 0.25, 0.46, 0.57],
          rotations: [
            -0.06, -0.04, -0.026, -0.010, 0.010, 0.026, 0.040, 0.060,
            -0.055, -0.035, -0.022, -0.006, 0.012, 0.030, 0.046, 0.064,
            -0.050, -0.030, -0.016, 0.000, 0.018, 0.036, 0.052, 0.070,
          ],
          rows: [
            { y: -0.08, z: -0.22, xShift: -0.02 },
            { y: 0.00, z: 0.00, xShift: 0.01 },
            { y: 0.08, z: 0.22, xShift: 0.04 },
          ],
        },
        S: {
          planeTilt: -1.05,
          planeSize: 0.34,
          cellContentCenterShift: 0.035, // 葡萄/樱桃组左右格子居中修正：数值越大，左格越往左、右格越往右。
          layoutPitchRotation: Math.PI / 12,
          columnDepthStep: 0.006,
          columns: [-0.28, -0.13, 0.13, 0.28],
          rotations: [
            -0.040, -0.018, 0.018, 0.040,
            -0.036, -0.014, 0.020, 0.044,
            -0.032, -0.010, 0.024, 0.048,
          ],
          rows: [
            { y: -0.06, z: -0.22, xShift: -0.01 },
            { y: 0.00, z: 0.00, xShift: 0.02 },
            { y: 0.06, z: 0.22, xShift: 0.05 },
          ],
        },
      };
      const cherryGrapeStyle = cherryGrapeStylesBySize[boxSize] ?? cherryGrapeStylesBySize.M;

      /* ===== 芒果放进盒子后的样式：按 S / M / L 分开调 =====
         planeSize：每个芒果切片大小。
         columns：每排切片位置；L 一排 4 片，M 一排 3 片，S 一排 2 片。
         rows：一共两排。y 调上下位置，z 调前后深度，xShift 调整整排左右位置。
      */
      const mangoStylesBySize = {
        M: {
          planeTilt: -1.05,
          planeSize: 0.58,
          columnDepthStep: 0.01,
          columns: [-0.30, 0.00, 0.30],
          rotations: [-0.04, 0.00, 0.04, -0.03, 0.01, 0.05],
          rows: [
            { y: -0.07, z: -0.07, xShift: -0.02 },
            { y: 0.05, z: 0.12, xShift: 0.04 },
          ],
        },
        L: {
          planeTilt: -1.05,
          planeSize: 0.58,
          columnDepthStep: 0.01,
          columns: [-0.39, -0.13, 0.13, 0.39],
          rotations: [-0.05, -0.018, 0.018, 0.05, -0.04, -0.010, 0.024, 0.058],
          rows: [
            { y: -0.07, z: -0.07, xShift: -0.02 },
            { y: 0.05, z: 0.12, xShift: 0.04 },
          ],
        },
        S: {
          planeTilt: -1.05,
          planeSize: 0.58,
          columnDepthStep: 0.01,
          columns: [-0.16, 0.16],
          rotations: [-0.035, 0.035, -0.025, 0.045],
          rows: [
            { y: -0.04, z: -0.07, xShift: -0.02 },
            { y: 0.05, z: 0.12, xShift: 0.04 },
          ],
        },
      };
      const mangoStyle = mangoStylesBySize[boxSize] ?? mangoStylesBySize.M;

      const style = fruit.boxStyle === 'peach'
        ? peachStyle
        : fruit.boxStyle === 'cherryGrape'
          ? cherryGrapeStyle
          : fruit.boxStyle === 'mango'
            ? mangoStyle
            : defaultStyle;
      // 左侧格子整体向左校正，右侧格子整体向右校正；部分水果组可以用自己的数值。
      const cellCenterShift = getCellContentCenterShift(
        cellIndex,
        layout,
        style.cellContentCenterShift ?? CELL_CONTENT_CENTER_SHIFT
      );
      const columnCount = style.columns.length;
      const rawPieces = style.rows.flatMap((row, rowIndex) =>
        style.columns.map((x, columnIndex) => ({
          x: x + row.xShift + (style.groupXShift ?? 0),
          y: row.y,
          // 每片增加少量真实前后间距来产生视差，renderOrder 固定重叠顺序。
          z: row.z + (columnCount - 1 - columnIndex) * style.columnDepthStep,
          rotation: style.rotations[rowIndex * columnCount + columnIndex] ?? 0,
          layer: rowIndex * columnCount + (columnCount - 1 - columnIndex),
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
          planeTilt: style.planeTilt + layoutPitchRotation,
        };
      });

      return (
        <group>
          {pieces.map((piece, index) => (
            <AnimatedFruitPiece
              key={`${boxSize}-${index}`}
              targetPosition={[
                cell.x + cellCenterShift + piece.x,
                cell.y - 0.08 + piece.y,
                cell.z + piece.z,
              ]}
              targetRotation={[piece.planeTilt ?? style.planeTilt, 0, piece.rotation]}
              planeSize={style.planeSize}
              texture={texture}
              layer={piece.layer}
              pieceIndex={index}
              cellIndex={cellIndex}
              animationKey={animationKey}
              settleKey={settleKey}
              exiting={exiting}
              exitDuration={exitDuration}
            />
          ))}
        </group>
      );
    }

    /* 格子内容替换时保留旧水果完成淡出，再切换并播放新水果的落下动画。 */
    export function FruitSlot3D({
      appleId,
      cellIndex,
      layout = DEFAULT_BOX_LAYOUT,
      boxSize = 'M',
      animationKey,
      settleKey = 0,
      forceExiting = false,
      forceExitDuration = FRUIT_DROP_ANIMATION.exitDuration,
    }) {
      const [displayedFruit, setDisplayedFruit] = useState({ appleId, animationKey });
      const [exiting, setExiting] = useState(false);

      useEffect(() => {
        if (
          displayedFruit.appleId === appleId &&
          displayedFruit.animationKey === animationKey
        ) {
          setExiting(false);
          return undefined;
        }

        setExiting(true);
        const timer = setTimeout(() => {
          setDisplayedFruit({ appleId, animationKey });
          setExiting(false);
        }, FRUIT_DROP_ANIMATION.exitDuration * 1000);
        return () => clearTimeout(timer);
      }, [appleId, animationKey, displayedFruit.appleId, displayedFruit.animationKey]);

      return (
        <Apple3D
          appleId={displayedFruit.appleId}
          cellIndex={cellIndex}
          layout={layout}
          boxSize={boxSize}
          animationKey={displayedFruit.animationKey}
          settleKey={settleKey}
          exiting={exiting || forceExiting}
          exitDuration={forceExiting ? forceExitDuration : FRUIT_DROP_ANIMATION.exitDuration}
        />
      );
    }

