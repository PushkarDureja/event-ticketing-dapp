import { Flex, Image, Text } from "@chakra-ui/react";
import React, { Component } from "react";
import { Link } from "react-router-dom";
import { MdEventSeat, MdEvent } from "react-icons/md";
import { ImTicket } from "react-icons/im";
import { TiGroup } from "react-icons/ti";
import { fromWei, getShortAddress, handleError } from "../helpers/utils";

const Tabs = [
  {
    id: Math.random(),
    icon: <MdEvent />,
    title: "Events",
    link: "/",
  },
  {
    id: Math.random(),
    icon: <MdEventSeat />,
    title: "My Events",
    link: "/my-events",
  },
  {
    id: Math.random(),
    icon: <ImTicket />,
    title: "My Tickets",
    link: "/my-tickets",
  },
];

class Navbar extends Component {
  eventCreatedListener = null;

  moneyWithdrawnListener = null;

  ticketIssuedListener = null;

  state = { account: "", balance: 0, loaded: false };

  componentDidMount = async () => {
    if (this.props.initialized) {
      await this.getAccount();

      this.listenToEventCreated();
      this.listenToMoneyWithdrawn();
      this.listenToTicketIssued();
    }
  };

  componentDidUpdate = async (prevProps) => {
    if (
      this.props.initialized &&
      this.props.initialized !== prevProps.initialized
    ) {
      await this.getAccount();

      this.listenToEventCreated();
      this.listenToMoneyWithdrawn();
      this.listenToTicketIssued();
    }

    if (this.props.accounts !== prevProps.accounts) {
      await this.getAccount();
    }
  };

  getAccount = async () => {
    try {
      this.setState({ loaded: false });

      const { accounts, web3 } = this.props;

      const [account] = accounts;

      const balance = await web3.eth.getBalance(account);

      this.setState({
        account: getShortAddress(account),
        balance: fromWei(balance),
        loaded: true,
      });
    } catch (error) {
      handleError(error);
    }
  };

  listenToEventCreated = () => {
    const { accounts, contract } = this.props;

    const event = "data";
    const callback = () => {
      this.getAccount();
    };

    if (this.eventCreatedListener) {
      this.eventCreatedListener.off(event, callback);
      this.eventCreatedListener = null;
    }

    const filter = { organizer: accounts[0] };

    this.eventCreatedListener = contract.events.EventCreated({ filter });
    this.eventCreatedListener.on(event, callback);
  };

  listenToMoneyWithdrawn = () => {
    const { accounts, contract } = this.props;

    const event = "data";
    const callback = () => {
      this.getAccount();
    };

    if (this.moneyWithdrawnListener) {
      this.moneyWithdrawnListener.off(event, callback);
      this.moneyWithdrawnListener = null;
    }

    const filter = { recipient: accounts[0] };

    this.moneyWithdrawnListener = contract.events.MoneyWithdrawn({ filter });
    this.moneyWithdrawnListener.on(event, callback);
  };

  listenToTicketIssued = () => {
    const { accounts, contract } = this.props;

    const event = "data";
    const callback = () => {
      this.getAccount();
    };

    if (this.ticketIssuedListener) {
      this.ticketIssuedListener.off(event, callback);
      this.ticketIssuedListener = null;
    }

    const filter = { participant: accounts[0] };

    this.ticketIssuedListener = contract.events.TicketIssued({ filter });
    this.ticketIssuedListener.on("data", () => {
      this.getAccount();
    });
  };

  render() {
    const { account, balance, loaded } = this.state;

    const Tab = ({ item }) => {
      return (
        <Link to={item.link} style={{ textDecoration: "none", width: "90%" }}>
          <Flex
            width={"100%"}
            color="#667085"
            fontWeight={"600"}
            fontSize="18px"
            alignItems={"center"}
            padding="10px 12px"
            borderRadius={"4px"}
            _hover={{ backgroundColor: "#273E66", color: "#fff" }}
            cursor="pointer"
            gap="20px"
            justifyContent={"center"}
          >
            {item.icon}
            <Text style={{ width: "100%" }}>{item.title}</Text>
          </Flex>
        </Link>
      );
    };

    return (
      <>
        <Flex
          flexDir={"column"}
          padding="20px"
          gap={"20px"}
          backgroundColor="#fff"
          width={"300px"}
          marginRight="20px"
          paddingTop={"20px"}
          pos="relative"
          borderRight={"2px solid #F6F9FF"}
          justify="space-between"
        >
          <Flex
            alignItems="center"
            gap={"10px"}
            flex="2"
            justifyContent={"center"}
          >
            <TiGroup color="#3762DD" fontSize={"40px"} />
            <Flex flexDir={"column"}>
              <Text
                fontSize={"30px"}
                color="#273E66"
                fontWeight={"600"}
                textAlign="center"
              >
                Eventall
              </Text>
              <Text fontSize={"18px"} color="#627fb1">
                All about your event
              </Text>
            </Flex>
          </Flex>

          <Flex flexDir="column" justify="flex-start" align={"center"} flex="4">
            {Tabs.map((item) => (
              <Tab item={item} key={item.id} />
            ))}
          </Flex>

          <Flex
            bgColor={"#F6F9FF"}
            borderRadius="4px"
            flexDir={"column"}
            padding="5px"
            justifyContent={"center"}
            minHeight={"100px"}
            flex="2"
          >
            <Text
              fontSize={"30px"}
              color="#273E66"
              fontWeight={"600"}
              textAlign="center"
            >
              User Account:
            </Text>
            <Text fontSize={"14px"} color="#273E66" textAlign="center">
              {account} ({balance} ETH)
            </Text>
          </Flex>
        </Flex>
      </>
    );
  }
}

export default Navbar;
