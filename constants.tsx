
import { ArtStyle, StyleOption, AspectRatio } from './types';

export const STYLE_OPTIONS: StyleOption[] = [
  {
    id: ArtStyle.RENAISSANCE,
    label: '文艺复兴',
    icon: '🏛️',
    description: '古典油画，戏剧性光影',
    prompt: '将此图像转换为经典的文艺复兴时期油画风格。使用戏剧性的明暗对比，丰富的泥土纹理，以及类似于达芬奇或拉斐尔的写实特征。保留原始构图。'
  },
  {
    id: ArtStyle.WATERCOLOR,
    label: '水彩艺术',
    icon: '🎨',
    description: '柔和边缘，色彩晕染',
    prompt: '将此图像转换为精美的水彩画。使用柔和的边缘、细腻的色彩渗透、可见的纸张纹理和艺术笔触。色彩应显得充满活力且半透明。'
  },
  {
    id: ArtStyle.CHINESE,
    label: '水墨国画',
    icon: '🏮',
    description: '传统写意，禅意留白',
    prompt: '将此图像转换为中国传统水墨画风格。使用写意的黑色墨水笔触、变化的墨水浓度、优雅的构图和柔软的宣纸纹理。'
  },
  {
    id: ArtStyle.COMIC,
    label: '美漫风格',
    icon: '💥',
    description: '粗旷线条，明亮高亮',
    prompt: '将此图像重新想象为经典的美国超级英雄漫画书插图。使用厚重的黑色线条、戏剧性的阴影、半色调图案和充满活力的主色调。'
  },
  {
    id: ArtStyle.PHOTOGRAPHY,
    label: '摄影大片',
    icon: '📸',
    description: '专业质感，电影光效',
    prompt: '将此图像转换为高端专业摄影杰作。增强细节，使其看起来像国家地理或编辑时尚拍摄。使用浅景深、精美的背景虚化和专业的演播室灯光。'
  },
  {
    id: ArtStyle.CYBERPUNK,
    label: '赛博朋克',
    icon: '🌃',
    description: '霓虹流光，未来科技',
    prompt: '以赛博朋克美学重新设计此图像。添加粉红色、蓝色和紫色的发光霓虹灯。融入高科技界面元素、未来主义城市氛围和阴暗、忧郁的高对比度色调。'
  },
  {
    id: ArtStyle.ANIME,
    label: '唯美动漫',
    icon: '🌸',
    description: '清新治愈，新海诚感',
    prompt: '将此转换为高质量的现代动漫风格，类似于新海诚电影。使用明亮鲜艳的色彩、精细的天空和背景、干净的线稿以及电影般的感性氛围。'
  },
  {
    id: ArtStyle.MANGA,
    label: '日漫二次元',
    icon: '✨',
    description: '日系风格，赛璐璐风',
    prompt: '以干净的 2D 漫画/插图风格重新绘制。使用粗体轮廓、赛璐璐上色以及特征明显的动漫眼睛和表情。'
  },
  {
    id: ArtStyle.THREE_D,
    label: '3D 渲染',
    icon: '🧊',
    description: '皮克斯感，软萌建模',
    prompt: '将此图像转换为 3D 皮克斯风格或高端 Unreal Engine 5 渲染。特征应稍微风格化，边缘圆润，具有柔和的全域照明和真实的材质纹理。'
  }
];

export const ASPECT_RATIOS: { label: string; value: AspectRatio }[] = [
  { label: '原图', value: 'original' },
  { label: '1:1 方形', value: '1:1' },
  { label: '4:3 复古', value: '4:3' },
  { label: '16:9 宽屏', value: '16:9' },
  { label: '9:16 竖屏', value: '9:16' }
];
