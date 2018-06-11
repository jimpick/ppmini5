import websocket from 'websocket-stream'
import pump from 'pump'
import {EventEmitter} from 'events'
import randomAccessIdb from 'random-access-idb'
import hypermergeMicro from '../lib/hypermerge-micro'

require('events').prototype._maxListeners = 100

const storage = randomAccessIdb('pp-mini')

export default class PixelDoc extends EventEmitter {
  constructor () {
    super()
    const key = localStorage.getItem('key')
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
    console.log('Jim info', info)
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
    localStorage.setItem('key', hm.key.toString('hex'))
    // this.setupGlue()
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
  }

  setPixelColor (x, y, color) {
    this.hm.change(doc => { doc[`x${x}y${y}`] = color })
  }
}
