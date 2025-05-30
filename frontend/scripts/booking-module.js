/**
 * SpinMatch 约球模块 - 完全独立
 * 处理约球发布、搜索、加入、聊天等所有约球相关功能
 */

class BookingModule {
    constructor() {
        this.apiBaseUrl = this.detectApiUrl();
        this.currentUser = null;
        this.bookings = [];
        this.currentFilters = {
            level: 'all',
            location: 'all',
            time: 'all'
        };
        this.currentChatRoom = null;
        this.isLoadingMore = false;
        
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
        console.log('🏓 初始化约球模块');
        
        // 检查当前用户
        this.loadCurrentUser();
        
        // 绑定事件
        this.bindEvents();
        
        // 初始化UI
        this.initUI();
        
        // 加载约球数据
        await this.loadBookingData();
        
        console.log('✅ 约球模块初始化完成');
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
        // 发布约球
        document.addEventListener('submit', (e) => {
            if (e.target.closest('#createBookingForm')) {
                e.preventDefault();
                this.handleCreateBooking();
            }
        });

        // 约球相关按钮
        document.addEventListener('click', (e) => {
            // 加入约球
            if (e.target.closest('.join-booking-btn')) {
                e.preventDefault();
                this.handleJoinBooking(e.target.closest('.join-booking-btn'));
            }
            
            // 联系球友
            if (e.target.closest('.contact-btn')) {
                e.preventDefault();
                this.handleContactUser(e.target.closest('.contact-btn'));
            }
            
            // 筛选按钮
            if (e.target.closest('.filter-btn')) {
                e.preventDefault();
                this.handleFilter(e.target.closest('.filter-btn'));
            }

            // 聊天相关
            if (e.target.closest('.close-chat-btn')) {
                e.preventDefault();
                this.closeChat();
            }

            if (e.target.closest('.send-message-btn')) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // 搜索功能
        const searchInput = document.getElementById('bookingSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.handleSearch(e.target.value);
            });
        }

        // 聊天输入框回车发送
        document.addEventListener('keypress', (e) => {
            if (e.target.closest('#chatInput') && e.key === 'Enter') {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // 监听认证状态变化
        window.addEventListener('auth:login', (e) => {
            this.currentUser = e.detail;
            this.updateCreateBookingForm();
        });

        window.addEventListener('auth:logout', () => {
            this.currentUser = null;
            this.updateCreateBookingForm();
            this.closeChat();
        });
    }

    // 初始化UI
    initUI() {
        this.updateCreateBookingForm();
        this.addBookingStyles();
    }

    // 加载约球数据
    async loadBookingData() {
        try {
            this.showLoading();

            // 尝试从API获取数据
            try {
                const response = await fetch(`${this.apiBaseUrl}/api/bookings`);
                const result = await response.json();
                
                if (result.success && result.bookings) {
                    this.bookings = result.bookings;
                    this.renderBookings();
                    return;
                }
            } catch (error) {
                console.warn('API获取失败，使用本地数据:', error);
            }

            // 使用本地模拟数据
            this.bookings = this.generateMockBookings();
            this.renderBookings();
            
        } catch (error) {
            console.error('加载约球数据失败:', error);
            this.showError('加载约球信息失败，请刷新重试');
        } finally {
            this.hideLoading();
        }
    }

    // 生成模拟约球数据
    generateMockBookings() {
        const mockOrganizers = [
            { username: '张小明', level: 'intermediate', avatar: this.generateAvatar('张小明'), id: 1001 },
            { username: '李华', level: 'advanced', avatar: this.generateAvatar('李华'), id: 1002 },
            { username: '王小红', level: 'beginner', avatar: this.generateAvatar('王小红'), id: 1003 },
            { username: '陈大力', level: 'professional', avatar: this.generateAvatar('陈大力'), id: 1004 },
            { username: '刘芳', level: 'intermediate', avatar: this.generateAvatar('刘芳'), id: 1005 }
        ];

        const locations = ['体育中心', '大学体育馆', '社区活动中心', '乒乓球俱乐部', '综合体育馆'];
        const timeSlots = ['09:00-11:00', '14:00-16:00', '19:00-21:00', '10:00-12:00', '16:00-18:00'];
        const titles = [
            '寻找球友一起练习',
            '周末约球，欢迎加入',
            '技术交流，共同进步',
            '友谊赛招募球友',
            '新手友好约球'
        ];

        return Array.from({ length: 8 }, (_, index) => {
            const organizer = mockOrganizers[index % mockOrganizers.length];
            const location = locations[index % locations.length];
            const timeSlot = timeSlots[index % timeSlots.length];
            const title = titles[index % titles.length];
            
            // 生成未来的日期
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + Math.floor(Math.random() * 14) + 1);
            
            const maxPlayers = Math.floor(Math.random() * 3) + 2; // 2-4人
            const currentPlayers = Math.floor(Math.random() * maxPlayers) + 1;
            const remainingSpots = maxPlayers - currentPlayers;
            
            return {
                id: `booking_${Date.now()}_${index}`,
                title: title,
                description: this.generateBookingDescription(organizer.level),
                organizer: organizer,
                location: location,
                booking_date: futureDate.toISOString().split('T')[0],
                time_slot: timeSlot,
                max_players: maxPlayers,
                current_players: currentPlayers,
                remaining_spots: remainingSpots,
                status: remainingSpots > 0 ? 'available' : 'full',
                requirements: this.generateRequirements(organizer.level),
                created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
            };
        });
    }

    // 生成约球描述
    generateBookingDescription(level) {
        const descriptions = {
            'beginner': '新手友好，一起学习基础技巧，轻松愉快的训练氛围',
            'intermediate': '中级水平，希望找到实力相当的球友进行技术交流',
            'advanced': '高级玩家，寻求高水平对手，提升比赛技巧',
            'professional': '专业级别，严格训练，追求技术完美'
        };
        return descriptions[level] || '欢迎各个水平的球友参加，一起享受乒乓球的乐趣';
    }

    // 生成要求
    generateRequirements(level) {
        const requirements = {
            'beginner': '无特殊要求，新手欢迎',
            'intermediate': '有一定基础，能够进行基本对抗',
            'advanced': '技术娴熟，具备比赛经验',
            'professional': '专业水平，有正式比赛经历'
        };
        return requirements[level] || '无特殊要求';
    }

    // 生成头像
    generateAvatar(name) {
        const colors = ['#FF6B35', '#DC143C', '#FFD700', '#32CD32', '#1E90FF', '#9370DB'];
        const color = colors[name.charCodeAt(0) % colors.length];
        const initial = name.charAt(0);
        
        return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='50' height='50' viewBox='0 0 50 50'%3E%3Ccircle cx='25' cy='25' r='25' fill='${encodeURIComponent(color)}'/%3E%3Ctext x='25' y='32' text-anchor='middle' fill='white' font-size='18' font-family='Arial'%3E${initial}%3C/text%3E%3C/svg%3E`;
    }

    // 渲染约球列表
    renderBookings() {
        const container = document.getElementById('bookingsGrid');
        if (!container) return;

        if (this.bookings.length === 0) {
            container.innerHTML = this.getEmptyState();
            return;
        }

        const bookingsHTML = this.bookings.map(booking => this.createBookingHTML(booking)).join('');
        container.innerHTML = bookingsHTML;
    }

    // 创建约球卡片HTML
    createBookingHTML(booking) {
        const levelText = this.getLevelText(booking.organizer.level);
        const statusText = booking.status === 'available' ? '可约' : '已满';
        const statusClass = booking.status === 'available' ? 'available' : 'full';
        
        const joinButtonHTML = booking.status === 'available' && this.currentUser
            ? `<button class="btn-primary join-booking-btn" data-booking-id="${booking.id}">
                 <i class="fas fa-handshake"></i>
                 加入约球
               </button>`
            : booking.status === 'full'
            ? `<button class="btn-disabled" disabled>
                 <i class="fas fa-check"></i>
                 已满员
               </button>`
            : `<button class="btn-primary" onclick="authModule.openModal('loginModal')">
                 <i class="fas fa-sign-in-alt"></i>
                 登录后加入
               </button>`;

        const remainingText = booking.status === 'available' 
            ? `还需要 ${booking.remaining_spots} 人`
            : '已满员';

        // 格式化日期
        const bookingDate = new Date(booking.booking_date);
        const dateStr = `${bookingDate.getMonth() + 1}月${bookingDate.getDate()}日 ${booking.time_slot}`;

        return `
            <div class="booking-card" data-booking-id="${booking.id}">
                <div class="booking-header">
                    <div class="organizer-info">
                        <img src="${booking.organizer.avatar}" alt="${booking.organizer.username}" class="organizer-avatar">
                        <div class="organizer-details">
                            <h4>${booking.organizer.username}</h4>
                            <span class="user-level ${booking.organizer.level}">${levelText}</span>
                        </div>
                    </div>
                    <div class="booking-status ${statusClass}">${statusText}</div>
                </div>
                
                <div class="booking-content">
                    <h3 class="booking-title">${booking.title}</h3>
                    <p class="booking-description">${booking.description}</p>
                    
                    <div class="booking-details">
                        <div class="detail-item">
                            <i class="fas fa-map-marker-alt"></i>
                            <span>${booking.location}</span>
                        </div>
                        <div class="detail-item">
                            <i class="fas fa-clock"></i>
                            <span>${dateStr}</span>
                        </div>
                        <div class="detail-item">
                            <i class="fas fa-users"></i>
                            <span>${booking.current_players}/${booking.max_players} 人 (${remainingText})</span>
                        </div>
                        <div class="detail-item">
                            <i class="fas fa-star"></i>
                            <span>${booking.requirements}</span>
                        </div>
                    </div>
                </div>
                
                <div class="booking-actions">
                    ${joinButtonHTML}
                    <button class="btn-secondary contact-btn" 
                            data-user-name="${booking.organizer.username}"
                            data-user-email="${booking.organizer.id}@example.com"
                            data-user-avatar="${booking.organizer.avatar}"
                            data-user-id="${booking.organizer.id}">
                        <i class="fas fa-comment"></i>
                        联系
                    </button>
                </div>
            </div>
        `;
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

    // 处理创建约球
    async handleCreateBooking() {
        if (!this.currentUser) {
            this.showNotification('请先登录后再发布约球', 'error');
            return;
        }

        const formData = this.getFormData();
        if (!this.validateFormData(formData)) {
            return;
        }

        try {
            const newBooking = {
                id: `booking_${Date.now()}`,
                title: formData.title,
                description: formData.description,
                organizer: {
                    username: this.currentUser.name || this.currentUser.username,
                    level: this.currentUser.level,
                    avatar: this.currentUser.avatar,
                    id: this.currentUser.id
                },
                location: formData.location,
                booking_date: formData.date,
                time_slot: formData.timeSlot,
                max_players: parseInt(formData.maxPlayers),
                current_players: 1,
                remaining_spots: parseInt(formData.maxPlayers) - 1,
                status: 'available',
                requirements: formData.requirements,
                created_at: new Date().toISOString()
            };

            // 添加到列表开头
            this.bookings.unshift(newBooking);
            this.renderBookings();

            // 重置表单
            this.resetCreateBookingForm();
            
            this.showNotification('约球发布成功！', 'success');

        } catch (error) {
            console.error('发布约球失败:', error);
            this.showNotification('发布失败，请重试', 'error');
        }
    }

    // 获取表单数据
    getFormData() {
        return {
            title: document.getElementById('bookingTitle')?.value?.trim(),
            description: document.getElementById('bookingDescription')?.value?.trim(),
            location: document.getElementById('bookingLocation')?.value?.trim(),
            date: document.getElementById('bookingDate')?.value,
            timeSlot: document.getElementById('bookingTimeSlot')?.value,
            maxPlayers: document.getElementById('bookingMaxPlayers')?.value,
            requirements: document.getElementById('bookingRequirements')?.value?.trim()
        };
    }

    // 验证表单数据
    validateFormData(data) {
        if (!data.title) {
            this.showNotification('请输入约球标题', 'error');
            return false;
        }
        if (!data.location) {
            this.showNotification('请输入约球地点', 'error');
            return false;
        }
        if (!data.date) {
            this.showNotification('请选择约球日期', 'error');
            return false;
        }
        if (!data.timeSlot) {
            this.showNotification('请选择时间段', 'error');
            return false;
        }
        
        // 检查日期是否为未来
        const selectedDate = new Date(data.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (selectedDate <= today) {
            this.showNotification('请选择未来的日期', 'error');
            return false;
        }
        
        return true;
    }

    // 重置创建约球表单
    resetCreateBookingForm() {
        const form = document.getElementById('createBookingForm');
        if (form) {
            form.reset();
        }
    }

    // 处理加入约球
    async handleJoinBooking(button) {
        if (!this.currentUser) {
            this.showNotification('请先登录后再加入约球', 'error');
            return;
        }

        const bookingId = button.dataset.bookingId;
        const booking = this.bookings.find(b => b.id === bookingId);
        
        if (!booking) return;

        if (booking.status !== 'available' || booking.remaining_spots <= 0) {
            this.showNotification('该约球已满员', 'error');
            return;
        }

        try {
            // 更新约球状态
            booking.current_players++;
            booking.remaining_spots--;
            
            if (booking.remaining_spots === 0) {
                booking.status = 'full';
            }

            // 重新渲染
            this.renderBookings();
            
            this.showNotification(`成功加入约球"${booking.title}"！`, 'success');

        } catch (error) {
            console.error('加入约球失败:', error);
            this.showNotification('加入失败，请重试', 'error');
        }
    }

    // 处理联系用户
    async handleContactUser(button) {
        if (!this.currentUser) {
            this.showNotification('请先登录后再联系球友', 'error');
            return;
        }

        const userName = button.dataset.userName;
        const userEmail = button.dataset.userEmail;
        const userAvatar = button.dataset.userAvatar;
        const userId = button.dataset.userId;

        this.openChatWindow({
            name: userName,
            email: userEmail,
            avatar: userAvatar,
            id: userId
        });
    }

    // 打开聊天窗口
    openChatWindow(user) {
        const chatModal = document.getElementById('chatModal');
        if (!chatModal) {
            this.createChatModal();
        }

        // 设置聊天对象信息
        document.getElementById('chatUserName').textContent = user.name;
        document.getElementById('chatUserAvatar').src = user.avatar;
        
        // 清空聊天记录
        const chatMessages = document.getElementById('chatMessages');
        chatMessages.innerHTML = `
            <div class="system-message">
                <i class="fas fa-info-circle"></i>
                开始与 ${user.name} 聊天，讨论约球详情吧！
            </div>
        `;

        // 显示聊天窗口
        document.getElementById('chatModal').style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // 聚焦输入框
        document.getElementById('chatInput').focus();
    }

    // 创建聊天模态框
    createChatModal() {
        const chatModal = document.createElement('div');
        chatModal.id = 'chatModal';
        chatModal.className = 'chat-modal';
        chatModal.innerHTML = `
            <div class="chat-window">
                <div class="chat-header">
                    <div class="chat-user-info">
                        <img id="chatUserAvatar" src="" alt="用户头像" class="chat-user-avatar">
                        <span id="chatUserName">用户</span>
                    </div>
                    <button class="close-chat-btn">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="chat-messages" id="chatMessages"></div>
                
                <div class="chat-input-area">
                    <input type="text" id="chatInput" placeholder="输入消息..." maxlength="500">
                    <button class="send-message-btn">
                        <i class="fas fa-paper-plane"></i>
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(chatModal);
    }

    // 关闭聊天
    closeChat() {
        const chatModal = document.getElementById('chatModal');
        if (chatModal) {
            chatModal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }

    // 发送消息
    sendMessage() {
        const input = document.getElementById('chatInput');
        const message = input.value.trim();
        
        if (!message) return;

        // 添加消息到聊天区域
        this.addMessageToChat(message, true);
        
        // 清空输入框
        input.value = '';
        
        // 模拟回复（实际应该通过WebSocket或API）
        setTimeout(() => {
            const replies = [
                '好的，我们可以详细讨论一下约球的安排',
                '什么时候方便？我比较灵活',
                '没问题，期待和你一起打球！',
                '我们可以先练习一下基本技术'
            ];
            const reply = replies[Math.floor(Math.random() * replies.length)];
            this.addMessageToChat(reply, false);
        }, 1000 + Math.random() * 2000);
    }

    // 添加消息到聊天区域
    addMessageToChat(content, isOwn) {
        const chatMessages = document.getElementById('chatMessages');
        if (!chatMessages) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${isOwn ? 'own' : 'other'}`;
        
        const timestamp = new Date().toLocaleTimeString('zh-CN', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        messageDiv.innerHTML = `
            <div class="message-content">${content}</div>
            <div class="message-time">${timestamp}</div>
        `;
        
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // 处理搜索
    handleSearch(query) {
        if (!query.trim()) {
            this.renderBookings();
            return;
        }

        const filteredBookings = this.bookings.filter(booking => 
            booking.title.toLowerCase().includes(query.toLowerCase()) ||
            booking.description.toLowerCase().includes(query.toLowerCase()) ||
            booking.location.toLowerCase().includes(query.toLowerCase()) ||
            booking.organizer.username.toLowerCase().includes(query.toLowerCase())
        );

        this.renderFilteredBookings(filteredBookings);
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
        let filteredBookings = this.bookings;

        // 按技术水平筛选
        if (this.currentFilters.level !== 'all') {
            filteredBookings = filteredBookings.filter(booking => 
                booking.organizer.level === this.currentFilters.level
            );
        }

        // 按地点筛选（简化处理）
        if (this.currentFilters.location !== 'all') {
            filteredBookings = filteredBookings.filter(booking => 
                booking.location.includes(this.currentFilters.location)
            );
        }

        // 按时间筛选
        if (this.currentFilters.time !== 'all') {
            const now = new Date();
            filteredBookings = filteredBookings.filter(booking => {
                const bookingDate = new Date(booking.booking_date);
                const daysDiff = Math.ceil((bookingDate - now) / (1000 * 60 * 60 * 24));
                
                switch (this.currentFilters.time) {
                    case 'today':
                        return daysDiff === 0;
                    case 'tomorrow':
                        return daysDiff === 1;
                    case 'week':
                        return daysDiff <= 7;
                    default:
                        return true;
                }
            });
        }

        this.renderFilteredBookings(filteredBookings);
    }

    // 渲染筛选后的约球
    renderFilteredBookings(bookings) {
        const container = document.getElementById('bookingsGrid');
        if (!container) return;

        if (bookings.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-search"></i>
                    <h3>未找到匹配的约球</h3>
                    <p>试试调整筛选条件</p>
                    <button onclick="bookingModule.clearFilters()" class="btn-primary">清除筛选</button>
                </div>
            `;
            return;
        }

        const bookingsHTML = bookings.map(booking => this.createBookingHTML(booking)).join('');
        container.innerHTML = bookingsHTML;
    }

    // 清除筛选
    clearFilters() {
        this.currentFilters = {
            level: 'all',
            location: 'all',
            time: 'all'
        };
        
        // 重置筛选按钮状态
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.value === 'all') {
                btn.classList.add('active');
            }
        });
        
        // 清空搜索框
        const searchInput = document.getElementById('bookingSearch');
        if (searchInput) {
            searchInput.value = '';
        }
        
        this.renderBookings();
    }

    // 更新创建约球表单
    updateCreateBookingForm() {
        const createForm = document.getElementById('createBookingForm');
        if (!createForm) return;

        if (this.currentUser) {
            createForm.style.display = 'block';
        } else {
            createForm.style.display = 'none';
        }
    }

    // 显示加载状态
    showLoading() {
        const container = document.getElementById('bookingsGrid');
        if (container) {
            container.innerHTML = `
                <div class="loading-state">
                    <i class="fas fa-spinner fa-spin"></i>
                    <p>加载约球信息中...</p>
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
        const container = document.getElementById('bookingsGrid');
        if (container) {
            container.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>${message}</p>
                    <button onclick="bookingModule.loadBookingData()" class="btn-primary">重新加载</button>
                </div>
            `;
        }
    }

    // 获取空状态
    getEmptyState() {
        return `
            <div class="empty-state">
                <i class="fas fa-calendar-plus"></i>
                <h3>暂无约球信息</h3>
                <p>成为第一个发布约球的球友吧！</p>
                ${this.currentUser ? 
                    '<button onclick="document.getElementById(\'createBookingForm\').scrollIntoView()" class="btn-primary">立即发布</button>' :
                    '<p class="login-tip">登录后即可发布约球</p>'
                }
            </div>
        `;
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
    addBookingStyles() {
        if (document.querySelector('style[data-booking-module]')) return;

        const style = document.createElement('style');
        style.setAttribute('data-booking-module', 'true');
        style.textContent = `
            .booking-card {
                background: white;
                border-radius: 12px;
                padding: 20px;
                margin-bottom: 20px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                transition: transform 0.2s ease;
                border: 1px solid #f0f0f0;
            }

            .booking-card:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 20px rgba(0,0,0,0.15);
            }

            .booking-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 15px;
            }

            .organizer-info {
                display: flex;
                align-items: center;
                gap: 12px;
            }

            .organizer-avatar {
                width: 50px;
                height: 50px;
                border-radius: 50%;
            }

            .organizer-details h4 {
                margin: 0;
                font-size: 16px;
                font-weight: 600;
                color: #333;
            }

            .user-level {
                font-size: 12px;
                padding: 2px 8px;
                border-radius: 12px;
                margin-top: 4px;
                display: inline-block;
            }

            .user-level.beginner { background: #e3f2fd; color: #1976d2; }
            .user-level.intermediate { background: #f3e5f5; color: #7b1fa2; }
            .user-level.advanced { background: #fff3e0; color: #f57c00; }
            .user-level.professional { background: #ffebee; color: #d32f2f; }

            .booking-status {
                padding: 6px 12px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: 600;
            }

            .booking-status.available {
                background: #e8f5e8;
                color: #2e7d2e;
            }

            .booking-status.full {
                background: #ffe8e8;
                color: #d32f2f;
            }

            .booking-title {
                font-size: 18px;
                font-weight: 600;
                margin: 0 0 10px;
                color: #333;
            }

            .booking-description {
                color: #666;
                margin: 0 0 15px;
                line-height: 1.5;
            }

            .booking-details {
                margin: 15px 0;
            }

            .detail-item {
                display: flex;
                align-items: center;
                margin-bottom: 8px;
                font-size: 14px;
                color: #555;
            }

            .detail-item i {
                width: 16px;
                margin-right: 8px;
                color: #dc3545;
            }

            .booking-actions {
                display: flex;
                gap: 12px;
                margin-top: 20px;
            }

            .btn-primary, .btn-secondary, .btn-disabled {
                display: flex;
                align-items: center;
                gap: 6px;
                padding: 10px 16px;
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

            .btn-disabled {
                background: #e9ecef;
                color: #6c757d;
                cursor: not-allowed;
            }

            .chat-modal {
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.5);
                z-index: 10000;
                align-items: center;
                justify-content: center;
            }

            .chat-window {
                background: white;
                border-radius: 12px;
                width: 90%;
                max-width: 500px;
                height: 600px;
                display: flex;
                flex-direction: column;
                overflow: hidden;
            }

            .chat-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 16px 20px;
                border-bottom: 1px solid #eee;
                background: #f8f9fa;
            }

            .chat-user-info {
                display: flex;
                align-items: center;
                gap: 12px;
            }

            .chat-user-avatar {
                width: 40px;
                height: 40px;
                border-radius: 50%;
            }

            .close-chat-btn {
                background: none;
                border: none;
                font-size: 18px;
                color: #666;
                cursor: pointer;
                padding: 4px;
            }

            .chat-messages {
                flex: 1;
                padding: 20px;
                overflow-y: auto;
                background: #f8f9fa;
            }

            .chat-message {
                margin-bottom: 15px;
                display: flex;
                flex-direction: column;
            }

            .chat-message.own {
                align-items: flex-end;
            }

            .chat-message .message-content {
                background: white;
                padding: 10px 15px;
                border-radius: 18px;
                max-width: 70%;
                word-wrap: break-word;
                box-shadow: 0 1px 2px rgba(0,0,0,0.1);
            }

            .chat-message.own .message-content {
                background: #dc3545;
                color: white;
            }

            .chat-message .message-time {
                font-size: 11px;
                color: #666;
                margin-top: 4px;
                padding: 0 4px;
            }

            .system-message {
                text-align: center;
                color: #666;
                font-size: 14px;
                margin: 20px 0;
                padding: 10px;
                background: rgba(0,0,0,0.05);
                border-radius: 8px;
            }

            .chat-input-area {
                display: flex;
                padding: 15px 20px;
                border-top: 1px solid #eee;
                background: white;
            }

            .chat-input-area input {
                flex: 1;
                padding: 10px 15px;
                border: 1px solid #ddd;
                border-radius: 20px;
                outline: none;
                margin-right: 10px;
            }

            .send-message-btn {
                background: #dc3545;
                color: white;
                border: none;
                padding: 10px 15px;
                border-radius: 50%;
                cursor: pointer;
                transition: background 0.2s ease;
            }

            .send-message-btn:hover {
                background: #c82333;
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

    getBookings() {
        return this.bookings;
    }

    refreshBookings() {
        this.loadBookingData();
    }

    // 筛选功能
    toggleFilters() {
        const filtersPanel = document.querySelector('.filters-panel');
        if (filtersPanel) {
            filtersPanel.classList.toggle('show');
        }
    }

    joinBooking(organizer, title, bookingId) {
        const button = document.querySelector(`[data-booking-id="${bookingId}"]`)?.querySelector('.join-booking-btn');
        if (button) {
            this.handleJoinBooking(button);
        }
    }

    openChat(userName, userEmail, userAvatar) {
        this.handleContactUser({
            dataset: {
                userName,
                userEmail,
                userAvatar,
                userId: Math.floor(Math.random() * 1000)
            }
        });
    }
}

// 创建全局实例
const bookingModule = new BookingModule();

// 导出到全局
window.bookingModule = bookingModule;

// 全局函数兼容
window.toggleFilters = () => bookingModule.toggleFilters();
window.joinBooking = (organizer, title, bookingId) => bookingModule.joinBooking(organizer, title, bookingId);
window.openChat = (userName, userEmail, userAvatar) => bookingModule.openChat(userName, userEmail, userAvatar);
window.closeChat = () => bookingModule.closeChat();
window.sendMessage = () => bookingModule.sendMessage();

console.log('🏓 约球模块已加载'); 