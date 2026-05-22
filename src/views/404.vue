<template>
    <div class="not-found">
        <h1>404</h1>
        <p>页面未找到</p>
        <router-link to="/" class="back-to-home">返回首页</router-link>
    </div>
</template>

<style scoped>
#app {
    height: 100vh;
}

.not-found {
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
}

.not-found h1 {
    font-size: 48px;
    color: #ccc;
    margin-bottom: 10px;
}

.not-found p {
    font-size: 18px;
    color: #666;
}

.back-to-home {
    display: inline-block;
    margin-top: 20px;
    padding: 10px 20px;
    background-color: #409EFF;
    color: #fff;
    text-decoration: none;
    border-radius: 6px;
}

.back-to-home:hover {
    background-color: #66b1ff;
}
</style>