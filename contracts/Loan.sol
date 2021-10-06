pragma solidity >=0.7.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract Loan is ReentrancyGuard {
    using SafeMath for uint;
    using Address for address payable;

    bytes4 private constant SELECTOR = bytes4(keccak256(bytes('transfer(address,uint256)')));
    
    address payable public borrower; // Assuming 1 borrower for now
    address payable public lender; // Assuming 1 lender for now TODO support multiple lenders
    address token; // The address of the token to use (eg cUSD = 0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1)
    // Loan level amounts
    uint public amountRequested = 0;
    uint public amountRaised = 0;
    uint public amountRepaid = 0;
    
    // Individual level amount - will need to update with multiple lenders and borrowers
    uint public amountLenderWithdraw = 0;
    uint public amountBorrowerWithdraw = 0;
    
    //Events
    event LentToLoan(address addr, uint amount);
    event LoanFunded();
    event BorrowerWithdrew(address addr, uint amount);
    event BorrowerRepaid(address addr, uint amount);
    event LoanRepaid();
    event LenderWithrew(address addr, uint amount);

    /**
     * Set a single borrower, which ERC20 token the loan will be denominated in, and the amount requested
     **/
    constructor(
        address payable _borrower,
        address _token,
        uint256 _amountRequested
    ) {
        borrower = _borrower;
        token = _token;
        amountRequested = _amountRequested;
    }
    
    /**
     * Lender transfers ERC20 token to the contract, we store how much they lent
     **/
    function lend(uint amount) payable public nonReentrant {
        // Don't allow borrowers to lend, or allow overfunding
        require(msg.sender != borrower);
        require(amount <= amountLeftToFund());
        
        // For 1 lender we require the amount to exactly equal the requested amount, we can remove this when we have multiple lenders
        require(amount == amountLeftToFund());
        
        amountRaised += amount;
        _safeTransfer(address(this), amount);
        emit LentToLoan(msg.sender, amount);
        
        // TODO for multiple lenders we need to check if it's fully funded, for now we know it is
        emit LoanFunded();
    }
    
    function borrowerWithdraw() public nonReentrant {
         // Only borrowers can withdraw, and only in the funded state
        require(msg.sender == borrower);
        require(amountRaised > 0);
        
        // TODO for multiple borrowers we have to keep track of each one
        require(amountBorrowerWithdraw < amountRaised);
        
        amountBorrowerWithdraw += amountRaised;
        _safeTransfer(msg.sender, amountRaised);
        emit BorrowerWithdrew(msg.sender, amountRaised);
    }
    
    function borrowerRepay(uint amount) payable public nonReentrant {
        require(msg.sender == borrower);
        
        amountRepaid += amount;
        _safeTransfer(address(this), amount);
        emit BorrowerRepaid(msg.sender, amount);
        if (amountLeftToRepay() <= 0) {
            emit LoanRepaid();
        }
    }
    
    function lenderWithdraw() public nonReentrant {
        require(msg.sender == lender);
        uint amountToWithdraw = amountRepaid - amountLenderWithdraw;
        require(amountToWithdraw > 0);
        
        _safeTransfer(msg.sender, amountToWithdraw);
        
        amountLenderWithdraw += amountToWithdraw;
        emit LenderWithrew(msg.sender, amountToWithdraw);
    }
    
    /* Useful constant functions */
    
    function amountLeftToFund() public view returns (uint) {
        return amountRequested - amountRaised;
    }
    
    function amountLeftToRepay() public view returns (uint) {
        return amountRequested - amountRepaid;
    }
    
    
    /* Private functions */
    
    function _safeTransfer( address to, uint value) private {
        (bool success, bytes memory data) = token.call(abi.encodeWithSelector(SELECTOR, to, value));
        require(success && (data.length == 0 || abi.decode(data, (bool))), 'Loan: TRANSFER_FAILED');
    }
}