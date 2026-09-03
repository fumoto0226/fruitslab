/** @jsxRuntime classic */
/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
import * as React from 'react';
const { useMemo, useEffect, useRef } = React;
import { useFrame, useThree } from '@react-three/fiber';
import { MeshTransmissionMaterial } from '@react-three/drei';
import { Geometry, Base, Subtraction, Addition } from '@react-three/csg';
import { RoundedBoxGeometry } from 'three-stdlib';
import { DEFAULT_BOX_LAYOUT } from '../config/appConfig.js';

/* ══════════════════════════════════════════════
       GlassCube — copied verbatim from the reference folder
       ══════════════════════════════════════════════ */

    function useTaperedBox(width, height, depth, radius, topScale, yOffset, xOffset, zOffset) {
      return useMemo(() => {
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

    export function GlassCube({ layout = DEFAULT_BOX_LAYOUT, transmission, roughness, ior, rotationX, glassColor, attenuationColor, envMapIntensity, children }) {
      const taperScale = 1.05;
      const boxW = layout.boxW, boxH = layout.boxH, boxD = layout.boxD;
      const rad = 0.15, wall = layout.wall;
      const holeW = (boxW - 3 * wall) / 2;
      const holeD = (boxD - 3 * wall) / 2;
      const holeH = 1.0;
      const innerRad = 0.1;
      const leftX  = -boxW / 2 + wall + holeW / 2;
      const rightX = -leftX;
      const frontZ = boxD / 2 - wall - holeD / 2;
      const backZ  = -frontZ;

      const baseGeom = useTaperedBox(boxW, boxH, boxD, rad, taperScale, 0, 0, 0);
      const rimGeom  = useTaperedBox(boxW + 0.15, 0.08, boxD + 0.15, rad, taperScale, 0.46, 0, 0);
      const holeGeom1 = useTaperedBox(holeW, holeH, holeD, innerRad, taperScale, 0.15, leftX,  backZ);
      const holeGeom2 = useTaperedBox(holeW, holeH, holeD, innerRad, taperScale, 0.15, rightX, backZ);
      const holeGeom3 = useTaperedBox(holeW, holeH, holeD, innerRad, taperScale, 0.15, leftX,  frontZ);
      const holeGeom4 = useTaperedBox(holeW, holeH, holeD, innerRad, taperScale, 0.15, rightX, frontZ);

      return (
        <mesh position={[0, 0, 0]}>
          <Geometry computeVertexNormals>
            <Base>
              <primitive object={baseGeom} attach="geometry" />
            </Base>
            <Addition position={[0, 0.46, 0]}>
              <primitive object={rimGeom} attach="geometry" />
            </Addition>
            <Subtraction position={[leftX,  0.15, backZ]}>
              <primitive object={holeGeom1} attach="geometry" />
            </Subtraction>
            <Subtraction position={[rightX, 0.15, backZ]}>
              <primitive object={holeGeom2} attach="geometry" />
            </Subtraction>
            <Subtraction position={[leftX,  0.15, frontZ]}>
              <primitive object={holeGeom3} attach="geometry" />
            </Subtraction>
            <Subtraction position={[rightX, 0.15, frontZ]}>
              <primitive object={holeGeom4} attach="geometry" />
            </Subtraction>
          </Geometry>
          <MeshTransmissionMaterial
            /* ===== 玻璃高级参数：一般先调整 App() 中的基础设置 ===== */
            backside
            /* 玻璃背面厚度：越大，边缘折射越明显。 */
            backsideThickness={3.0}
            /* 玻璃厚度：越大，折射和颜色吸收越明显。 */
            thickness={2.1}
            /* 彩色色散强度：0 为无彩边，数值越大彩边越明显。 */
            chromaticAberration={0.02}
            /* 各向异性模糊：越大，玻璃内的影像越柔和。 */
            anisotropicBlur={0.2}
            roughness={roughness}
            ior={ior}
            /* 清漆高光：clearcoat 控制强度，clearcoatRoughness 控制高光模糊。 */
            clearcoat={1}
            clearcoatRoughness={0.1}
            color={glassColor}
            attenuationColor={attenuationColor}
            /* 颜色吸收距离：越小，attenuationColor 的染色越明显。 */
            attenuationDistance={3.8}
            transmission={transmission * 0.90}
            /* opacity 保持 1；透明感主要通过 transmission 调整。 */
            transparent
            opacity={1}
            /* 玻璃扭曲：distortion 控制强度，distortionScale 控制扭曲尺度。 */
            distortion={0.3}
            distortionScale={0.4}
            /* 折射缓冲精度：越高越清晰，但性能消耗越大。 */
            resolution={1024}
            envMapIntensity={envMapIntensity}
          />
          {/* 作为玻璃宿主的子节点：正常显示，但不会被 MeshTransmissionMaterial 的折射缓冲再次采样。 */}
          {children}
        </mesh>
      );
    }

    /* ══════════════════════════════════════════════
       AutoReturn — when the user releases the mouse after orbiting, smoothly
       ease the camera back to its initial position. Uses lerp with a low
       coefficient so the motion feels weighted rather than snappy.
       ══════════════════════════════════════════════ */

    export function AutoReturn({ initialAzimuth = 0, initialPolar = Math.atan2(8, 3), easeSpeed = 0.06 }) {
      const controls = useThree(state => state.controls);
      const draggingRef = useRef(false);

      useEffect(() => {
        if (!controls) return;
        const onStart = () => { draggingRef.current = true; };
        const onEnd   = () => { draggingRef.current = false; };
        controls.addEventListener('start', onStart);
        controls.addEventListener('end',   onEnd);
        return () => {
          controls.removeEventListener('start', onStart);
          controls.removeEventListener('end',   onEnd);
        };
      }, [controls]);

      useFrame(() => {
        if (!controls || draggingRef.current) return;
        // Lerp only ANGLES (azimuth + polar) — keep distance constant so the
        // camera doesn't dolly in/out along a straight-line path.
        const curAz = controls.getAzimuthalAngle();
        const curPo = controls.getPolarAngle();
        const dAz = initialAzimuth - curAz;
        const dPo = initialPolar   - curPo;
        if (Math.abs(dAz) < 0.001 && Math.abs(dPo) < 0.001) return;
        controls.setAzimuthalAngle(curAz + dAz * easeSpeed);
        controls.setPolarAngle(    curPo + dPo * easeSpeed);
        controls.update();
      });
      return null;
    }

    /* ══════════════════════════════════════════════
       ViewOffset — shifts the rendered viewport DOWN so the box (which sits
       exactly at the OrbitControls target) appears in the lower part of the
       frame. Rotation still pivots around the box itself.
       ══════════════════════════════════════════════ */

    export function ViewOffset({ shift = 0.2, shiftX = 0, extendBelowViewport = false }) {
      const { camera, size } = useThree();
      useEffect(() => {
        if (typeof camera.setViewOffset !== 'function') return;
        const bottomExtension = extendBelowViewport ? (size.width <= 800 ? 100 : 150) : 0;
        const baseHeight = Math.max(1, size.height - bottomExtension);
        camera.setViewOffset(
          size.width,
          baseHeight * (1 + shift),
          shiftX,
          -baseHeight * shift,
          size.width,
          size.height,
        );
        return () => camera.clearViewOffset();
      }, [camera, size.width, size.height, shift, shiftX, extendBelowViewport]);
      return null;
    }
