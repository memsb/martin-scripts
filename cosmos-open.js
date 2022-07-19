const path = require('path');
const open = require('open');
const { sleep } = require('./utils/sleep');

const services = [
  'bbc/cloud-varnish-test',
  'bbc/ibl-analytics-api',
  'bbc/ibl-appw-gateway',
  'bbc/ibl-broadcasts-api',
  'bbc/ibl-bundles-api',
  'bbc/ibl-clip-fetcher',
  'bbc/ibl-clip-poller',
  'bbc/ibl-clips-api',
  'bbc/ibl-credibl-api',
  'bbc/ibl-credibl-gif-generator',
  'bbc/ibl-curator-api',
  'bbc/ibl-databases',
  'bbc/ibl-documentation',
  'bbc/ibl-edibl',
  'bbc/ibl-editorial-metadata-api',
  'bbc/ibl-episode-notifier',
  'bbc/ibl-episodes-api',
  'bbc/ibl-graph-edge',
  'bbc/ibl-graph-fallbacks-handler',
  'bbc/ibl-graph-resolver',
  'bbc/ibl-group-episodes-fetcher',
  'bbc/ibl-group-fetcher',
  'bbc/ibl-group-poller',
  'bbc/ibl-groups-api',
  'bbc/ibl-highlights-api',
  'bbc/ibl-hubot',
  'bbc/ibl-inspector',
  'bbc/ibl-isite-fetcher',
  'bbc/ibl-isite-picker',
  'bbc/ibl-isite-proxy',
  'bbc/ibl-jenkins-agents-7',
  'bbc/ibl-jenkins-master-7',
  'bbc/ibl-list-fetcher',
  'bbc/ibl-list-poller',
  'bbc/ibl-lists-api',
  'bbc/ibl-master-brands-api',
  'bbc/ibl-metadata-errors-api',
  'bbc/ibl-metadata-errors-ingest',
  'bbc/ibl-nibl',
  'bbc/ibl-persisted-queries-api',
  'bbc/ibl-popularity-api-v2',
  'bbc/ibl-programme-ingest',
  'bbc/ibl-programmes-api',
  'bbc/ibl-programmes-api-icat',
  'bbc/ibl-promotions-poller',
  'bbc/ibl-promotions-service',
  'bbc/ibl-schedules-fetcher',
  'bbc/ibl-search',
  'bbc/ibl-slices-api',
  'bbc/ibl-smashibl-admin',
  'bbc/ibl-starfruit',
  'bbc/ibl-tag-api',
  'bbc/ibl-tag-extractor-v2',
  'bbc/ibl-universal-search',
  'bbc/ibl-user-activity',
  'bbc/ibl-user-play-writer',
  'bbc/ibl-variants-api',
  'bbc/iplayer-tools',
  'bbc/iplayer-tools-credits',
  'bbc/iplayer-tools-curator',
  'bbc/iplayer-tools-tags',
  'bbc/iplayer-tools-variants'
];


const required_on_live = [
  "bbc/ibl-appw-gateway",
  "bbc/ibl-credibl-gif-generator",
  "bbc/ibl-curator-api",
  "bbc/ibl-databases",
  "bbc/ibl-editorial-metadata-api",
  "bbc/ibl-group-fetcher",
  "bbc/ibl-groups-api",
  "bbc/ibl-highlights-api",
  "bbc/ibl-inspector",
  "bbc/ibl-list-fetcher",
  "bbc/ibl-lists-api",
  "bbc/ibl-metadata-errors-api",
  "bbc/ibl-persisted-queries-api",
  "bbc/ibl-popularity-api-v2",
  "bbc/ibl-programme-ingest",
  "bbc/ibl-search",
  "bbc/ibl-tag-api",
  "bbc/ibl-tag-extractor-v2",
  "bbc/ibl-universal-search",
]


const optional_in_git = [
  "bbc/ibl-bundles-api",
  "bbc/ibl-edibl",
  "bbc/ibl-episodes-api",
  "bbc/ibl-graph-edge",
  "bbc/ibl-graph-fallbacks-handler",
  "bbc/ibl-graph-resolver",
  "bbc/ibl-nibl",
  "bbc/ibl-user-activity",
  "bbc/ibl-user-play-writer",
];


const open_cosmos_test = (component) => {
  open(`https://cosmos.tools.bbc.co.uk/services/${component}/test/stacks/test-${component}-infrastructure-dev/update`);
}

const open_cosmos_live = (component) => {
  open(`https://cosmos.tools.bbc.co.uk/services/${component}/live/stacks/live-${component}-infrastructure-prod/update`);
}

const open_cosmos_service = (component) => {
  open(`https://cosmos.tools.bbc.co.uk/services/${component}`);
}

const open_jenkins = (component) => {
  open(`https://jenkins7.ibl.api.bbci.co.uk/job/${component}`);
}

const open_github = (component, path = '/blob/master/infrastructure/infrastructure/stacks/templates/infrastructure.json') => {
  open(`https://github.com/bbc/${component}${path}`);
}
const open_jenkinsfile = (component) => {
  open(`https://github.com/bbc/${component}/blob/master/Jenkinsfile`);
}

const open_all = async (group, action) => {
  for (let i = 0; i < group.length; i++) {
    await sleep(500);
    const component = path.basename(group[i]);
    action(component);
  }
};


open_all(services, open_jenkinsfile);