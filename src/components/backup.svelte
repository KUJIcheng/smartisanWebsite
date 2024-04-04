<script>
  import { onMount } from 'svelte';

  let height, width, topPosition, iconSize;
  let settingiconX, settingiconY; // 设置的位置
  let sciconX, sciconY; // 闪念胶囊位置

  let svgCoverPercentage = 0.1; // 初始覆盖10%页面
  let searchContainerTop = '40%'; // 初始位置为40%
  let buttonTopPosition; // 按钮的顶部位置

  onMount(() => {
    calculateSizeAndPosition();
    window.addEventListener('resize', calculateSizeAndPosition);

    return () => {
      window.removeEventListener('resize', calculateSizeAndPosition);
    };
  });

  function calculateSizeAndPosition() {
    const pageHeight = window.innerHeight;
    width = window.innerWidth;
    height = pageHeight * svgCoverPercentage; // 根据比例计算高度
    topPosition = pageHeight * (1 - svgCoverPercentage); // 计算顶部位置
    buttonTopPosition = topPosition + 6; // SVG顶部位置下方6px
    iconSize = height * 0.22; // 初始页面的icon大小
    settingiconX = (width * 0.5 - iconSize / 2);
    settingiconY = (height * 0.5 - iconSize / 2);
    sciconX = (width * 0.4 - iconSize / 2);
    sciconY = (height * 0.5 - iconSize / 2);
  }

  function toggleSVGSize() {
    svgCoverPercentage = svgCoverPercentage === 0.5 ? 0.1 : 0.5;
    searchContainerTop = searchContainerTop === '40%' ? '20%' : '40%';
    calculateSizeAndPosition();
  }

  // 根据svgCoverPercentage决定是否显示图标
  function shouldShowIcons() {
    return svgCoverPercentage !== 0.5;
  }
</script>

<main>
  <div class="search-container" style="top: {searchContainerTop};">
    <input class="search-input" placeholder="Search..." />
  </div>

  <svg {width} {height} style="position: absolute; top: {topPosition}px; left: 50%; transform: translateX(-50%); transition: height 0.3s, top 0.3s;" viewBox="0 0 {width} {height}">
    <rect width={width} height={height} fill="transparent"/>

    <g id="icon-container" style="transform-origin: {sciconX + iconSize / 2}px {sciconY + iconSize / 2}px;">
      <image href="icons/shinianCapsule.png" x={sciconX} y={sciconY} height={iconSize} width={iconSize} />
    </g>

    <g id="icon-container" style="transform-origin: {settingiconX + iconSize / 2}px {settingiconY + iconSize / 2}px;">
      <image href="icons/setting.png" x={settingiconX} y={settingiconY} height={iconSize} width={iconSize} />
    </g>

  </svg>

  <!-- 按钮定位 -->
  <div class="button-container" style="top: {buttonTopPosition}px;">
    <button class="button" on:click={toggleSVGSize}></button>
  </div>

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
    transition: height 0.3s, top 0.3s;
  }

  .search-container {
    position: absolute;
    top: 20%; /* 根据需要调整 */
    left: 50%;
    transform: translate(-50%, -50%);
    width: 40%; /* 根据需要调整 */
    transition: top 0.3s; /* 添加过渡效果 */
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

  .search-input:hover {
    transform: scale(1.01); /* 鼠标悬停时放大到原始尺寸的 101% */
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.35), 0 15px 30px rgba(0, 0, 0, 0.25); /* 鼠标悬停时加深阴影 */
  }

  /* 可以添加一些过渡效果来增强视觉效果 */
  .search-input:focus {
    background-color: rgba(255, 255, 255, 0.75); /* 聚焦时背景更透明 */
    transform: scale(1.02); /* 放大到原始尺寸的102% */
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.4), 0 18px 36px rgba(0, 0, 0, 0.3); /* 加深并加长阴影 */
  }

  #icon-container {
    transition: transform 0.3s ease, filter 0.3s ease;
    filter: drop-shadow(0px 4px 6px rgba(0,0,0,0.5));
  }

  #icon-container:hover {
    transform: scale(1.1);
    filter: drop-shadow(0 10px 6px rgba(0, 0, 0, 0.7));
  }

  .button-container {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    transition: top 0.3s; /* 控制按钮随 SVG 移动的动画 */
  }

  .button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100px; /* 按钮宽度 */
    height: 8px; /* 按钮高度 */
    background-color: rgba(255, 255, 255, 0.15); /* 按钮初始背景颜色为白色半透明 */
    color: #FFFFFF; /* 按钮文字颜色 */
    border-radius: 4px; /* 圆角边框 */
    border: none; /* 移除边框 */
    cursor: pointer;
    transition: background-color 0.5s, opacity 0.5s; /* 添加透明度的过渡效果 */
  }

  .button:hover {
    background-color: rgba(255, 255, 255, 0.35); /* 鼠标悬停时的背景颜色为白色，透明度降低（更不透明） */
  }
</style>