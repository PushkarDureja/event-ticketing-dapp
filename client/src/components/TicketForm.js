import { Heading } from "@chakra-ui/react";
import React, { Component } from "react";
import { Button, Form, InputGroup, Modal, Spinner } from "react-bootstrap";
import {
  FaCalendar,
  FaCalendarAlt,
  FaEthereum,
  FaUserCircle,
  FaUsers,
} from "react-icons/fa";

import { handleError, toEvent } from "../helpers/utils";

class TicketForm extends Component {
  state = {
    event: null,
    isBuying: false,
    isPaymentSucceed: false,
    loaded: false,
    userAlreadyHasTheTicket: false,
    userIsTheOwner: false,
  };

  componentDidMount = async () => {
    await this.getEvent();
  };

  componentDidUpdate = async (prevProps, prevState) => {
    if (
      this.props.event !== prevProps.event ||
      (!this.state.loaded && this.state.loaded !== prevState.loaded)
    ) {
      await this.getEvent();
    }
  };

  getEvent = async () => {
    try {
      this.setState({ loaded: false });

      const { accounts, event: e, contract } = this.props;

      const [account] = accounts;

      if (e) {
        const event = await contract.methods.getEvent(e.id).call({
          from: account,
        });

        const userAlreadyHasTheTicket = await contract.methods
          .participantHasTicket(account, e.id)
          .call({
            from: account,
          });

        const userIsTheOwner = await contract.methods
          .organizerOwnsEvent(account, e.id)
          .call({
            from: account,
          });

        this.setState({
          event: toEvent(event, e.id),
          loaded: true,
          userAlreadyHasTheTicket,
          userIsTheOwner,
        });
      }
    } catch (error) {
      handleError(error);
    }
  };

  buyTicket = async (event) => {
    this.setState({ isBuying: true });

    const { accounts, contract } = this.props;

    try {
      await contract.methods.buyTicket(event.id).send({
        from: accounts[0],
        value: event.price,
      });

      this.setState({ isBuying: true, isPaymentSucceed: true });

      await this.getEvent();
    } catch (error) {
      handleError(error);

      this.setState({ isBuying: false, isPaymentSucceed: false });
    }
  };

  render() {
    const { onHide = () => {}, show = false } = this.props;

    const {
      event,
      isBuying,
      isPaymentSucceed,
      loaded,
      userAlreadyHasTheTicket,
      userIsTheOwner,
    } = this.state;

    let submitButtonChildren = null;
    const spinner = <Spinner animation="border" />;

    if (isBuying) {
      submitButtonChildren = isPaymentSucceed
        ? "Payment succeed! See your tickets in My Tickets page."
        : spinner;
    } else {
      if (userAlreadyHasTheTicket) {
        submitButtonChildren =
          "You are already own this ticket. See My Tickets page.";
      } else if (event && event.ended) {
        submitButtonChildren = "Can not buy ticket, event already ended.";
      } else if (event && event.soldOut) {
        submitButtonChildren = "Can not buy ticket, event already sold out.";
      } else {
        submitButtonChildren = "Buy Ticket";
      }
    }

    return (
      <Modal
        show={show}
        onHide={() => {
          this.setState(
            {
              event: null,
              isBuying: false,
              isPaymentSucceed: false,
              loaded: false,
            },
            () => {
              onHide();
            }
          );
        }}
        backdrop="static"
        keyboard={false}
        centered
      >
        <Modal.Header closeButton={!isBuying || isPaymentSucceed}>
          <Heading style={{ margin: "0 auto", color: "#1c316f" }}>
            Buy Ticket
          </Heading>
        </Modal.Header>
        <Modal.Body>
          {loaded ? (
            <Form
              onSubmit={(e) => {
                e.preventDefault();

                this.buyTicket(event);
              }}
            >
              <Form.Group>
                <InputGroup>
                  <InputGroup.Prepend>
                    <InputGroup.Text>
                      <FaCalendar style={{ color: "#1c316f" }} />
                    </InputGroup.Text>
                  </InputGroup.Prepend>
                  <Form.Control
                    style={{ backgroundColor: "#bee3f8" }}
                    value={event.name}
                    readOnly
                  />
                </InputGroup>
              </Form.Group>
              <Form.Group>
                <InputGroup>
                  <InputGroup.Prepend>
                    <InputGroup.Text>
                      <FaCalendarAlt style={{ color: "#1c316f" }} />
                    </InputGroup.Text>
                  </InputGroup.Prepend>
                  <Form.Control
                    style={{ backgroundColor: "#bee3f8" }}
                    value={`${event.startTimeDisplay} - ${event.endTimeDisplay}`}
                    readOnly
                  />
                </InputGroup>
              </Form.Group>
              <Form.Group>
                <InputGroup>
                  <InputGroup.Prepend>
                    <InputGroup.Text>
                      <FaUserCircle style={{ color: "#1c316f" }} />
                    </InputGroup.Text>
                  </InputGroup.Prepend>
                  <Form.Control
                    style={{ backgroundColor: "#bee3f8" }}
                    value={event.organizer}
                    readOnly
                  />
                </InputGroup>
              </Form.Group>
              <Form.Group>
                <InputGroup>
                  <InputGroup.Prepend>
                    <InputGroup.Text>
                      <FaEthereum style={{ color: "#1c316f" }} />
                    </InputGroup.Text>
                  </InputGroup.Prepend>
                  <Form.Control
                    style={{ backgroundColor: "#bee3f8" }}
                    value={event.priceInEth}
                    readOnly
                  />
                  <InputGroup.Append>
                    <InputGroup.Text>ETH</InputGroup.Text>
                  </InputGroup.Append>
                </InputGroup>
              </Form.Group>
              <Form.Group>
                <InputGroup>
                  <InputGroup.Prepend>
                    <InputGroup.Text>
                      <FaUsers style={{ color: "#1c316f" }} />
                    </InputGroup.Text>
                  </InputGroup.Prepend>
                  <Form.Control
                    style={{ backgroundColor: "#bee3f8" }}
                    value={`${event.soldCounter} / ${event.quota}`}
                    readOnly
                  />
                </InputGroup>
              </Form.Group>
              {!userIsTheOwner && (
                <Button
                  backgroundColor="rgb(55, 98, 221)"
                  type="submit"
                  block
                  disabled={
                    isBuying ||
                    userAlreadyHasTheTicket ||
                    event.ended ||
                    event.soldOut
                  }
                >
                  {submitButtonChildren}
                </Button>
              )}
            </Form>
          ) : (
            <div className="d-flex justify-content-center">{spinner}</div>
          )}
        </Modal.Body>
      </Modal>
    );
  }
}

export default TicketForm;
