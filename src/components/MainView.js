import React, { Component } from 'react';
import {
  Dimensions,
  Text,
  TouchableHighlight,
  TouchableWithoutFeedback,
  View,
  StyleSheet,
} from 'react-native';

const colors = ['r', 'g', 'b', 'w'];
const cssColorMap = {
  r: 'red',
  g: 'green',
  b: 'blue',
  w: 'white',
};

export default class MainView extends Component {
  constructor(props) {
    super(props);
    this.state = { selectedColor: 'r' };
  }
  render() {
    const { info, doc, setPixelColor } = this.props;
    const { width, height } = Dimensions.get('window');
    // console.log('Jim dimensions', width, height);
    const palette = colors.map(color => {
      const style = {
        backgroundColor: cssColorMap[color],
      };
      if (color === this.state.selectedColor) {
        style.borderWidth = 6;
      }
      return (
        <TouchableHighlight
          key={color}
          underlayColor="white"
          onPress={() => this.setState({ selectedColor: color })}>
          <View style={[styles.paletteColor, style]} />
        </TouchableHighlight>
      );
    });
    const pixels = [];
    for (let y = 0; y <= 1; y++) {
      for (let x = 0; x <= 1; x++) {
        const pixelStyle = {
          width: width / 3,
          height: width / 3,
          backgroundColor: cssColorMap[doc[`x${x}y${y}`]]
        };
        pixels.push(
          <TouchableWithoutFeedback
            key={`x${x}y${y}`}
            onPress={() => setPixelColor(x, y, this.state.selectedColor)}>
            <View style={[styles.pixel, pixelStyle]} />
          </TouchableWithoutFeedback>
        );
      }
    }
    return (
      <View style={styles.container}>
        <View style={styles.infoBox}>
          <Text style={styles.info}>Source:</Text>
          <Text style={styles.info}>
            {info.sourceKey}
          </Text>
          <Text style={styles.info}>Archiver:</Text>
          <Text style={styles.info}>
            {info.archiverKey}
            {' '}
            {info.archiverChangesLength}
          </Text>
          <View style={styles.divider} />
          {info.peers.map(({key, length}) => (
            <Text key={key} style={styles.info}>
              {key} {length}
            </Text>
          ))}
        </View>
        <View style={styles.palette}>
          {palette}
        </View>
        <View style={styles.pixels}>
          {pixels}
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ecf0f1',
  },
  infoBox: {
    flex: 0,
    width: '100%',
    padding: 10,
    minHeight: 100,
    overflow: 'scroll'
  },
  info: {
    fontSize: 7,
  },
  divider: {
    borderBottomWidth: 1,
    width: '100%',
    margin: 5,
  },
  palette: {
    flex: 0,
    borderWidth: 1,
    width: '100%',
    padding: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    minHeight: 100,
  },
  paletteColor: {
    width: 60,
    height: 60,
  },
  pixels: {
    flex: 1,
    width: '100%',
    padding: 40,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  pixel: {
    width: 120,
    height: 120,
    margin: 10,
  },
});
