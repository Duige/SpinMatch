/**
 * SpinMatch 首页模块 - 完全独立
 * 处理首页特有功能：粒子背景、滚动效果、统计动画等
 */

class IndexModule {
    constructor() {
        this.particles = [];
        this.canvas = null;
        this.ctx = null;
        this.observer = null;
        this.currentUser = null;
        this.animationId = null;
        
        // 初始化
        this.init();
    }

    // 初始化模块
    init() {
        console.log('🏠 初始化首页模块');
        
        // 检查是否在首页
        if (!this.isIndexPage()) {
            return;
        }

        // 加载当前用户
        this.loadCurrentUser();
        
        // 初始化功能
        this.initParticleBackground();
        this.initScrollEffects();
        this.updateUserInfo();
        
        // 绑定事件
        this.bindEvents();
        
        // 页面加载完成后执行统计动画
        if (document.readyState === 'complete') {
            setTimeout(() => this.animateStats(), 1000);
        } else {
            window.addEventListener('load', () => {
                setTimeout(() => this.animateStats(), 1000);
            });
        }
        
        console.log('✅ 首页模块初始化完成');
    }

    // 检查是否在首页
    isIndexPage() {
        const path = window.location.pathname;
        return path === '/' || path === '/index.html' || path.endsWith('index.html') || path === '';
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
            this.updateUserInfo();
        });

        window.addEventListener('auth:logout', () => {
            this.currentUser = null;
            this.updateUserInfo();
        });

        // 窗口大小变化
        window.addEventListener('resize', () => {
            this.resizeCanvas();
        });

        // 页面可见性变化
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pauseAnimations();
            } else {
                this.resumeAnimations();
            }
        });
    }

    // 粒子背景动画
    initParticleBackground() {
        this.canvas = document.getElementById('particle-canvas');
        if (!this.canvas) return;
        
        this.ctx = this.canvas.getContext('2d');
        
        // 设置画布大小
        this.resizeCanvas();
        
        // 粒子类
        class Particle {
            constructor(canvasWidth, canvasHeight) {
                this.x = Math.random() * canvasWidth;
                this.y = Math.random() * canvasHeight;
                this.vx = (Math.random() - 0.5) * 0.5;
                this.vy = (Math.random() - 0.5) * 0.5;
                this.radius = Math.random() * 2 + 1;
                this.opacity = Math.random() * 0.5 + 0.3;
                this.canvasWidth = canvasWidth;
                this.canvasHeight = canvasHeight;
            }
            
            update() {
                this.x += this.vx;
                this.y += this.vy;
                
                if (this.x < 0 || this.x > this.canvasWidth) this.vx = -this.vx;
                if (this.y < 0 || this.y > this.canvasHeight) this.vy = -this.vy;
            }
            
            draw(ctx) {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(220, 20, 60, ${this.opacity})`;
                ctx.fill();
            }
        }
        
        // 创建粒子
        this.particles = [];
        for (let i = 0; i < 50; i++) {
            this.particles.push(new Particle(this.canvas.width, this.canvas.height));
        }
        
        // 开始动画
        this.startParticleAnimation();
    }

    // 设置画布大小
    resizeCanvas() {
        if (!this.canvas) return;
        
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        // 重新创建粒子
        if (this.particles.length > 0) {
            this.particles.forEach(particle => {
                particle.canvasWidth = this.canvas.width;
                particle.canvasHeight = this.canvas.height;
            });
        }
    }

    // 开始粒子动画
    startParticleAnimation() {
        if (!this.canvas || !this.ctx) return;
        
        const animate = () => {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.particles.forEach(particle => {
                particle.update();
                particle.draw(this.ctx);
            });
            
            this.animationId = requestAnimationFrame(animate);
        };
        
        animate();
    }

    // 暂停动画
    pauseAnimations() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    // 恢复动画
    resumeAnimations() {
        if (!this.animationId && this.canvas && this.ctx) {
            this.startParticleAnimation();
        }
    }

    // 滚动效果
    initScrollEffects() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };
        
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                    
                    // 如果是统计卡片，触发数字动画
                    if (entry.target.classList.contains('stats-card')) {
                        this.animateStatsCard(entry.target);
                    }
                }
            });
        }, observerOptions);
        
        // 观察所有可动画元素
        document.querySelectorAll('.feature-card, .stats-card').forEach(el => {
            this.observer.observe(el);
        });
    }

    // 更新用户信息显示
    updateUserInfo() {
        const userInfoElements = document.querySelectorAll('.user-info-display');
        
        if (this.currentUser) {
            userInfoElements.forEach(el => {
                el.innerHTML = `
                    <div class="user-greeting">
                        <span>欢迎回来，${this.currentUser.name || this.currentUser.username || '用户'}！</span>
                        <span class="user-level">${this.getLevelText(this.currentUser.level || this.currentUser.skill_level)}</span>
                    </div>
                `;
                el.style.display = 'block';
            });
        } else {
            userInfoElements.forEach(el => {
                el.style.display = 'none';
            });
        }
    }

    // 获取技术水平文本
    getLevelText(level) {
        const levels = {
            'beginner': '初学者',
            'intermediate': '中级',
            'advanced': '高级', 
            'professional': '专业'
        };
        return levels[level] || '未知';
    }

    // 平滑滚动到指定区域
    scrollToSection(sectionId) {
        const section = document.getElementById(sectionId);
        if (section) {
            section.scrollIntoView({ 
                behavior: 'smooth',
                block: 'start'
            });
        }
    }

    // 显示统计数据动画
    animateStats() {
        const statNumbers = document.querySelectorAll('.stat-number');
        
        statNumbers.forEach(el => {
            this.animateStatsNumber(el);
        });
    }

    // 动画单个统计卡片
    animateStatsCard(card) {
        const statNumber = card.querySelector('.stat-number');
        if (statNumber) {
            this.animateStatsNumber(statNumber);
        }
    }

    // 动画统计数字
    animateStatsNumber(el) {
        if (el.dataset.animated) return; // 避免重复动画
        
        const text = el.textContent.replace(/[^\d]/g, '');
        const target = parseInt(text) || 0;
        
        if (target === 0) return;
        
        let current = 0;
        const increment = target / 50;
        const duration = 2000; // 2秒
        const stepTime = duration / 50;
        
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                current = target;
                clearInterval(timer);
                el.dataset.animated = 'true';
            }
            
            // 格式化数字显示
            const formattedNumber = Math.floor(current).toLocaleString();
            const originalText = el.textContent;
            const suffix = originalText.replace(/[\d,]+/, '');
            el.textContent = formattedNumber + suffix;
        }, stepTime);
    }

    // 添加首页特有的功能
    initHeroSection() {
        const heroSection = document.querySelector('.hero-section');
        if (!heroSection) return;

        // 打字机效果
        const typewriterElements = heroSection.querySelectorAll('.typewriter');
        typewriterElements.forEach(el => {
            this.typewriterEffect(el);
        });
    }

    // 打字机效果
    typewriterEffect(element) {
        const text = element.textContent;
        element.textContent = '';
        element.style.visibility = 'visible';
        
        let i = 0;
        const timer = setInterval(() => {
            element.textContent = text.slice(0, i + 1);
            i++;
            
            if (i >= text.length) {
                clearInterval(timer);
            }
        }, 50);
    }

    // 添加首页样式
    addIndexStyles() {
        if (document.querySelector('style[data-index-module]')) return;

        const style = document.createElement('style');
        style.setAttribute('data-index-module', 'true');
        style.textContent = `
            .animate-in {
                opacity: 1 !important;
                transform: translateY(0) !important;
                transition: all 0.6s ease;
            }

            .feature-card,
            .stats-card {
                opacity: 0;
                transform: translateY(30px);
                transition: all 0.6s ease;
            }

            .user-greeting {
                display: flex;
                flex-direction: column;
                gap: 5px;
                padding: 10px;
                background: rgba(220, 20, 60, 0.1);
                border-radius: 8px;
                margin: 10px 0;
            }

            .user-level {
                font-size: 12px;
                color: #dc143c;
                font-weight: 600;
            }

            .typewriter {
                visibility: hidden;
            }

            @media (max-width: 768px) {
                .user-greeting {
                    padding: 8px;
                    font-size: 14px;
                }
            }
        `;
        document.head.appendChild(style);
    }

    // 公共API方法
    scrollTo(sectionId) {
        this.scrollToSection(sectionId);
    }

    refreshStats() {
        this.animateStats();
    }

    updateUser(userData) {
        this.currentUser = userData;
        this.updateUserInfo();
    }

    // 销毁模块
    destroy() {
        console.log('🏠 销毁首页模块');
        
        // 停止动画
        this.pauseAnimations();
        
        // 断开观察器
        if (this.observer) {
            this.observer.disconnect();
        }
    }
}

// 创建全局实例
const indexModule = new IndexModule();

// 导出到全局
window.indexModule = indexModule;

// 全局函数兼容
window.scrollToSection = (sectionId) => indexModule.scrollTo(sectionId);

console.log('🏠 首页模块已加载'); 