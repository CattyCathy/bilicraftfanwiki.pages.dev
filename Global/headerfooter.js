const COMPONENTS_CONFIG = {
    header: {
      url: '/global/header.html',
      target: '#header-container'
    },
    footer: {
      url: '/global/footer.html',
      target: '#footer-container'
    }
  };
  
  async function loadComponent(component) {
    try {
      // 1. 获取容器元素
      const container = document.querySelector(component.target);
      console.log('目标容器:', component.target, '找到的元素:', container);
  
      // 2. 严格校验容器存在性
      if (!container) {
        throw new Error(`找不到容器元素：${component.target}`);
      }
  
      // 3. 显示加载状态
      container.innerHTML = '<div class="components-loading">加载中...</div>';
  
      // 4. 加载内容
      const response = await fetch(component.url);
      if (!response.ok) throw new Error(`HTTP ${response.status} 错误`);
      const html = await response.text();
  
      // 5. 注入内容
      container.innerHTML = html;
      console.log(`${component.url} 加载成功`);
  
    } catch (error) {
      console.error('组件加载失败:', error);
      const container = document.querySelector(component.target);
      if (container) {
        container.innerHTML = `
          <div class="component-error">
            加载失败: ${error.message}
            <button onclick="window.location.reload()">点击重试</button>
          </div>
        `;
      }
    }
  }
  
  // 确保在 DOM 加载完成后执行
  document.addEventListener('DOMContentLoaded', () => {
    loadComponent(COMPONENTS_CONFIG.header);
    loadComponent(COMPONENTS_CONFIG.footer);
  });