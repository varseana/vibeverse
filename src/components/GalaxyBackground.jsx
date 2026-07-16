import { useEffect, useRef } from 'react'

// Milky-Way galaxy background on a single 2D canvas. Zero dependencies,
// tinted to the VIBEverse palette, respects prefers-reduced-motion.
//
// Realism techniques (from research):
//   - Power-law star population: mostly 1px alpha-graded pinpoints, a rare few
//     bright-with-glow. This "depth" is the #1 thing that reads as real.
//   - Additive glow (globalCompositeOperation 'lighter') on bright stars +
//     diffraction spikes on the very brightest. Light adds, so overlaps bloom.
//   - Fractal NEBULA via fBm value noise + domain warping (Quilez), baked once.
//   - Mottled dark dust lanes (fractal noise, multiplied), not one clean lane.
//   - Star density weighted toward the galactic band (Gaussian falloff).
//   - Grain overlay to kill 8-bit gradient banding + vignette for focus.
// Everything expensive is baked ONCE to an offscreen canvas; per frame we blit
// it and animate only a few dozen twinklers.
export default function GalaxyBackground() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let width, height, dpr, sky, twinklers, raf, t0

    // ---- seeded value noise + fBm (Quilez-style) ----
    function createFbm(seedInit) {
      const perm = new Uint8Array(512)
      const p = new Uint8Array(256)
      for (let i = 0; i < 256; i++) p[i] = i
      let s = seedInit >>> 0
      const rr = () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296
      for (let i = 255; i > 0; i--) { const j = (rr() * (i + 1)) | 0, tmp = p[i]; p[i] = p[j]; p[j] = tmp }
      for (let i = 0; i < 512; i++) perm[i] = p[i & 255]
      const fade = (x) => x * x * x * (x * (x * 6 - 15) + 10)
      const lerp = (a, b, x) => a + (b - a) * x
      const val = (xi, yi) => perm[(perm[xi & 255] + (yi & 255)) & 255] / 255
      const noise2 = (x, y) => {
        const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi
        const u = fade(xf), v = fade(yf)
        return lerp(lerp(val(xi, yi), val(xi + 1, yi), u), lerp(val(xi, yi + 1), val(xi + 1, yi + 1), u), v)
      }
      const fbm = (x, y, oct = 5) => {
        let amp = 0.5, freq = 1, sum = 0, norm = 0
        for (let i = 0; i < oct; i++) { sum += amp * noise2(x * freq, y * freq); norm += amp; amp *= 0.5; freq *= 2 }
        return sum / norm
      }
      return fbm
    }

    // Star temperature -> gentle RGB tint (warm..white..cool), never full hue.
    const mix = (a, b, x) => [a[0] + (b[0] - a[0]) * x, a[1] + (b[1] - a[1]) * x, a[2] + (b[2] - a[2]) * x]
    const tempToRGB = (tp) => {
      const warm = [255, 205, 165], white = [255, 255, 255], cool = [190, 212, 255]
      return tp < 0.5 ? mix(warm, white, tp / 0.5) : mix(white, cool, (tp - 0.5) / 0.5)
    }
    const starTemp = (r) => {
      if (r < 0.02) return 0.95      // blue
      if (r < 0.12) return 0.80      // blue-white
      if (r < 0.30) return 0.62      // white
      if (r < 0.60) return 0.50      // yellow-white
      if (r < 0.85) return 0.35      // pale orange
      return 0.15                    // faint red
    }

    // Pre-render one soft glow sprite (reused via drawImage; never per-frame gradients).
    const makeGlow = (size, rgb) => {
      const c = document.createElement('canvas'); c.width = c.height = size
      const gx = c.getContext('2d'), rr = size / 2
      const g = gx.createRadialGradient(rr, rr, 0, rr, rr, rr)
      g.addColorStop(0, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.9)`)
      g.addColorStop(0.18, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.35)`)
      g.addColorStop(1, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0)`)
      gx.fillStyle = g; gx.fillRect(0, 0, size, size)
      return c
    }
    const glowSprite = makeGlow(64, [255, 255, 255])

    // ---- bake the whole static galaxy to an offscreen canvas ----
    const buildSky = () => {
      sky = document.createElement('canvas')
      sky.width = width; sky.height = height
      const g = sky.getContext('2d')
      let seed = 20260715
      const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296

      // base deep-space gradient
      const base = g.createLinearGradient(0, 0, width, height)
      base.addColorStop(0, '#140d26'); base.addColorStop(0.5, '#1a1234'); base.addColorStop(1, '#110b20')
      g.fillStyle = base; g.fillRect(0, 0, width, height)

      const angle = -0.5
      const bandLen = Math.hypot(width, height)
      const bandHalf = bandLen * 0.7

      // --- fractal nebula (fBm + domain warp) baked via ImageData ---
      const fbm = createFbm(1337)
      const nb = document.createElement('canvas'); nb.width = width; nb.height = height
      const nctx = nb.getContext('2d')
      const img = nctx.createImageData(width, height); const d = img.data
      const S = 1 / 260
      const emit = [200, 90, 150], refl = [120, 130, 220] // pink emission, blue reflection (palette-leaning)
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const wx = fbm(x * S + 5.2, y * S + 1.3, 4)
          const wy = fbm(x * S + 9.7, y * S + 4.1, 4)
          let n = fbm(x * S + 4 * wx, y * S + 4 * wy, 6)
          n = Math.max(0, n - 0.46) / 0.54
          n = Math.pow(n, 1.9)
          const m = fbm(x * S * 0.5 + 20, y * S * 0.5 + 20, 3)
          const i = (y * width + x) * 4
          d[i] = emit[0] * m + refl[0] * (1 - m)
          d[i + 1] = emit[1] * m + refl[1] * (1 - m)
          d[i + 2] = emit[2] * m + refl[2] * (1 - m)
          d[i + 3] = Math.min(1, n) * 70 // keep faint
        }
      }
      nctx.putImageData(img, 0, 0)
      // soften and composite additively so it glows rather than covers
      g.save()
      g.globalCompositeOperation = 'lighter'
      g.filter = 'blur(2px)'
      g.drawImage(nb, 0, 0)
      g.filter = 'none'
      g.restore()

      // --- luminous band + bright core, rotated ---
      g.save(); g.translate(width / 2, height / 2); g.rotate(angle)
      g.globalCompositeOperation = 'lighter'
      const bandGrad = g.createLinearGradient(0, -bandHalf, 0, bandHalf)
      bandGrad.addColorStop(0, 'rgba(90,64,148,0)')
      bandGrad.addColorStop(0.46, 'rgba(120,88,180,0.06)')
      bandGrad.addColorStop(0.5, 'rgba(205,175,235,0.14)')
      bandGrad.addColorStop(0.54, 'rgba(120,88,180,0.06)')
      bandGrad.addColorStop(1, 'rgba(90,64,148,0)')
      g.fillStyle = bandGrad; g.fillRect(-bandLen, -bandHalf, bandLen * 2, bandHalf * 2)
      // core bulge
      const core = g.createRadialGradient(-bandLen * 0.04, 0, 0, -bandLen * 0.04, 0, bandLen * 0.22)
      core.addColorStop(0, 'rgba(240,232,247,0.16)'); core.addColorStop(1, 'rgba(0,0,0,0)')
      g.fillStyle = core; g.fillRect(-bandLen, -bandHalf, bandLen * 2, bandHalf * 2)
      g.restore()

      // --- faint/medium stars, power-law brightness, density weighted to band ---
      const count = Math.floor((width * height) / 700)
      for (let i = 0; i < count; i++) {
        // choose position: 65% clustered in the band, 35% scattered
        let x, y
        if (rnd() < 0.65) {
          const along = (rnd() - 0.5) * bandLen * 1.5
          const spread = (rnd() - 0.5 + rnd() - 0.5) * bandHalf * 0.85 // gaussian-ish
          x = width / 2 + along * Math.cos(angle) - spread * Math.sin(angle)
          y = height / 2 + along * Math.sin(angle) + spread * Math.cos(angle)
        } else { x = rnd() * width; y = rnd() * height }
        if (x < 0 || x > width || y < 0 || y > height) continue
        const b = Math.pow(rnd(), 6) // power-law: mostly faint
        const rgb = tempToRGB(starTemp(rnd()))
        if (b > 0.92) continue // brightest are drawn as animated twinklers instead
        const radius = b > 0.6 ? 1.0 : 1.0
        const alpha = b > 0.6 ? 0.7 + b * 0.3 : 0.15 + b * 0.5
        g.globalAlpha = alpha
        g.fillStyle = `rgb(${rgb[0] | 0},${rgb[1] | 0},${rgb[2] | 0})`
        g.beginPath(); g.arc(x, y, radius, 0, Math.PI * 2); g.fill()
      }
      g.globalAlpha = 1

      // --- mottled dark dust lanes: fractal noise multiplied over the band ---
      const dfbm = createFbm(777)
      const dust = document.createElement('canvas'); dust.width = width; dust.height = height
      const dctx = dust.getContext('2d'); const dimg = dctx.createImageData(width, height); const dd = dimg.data
      const DS = 1 / 200
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          // sample in band-aligned space so lanes run along the band
          const lx = (x - width / 2) * Math.cos(angle) + (y - height / 2) * Math.sin(angle)
          const ly = -(x - width / 2) * Math.sin(angle) + (y - height / 2) * Math.cos(angle)
          let n = dfbm(lx * DS + 100, ly * DS * 0.35 + 100, 5)
          n = Math.pow(Math.max(0, n - 0.42) / 0.58, 1.5)
          // only darken near the band center line (|ly| small)
          const bandMask = Math.exp(-(ly * ly) / (2 * (bandHalf * 0.22) ** 2))
          const dark = 1 - n * 0.8 * bandMask
          const v = (dark * 255) | 0, i = (y * width + x) * 4
          dd[i] = dd[i + 1] = dd[i + 2] = v; dd[i + 3] = 255
        }
      }
      dctx.putImageData(dimg, 0, 0)
      g.globalCompositeOperation = 'multiply'; g.drawImage(dust, 0, 0)
      g.globalCompositeOperation = 'source-over'

      // --- vignette ---
      const vg = g.createRadialGradient(width / 2, height / 2, height * 0.3, width / 2, height / 2, height * 0.8)
      vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.55)')
      g.fillStyle = vg; g.fillRect(0, 0, width, height)

      // --- grain overlay (kills banding) ---
      const grain = nctx.createImageData(width, height); const gd = grain.data
      for (let i = 0; i < gd.length; i += 4) { gd[i] = gd[i + 1] = gd[i + 2] = 255; gd[i + 3] = (rnd() * 10) | 0 }
      const gc = document.createElement('canvas'); gc.width = width; gc.height = height
      gc.getContext('2d').putImageData(grain, 0, 0)
      g.globalAlpha = 0.5; g.drawImage(gc, 0, 0); g.globalAlpha = 1

      // --- seed the bright animated twinklers (few dozen) ---
      seed = 424242
      const nT = Math.floor((width * height) / 26000)
      twinklers = Array.from({ length: nT }, () => {
        const rgb = tempToRGB(starTemp(rnd()))
        return {
          x: rnd() * width, y: rnd() * height,
          radius: 0.8 + rnd() * 1.6,
          rgb, spike: rnd() > 0.7,
          tw: rnd() * Math.PI * 2, tws: 0.008 + rnd() * 0.02,
          vx: (rnd() - 0.5) * 0.02, vy: 0.006 + rnd() * 0.03,
        }
      })
    }

    const drawSpike = (len, alpha, rgb) => {
      const g2 = ctx
      const grad = g2.createLinearGradient(-len, 0, len, 0)
      grad.addColorStop(0, 'rgba(255,255,255,0)')
      grad.addColorStop(0.5, `rgba(${rgb[0] | 0},${rgb[1] | 0},${rgb[2] | 0},${0.4 * alpha})`)
      grad.addColorStop(1, 'rgba(255,255,255,0)')
      g2.fillStyle = grad; g2.fillRect(-len, -0.6, len * 2, 1.2)
    }

    const draw = () => {
      ctx.clearRect(0, 0, width, height)
      if (sky) ctx.drawImage(sky, 0, 0, width, height)
      // animated bright stars with additive glow
      ctx.globalCompositeOperation = 'lighter'
      for (const s of twinklers) {
        const tw = 0.55 + 0.45 * Math.sin(s.tw)
        const h = s.radius * 9
        ctx.globalAlpha = tw
        ctx.drawImage(glowSprite, s.x - h / 2, s.y - h / 2, h, h)
        if (s.spike) {
          ctx.save(); ctx.translate(s.x, s.y)
          drawSpike(s.radius * 11, tw, s.rgb)
          ctx.rotate(Math.PI / 2); drawSpike(s.radius * 11, tw, s.rgb)
          ctx.restore()
        }
        ctx.globalAlpha = 1
        ctx.fillStyle = '#fff'
        ctx.beginPath(); ctx.arc(s.x, s.y, s.radius * 0.6, 0, Math.PI * 2); ctx.fill()
        s.x += s.vx; s.y += s.vy; s.tw += s.tws
        if (s.y > height) s.y = 0
        if (s.x > width) s.x = 0
        if (s.x < 0) s.x = width
      }
      ctx.globalCompositeOperation = 'source-over'
      ctx.globalAlpha = 1
      raf = requestAnimationFrame(draw)
    }

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = canvas.clientWidth
      height = canvas.clientHeight
      canvas.width = width * dpr
      canvas.height = height * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      buildSky()
    }

    resize()
    draw()
    if (reduceMotion) cancelAnimationFrame(raf)

    const onResize = () => { resize() }
    window.addEventListener('resize', onResize)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  return <canvas ref={canvasRef} aria-hidden="true" className="galaxy-bg" />
}
