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