export async function getHealth(baseUrl: string): Promise<{ status: string }> {
  const response = await fetch(`${baseUrl}/api/v1/health`)
  if (!response.ok) {
    throw new Error(`Health check failed with status ${response.status}`)
  }

  return response.json()
}
