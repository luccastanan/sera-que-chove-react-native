import React, { Component } from 'react';
import { Platform, StyleSheet, Text, View, FlatList, ImageBackground, Dimensions, PermissionsAndroid } from 'react-native';

import Orientation from 'react-native-orientation'
import IconSimple from 'react-native-vector-icons/SimpleLineIcons'
import IconMaterial from 'react-native-vector-icons/MaterialCommunityIcons'
import { Dropdown } from 'react-native-material-dropdown'
import { Button} from 'react-native-elements'
import Carousel from 'react-native-snap-carousel'

import Travel from '../components/Travel'
import UserDB from '../database/UserDB'
import { PRIMARY_COLOR } from '../Constants'
import baseStyles from '../style/Base'
import Services from '../services'
import TextEmptyList from '../components/TextEmptyList'
import TravelDB from '../database/TravelDB'
import Util from '../Utilities'
import RNFetchBlob from 'rn-fetch-blob';

const menuOptions = [{
    value: 'Nova viagem',
}, {
    value: 'Configurações',
}]

const dimensions = Dimensions.get('window');
const imageWidth = dimensions.width;
const imageHeight = Math.round(imageWidth * 9 / 16);
export default class HomeScreen extends Component {

    constructor(props) {
        super(props);
        this.state = {
            openedMenu: false,
            travelList: [],
            currentWeather: 0,
            currentMax: 0,
            currentMin: 0,
            tomorrowMax: 0,
            tomorrowMin: 0,
            city: '',
            loaded: false,
            loading:false,
        };

        console.log(UserDB.selectCache(false))
    }

    render() {
        return (
            <View style={styles.container}>
                <View style={styles.panel}>
                    <ImageBackground
                        source={require('../img/forest.jpg')}
                        style={{ height: imageHeight, width: imageWidth }}>
                        <View style={styles.panelContent}>
                            <View style={[styles.panelHeader,{position:'absolute'}]}>
                                <Text style={[styles.weatherText, styles.h4, {marginTop:8}]}>{this.state.loaded ? this.state.city : ''}</Text>
                                <Dropdown data={menuOptions}
                                    rippleInsets={{ top: 4, bottom: 0, left: 0, right: 8 }}
                                    containerStyle={{ width: 50, height: 50 }}
                                    dropdownPosition={1}
                                    itemColor="rgba(0, 0, 0, .87)"
                                    pickerStyle={{
                                        width: 136,
                                        left: null,
                                        right: 0,
                                        marginRight: 8,
                                        marginTop: 28
                                    }}
                                    textColor={PRIMARY_COLOR}
                                    renderBase={() => <IconMaterial.Button name="dots-vertical" size={30} backgroundColor='transparent' color={'white'} />}
                                    onChangeText={(text) => this._menuSelected(text)}
                                />
                            </View>
                            {this.state.loaded ?
                                (<View style={styles.panelWeather}>
                                    <Text style={[styles.weatherText, styles.panelCurrent]}>{ this.state.currentWeather}º</Text>
                                    <View style={styles.panelMM}>
                                        <Text style={styles.weatherText}>▲ {this.state.currentMax}º</Text>
                                        <Text style={styles.weatherText}>▼ {this.state.currentMin}º</Text>
                                    </View>
                                </View>):
                                (<View style={styles.panelWeather}>
                                    <Text style={styles.weatherText}>Não foi possível carregar a {'\n'}previsão do tempo da cidade atual</Text>
                                    <Button
                                        title='Tentar novamente'
                                        buttonStyle={baseStyles.btnPositive}
                                        containerStyle={baseStyles.containerBtn}
                                        onPress={() => this._refreshCurrentLocation()}
                                        loading={this.state.loading} />
                                </View>)
                            }
                        </View>
                        {this.state.loaded &&
                            <View style={styles.panelBottom}>
                                <View style={styles.panelBottomDesc}>
                                    <Text style={[styles.weatherText, styles.h5]}>Amanhã</Text>
                                </View>
                                <View style={styles.panelBottomMM}>
                                    <Text style={styles.weatherText}>▲ {this.state.tomorrowMax}º</Text>
                                    <Text style={styles.weatherText}>▼ {this.state.tomorrowMin}º</Text>
                                </View>
                            </View>
                        }                
                    </ImageBackground >
                </View>
                <View style={baseStyles.container}>
                    <FlatList 
                        horizontal
                        data={this.state.travelList}
                        renderItem={({ item }) => <Travel  maxWidth={imageWidth} travel={item} onSeeMore={(place) => this._touchSeeMoreRestaurants(Util.mapToList(place.restaurants))} />}
                        keyExtractor={(item, index) => index.toString()}
                        style={{ flex:1,marginTop:8}}
                    />

                    {   this.state.travelList.length > 0 &&
                        <Button
                            title='VER TODAS'
                            buttonStyle={baseStyles.btnPositive}
                            containerStyle={baseStyles.containerBtn}
                            onPress={() => this.props.navigation.navigate('TravelList')}
                        />
                    }
                    <TextEmptyList
                        style={{ flex: 1 }}
                        text='Sem viagens registradas'
                        visible={this.state.travelList.length == 0 ? true : false}
                    /> 
                </View>
            </View>
        );
    }

    componentDidMount() {
        Orientation.lockToPortrait();
        //this.props.navigation.setParams({onSelected: (text) =>this._menuSelected(text)})
        this._requestRWPermission()

        let travelsCollection = TravelDB.selectTravelInProgressAndFuture(UserDB.selectCache(false))
        travelsCollection.addListener((travels, changes) => {
            changes.insertions.forEach(index => {
                let travelI = travels[index]
                this.setState({ travelList: [...this.state.travelList, travelI]})
            })
            changes.modifications.forEach(index => {
                let travelM = travels[index]
                let cTravelList = this.state.travelList
                let travelIndex = -1
                cTravelList.forEach((travel, index) => {
                    if (travel.id == travelM.id) {
                        travelIndex = index
                        return
                    }
                })
                if (travelIndex > -1) {
                    cTravelList.splice(travelIndex, 1, travelM)
                    this.setState({ travelList: cTravelList })
                }
            })

            changes.deletions.forEach(index => {
                let cTravelList = this.state.travelList
                cTravelList.splice(index,1)
                this.setState({ travelList: cTravelList })
            })
        })
        let travels = Object.keys(travelsCollection).length == 0 ? [] : travelsCollection.map(x => Object.assign({}, x))
        this.setState({travelList: travels})
    }

    _requestRWPermission = async () => {
        try {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
                {
                    'title': 'Permissão para armazenamento/leitura',
                    'message': 'É necessário a permissão para armazenar e acessar ' +
                        'as fotos dos restaurantes.'
                }
            )
            if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
                console.log("Permissão de armazenamento negada")
            }
            this._requestLocationPermission()
        } catch (err) {
            console.warn(err)
        }
    }

    _requestLocationPermission = async () =>{
        try {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                {
                    'title': 'Permissão para localização',
                    'message': 'É necessário a permissão para obter ' +
                        'a localização atual.'
                }
            )
            if (granted === PermissionsAndroid.RESULTS.GRANTED) {
                this._refreshCurrentLocation()
            } else {
                console.log("Permissão de localização negada")
            }
        } catch (err) {
            console.warn(err)
        }
    }

    _refreshCurrentLocation = () => {
        this.setState({loading:true})
        navigator.geolocation.getCurrentPosition(data => {
            Services.forecast(data.coords.latitude, data.coords.longitude, 0)
                .then(weather => {
                    this.setState({
                        currentWeather: weather.current,
                        currentMax: weather.max,
                        currentMin: weather.min,
                        city: weather.city
                    })
                }).catch(error => {
                    console.log(error.toString())
                    this.setState({ loading: false })
                })

            Services.forecast(data.coords.latitude, data.coords.longitude, 1)
                .then(weather => {
                    this.setState({
                        tomorrowWeather: weather.current,
                        tomorrowMax: weather.max,
                        tomorrowMin: weather.min,
                        loaded:true,
                        loading:false
                    })
                }).catch(error => {
                    console.log(error.toString())
                    this.setState({ loading: false })
                })
        },
        error => {
            console.log(error)
            this.setState({ loading: false })
        })
    }

    _touchSeeMoreRestaurants = (restaurants) => {
        this.props.navigation.navigate('RestaurantList', { restaurants })
    }
    
    _menuSelected = (text) => {
        switch (text) {
            case 'Nova viagem':
                this.props.navigation.navigate('Travel', { cmd: 0 })
                break
            case 'Configurações':
                this.props.navigation.navigate('Settings')
                break
        }
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1
    },
    panel: {
        height: this.imageHeight
    },
    panelContent: {
        flex: 1
    },
    panelHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width:'100%',
        paddingStart:12,
        paddingTop:6
    },
    panelWeather: {
        flex: 1,
        alignSelf: 'center',
        alignContent: 'center',
        justifyContent: 'center'
    },
    panelCurrent: {
        textAlign: 'center',
        fontWeight: 'bold',
        fontSize: 32
    },
    panelMM: {
        flexDirection: 'row'
    },
    panelBottom: {
        height: 35,
        backgroundColor: PRIMARY_COLOR,
        flexDirection: 'row',
        alignItems:'center',
        paddingStart:10,
        paddingTop:4,
        paddingEnd:10,
        paddingBottom:4,
        justifyContent: 'space-between'
    },
    panelBottomDesc: {},
    panelBottomMM: {
        flexDirection: 'row',
    },
    weatherText:{
        color:'white',
        textAlign:'center'
    },
    h4:{
        fontSize:20
    },
    h5:{
        fontSize:18
    }
});