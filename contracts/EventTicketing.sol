pragma solidity ^0.7.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/GSN/Context.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/EnumerableSet.sol";

contract EventTicketing is Context, Ownable {
    using EnumerableSet for EnumerableSet.AddressSet;
    using EnumerableSet for EnumerableSet.UintSet;
    using SafeMath for uint;

    struct Event {
        string name;

        address organizer;

        uint startTime;

        uint endTime;

        uint price;

        uint quota;

        string currency;
    }

    Event[] private _events;

    mapping(address => EnumerableSet.UintSet) private _organizerToEventIdsOwned;

    mapping(uint => EnumerableSet.AddressSet) private _eventParticipants;

    mapping(address => EnumerableSet.UintSet) private _participantToEventIdsOwned;

    string constant public nativeCurrency = "ETH";

    string[] public supportedTokenNames;

    mapping(string => address) public supportedTokens;

    mapping(uint => uint) private _moneyJar;

    modifier validEventId(uint _eventId) {
        require(_eventId > 0, "  event ID must be at least one.");
        require(
            _eventId < _events.length,
            "  event ID must be lower than `_events` length."
        );
        _;
    }

    event EventCreated(uint indexed newEventId, address indexed organizer);

    event TicketIssued(uint indexed eventId, address indexed participant);

    event MoneyWithdrawn(
        uint indexed eventId, address indexed recipient, uint amount
    );

    event TokenAdded(
        string indexed tokenName,
        address indexed tokenAddress,
        address indexed addedBy
    );

    constructor() {
        _createEvent(
            "Genesis",
            address(this),
            block.timestamp,
            block.timestamp,
            1 wei,
            0,
            nativeCurrency
        );
    }

    function addNewToken(string memory _tokenName, address _tokenAddress)
        external
        onlyOwner
    {
        require(
            _usingToken(_tokenName),
            "  Can not register native currency name."
        );
        require(
            _tokenAddress != address(0),
            "  Given address is not a valid address."
        );
        require(
            supportedTokens[_tokenName] == address(0),
            "  Token is already registered."
        );

        supportedTokens[_tokenName] = _tokenAddress;
        supportedTokenNames.push(_tokenName);

        emit TokenAdded(_tokenName, _tokenAddress, _msgSender());
    }

    function buyTicket(uint _eventId) external payable validEventId(_eventId) {
        Event memory e = _events[_eventId];
        address participant = _msgSender();
        bool payWithToken = _usingToken(e.currency);

        IERC20 token;
        if (payWithToken) {
            token = IERC20(supportedTokens[e.currency]);
        }

        require(
            participant != e.organizer,
            "  Organizer can not buy their own event."
        );
        require(
            block.timestamp < e.endTime,
            "  Can not buy ticket from an event that already ended."
        );

        if (payWithToken) {
            uint allowance = token.allowance(participant, address(this));

            require(
                allowance >= e.price,
                "  Allowance is insufficient."
            );

            uint balance = token.balanceOf(participant);

            require(
                balance >= e.price,
                "  Balance is insufficient."
            );
        } else {
            require(
                msg.value == e.price,
                "  Must pay exactly same with the price."
            );
        }

        require(
            _eventParticipants[_eventId].length() < e.quota,
            "  No quota left."
        );
        require(
            _eventParticipants[_eventId].contains(participant) == false,
            "  Participant already bought the ticket."
        );

        if (payWithToken) {
            bool transferSucceed = token.transferFrom(
                participant, address(this), e.price
            );

            require(transferSucceed, "  Transfer token failed.");
        }

        _moneyJar[_eventId] = _moneyJar[_eventId].add(e.price);

        _buyTicket(_eventId, participant);
    }

    function createEvent(
        string calldata _name,
        uint _startTime,
        uint _endTime,
        uint _price,
        uint _quota,
        string calldata _currency
    )
        external
        returns (uint)
    {
        require(_quota > 0, "  `_quota` must be at least one.");
        require(
            _startTime > block.timestamp,
            "  `_startTime` must be greater than `block.timestamp`."
        );
        require(
            _endTime > _startTime,
            "  `_endTime` must be greater than `_startTime`."
        );
        require(
            (
                _usingEther(_currency) ||
                supportedTokens[_currency] != address(0)
            ),
            "  `_currency` is invalid."
        );

        uint newEventId = _createEvent(
            _name,
            _msgSender(),
            _startTime,
            _endTime,
            _price,
            _quota,
            _currency
        );

        return newEventId;
    }

    function eventsOfOwner(address _address)
        external
        view
        returns (uint[] memory)
    {
        uint eventsCount = eventsOf(_address);

        uint[] memory eventIds = new uint[](eventsCount);

        for (uint i = 0; i < eventsCount; i++) {
            eventIds[i] = _organizerToEventIdsOwned[_address].at(i);
        }

        return eventIds;
    }

    function getEvent(uint _id)
        external
        view
        validEventId(_id)
        returns (
            string memory,
            address,
            uint,
            uint,
            uint,
            uint,
            uint,
            uint,
            string memory
        )
    {
        Event memory e = _events[_id];
        uint soldCounter = _eventParticipants[_id].length();
        uint moneyCollected = _moneyJar[_id];

        return (
            e.name,
            e.organizer,
            e.startTime,
            e.endTime,
            e.price,
            e.quota,
            soldCounter,
            moneyCollected,
            e.currency
        );
    }

    function organizerOwnsEvent(address _organizer, uint _eventId)
        external
        view
        validEventId(_eventId)
        returns (bool)
    {
        return _organizerToEventIdsOwned[_organizer].contains(_eventId);
    }

    function participantHasTicket(address _participant, uint _eventId)
        external
        view
        validEventId(_eventId)
        returns (bool)
    {
        return _participantToEventIdsOwned[_participant].contains(_eventId);
    }

    function ticketsOfOwner(address _address)
        external
        view
        returns (uint[] memory)
    {
        uint ticketsCount = ticketsOf(_address);

        uint[] memory eventIds = new uint[](ticketsCount);

        for (uint i = 0; i < ticketsCount; i++) {
            eventIds[i] = _participantToEventIdsOwned[_address].at(i);
        }

        return eventIds;
    }

    function totalEvents() external view returns (uint) {
        return _events.length - 1;
    }

    function withdrawMoney(uint _eventId) external validEventId(_eventId) {
        address payable sender = _msgSender();

        Event memory e = _events[_eventId];

        require(
            sender == e.organizer,
            "  Sender is not the event owner."
        );
        require(
            block.timestamp > e.endTime,
            "  Money only can be withdrawn after the event ends."
        );

        uint amount = _moneyJar[_eventId];

        _moneyJar[_eventId] = 0;

        if (_usingEther(e.currency)) {
            sender.transfer(amount);
        } else {
            IERC20 token = IERC20(supportedTokens[e.currency]);

            token.transfer(sender, amount);
        }

        emit MoneyWithdrawn(_eventId, sender, amount);
    }

    function eventsOf(address _address) public view returns (uint) {
        return _organizerToEventIdsOwned[_address].length();
    }

    function ticketsOf(address _address) public view returns (uint) {
        return _participantToEventIdsOwned[_address].length();
    }

    function totalSupportedTokens() public view returns (uint) {
        return supportedTokenNames.length;
    }

    function _buyTicket(uint _eventId, address _participant) private {
        _eventParticipants[_eventId].add(_participant);

        _participantToEventIdsOwned[_participant].add(_eventId);

        emit TicketIssued(_eventId, _participant);
    }

    function _createEvent(
        string memory _name,
        address _organizer,
        uint _startTime,
        uint _endTime,
        uint _price,
        uint _quota,
        string memory _currency
    )
        private
        returns (uint)
    {
        Event memory _event = Event({
            name: _name,
            organizer: _organizer,
            startTime: _startTime,
            endTime: _endTime,
            price: _price,
            quota: _quota,
            currency: _currency
        });

        _events.push(_event);

        uint newEventId = _events.length - 1;

        _organizerToEventIdsOwned[_organizer].add(newEventId);

        emit EventCreated(newEventId, _organizer);

        return newEventId;
    }

    function _usingEther(string memory _currency) private pure returns (bool) {
        return (
            keccak256(abi.encodePacked((nativeCurrency))) == keccak256(abi.encodePacked((_currency)))
        );
    }

    function _usingToken(string memory _currency) private pure returns (bool) {
        return !_usingEther(_currency);
    }
}
