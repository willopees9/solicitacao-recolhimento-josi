# NFD Only Design

## Goal

Remove Nota Fiscal from the MVP request flow and use NFD as the only fiscal
identifier available to the Promotor at creation time.

## Decisions

- The project remains without automatic drafts.
- The visible form must ask for NFD only.
- Active duplicate detection must use only NFD.
- A previous rejected request does not block a new request with the same NFD.
- Existing databases must be migrated forward with a new migration, not rebuilt.
- The old `nota_fiscal` column may remain as an internal compatibility field.

## Data Flow

The Promotor fills store, seller, NFD, request type, observations, and items.
The API validates this payload without `notaFiscal`, calls the request creation
RPC, and the database stores an internal fallback value for `nota_fiscal` while
enforcing uniqueness on active NFD values.

## Scope

- Update UI labels and request detail views.
- Update Zod validation and API payloads.
- Update duplicate-check endpoint and client call.
- Add migration `0009_nfd_only.sql`.
- Update README status notes.

## Verification

Run `npm run typecheck`, `npm run lint`, and `npm run build`.
