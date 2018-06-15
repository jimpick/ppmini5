const extraNodeModules = require('node-libs-react-native')

extraNodeModules.vm = require.resolve('vm-browserify')

function getBlacklistRE (platform) {
 return new RegExp(
   '/(nodejs-assets|android|ios)/'
 )
}

module.exports = {
  extraNodeModules,
  getBlacklistRE
}
