import { ref } from 'vue'

interface Toast {
  id: number
  message: string
  type: 'success' | 'error' | 'info'
}

const toasts = ref<Toast[]>([])
let nextId = 0

export function useToast() {
  const add = (message: string, type: Toast['type']) => {
    const id = nextId++
    toasts.value.push({ id, message, type })
    setTimeout(() => {
      remove(id)
    }, 3000)
  }

  const remove = (id: number) => {
    const index = toasts.value.findIndex(toast => toast.id === id)
    if (index > -1) {
      toasts.value.splice(index, 1)
    }
  }

  const success = (message: string) => add(message, 'success')
  const error = (message: string) => add(message, 'error')
  const info = (message: string) => add(message, 'info')

  return {
    toasts,
    success,
    error,
    info,
    remove
  }
}