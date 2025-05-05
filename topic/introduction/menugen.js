class CloudflareLinkGenerator {
    constructor(config) {
      this.config = {
        basePath: '/articles', // 文章根目录
        listType: 'html',      // Cloudflare返回的目录类型
        pageSize: 10,
        ...config
      };
      this.state = {
        articles: [],
        filtered: [],
        currentPage: 0,
        searchQuery: ''
      };
      this.init();
    }
  
    async init() {
      document.querySelector('#search').addEventListener('input', e => 
        this.handleSearch(e.target.value));
      await this.loadArticles();
      this.render();
    }
  
    // 核心方法：加载文章列表
    async loadArticles() {
      try {
        // 获取目录列表
        const dirs = await this.fetchDirectories();
        
        // 并行加载文章摘要
        this.state.articles = await Promise.all(
          dirs.map(async dir => ({
            ...dir,
            summary: await this.fetchSummary(dir.path)
          }))
        );
        
        this.state.filtered = [...this.state.articles];
      } catch (error) {
        console.error('加载失败:', error);
        this.showError();
      }
    }
  
    // 获取目录列表（Cloudflare特性）
    async fetchDirectories() {
      const url = this.config.basePath + '/';
      const res = await fetch(url);
      
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      
      // 解析Cloudflare生成的目录列表
      const html = await res.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      return Array.from(doc.querySelectorAll('tr'))
        .slice(1) // 跳过表头
        .map(row => {
          const [nameCell, dateCell, sizeCell] = row.querySelectorAll('td');
          return {
            name: nameCell?.textContent?.trim(),
            path: nameCell.querySelector('a')?.href,
            date: dateCell?.textContent?.trim(),
            size: sizeCell?.textContent?.trim()
          };
        })
        .filter(item => 
          item.path && 
          item.path.endsWith('/') && // 只保留目录
          !item.path.includes('..') // 安全过滤
        )
        .map(item => ({
          title: this.formatTitle(item.name),
          url: item.path + 'index.html', // Cloudflare目录路径特性
          path: item.path.replace(/\/$/, '') // 去除结尾斜杠
        }));
    }
  
    // 获取文章摘要
    async fetchSummary(path) {
      try {
        const res = await fetch(path + '/index.html');
        const html = await res.text();
        const doc = new DOMParser().parseFromString(html, 'text/html');
        return doc.querySelector('.madv p')?.textContent?.trim() || '暂无摘要';
      } catch {
        return '摘要加载失败';
      }
    }
  
    // 格式化标题
    formatTitle(name) {
      return name
        .replace(/-/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());
    }
  
    // 搜索处理
    handleSearch(query) {
      this.state.searchQuery = query.toLowerCase();
      this.state.currentPage = 0;
      this.state.filtered = this.state.articles.filter(a =>
        a.title.toLowerCase().includes(this.state.searchQuery) ||
        a.summary.toLowerCase().includes(this.state.searchQuery)
      );
      this.render();
    }
  
    // 渲染逻辑
    render() {
      this.renderItems();
      this.renderPagination();
    }
  
    renderItems() {
      const start = this.state.currentPage * this.config.pageSize;
      const items = this.state.filtered.slice(start, start + this.config.pageSize);
      
      document.querySelector('#container').innerHTML = items.length ? 
        items.map(item => `
          <article class="card">
            <h2><a href="${item.url}">${item.title}</a></h2>
            <p class="summary">${item.summary}</p>
            <div class="meta">
              <span>${new URL(item.url).pathname.split('/')[2]}</span>
            </div>
          </article>
        `).join('') : 
        '<div class="empty">没有找到相关文章</div>';
    }
  
    renderPagination() {
      const pageCount = Math.ceil(this.state.filtered.length / this.config.pageSize);
      const pagination = document.querySelector('#pagination');
      
      pagination.innerHTML = Array.from({length: pageCount}, (_, i) => `
        <button class="${i === this.state.currentPage ? 'active' : ''}" 
                data-page="${i}">${i + 1}</button>
      `).join('');
      
      pagination.onclick = e => {
        if (e.target.tagName === 'BUTTON') {
          this.state.currentPage = +e.target.dataset.page;
          this.render();
        }
      };
    }
  
    showError() {
      document.querySelector('#container').innerHTML = `
        <div class="error">
          <p>内容加载失败，请刷新重试</p>
          <button onclick="location.reload()">重新加载</button>
        </div>
      `;
    }
  }
  
  // 初始化实例
  new CloudflareLinkGenerator({
    basePath: '/articles', // 根据实际路径调整
    pageSize: 5
  });