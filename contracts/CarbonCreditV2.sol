```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./CarbonCredit.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract CarbonCreditV2 is CarbonCredit {
    using SafeMath for uint256;

    struct Order {
        address trader;
        uint256 creditId;
        uint256 quantity;
        uint256 price;
        uint256 expiry;
        OrderType orderType;
        OrderSide side;
        bool active;
    }

    enum OrderType { MARKET, LIMIT, STOP }
    enum OrderSide { BUY, SELL }

    mapping(bytes32 => Order) public orders;
    mapping(address => bytes32[]) public userOrders;
    mapping(uint256 => uint256) public lastTradePrice;

    event OrderPlaced(
        bytes32 indexed orderId,
        address indexed trader,
        uint256 creditId,
        uint256 quantity,
        uint256 price,
        OrderType orderType,
        OrderSide side
    );
    
    event OrderFilled(
        bytes32 indexed orderId,
        address indexed trader,
        uint256 creditId,
        uint256 quantity,
        uint256 price
    );
    
    event OrderCancelled(bytes32 indexed orderId);

    constructor(address[] memory _owners, uint256 _required) 
        CarbonCredit(_owners, _required) 
    {}

    function placeOrder(
        uint256 _creditId,
        uint256 _quantity,
        uint256 _price,
        OrderType _type,
        OrderSide _side,
        uint256 _expiry
    ) external nonReentrant whenNotPaused returns (bytes32) {
        require(_quantity > 0, "Invalid quantity");
        require(_price > 0, "Invalid price");
        require(_expiry > block.timestamp, "Invalid expiry");

        // For sell orders, check balance
        if (_side == OrderSide.SELL) {
            require(
                balanceOf(msg.sender, _creditId) >= _quantity,
                "Insufficient balance"
            );
        }

        bytes32 orderId = keccak256(
            abi.encodePacked(
                msg.sender,
                _creditId,
                _quantity,
                _price,
                _type,
                _side,
                block.timestamp
            )
        );

        orders[orderId] = Order({
            trader: msg.sender,
            creditId: _creditId,
            quantity: _quantity,
            price: _price,
            expiry: _expiry,
            orderType: _type,
            side: _side,
            active: true
        });

        userOrders[msg.sender].push(orderId);

        emit OrderPlaced(
            orderId,
            msg.sender,
            _creditId,
            _quantity,
            _price,
            _type,
            _side
        );

        // Try to match order immediately
        matchOrder(orderId);

        return orderId;
    }

    function cancelOrder(bytes32 _orderId) external nonReentrant {
        Order storage order = orders[_orderId];
        require(order.trader == msg.sender, "Not order owner");
        require(order.active, "Order not active");

        order.active = false;
        emit OrderCancelled(_orderId);
    }

    function matchOrder(bytes32 _orderId) internal {
        Order storage order = orders[_orderId];
        
        // Skip if order is no longer active or expired
        if (!order.active || block.timestamp > order.expiry) {
            return;
        }

        // For stop orders, check if trigger price is reached
        if (order.orderType == OrderType.STOP) {
            uint256 currentPrice = lastTradePrice[order.creditId];
            if (order.side == OrderSide.SELL && currentPrice > order.price) {
                return;
            }
            if (order.side == OrderSide.BUY && currentPrice < order.price) {
                return;
            }
        }

        // Find matching orders
        bytes32[] memory matchingOrders = findMatchingOrders(order);
        
        for (uint i = 0; i < matchingOrders.length && order.quantity > 0; i++) {
            executeMatch(order, orders[matchingOrders[i]]);
        }
    }

    function findMatchingOrders(Order memory _order) internal view returns (bytes32[] memory) {
        // Implementation for finding matching orders
        // This would typically search through the order book for matching prices
        // Return array of matching order IDs
    }

    function executeMatch(Order storage _order1, Order storage _order2) internal {
        require(_order1.active && _order2.active, "Orders must be active");
        require(_order1.side != _order2.side, "Orders must be opposite sides");

        uint256 matchQuantity = min(_order1.quantity, _order2.quantity);
        uint256 matchPrice = calculateMatchPrice(_order1, _order2);

        // Transfer tokens
        if (_order1.side == OrderSide.BUY) {
            _transfer(_order2.trader, _order1.trader, _order1.creditId, matchQuantity);
        } else {
            _transfer(_order1.trader, _order2.trader, _order1.creditId, matchQuantity);
        }

        // Update order quantities
        _order1.quantity = _order1.quantity.sub(matchQuantity);
        _order2.quantity = _order2.quantity.sub(matchQuantity);

        // Update last trade price
        lastTradePrice[_order1.creditId] = matchPrice;

        // Mark orders as inactive if fully filled
        if (_order1.quantity == 0) _order1.active = false;
        if (_order2.quantity == 0) _order2.active = false;

        emit OrderFilled(
            keccak256(abi.encodePacked(_order1.trader, block.timestamp)),
            _order1.trader,
            _order1.creditId,
            matchQuantity,
            matchPrice
        );
    }

    function calculateMatchPrice(Order memory _order1, Order memory _order2) 
        internal 
        pure 
        returns (uint256) 
    {
        // Price-time priority: use price of the earlier order
        return _order1.price;
    }

    function min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a < b ? a : b;
    }

    // View functions
    function getOrder(bytes32 _orderId) external view returns (
        address trader,
        uint256 creditId,
        uint256 quantity,
        uint256 price,
        uint256 expiry,
        OrderType orderType,
        OrderSide side,
        bool active
    ) {
        Order memory order = orders[_orderId];
        return (
            order.trader,
            order.creditId,
            order.quantity,
            order.price,
            order.expiry,
            order.orderType,
            order.side,
            order.active
        );
    }

    function getUserOrders(address _user) external view returns (bytes32[] memory) {
        return userOrders[_user];
    }

    function getActiveOrders(uint256 _creditId) external view returns (bytes32[] memory) {
        // Implementation for getting active orders for a credit
    }
}
```