class StaticLinkGenerator {
    constructor() {
        this.state = {
            items: [],       // 直接使用预加载的数据
            filtered: [],
            currentPage: 0,
            pageSize: 10,
            searchQuery: ''
        };
        this.init();
    }

    async init() {
        try {
            // 加载 JSON 数据
            const response = await fetch('ArticleSearchList.json');
            if (!response.ok) throw new Error('HTTP error ' + response.status);
            
            const jsonData = await response.json();
            this.state.items = jsonData.Results.map(item => ({
                path: item.Path,
                url: `${item.Path}/index.html`, // 保持原有URL结构
                title: item.Header,
                summary: item.Content
            }));

            this.state.filtered = [...this.state.items];
            
            // 初始化事件
            document.getElementById('search').addEventListener('input', e => 
                this.handleSearch(e.target.value));
            
            this.render();
        } catch (error) {
            console.error('初始化失败:', error);
            this.showErrorMessage(`数据加载失败: ${error.message}`);
        }
    }

    handleSearch(query) {
        this.state.searchQuery = query.toLowerCase().trim();
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
        
        const list = document.getElementById('list');
        list.innerHTML = '';
        
        if (items.length === 0) {
            list.innerHTML = '<p class="no-result">没有找到相关内容</p>';
            this.renderPagination();
            return;
        }

        items.forEach(item => {
            const div = document.createElement('div');
            div.className = 'result-item';
            div.addEventListener('click', () => {
            window.location.href = item.url;
        });

            const link = document.createElement('a');
            link.href = item.url;
            link.className = 'result-title';
            link.textContent = item.title || '未命名文章';
            
            const summary = document.createElement('p');
            summary.className = 'result-summary';
            summary.textContent = this.truncateText(item.summary, 150);

            div.appendChild(link);
            div.appendChild(summary);
            list.appendChild(div);
        });

        this.renderPagination();
    }

    renderPagination() {
        const pages = Math.ceil(this.state.filtered.length / this.state.pageSize);
        const pagination = document.getElementById('pagination');
        pagination.innerHTML = '';
        const maxVisible = 5; // 可见页码数量
        let start = 0;
        let end = 0;

        // 动态计算页码范围
        if (pages <= maxVisible) {
            start = 0;
            end = pages - 1;
        } else {
            start = Math.max(0, this.state.currentPage - Math.floor(maxVisible / 2));
            end = start + maxVisible - 1;
            if (end > pages - 1) {
                end = pages - 1;
                start = end - maxVisible + 1;
            }
        }

        // Previous按钮
        const prevBtn = this.createPaginationButton('←', () => {
            this.state.currentPage = Math.max(0, this.state.currentPage - 1);
            this.render();
        }, this.state.currentPage === 0);
        pagination.appendChild(prevBtn);

        // 首页码
        if (start > 0) {
            pagination.appendChild(this.createPaginationButton(1, () => {
                this.state.currentPage = 0;
                this.render();
            }));
            if (start > 1) {
                pagination.appendChild(this.createEllipsisButton('left', start));
            }
        }

        // 主页码
        for (let i = start; i <= end; i++) {
            const isActive = i === this.state.currentPage;
            pagination.appendChild(this.createPaginationButton(
                i + 1,
                () => {
                    this.state.currentPage = i;
                    this.render();
                },
                isActive
            ));
        }

        // 尾页码
        if (end < pages - 1) {
            if (end < pages - 2) {
                pagination.appendChild(this.createEllipsisButton('right', end));
            }
            pagination.appendChild(this.createPaginationButton(
                pages,
                () => {
                    this.state.currentPage = pages - 1;
                    this.render();
                }
            ));
        }

        // Next按钮
        const nextBtn = this.createPaginationButton('→', () => {
            this.state.currentPage = Math.min(pages - 1, this.state.currentPage + 1);
            this.render();
        }, this.state.currentPage >= pages - 1);
        pagination.appendChild(nextBtn);
    }

    createEllipsisButton(type, referencePage) {
        const btn = document.createElement('button');
        btn.textContent = '...';
        btn.className = 'ellipsis-btn';
        return btn;
    }

    createPaginationButton(text, onClick, isDisabled = false, isActive = false) {
        const btn = document.createElement('button');
        btn.className = `page-btn ${isActive ? 'active' : ''} ${isDisabled ? 'disabled' : ''}`;
        btn.textContent = text;
        
        // 精确判断激活状态
        const pageNum = parseInt(text) - 1;
        if (!isNaN(pageNum)) {
            btn.classList.toggle('active', pageNum === this.state.currentPage);
        }

        if (!isDisabled) {
            btn.addEventListener('click', onClick);
        }
        return btn;
    }

    truncateText(text, maxLength) {
        return text.length > maxLength ? 
            text.substring(0, maxLength) + '...' : text;
    }

    showErrorMessage(msg) {
        const list = document.getElementById('list');
        list.innerHTML = `<div class="error-message">${msg}</div>`;
    }

    
}

// 初始化实例
new StaticLinkGenerator();