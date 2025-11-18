# Deep Linking into Tonkeeper — Complete Guide

Your application might operate outside of Tonkeeper, like a website or a mobile app. Deep links let you open a specific screen or execute a specific action inside the Tonkeeper app with all the parameters prefilled.

This guide makes the behavior **unambiguous** and **complete**, covering all supported parameters and their combinations for TON and Jetton transfers. It also documents validation rules and common errors.

> **Notation used below**
>
> -   `{PREFIX}` means one of the three interchangeable schemes: `ton://`, `tonkeeper://` or `https://app.tonkeeper.com/`.
> -   `{ADDRESS}` means a valid TON recipient address. It can be a raw address or a **TON DNS** name like `example.ton`.
> -   Unless noted otherwise, **all parameter values must be URL‑encoded**.

---

## Supported URI Schemes

Tonkeeper supports three interchangeable schemes. Choose any of them depending on your environment:

-   **`ton://`** — TON standard scheme. Recommended for cross‑wallet compatibility.
-   **`tonkeeper://`** — custom scheme for direct app deep link on mobile.
-   **`https://app.tonkeeper.com/`** — web scheme usable from browsers and environments without custom schemes.

All three schemes accept **the same path and query parameters**. You can replace `{PREFIX}` with any of them.

---

## Address Formats

`{ADDRESS}` accepts:

-   A valid TON address in friendly format (bounceable/unbounceable) or raw.
-   A **TON DNS** name ending with `.ton` (e.g., `example.ton`).

---

## Transfer Parameters — Quick Reference

The following parameters are used across transfer links. Types are given using string representations; values must be URL‑encoded.

> **Flow modes**
> Mode is determined **solely** by whether `amount` is present.
>
> -   **Editable (send-screen):** `amount` is **absent**. The user can enter the amount. `text` is allowed **unless** `bin` is present. May include `bin` and (TON only) `init`; if present in the link, these are **prefilled and locked**. `exp` is **not allowed** in this mode.
> -   **Non-editable (confirmation-screen):** `amount` is **present**. The request is fixed; the user only confirms or cancels. You may include **either** `text` **or** `bin` (mutually exclusive), `exp`, and (TON only) `init`. **Any link with `exp` is always `confirmation-screen`.**

<br />

| Parameter | Type                                   | Applies to   | Required                          | Rules & Notes                                                                                                                              |
| --------- | -------------------------------------- | ------------ | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `amount`  | string (integer)                       | TON & Jetton | Optional                          | For **TON**: amount in **nanotons**. For **Jetton**: amount in the token’s **smallest units** (atomic units).                              |
| `text`    | string (UTF‑8, URL‑encoded)            | TON & Jetton | Optional                          | Transfer comment. **Mutually exclusive with `bin`.**                                                                                       |
| `bin`     | string (base64 BoC, URL‑encoded)       | TON & Jetton | Optional                          | Binary payload: **TON** — attached as internal message body; **Jetton** — attached as forward payload. **Mutually exclusive with `text`.** |
| `exp`     | string (UNIX seconds)                  | TON & Jetton | Optional                          | Valid‑until timestamp; **reject if current time >.`exp`**. **requires `amount`**; links with `exp` are not editable.                       |
| `init`    | string (StateInit base64, URL‑encoded) | TON only     | Optional                          | Adds **StateInit** to the message. **Not allowed in Jetton transfers.**                                                                    |
| `jetton`  | string (jetton master address)         | Jetton only  | **Required for jetton transfers** | Presence switches the flow to **Jetton transfer**.                                                                                         |

---

## Transfer (TON)

### 1) Open Transfer Screen

Opens the prefilled send-screen. Any missing data can be entered by the user.

**Format**

```text
# send-screen (no amount)
{PREFIX}transfer/{ADDRESS}
{PREFIX}transfer/{ADDRESS}?text={TEXT}

# To open confirmation-screen, include amount:
{PREFIX}transfer/{ADDRESS}?amount={AMOUNT}[&text={TEXT}]

```

**Examples**

```text
# Address only (editable)
ton://transfer/UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsNQh

# Address + text (editable)
ton://transfer/UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsNQh?text=test

# Address + amount (1 nanoton)
ton://transfer/UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsNQh?amount=1

# Address + amount + text
ton://transfer/UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsNQh?amount=1&text=test

# DNS address + amount
ton://transfer/example.ton?amount=1
```

### 2) Address with Binary Payload (`bin`)

Opens the emulation screen or a blind‑signing warning. The payload is attached as **internal message body**.

**Rules**

-   `bin` must be a **URL‑encoded base64 BoC**.
-   `text` **must not** be combined with `bin`.

**Format**

```text
# with amount - confirmation-screen
{PREFIX}transfer/{ADDRESS}?amount={AMOUNT}&bin={BINARY_DATA}

# without amount - send-screen
{PREFIX}transfer/{ADDRESS}?bin={BINARY_DATA}
```

**Examples**

```text
# TON + bin
ton://transfer/UQCae11h9N5znylEPRjmuLYGvIwnxkcCw4zVW4BJjVASi5eL?amount=1&bin=te6cckEBAQEACQAADgAAAABiaW793PSE

# Invalid: text + bin (must be rejected)
ton://transfer/UQCae11h9N5znylEPRjmuLYGvIwnxkcCw4zVW4BJjVASi5eL?amount=1&text=test&bin=te6cckEBAQEACQAADgAAAABiaW793PSE
```

### 3) Expiry Timestamp (`exp`)

**Rules**

-   `amount` is **required** when `exp` is present.
-   `exp` is a UNIX timestamp in **seconds**.
-   Clients must **reject** expired transactions.
-   Can be combined with any valid combination (e.g., `text`, `bin`, `init`).
-   Links with `exp` are **non editable** (confirmation-screen only).

**How `exp` works**

-   Defines the latest moment a transaction can be signed.
-   Already expired → signing is blocked.
-   Expires during signing → signature must fail.
-   Very distant in the future → wallet should replace with a short validity window at signing (e.g. current time + N seconds).

Ensures the transaction is only valid until a given time. When using `exp`, certain behaviors and restrictions apply to guarantee the security and timeliness of the transaction:

**Format**

```text
{PREFIX}transfer/{ADDRESS}?amount={AMOUNT}&text={TEXT}&exp={EXPIRY_TIMESTAMP}
```

**Examples**

```text
# Valid until exp
ton://transfer/UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsNQh?amount=1&exp=4102444800

# Amount + text + exp
ton://transfer/UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsNQh?amount=1&text=test&exp=4102444800

# Bin + exp
ton://transfer/UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsNQh?amount=1&bin=te6cckEBAQEACQAADgAAAABiaW793PSE&exp=4102444800

# Expired (must be rejected)
ton://transfer/UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsNQh?amount=1&exp=174000000
```

### 4) StateInit (`init`)

Adds a **StateInit** cell to the message.

**Rules**

-   `init` must be a URL‑encoded base64 StateInit.
-   Can be combined with `text`, `exp`, and `bin`.

**Examples**

```text
# With init
ton://transfer/UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsNQh?amount=1&init=te6ccgEBAgEACwACATQBAQAI_____w%3D%3D

# init + text
ton://transfer/UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsNQh?amount=1&init=te6ccgEBAgEACwACATQBAQAI_____w%3D%3D&text=test

# init + bin
ton://transfer/UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsNQh?amount=1&init=te6ccgEBAgEACwACATQBAQAI_____w%3D%3D&bin=te6cckEBAQEACQAADgAAAABiaW793PSE

# init + bin + exp
ton://transfer/UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsNQh?amount=1&init=te6ccgEBAgEACwACATQBAQAI_____w%3D%3D&bin=te6cckEBAQEACQAADgAAAABiaW793PSE&exp=1796015245
```

---

## Transfer Jetton

Opens the send-screen for a **jetton** transfer. All rules about `text`, `bin`, and `exp` from the TON section apply here too.

**Format**

```text
{PREFIX}transfer/{ADDRESS}?jetton={JETTON_ADDRESS}&amount={AMOUNT}&text={TEXT}&bin={BINARY_DATA}&exp={EXPIRY_TIMESTAMP}
```

**Parameter specifics**

-   `jetton` — **required** jetton master address.
-   `amount` — amount of **jettons in the token’s smallest units** (atomic units). May be omitted; user can fill the amount manually.
-   `text` and `bin` are mutually exclusive.
-   `exp` requires `amount` and implies `confirmation-screen`.
-   `init` is **not allowed** for Jetton transfers.

**Examples**

```text
# Jetton + amount
ton://transfer/UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsNQh?amount=1&jetton=EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs

# Jetton + amount + text
ton://transfer/UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsNQh?amount=1&jetton=EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs&text=test

# Jetton + amount + bin
ton://transfer/UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsNQh?amount=1&jetton=EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs&bin=te6cckEBAQEACQAADgAAAABiaW793PSE

# Jetton + amount + exp
ton://transfer/UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsNQh?amount=1&jetton=EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs&exp=1796015245

# Jetton + amount + bin + exp
ton://transfer/UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsNQh?amount=1&jetton=EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs&bin=te6cckEBAQEACQAADgAAAABiaW793PSE&exp=1796015245

# Jetton + DNS address
ton://transfer/example.ton?amount=1&jetton=EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs

# Invalid: Jetton + text + bin (must be rejected)
ton://transfer/UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsNQh?amount=1&jetton=EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs&text=test&bin=te6cckEBAQEACQAADgAAAABiaW793PSE

# Invalid: Jetton + exp without amount (must be rejected)
ton://transfer/UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsNQh?jetton=EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs&exp=1796015245

# Invalid: Jetton + bin without amount (must be rejected)
ton://transfer/UQAZZNjwN-h6UbWmu1P10bG-p-_N_JSjGdunix4cMFdqsNQh?jetton=EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs&bin=te6cckEBAQEACQAADgAAAABiaW793PSE
```

---

## Validation & Error Handling

Clients SHOULD validate and handle the following cases:

-   `exp` without `amount` → reject.
-   `text` + `bin` together → reject.
-   `amount` must be a non‑negative integer. `0` is allowed but may be rejected by UX policy; in most cases a **positive** value is expected.
-   `exp` must be a valid UNIX timestamp (seconds). When current time > `exp` → reject.
-   `bin` must be a valid URL‑encoded base64 BoC → otherwise reject.
-   `init` must be valid URL‑encoded base64 StateInit → otherwise reject.
-   `jetton` with any `init` → reject.
-   DNS address that cannot be resolved → reject.
-   Duplicate parameters → reject.
-   Unknown parameters → reject.

> By default, any parameter value that does not conform to its declared type or format in the Quick Reference (e.g., non‑integer `amount`/`exp`, malformed `bin`/`init`, invalid `jetton` address) MUST be treated as invalid and rejected.

> **User messaging**: Implementations may display errors like _“Invalid parameters”_ for invalid combinations.

---

<!--

## Other Deep Links

These actions keep the same `{PREFIX}` semantics.

### Buy TON

```text
{PREFIX}buy-ton
```

Opens the on‑ramp flow.

### Staking

```text
{PREFIX}staking
```

Opens the staking screen to stake/unstake TON.

### Pool

```text
{PREFIX}pool/{ADDRESS}
```

Opens a specific liquidity pool. `{ADDRESS}` — pool address.

### Exchange

```text
{PREFIX}exchange?provider={PROVIDER}&toToken={TO_TOKEN}
```

-   `provider` (required) — exchange provider ID (e.g., `mercurio`).
-   `toToken` (optional) — token to take.

### Swap

```text
{PREFIX}swap?fromToken={FROM_TOKEN}&toToken={TO_TOKEN}
```

Opens the swap interface.

### Battery

```text
{PREFIX}battery?promocode={PROMOCODE}
```

Opens the battery screen (optional `promocode`).

### Action

```text
{PREFIX}action?eventId={EVENT_ID}
```

Opens the transaction bottom sheet for `eventId`.

### DApp

```text
{PREFIX}dapp/{DAPP_URL}
```

Opens the in‑app browser with a DApp from the built‑in catalog. Only **https** is supported.

### TON Connect

See the official TON Connect universal link reference: https://github.com/ton-blockchain/ton-connect/blob/main/bridge.md#universal-link

---

-->

## Standard Reference

The `ton://` scheme is part of the broader TON standard. See https://docs.ton.org/ for details.

---

## Example Workflows

-   **Quick Payments** — payment requests from your website; users complete with one tap using any supported scheme.
-   **In‑app Transactions** — deep link from your UI into Tonkeeper’s send-screen with all fields prefilled.
-   **Cross‑Wallet Compatibility** — favor `ton://` when you want other wallets to understand your links.

---

## Compatibility Matrix (Allowed combinations)

**Legend**

-   **Screen:** `send-screen` (нет `amount`), `confirmation-screen` (есть `amount`).
-   **Fields (from link → state):** `A`=amount, `T`=text, `B`=bin, `I`=init, `E`=exp, `J`=jetton.
    Индикаторы: **✏️** — prefilled & editable, **🔒** — prefilled & locked. (Параметры, которых **нет в ссылке**, не перечисляются.)
-   **Правила (шорткоды):**
    **E→A** — `exp` требует `amount` и всегда даёт `confirmation-screen`;
    **T≠B** — `text` и `bin` взаимоисключаемы (при `B` комментарий недоступен);
    **I✖J** — `init` недопустим в Jetton‑переводах;
    **DNS†** — DNS‑имена резолвятся до показа экрана.

### TON Transfer

| Combination                         | Allowed? | Screen                | Fields (from link → state) | Notes     |
| ----------------------------------- | :------: | --------------------- | -------------------------- | --------- |
| `address-only`                      |    ✅    | `send-screen`         | —                          | —         |
| `amount`                            |    ✅    | `confirmation-screen` | A🔒                        | —         |
| `dns+amount`                        |    ✅    | `confirmation-screen` | A🔒                        | DNS†      |
| `text`                              |    ✅    | `send-screen`         | T✏️                        | —         |
| `bin`                               |    ✅    | `send-screen`         | B🔒                        | T≠B       |
| `amount+bin`                        |    ✅    | `confirmation-screen` | A🔒, B🔒                   | —         |
| `exp`                               |    ❌    | —                     | —                          | E→A       |
| `amount+text`                       |    ✅    | `confirmation-screen` | A🔒, T🔒                   | —         |
| `amount+exp`                        |    ✅    | `confirmation-screen` | A🔒, E🔒                   | —         |
| `amount+exp (expired)`              |    ❌    | —                     | —                          | expired   |
| `amount+text+exp`                   |    ✅    | `confirmation-screen` | A🔒, T🔒, E🔒              | —         |
| `amount+bin+exp`                    |    ✅    | `confirmation-screen` | A🔒, B🔒, E🔒              | —         |
| `amount+text+bin`                   |    ❌    | —                     | —                          | T≠B       |
| `text+exp`                          |    ❌    | —                     | —                          | E→A       |
| `init`                              |    ✅    | `send-screen`         | I🔒                        | —         |
| `amount+init`                       |    ✅    | `confirmation-screen` | A🔒, I🔒                   | —         |
| `amount+init+text`                  |    ✅    | `confirmation-screen` | A🔒, I🔒, T🔒              | —         |
| `amount+init+bin`                   |    ✅    | `confirmation-screen` | A🔒, I🔒, B🔒              | T≠B       |
| `amount+init+exp`                   |    ✅    | `confirmation-screen` | A🔒, I🔒, E🔒              | —         |
| `amount+init+bin+exp`               |    ✅    | `confirmation-screen` | A🔒, I🔒, B🔒, E🔒         | T≠B       |
| `init+text`                         |    ✅    | `send-screen`         | I🔒, T✏️                   | —         |
| `init+bin`                          |    ✅    | `send-screen`         | I🔒, B🔒                   | T≠B       |
| `init+exp`                          |    ❌    | —                     | —                          | E→A       |
| `ton+unknown-param`                 |    ❌    | —                     | —                          | unknown   |
| `amount (invalid format)`           |    ❌    | —                     | —                          | invalid A |
| `amount+bin (invalid bin format)`   |    ❌    | —                     | —                          | invalid B |
| `amount+exp (invalid exp format)`   |    ❌    | —                     | —                          | invalid E |
| `amount+init (invalid init format)` |    ❌    | —                     | —                          | invalid I |

---

### Jetton Transfer

| Combination                   | Allowed? | Screen                | Fields (from link → state) | Notes     |
| ----------------------------- | :------: | --------------------- | -------------------------- | --------- |
| `jetton`                      |    ✅    | `send-screen`         | J🔒                        | —         |
| `jetton+amount`               |    ✅    | `confirmation-screen` | J🔒, A🔒                   | —         |
| `jetton+text`                 |    ✅    | `send-screen`         | J🔒, T✏️                   | —         |
| `jetton+bin`                  |    ✅    | `send-screen`         | J🔒, B🔒                   | T≠B       |
| `jetton+exp`                  |    ❌    | —                     | —                          | E→A       |
| `jetton+dns`                  |    ✅    | `send-screen`         | J🔒                        | DNS†      |
| `jetton+dns+amount`           |    ✅    | `confirmation-screen` | J🔒, A🔒                   | DNS†      |
| `jetton+init`                 |    ❌    | —                     | —                          | I✖J       |
| `jetton+amount+text`          |    ✅    | `confirmation-screen` | J🔒, A🔒, T🔒              | —         |
| `jetton+amount+bin`           |    ✅    | `confirmation-screen` | J🔒, A🔒, B🔒              | —         |
| `jetton+amount+exp`           |    ✅    | `confirmation-screen` | J🔒, A🔒, E🔒              | —         |
| `jetton+amount+exp (expired)` |    ❌    | —                     | —                          | expired   |
| `jetton+amount+bin+exp`       |    ✅    | `confirmation-screen` | J🔒, A🔒, B🔒, E🔒         | —         |
| `jetton+amount+text+bin`      |    ❌    | —                     | —                          | T≠B       |
| `jetton+amount+init`          |    ❌    | —                     | —                          | I✖J       |
| `jetton+unknown-param`        |    ❌    | —                     | —                          | unknown   |
| `jetton (invalid address)`    |    ❌    | —                     | —                          | invalid J |

> **Note on Jetton `amount`**
> The `amount` for jettons represents the **token balance units** (atomic units). For display Tonkeeper converts using the token’s decimals.
