// original implementation at https://github.com/vTrip/FlatListSortable
// (which is a fork already)
// and some more code from https://github.com/deanmcpherson/react-native-sortable-listview

import React from 'react';
import { View } from 'react-native';

export class Row extends React.Component {
  constructor(props) {
    super(props);
    this._data = {};
  }

  shouldComponentUpdate(props) {
    if (props.hovering !== this.props.hovering) return true;
    if (props.active !== this.props.active) return true;
    if (props.rowData.item !== this.props.rowData.item) return true;
    if (props.rowHasChanged) {
      //  console.log('row has changed');
      return props.rowHasChanged(props.rowData.item, this._data);
    }
    return false;
  }

  handlePress = e => {
    if (!this.refs.view) return;
    this.refs.view.measure(
      (frameX, frameY, frameWidth, frameHeight, pageX, pageY) => {
        const layout = { frameHeight, pageY };
        this.props.onRowActive({
          layout,
          touch: e.nativeEvent,
          rowData: this.props.rowData,
        });
      }
    );
  };

  componentDidUpdate(props) {
    // Take a shallow copy of the active data. So we can do manual comparisons of rows if needed.
    if (props.rowHasChanged) {
      this._data =
        typeof props.rowData.data === 'object'
          ? Object.assign({}, props.rowData.data)
          : props.rowData.data;
    }
  }

  measure = (...args) => {
    if (!this.refs.view) return;
    this.refs.view.measure(...args);
  };

  render() {
    const activeData = this.props.list.state.active;

    const activeIndex = activeData ? activeData.rowData.index : -5;
    const shouldDisplayHovering = activeIndex !== this.props.rowData.index;

    // console.log("this.props.hovering", this.props.hovering, typeof this.props.hovering);
    // console.log("shouldDisplayHovering", shouldDisplayHovering);
    // console.log("activeIndex", activeIndex, typeof activeIndex);
    // console.log("this.props.rowData.index",this.props.rowData.index)

    const Row = React.cloneElement(
      this.props.renderItem(this.props.rowData, this.props.active),
      {
        sortHandlers: {
          onLongPress: !this.props.moveOnPressIn ? this.handlePress : null,
          onPressIn: this.props.moveOnPressIn ? this.handlePress : null,
          onPressOut: this.props.list.cancel,
        },
        onLongPress: !this.props.moveOnPressIn ? this.handlePress : null,
        onPressIn: this.props.moveOnPressIn ? this.handlePress : null,
        onPressOut: this.props.list.cancel,
      }
    );

    // console.log("this.props.hovering", this.props.hovering)
    // console.log("this.props.hovering && shouldDisplayHovering",this.props.hovering && shouldDisplayHovering)
    // console.log("activeData", activeData);

    return (
      <View
        onLayout={this.props.onRowLayout}
        style={[
          this.props.active && !this.props.hovering
            ? { height: 0.01, opacity: 0.0 }
            : null,
          this.props.active && this.props.hovering ? { opacity: 0.0 } : null,
        ]}
        ref="view">
        {this.props.hovering && shouldDisplayHovering
          ? this.props.activeDivider
          : null}
        {Row}
      </View>
    );
  }
}
