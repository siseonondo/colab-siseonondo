(function () {
  // ---------- 코드 복사 ----------
  document.querySelectorAll('.copy-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var target = document.getElementById(btn.dataset.copyTarget)
      if (!target) return
      var text = target.textContent
      var done = function (ok) {
        var original = btn.textContent
        btn.textContent = ok ? '복사됨' : '복사 실패'
        setTimeout(function () {
          btn.textContent = original
        }, 1600)
      }
      var fallback = function () {
        var area = document.createElement('textarea')
        area.value = text
        area.setAttribute('readonly', '')
        area.style.position = 'fixed'
        area.style.opacity = '0'
        document.body.appendChild(area)
        area.select()
        var ok = false
        try {
          ok = document.execCommand('copy')
        } catch (e) {
          ok = false
        }
        document.body.removeChild(area)
        done(ok)
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () {
          done(true)
        }, fallback)
      } else {
        fallback()
      }
    })
  })

  // ---------- 한 화면 한 페이지 ----------
  var pages = Array.prototype.slice.call(document.querySelectorAll('main .page'))
  if (!pages.length) return

  var stage = document.getElementById('main')
  var countEl = document.getElementById('pageCount')
  var barEl = document.getElementById('progressBar')
  var prevBtn = document.getElementById('prevBtn')
  var nextBtn = document.getElementById('nextBtn')
  var toc = document.getElementById('toc')
  var tocBtn = document.getElementById('tocBtn')
  var tocClose = document.getElementById('tocClose')
  var tocList = document.getElementById('tocList')
  var MIN_ZOOM = 0.72
  var MIN_ZOOM_PHONE = 0.82
  var MAX_ZOOM = 1.6
  var BASE_W = 1080
  var MIN_LOGICAL_W = 780
  var ALIASES = { practice: 'practice-1', top: 'intro' }
  var current = 0

  // 목차 만들기
  var tocLinks = pages.map(function (page, i) {
    var li = document.createElement('li')
    var a = document.createElement('a')
    a.href = '#' + page.id
    a.innerHTML = '<span class="toc-num">' + (i + 1) + '</span><span></span>'
    a.lastChild.textContent = page.dataset.title || page.id
    a.addEventListener('click', function (e) {
      e.preventDefault()
      closeToc()
      show(i, true)
    })
    li.appendChild(a)
    tocList.appendChild(li)
    return a
  })

  // 화면 크기에 맞춰 내용을 키우거나 줄여서 한 화면을 알맞게 채웁니다.
  function fit(page) {
    var inner = page.querySelector('.page-inner')
    if (!inner) return
    var W = stage.clientWidth
    var H = stage.clientHeight
    var wide = W > 760
    var maxZoom = wide ? Math.min(MAX_ZOOM, W / MIN_LOGICAL_W) : 1
    var minZ = wide ? MIN_ZOOM : MIN_ZOOM_PHONE
    var chosen = minZ
    for (var z = maxZoom; z >= minZ - 0.001; z -= 0.04) {
      inner.style.zoom = String(z)
      inner.style.maxWidth = Math.min(BASE_W, W / z) + 'px'
      if (inner.getBoundingClientRect().height <= H - 2) {
        chosen = z
        break
      }
    }
    inner.style.zoom = String(chosen)
    inner.style.maxWidth = Math.min(BASE_W, W / chosen) + 'px'
  }

  function show(i, updateHash) {
    i = Math.max(0, Math.min(pages.length - 1, i))
    pages.forEach(function (p, k) {
      p.classList.toggle('is-active', k === i)
    })
    current = i
    var page = pages[i]
    page.scrollTop = 0
    fit(page)
    countEl.textContent = i + 1 + ' / ' + pages.length
    barEl.style.width = ((i + 1) / pages.length) * 100 + '%'
    prevBtn.disabled = i === 0
    nextBtn.disabled = i === pages.length - 1
    tocLinks.forEach(function (a, k) {
      if (k === i) a.setAttribute('aria-current', 'true')
      else a.removeAttribute('aria-current')
    })
    if (updateHash && history.replaceState) {
      history.replaceState(null, '', i === 0 ? location.pathname + location.search : '#' + page.id)
    }
  }

  function fromHash() {
    var id = decodeURIComponent(location.hash.replace(/^#/, ''))
    id = ALIASES[id] || id
    for (var i = 0; i < pages.length; i++) {
      if (pages[i].id === id) return i
    }
    return 0
  }

  function next() {
    show(current + 1, true)
  }
  function prev() {
    show(current - 1, true)
  }

  prevBtn.addEventListener('click', prev)
  nextBtn.addEventListener('click', next)

  function openToc() {
    toc.hidden = false
    tocClose.focus()
  }
  function closeToc() {
    toc.hidden = true
    tocBtn.focus()
  }
  tocBtn.addEventListener('click', openToc)
  tocClose.addEventListener('click', closeToc)
  toc.addEventListener('click', function (e) {
    if (e.target === toc) closeToc()
  })

  document.addEventListener('keydown', function (e) {
    if (e.altKey || e.ctrlKey || e.metaKey) return
    if (!toc.hidden) {
      if (e.key === 'Escape') closeToc()
      return
    }
    var tag = (e.target && e.target.tagName) || ''
    if (tag === 'INPUT' || tag === 'TEXTAREA') return
    if (e.key === 'ArrowRight' || e.key === 'PageDown') {
      e.preventDefault()
      next()
    } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
      e.preventDefault()
      prev()
    } else if (e.key === 'Home') {
      e.preventDefault()
      show(0, true)
    } else if (e.key === 'End') {
      e.preventDefault()
      show(pages.length - 1, true)
    }
  })

  // 터치 스와이프
  var sx = 0
  var sy = 0
  stage.addEventListener(
    'touchstart',
    function (e) {
      sx = e.changedTouches[0].clientX
      sy = e.changedTouches[0].clientY
    },
    { passive: true }
  )
  stage.addEventListener(
    'touchend',
    function (e) {
      var dx = e.changedTouches[0].clientX - sx
      var dy = e.changedTouches[0].clientY - sy
      if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.8) {
        if (dx < 0) next()
        else prev()
      }
    },
    { passive: true }
  )

  window.addEventListener('hashchange', function () {
    show(fromHash(), false)
  })
  window.addEventListener('resize', function () {
    fit(pages[current])
  })
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () {
      fit(pages[current])
    })
  }

  show(fromHash(), false)
})()
