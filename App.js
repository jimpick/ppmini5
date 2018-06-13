import React from 'react';
import App from './src/components/App';
import { View } from 'react-native';
import nodejs from 'nodejs-mobile-react-native';

export default class extends React.Component {
  componentWillMount () {
    nodejs.start("main.js");
    nodejs.channel.addListener(
      "message",
      (msg) => {
        alert("From node: " + msg);
      },
      this
    );
  }

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

