/**
 * SpinMatch 认证模块 - 完全独立
 * 处理用户注册、登录、登出、状态管理等所有认证功能
 */

class AuthModule {
    constructor() {
        this.apiBaseUrl = this.detectApiUrl();
        this.currentUser = null;
        this.token = null;
        this.isLoggedIn = false;
        this.listeners = [];
        
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
        console.log('🔐 初始化认证模块');
        
        // 恢复登录状态
        await this.restoreLoginState();
        
        // 绑定事件
        this.bindEvents();
        
        // 初始化UI
        this.initUI();
        
        console.log('✅ 认证模块初始化完成');
    }

    // 恢复登录状态
    async restoreLoginState() {
        const token = localStorage.getItem('spinmatch_token');
        const userStr = localStorage.getItem('spinmatch_user');
        
        if (token && userStr) {
            try {
                this.token = token;
                this.currentUser = JSON.parse(userStr);
                this.isLoggedIn = true;
                
                console.log('✅ 恢复登录状态:', this.currentUser.username || this.currentUser.name);
                
                // 触发登录事件
                this.emit('login', this.currentUser);
                
                // 更新UI
                this.updateUI();
                
            } catch (error) {
                console.error('会话恢复失败:', error);
                this.clearSession();
            }
        }
    }

    // 绑定事件
    bindEvents() {
        // 登录表单提交
        document.addEventListener('submit', (e) => {
            if (e.target.closest('#loginModal form')) {
                e.preventDefault();
                this.handleLogin();
            } else if (e.target.closest('#registerModal form')) {
                e.preventDefault();
                this.handleRegister();
            }
        });

        // 登出按钮
        document.addEventListener('click', (e) => {
            if (e.target.closest('.logout-btn, .btn-logout')) {
                e.preventDefault();
                this.handleLogout();
            }
        });
    }

    // 初始化UI
    initUI() {
        this.updateUI();
        this.addAuthStyles();
    }

    // 处理登录
    async handleLogin() {
        try {
            const email = document.getElementById('loginEmail')?.value?.trim();
            const password = document.getElementById('loginPassword')?.value;

            if (!email || !password) {
                this.showNotification('请填写邮箱和密码', 'error');
                return;
            }

            this.showNotification('正在登录...');
            
            try {
                // 尝试API登录
                const response = await fetch(`${this.apiBaseUrl}/api/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    await this.performLogin(result.user, result.token);
                    this.closeModal('loginModal');
                    this.showNotification(`欢迎回来，${result.user.username || result.user.name}！`, 'success');
                    return;
                }
            } catch (error) {
                console.warn('API登录失败，尝试本地验证:', error);
            }
            
            // 本地验证
            const user = this.findLocalUser(email, password);
            if (user) {
                await this.performLogin(user);
                this.closeModal('loginModal');
                this.showNotification(`欢迎回来，${user.name || user.username}！`, 'success');
            } else {
                this.showNotification('邮箱或密码错误', 'error');
            }
            
        } catch (error) {
            console.error('登录失败:', error);
            this.showNotification('登录失败，请重试', 'error');
        }
    }

    // 处理注册
    async handleRegister() {
        try {
            const name = document.getElementById('registerName')?.value?.trim();
            const email = document.getElementById('registerEmail')?.value?.trim();
            const password = document.getElementById('registerPassword')?.value;
            const level = document.getElementById('registerLevel')?.value || 'beginner';

            if (!name || !email || !password) {
                this.showNotification('请填写完整信息', 'error');
                return;
            }

            if (password.length < 6) {
                this.showNotification('密码长度至少6位', 'error');
                return;
            }

            this.showNotification('正在注册...');

            // 检查邮箱是否已被注册
            if (this.isEmailRegistered(email)) {
                this.showNotification('邮箱已被注册', 'error');
                return;
            }

            const userData = {
                id: Date.now(),
                name,
                username: name,
                email,
                password,
                level,
                avatar: this.generateAvatar(name),
                createdAt: new Date().toISOString()
            };

            try {
                // 尝试API注册
                const response = await fetch(`${this.apiBaseUrl}/api/auth/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        username: name,
                        email,
                        password,
                        level
                    })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    await this.performLogin(result.user, result.token);
                    this.closeModal('registerModal');
                    this.showNotification(`注册成功，欢迎加入SpinMatch，${result.user.username}！`, 'success');
                    return;
                }
            } catch (error) {
                console.warn('API注册失败，使用本地注册:', error);
            }

            // 本地注册
            this.saveLocalUser(userData);
            await this.performLogin(userData);
            this.closeModal('registerModal');
            this.showNotification(`注册成功，欢迎加入SpinMatch，${name}！`, 'success');
            
        } catch (error) {
            console.error('注册失败:', error);
            this.showNotification('注册失败，请重试', 'error');
        }
    }

    // 处理登出
    async handleLogout() {
        if (confirm('确定要退出登录吗？')) {
            this.clearSession();
            this.updateUI();
            this.emit('logout');
            this.showNotification('已退出登录', 'info');
            
            // 刷新页面或跳转到首页
            if (window.location.pathname.includes('profile.html')) {
                window.location.href = 'index.html';
            } else {
                window.location.reload();
            }
        }
    }

    // 执行登录
    async performLogin(user, token = null) {
        this.currentUser = {
            id: user.id,
            name: user.name || user.username,
            username: user.username || user.name,
            email: user.email,
            avatar: user.avatar,
            level: user.level || user.skill_level,
            location: user.location,
            bio: user.bio,
            phone: user.phone
        };
        this.isLoggedIn = true;
        this.token = token;
        
        // 保存到本地存储
        localStorage.setItem('spinmatch_user', JSON.stringify(this.currentUser));
        if (token) {
            localStorage.setItem('spinmatch_token', token);
        }
        
        // 更新UI
        this.updateUI();
        
        // 触发登录事件
        this.emit('login', this.currentUser);
        
        console.log('✅ 用户登录成功:', this.currentUser.name);
    }

    // 清除会话
    clearSession() {
        this.currentUser = null;
        this.token = null;
        this.isLoggedIn = false;
        
        localStorage.removeItem('spinmatch_user');
        localStorage.removeItem('spinmatch_token');
    }

    // 查找本地用户
    findLocalUser(email, password) {
        const users = JSON.parse(localStorage.getItem('spinmatch_registered_users') || '[]');
        return users.find(user => user.email === email && user.password === password);
    }

    // 检查邮箱是否已注册
    isEmailRegistered(email) {
        const users = JSON.parse(localStorage.getItem('spinmatch_registered_users') || '[]');
        return users.some(user => user.email === email);
    }

    // 保存本地用户
    saveLocalUser(userData) {
        const users = JSON.parse(localStorage.getItem('spinmatch_registered_users') || '[]');
        users.push(userData);
        localStorage.setItem('spinmatch_registered_users', JSON.stringify(users));
    }

    // 生成头像
    generateAvatar(name) {
        const colors = ['#FF6B35', '#DC143C', '#FFD700', '#32CD32', '#1E90FF', '#9370DB'];
        const color = colors[name.charCodeAt(0) % colors.length];
        const initial = name.charAt(0).toUpperCase();
        
        return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'%3E%3Ccircle cx='60' cy='60' r='60' fill='${encodeURIComponent(color)}'/%3E%3Ctext x='60' y='75' text-anchor='middle' fill='white' font-size='40' font-family='Arial'%3E${initial}%3C/text%3E%3C/svg%3E`;
    }

    // 更新UI
    updateUI() {
        // 更新导航栏
        const navAuth = document.querySelector('.nav-auth');
        if (navAuth) {
            if (this.isLoggedIn && this.currentUser) {
                navAuth.innerHTML = `
                    <div class="user-menu">
                        <span class="username">欢迎，${this.currentUser.username || this.currentUser.name}</span>
                        <button class="btn-logout">退出登录</button>
                    </div>
                `;
            } else {
                navAuth.innerHTML = `
                    <button class="btn-login" onclick="authModule.openModal('loginModal')">登录</button>
                    <button class="btn-register" onclick="authModule.openModal('registerModal')">注册</button>
                `;
            }
        }

        // 更新用户头像和信息
        this.updateUserElements();
    }

    // 更新用户相关元素
    updateUserElements() {
        if (!this.isLoggedIn || !this.currentUser) return;

        // 更新所有用户名显示
        document.querySelectorAll('.user-name, .username, #userName').forEach(el => {
            el.textContent = this.currentUser.name || this.currentUser.username;
        });

        // 更新所有头像
        document.querySelectorAll('.user-avatar, .nav-avatar, #userAvatar').forEach(el => {
            if (this.currentUser.avatar) {
                el.src = this.currentUser.avatar;
            }
        });

        // 更新用户级别
        document.querySelectorAll('.user-level').forEach(el => {
            el.textContent = this.getLevelText(this.currentUser.level);
            el.className = `user-level ${this.currentUser.level}`;
        });
    }

    // 获取级别文本
    getLevelText(level) {
        const levels = {
            'beginner': '初学者',
            'intermediate': '中级',
            'advanced': '高级',
            'professional': '专业'
        };
        return levels[level] || '初学者';
    }

    // 事件系统
    on(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    }

    emit(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => callback(data));
        }
        
        // 触发全局事件
        window.dispatchEvent(new CustomEvent(`auth:${event}`, { detail: data }));
    }

    // 模态框控制
    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('show');
            modal.style.display = 'flex';
            modal.style.zIndex = '10000';
            document.body.style.overflow = 'hidden';
            console.log('✅ 模态框已打开:', modalId);
        } else {
            console.error('❌ 找不到模态框:', modalId);
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('show');
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
            console.log('✅ 模态框已关闭:', modalId);
        } else {
            console.error('❌ 找不到模态框:', modalId);
        }
    }

    // 通知系统
    showNotification(message, type = 'info', duration = 5000) {
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
    addAuthStyles() {
        if (document.querySelector('style[data-auth-module]')) return;

        const style = document.createElement('style');
        style.setAttribute('data-auth-module', 'true');
        style.textContent = `
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

            .notification-success .fas { color: #28a745; }
            .notification-error .fas { color: #dc3545; }
            .notification-warning .fas { color: #ffc107; }
            .notification-info .fas { color: #17a2b8; }

            .user-menu {
                display: flex;
                align-items: center;
                gap: 15px;
            }

            .username {
                color: #333;
                font-weight: 500;
            }

            .btn-logout {
                background: #dc3545;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
            }

            .btn-logout:hover {
                background: #c82333;
            }
        `;
        document.head.appendChild(style);
    }

    // 公共API方法
    getCurrentUser() {
        return this.currentUser;
    }

    getToken() {
        return this.token;
    }

    isUserLoggedIn() {
        return this.isLoggedIn;
    }

    getAuthHeaders() {
        return this.token ? { 'Authorization': `Bearer ${this.token}` } : {};
    }
}

// 创建全局实例
const authModule = new AuthModule();

// 导出到全局
window.authModule = authModule;
window.spinmatchAuth = authModule; // 兼容性别名

// 全局函数兼容
window.openModal = (modalId) => authModule.openModal(modalId);
window.closeModal = (modalId) => authModule.closeModal(modalId);
window.switchModal = (from, to) => {
    authModule.closeModal(from);
    authModule.openModal(to);
};

console.log('🔐 认证模块已加载'); 