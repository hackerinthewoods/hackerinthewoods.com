#!/usr/bin/env node

const { App } = require("@aws-cdk/core");
const { WebsiteStack } = require("../infra/stack/website");
const app = new App();

new WebsiteStack(app, "Website", {
  stackName: "HackerInTheWoodsDotCom-Stack",
  description: "Stack for the hackerinthewoods.com website.",
  env: {
    region: "us-east-1",
  },
});

app.synth();
