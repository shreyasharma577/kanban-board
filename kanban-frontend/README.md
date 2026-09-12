# Flowboard — Kanban Frontend

A polished React frontend for a collaborative Kanban board.

## Stack

- React + Vite
- @dnd-kit for drag-and-drop
- Lucide React for icons
- CSS with responsive layouts and interactive states

## Run locally

```bash
npm install
npm run dev
```

Open the Vite URL shown in the terminal.

## Current frontend behavior

The UI currently uses local React state so it works immediately without a backend:
- Four Kanban columns
- Search/filtering
- Add task
- Edit task modal
- Drag tasks across columns
- Reorder tasks inside a column
- Optimistic-feeling local interactions
- Responsive sidebar/mobile layout

## Planned MERN integration

The backend will replace the local `initialTasks` state with API data:

Workspace → Boards → Tasks

Task movement will persist:
- `status`: target column
- `position`: ordering within that column

REST APIs and Socket.io can then be connected without changing the overall UI architecture.
