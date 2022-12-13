/* eslint-env mocha */
/* global assert */
import { el, attr, bind, Observer, Reactor } from '../dist/index.js'

const ob = (x) => new Observer(x)

describe('Element creation', () => {
  it('can create a basic div', () => {
    const result = el('foo')
    assert.equal(result.outerHTML, '<div class="foo"></div>')
  })

  it('can create a valid HTML tag', () => {
    const result = el('h1')
    assert(result.outerHTML === '<h1 class="h1"></h1>')
  })

  it('can wrap an existing element', () => {
    const base = document.createElement('div')
    const result = el(base)
    assert(result === base)
    assert(result.outerHTML === '<div></div>')
  })

  it('can grab an existing element by query', () => {
    const base = document.createElement('div')
    base.className = 'foo'
    assert.equal(base.outerHTML, '<div class="foo"></div>')
    document.body.appendChild(base)
    const result = el('.foo')
    assert(result === base)
  })

  it('can fill an element with text', () => {
    const result = el('foo', 'bar')
    assert.equal(result.outerHTML, '<div class="foo">bar</div>')
  })

  it('can fill an element with another element', () => {
    const innerElement = el('foo')
    const result = el('bar', innerElement)
    assert(result.outerHTML === '<div class="bar"><div class="foo"></div></div>')
  })

  it('can fill an element with a DocumentFragment', () => {
    const fragment = document.createDocumentFragment()
    fragment.appendChild(el('foo'))
    fragment.appendChild(el('bar'))
    const result = el('div', fragment)
    assert(result.outerHTML === '<div class="div"><div class="foo"></div><div class="bar"></div></div>')
  })

  it('can fill an element with a function', () => {
    const result = el('foo', $ => {
      $.innerHTML = 'bar'
    })
    assert(result.outerHTML === '<div class="foo">bar</div>')
  })

  it('can fill an element with a function using this', () => {
    const result = el('foo', function () {
      this.innerHTML = 'bar'
    })
    assert(result.outerHTML === '<div class="foo">bar</div>')
  })

  it('can fill an element with a function return', () => {
    const result = el('foo', () => 'bar')
    assert(result.outerHTML === '<div class="foo">bar</div>')
  })

  it('can fill an element with a Promise', (done) => {
    const result = el('foo', new Promise(resolve => {
      setTimeout(() => {
        resolve('bar')
      }, 10)
    }))
    assert(result.outerHTML === '<div class="foo"><!--promisePlaceholder--></div>')
    setTimeout(() => {
      assert(result.outerHTML === '<div class="foo">bar</div>')
      done()
    }, 20)
  })

  it('can fill an element with arrays', () => {
    const result = el('foo', [
      'bar',
      'baz',
      'qux'
    ])
    assert(result.outerHTML === '<div class="foo">barbazqux</div>')
  })

  it('can fill an element with nested arrays', () => {
    const result = el('foo', [
      'bar', [
        'baz', [
          'qux'
        ]
      ]
    ])
    assert(result.outerHTML === '<div class="foo">barbazqux</div>')
  })

  it('can fill an element with multiple arguments', () => {
    const result = el('foo',
      'bar',
      'baz',
      'qux'
    )
    assert(result.outerHTML === '<div class="foo">barbazqux</div>')
  })

  it('can do all of the above', () => {
    const base = document.createElement('div')
    const result = el('foo', [
      el('h1'), [
        el(base),
        'bar'
      ],
      $ => { $.setAttribute('name', 'baz') },
      function () { this.id = 'qux' },
      $ => 'corge'
    ])
    assert(result.outerHTML === '<div class="foo" name="baz" id="qux"><h1 class="h1"></h1><div></div>barcorge</div>')
  })

  it('can nest el elegantly', () => {
    const result = el('foo',
      el('bar',
        el('baz', $ => {
          el($, 'qux')
        })
      )
    )
    assert(result.outerHTML === '<div class="foo"><div class="bar"><div class="baz">qux</div></div></div>')
  })
})

describe('Reactivity', () => {
  it('can take an observer', (done) => {
    const result = el('foo', ob(() => {}))
    assert.equal(result.outerHTML, '<div class="foo"><!--observerStart--><!--observerEnd--></div>')
    document.body.appendChild(result)
    setTimeout(() => {
      assert.equal(result.outerHTML, '<div class="foo"><!--observerStart--><!--observerEnd--></div>')
      result.remove()
      done()
    }, 10)
  })

  it('can take an observer modifying a property', (done) => {
    const result = el('foo', ob(($) => {
      $.setAttribute('name', 'bar')
    }))
    assert.equal(
      result.outerHTML,
      '<div class="foo" name="bar"><!--observerStart--><!--observerEnd--></div>'
    )
    document.body.appendChild(result)
    setTimeout(() => {
      assert.equal(result.outerHTML, '<div class="foo" name="bar"><!--observerStart--><!--observerEnd--></div>')
      result.remove()
      done()
    }, 10)
  })

  it('can take an observer returning a string', (done) => {
    const result = el('foo', ob(() => 'bar'))
    assert.equal(result.outerHTML, '<div class="foo"><!--observerStart-->bar<!--observerEnd--></div>')
    document.body.appendChild(result)
    setTimeout(() => {
      assert.equal(result.outerHTML, '<div class="foo"><!--observerStart-->bar<!--observerEnd--></div>')
      result.remove()
      done()
    }, 10)
  })

  it('can take an observer returning an element', (done) => {
    const result = el('foo', ob(() => el('bar', 'baz')))
    assert.equal(result.outerHTML, '<div class="foo"><!--observerStart--><div class="bar">baz</div><!--observerEnd--></div>')
    document.body.appendChild(result)
    setTimeout(() => {
      assert.equal(result.outerHTML, '<div class="foo"><!--observerStart--><div class="bar">baz</div><!--observerEnd--></div>')
      result.remove()
      done()
    }, 10)
  })

  it('can take an observer returning an array', (done) => {
    const result = el('foo', ob(() => ['bar', 'baz', 'qux']))
    assert.equal(result.outerHTML, '<div class="foo"><!--observerStart-->barbazqux<!--observerEnd--></div>')
    document.body.appendChild(result)
    setTimeout(() => {
      assert.equal(result.outerHTML, '<div class="foo"><!--observerStart-->barbazqux<!--observerEnd--></div>')
      result.remove()
      done()
    }, 10)
  })

  it('can take nested observers', (done) => {
    const result = el('foo', ob(() => {
      return ob(() => {
        return 'bar'
      })
    }))
    assert.equal(result.outerHTML, '<div class="foo"><!--observerStart--><!--observerStart-->bar<!--observerEnd--><!--observerEnd--></div>')
    document.body.appendChild(result)
    setTimeout(() => {
      assert.equal(result.outerHTML, '<div class="foo"><!--observerStart--><!--observerStart-->bar<!--observerEnd--><!--observerEnd--></div>')
      result.remove()
      done()
    }, 10)
  })

  it('can take a complex nested set of observers', (done) => {
    const result = el('foo', ob(() => {
      return [
        ob(() => {
          return [
            ob(() => {
              return 'bar'
            }),
            ob(() => {
              return 'baz'
            })
          ]
        }),
        ob(() => {
          return ob(() => {
            return 'qux'
          })
        })
      ]
    }))
    assert.equal(result.outerHTML, '<div class="foo"><!--observerStart--><!--observerStart--><!--observerStart-->bar<!--observerEnd--><!--observerStart-->baz<!--observerEnd--><!--observerEnd--><!--observerStart--><!--observerStart-->qux<!--observerEnd--><!--observerEnd--><!--observerEnd--></div>')
    document.body.appendChild(result)
    setTimeout(() => {
      assert.equal(result.outerHTML, '<div class="foo"><!--observerStart--><!--observerStart--><!--observerStart-->bar<!--observerEnd--><!--observerStart-->baz<!--observerEnd--><!--observerEnd--><!--observerStart--><!--observerStart-->qux<!--observerEnd--><!--observerEnd--><!--observerEnd--></div>')
      result.remove()
      done()
    }, 10)
  })

  it('updates an observer property', (done) => {
    const rx = new Reactor()
    rx.bar = 'baz'
    const result = el('foo', ob(($) => {
      $.setAttribute('name', rx.bar)
    }))
    assert.equal(
      result.outerHTML,
      '<div class="foo" name="baz"><!--observerStart--><!--observerEnd--></div>'
    )
    rx.bar = 'qux'
    assert.equal(
      result.outerHTML,
      '<div class="foo" name="baz"><!--observerStart--><!--observerEnd--></div>'
    )
    document.body.appendChild(result)
    setTimeout(() => {
      assert.equal(
        result.outerHTML,
        '<div class="foo" name="qux"><!--observerStart--><!--observerEnd--></div>'
      )
      rx.bar = 'corge'
      assert.equal(
        result.outerHTML,
        '<div class="foo" name="corge"><!--observerStart--><!--observerEnd--></div>'
      )
      result.remove()
      done()
    }, 10)
  })

  it('updates an observer string', (done) => {
    const rx = new Reactor()
    rx.bar = 'baz'
    const result = el('foo', ob(() => rx.bar))
    assert.equal(result.outerHTML, '<div class="foo"><!--observerStart-->baz<!--observerEnd--></div>')
    rx.bar = 'qux'
    assert.equal(result.outerHTML, '<div class="foo"><!--observerStart-->baz<!--observerEnd--></div>')
    document.body.appendChild(result)
    setTimeout(() => {
      assert.equal(result.outerHTML, '<div class="foo"><!--observerStart-->qux<!--observerEnd--></div>')
      rx.bar = 'corge'
      assert.equal(result.outerHTML, '<div class="foo"><!--observerStart-->corge<!--observerEnd--></div>')
      result.remove()
      done()
    }, 10)
  })

  it('updates an observer element', (done) => {
    const rx = new Reactor()
    rx.foo = 'foo'
    rx.bar = 'bar'
    const result = el('div', ob(() => el(rx.foo, rx.bar)))
    assert.equal(result.outerHTML, '<div class="div"><!--observerStart--><div class="foo">bar</div><!--observerEnd--></div>')
    rx.foo = 'baz'
    rx.bar = 'qux'
    assert.equal(result.outerHTML, '<div class="div"><!--observerStart--><div class="foo">bar</div><!--observerEnd--></div>')
    document.body.appendChild(result)
    setTimeout(() => {
      assert.equal(result.outerHTML, '<div class="div"><!--observerStart--><div class="baz">qux</div><!--observerEnd--></div>')
      rx.foo = 'corge'
      assert.equal(result.outerHTML, '<div class="div"><!--observerStart--><div class="corge">qux</div><!--observerEnd--></div>')
      rx.bar = 'grault'
      assert.equal(result.outerHTML, '<div class="div"><!--observerStart--><div class="corge">grault</div><!--observerEnd--></div>')
      result.remove()
      done()
    }, 10)
  })
  it('test for a simple element triggering', (done) => {
    const rx = new Reactor()
    rx.title = 'foo'
    const result = el('article', ob(() => {
      return ob(() => {
        return rx.title
      })
    }))
    assert.equal(
      result.outerHTML,
      '<article class="article"><!--observerStart--><!--observerStart-->foo<!--observerEnd--><!--observerEnd--></article>'
    )
    rx.title = 'bar'
    document.body.appendChild(result)
    setTimeout(() => {
      assert.equal(
        result.outerHTML,
        '<article class="article"><!--observerStart--><!--observerStart-->bar<!--observerEnd--><!--observerEnd--></article>'
      )
      rx.title = 'baz'
      result.remove()
      done()
    }, 10)
  })

  it('updates a complex element', (done) => {
    const rx = new Reactor()
    rx.title = 'foo'
    rx.paragraphs = [
      { id: 'bar', content: 'Lorem ipsum dolor sit amet', time: '123' },
      { id: 'baz', content: 'Ut enim ad minim veniam', time: '456' },
      { id: 'qux', content: 'Duis aute irure dolor in reprehenderit', time: '789' }
    ]
    const result = el('article',
      el('h1', ob(() => rx.title)),
      ob(() => rx.paragraphs.map((paragraph) => [
        el('p', ob(($) => {
          $.setAttribute('id', paragraph.id)
          return paragraph.content
        })),
        ob(() => {
          return el('h3', ob(() => {
            return paragraph.time
          }))
        })
      ]))
    )
    assert.equal(
      result.outerHTML,
      '<article class="article"><h1 class="h1"><!--observerStart-->foo<!--observerEnd--></h1><!--observerStart--><p class="p" id="bar"><!--observerStart-->Lorem ipsum dolor sit amet<!--observerEnd--></p><!--observerStart--><h3 class="h3"><!--observerStart-->123<!--observerEnd--></h3><!--observerEnd--><p class="p" id="baz"><!--observerStart-->Ut enim ad minim veniam<!--observerEnd--></p><!--observerStart--><h3 class="h3"><!--observerStart-->456<!--observerEnd--></h3><!--observerEnd--><p class="p" id="qux"><!--observerStart-->Duis aute irure dolor in reprehenderit<!--observerEnd--></p><!--observerStart--><h3 class="h3"><!--observerStart-->789<!--observerEnd--></h3><!--observerEnd--><!--observerEnd--></article>'
    )
    document.body.appendChild(result)
    rx.title = 'corge'
    assert.equal(
      result.outerHTML,
      '<article class="article"><h1 class="h1"><!--observerStart-->foo<!--observerEnd--></h1><!--observerStart--><p class="p" id="bar"><!--observerStart-->Lorem ipsum dolor sit amet<!--observerEnd--></p><!--observerStart--><h3 class="h3"><!--observerStart-->123<!--observerEnd--></h3><!--observerEnd--><p class="p" id="baz"><!--observerStart-->Ut enim ad minim veniam<!--observerEnd--></p><!--observerStart--><h3 class="h3"><!--observerStart-->456<!--observerEnd--></h3><!--observerEnd--><p class="p" id="qux"><!--observerStart-->Duis aute irure dolor in reprehenderit<!--observerEnd--></p><!--observerStart--><h3 class="h3"><!--observerStart-->789<!--observerEnd--></h3><!--observerEnd--><!--observerEnd--></article>'
    )
    setTimeout(() => {
      assert.equal(
        result.outerHTML,
        '<article class="article"><h1 class="h1"><!--observerStart-->corge<!--observerEnd--></h1><!--observerStart--><p class="p" id="bar"><!--observerStart-->Lorem ipsum dolor sit amet<!--observerEnd--></p><!--observerStart--><h3 class="h3"><!--observerStart-->123<!--observerEnd--></h3><!--observerEnd--><p class="p" id="baz"><!--observerStart-->Ut enim ad minim veniam<!--observerEnd--></p><!--observerStart--><h3 class="h3"><!--observerStart-->456<!--observerEnd--></h3><!--observerEnd--><p class="p" id="qux"><!--observerStart-->Duis aute irure dolor in reprehenderit<!--observerEnd--></p><!--observerStart--><h3 class="h3"><!--observerStart-->789<!--observerEnd--></h3><!--observerEnd--><!--observerEnd--></article>'
      )
      rx.paragraphs[0].content = 'bloop bloop bloop'
      assert.equal(
        result.outerHTML,
        '<article class="article"><h1 class="h1"><!--observerStart-->corge<!--observerEnd--></h1><!--observerStart--><p class="p" id="bar"><!--observerStart-->bloop bloop bloop<!--observerEnd--></p><!--observerStart--><h3 class="h3"><!--observerStart-->123<!--observerEnd--></h3><!--observerEnd--><p class="p" id="baz"><!--observerStart-->Ut enim ad minim veniam<!--observerEnd--></p><!--observerStart--><h3 class="h3"><!--observerStart-->456<!--observerEnd--></h3><!--observerEnd--><p class="p" id="qux"><!--observerStart-->Duis aute irure dolor in reprehenderit<!--observerEnd--></p><!--observerStart--><h3 class="h3"><!--observerStart-->789<!--observerEnd--></h3><!--observerEnd--><!--observerEnd--></article>'
      )
      rx.paragraphs[2].time = '987'
      assert.equal(
        result.outerHTML,
        '<article class="article"><h1 class="h1"><!--observerStart-->corge<!--observerEnd--></h1><!--observerStart--><p class="p" id="bar"><!--observerStart-->bloop bloop bloop<!--observerEnd--></p><!--observerStart--><h3 class="h3"><!--observerStart-->123<!--observerEnd--></h3><!--observerEnd--><p class="p" id="baz"><!--observerStart-->Ut enim ad minim veniam<!--observerEnd--></p><!--observerStart--><h3 class="h3"><!--observerStart-->456<!--observerEnd--></h3><!--observerEnd--><p class="p" id="qux"><!--observerStart-->Duis aute irure dolor in reprehenderit<!--observerEnd--></p><!--observerStart--><h3 class="h3"><!--observerStart-->987<!--observerEnd--></h3><!--observerEnd--><!--observerEnd--></article>'
      )
      result.remove()
      done()
    }, 10)
  })
})

describe('Shorthands', () => {
  it('set attributes using attr', () => {
    const result = el('foo', attr('id', 'bar'))
    assert.equal(result.outerHTML, '<div class="foo" id="bar"></div>')
  })

  it('set multiple attributes using attr', () => {
    const result = el('foo',
      attr('id', 'bar'),
      attr('name', 'baz')
    )
    assert.equal(result.outerHTML, '<div class="foo" id="bar" name="baz"></div>')
  })

  it('set attributes reactively using attr', (done) => {
    const rx = new Reactor()
    rx.foo = 'bar'
    const result = el('foo', ob(() => attr('id', rx.foo)))
    assert.equal(result.outerHTML, '<div class="foo" id="bar"><!--observerStart--><!--observerEnd--></div>')
    rx.foo = 'baz'
    assert.equal(result.outerHTML, '<div class="foo" id="bar"><!--observerStart--><!--observerEnd--></div>')
    document.body.appendChild(result)
    setTimeout(() => {
      assert.equal(result.outerHTML, '<div class="foo" id="baz"><!--observerStart--><!--observerEnd--></div>')
      rx.foo = 'corge'
      assert.equal(result.outerHTML, '<div class="foo" id="corge"><!--observerStart--><!--observerEnd--></div>')
      result.remove()
      done()
    }, 10)
  })

  it.skip('does 2 way binding', () => {
    // Need to automate this with puppeteer
    const rx = new Reactor()
    rx.foo = 'bar'
    const display = el('h1', ob(() => rx.foo))
    const input = el('input',
      attr('type', 'text'),
      bind(rx, 'foo')
    )
    const input2 = el('input',
      attr('type', 'text'),
      bind(rx, 'foo')
    )
    el(document.body, display, input, input2)
  })
})

describe('Clean up', () => {
  it('disables observer when removed from DOM', (done) => {
    const rx = new Reactor()
    rx.bar = 'baz'
    const result = el('foo', ob(() => rx.bar))
    assert.equal(result.outerHTML, '<div class="foo"><!--observerStart-->baz<!--observerEnd--></div>')
    rx.bar = 'qux'
    assert.equal(result.outerHTML, '<div class="foo"><!--observerStart-->baz<!--observerEnd--></div>')
    document.body.appendChild(result)
    setTimeout(() => {
      assert.equal(result.outerHTML, '<div class="foo"><!--observerStart-->qux<!--observerEnd--></div>')
      rx.bar = 'corge'
      assert.equal(result.outerHTML, '<div class="foo"><!--observerStart-->corge<!--observerEnd--></div>')
      result.remove()
      setTimeout(() => {
        rx.bar = 'grault'
        assert.equal(result.outerHTML, '<div class="foo"><!--observerStart-->corge<!--observerEnd--></div>')
        done()
      }, 10)
    }, 10)
  })

  it('removes comment pair together', (done) => {
    const rx = new Reactor()
    rx.bar = 'baz'
    const result = el('foo', ob(() => rx.bar))
    assert.equal(result.outerHTML, '<div class="foo"><!--observerStart-->baz<!--observerEnd--></div>')
    result.childNodes[0].remove()
    setTimeout(() => {
      assert.equal(result.outerHTML, '<div class="foo">baz</div>')
      done()
    }, 10)
  })

  it('disables observer when comment placeholder is removed', (done) => {
    const rx = new Reactor()
    rx.bar = 'baz'
    const result = el('foo', ob(() => rx.bar))
    assert.equal(result.outerHTML, '<div class="foo"><!--observerStart-->baz<!--observerEnd--></div>')
    document.body.appendChild(result)
    setTimeout(() => {
      rx.bar = 'qux'
      assert.equal(result.outerHTML, '<div class="foo"><!--observerStart-->qux<!--observerEnd--></div>')
      result.childNodes[0].remove()
      setTimeout(() => {
        assert.equal(result.outerHTML, '<div class="foo">qux</div>')
        rx.bar = 'corge'
        assert.equal(result.outerHTML, '<div class="foo">qux</div>')
        result.remove()
        done()
      }, 10)
    }, 10)
  })
})
