function generateTOC() {
    const tocContainer = document.getElementById('toc');
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    
    const generateID = (text) => {
      return text.toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');
    };
  
    headings.forEach((heading, index) => {
      if (!heading.id) {
        heading.id = generateID(heading.textContent) || `heading-${index}`;
      }
      
      const tocItem = document.createElement('div');
      tocItem.className = `toc-item ${heading.tagName.toLowerCase()}`;
      tocItem.textContent = heading.textContent;
      tocItem.dataset.target = heading.id;

      tocItem.addEventListener('click', () => {
        history.replaceState(null, null, `#${heading.id}`);
        heading.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      });
      
      tocContainer.appendChild(tocItem);
    });
  
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          const id = entry.target.id;
          const tocItem = document.querySelector(`.toc-item[data-target="${id}"]`);
          
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            document.querySelectorAll('.toc-item.active').forEach(item => {
              item.classList.remove('active');
            });
            tocItem?.classList.add('active');
          }
        });
      },
      {
        rootMargin: '0px 0px -50% 0px',
        threshold: [0, 0.5, 1]
      }
    );
  
    headings.forEach(heading => observer.observe(heading));
  }
  
  window.addEventListener('DOMContentLoaded', generateTOC);