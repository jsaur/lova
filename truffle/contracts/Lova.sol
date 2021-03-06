// SPDX-License-Identifier: Apache-2.0
pragma solidity >=0.7.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Receiver.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * Lova is a crowd-funding marketplace for 0% interest microloans inspired by Kiva
 * We use ERC1155 since we have lots of loans which are each unique and are comprised on non-unique shares
 * ERC721 wouldn't work as it only allows one owner of each loan, while we need to support multiple lenders per loan
 * 
 * TODO could introduce the EXPIRED state if the loan doesn't fundraise in a set amount of time - this would allow the lenders to withdraw
 * TODO think about meta-transactions where the account sending and paying for execution may not be the actual sender
 * TODO could implement batch versions of all functions
 */
contract Lova is ERC1155, ERC1155Receiver, ERC1155Holder, Ownable  {
    using Counters for Counters.Counter;

    // Variables
    mapping(uint256 => LoanInfo) _loanInfo;
    enum State {RAISING, FUNDED, REPAYING, REPAID} // TODO could add expired in raising and/or defaulted
    struct LoanInfo {
        address borrower;
        address token;
        uint256 numShares;
        uint256 sharePrice;
        uint256 amountRepaid;
        State currentState;
        uint256 kivaId; // For now we reference an id of a kiva loan to fetch metadata, eventually this would be independant
    }
    Counters.Counter _loanIdCounter;
    
    // Events
    event LoanRequested(uint256 loanId, address addr, uint256 amount);
    event LentToLoan(uint256 loanId, address addr, uint256 amount);
    event LoanFunded(uint256 loanId);
    event BorrowerWithdrew(uint256 loanId, uint256 amount);
    event BorrowerRepaid(uint256 loanId, uint256 amount);
    event LoanRepaid(uint256 loanId);
    event LenderWithdrew(uint256 loanId, address addr, uint256 amount);
    
    // Functions
    
    /**
     * For simplicity for now we reference a kivaId and use the Kiva API to fetch loan metadata
     * Eventually this would be independantly stored on IPFS
     * Clients calling this function must replace the `\{id\}` substring with the
     * actual token type ID as per https://eips.ethereum.org/EIPS/eip-1155#metadata[defined in the EIP].
     */
    constructor() ERC1155("https://api.kivaws.org/v2/loans/{id}") {}
    
    /**
     * Bubble supportsInterface down the class hierarchy
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC1155, ERC1155Receiver) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
    
    /**
     * Called by the borrower to "mint" a new loan for a requested amount. All loan shares are initially owned by the contract.
     * For now we support a kivaId to reference the Kiva API to fetch metadata
     * TODO we could hard-code a share price instead of having the borrower supply they're own numShares
     * TODO ensure token address is a real ERC-20 token, or white-list approved tokens
     * TODO currently hard-coding the data field to "", perhaps there's something more interesting to do
     */
    function mint(address borrower, address token, uint256 amountRequested, uint256 sharePrice, uint256 kivaId)
        public
    {
        // Checks 
        require(amountRequested > 0, "Amount requested must be greater than 0");
        require(sharePrice > 0, "Share price must be greater than 0");
        require(amountRequested >= sharePrice, "Amount requested must be greater than or equal to share price");
        require(amountRequested % sharePrice == 0, "Amount requested must be divisible by share price");
        
        // Effects
        uint256 curLoanId = _loanIdCounter.current();
        uint256 numShares = amountRequested / sharePrice;
        _loanInfo[curLoanId] = LoanInfo({
            borrower: borrower,
            token: token,
            numShares: numShares,
            sharePrice: sharePrice,
            currentState: State.RAISING,
            amountRepaid: 0,
            kivaId: kivaId
        });
        _loanIdCounter.increment();
        emit LoanRequested(curLoanId, borrower, amountRequested);
        
        // Interactions
        _mint(address(this), curLoanId, numShares, "");
    }
    
    /**
     * Lender transfers ERC20 token to the contract for a specific loan, they recieve loan shares
     * TODO it may be confusing to specify numShares, since the lender then needs to calculate how much they're lending
     * TODO may need to add nonReentrant
     **/
    function lend(uint256 loanId, uint256 numShares) payable public  {
        // Checks
        require(numShares > 0, "Must lend more than 0");
        require(msg.sender != _loanInfo[loanId].borrower, "Borrower can't lend to their own loan");
        require(numShares <= this.sharesLeft(loanId), "Not enough shares left");
        
        // Effects
        uint256 lendAmount = numShares * _loanInfo[loanId].sharePrice;
        emit LentToLoan(loanId, msg.sender, lendAmount);
        if (this.sharesLeft(loanId) == numShares) {
            _loanInfo[loanId].currentState = State.FUNDED;
            emit LoanFunded(loanId);
        }
        
        // Interactions
        ERC20(_loanInfo[loanId].token).transferFrom(msg.sender, address(this), lendAmount);
        this.safeTransferFrom(address(this), msg.sender, loanId, numShares, "");
    }
    
    /**
     * After the loan is funded, the borrower withdraws their loan amount
     * Note: theorectically we could do this tranfer automatically on raise, but its common practice for the sender to withdraw themselves
     */
    function borrow(uint256 loanId) public {
        // Checks
        require(msg.sender == _loanInfo[loanId].borrower, "Only the borrower can withdraw their requested amount");
        require(_loanInfo[loanId].currentState == State.FUNDED, "Can only borrow in funded state");
        
        // Effects
        _loanInfo[loanId].currentState = State.REPAYING;
        uint256 loanAmount = _loanInfo[loanId].numShares * _loanInfo[loanId].sharePrice;
        
        // Interactions
        ERC20(_loanInfo[loanId].token).transfer(msg.sender, loanAmount);
        emit BorrowerWithdrew(loanId, loanAmount);
    }
    
    /**
     * The borrwer repays the loan, they can call this multiple times until the loan is fully repaid
     */
    function repay(uint256 loanId, uint256 amount) payable public {
        // Checks
        uint256 loanAmount = _loanInfo[loanId].numShares * _loanInfo[loanId].sharePrice;
        require(msg.sender == _loanInfo[loanId].borrower, "Only the borrower can repay");
        require(_loanInfo[loanId].currentState == State.REPAYING, "Can only repay in repaying state");
        require(loanAmount - _loanInfo[loanId].amountRepaid >= amount, "Can't repay more than loan amount");
        
        // Effects
        _loanInfo[loanId].amountRepaid += amount;
        emit BorrowerRepaid(loanId, amount);
        if (_loanInfo[loanId].amountRepaid >= loanAmount) {
            _loanInfo[loanId].currentState = State.REPAID;
            emit LoanRepaid(loanId);
        }
        
        // Interactions
        ERC20(_loanInfo[loanId].token).transferFrom(msg.sender, address(this), amount);
    }
    
    /**
     * Lenders can burn their shares to redeem the underlying loan repayments
     * Note: this isn't ideal as it allows the first lenders to burn to retrieve all their lent amount,
     * ideally each repayment would be distributed evenly across all loan shares, but this would invovle keeping
     * track of a repaid amount and withrawn amount for each loan share, which is a lot of storage
     */
    function burn(address account, uint256 loanId, uint256 numShares) public virtual {
        // Checks
        require(msg.sender == account || isApprovedForAll(account, _msgSender()), "ERC1155: caller is not owner nor approved");
        require(
            _loanInfo[loanId].currentState == State.REPAYING || _loanInfo[loanId].currentState == State.REPAID, 
            "Can only burn in repaying or repaid states"
        );
        uint256 withdrawAmount = _loanInfo[loanId].sharePrice * numShares;
        require(withdrawAmount <= _loanInfo[loanId].amountRepaid, "Can't withdraw more than amount repaid");
        
        // Effects
        
        emit LenderWithdrew(loanId, msg.sender, withdrawAmount);

        // Interactions
        _burn(account, loanId, numShares);
        ERC20(_loanInfo[loanId].token).transfer(msg.sender, withdrawAmount);
    }
    
    /**
     * Convinence function to get the number of shares left to fund for a loan (ie still owned by the contract)
     */
    function sharesLeft(uint256 loanId) public view returns (uint256) {
        return this.balanceOf(address(this), loanId);
    }
    
    /**
     * Get loan info for an individual loan id
     */
    function loanInfo(uint256 loanId) public view returns (LoanInfo memory) {
        return _loanInfo[loanId];
    }
    
    /**
     * Loans increment sequentially from 0
     */
    function loanCount() public view returns (uint256) {
        return _loanIdCounter.current();
    }
}