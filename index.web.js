import React, { Component } from 'react'
import { AppRegistry } from 'react-native'
import App from './src/components/App'

export default class WebApp extends Component {
  render() {
    return <App />
  }
}

AppRegistry.registerComponent('WebApp', () => WebApp)
AppRegistry.runApplication('WebApp', {
  rootTag: document.getElementById('root'),
})
