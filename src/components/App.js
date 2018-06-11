import React, { Component } from 'react';
import { Text, View } from 'react-native';
import PixelDoc from '../store/pixelDocElectron';
import MainView from './MainView';

export default class App extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidMount() {
    this.pixelDoc = new PixelDoc()
    this.pixelDoc.on('update', ({info, doc}) => this.setState({info, doc}));
  }

  setPixelColor(x, y, color) {
    this.pixelDoc.setPixelColor(x, y, color)
  }

  render() {
    if (!this.state.doc) {
      return <Text>Loading...</Text>;
    }
    return (
      <MainView
        info={this.state.info}
        doc={this.state.doc}
        setPixelColor={this.setPixelColor.bind(this)} />
    )
  }
}

