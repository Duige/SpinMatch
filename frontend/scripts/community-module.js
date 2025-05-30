/**
 * SpinMatch 社区模块 - 完全独立
 * 处理社区动态、发布、互动等所有社区相关功能
 */

class CommunityModule {
    constructor() {
        this.apiBaseUrl = this.detectApiUrl();
        this.currentUser = null;
        this.posts = [];
        this.currentFilters = {
            contentType: 'all',
            userLevel: 'all',
            timeRange: 'all',
            sortBy: 'newest'
        };
        this.loadingMore = false;
        this.hasMorePosts = true;
        this.currentPage = 1;
        
        // 初始化
        this.init();
    }

    // 检测API地址
    detectApiUrl() {
        if (window.location.protocol === 'file:' || !window.location.hostname) {
            return 'http://localhost:5001';
        } else if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            return 'http://localhost:5001';
        } else {
            return window.location.protocol + '//' + window.location.hostname + ':5001';
        }
    }

    // 初始化模块
    async init() {
        console.log('🏘️ 初始化社区模块');
        
        // 检查当前用户
        this.loadCurrentUser();
        
        // 绑定事件
        this.bindEvents();
        
        // 初始化UI
        this.initUI();
        
        // 加载社区内容
        await this.loadCommunityPosts();
        
        console.log('✅ 社区模块初始化完成');
    }

    // 加载当前用户
    loadCurrentUser() {
        const userStr = localStorage.getItem('spinmatch_user');
        if (userStr) {
            try {
                this.currentUser = JSON.parse(userStr);
            } catch (error) {
                console.error('加载用户信息失败:', error);
            }
        }
    }

    // 绑定事件
    bindEvents() {
        // 发布动态
        document.addEventListener('submit', (e) => {
            if (e.target.closest('#postForm')) {
                e.preventDefault();
                this.handleCreatePost();
            }
        });

        // 点赞功能
        document.addEventListener('click', (e) => {
            if (e.target.closest('.like-btn')) {
                e.preventDefault();
                this.handleLike(e.target.closest('.like-btn'));
            }
            
            // 评论功能
            if (e.target.closest('.comment-btn')) {
                e.preventDefault();
                this.handleComment(e.target.closest('.comment-btn'));
            }
            
            // 分享功能
            if (e.target.closest('.share-btn')) {
                e.preventDefault();
                this.handleShare(e.target.closest('.share-btn'));
            }
            
            // 筛选按钮
            if (e.target.closest('.filter-btn')) {
                e.preventDefault();
                this.handleFilter(e.target.closest('.filter-btn'));
            }
        });

        // 滚动加载更多
        window.addEventListener('scroll', () => {
            this.handleScroll();
        });

        // 监听认证状态变化
        window.addEventListener('auth:login', (e) => {
            this.currentUser = e.detail;
            this.updatePostForm();
        });

        window.addEventListener('auth:logout', () => {
            this.currentUser = null;
            this.updatePostForm();
        });
    }

    // 初始化UI
    initUI() {
        this.updatePostForm();
        this.addCommunityStyles();
    }

    // 加载社区动态
    async loadCommunityPosts(append = false) {
        try {
            if (!append) {
                this.showLoading();
            }

            // 尝试从API获取数据
            try {
                const response = await fetch(`${this.apiBaseUrl}/api/community/posts?page=${this.currentPage}&limit=10`);
                const result = await response.json();
                
                if (result.success && result.posts) {
                    const newPosts = result.posts;
                    this.posts = append ? [...this.posts, ...newPosts] : newPosts;
                    this.hasMorePosts = newPosts.length === 10;
                    this.renderPosts();
                    return;
                }
            } catch (error) {
                console.warn('API获取失败，使用本地数据:', error);
            }

            // 使用本地模拟数据
            const mockPosts = this.generateMockPosts();
            this.posts = append ? [...this.posts, ...mockPosts] : mockPosts;
            this.renderPosts();
            
        } catch (error) {
            console.error('加载社区动态失败:', error);
            this.showError('加载动态失败，请刷新重试');
        } finally {
            this.hideLoading();
            this.loadingMore = false;
        }
    }

    // 生成模拟数据
    generateMockPosts() {
        const mockUsers = [
            { name: '张小明', level: 'intermediate', avatar: this.generateAvatar('张小明') },
            { name: '李华', level: 'advanced', avatar: this.generateAvatar('李华') },
            { name: '王小红', level: 'beginner', avatar: this.generateAvatar('王小红') },
            { name: '陈大力', level: 'professional', avatar: this.generateAvatar('陈大力') }
        ];

        const mockContents = [
            '今天的训练效果很好，终于掌握了正手攻球的要领！感谢教练的指导 🏓',
            '分享一个发球技巧：下旋球的关键是手腕的发力，大家可以试试看',
            '昨天参加了俱乐部的比赛，虽然输了但学到很多，继续加油！',
            '推荐一个练习步法的好方法，每天坚持20分钟，进步明显',
            '新买的球拍到了，红双喜的手感真不错，推荐给大家'
        ];

        return Array.from({ length: 5 }, (_, index) => {
            const user = mockUsers[index % mockUsers.length];
            const content = mockContents[index % mockContents.length];
            
            return {
                id: `post_${Date.now()}_${index}`,
                user: user,
                content: content,
                images: Math.random() > 0.7 ? [this.generatePostImage()] : [],
                likes: Math.floor(Math.random() * 50) + 5,
                comments: Math.floor(Math.random() * 20) + 2,
                shares: Math.floor(Math.random() * 10),
                timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
                isLiked: false,
                tags: this.generateRandomTags()
            };
        });
    }

    // 生成随机标签
    generateRandomTags() {
        const allTags = ['训练心得', '技巧分享', '装备推荐', '比赛经历', '新手指导', '进阶技巧'];
        const tagCount = Math.floor(Math.random() * 3) + 1;
        return allTags.sort(() => Math.random() - 0.5).slice(0, tagCount);
    }

    // 生成头像
    generateAvatar(name) {
        const colors = ['#FF6B35', '#DC143C', '#FFD700', '#32CD32', '#1E90FF', '#9370DB'];
        const color = colors[name.charCodeAt(0) % colors.length];
        const initial = name.charAt(0);
        
        return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='50' height='50' viewBox='0 0 50 50'%3E%3Ccircle cx='25' cy='25' r='25' fill='${encodeURIComponent(color)}'/%3E%3Ctext x='25' y='32' text-anchor='middle' fill='white' font-size='18' font-family='Arial'%3E${initial}%3C/text%3E%3C/svg%3E`;
    }

    // 生成文章图片
    generatePostImage() {
        const imageTopics = ['table-tennis', 'sports', 'training', 'equipment'];
        const topic = imageTopics[Math.floor(Math.random() * imageTopics.length)];
        return `https://images.unsplash.com/photo-${Date.now()}?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80&topic=${topic}`;
    }

    // 渲染动态列表
    renderPosts() {
        const container = document.getElementById('postsContainer');
        if (!container) return;

        if (this.posts.length === 0) {
            container.innerHTML = this.getEmptyState();
            return;
        }

        const postsHTML = this.posts.map(post => this.createPostHTML(post)).join('');
        container.innerHTML = postsHTML;
    }

    // 创建动态HTML
    createPostHTML(post) {
        const timeAgo = this.formatTimeAgo(post.timestamp);
        const levelText = this.getLevelText(post.user.level);
        const imagesHTML = post.images.length > 0 ? 
            `<div class="post-images">
                ${post.images.map(img => `<img src="${img}" alt="动态图片" loading="lazy">`).join('')}
            </div>` : '';
        
        const tagsHTML = post.tags.length > 0 ?
            `<div class="post-tags">
                ${post.tags.map(tag => `<span class="tag">#${tag}</span>`).join('')}
            </div>` : '';

        return `
            <div class="post-card" data-post-id="${post.id}">
                <div class="post-header">
                    <img src="${post.user.avatar}" alt="${post.user.name}" class="user-avatar">
                    <div class="user-info">
                        <h4 class="user-name">${post.user.name}</h4>
                        <span class="user-level ${post.user.level}">${levelText}</span>
                        <span class="post-time">${timeAgo}</span>
                    </div>
                </div>
                
                <div class="post-content">
                    <p>${post.content}</p>
                    ${imagesHTML}
                    ${tagsHTML}
                </div>
                
                <div class="post-actions">
                    <button class="action-btn like-btn ${post.isLiked ? 'liked' : ''}" data-post-id="${post.id}">
                        <i class="fas fa-heart"></i>
                        <span>${post.likes}</span>
                    </button>
                    <button class="action-btn comment-btn" data-post-id="${post.id}">
                        <i class="fas fa-comment"></i>
                        <span>${post.comments}</span>
                    </button>
                    <button class="action-btn share-btn" data-post-id="${post.id}">
                        <i class="fas fa-share"></i>
                        <span>${post.shares}</span>
                    </button>
                </div>
            </div>
        `;
    }

    // 格式化时间
    formatTimeAgo(timestamp) {
        const now = new Date();
        const diff = now - new Date(timestamp);
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days}天前`;
        if (hours > 0) return `${hours}小时前`;
        if (minutes > 0) return `${minutes}分钟前`;
        return '刚刚';
    }

    // 获取等级文本
    getLevelText(level) {
        const levels = {
            'beginner': '初学者',
            'intermediate': '中级',
            'advanced': '高级',
            'professional': '专业'
        };
        return levels[level] || '初学者';
    }

    // 处理发布动态
    async handleCreatePost() {
        if (!this.currentUser) {
            this.showNotification('请先登录后再发布动态', 'error');
            return;
        }

        const content = document.getElementById('postContent')?.value?.trim();
        if (!content) {
            this.showNotification('请输入动态内容', 'error');
            return;
        }

        try {
            const newPost = {
                id: `post_${Date.now()}`,
                user: {
                    name: this.currentUser.name || this.currentUser.username,
                    level: this.currentUser.level,
                    avatar: this.currentUser.avatar
                },
                content: content,
                images: [],
                likes: 0,
                comments: 0,
                shares: 0,
                timestamp: new Date(),
                isLiked: false,
                tags: this.extractTags(content)
            };

            // 添加到列表开头
            this.posts.unshift(newPost);
            this.renderPosts();

            // 清空表单
            document.getElementById('postContent').value = '';
            
            this.showNotification('动态发布成功！', 'success');

        } catch (error) {
            console.error('发布动态失败:', error);
            this.showNotification('发布失败，请重试', 'error');
        }
    }

    // 提取标签
    extractTags(content) {
        const tagRegex = /#([^\s#]+)/g;
        const matches = content.match(tagRegex);
        return matches ? matches.map(tag => tag.substring(1)) : [];
    }

    // 处理点赞
    async handleLike(button) {
        const postId = button.dataset.postId;
        const post = this.posts.find(p => p.id === postId);
        
        if (!post) return;

        if (!this.currentUser) {
            this.showNotification('请先登录后再点赞', 'error');
            return;
        }

        // 切换点赞状态
        post.isLiked = !post.isLiked;
        post.likes += post.isLiked ? 1 : -1;

        // 更新UI
        button.classList.toggle('liked', post.isLiked);
        button.querySelector('span').textContent = post.likes;

        // 显示反馈
        if (post.isLiked) {
            this.showLikeAnimation(button);
        }
    }

    // 处理评论
    async handleComment(button) {
        if (!this.currentUser) {
            this.showNotification('请先登录后再评论', 'error');
            return;
        }

        const postId = button.dataset.postId;
        this.showNotification('评论功能开发中...', 'info');
    }

    // 处理分享
    async handleShare(button) {
        const postId = button.dataset.postId;
        const post = this.posts.find(p => p.id === postId);
        
        if (!post) return;

        try {
            if (navigator.share) {
                await navigator.share({
                    title: 'SpinMatch 社区动态',
                    text: post.content,
                    url: window.location.href
                });
            } else {
                await navigator.clipboard.writeText(post.content);
                this.showNotification('动态内容已复制到剪贴板', 'success');
            }
            
            // 增加分享数
            post.shares++;
            button.querySelector('span').textContent = post.shares;
            
        } catch (error) {
            console.error('分享失败:', error);
            this.showNotification('分享失败', 'error');
        }
    }

    // 处理筛选
    handleFilter(button) {
        const filterType = button.dataset.filter;
        const filterValue = button.dataset.value;
        
        // 更新筛选状态
        document.querySelectorAll(`[data-filter="${filterType}"]`).forEach(btn => {
            btn.classList.remove('active');
        });
        button.classList.add('active');
        
        this.currentFilters[filterType] = filterValue;
        this.applyFilters();
    }

    // 应用筛选
    applyFilters() {
        const container = document.getElementById('postsContainer');
        if (!container) return;

        const postCards = container.querySelectorAll('.post-card');
        
        postCards.forEach(card => {
            const shouldShow = this.shouldShowPost(card);
            card.style.display = shouldShow ? 'block' : 'none';
        });
    }

    // 判断是否显示动态
    shouldShowPost(card) {
        // 这里可以根据筛选条件判断
        // 目前先显示所有动态
        return true;
    }

    // 处理滚动加载
    handleScroll() {
        if (this.loadingMore || !this.hasMorePosts) return;

        const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
        
        if (scrollTop + clientHeight >= scrollHeight - 1000) {
            this.loadingMore = true;
            this.currentPage++;
            this.loadCommunityPosts(true);
        }
    }

    // 更新发布表单
    updatePostForm() {
        const postForm = document.getElementById('postForm');
        if (!postForm) return;

        if (this.currentUser) {
            postForm.style.display = 'block';
            const userInfo = postForm.querySelector('.post-user-info');
            if (userInfo) {
                userInfo.innerHTML = `
                    <img src="${this.currentUser.avatar}" alt="${this.currentUser.name}" class="user-avatar">
                    <span>${this.currentUser.name}</span>
                `;
            }
        } else {
            postForm.style.display = 'none';
        }
    }

    // 显示加载状态
    showLoading() {
        const container = document.getElementById('postsContainer');
        if (container) {
            container.innerHTML = `
                <div class="loading-state">
                    <i class="fas fa-spinner fa-spin"></i>
                    <p>加载社区动态中...</p>
                </div>
            `;
        }
    }

    // 隐藏加载状态
    hideLoading() {
        // 加载完成后会重新渲染，所以不需要特别处理
    }

    // 显示错误状态
    showError(message) {
        const container = document.getElementById('postsContainer');
        if (container) {
            container.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>${message}</p>
                    <button onclick="communityModule.loadCommunityPosts()" class="btn-primary">重新加载</button>
                </div>
            `;
        }
    }

    // 获取空状态
    getEmptyState() {
        return `
            <div class="empty-state">
                <i class="fas fa-comments"></i>
                <h3>暂无动态</h3>
                <p>成为第一个分享的球友吧！</p>
                ${this.currentUser ? '' : '<p class="login-tip">登录后即可发布动态</p>'}
            </div>
        `;
    }

    // 显示点赞动画
    showLikeAnimation(button) {
        const heart = document.createElement('div');
        heart.className = 'like-animation';
        heart.innerHTML = '<i class="fas fa-heart"></i>';
        
        button.appendChild(heart);
        
        setTimeout(() => {
            heart.remove();
        }, 1000);
    }

    // 通知系统
    showNotification(message, type = 'info', duration = 3000) {
        // 创建通知容器
        let container = document.querySelector('.notification-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'notification-container';
            document.body.appendChild(container);
        }

        // 创建通知元素
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${this.getNotificationIcon(type)}"></i>
                <span>${message}</span>
            </div>
        `;

        container.appendChild(notification);

        // 显示动画
        setTimeout(() => notification.classList.add('show'), 100);

        // 自动移除
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, duration);
    }

    getNotificationIcon(type) {
        const icons = {
            'success': 'check-circle',
            'error': 'exclamation-circle',
            'warning': 'exclamation-triangle',
            'info': 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    // 添加样式
    addCommunityStyles() {
        if (document.querySelector('style[data-community-module]')) return;

        const style = document.createElement('style');
        style.setAttribute('data-community-module', 'true');
        style.textContent = `
            .post-card {
                background: white;
                border-radius: 12px;
                padding: 20px;
                margin-bottom: 20px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                transition: transform 0.2s ease;
            }

            .post-card:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 20px rgba(0,0,0,0.15);
            }

            .post-header {
                display: flex;
                align-items: center;
                margin-bottom: 15px;
            }

            .user-avatar {
                width: 50px;
                height: 50px;
                border-radius: 50%;
                margin-right: 12px;
            }

            .user-info h4 {
                margin: 0;
                font-size: 16px;
                font-weight: 600;
                color: #333;
            }

            .user-level {
                font-size: 12px;
                padding: 2px 8px;
                border-radius: 12px;
                margin-right: 8px;
            }

            .user-level.beginner { background: #e3f2fd; color: #1976d2; }
            .user-level.intermediate { background: #f3e5f5; color: #7b1fa2; }
            .user-level.advanced { background: #fff3e0; color: #f57c00; }
            .user-level.professional { background: #ffebee; color: #d32f2f; }

            .post-time {
                font-size: 12px;
                color: #666;
            }

            .post-content p {
                margin: 0 0 15px;
                line-height: 1.6;
                color: #333;
            }

            .post-images {
                margin: 15px 0;
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 10px;
            }

            .post-images img {
                width: 100%;
                border-radius: 8px;
                object-fit: cover;
                height: 200px;
            }

            .post-tags {
                margin: 10px 0;
            }

            .tag {
                display: inline-block;
                background: #f5f5f5;
                color: #666;
                padding: 4px 8px;
                border-radius: 12px;
                font-size: 12px;
                margin-right: 8px;
                margin-bottom: 4px;
            }

            .post-actions {
                display: flex;
                gap: 20px;
                padding-top: 15px;
                border-top: 1px solid #eee;
            }

            .action-btn {
                display: flex;
                align-items: center;
                gap: 6px;
                background: none;
                border: none;
                color: #666;
                cursor: pointer;
                padding: 8px 12px;
                border-radius: 20px;
                transition: all 0.2s ease;
                font-size: 14px;
            }

            .action-btn:hover {
                background: #f5f5f5;
                color: #333;
            }

            .like-btn.liked {
                color: #dc3545;
            }

            .like-animation {
                position: absolute;
                color: #dc3545;
                animation: likeFloat 1s ease-out forwards;
                pointer-events: none;
            }

            @keyframes likeFloat {
                0% { transform: scale(1) translateY(0); opacity: 1; }
                100% { transform: scale(1.5) translateY(-30px); opacity: 0; }
            }

            .loading-state, .error-state, .empty-state {
                text-align: center;
                padding: 60px 20px;
                color: #666;
            }

            .loading-state i, .error-state i, .empty-state i {
                font-size: 48px;
                margin-bottom: 20px;
                display: block;
            }

            .loading-state i {
                color: #17a2b8;
            }

            .error-state i {
                color: #dc3545;
            }

            .empty-state i {
                color: #6c757d;
            }

            .notification-container {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                pointer-events: none;
            }

            .notification {
                background: white;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                margin-bottom: 10px;
                transform: translateX(100%);
                transition: transform 0.3s ease;
                pointer-events: auto;
                min-width: 300px;
            }

            .notification.show {
                transform: translateX(0);
            }

            .notification-content {
                padding: 16px;
                display: flex;
                align-items: center;
                gap: 12px;
            }

            .notification-success { border-left: 4px solid #28a745; }
            .notification-error { border-left: 4px solid #dc3545; }
            .notification-warning { border-left: 4px solid #ffc107; }
            .notification-info { border-left: 4px solid #17a2b8; }
        `;
        document.head.appendChild(style);
    }

    // 公共API方法
    getCurrentUser() {
        return this.currentUser;
    }

    getPosts() {
        return this.posts;
    }

    refreshPosts() {
        this.currentPage = 1;
        this.hasMorePosts = true;
        this.loadCommunityPosts();
    }

    // 筛选功能
    toggleFilters() {
        const filtersPanel = document.querySelector('.filters-panel');
        if (filtersPanel) {
            filtersPanel.classList.toggle('show');
        }
    }

    searchCommunity(query) {
        if (!query.trim()) {
            this.renderPosts();
            return;
        }

        const filteredPosts = this.posts.filter(post => 
            post.content.toLowerCase().includes(query.toLowerCase()) ||
            post.user.name.toLowerCase().includes(query.toLowerCase()) ||
            post.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
        );

        const container = document.getElementById('postsContainer');
        if (container) {
            if (filteredPosts.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-search"></i>
                        <h3>未找到相关动态</h3>
                        <p>试试其他关键词吧</p>
                    </div>
                `;
            } else {
                const postsHTML = filteredPosts.map(post => this.createPostHTML(post)).join('');
                container.innerHTML = postsHTML;
            }
        }
    }
}

// 创建全局实例
const communityModule = new CommunityModule();

// 导出到全局
window.communityModule = communityModule;

// 全局函数兼容
window.toggleFilters = () => communityModule.toggleFilters();
window.searchCommunity = (query) => communityModule.searchCommunity(query);

console.log('🏘️ 社区模块已加载'); 