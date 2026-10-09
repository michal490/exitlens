# ExitLens

A read-only pre-trade token research tool built with CoinGecko data. Search by name or symbol, verify the exact contract, check token price and swap activity, compare pools for a hypothetical USD trade, and save up to eight tokens in a browser-local shortlist. No wallet connection is needed.

## Run

Node 22 or later. No dependencies to install.

```sh
npm start
npm test
```

Open http://127.0.0.1:4178. The saved historical example works without a key. For live requests, copy `.env.example` to `.env` and set your own `COINGECKO_API_KEY` with onchain Pro API access. The local server reads it at startup; never put it in frontend code. Hosted ExitLens uses a Sites runtime secret from its separate campaign account. No CopyCheck key is used.

`npm run build` embeds the public assets into a Cloudflare-compatible Worker at `dist/server/index.js`. No secret is embedded in that output. `server/api.js` accepts only the app's search and token-pool requests, fixes the upstream host, and supplies the Pro key in the request header. API errors are sanitized.

## What the calculations mean

`positionPct = positionUsd / reserveUsd * 100`

`turnover = volume24hUsd / reserveUsd`

These are comparisons, not price impact, slippage, executable quotes or expected losses. Reserves include both assets; reported total value does not specify active liquidity near the current price. Past 24h volume and current reserves refer to different time dimensions. Trading activity does not establish organic demand.

The tool requests page 1 of token pools, at most 20. It deduplicates pool IDs, checks exact token identity, sorts by reported reserves, and computes concentration within that returned set only. Null data stays unavailable. Zero reserves yield no ratio. Quote-token requests reverse swap direction and withhold the base-token price change. No wallet access, swaps, token security checks or routing are provided.

## Reproducible example

`dist/example.json` contains the original response fetched 8 October 2026 at 15:06:30 UTC for Solana token `HaQdrXRUoxxk1qLFZJNrSyzWNjn16o1r1np5h6jipump` (SharkTank). It was selected from the first page of Solana trending pools because its volume-versus-reserves contrast makes the distinction easy to explain. This is a selected example, not a representative market sample or recommendation.

Pool `65GHmCbyRME3XwKjTqDB7pMJw2gvj2LZryfWKczoAqFR`: reserve $46,521.9605; 24h volume $4,744,422.59034451; 24h base-token price change +357.87%. Eight pools returned. Reopen the saved example to reproduce the article, rather than expecting live data to remain unchanged.

## Limits and next steps

Manual requests only. The server caches successful responses for 60 seconds in the edge cache and applies a best-effort, per-isolate limit of 30 requests per IP per minute. This is not a globally coordinated quota or billing cap. The existing private site audience is preserved. Next: coordinated traffic controls before wider sharing, pagination, a historical snapshot timeline, and active-liquidity context where available. Exact execution quotes need an appropriate execution source; this version deliberately does not estimate them.

## CoinGecko links

- [CoinGecko API](https://www.coingecko.com/en/api?utm_content=stacy_muur)
- [API pricing](https://www.coingecko.com/en/api/pricing?utm_content=stacy_muur)
- [API documentation](https://docs.coingecko.com/)
- [Keyless API limits](https://docs.coingecko.com/docs/keyless-public-api)

CoinGecko supplies the data. ExitLens computes the ratios and explanations. CoinGecko branding belongs to its owner.

## Everyday workflow

- **Token check:** name/symbol search on Solana, Ethereum, Base or BNB Chain; select a full contract and explicitly request its pools. Search covers up to 20 matching pools and does not verify token authenticity. Price belongs to the selected pool.
- **Compare pools:** select a pool to update the shared trade-size calculation. $100, $1,000 and $5,000 presets recalculate without another request.
- **My shortlist:** up to eight token snapshots saved only in this browser. Open an old check or manually request current pools. Save again to replace that token's snapshot; there is no automatic refresh, cross-device sync or history timeline. Each row uses the largest returned pool and its own timestamp; rows are not simultaneous quotes.

The browser caches identical responses for 60 seconds and spaces network requests by 10 seconds. Combined browser and edge caching can make returned data about two minutes old; the original fetched timestamp is preserved. Timeout/API failures preserve the previous labelled report. Export evidence includes the source response and current calculation.
