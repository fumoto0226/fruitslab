/* ══════════════════════════════════════════════
       Shared constants: box + cell positions (in the box's local coords)
       ══════════════════════════════════════════════ */

    // 3D 场景外观与旋转限制：集中放在这里，方便只调整模型表现而不进入页面控制器。
    export const SCENE_SETTINGS = {
      rotationX: 0.7, // 盒子默认前倾角度；越大俯视越明显。
      transmission: 0.85, // 玻璃透明感：0 不透明，1 最通透。
      roughness: 0.22, // 玻璃磨砂程度：0 光滑清晰，1 模糊磨砂。
      ior: 1.0, // 折射率：越大折射变形越明显。
      glassColor: '#ffffff',
      attenuationColor: '#e0f3ff',
      envMapIntensity: 4.0,
      lightIntensity: 5.5,
      rotateLeftRightLimit: Math.PI / 5.0,
      rotateUpLimit: Math.PI / 9.5,
      rotateDownLimit: Math.PI / 5.0,
      defaultPolarAngle: Math.atan2(8, 3),
    };

    export const BOX_W = 2.8, BOX_H = 1.0, BOX_D = 1.8, WALL = 0.04;
    export const CELL_Y  = 0.45;   // above the cavity floor so the apple plane sits INSIDE the compartment

    export const createBoxLayout = (boxW = BOX_W, boxD = BOX_D) => {
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
          { x: leftX,  y: CELL_Y, z: backZ  },  // 0: back-left
          { x: rightX, y: CELL_Y, z: backZ  },  // 1: back-right
          { x: leftX,  y: CELL_Y, z: frontZ },  // 2: front-left
          { x: rightX, y: CELL_Y, z: frontZ },  // 3: front-right
        ],
      };
    };
    export const DEFAULT_BOX_LAYOUT = createBoxLayout();
    export const CELLS = DEFAULT_BOX_LAYOUT.cells;
    // 左右格子的内容中心修正：同时影响果切、水果信息和“入れ替え”文字。
    export const CELL_CONTENT_CENTER_SHIFT = 0.02;
    export const getCellContentCenterShift = (cellIndex, layout = DEFAULT_BOX_LAYOUT, shift = CELL_CONTENT_CENTER_SHIFT) => (
      layout.cells[cellIndex].x < 0 ? -shift : shift
    );
    // 鼠标长按/旋转盒子时的统一隐藏节奏：白色 X 和外侧两个按钮用这组。
    export const PRESS_HIDE_START_DELAY = 320; // 长按后开始消失前的停顿：数值越大，越晚开始消失。
    export const PRESS_UI_DISMISS_TRANSITION_MS = 560; // 长按后消失动画时长：数值越大，消失越慢。
    export const PRESS_ROUND_BUTTON_DISMISS_DAMP = 6.2; // 长按后格子白色 X 的缩放速度：数值越小，消失越慢。

    // 左上角文字的长按隐藏节奏：先和上面统一，后面可以单独微调。
    export const CELL_INFO_PRESS_HIDE_DELAY = PRESS_HIDE_START_DELAY; // 文字长按后开始消失前的停顿。
    export const CELL_INFO_PRESS_TRANSITION_MS = PRESS_UI_DISMISS_TRANSITION_MS; // 文字长按后的消失动画时长。

    // 鼠标移出格子时，各 UI 自己的隐藏节奏：和长按隐藏分开调。
    export const CELL_INFO_HOVER_HIDE_DELAY = 320; // 鼠标移出格子后，左上角文字开始消失前的停顿。
    export const CELL_INFO_HOVER_TRANSITION_MS = 460; // 鼠标移出格子后，左上角文字消失动画时长。
    export const CELL_CLOSE_HOVER_HIDE_DELAY = 320; // 鼠标移出格子后，格子右上角白色 X 开始消失前的停顿。
    export const CELL_CLOSE_HOVER_DISMISS_DAMP = 6.2; // 鼠标移出格子后，格子右上角白色 X 的缩放速度：数值越小，消失越慢。

    export const BOX_ACTION_HIDE_START_DELAY = PRESS_HIDE_START_DELAY; // 外侧两个按钮长按旋转时的消失停顿，和按钮长按节奏统一。
    export const BOX_ACTION_HOVER_OPEN_DELAY = 0; // 鼠标移上右上角按钮后，文字开始展开前的停顿。
    export const BOX_ACTION_HOVER_CLOSE_DELAY = 320; // 鼠标移开右上角按钮后，文字收回前的停顿。
    export const BOX_ACTION_WIDTH_TRANSITION_MS = 640; // 右上角按钮文字展开/收回动画时长。
    export const BOX_ACTION_SCALE_TRANSITION_MS = PRESS_UI_DISMISS_TRANSITION_MS; // 外侧两个按钮长按旋转时整体放大/缩小动画时长。
    export const BOX_ACTION_EASING = 'cubic-bezier(.2,.8,.2,1)'; // 外侧两个按钮展开/收回/缩放的统一缓动曲线。
    export const BOX_ACTION_CLICK_SPIN_MS = 520; // 外侧按钮点击后，前面圆形图标旋转一圈的时长。
    // 格子左上角文字和右上角 X 的位置：按盒子尺寸单独调。
    // info：x 越小越靠左，y 越大越靠上，z 越小越靠盒子后侧。
    // close：x 越大越靠右，y 越大越靠上，z 越小越靠盒子后侧。
    export const CELL_UI_OFFSETS_BY_SIZE = {
      M: {
        info: { x: -0.62, y: 0.080, z: -0.34 },
        close: { x: 0.56, y: 0.08, z: -0.32 },
      },
      L: {
        info: { x: -0.70, y: 0.090, z: -0.40 },
        close: { x: 0.64, y: 0.09, z: -0.38 },
      },
      S: {
        info: { x: -0.52, y: 0.070, z: -0.28 },
        close: { x: 0.48, y: 0.07, z: -0.26 },
      },
    };
    // 盒子正面灰色说明文字的默认设置；实际使用时会被每个 size 自己的 noticeLabel 覆盖。
    // x 越小越靠左，y 越大越靠上，zOffset 越大越靠盒子正面外侧；width/height 是文字平面的宽高。
    export const BOX_NOTICE_LABEL_DEFAULT = { x: -0.77, y: 0.08, zOffset: 0.035, width: 0.96, height: 0.31 };
    export const BOX_NOTICE_TEXT_COLOR = '#A7B6C1'; // 盒子说明文字颜色：这里用 #RRGGBB，编辑器一般可以直接弹调色板。
    export const BOX_NOTICE_TEXT_OPACITY = 0.92; // 盒子说明文字透明度：1 是不透明，0 是完全透明。
    // 右下角购物车入口位置：right 越大越靠左，bottom 越大越靠上。
    export const PAGE_CART_POSITION = { right: 64, bottom: 32 };
    // 右下角购物车入口整体间距：iconTextGap 是图标和 (cart) 的距离。
    export const PAGE_CART_LAYOUT = { iconTextGap: 10 };
    // 右下角购物车图标大小。
    export const PAGE_CART_ICON_SIZE = { width: 58, height: 46 };
    // 右下角购物车 (cart) 文字大小和上下微调：textOffsetY 越大越靠下。
    export const PAGE_CART_TEXT_STYLE = { fontSize: 32, textOffsetY: 2 };
    // 右下角购物车数量位置和大小：right 越小越靠右，top 越小越靠上。
    export const PAGE_CART_COUNT_STYLE = { fontSize: 26, right: -21, top: -15 };
    // 盒子加入购物车动画：飞行结束后才更新右下角数量。
    export const CART_TRANSFER_DURATION_MS = 760;
    export const CART_TRANSFER_CLEAR_DELAY_MS = 190;
    export const CART_COUNT_MOTION_MS = 360;
    // 右侧购物车栏：width 是侧栏宽度；打开时中间 3D 盒子和三个分类按钮会按这个宽度的一半往左移。
    export const CART_DRAWER_WIDTH = 360;
    export const CART_LAYOUT_DURATION_MS = 420;
    // 购物车盒子条目加入与删除的平移时长，两种方向共用，保证速度一致。
    export const CART_BOX_LIST_MOTION_MS = 300;
    // 条目平移使用接近机械传送的匀速运动，避免进入可视区域后出现明显的慢收尾。
    export const CART_BOX_LIST_MOTION_EASING = 'linear';
    // 购物车左下角退出箭头的左右微调：正数向右，负数向左，只影响箭头本身。
    export const CART_FOOTER_ARROW_OFFSET_X = 2.5;
    // 顶部列表打开/关闭动画分开调整；只影响列表，不影响盒子、分类按钮和购物车侧栏。
    export const TOP_CATALOG_OPEN_DURATION_MS = 550;
    export const TOP_CATALOG_CLOSE_DURATION_MS = 420;
    export const TOP_CATALOG_SIDE_GAP = 28; // 顶部水果列表左右留白：数值越大，两边离屏幕/购物车栏越远。
    export const TOP_CATALOG_ARROW_GAP = 12; // 翻页箭头与首尾水果之间的空隙。
    // 左下角尺寸选择：点击会按这里的顺序切换。
    export const SIZE_OPTIONS = [
      // boxWidth / boxDepth 是真实改盒子的长宽；盒子高度、壁厚、圆角、十字分隔厚度不跟着缩放。
      // noticeLabel 是盒子正面说明文字的位置和大小：不同尺寸可以单独调。
      // screenShift 是盒子静止后的屏幕上下位置：数值越大，盒子越往屏幕下方；不会改变 3D 模型远近和旋转中心。
      // switchScreenShift 是切换成该尺寸那一瞬间的起始构图位置；主要给 S 用，避免从 L 切过来时底部露缝。
      // shakeMotion 是每个尺寸自己的下沉/回弹微调：先以 S 不露底为基准，M/L 再逐级加大。
      { size: 'M', weight: '800g', boxWidth: 2.8, boxDepth: 1.8, screenShift: 0.17, shakeMotion: { downDistance: 0.052, reboundDistance: 0.0015, settleDistance: 0.001 }, noticeLabel: { x: -0.77, y: 0.08, zOffset: 0.035, width: 0.96, height: 0.31 } },
      { size: 'L', weight: '1KG', boxWidth: 3.12, boxDepth: 2.02, screenShift: 0.15, shakeMotion: { downDistance: 0.064, reboundDistance: 0.002, settleDistance: 0.0012 }, noticeLabel: { x: -0.88, y: 0.08, zOffset: 0.055, width: 0.96, height: 0.31 } },
      { size: 'S', weight: '600g', boxWidth: 2.48, boxDepth: 1.60, screenShift: 0.19, switchScreenShift: 0.215, shakeMotion: { downDistance: 0.028, reboundDistance: 0, settleDistance: 0 }, noticeLabel: { x: -0.63, y: 0.08, zOffset: 0.035, width: 0.92, height: 0.30 } },
    ];
    // 左下角尺寸选择器位置：left 越大越靠右，bottom 越大越靠上。
    export const SIZE_SELECTOR_POSITION = { left: 38, bottom: 26 };
    // 左下角尺寸卡片大小。
    export const SIZE_SELECTOR_CARD_SIZE = { width: 60, height: 60 };
    // 左下角尺寸文字和间距：labelFont 和 cart 一样；gap 是方块和 (size) 的距离。
    export const SIZE_SELECTOR_TEXT_STYLE = { sizeFont: 30, weightFont: 10, labelFont: PAGE_CART_TEXT_STYLE.fontSize, gap: 10, weightGap: 5 };
    // 切换盒子尺寸时的旋转动画：duration 越大越慢；switchAt 是每圈进度到多少时真正切换模型尺寸。
    // cruiseMsPerTurn 控制中段匀速段速度；accelMs/decelMs 越大，起步和收尾越柔。
    // continueDecelTurns 是离“最终停止点”多远才开始减速；追加的圈之间始终保持连续速度。
    export const SIZE_CHANGE_SPIN = {
      duration: 780,
      switchAt: 0.5,
      turns: 1,
      direction: -1,
      cruiseMsPerTurn: 640,
      accelMs: 180,
      decelMs: 240,
      continueDecelTurns: 0.34,
      screenShiftFollowMs: 240,
    };
    // 当前尺寸切换统一用“下沉 -> 回弹”，空盒和有水果都走这一套。
    export const SIZE_CHANGE_SHAKE = {
      duration: 420,          // 单次下沉回弹总时长，单位毫秒。越小越利落。
      switchAt: 0.18,         // 到达最低点并切换盒子尺寸的时间点。
      downDistance: 0.052,    // 默认下沉距离；不同尺寸可在 shakeMotion 里覆盖。
      reboundDistance: 0.0015, // 默认第一次回弹超过原位的距离。
      settleDistance: 0.001,  // 默认回弹后的轻微二次下沉距离。
    };
    // 盒子回弹时，现有水果保持不透明，并各自做一次短促的落下动作。
    export const SIZE_SHAKE_FRUIT_DROP = {
      height: 0.22,
      duration: 0.42,
      stagger: 0.008,
      rotation: 0.07,
    };
