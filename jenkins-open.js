const path = require('path');
const open = require('open');

const list = [
    "cosmos-patch-notifier",
    "ibl-cache-invalidator",
    "ibl-event-list-transformer",
    "ibl-graph-fallbacks-fetcher",
    "ibl-master-brands-fetcher",
    "ibl-missing-appw-events",
    "ibl-playback-interactions-queue-processor",
    "ibl-playback-interactions-transformer",
    "ibl-popularity-distributor",
    "ibl-programme-slices-fetcher",
    "ibl-channels-scoreboard-processor",
    "ibl-overall-programmes-scoreboard-processor",
    "ibl-overall-scoreboard-processor",
    "ibl-categories-scoreboard-processor",
    "ibl-popularity-janitor",
    "ibl-popularity-tracker",
    "ibl-scoreboard-fetcher"
  ];

  list.forEach((repo) => {
      const component = path.basename(repo)
      open(`https://jenkins7.ibl.api.bbci.co.uk/job/${component}`);
  });