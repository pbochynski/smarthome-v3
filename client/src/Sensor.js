import React, { Component } from 'react';
import { Table, Panel, Label } from 'react-bootstrap';

function ageToColor(age) {
    return age<80 ? "success" : (age<140 ? "warning": "danger")
}
function voltageToColor(v) {
    return v>3.3 ? "success" : v>3.2 ? "warning" :"danger";
} 
function labelText(metric) {
    const age = metric.age>140 ? ' '+ metric.age +' sec ago': '';
    return metric.alias+' ('+metric.chipId+')'+age;
}
function renderRow(metric) {    
    return (<tr align="left" key={metric.chipId}>
        <td><Label bsStyle={ageToColor(metric.age)}>
        {labelText(metric)}</Label></td>
        <td>{metric.t} °C</td>
        <td><Label bsStyle={voltageToColor(metric.vcc)}>{metric.vcc} V</Label></td>
    </tr>)
}
class Sensor extends Component {

    render() {
    return (<Panel header={<h3>Metrics</h3>}>
            <Table><tbody>
                {this.props.metrics.map(renderRow)}    
            </tbody></Table>            
        </Panel>);
    }
}

export default Sensor;