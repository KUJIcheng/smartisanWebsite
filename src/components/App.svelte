<script>
  import { onMount } from 'svelte';
  import { fly } from 'svelte/transition';

  let height, width, topPosition, iconsize;
  let pageheight, pagewidth;

  let isVisible = true; // 控制图标容器是否可见
  let showSidebar = false; // 闪念胶囊是否出现
  let showSettingbar = false; // 桌面设置是否出现

  // 下雨的组件
  let rain = true; // 控制雨滴效果是否激活false
  let rainCanvas, rainCtx;
  let droplets = []; // 存储雨滴对象

  // 闪念胶囊的位置
  let snjntop, snjnleft;

  // 桌面设置的位置
  let zmsztop, zmszright;

  // 搜索栏的上下高度
  let searchbarheight;

  let svgCoverPercentage = 0.1; // 初始覆盖10%页面
  let searchContainerTop = '40%'; // 初始位置为40%
  let searchContainerLeft = '48.4%';
  let buttonTopPosition; // 按钮的顶部位置

  onMount(() => {
    calculateSizeAndPosition();
    window.addEventListener('resize', calculateSizeAndPosition);
    window.addEventListener('wheel', handleWheel);

    // 基于rain判断是否下雨
    if (rain) {
      startRain();
    }

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
    searchContainerLeft = searchContainerLeft === '48.4%' ? '65%' : '48.4%';
    snjntop = snjntop === topPosition + (height * 0.5) - iconsize * 0.5 ? pageheight * 0.05 : topPosition + (height * 0.5) - iconsize * 0.5;
    snjnleft = snjnleft === (width * 0.01) ? (width * 0.15) - iconsize * 0.5 : (width * 0.01);
  }

  // 更改桌面设置页面是否出现
  function togglesettingbar() {
    showSettingbar = !showSettingbar;
    searchContainerLeft = searchContainerLeft === '48.4%' ? '35%' : '48.4%';
    zmsztop = zmsztop === topPosition + (height * 0.5) - iconsize * 0.5 ? pageheight * 0.05 : topPosition + (height * 0.5) - iconsize * 0.5;
    zmszright = zmszright === (width * 0.01) ? (width * 0.15) - iconsize * 0.5 : (width * 0.01);
  }

  function toggleBoth() {
    toggleSVGSize(); // 调整SVG大小
    toggleVisibility(); // 控制图标的显示和隐藏
    showSidebar = false; // 闪念胶囊页面收回
    showSettingbar = false; // 桌面设置页面收回
    searchContainerLeft = '48.4%' // 搜索框归位
  }

  // 雨滴效果的function范围
  function toggleRain() {
    rain = !rain;
    if (rain) startRain();
    else stopRain();
  }

  function startRain() {
    
    // 之前的降雨效果
    rainCanvas = document.getElementById('rainCanvas');
    rainCtx = rainCanvas.getContext('2d');

    // 设置canvas大小
    rainCanvas.width = window.innerWidth;
    rainCanvas.height = window.innerHeight;

    // 创建雨滴
    createDroplets();

    // 开始绘制雨滴
    requestAnimationFrame(animateRain);

    const rainDiv = document.getElementById('rainEffectContainer');
    // 确保div是全屏的
    rainDiv.style.width = "100vw";
    rainDiv.style.height = "100vh";
    rainDiv.style.position = "fixed";
    rainDiv.style.top = "0";
    rainDiv.style.left = "0";
    rainDiv.style.zIndex = "0";  // 和下雨canvas同一层

    // 实例化雨滴在玻璃上的效果
    var rainyDay = new RainyDay({
      image: 'myImage',  // 图像的ID
      parentElement: rainDiv,
      blur: 10, // 失效的内容
      enableSizeChange: true,
      crop: {
        x: 16,
        y: 10,
        w: 200,
        h: 100
      },
      gravityThreshold: 5,
      fps: 100
    });

    // 雨滴滴在玻璃上的效果
    rainyDay.rain( [[1, 0, 20], [3, 3, 1]], 50); //[ [3, 1, 0.1] ]
  }

  function stopRain() {
    // 清空雨滴数组，停止动画
    droplets = [];
    rainCtx.clearRect(0, 0, rainCanvas.width, rainCanvas.height);
  }

  function createDroplets() {
    // 基于屏幕大小生成一定数量的雨滴
    const numberOfDroplets = rainCanvas.width * rainCanvas.height / 7000;
    for (let i = 0; i < numberOfDroplets; i++) {
      droplets.push({
        x: Math.random() * rainCanvas.width,
        y: Math.random() * rainCanvas.height,
        size: Math.random() * 2 + 1, // 雨滴大小
        speed: Math.random() * 2 + 6 // 雨滴下落速度
        });
    }
  }

  function animateRain() {
    if (!rain) return;
    rainCtx.clearRect(0, 0, rainCanvas.width, rainCanvas.height); // 清除之前的绘制
    droplets.forEach(droplet => {
      droplet.y += droplet.speed; // 更新雨滴位置
      if (droplet.y > rainCanvas.height) droplet.y = 0; // 如果雨滴落出画面，则重置位置
        // 绘制椭圆形雨滴
        rainCtx.beginPath();
        // ellipse(x, y, radiusX, radiusY, rotation, startAngle, endAngle)
        rainCtx.ellipse(droplet.x, droplet.y, droplet.size * 0.5, droplet.size, 0, 0, Math.PI * 2);
        rainCtx.fillStyle = 'rgba(130,130,130,0.5)'; // 雨滴颜色
        rainCtx.fill();
        // rainCtx.beginPath();
        // rainCtx.arc(droplet.x, droplet.y, droplet.size, 0, Math.PI * 2);
        // rainCtx.fillStyle = 'rgba(130,130,130,0.2)'; // 雨滴颜色
        // rainCtx.fill();
      });
    requestAnimationFrame(animateRain);
  }
</script>

<main>
  <!-- 引入RainyDay.js库 -->
  <script src="jspack/rainyday.min.js"></script>

  <!-- 设置图片为全屏背景 -->
  <img id="myImage" src="backgrounds/background13.jpg" alt="Background" class="fullscreen-image">
  
  <div class="search-container" style="top: {searchContainerTop}; left: {searchContainerLeft}; z-index: 1;">
    <input class="search-input" placeholder="Search..." style="height: {searchbarheight}px; font-size: {searchbarheight * 0.75}px; border-radius: {searchbarheight * 100}px; padding: {searchbarheight * 0.5}px {searchbarheight * 1}px;" />
  </div>

  <svg {width} {height} style="position: absolute; top: {topPosition}px; left: 50%; transform: translateX(-50%); transition: height 0.3s, top 0.3s;" viewBox="0 0 {width} {height}">
    <rect width={width} height={height} fill="transparent"/>
  </svg>

  {#if isVisible}
    <div style="position: absolute; top: {snjntop}px; left: {snjnleft}px; transition: top 0.5s, left 0.5s; z-index: 3;">
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
    <div style="position: absolute; top: {zmsztop}px; right: {zmszright}px; transition: top 0.5s, right 0.5s; z-index: 3;">
        <div transition:fly="{{ y: 40, duration: 300 }}" id="icon-container" style="width: {iconsize}px; height: {iconsize}px;">
          <button type="button" on:click={togglesettingbar} style="background: none; border: none; padding: 0; cursor: pointer;">
            <img src="icons/setting.png" alt="桌面设置图标" style="width: 100%; height: 100%;" />
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
  <div class="button-container" style="top: {buttonTopPosition}px; z-index: 3;">
    <button class="button" on:click={toggleBoth}></button>
  </div>

  <canvas id="rainCanvas"></canvas>
  <div id="rainEffectContainer"></div>

</main>

<style>
  /* 全局样式修改 */
  :global(body) {
    margin: 0; /* 移除默认边距 */
    overflow: hidden; /* 隐藏滚动条 */
  }
  
  /* 背景图像样式，确保全屏显示且覆盖整个视口 */
  .fullscreen-image {
    top: 0; /* 顶部对齐 */
    left: 0; /* 左侧对齐 */
    width: 100vw;
    height: 100vh;
    object-fit: cover;  /* 覆盖整个内容区域 */
    z-index: 0;  /* 确保图像在内容之下 */
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
    z-index: 1;
  }

  .search-container {
    position: absolute;
    top: 20%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 36%;
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
    color: #000; /* 文字颜色 */
    transition: transform 0.3s ease, box-shadow 0.3s ease; /* 添加平滑过渡效果 */
  }

  .search-input:hover {
    transform: scale(1.01); /* 鼠标悬停时放大到原始尺寸的 101% */
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.35), 0 15px 30px rgba(0, 0, 0, 0.25); /* 鼠标悬停时加深阴影 */
  }

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
    z-index: 3;
  }

  .button:hover {
    background-color: rgba(255, 255, 255, 0.35); /* 鼠标悬停时的背景颜色为白色，透明度降低（更不透明） */
  }

  #icon-container {
    display: inline-block;
    transition: transform 0.3s ease, filter 0.3s ease;
    filter: drop-shadow(0px 4px 6px rgba(0,0,0,0.5));
    cursor: pointer;
    z-index: 3;
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
    z-index: 2;
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
    z-index: 2;
  }

  #rainCanvas {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    pointer-events: none;
    z-index: 0; /* 根据你页面的其他元素调整这个值 */
  }

  #rainEffectContainer {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: 1; /* 确保这个div在背景之上，但在其他UI组件之下 */
    pointer-events: none; /* 允许鼠标事件穿透到下层元素 */
  }
</style>