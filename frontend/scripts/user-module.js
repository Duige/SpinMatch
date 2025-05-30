/**
 * SpinMatch 用户模块 - 完全独立
 * 个人资料管理、用户信息编辑、头像更换等功能
 */

class UserModule {
    constructor() {
        this.apiBaseUrl = this.detectApiUrl();
        this.currentUser = null;
        this.defaultAvatars = [
            '🏓', '🏆', '🎯', '⚡', '🔥', '💪', 
            '🌟', '🎪', '🎨', '🎵', '🚀', '⭐'
        ];
        
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
    init() {
        console.log('👤 初始化用户模块');
        
        // 加载当前用户
        this.loadCurrentUser();
        
        // 绑定事件
        this.bindEvents();
        
        // 初始化页面功能
        this.initPageFeatures();
        
        // 添加样式
        this.addUserStyles();
        
        // 监听认证状态变化
        window.addEventListener('auth:login', (e) => {
            this.currentUser = e.detail;
            this.loadUserProfile();
        });

        window.addEventListener('auth:logout', () => {
            this.currentUser = null;
            this.clearUserProfile();
        });
        
        console.log('✅ 用户模块初始化完成');
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
        // 个人资料编辑
        document.addEventListener('click', (e) => {
            // 编辑资料按钮
            if (e.target.closest('.edit-profile-btn')) {
                e.preventDefault();
                this.editProfile();
            }

            // 保存资料按钮
            if (e.target.closest('.save-profile-btn')) {
                e.preventDefault();
                this.saveProfile();
            }

            // 头像更换
            if (e.target.closest('.avatar-container') || e.target.closest('.avatar-overlay')) {
                e.preventDefault();
                this.changeAvatar();
            }

            // 标签页切换
            if (e.target.closest('.tab-btn')) {
                e.preventDefault();
                this.switchTab(e.target.closest('.tab-btn'));
            }

            // 筛选按钮
            if (e.target.closest('.filter-btn')) {
                e.preventDefault();
                this.handleFilter(e.target.closest('.filter-btn'));
            }

            // 关闭模态框
            if (e.target.closest('.close-modal') || e.target.closest('.modal-overlay')) {
                e.preventDefault();
                this.closeModal();
            }
        });

        // 表单提交
        document.addEventListener('submit', (e) => {
            if (e.target.closest('#editProfileForm')) {
                e.preventDefault();
                this.saveProfile();
            }
        });
    }

    // 初始化页面功能
    initPageFeatures() {
        // 检查是否在个人中心页面
        if (this.getCurrentPage() === 'profile') {
            this.initTabs();
            this.initFilters();
            this.loadUserProfile();
        }
    }

    // 获取当前页面
    getCurrentPage() {
        const path = window.location.pathname;
        if (path.includes('profile')) return 'profile';
        return 'other';
    }

    // 初始化标签页
    initTabs() {
        const tabBtns = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');

        // 设置默认活动标签页
        if (tabBtns.length > 0 && !document.querySelector('.tab-btn.active')) {
            tabBtns[0].classList.add('active');
            if (tabContents.length > 0) {
                tabContents[0].classList.add('active');
            }
        }
    }

    // 初始化筛选功能
    initFilters() {
        const filterBtns = document.querySelectorAll('.filter-btn');
        
        // 设置默认筛选状态
        filterBtns.forEach(btn => {
            const filterType = btn.getAttribute('data-filter');
            if (filterType === 'all' && !btn.classList.contains('active')) {
                btn.classList.add('active');
            }
        });
    }

    // 切换标签页
    switchTab(tabBtn) {
        const targetTab = tabBtn.getAttribute('data-tab');
        
        // 移除所有活动状态
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        
        // 添加活动状态
        tabBtn.classList.add('active');
        const targetContent = document.getElementById(targetTab);
        if (targetContent) {
            targetContent.classList.add('active');
        }

        // 加载对应内容
        this.loadTabContent(targetTab);
    }

    // 加载标签页内容
    loadTabContent(tabName) {
        switch (tabName) {
            case 'myBookings':
                this.loadMyBookings();
                break;
            case 'myRecords':
                this.loadMyRecords();
                break;
            case 'achievements':
                this.loadAchievements();
                break;
            case 'settings':
                this.loadSettings();
                break;
        }
    }

    // 处理筛选
    handleFilter(filterBtn) {
        const filterType = filterBtn.getAttribute('data-filter');
        const parentSection = filterBtn.closest('.tab-content');
        
        // 更新筛选按钮状态
        const siblingBtns = filterBtn.parentElement.querySelectorAll('.filter-btn');
        siblingBtns.forEach(btn => btn.classList.remove('active'));
        filterBtn.classList.add('active');
        
        // 执行筛选
        this.filterRecords(parentSection, filterType);
    }

    // 筛选记录
    filterRecords(section, filterType) {
        const records = section.querySelectorAll('.record-item');
        
        records.forEach(record => {
            if (filterType === 'all') {
                record.style.display = 'flex';
            } else {
                const hasClass = record.classList.contains(filterType);
                record.style.display = hasClass ? 'flex' : 'none';
            }
        });
    }

    // 加载用户资料
    loadUserProfile() {
        if (!this.currentUser) {
            this.showLoginPrompt();
            return;
        }

        console.log('加载用户资料:', this.currentUser);
        
        // 更新头像
        this.updateUserAvatar();
        
        // 更新基本信息
        this.updateBasicInfo();
        
        // 更新统计信息
        this.updateUserStats();
        
        // 加载用户内容
        this.loadUserContent();
    }

    // 更新用户头像
    updateUserAvatar() {
        const avatarElements = document.querySelectorAll('.user-avatar, .profile-avatar');
        const avatarUrl = this.currentUser.avatar || this.generateAvatar(this.currentUser.name);
        
        avatarElements.forEach(element => {
            if (element.tagName === 'IMG') {
                element.src = avatarUrl;
            } else {
                element.style.backgroundImage = `url(${avatarUrl})`;
            }
        });
    }

    // 更新基本信息
    updateBasicInfo() {
        const updateElement = (selector, value) => {
            const element = document.querySelector(selector);
            if (element) {
                element.textContent = value || '';
            }
        };

        updateElement('.user-name', this.currentUser.name);
        updateElement('.user-title', this.currentUser.title || '乒乓球爱好者');
        updateElement('.user-level', this.getLevelText(this.currentUser.level));
        updateElement('.user-location', this.currentUser.location || '未设置');
        updateElement('.user-bio', this.currentUser.bio || '这个人很懒，什么都没留下...');
        updateElement('.user-email', this.currentUser.email);
        updateElement('.user-phone', this.currentUser.phone || '未设置');
    }

    // 更新用户统计
    updateUserStats() {
        const stats = this.currentUser.stats || {};
        
        const updateStat = (selector, value) => {
            const element = document.querySelector(selector);
            if (element) {
                element.textContent = value || '0';
            }
        };

        updateStat('.total-bookings', stats.totalBookings || this.generateRandomStat(5, 50));
        updateStat('.total-matches', stats.totalMatches || this.generateRandomStat(10, 100));
        updateStat('.win-rate', stats.winRate || this.generateRandomWinRate());
        updateStat('.total-score', stats.totalScore || this.generateRandomStat(100, 2000));
    }

    // 生成随机统计数据
    generateRandomStat(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    // 生成随机胜率
    generateRandomWinRate() {
        const rate = (Math.random() * 0.4 + 0.3) * 100; // 30-70%
        return rate.toFixed(1) + '%';
    }

    // 加载用户内容
    loadUserContent() {
        this.loadMyBookings();
        this.loadMyRecords();
        this.loadAchievements();
    }

    // 加载我的约球
    loadMyBookings() {
        const bookingsContainer = document.querySelector('#myBookings .content-grid');
        if (!bookingsContainer) return;

        const bookings = this.generateMockBookings();
        
        bookingsContainer.innerHTML = bookings.map(booking => `
            <div class="record-item ${booking.status}" data-id="${booking.id}">
                <div class="record-header">
                    <h4>${booking.title}</h4>
                    <span class="status-badge ${booking.status}">${this.getStatusText(booking.status)}</span>
                </div>
                <div class="record-details">
                    <p><i class="fas fa-calendar"></i> ${booking.date}</p>
                    <p><i class="fas fa-clock"></i> ${booking.time}</p>
                    <p><i class="fas fa-map-marker-alt"></i> ${booking.location}</p>
                    <p><i class="fas fa-users"></i> ${booking.participants}/${booking.maxParticipants}人</p>
                </div>
                <div class="record-actions">
                    <button class="btn btn-sm" onclick="viewBookingDetails('${booking.id}')">查看详情</button>
                    ${booking.status === 'pending' ? `<button class="btn btn-sm btn-danger" onclick="cancelBooking('${booking.id}')">取消约球</button>` : ''}
                </div>
            </div>
        `).join('');
    }

    // 加载比赛记录
    loadMyRecords() {
        const recordsContainer = document.querySelector('#myRecords .content-grid');
        if (!recordsContainer) return;

        const records = this.generateMockRecords();
        
        recordsContainer.innerHTML = records.map(record => `
            <div class="record-item ${record.result}" data-id="${record.id}">
                <div class="record-header">
                    <h4>VS ${record.opponent}</h4>
                    <span class="result-badge ${record.result}">${this.getResultText(record.result)}</span>
                </div>
                <div class="record-details">
                    <p><i class="fas fa-calendar"></i> ${record.date}</p>
                    <p><i class="fas fa-trophy"></i> 比分: ${record.score}</p>
                    <p><i class="fas fa-clock"></i> 用时: ${record.duration}</p>
                    <p><i class="fas fa-star"></i> 评分: ${record.rating}/5.0</p>
                </div>
                <div class="record-actions">
                    <button class="btn btn-sm" onclick="viewRecordDetails('${record.id}')">查看详情</button>
                </div>
            </div>
        `).join('');
    }

    // 加载成就
    loadAchievements() {
        const achievementsContainer = document.querySelector('#achievements .content-grid');
        if (!achievementsContainer) return;

        const achievements = this.generateMockAchievements();
        
        achievementsContainer.innerHTML = achievements.map(achievement => `
            <div class="achievement-item ${achievement.unlocked ? 'unlocked' : 'locked'}">
                <div class="achievement-icon">
                    <i class="fas fa-${achievement.icon}"></i>
                </div>
                <div class="achievement-info">
                    <h4>${achievement.title}</h4>
                    <p>${achievement.description}</p>
                    ${achievement.unlocked ? `<span class="unlock-date">获得于 ${achievement.unlockDate}</span>` : `<span class="progress">${achievement.progress}%</span>`}
                </div>
            </div>
        `).join('');
    }

    // 生成模拟约球数据
    generateMockBookings() {
        const statuses = ['pending', 'confirmed', 'completed', 'cancelled'];
        const locations = ['体育馆A', '社区中心', '学校体育馆', '俱乐部'];
        
        return Array.from({ length: 8 }, (_, i) => ({
            id: `booking_${i + 1}`,
            title: `约球 #${i + 1}`,
            date: new Date(Date.now() + (i - 4) * 24 * 60 * 60 * 1000).toLocaleDateString(),
            time: ['09:00-11:00', '14:00-16:00', '19:00-21:00'][i % 3],
            location: locations[i % locations.length],
            participants: Math.floor(Math.random() * 4) + 1,
            maxParticipants: 4,
            status: statuses[i % statuses.length]
        }));
    }

    // 生成模拟比赛记录
    generateMockRecords() {
        const opponents = ['张三', '李四', '王五', '赵六', '钱七', '孙八'];
        const results = ['win', 'lose', 'draw'];
        
        return Array.from({ length: 12 }, (_, i) => ({
            id: `record_${i + 1}`,
            opponent: opponents[i % opponents.length],
            date: new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
            score: this.generateRandomScore(),
            duration: `${Math.floor(Math.random() * 60) + 30}分钟`,
            rating: (Math.random() * 2 + 3).toFixed(1),
            result: results[i % results.length]
        }));
    }

    // 生成模拟成就
    generateMockAchievements() {
        const allAchievements = [
            { icon: 'trophy', title: '初出茅庐', description: '完成第一场比赛', unlocked: true },
            { icon: 'fire', title: '连胜达人', description: '连续获胜5场', unlocked: true },
            { icon: 'star', title: '技术高手', description: '获得5星评价10次', unlocked: false, progress: 60 },
            { icon: 'users', title: '社交达人', description: '与50位不同球友对战', unlocked: false, progress: 30 },
            { icon: 'clock', title: '勤奋球员', description: '累计游戏时间100小时', unlocked: true },
            { icon: 'medal', title: '比赛冠军', description: '获得比赛第一名', unlocked: false, progress: 0 }
        ];

        return allAchievements.map((achievement, index) => ({
            ...achievement,
            unlockDate: achievement.unlocked ? 
                new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toLocaleDateString() : 
                null
        }));
    }

    // 生成随机比分
    generateRandomScore() {
        const myScore = Math.floor(Math.random() * 4) + 1;
        const opponentScore = Math.floor(Math.random() * 4) + 1;
        return `${myScore}:${opponentScore}`;
    }

    // 编辑资料
    editProfile() {
        if (!this.currentUser) {
            this.showNotification('请先登录后再编辑资料', 'error');
            return;
        }

        // 创建编辑模态框
        this.createEditModal();
        
        // 填充表单数据
        this.fillEditForm();
        
        // 显示模态框
        this.openModal('editProfileModal');
    }

    // 创建编辑模态框
    createEditModal() {
        let modal = document.getElementById('editProfileModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'editProfileModal';
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-overlay"></div>
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>编辑个人资料</h3>
                        <button class="close-modal">×</button>
                    </div>
                    <form id="editProfileForm" class="edit-form">
                        <div class="form-group">
                            <label for="editName">姓名</label>
                            <input type="text" id="editName" name="name" required>
                        </div>
                        <div class="form-group">
                            <label for="editTitle">个人简介</label>
                            <input type="text" id="editTitle" name="title" placeholder="例如：乒乓球爱好者">
                        </div>
                        <div class="form-group">
                            <label for="editLevel">技术等级</label>
                            <select id="editLevel" name="level">
                                <option value="beginner">初学者</option>
                                <option value="intermediate">中级</option>
                                <option value="advanced">高级</option>
                                <option value="professional">专业</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="editLocation">所在地区</label>
                            <input type="text" id="editLocation" name="location" placeholder="例如：北京市朝阳区">
                        </div>
                        <div class="form-group">
                            <label for="editBio">个人介绍</label>
                            <textarea id="editBio" name="bio" rows="3" placeholder="介绍一下自己..."></textarea>
                        </div>
                        <div class="form-group">
                            <label for="editPhone">联系电话</label>
                            <input type="tel" id="editPhone" name="phone" placeholder="手机号码">
                        </div>
                        <div class="form-actions">
                            <button type="button" class="btn btn-secondary close-modal">取消</button>
                            <button type="submit" class="btn btn-primary save-profile-btn">保存</button>
                        </div>
                    </form>
                </div>
            `;
            document.body.appendChild(modal);
        }
    }

    // 填充编辑表单
    fillEditForm() {
        const fillElement = (id, value) => {
            const element = document.getElementById(id);
            if (element) {
                element.value = value || '';
            }
        };

        fillElement('editName', this.currentUser.name);
        fillElement('editTitle', this.currentUser.title);
        fillElement('editLevel', this.currentUser.level);
        fillElement('editLocation', this.currentUser.location);
        fillElement('editBio', this.currentUser.bio);
        fillElement('editPhone', this.currentUser.phone);
    }

    // 保存资料
    async saveProfile() {
        const form = document.getElementById('editProfileForm');
        if (!form) return;

        const formData = new FormData(form);
        const updateData = {};
        
        for (let [key, value] of formData.entries()) {
            updateData[key] = value;
        }

        try {
            // 更新本地用户数据
            Object.assign(this.currentUser, updateData);
            
            // 保存到localStorage
            localStorage.setItem('spinmatch_user', JSON.stringify(this.currentUser));
            
            // 尝试保存到服务器
            await this.saveToServer(updateData);
            
            // 重新加载用户资料显示
            this.loadUserProfile();
            
            // 关闭模态框
            this.closeModal('editProfileModal');
            
            // 发送更新事件
            window.dispatchEvent(new CustomEvent('user:updated', { detail: this.currentUser }));
            
            this.showNotification('个人资料已更新', 'success');
            
        } catch (error) {
            console.error('保存资料失败:', error);
            this.showNotification('保存失败，请稍后重试', 'error');
        }
    }

    // 保存到服务器
    async saveToServer(data) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/user/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('spinmatch_token')}`
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error(`HTTP错误: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.warn('保存到服务器失败:', error);
            // 离线模式下静默失败
        }
    }

    // 更换头像
    changeAvatar() {
        if (!this.currentUser) {
            this.showNotification('请先登录后再更换头像', 'error');
            return;
        }

        // 创建头像选择模态框
        this.createAvatarModal();
        this.openModal('avatarModal');
    }

    // 创建头像选择模态框
    createAvatarModal() {
        let modal = document.getElementById('avatarModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'avatarModal';
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-overlay"></div>
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>选择头像</h3>
                        <button class="close-modal">×</button>
                    </div>
                    <div class="avatar-options">
                        ${this.defaultAvatars.map(emoji => `
                            <div class="avatar-option" data-avatar="${emoji}">
                                <div class="emoji-avatar">${emoji}</div>
                            </div>
                        `).join('')}
                    </div>
                    <div class="upload-section">
                        <p>或上传自定义头像</p>
                        <input type="file" id="avatarUpload" accept="image/*" style="display: none;">
                        <button class="btn btn-secondary" onclick="document.getElementById('avatarUpload').click()">
                            <i class="fas fa-upload"></i> 上传图片
                        </button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

            // 绑定头像选择事件
            modal.addEventListener('click', (e) => {
                if (e.target.closest('.avatar-option')) {
                    const avatarData = e.target.closest('.avatar-option').dataset.avatar;
                    this.selectAvatar(avatarData);
                }
            });

            // 绑定文件上传事件
            const fileInput = modal.querySelector('#avatarUpload');
            fileInput.addEventListener('change', (e) => {
                this.handleAvatarUpload(e.target.files[0]);
            });
        }
    }

    // 选择头像
    selectAvatar(avatarData) {
        const avatarUrl = this.generateEmojiAvatar(avatarData);
        this.updateUserAvatar(avatarUrl);
        this.closeModal('avatarModal');
        this.showNotification('头像已更新', 'success');
    }

    // 处理头像上传
    handleAvatarUpload(file) {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const avatarUrl = e.target.result;
            this.updateUserAvatar(avatarUrl);
            this.closeModal('avatarModal');
            this.showNotification('头像已更新', 'success');
        };
        reader.readAsDataURL(file);
    }

    // 更新用户头像（内部方法）
    updateUserAvatar(avatarUrl) {
        // 更新当前用户数据
        this.currentUser.avatar = avatarUrl;
        
        // 保存到localStorage
        localStorage.setItem('spinmatch_user', JSON.stringify(this.currentUser));
        
        // 更新页面显示
        const avatarElements = document.querySelectorAll('.user-avatar, .profile-avatar');
        avatarElements.forEach(element => {
            if (element.tagName === 'IMG') {
                element.src = avatarUrl;
            } else {
                element.style.backgroundImage = `url(${avatarUrl})`;
            }
        });

        // 发送更新事件
        window.dispatchEvent(new CustomEvent('user:updated', { detail: this.currentUser }));
    }

    // 生成emoji头像
    generateEmojiAvatar(emoji) {
        return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Ccircle cx='40' cy='40' r='40' fill='%23f0f0f0'/%3E%3Ctext x='40' y='52' text-anchor='middle' font-size='32'%3E${emoji}%3C/text%3E%3C/svg%3E`;
    }

    // 生成头像
    generateAvatar(name) {
        const colors = ['#FF6B35', '#DC143C', '#FFD700', '#32CD32', '#1E90FF', '#9370DB'];
        const color = colors[name.charCodeAt(0) % colors.length];
        const initial = name.charAt(0);
        
        return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Ccircle cx='40' cy='40' r='40' fill='${encodeURIComponent(color)}'/%3E%3Ctext x='40' y='52' text-anchor='middle' fill='white' font-size='24' font-family='Arial'%3E${initial}%3C/text%3E%3C/svg%3E`;
    }

    // 获取等级文本
    getLevelText(level) {
        const levels = {
            'beginner': '初学者',
            'intermediate': '中级',
            'advanced': '高级',
            'professional': '专业'
        };
        return levels[level] || '未设置';
    }

    // 获取状态文本
    getStatusText(status) {
        const statuses = {
            'pending': '待确认',
            'confirmed': '已确认',
            'completed': '已完成',
            'cancelled': '已取消'
        };
        return statuses[status] || status;
    }

    // 获取结果文本
    getResultText(result) {
        const results = {
            'win': '胜利',
            'lose': '失败',
            'draw': '平局'
        };
        return results[result] || result;
    }

    // 显示登录提示
    showLoginPrompt() {
        const profileContent = document.querySelector('.profile-content');
        if (profileContent) {
            profileContent.innerHTML = `
                <div class="login-prompt">
                    <div class="prompt-icon">
                        <i class="fas fa-user-circle"></i>
                    </div>
                    <h3>请先登录</h3>
                    <p>登录后可以查看和编辑个人资料</p>
                    <button class="btn btn-primary" onclick="showLoginModal()">立即登录</button>
                </div>
            `;
        }
    }

    // 清除用户资料
    clearUserProfile() {
        // 清空用户信息显示
        const clearElement = (selector) => {
            const element = document.querySelector(selector);
            if (element) {
                element.textContent = '';
            }
        };

        clearElement('.user-name');
        clearElement('.user-title');
        clearElement('.user-level');
        clearElement('.user-location');
        clearElement('.user-bio');

        // 显示登录提示
        this.showLoginPrompt();
    }

    // 打开模态框
    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    }

    // 关闭模态框
    closeModal(modalId) {
        if (modalId) {
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.style.display = 'none';
            }
        } else {
            // 关闭所有模态框
            document.querySelectorAll('.modal').forEach(modal => {
                modal.style.display = 'none';
            });
        }
        document.body.style.overflow = 'auto';
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
    addUserStyles() {
        if (document.querySelector('style[data-user-module]')) return;

        const style = document.createElement('style');
        style.setAttribute('data-user-module', 'true');
        style.textContent = `
            .modal {
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 10000;
                align-items: center;
                justify-content: center;
            }

            .modal-overlay {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.5);
            }

            .modal-content {
                position: relative;
                background: white;
                border-radius: 12px;
                width: 90%;
                max-width: 500px;
                max-height: 90vh;
                overflow-y: auto;
                box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            }

            .modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 20px;
                border-bottom: 1px solid #eee;
            }

            .modal-header h3 {
                margin: 0;
                color: #333;
            }

            .close-modal {
                background: none;
                border: none;
                font-size: 24px;
                color: #666;
                cursor: pointer;
                padding: 0;
                width: 30px;
                height: 30px;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .edit-form {
                padding: 20px;
            }

            .form-group {
                margin-bottom: 20px;
            }

            .form-group label {
                display: block;
                margin-bottom: 5px;
                font-weight: 600;
                color: #333;
            }

            .form-group input,
            .form-group select,
            .form-group textarea {
                width: 100%;
                padding: 10px 12px;
                border: 1px solid #ddd;
                border-radius: 6px;
                font-size: 14px;
                transition: border-color 0.2s ease;
            }

            .form-group input:focus,
            .form-group select:focus,
            .form-group textarea:focus {
                outline: none;
                border-color: #dc3545;
            }

            .form-actions {
                display: flex;
                gap: 10px;
                justify-content: flex-end;
                padding-top: 20px;
                border-top: 1px solid #eee;
            }

            .avatar-options {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 15px;
                padding: 20px;
            }

            .avatar-option {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 60px;
                height: 60px;
                border-radius: 50%;
                background: #f8f9fa;
                cursor: pointer;
                transition: all 0.2s ease;
                margin: 0 auto;
            }

            .avatar-option:hover {
                background: #e9ecef;
                transform: scale(1.1);
            }

            .emoji-avatar {
                font-size: 28px;
            }

            .upload-section {
                padding: 20px;
                text-align: center;
                border-top: 1px solid #eee;
            }

            .upload-section p {
                margin-bottom: 15px;
                color: #666;
            }

            .login-prompt {
                text-align: center;
                padding: 60px 20px;
                color: #666;
            }

            .prompt-icon {
                font-size: 64px;
                color: #ddd;
                margin-bottom: 20px;
            }

            .login-prompt h3 {
                margin-bottom: 10px;
                color: #333;
            }

            .login-prompt p {
                margin-bottom: 30px;
            }

            .content-grid {
                display: grid;
                gap: 20px;
                grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            }

            .record-item {
                background: white;
                border-radius: 12px;
                padding: 20px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                transition: transform 0.2s ease;
            }

            .record-item:hover {
                transform: translateY(-2px);
            }

            .record-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 15px;
            }

            .record-header h4 {
                margin: 0;
                color: #333;
            }

            .status-badge,
            .result-badge {
                padding: 4px 8px;
                border-radius: 12px;
                font-size: 12px;
                font-weight: 600;
            }

            .status-badge.pending { background: #fff3cd; color: #856404; }
            .status-badge.confirmed { background: #d4edda; color: #155724; }
            .status-badge.completed { background: #cce5ff; color: #004085; }
            .status-badge.cancelled { background: #f8d7da; color: #721c24; }

            .result-badge.win { background: #d4edda; color: #155724; }
            .result-badge.lose { background: #f8d7da; color: #721c24; }
            .result-badge.draw { background: #e2e3e5; color: #383d41; }

            .record-details p {
                margin: 8px 0;
                color: #666;
                font-size: 14px;
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .record-actions {
                margin-top: 15px;
                display: flex;
                gap: 10px;
            }

            .achievement-item {
                background: white;
                border-radius: 12px;
                padding: 20px;
                display: flex;
                align-items: center;
                gap: 15px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                transition: transform 0.2s ease;
            }

            .achievement-item:hover {
                transform: translateY(-2px);
            }

            .achievement-item.locked {
                opacity: 0.6;
            }

            .achievement-icon {
                width: 50px;
                height: 50px;
                border-radius: 50%;
                background: linear-gradient(135deg, #dc3545, #e74c3c);
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 20px;
            }

            .achievement-item.locked .achievement-icon {
                background: #ccc;
            }

            .achievement-info h4 {
                margin: 0 0 5px 0;
                color: #333;
            }

            .achievement-info p {
                margin: 0 0 5px 0;
                color: #666;
                font-size: 14px;
            }

            .unlock-date {
                font-size: 12px;
                color: #28a745;
            }

            .progress {
                font-size: 12px;
                color: #666;
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

            @media (max-width: 768px) {
                .modal-content {
                    width: 95%;
                    margin: 20px;
                }

                .content-grid {
                    grid-template-columns: 1fr;
                }

                .avatar-options {
                    grid-template-columns: repeat(3, 1fr);
                }
            }
        `;
        document.head.appendChild(style);
    }

    // 公共API方法
    getCurrentUser() {
        return this.currentUser;
    }

    updateUser(userData) {
        this.currentUser = userData;
        this.loadUserProfile();
    }

    refreshProfile() {
        this.loadUserProfile();
    }

    // 销毁模块
    destroy() {
        console.log('👤 销毁用户模块');
        this.closeModal();
    }
}

// 创建全局实例
const userModule = new UserModule();

// 导出到全局
window.userModule = userModule;

// 全局函数兼容
window.editProfile = () => userModule.editProfile();
window.changeAvatar = () => userModule.changeAvatar();
window.viewBookingDetails = (id) => console.log('查看约球详情:', id);
window.cancelBooking = (id) => console.log('取消约球:', id);
window.viewRecordDetails = (id) => console.log('查看比赛详情:', id);

console.log('👤 用户模块已加载'); 