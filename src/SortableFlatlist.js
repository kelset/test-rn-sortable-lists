import React from 'react'
import { StyleSheet, SafeAreaView, TouchableOpacity, Text } from 'react-native'
import { FlatListSortable } from './SortFlat/FlatListSortable'

const arrayMove = (arr, oldIndex, newIndex) => {
  if (newIndex >= arr.length) {
    var k = newIndex - arr.length
    while (k-- + 1) {
      arr.push(undefined)
    }
  }
  arr.splice(newIndex, 0, arr.splice(oldIndex, 1)[0])
  return arr // for testing purposes
}

export default class SortableFlatlist extends React.Component {
  state = {
    data: [
      'James',
      'Michael',
      'Harold',
      'Chloe',
      'Bob',
      'George',
      'Samantha',
      'Jenny',
      'Sharon',
      'Mark',
      'Carl',
      'TJ',
      'Julia',
      'Soi',
      'Andrew',
      'Tom',
    ],
  }

  render() {
    return (
      <SafeAreaView style={styles.container}>
        <FlatListSortable
          onRowMoved={this.rowMoved}
          data={this.state.data}
          renderItem={this.renderItem}
          style={styles.list}
        />
      </SafeAreaView>
    )
  }

  rowMoved = ({ from, to }) => {
    const localData = Array.from(this.state.data)
    this.setState({
      data: arrayMove(localData, from, to),
    })
  }

  renderItem = ({ item, index }) => (
    <TouchableOpacity style={styles.item}>
      <TouchableOpacity style={styles.itemButton} onPress={this.onButtonPress}>
        <Text style={{ textAlign: 'center' }}>Button</Text>
      </TouchableOpacity>
      <Text style={styles.itemText}>{`${item}`}</Text>
    </TouchableOpacity>
  )

  onCardPress = () => {
    // alert('Card was pressed');
  }

  onButtonPress = () => {
    // alert('Card was pressed');
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  list: {
    flex: 1,
  },
  item: {
    marginVertical: 10,
    marginHorizontal: 25,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: 'blue',
    borderRadius: 8,
    justifyContent: 'space-between',
    alignItems: 'center',
    flexDirection: 'row',
  },
  itemText: {
    color: 'white',
    fontSize: 20,
  },
  itemButton: {
    margin: 5,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
    justifyContent: 'center',
    backgroundColor: 'coral',
  },
})
