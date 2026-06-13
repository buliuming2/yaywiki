document.addEventListener('DOMContentLoaded', () => {
    const mdContainer = document.getElementById('md-render-target');
    const navList = document.getElementById('sidebar-nav');

    // 1. 启动：先获取我们之前手写好的目录树 JSON
    fetch('./sidebar-tree.json')
        .then(response => {
            if (!response.ok) throw new Error("无法加载目录配置文件");
            return response.json();
        })
        .then(treeData => {
            renderSidebarTree(treeData, navList); // 渲染左侧菜单（传入数据与父容器）
            
            // 默认加载第一篇文章 (这里假设第一层有文件，或者你可以按需修改)
            if (treeData.length > 0 && treeData[0].path) {
                loadMarkdown(treeData[0].path);
            }
        })
        .catch(err => {
            mdContainer.innerHTML = `<p style="color:red">初始化失败: ${err.message}</p>`;
        });

    // 2. 渲染左侧导航树 (支持无限极嵌套)
    function renderSidebarTree(data, parentElement) {
        data.forEach(item => {
            const li = document.createElement('li');
            
            // 🔹 如果有 children，说明它是父级分类（文件夹）
            if (item.children && item.children.length > 0) {
                const a = document.createElement('a');
                a.href = '#';
                a.textContent = item.title;
                a.classList.add('folder-title'); // 加个类名方便写CSS样式
                
                // 点击父级时，切换子菜单的显示/隐藏
                a.addEventListener('click', (e) => {
                    e.preventDefault();
                    const subMenu = li.querySelector('.sub-menu');
                    if (subMenu) subMenu.classList.toggle('open');
                    a.classList.toggle('expanded');
                });

                li.appendChild(a);
                
                // 创建子菜单容器，并【递归调用自己】，把子节点渲染进去
                const ul = document.createElement('ul');
                ul.className = 'sub-menu';
                renderSidebarTree(item.children, ul); 
                
                li.appendChild(ul);
            } 
            // 🔹 如果没有 children，说明它是具体的 MD 文件
            else {
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
            }
            
            parentElement.appendChild(li);
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