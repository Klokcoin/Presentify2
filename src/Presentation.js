import React, { Component } from 'react'
import Slides from './Slides'

// Handle different Fullscreen API implementations
const browsers = Object.assign(...Object.entries({
  ms: [e => e.body ? e.body.msRequestFullscreen : undefined, d => d.msExitFullscreen, (d,c) => d.MSFullscreenChange = c],
  moz: [e => e.mozRequestFullScreen, d => d.mozCancelFullScreen, (d,c) => d.onmozfullscreenchange = c],
  webkit: [e => e.webkitRequestFullScreen, d => d.webkitExitFullscreen, (d,c) => d.onwebkitfullscreenchange = c],
  standard: [e => e.requestFullscreen, d => d.exitFullscreen, (d,c) => d.onfullscreenchange = c],
}).map(([key, value]) => {
  return {
    [key]: {
      enterFullscreen: value[0],
      exitFullscreen: value[1],
      onFullscreenChange: value[2],
    },
  }
}))

class App extends Component {
  state = {
    slide: 0,
    fullscreen: false,
  }

  componentDidMount() {
    // Focus the page on mount, so our keyDowns are properly registered from the start
    this.page.focus()

    // Determine the current browser by checking different enterFullscreen properties
    const currentBrowser = Object.entries(browsers).map(([key, browser]) => {
      return browser.enterFullscreen(this.page) ? browsers[`${key}`] : undefined
    }).filter(browser => browser)[0]
    this.browser = currentBrowser

    // Attach the onFullscreenChange callback
    this.browser.onFullscreenChange(document, () => {
      this.setState(prevState => ({ fullscreen: !prevState.fullscreen }))
    })
  }

  handleFullScreen() {
    this.state.fullscreen ? this.browser.exitFullscreen(document).bind(document)() : this.browser.enterFullscreen(this.page).bind(this.page)()
  }

  handleMouseDown = (e) => {
    e.preventDefault()
    this.nextSlide()
  }

  handleKeyDown = (e) => {
    e.keyCode === 37 && this.previousSlide()
    e.keyCode === 39 && this.nextSlide()
    // Make the keyDown of 'f' go fullscreen
    e.keyCode === 70 && this.handleFullScreen()
    e.keyCode === 27 && this.state.fullscreen && this.handleFullScreen()
  }

  nextSlide = () => {
    this.setState(prevState => ({ slide: prevState.slide < Slides.length - 1 ? prevState.slide + 1 : Slides.length - 1 }))
  }

  previousSlide = () => {
    this.setState(prevState => ({ slide: prevState.slide > 0 ? prevState.slide - 1 : 0 }))
  }

  render() {
    const CurrentSlide = () => {
      const Slide = Slides[this.state.slide]
      return (
        <Slide/>
      )
    }
    return (
      <div
        onKeyDown={this.handleKeyDown}
        onMouseDown={this.handleMouseDown}
        ref={page => {this.page = page}}
        style={{height: '100vh', width: '100vw', cursor: this.state.fullscreen ? 'none' : 'auto' }}
        tabIndex="1"
      >
        <CurrentSlide/>
      </div>
    )
  }
}

export default App
