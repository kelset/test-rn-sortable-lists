// original implementation at https://github.com/vTrip/FlatListSortable
// (which is a fork already)
// and some more code from https://github.com/deanmcpherson/react-native-sortable-listview

import React from 'react';
import { Animated } from 'react-native';
// import Animated from 'react-native-reanimated'; // TODO: find a way to use this

export class SortRow extends React.Component {
  constructor(props) {
    super(props);
    const layout = props.list.state.active.layout;
    const wrapperLayout = props.list.wrapperLayout;

    this.state = {
      style: {
        position: 'absolute',
        left: 0,
        right: 0,
        opacity: props.activeOpacity || 0.8,
        height: layout.frameHeight,
        overflow: 'hidden',
        backgroundColor: 'transparent',
        marginTop: layout.pageY - wrapperLayout.pageY, // Account for top bar spacing
        transform: [{ scale: 1.04 }],
      },
    };
  }

  render() {
    return (
      <Animated.View
        ref="view"
        style={[
          this.state.style,
          this.props.sortRowStyle,
          this.props.list.state.pan.getLayout(),
        ]}>
        {this.props.renderItem(this.props.rowData, true)}
      </Animated.View>
    );
  }
}
