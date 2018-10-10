// original implementation at https://github.com/vTrip/FlatListSortable
// (which is a fork already)
// and some more code from https://github.com/deanmcpherson/react-native-sortable-listview

import React from 'react';
import {
  StyleSheet,
  View,
  PanResponder,
  Animated,
  Dimensions,
  LayoutAnimation,
  FlatList,
  InteractionManager,
} from 'react-native';

import { Row } from './Row';
import { SortRow } from './SortRow';

const HEIGHT = Dimensions.get('window').height;

export class FlatListSortable extends React.Component {
  constructor(props, context) {
    super(props, context);

    const currentPanValue = { x: 0, y: 0 };

    this.state = {
      active: false,
      hovering: false,
      pan: new Animated.ValueXY(currentPanValue),
    };
    this.listener = this.state.pan.addListener(e => (this.panY = e.y));
    const onPanResponderMoveCb = Animated.event([
      null,
      {
        dx: this.state.pan.x, // x,y are Animated.Value
        dy: this.state.pan.y,
      },
    ]);

    this.moved = false;
    this.moveY = null;
    this.dy = 0;
    this.direction = 'down';

    this.state.panResponder = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: (e, gestureState) => {
        // Only capture when moving vertically, this helps for child swiper rows.
        const vy = Math.abs(gestureState.vy);
        const vx = Math.abs(gestureState.vx);

        return vy > vx && this.state.active;
      },
      onPanResponderMove: (e, gestureState) => {
        if (!this.state.active) return;
        gestureState.dx = 0;
        const layout = this.state.active.layout;
        this.moveY = layout.pageY + layout.frameHeight / 2 + gestureState.dy;
        this.direction = gestureState.dy >= this.dy ? 'down' : 'up';
        this.dy = gestureState.dy;
        onPanResponderMoveCb(e, gestureState);
        // console.log("this.state.hovering", this.state.hovering);
      },

      onPanResponderGrant: e => {
        // console.log("e.nativeEvent", e.nativeEvent);
        if (!this.state.active) return;
        this.moved = true;
        this.dy = 0;
        this.direction = 'down';
        props.onMoveStart && props.onMoveStart();
        this.state.pan.setOffset(currentPanValue);
        this.state.pan.setValue(currentPanValue);
      },

      onPanResponderRelease: e => {
        // console.log("onPanResponderRelease");
        // console.log("!this.state.active",!this.state.active)
        if (!this.state.active) return;
        this.moved = false;
        props.onMoveEnd && props.onMoveEnd();
        if (!this.state.active) {
          if (this.state.hovering) this.setState({ hovering: false });
          this.moveY = null;
          return;
        }
        const itemHeight = this.state.active.layout.frameHeight;
        // console.log("this.state.active.rowData.index",this.state.active.rowData.index)
        // console.log("this.order", this.order);
        const fromIndex = this.order
          .map(item => parseInt(item))
          .indexOf(this.state.active.rowData.index);
        // console.log("fromIndex", fromIndex);
        // console.log("this.state.hovering", this.state.hovering);
        let toIndex =
          this.state.hovering === false
            ? fromIndex
            : Number(this.state.hovering);
        // console.log("toIndex", toIndex);
        const up = toIndex > fromIndex;
        if (up) {
          toIndex--;
        }
        if (toIndex === fromIndex) {
          return this.setState({ active: false, hovering: false });
        }
        const args = {
          row: this.state.active.rowData,
          from: fromIndex,
          to: toIndex,
        };

        props.onRowMoved && props.onRowMoved(args);

        const MAX_HEIGHT = Math.max(
          0,
          this.scrollContainerHeight - this.listLayout.height + itemHeight
        );

        // console.log("this.scrollValue > MAX_HEIGHT",this.scrollValue > MAX_HEIGHT)

        if (this.scrollValue > MAX_HEIGHT) {
          this.scrollTo({ y: MAX_HEIGHT });
        }

        this.setState({
          active: false,
          hovering: false,
        });
        this.moveY = null;
      },
    });

    this.scrollValue = 0;
    // Gets calculated on scroll, but if you haven't scrolled needs an initial value
    this.scrollContainerHeight = HEIGHT * 1.2;

    this.firstRowY = undefined;
    this.layoutMap = {};
    this._rowRefs = {};
  }

  _keyExtractor = (item, index) => index.toString();

  cancel = () => {
    if (!this.moved) {
      this.state.active && this.props.onMoveCancel && this.props.onMoveCancel();
      this.setState({
        active: false,
        hovering: false,
      });
    }
  };

  measureWrapper = () => {
    if (!this.refs.wrapper) return;
    this.refs.wrapper.measure(
      (frameX, frameY, frameWidth, frameHeight, pageX, pageY) => {
        const layout = {
          frameX,
          frameY,
          frameWidth,
          frameHeight,
          pageX,
          pageY,
        };
        this.wrapperLayout = layout;
      }
    );
  };

  handleListLayout = e => {
    console.log('handleListLayout');
    this.listLayout = e.nativeEvent.layout;
  };

  handleScroll = e => {
    // console.log("handleScroll", e.nativeEvent.contentOffset.y);
    this.scrollValue = e.nativeEvent.contentOffset.y;
    if (this.props.onScroll) {
      this.props.onScroll(e);
    }
  };

  handleContentSizeChange = (width, height) => {
    // console.log("handleContentSizeChange")
    this.scrollContainerHeight = height;
  };

  scrollAnimation = () => {
    // console.log("scrollAnimation");
    // console.log("this.state.hovering", this.state.hovering);
    if (this.state.active) {
      if (this.moveY === undefined) {
        return requestAnimationFrame(this.scrollAnimation);
      }

      const SCROLL_OFFSET = this.wrapperLayout.pageY;
      const moveY = this.moveY - SCROLL_OFFSET;
      const SCROLL_LOWER_BOUND = 80;
      const SCROLL_HIGHER_BOUND = this.listLayout.height - SCROLL_LOWER_BOUND;
      const NORMAL_SCROLL_MAX =
        this.scrollContainerHeight - this.listLayout.height;
      const MAX_SCROLL_VALUE =
        NORMAL_SCROLL_MAX + this.state.active.layout.frameHeight * 2;
      const currentScrollValue = this.scrollValue;
      let newScrollValue = null;
      const SCROLL_MAX_CHANGE = 20;

      // console.log("moveY < SCROLL_LOWER_BOUND && currentScrollValue > 0", moveY < SCROLL_LOWER_BOUND && currentScrollValue > 0);
      if (moveY < SCROLL_LOWER_BOUND && currentScrollValue > 0) {
        const PERCENTAGE_CHANGE = 1 - moveY / SCROLL_LOWER_BOUND;
        newScrollValue =
          currentScrollValue - PERCENTAGE_CHANGE * SCROLL_MAX_CHANGE;
        if (newScrollValue < 0) newScrollValue = 0;
      }
      if (
        moveY > SCROLL_HIGHER_BOUND &&
        currentScrollValue < MAX_SCROLL_VALUE
      ) {
        const PERCENTAGE_CHANGE =
          1 - (this.listLayout.height - moveY) / SCROLL_LOWER_BOUND;
        newScrollValue =
          currentScrollValue + PERCENTAGE_CHANGE * SCROLL_MAX_CHANGE;
        if (newScrollValue > MAX_SCROLL_VALUE)
          newScrollValue = MAX_SCROLL_VALUE;
      }
      // console.log("newScrollValue !== null && !this.props.limitScrolling", newScrollValue !== null && !this.props.limitScrolling);
      if (newScrollValue !== null && !this.props.limitScrolling) {
        this.scrollValue = newScrollValue;
        this.scrollTo({
          y: this.scrollValue,
          animated: !this.props.disableAnimatedScrolling,
        });
      }
      this.moved && this.checkTargetElement();
      requestAnimationFrame(this.scrollAnimation);
    }
  };

  checkTargetElement = () => {
    const itemHeight = this.state.active.layout.frameHeight;
    const SLOP = this.direction === 'down' ? itemHeight : 0;
    const scrollValue = this.scrollValue;

    const moveY = this.moveY - this.wrapperLayout.pageY;

    const activeRowY = scrollValue + moveY - this.firstRowY;

    let indexHeight = 0.0;
    let i = 0;
    let row;
    const order = this.order;
    let isLast = false;
    while (indexHeight < activeRowY + SLOP) {
      const key = order[i];
      row = this.layoutMap[key];
      if (!row) {
        isLast = true;
        break;
      }
      indexHeight += row.height;
      i++;
    }
    if (!isLast) i--;

    if (String(i) !== this.state.hovering && i >= 0) {
      // LayoutAnimation is not supported in react-native-web
      LayoutAnimation && LayoutAnimation.easeInEaseOut();
      this._previouslyHovering = this.state.hovering;
      this.__activeY = this.panY;
      this.setState({
        hovering: String(i),
      });
    }
  };

  handleRowActive = row => {
    if (this.props.disableSorting) return;
    this.state.pan.setValue({ x: 0, y: 0 });
    // LayoutAnimation is not supported in react-native-web
    LayoutAnimation && LayoutAnimation.easeInEaseOut();
    this.moveY = row.layout.pageY + row.layout.frameHeight / 2;
    // console.log("row.rowData.index", row.rowData.index, typeof row.rowData.index)
    this.setState(
      {
        active: row,
        hovering: row.rowData.index,
      },
      this.scrollAnimation
    );
    this.props.onRowActive && this.props.onRowActive(row);
  };

  renderActiveDivider = () => {
    const height = this.state.active
      ? this.state.active.layout.frameHeight
      : null;
    if (this.props.renderActiveDivider) {
      return this.props.renderActiveDivider(height);
    }
    return <View style={{ height }} />;
  };

  renderItem = (data, active) => {
    const Component = active ? SortRow : Row;
    const isActiveRow =
      !active &&
      this.state.active &&
      this.state.active.rowData.index === data.index;
    const hoveringIndex =
      this.order[this.state.hovering] || this.state.hovering;

    // console.log("hoveringIndex", hoveringIndex);
    // console.log("data.index", data.index);
    // console.log("hoveringIndex === data.index", hoveringIndex === data.index);

    return (
      <Component
        {...this.props}
        activeDivider={this.renderActiveDivider()}
        active={active || isActiveRow}
        hovering={Number(hoveringIndex) === data.index}
        list={this}
        rowData={data}
        ref={view => {
          this._rowRefs[active ? 'ghost' : data.index] = view;
        }}
        panResponder={this.state.panResponder}
        onRowActive={this.handleRowActive}
        onRowLayout={this._updateLayoutMap(data.index)}
      />
    );
  };

  _updateLayoutMap = index => e => {
    const layout = e.nativeEvent.layout;
    if (this.firstRowY === undefined || layout.y < this.firstRowY) {
      this.firstRowY = layout.y;
    }
    this.layoutMap[index] = layout;
  };

  renderActive = () => {
    if (!this.state.active) return;
    const index = this.state.active.rowData.index;
    return this.renderItem(
      { item: this.props.data[index], index: index },
      true
    );
  };

  componentWillMount() {
    this.setOrder(this.props);
  }

  componentDidMount() {
    InteractionManager.runAfterInteractions(() => {
      this.timer = setTimeout(() => this && this.measureWrapper(), 0);
    });
  }

  componentWillReceiveProps(props) {
    this.setOrder(props);
  }

  componentWillUnmount() {
    this.timer && clearTimeout(this.timer);
    this.state.pan.removeListener(this.listener);
  }

  setOrder = props => {
    this.order = props.order || Object.keys(props.data) || [];
  };

  scrollTo = (...args) => {
    // console.log("...args", ...args);
    if (!this.refs.list) return;
    this.refs.list.scrollTo(...args);
  };

  getScrollResponder = () => {
    if (!this.refs.list) return;
    this.refs.list.getScrollResponder();
  };

  render() {
    const scrollEnabled =
      !this.state.active && this.props.scrollEnabled !== false;

    return (
      <View ref="wrapper" style={styles.mainContainer} collapsable={false}>
        <FlatList
          {...this.props}
          {...this.state.panResponder.panHandlers}
          ref="list"
          onScroll={this.handleScroll}
          onContentSizeChange={this.handleContentSizeChange}
          onLayout={this.handleListLayout}
          keyExtractor={this._keyExtractor}
          data={this.props.data}
          renderItem={this.renderItem}
          scrollEnabled={scrollEnabled}
        />
        {this.renderActive()}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
});
