/**
 * SpinMatch 模块管理器 - 统一管理所有独立模块
 * 负责模块的加载、初始化、协调和卸载
 */

class ModuleManager {
    constructor() {
        this.modules = new Map();
        this.loadedModules = new Set();
        this.moduleConfigs = new Map();
        this.eventBus = new EventBus();
        this.loadQueue = [];
        this.isInitialized = false;
        
        // 初始化
        this.init();
    }

    // 初始化模块管理器
    async init() {
        console.log('🔧 初始化模块管理器');
        
        // 设置模块配置
        this.setupModuleConfigs();
        
        // 检测当前页面需要的模块
        const requiredModules = this.detectRequiredModules();
        
        // 预加载核心模块
        await this.preloadCoreModules();
        
        // 加载页面特定模块
        await this.loadPageModules(requiredModules);
        
        this.isInitialized = true;
        console.log('✅ 模块管理器初始化完成');
        
        // 触发初始化完成事件
        this.eventBus.emit('manager:initialized');
    }

    // 设置模块配置
    setupModuleConfigs() {
        // 认证模块配置
        this.moduleConfigs.set('auth', {
            name: 'auth',
            displayName: '认证模块',
            file: 'auth-module.js',
            priority: 1,
            dependencies: [],
            pages: ['*'], // 所有页面都需要
            autoLoad: true,
            singleton: true
        });

        // 社区模块配置
        this.moduleConfigs.set('community', {
            name: 'community',
            displayName: '社区模块',
            file: 'community-module.js',
            priority: 3,
            dependencies: ['auth'],
            pages: ['community.html'],
            autoLoad: false,
            singleton: true
        });

        // 约球模块配置
        this.moduleConfigs.set('booking', {
            name: 'booking',
            displayName: '约球模块',
            file: 'booking-module.js',
            priority: 3,
            dependencies: ['auth'],
            pages: ['booking.html'],
            autoLoad: false,
            singleton: true
        });

        // 赛事模块配置
        this.moduleConfigs.set('events', {
            name: 'events',
            displayName: '赛事模块',
            file: 'events-module.js',
            priority: 3,
            dependencies: ['auth'],
            pages: ['events.html'],
            autoLoad: false,
            singleton: true
        });

        // 新闻模块配置
        this.moduleConfigs.set('news', {
            name: 'news',
            displayName: '新闻模块',
            file: 'news-module.js',
            priority: 3,
            dependencies: [],
            pages: ['news.html', 'news-detail.html'],
            autoLoad: false,
            singleton: true
        });

        // 用户模块配置
        this.moduleConfigs.set('user', {
            name: 'user',
            displayName: '用户模块',
            file: 'user-module.js',
            priority: 2,
            dependencies: ['auth'],
            pages: ['profile.html'],
            autoLoad: false,
            singleton: true
        });

        // 导航模块配置
        this.moduleConfigs.set('navigation', {
            name: 'navigation',
            displayName: '导航模块',
            file: 'navigation-module.js',
            priority: 2,
            dependencies: ['auth'],
            pages: ['*'],
            autoLoad: true,
            singleton: true
        });

        // 聊天模块配置
        this.moduleConfigs.set('chat', {
            name: 'chat',
            displayName: '聊天模块',
            file: 'chat-module.js',
            priority: 4,
            dependencies: ['auth'],
            pages: ['booking.html', 'community.html'],
            autoLoad: false,
            singleton: true
        });

        // 性能模块配置
        this.moduleConfigs.set('performance', {
            name: 'performance',
            displayName: '性能模块',
            file: 'performance-module.js',
            priority: 1,
            dependencies: [],
            pages: ['*'],
            autoLoad: true,
            singleton: true
        });

        // 图片模块配置
        this.moduleConfigs.set('image', {
            name: 'image',
            displayName: '图片模块',
            file: 'image-module.js',
            priority: 2,
            dependencies: [],
            pages: ['*'],
            autoLoad: true,
            singleton: true
        });
    }

    // 检测当前页面需要的模块
    detectRequiredModules() {
        const currentPage = this.getCurrentPage();
        const requiredModules = [];

        for (const [name, config] of this.moduleConfigs) {
            // 检查是否是全局模块或当前页面需要的模块
            if (config.pages.includes('*') || config.pages.includes(currentPage)) {
                requiredModules.push(name);
            }
        }

        console.log(`📄 当前页面 ${currentPage} 需要模块:`, requiredModules);
        return requiredModules;
    }

    // 获取当前页面
    getCurrentPage() {
        const path = window.location.pathname;
        const page = path.split('/').pop() || 'index.html';
        return page;
    }

    // 预加载核心模块
    async preloadCoreModules() {
        const coreModules = Array.from(this.moduleConfigs.values())
            .filter(config => config.autoLoad && config.priority <= 2)
            .sort((a, b) => a.priority - b.priority);

        for (const config of coreModules) {
            await this.loadModule(config.name);
        }
    }

    // 加载页面特定模块
    async loadPageModules(moduleNames) {
        // 按优先级排序
        const modulesToLoad = moduleNames
            .map(name => this.moduleConfigs.get(name))
            .filter(config => config && !this.loadedModules.has(config.name))
            .sort((a, b) => a.priority - b.priority);

        for (const config of modulesToLoad) {
            await this.loadModule(config.name);
        }
    }

    // 加载模块
    async loadModule(moduleName) {
        if (this.loadedModules.has(moduleName)) {
            console.log(`📦 模块 ${moduleName} 已加载，跳过`);
            return this.modules.get(moduleName);
        }

        const config = this.moduleConfigs.get(moduleName);
        if (!config) {
            console.error(`❌ 未找到模块配置: ${moduleName}`);
            return null;
        }

        try {
            // 加载依赖模块
            await this.loadDependencies(config.dependencies);

            // 加载模块脚本
            await this.loadScript(config.file);

            // 等待模块实例创建
            const moduleInstance = await this.waitForModule(moduleName);

            if (moduleInstance) {
                this.modules.set(moduleName, moduleInstance);
                this.loadedModules.add(moduleName);
                
                console.log(`✅ 模块 ${config.displayName} 加载成功`);
                
                // 触发模块加载事件
                this.eventBus.emit('module:loaded', { name: moduleName, instance: moduleInstance });
                
                return moduleInstance;
            } else {
                throw new Error(`模块 ${moduleName} 实例创建失败`);
            }

        } catch (error) {
            console.error(`❌ 模块 ${moduleName} 加载失败:`, error);
            return null;
        }
    }

    // 加载依赖模块
    async loadDependencies(dependencies) {
        for (const dep of dependencies) {
            if (!this.loadedModules.has(dep)) {
                await this.loadModule(dep);
            }
        }
    }

    // 加载脚本文件
    loadScript(filename) {
        return new Promise((resolve, reject) => {
            // 检查脚本是否已存在
            const existingScript = document.querySelector(`script[src*="${filename}"]`);
            if (existingScript) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = `scripts/${filename}`;
            script.onload = () => {
                console.log(`📜 脚本文件 ${filename} 加载完成`);
                resolve();
            };
            script.onerror = () => {
                reject(new Error(`脚本 ${filename} 加载失败`));
            };
            
            document.head.appendChild(script);
        });
    }

    // 等待模块实例创建
    waitForModule(moduleName) {
        return new Promise((resolve) => {
            const instanceNames = this.getModuleInstanceNames(moduleName);
            let attempts = 0;
            const maxAttempts = 100; // 10秒超时
            
            const checkModule = () => {
                attempts++;
                
                // 检查可能的全局变量名
                for (const instanceName of instanceNames) {
                    if (window[instanceName]) {
                        resolve(window[instanceName]);
                        return;
                    }
                }
                
                if (attempts < maxAttempts) {
                    setTimeout(checkModule, 100);
                } else {
                    console.warn(`⚠️ 模块 ${moduleName} 实例等待超时`);
                    resolve(null);
                }
            };
            
            checkModule();
        });
    }

    // 获取模块可能的实例名
    getModuleInstanceNames(moduleName) {
        const moduleInstanceMap = {
            'auth': ['authModule', 'spinmatchAuth'],
            'community': ['communityModule'],
            'booking': ['bookingModule'],
            'events': ['eventsModule'],
            'news': ['newsModule'],
            'user': ['userModule'],
            'navigation': ['navigationModule'],
            'chat': ['chatModule'],
            'performance': ['performanceModule'],
            'image': ['imageModule']
        };
        
        return moduleInstanceMap[moduleName] || [`${moduleName}Module`];
    }

    // 卸载模块
    async unloadModule(moduleName) {
        const moduleInstance = this.modules.get(moduleName);
        if (!moduleInstance) {
            console.warn(`⚠️ 模块 ${moduleName} 未加载`);
            return;
        }

        try {
            // 调用模块的销毁方法（如果存在）
            if (typeof moduleInstance.destroy === 'function') {
                await moduleInstance.destroy();
            }

            // 从管理器中移除
            this.modules.delete(moduleName);
            this.loadedModules.delete(moduleName);

            console.log(`🗑️ 模块 ${moduleName} 已卸载`);
            
            // 触发模块卸载事件
            this.eventBus.emit('module:unloaded', { name: moduleName });

        } catch (error) {
            console.error(`❌ 模块 ${moduleName} 卸载失败:`, error);
        }
    }

    // 重新加载模块
    async reloadModule(moduleName) {
        console.log(`🔄 重新加载模块 ${moduleName}`);
        await this.unloadModule(moduleName);
        return await this.loadModule(moduleName);
    }

    // 获取模块实例
    getModule(moduleName) {
        return this.modules.get(moduleName);
    }

    // 获取所有已加载的模块
    getLoadedModules() {
        return Array.from(this.loadedModules);
    }

    // 检查模块是否已加载
    isModuleLoaded(moduleName) {
        return this.loadedModules.has(moduleName);
    }

    // 获取模块状态
    getModuleStatus() {
        const status = {};
        for (const [name, config] of this.moduleConfigs) {
            status[name] = {
                config: config,
                loaded: this.loadedModules.has(name),
                instance: this.modules.get(name) || null
            };
        }
        return status;
    }

    // 动态加载模块（按需加载）
    async loadModuleOnDemand(moduleName) {
        if (!this.moduleConfigs.has(moduleName)) {
            console.error(`❌ 未知模块: ${moduleName}`);
            return null;
        }

        if (this.loadedModules.has(moduleName)) {
            return this.modules.get(moduleName);
        }

        console.log(`📦 按需加载模块: ${moduleName}`);
        return await this.loadModule(moduleName);
    }

    // 注册模块间通信
    subscribeToModuleEvents(moduleName, eventName, callback) {
        this.eventBus.on(`${moduleName}:${eventName}`, callback);
    }

    // 发送模块间消息
    emitModuleEvent(moduleName, eventName, data) {
        this.eventBus.emit(`${moduleName}:${eventName}`, data);
    }

    // 全局事件监听
    on(event, callback) {
        this.eventBus.on(event, callback);
    }

    // 全局事件发送
    emit(event, data) {
        this.eventBus.emit(event, data);
    }

    // 销毁管理器
    async destroy() {
        console.log('🔥 销毁模块管理器');
        
        // 卸载所有模块
        const moduleNames = Array.from(this.loadedModules);
        for (const moduleName of moduleNames) {
            await this.unloadModule(moduleName);
        }

        // 清理事件总线
        this.eventBus.removeAllListeners();
        
        this.isInitialized = false;
        console.log('✅ 模块管理器已销毁');
    }
}

// 简单的事件总线
class EventBus {
    constructor() {
        this.listeners = new Map();
    }

    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }

    emit(event, data) {
        const callbacks = this.listeners.get(event);
        if (callbacks) {
            callbacks.forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`事件 ${event} 回调执行失败:`, error);
                }
            });
        }
    }

    off(event, callback) {
        const callbacks = this.listeners.get(event);
        if (callbacks) {
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    removeAllListeners(event) {
        if (event) {
            this.listeners.delete(event);
        } else {
            this.listeners.clear();
        }
    }
}

// 创建全局模块管理器实例
const moduleManager = new ModuleManager();

// 导出到全局
window.moduleManager = moduleManager;

// 全局便捷函数
window.getModule = (name) => moduleManager.getModule(name);
window.loadModule = (name) => moduleManager.loadModuleOnDemand(name);
window.reloadModule = (name) => moduleManager.reloadModule(name);

// 调试函数
window.debugModules = () => {
    console.log('=== 模块状态调试 ===');
    console.log('已加载模块:', moduleManager.getLoadedModules());
    console.log('详细状态:', moduleManager.getModuleStatus());
    return moduleManager.getModuleStatus();
};

console.log('🔧 模块管理器已加载'); 