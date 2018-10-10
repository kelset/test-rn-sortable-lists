import React from 'react'
import { Text, View, FlatList, StyleSheet } from 'react-native'
import { createStackNavigator } from 'react-navigation'
import { RectButton, ScrollView } from 'react-native-gesture-handler'
import { useScreens } from 'react-native-screens'

useScreens()

import SortableFlatlist from './src/SortableFlatlist'
import SortableScrollView from './src/SortableScrollView'

const SCREENS = {
  SortableFlatlist: { screen: SortableFlatlist, title: 'Using Flatlist' },
  SortableScrollView: { screen: SortableScrollView, title: 'Using ScrollView' },
}

class MainScreen extends React.Component {
  static navigationOptions = {
    title: '🎬 Sortable List Examples',
  }

  render() {
    const data = Object.keys(SCREENS).map(key => ({ key }))
    return (
      <FlatList
        style={styles.list}
        data={data}
        ItemSeparatorComponent={ItemSeparator}
        renderItem={props => (
          <MainScreenItem
            {...props}
            onPressItem={({ key }) => this.props.navigation.navigate(key)}
          />
        )}
        renderScrollComponent={props => <ScrollView {...props} />}
      />
    )
  }
}

const ItemSeparator = () => <View style={styles.separator} />

class MainScreenItem extends React.Component {
  _onPress = () => this.props.onPressItem(this.props.item)
  render() {
    const { key } = this.props.item
    return (
      <RectButton style={styles.button} onPress={this._onPress}>
        <Text style={styles.buttonText}>{SCREENS[key].title || key}</Text>
      </RectButton>
    )
  }
}

const ExampleApp = createStackNavigator(
  {
    Main: { screen: MainScreen },
    ...SCREENS,
  },
  {
    initialRouteName: 'Main',
  },
)

const styles = StyleSheet.create({
  list: {
    backgroundColor: '#EFEFF4',
  },
  separator: {
    height: 1,
    backgroundColor: '#DBDBE0',
  },
  buttonText: {
    backgroundColor: 'transparent',
  },
  button: {
    flex: 1,
    height: 60,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
})

export default ExampleApp
