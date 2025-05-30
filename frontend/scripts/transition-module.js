/**
 * SpinMatch 转场模块 - 完全独立
 * 页面转场、动画、防闪白、滑动管理等功能
 */

class TransitionModule {
    constructor() {
        this.isTransitioning = false;
        this.touchStartY = 0;
        this.touchEndY = 0;
        this.scrollToTopBtn = null;
        this.slideContainer = null;
        this.currentSlide = 0;
        this.totalSlides = 0;
        
        // 立即防闪白
        this.preventFlash();
        
        // 初始化
        this.init();
    }

    // 立即防闪白处理
    preventFlash() {
        // 立即设置背景色
        document.documentElement.style.backgroundColor = '#1a1a1a';
        if (document.body) {
            document.body.style.backgroundColor = '#1a1a1a';
            document.body.style.opacity = '1';
        }

        // 注入防闪白样式
        const style = document.createElement('style');
        style.textContent = `
            html { 
                background-color: #1a1a1a !important; 
                transition: none !important;
            }
            body { 
                background-color: #1a1a1a !important; 
                opacity: 1 !important; 
                transition: none !important;
            }
            body.loading {
                opacity: 0;
                transition: opacity 0.3s ease;
            }
            body.loaded {
                opacity: 1;
            }
        `;
        if (document.head) {
            document.head.appendChild(style);
        } else {
            document.addEventListener('DOMContentLoaded', () => {
                document.head.appendChild(style);
            });
        }
    }

    // 初始化模块
    init() {
        console.log('🎬 初始化转场模块');
        
        // 添加页面转场效果
        this.initPageTransitions();
        
        // 添加回到顶部按钮
        this.initScrollToTop();
        
        // 初始化图片优化
        this.initImageOptimization();
        
        // 初始化滑动容器
        this.initSlideContainer();
        
        // 绑定事件
        this.bindEvents();
        
        // 添加样式
        this.addTransitionStyles();
        
        console.log('✅ 转场模块初始化完成');
    }

    // 初始化页面转场
    initPageTransitions() {
        // 确保页面加载完成后添加动画
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.addPageAnimations();
            });
        } else {
            this.addPageAnimations();
        }
    }

    // 添加页面动画
    addPageAnimations() {
        // 为主要元素添加进入动画
        const animateElements = document.querySelectorAll(
            '.hero, .features, .stats, .footer, .main-content, .sidebar, .header, .nav'
        );
        
        animateElements.forEach((element, index) => {
            element.classList.add('fade-in');
            element.style.animationDelay = `${index * 0.1}s`;
        });

        // 为卡片元素添加错位动画
        const cardElements = document.querySelectorAll(
            '.card, .post-card, .booking-card, .event-card, .user-card'
        );
        
        cardElements.forEach((element, index) => {
            element.classList.add('slide-up');
            element.style.animationDelay = `${(index % 6) * 0.1}s`;
        });

        // 标记页面已加载
        setTimeout(() => {
            document.body.classList.add('loaded');
            document.body.classList.remove('loading');
        }, 100);
    }

    // 初始化回到顶部
    initScrollToTop() {
        this.scrollToTopBtn = document.createElement('button');
        this.scrollToTopBtn.className = 'scroll-to-top';
        this.scrollToTopBtn.innerHTML = '<i class="fas fa-arrow-up"></i>';
        this.scrollToTopBtn.setAttribute('aria-label', '回到顶部');
        
        document.body.appendChild(this.scrollToTopBtn);
        
        // 监听滚动
        let ticking = false;
        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    const scrolled = window.pageYOffset;
                    if (scrolled > 300) {
                        this.scrollToTopBtn.classList.add('visible');
                    } else {
                        this.scrollToTopBtn.classList.remove('visible');
                    }
                    
                    // 视差效果
                    this.updateParallax(scrolled);
                    
                    ticking = false;
                });
                ticking = true;
            }
        });
        
        // 点击回到顶部
        this.scrollToTopBtn.addEventListener('click', () => {
            this.scrollToTop();
        });
    }

    // 平滑滚动到顶部
    scrollToTop() {
        const startPos = window.pageYOffset;
        const duration = Math.min(startPos / 3, 800); // 动态持续时间
        const startTime = performance.now();
        
        const animateScroll = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // 使用easeOutCubic缓动函数
            const easeOutCubic = 1 - Math.pow(1 - progress, 3);
            const currentPos = startPos * (1 - easeOutCubic);
            
            window.scrollTo(0, currentPos);
            
            if (progress < 1) {
                requestAnimationFrame(animateScroll);
            }
        };
        
        requestAnimationFrame(animateScroll);
    }

    // 更新视差效果
    updateParallax(scrolled) {
        const parallaxElements = document.querySelectorAll('.parallax');
        parallaxElements.forEach(element => {
            const speed = element.dataset.speed || 0.5;
            const yPos = -(scrolled * speed);
            element.style.transform = `translateY(${yPos}px)`;
        });
    }

    // 初始化图片优化
    initImageOptimization() {
        // 为现有图片添加加载动画
        this.optimizeExistingImages();
        
        // 监听新增图片
        this.observeNewImages();
    }

    // 优化现有图片
    optimizeExistingImages() {
        const images = document.querySelectorAll('img');
        images.forEach(img => this.optimizeImage(img));
    }

    // 优化单张图片
    optimizeImage(img) {
        if (img.complete && img.naturalHeight !== 0) {
            // 图片已加载
            img.classList.add('loaded');
            return;
        }

        // 添加加载状态
        img.classList.add('loading');
        img.style.opacity = '0';
        img.style.transition = 'opacity 0.3s ease';
        
        const handleLoad = () => {
            img.style.opacity = '1';
            img.classList.remove('loading');
            img.classList.add('loaded');
        };
        
        const handleError = () => {
            img.style.opacity = '0.5';
            img.classList.remove('loading');
            img.classList.add('error');
            console.warn('图片加载失败:', img.src);
        };
        
        img.addEventListener('load', handleLoad, { once: true });
        img.addEventListener('error', handleError, { once: true });
    }

    // 监听新增图片
    observeNewImages() {
        if ('MutationObserver' in window) {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach(mutation => {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === 1) { // Element node
                            if (node.tagName === 'IMG') {
                                this.optimizeImage(node);
                            } else {
                                const images = node.querySelectorAll('img');
                                images.forEach(img => this.optimizeImage(img));
                            }
                        }
                    });
                });
            });
            
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        }
    }

    // 初始化滑动容器
    initSlideContainer() {
        this.slideContainer = document.createElement('div');
        this.slideContainer.className = 'slide-container';
        this.slideContainer.innerHTML = `
            <div class="slide-wrapper">
                <div class="slide-header">
                    <div class="slide-title">内容展示</div>
                    <div class="slide-controls">
                        <button class="slide-nav prev" onclick="transitionModule.prevSlide()">
                            <i class="fas fa-chevron-left"></i>
                        </button>
                        <div class="slide-counter">
                            <span class="current-slide">1</span> / <span class="total-slides">1</span>
                        </div>
                        <button class="slide-nav next" onclick="transitionModule.nextSlide()">
                            <i class="fas fa-chevron-right"></i>
                        </button>
                        <button class="slide-close" onclick="transitionModule.closeSlideShow()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
                <div class="slide-content"></div>
                <div class="slide-indicators"></div>
            </div>
        `;
        document.body.appendChild(this.slideContainer);
    }

    // 绑定事件
    bindEvents() {
        // 页面切换事件
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[href]');
            if (link && this.shouldInterceptLink(link)) {
                e.preventDefault();
                this.navigateToPage(link.href);
            }
        });

        // 键盘事件
        document.addEventListener('keydown', (e) => {
            if (this.slideContainer.style.display === 'flex') {
                switch(e.key) {
                    case 'ArrowLeft':
                        e.preventDefault();
                        this.prevSlide();
                        break;
                    case 'ArrowRight':
                        e.preventDefault();
                        this.nextSlide();
                        break;
                    case 'Escape':
                        e.preventDefault();
                        this.closeSlideShow();
                        break;
                }
            }
        });

        // 触摸事件
        document.addEventListener('touchstart', (e) => {
            this.touchStartY = e.touches[0].clientY;
        });

        document.addEventListener('touchend', (e) => {
            this.touchEndY = e.changedTouches[0].clientY;
            this.handleSwipe();
        });
    }

    // 判断是否拦截链接
    shouldInterceptLink(link) {
        const href = link.getAttribute('href');
        
        // 忽略外部链接、锚点、特殊链接
        if (!href || 
            href.startsWith('#') || 
            href.startsWith('mailto:') || 
            href.startsWith('tel:') ||
            href.includes('://') && !href.includes(window.location.hostname)) {
            return false;
        }
        
        // 忽略下载链接
        if (link.hasAttribute('download')) {
            return false;
        }
        
        return true;
    }

    // 导航到页面
    async navigateToPage(url) {
        if (this.isTransitioning) return;
        
        this.isTransitioning = true;
        
        try {
            // 添加退出动画
            document.body.classList.add('page-exit');
            
            // 等待动画完成
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // 导航到新页面
            window.location.href = url;
            
        } catch (error) {
            console.error('页面导航失败:', error);
            this.isTransitioning = false;
            document.body.classList.remove('page-exit');
        }
    }

    // 处理滑动手势
    handleSwipe() {
        const swipeThreshold = 50;
        const diff = this.touchStartY - this.touchEndY;
        
        if (Math.abs(diff) > swipeThreshold) {
            if (diff > 0) {
                // 向上滑动
                this.nextSlide();
            } else {
                // 向下滑动
                this.prevSlide();
            }
        }
    }

    // 开启幻灯片模式
    startSlideShow(items, startIndex = 0) {
        this.currentSlide = startIndex;
        this.totalSlides = items.length;
        
        const slideContent = this.slideContainer.querySelector('.slide-content');
        const slideIndicators = this.slideContainer.querySelector('.slide-indicators');
        
        // 清空内容
        slideContent.innerHTML = '';
        slideIndicators.innerHTML = '';
        
        // 添加内容
        items.forEach((item, index) => {
            const slide = document.createElement('div');
            slide.className = `slide-item ${index === startIndex ? 'active' : ''}`;
            slide.innerHTML = item;
            slideContent.appendChild(slide);
            
            // 添加指示器
            const indicator = document.createElement('div');
            indicator.className = `slide-indicator ${index === startIndex ? 'active' : ''}`;
            indicator.addEventListener('click', () => this.goToSlide(index));
            slideIndicators.appendChild(indicator);
        });
        
        // 更新计数器
        this.updateSlideCounter();
        
        // 显示容器
        this.slideContainer.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // 添加进入动画
        setTimeout(() => {
            this.slideContainer.classList.add('active');
        }, 10);
    }

    // 上一张幻灯片
    prevSlide() {
        if (this.currentSlide > 0) {
            this.goToSlide(this.currentSlide - 1);
        }
    }

    // 下一张幻灯片
    nextSlide() {
        if (this.currentSlide < this.totalSlides - 1) {
            this.goToSlide(this.currentSlide + 1);
        }
    }

    // 跳转到指定幻灯片
    goToSlide(index) {
        if (index < 0 || index >= this.totalSlides || index === this.currentSlide) {
            return;
        }
        
        const slides = this.slideContainer.querySelectorAll('.slide-item');
        const indicators = this.slideContainer.querySelectorAll('.slide-indicator');
        
        // 移除当前激活状态
        slides[this.currentSlide].classList.remove('active');
        indicators[this.currentSlide].classList.remove('active');
        
        // 设置新的激活状态
        this.currentSlide = index;
        slides[this.currentSlide].classList.add('active');
        indicators[this.currentSlide].classList.add('active');
        
        // 更新计数器
        this.updateSlideCounter();
    }

    // 更新幻灯片计数器
    updateSlideCounter() {
        const currentSlideEl = this.slideContainer.querySelector('.current-slide');
        const totalSlidesEl = this.slideContainer.querySelector('.total-slides');
        
        if (currentSlideEl) currentSlideEl.textContent = this.currentSlide + 1;
        if (totalSlidesEl) totalSlidesEl.textContent = this.totalSlides;
    }

    // 关闭幻灯片模式
    closeSlideShow() {
        this.slideContainer.classList.remove('active');
        
        setTimeout(() => {
            this.slideContainer.style.display = 'none';
            document.body.style.overflow = 'auto';
        }, 300);
    }

    // 创建页面过渡效果
    createPageTransition(direction = 'fade') {
        const overlay = document.createElement('div');
        overlay.className = `page-transition-overlay ${direction}`;
        document.body.appendChild(overlay);
        
        return new Promise(resolve => {
            setTimeout(() => {
                overlay.remove();
                resolve();
            }, 500);
        });
    }

    // 添加元素动画
    animateElement(element, animation = 'fadeIn', delay = 0) {
        setTimeout(() => {
            element.classList.add('animated', animation);
        }, delay);
    }

    // 批量添加动画
    animateElements(selector, animation = 'fadeIn', stagger = 100) {
        const elements = document.querySelectorAll(selector);
        elements.forEach((element, index) => {
            this.animateElement(element, animation, index * stagger);
        });
    }

    // 添加样式
    addTransitionStyles() {
        if (document.querySelector('style[data-transition-module]')) return;

        const style = document.createElement('style');
        style.setAttribute('data-transition-module', 'true');
        style.textContent = `
            /* 页面基础动画 */
            .fade-in {
                opacity: 0;
                animation: fadeIn 0.6s ease forwards;
            }

            .slide-up {
                opacity: 0;
                transform: translateY(30px);
                animation: slideUp 0.6s ease forwards;
            }

            @keyframes fadeIn {
                to {
                    opacity: 1;
                }
            }

            @keyframes slideUp {
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            /* 页面退出动画 */
            .page-exit {
                opacity: 0;
                transition: opacity 0.3s ease;
            }

            /* 回到顶部按钮 */
            .scroll-to-top {
                position: fixed;
                bottom: 30px;
                right: 30px;
                width: 50px;
                height: 50px;
                background: #dc3545;
                color: white;
                border: none;
                border-radius: 50%;
                cursor: pointer;
                opacity: 0;
                visibility: hidden;
                transform: translateY(20px);
                transition: all 0.3s ease;
                z-index: 1000;
                box-shadow: 0 4px 12px rgba(220, 53, 69, 0.3);
            }

            .scroll-to-top:hover {
                background: #c82333;
                transform: translateY(0) scale(1.1);
            }

            .scroll-to-top.visible {
                opacity: 1;
                visibility: visible;
                transform: translateY(0);
            }

            /* 幻灯片容器 */
            .slide-container {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.9);
                z-index: 10000;
                display: none;
                align-items: center;
                justify-content: center;
                opacity: 0;
                transition: opacity 0.3s ease;
            }

            .slide-container.active {
                opacity: 1;
            }

            .slide-wrapper {
                width: 90%;
                max-width: 800px;
                height: 90%;
                background: white;
                border-radius: 12px;
                display: flex;
                flex-direction: column;
                overflow: hidden;
            }

            .slide-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 20px;
                border-bottom: 1px solid #eee;
                background: #f8f9fa;
            }

            .slide-title {
                font-size: 18px;
                font-weight: 600;
                color: #333;
            }

            .slide-controls {
                display: flex;
                align-items: center;
                gap: 10px;
            }

            .slide-nav {
                background: #dc3545;
                color: white;
                border: none;
                width: 35px;
                height: 35px;
                border-radius: 50%;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s ease;
            }

            .slide-nav:hover {
                background: #c82333;
                transform: scale(1.1);
            }

            .slide-nav:disabled {
                background: #ccc;
                cursor: not-allowed;
                transform: none;
            }

            .slide-counter {
                font-size: 14px;
                color: #666;
                margin: 0 10px;
            }

            .slide-close {
                background: #6c757d;
                color: white;
                border: none;
                width: 35px;
                height: 35px;
                border-radius: 50%;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s ease;
            }

            .slide-close:hover {
                background: #5a6268;
                transform: scale(1.1);
            }

            .slide-content {
                flex: 1;
                position: relative;
                overflow: hidden;
            }

            .slide-item {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                padding: 20px;
                opacity: 0;
                transform: translateX(100%);
                transition: all 0.3s ease;
                overflow-y: auto;
            }

            .slide-item.active {
                opacity: 1;
                transform: translateX(0);
            }

            .slide-indicators {
                display: flex;
                justify-content: center;
                gap: 10px;
                padding: 20px;
                background: #f8f9fa;
            }

            .slide-indicator {
                width: 10px;
                height: 10px;
                border-radius: 50%;
                background: #ccc;
                cursor: pointer;
                transition: all 0.2s ease;
            }

            .slide-indicator.active {
                background: #dc3545;
                transform: scale(1.2);
            }

            /* 页面过渡覆盖层 */
            .page-transition-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: #1a1a1a;
                z-index: 9999;
                opacity: 1;
                animation: pageTransitionOut 0.5s ease forwards;
            }

            .page-transition-overlay.fade {
                animation: pageTransitionFade 0.5s ease forwards;
            }

            @keyframes pageTransitionOut {
                to {
                    opacity: 0;
                    visibility: hidden;
                }
            }

            @keyframes pageTransitionFade {
                0% { opacity: 1; }
                50% { opacity: 1; }
                100% { opacity: 0; visibility: hidden; }
            }

            /* 视差效果 */
            .parallax {
                will-change: transform;
            }

            /* 响应式设计 */
            @media (max-width: 768px) {
                .scroll-to-top {
                    bottom: 20px;
                    right: 20px;
                    width: 45px;
                    height: 45px;
                }

                .slide-wrapper {
                    width: 95%;
                    height: 95%;
                }

                .slide-header {
                    padding: 15px;
                }

                .slide-controls {
                    gap: 5px;
                }

                .slide-nav,
                .slide-close {
                    width: 30px;
                    height: 30px;
                }
            }
        `;
        document.head.appendChild(style);
    }

    // 公共API方法
    showSlideShow(items, startIndex = 0) {
        this.startSlideShow(items, startIndex);
    }

    closeSlide() {
        this.closeSlideShow();
    }

    smoothScrollTo(target, duration = 800) {
        const targetElement = typeof target === 'string' ? document.querySelector(target) : target;
        if (!targetElement) return;

        const targetPos = targetElement.offsetTop;
        const startPos = window.pageYOffset;
        const diff = targetPos - startPos;
        const startTime = performance.now();

        const animateScroll = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const easeOutCubic = 1 - Math.pow(1 - progress, 3);
            const currentPos = startPos + (diff * easeOutCubic);
            
            window.scrollTo(0, currentPos);
            
            if (progress < 1) {
                requestAnimationFrame(animateScroll);
            }
        };
        
        requestAnimationFrame(animateScroll);
    }

    addAnimation(element, animation, delay = 0) {
        this.animateElement(element, animation, delay);
    }

    addBatchAnimation(selector, animation, stagger = 100) {
        this.animateElements(selector, animation, stagger);
    }

    // 销毁模块
    destroy() {
        console.log('🎬 销毁转场模块');
        
        if (this.scrollToTopBtn) {
            this.scrollToTopBtn.remove();
        }
        
        if (this.slideContainer) {
            this.slideContainer.remove();
        }
    }
}

// 立即执行防闪白处理
(function() {
    const style = document.createElement('style');
    style.textContent = `
        html { background-color: #1a1a1a !important; }
        body { background-color: #1a1a1a !important; opacity: 1 !important; }
    `;
    if (document.head) {
        document.head.appendChild(style);
    } else {
        document.addEventListener('DOMContentLoaded', () => {
            if (!document.querySelector('style[data-flash-prevent]')) {
                style.setAttribute('data-flash-prevent', 'true');
                document.head.appendChild(style);
            }
        });
    }
    
    if (document.documentElement) {
        document.documentElement.style.backgroundColor = '#1a1a1a';
    }
    if (document.body) {
        document.body.style.backgroundColor = '#1a1a1a';
        document.body.style.opacity = '1';
    }
})();

// 创建全局实例
const transitionModule = new TransitionModule();

// 导出到全局
window.transitionModule = transitionModule;

// 全局函数兼容
window.showSlideShow = (items, startIndex) => transitionModule.showSlideShow(items, startIndex);
window.closeSlideShow = () => transitionModule.closeSlide();
window.smoothScrollTo = (target, duration) => transitionModule.smoothScrollTo(target, duration);

console.log('🎬 转场模块已加载'); 