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