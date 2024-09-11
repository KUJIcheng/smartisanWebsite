<script>
  import { onMount, afterUpdate } from 'svelte';
  import { fly } from 'svelte/transition';
  import * as d3 from 'd3';

  let height, width, topPosition, iconsize;
  let pageheight, pagewidth;

  let isVisible = true; // 控制图标容器是否可见
  let showSidebar = false; // 闪念胶囊是否出现
  let showSettingbar = false; // 桌面设置是否出现

  // 下雨的组件
  let rain = true; // 控制雨滴效果是否激活
  let rainCanvas, rainCtx;
  let droplets = []; // 存储雨滴对象
  let rainyDay; // 雨滴效果的对象
  let weatherID; // 存储天气代码

  // 时钟组件
  let currentTime = '';
  let currentDate = '';
  let currentDay = '';
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // 天气组件
  let weather = { temp: '', description: '', iconUrl: '' };
  let today = new Date().getDay(); // 获取今天是星期几的索引，0代表星期天
  let forecastDays = []; // 存储接下来的天数标签
  let sunriseTime = '';
  let sunsetTime = '';
  // 生成未来几天的标签
  for (let i = 0; i < 5; i++) {
    let dayIndex = (today + i) % 7; // 计算未来的天数索引
    forecastDays.push(days[dayIndex]); // 添加到数组
  }

  // 日历组件
  let currentFormattedDate = '';
  const daysAbbreviated = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  let currentMonthIndex = new Date().getMonth();
  let currentYear = new Date().getFullYear();
  let daysInMonth = [];
  let animateNext = false;
  let animatePrev = false;

  
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

  // 图标托盘的参数
  let iconpagewidth;
  let pageratio;
  let blocknumber;
  const rows = 3;
  let cols;
  let svgWidth, svgHeight;

  onMount( async() => {
    calculateSizeAndPosition();
    window.addEventListener('resize', calculateSizeAndPosition);
    window.addEventListener('wheel', handleWheel);
    // 时间组件的更新
    updateDateTime();
    // 日历的更新
    updateCurrentFormattedDate();
    updateCalendar();

    navigator.geolocation.getCurrentPosition(async position => {
        const { latitude, longitude } = position.coords;
        await fetchWeatherData(weatherInfo => {
            weather = weatherInfo;
        }, latitude, longitude);

        // weatherID = 500; // 测试下雨功能用图

        if (weatherID <= 700) {  // 如果 weatherID 小于等于 700，表示下雨
            startRain();  // 启动雨滴效果
        }

    }, error => {
        console.error('Error getting location', error);
    });

    await loadScript('pack/rainyday.min.js');

    return () => {
      clearInterval(interval); // 清除时钟定时器
      window.removeEventListener('resize', calculateSizeAndPosition);
      window.removeEventListener('wheel', handleWheel); // 在组件销毁时移除事件监听器
    };
  });

  afterUpdate(() => {
    if (! isVisible) {
      calculateSizeAndPosition();
    }
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

    // 图标托盘的宽度动态计算
    pageratio = pagewidth/pageheight;
    // iconpagewidth = window.innerHeight * 0.475 * 4/3;
    if (pageratio < 3/2) {
      iconpagewidth = 0;
      blocknumber = 9;
    } else if (pageratio >= 9/6 && pageratio < 10/6) {
        iconpagewidth = window.innerHeight * 0.475;
        blocknumber = 9;
    } else if (pageratio >= 10/6 && pageratio < 11/6) {
        iconpagewidth = window.innerHeight * 0.475 * 4/3;
        blocknumber = 12;
    } else if (pageratio >= 11/6 && pageratio < 12/6) {
        iconpagewidth = window.innerHeight * 0.475 * 5/3;
        blocknumber = 15;
    } else if (pageratio >= 12/6 && pageratio < 13/6) {
        iconpagewidth = window.innerHeight * 0.475 * 6/3;
        blocknumber = 18;
    } else if (pageratio >= 13/6 && pageratio < 14/6) {
        iconpagewidth = window.innerHeight * 0.475 * 7/3;
        blocknumber = 21;
    } else if (pageratio >= 24/6) {
        iconpagewidth = window.innerHeight * 0.475 * 8/3;
        blocknumber = 24;
    }

    svgWidth = iconpagewidth;
    svgHeight = rlheight;

    cols = Math.ceil(blocknumber / rows);

    if (! isVisible){
      updateBlocks();
    }
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
    if (showSidebar || showSettingbar) {
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
    if (showSettingbar || showSidebar) {
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
    createDroplets(weatherID);

    // 开始绘制雨滴
    requestAnimationFrame(animateRain);

    if (weatherID >= 200 && weatherID <= 531) {
      dropletEffect(weatherID);
    }
  }

  function dropletEffect(weatherID) {
    // 雨滴效果映射表
    const dropletEffectMapping = {

      // 雷暴
      200: { rainPattern: [[1, 2, 0.1], [1, 2, 0.1]], frequency: 25 },
      201: { rainPattern: [[3, 3, 0.1], [1, 3, 0.1]], frequency: 25 },
      202: { rainPattern: [[5, 1, 0.1], [3, 2, 0.1]], frequency: 25 },
      210: { rainPattern: [[1, 2, 0.1], [1, 2, 0.1]], frequency: 25 },
      211: { rainPattern: [[3, 3, 0.1], [1, 3, 0.1]], frequency: 25 },
      212: { rainPattern: [[5, 1, 0.1], [3, 2, 0.1]], frequency: 25 },
      221: { rainPattern: [[3, 3, 0.1], [1, 3, 0.1]], frequency: 25 },
      230: { rainPattern: [[1, 2, 0.1], [1, 2, 0.1]], frequency: 25 },
      231: { rainPattern: [[1, 2, 0.1], [1, 2, 0.1]], frequency: 25 },
      232: { rainPattern: [[3, 3, 0.1], [1, 3, 0.1]], frequency: 25 },

      // 毛雨
      300: { rainPattern: [[1, 2, 0.1], [1, 2, 0.1]], frequency: 25 },
      301: { rainPattern: [[1, 2, 0.1], [1, 2, 0.1]], frequency: 25 },
      302: { rainPattern: [[1, 2, 0.1], [1, 2, 0.1]], frequency: 25 },
      310: { rainPattern: [[1, 2, 0.1], [1, 2, 0.1]], frequency: 25 },
      311: { rainPattern: [[1, 2, 0.1], [1, 2, 0.1]], frequency: 25 },
      312: { rainPattern: [[3, 3, 0.1], [1, 3, 0.1]], frequency: 25 },
      313: { rainPattern: [[1, 2, 0.1], [1, 2, 0.1]], frequency: 25 },
      314: { rainPattern: [[1, 2, 0.1], [1, 2, 0.1]], frequency: 25 },
      321: { rainPattern: [[1, 2, 0.1], [1, 2, 0.1]], frequency: 25 },

      // 雨
      500: { rainPattern: [[1, 2, 0.1], [1, 2, 0.1]], frequency: 25 },
      501: { rainPattern: [[3, 3, 0.1], [1, 3, 0.1]], frequency: 25 },
      502: { rainPattern: [[5, 1, 0.1], [3, 2, 0.1]], frequency: 25 },
      503: { rainPattern: [[5, 1, 0.1], [3, 2, 0.1]], frequency: 25 },
      504: { rainPattern: [[5, 1, 0.1], [3, 2, 0.1]], frequency: 25 },
      511: { rainPattern: [[3, 3, 0.1], [1, 3, 0.1]], frequency: 25 },
      520: { rainPattern: [[3, 3, 0.1], [1, 3, 0.1]], frequency: 25 },
      521: { rainPattern: [[1, 2, 0.1], [1, 2, 0.1]], frequency: 25 },
      522: { rainPattern: [[5, 1, 0.1], [3, 2, 0.1]], frequency: 25 },
      531: { rainPattern: [[3, 3, 0.1], [1, 3, 0.1]], frequency: 25 }
    };

    const dropletParams = dropletEffectMapping[weatherID] || {rainPattern: [[3, 3, 0.1], [1, 3, 0.1]], frequency: 25 };

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
    rainyDay.rain(dropletParams.rainPattern, dropletParams.frequency);
    // 小雨/毛毛雨：[[1, 2, 0.1], [1, 2, 0.1]], 25
    // 中雨：[[3, 3, 0.1], [1, 3, 0.1]], 25
    // 大雨：[[5, 1, 0.1], [3, 2, 0.1]], 25
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

  function createDroplets(weatherID) {
    // 下雨效果映射表
    const rainEffectMapping = {

      // 雷暴
      200: { dropletNumber: 20000, dropletSize: 1, dropletSpeed: 7 },
      201: { dropletNumber: 10000, dropletSize: 1, dropletSpeed: 7 },
      202: { dropletNumber: 7000, dropletSize: 1.2, dropletSpeed: 7 },
      210: { dropletNumber: 20000, dropletSize: 1, dropletSpeed: 7 },
      211: { dropletNumber: 10000, dropletSize: 1, dropletSpeed: 7 },
      212: { dropletNumber: 7000, dropletSize: 1.2, dropletSpeed: 7 },
      221: { dropletNumber: 20000, dropletSize: 1, dropletSpeed: 7 },
      230: { dropletNumber: 20000, dropletSize: 0.5, dropletSpeed: 5 },
      231: { dropletNumber: 15000, dropletSize: 0.5, dropletSpeed: 5 },
      232: { dropletNumber: 10000, dropletSize: 0.5, dropletSpeed: 5 },

      // 毛雨
      300: { dropletNumber: 20000, dropletSize: 0.5, dropletSpeed: 5 },
      301: { dropletNumber: 15000, dropletSize: 0.5, dropletSpeed: 5 },
      302: { dropletNumber: 10000, dropletSize: 0.5, dropletSpeed: 5 },
      310: { dropletNumber: 20000, dropletSize: 0.5, dropletSpeed: 5 },
      311: { dropletNumber: 15000, dropletSize: 0.5, dropletSpeed: 5 },
      312: { dropletNumber: 10000, dropletSize: 0.5, dropletSpeed: 5 },
      313: { dropletNumber: 20000, dropletSize: 0.5, dropletSpeed: 5 },
      314: { dropletNumber: 10000, dropletSize: 0.5, dropletSpeed: 5 },
      321: { dropletNumber: 15000, dropletSize: 0.5, dropletSpeed: 5 },

      // 雨
      500: { dropletNumber: 20000, dropletSize: 1, dropletSpeed: 7 },
      501: { dropletNumber: 10000, dropletSize: 1, dropletSpeed: 7 },
      502: { dropletNumber: 7000, dropletSize: 1.2, dropletSpeed: 7 },
      503: { dropletNumber: 6500, dropletSize: 1.2, dropletSpeed: 7 },
      504: { dropletNumber: 5500, dropletSize: 1.5, dropletSpeed: 7.2 },
      511: { dropletNumber: 10000, dropletSize: 1, dropletSpeed: 7 },
      520: { dropletNumber: 20000, dropletSize: 1, dropletSpeed: 7 },
      521: { dropletNumber: 10000, dropletSize: 1, dropletSpeed: 7 },
      522: { dropletNumber: 7000, dropletSize: 1.2, dropletSpeed: 7 },
      531: { dropletNumber: 20000, dropletSize: 1, dropletSpeed: 7 },

      // 雪
      600: { dropletNumber: 40000, dropletSize: 3, dropletSpeed: 0.3 },
      601: { dropletNumber: 30000, dropletSize: 3, dropletSpeed: 0.4 },
      602: { dropletNumber: 20000, dropletSize: 3, dropletSpeed: 0.5 },
      611: { dropletNumber: 30000, dropletSize: 3, dropletSpeed: 0.4 },
      612: { dropletNumber: 50000, dropletSize: 3, dropletSpeed: 0.2 },
      613: { dropletNumber: 30000, dropletSize: 3, dropletSpeed: 0.4 },
      615: { dropletNumber: 40000, dropletSize: 3, dropletSpeed: 0.3 },
      616: { dropletNumber: 30000, dropletSize: 3, dropletSpeed: 0.4 },
      620: { dropletNumber: 40000, dropletSize: 3, dropletSpeed: 0.3 },
      621: { dropletNumber: 30000, dropletSize: 3, dropletSpeed: 0.4 },
      622: { dropletNumber: 20000, dropletSize: 3, dropletSpeed: 0.5 }
    };

    // 获取映射表中的对应参数
    const rainParams = rainEffectMapping[weatherID] || { dropletNumber: 10000, dropletSize: 1, dropletSpeed: 7 };

    const dropletNumber = rainParams.dropletNumber; // 雨滴数量的控制因子
    const dropletSize = rainParams.dropletSize; // 雨滴大小
    const dropletSpeed = rainParams.dropletSpeed; // 雨滴下落速度

    // 基于屏幕大小生成一定数量的雨滴
    const numberOfDroplets = rainCanvas.width * rainCanvas.height / dropletNumber; // 雨滴数量
    for (let i = 0; i < numberOfDroplets; i++) {
      droplets.push({
        x: Math.random() * rainCanvas.width,
        y: Math.random() * rainCanvas.height,
        size: Math.random() * 2 + dropletSize, // 雨滴大小
        speed: Math.random() * 2 + dropletSpeed // 雨滴下落速度
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
        rainCtx.ellipse(droplet.x, droplet.y, droplet.size * 0.5, droplet.size, 0, 0, Math.PI * 2);
        if (weatherID >= 600) {
            rainCtx.fillStyle = 'rgba(200,200,200,0.75)'; // 雪花颜色
        } else {
            rainCtx.fillStyle = 'rgba(130,130,130,0.5)'; // 雨滴颜色
        }
        rainCtx.fill();
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

    // const url = `https://api.openweathermap.org/data/3.0/onecall?lat=22.333564&lon=114.269492&exclude=minutely,hourly&appid=${weatherKey}&units=metric`; //香港
    // const url = `https://api.openweathermap.org/data/3.0/onecall?lat=32.715736&lon=-117.161087&exclude=minutely,hourly&appid=${weatherKey}&units=metric`; //SD
    // const url = `https://api.openweathermap.org/data/3.0/onecall?lat=32.333564&lon=118.269492&exclude=minutely,hourly&appid=${weatherKey}&units=metric`; //南京

    try {
      const cityName = await fetchCityName(lat, lon); // 获取城市名称
      const response = await fetch(url);
      const data = await response.json();

      weatherID = data.current.weather[0].id // 获取天气ID

      const currentTime = Date.now() / 1000;
      const isDaytime = currentTime >= data.current.sunrise && currentTime <= data.current.sunset;

      sunriseTime = new Date(data.current.sunrise * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      sunsetTime = new Date(data.current.sunset * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const dailyForecast = data.daily.slice(1, 6).map(day => ({
        minTemp: Math.round(day.temp.min),
        maxTemp: Math.round(day.temp.max),
        icon: `weathericon/${chooseIconFileName(day.weather[0].id, isDaytime)}`
      }));

      setWeather({
        location: cityName, // 使用从 Google API 获取的城市名称
        temp: `${Math.round(data.current.temp)}°C`,
        feels_like: `${Math.round(data.current.feels_like)}°C`,
        sunrise: sunriseTime,
        sunset: sunsetTime,
        description: data.current.weather[0].description,
        iconUrl: `weathericon/${chooseIconFileName(data.current.weather[0].id, isDaytime)}`,
        dailyForecast
      });
    } catch (error) {
      console.error('Failed to fetch weather data:', error);
      setWeather({ location: '位置获取失败', temp: 'N/A', description: '无数据', iconUrl: '' });
    }
  }

  function chooseIconFileName(weatherId, isDaytime) {
    const iconMapping = {
        // Thunderstorm
        200: isDaytime ? "thunder_sunny_color.png" : "thunder_night_color.png",
        201: isDaytime ? "thunder_sunny_color.png" : "thunder_night_color.png",
        202: "thunder_color.png",
        210: "thunder_color.png",
        211: "thunder_color.png",
        212: "thunder_color.png",
        221: "thunder_color.png",
        230: isDaytime ? "thunder_sunny_color.png" : "thunder_night_color.png",
        231: isDaytime ? "thunder_sunny_color.png" : "thunder_night_color.png",
        232: isDaytime ? "thunder_sunny_color.png" : "thunder_night_color.png",

        // Drizzle
        300: isDaytime ? "rain_sunny_color.png" : "rain_light_night_color.png",
        301: isDaytime ? "rain_sunny_color.png" : "rain_light_night_color.png",
        302: isDaytime ? "rain_sunny_color.png" : "rain_light_night_color.png",
        310: isDaytime ? "rain_sunny_color.png" : "rain_light_night_color.png",
        311: isDaytime ? "rain_sunny_color.png" : "rain_light_night_color.png",
        312: isDaytime ? "rain_sunny_color.png" : "rain_light_night_color.png",
        313: isDaytime ? "rain_sunny_color.png" : "rain_light_night_color.png",
        314: isDaytime ? "rain_sunny_color.png" : "rain_light_night_color.png",
        321: isDaytime ? "rain_sunny_color.png" : "rain_light_night_color.png",

        // Rain
        500: "rain_light_color.png",
        501: "rain_light_color.png",
        502: "rain_heavy_color.png",
        503: "rain_heavy_color.png",
        504: "rain_heavy_color.png",
        511: "rain_heavy_color.png",
        520: "rain_sunny_color.png",
        521: "rain_sunny_color.png",
        522: "rain_sunny_color.png",
        531: "rain_sunny_color.png",

        // Snow
        600: "snowy_light_color.png",
        601: "snowy_heavy_color.png",
        602: "snowy_heavy_color.png",
        611: "snowy_light_color.png",
        612: "snowy_light_color.png",
        613: "snowy_light_color.png",
        615: "snowy_light_color.png",
        616: "snowy_heavy_color.png",
        620: "snowy_light_color.png",
        621: "snowy_heavy_color.png",
        622: "snowy_heavy_color.png",

        // Atmosphere
        701: isDaytime ? "sunny_foggy_color.png" : "foggy_night_color.png",
        711: isDaytime ? "sunny_foggy_color.png" : "foggy_night_color.png",
        721: "cloudy_foggy_color.png",
        731: "cloudy_foggy_color.png",
        741: "cloudy_foggy_color.png",
        751: "cloudy_foggy_color.png",
        761: isDaytime ? "sunny_foggy_color.png" : "foggy_night_color.png",
        762: "cloudy_windy_color.png",
        771: "windy_color.png",
        781: "windy_color.png",

        // Clear
        800: isDaytime ? "sunny_color.png" : "night_color.png",

        // Clouds
        801: isDaytime ? "cloudy_sunny_color.png" : "cloudy_night_color.png",
        802: isDaytime ? "cloudy_sunny_color.png" : "cloudy_night_color.png",
        803: isDaytime ? "cloudy_foggy_sunny_color.png" : "cloudy_foggy_night__color.png",
        804: "cloudy_foggy_color.png"
    };

    return iconMapping[weatherId] || "default_icon.png"; // default_icon.png 是当没有合适的图标时的后备选项
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

  // 日历的function
  function updateCurrentFormattedDate() {
    currentFormattedDate = `${currentYear}年${currentMonthIndex + 1}月`;
  }

  function getMonthData(year, month) {
    let startDay = new Date(year, month, 1).getDay();
    let numDays = new Date(year, month + 1, 0).getDate();

    // 计算上个月的天数
    let prevMonthDays = month === 0 ? new Date(year - 1, 12, 0).getDate() : new Date(year, month, 0).getDate();
    // 下个月的开始天数简单计算为1，因为我们从1号开始显示
    let nextMonthStart = 1;  // 这里改为let
    // 计算需要显示的上个月的天数
    let displayPrevMonthDays = startDay;

    return { startDay, numDays, prevMonthDays, nextMonthStart, displayPrevMonthDays };
  }
  
  function nextMonth() {
    animateNext = true; // 先触发动画
    if (currentMonthIndex === 11) {
        currentMonthIndex = 0;
        currentYear++;
    } else {
        currentMonthIndex++;
    }
    setTimeout(() => {
        updateCalendar(); // 在动画完成后更新日历数据
        animateNext = false; // 重置动画状态
    }, 480); // 与CSS动画的时长相匹配
  }

  function previousMonth() {
    animatePrev = true; // 先触发动画
    if (currentMonthIndex === 0) {
        currentMonthIndex = 11;
        currentYear--;
    } else {
        currentMonthIndex--;
    }
    setTimeout(() => {
        updateCalendar(); // 在动画完成后更新日历数据
        animatePrev = false; // 重置动画状态
    }, 480); // 与CSS动画的时长相匹配
  }

  function updateCalendar() {
    const { startDay, numDays, prevMonthDays, nextMonthStart: initialNextMonthStart, displayPrevMonthDays } = getMonthData(currentYear, currentMonthIndex);
    const today = new Date();
    const todayDate = today.getDate();
    const isCurrentMonth = today.getMonth() === currentMonthIndex && today.getFullYear() === currentYear;

    // 计算所需的单元格总数
    const totalCells = startDay + numDays; // 当月和上月剩余所需的总格数
    daysInMonth = Array(totalCells > 35 ? 42 : 35).fill(null); // 如果超过35格则需要42格，否则只需35格

    // 填充上月日期
    for (let i = 0; i < displayPrevMonthDays; i++) {
        daysInMonth[i] = { day: prevMonthDays - displayPrevMonthDays + i + 1, currentMonth: false, isToday: false };
    }

    // 填充当月日期
    for (let i = 0; i < numDays; i++) {
        daysInMonth[startDay + i] = { 
            day: i + 1, 
            currentMonth: true, 
            isToday: isCurrentMonth && (i + 1) === todayDate // 标记今天的日期
        };
    }

    // 如果需要，填充下月日期
    let nextMonthStart = initialNextMonthStart;
    let nextDaysFillStart = startDay + numDays;
    for (let i = nextDaysFillStart; i < daysInMonth.length; i++) {
        daysInMonth[i] = { day: nextMonthStart++, currentMonth: false, isToday: false };
    }

    updateCurrentFormattedDate(); // 更新顶部显示的当前年月
  }

  // 图标链接托盘代码
  function updateBlocks() {
    const gridWidth = svgWidth / cols;
    const gridHeight = svgHeight / rows;

    const blocksData = Array.from({ length: blocknumber }, (_, i) => ({
      x: (i % cols) * gridWidth,
      y: Math.floor(i / cols) * gridHeight,
      width: gridWidth - 1,
      height: gridHeight - 1,
      color: 'rgba(200, 200, 200, 0.25)'
    }));

    const svg = d3.select('#icon-tray-svg')
      .attr('width', svgWidth)
      .attr('height', svgHeight);

    svg.selectAll('rect').remove(); // 清空之前的内容

    const blocks = svg.selectAll('rect').data(blocksData).enter().append('rect');

    blocks.attr('x', d => d.x)
      .attr('y', d => d.y)
      .attr('width', d => d.width)
      .attr('height', d => d.height)
      .attr('fill', d => d.color)
      .attr('cursor', 'pointer');

    const drag = d3.drag()
      .on('start', function(event, d) {
        d3.select(this).raise().style('fill', 'rgba(180, 180, 180, 0.2)');
      })
      .on('drag', function(event, d) {
        const newX = Math.max(0, Math.min(svgWidth - d.width, event.x));
        const newY = Math.max(0, Math.min(svgHeight - d.height, event.y));
        d.x = newX;
        d.y = newY;
        d3.select(this).attr('x', d.x).attr('y', d.y);
        adjustBlocks(d, this);
      })
      .on('end', function(event, d) {
        d.x = Math.round(d.x / gridWidth) * gridWidth;
        d.y = Math.round(d.y / gridHeight) * gridHeight;
        const finalPos = checkForOverlap(d);
        d.x = finalPos.x;
        d.y = finalPos.y;
        d3.select(this).transition().duration(300)
          .attr('x', d.x)
          .attr('y', d.y)
          .style('fill', d.color);
      });

    blocks.call(drag);

    function adjustBlocks(activeBlock, activeElement) {
      blocks.each(function(otherData) {
        if (otherData !== activeBlock) {
          const otherElement = d3.select(this);
          if (Math.abs(otherData.x - activeBlock.x) < (2/3) * gridWidth && Math.abs(otherData.y - activeBlock.y) < (2/3) * gridHeight) {
            const freePos = findFreeSpot(activeBlock);
            otherData.x = freePos.x;
            otherData.y = freePos.y;
            otherElement.transition().duration(300)
              .attr('x', otherData.x)
              .attr('y', otherData.y);
          }
        }
      });
    }

    function findFreeSpot(excludedBlock) {
      const occupied = new Set(blocksData.filter(d => d !== excludedBlock).map(d => `${d.x},${d.y}`));
      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
          const testX = j * gridWidth;
          const testY = i * gridHeight;
          if (!occupied.has(`${testX},${testY}`)) {
            return { x: testX, y: testY };
          }
        }
      }
      return { x: excludedBlock.x, y: excludedBlock.y };
    }

    function checkForOverlap(draggedBlock) {
      const occupied = new Set(blocksData.filter(d => d !== draggedBlock).map(d => `${d.x},${d.y}`));
      let newX = draggedBlock.x;
      let newY = draggedBlock.y;
      while (occupied.has(`${newX},${newY}`)) {
        const freePos = findFreeSpot(draggedBlock);
        newX = freePos.x;
        newY = freePos.y;
      }
      return { x: newX, y: newY };
    }
  }

  // 搜索组件的内容更新
  let searchInput = '';

  function handleSearchSubmit(event) {
    // 防止表单默认提交行为
    event.preventDefault();
    
    // 提交表单
    event.target.submit();
    
    // 清空搜索框内容
    searchInput = '';
  }
</script>

<main>

  <!-- 设置图片为全屏背景 -->
  <img id="myImage" src="backgrounds/background2.jpg" alt="Background" class="fullscreen-image">

  <!-- 搜索功能组件 -->
  <div class="search-container" style="top: {searchContainerTop}; left: {searchContainerLeft}; z-index: 1;">
    <form action="https://www.google.com/search" method="get" target="_blank" on:submit={handleSearchSubmit}>
        <input type="text" name="q" class="search-input" bind:value={searchInput} placeholder="Search..."
              autocomplete="off"
              style="height: {searchbarheight}px; 
                      font-size: {searchbarheight * 0.75}px; 
                      border-radius: {pageheight * 0.04}px; 
                      padding: {searchbarheight * 0.5}px {searchbarheight * 0}px;
                      text-indent: {searchbarheight * 1}px;">
    </form>
  </div>

  <!-- 底部承托组件平台 -->
  <svg {width} {height} style="position: absolute; top: {topPosition}px; left: 50%; transform: translateX(-50%); transition: height 0.3s, top 0.3s;">
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

  <!-- 网页链接组件位置 -->
  {#if !isVisible}
    <svg
      id="icon-tray-svg"
      width="{iconpagewidth}px"
      height="{rlheight}px"
      style="position: absolute; bottom: 1.25%; left: 50%; 
      border-radius: {pageheight * 0.01}px;
      box-shadow: inset 0 0 10px rgba(0,0,0,0.5);"
      in:fly={{y: 500, duration: 1000}}
      out:fly={{y: 300, duration: 300}}
    >
      <rect width="100%" height="100%" fill="transparent" />
    </svg>
  {/if}

  <!-- 日历组件位置 -->
  {#if !isVisible}
    <svg
      width="{rlwidth}px" 
      height="{rlheight}px"
      style="position: absolute; bottom: 1.25%; left: {rlwidth * 0.525}px;
      border-radius: {pageheight * 0.01}px;
      box-shadow: inset 0 0 10px rgba(0,0,0,0.5);"
      in:fly={{y: 500, duration: 800}}
      out:fly={{y: 300, duration: 300}}
    >
      <rect width="100%" height="100%" fill="transparent" />
      <!-- 当前年月显示 -->
      <text x="50%" y="15%" dominant-baseline="middle" text-anchor="middle" fill="rgba(255, 255, 255, 0.7)" font-size="{height * 0.0035}em">
        {currentFormattedDate}
      </text>
      <!-- 左侧按钮：上一个月 -->
      <foreignObject x="10%" y="11%" width="7%" height="7%">
        <button on:click={previousMonth} class="calendar-button">
          <img src="smallicon/back.png" alt="Previous Month" style="width: 100%; height: auto;"/>
        </button>
      </foreignObject>
      <!-- 右侧按钮：下一个月 -->
      <foreignObject x="83%" y="11%" width="7%" height="7%">
        <button on:click={nextMonth} class="calendar-button">
          <img src="smallicon/forward.png" alt="Next Month" style="width: 100%; height: auto;"/>
        </button>
      </foreignObject>
      {#each daysAbbreviated as day, index}
        <text 
          x="{6.25 + index * 12.5 + 6.25}%" 
          y="21.5%" 
          dominant-baseline="middle" 
          text-anchor="middle" 
          fill="rgba(255, 255, 255, 0.5)" 
          font-size="{height * 0.0016}em">
          {day}
        </text>
      {/each}
      <!-- 绘制日历网格 -->
      {#each Array(Math.ceil(daysInMonth.length / 7)) as _, row (row)}
        {#each Array(7) as _, col (col)}
          <g
            class:flip-animation={(animateNext || animatePrev)}
            class:flip-to-next={animateNext}
            class:flip-to-prev={animatePrev}
            class:fade-in={animateNext === false && animatePrev === false}
            style="transform-origin: {6.25 + col * 12.5 + 6.25}% {23 + row * 12.5 + 6.25}%;"
          >
            <rect
              x="{6.25 + col * 12.5}%"
              y="{23 + row * 12.5}%"
              width="12.5%"
              height="12.5%"
              fill={
                daysInMonth[row * 7 + col]?.isToday ? 'rgba(225, 225, 255, 0.6)' :
                daysInMonth[row * 7 + col]?.currentMonth ? 'rgba(225, 225, 255, 0.05)' : 'rgba(150, 150, 150, 0.5)'
              }
              stroke="rgba(255, 255, 255, 0.3)"
              stroke-width="0.1%"
            />
            {#if daysInMonth[row * 7 + col]}
              <!-- Current month side -->
              <text
                class="front"
                x="{6.25 + col * 12.5 + 6.25}%"
                y="{23 + row * 12.5 + 6.25}%"
                dominant-baseline="middle"
                text-anchor="middle"
                fill="rgba(255, 255, 255, 0.7)"
                font-size="{height * 0.002}em">
                {daysInMonth[row * 7 + col].day}
              </text>
            {/if}
          </g>
        {/each}
      {/each}
    </svg>
  {/if}

  <!-- 天气组件位置 -->
  {#if !isVisible}
    <svg
      width="{rlwidth}px" 
      height="{rlheight}px"
      style="position: absolute; bottom: 1.25%; left: {width - rlwidth * 0.525}px; 
      border-radius: {pageheight * 0.01}px;
      box-shadow: inset 0 0 10px rgba(0,0,0,0.5);"
      in:fly={{y: 500, duration: 800}}
      out:fly={{y: 300, duration: 300}}
    >
      <rect width="100%" height="100%" fill="transparent" />
      <!-- 天气描述文本 -->
      <image href="{weather.iconUrl}" x="2%" y="17%" width="50%" height="50%"/>
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
      <!-- 接下来五天的天气预报 -->
      {#each forecastDays as day, index}
        <text 
          x="{10 + index * 20}%"
          y="69%" 
          dominant-baseline="middle" 
          text-anchor="middle" 
          fill="rgba(255, 255, 255, 0.7)" 
          font-size="{height * 0.002}em">
          {day === days[today] ? 'Today' : day}
        </text>
      {/each}
      {#each weather.dailyForecast as forecast, index}
        <image href="{forecast.icon}" x="{2.5 + index * 20}%" y="73%" width="15%" height="15%" />
        <text x="{10 + index * 20}%" y="92%" dominant-baseline="middle" text-anchor="middle" fill="rgba(255, 255, 255, 0.7)" font-size="{height * 0.002}em">
          {forecast.minTemp} / {forecast.maxTemp}
        </text>
      {/each}
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
    font-family: 'Smartisan Compact', sans-serif;
  }
  
  /* 背景图像样式*/
  .fullscreen-image {
    top: 0; /* 顶部对齐 */
    left: 0; /* 左侧对齐 */
    width: 100vw;
    height: 100vh;
    object-fit: cover;  /* 覆盖整个内容区域 */
    z-index: 0;  /* 图像在内容之下 */
  }

  svg {
    position: absolute;
    left: 50%;
    transform: translate(-50%, 0%);
    overflow: hidden; /* 滤镜效果*/
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
    color: rgba(0, 0, 0, 0.5);
    font-family: 'Smartisan Compact', sans-serif; /* 使用字体 */
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
    z-index: 1;
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

  .calendar-button {
    all: unset;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: transparent;
    transition: background-color 0.3s, transform 0.2s, opacity 0.3s;  /* 添加透明度变化的过渡效果 */
  }

  .calendar-button img {
      opacity: 0.6; /* 初始图标透明度 */
      transition: opacity 0.3s; /* 添加透明度变化的过渡效果 */
  }

  .calendar-button:hover img {
      opacity: 0.9; /* 鼠标悬停时图标透明度 */
  }

  .calendar-button:active {
      transform: scale(0.6); /* 点击时缩小图标 */
  }

  .flip-animation {
    transition: transform 0.3s, opacity 0.5s;
    transform-style: preserve-3d;
  }

  .flip-to-next {
    transform: scale(0.75);
    opacity: 0.05;
  }

  .flip-to-prev {
    transform: scale(0.75);
    opacity: 0.05;
  }

  .fade-in {
    opacity: 1;
    animation: fadeIn 0.3s ease-in;
  }

  @keyframes fadeIn {
    from { opacity: 0.05;}
    to { opacity: 1; }
  }
</style>