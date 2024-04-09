<script>
  import { onMount } from 'svelte';
  import { fly } from 'svelte/transition';

  let height, width, topPosition, iconsize;
  let pageheight, pagewidth;

  let isVisible = true; // 控制图标容器是否可见
  let showSidebar = false; // 闪念胶囊是否出现
  let showSettingbar = false; // 桌面设置是否出现
  
  // 闪念胶囊的位置
  let snjntop, snjnleft;

  // 桌面设置的位置
  let zmsztop, zmszright;

  // 搜索栏的上下高度
  let searchbarheight;

  let svgCoverPercentage = 0.1; // 初始覆盖10%页面
  let searchContainerTop = '40%'; // 初始位置为40%
  let searchContainerLeft = '50%';
  let buttonTopPosition; // 按钮的顶部位置

  onMount(() => {
    calculateSizeAndPosition();
    window.addEventListener('resize', calculateSizeAndPosition);
    window.addEventListener('wheel', handleWheel);

    return () => {
      window.removeEventListener('resize', calculateSizeAndPosition);
      window.removeEventListener('wheel', handleWheel); // 确保在组件销毁时移除事件监听器
    };
  });

  function calculateSizeAndPosition() {
    const pageHeight = window.innerHeight;
    width = window.innerWidth;
    height = pageHeight * svgCoverPercentage; // 根据比例计算高度
    topPosition = pageHeight * (1 - svgCoverPercentage); // 计算顶部位置
    buttonTopPosition = topPosition + 5; // SVG顶部位置下方5px
    iconsize = height * 0.7
    searchbarheight = window.innerHeight * 0.03

    // 页面的高度和宽度的追踪
    pageheight = window.innerHeight;
    pagewidth = window.innerWidth;

    // 闪念胶囊位置的动态计算
    snjntop = topPosition + (height * 0.5) - iconsize * 0.5;
    snjnleft = (width * 0.01);

    // 桌面设置图标位置的动态计算
    zmsztop = topPosition + (height * 0.5) - iconsize * 0.5;
    zmszright = (width * 0.01);
  }

  // 处理鼠标滚轮事件的函数
  function handleWheel(event) {
    // 检查滚动方向：deltaY > 0 表示向下滚动，deltaY < 0 表示向上滚动
    if (event.deltaY > 0) {
      // 向下滚动
      if (svgCoverPercentage !== 0.5) toggleBoth();
    } else if (event.deltaY < 0) {
      // 向上滚动
      if (svgCoverPercentage !== 0.1) toggleBoth();
    }
  }

  function toggleSVGSize() {
    svgCoverPercentage = svgCoverPercentage === 0.5 ? 0.1 : 0.5;
    searchContainerTop = searchContainerTop === '40%' ? '20%' : '40%';
    calculateSizeAndPosition();
  }

  function toggleVisibility() {
    isVisible = !isVisible;
  }

  // 更改闪念胶囊页面是否出现
  function toggleSidebar() {
    showSidebar = !showSidebar;
    searchContainerLeft = searchContainerLeft === '50%' ? '65%' : '50%';
    snjntop = snjntop === topPosition + (height * 0.5) - iconsize * 0.5 ? pageheight * 0.05 : topPosition + (height * 0.5) - iconsize * 0.5;
    snjnleft = snjnleft === (width * 0.01) ? (width * 0.15) - iconsize * 0.5 : (width * 0.01);
  }

  // 更改桌面设置页面是否出现
  function togglesettingbar() {
    showSettingbar = !showSettingbar;
    searchContainerLeft = searchContainerLeft === '50%' ? '35%' : '50%';
    zmsztop = zmsztop === topPosition + (height * 0.5) - iconsize * 0.5 ? pageheight * 0.05 : topPosition + (height * 0.5) - iconsize * 0.5;
    zmszright = zmszright === (width * 0.01) ? (width * 0.15) - iconsize * 0.5 : (width * 0.01);
  }

  function toggleBoth() {
    toggleSVGSize(); // 调整SVG大小
    toggleVisibility(); // 控制图标的显示和隐藏
    showSidebar = false; // 闪念胶囊页面收回
    showSettingbar = false; // 桌面设置页面收回
    searchContainerLeft = '50%' // 搜索框归位
  }

</script>

<main>
  <div class="search-container" style="top: {searchContainerTop}; left: {searchContainerLeft}">
    <input class="search-input" placeholder="Search..." style="height: {searchbarheight}px; font-size: {searchbarheight * 0.75}px; border-radius: {searchbarheight * 100}px; padding: {searchbarheight * 0.5}px {searchbarheight * 1}px;" />
  </div>

  <svg {width} {height} style="position: absolute; top: {topPosition}px; left: 50%; transform: translateX(-50%); transition: height 0.3s, top 0.3s;" viewBox="0 0 {width} {height}">
    <rect width={width} height={height} fill="transparent"/>
  </svg>

  {#if isVisible}
    <div style="position: absolute; top: {snjntop}px; left: {snjnleft}px; transition: top 0.5s, left 0.5s; z-index: 2;">
        <div transition:fly="{{ y: 40, duration: 300 }}" id="icon-container" style="width: {iconsize}px; height: {iconsize}px;">
          <button type="button" on:click={toggleSidebar} style="background: none; border: none; padding: 0; cursor: pointer;">
            <img src="icons/shinianCapsule.png" alt="闪念胶囊图标" style="width: 100%; height: 100%;" />
          </button>
        </div>
    </div>
  {/if}

  <!-- 闪念胶囊右侧页面 -->
  <div class="sidebar" style="transform: {showSidebar ? 'translateX(0)' : 'translateX(-100%)'};">
    <svg width="{pagewidth * 0.3}px" height="{pageheight}px" style = "box-shadow: {showSidebar ? '0 6px 16px rgba(0, 0, 0, 0.3), 0 0px 24px rgba(0, 0, 0, 0.2)' : 'none'}; transition: box-shadow 0.8s ease-in-out;">
        <rect width="100%" height="100%" fill="transparent"/>
    </svg>
  </div>

  {#if isVisible}
    <div style="position: absolute; top: {zmsztop}px; right: {zmszright}px; transition: top 0.5s, right 0.5s; z-index: 2;">
        <div transition:fly="{{ y: 40, duration: 300 }}" id="icon-container" style="width: {iconsize}px; height: {iconsize}px;">
          <button type="button" on:click={togglesettingbar} style="background: none; border: none; padding: 0; cursor: pointer;">
            <img src="icons/Desktop.png" alt="桌面设置图标" style="width: 100%; height: 100%;" />
          </button>
        </div>
    </div>
  {/if}

  <!-- 桌面设置左侧页面 -->
  <div class="settingbar" style="transform: {showSettingbar ? 'translateX(0)' : 'translateX(100%)'};">
    <svg width="{pagewidth * 0.3}px" height="{pageheight}px" style = "box-shadow: {showSettingbar ? '0 6px 16px rgba(0, 0, 0, 0.3), 0 0px 24px rgba(0, 0, 0, 0.2)' : 'none'}; transition: box-shadow 0.8s ease-in-out;">
        <rect width="100%" height="100%" fill="transparent"/>
    </svg>
  </div>

  <!-- 按钮定位 -->
  <div class="button-container" style="top: {buttonTopPosition}px;">
    <button class="button" on:click={toggleBoth}></button>
  </div>

</main>

<style>
  :global(body) {
    overflow: hidden;
    background-image: url('/backgrounds/background1.jpg'); /* 设置背景图片 */
    background-size: cover; /* 保证背景图片铺满整个容器 */
    background-attachment: fixed; /* 背景图片不随滚动条滚动 */
  }

  svg {
    position: absolute;
    left: 50%;
    transform: translate(-50%, 0%);
    overflow: hidden; /* 确保滤镜效果生效 */
    backdrop-filter: blur(5px); /* 毛玻璃效果 */
    -webkit-backdrop-filter: blur(5px); /* Safari浏览器兼容 */
    background-color: rgba(120, 120, 120, 0.1); /* 背景颜色透明度，与毛玻璃效果结合 */
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3),
               0 0px 24px rgba(0, 0, 0, 0.2);
    transition: height 0.3s, top 0.3s;
  }

  .search-container {
    position: absolute;
    top: 20%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 40%;
    transition: top 0.3s, left 0.3s;
  }

  .search-input {
    width: 100%;
    border: none; /* 移除边框 */
    outline: none; /* 移除焦点边框 */
    backdrop-filter: blur(5px);
    -webkit-backdrop-filter: blur(5px);
    background-color: rgba(255, 255, 255, 0.4); /* 调整背景颜色和透明度以适应毛玻璃效果 */
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3), 0 12px 24px rgba(0, 0, 0, 0.2); /* 同样的阴影效果 */
    color: #000; /* 文字颜色，根据背景调整 */
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
    z-index: 2;
  }

  .button:hover {
    background-color: rgba(255, 255, 255, 0.35); /* 鼠标悬停时的背景颜色为白色，透明度降低（更不透明） */
  }

  #icon-container {
    display: inline-block;
    transition: transform 0.3s ease, filter 0.3s ease;
    filter: drop-shadow(0px 4px 6px rgba(0,0,0,0.5));
    cursor: pointer;
    z-index: 2;
  }

  #icon-container:hover {
    transform: scale(1.1);
    filter: drop-shadow(0px 10px 6px rgba(0,0,0,0.7));
  }

  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    width: 30%;
    height: 100%;
    backdrop-filter: blur(7px);
    -webkit-backdrop-filter: blur(7px);
    background-color: rgba(150, 150, 150, 0.05);
    transform: translateX(-100%);
    transition: transform 0.5s ease-in-out;
    z-index: 0;
  }

  .settingbar {
    position: fixed;
    top: 0;
    right: 0;
    width: 30%;
    height: 100%;
    backdrop-filter: blur(7px);
    -webkit-backdrop-filter: blur(7px);
    background-color: rgba(150, 150, 150, 0.05);
    transform: translateX(100%);
    transition: transform 0.5s ease-in-out;
    z-index: 0;
  }
</style>