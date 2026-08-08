export const CUT_FRUIT_BASE_PATH = 'img/fruits/Cut Fruit/';
    export const USE_EMBEDDED_CUT_TEXTURES = false; // 切片图片来源：false=实时读取 PNG；true=读取 textures-all.js 打包旧图。
    export const CUT_FRUIT_TEXTURE_SRCS = window.CUT_FRUIT_TEXTURE_SRCS || {};
    export const cutFruit = (src) => (
      USE_EMBEDDED_CUT_TEXTURES && CUT_FRUIT_TEXTURE_SRCS[src]
        ? CUT_FRUIT_TEXTURE_SRCS[src]
        : `${CUT_FRUIT_BASE_PATH}${src}`
    );
    export const FRUIT_ITEMS = [
      { name: 'ふじりんご', wholeSrc: 'img/fruits/Whole Fruit/Apple/Red.png', cutSrc: cutFruit('Apple/Red.png') },
      { name: '王林りんご', wholeSrc: 'img/fruits/Whole Fruit/Apple/Green.png', cutSrc: cutFruit('Apple/Green.png') },
      { name: 'シナノゴールド', wholeSrc: 'img/fruits/Whole Fruit/Apple/Yellow.png', cutSrc: cutFruit('Apple/Yellow.png') },
      { name: '白桃', wholeSrc: 'img/fruits/Whole Fruit/Peach/Light.png', cutSrc: cutFruit('Peach/Light.png'), boxStyle: 'peach' },
      { name: 'あかつき桃', wholeSrc: 'img/fruits/Whole Fruit/Peach/Pink.png', cutSrc: cutFruit('Peach/Pink.png'), boxStyle: 'peach' },
      { name: '黄金桃', wholeSrc: 'img/fruits/Whole Fruit/Peach/Yellow.png', cutSrc: cutFruit('Peach/Yellow.png'), boxStyle: 'peach' },
      { name: '淡雪', wholeSrc: 'img/fruits/Whole Fruit/Strawberry/White.png', cutSrc: cutFruit('Strawberry/White.png') },
      { name: 'とちおとめ', wholeSrc: 'img/fruits/Whole Fruit/Strawberry/Red.png', cutSrc: cutFruit('Strawberry/Red.png') },
      { name: 'あまおう', wholeSrc: 'img/fruits/Whole Fruit/Strawberry/Dark.png', cutSrc: cutFruit('Strawberry/Dark.png') },
      { name: 'ラ・フランス', wholeSrc: 'img/fruits/Whole Fruit/Pear/LaFrance.png', cutSrc: cutFruit('Pear/La France.png') },
      { name: '幸水梨', wholeSrc: 'img/fruits/Whole Fruit/Pear/Kousui.png', cutSrc: cutFruit('Pear/Kousui.png') },
      { name: 'せとか', wholeSrc: 'img/fruits/Whole Fruit/Orange/Setoka.png', cutSrc: cutFruit('Orange/Setoka.png') },
      { name: '巨峰', wholeSrc: 'img/fruits/Whole Fruit/Grape/Kyoho.png', cutSrc: cutFruit('Grape/Kyoho.png'), boxStyle: 'cherryGrape' },
      { name: 'マスカット', wholeSrc: 'img/fruits/Whole Fruit/Grape/Muscat.png', cutSrc: cutFruit('Grape/Muscat.png'), boxStyle: 'cherryGrape' },
      { name: 'グリーンキウイ', wholeSrc: 'img/fruits/Whole Fruit/Kiwi/Green.png', cutSrc: cutFruit('Kiwi/Green.png') },
      { name: 'レッドキウイ', wholeSrc: 'img/fruits/Whole Fruit/Kiwi/Red.png', cutSrc: cutFruit('Kiwi/Red.png') },
      { name: 'ゴールドキウイ', wholeSrc: 'img/fruits/Whole Fruit/Kiwi/Yellow.png', cutSrc: cutFruit('Kiwi/Yellow.png') },
      { name: 'インドマンゴー', wholeSrc: 'img/fruits/Whole Fruit/Mango/Indo.png', cutSrc: cutFruit('Mango/Indo.png'), boxStyle: 'mango' },
      { name: 'アーウィンマンゴー', wholeSrc: 'img/fruits/Whole Fruit/Mango/Irwin.png', cutSrc: cutFruit('Mango/Irwin.png'), boxStyle: 'mango' },
      { name: '紅秀峰', wholeSrc: 'img/fruits/Whole Fruit/Cherry/Beni.png', cutSrc: cutFruit('Cherry/Beni.png'), boxStyle: 'cherryGrape' },
      { name: 'アメリカンチェリー', wholeSrc: 'img/fruits/Whole Fruit/Cherry/American.png', cutSrc: cutFruit('Cherry/American.png'), boxStyle: 'cherryGrape' },
      { name: 'スイカ', wholeSrc: 'img/fruits/Whole Fruit/Watermelon/Red.png', cutSrc: cutFruit('Watermelon/Red.png') },
      { name: '黄スイカ', wholeSrc: 'img/fruits/Whole Fruit/Watermelon/Yellow.png', cutSrc: cutFruit('Watermelon/Yellow.png') },
    ];
    export const FRUITS_PER_PAGE = 10;
    export const CATALOG_TABS = [
      { id: 'fruit', label: '単品' },
      { id: 'recommend', label: '人気セット' },
      { id: 'history', label: '履歴' },
    ];
    export const TEST_BOX_IMAGES = [
      'img/test/Fruit Box 1.png',
      'img/test/Fruit Box 2.png',
      'img/test/Fruit Box 3.png',
    ];
	    export const TEST_BOX_ITEMS = Array.from({ length: 12 }, (_, index) => ({
	      name: `セット ${index + 1}`,
	      imageSrc: TEST_BOX_IMAGES[index % TEST_BOX_IMAGES.length],
	      fruits: [0, 3, 2, 4].map((fruitOffset) => {
	        const appleId = (index + fruitOffset) % FRUIT_ITEMS.length;
	        const fruit = FRUIT_ITEMS[appleId];
	        return { appleId, name: fruit.name, iconSrc: fruit.wholeSrc };
	      }),
	    }));
    // 顶部三段分类按钮位置和大小：top 越大越靠下，width/height 控制胶囊整体尺寸。
    export const CATALOG_SWITCH_STYLE = { top: 140, width: 300, height: 26, fontSize: 11 };
