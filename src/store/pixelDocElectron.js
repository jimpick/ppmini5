import fs from 'fs'
import electron from 'electron'
import {EventEmitter} from 'events'
import equal from 'deep-equal'
import hypermergeMicro from '../lib/hypermerge-micro'

require('events').prototype._maxListeners = 100

const storage = `${electron.remote.app.getPath('userData')}/pp-mini`
console.log('Storage path:', storage)
const sourceFile = `${storage}/source`

export default class PixelDoc extends EventEmitter {
  constructor () {
    super()
    let key
    if (fs.existsSync(sourceFile)) {
      key = fs.readFileSync(sourceFile, 'utf8')
    }
    const hm = hypermergeMicro(storage, {key, debugLog: true})
    hm.on('debugLog', console.log)
    hm.on('ready', this.ready.bind(this))
    this.hm = hm
  }

  update(doc) {
    const info = {
      sourceKey: this.hm.source.key.toString('hex'),
      archiverKey: this.hm.getArchiverKey().toString('hex'),
      archiverChangesLength: this.hm.multicore.archiver.changes.length,
      peers: []
    };
    info.peers.push({
      key: info.sourceKey,
      length: this.hm.source.length
    });
    if (this.hm.local) {
      info.peers.push({
        key: this.hm.local.key.toString('hex'),
        length: this.hm.local.length
      });
    }
    Object.keys(this.hm.peers).forEach(key => {
      const feed = this.hm.peers[key]
      info.peers.push({
        key: feed.key.toString('hex'),
        length: feed.length
      })
    })
    // console.log('Jim info', info)
    const updateDoc = {
      x0y0: doc.x0y0,
      x0y1: doc.x0y1,
      x1y0: doc.x1y0,
      x1y1: doc.x1y1
    }
    this.emit('update', {
      info,
      doc: updateDoc
    })
  }

  ready () {
    const hm = this.hm
    console.log('Jim ready', hm.key.toString('hex'))
    fs.writeFileSync(sourceFile, hm.source.key.toString('hex'))
    this.setupGlue()
    hm.doc.registerHandler(doc => {
      this.update(doc)
    })

    if (hm.source.length === 0) {
      hm.change('blank canvas', doc => {
        doc.x0y0 = 'w'
        doc.x0y1 = 'w'
        doc.x1y0 = 'w'
        doc.x1y1 = 'w'
      })
    }

    console.log('Ready', hm.get())
    this.update(hm.get())

    hm.multicore.on('announceActor', message => {
      console.log('announceActor', message)
      hm.connectPeer(message.key)
    })

    console.log('Joining swarm')
    const userData = {
      name: 'electron'
    }
    if (hm.local) {
      userData.key = hm.local.key.toString('hex')
    }
    sw = hm.joinSwarm({
      userData: JSON.stringify(userData)
      // timeout: 1000
    })
    sw.on('connection', (peer, type) => {
      try {
        if (!peer.remoteUserData) throw new Error('No user data')
        const userData = JSON.parse(peer.remoteUserData.toString())
        if (userData.key) {
          console.log(`Connect ${userData.name} ${userData.key}`)
          hm.connectPeer(userData.key)
        }
      } catch (e) {
        console.error(`Connection with no or invalid user data`)
        // console.error('Error parsing JSON', e)
      }
    })
    /*
    const archiverKey = hm.getArchiverKey().toString('hex')
    const host = document.location.host
    const proto = document.location.protocol === 'https:' ? 'wss' : 'ws'
    const actorKey = hm.local ? hm.local.key.toString('hex') : 'none'
    const url = `${proto}://${host}/archiver/${archiverKey}/${actorKey}`
    const stream = websocket(url)
    pump(
      stream,
      hm.multicore.archiver.replicate({encrypt: false}),
      stream,
      err => {
        console.log('Stream ended', err)
      }
    )
    this.emit('ready')
    */
  }

  setPixelColor (x, y, color) {
    this.hm.change(doc => { doc[`x${x}y${y}`] = color })
  }

  setupGlue () {
    const hm = this.hm
    const self = this
    hm.getMissing(() => {
      // Setup 'glue' actors data structure in document
      let actorIncludedInDoc = false
      setTimeout(() => {
        updateActorGlue(hm.get())
        hm.doc.registerHandler(updateActorGlue)
        this.update(hm.get())
      }, 1000)

      function updateActorGlue (doc) {
      if (hm.findingMissingPeers) {
        console.log('Still finding missing peers')
        return // Still fetching dependencies
      }
      const actorId = hm.local ? hm.local.key.toString('hex')
        : hm.source.key.toString('hex')
      if (hm.local && !actorIncludedInDoc) {
        actorIncludedInDoc = true
        if (hm.local.length === 0) {
          hm.change(doc => {
            if (!doc.actors) {
              doc.actors = {}
              doc.actors[actorId] = {}
            }
            const seenActors = updateSeenActors(doc)
            if (seenActors) {
              doc.actors[actorId] = seenActors
            }
            // log(`Update local actors ${JSON.stringify(doc.actors)}`)
          })
          console.log(`Updated actors list (new actor)`)
        }
      } else {
        const seenActors = updateSeenActors(doc)
        if (seenActors) {
          hm.change(doc => {
            if (!doc.actors) {
              doc.actors = {}
            }
            doc.actors[actorId] = seenActors
          })
          console.log(`Updated actors list`)
        }
      }

      self.update(hm.get())

      function updateSeenActors (doc) {
        if (!actorId) return null
        const actors = doc.actors || {}
        let prevSeenActors = actors[actorId] || {}
        if (prevSeenActors) {
          prevSeenActors = Object.keys(prevSeenActors).reduce(
            (acc, key) => {
              if (key === '_objectId') return acc
              return Object.assign({}, acc, {[key]: prevSeenActors[key]})
            },
            {}
          )
        }
        const keys = Object.keys(actors)
          .filter(key => (key !== actorId) && (key !== '_objectId'))
        // log(keys.join(','))
        const seenActors = keys.reduce(
          (acc, key) => Object.assign({}, acc, {[key]: true}),
          {}
        )
        return !equal(seenActors, prevSeenActors) ? seenActors : null
      }
    }
    })
  }
}
