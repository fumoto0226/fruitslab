/** @jsxRuntime classic */
/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
import * as React from 'react';
const { Suspense } = React;
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, OrbitControls } from '@react-three/drei';
import {
  CELL_INFO_PRESS_HIDE_DELAY,
  CELL_INFO_HOVER_HIDE_DELAY,
  CELL_INFO_PRESS_TRANSITION_MS,
  CELL_INFO_HOVER_TRANSITION_MS,
  PRESS_HIDE_START_DELAY,
  CELL_CLOSE_HOVER_HIDE_DELAY,
  PRESS_ROUND_BUTTON_DISMISS_DAMP,
  CELL_CLOSE_HOVER_DISMISS_DAMP,
  CART_TRANSFER_CLEAR_DELAY_MS,
  getCellContentCenterShift,
} from '../config/appConfig.js';
import { SIZE_SPIN_FRUIT_ANIMATION } from '../utils/fruitAnimation.js';
import { FruitSlot3D } from '../three/FruitPieces.jsx';
import {
  CellInfoLabel3D,
  CloseButton3D,
  ReplaceButton3D,
  CancelReplacementButton3D,
  BoxActionButtons3D,
  CellHoverTargets,
  BoxScreenTracker,
  BoxNoticeLabel3D,
} from '../three/BoxOverlays.jsx';
import { GlassCube, AutoReturn, ViewOffset } from '../three/GlassBox.jsx';

function SceneReadySignal({ onReady }) {
  const hasReportedRef = React.useRef(false);

  useFrame(() => {
    if (hasReportedRef.current) return;
    hasReportedRef.current = true;
    onReady?.();
  });

  return null;
}

export function BoxScene({
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
  cartAttentionGuide,
  boxScreenRef,
  setModelDragging,
  rotateLeftRightLimit,
  defaultPolarAngle,
  rotateUpLimit,
  rotateDownLimit,
  onSceneReady,
}) {
  return (
  <Canvas
    className="hero-3d-canvas"
    camera={{ position: [0, 3, 8], fov: 45 }}
    dpr={[1, 1.5]}
    gl={{ antialias: true, powerPreference: 'high-performance' }}
  >
    <ViewOffset shift={displayedScreenShift} shiftX={cartContentOffset} />
    <color attach="background" args={['#F7F8FA']} />
    <ambientLight intensity={lightIntensity * 0.25} />
    <directionalLight position={[10, 10, 5]} intensity={lightIntensity} castShadow />
    <spotLight position={[-10, 10, -10]} angle={0.3} penumbra={1} intensity={lightIntensity * 0.6} color="#e0eaff" />
    <Suspense fallback={null}>
      {/* 公共父组统一移动盒体、水果和按钮；内部组只负责模型旋转和尺寸。 */}
      <group position={[0, sizeShakeOffsetY, 0]}>
        <group
          ref={groupRef}
          rotation={[rotationX + sizeSpinAngle, 0, 0]}
          scale={1.55}
        >
          <GlassCube
            key={`glass-${selectedSize.size}`}
            layout={selectedBoxLayout}
            transmission={transmission}
            roughness={roughness}
            ior={ior}
            glassColor={glassColor}
            attenuationColor={attenuationColor}
            envMapIntensity={envMapIntensity}
          >
            <BoxNoticeLabel3D layout={selectedBoxLayout} noticeLabel={selectedNoticeLabel} />
          </GlassCube>
          <CellHoverTargets layout={selectedBoxLayout} onHoverCell={setHoveredCell} />
          {placedFruits.map(a => (
            <group key={a.id}>
              {sizeSpinFruitPhase !== 'hidden' ? (
                <FruitSlot3D
                  appleId={a.appleId}
                  cellIndex={a.cell}
                  layout={selectedBoxLayout}
                  boxSize={selectedSize.size}
                  animationKey={a.motionKey}
                  settleKey={sizeShakeFruitKey}
                  forceExiting={sizeSpinFruitPhase === 'fading' || cartTransfer != null}
                  forceExitDuration={cartTransfer ? CART_TRANSFER_CLEAR_DELAY_MS / 1000 : SIZE_SPIN_FRUIT_ANIMATION.fadeDuration}
                />
              ) : null}
              <CellInfoLabel3D
                position={[
                  selectedBoxLayout.cells[a.cell].x + getCellContentCenterShift(a.cell, selectedBoxLayout) + selectedCellUiOffsets.info.x,
                  selectedBoxLayout.cells[a.cell].y + selectedCellUiOffsets.info.y,
                  selectedBoxLayout.cells[a.cell].z + selectedCellUiOffsets.info.z,
                ]}
                appleId={a.appleId}
                visible={replacementFruitId == null && !modelDragging && !sizeTransitionActive && hoveredCell === a.cell}
                hideDelay={modelDragging ? CELL_INFO_PRESS_HIDE_DELAY : CELL_INFO_HOVER_HIDE_DELAY}
                transitionMs={modelDragging ? CELL_INFO_PRESS_TRANSITION_MS : CELL_INFO_HOVER_TRANSITION_MS}
              />
              <CloseButton3D
                position={[
                  selectedBoxLayout.cells[a.cell].x + selectedCellUiOffsets.close.x,
                  selectedBoxLayout.cells[a.cell].y + selectedCellUiOffsets.close.y,
                  selectedBoxLayout.cells[a.cell].z + selectedCellUiOffsets.close.z,
                ]}
                visible={replacementFruitId == null && !modelDragging && !sizeTransitionActive && hoveredCell === a.cell}
                hideDelay={modelDragging ? PRESS_HIDE_START_DELAY : CELL_CLOSE_HOVER_HIDE_DELAY}
                dismissDamp={modelDragging ? PRESS_ROUND_BUTTON_DISMISS_DAMP : CELL_CLOSE_HOVER_DISMISS_DAMP}
                onRemove={() => unsnapApple(a.id)}
              />
              <ReplaceButton3D
                position={[
                  selectedBoxLayout.cells[a.cell].x + getCellContentCenterShift(a.cell, selectedBoxLayout),
                  selectedBoxLayout.cells[a.cell].y + 0.10,
                  selectedBoxLayout.cells[a.cell].z - 0.02,
                ]}
                visible={replacementFruitId != null}
                animationKey={replacementMotionKey}
                onReplace={() => replaceFruitInCell(a.cell)}
              />
            </group>
          ))}
          <CancelReplacementButton3D
            position={[selectedBoxLayout.rightX + 0.56, selectedBoxLayout.cellY + 0.08, selectedBoxLayout.backZ - 0.32]}
            visible={replacementFruitId != null}
            onCancel={cancelReplacement}
          />
          <BoxActionButtons3D
            layout={selectedBoxLayout}
            visible={!modelDragging}
            onClear={clearAllFruits}
            onAddToCart={addBoxToCart}
            cartLabel={cartEditSession ? '変更を保存' : 'カートに入れる'}
            cartAttentionGuide={cartAttentionGuide}
          />
        </group>
      </group>
      <BoxScreenTracker groupRef={groupRef} screenRef={boxScreenRef} layout={selectedBoxLayout} />
      <SceneReadySignal onReady={onSceneReady} />
      <AutoReturn easeSpeed={0.15} />
      <Environment preset="warehouse" />
    </Suspense>
    <OrbitControls
      enablePan={false}
      enableZoom={false}
      onStart={() => setModelDragging(true)}
      onEnd={() => {
        setModelDragging(false);
        setHoveredCell(null);
      }}
      minAzimuthAngle={-rotateLeftRightLimit}
      maxAzimuthAngle={rotateLeftRightLimit}
      minPolarAngle={defaultPolarAngle - rotateUpLimit}
      maxPolarAngle={defaultPolarAngle + rotateDownLimit}
      target={[0, 0, 0]}
      makeDefault
    />
  </Canvas>
  );
}
