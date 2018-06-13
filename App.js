import React from 'react';
import App from './src/components/App';
import { View } from 'react-native';

export default class extends React.Component {
  render() {
    return (
      <View style={{
        paddingTop: 20,
        flex: 1
      }}>
        <App />
      </View>
    );
  }
}

