# mock-server

This directory contains a PollyJS and Fastify-based mock server used for testing and development purposes.

## Usage

To start the server, run the `start_server.sh` script with the client you wish to mock. For example, for algod: `bash scripts/start_server.sh algod`.

## Behavior

The mock server will replay pre-recorded HAR files. If a request is made to an endpoint that is not recorded, it will responsd with a 500 error.

## Adding New Recordings

To add new recordings, add requests in [src/record.ts](src/record.ts). Rerunning the server will record these new requests before starting the mock server.

## Debugging

To debug in VS Code/Cursor, install the [Bun extension](https://marketplace.visualstudio.com/items?itemName=oven.bun-vscode) (`oven.bun-vscode`), then press F5 to start the debugger.
