import React, { Component, Fragment } from "react";
import { Col, Row, Spinner } from "react-bootstrap";
import { FaTicketAlt } from "react-icons/fa";
import { TicketForm, Pagination } from "../components";
import { descPagination, handleError, toEvent } from "../helpers/utils";
import {
  Table,
  TableCaption,
  TableContainer,
  Tbody,
  Th,
  Thead,
  Tr,
  Td,
  Flex,
  Box,
} from "@chakra-ui/react";

class Events extends Component {
  state = {
    events: [],
    loaded: false,
    page: 1,
    paginationHasPrev: false,
    paginationHasNext: false,
    perPage: 3,
    selectedEvent: null,
    showBuyTicket: false,
    totalEvents: 0,
  };

  componentDidMount = async () => {
    if (this.props.initialized) {
      await this.getEvents();
    }
  };

  componentDidUpdate = async (prevProps) => {
    if (
      this.props.initialized &&
      this.props.initialized !== prevProps.initialized
    ) {
      await this.getEvents();
    }
  };

  getEvents = async (page = 1) => {
    try {
      this.setState({ events: [], loaded: false });

      const { accounts, contract } = this.props;

      const totalEvents = await contract.methods.totalEvents().call({
        from: accounts[0],
      });

      this.setState({ page, totalEvents }, async () => {
        const { page, perPage, totalEvents } = this.state;

        const {
          maxId,
          minId,
          hasPrev: paginationHasPrev,
          hasNext: paginationHasNext,
        } = descPagination(totalEvents, page, perPage, false);

        const events = [];

        for (let i = maxId; i > minId; i--) {
          const event = await contract.methods.getEvent(i).call({
            from: accounts[0],
          });

          events.push(toEvent(event, i));
        }

        console.log("totalEvent", events);

        this.setState({
          events: events,
          loaded: true,
          paginationHasPrev,
          paginationHasNext,
        });
      });
    } catch (error) {
      handleError(error);
    }
  };

  render() {
    const { accounts, contract } = this.props;

    const {
      events,
      loaded,
      page,
      paginationHasPrev,
      paginationHasNext,
      perPage,
      selectedEvent,
      showBuyTicket,
      totalEvents,
    } = this.state;

    const fromData = (page - 1) * perPage + 1;
    const toData = paginationHasNext ? page * perPage : totalEvents;

    const TableRowComponent = (props) => {
      console.log("e", props.event);
      let event = props.event;
      return (
        <Tr>
          <Td>{event.shortName}</Td>
          <Td>{event.startTimeDisplay}</Td>
          <Td>{event.endTimeDisplay}</Td>
          <Td>{event.priceInEth} ETH</Td>
          <Td>{event.shortOrganizer}</Td>
          <Td
            onClick={() => {
              this.setState({
                selectedEvent: event,
                showBuyTicket: true,
              });
            }}
            style={{ cursor: "pointer" }}
          >
            <FaTicketAlt />
          </Td>
        </Tr>
      );
    };

    return (
      <Flex flexDir="column" flex="1" width={"100%"}>
        {loaded ? (
          events.length > 0 ? (
            <>
              <TableContainer>
                <Table variant="striped" colorScheme="blue" size="lg">
                  <TableCaption placement="top" fontSize={"24px"}>
                    Show All the current events
                  </TableCaption>
                  <Thead>
                    <Tr>
                      <Th>Name</Th>
                      <Th>Start</Th>
                      <Th>End</Th>
                      <Th>Price</Th>
                      <Th>Organizer</Th>
                      <Th>Buy</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {this.state.events.map((item) => {
                      return <TableRowComponent event={item} />;
                    })}
                  </Tbody>
                </Table>
              </TableContainer>
            </>
          ) : (
            <Box marginTop={"230"} marginLeft={"400"} style={{}}>
              <p
                className="text-center"
                style={{ padding: 50, border: "1px blue" }}
              >
                You have no events.
              </p>
            </Box>
          )
        ) : (
          <Box justify="center" align="center" width={"100%"} height="100%">
            <Spinner
              thickness="4px"
              speed="0.65s"
              emptyColor="gray.200"
              color="blue.500"
              size="xl"
              style={{ margin: "290px" }}
            />
          </Box>
        )}
        {events.length > 0 && (
          <Pagination
            from={fromData}
            hasPrev={paginationHasPrev}
            hasNext={paginationHasNext}
            onClickPrev={() => {
              this.getEvents(page - 1);
            }}
            onClickNext={() => {
              this.getEvents(page + 1);
            }}
            to={toData}
            total={totalEvents}
          />
        )}
        {loaded && (
          <TicketForm
            accounts={accounts}
            event={selectedEvent}
            contract={contract}
            onHide={() => {
              this.setState({ showBuyTicket: false });
            }}
            show={showBuyTicket}
          />
        )}
      </Flex>
    );
  }
}

export default Events;
