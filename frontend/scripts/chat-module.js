/**
 * SpinMatch 聊天模块 - 完全独立
 * 基于WebSocket的实时聊天系统
 */

class ChatModule {
    constructor() {
        this.apiBaseUrl = this.detectApiUrl();
        this.socket = null;
        this.currentRoom = null;
        this.currentUser = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.chatRooms = new Map();
        this.messageHistory = new Map();
        
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
        console.log('💬 初始化聊天模块');
        
        // 加载当前用户
        this.loadCurrentUser();
        
        // 绑定事件
        this.bindEvents();
        
        // 加载Socket.IO并初始化连接
        await this.loadSocketIO();
        
        // 添加样式
        this.addChatStyles();
        
        console.log('✅ 聊天模块初始化完成');
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
        // 监听认证状态变化
        window.addEventListener('auth:login', (e) => {
            this.currentUser = e.detail;
            this.connect();
        });

        window.addEventListener('auth:logout', () => {
            this.currentUser = null;
            this.disconnect();
            this.closeChatWindow();
        });

        // 聊天窗口事件
        document.addEventListener('click', (e) => {
            // 关闭聊天窗口
            if (e.target.closest('.close-chat-btn') || e.target.closest('.chat-modal-overlay')) {
                e.preventDefault();
                this.closeChatWindow();
            }

            // 发送消息按钮
            if (e.target.closest('.send-message-btn')) {
                e.preventDefault();
                this.sendMessage();
            }

            // 联系球友按钮
            if (e.target.closest('[data-chat-user]')) {
                e.preventDefault();
                const button = e.target.closest('[data-chat-user]');
                this.handleContactUser(button);
            }
        });

        // 消息输入框回车发送
        document.addEventListener('keypress', (e) => {
            if (e.target.closest('.chat-input') && e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // 窗口关闭时断开连接
        window.addEventListener('beforeunload', () => {
            this.disconnect();
        });
    }

    // 加载Socket.IO客户端库
    async loadSocketIO() {
        if (typeof io !== 'undefined') {
            this.initializeSocket();
            return;
        }

        try {
            const script = document.createElement('script');
            script.src = 'https://cdn.socket.io/4.7.2/socket.io.min.js';
            script.onload = () => this.initializeSocket();
            script.onerror = () => {
                console.error('Socket.IO客户端库加载失败');
                this.showNotification('聊天服务加载失败', 'error');
            };
            document.head.appendChild(script);
        } catch (error) {
            console.error('加载Socket.IO失败:', error);
        }
    }

    // 初始化WebSocket连接
    initializeSocket() {
        if (this.socket && this.isConnected) {
            return;
        }

        try {
            this.socket = io(this.apiBaseUrl, {
                transports: ['websocket', 'polling'],
                autoConnect: false
            });

            this.setupSocketEvents();
        } catch (error) {
            console.error('初始化Socket连接失败:', error);
            this.showNotification('连接聊天服务失败', 'error');
        }
    }

    // 设置Socket事件监听
    setupSocketEvents() {
        this.socket.on('connect', () => {
            console.log('💬 WebSocket连接成功');
            this.isConnected = true;
            this.reconnectAttempts = 0;
            this.showNotification('聊天服务已连接', 'success');
        });

        this.socket.on('disconnect', () => {
            console.log('💬 WebSocket连接断开');
            this.isConnected = false;
            this.handleReconnect();
        });

        this.socket.on('connect_error', (error) => {
            console.error('WebSocket连接错误:', error);
            this.isConnected = false;
            this.handleReconnect();
        });

        this.socket.on('new_message', (messageData) => {
            this.handleNewMessage(messageData);
        });

        this.socket.on('user_status', (statusData) => {
            this.handleUserStatus(statusData);
        });

        this.socket.on('error', (error) => {
            console.error('WebSocket错误:', error);
            this.showNotification('聊天服务出错', 'error');
        });

        this.socket.on('room_joined', (data) => {
            console.log('加入聊天室:', data.room_id);
        });

        this.socket.on('room_left', (data) => {
            console.log('离开聊天室:', data.room_id);
        });
    }

    // 处理重连
    handleReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`尝试重连 (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
            
            setTimeout(() => {
                if (!this.isConnected) {
                    this.connect();
                }
            }, 2000 * this.reconnectAttempts);
        } else {
            this.showNotification('连接失败，请刷新页面重试', 'error');
        }
    }

    // 连接到聊天服务
    connect() {
        if (!this.currentUser) {
            console.log('用户未登录，无法连接聊天服务');
            return;
        }

        if (this.socket && !this.isConnected) {
            this.socket.connect();
        }
    }

    // 断开连接
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.isConnected = false;
        }
    }

    // 处理联系用户按钮
    async handleContactUser(button) {
        if (!this.currentUser) {
            this.showNotification('请先登录后再联系球友', 'error');
            return;
        }

        const userData = {
            id: button.dataset.userId,
            name: button.dataset.userName,
            avatar: button.dataset.userAvatar,
            email: button.dataset.userEmail
        };

        const bookingId = button.dataset.bookingId || null;
        
        await this.openChatRoom(userData, bookingId);
    }

    // 打开聊天室
    async openChatRoom(userData, bookingId = null) {
        if (!this.currentUser) {
            this.showNotification('请先登录后再联系球友', 'error');
            return;
        }

        try {
            // 确保WebSocket连接
            this.connect();

            // 创建或获取聊天室
            const roomData = await this.createOrGetChatRoom(userData.id, bookingId);
            
            if (roomData.success) {
                this.currentRoom = roomData.room_id;
                
                // 显示聊天窗口
                this.showChatWindow(userData);
                
                // 加入聊天室
                this.joinRoom(this.currentRoom);
                
                // 加载历史消息
                await this.loadChatHistory(this.currentRoom);
            } else {
                this.showNotification(roomData.message || '创建聊天室失败', 'error');
            }
        } catch (error) {
            console.error('打开聊天室失败:', error);
            this.showNotification('打开聊天失败，请稍后重试', 'error');
        }
    }

    // 创建或获取聊天室
    async createOrGetChatRoom(participantId, bookingId) {
        try {
            if (!this.currentUser) {
                throw new Error('用户未登录');
            }

            const response = await fetch(`${this.apiBaseUrl}/api/chat/room`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('spinmatch_token')}`
                },
                body: JSON.stringify({
                    participant_id: participantId,
                    booking_id: bookingId
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP错误: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('创建聊天室失败:', error);
            // 创建本地聊天室作为回退
            return {
                success: true,
                room_id: `local_${this.currentUser.id}_${participantId}_${Date.now()}`
            };
        }
    }

    // 显示聊天窗口
    showChatWindow(userData) {
        let chatModal = document.getElementById('chatModal');
        if (!chatModal) {
            this.createChatModal();
            chatModal = document.getElementById('chatModal');
        }

        // 设置聊天对象信息
        const chatUserName = chatModal.querySelector('.chat-user-name');
        const chatUserAvatar = chatModal.querySelector('.chat-user-avatar');
        const chatUserStatus = chatModal.querySelector('.chat-user-status');

        if (chatUserName) chatUserName.textContent = userData.name;
        if (chatUserAvatar) chatUserAvatar.src = userData.avatar || this.generateAvatar(userData.name);
        if (chatUserStatus) chatUserStatus.textContent = '在线';

        // 清空消息历史
        this.clearChatMessages();

        // 显示欢迎消息
        this.addSystemMessage(`开始与 ${userData.name} 聊天，讨论约球详情吧！`);

        // 显示聊天窗口
        chatModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';

        // 聚焦输入框
        const chatInput = chatModal.querySelector('.chat-input');
        if (chatInput) {
            setTimeout(() => chatInput.focus(), 100);
        }
    }

    // 创建聊天模态框
    createChatModal() {
        const chatModal = document.createElement('div');
        chatModal.id = 'chatModal';
        chatModal.className = 'chat-modal';
        chatModal.innerHTML = `
            <div class="chat-modal-overlay"></div>
            <div class="chat-window">
                <div class="chat-header">
                    <div class="chat-user-info">
                        <img class="chat-user-avatar" src="" alt="用户头像">
                        <div class="chat-user-details">
                            <span class="chat-user-name">用户</span>
                            <span class="chat-user-status">离线</span>
                        </div>
                    </div>
                    <button class="close-chat-btn">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="chat-messages" id="chatMessages"></div>
                
                <div class="chat-input-area">
                    <input type="text" class="chat-input" placeholder="输入消息..." maxlength="1000">
                    <button class="send-message-btn">
                        <i class="fas fa-paper-plane"></i>
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(chatModal);
    }

    // 生成头像
    generateAvatar(name) {
        const colors = ['#FF6B35', '#DC143C', '#FFD700', '#32CD32', '#1E90FF', '#9370DB'];
        const color = colors[name.charCodeAt(0) % colors.length];
        const initial = name.charAt(0);
        
        return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Ccircle cx='20' cy='20' r='20' fill='${encodeURIComponent(color)}'/%3E%3Ctext x='20' y='26' text-anchor='middle' fill='white' font-size='16' font-family='Arial'%3E${initial}%3C/text%3E%3C/svg%3E`;
    }

    // 加入聊天室
    joinRoom(roomId) {
        if (this.socket && this.isConnected) {
            this.socket.emit('join_room', {
                room_id: roomId,
                user_id: this.currentUser.id
            });
        }
    }

    // 离开聊天室
    leaveRoom(roomId) {
        if (this.socket && this.isConnected) {
            this.socket.emit('leave_room', {
                room_id: roomId,
                user_id: this.currentUser.id
            });
        }
    }

    // 发送消息
    sendMessage() {
        const chatInput = document.querySelector('.chat-input');
        const message = chatInput.value.trim();
        
        if (!message || !this.currentRoom) return;

        const messageData = {
            room_id: this.currentRoom,
            content: message,
            sender_id: this.currentUser.id,
            sender_name: this.currentUser.name,
            timestamp: new Date().toISOString()
        };

        // 立即显示消息（乐观更新）
        this.addMessageToChat(messageData, true);
        
        // 清空输入框
        chatInput.value = '';

        // 发送到服务器
        if (this.socket && this.isConnected) {
            this.socket.emit('send_message', messageData);
        } else {
            // 离线模式 - 保存到本地
            this.saveMessageLocally(messageData);
            this.simulateReply();
        }
    }

    // 处理新消息
    handleNewMessage(messageData) {
        if (messageData.room_id === this.currentRoom && messageData.sender_id !== this.currentUser.id) {
            this.addMessageToChat(messageData, false);
        }
    }

    // 处理用户状态
    handleUserStatus(statusData) {
        const chatUserStatus = document.querySelector('.chat-user-status');
        if (chatUserStatus) {
            chatUserStatus.textContent = statusData.online ? '在线' : '离线';
            chatUserStatus.className = `chat-user-status ${statusData.online ? 'online' : 'offline'}`;
        }
    }

    // 添加消息到聊天区域
    addMessageToChat(messageData, isOwn) {
        const chatMessages = document.getElementById('chatMessages');
        if (!chatMessages) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${isOwn ? 'own' : 'other'}`;
        
        const timestamp = new Date(messageData.timestamp).toLocaleTimeString('zh-CN', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        messageDiv.innerHTML = `
            <div class="message-content">${this.formatMessage(messageData.content)}</div>
            <div class="message-time">${timestamp}</div>
            ${!isOwn ? `<div class="message-sender">${messageData.sender_name}</div>` : ''}
        `;
        
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        // 播放消息提示音
        if (!isOwn) {
            this.playNotificationSound();
        }
    }

    // 添加系统消息
    addSystemMessage(content) {
        const chatMessages = document.getElementById('chatMessages');
        if (!chatMessages) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = 'chat-message system';
        messageDiv.innerHTML = `
            <div class="system-message">
                <i class="fas fa-info-circle"></i>
                <span>${content}</span>
            </div>
        `;
        
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // 格式化消息内容
    formatMessage(content) {
        // 转义HTML
        content = content.replace(/[<>&"]/g, (match) => {
            const htmlEscapes = { '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' };
            return htmlEscapes[match];
        });

        // 转换链接
        content = content.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
        
        // 转换换行
        content = content.replace(/\n/g, '<br>');
        
        return content;
    }

    // 清空聊天消息
    clearChatMessages() {
        const chatMessages = document.getElementById('chatMessages');
        if (chatMessages) {
            chatMessages.innerHTML = '';
        }
    }

    // 加载聊天历史
    async loadChatHistory(roomId) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/chat/history/${roomId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('spinmatch_token')}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success && data.messages) {
                    data.messages.forEach(message => {
                        this.addMessageToChat(message, message.sender_id === this.currentUser.id);
                    });
                }
            }
        } catch (error) {
            console.warn('加载聊天历史失败:', error);
            // 加载本地历史消息
            this.loadLocalChatHistory(roomId);
        }
    }

    // 加载本地聊天历史
    loadLocalChatHistory(roomId) {
        const localHistory = this.messageHistory.get(roomId) || [];
        localHistory.forEach(message => {
            this.addMessageToChat(message, message.sender_id === this.currentUser.id);
        });
    }

    // 保存消息到本地
    saveMessageLocally(messageData) {
        if (!this.messageHistory.has(messageData.room_id)) {
            this.messageHistory.set(messageData.room_id, []);
        }
        
        this.messageHistory.get(messageData.room_id).push(messageData);
        
        // 限制本地历史消息数量
        const history = this.messageHistory.get(messageData.room_id);
        if (history.length > 100) {
            history.splice(0, history.length - 100);
        }
    }

    // 模拟回复（离线模式）
    simulateReply() {
        const replies = [
            '好的，我们可以详细讨论一下约球的安排',
            '什么时候方便？我比较灵活',
            '没问题，期待和你一起打球！',
            '我们可以先练习一下基本技术',
            '这个时间段我有空，没问题',
            '场地我比较熟悉，可以帮忙预约'
        ];
        
        setTimeout(() => {
            const reply = replies[Math.floor(Math.random() * replies.length)];
            const replyData = {
                room_id: this.currentRoom,
                content: reply,
                sender_id: 'system',
                sender_name: '球友',
                timestamp: new Date().toISOString()
            };
            
            this.addMessageToChat(replyData, false);
            this.saveMessageLocally(replyData);
        }, 1000 + Math.random() * 3000);
    }

    // 播放提示音
    playNotificationSound() {
        try {
            const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+PzvmIaFjiAy+3OgDEOKnDC7N+UQQ4XVrDn9KpTEw1Bm+v3uFgaEjd+yetriTwYJHGN0fOZUB0sRJfp+bNcJA4ytOH1s2oXUJ3W7dtZFCk4nK/l9qNgHj8nQ5Xm/b5fNhUgvOX5sl8hEjuI2OTJaR0qL2uL3/CVUBotQJPn+L1aKBM2ltP/fU8dO3CM3ebEfjckOJTZ5sp6HBcshcL3ulYWVarQ6NtZFDk3mK/n96FeIC8hN5bU/oBaJhcngEv+vSgqLGiJ2/SXUBUuQYzg9bBdJR0uk9b6g08kOmSG3u3HfjkuOY7Y6ca5HRQXTJTY9Y1BHy0hPJTS/3dYJhEogkv6vCgqKm2F2fqPQA');
            audio.volume = 0.3;
            audio.play().catch(() => {
                // 静默处理播放失败
            });
        } catch (error) {
            // 静默处理错误
        }
    }

    // 关闭聊天窗口
    closeChatWindow() {
        const chatModal = document.getElementById('chatModal');
        if (chatModal) {
            chatModal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }

        // 离开当前聊天室
        if (this.currentRoom) {
            this.leaveRoom(this.currentRoom);
            this.currentRoom = null;
        }
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
    addChatStyles() {
        if (document.querySelector('style[data-chat-module]')) return;

        const style = document.createElement('style');
        style.setAttribute('data-chat-module', 'true');
        style.textContent = `
            .chat-modal {
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

            .chat-modal-overlay {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.5);
            }

            .chat-window {
                position: relative;
                background: white;
                border-radius: 12px;
                width: 90%;
                max-width: 500px;
                height: 600px;
                display: flex;
                flex-direction: column;
                overflow: hidden;
                box-shadow: 0 10px 30px rgba(0,0,0,0.3);
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

            .chat-user-details {
                display: flex;
                flex-direction: column;
                gap: 2px;
            }

            .chat-user-name {
                font-weight: 600;
                font-size: 16px;
                color: #333;
            }

            .chat-user-status {
                font-size: 12px;
                color: #666;
            }

            .chat-user-status.online {
                color: #28a745;
            }

            .chat-user-status.offline {
                color: #6c757d;
            }

            .close-chat-btn {
                background: none;
                border: none;
                font-size: 18px;
                color: #666;
                cursor: pointer;
                padding: 8px;
                border-radius: 4px;
                transition: background 0.2s ease;
            }

            .close-chat-btn:hover {
                background: rgba(0,0,0,0.1);
            }

            .chat-messages {
                flex: 1;
                padding: 20px;
                overflow-y: auto;
                background: #f8f9fa;
            }

            .chat-message {
                margin-bottom: 16px;
                display: flex;
                flex-direction: column;
            }

            .chat-message.own {
                align-items: flex-end;
            }

            .chat-message.system {
                align-items: center;
            }

            .message-content {
                background: white;
                padding: 12px 16px;
                border-radius: 18px;
                max-width: 75%;
                word-wrap: break-word;
                box-shadow: 0 1px 2px rgba(0,0,0,0.1);
                line-height: 1.4;
            }

            .chat-message.own .message-content {
                background: #dc3545;
                color: white;
            }

            .message-time {
                font-size: 11px;
                color: #999;
                margin-top: 4px;
                padding: 0 8px;
            }

            .message-sender {
                font-size: 11px;
                color: #666;
                margin-bottom: 4px;
                padding: 0 8px;
            }

            .system-message {
                display: flex;
                align-items: center;
                gap: 8px;
                background: rgba(0,0,0,0.05);
                padding: 10px 16px;
                border-radius: 20px;
                font-size: 14px;
                color: #666;
            }

            .chat-input-area {
                display: flex;
                padding: 16px 20px;
                border-top: 1px solid #eee;
                background: white;
                gap: 12px;
            }

            .chat-input {
                flex: 1;
                padding: 12px 16px;
                border: 1px solid #ddd;
                border-radius: 24px;
                outline: none;
                font-size: 14px;
                resize: none;
                transition: border-color 0.2s ease;
            }

            .chat-input:focus {
                border-color: #dc3545;
            }

            .send-message-btn {
                background: #dc3545;
                color: white;
                border: none;
                padding: 12px 16px;
                border-radius: 50%;
                cursor: pointer;
                transition: all 0.2s ease;
                min-width: 48px;
                height: 48px;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .send-message-btn:hover {
                background: #c82333;
                transform: scale(1.05);
            }

            .send-message-btn:active {
                transform: scale(0.95);
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
                .chat-window {
                    width: 95%;
                    height: 90vh;
                }

                .message-content {
                    max-width: 85%;
                }
            }
        `;
        document.head.appendChild(style);
    }

    // 公共API方法
    openChat(userData, bookingId = null) {
        return this.openChatRoom(userData, bookingId);
    }

    closeChat() {
        this.closeChatWindow();
    }

    isConnected() {
        return this.isConnected;
    }

    getCurrentRoom() {
        return this.currentRoom;
    }

    // 销毁模块
    destroy() {
        console.log('💬 销毁聊天模块');
        this.disconnect();
        this.closeChatWindow();
    }
}

// 创建全局实例
const chatModule = new ChatModule();

// 导出到全局
window.chatModule = chatModule;

// 全局函数兼容
window.openChat = (userData, bookingId) => chatModule.openChat(userData, bookingId);
window.closeChat = () => chatModule.closeChat();

console.log('💬 聊天模块已加载'); 