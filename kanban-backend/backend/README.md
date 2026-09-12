# Kanban Backend

Express + MongoDB backend for the collaborative Kanban board.

## Architecture

```text
Workspace
   └── Boards
         └── Tasks
```

MongoDB stores references using:

- `Board.workspaceId`
- `Task.boardId`

Task ordering uses:

- `status` = column
- `position` = order inside the column

## API

### Health

`GET /api/health`

### Workspaces

- `POST /api/workspaces`
- `GET /api/workspaces`
- `GET /api/workspaces/:id`
- `PUT /api/workspaces/:id`
- `DELETE /api/workspaces/:id`

### Boards

- `POST /api/boards/workspace/:workspaceId`
- `GET /api/boards/workspace/:workspaceId`
- `GET /api/boards/:id`
- `PUT /api/boards/:id`
- `DELETE /api/boards/:id`

### Tasks

- `POST /api/tasks/board/:boardId`
- `GET /api/tasks/board/:boardId`
- `GET /api/tasks/:id`
- `PUT /api/tasks/:id`
- `PATCH /api/tasks/:id/move`
- `DELETE /api/tasks/:id`

## Setup

Create `.env` from `.env.example`:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
CLIENT_URL=http://localhost:5173
```

Install:

```bash
npm install
```

Run development server:

```bash
npm run dev
```

Run production server:

```bash
npm start
```

## Example creation flow

1. Create workspace.
2. Create board using the workspace ID.
3. Create tasks using the board ID.
4. Move/reorder tasks using `PATCH /api/tasks/:id/move`.

The frontend can optimistically update React state first, then persist the move through the move endpoint.
