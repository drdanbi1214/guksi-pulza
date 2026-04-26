self.addEventListener('push', event => {
  const data = event.data?.json() || {}
  event.waitUntil(
    self.registration.showNotification(data.title || '국시를풀자', {
      body: data.body,
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      data: { url: self.location.origin },
    })
  )
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  event.waitUntil(clients.openWindow(event.notification.data?.url || '/'))
})
