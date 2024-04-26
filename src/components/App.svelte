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
  let rainyDay; // 雨滴效果的对象

  // 时钟组件
  let currentTime = '';
  let currentDate = '';
  let currentDay = '';
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // 天气组件
  let weather = { temp: '', description: '', iconUrl: '' };

  // 闪念胶囊的位置
  let snjntop, snjnleft;

  // 桌面设置的位置
  let zmsztop, zmszright;

  // 时钟的高度
  let clocktop;

  // 日历的位置
  let rltop, rlleft;
  // 日历下方位置
  let rldowntop, rldownleft;
  // 日历上方位置
  let rluptop, rlupleft;

  // 天气的位置
  let tqtop, tqright;
  // 天气下方位置
  let tqdowntop, tqdownright;
  // 天气上方位置
  let tquptop, tqupright;

  // 搜索栏的上下高度
  let searchbarheight;

  let svgCoverPercentage = 0.1; // 初始覆盖10%页面
  let searchContainerTop = '40%'; // 初始位置为40%
  let searchContainerLeft = '50%';
  let buttonTopPosition; // 按钮的顶部位置

  // 日历组件的长宽
  let rlwidth, rlheight;

  onMount( async() => {
    calculateSizeAndPosition();
    window.addEventListener('resize', calculateSizeAndPosition);
    window.addEventListener('wheel', handleWheel);
    // 时间组件的更新
    updateDateTime();

    navigator.geolocation.getCurrentPosition(async position => {
        const { latitude, longitude } = position.coords;
        await fetchWeatherData(weatherInfo => {
            weather = weatherInfo;
        }, latitude, longitude);
    }, error => {
        console.error('Error getting location', error);
    });

    await loadScript('pack/rainyday.min.js');

    // 基于rain判断是否下雨
    if (rain) {
      startRain();
    }

    return () => {
      clearInterval(interval); // 清除时钟定时器
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
    iconsize = pageHeight * 0.07
    searchbarheight = window.innerHeight * 0.03

    // 页面的高度和宽度的追踪
    pageheight = window.innerHeight;
    pagewidth = window.innerWidth;

    // 闪念胶囊位置的动态计算
    snjntop = pageheight * 0.9 + (pageheight * 0.05) - iconsize * 0.5;
    snjnleft = (width * 0.01);

    // 桌面设置图标位置的动态计算
    zmsztop = pageheight * 0.9 + (pageheight * 0.05) - iconsize * 0.5;
    zmszright = (width * 0.01);

    // 时钟位置的动态计算
    clocktop = topPosition + pageHeight * 0.05;

    // 日历和天气组件的长宽动态计算
    rlwidth = window.innerHeight * 0.475;
    rlheight = window.innerHeight * 0.475;

    // 日历初始位置的动态计算
    rltop = pageheight * 0.9 + (pageheight * 0.05) - iconsize * 0.5;
    rlleft = snjnleft + iconsize + (width * 0.01); // 确保在闪念胶囊右边且不会重合
    // 日历下方位置的动态计算
    rldowntop = rltop;
    rldownleft = rlleft;
    // 日历上方位置的动态计算
    rluptop = rlheight;
    rlupleft = rlwidth * 0.525 - iconsize * 0.5;

    // 天气位置的动态计算
    tqtop = pageheight * 0.9 + (pageheight * 0.05) - iconsize * 0.5;
    tqright = zmszright + iconsize + (width * 0.01); // 确保在桌面设置左边且不会重合
    // 天气下方位置的动态计算
    tqdowntop = tqtop;
    tqdownright = tqright;
    // 天气上方位置的动态计算
    tquptop = rlheight;
    tqupright = rlwidth * 0.525 - iconsize * 0.5;

    toggleRLTQ() // 重新计算日历和天气的位置
    // 改变页面比例时恢复初始位置
    showSidebar = false;
    showSettingbar = false;
    searchContainerLeft = '50%';
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
    if (showSidebar) {
      showSidebar = !showSidebar;
      searchContainerLeft = '50%'
    } else {
      showSidebar = !showSidebar;
      searchContainerLeft = searchContainerLeft === '50%' ? '65%' : '50%';
    }
    snjntop = snjntop === topPosition + (height * 0.5) - iconsize * 0.5 ? pageheight * 0.05 : topPosition + (height * 0.5) - iconsize * 0.5;
    snjnleft = snjnleft === (width * 0.01) ? (width * 0.15) - iconsize * 0.5 : (width * 0.01);
  }

  // 更改桌面设置页面是否出现
  function togglesettingbar() {
    if (showSettingbar) {
      showSettingbar = !showSettingbar;
      searchContainerLeft = '50%'
    } else {
      showSettingbar = !showSettingbar;
      searchContainerLeft = searchContainerLeft === '50%' ? '35%' : '50%';
    }
    zmsztop = zmsztop === topPosition + (height * 0.5) - iconsize * 0.5 ? pageheight * 0.05 : topPosition + (height * 0.5) - iconsize * 0.5;
    zmszright = zmszright === (width * 0.01) ? (width * 0.15) - iconsize * 0.5 : (width * 0.01);
  }

  function toggleBoth() {
    toggleSVGSize(); // 调整SVG大小
    toggleVisibility(); // 控制图标的显示和隐藏
    showSidebar = false; // 闪念胶囊页面收回
    showSettingbar = false; // 桌面设置页面收回
    searchContainerLeft = '50%' // 搜索框归位
    toggleRLTQ() // 日历图标的移动
  }

  function toggleRLTQ() {
    if (isVisible) {
      rltop = rldowntop;
      rlleft = rldownleft;
      tqtop = tqdowntop;
      tqright = tqdownright;
    } else {
      rltop = rluptop;
      rlleft = rlupleft;
      tqtop = tquptop;
      tqright = tqupright;
    }
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
    const rainyDay = new RainyDay({
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
    rainyDay.rain([[1, 0, 20], [3, 3, 1]], 50); // [[1, 0, 20], [3, 3, 1]], 50
  }

  function startdroplet() {
    // 雨滴滴在玻璃上的效果
    rainyDay.rain([[1, 0, 20], [3, 3, 1]], 50); // [[1, 0, 20], [3, 3, 1]], 50
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

  async function loadScript(url) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = url;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  // 时钟组件function：
  function updateDateTime() {
    const now = new Date();
    currentTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    currentDate = `${months[now.getMonth()]} ${now.getDate()}`;
    currentDay = days[now.getDay()];
    requestAnimationFrame(updateDateTime);
  }

  async function fetchWeatherData(setWeather, lat, lon) {
    const weatherKey = 'fe4ef9fb1a3076d88704a1f3c2afe244';
    const url = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&exclude=minutely,hourly&appid=${weatherKey}&units=metric`;
    try {
      const cityName = await fetchCityName(lat, lon); // 获取城市名称
      const response = await fetch(url);
      const data = await response.json();

      const sunriseTime = new Date(data.current.sunrise * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const sunsetTime = new Date(data.current.sunset * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      setWeather({
        location: cityName, // 使用从 Google API 获取的城市名称
        temp: `${Math.round(data.current.temp)}°C`,
        feels_like: `${Math.round(data.current.feels_like)}°C`,
        sunrise: sunriseTime,
        sunset: sunsetTime,
        description: data.current.weather[0].description
      });
    } catch (error) {
      console.error('Failed to fetch weather data:', error);
      setWeather({ location: '位置获取失败', temp: 'N/A', description: '无数据', iconUrl: '' });
    }
  }

  async function fetchCityName(lat, lon) {
    const mapKey = 'AIzaSyDh3JpTYnFa1UpGU4p-m396b3VjiymJ0O4';
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lon}&key=${mapKey}`;

    // const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=22.333564,114.269492&key=AIzaSyDh3JpTYnFa1UpGU4p-m396b3VjiymJ0O4`;
    // const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=32.715736,-117.161087&key=AIzaSyDh3JpTYnFa1UpGU4p-m396b3VjiymJ0O4`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.results && data.results.length > 0) {
            const addressComponents = data.results[0].address_components;
            let locality = addressComponents.find(component => component.types.includes('locality'));
            if (!locality) {
                locality = addressComponents.find(component => component.types.includes('country'));
            }
            const sublocality = addressComponents.find(component =>  component.types.includes('neighborhood'));

            let locationName = locality ? locality.long_name : '未知城市';
            if (sublocality) {
                locationName += `, ${sublocality.long_name}`;
            }

            return locationName;
        }
        return '未知位置';
    } catch (error) {
        console.error('Failed to fetch city name:', error);
        return '位置获取失败';
    }
  }
</script>

<main>

  <!-- 设置图片为全屏背景 -->
  <img id="myImage" src="backgrounds/background2.jpg" alt="Background" class="fullscreen-image">

  <div class="search-container" style="top: {searchContainerTop}; left: {searchContainerLeft}; z-index: 1;">
    <input class="search-input" placeholder="Search..." 
           style="height: {searchbarheight}px; 
                  font-size: {searchbarheight * 0.75}px; 
                  border-radius: {searchbarheight * 100}px; 
                  padding: {searchbarheight * 0.5}px {searchbarheight * 0}px;
                  text-indent: {searchbarheight * 1}px;">
  </div>

  <!-- 底部承托组件平台 -->
  <svg {width} {height} style="position: absolute; top: {topPosition}px; left: 50%; transform: translateX(-50%); transition: height 0.3s, top 0.3s;" viewBox="0 0 {width} {height}">
    <rect width={width} height={height} fill="transparent"/>
  </svg>

  <!-- 时钟组件 -->
  {#if isVisible}
    <div style="position: absolute; top: {clocktop}px; left: 48.4%; transform: translateX(-50%); transition: top 0.5s, left 0.5s; z-index: 3;">
        <div transition:fly="{{ y: 40, duration: 300 }}" id="clock-container">
          <!-- 时钟显示区 -->
          <div class="clock" style="font-size: {height * 0.035}rem;">{currentTime}</div>
          <!-- 日期和星期显示区 -->
          <div class="date-info" style="font-size: {height * 0.01}rem; left: {height * 0.83}px; top: -{height * 0.3}px;">
            <span class="day">{currentDay}</span>
            <span class="date">{currentDate}</span>
          </div>
        </div>
    </div>
  {/if}

  <!-- 日历组件位置 -->
  {#if !isVisible}
    <svg
      width="{rlwidth}px" 
      height="{rlheight}px"
      style="position: absolute; bottom: 1.25%; left: {rlwidth * 0.525}px;
      border-radius: 10px;
      box-shadow: inset 0 0 10px rgba(0,0,0,0.5);"
      viewBox="0 0 {rlwidth} {rlheight}"
      in:fly={{y: 500, duration: 800}}
      out:fly={{y: 300, duration: 300}}
    >
      <rect width="100%" height="100%" fill="transparent" />
    </svg>
  {/if}

  <!-- 网页链接组件位置 -->
  {#if !isVisible}
    <svg
      width="{pagewidth - rlwidth * 2 - rlwidth * 0.1}px"
      height="{rlheight}px"
      style="position: absolute; bottom: 1.25%; left: 50%; 
      border-radius: 10px;
      box-shadow: inset 0 0 10px rgba(0,0,0,0.5);"
      viewBox="0 0 {rlwidth} {rlheight}"
      in:fly={{y: 500, duration: 1000}}
      out:fly={{y: 300, duration: 300}}
    >
      <rect width="100%" height="100%" fill="transparent" />
    </svg>
  {/if}

  <!-- 天气组件位置 -->
  {#if !isVisible}
    <svg
      width="{rlwidth}px" 
      height="{rlheight}px"
      style="position: absolute; bottom: 1.25%; left: {width - rlwidth * 0.525}px; 
      border-radius: 10px;
      box-shadow: inset 0 0 10px rgba(0,0,0,0.5);"
      viewBox="0 0 {rlwidth} {rlheight}"
      in:fly={{y: 500, duration: 800}}
      out:fly={{y: 300, duration: 300}}
    >
      <rect width="100%" height="100%" fill="transparent" />
      <!-- 天气描述文本 -->
      <image href="weathericon/cloudy_sunny_color.png" x="3%" y="17%" width="50%" height="50%"/>
      <!-- 城市名称 -->
      <text x="50%" y="15%" dominant-baseline="middle" text-anchor="middle" fill="rgba(255, 255, 255, 0.7)" font-size="{height * 0.0035}em">
        {weather.location}
      </text>
      <!-- 温度 -->
      <text x="57%" y="35%" dominant-baseline="middle" text-anchor="left" fill="rgba(255, 255, 255, 0.7)" font-size="{height * 0.008}em">
        {weather.temp}
      </text>
      <!-- 天气描述 -->
      <text x="57%" y="45%" dominant-baseline="middle" text-anchor="left" fill="rgba(255, 255, 255, 0.7)" font-size="{height * 0.003}em">
        {weather.description}
      </text>
      <!-- 体感温度 -->
      <text x="57%" y="53%" dominant-baseline="middle" text-anchor="left" fill="rgba(255, 255, 255, 0.7)" font-size="{height * 0.002}em">
        体感温度: {weather.feels_like}
      </text>
      <!-- 日出日落时间 -->
      <text x="57%" y="58%" dominant-baseline="middle" text-anchor="left" fill="rgba(255, 255, 255, 0.7)" font-size="{height * 0.002}em">
        日出: {weather.sunrise} 日落: {weather.sunset}
      </text>
      <!-- 天气图标温度分割线 -->
      <line x1="50%" y1="25%" x2="50%" y2="60%" stroke="rgba(255, 255, 255, 0.3)" stroke-width="0.5%"/>
    </svg>
  {/if}

  <!-- 闪念胶囊图标按钮 -->
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

  <!-- 桌面设置图标按钮 -->
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

  <!-- 日历初始位置 -->
  <div style="position: absolute; top: {rltop}px; left: {rlleft}px; transition: top 0.5s, left 0.5s; z-index: 1;">
    <div transition:fly="{{ duration: 500 }}" id="icon-container" style="width: {iconsize}px; height: {iconsize}px;">
      <button type="button" on:click={toggleBoth} style="background: none; border: none; padding: 0; cursor: pointer;">
        <img src="icons/calender.png" alt="日历图标" style="width: 100%; height: 100%;" />
      </button>
    </div>
  </div>

  <!-- 天气初始位置 -->
  <div style="position: absolute; top: {tqtop}px; right: {tqright}px; transition: top 0.5s, right 0.5s; z-index: 1;">
    <div transition:fly="{{ duration: 500 }}" id="icon-container" style="width: {iconsize}px; height: {iconsize}px;">
      <button type="button" on:click={toggleBoth} style="background: none; border: none; padding: 0; cursor: pointer;">
        <img src="icons/weather.png" alt="桌面设置图标" style="width: 100%; height: 100%;" />
      </button>
    </div>
  </div>

  <canvas id="rainCanvas"></canvas>
  <div id="rainEffectContainer"></div>

</main>

<style>
  /* 设置字体 */
  @font-face {
    font-family: 'Smartisan Compact';
    src: url('/Smartisan_Compact-Medium.ttf') format('truetype');
    font-weight: medium; /* 根据字体的实际权重来设置 */
    font-style: normal;
  }

  /* 全局样式修改 */
  :global(body) {
    margin: 0; /* 移除默认边距 */
    overflow: hidden; /* 隐藏滚动条 */
    font-family: 'Smartisan Compact', sans-serif; /* 作为回退，这里还包括了一个常见的字体 */
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
    width: 38%;
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
    font-family: 'Smartisan Compact', sans-serif; /* 应用自定义字体 */
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

  .search-input::placeholder {
    color: rgba(0, 0, 0, 0.5); /* 调整 placeholder 文字颜色，使其更淡 */
    font-family: 'Smartisan Compact', sans-serif; /* 确保使用自定义字体 */
    opacity: 1; /* 修复某些浏览器中透明度的问题 */
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
    z-index: 0;
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

  .clock {
    position: absolute;
    transform: translate(-50%, -50%);
    color: rgba(255, 255, 255, 0.7); /* 字体颜色 */
    background-color: rgba(0, 0, 0, 0); /* 背景颜色 */
  }

  .date-info {
    display: flex;
    flex-direction: column; /* 使内容垂直堆叠 */
    position: absolute;
    align-items: center; /* 垂直居中对齐子项 */
    color: rgba(255, 255, 255, 0.7);
  }
  .day, .date {
    display: block; /* 上下排列 */
    white-space: nowrap;
  }
</style>