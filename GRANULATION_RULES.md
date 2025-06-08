# Granulation and Code Structure Guidelines

This document outlines the rules and guidelines for code granulation and file structure within this project. These practices aim to improve maintainability, readability, and collaboration.

## Dynamic Loading of Game Entities

### Echos

*   **Directory Structure**: All individual Echo definitions are located in `src/domain/echos/`.
*   **File Naming**: Each Echo is defined in its own TypeScript file, named `[echo_id].ts` (e.g., `eco_vision_aurea_1.ts`). The `echo_id` should match the `id` property of the Echo object.
*   **Definition**: Each file should export the Echo object as its default export.
    ```typescript
    // Example: src/domain/echos/eco_example.ts
    import { Echo, EchoEffectType, Rarity } from '../../types'; // Adjust path as necessary
    // Import any other necessary constants

    const eco_example: Echo = {
      id: 'eco_example',
      baseId: 'base_eco_example',
      name: 'Example Echo',
      level: 1,
      // ... other properties
      rarity: Rarity.Common,
    };

    export default eco_example;
    ```
*   **Dynamic Loading**: Echos are dynamically loaded into the game via `constants.ts` using Vite's `import.meta.glob('../domain/echos/*.ts', { eager: true })`. This means to add a new Echo, you simply need to create its definition file in the correct directory. The system will automatically pick it up.

### Furies

*   **Directory Structure**: All individual Fury definitions are located in `src/domain/furies/`.
*   **File Naming**: Each Fury is defined in its own TypeScript file, named `[fury_id].ts` (e.g., `fury_toque_vacio_initial.ts`). The `fury_id` should match the `id` property of the Fury object.
*   **Definition**: Each file should export the Fury object as its default export.
    ```typescript
    // Example: src/domain/furies/fury_example.ts
    import { FuryAbility, FuryAbilityEffectType, Rarity } from '../../types'; // Adjust path as necessary

    const fury_example: FuryAbility = {
      id: 'fury_example',
      name: 'Example Fury',
      // ... other properties
      rarity: Rarity.Common,
    };

    export default fury_example;
    ```
*   **Dynamic Loading**: Similar to Echos, Furies are dynamically loaded via `constants.ts` using `import.meta.glob('../domain/furies/*.ts', { eager: true })`. Adding a new Fury involves creating its definition file in the specified directory.

## Hook and Component Granulation

The recent refactoring of `hooks/useGameEngine.ts` into multiple smaller, specialized hooks (e.g., `usePlayerState.ts`, `useBoardState.ts`, `useGamePhaseManager.ts`, etc.) serves as an example of the desired level of granulation.

### Principles

1.  **Single Responsibility Principle (SRP)**: Each hook, component, or module should have responsibility over a single part of the application's functionality.
    *   Hooks should manage a specific piece of state and the logic directly related to it.
    *   Components should focus on UI presentation and user interaction, delegating complex logic to hooks or services.

2.  **Maintainability & Readability**: Smaller files with clear responsibilities are easier to understand, debug, and maintain.

3.  **Testability**: Smaller, focused units of code are generally easier to test in isolation.

4.  **Collaboration**: Clear separation of concerns makes it easier for multiple developers to work on different parts of the codebase concurrently with fewer conflicts.

### Guidelines

*   **Hook Size**: Aim for hooks to be relatively small and focused. As a soft guideline, consider refactoring hooks that grow beyond **300-400 lines of code**. This is not a strict rule but an indicator that the hook might be taking on too many responsibilities.
*   **Component Size**: Similarly, components should remain focused. If a component becomes too large or handles too much state, consider breaking it into smaller sub-components and delegating state management to hooks.
*   **File Length (General)**: For most files (hooks, components, services), a general soft limit of around **500 lines** is recommended. Files exceeding this should be reviewed for potential granulation.
*   **Avoid "God" Objects/Hooks**: Be wary of hooks or objects that try to manage too many disparate parts of the application state or logic (as `useGameEngine.ts` was previously).

### Benefits of Granulation

*   **Improved Code Comprehension**: Easier to understand what a piece of code does.
*   **Reduced Cognitive Load**: Developers can focus on a smaller context at a time.
*   **Easier Refactoring**: Changes are often localized to smaller modules.
*   **Enhanced Reusability**: Smaller, focused hooks and components are more likely to be reusable in other parts of the application.

By adhering to these guidelines, we can maintain a healthier, more scalable, and more manageable codebase.
