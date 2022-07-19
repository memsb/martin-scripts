const rp = require('request-promise');
const fs = require('fs');

const get_release = (component, environment) => {
    var options = {
        uri: `https://cosmos.api.bbci.co.uk/v1/services/${component}/${environment}`,
        cert: fs.readFileSync('/Users/bucklm03/Certs/devcert.pem'),
        json: true
    };
    
    return rp(options)
        .then(function (data) {
            console.log(data.deployments.current.release.version);
        })
}

module.exports = {
    get_release
}