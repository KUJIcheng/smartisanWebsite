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
    height = pageHeight * 0.5;
    // width = height * 21 / 8;
    width = window.innerWidth
    topPosition = pageHeight * 0.5;
  }
</script>

<main>
  <div class="search-container">
    <input class="search-input" placeholder="Search..." />
  </div>
  <svg {width} {height} style="top: {topPosition}px;" viewBox="0 0 {width} {height}">

  <svg {width} {height} style="top: {topPosition}px;" viewBox="0 0 {width} {height}">
    <rect width={width} height={height} fill="transparent"/>
    <image href="/icons/com.tencent.mm.com.tencent.mm.png" x="{width / 2 - 50}" y="{height / 2 - 50}" height=80 width=80 id="icon"/>
  </svg>
</main>

<style>
  :global(body) {
    background-image: url('/backgrounds/background9.jpg'); /* 设置背景图片 */
    background-size: cover; /* 保证背景图片铺满整个容器 */
    background-attachment: fixed; /* 背景图片不随滚动条滚动 */
  }

  svg {
    position: absolute;
    left: 50%;
    transform: translate(-50%, 0%);
    /*border-radius: 15px; /* 圆角 */
    overflow: hidden; /* 确保圆角和滤镜效果生效 */
    backdrop-filter: blur(5px); /* 毛玻璃效果 */
    -webkit-backdrop-filter: blur(5px); /* Safari浏览器兼容 */
    background-color: rgba(120, 120, 120, 0.1); /* 背景颜色透明度，与毛玻璃效果结合 */
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3), /* 水平偏移 垂直偏移 模糊半径 颜色 */
               0 0px 24px rgba(0, 0, 0, 0.2); /* 可以添加多层阴影，根据需求调整 */
  }

  .search-container {
    position: absolute;
    top: 20%; /* 根据需要调整 */
    left: 50%;
    transform: translate(-50%, -50%);
    width: 40%; /* 根据需要调整 */
  }

  .search-input {
    width: 100%;
    padding: 10px 20px;
    border-radius: 20px; /* 圆角 */
    border: none; /* 移除边框 */
    outline: none; /* 移除焦点边框 */
    backdrop-filter: blur(5px);
    -webkit-backdrop-filter: blur(5px);
    background-color: rgba(255, 255, 255, 0.4); /* 调整背景颜色和透明度以适应毛玻璃效果 */
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3), 0 12px 24px rgba(0, 0, 0, 0.2); /* 同样的阴影效果 */
    color: #000; /* 文字颜色，根据背景调整 */
    font-size: 15px; /* 文字大小 */
    transition: transform 0.3s ease, box-shadow 0.3s ease; /* 添加平滑过渡效果 */
  }

  /* 可以添加一些过渡效果来增强视觉效果 */
  .search-input:focus {
    background-color: rgba(255, 255, 255, 0.75); /* 聚焦时背景更透明 */
    transform: scale(1.02); /* 放大到原始尺寸的105% */
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.4), 0 18px 36px rgba(0, 0, 0, 0.3); /* 加深并加长阴影 */
  }

  #icon {
    transition: transform 0.3s ease, filter 0.3s ease;
    transform-origin: center; /* 明确指定变换原点在中心 */
    filter: drop-shadow(0px 4px 6px rgba(0,0,0,0.5));
  }

  #icon:hover {
    transform: scale(1.1);
    filter: drop-shadow(0px 8px 7px rgba(0,0,0,0.7));
  }
</style>
