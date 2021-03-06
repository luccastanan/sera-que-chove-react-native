import React, {Component} from 'react'
import {View, Text, StyleSheet, FlatList, TouchableOpacity} from 'react-native'

import { PRIMARY_COLOR } from '../Constants'
import Restaurant from './Restaurant';
import Util from '../Utilities'

export default class FirstFullPlace extends Component{

    render(){
        return <View style={styles.container}>
            <View style={styles.content}>
                <View style={styles.infoPanel}>
                    <Text style={styles.txName}>{this.props.place.name}</Text>
                    <Text style={styles.txAddress}>{this.props.place.address}</Text>
                    <Text style={styles.txDate}>{Util.dateFormat(this.props.place.date, 1)}</Text>
                </View>
                <View style={styles.weatherPanel}>
                    <View style={styles.mmPanel}>
                        <Text style={styles.txMM}>▲ {this.props.place.weather ? this.props.place.weather.max : '---'}</Text>
                        <Text style={styles.txMM}>▼ {this.props.place.weather ? this.props.place.weather.min : '---'}</Text>
                    </View>
                </View>
            </View>
            {this._loadRestaurants()}
        </View>
    }

    _loadRestaurants = () => {
        if(this.props.place.restaurants.length > 0){
            return (<View>
                <View style={styles.div} />
                <FlatList
                    data={Util.mapToList(this.props.place.restaurants)}
                    renderItem={({ item }) => <Restaurant rest={item} />}
                    keyExtractor={(item, index) => index.toString()}
                    style={{ flex: 1 }}
                    horizontal
                />
                <TouchableOpacity style={styles.btnMore} onPress={() => this.props.onSeeMore()}>
                    <Text style={styles.txMore}>ver mais</Text>
                </TouchableOpacity>
            </View>)
        } else {
            return null
        }
    }
}

const styles = StyleSheet.create({
    container:{
        padding:8,
        marginBottom:8
    },
    content:{
        flexDirection:'row'
    },
    infoPanel:{
        flex:1
    },
    weatherPanel:{

    },
    txName:{
        fontWeight:'bold',
        fontSize:18,
        color:PRIMARY_COLOR
    },
    txAddress: {
        fontSize: 14,
        color: PRIMARY_COLOR
    },
    txDate:{
        fontSize:14,
        color:PRIMARY_COLOR
    },
    txCurrent:{
        textAlign:'center',
        fontWeight:'bold',
        fontSize:18,
        color:PRIMARY_COLOR
    },
    txMM:{
        fontSize:14,
        color: PRIMARY_COLOR
    },
    mmPanel:{},
    div: { 
        borderBottomWidth: 1,
        borderBottomColor: PRIMARY_COLOR,
        marginTop:8,
        marginBottom:8
    },
    btnMore:{
        alignSelf: 'flex-end'
    },
    txMore:{
        fontSize:14,
        color:PRIMARY_COLOR
    }
})