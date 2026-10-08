# PoolCheck

A read-only pool research tool built with CoinGecko data. Enter a token contract and hypothetical USD position, then compare that size with reported reserves in the returned pools.

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

Manual requests only, with a browser cooldown and timeout. Keyless API access is intended for prototypes, not production, scheduled polling or high-frequency updates. The browser cooldown is not a production rate limiter. Next: separate server-side upgraded account key, shared caching and request limits, pagination, timestamped snapshots, and active-liquidity context where available. Exact execution quotes need an appropriate execution source; this version deliberately does not estimate them.

## CoinGecko links

- [CoinGecko API](https://www.coingecko.com/en/api?utm_content=stacy_muur)
- [API pricing](https://www.coingecko.com/en/api/pricing?utm_content=stacy_muur)
- [API documentation](https://docs.coingecko.com/)
- [Keyless API limits](https://docs.coingecko.com/docs/keyless-public-api)

CoinGecko supplies the data. PoolCheck computes the ratios and explanations. CoinGecko branding belongs to its owner.
