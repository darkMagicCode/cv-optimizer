const fs = require('fs')
const path = require('path')

const projectRoot = path.resolve(__dirname, '..')
const srcAgentsDir = path.join(projectRoot, 'src', 'agents')
const distAgentsDir = path.join(projectRoot, 'dist', 'agents')

function copyMarkdownFiles(srcDir, destDir) {
  if (!fs.existsSync(srcDir)) return
  fs.mkdirSync(destDir, { recursive: true })

  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    const srcPath = path.join(srcDir, entry.name)
    const destPath = path.join(destDir, entry.name)

    if (entry.isDirectory()) {
      copyMarkdownFiles(srcPath, destPath)
      continue
    }

    if (entry.isFile() && entry.name.endsWith('.md')) {
      fs.copyFileSync(srcPath, destPath)
    }
  }
}

copyMarkdownFiles(srcAgentsDir, distAgentsDir)
console.log('Copied agent prompt markdown files to dist/agents')
