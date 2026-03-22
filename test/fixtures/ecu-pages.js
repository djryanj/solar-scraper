const summaryHtml = `
<html>
  <body>
    <div id="ecu_title">Garage ECU</div>
    <div class="panel-body">
      <table>
        <tbody>
          <tr><td>Label</td><td>Value</td></tr>
          <tr><td>Total</td><td>1234.5 kWh</td></tr>
          <tr><td>Current</td><td>456 W</td></tr>
          <tr><td>Daily</td><td>12.34 kWh</td></tr>
        </tbody>
      </table>
    </div>
    <ul class="list-group">
      <li class="list-group-item"><center>ignore</center></li>
      <li class="list-group-item"><center>ignore</center></li>
      <li class="list-group-item"><center>ignore</center></li>
      <li class="list-group-item"><center>789 gallons</center></li>
      <li class="list-group-item"><center>321 trees</center></li>
      <li class="list-group-item"><center>654 kg</center></li>
    </ul>
  </body>
</html>
`;

const realtimeHtml = `
<html>
  <body>
    <table>
      <tr>
        <th>Inverter ID</th>
        <th>Current Power</th>
        <th>Grid Frequency</th>
        <th>Grid Voltage</th>
        <th>Temperature</th>
        <th>Reporting Time</th>
      </tr>
      <tr>
        <td>Z-2</td>
        <td>98 W</td>
        <td>59.9 Hz</td>
        <td>239 V</td>
        <td>44 C</td>
        <td>2026-03-20 10:00:00</td>
      </tr>
      <tr>
        <td>A-1</td>
        <td>101 W</td>
        <td rowspan="2" style="vertical-align: middle;">60.1 Hz</td>
        <td>240 V</td>
        <td rowspan="2" style="vertical-align: middle;">45 C</td>
        <td rowspan="2" style="vertical-align: middle;">2026-03-20 10:00:00</td>
      </tr>
      <tr>
        <td>A-2</td>
        <td>95 W</td>
        <td>238 V</td>
      </tr>
    </table>
  </body>
</html>
`;

module.exports = {
  summaryHtml,
  realtimeHtml,
};