/**
 * SpinMatch 应用加载器 - 主入口点
 * 负责初始化模块管理器并启动应用
 */

(function() {
    'use strict';
    
    console.log('🚀 SpinMatch 应用启动...');
    
    // 检查必要的浏览器功能
    function checkBrowserSupport() {
        const requiredFeatures = [
            'fetch',
            'Promise',
            'localStorage',
            'addEventListener'
        ];
        
        const unsupported = requiredFeatures.filter(feature => 
            !(feature in window) && !(feature in document)
        );
        
        if (unsupported.length > 0) {
            console.error('❌ 浏览器不支持以下功能:', unsupported);
            showBrowserNotSupported();
            return false;
        }
        
        return true;
    }
    
    // 显示浏览器不支持提示
    function showBrowserNotSupported() {
        document.body.innerHTML = `
            <div style="text-align: center; padding: 50px; font-family: Arial, sans-serif;">
                <h2>浏览器版本过旧</h2>
                <p>请使用现代浏览器访问本网站</p>
                <p>推荐使用：Chrome 60+、Firefox 55+、Safari 11+、Edge 79+</p>
            </div>
        `;
    }
    
    // 加载模块管理器
    function loadModuleManager() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'scripts/module-manager.js';
            script.onload = () => {
                console.log('📦 模块管理器加载完成');
                resolve();
            };
            script.onerror = () => {
                reject(new Error('模块管理器加载失败'));
            };
            
            document.head.appendChild(script);
        });
    }
    
    // 等待模块管理器初始化
    function waitForModuleManager() {
        return new Promise((resolve, reject) => {
            let attempts = 0;
            const maxAttempts = 50; // 5秒超时
            
            const checkManager = () => {
                attempts++;
                
                if (window.moduleManager && window.moduleManager.isInitialized) {
                    resolve(window.moduleManager);
                    return;
                }
                
                if (attempts < maxAttempts) {
                    setTimeout(checkManager, 100);
                } else {
                    reject(new Error('模块管理器初始化超时'));
                }
            };
            
            checkManager();
        });
    }
    
    // 应用初始化错误处理
    function handleInitError(error) {
        console.error('❌ 应用初始化失败:', error);
        
        // 显示错误提示
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #ff4444;
            color: white;
            padding: 15px;
            border-radius: 8px;
            z-index: 10000;
            max-width: 300px;
            font-family: Arial, sans-serif;
        `;
        errorDiv.innerHTML = `
            <h4 style="margin: 0 0 10px;">应用加载失败</h4>
            <p style="margin: 0; font-size: 14px;">${error.message}</p>
            <button onclick="location.reload()" style="
                margin-top: 10px;
                padding: 5px 10px;
                background: rgba(255,255,255,0.2);
                border: 1px solid rgba(255,255,255,0.3);
                color: white;
                border-radius: 4px;
                cursor: pointer;
            ">重新加载</button>
        `;
        
        document.body.appendChild(errorDiv);
        
        // 回退到基本功能
        initBasicFallback();
    }
    
    // 基本功能回退
    function initBasicFallback() {
        console.log('🔄 启用基本功能模式');
        
        // 基本的页面导航
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[href]');
            if (link && link.href && !link.href.startsWith('javascript:')) {
                // 正常的链接导航
                return;
            }
        });
        
        // 基本的表单处理
        document.addEventListener('submit', (e) => {
            const form = e.target;
            if (form && !form.dataset.handled) {
                e.preventDefault();
                console.warn('表单提交被阻止（模块未加载）');
            }
        });
    }
    
    // 主初始化函数
    async function init() {
        try {
            // 检查浏览器支持
            if (!checkBrowserSupport()) {
                return;
            }
            
            // 显示加载状态
            console.log('⏳ 正在加载应用模块...');
            
            // 加载模块管理器
            await loadModuleManager();
            
            // 等待模块管理器初始化完成
            const manager = await waitForModuleManager();
            
            console.log('✅ SpinMatch 应用启动完成');
            
            // 应用启动完成事件
            window.dispatchEvent(new CustomEvent('app:ready', {
                detail: { manager }
            }));
            
        } catch (error) {
            handleInitError(error);
        }
    }
    
    // DOM 准备就绪后启动
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    // 全局错误处理
    window.addEventListener('error', (e) => {
        console.error('全局错误:', e.error);
    });
    
    window.addEventListener('unhandledrejection', (e) => {
        console.error('未处理的Promise拒绝:', e.reason);
    });
    
})(); 