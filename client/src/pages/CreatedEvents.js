import React, { Component, Fragment } from "react";
import classNames from "classnames";
import { MdCreate } from "react-icons/md";
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
  Button,
  Box,
  Spinner,
} from "@chakra-ui/react";

import { EventForm, Pagination, WithdrawalForm } from "../components";
import {
  arrayChunk,
  descPagination,
  handleError,
  toEvent,
} from "../helpers/utils";

class MyEvents extends Component {
  _isMounted = false;

  ticketIssuedListener = null;

  state = {
    events: [],
    loaded: false,
    page: 1,
    paginationHasPrev: false,
    paginationHasNext: false,
    perPage: 3,
    selectedEvent: null,
    showCreate: false,
    showWithdrawal: false,
    totalEvents: 0,
  };

  componentDidMount = async () => {
    this._isMounted = true;

    if (this.props.initialized) {
      await this.getEvents();

      this.listenToTicketIssued();
    }
  };

  componentDidUpdate = async (prevProps) => {
    if (
      this.props.initialized &&
      this.props.initialized !== prevProps.initialized
    ) {
      await this.getEvents();

      this.listenToTicketIssued();
    }
  };

  componentWillUnmount = () => {
    this._isMounted = false;
  };

  getEvents = async (page = 1, reload = true) => {
    try {
      if (reload) {
        this.setState({ events: [], loaded: false });
      }

      const { accounts, contract } = this.props;

      const [account] = accounts;

      const eventIds = await contract.methods.eventsOfOwner(account).call({
        from: account,
      });

      const totalEvents = eventIds.length;

      this.setState({ page, totalEvents }, async () => {
        const { page, perPage, totalEvents } = this.state;

        const {
          maxId,
          minId,
          hasPrev: paginationHasPrev,
          hasNext: paginationHasNext,
        } = descPagination(totalEvents, page, perPage);

        const events = [];

        for (let i = maxId; i > minId; i--) {
          const id = eventIds[i];

          const event = await contract.methods.getEvent(id).call({
            from: account,
          });

          events.push(toEvent(event, id));
        }

        this.setState(
          {
            events: events,
            loaded: true,
            paginationHasPrev,
            paginationHasNext,
          },
          () => {
            this.listenToTicketIssued();
          }
        );
      });
    } catch (error) {
      handleError(error);
    }
  };

  listenToTicketIssued = () => {
    const { contract } = this.props;
    const { events, page } = this.state;

    const event = "data";
    const callback = () => {
      if (this._isMounted) {
        this.getEvents(page, false);
      }
    };

    if (this.ticketIssuedListener) {
      this.moneyWithdrawnListener.off(event, callback);
      this.moneyWithdrawnListener = null;
    }

    const eventIds = [];

    for (const e of events) {
      eventIds.push(e.id);
    }

    const filter = { eventId: eventIds };

    this.moneyWithdrawnListener = contract.events.TicketIssued({ filter });
    this.moneyWithdrawnListener.on(event, callback);
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
      showCreate,
      showWithdrawal,
      totalEvents,
    } = this.state;

    const fromData = (page - 1) * perPage + 1;
    const toData = paginationHasNext ? page * perPage : totalEvents;

    const TableRowComponent = (props) => {
      console.log("e", props.event);
      let event = props.event;
      return (
        <Tr>
          <Td
            onClick={() => {
              this.setState({
                selectedEvent: event,
                showWithdrawal: true,
              });
            }}
            style={{ cursor: "pointer" }}
          >
            {event.shortName}
          </Td>
          <Td>{event.startTimeDisplay}</Td>
          <Td>{event.endTimeDisplay}</Td>
          <Td>{event.priceInEth} ETH</Td>
          <Td> {`${event.soldCounter} / ${event.quota}`}</Td>
        </Tr>
      );
    };

    return (
      <Flex flexDir={"column"}>
        {loaded ? (
          <Flex className="mt-1 position-relative">
            <div>
              <Button
                onClick={() => {
                  this.setState({ showCreate: true });
                }}
                leftIcon={<MdCreate />}
                colorScheme="blue"
                variant="outline"
              >
                Create
              </Button>
            </div>
          </Flex>
        ) : null}
        {loaded ? (
          events.length > 0 ? (
            <>
              <TableContainer>
                <Table variant="striped" colorScheme="blue" size="lg">
                  <TableCaption placement="top" fontSize={"24px"}>
                    Show my events
                  </TableCaption>
                  <Thead>
                    <Tr>
                      <Th>Name</Th>
                      <Th>Start</Th>
                      <Th>End</Th>
                      <Th>Price</Th>
                      <Th>Sold</Th>
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
              style={{ marginTop: "250px", marginLeft: "400px" }}
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
          <Fragment>
            <EventForm
              accounts={accounts}
              contract={contract}
              onHide={() => {
                this.setState({ showCreate: false });

                this.getEvents(1, false);
              }}
              show={showCreate}
            />
            <WithdrawalForm
              accounts={accounts}
              event={selectedEvent}
              contract={contract}
              onHide={() => {
                this.setState({ showWithdrawal: false });

                this.getEvents(page, false);
              }}
              show={showWithdrawal}
            />
          </Fragment>
        )}
      </Flex>
    );
  }
}

export default MyEvents;
