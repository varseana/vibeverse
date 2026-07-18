// genera HTML email-compatible (inline styles, table-based, 600px)
// soporta themes seleccionables por digest para eventos estacionales.
// sin confeti en email (solo web). descarga como .eml para Outlook.
// soporta el layout de filas/columnas: una fila multi-columna se emite como
// tabla anidada con un td por columna (lado a lado, ancho segun span).

import { normalizeRows } from './digestLayout.js'

export const EMAIL_THEMES = {
  default: {
    label: 'VIBE (default)',
    bg: '#140d24', surface: '#1e1538', border: '#2d2350',
    text: '#efe9f7', muted: '#b4a6d4',
    accent: '#9F86D7', accent2: '#D1A0E2',
    frames: ['#9F86D7', '#22d3ee', '#fb7185', '#fbbf24'],
    gold: '#fbbf24',
  },
  halloween: {
    label: 'Halloween',
    bg: '#1a0f05', surface: '#2d1a0a', border: '#7c2d12',
    text: '#fef3c7', muted: '#d4a574',
    accent: '#f97316', accent2: '#ea580c',
    frames: ['#f97316', '#a855f7', '#22c55e', '#fbbf24'],
    gold: '#f59e0b',
  },
  christmas: {
    label: 'Navidad',
    bg: '#0f1a0f', surface: '#1a2e1a', border: '#166534',
    text: '#dcfce7', muted: '#a7c4a7',
    accent: '#ef4444', accent2: '#22c55e',
    frames: ['#ef4444', '#22c55e', '#fbbf24', '#ef4444'],
    gold: '#fbbf24',
  },
  valentines: {
    label: 'San Valentin',
    bg: '#1a0a14', surface: '#2d1525', border: '#831843',
    text: '#fce7f3', muted: '#d4a0c4',
    accent: '#ec4899', accent2: '#f472b6',
    frames: ['#ec4899', '#f472b6', '#fb7185', '#fda4af'],
    gold: '#fda4af',
  },
  tropical: {
    label: 'Tropical',
    bg: '#0a1a1a', surface: '#132e2e', border: '#134e4a',
    text: '#ccfbf1', muted: '#8abdb4',
    accent: '#14b8a6', accent2: '#06b6d4',
    frames: ['#14b8a6', '#06b6d4', '#fbbf24', '#a78bfa'],
    gold: '#fbbf24',
  },
  ocean: {
    label: 'Oceano',
    bg: '#0a0f1a', surface: '#15202e', border: '#1e3a5f',
    text: '#e0f2fe', muted: '#93c5fd',
    accent: '#3b82f6', accent2: '#818cf8',
    frames: ['#3b82f6', '#818cf8', '#06b6d4', '#a78bfa'],
    gold: '#fbbf24',
  },
  sunset: {
    label: 'Atardecer',
    bg: '#1a0f14', surface: '#2e1520', border: '#5c1a30',
    text: '#fff1f2', muted: '#fda4af',
    accent: '#f43f5e', accent2: '#f97316',
    frames: ['#f43f5e', '#f97316', '#fbbf24', '#a855f7'],
    gold: '#fbbf24',
  },
  corporate: {
    label: 'Corporativo',
    bg: '#1e293b', surface: '#273548', border: '#334155',
    text: '#e2e8f0', muted: '#94a3b8',
    accent: '#3b82f6', accent2: '#60a5fa',
    frames: ['#3b82f6', '#60a5fa', '#38bdf8', '#818cf8'],
    gold: '#fbbf24',
  },
}

// paleta activa (se setea antes de generar)
let P = EMAIL_THEMES.default
let FRAME_COLORS = P.frames
const MESES = { January: 'Enero', February: 'Febrero', March: 'Marzo', April: 'Abril', May: 'Mayo', June: 'Junio', July: 'Julio', August: 'Agosto', September: 'Septiembre', October: 'Octubre', November: 'Noviembre', December: 'Diciembre' }
function mesEs(m) { return MESES[m] || m }
function esc(s) { return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') }

function renderHeading(block) {
  const align = block.align || 'left'
  const v = block.variant || 'default'
  const accentColor = block.color || P.accent
  const heroColor = (block.gradientStops && block.gradientStops.length >= 1) ? block.gradientStops[0] : P.accent
  const styles = {
    default: `font-size:22px;font-weight:700;color:${P.text};`,
    large: `font-size:28px;font-weight:800;color:${P.text};letter-spacing:-0.5px;`,
    hero: `font-size:34px;font-weight:800;color:${heroColor};letter-spacing:-0.8px;`,
    accent: `font-size:22px;font-weight:700;color:${accentColor};`,
    subtle: `font-size:14px;font-weight:600;color:${P.muted};text-transform:uppercase;letter-spacing:3px;`,
  }
  const showBar = v === 'default' || v === 'large'
  const barWidth = v === 'large' ? '70px' : '50px'
  const barAlign = align === 'center' ? 'margin:8px auto 0;' : align === 'right' ? 'margin:8px 0 0 auto;' : 'margin-top:8px;'

  return `<tr><td style="padding:28px 30px 12px;text-align:${align};font-family:'Segoe UI',Arial,sans-serif;">
    <div style="${styles[v] || styles.default}line-height:1.2;">${esc(block.text)}</div>
    ${showBar ? `<div style="height:3px;width:${barWidth};background:linear-gradient(90deg,${P.accent},${P.accent2});border-radius:2px;${barAlign}"></div>` : ''}
  </td></tr>`
}

function renderText(block) {
  const sizes = { small: '13px', normal: '15px', large: '18px', xl: '22px' }
  const weights = { light: '300', normal: '400', bold: '700' }
  const align = block.textAlign || 'left'
  const size = sizes[block.textSize] || '15px'
  const weight = weights[block.textWeight] || '400'
  const italic = (block.textStyle === 'italic' || block.textStyle === 'quote') ? 'font-style:italic;' : ''
  const color = block.textStyle === 'muted' ? P.muted : P.text
  let extra = ''
  if (block.textStyle === 'highlight') extra = `background:rgba(159,134,215,0.15);padding:10px 14px;border-radius:6px;border-left:3px solid ${P.accent};`
  if (block.textStyle === 'quote') extra = `padding-left:16px;border-left:2px solid ${P.muted};`
  const content = esc(block.content || '').replace(/\\n/g, '<br/>')
  return `<tr><td style="padding:8px 30px 12px;font-family:'Segoe UI',Arial,sans-serif;font-size:${size};font-weight:${weight};line-height:1.7;color:${color};text-align:${align};${italic}${extra}">${content}</td></tr>`
}

function renderImage(block) {
  if (!block.src) return ''
  const widthPx = Math.round(540 * (block.width || 100) / 100)
  let html = `<tr><td style="padding:12px 30px;"><img src="${esc(block.src)}" width="${widthPx}" style="max-width:100%;border-radius:8px;display:block;" alt="${esc(block.caption || '')}" /></td></tr>`
  if (block.caption) {
    html += `<tr><td style="padding:2px 30px 10px;font-family:'Segoe UI',Arial,sans-serif;font-size:12px;color:${P.muted};">${esc(block.caption)}</td></tr>`
  }
  return html
}

function renderSplit(block) {
  const imgW = block.imageWidth || 240
  const imgHtml = block.src
    ? `<img src="${esc(block.src)}" width="${imgW}" style="border-radius:8px;display:block;max-width:100%;" alt="" />`
    : `<div style="width:${imgW}px;height:${Math.round(imgW * 0.67)}px;background:${P.surface};border-radius:8px;"></div>`
  const textHtml = `<td style="padding:12px 18px;vertical-align:middle;font-family:'Segoe UI',Arial,sans-serif;">
    ${block.title ? `<div style="font-size:18px;font-weight:700;color:${P.text};margin-bottom:8px;">${esc(block.title)}</div>` : ''}
    <div style="font-size:14px;line-height:1.6;color:${P.muted};">${esc(block.content)}</div>
  </td>`
  const imgTd = `<td style="padding:12px;vertical-align:middle;width:${imgW}px;">${imgHtml}</td>`
  const cells = block.imageSide === 'right' ? textHtml + imgTd : imgTd + textHtml
  return `<tr><td style="padding:10px 20px;"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>${cells}</tr></table></td></tr>`
}

function renderPeople(block) {
  const entries = block.entries || []
  if (entries.length === 0) return ''
  const isAma = block.kind === 'amaversaries'
  const goldColor = P.gold
  const perRow = 4
  let rows = ''
  for (let i = 0; i < entries.length; i += perRow) {
    const chunk = entries.slice(i, i + perRow)
    const cells = chunk.map((p, ci) => {
      const frameColor = isAma ? goldColor : FRAME_COLORS[(i + ci) % FRAME_COLORS.length]
      const img = p.image
        ? `<img src="${esc(p.image)}" width="68" height="68" style="border-radius:8px;object-fit:cover;display:block;border:3px solid ${frameColor};" alt="${esc(p.name)}" />`
        : `<div style="width:68px;height:68px;border-radius:8px;background:${P.surface};border:3px solid ${frameColor};text-align:center;line-height:68px;font-size:20px;font-weight:700;color:${P.muted};font-family:'Segoe UI',Arial,sans-serif;">${esc((p.name || p.login || '?').slice(0, 2).toUpperCase())}</div>`
      const meta = block.kind === 'amaversaries'
        ? `${p.years} año${p.years === 1 ? '' : 's'}, ${p.day} de ${mesEs(block.month)}`
        : `${p.day} de ${mesEs(block.month)}`
      return `<td style="padding:10px;text-align:center;vertical-align:top;width:${Math.floor(100 / perRow)}%;">
        <div style="margin:0 auto;width:74px;">${img}</div>
        <div style="font-family:'Segoe UI',Arial,sans-serif;font-size:12px;font-weight:600;color:${P.text};margin-top:8px;">${esc(p.name || p.login)}</div>
        <div style="font-family:'Segoe UI',Arial,sans-serif;font-size:11px;color:${P.muted};margin-top:2px;">${esc(meta)}</div>
      </td>`
    }).join('')
    const pad = perRow - chunk.length
    const padCells = pad > 0 ? `<td colspan="${pad}"></td>` : ''
    rows += `<tr>${cells}${padCells}</tr>`
  }
  return `<tr><td style="padding:10px 16px;"><table width="100%" cellpadding="0" cellspacing="0" border="0">${rows}</table></td></tr>`
}

function renderBanner(block) {
  if (!block.src) return ''
  const img = `<img src="${esc(block.src)}" width="540" style="max-width:100%;border-radius:8px;display:block;" alt="" />`
  const content = block.link
    ? `<a href="${esc(block.link)}" target="_blank" style="display:block;">${img}</a>`
    : img
  return `<tr><td style="padding:12px 30px;">${content}</td></tr>`
}

function renderDivider() {
  return `<tr><td style="padding:18px 30px;"><div style="height:1px;background:linear-gradient(90deg,transparent,${P.border},transparent);"></div></td></tr>`
}

// Render one block to its <tr>...</tr> email markup.
function renderBlock(block) {
  switch (block.type) {
    case 'heading': return renderHeading(block)
    case 'text': return renderText(block)
    case 'image': return renderImage(block)
    case 'banner': return renderBanner(block)
    case 'split': return renderSplit(block)
    case 'people': return renderPeople(block)
    case 'divider': return renderDivider()
    default: return ''
  }
}

// A row: one or more columns side by side. Single-column rows render the block
// directly (full width). Multi-column rows nest a table with a <td> per column,
// width proportional to span. Email clients render side-by-side <td> reliably
// on desktop, which is the only target here.
function renderRow(row) {
  const cols = row.columns || []
  if (cols.length === 0) return ''
  if (cols.length === 1) return renderBlock(cols[0].block)
  const totalSpan = cols.reduce((sum, c) => sum + (c.span || 1), 0)
  const cells = cols.map((c) => {
    const pct = Math.round(((c.span || 1) / totalSpan) * 100)
    return `<td width="${pct}%" style="width:${pct}%;vertical-align:top;padding:0 6px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">${renderBlock(c.block)}</table>
    </td>`
  }).join('')
  return `<tr><td style="padding:4px 24px;"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>${cells}</tr></table></td></tr>`
}

export function generateDigestHTML(digest) {
  // activar theme del digest (o default)
  P = EMAIL_THEMES[digest.emailTheme] || EMAIL_THEMES.default
  FRAME_COLORS = P.frames

  const sections = normalizeRows(digest.sections).map(renderRow).join('\n')

  return `<table width="600" cellpadding="0" cellspacing="0" border="0" align="center" style="max-width:600px;width:100%;background:${P.bg};border-radius:8px;border:1px solid ${P.border};font-family:'Segoe UI',Arial,sans-serif;">
  <tr><td style="padding:30px 30px 0;text-align:center;">
    <div style="font-size:32px;font-weight:800;color:${P.text};letter-spacing:-1px;">${esc(digest.title)}</div>
    <div style="font-size:16px;color:${P.accent};margin-top:6px;font-weight:600;">${esc(digest.subtitle)}</div>
    <div style="margin:16px auto 0;height:2px;width:80px;background:linear-gradient(90deg,${P.accent},${P.accent2});border-radius:2px;"></div>
  </td></tr>
  ${sections}
  <tr><td style="padding:24px 30px;text-align:center;">
    <div style="height:1px;background:linear-gradient(90deg,transparent,${P.border},transparent);margin-bottom:16px;"></div>
    <div style="font-size:12px;color:${P.muted};">VIBE Team | SEPO Costa Rica</div>
  </td></tr>
</table>`
}

export function downloadDigestEML(digest) {
  const html = generateDigestHTML(digest)
  const subject = `${digest.title} - ${digest.subtitle}`
  const boundary = 'boundary_' + Date.now().toString(36)
  const eml = [
    `From: VIBE Team <vibe@amazon.com>`,
    `Subject: ${subject}`,
    `X-Unsent: 1`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    ``,
    `--${boundary}`,
    `Content-Type: text/plain; charset="UTF-8"`,
    ``,
    `${digest.title} - ${digest.subtitle}`,
    ``,
    `--${boundary}`,
    `Content-Type: text/html; charset="UTF-8"`,
    ``,
    `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:20px;background:#0a0714;">`,
    html,
    `</body></html>`,
    ``,
    `--${boundary}--`,
  ].join('\r\n')
  const blob = new Blob([eml], { type: 'message/rfc822' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `VIBE-Digest-${(digest.subtitle || 'draft').replace(/\s+/g, '-')}.eml`
  a.click()
  URL.revokeObjectURL(url)
}
