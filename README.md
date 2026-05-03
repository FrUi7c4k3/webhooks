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

## 🧪 Manual Testing

Manual test scenarios are defined in the REST Client file:

- [end-to-end.test.http](./test/manual-testing/end-to-end.test.http)

Use the VS Code REST Client extension to execute the requests.

The file includes:
- Subscription creation
- Event triggering
- Expected results and behaviour

---

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
