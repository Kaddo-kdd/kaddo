// Click-to-zoom for Mermaid diagrams (astro-mermaid renders SVG client-side).
// Clicking a rendered diagram opens it in a full-screen, zoomable/pannable overlay.
(function () {
  'use strict'

  var OVERLAY_ID = 'kaddo-mermaid-overlay'

  function buildOverlay() {
    var overlay = document.getElementById(OVERLAY_ID)
    if (overlay) return overlay

    overlay = document.createElement('div')
    overlay.id = OVERLAY_ID
    overlay.className = 'kaddo-mermaid-overlay'
    overlay.setAttribute('role', 'dialog')
    overlay.setAttribute('aria-modal', 'true')
    overlay.setAttribute('aria-label', 'Zoomed diagram')

    var stage = document.createElement('div')
    stage.className = 'kaddo-mermaid-stage'
    overlay.appendChild(stage)

    var hint = document.createElement('div')
    hint.className = 'kaddo-mermaid-hint'
    hint.textContent = 'Scroll / pinch to zoom · drag to pan · Esc to close'
    overlay.appendChild(hint)

    var close = document.createElement('button')
    close.type = 'button'
    close.className = 'kaddo-mermaid-close'
    close.setAttribute('aria-label', 'Close')
    close.textContent = '×'
    overlay.appendChild(close)

    document.body.appendChild(overlay)

    close.addEventListener('click', function () {
      hide(overlay)
    })
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) hide(overlay)
    })
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && overlay.classList.contains('is-open')) hide(overlay)
    })

    return overlay
  }

  var state = { scale: 1, x: 0, y: 0, dragging: false, sx: 0, sy: 0 }

  function applyTransform(svg) {
    svg.style.transform =
      'translate(' + state.x + 'px,' + state.y + 'px) scale(' + state.scale + ')'
  }

  function hide(overlay) {
    overlay.classList.remove('is-open')
    document.body.style.overflow = ''
    var stage = overlay.querySelector('.kaddo-mermaid-stage')
    if (stage) stage.innerHTML = ''
  }

  function open(sourceSvg) {
    var overlay = buildOverlay()
    var stage = overlay.querySelector('.kaddo-mermaid-stage')
    stage.innerHTML = ''

    var clone = sourceSvg.cloneNode(true)
    clone.removeAttribute('style')
    clone.style.maxWidth = 'none'
    clone.style.maxHeight = 'none'
    clone.style.transformOrigin = 'center center'
    clone.style.cursor = 'grab'
    stage.appendChild(clone)

    state = { scale: 1, x: 0, y: 0, dragging: false, sx: 0, sy: 0 }
    applyTransform(clone)

    stage.addEventListener(
      'wheel',
      function (e) {
        e.preventDefault()
        var delta = e.deltaY < 0 ? 1.15 : 1 / 1.15
        state.scale = Math.min(Math.max(state.scale * delta, 0.4), 12)
        applyTransform(clone)
      },
      { passive: false }
    )

    clone.addEventListener('mousedown', function (e) {
      e.preventDefault()
      state.dragging = true
      state.sx = e.clientX - state.x
      state.sy = e.clientY - state.y
      clone.style.cursor = 'grabbing'
    })
    window.addEventListener('mousemove', function (e) {
      if (!state.dragging) return
      state.x = e.clientX - state.sx
      state.y = e.clientY - state.sy
      applyTransform(clone)
    })
    window.addEventListener('mouseup', function () {
      state.dragging = false
      clone.style.cursor = 'grab'
    })

    overlay.classList.add('is-open')
    document.body.style.overflow = 'hidden'
  }

  function markZoomable(svg) {
    if (svg.dataset.kaddoZoom) return
    svg.dataset.kaddoZoom = '1'
    svg.style.cursor = 'zoom-in'
    svg.addEventListener('click', function () {
      open(svg)
    })
  }

  function scan() {
    var diagrams = document.querySelectorAll('.mermaid svg, pre.mermaid svg')
    for (var i = 0; i < diagrams.length; i++) markZoomable(diagrams[i])
  }

  // astro-mermaid renders asynchronously; observe DOM and also retry a few times.
  function init() {
    scan()
    var observer = new MutationObserver(function () {
      scan()
    })
    observer.observe(document.body, { childList: true, subtree: true })
    var tries = 0
    var t = setInterval(function () {
      scan()
      if (++tries > 10) clearInterval(t)
    }, 400)
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
  } else {
    init()
  }
  // Astro view transitions
  document.addEventListener('astro:page-load', scan)
})()
