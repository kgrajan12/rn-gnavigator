import React from 'react';
import { View, Dimensions, Animated, BackHandler, AsyncStorage } from 'react-native';

const { width, height } = Dimensions.get('screen');

type Props = {};
export default class Stack extends React.Component<Props> {
    static defaultProps = {
        initialScreen: <View />,
        initialParam: '',
        initialScreenBackHandler: () => BackHandler.exitApp(),
        transitionDirection: 'horizontal',
        transitionDuration: 200,
        transition: 'none',
        type: 'normal',
        loginScreen: <View />,
        homeScreen: <View />,
        loginParam: '',
        logoutParam: ''
    };
    constructor(prop) {
        super(prop);
        this.state = {
            screen: [],
            state: {}
        };
    }
    componentWillMount() {
        AsyncStorage.getItem('appLogin', (err, res) => {
            let Screen;
            if (res != null) {
                const login = JSON.parse(res);
                if (login) {
                    Screen = this.props.homeScreen;
                } else {
                    Screen = this.props.loginScreen;
                }
            } else {
                Screen = this.props.loginScreen;
            }
            switch (this.props.type) {
                case 'normal': this.push({ Screen: this.props.initialScreen, param: this.props.initialParam }); break;
                case 'auth': this.push({ Screen, param: this.props.loginParam }); break;
                default: break;
            }
        });
        // if (this.props.initialScreen != undefined) {
        //     this.push({ Screen: this.props.initialScreen, param: this.props.initialParam });
        // }
        BackHandler.addEventListener('hardwareBackPress', () => {
            if (this.state.screen.length > 1) {
                this.pop();
            } else {
                this.props.initialScreenBackHandler();
            }
            return true;
        });
    }
    componentWillUnmount() {
        BackHandler.removeEventListener('hardwareBackPress');
    }
    push({ Screen, param }) {
        const screen = this.state.screen;
        const l = screen.length;
        let left, right, top, bottom, opacity;
        const duration = this.props.transitionDuration;
        switch (this.props.transitionDirection) {
            case 'horizontal':
                left = new Animated.Value(width);
                right = new Animated.Value(-width);
                top = new Animated.Value(0);
                bottom = new Animated.Value(0);
                break;
            case 'vertical':
                left = new Animated.Value(0);
                right = new Animated.Value(0);
                top = new Animated.Value(height);
                bottom = new Animated.Value(-height);
                break;
            case 'normal':
                left = new Animated.Value(0);
                right = new Animated.Value(0);
                top = new Animated.Value(0);
                bottom = new Animated.Value(0);
                break;
            default: break;
        }
        switch (this.props.transition) {
            case 'none': opacity = new Animated.Value(1); break;
            case 'fade': opacity = new Animated.Value(0); break;
            default: break;
        }
        screen.push({ Screen, left, right, top, bottom, opacity, param });
        this.setState({ screen });
        setTimeout(() => {
            Animated.parallel([
                Animated.timing(screen[l].left, {
                    toValue: 0, duration
                }),
                Animated.timing(screen[l].right, {
                    toValue: 0, duration
                }),
                Animated.timing(screen[l].top, {
                    toValue: 0, duration
                }),
                Animated.timing(screen[l].bottom, {
                    toValue: 0, duration
                }),
                Animated.timing(screen[l].opacity, {
                    toValue: 1, duration
                })
            ]).start();
        }, 1);
    }
    pop() {
        const screen = this.state.screen;
        const l = screen.length - 1;
        const duration = this.props.transitionDuration;
        let opacity;
        switch (this.props.transition) {
            case 'none': opacity = 1; break;
            case 'fade': opacity = 0; break;
            default: break;
        }
        switch (this.props.transitionDirection) {
            case 'horizontal':
                Animated.parallel([
                    Animated.timing(screen[l].left, {
                        toValue: width, duration
                    }),
                    Animated.timing(screen[l].right, {
                        toValue: -width, duration
                    }),
                    Animated.timing(screen[l].opacity, {
                        toValue: opacity, duration
                    })
                ]).start(() => {
                    screen.pop();
                    this.setState({ screen: screen });
                });
                break;
            case 'vertical':
                Animated.parallel([
                    Animated.timing(screen[l].top, {
                        toValue: height, duration
                    }),
                    Animated.timing(screen[l].bottom, {
                        toValue: -height, duration
                    }),
                    Animated.timing(screen[l].opacity, {
                        toValue: opacity, duration
                    })
                ]).start(() => {
                    screen.pop();
                    this.setState({ screen: screen });
                });
                break;
            case 'normal':
                screen.pop();
                this.setState({ screen: screen });
                break;
            default: break;
        }
    }
    restart() {
        const screen = [this.state.screen[0]];
        this.setState({ screen: [] });
        setTimeout(() => this.setState({ screen }), 1);
    }
    login() {
        const screen = [{ Screen: this.props.homeScreen, param: this.props.loginParam }];
        this.setState({ screen: [] });
        AsyncStorage.setItem('appLogin', 'true').then(() => {
            setTimeout(() => this.setState({ screen }), 1);
        });
    }
    logout() {
        const screen = [{ Screen: this.props.loginScreen, param: this.props.logoutParam }];
        this.setState({ screen: [] });
        AsyncStorage.setItem('appLogin', 'false').then(() => {
            setTimeout(() => this.setState({ screen }), 1);
        });
    }
    setComponentState(param) {
        this.setState({
            state: {
                ...this.state.state,
                ...param
            }
        });
    }
    render() {
        const screen = this.state.screen;
        const l = screen.length - 1;
        const style = {
            position: 'absolute',
            width,
            height
        }
        return (
            <View style={{ flex: 1 }}>
                {screen.map(({ Screen, left, right, top, bottom, opacity, param }, i) => <Animated.View key={i} style={{ ...style, left, opacity, right, top, bottom, zIndex: l === i ? i + 10 : i, elevation: l === i ? i + 10 : i }}>
                    <Screen
                        state={this.state.state}
                        setState={param => this.setComponentState(param)}
                        push={(page) => this.push(page)}
                        restart={() => this.restart()}
                        pop={() => this.pop()}
                        pushedData={param}
                        login={() => this.login()}
                        logout={() => this.logout()}
                    />
                </Animated.View>)}
            </View>
        );
    }
}