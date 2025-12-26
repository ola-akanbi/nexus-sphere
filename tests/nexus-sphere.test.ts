import { describe, expect, it, beforeEach } from "vitest";
import { Cl, ClarityType } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const address1 = accounts.get("wallet_1")!;
const address2 = accounts.get("wallet_2")!;
const address3 = accounts.get("wallet_3")!;

const CONTRACT_NAME = "nexus-sphere";
const MINIMUM_DEPOSIT = 1_000_000; // 1 STX
const DEFAULT_LOCK_PERIOD = 1440;

describe("Nexus Sphere Tests", () => {
  
  describe("Protocol Initialization", () => {
    it("should initialize protocol successfully by owner", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "initialize-protocol",
        [],
        deployer
      );
      expect(result).toBeOk(Cl.bool(true));
    });

    it("should prevent non-owner from initializing", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "initialize-protocol",
        [],
        address1
      );
      expect(result).toBeErr(Cl.uint(100)); // ERR_OWNER_ONLY
    });

    it("should prevent double initialization", () => {
      simnet.callPublicFn(CONTRACT_NAME, "initialize-protocol", [], deployer);
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "initialize-protocol",
        [],
        deployer
      );
      expect(result).toBeErr(Cl.uint(102)); // ERR_ALREADY_INITIALIZED
    });
  });

  describe("Membership - Joining Collective", () => {
    beforeEach(() => {
      simnet.callPublicFn(CONTRACT_NAME, "initialize-protocol", [], deployer);
    });

    it("should allow member to join with valid deposit", () => {
      const depositAmount = 5_000_000; // 5 STX
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "join-collective",
        [Cl.uint(depositAmount)],
        address1
      );
      expect(result).toBeOk(Cl.bool(true));
    });

    it("should reject deposit below minimum threshold", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "join-collective",
        [Cl.uint(500_000)], // 0.5 STX, below minimum
        address1
      );
      expect(result).toBeErr(Cl.uint(109)); // ERR_BELOW_MINIMUM
    });

    it("should reject zero amount deposit", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "join-collective",
        [Cl.uint(0)],
        address1
      );
      expect(result).toBeErr(Cl.uint(109)); // ERR_BELOW_MINIMUM (checked before ERR_ZERO_AMOUNT)
    });

    it("should track member balance correctly", () => {
      const depositAmount = 3_000_000;
      simnet.callPublicFn(
        CONTRACT_NAME,
        "join-collective",
        [Cl.uint(depositAmount)],
        address1
      );

      const { result } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-member-balance",
        [Cl.principal(address1)],
        address1
      );
      expect(result).toBeOk(Cl.uint(depositAmount));
    });

    it("should allow multiple deposits from same member", () => {
      simnet.callPublicFn(
        CONTRACT_NAME,
        "join-collective",
        [Cl.uint(2_000_000)],
        address1
      );
      simnet.callPublicFn(
        CONTRACT_NAME,
        "join-collective",
        [Cl.uint(3_000_000)],
        address1
      );

      const { result } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-member-balance",
        [Cl.principal(address1)],
        address1
      );
      expect(result).toBeOk(Cl.uint(5_000_000));
    });
  });

  describe("Membership - Exiting Collective", () => {
    beforeEach(() => {
      simnet.callPublicFn(CONTRACT_NAME, "initialize-protocol", [], deployer);
      simnet.callPublicFn(
        CONTRACT_NAME,
        "join-collective",
        [Cl.uint(5_000_000)],
        address1
      );
    });

    it("should prevent withdrawal during lock period", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "exit-collective",
        [Cl.uint(1_000_000)],
        address1
      );
      expect(result).toBeErr(Cl.uint(110)); // ERR_LOCKED_PERIOD
    });

    it("should allow withdrawal after lock period expires", () => {
      // Mine blocks to pass the lock period
      simnet.mineEmptyBlocks(DEFAULT_LOCK_PERIOD + 1);

      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "exit-collective",
        [Cl.uint(2_000_000)],
        address1
      );
      expect(result).toBeOk(Cl.bool(true));
    });

    it("should reject withdrawal exceeding balance", () => {
      simnet.mineEmptyBlocks(DEFAULT_LOCK_PERIOD + 1);

      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "exit-collective",
        [Cl.uint(10_000_000)], // More than deposited
        address1
      );
      expect(result).toBeErr(Cl.uint(103)); // ERR_INSUFFICIENT_BALANCE
    });

    it("should reject zero amount withdrawal", () => {
      simnet.mineEmptyBlocks(DEFAULT_LOCK_PERIOD + 1);

      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "exit-collective",
        [Cl.uint(0)],
        address1
      );
      expect(result).toBeErr(Cl.uint(113)); // ERR_ZERO_AMOUNT
    });

    it("should update balance correctly after withdrawal", () => {
      simnet.mineEmptyBlocks(DEFAULT_LOCK_PERIOD + 1);

      simnet.callPublicFn(
        CONTRACT_NAME,
        "exit-collective",
        [Cl.uint(2_000_000)],
        address1
      );

      const { result } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-member-balance",
        [Cl.principal(address1)],
        address1
      );
      expect(result).toBeOk(Cl.uint(3_000_000)); // 5M - 2M
    });
  });

  describe("Governance - Proposal Submission", () => {
    beforeEach(() => {
      simnet.callPublicFn(CONTRACT_NAME, "initialize-protocol", [], deployer);
      simnet.callPublicFn(
        CONTRACT_NAME,
        "join-collective",
        [Cl.uint(5_000_000)],
        address1
      );
    });

    it("should allow member to submit valid proposal", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "submit-proposal",
        [
          Cl.stringAscii("Fund community project"),
          Cl.uint(1_000_000),
          Cl.principal(address2),
          Cl.uint(1000), // duration in blocks
        ],
        address1
      );
      expect(result).toBeOk(Cl.uint(1)); // First proposal ID
    });

    it("should reject proposal from non-member", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "submit-proposal",
        [
          Cl.stringAscii("Test proposal"),
          Cl.uint(1_000_000),
          Cl.principal(address2),
          Cl.uint(1000),
        ],
        address3 // Not a member
      );
      expect(result).toBeErr(Cl.uint(105)); // ERR_UNAUTHORIZED
    });

    it("should reject proposal with zero funding", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "submit-proposal",
        [
          Cl.stringAscii("Test proposal"),
          Cl.uint(0),
          Cl.principal(address2),
          Cl.uint(1000),
        ],
        address1
      );
      expect(result).toBeErr(Cl.uint(113)); // ERR_ZERO_AMOUNT
    });

    it("should reject proposal with empty description", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "submit-proposal",
        [
          Cl.stringAscii(""),
          Cl.uint(1_000_000),
          Cl.principal(address2),
          Cl.uint(1000),
        ],
        address1
      );
      expect(result).toBeErr(Cl.uint(115)); // ERR_INVALID_DESCRIPTION
    });

    it("should reject proposal with invalid duration (too short)", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "submit-proposal",
        [
          Cl.stringAscii("Test proposal"),
          Cl.uint(1_000_000),
          Cl.principal(address2),
          Cl.uint(100), // Below minimum (144)
        ],
        address1
      );
      expect(result).toBeErr(Cl.uint(112)); // ERR_INVALID_DURATION
    });

    it("should reject proposal with invalid duration (too long)", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "submit-proposal",
        [
          Cl.stringAscii("Test proposal"),
          Cl.uint(1_000_000),
          Cl.principal(address2),
          Cl.uint(25000), // Above maximum (20160)
        ],
        address1
      );
      expect(result).toBeErr(Cl.uint(112)); // ERR_INVALID_DURATION
    });

    it("should increment proposal counter correctly", () => {
      simnet.callPublicFn(
        CONTRACT_NAME,
        "submit-proposal",
        [
          Cl.stringAscii("Proposal 1"),
          Cl.uint(1_000_000),
          Cl.principal(address2),
          Cl.uint(1000),
        ],
        address1
      );

      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "submit-proposal",
        [
          Cl.stringAscii("Proposal 2"),
          Cl.uint(2_000_000),
          Cl.principal(address2),
          Cl.uint(1000),
        ],
        address1
      );
      expect(result).toBeOk(Cl.uint(2));
    });
  });

  describe("Governance - Voting", () => {
    beforeEach(() => {
      simnet.callPublicFn(CONTRACT_NAME, "initialize-protocol", [], deployer);
      simnet.callPublicFn(
        CONTRACT_NAME,
        "join-collective",
        [Cl.uint(5_000_000)],
        address1
      );
      simnet.callPublicFn(
        CONTRACT_NAME,
        "join-collective",
        [Cl.uint(3_000_000)],
        address2
      );
      // Create a proposal
      simnet.callPublicFn(
        CONTRACT_NAME,
        "submit-proposal",
        [
          Cl.stringAscii("Test proposal"),
          Cl.uint(1_000_000),
          Cl.principal(address3),
          Cl.uint(1000),
        ],
        address1
      );
    });

    it("should allow member to vote in favor", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "cast-vote",
        [Cl.uint(1), Cl.bool(true)],
        address1
      );
      expect(result).toBeOk(Cl.bool(true));
    });

    it("should allow member to vote against", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "cast-vote",
        [Cl.uint(1), Cl.bool(false)],
        address2
      );
      expect(result).toBeOk(Cl.bool(true));
    });

    it("should prevent non-member from voting", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "cast-vote",
        [Cl.uint(1), Cl.bool(true)],
        address3 // Not a member
      );
      expect(result).toBeErr(Cl.uint(105)); // ERR_UNAUTHORIZED
    });

    it("should prevent double voting", () => {
      simnet.callPublicFn(
        CONTRACT_NAME,
        "cast-vote",
        [Cl.uint(1), Cl.bool(true)],
        address1
      );

      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "cast-vote",
        [Cl.uint(1), Cl.bool(false)],
        address1
      );
      expect(result).toBeErr(Cl.uint(108)); // ERR_ALREADY_VOTED
    });

    it("should reject vote for non-existent proposal", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "cast-vote",
        [Cl.uint(999), Cl.bool(true)],
        address1
      );
      expect(result).toBeErr(Cl.uint(116)); // ERR_INVALID_PROPOSAL_ID
    });

    it("should reject vote after proposal expires", () => {
      simnet.mineEmptyBlocks(1001); // Past the voting duration

      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "cast-vote",
        [Cl.uint(1), Cl.bool(true)],
        address2
      );
      expect(result).toBeErr(Cl.uint(107)); // ERR_PROPOSAL_EXPIRED
    });

    it("should weight votes by member balance", () => {
      simnet.callPublicFn(
        CONTRACT_NAME,
        "cast-vote",
        [Cl.uint(1), Cl.bool(true)],
        address1
      );

      const { result } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-proposal-details",
        [Cl.uint(1)],
        address1
      );

      expect(result).toBeOk(
        Cl.some(
          Cl.tuple({
            proposer: Cl.principal(address1),
            description: Cl.stringAscii("Test proposal"),
            "funding-amount": Cl.uint(1_000_000),
            beneficiary: Cl.principal(address3),
            "expiry-height": Cl.uint(simnet.blockHeight + 1000 - 1), // Adjusted for timing
            executed: Cl.bool(false),
            "votes-for": Cl.uint(5_000_000), // address1's balance
            "votes-against": Cl.uint(0),
          })
        )
      );
    });
  });

  describe("Governance - Proposal Execution", () => {
    beforeEach(() => {
      simnet.callPublicFn(CONTRACT_NAME, "initialize-protocol", [], deployer);
      // Create members with significant balances
      simnet.callPublicFn(
        CONTRACT_NAME,
        "join-collective",
        [Cl.uint(50_000_000)], // 50 STX
        address1
      );
      simnet.callPublicFn(
        CONTRACT_NAME,
        "join-collective",
        [Cl.uint(30_000_000)], // 30 STX
        address2
      );
      // Create proposal
      simnet.callPublicFn(
        CONTRACT_NAME,
        "submit-proposal",
        [
          Cl.stringAscii("Fund development"),
          Cl.uint(10_000_000),
          Cl.principal(address3),
          Cl.uint(500),
        ],
        address1
      );
    });

    it("should execute proposal with majority votes after expiry", () => {
      // Vote in favor with majority
      simnet.callPublicFn(
        CONTRACT_NAME,
        "cast-vote",
        [Cl.uint(1), Cl.bool(true)],
        address1
      );

      // Mine blocks past voting period
      simnet.mineEmptyBlocks(501);

      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "execute-approved-proposal",
        [Cl.uint(1)],
        address1
      );
      expect(result).toBeOk(Cl.bool(true));
    });

    it("should reject execution before voting period ends", () => {
      simnet.callPublicFn(
        CONTRACT_NAME,
        "cast-vote",
        [Cl.uint(1), Cl.bool(true)],
        address1
      );

      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "execute-approved-proposal",
        [Cl.uint(1)],
        address1
      );
      expect(result).toBeErr(Cl.uint(107)); // ERR_PROPOSAL_EXPIRED
    });

    it("should reject execution without majority", () => {
      // Vote against
      simnet.callPublicFn(
        CONTRACT_NAME,
        "cast-vote",
        [Cl.uint(1), Cl.bool(false)],
        address1
      );

      simnet.mineEmptyBlocks(501);

      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "execute-approved-proposal",
        [Cl.uint(1)],
        address1
      );
      expect(result).toBeErr(Cl.uint(105)); // ERR_UNAUTHORIZED
    });

    it("should reject execution if quorum not met", () => {
      // No votes cast, quorum not met
      simnet.mineEmptyBlocks(501);

      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "execute-approved-proposal",
        [Cl.uint(1)],
        address1
      );
      expect(result).toBeErr(Cl.uint(105)); // ERR_UNAUTHORIZED
    });

    it("should prevent double execution", () => {
      simnet.callPublicFn(
        CONTRACT_NAME,
        "cast-vote",
        [Cl.uint(1), Cl.bool(true)],
        address1
      );

      simnet.mineEmptyBlocks(501);

      simnet.callPublicFn(
        CONTRACT_NAME,
        "execute-approved-proposal",
        [Cl.uint(1)],
        address1
      );

      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "execute-approved-proposal",
        [Cl.uint(1)],
        address1
      );
      expect(result).toBeErr(Cl.uint(105)); // ERR_UNAUTHORIZED
    });
  });

  describe("Admin Functions", () => {
    beforeEach(() => {
      simnet.callPublicFn(CONTRACT_NAME, "initialize-protocol", [], deployer);
    });

    it("should allow owner to update minimum deposit", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "update-minimum-deposit",
        [Cl.uint(2_000_000)],
        deployer
      );
      expect(result).toBeOk(Cl.bool(true));
    });
