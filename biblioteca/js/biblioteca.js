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

  function renderPreview() {
    var preview = document.querySelector('[data-shelf-preview]')
    if (!preview) return
    books.forEach(function (book) {
      var title = book.querySelector('.book__link')
      var article = book.querySelector('.book')
      if (!title) return
      var item = document.createElement('li')
      item.textContent = title.textContent.trim()
      if (article) {
        item.style.setProperty('--accent-light', article.style.getPropertyValue('--accent-light'))
        item.style.setProperty('--accent-dark', article.style.getPropertyValue('--accent-dark'))
      }
      var sections = document.createElement('span')
      sections.textContent = (book.getAttribute('data-sections') || '0') + ' secc.'
      item.appendChild(sections)
      preview.appendChild(item)
    })
  }

  function countShelf() {
    var sections = 0
    var perKind = { todos: books.length }
    books.forEach(function (book) {
      var kind = book.getAttribute('data-kind')
      perKind[kind] = (perKind[kind] || 0) + 1
      sections += Number(book.getAttribute('data-sections')) || 0
    })
    setText('[data-stat="books"]', books.length)
    setText('[data-stat-label="books"]', books.length === 1 ? 'proyecto documentado' : 'proyectos documentados')
    setText('[data-stat="sections"]', sections)
    setText('[data-stat-label="sections"]', sections === 1 ? 'sección' : 'secciones')
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
    return normalize(book.textContent + ' ' + (book.getAttribute('data-keywords') || '')).indexOf(query) !== -1
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

  renderPreview()
  if (countShelf()) render()
})()
