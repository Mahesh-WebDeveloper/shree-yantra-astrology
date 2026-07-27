const port = Number(process.argv[2] || 9224)
const targets = await fetch(`http://127.0.0.1:${port}/json`).then((response) => response.json())
const target = targets.find((item) => item.type === 'page')
if (!target) throw new Error('No Chrome page target found')

const socket = new WebSocket(target.webSocketDebuggerUrl)
await new Promise((resolve, reject) => {
  socket.addEventListener('open', resolve, { once: true })
  socket.addEventListener('error', reject, { once: true })
})

let commandId = 0
function command(method, params = {}) {
  const id = ++commandId
  socket.send(JSON.stringify({ id, method, params }))
  return new Promise((resolve, reject) => {
    const handler = (event) => {
      const message = JSON.parse(event.data)
      if (message.id !== id) return
      socket.removeEventListener('message', handler)
      if (message.error) reject(new Error(message.error.message))
      else resolve(message.result)
    }
    socket.addEventListener('message', handler)
  })
}

await command('Runtime.enable')
const result = await command('Runtime.evaluate', {
  expression: `(async () => {
    const tabs = [...document.querySelectorAll('.sy-tour-tab')]
    tabs[1]?.click()
    await new Promise((resolve) => setTimeout(resolve, 650))
    const faqButtons = [...document.querySelectorAll('.sy-faq__list button')]
    faqButtons[1]?.click()
    await new Promise((resolve) => setTimeout(resolve, 380))
    document.querySelector('#library')?.scrollIntoView()
    await new Promise((resolve) => setTimeout(resolve, 700))
    return {
      selectedTour: document.querySelector('.sy-tour-tab.is-active strong')?.innerText,
      tourImageAlt: document.querySelector('.sy-device--tour img')?.alt,
      expandedFaq: document.querySelector('.sy-faq__list article.is-open button strong')?.innerText,
      libraryImageLoaded: Boolean(document.querySelector('.sy-device--library img')?.complete && document.querySelector('.sy-device--library img')?.naturalWidth),
      playLinks: [...document.querySelectorAll('a[href*="play.google.com"]')].length,
      brokenInternalAnchors: [...document.querySelectorAll('a[href^="#"]')]
        .map((anchor) => anchor.getAttribute('href'))
        .filter((href) => href && !document.querySelector(href)),
    }
  })()`,
  awaitPromise: true,
  returnByValue: true,
})
console.log(JSON.stringify(result.result.value, null, 2))
socket.close()

