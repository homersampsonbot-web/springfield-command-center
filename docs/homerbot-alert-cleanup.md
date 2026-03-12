# HomerBot Alert Cleanup

## Problem
Homer execution replies in Telegram are being obscured by stale or repeated system alerts.

## Symptoms
- stale Marge relay down alerts
- stale Lisa relay down alerts
- important Homer execution replies are harder to see

## Goal
Keep HomerBot usable as a backup command surface by separating or deduplicating noisy alert traffic.

## Recommended order
1. freshness check before relay-down alerts are sent
2. deduplicate repeated identical alerts
3. separate Homer execution replies from shared Springfield system alerts