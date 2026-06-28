<template>
    <div class="login-container">
        <div class="theme-switch" @click="themeStore.toggle()">
            <el-icon size="20">
                <Sunny v-if="themeStore.isDark" />
                <Moon v-else />
            </el-icon>
        </div>

        <!-- Left Panel: Animated Characters -->
        <div class="brand-panel">
            <div class="brand-glow brand-glow--top"></div>
            <div class="brand-glow brand-glow--bottom"></div>

            <!-- Logo -->
            <div class="brand-header">
                <div class="brand-logo-box">
                    <svg viewBox="0 0 44 44" width="28" height="28" fill="none">
                        <rect x="2" y="8" width="40" height="30" rx="4" fill="url(#login-logo-grad)" />
                        <rect x="6" y="12" width="14" height="22" rx="2" fill="#fff" opacity="0.95" />
                        <rect x="22" y="12" width="16" height="22" rx="2" fill="#fff" opacity="0.8" />
                        <defs>
                            <linearGradient id="login-logo-grad" x1="0" y1="0" x2="44" y2="44">
                                <stop offset="0%" stop-color="#6C3FF5" />
                                <stop offset="100%" stop-color="#a78bfa" />
                            </linearGradient>
                        </defs>
                    </svg>
                    <span>LibraryAdmin</span>
                </div>
            </div>

            <!-- Character Stage -->
            <div class="character-stage">
                <div class="characters-scene" ref="sceneRef">
                    <!-- Purple tall rectangle - Back layer -->
                    <div ref="purpleRef" class="character character--purple" :style="purpleStyle">
                        <div class="eyes-row" :style="purpleEyesStyle">
                            <div class="eyeball" :class="{ blinking: isPurpleBlinking }">
                                <div class="pupil" :style="purplePupilStyle(0)"></div>
                            </div>
                            <div class="eyeball" :class="{ blinking: isPurpleBlinking }">
                                <div class="pupil" :style="purplePupilStyle(1)"></div>
                            </div>
                        </div>
                    </div>

                    <!-- Black tall rectangle - Middle layer -->
                    <div ref="blackRef" class="character character--black" :style="blackStyle">
                        <div class="eyes-row" :style="blackEyesStyle">
                            <div class="eyeball eyeball--sm" :class="{ blinking: isBlackBlinking }">
                                <div class="pupil pupil--sm" :style="blackPupilStyle(0)"></div>
                            </div>
                            <div class="eyeball eyeball--sm" :class="{ blinking: isBlackBlinking }">
                                <div class="pupil pupil--sm" :style="blackPupilStyle(1)"></div>
                            </div>
                        </div>
                    </div>

                    <!-- Orange semi-circle - Front left -->
                    <div ref="orangeRef" class="character character--orange" :style="orangeStyle">
                        <div class="eyes-row eyes-row--bare" :style="orangeEyesStyle">
                            <div class="pupil pupil--bare" :style="orangePupilStyle(0)"></div>
                            <div class="pupil pupil--bare" :style="orangePupilStyle(1)"></div>
                        </div>
                    </div>

                    <!-- Yellow tall rectangle - Front right -->
                    <div ref="yellowRef" class="character character--yellow" :style="yellowStyle">
                        <div class="eyes-row eyes-row--bare" :style="yellowEyesStyle">
                            <div class="pupil pupil--bare" :style="yellowPupilStyle(0)"></div>
                            <div class="pupil pupil--bare" :style="yellowPupilStyle(1)"></div>
                        </div>
                        <div class="mouth" :style="yellowMouthStyle"></div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Right Panel: Login Form -->
        <div class="form-container">
            <div class="form-header">
                <div class="mobile-logo">
                    <svg viewBox="0 0 44 44" width="28" height="28" fill="none">
                        <rect x="2" y="8" width="40" height="30" rx="4" fill="url(#login-logo-grad-m)" />
                        <rect x="6" y="12" width="14" height="22" rx="2" fill="#fff" opacity="0.95" />
                        <rect x="22" y="12" width="16" height="22" rx="2" fill="#fff" opacity="0.8" />
                        <defs>
                            <linearGradient id="login-logo-grad-m" x1="0" y1="0" x2="44" y2="44">
                                <stop offset="0%" stop-color="#6C3FF5" />
                                <stop offset="100%" stop-color="#a78bfa" />
                            </linearGradient>
                        </defs>
                    </svg>
                    <span>LibraryAdmin</span>
                </div>
                <h1 class="form-title">欢迎回来!</h1>
                <p class="form-subtitle">请输入您的登录信息</p>
            </div>

            <el-form ref="loginFormRef" :model="loginForm" :rules="rules" size="large" class="login-form"
                @keyup.enter="handleLogin">
                <el-form-item prop="username">
                    <label class="field-label">用户名</label>
                    <el-input v-model="loginForm.username" placeholder="输入您的用户名" @focus="isTyping = true"
                        @blur="isTyping = false" />
                </el-form-item>

                <el-form-item prop="password">
                    <label class="field-label">密码</label>
                    <div class="password-wrapper">
                        <el-input v-model="loginForm.password" :type="showPassword ? 'text' : 'password'"
                            placeholder="输入您的密码" @focus="isTyping = true" @blur="isTyping = false" />
                        <button type="button" class="password-toggle" @click="showPassword = !showPassword">
                            <el-icon size="18">
                                <View v-if="!showPassword" />
                                <Hide v-else />
                            </el-icon>
                        </button>
                    </div>
                </el-form-item>

                <div v-if="errorMsg" class="error-msg">
                    {{ errorMsg }}
                </div>

                <el-form-item>
                    <el-button type="primary" :loading="loading" class="submit-btn" @click="handleLogin">
                        {{ loading ? '登录中...' : '登录' }}
                    </el-button>
                </el-form-item>
            </el-form>

            <div class="tip">
                <span class="tip-dot" />
                用户名：admin / 密码：123456
            </div>
        </div>
    </div>
</template>

<script setup>
import { reactive, ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '../stores/user';
import { useThemeStore } from '../stores/theme';
import { ElMessage } from 'element-plus';
import { Sunny, Moon, View, Hide } from '@element-plus/icons-vue';

const router = useRouter();
const userStore = useUserStore();
const themeStore = useThemeStore();

// --- 表单状态 ---
const loginForm = reactive({
    username: 'admin',
    password: '123456'
});
const loginFormRef = ref(null);
const loading = ref(false);
const errorMsg = ref('');
const showPassword = ref(false);

const rules = {
    username: [
        { required: true, message: '请输入用户名', trigger: 'blur' },
        { min: 3, max: 10, message: '用户名为 3 到 10 个字符', trigger: 'blur' }
    ],
    password: [
        { required: true, message: '请输入密码', trigger: 'blur' },
        { min: 6, max: 20, message: '密码为 6 到 20 个字符', trigger: 'blur' }
    ]
};

// --- 角色动画状态 ---
const mouseX = ref(0);
const mouseY = ref(0);
const isTyping = ref(false);
const isPurpleBlinking = ref(false);
const isBlackBlinking = ref(false);
const isLookingAtEachOther = ref(false);
const isPurplePeeking = ref(false);

const sceneRef = ref(null);
const purpleRef = ref(null);
const blackRef = ref(null);
const orangeRef = ref(null);
const yellowRef = ref(null);

// --- 鼠标追踪 ---
const onMouseMove = (e) => {
    mouseX.value = e.clientX;
    mouseY.value = e.clientY;
};
onMounted(() => window.addEventListener('mousemove', onMouseMove));
onUnmounted(() => window.removeEventListener('mousemove', onMouseMove));

// --- 眨眼效果 ---
let purpleBlinkTimer = null;
let blackBlinkTimer = null;

const schedulePurpleBlink = () => {
    const interval = Math.random() * 4000 + 3000;
    purpleBlinkTimer = setTimeout(() => {
        isPurpleBlinking.value = true;
        setTimeout(() => {
            isPurpleBlinking.value = false;
            schedulePurpleBlink();
        }, 150);
    }, interval);
};

const scheduleBlackBlink = () => {
    const interval = Math.random() * 4000 + 3000;
    blackBlinkTimer = setTimeout(() => {
        isBlackBlinking.value = true;
        setTimeout(() => {
            isBlackBlinking.value = false;
            scheduleBlackBlink();
        }, 150);
    }, interval);
};

onMounted(() => {
    schedulePurpleBlink();
    scheduleBlackBlink();
});
onUnmounted(() => {
    clearTimeout(purpleBlinkTimer);
    clearTimeout(blackBlinkTimer);
});

// --- 输入框聚焦时注视对方 ---
let lookTimer = null;
watch(isTyping, (val) => {
    if (val) {
        isLookingAtEachOther.value = true;
        clearTimeout(lookTimer);
        lookTimer = setTimeout(() => {
            isLookingAtEachOther.value = false;
        }, 800);
    } else {
        isLookingAtEachOther.value = false;
    }
});

// --- 当密码被输入并可见时，紫色小人会闪烁 ---
let peekTimer = null;
watch([() => loginForm.password, showPassword], ([pwd, show]) => {
    if (pwd.length > 0 && show) {
        const schedulePeek = () => {
            const interval = Math.random() * 3000 + 2000;
            peekTimer = setTimeout(() => {
                isPurplePeeking.value = true;
                setTimeout(() => {
                    isPurplePeeking.value = false;
                    if (loginForm.password.length > 0 && showPassword.value) {
                        schedulePeek();
                    }
                }, 800);
            }, interval);
        };
        schedulePeek();
    } else {
        isPurplePeeking.value = false;
        clearTimeout(peekTimer);
    }
});

// --- 位置计算 ---
const calcPosition = (refEl) => {
    if (!refEl.value) return { faceX: 0, faceY: 0, bodySkew: 0 };
    const rect = refEl.value.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 3;
    const dx = mouseX.value - centerX;
    const dy = mouseY.value - centerY;
    return {
        faceX: Math.max(-15, Math.min(15, dx / 20)),
        faceY: Math.max(-10, Math.min(10, dy / 30)),
        bodySkew: Math.max(-6, Math.min(6, -dx / 120))
    };
};

// --- 计算样式 ---
const showPwd = computed(() => loginForm.password.length > 0 && showPassword.value);

const purplePos = computed(() => calcPosition(purpleRef));
const blackPos = computed(() => calcPosition(blackRef));
const orangePos = computed(() => calcPosition(orangeRef));
const yellowPos = computed(() => calcPosition(yellowRef));

const purpleStyle = computed(() => {
    const pos = purplePos.value;
    let skew = pos.bodySkew;
    let tx = 0;
    let h = '400px';
    if (showPwd.value) {
        skew = 0;
        h = '440px';
    } else if (isTyping.value || (loginForm.password.length > 0 && !showPassword.value)) {
        skew = (pos.bodySkew || 0) - 12;
        tx = 40;
        h = '440px';
    }
    return {
        transform: `skewX(${skew}deg) translateX(${tx}px)`,
        transformOrigin: 'bottom center',
        height: h
    };
});

const purpleEyesStyle = computed(() => {
    const pos = purplePos.value;
    const left = showPwd.value ? '20px' : isLookingAtEachOther.value ? '55px' : `${45 + pos.faceX}px`;
    const top = showPwd.value ? '35px' : isLookingAtEachOther.value ? '65px' : `${40 + pos.faceY}px`;
    return { left, top };
});

const purplePupilStyle = (idx) => {
    const lookX = showPwd.value ? (isPurplePeeking.value ? 4 : -4) : isLookingAtEachOther.value ? 3 : undefined;
    const lookY = showPwd.value ? (isPurplePeeking.value ? 5 : -4) : isLookingAtEachOther.value ? 4 : undefined;
    const eyeLeft = parseFloat(purpleEyesStyle.value.left) + (idx === 0 ? 0 : 18 + 20);
    const eyeTop = parseFloat(purpleEyesStyle.value.top) + 9;
    return pupilTranslate(purpleRef, eyeLeft, eyeTop, 4, lookX, lookY);
};

const blackStyle = computed(() => {
    const pos = blackPos.value;
    let skew = pos.bodySkew;
    let tx = 0;
    if (showPwd.value) {
        skew = 0;
    } else if (isLookingAtEachOther.value) {
        skew = (pos.bodySkew || 0) * 1.5 + 10;
        tx = 20;
    } else if (isTyping.value || (loginForm.password.length > 0 && !showPassword.value)) {
        skew = (pos.bodySkew || 0) * 1.5;
    }
    return {
        transform: `skewX(${skew}deg) translateX(${tx}px)`,
        transformOrigin: 'bottom center'
    };
});

const blackEyesStyle = computed(() => {
    const pos = blackPos.value;
    const left = showPwd.value ? '10px' : isLookingAtEachOther.value ? '32px' : `${26 + pos.faceX}px`;
    const top = showPwd.value ? '28px' : isLookingAtEachOther.value ? '12px' : `${32 + pos.faceY}px`;
    return { left, top };
});

const blackPupilStyle = (idx) => {
    const lookX = showPwd.value ? -4 : isLookingAtEachOther.value ? 0 : undefined;
    const lookY = showPwd.value ? -4 : isLookingAtEachOther.value ? -4 : undefined;
    const eyeLeft = parseFloat(blackEyesStyle.value.left) + (idx === 0 ? 0 : 15 + 20);
    const eyeTop = parseFloat(blackEyesStyle.value.top) + 7.5;
    return pupilTranslate(blackRef, eyeLeft, eyeTop, 3, lookX, lookY);
};

const orangeStyle = computed(() => {
    const skew = showPwd.value ? 0 : orangePos.value.bodySkew;
    return {
        transform: `skewX(${skew}deg)`,
        transformOrigin: 'bottom center'
    };
});

const orangeEyesStyle = computed(() => {
    const pos = orangePos.value;
    const left = showPwd.value ? '50px' : `${82 + pos.faceX}px`;
    const top = showPwd.value ? '85px' : `${90 + pos.faceY}px`;
    return { left, top };
});

const orangePupilStyle = (idx) => {
    const lookX = showPwd.value ? -5 : undefined;
    const lookY = showPwd.value ? -4 : undefined;
    const eyeLeft = parseFloat(orangeEyesStyle.value.left) + (idx === 0 ? 0 : 12 + 24);
    const eyeTop = parseFloat(orangeEyesStyle.value.top) + 6;
    return pupilTranslate(orangeRef, eyeLeft, eyeTop, 5, lookX, lookY);
};

const yellowStyle = computed(() => {
    const skew = showPwd.value ? 0 : yellowPos.value.bodySkew;
    return {
        transform: `skewX(${skew}deg)`,
        transformOrigin: 'bottom center'
    };
});

const yellowEyesStyle = computed(() => {
    const pos = yellowPos.value;
    const left = showPwd.value ? '20px' : `${52 + pos.faceX}px`;
    const top = showPwd.value ? '35px' : `${40 + pos.faceY}px`;
    return { left, top };
});

const yellowPupilStyle = (idx) => {
    const lookX = showPwd.value ? -5 : undefined;
    const lookY = showPwd.value ? -4 : undefined;
    const eyeLeft = parseFloat(yellowEyesStyle.value.left) + (idx === 0 ? 0 : 12 + 24);
    const eyeTop = parseFloat(yellowEyesStyle.value.top) + 6;
    return pupilTranslate(yellowRef, eyeLeft, eyeTop, 5, lookX, lookY);
};

const yellowMouthStyle = computed(() => {
    const pos = yellowPos.value;
    const left = showPwd.value ? '10px' : `${40 + pos.faceX}px`;
    const top = showPwd.value ? '88px' : `${88 + pos.faceY}px`;
    return { left, top };
});

// --- 瞳孔定位辅助器：追踪鼠标或使用强制方向 ---
const pupilTranslate = (charRef, eyeOffsetX, eyeOffsetY, maxDist = 10, forceX, forceY) => {
    if (forceX !== undefined && forceY !== undefined) {
        return { transform: `translate(${forceX}px, ${forceY}px)` };
    }
    const el = charRef?.value;
    if (!el) return { transform: 'translate(0px, 0px)' };
    const rect = el.getBoundingClientRect();
    // Estimate eye center: character left + eye CSS left offset + half eye width
    const eyeCx = rect.left + eyeOffsetX;
    const eyeCy = rect.top + eyeOffsetY;
    const dx = mouseX.value - eyeCx;
    const dy = mouseY.value - eyeCy;
    const dist = Math.min(Math.sqrt(dx * dx + dy * dy), maxDist);
    const angle = Math.atan2(dy, dx);
    return { transform: `translate(${Math.cos(angle) * dist}px, ${Math.sin(angle) * dist}px)` };
};

// --- 登录 ---
const handleLogin = async () => {
    errorMsg.value = '';
    try {
        await loginFormRef.value.validate();
    } catch {
        return;
    }
    loading.value = true;
    try {
        await userStore.login(loginForm.username, loginForm.password);
        ElMessage.success('登录成功');
        router.push('/');
    } catch (error) {
        errorMsg.value = error.message || '用户名或密码错误，请重试。';
    } finally {
        loading.value = false;
    }
};

const handleGoogleLogin = () => {
    ElMessage.info('Google 登录功能即将上线');
};
</script>

<style lang="less" scoped>
.login-container {
    height: 100%;
    display: grid;
    grid-template-columns: 1fr 480px;

    @media (max-width: 900px) {
        grid-template-columns: 1fr;
        grid-template-rows: auto 1fr;
    }
}

.theme-switch {
    position: absolute;
    top: 20px;
    right: 20px;
    z-index: 20;
    cursor: pointer;
    color: var(--el-text-color-secondary);
    transition: color 0.3s;

    &:hover {
        color: #f59e0b;
    }
}

.brand-panel {
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    overflow: hidden;
    background:
        radial-gradient(circle, rgba(108, 63, 245, 0.06) 1px, transparent 1px),
        linear-gradient(160deg, #f5f3ff 0%, #ede9fe 30%, #f8fafc 100%);
    background-size: 24px 24px, 100% 100%;
    padding: 32px 40px;

    @media (max-width: 900px) {
        display: none;
    }

    .brand-glow {
        position: absolute;
        border-radius: 50%;
        pointer-events: none;

        &--top {
            width: 360px;
            height: 360px;
            background: radial-gradient(circle, rgba(108, 63, 245, 0.12), transparent 70%);
            top: -120px;
            right: -80px;
        }

        &--bottom {
            width: 280px;
            height: 280px;
            background: radial-gradient(circle, rgba(168, 139, 250, 0.10), transparent 70%);
            bottom: -80px;
            left: -60px;
        }
    }

    .brand-header {
        position: relative;
        z-index: 1;

        .brand-logo-box {
            display: inline-flex;
            align-items: center;
            gap: 10px;
            font-size: 18px;
            font-weight: 700;
            color: #1e1b4b;
            background: rgba(255, 255, 255, 0.6);
            backdrop-filter: blur(8px);
            padding: 8px 18px;
            border-radius: 12px;
        }
    }
}

.character-stage {
    position: relative;
    z-index: 1;
    flex: 1;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    padding-bottom: 20px;
}

.characters-scene {
    position: relative;
    width: 100%;
    max-width: 500px;
    height: 360px;
}

.character {
    position: absolute;
    bottom: 0;
    transition: transform 0.7s ease-in-out, height 0.7s ease-in-out;
}

.character--purple {
    left: 60px;
    width: 170px;
    height: 360px;
    background: #7C3AED;
    border-radius: 12px 12px 0 0;
    z-index: 1;
}

.character--black {
    left: 220px;
    width: 110px;
    height: 280px;
    background: #2D2D2D;
    border-radius: 10px 10px 0 0;
    z-index: 2;
}

.character--orange {
    left: 0px;
    width: 220px;
    height: 180px;
    background: #FB923C;
    border-radius: 110px 110px 0 0;
    z-index: 3;
}

.character--yellow {
    left: 290px;
    width: 130px;
    height: 210px;
    background: #FACC15;
    border-radius: 65px 65px 0 0;
    z-index: 4;
}

.eyes-row {
    position: absolute;
    display: flex;
    gap: 20px;
    transition: left 0.7s ease-in-out, top 0.7s ease-in-out;

    &--bare {
        gap: 24px;
    }
}

.eyeball {
    width: 18px;
    height: 18px;
    background: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: height 0.15s;
    overflow: hidden;

    &.blinking {
        height: 2px;
    }

    &--sm {
        width: 15px;
        height: 15px;
    }
}

.pupil {
    width: 7px;
    height: 7px;
    background: #2D2D2D;
    border-radius: 50%;
    transition: transform 0.1s ease-out;

    &--sm {
        width: 5px;
        height: 5px;
    }

    &--bare {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: #2D2D2D;
        transition: transform 0.1s ease-out;
    }
}

.mouth {
    position: absolute;
    width: 50px;
    height: 4px;
    background: #2D2D2D;
    border-radius: 2px;
    transition: left 0.7s ease-in-out, top 0.7s ease-in-out;
}

.form-container {
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 48px 52px;
    background: var(--el-bg-color);
    gap: 24px;

    @media (max-width: 900px) {
        padding: 32px 24px;
        justify-content: flex-start;
    }

    .mobile-logo {
        display: none;
        align-items: center;
        gap: 10px;
        font-size: 18px;
        font-weight: 700;
        color: var(--el-text-color-primary);
        margin-bottom: 16px;

        @media (max-width: 900px) {
            display: flex;
            justify-content: center;
        }
    }

    .form-header {
        text-align: center;

        .form-title {
            font-size: 30px;
            font-weight: 800;
            color: var(--el-text-color-primary);
            margin: 0 0 6px;
            letter-spacing: -0.5px;
        }

        .form-subtitle {
            font-size: 14px;
            color: var(--el-text-color-secondary);
            margin: 0;
        }
    }

    .login-form {
        width: 100%;

        .field-label {
            display: block;
            font-size: 13px;
            font-weight: 500;
            color: var(--el-text-color-regular);
            margin-bottom: 4px;
        }

        .password-wrapper {
            position: relative;
            width: 100%;

            .password-toggle {
                position: absolute;
                right: 8px;
                top: 50%;
                transform: translateY(-50%);
                z-index: 2;
                background: none;
                border: none;
                cursor: pointer;
                color: var(--el-text-color-secondary);
                padding: 4px;
                display: flex;
                align-items: center;

                &:hover {
                    color: var(--el-text-color-primary);
                }
            }
        }

        .form-options {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 8px;

            .forgot-link {
                font-size: 13px;
                color: #7C3AED;
                text-decoration: none;
                font-weight: 500;

                &:hover {
                    text-decoration: underline;
                }
            }
        }

        .error-msg {
            padding: 10px 14px;
            font-size: 13px;
            color: #fca5a5;
            background: rgba(239, 68, 68, 0.08);
            border: 1px solid rgba(239, 68, 68, 0.2);
            border-radius: 8px;
            margin-bottom: 4px;
        }

        .submit-btn {
            width: 100%;
            height: 46px;
            font-size: 15px;
            font-weight: 600;
            border-radius: 10px;
            background: #7C3AED;
            border-color: #7C3AED;

            &:hover {
                background: #6D28D9;
                border-color: #6D28D9;
            }
        }

        :deep(.el-form-item) {
            margin-bottom: 18px;
        }

        :deep(.el-input__wrapper) {
            border-radius: 8px;
            box-shadow: 0 0 0 1px var(--el-border-color) inset;
        }

        :deep(.el-input__wrapper:hover) {
            box-shadow: 0 0 0 1px var(--el-border-color-darker) inset;
        }

        :deep(.el-input__wrapper.is-focus) {
            box-shadow: 0 0 0 1px #7C3AED inset;
        }
    }

    .social-login {
        .google-btn {
            width: 100%;
            height: 46px;
            font-size: 14px;
            font-weight: 500;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            background: var(--el-bg-color);
            border: 1px solid var(--el-border-color);

            &:hover {
                background: var(--el-fill-color-light);
            }
        }

        .google-icon {
            flex-shrink: 0;
        }
    }

    .signup-link {
        text-align: center;
        font-size: 13px;
        color: var(--el-text-color-secondary);

        a {
            color: var(--el-text-color-primary);
            font-weight: 600;
            text-decoration: none;

            &:hover {
                text-decoration: underline;
            }
        }
    }

    .tip {
        font-size: 12px;
        background: var(--el-fill-color-light);
        color: var(--el-text-color-secondary);
        border: 1px solid var(--el-border-color-light);
        padding: 10px 15px;
        border-radius: 8px;
        display: flex;
        gap: 8px;
        align-items: center;

        .tip-dot {
            width: 5px;
            height: 5px;
            border-radius: 50%;
            background-color: #7C3AED;
            flex-shrink: 0;
        }
    }
}
</style>

<style lang="less">
html.dark {
    .login-container .brand-panel {
        background:
            radial-gradient(circle, rgba(148, 163, 184, 0.04) 1px, transparent 1px),
            linear-gradient(160deg, #020617 0%, #0f0825 35%, #020617 100%);
        background-size: 24px 24px, 100% 100%;

        .brand-glow--top {
            background: radial-gradient(circle, rgba(124, 58, 237, 0.10), transparent 70%);
        }

        .brand-glow--bottom {
            background: radial-gradient(circle, rgba(168, 139, 250, 0.06), transparent 70%);
        }

        .brand-logo-box {
            color: #e2e8f0;
            background: rgba(30, 27, 75, 0.5);
        }

        .brand-footer a {
            color: rgba(148, 163, 184, 0.5);

            &:hover {
                color: rgba(226, 232, 240, 0.8);
            }
        }
    }
}
</style>
