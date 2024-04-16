<script>
    import { onMount } from 'svelte';

    let rain = true;
  
    onMount(() => {
      if (rain) {
      var rainyDay = new RainyDay({
        image: 'myImage',  // 图像的ID
        blur: 0, // 失效了
        enableSizeChange: true,
        crop: {
          x: 16,
          y: 10,
          w: 200,
          h: 100
        },
        gravityThreshold: 3,
        // 可以添加其他选项，如parentElement, blur等
        fps: 24
      });
  
      rainyDay.rain([ [3, 1, 0.1] ]);
    } else {
      // 如果rain为false，停止雨滴效果
      if (rainyDay) {
        rainyDay.destroy(); // 假设RainyDay.js有一个销毁实例的方法
      }
    }
    });
  </script>
  
  <main>
    <!-- 引入RainyDay.js库 -->
    <script src="/rainyday.min.js"></script>
    
    <!-- 设置图片为全屏背景 -->
    <img id="myImage" src="/backgrounds/background9.jpg" alt="Background" class="fullscreen-image">
    <div class="glass-effect"></div>
    
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
      z-index: -1;  /* 确保图像在内容之下 */
    }

    .glass-effect {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 60%;  /* 或者根据需要设置长宽 */
      height: 40%;
      background: rgba(255, 255, 255, 0.2); /* 半透明背景 */
      border-radius: 15px; /* 圆角 */
      backdrop-filter: blur(10px); /* 毛玻璃效果 */
      z-index: 2; /* 确保它位于rainyDay canvas之上 */
    }
  </style>
  