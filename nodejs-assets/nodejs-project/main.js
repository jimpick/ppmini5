const {Readable} = require('stream')
const rn_bridge = require('rn-bridge');
const ram = require('random-access-memory')
const pump = require('pump')
const through2 = require('through2')
const toBuffer = require('to-buffer')
const hypercore = require('hypercore')
const Multicore = require('./multicore')
const duplexify = require('duplexify')
const writer = require('flush-write-stream')

// Inform react-native node is initialized.
rn_bridge.channel.send(JSON.stringify({type: 'gateway-ready'}));

const toReactNative = writer.obj(sendMessage) // writable
const fromReactNative = new Readable({
  objectMode: true,
  read () {}
})
const stream = duplexify(toReactNative, fromReactNative)

function sendMessage (data, enc, cb) {
  rn_bridge.channel.send(
    JSON.stringify({
      type: 'data',
      data: Buffer.from(data).toString('base64') 
    })
  );
  cb();
}

rn_bridge.channel.on('message', message => {
  console.log('Message', message)
  // rn_bridge.channel.send(msg);
  try {
    message = JSON.parse(message);
  } catch (e) {
    console.error('Error parsing message JSON', e);
  }
  if (message.type === 'replicate') {
    const {archiverKey, localKey} = message;
    replicate({archiverKey, localKey});
  }
  if (message.type === 'data') {
    fromReactNative.push(Buffer.from(message.data, 'base64'))
  }
});

let replicating = false;

function replicate ({archiverKey, localKey}) {
  if (replicating) return;
  replicating = true;
  const multicore = new Multicore(ram, {key: archiverKey})
  const ar = multicore.archiver
  ar.on('add', feed => {
    console.log('archive add', feed.key.toString('hex'))
    multicore.replicateFeed(feed)
  })
  ar.on('sync', () => {
    console.log('archive sync')
  })
  ar.on('ready', () => {
    console.log('archive ready', ar.changes.length)
    ar.changes.on('append', () => {
      console.log('archive changes append', ar.changes.length)
    })
    ar.changes.on('sync', () => {
      console.log('archive changes sync', ar.changes.length)
    })
  })

  pump(
    stream,
    through2(function (chunk, enc, cb) {
      console.log('From rn', chunk)
      this.push(chunk)
      cb()
    }),
    ar.replicate({encrypt: false}),
    through2(function (chunk, enc, cb) {
      console.log('To rn', chunk)
      this.push(chunk)
      cb()
    }),
    stream,
    err => {
      console.log('pipe finished', err && err.message)
      replicating = false
    }
  )
  multicore.replicateFeed(ar.changes)

  // Join swarm
  const userData = {
    name: 'android',
    key: localKey
  }
  const sw = multicore.joinSwarm({
    userData: JSON.stringify(userData)
  })
  sw.on('connection', (peer, type) => {
    if (!peer.remoteUserData) {
      console.log('Connect - No user data')
      return
    }
    try {
      const userData = JSON.parse(peer.remoteUserData.toString())
      if (userData.key) {
        console.log(`Connect ${userData.name} ${userData.key}`)
        const dk = hypercore.discoveryKey(toBuffer(userData.key, 'hex'))
        multicore.archiver.add(dk)
        multicore.announceActor(userData.name, userData.key)
      }
    } catch (e) {
      console.log(`Connection with no or invalid user data`, e)
      // console.error('Error parsing JSON', e)
    }
  })
}
