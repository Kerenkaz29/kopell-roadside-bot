# Build Tasks - Kopell Roadside Bot

- [x] 1. Project scaffold (package.json, .gitignore, README, git init, GitHub remote)
- [x] 2. Install dependencies (`npm install`)
- [x] 3. Env config (`.env.example`, dotenv loading, config module)
- [x] 4. MongoDB connection (local) + Mongoose models: Conversation, Request, Technician
- [x] 5. Seed script: mock technicians with geo locations
- [x] 6. Express server skeleton + webhook verification endpoint (GET, hub.verify_token)
- [x] 7. Webhook POST handler: receive + parse incoming WhatsApp messages
- [ ] 8. WhatsApp client wrapper: send text message, send location request (Graph API)
- [x] 9. Conversation state machine: issue type -> location -> vehicle/policy -> confirm
- [x] 10. Dispatch service: find nearest available technician ($near), assign, compute ETA
- [ ] 11. Status simulator: auto-progress ASSIGNED -> ON_THE_WAY -> ARRIVED -> COMPLETED, push WhatsApp updates
- [ ] 12. Local run + ngrok tunnel + configure webhook URL in Meta dashboard
- [ ] 13. End-to-end test: real WhatsApp message through full flow
- [ ] 14. (stretch) Admin endpoint `/admin/requests` to view live requests

Each task gets implemented, then verified (server runs / request succeeds / message arrives) before moving to the next.
