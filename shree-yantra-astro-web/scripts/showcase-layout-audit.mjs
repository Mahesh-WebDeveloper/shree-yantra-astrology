const port = Number(process.argv[2] || 9223)
const auditWidth = Number(process.argv[3] || 0)
const auditHeight = Number(process.argv[4] || 0)
const auditLang = process.argv[5] || ''
const auditTheme = process.argv[6] || ''

const targets = await fetch(`http://127.0.0.1:${port}/json`).then((response) => response.json())
const target = targets.find((item) => item.type === 'page')

if (!target) {
  throw new Error('No Chrome page target found')
}

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
if (auditLang || auditTheme) {
  const setupExpression = "localStorage.setItem('sy.lang', " + JSON.stringify(auditLang || 'en') + "); localStorage.setItem('sy.theme.v3', " + JSON.stringify(auditTheme || 'dark') + ")"
  await command('Runtime.evaluate', { expression: setupExpression })
}
if (auditWidth && auditHeight) {
  await command('Emulation.setDeviceMetricsOverride', { width: auditWidth, height: auditHeight, deviceScaleFactor: 1, mobile: true })
  await command('Page.reload', { ignoreCache: true })
}
await new Promise((resolve) => setTimeout(resolve, 800))

const expression = `(() => {
  const visible = (element) => {
    const style = getComputedStyle(element)
    const rect = element.getBoundingClientRect()
    return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 1 && rect.height > 1
  }
  const overflow = [...document.body.querySelectorAll('*')]
    .filter(visible)
    .map((element) => {
      const rect = element.getBoundingClientRect()
      return {
        tag: element.tagName.toLowerCase(),
        className: String(element.className || '').slice(0, 120),
        left: Math.round(rect.left),
        right: Math.round(rect.right),
        width: Math.round(rect.width),
      }
    })
    .filter((item) => item.left < -2 || item.right > innerWidth + 2)
    .slice(0, 20)

  return {
    viewport: { width: innerWidth, height: innerHeight },
    document: {
      width: document.documentElement.scrollWidth,
      height: document.documentElement.scrollHeight,
    },
    layout: (() => { const e=document.querySelector('.sy-hero__layout'); const c=document.querySelector('.sy-hero__copy'); const h=document.querySelector('.sy-hero'); const er=e?.getBoundingClientRect(); const cr=c?.getBoundingClientRect(); return { heroWidth:h?.getBoundingClientRect().width, layoutRect:er&&{left:er.left,right:er.right,width:er.width}, layoutCss:e&&{width:getComputedStyle(e).width,maxWidth:getComputedStyle(e).maxWidth,grid:getComputedStyle(e).gridTemplateColumns,transform:getComputedStyle(e).transform}, copyRect:cr&&{left:cr.left,right:cr.right,width:cr.width}, copyCss:c&&{width:getComputedStyle(c).width,minWidth:getComputedStyle(c).minWidth,transform:getComputedStyle(c).transform} }; })(),
    hero: {
      title: document.querySelector('.sy-hero h1')?.innerText,
      appMessage: document.querySelector('.sy-product-pill')?.innerText,
      phoneCount: document.querySelectorAll('.sy-hero .sy-device').length,
    },
    language: { html: document.documentElement.lang, corruptGlyphs: (document.body.innerText.match(/[àâ]/g) || []).length },
    sections: [...document.querySelectorAll('main section[id]')].map((section) => section.id),
    images: [...document.images].map((image) => ({
      alt: image.alt,
      complete: image.complete,
      width: image.naturalWidth,
      height: image.naturalHeight,
    })),
    overflow,
  }
})()`

const result = await command('Runtime.evaluate', {
  expression,
  returnByValue: true,
})

console.log(JSON.stringify(result.result.value, null, 2))
socket.close()




