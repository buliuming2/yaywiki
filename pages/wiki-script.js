document.addEventListener('DOMContentLoaded', () => {
    const mdContainer = document.getElementById('md-render-target');
    const navList = document.getElementById('sidebar-nav');

    // 1. 启动：先获取我们之前手写好的目录树 JSON
    fetch('./pages/sidebar-tree.json')
        .then(response => {
            if (!response.ok) throw new Error("无法加载目录配置文件");
            return response.json();
        })
        .then(treeData => {
            renderSidebarTree(treeData); // 渲染左侧菜单
            
            // 默认加载第一篇文章
            if (treeData.length > 0) {
                loadMarkdown(treeData[0].path);
            }
        })
        .catch(err => {
            mdContainer.innerHTML = `<p style="color:red">初始化失败: ${err.message}</p>`;
        });

    // 2. 渲染左侧导航树
    function renderSidebarTree(data) {
        navList.innerHTML = ''; // 清空旧菜单
        data.forEach(item => {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = '#';
            a.textContent = item.title.replace('.md', ''); // 去掉后缀显示
            a.dataset.path = item.path;

            // 点击事件：加载对应的 MD 文件
            a.addEventListener('click', (e) => {
                e.preventDefault();
                loadMarkdown(item.path);
                
                // 切换高亮状态
                navList.querySelectorAll('a').forEach(link => link.classList.remove('active'));
                a.classList.add('active');
            });

            li.appendChild(a);
            navList.appendChild(li);
        });
    }

    // 3. 核心：加载并渲染 Markdown 内容
    function loadMarkdown(filePath) {
        mdContainer.innerHTML = '<p>加载中...</p>';
        
        fetch(filePath)
            .then(res => {
                if (!res.ok) throw new Error("无法加载文件: " + filePath);
                return res.text();
            })
            .then(mdText => {
                mdContainer.innerHTML = marked.parse(mdText);
                setupScrollSpy(); // 重新绑定右侧滚动高亮
            })
            .catch(err => {
                mdContainer.innerHTML = `<p style="color:red">${err.message}</p>`;
            });
    }

    // 4. 滚动自动高亮（完美复用你之前的优秀逻辑）
    function setupScrollSpy() {
        // 每次加载新文章，都要移除旧的监听器防止内存泄漏
        window.removeEventListener('scroll', window.scrollSpyHandler); 

        const links = navList.querySelectorAll('a');
        const sections = [];

        links.forEach(link => {
            const targetId = link.getAttribute('href').substring(1);
            const targetEl = document.getElementById(targetId);
            if (targetEl) sections.push({ el: targetEl, link: link });
        });

        const handleScroll = () => {
            let current = '';
            const scrollY = window.scrollY;

            sections.forEach(section => {
                if (scrollY >= section.el.offsetTop - 100) {
                    current = section.link.getAttribute('href');
                }
            });

            links.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === current) {
                    link.classList.add('active');
                    link.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
            });
        };

        window.scrollSpyHandler = handleScroll;
        window.addEventListener('scroll', handleScroll);
        
        // 触发一次，确保刚进来时高亮是对的
        handleScroll(); 
    }
});