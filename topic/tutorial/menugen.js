class StaticLinkGenerator {
    constructor() {
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
        // 加载路径配置
        const txt = await fetch('article-list.txt').then(r => r.text());
        this.state.paths = txt.split('\n')
          .map(line => line.trim())
          .filter(line => line && !line.startsWith('#'));
        
        // 加载文章内容
        this.state.items = await Promise.all(
          this.state.paths.map(async path => ({
            path,
            url: `${path}/index.html`,
            title: await this.fetchTitle(path),
            summary: await this.fetchSummary(path)
          }))
        );
        
        this.state.filtered = [...this.state.items];
        
        // 初始化事件
        document.getElementById('search').addEventListener('input', e => 
          this.handleSearch(e.target.value));
        
        this.render();
      } catch (error) {
        console.error('初始化失败:', error);
        document.getElementById('list').innerHTML = 
          '<p style="color: red">内容加载失败，请检查配置文件路径</p>';
      }
    }
  
    async fetchTitle(path) {
      try {
        const res = await fetch(`${path}/index.html`);
        const html = await res.text();
        const doc = new DOMParser().parseFromString(html, 'text/html');
        return doc.querySelector('h2.tpct')?.textContent?.trim() || '未命名文章';
      } catch {
        return '标题加载失败';
      }
    }
  
    async fetchSummary(path) {
      try {
        const res = await fetch(`${path}/index.html`);
        const html = await res.text();
        const doc = new DOMParser().parseFromString(html, 'text/html');
        return doc.querySelector('.madv p')?.textContent?.trim() || '暂无摘要';
      } catch {
        return '摘要加载失败';
      }
    }
  
    handleSearch(query) {
      this.state.searchQuery = query.toLowerCase();
      this.state.currentPage = 0;
      this.state.filtered = this.state.items.filter(item =>
        item.title.toLowerCase().includes(this.state.searchQuery) ||
        item.summary.toLowerCase().includes(this.state.searchQuery)
      );
      this.render();
    }
  
    render() {
      const start = this.state.currentPage * this.state.pageSize;
      const items = this.state.filtered.slice(start, start + this.state.pageSize);
      
      // 生成列表HTML（修复XSS漏洞）
      const list = document.getElementById('list');
      list.innerHTML = '';
      
      items.forEach(item => {
        const div = document.createElement('div');
        div.style = "margin: 15px 0; padding: 10px;";
        
        const link = document.createElement('a');
        link.href = item.url;
        link.textContent = item.title || '未命名文章';
        link.style.fontSize = '1.2em';
        
        const summary = document.createElement('p');
        summary.textContent = item.summary;
        summary.style = "color: #666; margin-top: 5px";
        
        // const pathInfo = document.createElement('small');
        // pathInfo.textContent = `路径：${item.path}`;
        // pathInfo.style.color = '#999';
        
        div.appendChild(link);
        div.appendChild(summary);
        // div.appendChild(pathInfo);
        list.appendChild(div);
      });
      
      if (items.length === 0) {
        list.innerHTML = '<p>没有找到相关内容</p>';
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
        btn.style.margin = '0 3px';
        btn.style.borderRadius = '4px';
        btn.style.padding = '5px 10px';
        if (i === this.state.currentPage) {
          btn.style.background = '#009cff';
          btn.style.color = 'white';
        }
        btn.onclick = () => {
          this.state.currentPage = i;
          this.render();
        };
        pagination.appendChild(btn);
      }
    }
  }
  
  // 初始化实例
  new StaticLinkGenerator();