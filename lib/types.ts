export interface Campaign {
  id: string
  name: string
  status: string
  leads: number
  spend: number
  cpl: number
  ctr: number
  impressions: number
  clicks: number
}

export interface KpiData {
  leads: number
  spend: number
  cpl: number
  ctr: number
  impressions: number
  clicks: number
}
