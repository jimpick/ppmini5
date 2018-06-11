import React from 'react';
import App from './src/components/App';
import { View } from 'react-native';
import { Constants } from 'expo';

export default class extends React.Component {
  render() {
    return (
      <View style={{
        paddingTop: Constants.statusBarHeight,
        flex: 1
      }}>
        <App />
      </View>
    );
  }
}

