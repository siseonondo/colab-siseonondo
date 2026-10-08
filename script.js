(function () {
  // 코드 복사
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
        navigator.clipboard.writeText(text).then(
          function () {
            done(true)
          },
          fallback
        )
      } else {
        fallback()
      }
    })
  })

  // 현재 위치 목차 표시
  var links = Array.prototype.slice.call(document.querySelectorAll('.toc a, .toc-mobile a'))
  var sections = Array.prototype.slice
    .call(document.querySelectorAll('main section.block'))
    .filter(function (s) {
      return s.id
    })
  if (!('IntersectionObserver' in window) || !sections.length) return

  var activeId = null
  function setActive(id) {
    if (id === activeId) return
    activeId = id
    links.forEach(function (a) {
      if (a.getAttribute('href') === '#' + id) a.setAttribute('aria-current', 'true')
      else a.removeAttribute('aria-current')
    })
    var mobileActive = document.querySelector('.toc-mobile a[aria-current="true"]')
    if (mobileActive && mobileActive.scrollIntoView) {
      mobileActive.scrollIntoView({ block: 'nearest', inline: 'center' })
    }
  }

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) setActive(entry.target.id)
      })
    },
    { rootMargin: '-20% 0px -70% 0px' }
  )
  sections.forEach(function (s) {
    observer.observe(s)
  })
})()
