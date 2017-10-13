import React, { Component } from 'react';
import GoogleLogin from 'react-google-login';
import Regulator from './Regulator';
import Sensor from './Sensor';
import { Button } from 'react-bootstrap';
import './App.css';
import './index.css';


class App extends Component {
  // Initialize state
  state = {
    regulator: { state: "auto", temperature: 21.4, deviation: 0.1, sensor: "13914015", heater: 0 },
    metrics: [],
    lastUpdate: new Date().getTime(),
    token: localStorage.getItem("id_token")
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
  // Fetch passwords after first mount
  componentDidMount() {
    if (window.location.hash) {
      const regex = /id_token=([^&]*)/;
      const str = window.location.hash;
      let m;
      if ((m = regex.exec(str)) !== null && m.length >= 1) {
        localStorage.setItem("id_token", m[1]);
        this.setState({ token: m[1] });
      }
    }
    setInterval(
      () => { this.setState((prevState, props) => { return { sinceLastUpdate: (new Date().getTime() - prevState.lastUpdate) / 1000 } }) },
      1000
    );
    this.getMetrics();    
  }

  logout = () => {
    console.log("Logout");
    localStorage.removeItem("id_token");
    this.setState({
      regulator: {},
      metrics: [],
      token: null
    });

  }
  getMetrics = () => {
    // Get the passwords and store them in state
    fetch('/metrics', { headers: { "Authorization": "Bearer " + localStorage.getItem("id_token")} })
      .then(res => { return res.status === 200 ? res.json() : [] })
      .then(metrics => this.setState({ metrics }))
      .then(() => { this.setState({ lastUpdate: new Date().getTime() }) });
    fetch('/regulator', { headers: { "Authorization": "Bearer " + localStorage.getItem("id_token")} })
      .then(res => { return res.status === 200 ? res.json() : {} })
      .then(regulator => this.setState({ regulator }));
  }
  getRefSensorMetric = () => {
    const refChipId = this.state.regulator.sensor;
    const filtered = this.state.metrics.filter((metric) => { return metric.chipId === refChipId });
    return filtered.length ? filtered[0] : {};
  }

  render() {
    return (
      <div className="App">
        <Regulator value={this.state.regulator} refSensor={this.getRefSensorMetric()} onClick={this.regulatorUpdate} />
        <Sensor metrics={this.state.metrics} />
        <Button bsStyle="primary" onClick={this.getMetrics}>Refresh</Button>{' '}
        <GoogleLogin
          className="btn btn-primary"
          clientId="111955432370-0r8pj7ueegnukqsoa9othk8pgnkdvtju.apps.googleusercontent.com"
          buttonText="Login"
          onSuccess={this.responseGoogle}
          onFailure={this.responseGoogle}
          uxMode="redirect"
        />{' '}
        <Button bsStyle="primary" onClick={this.logout}>Logout</Button>{' '}

        <p><br />Last update: {this.state.sinceLastUpdate} seconds ago</p>
      </div>
    );
  }
}

export default App;