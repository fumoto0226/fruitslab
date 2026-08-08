/* ===== 果切放入格子的落下动画：整体手感可在这里调整 =====
       dropHeight：初始高度；duration：单片落地和反弹总时长；stagger：每两片之间的错峰时间。 */
    export const FRUIT_DROP_ANIMATION = {
      dropHeight: 0.48,
      duration: 0.82,
      stagger: 0.035,
      appearDuration: 0.10, // 入场淡入时长：在正式下落前快速变为完全不透明。
      exitDuration: 0.18,   // 替换旧水果时的淡出时长。
    };
    // 切换盒子尺寸时，水果先短暂停留再淡出；盒子最终停稳后重新播放落下动画。
    export const SIZE_SPIN_FRUIT_ANIMATION = {
      hideDelayMs: 120,    // 开始旋转后等待多久才开始淡出，避免一点击就立刻消失。
      fadeDuration: 0.18,  // 淡出速度，单位秒。
    };

    export const seededUnit = (seed) => {
      const value = Math.sin(seed * 12.9898) * 43758.5453;
      return value - Math.floor(value);
    };

    export const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
    export const easeOutBounce = (t) => {
      const n1 = 7.5625;
      const d1 = 2.75;
      if (t < 1 / d1) return n1 * t * t;
      if (t < 2 / d1) {
        const shifted = t - 1.5 / d1;
        return n1 * shifted * shifted + 0.75;
      }
      if (t < 2.5 / d1) {
        const shifted = t - 2.25 / d1;
        return n1 * shifted * shifted + 0.9375;
      }
      const shifted = t - 2.625 / d1;
      return n1 * shifted * shifted + 0.984375;
    };
