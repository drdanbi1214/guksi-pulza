import type { VercelRequest, VercelResponse } from '@vercel/node'
import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'

webpush.setVapidDetails(
  'mailto:lucy001214@gmail.com',
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  )

  const { data: subs } = await supabase.from('push_subscriptions').select('*')
  if (!subs?.length) return res.json({ sent: 0 })

  const payload = JSON.stringify({
    title: '오늘치 알렌 푸셨나요?',
    body: '지금 열 문제를 풀어야 밀리지 않아요! 알렌으로 들어오세요.',
  })

  const expiredIds: string[] = []
  await Promise.all(
    subs.map(sub =>
      webpush
        .sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, payload)
        .catch(err => {
          if (err.statusCode === 410 || err.statusCode === 404) expiredIds.push(sub.id)
        })
    )
  )

  if (expiredIds.length) {
    await supabase.from('push_subscriptions').delete().in('id', expiredIds)
  }

  res.json({ sent: subs.length - expiredIds.length })
}
