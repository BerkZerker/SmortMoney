# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands
- **Frontend (SmortMoneyApp)**
  - Run: `npm start` (in SmortMoneyApp directory)
  - Test: `npm test` or `npm test -- -t "TestName"` for single test
  - Reset: `npm run reset-project`

- **Backend (SmortMoneyBackend)**
  - Dev: `npm run dev` (in SmortMoneyBackend directory)
  - Build: `npm run build`

## Code Style
- **TypeScript**: Use strict typing with explicit type annotations
- **Components**: Functional components with typed props interfaces
- **Naming**: PascalCase for components/interfaces, camelCase for functions/variables
- **Imports**: Group by external/internal, use absolute imports when possible
- **Styling**: Use StyleSheet.create() for React Native styles
- **Error handling**: Always use try/catch in async functions, provide descriptive error messages

## Architecture
- Frontend: React Native with Expo
- Backend: Express.js with Prisma ORM
- Follow existing patterns for API services, routes, and controllers
- Maintain theme consistency with ThemedText/ThemedView components