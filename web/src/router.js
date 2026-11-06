import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/', name: 'home', component: () => import('./views/Home.vue') },
  { path: '/pipeline', name: 'pipeline', component: () => import('./views/Pipeline.vue') },
  { path: '/banner', name: 'banner', component: () => import('./views/Banner.vue') },
  { path: '/plan', name: 'plan', component: () => import('./views/Plan.vue') },
  { path: '/content', name: 'content', component: () => import('./views/Content.vue') },
  { path: '/data', name: 'data', component: () => import('./views/Data.vue') },
  { path: '/studio', name: 'studio', component: () => import('./views/Studio.vue') },
  { path: '/history', name: 'history', component: () => import('./views/History.vue') },
  { path: '/settings', name: 'settings', component: () => import('./views/Settings.vue') },
  { path: '/about', name: 'about', component: () => import('./views/About.vue') }
]

export default createRouter({
  history: createWebHistory(),
  routes
})
