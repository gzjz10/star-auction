import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv, type Plugin } from 'vite'

/**
 * Google AdSense, switched on by VITE_ADSENSE_CLIENT (ca-pub-…).
 * When it is set, the account meta tag and the AdSense script go into index.html
 * (Google's crawler looks for them there) and /ads.txt is emitted. When it is not
 * set, the build carries no ad code at all.
 */
function adsense(client: string | undefined): Plugin {
  return {
    name: 'star-auction-adsense',
    transformIndexHtml() {
      if (!client) return []
      return [
        { tag: 'meta', attrs: { name: 'google-adsense-account', content: client }, injectTo: 'head' },
        {
          tag: 'script',
          attrs: {
            async: true,
            src: `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`,
            crossorigin: 'anonymous',
          },
          injectTo: 'head',
        },
      ]
    },
    generateBundle() {
      if (!client) return
      this.emitFile({
        type: 'asset',
        fileName: 'ads.txt',
        source: `google.com, ${client.replace(/^ca-/, '')}, DIRECT, f08c47fec0942fa0\n`,
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const client = env.VITE_ADSENSE_CLIENT?.trim() || undefined
  return {
    plugins: [react(), adsense(client)],
    build: {
      // Keep flag SVGs as separate files so only the flags on screen are downloaded.
      assetsInlineLimit: 0,
    },
  }
})
