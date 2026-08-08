/** @jsxRuntime classic */
/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
import * as React from 'react';
const { useMemo, useEffect, useRef, useState } = React;
import { useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import {
  DEFAULT_BOX_LAYOUT,
  PRESS_HIDE_START_DELAY,
  PRESS_UI_DISMISS_TRANSITION_MS,
  PRESS_ROUND_BUTTON_DISMISS_DAMP,
  CELL_INFO_PRESS_HIDE_DELAY,
  CELL_INFO_PRESS_TRANSITION_MS,
  CELL_INFO_HOVER_HIDE_DELAY,
  CELL_INFO_HOVER_TRANSITION_MS,
  CELL_CLOSE_HOVER_HIDE_DELAY,
  CELL_CLOSE_HOVER_DISMISS_DAMP,
  BOX_ACTION_HIDE_START_DELAY,
  BOX_ACTION_HOVER_OPEN_DELAY,
  BOX_ACTION_HOVER_CLOSE_DELAY,
  BOX_ACTION_WIDTH_TRANSITION_MS,
  BOX_ACTION_SCALE_TRANSITION_MS,
  BOX_ACTION_EASING,
  BOX_ACTION_CLICK_SPIN_MS,
  BOX_NOTICE_LABEL_DEFAULT,
  BOX_NOTICE_TEXT_COLOR,
  BOX_NOTICE_TEXT_OPACITY,
} from '../config/appConfig.js';
import { FRUIT_ITEMS } from '../data/fruitCatalog.js';

/* 正对镜头的 3D 圆形按钮：仍参与 WebGL 深度遮挡，但不受场景光影影响。 */
    function RoundButton3D({
      position,
      onClick,
      background = '#ffffff',
      color = '#111111',
      scale = 0.14,
      visible = true,
      hideDelay = CELL_CLOSE_HOVER_HIDE_DELAY,
      dismissDamp = CELL_CLOSE_HOVER_DISMISS_DAMP,
    }) {
      const spriteRef = useRef(null);
      const progressRef = useRef(0);
      const hideTimerRef = useRef(null);
      const [delayedVisible, setDelayedVisible] = useState(false);
      const texture = useMemo(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        ctx.clearRect(0, 0, 256, 256);
        ctx.beginPath();
        ctx.arc(128, 128, 80, 0, Math.PI * 2);
        ctx.fillStyle = background;
        ctx.fill();

        ctx.strokeStyle = color;
        ctx.lineWidth = 10;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(106, 106);
        ctx.lineTo(150, 150);
        ctx.moveTo(150, 106);
        ctx.lineTo(106, 150);
        ctx.stroke();

        const map = new THREE.CanvasTexture(canvas);
        map.colorSpace = THREE.SRGBColorSpace;
        map.premultiplyAlpha = true;
        map.minFilter = THREE.LinearFilter;
        map.magFilter = THREE.LinearFilter;
        map.generateMipmaps = false;
        map.needsUpdate = true;
        return map;
      }, [background, color]);

      useEffect(() => () => texture.dispose(), [texture]);

      useEffect(() => {
        if (hideTimerRef.current) {
          clearTimeout(hideTimerRef.current);
          hideTimerRef.current = null;
        }
        if (visible) {
          setDelayedVisible(true);
          return undefined;
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

      useFrame((_, delta) => {
        const target = delayedVisible ? 1 : 0;
        const next = THREE.MathUtils.damp(progressRef.current, target, dismissDamp, delta);
        progressRef.current = Math.abs(next - target) < 0.003 ? target : next;
        const progress = progressRef.current;
        if (spriteRef.current) {
          spriteRef.current.visible = delayedVisible || progress > 0.01;
          const currentScale = Math.max(0.001, scale * progress);
          spriteRef.current.scale.set(currentScale, currentScale, 1);
        }
      });

      return (
        <sprite
          ref={spriteRef}
          position={position}
          scale={[0.001, 0.001, 1]}
          onClick={(e) => {
            e.stopPropagation();
            if (delayedVisible) onClick();
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            if (!delayedVisible) return;
            document.body.style.cursor = 'pointer';
          }}
          onPointerOut={() => { document.body.style.cursor = 'default'; }}
        >
          <spriteMaterial
            map={texture}
            transparent
            premultipliedAlpha
            alphaTest={0.35}
            depthTest
            depthWrite
            toneMapped={false}
          />
        </sprite>
      );
    }

    export function CloseButton3D({ position, onRemove, visible, hideDelay, dismissDamp }) {
      return (
        <RoundButton3D
          position={position}
          onClick={onRemove}
          scale={0.15}
          visible={visible}
          hideDelay={hideDelay}
          dismissDamp={dismissDamp}
        />
      );
    }

    /* 保留 HTML 的清晰度和点击稳定性，但让内容旋转角度跟随盒子的局部轴向。 */
    function ModelAlignedHtml({
      position,
      center = false,
      transformOrigin = 'center center',
      axis = 'x',
      maxTilt = null,
      style,
      children,
    }) {
      const anchorRef = useRef(null);
      const contentRef = useRef(null);
      const origin = useMemo(() => new THREE.Vector3(), []);
      const axisPoint = useMemo(() => new THREE.Vector3(), []);
      const lastAngleRef = useRef(null);

      useFrame(({ camera, size }) => {
        if (!anchorRef.current || !contentRef.current) return;
        anchorRef.current.updateWorldMatrix(true, false);
        origin.set(0, 0, 0).applyMatrix4(anchorRef.current.matrixWorld).project(camera);
        if (axis === 'z') {
          axisPoint.set(0, 0, 1);
        } else if (axis === 'y') {
          axisPoint.set(0, 1, 0);
        } else {
          axisPoint.set(1, 0, 0);
        }
        axisPoint.applyMatrix4(anchorRef.current.matrixWorld).project(camera);
        const dx = (axisPoint.x - origin.x) * size.width * 0.5;
        const dy = -(axisPoint.y - origin.y) * size.height * 0.5;
        const rawAngle = Math.atan2(dy, dx) * 180 / Math.PI;
        const angle = maxTilt == null
          ? rawAngle
          : THREE.MathUtils.clamp(rawAngle, -maxTilt, maxTilt);
        if (lastAngleRef.current == null || Math.abs(angle - lastAngleRef.current) > 0.001) {
          contentRef.current.style.transform = `rotate(${angle}deg)`;
          lastAngleRef.current = angle;
        }
      });

      return (
        <group ref={anchorRef} position={position}>
          <Html center={center} style={style}>
            <div ref={contentRef} style={{ transformOrigin }}>
              {children}
            </div>
          </Html>
        </group>
      );
    }

    export function CellInfoLabel3D({
      position,
      appleId,
      visible,
      hideDelay = CELL_INFO_HOVER_HIDE_DELAY,
      transitionMs = CELL_INFO_HOVER_TRANSITION_MS,
    }) {
      const fruit = FRUIT_ITEMS[appleId];
      const hideTimerRef = useRef(null);
      const [delayedVisible, setDelayedVisible] = useState(false);

      useEffect(() => {
        if (hideTimerRef.current) {
          clearTimeout(hideTimerRef.current);
          hideTimerRef.current = null;
        }
        if (visible) {
          setDelayedVisible(true);
          return undefined;
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

      return (
        <ModelAlignedHtml
          position={position}
          transformOrigin="left center"
          style={{ pointerEvents: 'none' }}
        >
          <div
            style={{
              opacity: delayedVisible ? 1 : 0,
              transition: `opacity ${transitionMs}ms cubic-bezier(.16,1,.3,1)`,
              color: '#111111',
              font: '12px/1.2 -apple-system, BlinkMacSystemFont, sans-serif',
              letterSpacing: 0,
              whiteSpace: 'nowrap',
              textAlign: 'left',
            }}
          >
            {fruit.name} 200g
          </div>
        </ModelAlignedHtml>
      );
    }

    export function BoxNoticeLabel3D({ layout = DEFAULT_BOX_LAYOUT, noticeLabel = BOX_NOTICE_LABEL_DEFAULT }) {
      const gl = useThree(state => state.gl);
      const texture = useMemo(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 2048;
        canvas.height = 672;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // 只绘制白色字形蒙版；颜色由材质统一赋予，避免透明黑色污染字体边缘。
        ctx.fillStyle = '#ffffff';
        ctx.font = '400 110px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.textBaseline = 'top';
        ['※画像はイメージです。', 'フルーツのカット数は', '重量に応じて異なります。']
          .forEach((line, index) => ctx.fillText(line, 44, 40 + index * 176));

        const map = new THREE.CanvasTexture(canvas);
        map.minFilter = THREE.LinearMipmapLinearFilter;
        map.magFilter = THREE.LinearFilter;
        map.generateMipmaps = true;
        map.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy());
        map.needsUpdate = true;
        return map;
      }, [gl]);

      useEffect(() => () => texture.dispose(), [texture]);

      return (
        <mesh
          position={[
            noticeLabel.x,
            noticeLabel.y,
            layout.boxD / 2 + noticeLabel.zOffset,
          ]}
          renderOrder={20}
        >
          <planeGeometry args={[noticeLabel.width, noticeLabel.height]} />
          <meshBasicMaterial
            alphaMap={texture}
            color={BOX_NOTICE_TEXT_COLOR}
            opacity={BOX_NOTICE_TEXT_OPACITY}
            transparent
            alphaTest={0.012}
            depthWrite={false}
            toneMapped={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      );
    }

    /* 替换模式按钮：跟随盒子的 3D 坐标，但用 HTML 绘制，不受水果、光影或玻璃折射影响。 */
    export function ReplaceButton3D({ position, onReplace, visible, animationKey }) {
      const [shown, setShown] = useState(false);
      const [exiting, setExiting] = useState(false);
      const frameRef = useRef(null);
      const timerRef = useRef(null);

      useEffect(() => {
        if (frameRef.current) cancelAnimationFrame(frameRef.current);
        if (timerRef.current) clearTimeout(timerRef.current);
        setExiting(false);
        if (!visible) {
          setShown(false);
          return undefined;
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

      return (
        <ModelAlignedHtml
          position={position}
          center
          style={{ pointerEvents: 'none' }}
        >
          <div
            style={{
              transform: active ? 'scale(1)' : 'scale(0.001)',
              transition: 'transform 180ms cubic-bezier(.2,.85,.2,1.08)',
              transformOrigin: 'center center',
              pointerEvents: active ? 'auto' : 'none',
            }}
          >
	              <button
              type="button"
              aria-label="この果物と入れ替え"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                if (!active) return;
                setExiting(true);
                timerRef.current = setTimeout(onReplace, 130);
              }}
              style={{
                width: 78,
                height: 28,
                padding: 0,
                border: 0,
                borderRadius: 999,
                background: '#111111',
                color: '#ffffff',
                boxShadow: 'none',
                display: 'grid',
                placeItems: 'center',
                font: '500 12px/1 -apple-system, BlinkMacSystemFont, sans-serif',
                letterSpacing: 0,
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                pointerEvents: 'auto',
              }}
            >
              入れ替え
            </button>
          </div>
        </ModelAlignedHtml>
      );
    }

    /* 替换模式共用一个取消按钮；纯 HTML 绘制可彻底避免玻璃产生彩色拖影。 */
    export function CancelReplacementButton3D({ position, onCancel, visible }) {
      return (
        <Html position={position} center style={{ pointerEvents: 'none' }}>
          <div
            style={{
              transform: visible ? 'scale(1)' : 'scale(0.001)',
              transition: 'transform 220ms cubic-bezier(.2,.85,.2,1.12)',
              transformOrigin: 'center center',
              pointerEvents: visible ? 'auto' : 'none',
            }}
          >
            <button
              type="button"
              aria-label="入れ替えをキャンセル"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                if (visible) onCancel();
              }}
              style={{
                width: 20,
                height: 20,
                padding: 0,
                border: 0,
                borderRadius: '50%',
                background: '#111111',
                color: '#ffffff',
                boxShadow: 'none',
                display: 'grid',
                placeItems: 'center',
                letterSpacing: 0,
                cursor: 'pointer',
                pointerEvents: 'auto',
              }}
            >
              <span style={{ position: 'relative', width: 9, height: 9, display: 'block' }}>
                <span
                  style={{
                    position: 'absolute',
                    left: 3.8,
                    top: 0,
                    width: 1.4,
                    height: 9,
                    borderRadius: 999,
                    background: '#ffffff',
                    transform: 'rotate(45deg)',
                  }}
                />
                <span
                  style={{
                    position: 'absolute',
                    left: 3.8,
                    top: 0,
                    width: 1.4,
                    height: 9,
                    borderRadius: 999,
                    background: '#ffffff',
                    transform: 'rotate(-45deg)',
                  }}
                />
              </span>
            </button>
          </div>
        </Html>
      );
    }

    function BoxActionPill({ variant, label, icon, onClick, visible }) {
      const hideTimerRef = useRef(null);
      const expandTimerRef = useRef(null);
      const collapseTimerRef = useRef(null);
      const clickTimerRef = useRef(null);
      const [delayedVisible, setDelayedVisible] = useState(false);
      const [expanded, setExpanded] = useState(false);
      const [clickMotionKey, setClickMotionKey] = useState(0);

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

      useEffect(() => {
        if (hideTimerRef.current) {
          clearTimeout(hideTimerRef.current);
          hideTimerRef.current = null;
        }
        if (visible) {
          setDelayedVisible(true);
          return undefined;
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

      useEffect(() => () => {
        clearHoverTimers();
        if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
      }, []);

      const isDark = variant === 'dark';
      return (
        <button
          type="button"
          aria-label={label}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
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
          }}
          style={{
            '--closed-width': '24px',
            '--open-width': isDark ? '116px' : '74px',
            width: expanded ? 'var(--open-width)' : 'var(--closed-width)',
            height: 24,
            padding: 0,
            border: isDark ? '0 solid #111111' : '1.25px solid #111111',
            borderRadius: 999,
            background: isDark ? '#111111' : 'transparent',
            color: isDark ? '#ffffff' : '#111111',
            boxSizing: 'border-box',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            overflow: 'hidden',
            cursor: visible && delayedVisible ? 'pointer' : 'default',
            pointerEvents: visible && delayedVisible ? 'auto' : 'none',
            transform: delayedVisible ? 'scale(1)' : 'scale(0.001)',
            // 圆形图标宽 24px：以 x=12px 的圆心缩放；宽度展开仍然从左边向右。
            transformOrigin: '12px center',
            transition:
              `width ${BOX_ACTION_WIDTH_TRANSITION_MS}ms ${BOX_ACTION_EASING}, transform ${BOX_ACTION_SCALE_TRANSITION_MS}ms ${BOX_ACTION_EASING}`,
            boxShadow: 'none',
            letterSpacing: 0,
            WebkitTapHighlightColor: 'transparent',
          }}
          onPointerEnter={() => {
            if (!visible || !delayedVisible) return;
            clearHoverTimers();
            expandTimerRef.current = setTimeout(() => {
              setExpanded(true);
              expandTimerRef.current = null;
            }, BOX_ACTION_HOVER_OPEN_DELAY);
          }}
          onPointerLeave={() => {
            if (expandTimerRef.current) {
              clearTimeout(expandTimerRef.current);
              expandTimerRef.current = null;
            }
            if (collapseTimerRef.current) clearTimeout(collapseTimerRef.current);
            // 展开文字收回延迟：数值越大，鼠标移开后停留越久。
            collapseTimerRef.current = setTimeout(() => {
              setExpanded(false);
              collapseTimerRef.current = null;
            }, BOX_ACTION_HOVER_CLOSE_DELAY);
          }}
        >
          <span
            key={clickMotionKey}
            aria-hidden="true"
            style={{
              width: isDark ? 24 : 22,
              height: isDark ? 24 : 22,
              flex: `0 0 ${isDark ? 24 : 22}px`,
              display: 'grid',
              placeItems: 'center',
              position: 'relative',
              animation: clickMotionKey === 0
                ? 'none'
                : `boxActionIconSpin ${BOX_ACTION_CLICK_SPIN_MS}ms cubic-bezier(.18,.88,.18,1)`,
            }}
          >
            {icon === 'plus' ? (
              <>
                <span style={{ position: 'absolute', width: 9, height: 1.45, borderRadius: 999, background: '#ffffff' }} />
                <span style={{ position: 'absolute', width: 1.45, height: 9, borderRadius: 999, background: '#ffffff' }} />
              </>
            ) : (
              <>
                <span style={{ position: 'absolute', width: 10, height: 1.45, borderRadius: 999, background: '#111111', transform: 'rotate(45deg)' }} />
                <span style={{ position: 'absolute', width: 10, height: 1.45, borderRadius: 999, background: '#111111', transform: 'rotate(-45deg)' }} />
              </>
            )}
          </span>
          <span
            style={{
              flex: '0 0 auto',
              font: '450 10.5px/1 -apple-system, BlinkMacSystemFont, sans-serif',
              whiteSpace: 'nowrap',
              transform: 'translateX(-1px)',
              paddingRight: isDark ? 9 : 7,
            }}
          >
            {label}
          </span>
        </button>
      );
    }

    /*
     * 把整个盒子当作一个大格子：锚点使用盒子局部 3D 坐标，
     * 绘制仍是正对镜头的 HTML，所以移动逻辑与格子白色 X 一致。
     */
    function BoxActionButtonAnchor({ position, variant, icon, label, visible, onClick }) {
      return (
        <Html position={position} style={{ pointerEvents: 'none' }}>
          {/* 让 24px 圆形图标的圆心精确落在 3D 锚点上。 */}
          <div style={{ transform: 'translate(-12px, -12px)', pointerEvents: 'none' }}>
            <BoxActionPill
              variant={variant}
              icon={icon}
              label={label}
              visible={visible}
              onClick={onClick}
            />
          </div>
        </Html>
      );
    }

    export function BoxActionButtons3D({
      layout = DEFAULT_BOX_LAYOUT,
      visible,
      onClear,
      onAddToCart,
      cartLabel = 'カートに入れる',
    }) {
      const actionX = layout.boxW / 2 + 0.28; // 两个按钮整体左右位置：数值越大，离盒子右边越远。
      const actionY = layout.cellY + 0.08;    // 两个按钮整体高度：数值越大，越靠盒子开口上方。
      const firstZ = layout.backZ - 0.45;     // 第一个按钮前后位置：数值越小，越靠屏幕上方。
      const buttonGapZ = 0.19;          // 两个按钮之间的距离：数值越大，间距越大。

      return (
        <>
          <BoxActionButtonAnchor
            position={[actionX, actionY, firstZ]}
            variant="outline"
            icon="x"
            label="クリア"
            visible={visible}
            onClick={onClear}
          />
          <BoxActionButtonAnchor
            position={[actionX, actionY, firstZ + buttonGapZ]}
            variant="dark"
            icon="plus"
            label={cartLabel}
            visible={visible}
            onClick={onAddToCart}
          />
        </>
      );
    }

    /* 四个透明平面只负责判断鼠标正悬浮在哪个小格子，不参与画面绘制。 */
    export function CellHoverTargets({ layout = DEFAULT_BOX_LAYOUT, onHoverCell }) {
      return layout.cells.map((cell, cellIndex) => (
        <mesh
          key={cellIndex}
          position={[cell.x, layout.boxH / 2 + 0.08, cell.z]}
          rotation={[-Math.PI / 2, 0, 0]}
          onPointerMove={() => onHoverCell(cellIndex)}
          onPointerOut={() => onHoverCell(null)}
        >
          <planeGeometry args={[layout.holeW * 0.94, layout.holeD * 0.94]} />
          <meshBasicMaterial
            transparent
            opacity={0}
            colorWrite={false}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      ));
    }

    /* Keep the reference app's screen-quadrant drop model, but derive its bounds
       from this file's larger, lower box instead of assuming a 600x500 box. */
    export function BoxScreenTracker({ groupRef, screenRef, layout = DEFAULT_BOX_LAYOUT }) {
      useFrame(({ camera, size }) => {
        if (!groupRef.current) return;
        const toScreen = (worldPos) => {
          const clip = worldPos.clone().project(camera);
          // setViewOffset is already baked into Three.js's projection matrix.
          return {
            x: (clip.x + 1) / 2 * size.width,
            y: (-clip.y + 1) / 2 * size.height,
          };
        };

        groupRef.current.updateWorldMatrix(true, false);

        const projectedCells = layout.cells.map((cell) => {
          const cellWorld = new THREE.Vector3(cell.x, cell.y, cell.z);
          groupRef.current.localToWorld(cellWorld);
          return toScreen(cellWorld);
        });

        const outerCorners = [];
        for (const x of [-layout.boxW / 2 - 0.08, layout.boxW / 2 + 0.08]) {
          for (const y of [-layout.boxH / 2, layout.boxH / 2 + 0.08]) {
            for (const z of [-layout.boxD / 2 - 0.08, layout.boxD / 2 + 0.08]) {
              const corner = new THREE.Vector3(x, y, z);
              groupRef.current.localToWorld(corner);
              outerCorners.push(toScreen(corner));
            }
          }
        }

        const xs = outerCorners.map(point => point.x);
        const ys = outerCorners.map(point => point.y);
        const bounds = {
          centerX: projectedCells.reduce((sum, cell) => sum + cell.x, 0) / 4,
          centerY: projectedCells.reduce((sum, cell) => sum + cell.y, 0) / 4,
          minX: Math.min(...xs),
          maxX: Math.max(...xs),
          minY: Math.min(...ys),
          maxY: Math.max(...ys),
        };
        screenRef.current = bounds;

      });
      return null;
    }

