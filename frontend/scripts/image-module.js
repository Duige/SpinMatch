/**
 * SpinMatch 图片模块 - 完全独立
 * 图片管理、替换、加载、优化等功能
 */

class ImageModule {
    constructor() {
        this.apiBaseUrl = this.detectApiUrl();
        this.pexelsKey = '8LJuUGXR8AFHZE6GhJwL0JvdXWqZOuSA5qlpfuiZ8MpHEvXzfmnJGFOe';
        this.pixabayKey = '46675996-6fedffc1f2be7a45825b52b37';
        this.replacementQueue = [];
        this.imageCache = new Map();
        this.isReplacing = false;
        this.lazyLoadObserver = null;
        
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
        console.log('🖼️ 初始化图片模块');
        
        // 初始化懒加载
        this.initLazyLoading();
        
        // 初始化图片错误处理
        this.initErrorHandling();
        
        // 初始化图片替换配置
        this.initReplacementConfigs();
        
        // 自动替换图片
        this.autoReplaceImages();
        
        console.log('✅ 图片模块初始化完成');
    }

    // 初始化懒加载
    initLazyLoading() {
        if ('IntersectionObserver' in window) {
            this.lazyLoadObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.loadLazyImage(entry.target);
                        this.lazyLoadObserver.unobserve(entry.target);
                    }
                });
            }, {
                rootMargin: '50px'
            });

            // 观察所有lazy图片
            document.querySelectorAll('img[data-src], [data-bg-src]').forEach(img => {
                this.lazyLoadObserver.observe(img);
            });
        } else {
            // 不支持IntersectionObserver时的回退
            this.loadAllLazyImages();
        }
    }

    // 加载懒加载图片
    loadLazyImage(element) {
        if (element.tagName === 'IMG' && element.dataset.src) {
            element.src = element.dataset.src;
            element.removeAttribute('data-src');
            element.classList.remove('lazy');
            element.classList.add('loaded');
        } else if (element.dataset.bgSrc) {
            element.style.backgroundImage = `url(${element.dataset.bgSrc})`;
            element.removeAttribute('data-bg-src');
            element.classList.remove('lazy-bg');
            element.classList.add('loaded-bg');
        }
    }

    // 加载所有懒加载图片（回退方案）
    loadAllLazyImages() {
        document.querySelectorAll('img[data-src], [data-bg-src]').forEach(element => {
            this.loadLazyImage(element);
        });
    }

    // 初始化图片错误处理
    initErrorHandling() {
        document.addEventListener('error', (e) => {
            if (e.target.tagName === 'IMG') {
                this.handleImageError(e.target);
            }
        }, true);
    }

    // 处理图片加载错误
    handleImageError(img) {
        if (img.dataset.fallbackUsed) return;

        // 生成默认头像或占位图
        const fallbackSrc = this.generatePlaceholderImage(img);
        img.src = fallbackSrc;
        img.dataset.fallbackUsed = 'true';
        
        console.warn('图片加载失败，使用默认图片:', img.src);
    }

    // 生成占位图片
    generatePlaceholderImage(img) {
        const width = img.width || 200;
        const height = img.height || 200;
        const text = img.alt || '图片';
        
        // 如果是头像相关的图片，生成头像占位图
        if (img.classList.contains('avatar') || img.alt.includes('头像') || img.src.includes('avatar')) {
            return this.generateAvatar(text);
        }
        
        // 乒乓球相关占位图
        return this.generateTableTennisPlaceholder(width, height, text);
    }

    // 生成头像
    generateAvatar(name) {
        const colors = ['#FF6B35', '#DC143C', '#FFD700', '#32CD32', '#1E90FF', '#9370DB'];
        const color = colors[name.charCodeAt(0) % colors.length];
        const initial = name.charAt(0);
        
        return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Ccircle cx='40' cy='40' r='40' fill='${encodeURIComponent(color)}'/%3E%3Ctext x='40' y='52' text-anchor='middle' fill='white' font-size='24' font-family='Arial'%3E${initial}%3C/text%3E%3C/svg%3E`;
    }

    // 生成乒乓球主题占位图
    generateTableTennisPlaceholder(width, height, text) {
        return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}' viewBox='0 0 ${width} ${height}'%3E%3Crect width='${width}' height='${height}' fill='%23f8f9fa'/%3E%3Ccircle cx='${width/2}' cy='${height/2}' r='20' fill='%23FF6B35'/%3E%3Ctext x='${width/2}' y='${height/2 + 30}' text-anchor='middle' fill='%23666' font-size='14' font-family='Arial'%3E${encodeURIComponent(text)}%3C/text%3E%3C/svg%3E`;
    }

    // 初始化图片替换配置
    initReplacementConfigs() {
        this.replacementConfigs = {
            // 赛事页面配置
            events: [
                {
                    selector: 'img[alt*="锦标赛"], img[alt*="比赛"], .event-image img',
                    category: 'table-tennis-tournament',
                    keywords: '乒乓球比赛'
                },
                {
                    selector: 'img[alt*="训练"], .training-image img',
                    category: 'table-tennis-training',
                    keywords: '乒乓球训练'
                },
                {
                    selector: 'img[alt*="青少年"], .youth-event img',
                    category: 'table-tennis-youth',
                    keywords: '青少年乒乓球'
                }
            ],

            // 社区页面配置
            community: [
                {
                    selector: '.post-image img, .video-thumbnail img',
                    category: 'table-tennis-action',
                    keywords: '乒乓球动作'
                },
                {
                    selector: 'img[alt*="球拍"], .equipment-image img',
                    category: 'table-tennis-equipment',
                    keywords: '乒乓球拍'
                },
                {
                    selector: '.community-hero img, .banner-image img',
                    category: 'table-tennis-sports',
                    keywords: '乒乓球运动'
                }
            ],

            // 约球页面配置
            booking: [
                {
                    selector: '.venue-image img, .court-image img',
                    category: 'table-tennis-venue',
                    keywords: '乒乓球场地'
                },
                {
                    selector: '.activity-image img',
                    category: 'table-tennis-game',
                    keywords: '乒乓球游戏'
                }
            ]
        };
    }

    // 自动替换图片
    async autoReplaceImages() {
        const currentPage = this.getCurrentPage();
        const config = this.replacementConfigs[currentPage];
        
        if (!config) {
            console.log('当前页面无图片替换配置');
            return;
        }

        console.log(`🖼️ 开始为 ${currentPage} 页面替换图片`);

        try {
            for (const rule of config) {
                const elements = document.querySelectorAll(rule.selector);
                if (elements.length > 0) {
                    const images = await this.fetchImages(rule.keywords, elements.length);
                    
                    elements.forEach((element, index) => {
                        if (images[index]) {
                            this.addReplacementRule(rule.selector, images[index].url, rule.keywords);
                        }
                    });
                }
            }

            await this.executeReplacements();
        } catch (error) {
            console.error('自动替换图片失败:', error);
        }
    }

    // 获取当前页面类型
    getCurrentPage() {
        const path = window.location.pathname;
        if (path.includes('events')) return 'events';
        if (path.includes('community')) return 'community';
        if (path.includes('booking')) return 'booking';
        if (path.includes('profile')) return 'profile';
        return 'index';
    }

    // 获取图片
    async fetchImages(keywords, count = 6) {
        // 先检查缓存
        const cacheKey = `${keywords}_${count}`;
        if (this.imageCache.has(cacheKey)) {
            return this.imageCache.get(cacheKey);
        }

        try {
            // 优先使用Pexels
            let images = await this.fetchPexelsImages(keywords, count);
            
            // 如果Pexels图片不足，补充Pixabay图片
            if (images.length < count) {
                const pixabayImages = await this.fetchPixabayImages(keywords, count - images.length);
                images = [...images, ...pixabayImages];
            }

            // 如果还是不足，使用生成的占位图
            while (images.length < count) {
                images.push({
                    url: this.generateTableTennisPlaceholder(400, 300, keywords),
                    alt: keywords
                });
            }

            // 缓存结果
            this.imageCache.set(cacheKey, images);
            
            return images;
        } catch (error) {
            console.error('获取图片失败:', error);
            // 返回占位图
            return Array.from({ length: count }, () => ({
                url: this.generateTableTennisPlaceholder(400, 300, keywords),
                alt: keywords
            }));
        }
    }

    // 从Pexels获取图片
    async fetchPexelsImages(query, count) {
        try {
            const response = await fetch(
                `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${count}&page=1`,
                {
                    headers: {
                        'Authorization': this.pexelsKey
                    }
                }
            );

            if (!response.ok) {
                throw new Error(`Pexels API error: ${response.status}`);
            }

            const data = await response.json();
            return data.photos.map(photo => ({
                url: photo.src.medium,
                alt: photo.alt || query,
                source: 'pexels'
            }));
        } catch (error) {
            console.warn('Pexels获取失败:', error);
            return [];
        }
    }

    // 从Pixabay获取图片
    async fetchPixabayImages(query, count) {
        try {
            const response = await fetch(
                `https://pixabay.com/api/?key=${this.pixabayKey}&q=${encodeURIComponent(query)}&image_type=photo&per_page=${count}&category=sports`
            );

            if (!response.ok) {
                throw new Error(`Pixabay API error: ${response.status}`);
            }

            const data = await response.json();
            return data.hits.map(hit => ({
                url: hit.webformatURL,
                alt: hit.tags || query,
                source: 'pixabay'
            }));
        } catch (error) {
            console.warn('Pixabay获取失败:', error);
            return [];
        }
    }

    // 添加图片替换规则
    addReplacementRule(selector, newImageUrl, alt = '') {
        this.replacementQueue.push({
            selector,
            newImageUrl,
            alt
        });
    }

    // 批量添加替换规则
    addBatchReplacements(replacements) {
        replacements.forEach(rule => {
            this.addReplacementRule(rule.selector, rule.newImageUrl, rule.alt);
        });
    }

    // 执行图片替换
    async executeReplacements() {
        if (this.isReplacing) {
            console.log('图片替换正在进行中...');
            return;
        }

        this.isReplacing = true;
        console.log(`🖼️ 开始替换 ${this.replacementQueue.length} 张图片`);

        for (let i = 0; i < this.replacementQueue.length; i++) {
            const rule = this.replacementQueue[i];
            await this.replaceImage(rule);
            
            // 添加延迟避免过快替换
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        this.isReplacing = false;
        this.replacementQueue = [];
        console.log('✅ 所有图片替换完成');
    }

    // 替换单张图片
    async replaceImage(rule) {
        try {
            const elements = document.querySelectorAll(rule.selector);
            
            if (elements.length === 0) {
                return;
            }

            elements.forEach(element => {
                if (element.tagName === 'IMG') {
                    // 替换img标签的src
                    const oldSrc = element.src;
                    element.src = rule.newImageUrl;
                    if (rule.alt) {
                        element.alt = rule.alt;
                    }
                    
                    // 添加加载动画
                    element.style.opacity = '0';
                    element.style.transition = 'opacity 0.3s ease';
                    
                    element.onload = () => {
                        element.style.opacity = '1';
                    };
                    
                    element.onerror = () => {
                        element.src = oldSrc;
                        element.style.opacity = '1';
                    };
                    
                } else {
                    // 替换背景图片
                    element.style.backgroundImage = `url(${rule.newImageUrl})`;
                }
            });
        } catch (error) {
            console.error(`替换图片失败: ${rule.selector}`, error);
        }
    }

    // 预加载图片
    preloadImage(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = url;
        });
    }

    // 预加载多张图片
    async preloadImages(urls) {
        const promises = urls.map(url => 
            this.preloadImage(url).catch(err => {
                console.warn('预加载图片失败:', url, err);
                return null;
            })
        );
        
        const results = await Promise.all(promises);
        return results.filter(img => img !== null);
    }

    // 压缩图片
    compressImage(file, maxWidth = 800, quality = 0.8) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            img.onload = () => {
                // 计算新尺寸
                let { width, height } = img;
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }
                
                canvas.width = width;
                canvas.height = height;
                
                // 绘制并压缩
                ctx.drawImage(img, 0, 0, width, height);
                canvas.toBlob(resolve, 'image/jpeg', quality);
            };
            
            img.src = URL.createObjectURL(file);
        });
    }

    // 生成随机乒乓球图片
    generateRandomTableTennisImage(width = 400, height = 300) {
        const colors = ['#FF6B35', '#DC143C', '#FFA500', '#32CD32', '#1E90FF'];
        const bgColor = colors[Math.floor(Math.random() * colors.length)];
        
        return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}' viewBox='0 0 ${width} ${height}'%3E%3Cdefs%3E%3ClinearGradient id='grad' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:${encodeURIComponent(bgColor)};stop-opacity:1' /%3E%3Cstop offset='100%25' style='stop-color:${encodeURIComponent(bgColor)};stop-opacity:0.7' /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='${width}' height='${height}' fill='url(%23grad)'/%3E%3Ccircle cx='${width/2}' cy='${height/2}' r='30' fill='white' opacity='0.8'/%3E%3Ctext x='${width/2}' y='${height/2 + 50}' text-anchor='middle' fill='white' font-size='16' font-family='Arial'%3E🏓 SpinMatch%3C/text%3E%3C/svg%3E`;
    }

    // 获取图片信息
    getImageInfo(img) {
        return {
            src: img.src,
            alt: img.alt,
            width: img.naturalWidth || img.width,
            height: img.naturalHeight || img.height,
            aspectRatio: (img.naturalWidth || img.width) / (img.naturalHeight || img.height),
            loaded: img.complete && img.naturalHeight !== 0
        };
    }

    // 优化图片显示
    optimizeImageDisplay() {
        const images = document.querySelectorAll('img');
        
        images.forEach(img => {
            // 设置加载占位符
            if (!img.src && !img.dataset.src) {
                img.src = this.generateTableTennisPlaceholder(200, 200, img.alt || '加载中...');
            }
            
            // 添加响应式类
            if (!img.classList.contains('responsive')) {
                img.style.maxWidth = '100%';
                img.style.height = 'auto';
            }
            
            // 添加加载动画
            if (!img.complete) {
                img.style.opacity = '0';
                img.style.transition = 'opacity 0.3s ease';
                
                img.onload = () => {
                    img.style.opacity = '1';
                };
            }
        });
    }

    // 清空缓存
    clearCache() {
        this.imageCache.clear();
        console.log('🖼️ 图片缓存已清空');
    }

    // 获取缓存状态
    getCacheStatus() {
        return {
            size: this.imageCache.size,
            keys: Array.from(this.imageCache.keys())
        };
    }

    // 清空替换队列
    clearQueue() {
        this.replacementQueue = [];
        console.log('🖼️ 替换队列已清空');
    }

    // 获取队列状态
    getQueueStatus() {
        return {
            total: this.replacementQueue.length,
            isReplacing: this.isReplacing
        };
    }

    // 手动触发图片替换
    async replaceImagesManually(selector, keywords, count = 1) {
        try {
            const images = await this.fetchImages(keywords, count);
            
            images.forEach((image, index) => {
                this.addReplacementRule(
                    `${selector}:nth-child(${index + 1})`,
                    image.url,
                    keywords
                );
            });
            
            await this.executeReplacements();
            
            console.log(`✅ 手动替换完成: ${selector}`);
        } catch (error) {
            console.error('手动替换失败:', error);
        }
    }

    // 添加图片到页面
    addImageToPage(container, imageUrl, alt = '', className = '') {
        const img = document.createElement('img');
        img.src = imageUrl;
        img.alt = alt;
        if (className) {
            img.className = className;
        }
        
        img.style.opacity = '0';
        img.style.transition = 'opacity 0.3s ease';
        
        img.onload = () => {
            img.style.opacity = '1';
        };
        
        img.onerror = () => {
            img.src = this.generateTableTennisPlaceholder(200, 200, alt);
            img.style.opacity = '1';
        };
        
        if (typeof container === 'string') {
            const containerEl = document.querySelector(container);
            if (containerEl) {
                containerEl.appendChild(img);
            }
        } else {
            container.appendChild(img);
        }
        
        return img;
    }

    // 公共API方法
    replaceImages(selector, keywords, count = 1) {
        return this.replaceImagesManually(selector, keywords, count);
    }

    getImages(keywords, count = 6) {
        return this.fetchImages(keywords, count);
    }

    createPlaceholder(width, height, text) {
        return this.generateTableTennisPlaceholder(width, height, text);
    }

    createAvatar(name) {
        return this.generateAvatar(name);
    }

    // 销毁模块
    destroy() {
        console.log('🖼️ 销毁图片模块');
        
        if (this.lazyLoadObserver) {
            this.lazyLoadObserver.disconnect();
        }
        
        this.clearCache();
        this.clearQueue();
    }
}

// 创建全局实例
const imageModule = new ImageModule();

// 导出到全局
window.imageModule = imageModule;

// 全局函数兼容
window.replaceImages = (selector, keywords, count) => imageModule.replaceImages(selector, keywords, count);
window.getImages = (keywords, count) => imageModule.getImages(keywords, count);
window.createPlaceholder = (width, height, text) => imageModule.createPlaceholder(width, height, text);
window.createAvatar = (name) => imageModule.createAvatar(name);

console.log('🖼️ 图片模块已加载'); 