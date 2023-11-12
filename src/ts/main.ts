import 'pixi-spine'

import * as PIXI from 'pixi.js'
import { Spine } from 'pixi-spine'
import GUI from 'lil-gui'

type Firefly = {
  sprite: PIXI.Sprite
  phase: number
  speed: number
  direction: number
}

const MAX_PARTICLE_COUNT = 16
const BLINKING_TIME = 2.5 // 2 ~ 3

const assetsUrl =
  process.env.NODE_ENV === 'production'
    ? '/pub_web_pixijs_night-fire-fly/assets'
    : '/assets'

// Links
// - https://pixijs.com/examples/basic/particle-container?_highlight=parti
// - https://ja.esotericsoftware.com/forum/d/17094-unity%E3%81%AE%E3%83%9E%E3%83%86%E3%83%AA%E3%82%A2%E3%83%AB%E3%81%AB%E3%82%88%E3%81%A3%E3%81%A6%E3%83%91%E3%83%BC%E3%83%84%E3%81%AE%E8%BC%AA%E9%83%AD%E7%B7%9A%E3%81%8C%E6%B5%AE%E3%81%8D%E4%B8%8A%E3%81%8C%E3%81%A3%E3%81%A6%E3%81%97%E3%81%BE%E3%81%86/3

window.onload = async () => {
  const pixelRatio = window.devicePixelRatio || 1
  const app = new PIXI.Application({
    antialias: true,
    autoDensity: true,
    background: '#000',
    resizeTo: window,
    resolution: pixelRatio / 1
  })
  const pixiWrapper = document.querySelector('.pixi') as HTMLElement
  pixiWrapper.appendChild(app.view as HTMLCanvasElement)

  // background
  const aspectRatio = app.screen.width / app.screen.height
  const background = PIXI.Sprite.from(`${assetsUrl}/images/background.jpg`)
  background.anchor.set(0.5)
  background.position.set(app.screen.width / 2, app.screen.height / 2)
  background.scale.set(aspectRatio >= 1 ? aspectRatio : 1 / aspectRatio)

  // fire flies
  const fireFlies: Firefly[] = []
  const particleContainer = new PIXI.ParticleContainer(MAX_PARTICLE_COUNT, {
    scale: true,
    position: true,
    rotation: true,
    uvs: true,
    alpha: true
  })

  for (let i = 0; i < MAX_PARTICLE_COUNT; i++) {
    const fireflySprite = PIXI.Sprite.from(`${assetsUrl}/images/fire-fly.png`)
    fireflySprite.anchor.set(0.5)
    fireflySprite.scale.set(0.4 + Math.random() * 0.3)
    fireflySprite.position.set(
      Math.random() * app.screen.width,
      Math.random() * app.screen.height
    )
    fireflySprite.alpha = Math.random()

    fireFlies.push({
      sprite: fireflySprite,
      phase: Math.random() * 2 * Math.PI,
      speed: Math.random(),
      direction: Math.random() * 2 * Math.PI
    })
    particleContainer.addChild(fireflySprite)
  }

  // spineAnimation
  const spineAnimation = await PIXI.Assets.load(
    `${assetsUrl}/spine-data/model.json`
  )
    .then((res) => {
      const animation = new Spine(res.spineData)

      animation.x = app.screen.width / 2
      animation.y = app.screen.height

      animation.state.setAnimation(0, 'idle', true)
      animation.state.setAnimation(1, 'close-eye', false)
      animation.state.tracks[1].alpha = 0

      return animation
    })
    .catch((err) => {
      console.log(err)
    })

  app.stage.addChild(background as PIXI.DisplayObject)
  app.stage.addChild(particleContainer as PIXI.DisplayObject)
  app.stage.addChild(spineAnimation as PIXI.DisplayObject)

  // lil-gui
  // - https://lil-gui.georgealways.com/
  const gui = new GUI()
  const guiObject = {
    fireFlyParameters: {
      showfireFlies: true
    },
    spineParameters: {
      blink: false
    }
  }
  // paramter
  const fireFlyFolder = gui.addFolder('FireFly')
  fireFlyFolder.add(guiObject.fireFlyParameters, 'showfireFlies')
  const spineFolder = gui.addFolder('Spine')
  spineFolder.add(guiObject.spineParameters, 'blink')

  // animation
  app.ticker.add((delta) => {
    // gui
    // gui: fire fly
    particleContainer.visible = guiObject.fireFlyParameters.showfireFlies

    // fire fly
    const time = Date.now() / 1000
    for (let i = 0; i < MAX_PARTICLE_COUNT; i++) {
      fireFlies[i].sprite.alpha =
        (Math.sin(time + fireFlies[i].phase) + 1) / BLINKING_TIME

      fireFlies[i].sprite.x +=
        fireFlies[i].speed * Math.cos(fireFlies[i].direction)
      fireFlies[i].sprite.y +=
        fireFlies[i].speed * Math.sin(fireFlies[i].direction)

      if (fireFlies[i].sprite.x < 0) {
        fireFlies[i].sprite.x += app.screen.width
      } else if (fireFlies[i].sprite.x > app.screen.width) {
        fireFlies[i].sprite.x -= app.screen.width
      }
      if (fireFlies[i].sprite.y < 0) {
        fireFlies[i].sprite.y += app.screen.height
      } else if (fireFlies[i].sprite.y > app.screen.height) {
        fireFlies[i].sprite.y -= app.screen.height
      }
    }

    // spine animation
    if (spineAnimation) {
      if (guiObject.spineParameters.blink) {
        spineAnimation.state.tracks[1].alpha = (Math.sin(time * 2.5) + 1) / 2
      } else {
        spineAnimation.state.tracks[1].alpha = 0
      }
    }
  })

  // resize
  let timer = 0
  window.addEventListener('resize', () => {
    if (timer > 0) {
      clearTimeout(timer)
    }
    timer = window.setTimeout(() => {
      const aspectRatio = app.screen.width / app.screen.height

      // background
      background.position.set(app.screen.width / 2, app.screen.height / 2)
      background.scale.set(aspectRatio >= 1 ? aspectRatio : 1 / aspectRatio)

      // spine animation
      if (spineAnimation) {
        spineAnimation.x = app.screen.width / 2
        spineAnimation.y = app.screen.height
      }
    }, 0.5 * 1000)
  })
}
