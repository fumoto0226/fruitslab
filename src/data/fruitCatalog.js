export const CUT_FRUIT_BASE_PATH = 'img/fruits/Cut Fruit/';
    export const BOX_FRUIT_BASE_PATH = 'img/fruits/Box Fruit /';
    export const USE_EMBEDDED_CUT_TEXTURES = false; // 切片图片来源：false=实时读取 PNG；true=读取 textures-all.js 打包旧图。
    export const CUT_FRUIT_TEXTURE_SRCS = window.CUT_FRUIT_TEXTURE_SRCS || {};
    export const cutFruit = (src) => (
      USE_EMBEDDED_CUT_TEXTURES && CUT_FRUIT_TEXTURE_SRCS[src]
        ? CUT_FRUIT_TEXTURE_SRCS[src]
        : `${CUT_FRUIT_BASE_PATH}${src}`
    );
    export const FRUIT_ITEMS = [
      { name: 'ふじりんご', wholeSrc: 'img/fruits/Whole Fruit/Apple/Red.png', cutSrc: cutFruit('Apple/Red.png'), boxSrc: `${BOX_FRUIT_BASE_PATH}box-Apple-Red.png` },
      { name: '王林りんご', wholeSrc: 'img/fruits/Whole Fruit/Apple/Green.png', cutSrc: cutFruit('Apple/Green.png'), boxSrc: `${BOX_FRUIT_BASE_PATH}box-Apple-Green.png` },
      { name: 'シナノゴールド', wholeSrc: 'img/fruits/Whole Fruit/Apple/Yellow.png', cutSrc: cutFruit('Apple/Yellow.png'), boxSrc: `${BOX_FRUIT_BASE_PATH}box-Apple-Yellow.png` },
      { name: '白桃', wholeSrc: 'img/fruits/Whole Fruit/Peach/Light.png', cutSrc: cutFruit('Peach/Light.png'), boxSrc: `${BOX_FRUIT_BASE_PATH}box-Peach-Light.png`, boxStyle: 'peach' },
      { name: 'あかつき桃', wholeSrc: 'img/fruits/Whole Fruit/Peach/Pink.png', cutSrc: cutFruit('Peach/Pink.png'), boxSrc: `${BOX_FRUIT_BASE_PATH}box-Peach-Pink.png`, boxStyle: 'peach' },
      { name: '黄金桃', wholeSrc: 'img/fruits/Whole Fruit/Peach/Yellow.png', cutSrc: cutFruit('Peach/Yellow.png'), boxSrc: `${BOX_FRUIT_BASE_PATH}box-Peach-Yellow.png`, boxStyle: 'peach' },
      { name: '淡雪', wholeSrc: 'img/fruits/Whole Fruit/Strawberry/White.png', cutSrc: cutFruit('Strawberry/White.png'), boxSrc: `${BOX_FRUIT_BASE_PATH}box-Strawberry-White.png` },
      { name: 'とちおとめ', wholeSrc: 'img/fruits/Whole Fruit/Strawberry/Red.png', cutSrc: cutFruit('Strawberry/Red.png'), boxSrc: `${BOX_FRUIT_BASE_PATH}box-Strawberry-Red.png` },
      { name: 'あまおう', wholeSrc: 'img/fruits/Whole Fruit/Strawberry/Dark.png', cutSrc: cutFruit('Strawberry/Dark.png'), boxSrc: `${BOX_FRUIT_BASE_PATH}box-Strawberry-Dark.png` },
      { name: 'ラ・フランス', wholeSrc: 'img/fruits/Whole Fruit/Pear/LaFrance.png', cutSrc: cutFruit('Pear/La France.png'), boxSrc: `${BOX_FRUIT_BASE_PATH}box-Pear-La France.png` },
      { name: '幸水梨', wholeSrc: 'img/fruits/Whole Fruit/Pear/Kousui.png', cutSrc: cutFruit('Pear/Kousui.png'), boxSrc: `${BOX_FRUIT_BASE_PATH}box-Pear-Kousui.png` },
      { name: 'せとか', wholeSrc: 'img/fruits/Whole Fruit/Orange/Setoka.png', cutSrc: cutFruit('Orange/Setoka.png'), boxSrc: `${BOX_FRUIT_BASE_PATH}box-Orange-Setoka.png` },
      { name: '巨峰', wholeSrc: 'img/fruits/Whole Fruit/Grape/Kyoho.png', cutSrc: cutFruit('Grape/Kyoho.png'), boxSrc: `${BOX_FRUIT_BASE_PATH}box-Grape-Kyoho.png`, boxStyle: 'cherryGrape' },
      { name: 'マスカット', wholeSrc: 'img/fruits/Whole Fruit/Grape/Muscat.png', cutSrc: cutFruit('Grape/Muscat.png'), boxSrc: `${BOX_FRUIT_BASE_PATH}box-Grape-Muscat.png`, boxStyle: 'cherryGrape' },
      { name: 'グリーンキウイ', wholeSrc: 'img/fruits/Whole Fruit/Kiwi/Green.png', cutSrc: cutFruit('Kiwi/Green.png'), boxSrc: `${BOX_FRUIT_BASE_PATH}box-Kiwi-Green.png` },
      { name: 'レッドキウイ', wholeSrc: 'img/fruits/Whole Fruit/Kiwi/Red.png', cutSrc: cutFruit('Kiwi/Red.png'), boxSrc: `${BOX_FRUIT_BASE_PATH}box-Kiwi-Red.png` },
      { name: 'ゴールドキウイ', wholeSrc: 'img/fruits/Whole Fruit/Kiwi/Yellow.png', cutSrc: cutFruit('Kiwi/Yellow.png'), boxSrc: `${BOX_FRUIT_BASE_PATH}box-Kiwi-Yellow.png` },
      { name: 'インドマンゴー', wholeSrc: 'img/fruits/Whole Fruit/Mango/Indo.png', cutSrc: cutFruit('Mango/Indo.png'), boxSrc: `${BOX_FRUIT_BASE_PATH}box-Mango-Indo.png`, boxStyle: 'mango' },
      { name: 'アーウィンマンゴー', wholeSrc: 'img/fruits/Whole Fruit/Mango/Irwin.png', cutSrc: cutFruit('Mango/Irwin.png'), boxSrc: `${BOX_FRUIT_BASE_PATH}box-Mango-Irwin.png`, boxStyle: 'mango' },
      { name: '紅秀峰', wholeSrc: 'img/fruits/Whole Fruit/Cherry/Beni.png', cutSrc: cutFruit('Cherry/Beni.png'), boxSrc: `${BOX_FRUIT_BASE_PATH}box-Cherry-Beni.png`, boxStyle: 'cherryGrape' },
      { name: 'アメリカンチェリー', wholeSrc: 'img/fruits/Whole Fruit/Cherry/American.png', cutSrc: cutFruit('Cherry/American.png'), boxSrc: `${BOX_FRUIT_BASE_PATH}box-Cherry-American.png`, boxStyle: 'cherryGrape' },
      { name: 'スイカ', wholeSrc: 'img/fruits/Whole Fruit/Watermelon/Red.png', cutSrc: cutFruit('Watermelon/Red.png'), boxSrc: `${BOX_FRUIT_BASE_PATH}box-Watermelon-Red.png` },
      { name: '黄スイカ', wholeSrc: 'img/fruits/Whole Fruit/Watermelon/Yellow.png', cutSrc: cutFruit('Watermelon/Yellow.png'), boxSrc: `${BOX_FRUIT_BASE_PATH}box-Watermelon-Yellow.png` },
    ];
    // 展示层的顺序单独管理，不改动 FRUIT_ITEMS 的底层 ID，避免影响组合商品和购物车数据。
    export const FRUIT_DISPLAY_ORDER = FRUIT_ITEMS
      .map((_, id) => id)
      .sort((leftId, rightId) => {
        const moveToEnd = (fruit) => {
          if (/\/Pear\//.test(fruit.wholeSrc)) return 1;
          if (/\/(Peach|Strawberry)\//.test(fruit.wholeSrc)) return 2;
          return 0;
        };
        return moveToEnd(FRUIT_ITEMS[leftId]) - moveToEnd(FRUIT_ITEMS[rightId]);
      });
    export const FRUITS_PER_PAGE = 10;
    export const CATALOG_TABS = [
      { id: 'fruit', label: 'フルーツ' },
      { id: 'recommend', label: '人気セット' },
      { id: 'history', label: '履歴' },
    ];
    const makeBoxItem = (name, fruitIds) => ({
      name,
      fruits: fruitIds.map((appleId) => {
        const fruit = FRUIT_ITEMS[appleId];
        return { appleId, name: fruit.name, iconSrc: fruit.wholeSrc };
      }),
    });

    export const POPULAR_BOX_ITEMS = [
      makeBoxItem('太陽のごちそう', [11, 19, 18, 21]),
      makeBoxItem('りんご大満喫', [0, 1, 2, 1]),
      makeBoxItem('桃づくし', [3, 4, 5, 4]),
      makeBoxItem('いちご日和', [6, 7, 8, 8]),
      makeBoxItem('梨の実り', [9, 10, 9, 10]),
      makeBoxItem('柑橘ひなた便', [11, 5, 11, 2]),
      makeBoxItem('ぶどう雅', [12, 13, 12, 13]),
      makeBoxItem('キウイ彩り', [14, 15, 16, 16]),
      makeBoxItem('南国ごほうび', [17, 18, 16, 11]),
      makeBoxItem('さくらんぼ便り', [19, 20, 19, 20]),
      makeBoxItem('夏祭り', [21, 22, 11, 5]),
      makeBoxItem('旬彩おまかせ', [0, 4, 8, 13]),
    ];

    export const HISTORY_BOX_ITEMS = [
      makeBoxItem('2026-05-27', [0, 1, 2, 0]),
      makeBoxItem('2026-05-12', [6, 7, 8, 8]),
      makeBoxItem('2026-04-28', [17, 18, 16, 11]),
      makeBoxItem('2026-04-03', [3, 4, 5, 4]),
      makeBoxItem('2026-03-18', [12, 13, 19, 20]),
    ];
    // 顶部三段分类按钮位置和大小：top 越大越靠下，width/height 控制胶囊整体尺寸。
    export const CATALOG_SWITCH_STYLE = { top: 140, width: 300, height: 26, fontSize: 11 };
