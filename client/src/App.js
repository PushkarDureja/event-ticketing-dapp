import React, { Component, useState, useEffect } from "react";
import { HashRouter as Router, Route, Switch } from "react-router-dom";

import "bootstrap/dist/css/bootstrap.min.css";

import { Navbar } from "./components";
import EventContract from "./contracts/EventTicketing.json";
import getWeb3 from "./helpers/initWeb3";
import { Events, MyEvents, MyTickets } from "./pages";
import { handleError } from "./helpers/utils";

import { Box, Flex, Container } from "@chakra-ui/react";

function App() {
  const [config, setConfig] = useState({
    accounts: [],
    initialized: false,
    contract: null,
    web3: null,
  });

  async function callback() {
    try {
      const web3 = await getWeb3((accounts) => {
        setConfig((prev) => ({ ...prev, accounts }));
      });

      const accounts = await web3.eth.getAccounts();
      console.log("aaa", accounts);
      const networkId = await web3.eth.net.getId();

      // eslint-disable-next-line
      if (networkId != process.env.REACT_APP_NETWORK_ID) {
        throw new Error("You are connected to the wrong network.");
      }

      const deployedNetwork = EventContract.networks[networkId];

      if (!deployedNetwork) {
        throw new Error("contract has not deployed.");
      }

      const instance = new web3.eth.Contract(
        EventContract.abi,
        deployedNetwork.address
      );

      setConfig({
        accounts,
        initialized: true,
        instance,
        web3,
      });
    } catch (error) {
      handleError(error);
    }
  }

  useEffect(() => {
    callback();
  }, []);
  const { accounts, web3, initialized, instance: contract } = config;
  return (
    <Router>
      <Flex flexDir={"row"} gap="20px" width={"100vw"} height="100vh">
        <Navbar
          flex="1"
          accounts={accounts}
          initialized={initialized}
          contract={contract}
          web3={web3}
        />
        <Flex pt={50} justify="center" flex="4">
          <Switch>
            <Route path="/my-events">
              <MyEvents
                accounts={accounts}
                initialized={initialized}
                contract={contract}
                web3={web3}
              />
            </Route>
            <Route path="/my-tickets">
              <MyTickets
                accounts={accounts}
                initialized={initialized}
                contract={contract}
                web3={web3}
              />
            </Route>
            <Route path="/">
              <Events
                accounts={accounts}
                initialized={initialized}
                contract={contract}
                web3={web3}
              />
            </Route>
          </Switch>
        </Flex>
      </Flex>
    </Router>
  );
}

export default App;