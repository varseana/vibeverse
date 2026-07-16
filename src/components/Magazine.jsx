import { useRef, useState, forwardRef, useEffect } from 'react'
import HTMLFlipBook from 'react-pageflip'
import { Document, Page as PdfPage, pdfjs } from 'react-pdf'
import Icon from './Icon.jsx'

// pdf.js worker from the installed version (no CDN mismatch).
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString()

// A single magazine page. Must forward a ref (react-pageflip requirement).
const Leaf = forwardRef(function Leaf({ kind, src, index, width, alt }, ref) {
  return (
    <div ref={ref} className="mag-page">
      {kind === 'pdf' ? (
        <PdfPage pageNumber={index + 1} width={width} renderTextLayer={false} renderAnnotationLayer={false}
          loading={<div className="mag-skel" />} />
      ) : (
        <img src={src} alt={alt} decoding="async" />
      )}
    </div>
  )
})

export default function Magazine({ edition }) {
  const book = useRef(null)
  const [current, setCurrent] = useState(0)
  const [pdfPageCount, setPdfPageCount] = useState(0)
  // Only the cover renders until the reader opens the magazine; the rest of the
  // pages mount (and load) after "Abrir revista". This makes the cover appear
  // instantly and defers the heavy work to the moment the user opens it.
  const [opened, setOpened] = useState(false)
  const reduceMotion = typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

  // Reset to the cover / closed state whenever the edition changes.
  useEffect(() => { setCurrent(0); setPdfPageCount(0); setOpened(false) }, [edition?.id])

  if (!edition) {
    return <div className="empty">Aun no hay ediciones. El equipo VIBE las subira pronto.</div>
  }

  const isPdf = edition.kind === 'pdf'
  const imgPages = edition.pages || []
  const pageCount = isPdf ? pdfPageCount : imgPages.length
  const coverSrc = !isPdf ? imgPages[0] : null
  const FLIP_W = 420

  const flip = (dir) => {
    const api = book.current?.pageFlip?.()
    if (!api) return
    dir < 0 ? api.flipPrev() : api.flipNext()
  }

  // Closed state: show only the cover with an animated loader + open button.
  const closedView = (
    <div className="mag-cover">
      <div className="mag-cover-inner">
        {isPdf
          ? <PdfPage pageNumber={1} width={FLIP_W} renderTextLayer={false} renderAnnotationLayer={false} loading={<CoverLoader />} />
          : coverSrc ? <img src={coverSrc} alt="Portada" decoding="async" /> : <CoverLoader />}
        <button className="mag-open" onClick={() => setOpened(true)}>
          <Icon name="idea" size={16} /> Abrir revista
        </button>
      </div>
    </div>
  )

  // Build every page (only once opened) so flipping is instant afterward.
  const leaves = Array.from({ length: pageCount }, (_, i) => (
    <Leaf key={i} kind={edition.kind} src={imgPages[i]} index={i} width={FLIP_W} alt={`Pagina ${i + 1}`} />
  ))

  const flipbook = pageCount > 0 && (
    <HTMLFlipBook
      width={FLIP_W} height={594}
      size="stretch" minWidth={280} maxWidth={520} minHeight={396} maxHeight={735}
      maxShadowOpacity={0.4} showCover={true} mobileScrollSupport={true}
      ref={book} className="mag-book" onFlip={(e) => setCurrent(e.data)}
    >
      {leaves}
    </HTMLFlipBook>
  )

  // Reduced-motion: simple vertical read.
  const staticView = (
    <div className="mag-static">
      {isPdf
        ? Array.from({ length: pageCount }, (_, i) => (
            <PdfPage key={i} pageNumber={i + 1} width={460} renderTextLayer={false} renderAnnotationLayer={false} />
          ))
        : imgPages.map((src, i) => <img key={i} src={src} alt={`Pagina ${i + 1}`} loading="lazy" />)}
    </div>
  )

  const openView = (
    <div className="mag-wrap">
      {!reduceMotion && pageCount > 1 && (
        <button className="mag-arrow left" onClick={() => flip(-1)} aria-label="Pagina anterior"><Icon name="prev" size={22} /></button>
      )}
      {reduceMotion ? staticView : flipbook}
      {!reduceMotion && pageCount > 1 && (
        <button className="mag-arrow right" onClick={() => flip(1)} aria-label="Pagina siguiente"><Icon name="next" size={22} /></button>
      )}
      {!reduceMotion && pageCount > 0 && (
        <div className="mag-counter">{current + 1} / {pageCount}</div>
      )}
    </div>
  )

  const body = opened ? openView : closedView

  // PDF: wrap in a Document. While closed we only mount page 1 (the cover);
  // opening mounts all pages, so the rest loads exactly when the user opens it.
  if (isPdf) {
    return (
      <Document file={edition.pdf} onLoadSuccess={({ numPages }) => setPdfPageCount(numPages)}
        loading={<CoverLoader />}
        error={<div className="empty">No se pudo cargar el PDF.</div>}>
        {body}
      </Document>
    )
  }
  return body
}

// Animated cosmic loader shown while the cover (or PDF) is loading.
function CoverLoader() {
  return (
    <div className="mag-loader" role="status" aria-label="Cargando">
      <div className="mag-loader-ring" />
      <span>Cargando...</span>
    </div>
  )
}
