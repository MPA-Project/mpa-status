export async function handleRequest(_request: Request): Promise<Response> {
  return new Response(JSON.stringify({message: 'OK'}), {
    headers: { "Content-Type": "application/json" },
  })
}
