<template>
    <div class="not-found">
        <div class="bg-decor">
            <span class="decor decor-1">&#123;</span>
            <span class="decor decor-2">&#125;</span>
            <span class="decor decor-3">&lt;/&gt;</span>
            <span class="decor decor-4">#</span>
            <span class="decor decor-5">[]</span>
        </div>

        <div class="illustration">
            <div class="book">
                <div class="book-spine"></div>
                <div class="book-page page-left"></div>
                <div class="book-page page-right"></div>
            </div>
            <div class="magnifier">
                <div class="magnifier-circle"></div>
                <div class="magnifier-handle"></div>
            </div>
        </div>

        <h1 class="error-code">404</h1>
        <p class="error-title">页面未找到</p>
        <p class="error-desc">您要找的页面可能已被移除、名称已更改<br />或暂时不可用</p>

        <div class="actions">
            <router-link to="/" class="btn-back">
                <el-icon><HomeFilled /></el-icon>
                返回首页
            </router-link>
            <el-button class="btn-history" @click="goBack" plain>
                <el-icon><Back /></el-icon>
                返回上页
            </el-button>
        </div>
    </div>
</template>

<script setup>
import { HomeFilled, Back } from '@element-plus/icons-vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const goBack = () => {
    if (window.history.length > 1) {
        router.go(-1);
    } else {
        router.push('/');
    }
};
</script>

<style lang="less" scoped>
.not-found {
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    position: relative;
    overflow: hidden;
    padding: 40px 20px;

    .bg-decor {
        position: absolute;
        inset: 0;
        pointer-events: none;

        .decor {
            position: absolute;
            font-size: 120px;
            font-weight: 700;
            color: var(--el-border-color);
            opacity: 0.4;
            animation: float 8s ease-in-out infinite;

            &.decor-1 { top: 8%; left: 6%; animation-delay: 0s; font-size: 100px; }
            &.decor-2 { top: 12%; right: 8%; animation-delay: 1.5s; font-size: 90px; }
            &.decor-3 { bottom: 15%; left: 10%; animation-delay: 3s; font-size: 80px; }
            &.decor-4 { bottom: 10%; right: 12%; animation-delay: 4.5s; font-size: 110px; }
            &.decor-5 { top: 45%; right: 5%; animation-delay: 2s; font-size: 70px; }
        }
    }

    .illustration {
        position: relative;
        margin-bottom: 32px;

        .book {
            position: relative;
            width: 120px;
            height: 90px;

            .book-spine {
                position: absolute;
                bottom: 0;
                left: 50%;
                transform: translateX(-50%);
                width: 16px;
                height: 90px;
                background: linear-gradient(180deg, #cffafe 0%, #0891b2 100%);
                border-radius: 3px 3px 0 0;
                z-index: 2;
            }

            .page-left {
                position: absolute;
                bottom: 4px;
                right: 50%;
                width: 56px;
                height: 78px;
                background: linear-gradient(135deg, #ecfeff, #cffafe);
                border-radius: 4px 0 0 4px;
                transform: perspective(80px) rotateY(8deg);
                transform-origin: right center;
                box-shadow: -2px 2px 8px rgba(0,0,0,0.06);
                z-index: 1;
            }

            .page-right {
                position: absolute;
                bottom: 4px;
                left: 50%;
                width: 56px;
                height: 78px;
                background: linear-gradient(225deg, #ecfeff, #cffafe);
                border-radius: 0 4px 4px 0;
                transform: perspective(80px) rotateY(-8deg);
                transform-origin: left center;
                box-shadow: 2px 2px 8px rgba(0,0,0,0.06);
                z-index: 1;
            }
        }

        .magnifier {
            position: absolute;
            right: -30px;
            bottom: -5px;
            animation: magnifier-bounce 3s ease-in-out infinite;

            .magnifier-circle {
                width: 36px;
                height: 36px;
                border-radius: 50%;
                border: 5px solid #f59e0b;
                background: rgba(245, 158, 11, 0.08);
            }

            .magnifier-handle {
                width: 5px;
                height: 22px;
                background: #f59e0b;
                border-radius: 0 0 3px 3px;
                transform: rotate(45deg);
                margin-left: 26px;
                margin-top: -4px;
            }
        }
    }

    .error-code {
        font-size: 96px;
        font-weight: 800;
        background: linear-gradient(135deg, #0891b2 0%, #06b6d4 50%, #22d3ee 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        line-height: 1;
        margin-bottom: 12px;
        letter-spacing: 6px;
    }

    .error-title {
        font-size: 22px;
        font-weight: 600;
        color: var(--el-text-color-primary);
        margin-bottom: 10px;
    }

    .error-desc {
        font-size: 14px;
        color: var(--el-text-color-secondary);
        text-align: center;
        line-height: 1.7;
        margin-bottom: 32px;
    }

    .actions {
        display: flex;
        gap: 12px;

        .btn-back {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 10px 24px;
            background: linear-gradient(135deg, #0891b2, #06b6d4);
            color: #fff;
            text-decoration: none;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            transition: transform 0.2s, box-shadow 0.2s;

            &:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(8, 145, 178, 0.35);
                color: #fff;
            }
        }

        .btn-history {
            border-radius: 8px;
            font-size: 14px;
        }
    }
}

@keyframes float {
    0%, 100% { transform: translateY(0) rotate(0deg); }
    25%  { transform: translateY(-12px) rotate(2deg); }
    75%  { transform: translateY(8px) rotate(-2deg); }
}

@keyframes magnifier-bounce {
    0%, 100% { transform: translateY(0); }
    50%  { transform: translateY(-6px); }
}

@media (max-width: 767px) {
    .not-found {
        padding: 20px 16px;

        .error-code { font-size: 72px; }
        .error-title { font-size: 18px; }
        .bg-decor .decor { font-size: 60px !important; }
        .illustration { transform: scale(0.85); margin-bottom: 20px; }
    }
}
</style>

<style lang="less">
html.dark {
    .not-found {
        .book .page-left,
        .book .page-right {
            background: linear-gradient(135deg, var(--el-bg-color), var(--el-fill-color-light));
        }

        .magnifier-circle {
            border-color: #fbbf24;
            background: rgba(251, 191, 36, 0.1);
        }

        .magnifier-handle {
            background: #fbbf24;
        }
    }
}
</style>
