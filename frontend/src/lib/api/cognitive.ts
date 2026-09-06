import { supabase } from '@/utils/supabase/client'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://noctalink-api-181953188443.us-central1.run.app'

async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession()
  return {
    'Content-Type': 'application/json',
    ...(session ? { 'Authorization': `Bearer ${session.access_token}` } : {})
  }
}

export async function fetchCognitiveTwin() {
  const headers = await getAuthHeaders()
  const response = await fetch(`${API_BASE_URL}/api/cognitive-twin`, {
    headers
  })
  
  if (!response.ok) {
    throw new Error('Failed to fetch Cognitive Twin state')
  }
  
  return response.json()
}

export async function fetchRecoveryRecommendation() {
  const headers = await getAuthHeaders()
  const response = await fetch(`${API_BASE_URL}/api/recovery/recommend`, {
    method: 'POST',
    headers
  })
  
  if (!response.ok) {
    throw new Error('Failed to fetch recovery recommendation')
  }
  
  return response.json()
}

export async function testIoTEndpoint(payload: any) {
  const headers = await getAuthHeaders()
  const response = await fetch(`${API_BASE_URL}/api/iot/eeg/test`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
  })
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail?.message || 'Failed to send IoT test payload')
  }
  
  return response.json()
}
