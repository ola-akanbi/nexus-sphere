# Nexus Sphere – Decentralized Fund Management Protocol

## Overview

**Nexus Sphere** is a decentralized autonomous fund management protocol built on the [Stacks blockchain](https://www.stacks.co), secured by Bitcoin. It enables communities to pool resources, propose strategic investments, and make collective decisions through transparent, democratic governance.

Participants deposit STX into the protocol, receive membership tokens that represent their voting power, and engage in a governance process where proposals are submitted, voted upon, and executed in a fully trustless manner.

This system leverages:

* **Bitcoin finality and security** via Stacks
* **Time-locked deposits** ensuring long-term alignment
* **Weighted governance** based on actual stake
* **Transparent execution** of approved proposals

---

## Key Features

* **Membership via STX deposits**: Users lock STX and receive governance tokens proportional to their stake.
* **Time-locked participation**: Deposits remain locked for a defined duration to prevent opportunistic governance attacks.
* **Decentralized governance**: Any member can submit proposals, vote, and influence fund allocation.
* **On-chain fund management**: Approved proposals result in automated, trustless STX transfers.
* **Fully auditable**: Every deposit, vote, and proposal is recorded on-chain.

---

## System Overview

The protocol is composed of four main components:

1. **Membership Management**

   * Users join by depositing STX (`join-collective`)
   * Deposits are time-locked (`unlock-height`)
   * Withdrawal requires lock expiry (`exit-collective`)

2. **Governance & Proposals**

   * Members submit proposals (`submit-proposal`) with description, funding amount, beneficiary, and duration
   * Each proposal is time-bound and expires automatically if not executed

3. **Voting**

   * Members cast votes (`cast-vote`) weighted by their membership tokens
   * Double voting is prevented through tracking maps

4. **Execution**

   * If a proposal passes (votes-for > votes-against) after expiry, it can be executed (`execute-approved-proposal`)
   * Funds are transferred directly from the protocol to the beneficiary

---

## Contract Architecture

### State Variables

* **Global State**

  * `protocol-initialized`: Initialization flag
  * `total-supply`: Total governance tokens in circulation
  * `proposal-counter`: Incremental proposal ID tracker

* **Member State**

  * `member-balances`: Voting power balances
  * `member-deposits`: Deposit details (amount, entry block, unlock height)

* **Governance State**

  * `governance-proposals`: Registry of submitted proposals
  * `member-votes`: Tracks individual votes to prevent double voting

### Key Maps & Structures

```clarity
(member-deposits principal {
    deposit-amount: uint,
    unlock-height: uint,
    entry-block: uint
})

(governance-proposals uint {
    proposer: principal,
    description: (string-ascii 256),
    funding-amount: uint,
    beneficiary: principal,
    expiry-height: uint,
    executed: bool,
    votes-for: uint,
    votes-against: uint
})
```

---

## Data Flow

1. **Joining the Collective**

   * User deposits ≥ 1 STX → Locked for default period (e.g., 10 days)
   * Membership tokens minted equal to deposit amount

2. **Submitting a Proposal**

   * Only members can submit
   * Must define funding request, description, beneficiary, and voting duration
   * Stored with auto-expiry

3. **Voting**

   * Members vote "for" or "against"
   * Weight = membership tokens
   * Vote recorded once per member per proposal

4. **Execution**

   * After expiry, if `votes-for > votes-against` → STX transferred to beneficiary
   * Proposal marked as executed

---

## Public Functions

* **Initialization**

  * `initialize-protocol`

* **Membership**

  * `join-collective (deposit-amount)`
  * `exit-collective (withdrawal-amount)`

* **Governance**

  * `submit-proposal (description funding-amount beneficiary voting-duration)`
  * `cast-vote (proposal-id support)`
  * `execute-approved-proposal (proposal-id)`

* **Queries (Read-only)**

  * `get-member-balance (member)`
  * `get-total-member-tokens`
  * `get-proposal-details (proposal-id)`
  * `get-member-deposit-info (member)`
  * `get-member-vote (proposal-id voter)`
  * `get-protocol-status`

---

## Security Considerations

* **Time-lock enforced**: Prevents immediate exit after malicious proposal voting.
* **One vote per member per proposal**: Ensures integrity of governance.
* **Strict validation**: Input checks for proposals, amounts, and targets.
* **Safe fund transfers**: All STX transfers checked with `try!`.
* **Immutable voting records**: Ensures transparency.

---

## Future Extensions

* **Delegated voting** (liquid democracy)
* **Proposal categories** (investment, grants, treasury ops)
* **Dynamic quorum requirements**
* **Multi-asset support** via SIP-010 fungible tokens

---

## Deployment

1. Deploy contract to Stacks testnet or mainnet.
2. Call `initialize-protocol` (contract owner only).
3. Members can now deposit STX and participate.

---

## License

MIT License.
