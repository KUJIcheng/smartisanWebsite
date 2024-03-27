<script>
  import { onMount } from 'svelte';

  let height, width, topPosition;

  onMount(() => {
    calculateSizeAndPosition();
    window.addEventListener('resize', calculateSizeAndPosition);

    return () => {
      window.removeEventListener('resize', calculateSizeAndPosition);
    };
  });

  // 动态计算SVG的宽高和位置
  function calculateSizeAndPosition() {
    const pageHeight = window.innerHeight;
    height = pageHeight * 0.4;
    width = height * 21 / 8;
    topPosition = pageHeight * 0.7 - height * 0.5;
  }
</script>

<main>
  <svg {width} {height} style="top: {topPosition}px;" viewBox="0 0 {width} {height}">
    <rect width={width} height={height} fill="transparent"/>
    <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle">Here</text>
  </svg>
</main>

<style>
  :global(body) {
    background-image: url('/backgrounds/background2.jpg'); /* 设置背景图片 */
    background-size: cover; /* 保证背景图片铺满整个容器 */
    background-attachment: fixed; /* 背景图片不随滚动条滚动 */
  }

  svg {
    position: absolute;
    left: 50%;
    transform: translate(-50%, 0%);
    border-radius: 15px; /* 圆角 */
    overflow: hidden; /* 确保圆角和滤镜效果生效 */
    backdrop-filter: blur(12px); /* 毛玻璃效果 */
    -webkit-backdrop-filter: blur(12px); /* Safari浏览器兼容 */
    background-color: rgba(255, 255, 255, 0.2); /* 背景颜色透明度，与毛玻璃效果结合 */
  }
</style>
