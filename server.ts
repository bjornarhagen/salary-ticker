const dist = import.meta.dir + '/dist'
const port = parseInt(Bun.env.PORT ?? '8080')
const host = Bun.env.HOST ?? '0.0.0.0'

Bun.serve({
    port,
    hostname: host,
    async fetch(req) {
        const url = new URL(req.url)
        const path = url.pathname === '/' ? '/index.html' : url.pathname

        let file = Bun.file(dist + path)
        if (!(await file.exists())) {
            file = Bun.file(dist + '/index.html')
        }
        return new Response(file)
    },
})

console.log(`Serving on http://${host}:${port}`)
