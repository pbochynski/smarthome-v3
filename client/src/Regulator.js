import React, { Component } from 'react';
import { Label, Panel, Button } from 'react-bootstrap';

function heatingHeader(heater) {
    return (<div><h3>Heating</h3> 
    {heater ? (<Label bsStyle="success">ON</Label>):(<Label bsStyle="danger">OFF</Label>)}
    </div>);
}
function desiredTemp(regulator) {
    if (regulator.state==='auto') {
      return regulator.temperature+' °C';
    }
    return regulator.state==='on' ? 'ON' : 'OFF'

}
class Regulator extends Component {

    handler(reg) {
        return () => { console.log(reg); return this.props.onClick(reg)}; 
    }
    render() {
        return (<Panel header={heatingHeader(this.props.value.heater)}>
            <h1>{this.props.refSensor.t} °C</h1>
            <h5>Desired: {desiredTemp(this.props.value)}</h5>
            <Button bsStyle="danger" onClick={this.handler({state:'off'})}>OFF</Button>{' '}
            <Button bsStyle="primary" onClick={this.handler({state:'auto',temperature:19.4})} >OUT</Button>{' '}
            <Button bsStyle="info" onClick={this.handler({state:'auto',temperature:21.0})}>NIGHT</Button>{' '}
            <Button bsStyle="warning" onClick={this.handler({state:'auto',temperature:21.4})}>DAY</Button>{' '}
            <Button bsStyle="success" onClick={this.handler({state:'on'})}>ON</Button>
        </Panel>);
    }
}

export default Regulator;