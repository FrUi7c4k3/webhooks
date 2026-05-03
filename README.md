# Webhook Receiver and Sender

A simple webhook sender/receiver project built in TypeScript with Express.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Build the project:
   ```bash
   npm run build
   ```

## Run Locally

This repository contains two separate apps:

- Receiver: listens for incoming webhook POSTs on `/webhook`
- Sender: manages subscriptions and dispatches events to callback URLs

### Start receiver

Open a terminal and run:
```bash
npm run dev:receiver
```

The receiver will listen on `http://localhost:3000`.

### Start sender

Open another terminal and run:
```bash
npm run dev:sender
```

The sender will listen on `http://localhost:3001`.

## Manual Test Scenario

1. Start the receiver and sender in separate terminals.
2. Create a subscription using the sender:
   ```bash
   curl -X POST http://localhost:3001/subscriptions \
     -H "Content-Type: application/json" \
     -d '{"callbackUrl":"http://localhost:3000/webhook","events":["item.created"],"secret":"your-shared-secret-key"}'
   ```
3. Trigger an event from the sender:
   ```bash
   curl -X POST http://localhost:3001/events \
     -H "Content-Type: application/json" \
     -d '{"event":"item.created","data":{"itemId":"abc-123"}}'
   ```
4. Verify the receiver logged the webhook and returned `status: received`.

### Expected result

- Sender responds with a payload delivery result.
- Receiver receives the webhook at `/webhook`.
- The receiver returns:
  ```json
  { "status": "received" }
  ```

## Running Tests

Run the full test suite:
```bash
npm test
```

Or run Jest directly:
```bash
npx jest --runInBand
```

## Notes

- Receiver port: `3000`
- Sender port: `3001`
- Use separate terminals for sender and receiver when testing locally.
