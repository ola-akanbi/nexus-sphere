;; Nexus Sphere - Decentralized Fund Management Protocol

;; Title: Nexus Sphere
;; 
;; Summary:
;; A sophisticated decentralized autonomous fund management protocol built on Stacks, 
;; enabling Bitcoin-secured collective investment decisions through democratic governance 
;; and transparent fund allocation mechanisms.
;;
;; Description:
;; Nexus Sphere revolutionizes decentralized fund management by leveraging 
;; Bitcoin's security through Stacks' smart contract capabilities. This protocol 
;; empowers communities to pool resources, propose strategic investments, and execute 
;; collective decisions through a robust voting mechanism. Each participant's influence 
;; scales with their commitment, ensuring aligned incentives while maintaining 
;; democratic principles. With built-in security measures, time-locked deposits, and 
;; transparent execution of approved proposals, Nexus Sphere creates a trustless 
;; environment where collective wisdom drives capital allocation in the Bitcoin ecosystem.

;; PROTOCOL CONSTANTS

(define-constant CONTRACT_OWNER tx-sender)

;; Error Constants
(define-constant ERR_OWNER_ONLY (err u100))
(define-constant ERR_NOT_INITIALIZED (err u101))
(define-constant ERR_ALREADY_INITIALIZED (err u102))
(define-constant ERR_INSUFFICIENT_BALANCE (err u103))
(define-constant ERR_INVALID_AMOUNT (err u104))
(define-constant ERR_UNAUTHORIZED (err u105))
(define-constant ERR_PROPOSAL_NOT_FOUND (err u106))
(define-constant ERR_PROPOSAL_EXPIRED (err u107))
(define-constant ERR_ALREADY_VOTED (err u108))
(define-constant ERR_BELOW_MINIMUM (err u109))
(define-constant ERR_LOCKED_PERIOD (err u110))
(define-constant ERR_TRANSFER_FAILED (err u111))
(define-constant ERR_INVALID_DURATION (err u112))
(define-constant ERR_ZERO_AMOUNT (err u113))
(define-constant ERR_INVALID_TARGET (err u114))
(define-constant ERR_INVALID_DESCRIPTION (err u115))
(define-constant ERR_INVALID_PROPOSAL_ID (err u116))