/**
 * 新闻模块 - 完整的新闻管理系统
 * 包含新闻详情页、API集成、搜索过滤、社交功能等
 */

window.NewsModule = (function() {
    'use strict';
    
    // 模块状态
    let isInitialized = false;
    let currentNews = null;
    let newsCache = new Map();
    
    // 配置
    const config = {
        apiEndpoint: '/api/news',
        pageSize: 10,
        maxCacheSize: 100,
        animationDuration: 300
    };
    
    // DOM 元素引用
    let elements = {};
    
    // 样式注入
    function injectStyles() {
        if (document.getElementById('news-module-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'news-module-styles';
        style.textContent = `
            .news-container {
                max-width: 1200px;
                margin: 0 auto;
                padding: 20px;
                background: #f8f9fa;
                min-height: 100vh;
            }
            
            .news-header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 40px 20px;
                text-align: center;
                border-radius: 12px;
                margin-bottom: 30px;
                box-shadow: 0 8px 32px rgba(0,0,0,0.1);
            }
            
            .news-search {
                background: white;
                padding: 20px;
                border-radius: 8px;
                margin-bottom: 20px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
            
            .search-input {
                width: 100%;
                padding: 12px 20px;
                border: 2px solid #e0e0e0;
                border-radius: 25px;
                font-size: 16px;
                transition: all 0.3s ease;
            }
            
            .search-input:focus {
                outline: none;
                border-color: #667eea;
                box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
            }
            
            .news-filters {
                display: flex;
                gap: 10px;
                margin-top: 15px;
                flex-wrap: wrap;
            }
            
            .filter-btn {
                padding: 8px 16px;
                border: 2px solid #e0e0e0;
                background: white;
                border-radius: 20px;
                cursor: pointer;
                transition: all 0.3s ease;
                font-size: 14px;
            }
            
            .filter-btn.active {
                background: #667eea;
                color: white;
                border-color: #667eea;
            }
            
            .news-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
                gap: 24px;
                margin-bottom: 40px;
            }
            
            .news-card {
                background: white;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 4px 16px rgba(0,0,0,0.1);
                transition: all 0.3s ease;
                cursor: pointer;
                transform: translateY(0);
            }
            
            .news-card:hover {
                transform: translateY(-8px);
                box-shadow: 0 12px 32px rgba(0,0,0,0.15);
            }
            
            .news-card-image {
                width: 100%;
                height: 200px;
                object-fit: cover;
                background: linear-gradient(45deg, #f0f0f0, #e0e0e0);
            }
            
            .news-card-content {
                padding: 20px;
            }
            
            .news-card-title {
                font-size: 18px;
                font-weight: 600;
                margin-bottom: 10px;
                color: #333;
                line-height: 1.4;
            }
            
            .news-card-excerpt {
                color: #666;
                font-size: 14px;
                line-height: 1.6;
                margin-bottom: 15px;
            }
            
            .news-card-meta {
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-size: 12px;
                color: #999;
            }
            
            .news-card-date {
                display: flex;
                align-items: center;
                gap: 5px;
            }
            
            .news-card-actions {
                display: flex;
                gap: 10px;
            }
            
            .action-btn {
                background: none;
                border: none;
                color: #999;
                cursor: pointer;
                padding: 5px;
                border-radius: 4px;
                transition: color 0.3s ease;
            }
            
            .action-btn:hover {
                color: #667eea;
            }
            
            .action-btn.liked {
                color: #e74c3c;
            }
            
            .news-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.8);
                display: none;
                align-items: center;
                justify-content: center;
                z-index: 1000;
                padding: 20px;
                box-sizing: border-box;
            }
            
            .news-modal.active {
                display: flex;
            }
            
            .news-modal-content {
                background: white;
                border-radius: 12px;
                max-width: 800px;
                max-height: 90vh;
                overflow-y: auto;
                position: relative;
                animation: modalSlideIn 0.3s ease;
            }
            
            @keyframes modalSlideIn {
                from {
                    opacity: 0;
                    transform: translateY(-50px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            .news-modal-header {
                position: relative;
                height: 300px;
                overflow: hidden;
            }
            
            .news-modal-image {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }
            
            .news-modal-close {
                position: absolute;
                top: 20px;
                right: 20px;
                background: rgba(0,0,0,0.7);
                color: white;
                border: none;
                width: 40px;
                height: 40px;
                border-radius: 50%;
                cursor: pointer;
                font-size: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .news-modal-body {
                padding: 30px;
            }
            
            .news-modal-title {
                font-size: 28px;
                font-weight: 700;
                margin-bottom: 15px;
                color: #333;
                line-height: 1.3;
            }
            
            .news-modal-meta {
                display: flex;
                gap: 20px;
                margin-bottom: 25px;
                padding-bottom: 20px;
                border-bottom: 1px solid #eee;
                font-size: 14px;
                color: #666;
            }
            
            .news-modal-content-text {
                font-size: 16px;
                line-height: 1.8;
                color: #444;
                margin-bottom: 30px;
            }
            
            .news-modal-actions {
                display: flex;
                gap: 15px;
                padding: 20px 30px;
                border-top: 1px solid #eee;
                background: #f8f9fa;
            }
            
            .modal-action-btn {
                padding: 10px 20px;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-weight: 500;
                transition: all 0.3s ease;
            }
            
            .modal-action-btn.primary {
                background: #667eea;
                color: white;
            }
            
            .modal-action-btn.primary:hover {
                background: #5a6fd8;
            }
            
            .modal-action-btn.secondary {
                background: #e0e0e0;
                color: #666;
            }
            
            .modal-action-btn.secondary:hover {
                background: #d0d0d0;
            }
            
            .loading-spinner {
                display: flex;
                justify-content: center;
                align-items: center;
                height: 200px;
            }
            
            .spinner {
                width: 40px;
                height: 40px;
                border: 4px solid #f3f3f3;
                border-top: 4px solid #667eea;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            .no-results {
                text-align: center;
                padding: 60px 20px;
                color: #666;
            }
            
            .no-results-icon {
                font-size: 64px;
                margin-bottom: 20px;
                opacity: 0.5;
            }
            
            @media (max-width: 768px) {
                .news-container {
                    padding: 10px;
                }
                
                .news-grid {
                    grid-template-columns: 1fr;
                }
                
                .news-filters {
                    justify-content: center;
                }
                
                .news-modal-content {
                    margin: 0;
                    max-height: 100vh;
                    border-radius: 0;
                }
                
                .news-modal-body {
                    padding: 20px;
                }
                
                .news-modal-title {
                    font-size: 24px;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    // API 模拟数据
    const mockNews = [
        {
            id: 1,
            title: "SpinMatch社区迎来重大更新",
            excerpt: "全新的用户界面和功能让乒乓球爱好者有更好的体验",
            content: `SpinMatch社区今日发布重大更新，为广大乒乓球爱好者带来全新的体验。
            
            此次更新包含了用户呼声最高的几个功能：
            1. 全新的用户界面设计，更加现代化和用户友好
            2. 增强的匹配算法，让您更容易找到合适的对手
            3. 实时聊天功能，让交流更加便捷
            4. 社区动态分享，记录您的乒乓球生活
            
            我们相信这些改进将为您带来更好的乒乓球社交体验。`,
            category: "更新",
            author: "SpinMatch团队",
            date: "2024-01-15",
            image: "https://images.pexels.com/photos/976873/pexels-photo-976873.jpeg",
            likes: 128,
            views: 1520
        },
        {
            id: 2,
            title: "乒乓球技巧分享：如何提高反手攻击",
            excerpt: "专业教练分享反手攻击的训练方法和技巧要点",
            content: `反手攻击是乒乓球技术中的重要一环，掌握好反手攻击能够大大提升你的比赛水平。
            
            技巧要点：
            1. 准备姿势：站位要合理，重心略向前倾
            2. 击球时机：在球的上升期或高点期击球
            3. 发力方式：以前臂发力为主，手腕协调配合
            4. 击球部位：击球的中上部，制造前冲弧圈
            
            训练建议：
            - 每天进行50次反手定点练习
            - 逐步增加击球速度和力量
            - 注意保持动作的连贯性`,
            category: "技巧",
            author: "李教练",
            date: "2024-01-12",
            image: "https://images.pexels.com/photos/8007413/pexels-photo-8007413.jpeg",
            likes: 85,
            views: 892
        },
        {
            id: 3,
            title: "本周社区赛事预告",
            excerpt: "精彩的社区比赛即将开始，快来报名参加吧！",
            content: `本周SpinMatch社区将举办多场精彩比赛，欢迎各位球友踊跃参与！
            
            比赛安排：
            
            周三晚上 19:00 - 新手友谊赛
            地点：市体育中心1号厅
            报名要求：入门级选手
            
            周五晚上 19:30 - 中级技能赛
            地点：市体育中心2号厅
            报名要求：中级水平选手
            
            周日下午 14:00 - 社区大师赛
            地点：市体育中心主厅
            报名要求：高级水平选手
            
            报名方式：通过SpinMatch应用内报名系统`,
            category: "赛事",
            author: "赛事组委会",
            date: "2024-01-10",
            image: "https://images.pexels.com/photos/6224/hands-people-woman-meeting.jpg",
            likes: 156,
            views: 2341
        }
    ];
    
    // 初始化函数
    function init() {
        if (isInitialized) return;
        
        console.log('新闻模块初始化中...');
        injectStyles();
        initElements();
        bindEvents();
        loadNews();
        
        isInitialized = true;
        console.log('新闻模块初始化完成');
    }
    
    // 初始化DOM元素
    function initElements() {
        elements = {
            container: document.querySelector('.news-container') || createContainer(),
            searchInput: null,
            filterBtns: null,
            newsGrid: null,
            modal: null
        };
    }
    
    // 创建容器
    function createContainer() {
        const container = document.createElement('div');
        container.className = 'news-container';
        container.innerHTML = `
            <div class="news-header">
                <h1>SpinMatch 新闻中心</h1>
                <p>获取最新的乒乓球资讯和社区动态</p>
            </div>
            
            <div class="news-search">
                <input type="text" class="search-input" placeholder="搜索新闻...">
                <div class="news-filters">
                    <button class="filter-btn active" data-filter="all">全部</button>
                    <button class="filter-btn" data-filter="更新">更新</button>
                    <button class="filter-btn" data-filter="技巧">技巧</button>
                    <button class="filter-btn" data-filter="赛事">赛事</button>
                </div>
            </div>
            
            <div class="news-grid"></div>
            
            <div class="news-modal">
                <div class="news-modal-content">
                    <div class="news-modal-header">
                        <img class="news-modal-image" src="" alt="">
                        <button class="news-modal-close">&times;</button>
                    </div>
                    <div class="news-modal-body">
                        <h2 class="news-modal-title"></h2>
                        <div class="news-modal-meta">
                            <span class="modal-author"></span>
                            <span class="modal-date"></span>
                            <span class="modal-views"></span>
                        </div>
                        <div class="news-modal-content-text"></div>
                    </div>
                    <div class="news-modal-actions">
                        <button class="modal-action-btn primary">点赞</button>
                        <button class="modal-action-btn secondary">分享</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(container);
        return container;
    }
    
    // 绑定事件
    function bindEvents() {
        // 搜索功能
        elements.searchInput = elements.container.querySelector('.search-input');
        if (elements.searchInput) {
            elements.searchInput.addEventListener('input', debounce(handleSearch, 300));
        }
        
        // 过滤按钮
        elements.filterBtns = elements.container.querySelectorAll('.filter-btn');
        elements.filterBtns.forEach(btn => {
            btn.addEventListener('click', handleFilter);
        });
        
        // 模态框
        elements.modal = elements.container.querySelector('.news-modal');
        const closeBtn = elements.modal?.querySelector('.news-modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', closeModal);
        }
        
        // 点击模态框背景关闭
        if (elements.modal) {
            elements.modal.addEventListener('click', (e) => {
                if (e.target === elements.modal) {
                    closeModal();
                }
            });
        }
        
        // ESC键关闭模态框
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && elements.modal?.classList.contains('active')) {
                closeModal();
            }
        });
    }
    
    // 加载新闻数据
    async function loadNews(searchTerm = '', category = 'all') {
        const newsGrid = elements.container.querySelector('.news-grid');
        if (!newsGrid) return;
        
        try {
            showLoading(newsGrid);
            
            // 模拟API调用
            await new Promise(resolve => setTimeout(resolve, 500));
            
            let filteredNews = mockNews;
            
            // 搜索过滤
            if (searchTerm) {
                filteredNews = filteredNews.filter(news => 
                    news.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    news.excerpt.toLowerCase().includes(searchTerm.toLowerCase())
                );
            }
            
            // 分类过滤
            if (category !== 'all') {
                filteredNews = filteredNews.filter(news => news.category === category);
            }
            
            displayNews(filteredNews);
            
        } catch (error) {
            console.error('加载新闻失败:', error);
            showError(newsGrid, '加载新闻失败，请稍后重试');
        }
    }
    
    // 显示新闻列表
    function displayNews(newsList) {
        const newsGrid = elements.container.querySelector('.news-grid');
        if (!newsGrid) return;
        
        if (newsList.length === 0) {
            newsGrid.innerHTML = `
                <div class="no-results">
                    <div class="no-results-icon">📰</div>
                    <h3>未找到相关新闻</h3>
                    <p>请尝试其他搜索关键词或筛选条件</p>
                </div>
            `;
            return;
        }
        
        newsGrid.innerHTML = newsList.map(news => createNewsCard(news)).join('');
        
        // 绑定卡片点击事件
        newsGrid.querySelectorAll('.news-card').forEach((card, index) => {
            card.addEventListener('click', () => openNewsModal(newsList[index]));
        });
        
        // 绑定操作按钮事件
        newsGrid.querySelectorAll('.action-btn').forEach(btn => {
            btn.addEventListener('click', handleCardAction);
        });
    }
    
    // 创建新闻卡片
    function createNewsCard(news) {
        return `
            <div class="news-card" data-id="${news.id}">
                <img class="news-card-image" src="${news.image}" alt="${news.title}" 
                     onerror="this.style.background='linear-gradient(45deg, #f0f0f0, #e0e0e0)'; this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNGNUY1RjUiLz48cGF0aCBkPSJNNzAgMTMwSDEzME05NSA5NUwxMzAgMTMwIDk1IDE2NSIgc3Ryb2tlPSIjQ0NDIiBzdHJva2Utd2lkdGg9IjIiIGZpbGw9Im5vbmUiLz48L3N2Zz4=';">
                <div class="news-card-content">
                    <h3 class="news-card-title">${news.title}</h3>
                    <p class="news-card-excerpt">${news.excerpt}</p>
                    <div class="news-card-meta">
                        <div class="news-card-date">
                            <span>📅</span>
                            <span>${formatDate(news.date)}</span>
                        </div>
                        <div class="news-card-actions">
                            <button class="action-btn like-btn" data-action="like" data-id="${news.id}">
                                ❤️ ${news.likes}
                            </button>
                            <button class="action-btn share-btn" data-action="share" data-id="${news.id}">
                                📤
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    // 打开新闻模态框
    function openNewsModal(news) {
        if (!elements.modal) return;
        
        const modalImage = elements.modal.querySelector('.news-modal-image');
        const modalTitle = elements.modal.querySelector('.news-modal-title');
        const modalAuthor = elements.modal.querySelector('.modal-author');
        const modalDate = elements.modal.querySelector('.modal-date');
        const modalViews = elements.modal.querySelector('.modal-views');
        const modalContent = elements.modal.querySelector('.news-modal-content-text');
        
        if (modalImage) modalImage.src = news.image;
        if (modalTitle) modalTitle.textContent = news.title;
        if (modalAuthor) modalAuthor.textContent = `作者: ${news.author}`;
        if (modalDate) modalDate.textContent = `发布: ${formatDate(news.date)}`;
        if (modalViews) modalViews.textContent = `浏览: ${news.views}`;
        if (modalContent) modalContent.textContent = news.content;
        
        elements.modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        currentNews = news;
        
        // 增加浏览量（模拟）
        news.views++;
    }
    
    // 关闭模态框
    function closeModal() {
        if (!elements.modal) return;
        
        elements.modal.classList.remove('active');
        document.body.style.overflow = '';
        currentNews = null;
    }
    
    // 处理搜索
    function handleSearch(e) {
        const searchTerm = e.target.value.trim();
        const activeFilter = elements.container.querySelector('.filter-btn.active');
        const category = activeFilter ? activeFilter.dataset.filter : 'all';
        
        loadNews(searchTerm, category);
    }
    
    // 处理过滤
    function handleFilter(e) {
        // 更新按钮状态
        elements.filterBtns.forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
        
        const category = e.target.dataset.filter;
        const searchTerm = elements.searchInput ? elements.searchInput.value.trim() : '';
        
        loadNews(searchTerm, category);
    }
    
    // 处理卡片操作
    function handleCardAction(e) {
        e.stopPropagation();
        
        const action = e.target.dataset.action;
        const newsId = parseInt(e.target.dataset.id);
        
        switch (action) {
            case 'like':
                handleLike(newsId, e.target);
                break;
            case 'share':
                handleShare(newsId);
                break;
        }
    }
    
    // 处理点赞
    function handleLike(newsId, button) {
        const news = mockNews.find(n => n.id === newsId);
        if (!news) return;
        
        if (button.classList.contains('liked')) {
            news.likes--;
            button.classList.remove('liked');
        } else {
            news.likes++;
            button.classList.add('liked');
        }
        
        button.innerHTML = `❤️ ${news.likes}`;
        
        // 触觉反馈
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }
    }
    
    // 处理分享
    function handleShare(newsId) {
        const news = mockNews.find(n => n.id === newsId);
        if (!news) return;
        
        if (navigator.share) {
            navigator.share({
                title: news.title,
                text: news.excerpt,
                url: window.location.href
            }).catch(console.error);
        } else {
            // 复制到剪贴板
            const shareText = `${news.title} - ${news.excerpt}`;
            navigator.clipboard.writeText(shareText).then(() => {
                showNotification('链接已复制到剪贴板');
            }).catch(console.error);
        }
    }
    
    // 工具函数
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    function formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) return '昨天';
        if (diffDays < 7) return `${diffDays}天前`;
        if (diffDays < 30) return `${Math.ceil(diffDays / 7)}周前`;
        
        return date.toLocaleDateString('zh-CN');
    }
    
    function showLoading(container) {
        container.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner"></div>
            </div>
        `;
    }
    
    function showError(container, message) {
        container.innerHTML = `
            <div class="no-results">
                <div class="no-results-icon">⚠️</div>
                <h3>加载失败</h3>
                <p>${message}</p>
            </div>
        `;
    }
    
    function showNotification(message) {
        // 创建通知元素
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4CAF50;
            color: white;
            padding: 12px 20px;
            border-radius: 6px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10001;
            animation: slideInRight 0.3s ease;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
    
    // 页面可见性变化处理
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden && isInitialized) {
            // 页面重新可见时刷新数据
            const searchTerm = elements.searchInput ? elements.searchInput.value.trim() : '';
            const activeFilter = elements.container?.querySelector('.filter-btn.active');
            const category = activeFilter ? activeFilter.dataset.filter : 'all';
            loadNews(searchTerm, category);
        }
    });
    
    // 清理函数
    function cleanup() {
        if (elements.modal && elements.modal.classList.contains('active')) {
            closeModal();
        }
        
        // 移除事件监听器
        document.removeEventListener('keydown', closeModal);
        
        console.log('新闻模块已清理');
    }
    
    // 公共API
    return {
        init,
        cleanup,
        loadNews,
        openNews: openNewsModal,
        isInitialized: () => isInitialized
    };
})();

// 自动初始化（如果页面已加载）
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (window.location.pathname.includes('news') || 
            document.querySelector('.news-container')) {
            window.NewsModule.init();
        }
    });
} else {
    if (window.location.pathname.includes('news') || 
        document.querySelector('.news-container')) {
        window.NewsModule.init();
    }
}

console.log('新闻模块已加载'); 