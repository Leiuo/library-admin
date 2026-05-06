<template>
    <!-- <router-view /> -->

    <!-- <transition name="fade" mode="out-in">
        <router-view />
    </transition> -->

    <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
            <component :is="Component" />
        </transition>
    </router-view>
</template>

<script setup>

</script>

<style>
* {
    padding: 0;
    margin: 0;
    box-sizing: border-box;
}

html,
body,
#app {
    width: 100%;
    height: 100%;
}

.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>