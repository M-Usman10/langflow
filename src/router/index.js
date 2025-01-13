import { createRouter, createWebHistory } from 'vue-router'
import { supabase } from '../services/supabase'
import OTPAuth from '../components/OTPAuth.vue'
import AuthCallback from '../components/AuthCallback.vue'
import PDFReader from '../components/PDFReader.vue'
import ChatView from '../views/ChatView.vue'

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    component: OTPAuth,
    meta: { requiresAuth: false }
  },
  {
    path: '/chat',
    component: ChatView,
    meta: { requiresAuth: true }
  },
  {
    path: '/auth/callback',
    component: AuthCallback,
    meta: { requiresAuth: false }
  },
  {
    path: '/test',
    component: PDFReader,
    meta: { requiresAuth: false }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Navigation guard
router.beforeEach(async (to, from, next) => {
  const { data: { session } } = await supabase.auth.getSession()
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)

  if (requiresAuth && !session) {
    next('/login')
  } else if (session && to.path === '/login') {
    next('/chat')
  } else {
    next()
  }
})

export default router