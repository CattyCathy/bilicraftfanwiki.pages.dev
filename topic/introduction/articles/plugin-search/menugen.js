class StaticLinkGenerator {
  constructor() {
    this.configFiles = [
      'article-list.txt',

    ];
    this.state = {
      paths: [],
      items: [],
      filtered: [],
      currentPage: 0,
      pageSize: 10,
      searchQuery: ''
    };
    this.init();
  }

  async init() {
    try {
      // 加载所有配置文件并处理路径
      const configResults = await Promise.all(
        this.configFiles.map(async configPath => {
          try {
            const response = await fetch(configPath);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const content = await response.text();
            
            // 获取配置文件所在目录
            const baseDir = configPath.split('/').slice(0, -1).join('/');
            
            // 处理路径并转换为绝对路径
            const paths = content.split('\n')
              .map(line => line.trim())
              .filter(line => line && !line.startsWith('#'))
              .map(relativePath => 
                baseDir ? `${baseDir}/${relativePath}` : relativePath
              );
            
            return { success: true, paths };
          } catch (error) {
            console.error(`配置文件加载失败: ${configPath}`, error);
            return { success: false, paths: [] };
          }
        })
      );

      // 合并所有有效路径并去重
      this.state.paths = configResults
        .filter(result => result.success)
        .flatMap(result => result.paths)
        .filter((path, index, self) => self.indexOf(path) === index);

      if (this.state.paths.length === 0) {
        throw new Error('没有找到有效文章路径');
      }

      // 顺序加载文章内容
      this.state.items = [];
      for (const path of this.state.paths) {
        try {
          const [title, summary] = await Promise.all([
            this.fetchTitle(path),
            this.fetchSummary(path)
          ]);
          
          this.state.items.push({
            path,
            url: `${path}/index.html`,
            title: title || '未命名文章',
            summary: summary || '暂无摘要'
          });
        } catch (error) {
          console.error(`文章加载失败: ${path}`, error);
          this.state.items.push({
            path,
            url: `${path}/index.html`,
            title: '加载失败',
            summary: '内容获取异常'
          });
        }
      }

      this.state.filtered = [...this.state.items];
      document.getElementById('search').addEventListener('input', e => 
        this.handleSearch(e.target.value));
      this.render();
    } catch (error) {
      console.error('初始化失败:', error);
      document.getElementById('list').innerHTML = 
        `<p style="color: red">${error.message}</p>`;
    }
  }

  async fetchTitle(path) {
    try {
      const res = await fetch(`${path}/index.html`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const html = await res.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');
      return doc.querySelector('h2.tpct')?.textContent?.trim();
    } catch (error) {
      console.error(`标题加载失败: ${path}`, error);
      return null;
    }
  }

  async fetchSummary(path) {
    try {
      const res = await fetch(`${path}/index.html`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const html = await res.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');
      return doc.querySelector('.madv p, article p, p')?.textContent?.trim().slice(0, 120);
    } catch (error) {
      console.error(`摘要加载失败: ${path}`, error);
      return null;
    }
  }

  handleSearch(query) {
    this.state.searchQuery = query.toLowerCase().trim();
    this.state.currentPage = 0;
    this.state.filtered = this.state.items.filter(item => {
      const title = item.title?.toLowerCase() || '';
      const summary = item.summary?.toLowerCase() || '';
      return title.includes(this.state.searchQuery) || 
             summary.includes(this.state.searchQuery);
    });
    this.render();
  }

  render() {
    const start = this.state.currentPage * this.state.pageSize;
    const items = this.state.filtered.slice(start, start + this.state.pageSize);
    const list = document.getElementById('list');
    list.innerHTML = '';

    items.forEach(item => {
      const div = document.createElement('div');
      div.style.cssText = "margin: 15px 0; padding: 10px; border-bottom: 1px solid #eee;";

      const link = document.createElement('a');
      link.href = item.url;
      link.textContent = item.title;
      link.style.cssText = "font-size: 1.2em; color: " + 
        (item.title === '加载失败' ? 'red' : '#0066cc') + ";";

      const summary = document.createElement('p');
      summary.textContent = item.summary;
      summary.style.cssText = "color: " + 
        (item.summary === '内容获取异常' ? 'orange' : '#666') + 
        "; margin-top: 5px; font-size: 0.9em;";

      div.appendChild(link);
      div.appendChild(summary);
      list.appendChild(div);
    });

    if (items.length === 0) {
      list.innerHTML = '<p style="color: #999">没有找到匹配的内容</p>';
    }

    this.renderPagination();
  }

  renderPagination() {
    const pages = Math.ceil(this.state.filtered.length / this.state.pageSize);
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = '';
    
    for (let i = 0; i < pages; i++) {
      const btn = document.createElement('button');
      btn.textContent = i + 1;
      btn.style.cssText = `margin: 0 3px; padding: 5px 10px; border-radius: 4px;
        background: ${i === this.state.currentPage ? '#009cff' : '#f5f5f5'};
        color: ${i === this.state.currentPage ? 'white' : '#333'};
        border: 1px solid ${i === this.state.currentPage ? '#009cff' : '#ddd'};`;
      btn.onclick = () => {
        this.state.currentPage = i;
        this.render();
      };
      pagination.appendChild(btn);
    }
  }
}

// 初始化实例
document.addEventListener('DOMContentLoaded', () => {
  new StaticLinkGenerator();
});