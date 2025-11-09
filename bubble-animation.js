// bubble-animation.js
class BubbleAnimation {
    constructor(options = {}) {
        // 默认配置
        this.config = {
            bubbleSize: options.bubbleSize || 48,
            heartDensity: options.heartDensity || 30,
            tipDensity: options.tipDensity || 10,
            heartScaleFactor: options.heartScaleFactor || 0.015,
            heartPointDelay: options.heartPointDelay || 30,
            fillInterval: options.fillInterval || 100,
            disappearInterval: options.disappearInterval || 20,
            coveragePercentage: options.coveragePercentage || 0.5,
            gifFiles: options.gifFiles || 10,
            backgroundOpacity: options.backgroundOpacity || 1.0, // 默认不透明
            gifOpacity: options.gifOpacity || 1.0 // GIF默认不透明
        };
        
        this.allBubbles = [];
  
        this.autoLoopEnabled = false;
        this.animationInterval = null;
        this.init();
    }
    
    init() {
        // 设置背景透明度
        this.setBackgroundOpacity();

        window.addEventListener('resize', () => this.startAnimation());
        this.startAnimation(); // 初始执行
    }
    
    // 检测是否为移动设备
    detectMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }
    
    // 获取背景图片路径
    getBackgroundImage() {
        const isMobile = this.detectMobile();
        return isMobile ? 'background-mobile.png' : 'background-computer.jpg';
    }
    
    // 设置背景透明度（仅背景图片）
    setBackgroundOpacity() {
        const body = document.body;
        const backgroundImage = this.getBackgroundImage();
        // 使用伪元素和 RGBA 颜色来实现背景透明度控制
        body.style.background = `linear-gradient(rgba(255, 255, 255, ${1 - this.config.backgroundOpacity}), 
                                   rgba(255, 255, 255, ${1 - this.config.backgroundOpacity})), 
                                   url('${backgroundImage}') center/cover no-repeat`;
    }
    
    // 设置GIF透明度
    setGifOpacity(imgElement) {
        if (imgElement) {
            imgElement.style.opacity = this.config.gifOpacity;
        }
    }
    
    enableAutoLoop() {
        this.autoLoopEnabled = true;
        // 等待当前动画周期结束后启动自动循环
    }
    
    startAnimation() {
        // 清除现有气泡
        document.querySelectorAll('.bubble').forEach(b => b.remove());
        this.allBubbles = [];
        
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        const scale = Math.min(window.innerWidth, window.innerHeight) * this.config.heartScaleFactor;
        
        const points = [];
        
        // 1. 生成主要点 (密度可配置)
        for (let t = 0; t <= Math.PI; t += Math.PI / this.config.heartDensity) {
            const x = 16 * Math.sin(t) ** 3;
            const y = 13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t);
            points.push({x: centerX + x * scale, y: centerY - y * scale});
            if (t > 0 && t < Math.PI) {
                points.push({x: centerX - x * scale, y: centerY - y * scale});
            }
        }
        
        // 2. 在尖端 (t = PI) 附近增加额外的点
        for (let i = 1; i <= this.config.tipDensity; i++) {
            const t = Math.PI - (Math.PI / 180) * i;
            const x = 16 * Math.sin(t) ** 3;
            const y = 13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t);
            points.push({x: centerX + x * scale, y: centerY - y * scale});
            points.push({x: centerX - x * scale, y: centerY - y * scale});
        }
        
        // 3. 创建爱心气泡元素
        const heartBubbles = points.map((point, index) => {
            const bubble = document.createElement('div');
            bubble.className = 'bubble';
            bubble.style.left = `${point.x - this.config.bubbleSize/2}px`;
            bubble.style.top = `${point.y - this.config.bubbleSize/2}px`;
            
            const img = document.createElement('img');
            img.src = `bubble/bubble_${(index % this.config.gifFiles) + 1}.gif`;
            img.width = this.config.bubbleSize;
            img.height = this.config.bubbleSize;
            img.style.display = 'block';
            
            // 设置GIF透明度
            this.setGifOpacity(img);
            
            bubble.appendChild(img);
            
            bubble.addEventListener('click', () => {
                if (!bubble.classList.contains('fade')) {
                    bubble.classList.add('fade');
                    setTimeout(() => bubble.remove(), 300);
                }
            });
            
            this.allBubbles.push(bubble);
            return bubble;
        });
        
        // 4. 按优化后的顺序添加并激活爱心气泡
        const reversedHeartBubbles = [...heartBubbles].reverse();
        
        reversedHeartBubbles.forEach((bubble, index) => {
            document.body.appendChild(bubble);
            setTimeout(() => {
                bubble.classList.add('active');
            }, index * this.config.heartPointDelay);
        });
        
        // 5. 爱心显示完成后，开始随机填充屏幕
        const heartDisplayTime = reversedHeartBubbles.length * this.config.heartPointDelay + 2000;
        setTimeout(() => {
            this.fillScreenWithBubbles();
        }, heartDisplayTime);
    }
    
    // 随机填充屏幕其他位置
    fillScreenWithBubbles() {
        const bubbleArea = Math.PI * Math.pow(this.config.bubbleSize/2, 2);
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        const screenArea = screenWidth * screenHeight;
        const targetArea = screenArea * this.config.coveragePercentage;
        const maxBubbles = Math.floor(targetArea / bubbleArea);
        
        let currentBubbleCount = this.allBubbles.length;
        
        // 定时器持续生成气泡直到达到目标数量
        const fillInterval = setInterval(() => {
            if (currentBubbleCount >= maxBubbles) {
                clearInterval(fillInterval);
                // 开始消失动画
                setTimeout(() => this.disappearAllBubbles(), 2000);
                return;
            }
            
            // 生成随机位置
            const x = Math.random() * (window.innerWidth - this.config.bubbleSize);
            const y = Math.random() * (window.innerHeight - this.config.bubbleSize);
            
            // 创建新气泡
            const bubble = document.createElement('div');
            bubble.className = 'bubble';
            bubble.style.left = `${x}px`;
            bubble.style.top = `${y}px`;
            
            const img = document.createElement('img');
            const gifIndex = Math.floor(Math.random() * this.config.gifFiles) + 1;
            img.src = `bubble/bubble_${gifIndex}.gif`;
            img.width = this.config.bubbleSize;
            img.height = this.config.bubbleSize;
            img.style.display = 'block';
            
            // 设置GIF透明度
            this.setGifOpacity(img);
            
            bubble.appendChild(img);
            
            bubble.addEventListener('click', () => {
                if (!bubble.classList.contains('fade')) {
                    bubble.classList.add('fade');
                    setTimeout(() => bubble.remove(), 300);
                }
            });
            
            document.body.appendChild(bubble);
            bubble.classList.add('active');
            
            this.allBubbles.push(bubble);
            currentBubbleCount++;
        }, this.config.fillInterval);
    }
    
    // 消失动画
    disappearAllBubbles() {
        // 按顺序消失
        this.allBubbles.forEach((bubble, index) => {
            setTimeout(() => {
                if (bubble && !bubble.classList.contains('fade')) {
                    bubble.classList.add('fade');
                    setTimeout(() => {
                        if (bubble.parentNode) {
                            bubble.parentNode.removeChild(bubble);
                        }
                    }, 300);
                }
            }, index * this.config.disappearInterval);
        });
        
        // 如果启用了自动循环，则在消失完成后重新开始
        if (this.autoLoopEnabled) {
            const totalTime = this.allBubbles.length * this.config.disappearInterval + 1000;
            setTimeout(() => {
                this.startAnimation();
            }, totalTime);
        }
    }
}

// 导出类供外部使用
window.BubbleAnimation = BubbleAnimation;