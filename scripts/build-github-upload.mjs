import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, extname, isAbsolute, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const distDirectory = resolve(projectRoot, 'dist')
const outputDirectory = resolve(projectRoot, 'github-upload')
const htmlPath = resolve(distDirectory, 'index.html')
const html = await readFile(htmlPath, 'utf8')
const scriptTag = html.match(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>\s*<\/script>/i)
const styleTag = html.match(/<link\b(?=[^>]*\brel=["']stylesheet["'])[^>]*\bhref=["']([^"']+)["'][^>]*>/i)

if (!scriptTag || !styleTag) {
  throw new Error('Vite output must contain one JavaScript entry and one stylesheet.')
}

const resolveDistAsset = (reference, baseDirectory) => {
  const assetPath = resolve(baseDirectory, decodeURIComponent(reference.split(/[?#]/, 1)[0]))
  const relativePath = relative(distDirectory, assetPath)
  if (isAbsolute(relativePath) || relativePath === '..' || relativePath.startsWith(`..${sep}`)) {
    throw new Error(`Build asset is outside dist: ${reference}`)
  }
  return assetPath
}

const scriptPath = resolveDistAsset(scriptTag[1], distDirectory)
const stylePath = resolveDistAsset(styleTag[1], distDirectory)
const script = (await readFile(scriptPath, 'utf8')).replace(/<\/script/gi, '<\\/script')
let styles = await readFile(stylePath, 'utf8')

const mimeTypes = {
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
}

for (const match of [...styles.matchAll(/url\((["']?)([^"')]+)\1\)/g)]) {
  const reference = match[2]
  if (/^(data:|https?:|\/\/|#)/i.test(reference)) continue
  const assetPath = resolveDistAsset(reference, dirname(stylePath))
  const mimeType = mimeTypes[extname(assetPath).toLowerCase()]
  if (!mimeType) throw new Error(`Unsupported CSS asset type: ${assetPath}`)
  const asset = await readFile(assetPath)
  const dataUrl = `url("data:${mimeType};base64,${asset.toString('base64')}")`
  styles = styles.replace(match[0], dataUrl)
}

const singleFileHtml = html
  .replace(styleTag[0], () => `<style>\n${styles}\n</style>`)
  .replace(scriptTag[0], () => `<script type="module">\n${script}\n</script>`)

await mkdir(outputDirectory, { recursive: true })
await writeFile(resolve(outputDirectory, 'index.html'), singleFileHtml, 'utf8')
await Promise.all(['manifest.webmanifest', 'sw.js', 'icon.svg'].map((file) =>
  copyFile(resolve(distDirectory, file), resolve(outputDirectory, file)),
))

console.log(`GitHub upload files are ready in ${outputDirectory}`)
