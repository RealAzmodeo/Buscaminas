# Code Granulation and Modularity Rules

This document outlines the rules and principles applied to enhance code modularity within this project, specifically concerning the refactoring of `hooks/useGameEngine.ts` and the data definitions for Echos and Furies. These guidelines are intended for both human developers and AI-assisted development to maintain a clean, navigable, and maintainable codebase.

## Guiding Principles

*   **Single Responsibility Principle (SRP)**: Hooks and modules should ideally have one primary responsibility or manage a single domain of the application.
*   **Readability and Navigability**: Code should be easy to read, understand, and locate. Smaller, focused files contribute to this.
*   **Maintainability**: Changes to one aspect of the game logic should ideally be isolated to a single hook or a small group of related hooks/modules.
*   **Testability**: Smaller, more focused units of code are generally easier to test.
*   **Developer Experience**: A well-organized codebase makes development more efficient and enjoyable.

## Rules for `useGameEngine.ts` Granulation

The `hooks/useGameEngine.ts` file was identified as overly large and complex, handling too many aspects of the game logic. It has been refactored into an **orchestrator hook** that initializes and coordinates multiple specialized hooks.

### 1. Identifying Specialized Hooks

Logic within `useGameEngine.ts` was granulated into specialized hooks based on distinct areas of concern or game domains. Examples include:

*   `useGameState.ts`: Manages core game state (status, phase, level, etc.), including new phases like `PRE_DEFEAT_SEQUENCE`.
*   `usePlayerState.ts`: Manages player-specific state (HP, gold, shield, active effects).
*   `useEnemyState.ts`: Manages enemy-specific state.
*   `useBoard.ts`: Manages board state, generation, and related logic (e.g., battlefield reduction).
*   `useEchos.ts`: Manages Echo acquisition, state, choices, and activation logic.
*   `useFuries.ts`: Manages Fury selection (Oracle), application, and state.
*   `usePlayerActions.ts`: Handles direct player interactions with the board (cell selection, marking).
*   `useEnemyAI.ts`: Manages enemy decision-making and action execution.
*   `useGameLoop.ts`: Controls the main game turn phases and transitions, incorporating new phase logic from the `main` branch.
*   `useMetaProgress.ts`: Manages meta-progression data (soul fragments, mirror upgrades, goals).
*   `useRunStats.ts`: Tracks statistics for the current run.
*   `usePrologue.ts`: Manages the prologue/tutorial sequence, using `PROLOGUE_MESSAGES` as defined in the `main` branch's `constants.ts` (or moved if appropriate).
*   `useGameEvents.ts`: Handles the game event queue (e.g., for floating text).

### 2. Hook Responsibilities and Dependencies

*   Each specialized hook encapsulates its own state, effects, and functions related to its specific domain, sourcing its initial logic from the `main` branch version of `useGameEngine.ts`.
*   Dependencies between hooks are managed by `useGameEngine.ts`, which passes necessary state or functions from one hook to another during initialization.
*   Aim for hooks to expose a clear API (returned state and functions) for the orchestrator or other hooks to consume.

### 3. File Length and Complexity

*   While there isn't a strict line count, a hook or utility file that grows beyond **200-300 lines** (excluding imports and comments) or manages more than 2-3 distinct sub-domains should be considered for further granulation.
*   High cyclomatic complexity within functions is also an indicator for refactoring.

### 4. Naming Conventions

*   Hook files are named using camelCase with a `use` prefix (e.g., `usePlayerState.ts`).
*   Exported hook functions match the filename (e.g., `export const usePlayerState = ...`).

### 5. Utility Functions

*   Generic, reusable utility functions that are not tied to a specific hook's state (like `randomInt`, `getCurrentFloorNumber` from `main`'s `useGameEngine.ts`) are placed in `utils/gameLogicUtils.ts` or other domain-specific utility files under `utils/`.

## Rules for Echo and Fury Granulation

Echo and Fury definitions were previously stored in large arrays/maps within `constants.ts` (as per the `main` branch structure). They have been granulated for better organization and easier modification.

### 1. Individual Definition Files

*   Each Echo object (from `main`'s `constants.ts`) is defined in its own TypeScript file within the `core/echos/` directory.
*   Each FuryAbility object (from `main`'s `constants.ts`) is defined in its own TypeScript file within the `core/furies/` directory.

### 2. File Naming

*   Filenames are derived from the Echo/Fury `id`, typically in kebab-case or snake_case (e.g., `eco-cascada-1.ts` or `fury_espadas_oxidadas.ts`).
*   The exported variable within the file is typically a camelCase version of the ID (e.g., `ecoCascada1`).

### 3. `index.ts` Aggregator

*   An `index.ts` file within `core/echos/` imports all individual Echo definitions and exports aggregated collections (e.g., `ALL_ECHOS_MAP`, `ALL_ECHOS_LIST`, `INITIAL_STARTING_ECHOS`), mirroring the collections needed by `main`.
*   Similarly, an `index.ts` file within `core/furies/` imports all individual Fury definitions and exports aggregated collections (e.g., `ALL_FURY_ABILITIES_MAP`, `INITIAL_STARTING_FURIESS`), mirroring `main`'s needs.
*   This `index.ts` file becomes the single source of truth for these collections for the rest of the application.

### 4. Updating Definitions

*   **To add a new Echo/Fury**: Create a new file in the respective directory and add its definition. Then, import it into the `index.ts` file and include it in the relevant exported collections.
*   **To modify an Echo/Fury**: Edit its individual file.
*   **To remove an Echo/Fury**: Delete its individual file and remove its import and usage from the `index.ts` file.

### 5. String ID Constants

*   Base string identifiers for Echos (e.g., `BASE_ECHO_ECO_CASCADA` from `main`'s `constants.ts`) are kept in the main `constants.ts` file and imported by individual Echo files if needed for their `baseId` property.
*   `FURY_ABILITIES_TO_AWAKEN_SEQUENTIALLY` is now managed in `core/furies/index.ts`.

## Maintaining Modularity

*   When adding new features or modifying existing ones, consider these granulation rules.
*   If a hook or module starts to violate the SRP or becomes too large/complex, plan for its refactoring.
*   For new data collections similar to Echos/Furies, consider the individual file + `index.ts` aggregator pattern.
