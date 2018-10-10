// https://github.com/gyetvan-andras/react-native-dnd-list/blob/master/DnDTestScreen.js

import React from 'react';
import { View, ScrollView } from 'react-native';

import uuid from 'uuid';

import { DraggableRowComponent } from './DraggableRowComponent';

const SCROLL_BY = 15;

const arrayMove = (arr, oldIndex, newIndex) => {
  if (newIndex >= arr.length) {
    var k = newIndex - arr.length;
    while (k-- + 1) {
      arr.push(undefined);
    }
  }
  arr.splice(newIndex, 0, arr.splice(oldIndex, 1)[0]);
  return arr; // for testing purposes
};

// TODO:
// * better naming convention for rows, items and such
// * Flow typing

export class DnDList extends React.Component {
  scrollDelta = 0;

  constructor(props) {
    super(props);
    this.state = {
      scrollEnabled: true,
      rows: props.rows.map(row => {
        return { row, key: uuid.v4() };
      }),
    };
    this.draggableRows = [];
    this.currentPaceMakerRow = null;
    this.scrollContentOffset = { y: 0, x: 0 };
  }

  componentWillReceiveProps({ rows }) {
    this.setState({
      rows: rows.map(row => {
        return { row, key: uuid.v4() };
      }),
    });
  }

  // static getDerivedStateFromProps(nextProps, prevState) {
  //   if (nextProps.rows) {
  //     return {
  //       rows: nextProps.rows.map(row => {
  //         return { row, key: uuid.v4() };
  //       }),
  //     };
  //   }
  // }

  _registerDraggableRow = draggableRow => {
    // console.log('Register',draggableRow.props.item)
    this.draggableRows.push(draggableRow);
  };

  _unregisterDraggableRow = draggableRow => {
    // console.log('Unregister',draggableRow.props.item)
    let idx = this.draggableRows.indexOf(draggableRow);
    if (idx !== -1) this.draggableRows.splice(idx, 1);
  };

  setScrollEnabled = enabled => {
    this.setState({ scrollEnabled: enabled });
  };

  renderRow = (item, idx) => {
    return this.props.renderRow(item, idx);
  };

  _renderRows = () => {
    return this.state.rows.map((item, idx) => {
      return (
        // TODO: Need to add a way to modify the styling of the overall piece here
        <DraggableRowComponent
          key={item.key}
          item={item.row}
          idx={idx}
          horizontal={this.props.horizontal}
          noDragHandle={this.props.noDragHandle}
          itemSize={this.itemSize}
          registerDraggableRow={this._registerDraggableRow}
          unregisterDraggableRow={this._unregisterDraggableRow}
          isDraggable={this.isDraggable}
          setScrollEnabled={this.setScrollEnabled}
          dragStart={this._dragStart}
          dragMove={this._dragMove}
          dragDrop={this._dragDrop}
          dragCancel={this._dragCancel}
          renderRow={this.renderRow}
        />
      );
    });
  };

  _dragStart = (gestureState, draggableRow) => {
    let itemIdx = draggableRow.props.idx;
    for (let i = itemIdx + 1; i < this.draggableRows.length; i++) {
      let dr = this.draggableRows[i];
      dr.moveUp(draggableRow.size);
    }
    if (this.props.startDrag) this.props.startDrag();
    draggableRow.scrollDelta = 0;
    this._dragMove(gestureState, draggableRow);
  };

  _reset = draggableRow => {
    this.scrollDelta = 0;
    let itemIdx = draggableRow.props.idx;
    for (let i = itemIdx + 1; i < this.draggableRows.length; i++) {
      let dr = this.draggableRows[i];
      dr.moveDown();
    }
    if (this.currentPaceMakerRow) {
      for (
        let i = this.currentPaceMakerRow.props.idx;
        i < this.draggableRows.length;
        i++
      ) {
        let dr = this.draggableRows[i];
        dr._hidePace();
      }
    }
    this.currentPaceMakerRow = null;
    if (this.props.stopDrag) this.props.stopDrag();
  };

  _dragCancel = (gestureState, draggableRow) => {
    this._reset(draggableRow);
  };

  _dragDrop = (gestureState, draggableRow) => {
    let rows = this.state.rows;
    let from = draggableRow.props.idx;
    let to = rows.length - 1;
    if (this.currentPaceMakerRow) {
      if (this.isLockedItem(this.currentPaceMakerRow, draggableRow)) {
        return false;
      }
      to = this.currentPaceMakerRow.props.idx;
      // console.log(`Move from ${from} to ${to}`)
      if (from < to) to -= 1;
      // arrayMove(rows, from, to)
    } else {
      if (this.isLockedItem(null, draggableRow)) {
        return false;
      }
    }

    this.handleDrop(from, to);
    this.scrollDelta = 0;
    if (this.props.stopDrag) this.props.stopDrag();

    // this._reset(draggableRow)
  };

  itemSize = idx => {
    return this.props.itemSizes
      ? this.props.itemSizes[idx]
      : (this.props.horizontal
          ? this.props.itemWidth
          : this.props.itemHeight) || 5;
  };

  _dragMove = (gestureState, draggableRow) => {
    this._checkEdges(gestureState, draggableRow);
    let itemIdx = draggableRow.props.idx;
    let start = draggableRow.screenPos;
    let middle = start + this.itemSize(itemIdx) / 2;

    let rowUnder = this.draggableRows.find(dr => {
      if (dr === draggableRow) return false;
      return dr.containsPosition(middle);
    });
    if (rowUnder) {
      let rowToMakePlace = null;
      if (rowUnder.positionInUpper(middle)) {
        rowToMakePlace = rowUnder;
      } else {
        let rmpIdx = rowUnder.props.idx + 1;
        rowToMakePlace =
          rmpIdx < this.draggableRows.length
            ? this.draggableRows[rmpIdx]
            : null;
        if (draggableRow === rowToMakePlace) {
          rmpIdx++;
          rowToMakePlace =
            rmpIdx < this.draggableRows.length
              ? this.draggableRows[rmpIdx]
              : null;
        }
      }
      if (this.currentPaceMakerRow === rowToMakePlace) {
        return;
      }
      if (this.currentPaceMakerRow) {
        for (
          let i = this.currentPaceMakerRow.props.idx;
          i < this.draggableRows.length;
          i++
        ) {
          let dr = this.draggableRows[i];
          if (draggableRow !== dr) {
            dr._hidePace();
          }
        }
      }

      this.currentPaceMakerRow = rowToMakePlace;
      if (this.currentPaceMakerRow) {
        if (this.isLockedItem(this.currentPaceMakerRow, draggableRow)) return;
        for (
          let i = this.currentPaceMakerRow.props.idx;
          i < this.draggableRows.length;
          i++
        ) {
          let dr = this.draggableRows[i];
          if (draggableRow !== dr) {
            dr._makePace(draggableRow.size);
          }
        }
      }
    }
  };

  handleDrop = (from, to) => {
    if (this.props.handleDrop) {
      return this.props.handleDrop(from, to);
    } else {
      return arrayMove(this.state.rows, from, to);
    }
  };

  isDraggable = row => {
    if (this.props.isDraggable) {
      return this.props.isDraggable(row.props.item);
    } else {
      return row.props.item.draggable !== undefined
        ? row.props.item.draggable
        : true;
    }
  };

  isLockedItem = (targetRow, draggedRow) => {
    if (this.props.isLockedItem) {
      return this.props.isLockedItem(
        targetRow ? targetRow.props.item : null,
        draggedRow.props.item
      );
    } else {
      return targetRow.props.item.locked !== undefined
        ? targetRow.props.item.locked
        : false;
    }
  };

  _scrollBy = (dd, draggableRow) => {
    let nx = 0;
    let ny = 0;
    if (this.props.horizontal) {
      nx = this.scrollContentOffset.x + dd;
    } else {
      ny = this.scrollContentOffset.y + dd;
    }
    this.scrollDelta += dd;
    this.list.scrollTo({ x: nx, y: ny, animated: false });
    draggableRow.scrollDelta = this.scrollDelta;
  };

  _checkEdges = (gestureState, draggableRow) => {
    let screenStart = draggableRow.screenPos;
    if (this.props.horizontal) {
      screenStart -= this.scrollContentOffset.x;
    } else {
      screenStart -= this.scrollContentOffset.y;
    }
    let screenEnd = screenStart + draggableRow.size;
    if (this.props.horizontal) {
      if (screenEnd >= this.scrollLayout.width - 20) {
        if (
          this.scrollLayout.width + this.scrollContentOffset.x <
          this.contentSize.width
        ) {
          this._scrollBy(SCROLL_BY, draggableRow);
        }
      } else if (screenStart < 20) {
        if (this.scrollContentOffset.x > 0) {
          this._scrollBy(-SCROLL_BY, draggableRow);
        }
      }
    } else {
      if (screenEnd >= this.scrollLayout.height - 20) {
        if (
          this.scrollLayout.height + this.scrollContentOffset.y <
          this.contentSize.height
        ) {
          this._scrollBy(SCROLL_BY, draggableRow);
        }
      } else if (screenStart < 20) {
        if (this.scrollContentOffset.y > 0) {
          this._scrollBy(-SCROLL_BY, draggableRow);
        }
      }
    }
  };

  _onScroll = event => {
    // console.log('Scroll offset:',event.nativeEvent.contentOffset);
    this.scrollContentOffset = event.nativeEvent.contentOffset;
  };

  _onScrollLayout = event => {
    // console.log('Scroll layout:',event.nativeEvent.layout)
    this.scrollLayout = event.nativeEvent.layout;
  };

  _onContentSizeChange = (cntWidth, cntHeight) => {
    // console.log('Content size',cntWidth, cntHeight)
    this.contentSize = { width: cntWidth, height: cntHeight };
  };

  render() {
    let contentSize = 0;
    for (let i = 0; i < this.state.rows.length; i++) {
      contentSize += this.itemSize(i);
    }

    return (
      <ScrollView
        ref={ref => (this.list = ref)}
        scrollEnabled={this.state.scrollEnabled}
        style={this.props.style}
        scrollEventThrottle={256}
        onScroll={this._onScroll}
        onLayout={this._onScrollLayout}
        onContentSizeChange={this._onContentSizeChange}
        horizontal={this.props.horizontal}>
        <View
          style={{
            flex: 0,
            // backgroundColor: 'green',
            height: this.props.horizontal ? null : contentSize,
            width: this.props.horizontal ? contentSize : null,
          }}>
          {this._renderRows()}
        </View>
      </ScrollView>
    );
  }
}
