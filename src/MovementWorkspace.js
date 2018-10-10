import React, { Component, Fragment } from 'react'

const isWhole = number => number % 1 === 0

/*
  Matrix as defined onhttps://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/transform
  [a c e]
  |b d f|
  [0 0 1]
*/
class Matrix {
  constructor ({ a = 0, b = 0, c = 0, d = 0, e = 0, f = 0 }) {
    this.a = a
    this.b = b
    this.c = c
    this.d = d
    this.e = e
    this.f = f
  }

  // String for transform style prop
  toString = () => {
    const { a, b, c, d, e, f } = this
    return `matrix(${a}, ${b}, ${c}, ${d}, ${e}, ${f})`
  }

  // Multiplying two matrices to get a third matrix, which does both transformations
  multiply = otherMatrix => {
    if (!(otherMatrix instanceof Matrix)) {
      throw new Error('Can\'t multiply a non-Matrix object!')
    }
  
    const { a: a2, b: b2, c: c2, d: d2, e: e2, f: f2 } = otherMatrix
    const { a, b, c, d, e, f } = this
    
    // just linear algebra don't worry if it looks arcane
    return new Matrix({
      a: a*a2 + b2*c,
      b: a2*b + b2*d,
      c: a*c2 + c*d2,
      d: b*c2 + d*d2,
      e: a*e2 + c*f2 + e,
      f: b*e2 + d*f2 + f,
    })
  }

  // Computing the inverse of a matrix
  inverse = () => {
    const { a, b, c, d, e, f } = this
    const determinant = a*d - c*b
    
    // Not an invertible matrix!
    if (determinant === 0) {
      throw new Error('Matrix is not invertible!')
    }
  
    return new Matrix({
      a: d/determinant,
      b: -b/determinant,
      c: -c/determinant,
      d: a/determinant,
      e: (c*f -e*d)/determinant,
      f: (e*b - a*f)/determinant
    })
  }

  // Applying the matrix transformation to x and y coordinates
  applyToCoords = ({ x, y }) => {
    const { a, b, c, d, e, f } = this
    return {
      x: a*x + c*y + e,
      y: b*x + d*y + f,
    }
  }
}

class MovementWorkspace extends Component {
  static defaultProps = {
    maxTranslation: {
      // I don't yet see a reason to limit this...
      x: 99999,
      y: 99999,
    },
    minZoom: 5,
    maxZoom: 19,
  }

  state = {
    transform: new Matrix({ a: 1, d: 1 }),
    zoom: 10,
    translation: {
      x: 0,
      y: 0,
    }
  }

  doTranslation = ({ deltaX, deltaY }) => {
    const { translation } = this.state
    const { maxTranslation: max } = this.props

    const newTranslation = {
      x: translation.x - deltaX,
      y: translation.y - deltaY
    }

    if (
      translation.x === newTranslation.x && translation.y === newTranslation.y
        || Math.abs(newTranslation.x) > max.x
        || Math.abs(newTranslation.y) > max.y
    ) {
      return
    }
  
    this.setState(prev => ({
      transform: prev.transform.multiply(
        new Matrix({
          a: 1,
          d: 1,
          e: -deltaX,
          f: -deltaY
        })
      ),
      translation: newTranslation,
    }))
  }
  
  doZoom = ({ clientX, clientY, deltaY }) => {
    const { zoom } = this.state
    const { maxZoom: max, minZoom: min } = this.props

    const scale = 1 - (1/110 * deltaY)
    const newZoom = zoom*Math.sqrt(scale)

    if (newZoom === zoom || newZoom > max || newZoom < min) {
      return
    }

    // We need to apply the inverse of the current transformation to the mouse coordinates
    // to get the 'actual' click coordinates
    const {
      x: mouseX,
      y: mouseY
    } = this.state.transform.inverse().applyToCoords({
      x: clientX,
      y: clientY
    })

    this.setState(prev => ({
      transform: prev.transform.multiply(
        new Matrix({
          a: scale,
          d: scale,
          e: -mouseX*(scale - 1),
          f: -mouseY*(scale - 1)
        })
      ),
      zoom: newZoom,
    }))
  }

  onWheel = event => {
    event.preventDefault()
    const { deltaX, deltaY  } = event
    const { doTranslation, doZoom } = this

    if (isWhole(deltaX) && isWhole(deltaY)) {
      // translation
      doTranslation(event)
    } else {
      // zoom
      doZoom(event)
    }
  }

  render() {
    const { transform } = this.state
    const { children } = this.props
    return (
      <div
        style={{
          height: '100%',
          width: '100%',
        }}
        onWheel={this.onWheel}
      >
        <div
          style={{
            height: '100%',
            width: '100%',
            transform: transform.toString(),
            transformOrigin: '0% 0%'
          }}
        >
          {
            React.Children.map(children, child =>
              React.cloneElement(
                child,
                { inverseCoords: transform.inverse().applyToCoords }
              )
            )
          }
        </div>
      </div>
    )
  }
}

export default MovementWorkspace