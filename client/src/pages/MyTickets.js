import React, { Component, Fragment } from "react";
import classNames from "classnames";
import { Col, Row, Spinner } from "react-bootstrap";

import { Pagination } from "../components";
import {
  arrayChunk,
  descPagination,
  handleError,
  toEvent,
} from "../helpers/utils";
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

class MyTickets extends Component {
  _isMounted = false;

  ticketIssuedListener = null;

  state = {
    loaded: false,
    page: 1,
    paginationHasPrev: false,
    paginationHasNext: false,
    perPage: 3,
    tickets: [],
    totalTickets: 0,
  };

  componentDidMount = async () => {
    this._isMounted = true;

    if (this.props.initialized) {
      await this.getTickets();

      this.listenToTicketIssued();
    }
  };

  componentDidUpdate = async (prevProps) => {
    if (
      this.props.initialized &&
      this.props.initialized !== prevProps.initialized
    ) {
      await this.getTickets();

      this.listenToTicketIssued();
    }
  };

  componentWillUnmount = () => {
    this._isMounted = false;
  };

  getTickets = async (page = 1) => {
    try {
      this.setState({ loaded: false, tickets: [] });

      const { accounts, contract } = this.props;

      const [account] = accounts;

      const ticketIds = await contract.methods.ticketsOfOwner(account).call({
        from: account,
      });

      const totalTickets = ticketIds.length;

      this.setState({ page, totalTickets }, async () => {
        const { page, perPage, totalTickets } = this.state;

        const {
          maxId,
          minId,
          hasPrev: paginationHasPrev,
          hasNext: paginationHasNext,
        } = descPagination(totalTickets, page, perPage);

        const tickets = [];

        for (let i = maxId; i > minId; i--) {
          const id = ticketIds[i];

          const event = await contract.methods.getEvent(id).call({
            from: account,
          });

          tickets.push(toEvent(event, id));
        }

        this.setState({
          loaded: true,
          paginationHasPrev,
          paginationHasNext,
          tickets: tickets,
        });
      });
    } catch (error) {
      handleError(error);
    }
  };

  listenToTicketIssued = () => {
    const { accounts, contract } = this.props;

    const event = "data";
    const callback = () => {
      if (this._isMounted) {
        this.getTickets();
      }
    };

    if (this.ticketIssuedListener) {
      this.moneyWithdrawnListener.off(event, callback);
      this.moneyWithdrawnListener = null;
    }

    const filter = { participant: accounts[0] };

    this.moneyWithdrawnListener = contract.events.TicketIssued({ filter });
    this.moneyWithdrawnListener.on(event, callback);
  };

  render() {
    const {
      loaded,
      page,
      paginationHasPrev,
      paginationHasNext,
      perPage,
      tickets,
      totalTickets,
    } = this.state;

    const fromData = (page - 1) * perPage + 1;
    const toData = paginationHasNext ? page * perPage : totalTickets;

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
        </Tr>
      );
    };

    return (
      <Flex flexDir={"column"} width={"100%"}>
        {loaded ? (
          tickets.length > 0 ? (
            <>
              <TableContainer>
                <Table variant="striped" colorScheme="blue" size="lg">
                  <TableCaption placement="top" fontSize={"24px"}>
                    Show all my tickets
                  </TableCaption>
                  <Thead>
                    <Tr>
                      <Th>Name</Th>
                      <Th>Start</Th>
                      <Th>End</Th>
                      <Th>Price</Th>
                      <Th>Organizer</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {tickets.map((item) => {
                      return <TableRowComponent event={item} />;
                    })}
                  </Tbody>
                </Table>
              </TableContainer>
            </>
          ) : (
            <p className="text-center">You have no tickets.</p>
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
        {tickets.length > 0 && (
          <Pagination
            from={fromData}
            hasPrev={paginationHasPrev}
            hasNext={paginationHasNext}
            onClickPrev={() => {
              this.getTickets(page - 1);
            }}
            onClickNext={() => {
              this.getTickets(page + 1);
            }}
            things="tickets"
            to={toData}
            total={totalTickets}
          />
        )}
      </Flex>
    );
  }
}

export default MyTickets;
