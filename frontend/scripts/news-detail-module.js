/**
 * SpinMatch 新闻详情模块 - 完全独立
 * 处理新闻详情页面的所有功能：内容显示、相关推荐、评论系统等
 */

class NewsDetailModule {
    constructor() {
        this.apiBaseUrl = this.detectApiUrl();
        this.newsData = [];
        this.currentNewsId = null;
        this.currentNews = null;
        
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
        console.log('📰 初始化新闻详情模块');
        
        // 检查是否在新闻详情页
        if (!this.isNewsDetailPage()) {
            return;
        }

        // 获取新闻ID
        this.currentNewsId = this.getNewsIdFromURL();
        
        if (this.currentNewsId) {
            // 生成本地数据
            this.newsData = this.generateNewsData();
            
            // 首先尝试从API获取新闻数据
            await this.loadApiNewsData();
            
            // 加载新闻详情
            this.loadNewsDetail(this.currentNewsId);
        } else {
            this.showError('未找到指定的新闻');
        }
        
        // 添加样式
        this.addNewsDetailStyles();
        
        console.log('✅ 新闻详情模块初始化完成');
    }

    // 检查是否在新闻详情页
    isNewsDetailPage() {
        const path = window.location.pathname;
        return path.includes('news-detail') || path.includes('news_detail');
    }

    // 从URL获取新闻ID
    getNewsIdFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('id');
    }

    // 从API加载新闻数据
    async loadApiNewsData() {
        try {
            console.log('正在从API获取新闻数据...');
            
            const response = await fetch(`${this.apiBaseUrl}/api/news?limit=50`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                timeout: 10000
            });

            if (response.ok) {
                const data = await response.json();
                
                if (data.success && data.data && data.data.length > 0) {
                    // 将API数据转换为详情页所需格式
                    const apiNewsData = data.data.map(news => ({
                        id: news.id,
                        title: news.title || '无标题',
                        summary: news.summary || news.excerpt || '暂无摘要',
                        content: this.processApiContent(news),
                        category: news.category || '乒乓球资讯',
                        image: news.image || 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                        tags: this.processApiTags(news),
                        date: news.date || new Date().toISOString().split('T')[0],
                        views: news.views || Math.floor(Math.random() * 1000) + 100,
                        author: news.author || '未知作者',
                        url: news.url
                    }));
                    
                    // 将API数据添加到现有数据前面
                    this.newsData = [...apiNewsData, ...this.newsData];
                    console.log(`成功加载 ${apiNewsData.length} 条API新闻数据`);
                } else {
                    console.warn('API返回数据为空，使用本地数据');
                }
            } else {
                console.warn(`API请求失败: HTTP ${response.status}，使用本地数据`);
            }
        } catch (error) {
            console.error('获取API新闻数据失败:', error);
            console.log('将使用本地新闻数据');
        }
    }

    // 处理API内容，提供扩展内容并标注来源
    processApiContent(news) {
        let originalContent = '';
        let expandedContent = '';
        
        // 获取原始内容
        if (news.content && news.content.trim()) {
            originalContent = news.content.trim();
        } else if (news.summary && news.summary.trim()) {
            originalContent = news.summary.trim();
        } else if (news.excerpt && news.excerpt.trim()) {
            originalContent = news.excerpt.trim();
        } else {
            originalContent = '暂无详细内容';
        }
        
        // 如果原始内容太短，生成扩展内容
        if (originalContent.length < 100) {
            expandedContent = this.generateExpandedContent(news, originalContent);
            
            // 组合内容，明确标注来源
            return `【原始内容】\n${originalContent}\n\n【以下为AI扩展内容，仅供参考】\n${expandedContent}`;
        } else {
            // 原始内容足够长，直接返回
            return `【完整原始内容】\n${originalContent}`;
        }
    }
    
    // 生成扩展内容
    generateExpandedContent(news, originalContent) {
        const title = news.title || '';
        const category = news.category || '';
        
        let expandedContent = '';
        
        // 根据标题和分类生成相关内容
        if (title.includes('陈梦') || title.includes('孙颖莎')) {
            expandedContent += `作为中国女子乒乓球队的领军人物，她们的每一次表现都牵动着球迷的心。在当今女子乒乓球竞争激烈的环境下，技术实力、心理素质和比赛经验都是决定成败的关键因素。`;
            expandedContent += `\n\n从技术层面分析，现代女子乒乓球更加注重速度与旋转的结合，前三板技术的重要性日益凸显。发球抢攻、接发球控制以及相持阶段的战术运用，都需要选手具备极高的技术水平和战术素养。`;
        }
        
        if (title.includes('国际') || title.includes('世界') || title.includes('比赛') || title.includes('赛事')) {
            expandedContent += `国际乒乓球赛事的发展为运动员提供了更多展示才华的平台。从世界锦标赛到奥运会，从WTT系列赛到各大洲际比赛，丰富的赛事体系让乒乓球运动保持着旺盛的生命力。`;
            expandedContent += `\n\n赛事规则的不断完善和技术手段的持续进步，为比赛的公平性和观赏性提供了有力保障。电子计分系统、慢镜头回放、鹰眼技术等现代科技的应用，让比赛更加精彩和公正。`;
        }
        
        if (title.includes('技术') || title.includes('技巧') || title.includes('训练')) {
            expandedContent += `乒乓球技术的精进需要长期的系统训练和不断的实践总结。从基本功的扎实练习到高级技战术的融会贯通，每一个进步都离不开科学的训练方法和持之以恒的努力。`;
            expandedContent += `\n\n现代乒乓球训练更加注重个性化和科学化。通过视频分析、数据统计、生物力学研究等手段，教练员可以更精准地指导运动员改进技术动作，提高训练效率。`;
        }
        
        // 如果没有特定的扩展内容，添加通用内容
        if (expandedContent === '') {
            expandedContent = `这是一条关于${category}的重要资讯。${title}引起了广泛关注和讨论。`;
            expandedContent += `\n\n乒乓球作为中国的国球，有着深厚的群众基础和悠久的发展历史。当前，中国乒乓球正面临着新的发展机遇和挑战。`;
        }
        
        // 添加通用结尾
        expandedContent += `\n\n更多精彩内容，请继续关注SpinMatch乒乓球社区的最新资讯。我们致力于为乒乓球爱好者提供最全面、最及时的资讯服务。`;
        
        return expandedContent;
    }

    // 处理API标签
    processApiTags(news) {
        let tags = [];
        
        // 如果API有标签字段
        if (news.tags && Array.isArray(news.tags)) {
            tags = news.tags;
        } 
        // 根据分类和标题生成标签
        else {
            if (news.category) tags.push(news.category);
            
            const title = news.title || '';
            if (title.includes('乒乓球')) tags.push('乒乓球');
            if (title.includes('比赛') || title.includes('赛事')) tags.push('比赛');
            if (title.includes('技术') || title.includes('技巧')) tags.push('技术');
            if (title.includes('训练')) tags.push('训练');
            if (title.includes('国际')) tags.push('国际');
            if (title.includes('中国')) tags.push('中国');
            
            // 如果没有标签，添加默认标签
            if (tags.length === 0) {
                tags = ['乒乓球', '资讯'];
            }
        }
        
        return tags.slice(0, 5); // 最多5个标签
    }

    // 加载新闻详情
    loadNewsDetail(newsId) {
        const news = this.newsData.find(item => item.id === newsId || item.id.toString() === newsId);
        
        if (!news) {
            this.showError('新闻内容不存在');
            return;
        }
        
        this.currentNews = news;
        this.renderNewsDetail(news);
        this.loadRelatedNews(news);
        this.updateViews(news);
    }

    // 渲染新闻详情
    renderNewsDetail(news) {
        // 更新页面标题
        document.title = `${news.title} - SpinMatch 乒乓球社区`;
        
        // 更新主要内容区域
        const contentArea = document.querySelector('.news-detail-content') || this.createContentArea();
        
        contentArea.innerHTML = `
            <article class="news-article">
                <header class="news-header">
                    <div class="news-category-badge">${news.category}</div>
                    <h1 class="news-title">${news.title}</h1>
                    <div class="news-meta">
                        <span class="news-author"><i class="fas fa-user"></i> ${news.author}</span>
                        <span class="news-date"><i class="fas fa-calendar"></i> ${this.formatDate(news.date)}</span>
                        <span class="news-views"><i class="fas fa-eye"></i> ${news.views} 浏览</span>
                    </div>
                    <div class="news-tags">
                        ${news.tags.map(tag => `<span class="tag">#${tag}</span>`).join('')}
                    </div>
                </header>
                
                <div class="news-image-container">
                    <img src="${news.image}" alt="${news.title}" class="news-image" 
                         onerror="this.src='https://via.placeholder.com/800x400/f0f0f0/666?text=图片加载失败'">
                </div>
                
                <div class="news-content">
                    <div class="news-summary">
                        <p><strong>摘要：</strong>${news.summary}</p>
                    </div>
                    <div class="news-body">
                        ${this.formatNewsContent(news.content)}
                    </div>
                </div>
                
                <footer class="news-footer">
                    <div class="news-actions">
                        <button class="action-btn like-btn" onclick="newsDetailModule.toggleLike()">
                            <i class="far fa-heart"></i>
                            <span>点赞</span>
                        </button>
                        <button class="action-btn share-btn" onclick="newsDetailModule.shareNews()">
                            <i class="fas fa-share-alt"></i>
                            <span>分享</span>
                        </button>
                        <button class="action-btn comment-btn" onclick="newsDetailModule.scrollToComments()">
                            <i class="far fa-comment"></i>
                            <span>评论</span>
                        </button>
                    </div>
                    ${news.url ? `
                        <div class="original-link">
                            <a href="${news.url}" target="_blank" rel="noopener">
                                <i class="fas fa-external-link-alt"></i>
                                查看原文
                            </a>
                        </div>
                    ` : ''}
                </footer>
            </article>
            
            <section class="comments-section" id="comments">
                <h3>评论区</h3>
                <div class="comment-form">
                    <textarea placeholder="写下你的评论..." rows="3"></textarea>
                    <button class="btn-submit" onclick="newsDetailModule.submitComment()">发表评论</button>
                </div>
                <div class="comments-list">
                    ${this.generateMockComments().map(comment => this.renderComment(comment)).join('')}
                </div>
            </section>
        `;
    }

    // 创建内容区域
    createContentArea() {
        const container = document.querySelector('.container') || document.body;
        const contentArea = document.createElement('div');
        contentArea.className = 'news-detail-content';
        container.appendChild(contentArea);
        return contentArea;
    }

    // 格式化新闻内容
    formatNewsContent(content) {
        if (!content) return '<p>暂无内容</p>';
        
        // 将换行符转换为段落
        const paragraphs = content.split('\n\n').filter(p => p.trim());
        
        return paragraphs.map(paragraph => {
            // 处理单独的换行
            const formattedParagraph = paragraph.replace(/\n/g, '<br>');
            
            // 处理特殊标记
            const processedParagraph = formattedParagraph
                .replace(/【([^】]+)】/g, '<strong class="content-section">$1</strong>')
                .replace(/^\s*(\d+\.)/gm, '<strong>$1</strong>');
            
            return `<p>${processedParagraph}</p>`;
        }).join('');
    }

    // 生成模拟评论
    generateMockComments() {
        return [
            {
                id: 1,
                author: '乒乓球爱好者',
                avatar: this.generateAvatar('乒乓球爱好者'),
                content: '写得很详细，学到了很多！',
                time: '2小时前',
                likes: 12
            },
            {
                id: 2,
                author: '小明同学',
                avatar: this.generateAvatar('小明同学'),
                content: '支持作者，希望多分享这样的技术文章',
                time: '5小时前',
                likes: 8
            },
            {
                id: 3,
                author: '球技精进',
                avatar: this.generateAvatar('球技精进'),
                content: '这个技巧我试过，确实很有用',
                time: '1天前',
                likes: 15
            }
        ];
    }

    // 渲染评论
    renderComment(comment) {
        return `
            <div class="comment-item">
                <div class="comment-avatar">
                    <img src="${comment.avatar}" alt="${comment.author}">
                </div>
                <div class="comment-content">
                    <div class="comment-header">
                        <span class="comment-author">${comment.author}</span>
                        <span class="comment-time">${comment.time}</span>
                    </div>
                    <div class="comment-text">${comment.content}</div>
                    <div class="comment-actions">
                        <button class="comment-like" onclick="newsDetailModule.likeComment(${comment.id})">
                            <i class="far fa-thumbs-up"></i>
                            ${comment.likes}
                        </button>
                        <button class="comment-reply" onclick="newsDetailModule.replyComment(${comment.id})">
                            <i class="far fa-comment"></i>
                            回复
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    // 加载相关新闻
    loadRelatedNews(currentNews) {
        const relatedNews = this.newsData
            .filter(news => news.id !== currentNews.id)
            .filter(news => 
                news.category === currentNews.category || 
                news.tags.some(tag => currentNews.tags.includes(tag))
            )
            .slice(0, 3);
        
        this.renderRelatedNews(relatedNews);
    }

    // 渲染相关新闻
    renderRelatedNews(relatedNews) {
        const container = document.querySelector('.related-news') || this.createRelatedNewsContainer();
        
        if (relatedNews.length === 0) {
            container.innerHTML = '<p>暂无相关新闻</p>';
            return;
        }
        
        container.innerHTML = `
            <h3>相关推荐</h3>
            <div class="related-news-list">
                ${relatedNews.map(news => this.renderRelatedNewsItem(news)).join('')}
            </div>
        `;
    }

    // 创建相关新闻容器
    createRelatedNewsContainer() {
        const container = document.querySelector('.news-detail-content');
        const relatedContainer = document.createElement('aside');
        relatedContainer.className = 'related-news';
        container.appendChild(relatedContainer);
        return relatedContainer;
    }

    // 渲染相关新闻项
    renderRelatedNewsItem(news) {
        return `
            <div class="related-news-item" onclick="newsDetailModule.navigateToNews('${news.id}')">
                <img src="${news.image}" alt="${news.title}" class="related-news-image">
                <div class="related-news-content">
                    <h4>${news.title}</h4>
                    <p>${news.summary}</p>
                    <div class="related-news-meta">
                        <span>${this.formatDate(news.date)}</span>
                        <span>${news.views} 浏览</span>
                    </div>
                </div>
            </div>
        `;
    }

    // 格式化日期
    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) return '昨天';
        if (diffDays < 7) return `${diffDays}天前`;
        if (diffDays < 30) return `${Math.ceil(diffDays / 7)}周前`;
        
        return date.toLocaleDateString('zh-CN');
    }

    // 生成头像
    generateAvatar(name) {
        const colors = ['#FF6B35', '#DC143C', '#FFD700', '#32CD32', '#1E90FF', '#9370DB'];
        const color = colors[name.charCodeAt(0) % colors.length];
        const initial = name.charAt(0);
        
        return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Ccircle cx='20' cy='20' r='20' fill='${encodeURIComponent(color)}'/%3E%3Ctext x='20' y='26' text-anchor='middle' fill='white' font-size='16' font-family='Arial'%3E${initial}%3C/text%3E%3C/svg%3E`;
    }

    // 更新浏览量
    updateViews(news) {
        news.views = (news.views || 0) + 1;
        const viewsEl = document.querySelector('.news-views');
        if (viewsEl) {
            viewsEl.innerHTML = `<i class="fas fa-eye"></i> ${news.views} 浏览`;
        }
    }

    // 显示错误信息
    showError(message) {
        const container = document.querySelector('.container') || document.body;
        container.innerHTML = `
            <div class="error-container">
                <div class="error-content">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h2>内容加载失败</h2>
                    <p>${message}</p>
                    <button onclick="history.back()" class="btn-back">返回上一页</button>
                </div>
            </div>
        `;
    }

    // 公共API方法
    toggleLike() {
        const likeBtn = document.querySelector('.like-btn');
        const icon = likeBtn.querySelector('i');
        const isLiked = icon.classList.contains('fas');
        
        if (isLiked) {
            icon.className = 'far fa-heart';
            likeBtn.style.color = '';
        } else {
            icon.className = 'fas fa-heart';
            likeBtn.style.color = '#dc3545';
        }
    }

    shareNews() {
        if (navigator.share && this.currentNews) {
            navigator.share({
                title: this.currentNews.title,
                text: this.currentNews.summary,
                url: window.location.href
            }).catch(console.error);
        } else {
            // 复制链接到剪贴板
            navigator.clipboard.writeText(window.location.href).then(() => {
                this.showNotification('链接已复制到剪贴板');
            }).catch(console.error);
        }
    }

    scrollToComments() {
        const commentsSection = document.getElementById('comments');
        if (commentsSection) {
            commentsSection.scrollIntoView({ behavior: 'smooth' });
        }
    }

    submitComment() {
        const textarea = document.querySelector('.comment-form textarea');
        const content = textarea.value.trim();
        
        if (!content) {
            this.showNotification('请输入评论内容', 'warning');
            return;
        }
        
        // 模拟提交评论
        const newComment = {
            id: Date.now(),
            author: '当前用户',
            avatar: this.generateAvatar('当前用户'),
            content: content,
            time: '刚刚',
            likes: 0
        };
        
        const commentsList = document.querySelector('.comments-list');
        commentsList.insertAdjacentHTML('afterbegin', this.renderComment(newComment));
        
        textarea.value = '';
        this.showNotification('评论发表成功');
    }

    likeComment(commentId) {
        const likeBtn = document.querySelector(`[onclick="newsDetailModule.likeComment(${commentId})"]`);
        const currentLikes = parseInt(likeBtn.textContent.trim()) || 0;
        likeBtn.innerHTML = `<i class="fas fa-thumbs-up"></i> ${currentLikes + 1}`;
        likeBtn.style.color = '#dc3545';
    }

    replyComment(commentId) {
        this.showNotification('回复功能开发中...');
    }

    navigateToNews(newsId) {
        window.location.href = `news-detail.html?id=${newsId}`;
    }

    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 6px;
            color: white;
            z-index: 10000;
            animation: slideInRight 0.3s ease;
        `;
        
        switch (type) {
            case 'success':
                notification.style.background = '#28a745';
                break;
            case 'warning':
                notification.style.background = '#ffc107';
                notification.style.color = '#000';
                break;
            case 'error':
                notification.style.background = '#dc3545';
                break;
        }
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // 生成新闻数据（与news.js保持一致）
    generateNewsData() {
        return [
            {
                id: 'wtt-finals-2024',
                title: '樊振东夺得WTT新加坡大满贯冠军',
                summary: '在刚刚结束的WTT新加坡大满贯男单决赛中，樊振东以4-1的比分战胜王楚钦，成功夺得冠军。',
                content: '北京时间今晚，2024年WTT新加坡大满贯男单决赛落下帷幕。樊振东在决赛中发挥出色，以11-8、11-6、9-11、11-4、11-7的比分击败队友王楚钦，夺得个人第三个WTT大满贯冠军。\n\n比赛中，樊振东展现了极强的心理素质和技术功底，特别是在关键分的处理上表现得非常出色。第一局和第二局，樊振东凭借稳定的发挥建立了2-0的领先优势。虽然王楚钦在第三局顽强扳回一局，但樊振东很快调整状态，在第四局和第五局连下两城，最终以大比分4-1获胜。\n\n这是樊振东本赛季的第四个重要冠军，也进一步巩固了他世界第一的地位。赛后樊振东表示，能够在新加坡再次夺冠让他非常开心，感谢教练团队和球迷的支持。对于接下来的比赛，他会继续保持这种良好的竞技状态，争取在更多比赛中取得好成绩。',
                category: '国际赛事',
                image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                tags: ['WTT', '樊振东', '冠军', '新加坡'],
                date: '2024-12-14',
                views: 15420,
                author: '体育记者 张明'
            },
            {
                id: 'ma-long-technique',
                title: '马龙反手技术深度解析',
                summary: '奥运冠军马龙分享反手技术训练心得，详细讲解反手攻球的要领和训练方法。',
                content: '在最新的技术分享中，奥运冠军马龙详细讲解了反手技术的精髓。他指出，反手技术的关键在于身体重心的转换和手腕的灵活运用。\n\n马龙强调，反手攻球时要注意以下几个要点：首先是脚步的移动，要保持身体的平衡，左脚稍前，右脚在后，身体重心略偏向左侧。其次是引拍动作，要做到肘部自然下沉，前臂与台面平行，拍面稍微前倾。击球瞬间要有爆发力，通过前臂的快速挥动和手腕的发力来完成击球。\n\n马龙还分享了自己多年来的训练经验，包括如何在不同的来球情况下调整反手技术。对于近台快攻，要缩短引拍动作，加快挥拍速度；对于中台对拉，要增加腰部转动，提高击球的稳定性。\n\n对于业余球友，马龙建议从基础的反手推挡开始练习，掌握正确的击球感觉后，逐步提高到反手攻球，最后掌握反手拉球技术。整个技术体系需要长期的坚持训练才能掌握，但一旦形成肌肉记忆，反手就会成为你的得分利器。',
                category: '技巧教学',
                image: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                tags: ['马龙', '反手技术', '技巧', '训练'],
                date: '2024-12-13',
                views: 8930,
                author: '技术分析师 李华'
            },
            {
                id: 'equipment-2024',
                title: '2024年乒乓球装备推荐指南',
                summary: '全面分析2024年最新的乒乓球装备，包括球拍、胶皮、乒乓球等的选择建议。',
                content: '2024年乒乓球装备市场呈现出多样化发展趋势，新技术的应用让装备性能有了显著提升。\n\n在球拍方面，碳纤维和芳纶纤维的应用更加广泛，使得球拍既轻便又具有良好的弹性。今年推出的几款新底板都采用了创新的结构设计，比如蝴蝶的张本智和ALC和红双喜的龙5X，都在保持控制性的同时提升了速度和旋转性能。\n\n胶皮技术也有了新的突破，德国和日本品牌在粘性和速度方面都有显著提升。多尼克的蓝火系列和尼塔库的法拉奥系列都是今年的明星产品，适合不同技术特点的球员。\n\n对于不同水平的球友，我们推荐：\n- 初学者选择控制性较好的成品拍，如银河N10S或红双喜四星套装\n- 中级球友可以考虑DIY组装，选择适合自己打法的底板和胶皮\n- 高级球友则需要根据比赛需求精确调配装备\n\n此外，训练用球和比赛用球的选择也很重要，建议使用国际乒联认证的三星球进行正式训练和比赛。选择合适的装备不仅能提升技术水平，更能让你在球场上发挥出最佳状态。',
                category: '装备评测',
                image: 'https://images.unsplash.com/photo-1544717297-fa95b6ee9643?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                tags: ['装备', '球拍', '胶皮', '推荐'],
                date: '2024-12-12',
                views: 6750,
                author: '装备专家 王强'
            }
        ];
    }

    // 添加样式
    addNewsDetailStyles() {
        if (document.querySelector('style[data-news-detail-module]')) return;

        const style = document.createElement('style');
        style.setAttribute('data-news-detail-module', 'true');
        style.textContent = `
            .news-detail-content {
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
                background: white;
                border-radius: 12px;
                box-shadow: 0 4px 16px rgba(0,0,0,0.1);
            }

            .news-article {
                margin-bottom: 40px;
            }

            .news-header {
                margin-bottom: 30px;
            }

            .news-category-badge {
                display: inline-block;
                background: #dc3545;
                color: white;
                padding: 4px 12px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: 600;
                margin-bottom: 15px;
            }

            .news-title {
                font-size: 32px;
                font-weight: 700;
                line-height: 1.3;
                margin-bottom: 15px;
                color: #333;
            }

            .news-meta {
                display: flex;
                gap: 20px;
                margin-bottom: 15px;
                font-size: 14px;
                color: #666;
            }

            .news-meta i {
                margin-right: 5px;
                color: #dc3545;
            }

            .news-tags {
                display: flex;
                gap: 8px;
                flex-wrap: wrap;
            }

            .tag {
                background: #f8f9fa;
                color: #666;
                padding: 4px 8px;
                border-radius: 12px;
                font-size: 12px;
            }

            .news-image-container {
                margin: 30px 0;
                text-align: center;
            }

            .news-image {
                max-width: 100%;
                height: auto;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            }

            .news-content {
                line-height: 1.8;
                font-size: 16px;
                color: #444;
            }

            .news-summary {
                background: #f8f9fa;
                padding: 20px;
                border-radius: 8px;
                margin-bottom: 30px;
                border-left: 4px solid #dc3545;
            }

            .news-body p {
                margin-bottom: 20px;
            }

            .content-section {
                color: #dc3545;
                font-size: 18px;
                display: block;
                margin: 20px 0 10px;
            }

            .news-footer {
                margin-top: 40px;
                padding-top: 20px;
                border-top: 1px solid #eee;
            }

            .news-actions {
                display: flex;
                gap: 15px;
                margin-bottom: 20px;
            }

            .action-btn {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 10px 20px;
                border: 1px solid #ddd;
                background: white;
                border-radius: 6px;
                cursor: pointer;
                transition: all 0.3s ease;
                font-size: 14px;
            }

            .action-btn:hover {
                background: #f8f9fa;
                border-color: #dc3545;
                color: #dc3545;
            }

            .original-link a {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                color: #dc3545;
                text-decoration: none;
                font-weight: 500;
            }

            .comments-section {
                border-top: 2px solid #f0f0f0;
                padding-top: 30px;
            }

            .comments-section h3 {
                margin-bottom: 20px;
                color: #333;
            }

            .comment-form {
                margin-bottom: 30px;
            }

            .comment-form textarea {
                width: 100%;
                padding: 15px;
                border: 1px solid #ddd;
                border-radius: 8px;
                resize: vertical;
                font-family: inherit;
                margin-bottom: 10px;
            }

            .btn-submit {
                background: #dc3545;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 6px;
                cursor: pointer;
                font-weight: 500;
            }

            .btn-submit:hover {
                background: #c82333;
            }

            .comment-item {
                display: flex;
                gap: 15px;
                margin-bottom: 20px;
                padding-bottom: 20px;
                border-bottom: 1px solid #f0f0f0;
            }

            .comment-avatar img {
                width: 40px;
                height: 40px;
                border-radius: 50%;
            }

            .comment-content {
                flex: 1;
            }

            .comment-header {
                display: flex;
                justify-content: space-between;
                margin-bottom: 8px;
            }

            .comment-author {
                font-weight: 600;
                color: #333;
            }

            .comment-time {
                color: #999;
                font-size: 12px;
            }

            .comment-text {
                margin-bottom: 10px;
                color: #666;
            }

            .comment-actions {
                display: flex;
                gap: 15px;
            }

            .comment-like,
            .comment-reply {
                background: none;
                border: none;
                color: #999;
                cursor: pointer;
                font-size: 12px;
                display: flex;
                align-items: center;
                gap: 4px;
            }

            .comment-like:hover,
            .comment-reply:hover {
                color: #dc3545;
            }

            .related-news {
                border-top: 2px solid #f0f0f0;
                padding-top: 30px;
                margin-top: 30px;
            }

            .related-news h3 {
                margin-bottom: 20px;
                color: #333;
            }

            .related-news-list {
                display: grid;
                gap: 20px;
            }

            .related-news-item {
                display: flex;
                gap: 15px;
                padding: 15px;
                border: 1px solid #f0f0f0;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.3s ease;
            }

            .related-news-item:hover {
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                transform: translateY(-2px);
            }

            .related-news-image {
                width: 100px;
                height: 70px;
                object-fit: cover;
                border-radius: 6px;
                flex-shrink: 0;
            }

            .related-news-content h4 {
                font-size: 16px;
                margin-bottom: 8px;
                color: #333;
                line-height: 1.4;
            }

            .related-news-content p {
                font-size: 14px;
                color: #666;
                margin-bottom: 8px;
                line-height: 1.4;
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
                overflow: hidden;
            }

            .related-news-meta {
                display: flex;
                gap: 15px;
                font-size: 12px;
                color: #999;
            }

            .error-container {
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 50vh;
                text-align: center;
            }

            .error-content {
                max-width: 400px;
                padding: 40px;
                background: white;
                border-radius: 12px;
                box-shadow: 0 4px 16px rgba(0,0,0,0.1);
            }

            .error-content i {
                font-size: 48px;
                color: #dc3545;
                margin-bottom: 20px;
            }

            .btn-back {
                background: #dc3545;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 6px;
                cursor: pointer;
                margin-top: 20px;
            }

            @media (max-width: 768px) {
                .news-detail-content {
                    padding: 15px;
                    margin: 10px;
                }

                .news-title {
                    font-size: 24px;
                }

                .news-meta {
                    flex-wrap: wrap;
                    gap: 10px;
                }

                .news-actions {
                    flex-wrap: wrap;
                }

                .related-news-item {
                    flex-direction: column;
                }

                .related-news-image {
                    width: 100%;
                    height: 150px;
                }
            }

            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }

            @keyframes slideOutRight {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }

    // 销毁模块
    destroy() {
        console.log('📰 销毁新闻详情模块');
    }
}

// 创建全局实例
const newsDetailModule = new NewsDetailModule();

// 导出到全局
window.newsDetailModule = newsDetailModule;

console.log('📰 新闻详情模块已加载'); 