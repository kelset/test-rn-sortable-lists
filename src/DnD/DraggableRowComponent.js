// https://github.com/gyetvan-andras/react-native-dnd-list/blob/master/DnDTestScreen.js

import React from 'react';
import {
  Text,
  View,
  PanResponder,
  Animated,
  Easing,
  Platform,
} from 'react-native';

const SORTING_AREA_WIDTH = 80;

export class DraggableRowComponent extends React.Component {
  _scrollDelta = 0;

  get scrollDelta() {
    return this._scrollDelta;
  }

  set scrollDelta(sd) {
    this._scrollDelta = sd;
    this.scrollDeltaAnim.setValue(this.scrollDelta);
  }

  constructor(props) {
    super(props);
    // this.lastStart = 0
    this.dragging = false;
    this.scrollDeltaAnim = new Animated.Value(0);
    this.dragAnim = new Animated.Value(0);
    this.drag_anim_pos = 0;
    this.anim = new Animated.Value(0);
    this.offset = new Animated.Value(0);
    this.offset_val = 0;
    this.pace_maker = new Animated.Value(0);
    this.pace_maker_val = 0;
    this.state = { zIndex: 0 };
  }

  get start() {
    let _start = 0;
    for (let i = 0; i < this.props.idx; i++) {
      _start += this.props.itemSize(i);
    }
    return _start;
  }

  get screenPos() {
    return (
      this.start +
      this.offset_val +
      this.pace_maker_val +
      this.drag_anim_pos +
      this._scrollDelta
    );
  }

  get size() {
    return this.props.itemSize(this.props.idx);
  }

  containsPosition = middle => {
    let start = this.start + this.offset_val + this.pace_maker_val;
    let bottom = start + this.size;
    return middle >= start && middle <= bottom;
  };

  positionInUpper = middle => {
    let start = this.start + this.offset_val + this.pace_maker_val;
    return middle <= start + this.size / 2;
  };

  componentWillMount() {
    let self = this;
    this._panResponder = PanResponder.create({
      onStartShouldSetPanResponder: (evt, gestureState) => {
        // console.log('onStartShouldSetPanResponder', gestureState.dx, gestureState.dy)
        return true;
      },
      onStartShouldSetPanResponderCapture: (evt, gestureState) => {
        // console.log('onStartShouldSetPanResponderCapture', gestureState.dx, gestureState.dy)
        // self.lastStart = Date.now()
        if (this.props.horizontal) {
          self.dragStarter = setTimeout(() => {
            self.dragging = true;
            self._dragStart(gestureState);
            self.dragStarter = null;
          }, 200);
        } else {
          self.dragging = true;
          self._dragStart(gestureState);
        }
        return true;
      },
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // console.log('onMoveShouldSetPanResponder', gestureState.dx, gestureState.dy)
        return true;
      },
      onMoveShouldSetPanResponderCapture: (evt, gestureState) => {
        // console.log('onMoveShouldSetPanResponderCapture', gestureState.dx, gestureState.dy)
        // self.lastStart = Date.now()
        return true;
      },
      onPanResponderGrant: (evt, gestureState) => {
        // self._dragStart(gestureState)
      },
      onPanResponderMove: (evt, gestureState) => {
        if (self.dragStarter) {
          clearTimeout(self.dragStarter);
          self.dragStarter = null;
        } else if (self.dragging) {
          self._dragMove(gestureState);
        }
      },
      onPanResponderTerminationRequest: (evt, gestureState) => false,
      onPanResponderRelease: (evt, gestureState) => {
        // console.log('Elapsed ', Date.now() - self.lastStart)
        if (self.dragging) self._dragDrop(gestureState);
        self.dragging = false;
        // self.lastStart = 0
        if (self.dragStarter) {
          clearTimeout(self.dragStarter);
          self.dragStarter = null;
        }
      },
      onPanResponderTerminate: (evt, gestureState) => {
        // console.log('Elapsed ', Date.now() - self.lastStart)
        if (self.dragging) self._dragCancel(gestureState);
        self.dragging = false;
        // self.lastStart = 0
        if (self.dragStarter) {
          clearTimeout(self.dragStarter);
          self.dragStarter = null;
        }
      },
      onShouldBlockNativeResponder: (evt, gestureState) => {
        return true;
      },
    });
    this.props.registerDraggableRow(this);
  }

  componentWillUnmount() {
    this.props.unregisterDraggableRow(this);
  }

  _dragStart = gestureState => {
    // console.log('drag start', gestureState)
    if (this.props.isDraggable(this)) {
      this.props.setScrollEnabled(false);
      this.props.dragStart(gestureState, this);
      this.setState({ zIndex: 1000 }, () => {
        // TODO: this is the one to blame for bounciness
        Animated.spring(this.anim, {
          toValue: 0,
          velocity: 1,
          tension: 10,
          friction: 2,
          //   useNativeDriver: true,
        }).start();
      });
    }
  };

  _dragMove = gestureState => {
    // console.log('drag move', JSON.stringify(gestureState, null, 2))
    if (this.props.isDraggable(this)) {
      if (this.props.horizontal) {
        this.dragAnim.setValue(gestureState.dx);
        this.drag_anim_pos = gestureState.dx;
      } else {
        this.dragAnim.setValue(gestureState.dy);
        this.drag_anim_pos = gestureState.dy;
      }
      this.props.dragMove(gestureState, this);
    }
  };

  _dragDrop = gestureState => {
    // console.log('drag end', gestureState.dy)
    this.props.setScrollEnabled(true);
    if (this.props.dragDrop(gestureState, this)) {
      this.dragAnim.setValue(0);
      this.drag_anim_pos = 0;
    } else {
      this.props.dragCancel(gestureState, this);
      this._moveBack();
    }
  };

  _dragCancel = gestureState => {
    // console.log('drag cancel')
    this.props.setScrollEnabled(true);
    this.props.dragCancel(gestureState, this);
    this._moveBack();
  };

  _moveBack = () => {
    this.drag_anim_pos = 0;
    Animated.parallel([
      Animated.timing(this.dragAnim, {
        toValue: 0,
        easing: Easing.linear,
        duration: 500,
      }),
      Animated.timing(this.scrollDeltaAnim, {
        toValue: 0,
        easing: Easing.linear,
        duration: 500,
      }),
    ]).start(() => {
      this.setState({ zIndex: 0 });
    });
  };

  _makePace = forItemSize => {
    this.pace_maker_val = forItemSize;
    Animated.timing(this.pace_maker, {
      toValue: forItemSize,
      easing: Easing.linear,
      duration: 300,
      // 1 useNativeDriver: true
    }).start();
  };

  _hidePace = () => {
    this.pace_maker_val = 0;
    Animated.timing(this.pace_maker, {
      toValue: 0,
      easing: Easing.linear,
      duration: 300,
      // 1 useNativeDriver: true
    }).start();
  };

  moveUp = forItemSize => {
    this.offset_val = -forItemSize;
    Animated.timing(this.offset, {
      toValue: this.offset_val,
      easing: Easing.linear,
      duration: 600,
      // useNativeDriver: true
    }).start();
  };

  moveDown = () => {
    this.offset_val = 0;
    Animated.timing(this.offset, {
      toValue: this.offset_val,
      easing: Easing.linear,
      duration: 600,
      // useNativeDriver: true
    }).start();
  };

  render() {
    let handlerStyle = {
      width: SORTING_AREA_WIDTH,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'absolute',
      top: 0,
      bottom: this.props.horizontal ? 0 : null,
      height: this.props.horizontal ? null : this.size,
    };

    let baseStyle = null;
    let animationStyle = null;
    if (this.props.horizontal) {
      baseStyle = {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: this.start,
        width: this.size,
        margin: 10,
        flexDirection: 'row',
        justifyContent: 'center',
        // backgroundColor: 'white',
      };
      animationStyle = {
        transform: [
          {
            translateX: Animated.add(
              Animated.add(
                Animated.add(this.dragAnim, this.offset),
                this.pace_maker
              ),
              this.scrollDeltaAnim
            ),
          },
          {
            scale: this.anim.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 1.3],
            }),
          },
        ],
      };
    } else {
      baseStyle = {
        position: 'absolute',
        top: this.start,
        height: this.size,
        right: 0,
        left: 0,
        margin: 10,
        flexDirection: 'row',
        justifyContent: 'center',
        // backgroundColor: 'white',
      };
      animationStyle = {
        transform: [
          {
            translateY: Animated.add(
              Animated.add(
                Animated.add(this.dragAnim, this.offset),
                this.pace_maker
              ),
              this.scrollDeltaAnim
            ),
          },
          {
            scale: this.anim.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 1.3],
            }),
          },
        ],
      };
    }

    if (Platform.OS === 'android') {
      animationStyle.elevation = this.state.zIndex === 0 ? 0 : 2;
    } else {
      animationStyle.zIndex = this.state.zIndex;
    }

    let rowContent = this.props.renderRow(this.props.item, this.props.idx);
    let dragHandle = null;
    let draggable = this.props.isDraggable(this);

    if (!this.props.noDragHandle) {
      if (draggable) {
        dragHandle = (
          <Animated.View
            style={[handlerStyle, { right: 0 }]}
            {...this._panResponder.panHandlers}>
            <View style={{ paddingVertical: 10 }}>
              <Text>Reorder</Text>
            </View>
          </Animated.View>
        );
      } else {
        dragHandle = (
          <Animated.View
            style={[handlerStyle, { right: 0, backgroundColor: 'transparent' }]}
          />
        );
      }
    }

    if (this.props.noDragHandle) {
      // this props seem to suggest that you can have the whole row draggable
      if (!draggable) {
        return (
          <Animated.View style={[baseStyle, animationStyle]}>
            <View style={{ flex: 1, flexDirection: 'row' }}>{rowContent}</View>
          </Animated.View>
        );
      } else {
        return (
          <Animated.View style={[baseStyle, animationStyle]}>
            <View
              style={{
                flex: 1,
                flexDirection: 'row',
              }}
              {...this._panResponder.panHandlers}>
              {rowContent}
            </View>
          </Animated.View>
        );
      }
    } else {
      return (
        <Animated.View style={[baseStyle, animationStyle]}>
          <View
            style={{
              flex: 1,
              flexDirection: 'row',
            }}>
            {rowContent}
            {dragHandle}
          </View>
        </Animated.View>
      );
    }
  }
}
