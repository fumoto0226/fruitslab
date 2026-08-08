# Fruitslab

浏览器端的水果礼盒配置器。页面使用 React、React Three Fiber 和 Three.js，构建结果仍然是可直接静态托管的 `index.html + dist/app.js`。

## 开发

```bash
npm install
npm run build
python3 -m http.server 8765
```

修改源码后重新执行 `npm run build`。持续开发时可使用 `npm run watch`。

## 目录职责

```text
index.html                         静态入口、import map 和资源加载
src/main.jsx                       页面状态与跨功能流程编排
src/config/appConfig.js            3D、布局、动画和交互参数
src/data/fruitCatalog.js           水果、切片、组合和标签页数据
src/utils/fruitAnimation.js        水果动画的纯函数与参数
src/components/BoxScene.jsx        3D 场景装配
src/components/TopCatalog.jsx      顶部水果/组合列表与手势 UI
src/components/CartDrawer.jsx      购物车侧栏与条目操作
src/components/PageOverlayControls.jsx  页面级浮层、尺寸和购物车入口
src/three/GlassBox.jsx             玻璃盒几何体、视角和相机辅助
src/three/FruitPieces.jsx          各类果切布局、纹理和掉落动画
src/three/BoxOverlays.jsx          盒内标签、关闭/替换及盒外操作按钮
src/styles/global.css              全局重置和跨组件关键帧
dist/app.js                        构建产物，供静态页面和 GitHub Pages 使用
```

## 修改入口

- 调整玻璃、灯光、旋转范围、盒子尺寸和通用动画：`src/config/appConfig.js`
- 增删水果、修改图片路径、名称或组合内容：`src/data/fruitCatalog.js`
- 修改某类果切在 S/M/L 盒中的数量与排列：`src/three/FruitPieces.jsx`
- 修改格子文字、X、替换按钮或盒外按钮：`src/three/BoxOverlays.jsx`
- 修改顶部列表、组合详情和拖动展示：`src/components/TopCatalog.jsx`
- 修改购物车条目、编辑、数量或结算区：`src/components/CartDrawer.jsx`
- 修改“加入购物车”后的飞行动画或左下角尺寸入口：`src/components/PageOverlayControls.jsx`
- 修改跨功能业务流程，例如“组合写入盒子”或“购物车盒子重新编辑”：`src/main.jsx`

## 维护约定

- 组件只通过 props 共享状态，不向 `window` 写业务变量。
- 静态数据和可调参数不放进组件内部。
- Three.js 纹理缓存保持在对应 3D 模块内部，不暴露成全局变量。
- 新功能优先放入已有职责相符的模块；只有形成独立功能边界时才新增文件。
- `dist/app.js` 是生成文件，不直接编辑。
