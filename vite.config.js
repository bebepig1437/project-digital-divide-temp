import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  Object.assign(process.env, env)

  return {
    plugins: [
      react(),
      {
        name: 'local-api-submit',
        configureServer(server) {
          server.middlewares.use('/api/submit', async (req, res) => {
            if (req.method !== 'POST') {
              res.statusCode = 405
              res.setHeader('Content-Type', 'application/json')
              return res.end(JSON.stringify({ error: 'Method not allowed' }))
            }

            let raw = ''
            req.on('data', (chunk) => {
              raw += chunk
            })
            req.on('end', async () => {
              try {
                const handler = (await import('./api/submit.js')).default
                res.status = (code) => {
                  res.statusCode = code
                  return res
                }
                res.json = (data) => {
                  res.setHeader('Content-Type', 'application/json')
                  res.end(JSON.stringify(data))
                  return res
                }
                req.body = raw ? JSON.parse(raw) : {}
                await handler(req, res)
              } catch (err) {
                console.error('API Error:', err)
                res.statusCode = 500
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ error: err.message }))
              }
            })
          })
        },
      },
    ],
  }
})

