;(function () {
  'use strict'

  var shelf = document.querySelector('[data-shelf]')
  if (!shelf) return
  var books = Array.prototype.slice.call(shelf.querySelectorAll('[data-book]'))
  var search = document.querySelector('[data-search]')
  var filters = Array.prototype.slice.call(document.querySelectorAll('[data-filter]'))
  var results = document.querySelector('[data-results]')
  var empty = document.querySelector('[data-empty]')
  var emptyQuery = document.querySelector('[data-empty-query]')
  var activeFilter = 'todos'

  function setText(selector, value) {
    Array.prototype.forEach.call(document.querySelectorAll(selector), function (element) {
      element.textContent = String(value)
    })
  }

  var reduceMotion =
    typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches

  function plural(count, one, many) {
    return count === 1 ? one : many
  }

  function techsOf(list) {
    var seen = []
    list.forEach(function (book) {
      ;(book.getAttribute('data-techs') || '').split(',').forEach(function (name) {
        name = name.trim()
        if (name && seen.indexOf(name) === -1) seen.push(name)
      })
    })
    return seen
  }

  function countUp(element, target) {
    if (reduceMotion || target === 0) {
      element.textContent = String(target)
      return
    }
    var startedAt = null
    function frame(now) {
      if (startedAt === null) startedAt = now
      var progress = Math.min((now - startedAt) / 1400, 1)
      element.textContent = String(Math.round(target * (1 - Math.pow(1 - progress, 3))))
      if (progress < 1) requestAnimationFrame(frame)
    }
    requestAnimationFrame(frame)
  }

  function renderScores(stats) {
    var scores = document.querySelector('[data-scores]')
    Object.keys(stats).forEach(function (key) {
      setText('[data-stat-label="' + key + '"]', plural(stats[key][0], stats[key][1], stats[key][2]))
    })
    function start() {
      Object.keys(stats).forEach(function (key) {
        Array.prototype.forEach.call(document.querySelectorAll('[data-stat="' + key + '"]'), function (el) {
          countUp(el, stats[key][0])
        })
      })
    }
    if (!scores || !('IntersectionObserver' in window)) return start()
    var observer = new IntersectionObserver(function (entries) {
      if (!entries[0].isIntersecting) return
      observer.disconnect()
      start()
    }, { threshold: 0.4 })
    observer.observe(scores)
  }

  function renderMarquee(techs) {
    var track = document.querySelector('[data-marquee]')
    if (!track || techs.length === 0) return
    // La velocidad se mantiene constante aunque crezca la lista
    track.style.animationDuration = Math.max(40, techs.length * 2.8) + 's'
    // Dos copias seguidas: la animación se desplaza media pista y empalma sin salto
    techs.concat(techs).forEach(function (name) {
      var chip = document.createElement('span')
      chip.textContent = name
      track.appendChild(chip)
    })
  }

  var MOSAIC_MIN = 15

  function shuffle(list) {
    for (var i = list.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1))
      var tmp = list[i]
      list[i] = list[j]
      list[j] = tmp
    }
    return list
  }

  function mosaicOrder() {
    // Una cola barajada por proyecto; se intercalan en orden aleatorio para que no se junten capturas del mismo proyecto
    var queues = books
      .map(function (book) {
        return shuffle(
          (book.getAttribute('data-mosaic') || '').split(',').map(function (name) {
            return name.trim()
          }).filter(Boolean),
        )
      })
      .filter(function (queue) {
        return queue.length > 0
      })
    var order = []
    while (queues.some(function (queue) { return queue.length > 0 })) {
      shuffle(queues).forEach(function (queue) {
        if (queue.length) order.push(queue.shift())
      })
    }
    return order
  }

  function renderMosaic() {
    var grid = document.querySelector('[data-mosaic]')
    if (!grid) return
    var order = mosaicOrder()
    if (!order.length) return
    // Media rejilla con al menos MOSAIC_MIN imágenes y la otra media idéntica: el desplazamiento empalma sin salto
    var half = []
    while (half.length < MOSAIC_MIN) half = half.concat(order)
    half.concat(half).forEach(function (name) {
      var img = document.createElement('img')
      img.src = 'assets/mosaic/' + name + '.webp'
      img.alt = ''
      img.width = 640
      img.height = 400
      img.decoding = 'async'
      grid.appendChild(img)
    })
  }

  function countShelf() {
    var sections = 0
    var captures = 0
    var perKind = { todos: books.length }
    books.forEach(function (book) {
      var kind = book.getAttribute('data-kind')
      perKind[kind] = (perKind[kind] || 0) + 1
      var ownSections = Number(book.getAttribute('data-sections')) || 0
      var sectionsText = book.querySelector('[data-sections-text]')
      if (sectionsText) sectionsText.textContent = ownSections + ' ' + plural(ownSections, 'sección', 'secciones')
      sections += ownSections
      captures += Number(book.getAttribute('data-captures')) || 0
    })
    var techs = techsOf(books)
    renderScores({
      books: [books.length, 'proyecto', 'proyectos'],
      sections: [sections, 'sección', 'secciones'],
      captures: [captures, 'captura', 'capturas'],
      techs: [techs.length, 'tecnología', 'tecnologías'],
    })
    renderMarquee(techs)
    filters.forEach(function (button) {
      var kind = button.getAttribute('data-filter')
      var count = perKind[kind] || 0
      setText('[data-count="' + kind + '"]', count)
      button.hidden = kind !== 'todos' && count === 0
    })
    var hasBooks = books.length > 0
    var toolbar = document.querySelector('[data-toolbar]')
    var emptyShelf = document.querySelector('[data-empty-shelf]')
    if (toolbar) toolbar.hidden = !hasBooks
    if (emptyShelf) emptyShelf.hidden = hasBooks
    return hasBooks
  }

  function normalize(text) {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
  }

  function matches(book, query) {
    var inFilter = activeFilter === 'todos' || book.getAttribute('data-kind') === activeFilter
    if (!inFilter) return false
    if (!query) return true
    var haystack = book.textContent + ' ' + (book.getAttribute('data-keywords') || '') + ' ' + (book.getAttribute('data-techs') || '')
    return normalize(haystack).indexOf(query) !== -1
  }

  function describe(count) {
    if (count === 0) return 'Ningún proyecto'
    return count === 1 ? '1 proyecto' : count + ' proyectos'
  }

  function render() {
    var query = search ? normalize(search.value) : ''
    var shown = 0
    books.forEach(function (book) {
      var visible = matches(book, query)
      book.hidden = !visible
      if (visible) {
        shown += 1
        book.classList.add('is-visible')
      }
    })
    if (results) results.textContent = describe(shown)
    if (empty) empty.hidden = shown !== 0
    if (emptyQuery) emptyQuery.textContent = search && search.value.trim() ? '«' + search.value.trim() + '»' : 'ese filtro'
  }

  filters.forEach(function (button) {
    button.addEventListener('click', function () {
      activeFilter = button.getAttribute('data-filter')
      filters.forEach(function (other) {
        other.setAttribute('aria-pressed', String(other === button))
      })
      render()
    })
  })

  if (search) search.addEventListener('input', render)

  var reset = document.querySelector('[data-reset]')
  if (reset) {
    reset.addEventListener('click', function () {
      if (search) search.value = ''
      activeFilter = 'todos'
      filters.forEach(function (button) {
        button.setAttribute('aria-pressed', String(button.getAttribute('data-filter') === 'todos'))
      })
      render()
      if (search) search.focus()
    })
  }

  renderMosaic()
  if (countShelf()) render()
})()
