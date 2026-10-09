# PoolCheck

A read-only pre-trade token research tool built with CoinGecko data. Search by name or symbol, verify the exact contract, check token price and swap activity, compare pools for a hypothetical USD trade, and save up to eight tokens in a browser-local shortlist. No wallet connection is needed.

## Run

Node 22 or later. No dependencies to install.

```sh
npm start
npm test
```

Open http://127.0.0.1:4178. The saved real example works without live API access. Live checks currently use CoinGecko's keyless GeckoTerminal API directly from the browser. The separate campaign account's upgraded key is pending; no CopyCheck key is used or bundled. A keyed integration must use a server-side proxy and secret, never a browser field or frontend environment variable.

## What the calculations mean

`positionPct = positionUsd / reserveUsd * 100`

`turnover = volume24hUsd / reserveUsd`

These are comparisons, not price impact, slippage, executable quotes or expected losses. Reserves include both assets; reported total value does not specify active liquidity near the current price. Past 24h volume and current reserves refer to different time dimensions. Trading activity does not establish organic demand.

The tool requests page 1 of token pools, at most 20. It deduplicates pool IDs, checks exact token identity, sorts by reported reserves, and computes concentration within that returned set only. Null data stays unavailable. Zero reserves yield no ratio. Quote-token requests reverse swap direction and withhold the base-token price change. No wallet access, swaps, token security checks or routing are provided.

## Reproducible example

`dist/example.json` contains the original response fetched 8 October 2026 at 15:06:30 UTC for Solana token `HaQdrXRUoxxk1qLFZJNrSyzWNjn16o1r1np5h6jipump` (SharkTank). It was selected from the first page of Solana trending pools because its volume-versus-reserves contrast makes the distinction easy to explain. This is a selected example, not a representative market sample or recommendation.

Pool `65GHmCbyRME3XwKjTqDB7pMJw2gvj2LZryfWKczoAqFR`: reserve $46,521.9605; 24h volume $4,744,422.59034451; 24h base-token price change +357.87%. Eight pools returned. Reopen the saved example to reproduce the article, rather than expecting live data to remain unchanged.

## Limits and next steps

Manual requests only, with a browser cooldown and timeout. Keyless API access is intended for prototypes, not production, scheduled polling or high-frequency updates. The browser cooldown is not a production rate limiter. Next: separate server-side upgraded account key, shared caching and request limits, pagination, a historical snapshot timeline, and active-liquidity context where available. Exact execution quotes need an appropriate execution source; this version deliberately does not estimate them.

## CoinGecko links

- [CoinGecko API](https://www.coingecko.com/en/api?utm_content=stacy_muur)
- [API pricing](https://www.coingecko.com/en/api/pricing?utm_content=stacy_muur)
- [API documentation](https://docs.coingecko.com/)
- [Keyless API limits](https://docs.coingecko.com/docs/keyless-public-api)

CoinGecko supplies the data. PoolCheck computes the ratios and explanations. CoinGecko branding belongs to its owner.

## Everyday workflow

- **Token check:** name/symbol search on Solana, Ethereum, Base or BNB Chain; select a full contract and explicitly request its pools. Search covers up to 20 matching pools and does not verify token authenticity. Price belongs to the selected pool.
- **Compare pools:** select a pool to update the shared trade-size calculation. $100, $1,000 and $5,000 presets recalculate without another request.
- **My shortlist:** up to eight token snapshots saved only in this browser. Open an old check or manually request current pools. Save again to replace that token's snapshot; there is no automatic refresh, cross-device sync or history timeline. Each row uses the largest returned pool and its own timestamp; rows are not simultaneous quotes.

The browser caches identical responses for 60 seconds and spaces network requests by 10 seconds. This is convenience caching, not shared server-side traffic protection. Timeout/API failures preserve the previous labelled report. Export evidence includes the source response and current calculation.
