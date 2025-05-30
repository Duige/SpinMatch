/**
 * SpinMatch 性能模块 - 完全独立
 * 处理性能监控、优化、资源管理等功能
 */

class PerformanceModule {
    constructor() {
        this.metrics = {
            pageLoadTime: 0,
            domContentLoaded: 0,
            firstPaint: 0,
            firstContentfulPaint: 0,
            largestContentfulPaint: 0,
            cumulativeLayoutShift: 0,
            firstInputDelay: 0
        };
        
        this.observers = [];
        this.isEnabled = true;
        this.reportEndpoint = this.detectApiUrl() + '/api/performance';
        
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
        console.log('⚡ 初始化性能模块');
        
        // 检查性能监控是否可用
        if (!this.isPerformanceSupported()) {
            console.warn('⚠️ 浏览器不支持性能监控API');
            this.isEnabled = false;
            return;
        }

        // 开始性能监控
        this.startPerformanceMonitoring();
        
        // 设置资源优化
        this.setupResourceOptimization();
        
        // 设置内存管理
        this.setupMemoryManagement();
        
        console.log('✅ 性能模块初始化完成');
    }

    // 检查性能监控支持
    isPerformanceSupported() {
        return !!(window.performance && 
                 window.performance.mark && 
                 window.performance.measure &&
                 window.PerformanceObserver);
    }

    // 开始性能监控
    startPerformanceMonitoring() {
        // 监控页面加载时间
        this.measurePageLoadTime();
        
        // 监控Core Web Vitals
        this.measureCoreWebVitals();
        
        // 监控资源加载
        this.measureResourceLoading();
        
        // 监控自定义指标
        this.measureCustomMetrics();
        
        // 定期报告性能数据
        this.startPerformanceReporting();
    }

    // 测量页面加载时间
    measurePageLoadTime() {
        if (document.readyState === 'complete') {
            this.calculateLoadTimes();
        } else {
            window.addEventListener('load', () => {
                this.calculateLoadTimes();
            });
        }
    }

    // 计算加载时间
    calculateLoadTimes() {
        const navigation = performance.getEntriesByType('navigation')[0];
        if (navigation) {
            this.metrics.pageLoadTime = navigation.loadEventEnd - navigation.fetchStart;
            this.metrics.domContentLoaded = navigation.domContentLoadedEventEnd - navigation.fetchStart;
        }

        // 获取Paint Timing
        const paintEntries = performance.getEntriesByType('paint');
        paintEntries.forEach(entry => {
            if (entry.name === 'first-paint') {
                this.metrics.firstPaint = entry.startTime;
            } else if (entry.name === 'first-contentful-paint') {
                this.metrics.firstContentfulPaint = entry.startTime;
            }
        });

        this.logPerformanceMetrics();
    }

    // 测量Core Web Vitals
    measureCoreWebVitals() {
        // LCP (Largest Contentful Paint)
        this.observeLCP();
        
        // CLS (Cumulative Layout Shift)
        this.observeCLS();
        
        // FID (First Input Delay)
        this.observeFID();
    }

    // 观察LCP
    observeLCP() {
        if (!window.PerformanceObserver) return;

        try {
            const observer = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                const lastEntry = entries[entries.length - 1];
                this.metrics.largestContentfulPaint = lastEntry.startTime;
            });

            observer.observe({ entryTypes: ['largest-contentful-paint'] });
            this.observers.push(observer);
        } catch (error) {
            console.warn('LCP监控设置失败:', error);
        }
    }

    // 观察CLS
    observeCLS() {
        if (!window.PerformanceObserver) return;

        try {
            let clsValue = 0;
            const observer = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (!entry.hadRecentInput) {
                        clsValue += entry.value;
                        this.metrics.cumulativeLayoutShift = clsValue;
                    }
                }
            });

            observer.observe({ entryTypes: ['layout-shift'] });
            this.observers.push(observer);
        } catch (error) {
            console.warn('CLS监控设置失败:', error);
        }
    }

    // 观察FID
    observeFID() {
        if (!window.PerformanceObserver) return;

        try {
            const observer = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    this.metrics.firstInputDelay = entry.processingStart - entry.startTime;
                    break; // 只记录第一次输入延迟
                }
            });

            observer.observe({ entryTypes: ['first-input'] });
            this.observers.push(observer);
        } catch (error) {
            console.warn('FID监控设置失败:', error);
        }
    }

    // 测量资源加载
    measureResourceLoading() {
        if (!window.PerformanceObserver) return;

        try {
            const observer = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    this.analyzeResourceEntry(entry);
                }
            });

            observer.observe({ entryTypes: ['resource'] });
            this.observers.push(observer);
        } catch (error) {
            console.warn('资源监控设置失败:', error);
        }
    }

    // 分析资源条目
    analyzeResourceEntry(entry) {
        const slowThreshold = 1000; // 1秒
        const duration = entry.responseEnd - entry.startTime;
        
        if (duration > slowThreshold) {
            console.warn(`慢资源加载: ${entry.name} (${duration.toFixed(2)}ms)`);
            this.reportSlowResource(entry);
        }
    }

    // 报告慢资源
    reportSlowResource(entry) {
        const resourceData = {
            url: entry.name,
            duration: entry.responseEnd - entry.startTime,
            size: entry.transferSize,
            type: this.getResourceType(entry.name),
            timestamp: Date.now()
        };
        
        // 可以发送到分析服务
        this.queueMetricReport('slow_resource', resourceData);
    }

    // 获取资源类型
    getResourceType(url) {
        if (url.includes('.js')) return 'script';
        if (url.includes('.css')) return 'stylesheet';
        if (url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)) return 'image';
        if (url.includes('.woff')) return 'font';
        return 'other';
    }

    // 测量自定义指标
    measureCustomMetrics() {
        // 测量模块加载时间
        this.measureModuleLoadTime();
        
        // 测量API响应时间
        this.measureApiResponseTime();
        
        // 测量用户交互延迟
        this.measureInteractionLatency();
    }

    // 测量模块加载时间
    measureModuleLoadTime() {
        window.addEventListener('module:loaded', (e) => {
            const moduleName = e.detail.name;
            performance.mark(`module-${moduleName}-loaded`);
            
            // 如果存在模块开始标记，计算加载时间
            try {
                performance.measure(`module-${moduleName}-load-time`, 
                                  `module-${moduleName}-start`, 
                                  `module-${moduleName}-loaded`);
                
                const measures = performance.getEntriesByName(`module-${moduleName}-load-time`);
                if (measures.length > 0) {
                    console.log(`📦 模块 ${moduleName} 加载时间: ${measures[0].duration.toFixed(2)}ms`);
                }
            } catch (error) {
                // 没有开始标记，忽略
            }
        });
    }

    // 测量API响应时间
    measureApiResponseTime() {
        // 重写fetch方法来监控API调用
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            const startTime = performance.now();
            const url = args[0];
            
            try {
                const response = await originalFetch(...args);
                const endTime = performance.now();
                const duration = endTime - startTime;
                
                this.recordApiMetric(url, duration, response.status, true);
                return response;
            } catch (error) {
                const endTime = performance.now();
                const duration = endTime - startTime;
                
                this.recordApiMetric(url, duration, 0, false);
                throw error;
            }
        };
    }

    // 记录API指标
    recordApiMetric(url, duration, status, success) {
        const metric = {
            url,
            duration,
            status,
            success,
            timestamp: Date.now()
        };
        
        // 慢API警告
        if (duration > 2000) {
            console.warn(`慢API响应: ${url} (${duration.toFixed(2)}ms)`);
        }
        
        this.queueMetricReport('api_response', metric);
    }

    // 测量用户交互延迟
    measureInteractionLatency() {
        let interactionStart = 0;
        
        ['click', 'keydown', 'touchstart'].forEach(eventType => {
            document.addEventListener(eventType, (e) => {
                interactionStart = performance.now();
                
                // 在下一帧测量响应时间
                requestAnimationFrame(() => {
                    const interactionEnd = performance.now();
                    const latency = interactionEnd - interactionStart;
                    
                    if (latency > 100) { // 超过100ms认为是慢交互
                        console.warn(`慢交互响应: ${eventType} (${latency.toFixed(2)}ms)`);
                        this.queueMetricReport('interaction_latency', {
                            type: eventType,
                            latency,
                            target: e.target.tagName,
                            timestamp: Date.now()
                        });
                    }
                });
            });
        });
    }

    // 设置资源优化
    setupResourceOptimization() {
        // 预加载关键资源
        this.preloadCriticalResources();
        
        // 图片懒加载
        this.setupImageLazyLoading();
        
        // 脚本异步加载
        this.optimizeScriptLoading();
    }

    // 预加载关键资源
    preloadCriticalResources() {
        const criticalResources = [
            { href: '/styles/main.css', as: 'style' },
            { href: '/scripts/auth-module.js', as: 'script' }
        ];

        criticalResources.forEach(resource => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.href = resource.href;
            link.as = resource.as;
            document.head.appendChild(link);
        });
    }

    // 设置图片懒加载
    setupImageLazyLoading() {
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        if (img.dataset.src) {
                            img.src = img.dataset.src;
                            img.removeAttribute('data-src');
                            imageObserver.unobserve(img);
                        }
                    }
                });
            });

            // 观察所有具有data-src属性的图片
            document.querySelectorAll('img[data-src]').forEach(img => {
                imageObserver.observe(img);
            });

            this.observers.push(imageObserver);
        }
    }

    // 优化脚本加载
    optimizeScriptLoading() {
        // 非关键脚本延迟加载
        const deferredScripts = document.querySelectorAll('script[data-defer]');
        deferredScripts.forEach(script => {
            setTimeout(() => {
                const newScript = document.createElement('script');
                newScript.src = script.dataset.src || script.src;
                newScript.async = true;
                document.head.appendChild(newScript);
            }, 1000); // 延迟1秒加载
        });
    }

    // 设置内存管理
    setupMemoryManagement() {
        // 监控内存使用
        this.monitorMemoryUsage();
        
        // 定期清理
        this.setupPeriodicCleanup();
        
        // 页面卸载时清理
        this.setupUnloadCleanup();
    }

    // 监控内存使用
    monitorMemoryUsage() {
        if (performance.memory) {
            setInterval(() => {
                const memory = performance.memory;
                const memoryInfo = {
                    used: memory.usedJSHeapSize,
                    total: memory.totalJSHeapSize,
                    limit: memory.jsHeapSizeLimit,
                    timestamp: Date.now()
                };
                
                // 内存使用过高警告
                const usagePercent = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
                if (usagePercent > 80) {
                    console.warn(`内存使用过高: ${usagePercent.toFixed(2)}%`);
                    this.queueMetricReport('memory_warning', memoryInfo);
                }
            }, 30000); // 每30秒检查一次
        }
    }

    // 设置定期清理
    setupPeriodicCleanup() {
        setInterval(() => {
            this.performCleanup();
        }, 300000); // 每5分钟清理一次
    }

    // 执行清理
    performCleanup() {
        // 清理性能条目
        if (performance.clearResourceTimings) {
            performance.clearResourceTimings();
        }
        
        // 清理用户计时标记
        if (performance.clearMarks) {
            performance.clearMarks();
        }
        
        // 清理测量数据
        if (performance.clearMeasures) {
            performance.clearMeasures();
        }
        
        console.log('🧹 性能数据清理完成');
    }

    // 设置卸载清理
    setupUnloadCleanup() {
        window.addEventListener('beforeunload', () => {
            this.cleanup();
        });
    }

    // 开始性能报告
    startPerformanceReporting() {
        // 页面加载完成后发送初始报告
        if (document.readyState === 'complete') {
            setTimeout(() => this.sendPerformanceReport(), 2000);
        } else {
            window.addEventListener('load', () => {
                setTimeout(() => this.sendPerformanceReport(), 2000);
            });
        }
        
        // 定期发送性能报告
        setInterval(() => {
            this.sendPerformanceReport();
        }, 60000); // 每分钟发送一次
    }

    // 发送性能报告
    async sendPerformanceReport() {
        if (!this.isEnabled) return;

        const report = {
            url: window.location.href,
            userAgent: navigator.userAgent,
            timestamp: Date.now(),
            metrics: { ...this.metrics },
            customMetrics: this.getQueuedMetrics()
        };

        try {
            await fetch(this.reportEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(report)
            });
        } catch (error) {
            console.warn('性能报告发送失败:', error);
        }
    }

    // 队列指标报告
    queueMetricReport(type, data) {
        if (!this.metricQueue) {
            this.metricQueue = [];
        }
        
        this.metricQueue.push({
            type,
            data,
            timestamp: Date.now()
        });
        
        // 限制队列大小
        if (this.metricQueue.length > 100) {
            this.metricQueue.shift();
        }
    }

    // 获取队列中的指标
    getQueuedMetrics() {
        const metrics = this.metricQueue || [];
        this.metricQueue = []; // 清空队列
        return metrics;
    }

    // 记录性能指标
    logPerformanceMetrics() {
        console.group('📊 性能指标');
        console.log(`页面加载时间: ${this.metrics.pageLoadTime.toFixed(2)}ms`);
        console.log(`DOM内容加载时间: ${this.metrics.domContentLoaded.toFixed(2)}ms`);
        console.log(`首次绘制: ${this.metrics.firstPaint.toFixed(2)}ms`);
        console.log(`首次内容绘制: ${this.metrics.firstContentfulPaint.toFixed(2)}ms`);
        if (this.metrics.largestContentfulPaint > 0) {
            console.log(`最大内容绘制: ${this.metrics.largestContentfulPaint.toFixed(2)}ms`);
        }
        if (this.metrics.cumulativeLayoutShift > 0) {
            console.log(`累积布局偏移: ${this.metrics.cumulativeLayoutShift.toFixed(4)}`);
        }
        if (this.metrics.firstInputDelay > 0) {
            console.log(`首次输入延迟: ${this.metrics.firstInputDelay.toFixed(2)}ms`);
        }
        console.groupEnd();
    }

    // 公共方法 - 手动标记性能点
    mark(name) {
        if (this.isEnabled && performance.mark) {
            performance.mark(name);
        }
    }

    // 公共方法 - 测量性能区间
    measure(name, startMark, endMark) {
        if (this.isEnabled && performance.measure) {
            try {
                performance.measure(name, startMark, endMark);
                const measures = performance.getEntriesByName(name);
                if (measures.length > 0) {
                    console.log(`⏱️ ${name}: ${measures[measures.length - 1].duration.toFixed(2)}ms`);
                }
            } catch (error) {
                console.warn(`性能测量失败: ${name}`, error);
            }
        }
    }

    // 获取当前性能指标
    getMetrics() {
        return { ...this.metrics };
    }

    // 清理资源
    cleanup() {
        this.observers.forEach(observer => {
            if (observer.disconnect) {
                observer.disconnect();
            }
        });
        this.observers = [];
        
        console.log('⚡ 性能模块资源清理完成');
    }

    // 销毁模块
    destroy() {
        console.log('⚡ 销毁性能模块');
        this.cleanup();
        this.isEnabled = false;
    }
}

// 创建全局实例
const performanceModule = new PerformanceModule();

// 导出到全局
window.performanceModule = performanceModule;

// 全局函数兼容
window.markPerformance = (name) => performanceModule.mark(name);
window.measurePerformance = (name, start, end) => performanceModule.measure(name, start, end);

console.log('⚡ 性能模块已加载'); 