# AI Dungeon Crawler

A roguelike dungeon crawler game with AI-powered enemies and dynamic storytelling.

## Features

- AI-powered enemies with unique behaviors
- Dynamic storytelling that adapts to player choices
- Roguelike gameplay with procedurally generated levels
- Character progression and customization
- Engaging turn-based combat

## Tech Stack

- React
- TypeScript
- Vite
- Node.js
- Gemini API

## Project Structure

- `components/`: Contains reusable UI components.
- `constants/`: Holds constant values used throughout the application.
- `core/`: Includes the core game logic and AI functionalities.
- `hooks/`: Custom React hooks.
- `screens/`: Represents different screens or views of the application.
- `services/`: Contains services for various functionalities like API calls or data processing.
- `utils/`: Utility functions.

## Contributing

Contributions are welcome! Please follow these steps:
1. Fork the repository.
2. Create a new branch (`git checkout -b feature/your-feature-name`).
3. Make your changes.
4. Commit your changes (`git commit -m 'Add some feature'`).
5. Push to the branch (`git push origin feature/your-feature-name`).
6. Open a pull request.

## License

This project is licensed under the [Your License] - see the LICENSE.md file for details.

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
