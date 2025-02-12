// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/Address.sol";

contract CarbonCredit is ERC1155, ERC1155Supply, Ownable, ReentrancyGuard, Pausable {
    using Address for address;

    struct Credit {
        string name;
        string creditType;
        uint256 price;
        bool verified;
    }

    struct MultiSigWallet {
        address[] owners;
        uint256 required;
        mapping(bytes32 => Transaction) transactions;
        mapping(bytes32 => mapping(address => bool)) confirmations;
    }

    struct Transaction {
        address to;
        uint256 value;
        bytes data;
        bool executed;
    }

    mapping(uint256 => Credit) public credits;
    uint256 private _nextTokenId;
    MultiSigWallet public wallet;
    
    // Reentrancy lock
    uint256 private constant NOT_ENTERED = 1;
    uint256 private constant ENTERED = 2;
    uint256 private _status;

    event CreditCreated(uint256 indexed tokenId, string name, uint256 price);
    event CreditPurchased(uint256 indexed tokenId, address buyer, uint256 amount);
    event TransactionSubmitted(bytes32 indexed txHash);
    event TransactionConfirmed(bytes32 indexed txHash, address indexed owner);
    event TransactionExecuted(bytes32 indexed txHash);

    modifier onlyWalletOwner() {
        bool isOwner = false;
        for (uint i = 0; i < wallet.owners.length; i++) {
            if (msg.sender == wallet.owners[i]) {
                isOwner = true;
                break;
            }
        }
        require(isOwner, "Not a wallet owner");
        _;
    }

    constructor(address[] memory _owners, uint256 _required) 
        ERC1155("https://api.carbondex.com/metadata/{id}") 
        Ownable(msg.sender) 
    {
        require(_owners.length > 0, "Owners required");
        require(_required > 0 && _required <= _owners.length, "Invalid required number");

        for (uint i = 0; i < _owners.length; i++) {
            require(_owners[i] != address(0), "Invalid owner");
            wallet.owners.push(_owners[i]);
        }
        wallet.required = _required;
        _status = NOT_ENTERED;
    }

    function submitTransaction(
        address _to,
        uint256 _value,
        bytes memory _data
    ) public onlyWalletOwner returns (bytes32) {
        bytes32 txHash = keccak256(abi.encodePacked(_to, _value, _data, block.timestamp));
        wallet.transactions[txHash] = Transaction({
            to: _to,
            value: _value,
            data: _data,
            executed: false
        });
        emit TransactionSubmitted(txHash);
        return txHash;
    }

    function confirmTransaction(bytes32 _txHash) public onlyWalletOwner {
        require(!wallet.confirmations[_txHash][msg.sender], "Already confirmed");
        wallet.confirmations[_txHash][msg.sender] = true;
        emit TransactionConfirmed(_txHash, msg.sender);

        if (isConfirmed(_txHash)) {
            executeTransaction(_txHash);
        }
    }

    function executeTransaction(bytes32 _txHash) public nonReentrant {
        require(isConfirmed(_txHash), "Not enough confirmations");
        Transaction storage transaction = wallet.transactions[_txHash];
        require(!transaction.executed, "Already executed");

        transaction.executed = true;
        
        (bool success, ) = transaction.to.call{value: transaction.value}(
            transaction.data
        );
        require(success, "Transaction failed");

        emit TransactionExecuted(_txHash);
    }

    function isConfirmed(bytes32 _txHash) public view returns (bool) {
        uint256 count;
        for (uint i = 0; i < wallet.owners.length; i++) {
            if (wallet.confirmations[_txHash][wallet.owners[i]]) {
                count++;
            }
        }
        return count >= wallet.required;
    }

    function createCredit(
        string memory name,
        string memory creditType,
        uint256 price,
        uint256 initialSupply
    ) public onlyOwner whenNotPaused {
        uint256 tokenId = _nextTokenId++;
        credits[tokenId] = Credit(name, creditType, price, false);
        _mint(msg.sender, tokenId, initialSupply, "");
        emit CreditCreated(tokenId, name, price);
    }

    function verifyCredit(uint256 tokenId) public onlyOwner whenNotPaused {
        require(exists(tokenId), "Credit does not exist");
        credits[tokenId].verified = true;
    }

    function purchaseCredits(uint256 tokenId, uint256 amount) public payable nonReentrant whenNotPaused {
        Credit memory credit = credits[tokenId];
        require(exists(tokenId), "Credit does not exist");
        require(credit.verified, "Credit not verified");
        require(msg.value >= credit.price * amount, "Insufficient payment");

        // Transfer tokens first
        safeTransferFrom(owner(), msg.sender, tokenId, amount, "");
        
        // Then transfer payment
        (bool success, ) = owner().call{value: msg.value}("");
        require(success, "Payment failed");

        emit CreditPurchased(tokenId, msg.sender, amount);
    }

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    // Override required by Solidity
    function _update(address from, address to, uint256[] memory ids, uint256[] memory values)
        internal
        override(ERC1155, ERC1155Supply)
        whenNotPaused
    {
        super._update(from, to, ids, values);
    }

    receive() external payable {
        require(msg.data.length == 0, "Only direct payments");
    }

    fallback() external payable {
        revert("Invalid function call");
    }
}