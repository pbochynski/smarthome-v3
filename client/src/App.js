import React, { Component } from 'react';
import Regulator from './Regulator';
import Sensor from './Sensor';
import { Button } from 'react-bootstrap';
import jwtDecode from 'jwt-decode';
import './App.css';
import './index.css';


class App extends Component {
  // Initialize state
  state = {
    regulator: { state: "auto", temperature: 21.4, deviation: 0.1, sensor: "13914015", heater: 0 },
    metrics: [],
    lastUpdate: new Date().getTime(),
    token: localStorage.getItem("id_token"),
    connected: false,
  };

  regulatorUpdate = (regulator) => {
    this.setState((prevState, props) => {
      let params = Object.assign({}, prevState.regulator, regulator);
      fetch(`/regulator?state=${params.state}&temperature=${params.temperature}`,
        {
          headers: { "Authorization": "Bearer " + this.state.token }
          , method: "POST"
        });
      return { regulator: params }
    });
  }
  responseGoogle = (response) => {
    console.log(response);
    localStorage.setItem("id_token", response.tokenId);
    this.setState({ token: response.tokenId });
    this.getMetrics();
  }

  handleToken() {
    if (window.location.hash) {
      const regex = /id_token=([^&]*)/;
      const str = window.location.hash;
      let m = regex.exec(str);
      if (m !== null && m.length >= 1) {
        localStorage.setItem("id_token", m[1]);
        localStorage.setItem("login_hint", jwtDecode(m[1]).email);
        this.setState({ token: m[1] });
        window.history.pushState("", document.title, window.location.pathname
          + window.location.search);
      }
    } else {
      if (localStorage.getItem("login_hint") && localStorage.getItem("id_token")) {
        this.login();
      }
    }
  }
  // Fetch passwords after first mount
  componentDidMount() {
    this.handleToken();
    setInterval(
      () => {
        this.setState((prevState, props) => {
          let elapsed = (new Date().getTime() - prevState.lastUpdate) / 1000;
          if (elapsed > 10 && this.state.connected) {
            this.getMetrics();
          }
          return { sinceLastUpdate: elapsed }
        })
      },
      1000
    );
    this.getMetrics();
  }
  login = () => {
    const clientId = "111955432370-0r8pj7ueegnukqsoa9othk8pgnkdvtju.apps.googleusercontent.com";
    const scopes = "email%20profile%20openid";
    const login_hint = encodeURI(localStorage.getItem("login_hint") || "");
    const href = encodeURI(window.location.href.split('#')[0]);
    console.log("href: " + href);
    console.log("login_hint: " + login_hint);
    let redirect = `https://accounts.google.com/o/oauth2/auth?redirect_uri=${href}&response_type=id_token&scope=${scopes}&login_hint=${login_hint}&client_id=${clientId}&gsiwebsdk=2`
    window.location.assign(redirect);
  }

  logout = () => {
    console.log("Logout");
    localStorage.removeItem("id_token");
    localStorage.removeItem("login_hint");
    this.setState({
      regulator: {},
      metrics: [],
      token: null,
      connected: false
    });

  }
  onDisconnect = (error) => {
    this.setState({ connected: false });
  }
  getMetrics = () => {
    // Get the passwords and store them in state
    fetch('/metrics', { headers: { "Authorization": "Bearer " + localStorage.getItem("id_token") } })
      .then(res => { return (res.status === 200) ? res.json() : [] })
      .then(metrics => this.setState({ metrics, connected: metrics.length > 0 }))
      .then(() => { this.setState({ lastUpdate: new Date().getTime() }); })
      .catch(this.onDisconnect);
    fetch('/regulator', { headers: { "Authorization": "Bearer " + localStorage.getItem("id_token") } })
      .then(res => { return res.status === 200 ? res.json() : {} })
      .then(regulator => this.setState({ regulator, connected: regulator.state !== undefined }));
  }
  getRefSensorMetric = () => {
    const refChipId = this.state.regulator.sensor;
    const filtered = this.state.metrics.filter((metric) => { return metric.chipId === refChipId });
    return filtered.length ? filtered[0] : {};
  }

  render() {
    return (

      <div className="App">
        {this.state.connected ?
          <div>
            <Regulator value={this.state.regulator} refSensor={this.getRefSensorMetric()} onClick={this.regulatorUpdate} />
            <Sensor metrics={this.state.metrics} />
          </div> : <h1>No connection</h1>
        }
        <Button bsStyle="primary" onClick={this.getMetrics}>Refresh</Button>{' '}
        <Button bsStyle="primary" onClick={this.login}>Login</Button>{' '}
        <Button bsStyle="primary" onClick={this.logout}>Logout</Button>{' '}

        <p><br />Last update: {Math.round(this.state.sinceLastUpdate)} seconds ago</p>
      </div>
    );
  }
}

export default App;