const path = require('path');
const open = require('open');

const open_component_in_jenkins = (repo) => {
    const component = path.basename(repo)
    open(`https://jenkins7.ibl.api.bbci.co.uk/job/${component}`);
}

const open_component_in_cosmos = (repo) => {
    const component = path.basename(repo)
    open(`https://cosmos.tools.bbc.co.uk/services/${component}#live`);
}

const open_components_in_cosmos = (links) => {
    if (Array.isArray(links)) {
        links.forEach((repo) => open_component_in_cosmos(repo));
    } else {
        open_component_in_cosmos(links);
    }
}

module.exports = {
    open_component_in_cosmos,
    open_components_in_cosmos,
    open_component_in_jenkins
}