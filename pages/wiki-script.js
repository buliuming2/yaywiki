document.addEventListener('DOMContentLoaded', () => {
    // ================= 配置区域 =================
    // 请修改这里为你实际的 markdown 文件路径
    // 如果是本地直接打开 html，fetch 可能会报错(CORS)，建议使用 VSCode 的 "Live Server" 插件运行
    const MD_FILE_PATH = './wikimd/cs.md';
    // ===========================================

    const mdContainer = document.getElementById('md-render-target');
    const navList = document.getElementById('sidebar-nav');

    // 1. 获取并渲染 Markdown
    fetch(MD_FILE_PATH)
        .then(response => {
            if (!response.ok) throw new Error("无法加载文件");
            return response.text();
        })
        .then(markdownText => {
            // 使用 marked 库转换 MD 为 HTML
            const htmlContent = marked.parse(markdownText);
            mdContainer.innerHTML = htmlContent;

            // 渲染完成后，生成目录
            generateSidebar();

            // 启动滚动监听
            setupScrollSpy();
        })
        .catch(err => {
            mdContainer.innerHTML = `<p style="color:red">加载失败: ${err.message}<br>提示: 请使用 Live Server 运行以支持 fetch。</p>`;
        });

    // 2. 自动生成侧边栏目录
    function generateSidebar() {
        // 获取内容区所有的 h1, h2, h3
        const headings = mdContainer.querySelectorAll('h1, h2, h3');

        headings.forEach((heading, index) => {
            // 给每个标题添加唯一 ID，方便锚点跳转
            const id = `section-${index}`;
            heading.id = id;

            // 创建列表项
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = `#${id}`;
            a.textContent = heading.textContent;
            a.dataset.target = id; // 存储对应的目标 ID

            // 根据标题层级缩进
            if (heading.tagName === 'H2') a.style.paddingLeft = '24px';
            if (heading.tagName === 'H3') a.style.paddingLeft = '36px';

            li.appendChild(a);
            navList.appendChild(li);
        });

        // 默认选中第一个
        if (navList.firstChild) {
            navList.firstChild.querySelector('a').classList.add('active');
        }
    }

    // 3. 滚动监听 (Scroll Spy)
    function setupScrollSpy() {
        const links = navList.querySelectorAll('a');
        const sections = [];

        // 收集所有 section 的位置信息
        links.forEach(link => {
            const targetId = link.getAttribute('href').substring(1);
            const targetEl = document.getElementById(targetId);
            if (targetEl) sections.push({ el: targetEl, link: link });
        });

        // 监听滚动事件
        window.addEventListener('scroll', () => {
            let current = '';
            const scrollY = window.scrollY;

            // 找到当前视口中最靠上的那个章节
            sections.forEach(section => {
                // offsetTop 是元素距离顶部的距离，减去一点偏移量(如 100)体验更好
                if (scrollY >= section.el.offsetTop - 100) {
                    current = section.link.getAttribute('href');
                }
            });

            // 更新高亮状态
            links.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === current) {
                    link.classList.add('active');

                    // 可选：自动滚动侧边栏以保持当前项可见
                    link.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
            });
        });
    }
});