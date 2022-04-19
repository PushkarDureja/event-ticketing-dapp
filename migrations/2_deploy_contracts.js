const EventTicketing = artifacts.require("EventTicketing");

module.exports = (deployer) => {
  deployer.deploy(EventTicketing);
};
