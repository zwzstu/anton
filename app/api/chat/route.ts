import { get } from '@vercel/edge-config';

export const runtime = "edge"
export const config = {
  regions: [
    "cle1",
    "cpt1",
    "dub1",
    "fra1",
    "gru1",
    "hnd1",
    "iad1",
    "icn1",
    "kix1",
    "lhr1",
    "pdx1",
    "sfo1",
    "sin1",
    "syd1"
  ]
}

export async function POST(request: Request) {
  const messages = await request.json()
  if (messages.length === 0) {
    return new Response("[]", { status: 400 })
  }

  let key: string = ""
  const keys = await get("keys") as string[]
  if (keys) {
    key = keys[Math.floor(Math.random() * keys.length)]
  }
  const response = await fetch(process.env.NODE_ENV === "production" ? "" : "https://proxy.antonai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [{ role: "system", content: "When encountering code, please respond in strict markdown format to answer." }, ...messages],
      stream: true,
    }),
  })

  if (!response.ok) {
    return new Response(response.statusText, { status: response.status })
  }

  const { readable, writable } = new TransformStream()

  let buffer = ""

  const transform = new TransformStream({
    start() {
      buffer = ""
    },
    transform(chunk, controller) {
      buffer += chunk
      const lines = buffer.split("\n")
      buffer = lines.pop()!
      for (let line of lines) {
        if (line.length === 0) continue
        if (line.includes("[DONE]")) {
          controller.terminate()
          return
        }
        line = line.replace(/data: /g, "")
        const json = JSON.parse(line)
        const text = json.choices[0].delta?.content || ""
        controller.enqueue(text)
      }
    }
  })

  response.body?.
    pipeThrough(new TextDecoderStream()).
    pipeThrough(transform).
    pipeThrough(new TextEncoderStream()).
    pipeTo(writable)

  return new Response(readable)
}