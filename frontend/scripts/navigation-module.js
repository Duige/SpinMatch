/**
 * SpinMatch 导航模块 - 完全独立
 * 处理页面导航、菜单切换、用户状态显示等功能
 */

class NavigationModule {
    constructor() {
        this.currentUser = null;
        this.currentPage = this.getCurrentPage();
        this.menuItems = [];
        
        // 初始化
        this.init();
    }

    // 初始化模块
    init() {
        console.log('🧭 初始化导航模块');
        
        // 加载当前用户
        this.loadCurrentUser();
        
        // 初始化导航菜单
        this.initNavigation();
        
        // 绑定事件
        this.bindEvents();
        
        // 设置当前页面高亮
        this.setActiveNavItem();
        
        console.log('✅ 导航模块初始化完成');
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

    // 获取当前页面
    getCurrentPage() {
        const path = window.location.pathname;
        return path.split('/').pop() || 'index.html';
    }

    // 初始化导航菜单
    initNavigation() {
        this.menuItems = [
            { name: '首页', url: 'index.html', icon: 'fas fa-home', id: 'home' },
            { name: '社区', url: 'community.html', icon: 'fas fa-users', id: 'community' },
            { name: '约球', url: 'booking.html', icon: 'fas fa-handshake', id: 'booking' },
            { name: '赛事', url: 'events.html', icon: 'fas fa-trophy', id: 'events' },
            { name: '新闻', url: 'news.html', icon: 'fas fa-newspaper', id: 'news' }
        ];

        this.updateNavigationUI();
    }

    // 更新导航UI
    updateNavigationUI() {
        this.updateMainNav();
        this.updateUserNav();
        this.updateMobileNav();
    }

    // 更新主导航
    updateMainNav() {
        const navList = document.querySelector('.nav-list');
        if (!navList) return;

        const navHTML = this.menuItems.map(item => `
            <li class="nav-item ${this.currentPage === item.url ? 'active' : ''}">
                <a href="${item.url}" class="nav-link" data-page="${item.id}">
                    <i class="${item.icon}"></i>
                    <span>${item.name}</span>
                </a>
            </li>
        `).join('');

        navList.innerHTML = navHTML;
    }

    // 更新用户导航
    updateUserNav() {
        const userNav = document.querySelector('.user-nav');
        if (!userNav) return;

        if (this.currentUser) {
            userNav.innerHTML = `
                <div class="user-info">
                    <img src="${this.currentUser.avatar || this.generateAvatar(this.currentUser.name)}" 
                         alt="用户头像" class="user-avatar">
                    <span class="user-name">${this.currentUser.name}</span>
                    <div class="user-dropdown">
                        <a href="profile.html" class="dropdown-item">
                            <i class="fas fa-user"></i>
                            个人资料
                        </a>
                        <a href="#" class="dropdown-item logout-btn">
                            <i class="fas fa-sign-out-alt"></i>
                            退出登录
                        </a>
                    </div>
                </div>
            `;
        } else {
            userNav.innerHTML = `
                <div class="auth-buttons">
                    <button class="btn-secondary login-btn">登录</button>
                    <button class="btn-primary register-btn">注册</button>
                </div>
            `;
        }
    }

    // 更新移动端导航
    updateMobileNav() {
        const mobileNav = document.querySelector('.mobile-nav');
        if (!mobileNav) return;

        const mobileHTML = this.menuItems.map(item => `
            <a href="${item.url}" class="mobile-nav-item ${this.currentPage === item.url ? 'active' : ''}" 
               data-page="${item.id}">
                <i class="${item.icon}"></i>
                <span>${item.name}</span>
            </a>
        `).join('');

        mobileNav.innerHTML = mobileHTML;
    }

    // 生成头像
    generateAvatar(name) {
        const colors = ['#FF6B35', '#DC143C', '#FFD700', '#32CD32', '#1E90FF', '#9370DB'];
        const color = colors[name.charCodeAt(0) % colors.length];
        const initial = name.charAt(0);
        
        return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Ccircle cx='20' cy='20' r='20' fill='${encodeURIComponent(color)}'/%3E%3Ctext x='20' y='26' text-anchor='middle' fill='white' font-size='16' font-family='Arial'%3E${initial}%3C/text%3E%3C/svg%3E`;
    }

    // 绑定事件
    bindEvents() {
        // 导航链接点击
        document.addEventListener('click', (e) => {
            // 登录按钮
            if (e.target.closest('.login-btn')) {
                e.preventDefault();
                this.showAuthModal('login');
            }
            
            // 注册按钮
            if (e.target.closest('.register-btn')) {
                e.preventDefault();
                this.showAuthModal('register');
            }
            
            // 退出登录
            if (e.target.closest('.logout-btn')) {
                e.preventDefault();
                this.handleLogout();
            }
            
            // 导航链接
            if (e.target.closest('.nav-link') || e.target.closest('.mobile-nav-item')) {
                this.handleNavigation(e);
            }
            
            // 移动端菜单按钮
            if (e.target.closest('.mobile-menu-btn')) {
                e.preventDefault();
                this.toggleMobileMenu();
            }
        });

        // 监听认证状态变化
        window.addEventListener('auth:login', (e) => {
            this.currentUser = e.detail;
            this.updateUserNav();
        });

        window.addEventListener('auth:logout', () => {
            this.currentUser = null;
            this.updateUserNav();
        });

        // 窗口大小变化
        window.addEventListener('resize', () => {
            this.handleResize();
        });
    }

    // 处理导航
    handleNavigation(e) {
        const link = e.target.closest('.nav-link') || e.target.closest('.mobile-nav-item');
        if (!link) return;

        const href = link.getAttribute('href');
        const pageId = link.dataset.page;
        
        // 平滑过渡效果
        this.performPageTransition(href, pageId);
    }

    // 执行页面过渡
    performPageTransition(href, pageId) {
        // 添加过渡效果
        document.body.classList.add('page-transitioning');
        
        // 延迟跳转以显示过渡效果
        setTimeout(() => {
            window.location.href = href;
        }, 150);
    }

    // 设置当前页面高亮
    setActiveNavItem() {
        // 移除所有活动状态
        document.querySelectorAll('.nav-item, .mobile-nav-item').forEach(item => {
            item.classList.remove('active');
        });

        // 添加当前页面的活动状态
        const currentNavItem = document.querySelector(`[data-page="${this.getCurrentPageId()}"]`)?.closest('.nav-item, .mobile-nav-item');
        if (currentNavItem) {
            currentNavItem.classList.add('active');
        }
    }

    // 获取当前页面ID
    getCurrentPageId() {
        const pageMap = {
            'index.html': 'home',
            'community.html': 'community',
            'booking.html': 'booking',
            'events.html': 'events',
            'news.html': 'news',
            'news-detail.html': 'news',
            'profile.html': 'profile'
        };
        return pageMap[this.currentPage] || 'home';
    }

    // 显示认证模态框
    showAuthModal(type) {
        // 如果有认证模块，使用认证模块的方法
        if (window.authModule) {
            if (type === 'login') {
                window.authModule.openModal('loginModal');
            } else {
                window.authModule.openModal('registerModal');
            }
        } else {
            // 简单的回退处理
            alert(`请等待认证模块加载完成后再${type === 'login' ? '登录' : '注册'}`);
        }
    }

    // 处理退出登录
    async handleLogout() {
        if (window.authModule) {
            await window.authModule.logout();
        } else {
            // 简单的回退处理
            localStorage.removeItem('spinmatch_user');
            localStorage.removeItem('spinmatch_token');
            this.currentUser = null;
            this.updateUserNav();
            
            // 触发登出事件
            window.dispatchEvent(new CustomEvent('auth:logout'));
        }
    }

    // 切换移动端菜单
    toggleMobileMenu() {
        const mobileMenu = document.querySelector('.mobile-menu');
        if (mobileMenu) {
            mobileMenu.classList.toggle('show');
        }
    }

    // 处理窗口大小变化
    handleResize() {
        // 如果切换到桌面端，隐藏移动菜单
        if (window.innerWidth > 768) {
            const mobileMenu = document.querySelector('.mobile-menu');
            if (mobileMenu) {
                mobileMenu.classList.remove('show');
            }
        }
    }

    // 添加导航样式
    addNavigationStyles() {
        if (document.querySelector('style[data-navigation-module]')) return;

        const style = document.createElement('style');
        style.setAttribute('data-navigation-module', 'true');
        style.textContent = `
            .page-transitioning {
                opacity: 0.9;
                transition: opacity 0.15s ease;
            }

            .nav-list {
                display: flex;
                list-style: none;
                margin: 0;
                padding: 0;
                gap: 20px;
            }

            .nav-item {
                position: relative;
            }

            .nav-link {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 10px 16px;
                text-decoration: none;
                color: #333;
                border-radius: 6px;
                transition: all 0.2s ease;
            }

            .nav-link:hover {
                background: #f8f9fa;
                color: #dc3545;
            }

            .nav-item.active .nav-link {
                background: #dc3545;
                color: white;
            }

            .user-nav {
                position: relative;
            }

            .user-info {
                display: flex;
                align-items: center;
                gap: 10px;
                cursor: pointer;
                padding: 8px 12px;
                border-radius: 6px;
                transition: background 0.2s ease;
            }

            .user-info:hover {
                background: #f8f9fa;
            }

            .user-info:hover .user-dropdown {
                display: block;
            }

            .user-avatar {
                width: 32px;
                height: 32px;
                border-radius: 50%;
            }

            .user-name {
                font-weight: 500;
                color: #333;
            }

            .user-dropdown {
                display: none;
                position: absolute;
                top: 100%;
                right: 0;
                background: white;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                padding: 8px 0;
                min-width: 160px;
                z-index: 1000;
            }

            .dropdown-item {
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 10px 16px;
                text-decoration: none;
                color: #333;
                transition: background 0.2s ease;
            }

            .dropdown-item:hover {
                background: #f8f9fa;
            }

            .auth-buttons {
                display: flex;
                gap: 12px;
            }

            .btn-primary, .btn-secondary {
                padding: 8px 16px;
                border-radius: 6px;
                border: none;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
                transition: all 0.2s ease;
                text-decoration: none;
            }

            .btn-primary {
                background: #dc3545;
                color: white;
            }

            .btn-primary:hover {
                background: #c82333;
            }

            .btn-secondary {
                background: #f8f9fa;
                color: #333;
                border: 1px solid #dee2e6;
            }

            .btn-secondary:hover {
                background: #e9ecef;
            }

            .mobile-nav {
                display: none;
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                background: white;
                border-top: 1px solid #eee;
                padding: 8px 0;
                z-index: 1000;
            }

            .mobile-nav-item {
                display: flex;
                flex-direction: column;
                align-items: center;
                padding: 8px 4px;
                text-decoration: none;
                color: #666;
                font-size: 12px;
                transition: color 0.2s ease;
                flex: 1;
            }

            .mobile-nav-item i {
                font-size: 18px;
                margin-bottom: 4px;
            }

            .mobile-nav-item:hover,
            .mobile-nav-item.active {
                color: #dc3545;
            }

            @media (max-width: 768px) {
                .nav-list {
                    display: none;
                }

                .mobile-nav {
                    display: flex;
                }

                .user-dropdown {
                    right: auto;
                    left: 0;
                }

                body {
                    padding-bottom: 70px;
                }
            }
        `;
        document.head.appendChild(style);
    }

    // 公共方法
    updateUser(user) {
        this.currentUser = user;
        this.updateUserNav();
    }

    navigate(page) {
        window.location.href = page;
    }

    getCurrentPageInfo() {
        return {
            page: this.currentPage,
            id: this.getCurrentPageId()
        };
    }

    // 销毁模块
    destroy() {
        console.log('🧭 销毁导航模块');
        // 移除事件监听器和清理资源
    }
}

// 创建全局实例
const navigationModule = new NavigationModule();

// 导出到全局
window.navigationModule = navigationModule;

// 全局函数兼容
window.navigateTo = (page) => navigationModule.navigate(page);
window.updateNavUser = (user) => navigationModule.updateUser(user);

console.log('🧭 导航模块已加载'); 