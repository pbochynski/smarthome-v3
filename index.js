/*jslint es6 */
'use strict';

const app = require('./app');
const port = process.env.PORT || 3003;
app.listen(port);

console.log(`Smarthome listening on ${port}`);

process.on('SIGINT', function() {
    process.exit();
});