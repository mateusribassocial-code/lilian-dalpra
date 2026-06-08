import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'

export async function GET() {
  const token = process.env.META_ACCESS_TOKEN ?? ''
  const vars = {
    META_ACCESS_TOKEN: !!token,
    META_TOKEN_LEN: token.length,
    META_TOKEN_PREFIX: token.slice(0, 10),
    GA4_PROPERTY_ID: !!process.env.GA4_PROPERTY_ID,
    GA4_CLIENT_ID: !!process.env.GA4_CLIENT_ID,
    GA4_CLIENT_SECRET: !!process.env.GA4_CLIENT_SECRET,
    GA4_REFRESH_TOKEN: !!process.env.GA4_REFRESH_TOKEN,
    C2S_API_TOKEN: !!process.env.C2S_API_TOKEN,
    GOOGLE_ADS_DEVELOPER_TOKEN: !!process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
    GPINHEIRO_PASSWORD: !!process.env.GPINHEIRO_PASSWORD,
  }

  // Testa token Meta
  let metaOk = false
  let metaError = ''
  if (token) {
    try {
      const res = await fetch(`https://graph.facebook.com/v21.0/me?access_token=${token}`, { cache: 'no-store' })
      metaOk = res.ok
      if (!res.ok) metaError = await res.text()
    } catch (e: any) { metaError = e?.message }
  }

  // Testa token GA4
  let ga4Ok = false
  if (process.env.GA4_CLIENT_ID && process.env.GA4_CLIENT_SECRET && process.env.GA4_REFRESH_TOKEN) {
    try {
      const res = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: process.env.GA4_CLIENT_ID,
          client_secret: process.env.GA4_CLIENT_SECRET,
          refresh_token: process.env.GA4_REFRESH_TOKEN,
          grant_type: 'refresh_token',
        }),
      })
      const data = await res.json()
      ga4Ok = !!data.access_token
    } catch {}
  }

  return NextResponse.json({ vars, metaOk, metaError, ga4Ok })
}
