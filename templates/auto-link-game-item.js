document.addEventListener('DOMContentLoaded', function() {
    const existingRules = new Set(); // 规则缓存
  
    function setProfile() {
      function formatPath(text) {
        // 建议至少包含以下处理（按需调整）
        return text;
      }
  
      const styleSheet = document.createElement('style');
      document.head.appendChild(styleSheet);
      const sheet = styleSheet.sheet;
  
      document.querySelectorAll('.gameitem').forEach(link => {
        const rawText = link.textContent.trim();
        const path = formatPath(rawText);
        
        // 调试输出
        console.log('Processing:', rawText, '→', path);
  
        // 设置链接
        link.href = `/gameitem/${path}/index.html`;
        
        // 生成资源路径
        const iconUrl = `/gameitem/${path}/image.png`;
        const selector = `a[href="/gameitem/${path}/index.html"]::before`;
  
        // 插入CSS规则
        if (!existingRules.has(selector)) {
          try {
            sheet.insertRule(`
              ${selector} {
                background-image: url("${iconUrl}");
              }
            `, sheet.cssRules.length);
            existingRules.add(selector);
            console.log('Added rule:', selector);
          } catch(e) {
            console.error('规则插入失败:', e.message);
          }
        }
  
        // 预加载测试
        new Image().src = iconUrl;
      });
    }
  
    setProfile(); // 必须调用
  });